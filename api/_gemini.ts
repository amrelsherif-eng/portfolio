// Gemini keys: GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3 (the latter two are optional).
import type { Deadline } from "./_budget.js";
type GeminiResponse = { ok: boolean; status?: number; json: () => Promise<unknown> };
export { isRateLimited } from "./_ratelimit.js";
const runtime = globalThis as typeof globalThis & {
  process?: { env: Record<string, string | undefined> };
  fetch: (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<GeminiResponse>;
  AbortController: new () => { signal: unknown; abort(): void };
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (id: unknown) => void;
};

export async function callGemini(contents: unknown[], systemInstruction: string, generationConfig: unknown, deadline?: Deadline): Promise<{ ok: true; status: 200; json: unknown } | { ok: false; status: number; json?: undefined }> {
  const keys = [runtime.process?.env.GEMINI_API_KEY, runtime.process?.env.GEMINI_API_KEY_2, runtime.process?.env.GEMINI_API_KEY_3].filter((key): key is string => Boolean(key?.trim()));
  if (!keys.length) return { ok: false, status: 503 };
  const models = [...new Set([runtime.process?.env.GEMINI_MODEL, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"].filter(Boolean) as string[])];
  let attempts = 0;
  for (const key of keys) {
    let quotaOnEveryModel = true;
    let invalidKey = false;
    for (const model of models) {
    if (attempts >= 4 || (deadline && deadline.remaining() < 1500)) return { ok: false, status: 503 };
    attempts++;
    const controller = new runtime.AbortController();
    const timer = runtime.setTimeout(() => controller.abort(), deadline ? Math.min(12000, deadline.remaining() - 300) : 12000);
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
      if (response.status === 401 || response.status === 403) { invalidKey = true; break; }
      if (response.status === 404 || response.status === 429 || response.status === 503 || response.status === 500) continue;
      return { ok: false, status: 502 };
    }
    return { ok: true, status: 200, json: await response.json() };
    }
    if (!invalidKey && !quotaOnEveryModel) break;
  }
  return { ok: false, status: 503 };
}
