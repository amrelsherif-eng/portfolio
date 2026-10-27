import { Link } from "react-router-dom";
import { labGames } from "./games";
import "./lab.css";

function bestScore(id: string) {
  try { return JSON.parse(localStorage.getItem(`lab-stats-${id}`) || "null")?.best as number | undefined; } catch { return undefined; }
}

export default function LabIndex() {
  return <main className="lab-page">
    <Link className="lab-back" to="/">← Back to home</Link>
    <header className="lab-hero"><p className="lab-kicker">HANDS-ON LEARNING</p><h1>Network <span>Lab</span></h1><p>Short hands-on games from my learning path.</p></header>
    <section className="lab-grid" aria-label="Games">
      {labGames.map((game) => <Link className="lab-card" to={`/lab/${game.id}`} key={game.id}>
        <div className="lab-card-top"><span className="lab-track">{game.track}</span><span>{game.minutes} min</span></div>
        <h2>{game.title}</h2><p>{game.tagline}</p>
        <div className="lab-card-bottom"><span>Best: {bestScore(game.id) ?? "—"}</span><span>Play →</span></div>
      </Link>)}
    </section>
  </main>;
}
