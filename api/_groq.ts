type GroqResponse = { ok: boolean; status?: number; json: () => Promise<unknown> };
const runtime = globalThis as typeof globalThis & {
  process?: { env: Record<string, string | undefined> };
  fetch: (url: string, init: { method: string; headers: Record<string, string>; body: string; signal: unknown }) => Promise<GroqResponse>;
  AbortController: new () => { signal: unknown; abort(): void };
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (id: unknown) => void;
};

export async function callGroqJson(system: string, user: string, opts: { temperature?: number; max_tokens?: number } = {}): Promise<unknown | null> {
  const key = runtime.process?.env.GROQ_API_KEY;
  if (!key) return null;
  const models = [...new Set([runtime.process?.env.GROQ_MODEL, "llama-3.3-70b-versatile", "llama-3.1-8b-instant"].filter(Boolean) as string[])];
  for (const model of models) {
    const controller = new runtime.AbortController();
    const timer = runtime.setTimeout(() => controller.abort(), 8000);
    let response: GroqResponse;
    try {
      response = await runtime.fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }], response_format: { type: "json_object" }, temperature: opts.temperature ?? 0.2, max_tokens: opts.max_tokens ?? 300 }),
        signal: controller.signal,
      });
    } catch { runtime.clearTimeout(timer); continue; }
    runtime.clearTimeout(timer);
    if (!response.ok) {
      if (response.status === 404 || response.status === 429 || (response.status !== undefined && response.status >= 500)) continue;
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
