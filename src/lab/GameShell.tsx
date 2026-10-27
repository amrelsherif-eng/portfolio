import { Suspense, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { labGames } from "./games";
import type { GameProps } from "./types";
import "./lab.css";
import SherifChat from "../components/SherifChat";

type Stats = { best: number; attempts: number };
const count = (v: unknown) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 1000000 ? (v as number) : 0);
function readStats(id: string): Stats { try { const raw = JSON.parse(localStorage.getItem(`lab-stats-${id}`) || "null") as { best?: unknown; attempts?: unknown } | null; return { best: count(raw?.best), attempts: count(raw?.attempts) }; } catch { return { best: 0, attempts: 0 }; } }

export default function GameShell() {
  const { id = "" } = useParams();
  const game = labGames.find((item) => item.id === id);
  const [stage, setStage] = useState<"intro" | "game" | "result">("intro");
  const [result, setResult] = useState<{ score: number; max: number; seconds: number } | null>(null);
  const [stats, setStats] = useState<Stats>(() => readStats(id));
  const [toast, setToast] = useState("");
  if (!game) return <main className="lab-page"><Link to="/lab">← Back to Network Lab</Link><h1>Game not found</h1></main>;
  const Game = game.component as React.LazyExoticComponent<React.ComponentType<GameProps>>;
  const finish: GameProps["onFinish"] = (outcome) => {
    setResult(outcome);
    const old = readStats(game.id);
    const next = { best: Math.max(old.best, outcome.score), attempts: old.attempts + 1 };
    localStorage.setItem(`lab-stats-${game.id}`, JSON.stringify(next));
    setStats(next);
    setStage("result");
  };
  const share = async () => {
    if (!result) return;
    const text = `I scored ${result.score}/${result.max} on ${game.title} in Amr Elsherif's Network Lab: ${window.location.href}`;
    try {
      if (navigator.share) await navigator.share({ title: game.title, text, url: window.location.href });
      else { await navigator.clipboard.writeText(text); setToast("Score copied to clipboard"); window.setTimeout(() => setToast(""), 2500); }
    } catch { setToast("Could not share score"); window.setTimeout(() => setToast(""), 2500); }
  };
  return <main className="lab-page lab-shell">
    <header className="lab-shell-head"><Link className="lab-back" to="/lab">← Network Lab</Link><span className="lab-track">{game.track}</span></header>
    <h1 className="lab-game-title">{game.title}</h1>
    {stage === "intro" && <section className="lab-panel"><p className="lab-kicker">{game.minutes} MINUTE GAME</p><h2>What you’ll do</h2><p>{game.tagline} Answer ten quick questions before the timer runs out.</p><button className="lab-button" onClick={() => setStage("game")}>Start game</button></section>}
    {stage === "game" && <Suspense fallback={<div className="lab-panel" role="status">Loading game…</div>}><Game onFinish={finish} /></Suspense>}
    {stage === "result" && result && <section className="lab-panel"><p className="lab-kicker">SESSION COMPLETE</p><h2>{result.score} / {result.max}</h2><p>Time: {result.seconds}s · Best: {stats.best} · Attempts: {stats.attempts}</p><div className="lab-actions"><button className="lab-button" onClick={() => { setResult(null); setStage("game"); }}>Play again</button><button className="lab-button lab-button-secondary" onClick={share}>Share score</button><button className="lab-button lab-button-secondary" onClick={() => window.dispatchEvent(new CustomEvent("sherif:ask", { detail: `Explain the ${game.title} game and the networking idea behind it` }))}>Ask Ping to explain</button></div>{toast && <p role="status" className="lab-toast">{toast}</p>}</section>}
  <SherifChat /></main>;
}
