import { useEffect, useState } from "react";
import type { GameProps } from "../../types";
import "./troubleshoot.css";

/* ─── types ─── */
type Scenario = {
  topology: "pc-sw-rtr-inet" | "two-vlans";
  complaint: string;
  commands: { label: string; output: string }[];
  answer: string;
  distractors: [string, string, string];
  explain: string;
};

/* ─── inline SVG topologies ─── */
function TopoSvg({ kind }: { kind: Scenario["topology"] }) {
  if (kind === "two-vlans") {
    return (
      <svg viewBox="0 0 420 120" role="img" aria-label="Two PCs on two VLANs through a switch">
        <rect x="4" y="14" width="60" height="32" rx="6" fill="#18323b" stroke="#31505a" />
        <text x="34" y="35" textAnchor="middle" fill="#eef8fb" fontSize="11" fontFamily="ui-monospace,monospace">PC‑A</text>
        <rect x="4" y="74" width="60" height="32" rx="6" fill="#18323b" stroke="#31505a" />
        <text x="34" y="95" textAnchor="middle" fill="#eef8fb" fontSize="11" fontFamily="ui-monospace,monospace">PC‑B</text>
        <rect x="160" y="40" width="80" height="40" rx="8" fill="#18323b" stroke="#00f0ff" />
        <text x="200" y="65" textAnchor="middle" fill="#00f0ff" fontSize="12" fontFamily="ui-monospace,monospace">Switch</text>
        <rect x="340" y="40" width="76" height="40" rx="8" fill="#18323b" stroke="#31505a" />
        <text x="378" y="65" textAnchor="middle" fill="#eef8fb" fontSize="12" fontFamily="ui-monospace,monospace">Router</text>
        <line x1="64" y1="30" x2="160" y2="55" stroke="#31505a" strokeWidth="2" />
        <line x1="64" y1="90" x2="160" y2="65" stroke="#31505a" strokeWidth="2" />
        <line x1="240" y1="60" x2="340" y2="60" stroke="#31505a" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 440 80" role="img" aria-label="PC to switch to router to internet">
      <rect x="4" y="22" width="60" height="36" rx="6" fill="#18323b" stroke="#31505a" />
      <text x="34" y="45" textAnchor="middle" fill="#eef8fb" fontSize="12" fontFamily="ui-monospace,monospace">PC</text>
      <line x1="64" y1="40" x2="120" y2="40" stroke="#31505a" strokeWidth="2" />
      <rect x="120" y="22" width="80" height="36" rx="8" fill="#18323b" stroke="#00f0ff" />
      <text x="160" y="45" textAnchor="middle" fill="#00f0ff" fontSize="12" fontFamily="ui-monospace,monospace">Switch</text>
      <line x1="200" y1="40" x2="260" y2="40" stroke="#31505a" strokeWidth="2" />
      <rect x="260" y="22" width="76" height="36" rx="8" fill="#18323b" stroke="#31505a" />
      <text x="298" y="45" textAnchor="middle" fill="#eef8fb" fontSize="12" fontFamily="ui-monospace,monospace">Router</text>
      <line x1="336" y1="40" x2="380" y2="40" stroke="#31505a" strokeWidth="2" />
      <circle cx="410" cy="40" r="26" fill="none" stroke="#31505a" strokeWidth="2" />
      <text x="410" y="44" textAnchor="middle" fill="#92a9b0" fontSize="10" fontFamily="ui-monospace,monospace">NET</text>
    </svg>
  );
}

/* ─── scenario bank ─── */
function buildScenarios(): Scenario[] {
  return [
    {
      topology: "pc-sw-rtr-inet",
      complaint: "\"I can't reach anything on the network or the internet.\"",
      commands: [
        { label: "ipconfig", output: "IPv4 Address. . . . . . : 192.168.1.50\nSubnet Mask . . . . . . : 255.255.255.0\nDefault Gateway . . . . : 192.168.1.254" },
        { label: "ping 192.168.1.254", output: "Pinging 192.168.1.254 with 32 bytes of data:\nRequest timed out.\nRequest timed out.\n\nPackets: Sent = 2, Received = 0, Lost = 2 (100% loss)" },
        { label: "show ip interface brief (router)", output: "Interface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/0     203.0.113.1     YES manual up                    up\nGigabitEthernet0/1     192.168.1.1     YES manual up                    up" },
      ],
      answer: "Wrong default gateway on the PC",
      distractors: ["DNS server is unreachable", "Switch port is disabled", "Cable is unplugged"],
      explain: "The PC's default gateway is set to 192.168.1.254, but the router's LAN address is 192.168.1.1. Correcting the gateway restores connectivity.",
    },
    {
      topology: "pc-sw-rtr-inet",
      complaint: "\"I can reach IPs but websites won't load by name.\"",
      commands: [
        { label: "ping 8.8.8.8", output: "Pinging 8.8.8.8 with 32 bytes of data:\nReply from 8.8.8.8: bytes=32 time=12ms TTL=117\nReply from 8.8.8.8: bytes=32 time=11ms TTL=117\n\nPackets: Sent = 2, Received = 2, Lost = 0 (0% loss)" },
        { label: "nslookup google.com", output: "DNS request timed out.\n    timeout was 2 seconds.\nServer:  UnKnown\nAddress:  192.168.1.1\n\n*** UnKnown can't find google.com: No response from server" },
      ],
      answer: "DNS server is misconfigured or unreachable",
      distractors: ["Default gateway is wrong", "Subnet mask mismatch", "Router interface is down"],
      explain: "ping 8.8.8.8 succeeds so IP connectivity is fine. nslookup fails, meaning the configured DNS server cannot resolve names. Fix the DNS server address or restore DNS service.",
    },
    {
      topology: "pc-sw-rtr-inet",
      complaint: "\"None of the PCs on this LAN can reach the internet.\"",
      commands: [
        { label: "show ip interface brief", output: "Interface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/0     203.0.113.1     YES manual up                    up\nGigabitEthernet0/1     192.168.1.1     YES manual administratively down down\nSerial0/0/0            unassigned      YES unset  down                  down" },
      ],
      answer: "Router LAN interface is administratively shut down",
      distractors: ["ISP link is down", "Wrong VLAN assignment", "Duplicate IP address on the router"],
      explain: "show ip interface brief reveals Gi0/1 is \"administratively down\". Someone ran 'shutdown' on the LAN interface. Use 'no shutdown' to bring it up.",
    },
    {
      topology: "two-vlans",
      complaint: "\"PC‑A (plugged into switch port Fa0/5) can't reach its gateway even though the cable is fine.\"",
      commands: [
        { label: "show vlan brief", output: "VLAN Name                             Status    Ports\n---- -------------------------------- --------- --------\n1    default                          active\n10   Engineering                      active    Fa0/1-4\n20   Sales                            active    Fa0/5-8\n99   Management                       active" },
        { label: "ipconfig (PC‑A)", output: "IPv4 Address. . . . . . : 192.168.10.25\nSubnet Mask . . . . . . : 255.255.255.0\nDefault Gateway . . . . : 192.168.10.1" },
      ],
      answer: "PC is in the wrong VLAN",
      distractors: ["Trunk link is missing", "Spanning-tree is blocking the port", "Wrong subnet mask"],
      explain: "PC‑A has IP 192.168.10.25 (VLAN 10 subnet), but its switch port Fa0/5 is in VLAN 20. Moving the port to VLAN 10 fixes it.",
    },
    {
      topology: "pc-sw-rtr-inet",
      complaint: "\"My connection keeps dropping every few seconds.\"",
      commands: [
        { label: "ipconfig", output: "IPv4 Address. . . . . . : 192.168.1.40\nSubnet Mask . . . . . . : 255.255.255.0\nDefault Gateway . . . . : 192.168.1.1\n\nWindows IP Configuration\n  *** WARNING: Duplicate IP address 192.168.1.40\n      detected on the network." },
        { label: "ping 192.168.1.1", output: "Pinging 192.168.1.1 with 32 bytes of data:\nReply from 192.168.1.1: bytes=32 time=1ms TTL=255\nRequest timed out.\nReply from 192.168.1.1: bytes=32 time=2ms TTL=255\nRequest timed out.\n\nPackets: Sent = 4, Received = 2, Lost = 2 (50% loss)" },
      ],
      answer: "Duplicate IP address on the network",
      distractors: ["Faulty Ethernet cable", "DNS resolution failure", "Switch port is flapping"],
      explain: "Windows warns about a duplicate IP. Two devices share 192.168.1.40, causing ARP conflicts and intermittent loss. Assign a unique address to one of them.",
    },
    {
      topology: "pc-sw-rtr-inet",
      complaint: "\"After IT changed my settings I can't reach the file server 192.168.1.10 or the internet. Other PCs on the switch are fine.\"",
      commands: [
        { label: "ipconfig", output: "IPv4 Address. . . . . . : 192.168.1.70\nSubnet Mask . . . . . . : 255.255.255.192\nDefault Gateway . . . . : 192.168.1.1" },
        { label: "ping 192.168.1.10", output: "Pinging 192.168.1.10 with 32 bytes of data:\nReply from 192.168.1.70: Destination host unreachable.\nReply from 192.168.1.70: Destination host unreachable.\n\nPackets: Sent = 2, Received = 2, Lost = 0 (0% loss)" },
      ],
      answer: "Wrong subnet mask on the PC",
      distractors: ["File server is powered off", "Switch port is in the wrong VLAN", "DNS server is down"],
      explain: "The LAN is 192.168.1.0/24, but the PC has /26 (255.255.255.192), so it thinks its network is only 192.168.1.64–127. The gateway .1 and the server .10 fall outside that range, so the PC can't reach either. Set the mask back to 255.255.255.0.",
    },
  ];
}

/* ─── helpers ─── */
function shuffled<T>(items: T[]): T[] { return [...items].sort(() => Math.random() - 0.5); }

type Round = {
  scenario: Scenario;
  options: string[];
};

function buildRounds(): Round[] {
  return shuffled(buildScenarios()).map((scenario) => ({
    scenario,
    options: shuffled([scenario.answer, ...scenario.distractors]),
  }));
}

/* ─── component ─── */
export default function TroubleshootGame({ onFinish }: GameProps) {
  const [rounds] = useState(buildRounds);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(180);
  const [choice, setChoice] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());

  /* timer */
  useEffect(() => { const timer = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (seconds === 0) onFinish({ score, max: 12, seconds: 180 }); }, [seconds, onFinish, score]);

  /* keyboard */
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (choice) { if (event.key === "Enter") next(); return; }
      const n = Number(event.key);
      if (n >= 1 && n <= 4) setChoice(rounds[index].options[n - 1]);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  function next() {
    if (!choice) return;
    const round = rounds[index];
    const correct = choice === round.scenario.answer;
    const bonus = correct && revealed.size === 0 ? 1 : 0;
    const total = score + (correct ? 1 : 0) + bonus;
    if (index === 5) onFinish({ score: total, max: 12, seconds: 180 - seconds });
    else { setScore(total); setIndex(index + 1); setChoice(null); setRevealed(new Set()); }
  }

  function revealCommand(cmdIndex: number) {
    setRevealed((prev) => new Set(prev).add(cmdIndex));
  }

  const round = rounds[index];
  const { scenario, options } = round;

  return (
    <section className="lab-panel trouble-game">
      <div className="trouble-meta">
        <span>Round {index + 1} / 6</span>
        <strong aria-live="polite">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</strong>
      </div>
      <div className="trouble-progress" aria-label={`Round ${index + 1} of 6`}>
        <span style={{ width: `${(index / 6) * 100}%` }} />
      </div>
      <div className="trouble-topo">
        <TopoSvg kind={scenario.topology} />
      </div>
      <div className="trouble-complaint">{scenario.complaint}</div>
      <div className="trouble-commands">
        {scenario.commands.map((cmd, ci) => (
          <button type="button" key={cmd.label} className="trouble-cmd-btn" onClick={() => revealCommand(ci)}>
            {revealed.has(ci) ? "✓ " : "▶ "}{cmd.label}
          </button>
        ))}
      </div>
      {scenario.commands.map((cmd, ci) => revealed.has(ci) && (
        <div className="trouble-cmd-output" key={cmd.label} role="region" aria-label={`Output of ${cmd.label}`}>
          <strong style={{ color: "#00f0ff" }}>{'>'} {cmd.label}</strong>{"\n"}{cmd.output}
        </div>
      ))}
      <h2>What is the root cause?</h2>
      <div className="trouble-options">
        {options.map((option, i) => (
          <button type="button" key={`${i}-${option}`} className={`trouble-option${choice === option ? (choice === scenario.answer ? " correct" : " incorrect") : ""}`} onClick={() => !choice && setChoice(option)}>
            <span>{i + 1}</span><code>{option}</code>
          </button>
        ))}
      </div>
      {choice && (
        <div className="trouble-feedback" aria-live="polite">
          <strong>{choice === scenario.answer ? "Correct" : "Not quite"}</strong>
          {choice === scenario.answer && revealed.size === 0 && <p className="trouble-bonus">+1 bonus — diagnosed without command output!</p>}
          <p>{scenario.explain}</p>
          <button className="lab-button" onClick={next}>Continue <span aria-hidden="true">↵</span></button>
        </div>
      )}
      <p className="trouble-hint">Use keys 1–4 to answer · Reveal commands for clues (but skip them for a bonus point)</p>
    </section>
  );
}
