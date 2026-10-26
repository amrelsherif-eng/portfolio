import { systemInstruction } from "./knowledge";

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
type GeminiResponse = { ok: boolean; status?: number; json: () => Promise<unknown> };
const runtime = globalThis as typeof globalThis & {
  process?: { env: Record<string, string | undefined> };
  fetch: (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<GeminiResponse>;
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
  const key = runtime.process?.env.GEMINI_API_KEY;
  if (!key) return respond(res, 503, { reply: "Sherif is offline right now — email amrelsherif.eng@gmail.com." });

  // On Vercel the socket address is the proxy; the visitor's IP is the first x-forwarded-for entry.
  const fwd = req.headers?.["x-forwarded-for"];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0].trim() || req.ip || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
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
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { messages?: unknown }).messages)) {
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

  // Try the configured model first, then fall back if one is busy (503/429) or retired (404).
  const models = [...new Set([runtime.process?.env.GEMINI_MODEL, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"].filter(Boolean) as string[])];
  const g = globalThis as unknown as {
    AbortController: new () => { signal: unknown; abort(): void };
    setTimeout: (fn: () => void, ms: number) => unknown;
    clearTimeout: (id: unknown) => void;
  };
  const Abort = g.AbortController;
  try {
    for (const model of models) {
      const controller = new Abort();
      const timer = g.setTimeout(() => controller.abort(), 12000); // never leave the visitor waiting forever
      let response: GeminiResponse & { status?: number };
      try {
        response = await runtime.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: contents.map(({ role, text }) => ({ role, parts: [{ text }] })),
            generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
          }),
          signal: controller.signal,
        } as Parameters<typeof runtime.fetch>[1]);
      } catch {
        g.clearTimeout(timer);
        continue; // timeout / network error -> next model
      }
      g.clearTimeout(timer);
      if (!response.ok) {
        if (response.status === 404 || response.status === 429 || response.status === 503 || response.status === 500) continue;
        return respond(res, 502, { reply: "Sherif couldn't answer just now. Please try again shortly." });
      }
      const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const reply = result.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
      return respond(res, 200, { reply: reply || "I don't have an answer for that right now. You can email Amr at amrelsherif.eng@gmail.com." });
    }
    return respond(res, 503, { reply: "Sherif is very busy right now. Please try again in a minute, or email amrelsherif.eng@gmail.com." });
  } catch {
    return respond(res, 502, { reply: "Sherif couldn't connect just now. Please try again shortly." });
  }
}
