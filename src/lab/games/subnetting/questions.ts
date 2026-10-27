import { broadcast, hosts, mask, network, sameSubnet, toNumber, fromNumber } from "./ipv4.ts";

export type Question = { prompt: string; answer: string; options: string[]; explain: string };
const prefixes = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 16, 18, 19, 12, 8];
const r = (n: number) => Math.floor(Math.random() * n);
const ip = (p: number) => { const k = p < 12 ? 0 : p < 16 ? r(2) : r(3); return k === 0 ? `10.${r(256)}.${r(256)}.${1 + r(254)}` : k === 1 ? `172.${16 + r(16)}.${r(256)}.${1 + r(254)}` : `192.168.${r(256)}.${1 + r(254)}`; };
function shuffled<T>(items: T[]): T[] { return [...items].sort(() => Math.random() - 0.5); }

export function makeQuestion(): Question {
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const address = ip(p); const net = network(address, p); const broad = broadcast(address, p); const block = 2 ** (32 - p);
  const types = ["network", "broadcast", "hosts", "mask", "same", "first", "last", "cidr"];
  const type = types[Math.floor(Math.random() * types.length)];
  let prompt = "", answer = "", explain = "";
  if (type === "network") { prompt = `What is the network address of ${address}/${p}?`; answer = net; explain = `/${p} → block size ${block} → ${net}–${broad}.`; }
  if (type === "broadcast") { prompt = `What is the broadcast address of ${address}/${p}?`; answer = broad; explain = `/${p} → block size ${block} → ${net}–${broad}.`; }
  if (type === "hosts") { prompt = `How many usable hosts are in a /${p} subnet?`; answer = String(hosts(p)); explain = `/${p} leaves ${32 - p} host bits → 2^${32 - p} − 2 = ${answer} usable hosts.`; }
  if (type === "mask") { prompt = `Which subnet mask is /${p}?`; answer = mask(p); explain = `/${p} means ${p} network bits → ${answer}.`; }
  if (type === "cidr") { prompt = `What CIDR prefix matches ${mask(p)}?`; answer = `/${p}`; explain = `${mask(p)} contains ${p} network bits → /${p}.`; }
  if (type === "same") { const second = fromNumber((toNumber(net) + (Math.random() < 0.5 ? r(block) : (Math.random() < 0.5 ? block + r(block) : -1 - r(block)))) >>> 0); prompt = `Are ${address} and ${second} in the same /${p} subnet?`; answer = sameSubnet(address, second, p) ? "Yes" : "No"; explain = `/${p}: ${address} → ${network(address, p)}, ${second} → ${network(second, p)}. ${answer === "Yes" ? "Same network." : "Different networks."}`; }
  if (type === "first") { prompt = `What is the first usable host in ${net}/${p}?`; answer = fromNumber((toNumber(net) + 1) >>> 0); explain = `Network ${net}; first usable is network + 1 → ${answer}.`; }
  if (type === "last") { prompt = `What is the last usable host in ${net}/${p}?`; answer = fromNumber((toNumber(broad) - 1) >>> 0); explain = `Broadcast ${broad}; last usable is broadcast − 1 → ${answer}.`; }
  let candidates: string[];
  if (["network", "broadcast", "first", "last"].includes(type)) candidates = [fromNumber((toNumber(answer) + block) >>> 0), fromNumber((toNumber(answer) - block) >>> 0), fromNumber((toNumber(answer) + 1) >>> 0)];
  else if (type === "mask") candidates = [mask(Math.max(0, p - 1)), mask(Math.min(32, p + 1)), mask(24)];
  else if (type === "hosts") candidates = [String(Math.max(0, hosts(Math.max(0, p - 1)))), String(hosts(Math.min(32, p + 1))), String(hosts(Math.min(32, p + 2)))];
  else if (type === "cidr") candidates = [`/${Math.max(0, p - 1)}`, `/${Math.min(32, p + 1)}`, "/24"];
  else candidates = [answer === "Yes" ? "No" : "Yes", answer === "Yes" ? "No" : "Yes", answer === "Yes" ? "No" : "Yes"];
  candidates = [...new Set(candidates.filter((v) => v !== answer))];
  for (let n = 1; candidates.length < 3 && n < 40; n++) { const extra = type === "hosts" ? String(hosts(8 + ((p + n) % 23))) : type === "cidr" ? `/${8 + ((p + n) % 23)}` : mask(8 + ((p + n) % 23)); if (extra !== answer && !candidates.includes(extra)) candidates.push(extra); }
  if (type === "same") return { prompt, answer, options: ["Yes", "No"], explain };
  return { prompt, answer, options: shuffled([answer, ...candidates.slice(0, 3)]), explain };
}
