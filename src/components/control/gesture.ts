import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import "./gesture.css";
import { announce, clickAt, moveCursor, scrollByPx } from "./actions";

export type GestureStatus = "loading" | "ready" | "no-hand" | "error";
type Point = { x: number; y: number };
type Pose = "point" | "thumb up" | "thumb down" | "open palm" | "fist" | "other";
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
function fingerExtended(landmarks: Point[], tip: number, pip: number): boolean {
  return distance(landmarks[tip], landmarks[0]) > distance(landmarks[pip], landmarks[0]);
}
function getPose(landmarks: Point[]): { pose: Pose; index: Point; pinch: number; palm: number; fingersCurled: boolean } {
  const tips = [8, 12, 16, 20];
  const pips = [6, 10, 14, 18];
  const extended = tips.map((tip, i) => fingerExtended(landmarks, tip, pips[i]));
  const palm = distance(landmarks[0], landmarks[9]);
  const fingersCurled = extended.every((v) => !v);
  const thumbExtended = distance(landmarks[4], landmarks[5]) > 0.7 * palm;
  const pose: Pose = extended[0] && extended.slice(1).every((v) => !v) ? "point"
    : extended.every(Boolean) ? "open palm"
      : fingersCurled && thumbExtended && landmarks[4].y < landmarks[2].y - 0.3 * palm ? "thumb up"
        : fingersCurled && thumbExtended && landmarks[4].y > landmarks[2].y + 0.3 * palm ? "thumb down"
          : fingersCurled ? "fist" : "other";
  return { pose, index: landmarks[8], pinch: distance(landmarks[4], landmarks[8]), palm, fingersCurled };
}

const guideMarkup = '<strong class="gesture-guide__title">Hand gestures</strong><div class="gesture-guide__row"><span>☝</span><span>Point</span><span>move the cursor</span></div><div class="gesture-guide__row"><span>🤏</span><span>Pinch</span><span>click</span></div><div class="gesture-guide__row"><span>👍👎</span><span>Thumbs</span><span>scroll</span></div><div class="gesture-guide__row"><span>✋</span><span>Open hand</span><span>rest</span></div><button type="button">Got it</button>';
let openGuide: HTMLDivElement | undefined;
let guideKeyHandler: ((event: KeyboardEvent) => void) | undefined;

/** Show the gesture reference without loading or initializing MediaPipe. */
export function showGestureGuide(): void {
  if (openGuide?.isConnected) { openGuide.focus(); return; }
  const guide = document.createElement("div");
  guide.className = "gesture-guide";
  guide.setAttribute("data-control-ui", "");
  guide.setAttribute("data-cursor", "disable");
  guide.setAttribute("role", "dialog");
  guide.setAttribute("aria-label", "Hand gestures");
  guide.tabIndex = -1;
  guide.innerHTML = guideMarkup;
  const preview = document.querySelector<HTMLElement>(".gesture-preview");
  if (preview) {
    guide.classList.add("gesture-guide--preview");
    preview.append(guide);
  } else document.body.append(guide);
  const close = () => {
    guide.remove();
    if (openGuide === guide) openGuide = undefined;
    if (guideKeyHandler) window.removeEventListener("keydown", guideKeyHandler);
    guideKeyHandler = undefined;
    try { localStorage.setItem("handsfree-guide-seen", "1"); } catch { /* storage may be unavailable */ }
  };
  guide.querySelector("button")?.addEventListener("click", close);
  guideKeyHandler = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
  window.addEventListener("keydown", guideKeyHandler);
  openGuide = guide;
  try { localStorage.setItem("handsfree-guide-seen", "1"); } catch { /* storage may be unavailable */ }
  guide.focus();
}

class OneEuroFilter {
  private value?: number;
  private derivative = 0;
  private time?: number;
  constructor(private readonly minCutoff = 1, private readonly beta = 0.02, private readonly derivativeCutoff = 1) {}
  private alpha(cutoff: number, dt: number): number { const tau = 1 / (2 * Math.PI * cutoff); return 1 / (1 + tau / dt); }
  filter(value: number, time: number): number {
    if (this.value === undefined || this.time === undefined) { this.value = value; this.time = time; return value; }
    const dt = Math.max(0.001, (time - this.time) / 1000);
    const rawDerivative = (value - this.value) / dt;
    this.derivative += this.alpha(this.derivativeCutoff, dt) * (rawDerivative - this.derivative);
    this.value += this.alpha(this.minCutoff + this.beta * Math.abs(this.derivative), dt) * (value - this.value);
    this.time = time;
    return this.value;
  }
  reset(): void { this.value = undefined; this.time = undefined; this.derivative = 0; }
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
  let cursorX = 0;
  let cursorY = 0;
  let cursorInitialized = false;
  const filterX = new OneEuroFilter();
  const filterY = new OneEuroFilter();
  let dwellStarted = 0;
  let dwellPoint: Point | null = null;
  let dwellLatched = false;
  let pinching = false;
  let lastClick = -Infinity;
  let thumbStarted = 0;
  let thumbLastSeen = 0;
  let thumbDir = 0;
  let pinchClicked = false;
  let thumbSpeed = 0;
  const customCursor = document.querySelector<HTMLElement>(".cursor-main");
  const originalCursorVisibility = customCursor?.style.visibility ?? "";
  const dwellRadius = 28;
  const dwellDuration = 1200;

  const wrapper = document.createElement("div");
  wrapper.className = "gesture-preview";
  wrapper.setAttribute("data-control-ui", "");
  wrapper.setAttribute("data-cursor", "disable");
  const video = document.createElement("video");
  video.className = "gesture-preview__video";
  video.width = 160; video.height = 120; video.autoplay = true; video.muted = true; video.playsInline = true;
  const canvas = document.createElement("canvas");
  canvas.className = "gesture-preview__canvas"; canvas.width = 160; canvas.height = 120;
  const label = document.createElement("span");
  label.className = "gesture-preview__label";
  label.setAttribute("aria-live", "polite");
  const help = document.createElement("button");
  help.type = "button"; help.className = "gesture-preview__help"; help.textContent = "?";
  help.setAttribute("aria-label", "Show gesture guide"); help.setAttribute("data-control-ui", ""); help.setAttribute("data-cursor", "disable");
  help.addEventListener("click", showGestureGuide);
  wrapper.append(video, canvas, label, help);

  const ring = document.createElement("div");
  ring.className = "gesture-dwell-ring"; ring.setAttribute("data-control-ui", ""); ring.setAttribute("data-cursor", "disable");
  ring.innerHTML = '<svg viewBox="0 0 44 44" aria-hidden="true"><circle class="gesture-dwell-ring__track" cx="22" cy="22" r="19"/><circle class="gesture-dwell-ring__progress" cx="22" cy="22" r="19"/></svg>';
  ring.hidden = true;
  document.body.append(ring);
  const hideDwell = () => { ring.hidden = true; dwellStarted = 0; dwellPoint = null; dwellLatched = false; };
  const cleanup = () => {
    if (stopped) return;
    stopped = true; cancelAnimationFrame(frame);
    stream?.getTracks().forEach((track) => track.stop()); landmarker?.close();
    if (openGuide && wrapper.contains(openGuide)) { openGuide.classList.remove("gesture-guide--preview"); document.body.append(openGuide); }
    video.srcObject = null; wrapper.remove(); ring.remove();
    if (customCursor) customCursor.style.visibility = originalCursorVisibility;
    // A guide opened by the user is intentionally left available after stopping.
  };

  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera needs a secure page (https or localhost).");
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } }); }
    catch (first) {
      const name = first instanceof DOMException ? first.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") throw first;
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    }
    video.srcObject = stream; document.body.append(wrapper); await video.play();
    try { if (localStorage.getItem("handsfree-guide-seen") !== "1") showGestureGuide(); } catch { showGestureGuide(); }
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
        if (!noHandSent && performance.now() - lastHandTime >= 1500) { noHandSent = true; onStatus("no-hand"); label.textContent = "No hand"; hideDwell(); }
        return;
      }
      lastVideoTime = video.currentTime;
      const now = performance.now();
      const result = landmarker.detectForVideo(video, now);
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      const landmarks = result.landmarks[0] as Point[] | undefined;
      if (!landmarks) {
        if (!noHandSent && now - lastHandTime >= 1500) { noHandSent = true; onStatus("no-hand"); }
        label.textContent = "No hand"; hideDwell(); pinching = false; pinchClicked = false;
        if (customCursor) customCursor.style.visibility = "hidden";
        return;
      }
      lastHandTime = now;
      if (noHandSent) onStatus("ready"); noHandSent = false;
      const { pose, index, pinch, palm } = getPose(landmarks);
      if (ctx) { ctx.fillStyle = "#00f0ff"; for (const point of landmarks) { ctx.beginPath(); ctx.arc((1 - point.x) * canvas.width, point.y * canvas.height, 2, 0, Math.PI * 2); ctx.fill(); } }

      const pinchDistance = palm > 0 ? pinch / palm : 1;
      const pinchStarted = !pinching && pinchDistance < 0.28;
      if (pinching && pinchDistance > 0.42) { pinching = false; pinchClicked = false; }
      else if (pinchStarted && (activePose === "point" || stablePose === "point")) pinching = true;
      // Pinch from pointing is immediate; it does not wait for pose debounce.
      if (pinching && activePose === "point") {
        if (!pinchClicked && cursorInitialized && now - lastClick >= 400) { pinchClicked = true; if (clickAt(cursorX, cursorY)) announce("Click"); lastClick = now; }
        ring.hidden = false; ring.style.left = `${cursorX - 22}px`; ring.style.top = `${cursorY - 22}px`;
        ring.classList.add("is-pinching"); ring.style.setProperty("--pinch-strength", String(Math.max(0, Math.min(1, (0.42 - pinchDistance) / 0.14))));
      } else ring.classList.remove("is-pinching");

      if (!(pinching && activePose === "point")) {
        if (pose === stablePose) stableFrames += 1; else { stablePose = pose; stableFrames = 1; }
        if (stableFrames >= 4) activePose = stablePose;
      }
      const current = pinching && activePose === "point" ? "🤏 Click" : activePose === "point" ? "☝ Move" : activePose === "thumb up" ? "👍 Scroll up" : activePose === "thumb down" ? "👎 Scroll down" : activePose === "fist" ? "✊ Resting" : activePose === "open palm" ? "✋ Resting" : "No hand";
      label.textContent = current;

      // Ignore outer 15% of camera image, mirror horizontal movement, retaining current mapping.
      const targetX = Math.min(1, Math.max(0, (0.85 - index.x) / 0.7)) * window.innerWidth;
      const targetY = Math.min(1, Math.max(0, (index.y - 0.15) / 0.7)) * window.innerHeight;
      if (activePose === "point") {
        if (customCursor) customCursor.style.visibility = originalCursorVisibility;
        if (!pinching) {
          if (!cursorInitialized) { cursorX = targetX; cursorY = targetY; cursorInitialized = true; }
          cursorX = filterX.filter(targetX, now); cursorY = filterY.filter(targetY, now);
          moveCursor(cursorX, cursorY);
          const hit = document.elementFromPoint(cursorX, cursorY);
          const target = hit?.closest<HTMLElement>("a, button, [role='button'], input, summary, [tabindex]");
          const clickable = !!target && !target.closest("[data-control-ui]");
          if (!clickable) { dwellStarted = 0; ring.hidden = true; dwellPoint = null; }
          else if (!dwellPoint || distance({ x: cursorX, y: cursorY }, dwellPoint) > dwellRadius) { dwellStarted = now; dwellPoint = { x: cursorX, y: cursorY }; dwellLatched = false; }
          if (clickable && !dwellLatched && dwellPoint) {
            const progress = Math.min(1, (now - dwellStarted) / dwellDuration);
            ring.hidden = false; ring.style.left = `${cursorX - 22}px`; ring.style.top = `${cursorY - 22}px`;
            ring.style.setProperty("--dwell-progress", String(progress));
            if (progress >= 1 && clickAt(cursorX, cursorY)) { dwellLatched = true; ring.hidden = true; announce("Click"); }
          }
        }
        thumbStarted = 0; thumbSpeed = 0;
      } else if (activePose === "thumb up" || activePose === "thumb down") {
        const dir = activePose === "thumb up" ? -1 : 1;
        if (dir !== thumbDir || now - thumbLastSeen > 250) { thumbStarted = 0; thumbSpeed = 0; thumbDir = dir; }
        thumbLastSeen = now;
        if (customCursor) customCursor.style.visibility = "hidden";
        hideDwell();
        if (!thumbStarted) thumbStarted = now;
        // 9 px/frame at first, easing toward 22 px/frame after holding 1.5 s.
        const target = 9 + 13 * Math.min(1, Math.max(0, (now - thumbStarted - 1500) / 1000));
        thumbSpeed += (target - thumbSpeed) * 0.15;
        scrollByPx(dir * thumbSpeed, false);
      } else {
        if (customCursor) customCursor.style.visibility = "hidden";
        hideDwell();
        if (activePose === "open palm") { pinching = false; cursorInitialized = false; filterX.reset(); filterY.reset(); }
      }
    };
    frame = requestAnimationFrame(tick);
    return cleanup;
  } catch (error) {
    cleanup();
    const name = error instanceof DOMException ? error.name : "";
    const reason = name === "NotAllowedError" || name === "SecurityError" ? "Camera blocked. Click the camera icon in the address bar, allow it, then try again."
      : name === "NotFoundError" || name === "OverconstrainedError" ? "No camera found on this device."
      : name === "NotReadableError" || name === "AbortError" ? "Camera is busy in another app (Zoom, Teams, Camera). Close it and try again."
      : error instanceof Error ? error.message : "Unable to start hand gesture control";
    onStatus("error", reason); return () => undefined;
  }
}
