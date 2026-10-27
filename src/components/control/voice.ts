import { announce, goToSection, openPing, openResume, scrollByPx, SectionId } from "./actions";

type VoiceStatus = "listening" | "heard" | "thinking" | "error" | "stopped";
type VoiceAction = { action: "goto" | "scroll" | "resume" | "chat" | "answer" | "none"; target?: SectionId; direction?: "up" | "down"; reply: string; transcript: string };
export function isVoiceSupported(): boolean { return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined"; }
function executeCommand(transcript: string): boolean {
  const t = transcript.toLowerCase().trim();
  if (t === "scroll down") { scrollByPx(600); announce("Scrolling down"); return true; }
  if (t === "scroll up") { scrollByPx(-600); announce("Scrolling up"); return true; }
  if (["resume", "open resume", "cv"].includes(t)) { openResume(); announce("Opening Resume"); return true; }
  if (["chat", "open chat", "ping"].includes(t)) { openPing(); announce("Opening Ping"); return true; }
  const sections: Array<[string, SectionId]> = [["about", "about"], ["work", "work"], ["projects", "work"], ["stack", "techstack"], ["skills", "techstack"], ["tech", "techstack"], ["certifications", "certifications"], ["certificates", "certifications"], ["contact", "contact"], ["top", "top"], ["home", "top"]];
  for (const [word, section] of sections) if (t === word || t === `go to ${word}` || t === `show ${word}`) { goToSection(section); announce(`Going to ${section}`); return true; }
  return false;
}
function speak(reply: string, lang: "en" | "ar") {
  if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") return;
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith(lang));
  if (!voice) return;
  const utterance = new SpeechSynthesisUtterance(reply); utterance.voice = voice; utterance.lang = voice.lang; window.speechSynthesis.speak(utterance);
}
export function startVoice(onStatus: (s: VoiceStatus, text?: string) => void, lang: "en" | "ar"): () => void {
  let stream: MediaStream | undefined, recorder: MediaRecorder | undefined, context: AudioContext | undefined, raf = 0, silenceSince = 0, speechDetected = false, stopped = false, chunks: Blob[] = [];
  let maxTimer: ReturnType<typeof setTimeout> | undefined;
  const cleanup = () => { if (maxTimer) clearTimeout(maxTimer); if (raf) cancelAnimationFrame(raf); if (recorder && recorder.state !== "inactive") recorder.stop(); stream?.getTracks().forEach((track) => track.stop()); void context?.close(); };
  const stop = () => { if (stopped) return; stopped = true; cleanup(); onStatus("stopped"); };
  const finish = () => { if (stopped || !recorder || recorder.state === "inactive") return; stopped = true; if (maxTimer) clearTimeout(maxTimer); cancelAnimationFrame(raf); recorder.stop(); };
  const sendAudio = async (blob: Blob) => {
    cleanup();
    if (!blob.size) { onStatus("error", "No audio captured. Please try again."); return; }
    onStatus("thinking");
    try {
      const audio = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("Unable to read recording")); reader.onload = () => resolve(String(reader.result).split(",")[1] || ""); reader.readAsDataURL(blob); });
      const response = await fetch("/api/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audio, mime: blob.type || "audio/webm", lang }) });
      const data = await response.json() as VoiceAction; if (response.status === 429) { onStatus("error", data.reply); return; } if (!response.ok) throw new Error("Voice request failed");
      const transcript = data.transcript || ""; onStatus("heard", transcript);
      if (!executeCommand(transcript)) {
        if (data.action === "goto" && data.target) goToSection(data.target);
        else if (data.action === "scroll") scrollByPx(data.direction === "up" ? -600 : 600);
        else if (data.action === "resume") openResume(); else if (data.action === "chat") openPing();
        else if (data.action === "answer") window.dispatchEvent(new CustomEvent("sherif:ask", { detail: transcript }));
        announce(data.reply); speak(data.reply, lang);
      }
      setTimeout(() => onStatus("stopped"), 1800);
    } catch { onStatus("error", lang === "ar" ? "حصلت مشكلة، جرّب تاني." : "Something went wrong. Please try again."); }
  };
  void (async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (stopped) { stream.getTracks().forEach((track) => track.stop()); return; }
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : undefined;
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => { const blob = new Blob(chunks, { type: recorder?.mimeType || "audio/webm" }); void sendAudio(blob); };
      context = new AudioContext(); const analyser = context.createAnalyser(); analyser.fftSize = 1024; context.createMediaStreamSource(stream).connect(analyser); const samples = new Float32Array(analyser.fftSize);
      const monitor = () => { if (stopped) return; analyser.getFloatTimeDomainData(samples); let sum = 0; for (const value of samples) sum += value * value; const rms = Math.sqrt(sum / samples.length); const now = performance.now(); if (rms > 0.02) { speechDetected = true; silenceSince = 0; } else if (speechDetected) { if (!silenceSince) silenceSince = now; else if (now - silenceSince >= 1200) { finish(); return; } } raf = requestAnimationFrame(monitor); };
      recorder.start(); onStatus("listening"); raf = requestAnimationFrame(monitor); maxTimer = setTimeout(finish, 7000);
    } catch (error) { stopped = true; cleanup(); const denied = error instanceof DOMException && error.name === "NotAllowedError"; onStatus("error", denied ? "Microphone permission denied. Allow mic access and try again." : "Microphone unavailable. Please try again."); }
  })();
  return stop;
}
