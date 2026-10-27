// Gemini keys: GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3 (the latter two are optional).
type RequestLike = { headers?: Record<string, string | string[] | undefined>; ip?: string; socket?: { remoteAddress?: string } };
type GeminiResponse = { ok: boolean; status?: number; json: () => Promise<unknown> };
const runtime = globalThis as typeof globalThis & {
  process?: { env: Record<string, string | undefined> };
  fetch: (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<GeminiResponse>;
  AbortController: new () => { signal: unknown; abort(): void };
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (id: unknown) => void;
};

const requestLog = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 20;

export function isRateLimited(req: RequestLike, weight = 1): boolean {
  const first = (h: string | string[] | undefined) => (Array.isArray(h) ? h[0] : h)?.split(",")[0].trim();
  const ip = first(req.headers?.["x-real-ip"]) || first(req.headers?.["x-forwarded-for"]) || req.ip || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  if (requestLog.size > 2000) for (const [key, times] of requestLog) if (!times.some((time) => now - time < WINDOW_MS)) requestLog.delete(key);
  const recent = (requestLog.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length + weight > MAX_REQUESTS) { requestLog.set(ip, recent); return true; }
  for (let i = 0; i < weight; i++) recent.push(now);
  requestLog.set(ip, recent);
  return false;
}

export async function callGemini(contents: unknown[], systemInstruction: string, generationConfig: unknown): Promise<{ ok: true; json: unknown } | { ok: false; status: number }> {
  const keys = [runtime.process?.env.GEMINI_API_KEY, runtime.process?.env.GEMINI_API_KEY_2, runtime.process?.env.GEMINI_API_KEY_3].filter((key): key is string => Boolean(key?.trim()));
  if (!keys.length) return { ok: false, status: 503 };
  const models = [...new Set([runtime.process?.env.GEMINI_MODEL, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"].filter(Boolean) as string[])];
  for (const key of keys) {
    let quotaOnEveryModel = true;
    for (const model of models) {
    const controller = new runtime.AbortController();
    const timer = runtime.setTimeout(() => controller.abort(), 12000);
    let response: GeminiResponse;
    try {
      response = await runtime.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: systemInstruction }] }, contents, generationConfig }),
        signal: controller.signal,
      } as Parameters<typeof runtime.fetch>[1]);
    } catch { runtime.clearTimeout(timer); quotaOnEveryModel = false; continue; }
    runtime.clearTimeout(timer);
    if (!response.ok) {
      if (response.status !== 429) quotaOnEveryModel = false;
      if (response.status === 404 || response.status === 429 || response.status === 503 || response.status === 500) continue;
      return { ok: false, status: 502 };
    }
    return { ok: true, json: await response.json() };
    }
    if (!quotaOnEveryModel) break;
  }
  return { ok: false, status: 503 };
}
