import { makeQuestion } from "../src/lab/games/subnetting/questions.ts";

function number(ip) {
  return ip.split(".").reduce((value, octet) => (value * 256 + Number(octet)) >>> 0, 0);
}
function address(value) {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".");
}
function maskFor(prefix) {
  return address(prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0);
}
function expectedAnswer(prompt) {
  let match;
  if ((match = prompt.match(/network address of ([\d.]+)\/(\d+)/))) {
    const [, ip, rawPrefix] = match;
    const prefix = Number(rawPrefix);
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    return address(number(ip) & mask);
  }
  if ((match = prompt.match(/broadcast address of ([\d.]+)\/(\d+)/))) {
    const [, ip, rawPrefix] = match;
    const prefix = Number(rawPrefix);
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    return address(((number(ip) & mask) | (~mask >>> 0)) >>> 0);
  }
  if ((match = prompt.match(/usable hosts are in a \/(\d+)/))) {
    const prefix = Number(match[1]);
    return String(prefix === 31 ? 2 : prefix === 32 ? 1 : 2 ** (32 - prefix) - 2);
  }
  if ((match = prompt.match(/subnet mask is \/(\d+)/))) return maskFor(Number(match[1]));
  if ((match = prompt.match(/CIDR prefix matches ([\d.]+)/))) {
    const bits = number(match[1]).toString(2).padStart(32, "0");
    return `/${bits.indexOf("0") < 0 ? 32 : bits.indexOf("0")}`;
  }
  if ((match = prompt.match(/Are ([\d.]+) and ([\d.]+) in the same \/(\d+) subnet/))) {
    const prefix = Number(match[3]);
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    return (number(match[1]) & mask) === (number(match[2]) & mask) ? "Yes" : "No";
  }
  if ((match = prompt.match(/first usable host in ([\d.]+)\/(\d+)/))) return address((number(match[1]) + 1) >>> 0);
  if ((match = prompt.match(/last usable host in ([\d.]+)\/(\d+)/))) {
    const prefix = Number(match[2]);
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const broadcast = ((number(match[1]) & mask) | (~mask >>> 0)) >>> 0;
    return address((broadcast - 1) >>> 0);
  }
  throw new Error(`Unrecognized subnetting prompt: ${prompt}`);
}

for (let i = 0; i < 5000; i++) {
  const question = makeQuestion();
  const expected = expectedAnswer(question.prompt);
  if (question.answer !== expected) {
    console.error(`subnetting mismatch on question ${i + 1}: ${question.prompt}\nexpected ${expected}, got ${question.answer}`);
    process.exit(1);
  }
}
console.log("subnetting: 5000 questions OK");
