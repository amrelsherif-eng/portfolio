import { announce, goToSection, openPing, openResume, scrollByPx, SectionId } from "./actions";

interface SpeechRecognitionAlternative { readonly transcript: string; readonly confidence: number }
interface SpeechRecognitionResult { readonly [index: number]: SpeechRecognitionAlternative; readonly length: number; readonly isFinal: boolean; item(index: number): SpeechRecognitionAlternative }
interface SpeechRecognitionResultList { readonly [index: number]: SpeechRecognitionResult; readonly length: number; item(index: number): SpeechRecognitionResult }
interface SpeechRecognitionEvent extends Event { readonly resultIndex: number; readonly results: SpeechRecognitionResultList }
interface SpeechRecognitionErrorEvent extends Event { readonly error: string; readonly message?: string }
interface ISpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  start(): void; stop(): void; abort(): void;
}
type SpeechRecognitionConstructor = new () => ISpeechRecognition;
interface SpeechRecognitionWindow extends Window { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }
type VoiceStatus = "listening" | "heard" | "interim" | "thinking" | "error" | "stopped";
type VoiceAction = { action: "goto" | "scroll" | "resume" | "chat" | "answer" | "none"; target?: SectionId; direction?: "up" | "down"; reply: string };
function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const win = window as unknown as SpeechRecognitionWindow;
  return win.SpeechRecognition ?? win.webkitSpeechRecognition;
}
export function isVoiceSupported(): boolean { return typeof window !== "undefined" && Boolean(getSpeechRecognition()); }

function executeCommand(transcript: string, stop: () => void): boolean {
  const t = transcript.toLowerCase().trim();
  if (t === "stop listening" || t === "stop") { announce("Stopped listening"); stop(); return true; }
  if (t === "scroll down") { scrollByPx(600); announce("Scrolling down"); return true; }
  if (t === "scroll up") { scrollByPx(-600); announce("Scrolling up"); return true; }
  if (t === "resume" || t === "open resume" || t === "cv") { openResume(); announce("Opening Resume"); return true; }
  if (t === "chat" || t === "open chat" || t === "ping") { openPing(); announce("Opening Ping"); return true; }
  const sections: Array<[string, SectionId]> = [["about", "about"], ["work", "work"], ["projects", "work"], ["stack", "techstack"], ["skills", "techstack"], ["tech", "techstack"], ["certifications", "certifications"], ["certificates", "certifications"], ["contact", "contact"], ["top", "top"], ["home", "top"]];
  for (const [word, section] of sections) if (t === word || t === `go to ${word}` || t === `show ${word}`) { goToSection(section); announce(`Going to ${section}`); return true; }
  return false;
}
function speak(reply: string, lang: "en" | "ar") {
  if (typeof window === "undefined" || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") return;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((item) => item.lang.toLowerCase().startsWith(lang));
  if (!voice) return;
  const utterance = new SpeechSynthesisUtterance(reply); utterance.voice = voice; utterance.lang = voice.lang;
  window.speechSynthesis.speak(utterance);
}
export function startVoice(onStatus: (s: VoiceStatus, text?: string) => void, lang: "en" | "ar"): () => void {
  const SpeechRec = getSpeechRecognition();
  if (!SpeechRec) { onStatus("error", "Voice recognition not supported"); return () => {}; }
  const recognition = new SpeechRec();
  recognition.continuous = true; recognition.interimResults = true; recognition.lang = lang === "ar" ? "ar-EG" : "en-US";
  let active = true, inFlight = false, speaking = false, lastTranscript = "", lastAt = 0;
  const stop = () => { if (!active) return; active = false; try { recognition.stop(); } catch {} onStatus("stopped"); };
  const start = () => { if (!active || inFlight || speaking) return; try { recognition.start(); } catch {} };
  recognition.onstart = () => { if (active && !inFlight && !speaking) onStatus("listening"); };
  recognition.onerror = (event) => { if (event.error === "no-speech") return; if (event.error === "not-allowed" || event.error === "service-not-allowed") { active = false; onStatus("error", event.error); } else if (active) onStatus("error", event.error); };
  recognition.onend = () => { if (active && !inFlight && !speaking) setTimeout(start, 150); };
  recognition.onresult = (event) => {
    if (inFlight || speaking) return;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]; const transcript = result?.[0]?.transcript?.trim();
      if (!transcript) continue;
      if (!result.isFinal) { onStatus("interim", transcript); continue; }
      const now = Date.now(); if (transcript.toLowerCase() === lastTranscript.toLowerCase() && now - lastAt < 2500) continue;
      lastTranscript = transcript; lastAt = now; onStatus("heard", transcript);
      if (executeCommand(transcript, stop)) continue;
      inFlight = true; try { recognition.stop(); } catch {} onStatus("thinking");
      void fetch("/api/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: transcript.slice(0, 300), lang }) })
        .then(async (response) => { const data = await response.json() as VoiceAction; if (!response.ok) throw new Error("voice request failed"); return data; })
        .then((data) => {
          if (!active) return;
          if (data.action === "goto" && data.target) goToSection(data.target);
          else if (data.action === "scroll") scrollByPx(data.direction === "up" ? -600 : 600);
          else if (data.action === "resume") openResume();
          else if (data.action === "chat") openPing();
          else if (data.action === "answer") window.dispatchEvent(new CustomEvent("sherif:ask", { detail: transcript }));
          announce(data.reply); speaking = true; speak(data.reply, lang);
          if (typeof window !== "undefined" && window.speechSynthesis) {
            const wait = () => { if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) { speaking = false; start(); } else setTimeout(wait, 150); };
            setTimeout(wait, 150);
          } else { speaking = false; start(); }
        })
        .catch(() => { if (active) { announce(lang === "ar" ? "حصلت مشكلة، جرّب تاني." : "Something went wrong. Please try again."); inFlight = false; start(); } })
        .finally(() => { inFlight = false; if (active && !speaking) start(); });
    }
  };
  try { recognition.start(); } catch (err) { active = false; onStatus("error", err instanceof Error ? err.message : String(err)); return () => {}; }
  return stop;
}
