type RequestLike = { headers?: Record<string, string | string[] | undefined>; ip?: string; socket?: { remoteAddress?: string } };

const requestLog = new Map<string, number[]>();
const MEMORY_WINDOW_MS = 10 * 60 * 1000;

function clientIp(req: RequestLike): string {
  const first = (h: string | string[] | undefined) => (Array.isArray(h) ? h[0] : h)?.split(",")[0].trim();
  return first(req.headers?.["x-real-ip"]) || first(req.headers?.["x-forwarded-for"]) || req.ip || req.socket?.remoteAddress || "unknown";
}

export function isRateLimited(req: RequestLike, weight = 1, bucket = "chat", max = 20): boolean {
  const key = `${bucket}:${clientIp(req)}`;
  const now = Date.now();
  if (requestLog.size > 2000) for (const [entry, times] of requestLog) if (!times.some((time) => now - time < MEMORY_WINDOW_MS)) requestLog.delete(entry);
  if (requestLog.size > 5000) for (const entry of requestLog.keys()) { requestLog.delete(entry); if (requestLog.size <= 4000) break; }
  const recent = (requestLog.get(key) || []).filter((time) => now - time < MEMORY_WINDOW_MS);
  if (recent.length + weight > max) { requestLog.set(key, recent); return true; }
  for (let i = 0; i < weight; i++) recent.push(now);
  requestLog.set(key, recent);
  return false;
}

const runtime = globalThis as typeof globalThis & {
  process?: { env: Record<string, string | undefined> };
  fetch: (url: string, init: { method: string; headers: Record<string, string>; body: string; signal: unknown }) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;
  crypto: { subtle: { digest: (algorithm: string, data: Uint8Array) => Promise<ArrayBuffer> } };
  TextEncoder: new () => { encode: (value: string) => Uint8Array };
  AbortController: new () => { signal: unknown; abort: () => void };
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (id: unknown) => void;
};

async function hashIp(ip: string): Promise<string> {
  const bytes = new runtime.TextEncoder().encode(ip);
  const digest = await runtime.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

export async function rateLimit(req: RequestLike, bucket: string, limit: number, windowSec: number): Promise<boolean> {
  const url = runtime.process?.env.UPSTASH_REDIS_REST_URL;
  const token = runtime.process?.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const controller = new runtime.AbortController();
    const timeout = runtime.setTimeout(() => controller.abort(), 1500);
    try {
      const ipHash = await hashIp(clientIp(req));
      const window = Math.floor(Date.now() / 1000 / windowSec);
      const response = await runtime.fetch(`${url.replace(/\/$/, "")}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([["INCR", `rl:${bucket}:${ipHash}:${window}`], ["EXPIRE", `rl:${bucket}:${ipHash}:${window}`, windowSec, "NX"]]),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Upstash request failed");
      const result = await response.json() as Array<{ result?: unknown; error?: unknown }>;
      const count = result?.[0]?.result;
      if (result?.[0]?.error || typeof count !== "number") throw new Error("Invalid Upstash response");
      return count > limit;
    } catch { /* Redis failures fall through to the local limiter. */ }
    finally { runtime.clearTimeout(timeout); }
  }
  return isRateLimited(req, 1, bucket, limit);
}
