import { useEffect, useMemo, useRef, useState } from "react";
import "./styles/MottoBand.css";

const lines: readonly string[] = [
  "Your speed doesn't matter, forward is forward.",
  "Reliable from the device to the cloud.",
  "Learn it. Lab it. Ship it.",
  "One packet at a time.",
  "Small steps, every day.",
];

function splitLastWord(text: string): [string, string] {
  const idx = text.lastIndexOf(" ");
  if (idx === -1) return ["", text];
  return [text.slice(0, idx + 1), text.slice(idx + 1)];
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Phase = "typing" | "holding" | "deleting";
const TYPE_SPEED = 35;
const DELETE_SPEED = 15;
const HOLD_TIME = 3200;

const MottoBand = (): JSX.Element => {
  const reducedMotion = useMemo(prefersReducedMotion, []);
  const [lineIndex, setLineIndex] = useState(0);
  const [charCount, setCharCount] = useState(reducedMotion ? lines[0].length : 0);
  const [phase, setPhase] = useState<Phase>(reducedMotion ? "holding" : "typing");
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const sectionRef = useRef<HTMLElement | null>(null);
  const currentLine = lines[lineIndex];
  const displayed = currentLine.slice(0, charCount);
  const [beforeLast, lastWord] = splitLastWord(displayed);
  const [fullBefore] = splitLastWord(currentLine);
  const isInLastWord = charCount > fullBefore.length;

  useEffect(() => {
    // Hover/focus only freezes a fully typed line, so a dot click still types its line.
    if (reducedMotion || !visible || (paused && phase === "holding")) return;
    const line = lines[lineIndex];
    const delay = phase === "typing" ? TYPE_SPEED : phase === "holding" ? HOLD_TIME : DELETE_SPEED;
    const timer = setTimeout(() => {
      if (phase === "typing") {
        if (charCount < line.length) setCharCount(charCount + 1);
        else setPhase("holding");
      } else if (phase === "holding") {
        setPhase("deleting");
      } else if (charCount > 0) {
        setCharCount(charCount - 1);
      } else {
        setLineIndex((lineIndex + 1) % lines.length);
        setPhase("typing");
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [lineIndex, charCount, phase, paused, visible, reducedMotion]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const jumpTo = (idx: number) => {
    setLineIndex(idx);
    setCharCount(reducedMotion ? lines[idx].length : 0);
    setPhase(reducedMotion ? "holding" : "typing");
  };

  return (
    <section ref={sectionRef} className="motto-band" aria-label="Motto" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
    }}>
      <div className="motto-band__inner">
        <p className="motto-band__label">$ echo $MOTTO</p>
        <div className="motto-band__text-wrap" aria-hidden="true">
          <p className="motto-band__text">
            {isInLastWord ? <>{fullBefore}<span className="motto-band__text--last-word">{displayed.slice(fullBefore.length)}</span></> : beforeLast + lastWord}
            <span className="motto-band__cursor">{"\u258D"}</span>
          </p>
        </div>
        <p className="motto-band__sr-only">{currentLine}</p>
        <div className="motto-band__dots">
          {lines.map((_, i) => <button key={i} className={`motto-band__dot${i === lineIndex ? " motto-band__dot--active" : ""}`} aria-label={`Show line ${i + 1}`} aria-current={i === lineIndex ? "true" : undefined} onClick={() => jumpTo(i)} type="button" />)}
        </div>
      </div>
    </section>
  );
};

export default MottoBand;
