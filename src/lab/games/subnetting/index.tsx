import { useEffect, useState } from "react";
import type { GameProps } from "../../types";
import { broadcast, hosts, mask, network, sameSubnet, toNumber, fromNumber } from "./ipv4";
import "./subnetting.css";

type Question = { prompt: string; answer: string; options: string[]; explain: string };
const prefixes = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 16, 18, 19, 12, 8];
const ip = () => `192.168.${Math.floor(Math.random() * 254)}.${1 + Math.floor(Math.random() * 254)}`;
function shuffled<T>(items: T[]): T[] { return [...items].sort(() => Math.random() - 0.5); }
function makeQuestion(): Question {
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const address = ip(); const net = network(address, p); const broad = broadcast(address, p); const block = 2 ** (32 - p);
  const types = ["network", "broadcast", "hosts", "mask", "same", "first", "last", "cidr"];
  const type = types[Math.floor(Math.random() * types.length)];
  let prompt = "", answer = "", explain = "";
  if (type === "network") { prompt = `What is the network address of ${address}/${p}?`; answer = net; explain = `/${p} → block size ${block} → ${net}–${broad}.`; }
  if (type === "broadcast") { prompt = `What is the broadcast address of ${address}/${p}?`; answer = broad; explain = `/${p} → block size ${block} → ${net}–${broad}.`; }
  if (type === "hosts") { prompt = `How many usable hosts are in a /${p} subnet?`; answer = String(hosts(p)); explain = `/${p} leaves ${32 - p} host bits → 2^${32 - p} − 2 = ${answer} usable hosts.`; }
  if (type === "mask") { prompt = `Which subnet mask is /${p}?`; answer = mask(p); explain = `/${p} means ${p} network bits → ${answer}.`; }
  if (type === "cidr") { prompt = `What CIDR prefix matches ${mask(p)}?`; answer = `/${p}`; explain = `${mask(p)} contains ${p} network bits → /${p}.`; }
  if (type === "same") { const second = fromNumber((toNumber(net) + Math.floor(Math.random() * Math.max(1, block))) >>> 0); prompt = `Are ${address} and ${second} in the same /${p} subnet?`; answer = sameSubnet(address, second, p) ? "Yes" : "No"; explain = `Their /${p} network address is ${network(address, p)}.`; }
  if (type === "first") { prompt = `What is the first usable host in ${net}/${p}?`; answer = fromNumber((toNumber(net) + 1) >>> 0); explain = `Network ${net}; first usable is network + 1 → ${answer}.`; }
  if (type === "last") { prompt = `What is the last usable host in ${net}/${p}?`; answer = fromNumber((toNumber(broad) - 1) >>> 0); explain = `Broadcast ${broad}; last usable is broadcast − 1 → ${answer}.`; }
  let candidates: string[];
  if (["network", "broadcast", "first", "last"].includes(type)) candidates = [fromNumber((toNumber(answer) + block) >>> 0), fromNumber((toNumber(answer) - block) >>> 0), fromNumber((toNumber(answer) + 1) >>> 0)];
  else if (type === "mask") candidates = [mask(Math.max(0, p - 1)), mask(Math.min(32, p + 1)), mask(24)];
  else if (type === "hosts") candidates = [String(Math.max(0, hosts(Math.max(0, p - 1)))), String(hosts(Math.min(32, p + 1))), String(hosts(Math.min(32, p + 2)))];
  else if (type === "cidr") candidates = [`/${Math.max(0, p - 1)}`, `/${Math.min(32, p + 1)}`, "/24"];
  else candidates = [answer === "Yes" ? "No" : "Yes", answer === "Yes" ? "No" : "Yes", answer === "Yes" ? "No" : "Yes"];
  candidates = [...new Set(candidates.filter((v) => v !== answer))];
  while (candidates.length < 3) candidates.push(type === "hosts" ? String(hosts(Math.max(0, (p + candidates.length + 3) % 31))) : type === "cidr" ? `/${(p + candidates.length + 1) % 31}` : `255.255.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`);
  return { prompt, answer, options: shuffled([answer, ...candidates.slice(0, 3)]), explain };
}

export default function SubnettingGame({ onFinish }: GameProps) {
  const [questions] = useState(() => Array.from({ length: 10 }, makeQuestion));
  const [index, setIndex] = useState(0); const [score, setScore] = useState(0); const [seconds, setSeconds] = useState(120); const [choice, setChoice] = useState<string | null>(null);
  useEffect(() => { const timer = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (seconds === 0) onFinish({ score, max: 10, seconds: 120 }); }, [seconds, onFinish, score]);
  useEffect(() => { const key = (event: KeyboardEvent) => { if (choice) { if (event.key === "Enter") next(); return; } const n = Number(event.key); if (n >= 1 && n <= 4) setChoice(questions[index].options[n - 1]); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); });
  function next() { if (!choice) return; const total = score + (choice === questions[index].answer ? 1 : 0); if (index === 9) onFinish({ score: total, max: 10, seconds: 120 - seconds }); else { setScore(total); setIndex(index + 1); setChoice(null); } }
  const q = questions[index];
  return <section className="lab-panel subnet-game"><div className="subnet-meta"><span>Question {index + 1} / 10</span><strong aria-live="polite">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</strong></div><div className="subnet-progress" aria-label={`Question ${index + 1} of 10`}><span style={{ width: `${(index / 10) * 100}%` }} /></div><h2>{q.prompt}</h2><div className="subnet-options">{q.options.map((option, i) => <button type="button" key={`${i}-${option}`} className={`subnet-option${choice === option ? (choice === q.answer ? " correct" : " incorrect") : ""}`} onClick={() => !choice && setChoice(option)}><span>{i + 1}</span><code>{option}</code></button>)}</div>{choice && <div className="subnet-feedback" aria-live="polite"><strong>{choice === q.answer ? "Correct" : "Not quite"}</strong><p>{q.explain}</p><button className="lab-button" onClick={next}>Continue <span aria-hidden="true">↵</span></button></div>}<p className="subnet-hint">Use keys 1–4 to answer</p></section>;
}
