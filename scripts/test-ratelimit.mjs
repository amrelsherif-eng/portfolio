import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { rateLimit } from "../api/_ratelimit.ts";

const env = process.env;
try {
  const contents = await readFile(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || env[match[1]]) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    env[match[1]] = value;
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const req = { headers: { "x-real-ip": "203.0.113.7" } };
const resultsFor = async (bucket) => {
  const results = [];
  for (let i = 0; i < 5; i++) results.push(await rateLimit(req, bucket, 3, 60));
  return results;
};
const expected = [false, false, false, true, true];

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  assert.deepEqual(await resultsFor(`test:${crypto.randomUUID()}`), expected);
  console.log("ratelimit: upstash OK");
} else {
  console.log("upstash skipped (no env)");
}

const savedUrl = env.UPSTASH_REDIS_REST_URL;
const savedToken = env.UPSTASH_REDIS_REST_TOKEN;
delete env.UPSTASH_REDIS_REST_URL;
delete env.UPSTASH_REDIS_REST_TOKEN;
try {
  assert.deepEqual(await resultsFor(`test-memory:${crypto.randomUUID()}`), expected);
  console.log("ratelimit: memory fallback OK");
} finally {
  if (savedUrl === undefined) delete env.UPSTASH_REDIS_REST_URL;
  else env.UPSTASH_REDIS_REST_URL = savedUrl;
  if (savedToken === undefined) delete env.UPSTASH_REDIS_REST_TOKEN;
  else env.UPSTASH_REDIS_REST_TOKEN = savedToken;
}
