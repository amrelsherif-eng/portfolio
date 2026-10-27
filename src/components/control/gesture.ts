import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import "./gesture.css";
import { announce, clickAt, goToSection, moveCursor } from "./actions";

export type GestureStatus = "loading" | "ready" | "no-hand" | "error";

type Point = { x: number; y: number };
type Pose = "point" | "open palm";
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
function fingerExtended(landmarks: Point[], tip: number, pip: number): boolean {
  const wrist = landmarks[0];
  return distance(landmarks[tip], wrist) > distance(landmarks[pip], wrist);
}
function getPose(landmarks: Point[]): { pose: Pose; index: Point } {
  const index = landmarks[8];
  const open = [8, 12, 16, 20].every((tip, i) => fingerExtended(landmarks, tip, [6, 10, 14, 18][i]));
  return { pose: open ? "open palm" : "point", index };
}

export async function startGesture(onStatus: (s: GestureStatus, detail?: string) => void): Promise<() => void> {
  onStatus("loading");
  let stream: MediaStream | undefined;
  let landmarker: HandLandmarker | undefined;
  let frame = 0;
  let stopped = false;
  let lastVideoTime = -1;
  let lastHandTime = performance.now();
  let noHandSent = false;
  let stablePose: Pose | null = null;
  let stableFrames = 0;
  let activePose: Pose | null = null;
  let smoothX = 0;
  let smoothY = 0;
  let cursorInitialized = false;
  let dwellStarted = 0;
  let dwellPoint: Point | null = null;
  let dwellLatched = false;
  let flickOrigin: { y: number; at: number } | null = null;
  let lastJump = -Infinity;
  const dwellRadius = 28;
  const dwellDuration = 900;
  const sections = ["top", "about", "work", "techstack", "certifications", "contact"] as const;

  const wrapper = document.createElement("div");
  wrapper.className = "gesture-preview";
  wrapper.setAttribute("data-control-ui", "");
  const video = document.createElement("video");
  video.className = "gesture-preview__video";
  video.width = 160; video.height = 120; video.autoplay = true; video.muted = true; video.playsInline = true;
  const canvas = document.createElement("canvas");
  canvas.className = "gesture-preview__canvas"; canvas.width = 160; canvas.height = 120;
  const label = document.createElement("span");
  label.className = "gesture-preview__label"; label.textContent = "Waiting for hand";
  wrapper.append(video, canvas, label);

  const ring = document.createElement("div");
  ring.className = "gesture-dwell-ring"; ring.setAttribute("data-control-ui", "");
  ring.innerHTML = '<svg viewBox="0 0 44 44" aria-hidden="true"><circle class="gesture-dwell-ring__track" cx="22" cy="22" r="19"/><circle class="gesture-dwell-ring__progress" cx="22" cy="22" r="19"/></svg>';
  ring.hidden = true;
  document.body.append(ring);

  let guideTimer: ReturnType<typeof setTimeout> | undefined;
  let guide: HTMLDivElement | undefined;
  try {
    if (localStorage.getItem("handsfree-guide-seen") !== "1") {
      guide = document.createElement("div");
      guide.className = "gesture-guide"; guide.setAttribute("data-control-ui", "");
      guide.innerHTML = '<div>☝ Point to move — hold still on a button to click</div><div>✋ Flick your open hand up / down to change section</div><button type="button">Got it</button>';
      const dismiss = () => { if (!guide) return; guide.remove(); guide = undefined; try { localStorage.setItem("handsfree-guide-seen", "1"); } catch { /* storage may be unavailable */ } };
      guide.querySelector("button")?.addEventListener("click", dismiss);
      wrapper.append(guide);
      guideTimer = setTimeout(() => { guide?.remove(); guide = undefined; }, 12000);
    }
  } catch { /* storage may be unavailable */ }

  const cleanup = () => {
    if (stopped) return;
    stopped = true; cancelAnimationFrame(frame); if (guideTimer) clearTimeout(guideTimer);
    stream?.getTracks().forEach((track) => track.stop()); landmarker?.close(); wrapper.remove(); ring.remove(); guide?.remove();
  };

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } });
    video.srcObject = stream; document.body.append(wrapper); await video.play();
    const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    try {
      landmarker = await HandLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: "/mediapipe/hand_landmarker.task", delegate: "GPU" }, runningMode: "VIDEO", numHands: 1 });
    } catch {
      landmarker = await HandLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: "/mediapipe/hand_landmarker.task", delegate: "CPU" }, runningMode: "VIDEO", numHands: 1 });
    }
    const ctx = canvas.getContext("2d");
    onStatus("ready");
    const tick = () => {
      if (stopped) return;
      frame = requestAnimationFrame(tick);
      if (!landmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.currentTime === lastVideoTime) {
        if (!noHandSent && performance.now() - lastHandTime >= 1500) { noHandSent = true; onStatus("no-hand"); label.textContent = "No hand"; }
        return;
      }
      lastVideoTime = video.currentTime;
      const result = landmarker.detectForVideo(video, performance.now());
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      const landmarks = result.landmarks[0] as Point[] | undefined;
      if (!landmarks) {
        if (!noHandSent && performance.now() - lastHandTime >= 1500) { noHandSent = true; onStatus("no-hand"); label.textContent = "No hand"; }
        return;
      }
      lastHandTime = performance.now();
      if (noHandSent) onStatus("ready"); noHandSent = false;
      const { pose, index } = getPose(landmarks);
      if (pose === stablePose) stableFrames += 1; else { stablePose = pose; stableFrames = 1; }
      if (stableFrames >= 3) activePose = stablePose;
      label.textContent = pose;
      if (ctx) { ctx.fillStyle = "#00f0ff"; for (const point of landmarks) { ctx.beginPath(); ctx.arc((1 - point.x) * canvas.width, point.y * canvas.height, 2, 0, Math.PI * 2); ctx.fill(); } }

      // Ignore outer 15% of camera image, mirror horizontal movement, and retain the central 70% mapping.
      const targetX = Math.min(1, Math.max(0, (0.85 - index.x) / 0.7)) * window.innerWidth;
      const targetY = Math.min(1, Math.max(0, (index.y - 0.15) / 0.7)) * window.innerHeight;
      if (activePose === "point") {
        if (!cursorInitialized) { smoothX = targetX; smoothY = targetY; cursorInitialized = true; }
        smoothX += (targetX - smoothX) * 0.35; smoothY += (targetY - smoothY) * 0.35;
        moveCursor(smoothX, smoothY);
        const hit = document.elementFromPoint(smoothX, smoothY);
        const target = hit?.closest<HTMLElement>("a, button, [role='button'], input, summary, [tabindex]");
        const clickable = !!target && !target.closest("[data-control-ui]");
        const now = performance.now();
        if (!clickable) { dwellStarted = 0; ring.hidden = true; if (!dwellLatched) dwellPoint = null; }
        else if (dwellLatched) {
          if (!dwellPoint || distance({ x: smoothX, y: smoothY }, dwellPoint) > dwellRadius) { dwellLatched = false; dwellStarted = now; dwellPoint = { x: smoothX, y: smoothY }; }
        } else if (!dwellPoint || distance({ x: smoothX, y: smoothY }, dwellPoint) > dwellRadius) {
          dwellStarted = now; dwellPoint = { x: smoothX, y: smoothY };
        }
        if (clickable && !dwellLatched && dwellPoint) {
          const progress = Math.min(1, (now - dwellStarted) / dwellDuration);
          ring.hidden = false; ring.style.left = `${smoothX - 22}px`; ring.style.top = `${smoothY - 22}px`;
          ring.style.setProperty("--dwell-progress", String(progress));
          if (progress >= 1 && clickAt(smoothX, smoothY)) { dwellLatched = true; ring.hidden = true; announce("Click"); }
        }
      } else {
        ring.hidden = true; dwellStarted = 0; dwellPoint = null; dwellLatched = false;
      }

      const now = performance.now();
      if (activePose === "open palm") {
        const y = landmarks[9].y;
        if (!flickOrigin || now - flickOrigin.at > 400) flickOrigin = { y, at: now };
        else if (now - lastJump >= 1200 && Math.abs(y - flickOrigin.y) > 0.18) {
          const currentY = window.innerHeight * 0.4;
          const currentIndex = sections.reduce((found, section, i) => {
            const el = document.querySelector<HTMLElement>(section === "top" ? "#landingDiv" : `#${section}`);
            return el && el.getBoundingClientRect().top <= currentY ? i : found;
          }, 0);
          const destination = Math.max(0, Math.min(sections.length - 1, currentIndex + (y < flickOrigin.y ? -1 : 1)));
          if (destination !== currentIndex && goToSection(sections[destination])) {
            lastJump = now;
            const names: Record<(typeof sections)[number], string> = { top: "Top", about: "About", work: "Work", techstack: "Tech Stack", certifications: "Certifications", contact: "Contact" };
            announce(names[sections[destination]]);
          }
          flickOrigin = { y, at: now };
        }
      } else flickOrigin = null;
    };
    frame = requestAnimationFrame(tick);
    return cleanup;
  } catch (error) {
    cleanup();
    const reason = error instanceof Error ? error.message : "Unable to start hand gesture control";
    onStatus("error", reason); return () => undefined;
  }
}
