type GroqResponse = { ok: boolean; status?: number; json: () => Promise<unknown> };
import type { Deadline } from "./_budget.js";
// Env: GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3 (the last two are optional).
const runtime = globalThis as typeof globalThis & {
  process?: { env: Record<string, string | undefined> };
  fetch: (url: string, init: { method: string; headers: Record<string, string>; body: string; signal: unknown }) => Promise<GroqResponse>;
  AbortController: new () => { signal: unknown; abort(): void };
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (id: unknown) => void;
};

export function groqKeys(): string[] {
  return [...new Set([runtime.process?.env.GROQ_API_KEY, runtime.process?.env.GROQ_API_KEY_2, runtime.process?.env.GROQ_API_KEY_3].map((key) => key?.trim()).filter((key): key is string => Boolean(key)))];
}

export async function callGroqJson(system: string, user: string, opts: { temperature?: number; max_tokens?: number } = {}, deadline?: Deadline): Promise<unknown | null> {
  const keys = groqKeys();
  if (!keys.length) return null;
  const models = [...new Set([runtime.process?.env.GROQ_MODEL, "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"].filter(Boolean) as string[])];
  let attempts = 0;
  for (const key of keys) for (const model of models) {
    if (attempts >= 4 || (deadline && deadline.remaining() < 1500)) return null;
    attempts++;
    const controller = new runtime.AbortController();
    const timer = runtime.setTimeout(() => controller.abort(), deadline ? Math.min(8000, deadline.remaining() - 300) : 8000);
    let response: GroqResponse;
    try {
      response = await runtime.fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }], response_format: { type: "json_object" }, temperature: opts.temperature ?? 0.2, max_completion_tokens: Math.max(opts.max_tokens ?? 300, 1200), ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}) }),
        signal: controller.signal,
      });
    } catch { runtime.clearTimeout(timer); continue; }
    runtime.clearTimeout(timer);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) break;
      if (response.status === 400 || response.status === 404 || response.status === 429 || (response.status !== undefined && response.status >= 500)) continue;
      return null;
    }
    try {
      const data = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> };
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string") return null;
      const parsed: unknown = JSON.parse(content);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      return parsed;
    } catch { return null; }
  }
  return null;
}
