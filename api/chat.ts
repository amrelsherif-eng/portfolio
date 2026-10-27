import { systemInstruction } from "./knowledge.js"; // .js: Vercel runs these as native ES modules, which need the extension
import { callGemini } from "./_gemini.js";

type ChatMessage = { role: "user" | "model"; text: string };
type ChatRequest = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined>; ip?: string; socket?: { remoteAddress?: string } };
type ChatResponse = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
  status?: (code: number) => ChatResponse;
  json?: (body: unknown) => void;
};

const requestLog = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 20;
const runtime = globalThis as typeof globalThis & {
  process?: { env: Record<string, string | undefined> };
};

function respond(res: ChatResponse, statusCode: number, body: { reply: string }) {
  res.setHeader("Cache-Control", "no-store");
  const json = res.json;
  if (res.status && json) { res.status(statusCode); return json(body); }
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export default async function handler(req: ChatRequest, res: ChatResponse) {
  if (req.method !== "POST") return respond(res, 405, { reply: "Please send a chat message using POST." });
  const contentLength = req.headers?.["content-length"];
  const contentLengthValue = Array.isArray(contentLength) ? contentLength[0] : contentLength;
  if (contentLengthValue && Number(contentLengthValue) > 16384) return respond(res, 413, { reply: "Please send a shorter chat message." });
  const hasGeminiKey = [runtime.process?.env.GEMINI_API_KEY, runtime.process?.env.GEMINI_API_KEY_2, runtime.process?.env.GEMINI_API_KEY_3].some((key) => key?.trim());
  if (!hasGeminiKey) return respond(res, 503, { reply: "Ping is offline right now — email amrelsherif.eng@gmail.com." });

  // Prefer x-real-ip: Vercel's proxy sets it itself, so visitors can't spoof it to dodge the rate limit.
  const first = (h: string | string[] | undefined) => (Array.isArray(h) ? h[0] : h)?.split(",")[0].trim();
  const ip = first(req.headers?.["x-real-ip"]) || first(req.headers?.["x-forwarded-for"]) || req.ip || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  // keep memory bounded: drop visitors with no requests in the current window
  if (requestLog.size > 2000) {
    for (const [key, times] of requestLog) if (!times.some((time) => now - time < WINDOW_MS)) requestLog.delete(key);
  }
  if (requestLog.size > 5000) {
    for (const key of requestLog.keys()) {
      requestLog.delete(key);
      if (requestLog.size <= 4000) break;
    }
  }
  const recent = (requestLog.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    requestLog.set(ip, recent);
    return respond(res, 429, { reply: "You've sent a lot of messages. Please try again in a few minutes." });
  }
  recent.push(now);
  requestLog.set(ip, recent);

  let payload: unknown = req.body;
  if (typeof payload === "string") {
    try { payload = JSON.parse(payload); } catch { return respond(res, 400, { reply: "I couldn't read that message. Please try again." }); }
  }
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { messages?: unknown }).messages) || (payload as { messages: unknown[] }).messages.length > 12) {
    return respond(res, 400, { reply: "Please send a valid chat message." });
  }
  const messages = ((payload as { messages: unknown[] }).messages).slice(-12);
  const contents: ChatMessage[] = [];
  for (const item of messages) {
    if (!item || typeof item !== "object") return respond(res, 400, { reply: "Please send a valid chat message." });
    const { role, text } = item as { role?: unknown; text?: unknown };
    if ((role !== "user" && role !== "model") || typeof text !== "string" || text.length > 800 || !text.trim()) {
      return respond(res, 400, { reply: "Each message must be 800 characters or fewer." });
    }
    contents.push({ role, text: text.trim() });
  }
  if (!contents.length || contents[contents.length - 1].role !== "user") {
    return respond(res, 400, { reply: "Please send a valid chat message." });
  }

  try {
    const result = await callGemini(contents.map(({ role, text }) => ({ role, parts: [{ text }] })), systemInstruction, { temperature: 0.4, maxOutputTokens: 4096 });
    if (!result.ok) {
      if (result.status === 502) return respond(res, 502, { reply: "Ping couldn't answer just now. Please try again shortly." });
      return respond(res, 503, { reply: "Ping is very busy right now. Please try again in a minute, or email amrelsherif.eng@gmail.com." });
    }
    const resultJson = result.json as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      // the chat shows plain text, so drop any markdown bold/bullets the model still adds
      const reply = resultJson.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("")
        .replace(/\*\*(.+?)\*\*/g, "$1").replace(/^\s*[*-]\s+/gm, "• ").trim();
      return respond(res, 200, { reply: reply || "I don't have an answer for that right now. You can email Amr at amrelsherif.eng@gmail.com." });
  } catch {
    return respond(res, 502, { reply: "Ping couldn't connect just now. Please try again shortly." });
  }
}
