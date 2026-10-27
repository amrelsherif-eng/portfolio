// Env: GROQ_API_KEY (primary, free at console.groq.com), GEMINI_API_KEY (fallback)
import { knowledge } from "./knowledge.js";
import { callGemini, isRateLimited } from "./_gemini.js";
import { callGroqJson } from "./_groq.js";

const env = (globalThis as typeof globalThis & { process?: { env: Record<string, string | undefined> } }).process?.env;

type Request = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined>; ip?: string; socket?: { remoteAddress?: string } };
type Response = { statusCode: number; setHeader: (name: string, value: string) => void; end: (body?: string) => void; status?: (code: number) => Response; json?: (body: unknown) => void };
type Action = "goto" | "scroll" | "resume" | "chat" | "answer" | "none";
type VoiceReply = { action: Action; target?: "top" | "about" | "work" | "techstack" | "certifications" | "contact"; direction?: "up" | "down"; reply: string; transcript?: string };
type TranscriptionResponse = { ok: boolean; json: () => Promise<unknown> };
const web = globalThis as unknown as { atob: (value: string) => string; FormData: new () => { append(name: string, value: unknown, filename?: string): void }; Blob: new (parts: Uint8Array[], options: { type: string }) => unknown; fetch: (url: string, init: { method: string; headers: Record<string, string>; body: unknown; signal: unknown }) => Promise<TranscriptionResponse>; AbortController: new () => { signal: unknown; abort(): void }; setTimeout: (fn: () => void, ms: number) => unknown; clearTimeout: (id: unknown) => void };
const schema = {
  type: "OBJECT",
  properties: {
    action: { type: "STRING", enum: ["goto", "scroll", "resume", "chat", "answer", "none"] },
    target: { type: "STRING", enum: ["top", "about", "work", "techstack", "certifications", "contact"] },
    direction: { type: "STRING", enum: ["up", "down"] },
    reply: { type: "STRING" },
  },
  required: ["action", "reply"],
  propertyOrdering: ["action", "target", "direction", "reply"],
};
const catalogue = `Allowed actions: goto (requires target top/about/work/techstack/certifications/contact); scroll (requires direction up/down); resume; chat; answer; none. Use goto for section requests, scroll for scrolling, resume for CV/resume, chat to open Ping, answer for a factual question about Amr supported by the knowledge, and none for unrelated or unclear speech. Visitors speak casually in English or Egyptian Arabic. Examples: “show me his AWS stuff” => goto certifications; “وريني مشاريعه” => goto work; “what is he studying” / “هو بيدرس ايه” => answer with a brief fact from knowledge; “kalam fadi” => none. Return exactly one short reply sentence (at most 25 words) in the requested language (lang), plain text; use only knowledge facts, never invent. Navigation replies are short confirmations.`;
const fallback = (lang: string) => lang === "ar" ? "معلش، ماقدرتش أفهم طلبك. جرّب تاني." : "Sorry, I couldn't understand that. Please try again.";
const answerRule = `For action "answer", reply ONLY with facts explicitly present in the knowledge. If the exact thing asked about (including a tool such as Kubernetes) is not explicitly listed, say plainly that it is not listed on Amr's portfolio and suggest asking him by email. Never imply future plans or skills that are not written there, and do not infer adjacent experience.`;
function respond(res: Response, code: number, body: VoiceReply) {
  res.setHeader("Cache-Control", "no-store");
  if (res.status && res.json) { res.status(code); return res.json(body); }
  res.statusCode = code; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(body));
}
function parseModel(value: unknown, lang: "en" | "ar"): VoiceReply | null {
  if (!value || typeof value !== "object") return null;
  const candidates = (value as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates;
  const raw = candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("");
  if (!raw) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return null; }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const item = parsed as Record<string, unknown>;
  const actions: Action[] = ["goto", "scroll", "resume", "chat", "answer", "none"];
  const targets = ["top", "about", "work", "techstack", "certifications", "contact"];
  if (!actions.includes(item.action as Action) || typeof item.reply !== "string" || !item.reply.trim() || item.reply.trim().split(/\s+/).length > 25) return null;
  if (Object.keys(item).some((key) => !["action", "target", "direction", "reply"].includes(key))) return null;
  if (item.action === "goto" && !targets.includes(item.target as string)) return null;
  if (item.action !== "goto" && item.target !== undefined) return null;
  if (item.action === "scroll" && item.direction !== "up" && item.direction !== "down") return null;
  if (item.action !== "scroll" && item.direction !== undefined) return null;
  const reply = item.reply.trim();
  if (lang === "ar" ? !/[\u0600-\u06FF]/.test(reply) : /[\u0600-\u06FF]/.test(reply)) return null;
  return { action: item.action as Action, ...(item.target ? { target: item.target as VoiceReply["target"] } : {}), ...(item.direction ? { direction: item.direction as VoiceReply["direction"] } : {}), reply };
}
function parseGroqModel(value: unknown, lang: "en" | "ar"): VoiceReply | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  return parseModel({ candidates: [{ content: { parts: [{ text: JSON.stringify(item) }] } }] }, lang);
}

export default async function handler(req: Request, res: Response) {
  const langFallback = (req.body as { lang?: unknown } | undefined)?.lang === "ar" ? "ar" : "en";
  if (req.method !== "POST") return respond(res, 405, { action: "none", reply: fallback(langFallback) });
  let payload: unknown = req.body;
  if (typeof payload === "string") { try { payload = JSON.parse(payload); } catch { return respond(res, 400, { action: "none", reply: fallback(langFallback) }); } }
  if (!payload || typeof payload !== "object") return respond(res, 400, { action: "none", reply: fallback(langFallback) });
  const { text, audio, mime, lang } = payload as { text?: unknown; audio?: unknown; mime?: unknown; lang?: unknown };
  if (isRateLimited(req, audio !== undefined ? 2 : 1)) return respond(res, 429, { action: "none", reply: fallback(langFallback), transcript: "" });
  if (lang !== "en" && lang !== "ar") return respond(res, 400, { action: "none", reply: fallback(langFallback), transcript: "" });
  let transcript = typeof text === "string" ? text.trim() : "";
  if (audio !== undefined) {
    if (typeof audio !== "string" || typeof mime !== "string" || !/^audio\/[\w.+-]+(?:;[\w=.+-]+)*$/i.test(mime)) return respond(res, 400, { action: "none", reply: fallback(lang), transcript: "" });
    let bytes: Uint8Array;
    try { const binary = web.atob(audio); bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0)); } catch { return respond(res, 400, { action: "none", reply: fallback(lang), transcript: "" }); }
    if (!bytes.length || bytes.length > 1.5 * 1024 * 1024) return respond(res, 413, { action: "none", reply: fallback(lang), transcript: "" });
    if (!env?.GROQ_API_KEY) return respond(res, 200, { action: "none", reply: fallback(lang), transcript: "" });
    const controller = new web.AbortController(); const timer = web.setTimeout(() => controller.abort(), 10000);
    try {
      const form = new web.FormData();
      form.append("file", new web.Blob([bytes], { type: mime }), mime.includes("webm") ? "speech.webm" : `speech.${mime.split("/")[1]?.split(";")[0] || "bin"}`);
      form.append("model", "whisper-large-v3-turbo"); form.append("language", lang); form.append("response_format", "json"); form.append("temperature", "0");
      const response = await web.fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` }, body: form, signal: controller.signal });
      if (response.ok) { const result = await response.json() as { text?: unknown }; transcript = typeof result.text === "string" ? result.text.trim() : ""; }
    } catch { /* fall through to empty transcript */ } finally { web.clearTimeout(timer); }
    if (!transcript) return respond(res, 200, { action: "none", reply: lang === "ar" ? "مسمعتش، جرّب تاني" : "I didn't catch that", transcript: "" });
  }
  if (!transcript || transcript.length > 300) return respond(res, 400, { action: "none", reply: fallback(lang), transcript });
  if (!env?.GROQ_API_KEY && ![env?.GEMINI_API_KEY, env?.GEMINI_API_KEY_2, env?.GEMINI_API_KEY_3].some((key) => key?.trim())) return respond(res, 200, { action: "none", reply: fallback(lang), transcript });
  const instruction = `Reply ONLY with a JSON object with keys action, target, direction, reply. Allowed action values: goto, scroll, resume, chat, answer, none. Allowed target values: top, about, work, techstack, certifications, contact. Allowed direction values: up, down. ${catalogue}\n${answerRule}\n\nThe requested reply language is ${lang === "ar" ? "Egyptian Arabic" : "English"}.\n\nKNOWLEDGE:\n${knowledge}`;
  if (env?.GROQ_API_KEY) {
    const groq = await callGroqJson(instruction, transcript, { temperature: 0.2, max_tokens: 300 });
    const validatedGroq = parseGroqModel(groq, lang);
    if (validatedGroq) return respond(res, 200, { ...validatedGroq, transcript });
  }
  const result = await callGemini([{ role: "user", parts: [{ text: transcript }] }], instruction, { temperature: 0.2, maxOutputTokens: 1024, responseMimeType: "application/json", responseSchema: schema });
  if (!result.ok) return respond(res, result.status, { action: "none", reply: fallback(lang), transcript });
  const validated = parseModel(result.json, lang);
  return validated ? respond(res, 200, { ...validated, transcript }) : respond(res, 200, { action: "none", reply: fallback(lang), transcript });
}
