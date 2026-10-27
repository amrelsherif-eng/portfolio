export type IPv4 = [number, number, number, number];

export function parseIPv4(input: string): IPv4 {
  const parts = input.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)) throw new Error(`Invalid IPv4 address: ${input}`);
  return parts.map(Number) as IPv4;
}
export function toNumber(ip: string | IPv4): number { const a = typeof ip === "string" ? parseIPv4(ip) : ip; return (((a[0] * 256 + a[1]) * 256 + a[2]) * 256 + a[3]) >>> 0; }
export function fromNumber(value: number): string { const n = value >>> 0; return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join("."); }
export function mask(prefix: number): string {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new Error("Prefix must be 0–32");
  const m = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return fromNumber(m);
}
export function network(ip: string, prefix: number): string { const m = toNumber(mask(prefix)); return fromNumber(toNumber(ip) & m); }
export function broadcast(ip: string, prefix: number): string {
  const m = toNumber(mask(prefix));
  return fromNumber((toNumber(ip) & m) | (~m >>> 0));
}
export function hosts(prefix: number): number {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new Error("Prefix must be 0–32");
  if (prefix === 31) return 2;
  if (prefix === 32) return 1;
  return 2 ** (32 - prefix) - 2;
}
export function sameSubnet(a: string, b: string, prefix: number): boolean { const m = toNumber(mask(prefix)); return (toNumber(a) & m) === (toNumber(b) & m); }
