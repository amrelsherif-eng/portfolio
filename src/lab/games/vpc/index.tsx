import { useEffect, useMemo, useState } from "react";
import type { GameProps } from "../../types";
import { broadcast, network, parseIPv4, toNumber } from "../subnetting/ipv4";
import { evaluate } from "./rules";
import "./vpc.css";

type Level = 0 | 1 | 2 | 3;
type Key = "publicRoute" | "igw" | "webIp" | "webSg" | "natSubnet" | "natEip" | "privateRoute" | "appIp" | "dbSubnet" | "dbPublic" | "dbSg";
type Config = Partial<Record<Key, string>> & { cidrs: string[] };
type Setting = { key: Key; label: string; options: string[]; answer: string };
const titles = ["Make the web server reachable from the internet", "Give the private app server outbound updates", "Allow the web tier to reach the database", "Choose non-overlapping subnet CIDRs"];
const setup: Setting[][] = [
  [
    { key: "publicRoute", label: "Public route table · 0.0.0.0/0 target", options: ["local", "igw-web", "nat-gw", "none"], answer: "igw-web" },
    { key: "igw", label: "Internet Gateway state", options: ["not created", "created, detached", "attached to this VPC"], answer: "attached to this VPC" },
    { key: "webIp", label: "Web instance public IPv4", options: ["none", "auto-assign public IP"], answer: "auto-assign public IP" },
    { key: "webSg", label: "Web security group · inbound", options: ["TCP 22 from 0.0.0.0/0", "TCP 443 from 0.0.0.0/0", "All traffic from 0.0.0.0/0", "TCP 443 from 10.0.0.0/16"], answer: "TCP 443 from 0.0.0.0/0" },
  ],
  [
    { key: "natSubnet", label: "NAT Gateway subnet", options: ["public subnet", "private subnet"], answer: "public subnet" },
    { key: "natEip", label: "NAT Gateway Elastic IP", options: ["none", "allocated"], answer: "allocated" },
    { key: "privateRoute", label: "Private route table · 0.0.0.0/0 target", options: ["igw", "nat-gw", "local", "none"], answer: "nat-gw" },
    { key: "appIp", label: "App instance public IPv4", options: ["none", "auto-assign"], answer: "none" },
  ],
  [
    { key: "dbSubnet", label: "Database subnet", options: ["public", "private"], answer: "private" },
    { key: "dbPublic", label: "Database public access", options: ["enabled", "disabled"], answer: "disabled" },
    { key: "dbSg", label: "Database security group · inbound", options: ["TCP 3306 from 0.0.0.0/0", "TCP 3306 from sg-web", "TCP 22 from sg-web", "All traffic from 10.0.0.0/16"], answer: "TCP 3306 from sg-web" },
  ],
];
const cidrOptions = ["10.0.1.0/24", "10.0.2.0/24", "10.0.11.0/24", "10.0.12.0/24", "10.0.0.0/24", "10.1.1.0/24", "10.1.0.0/24", "10.0.0.0/16", "10.0.20.0/24", "10.0.3.0/24"];
function shuffled<T>(items: T[]): T[] { const result = [...items]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; }
function validCidrs(values: string[]): boolean {
  try {
    const ranges = values.map((value) => { const [ip, prefixText] = value.split("/"); const prefix = Number(prefixText); if (!ip || !Number.isInteger(prefix) || prefix < 16 || prefix > 28) return null; const start = toNumber(network(ip, prefix)); const end = toNumber(broadcast(ip, prefix)); if (toNumber("10.0.0.0") > start || end > toNumber("10.0.255.255")) return null; parseIPv4(ip); return { start, end }; });
    return ranges.every((range): range is { start: number; end: number } => range !== null) && ranges.every((range, i) => ranges.slice(i + 1).every((other) => range.end < other.start || other.end < range.start));
  } catch { return false; }
}
function hintFor(level: Level, config: Config): string {
  const v = config as unknown as Record<string, string | undefined>;
  if (level === 0) {
    if (v.publicRoute !== "igw-web") return "Public subnet → internet: the subnet route table must send 0.0.0.0/0 to an attached Internet Gateway.";
    if (v.igw !== "attached to this VPC") return "VPC → internet: an Internet Gateway must be attached to this VPC; a VPC supports one IGW.";
    if (v.webIp !== "auto-assign public IP") return "Internet Gateway → web instance: inbound internet traffic needs a public IPv4 address on the instance.";
    if (v.webSg === "All traffic from 0.0.0.0/0") return "Internet → web security group: this rule works, but is far too open; only allow the ports you serve.";
    if (v.webSg !== "TCP 443 from 0.0.0.0/0") return "Internet → web security group: allow inbound TCP 443 from internet clients; security groups are stateful.";
  }
  if (level === 1) {
    if (v.natSubnet !== "public subnet") return "NAT Gateway → internet: place the NAT Gateway in a public subnet with a route to the IGW.";
    if (v.natEip !== "allocated") return "NAT Gateway → internet: a public NAT Gateway requires an allocated Elastic IP.";
    if (v.privateRoute === "igw") return "Private subnet → internet: an IGW default route exposes the subnet path; point 0.0.0.0/0 to the NAT Gateway.";
    if (v.privateRoute !== "nat-gw") return "Private subnet → updates: its route table must point 0.0.0.0/0 at the NAT Gateway.";
    if (v.appIp !== "none") return "App instance → internet: assigning a public IPv4 makes it internet reachable; keep it private and use the NAT route.";
  }
  if (level === 2) {
    if (v.dbSubnet !== "private") return "Web tier → database: place the database in a private subnet.";
    if (v.dbPublic !== "disabled") return "Internet → database: disable public access so the database is not internet reachable.";
    if (v.dbSg === "All traffic from 10.0.0.0/16") return "Web tier → database security group: the whole VPC CIDR is too broad; allow only TCP 3306 from sg-web.";
    if (v.dbSg !== "TCP 3306 from sg-web") return "Web tier → database security group: allow inbound TCP 3306 from sg-web; security groups are stateful.";
  }
  if (level === 3 && !validCidrs(config.cidrs)) return "Subnet CIDRs → VPC: each range must fit inside 10.0.0.0/16 and must not overlap another subnet.";
  return "";
}

export default function VpcGame({ onFinish }: GameProps) {
  const [level, setLevel] = useState<Level>(0);
  const [config, setConfig] = useState<Config>({ cidrs: ["", "", "", ""] });
  const [options, setOptions] = useState(() => setup.map((items) => items.map((item) => shuffled(item.options))));
  const [attempts, setAttempts] = useState([0, 0, 0, 0]); const [result, setResult] = useState<{ ok: boolean; hint: string } | null>(null); const [passed, setPassed] = useState([0, 0, 0, 0]); const [started] = useState(() => Date.now()); const [seconds, setSeconds] = useState(180);
  useEffect(() => { const timer = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (seconds === 0) onFinish({ score: passed.reduce((sum, n) => sum + (n === 1 ? 3 : 1), 0), max: 12, seconds: Math.floor((Date.now() - started) / 1000) }); }, [seconds, onFinish, passed, started]);
  const active = level < 3 ? setup[level] : [];
  const allSet = level === 3 ? config.cidrs.every(Boolean) : active.every((setting) => Boolean(config[setting.key]));
  const setValue = (key: Key, value: string) => { setConfig((old) => ({ ...old, [key]: value })); setResult(null); };
  function test() {
    setAttempts((old) => old.map((n, i) => i === level ? n + 1 : n));
    const evaluated = evaluate((level + 1) as 1 | 2 | 3 | 4, config); const hint = evaluated.hint ?? hintFor(level, config); const ok = evaluated.ok; setResult({ ok, hint });
    if (ok) setPassed((old) => old.map((n, i) => i === level ? attempts[level] + 1 : n));
  }
  function advance() { if (!result?.ok) return; if (level === 3) { onFinish({ score: passed.reduce((sum, n) => sum + (n === 1 ? 3 : 1), 0), max: 12, seconds: Math.floor((Date.now() - started) / 1000) }); return; } const next = (level + 1) as Level; setLevel(next); setResult(null); setOptions((old) => old.map((row, i) => i === next ? setup[next].map((item) => shuffled(item.options)) : row)); }
  const routes = useMemo(() => ({ publicRoute: config.publicRoute === "igw-web", privateRoute: config.privateRoute === "nat-gw" }), [config.publicRoute, config.privateRoute]);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const path = level === 0 ? "M48 145 H150 M225 145 V200" : level === 1 ? "M48 145 H150 M225 145 V200 M280 200 H385 M460 200 V145" : "M225 220 H385 M460 200 V145";
  return <section className="lab-panel vpc-game">
    <div className="vpc-meta"><span>LEVEL {level + 1} / 4</span><strong>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</strong></div><div className="vpc-progress"><span style={{ width: `${level * 25}%` }} /></div><h2>{titles[level]}</h2><p className="vpc-subtitle">Choose each AWS resource setting, then test the traffic path.</p>
    <div className="vpc-layout"><div className="vpc-diagram"><svg viewBox="0 0 560 310" role="img" aria-label="VPC traffic diagram with internet gateway, public and private subnets, web, NAT, app and database">
      <rect x="95" y="15" width="450" height="280" rx="18" className="vpc-boundary"/><text x="112" y="42">VPC · 10.0.0.0/16</text>
      <rect x="115" y="62" width="190" height="210" rx="12" className="vpc-public"/><text x="128" y="87">Public subnet</text><rect x="330" y="62" width="195" height="210" rx="12" className="vpc-private"/><text x="343" y="87">Private subnet</text>
      <text x="8" y="136">Internet</text><text x="158" y="133" className={config.igw === "attached to this VPC" ? "" : "muted"}>IGW · {config.igw === "attached to this VPC" ? "attached" : config.igw === "created, detached" ? "detached" : config.igw === "not created" ? "none" : "?"}</text><text x="172" y="225">Web</text><text x="388" y="135">NAT · {config.natSubnet ? config.natSubnet.replace(" subnet", "") : "?"}</text><text x="382" y="225">App / DB</text>
      {routes.publicRoute && <path d="M48 150 H150 M225 150 V200" className="route-arrow" markerEnd="url(#arrow)"/>}{routes.privateRoute && <path d="M280 205 H385 M455 185 V150" className="route-arrow" markerEnd="url(#arrow)"/>}
      <path d={path} className={`vpc-path ${result ? result.ok ? "success" : "failed" : ""}`}/><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="currentColor"/></marker></defs>
      {result?.ok && !reducedMotion && <circle r="6" className="vpc-dot"><animateMotion dur="1.8s" repeatCount="indefinite" path={path}/></circle>}
      {result && !result.ok && <g className="vpc-stop"><circle cx={level === 0 ? 150 : level === 1 ? 385 : 330} cy={level === 2 ? 220 : 150} r="12"/><path d={level === 0 ? "M145 145l10 10m0-10-10 10" : level === 1 ? "M380 145l10 10m0-10-10 10" : "M325 215l10 10m0-10-10 10"}/></g>}
      {level === 2 && <text x="373" y="250">DB</text>}
    </svg><p className="vpc-legend">{level < 2 ? "Internet → service" : level === 2 ? "Web → database · SGs are stateful" : "Four subnets · two AZs"}</p></div>
    <div className="vpc-controls">{level < 3 ? active.map((setting, i) => <fieldset className="vpc-setting" key={setting.key}><legend>{setting.label}</legend><div className="vpc-picks">{options[level][i].map((option) => <button type="button" key={option} aria-pressed={config[setting.key] === option} className={config[setting.key] === option ? "selected" : ""} onClick={() => setValue(setting.key, option)}>{option}</button>)}</div></fieldset>) : <>{["Public · AZ A", "Public · AZ B", "Private · AZ A", "Private · AZ B"].map((label, i) => <label className="vpc-setting" key={label}><span>{label} CIDR</span><select value={config.cidrs[i]} onChange={(e) => { setConfig((old) => ({ ...old, cidrs: old.cidrs.map((v, n) => n === i ? e.target.value : v) })); setResult(null); }}><option value="">Choose…</option>{shuffled(cidrOptions).map((option, n) => <option key={`${n}-${option}`} value={option}>{option}</option>)}</select></label>) }<div className="vpc-info"><strong>Web security group outbound</strong><span>Default: all outbound · security groups are stateful</span></div></>}
      <button type="button" className="lab-button vpc-test" onClick={test} disabled={!allSet}>Test traffic</button>{result && <div className={`vpc-feedback ${result.ok ? "ok" : "error"}`} role="status"><strong>{result.ok ? "Packet delivered" : "Packet stopped"}</strong><p>{result.ok ? "The configured AWS path delivers the packet." : result.hint}</p>{result.ok && <button className="lab-button" onClick={advance}>{level === 3 ? "Finish" : "Next level"}</button>}</div>}</div></div>
  </section>;
}
