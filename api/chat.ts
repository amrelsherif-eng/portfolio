import { systemInstruction } from "./knowledge.js"; // .js: Vercel runs these as native ES modules, which need the extension
import { callGemini } from "./_gemini.js";
import { rateLimit } from "./_ratelimit.js";
import { makeDeadline } from "./_budget.js";

type ChatMessage = { role: "user" | "model"; text: string };
type ChatRequest = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined>; ip?: string; socket?: { remoteAddress?: string } };
type ChatResponse = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
  status?: (code: number) => ChatResponse;
  json?: (body: unknown) => void;
};

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
  const deadline = makeDeadline(20_000);
  if (req.method !== "POST") return respond(res, 405, { reply: "Please send a chat message using POST." });
  const contentLength = req.headers?.["content-length"];
  const contentLengthValue = Array.isArray(contentLength) ? contentLength[0] : contentLength;
  if (contentLengthValue && Number(contentLengthValue) > 16384) return respond(res, 413, { reply: "Please send a shorter chat message." });
  const hasGeminiKey = [runtime.process?.env.GEMINI_API_KEY, runtime.process?.env.GEMINI_API_KEY_2, runtime.process?.env.GEMINI_API_KEY_3].some((key) => key?.trim());
  if (!hasGeminiKey) return respond(res, 503, { reply: "Ping is offline right now — email amrelsherif.eng@gmail.com." });

  if (await rateLimit(req, "chat", 20, 600)) {
    return respond(res, 429, { reply: "You've sent a lot of messages. Please try again in a few minutes." });
  }

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
    const result = await callGemini(contents.map(({ role, text }) => ({ role, parts: [{ text }] })), systemInstruction, { temperature: 0.4, maxOutputTokens: 4096 }, deadline);
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
