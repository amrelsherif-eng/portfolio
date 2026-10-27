import { useEffect, useState } from "react";
import type { GameProps } from "../../types";
import { makeQuestion } from "./questions";
import "./subnetting.css";


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
