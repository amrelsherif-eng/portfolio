import { broadcast, network, parseIPv4, toNumber } from "../subnetting/ipv4";

export type Level = 1 | 2 | 3 | 4;
export type Key = "publicRoute" | "igw" | "webIp" | "webSg" | "natSubnet" | "natEip" | "privateRoute" | "appIp" | "dbSubnet" | "dbPublic" | "dbSg";
export type Config = Partial<Record<Key, string>> & { cidrs: string[] };
export type Setting = { key: Key; label: string; options: string[]; answer: string };

export const levelOptions: Setting[][] = [
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

export const cidrOptions = ["10.0.1.0/24", "10.0.2.0/24", "10.0.11.0/24", "10.0.12.0/24", "10.0.0.0/24", "10.1.1.0/24", "10.1.0.0/24", "10.0.0.0/16", "10.0.20.0/24", "10.0.3.0/24"];

function validCidrs(values: string[]): boolean {
  if (values.length !== 4) return false;
  try {
    const ranges = values.map((value) => {
      const [ip, prefixText] = value.split("/");
      const prefix = Number(prefixText);
      if (!ip || !Number.isInteger(prefix) || prefix < 16 || prefix > 28) return null;
      const start = toNumber(network(ip, prefix));
      const end = toNumber(broadcast(ip, prefix));
      if (toNumber("10.0.0.0") > start || end > toNumber("10.0.255.255")) return null;
      parseIPv4(ip);
      return { start, end };
    });
    return ranges.every((range): range is { start: number; end: number } => range !== null) && ranges.every((range, i) => ranges.slice(i + 1).every((other) => range.end < other.start || other.end < range.start));
  } catch { return false; }
}

function hintFor(level: Level, config: Config): string {
  const v = config as unknown as Record<string, string | undefined>;
  if (level === 1) {
    if (v.publicRoute !== "igw-web") return "Public subnet → internet: the subnet route table must send 0.0.0.0/0 to an attached Internet Gateway.";
    if (v.igw !== "attached to this VPC") return "VPC → internet: an Internet Gateway must be attached to this VPC; a VPC supports one IGW.";
    if (v.webIp !== "auto-assign public IP") return "Internet Gateway → web instance: inbound internet traffic needs a public IPv4 address on the instance.";
    if (v.webSg === "All traffic from 0.0.0.0/0") return "Internet → web security group: this rule works, but is far too open; only allow the ports you serve.";
    if (v.webSg !== "TCP 443 from 0.0.0.0/0") return "Internet → web security group: allow inbound TCP 443 from internet clients; security groups are stateful.";
  }
  if (level === 2) {
    if (v.natSubnet !== "public subnet") return "NAT Gateway → internet: place the NAT Gateway in a public subnet with a route to the IGW.";
    if (v.natEip !== "allocated") return "NAT Gateway → internet: a public NAT Gateway requires an allocated Elastic IP.";
    if (v.privateRoute === "igw") return "Private subnet → internet: an IGW default route exposes the subnet path; point 0.0.0.0/0 to the NAT Gateway.";
    if (v.privateRoute !== "nat-gw") return "Private subnet → updates: its route table must point 0.0.0.0/0 at the NAT Gateway.";
    if (v.appIp !== "none") return "App instance → internet: assigning a public IPv4 makes it internet reachable; keep it private and use the NAT route.";
  }
  if (level === 3) {
    if (v.dbSubnet !== "private") return "Web tier → database: place the database in a private subnet.";
    if (v.dbPublic !== "disabled") return "Internet → database: disable public access so the database is not internet reachable.";
    if (v.dbSg === "All traffic from 10.0.0.0/16") return "Web tier → database security group: the whole VPC CIDR is too broad; allow only TCP 3306 from sg-web.";
    if (v.dbSg !== "TCP 3306 from sg-web") return "Web tier → database security group: allow inbound TCP 3306 from sg-web; security groups are stateful.";
  }
  if (level === 4 && !validCidrs(config.cidrs)) return "Subnet CIDRs → VPC: each range must fit inside 10.0.0.0/16 and must not overlap another subnet.";
  return "";
}

export function evaluate(level: Level, config: Config): { ok: boolean; hop?: string; hint?: string } {
  const hint = hintFor(level, config);
  return hint ? { ok: false, hint } : { ok: true };
}
