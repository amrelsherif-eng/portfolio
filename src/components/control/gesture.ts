import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import "./gesture.css";
import { announce, clickAt, moveCursor, openPing, scrollByPx } from "./actions";

export type GestureStatus = "loading" | "ready" | "no-hand" | "error";

type Point = { x: number; y: number };
type Pose = "point" | "pinch" | "open palm" | "victory" | "none";

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

function fingerExtended(landmarks: Point[], tip: number, pip: number): boolean {
  return landmarks[tip].y < landmarks[pip].y;
}

function getPose(landmarks: Point[]): { pose: Pose; pinch: boolean; index: Point } {
  const index = landmarks[8];
  const palm = distance(landmarks[0], landmarks[9]);
  const pinchDistance = distance(landmarks[4], index);
  const pinch = pinchDistance < palm * 0.35;
  const indexUp = fingerExtended(landmarks, 8, 6);
  const middleUp = fingerExtended(landmarks, 12, 10);
  const ringUp = fingerExtended(landmarks, 16, 14);
  const pinkyUp = fingerExtended(landmarks, 20, 18);

  if (pinch) return { pose: "pinch", pinch, index };
  if (indexUp && middleUp && !ringUp && !pinkyUp) return { pose: "victory", pinch, index };
  if (indexUp && !middleUp && !ringUp && !pinkyUp) return { pose: "point", pinch, index };
  if (indexUp && middleUp && ringUp && pinkyUp) return { pose: "open palm", pinch, index };
  return { pose: "none", pinch, index };
}

export async function startGesture(onStatus: (s: GestureStatus, detail?: string) => void): Promise<() => void> {
  onStatus("loading");
  let stream: MediaStream | undefined;
  let landmarker: HandLandmarker | undefined;
  let frame = 0;
  let stopped = false;
  let pinchLatched = false;
  let lastClick = 0;
  let lastVictory = 0;
  let victoryStarted = 0;
  let lastScrollAnnouncement = 0;
  let lastVideoTime = -1;
  let lastHandTime = performance.now();
  let noHandSent = false;
  let stablePose: Pose = "none";
  let stableFrames = 0;
  let activePose: Pose = "none";
  let smoothX = 0;
  let smoothY = 0;
  let cursorInitialized = false;

  const wrapper = document.createElement("div");
  wrapper.className = "gesture-preview";
  wrapper.setAttribute("data-control-ui", "");
  const video = document.createElement("video");
  video.className = "gesture-preview__video";
  video.width = 160;
  video.height = 120;
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  const canvas = document.createElement("canvas");
  canvas.className = "gesture-preview__canvas";
  canvas.width = 160;
  canvas.height = 120;
  const label = document.createElement("span");
  label.className = "gesture-preview__label";
  label.textContent = "Waiting for hand";
  wrapper.append(video, canvas, label);

  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    stream?.getTracks().forEach((track) => track.stop());
    landmarker?.close();
    wrapper.remove();
  };

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
    });
    video.srcObject = stream;
    document.body.append(wrapper);
    await video.play();

    const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    try {
      landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: "/mediapipe/hand_landmarker.task", delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 1,
      });
    } catch {
      landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: "/mediapipe/hand_landmarker.task", delegate: "CPU" },
        runningMode: "VIDEO",
        numHands: 1,
      });
    }

    const ctx = canvas.getContext("2d");
    onStatus("ready");
    const tick = () => {
      if (stopped) return;
      frame = requestAnimationFrame(tick);
      if (!landmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.currentTime === lastVideoTime) {
        if (!noHandSent && performance.now() - lastHandTime >= 1500) {
          noHandSent = true;
          onStatus("no-hand");
          label.textContent = "No hand";
        }
        return;
      }
      lastVideoTime = video.currentTime;
      const result = landmarker.detectForVideo(video, performance.now());
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      const landmarks = result.landmarks[0] as Point[] | undefined;
      if (!landmarks) {
        if (!noHandSent && performance.now() - lastHandTime >= 1500) {
          noHandSent = true;
          onStatus("no-hand");
          label.textContent = "No hand";
        }
        return;
      }

      lastHandTime = performance.now();
      if (noHandSent) onStatus("ready");
      noHandSent = false;
      const { pose, index } = getPose(landmarks);
      if (pose === stablePose) stableFrames += 1;
      else { stablePose = pose; stableFrames = 1; }
      if (stableFrames >= 3) activePose = stablePose;
      label.textContent = pose === "none" ? "Hand detected" : pose;

      if (ctx) {
        ctx.fillStyle = "#00f0ff";
        for (const point of landmarks) {
          ctx.beginPath();
          ctx.arc((1 - point.x) * canvas.width, point.y * canvas.height, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Ignore the outer 15% of the camera image and mirror horizontal movement.
      const targetX = Math.min(1, Math.max(0, ((0.85 - index.x) / 0.7))) * window.innerWidth;
      const targetY = Math.min(1, Math.max(0, ((index.y - 0.15) / 0.7))) * window.innerHeight;
      if (activePose === "point" || activePose === "pinch") {
        if (!cursorInitialized) { smoothX = targetX; smoothY = targetY; cursorInitialized = true; }
        smoothX += (targetX - smoothX) * 0.35;
        smoothY += (targetY - smoothY) * 0.35;
        moveCursor(smoothX, smoothY);
      }

      const now = performance.now();
      const palm = distance(landmarks[0], landmarks[9]);
      const pinchDistance = distance(landmarks[4], index);
      if (pinchDistance > palm * 0.5) pinchLatched = false;
      if (pose === "pinch" && stableFrames >= 3 && !pinchLatched && now - lastClick >= 600) {
        pinchLatched = true;
        lastClick = now;
        clickAt(smoothX, smoothY);
        announce("Click");
      }

      if (activePose === "open palm") {
        const y = landmarks[9].y;
        const edge = y < 0.35 ? (0.35 - y) / 0.35 : y > 0.65 ? (y - 0.65) / 0.35 : 0;
        if (edge > 0) {
          scrollByPx(Math.sign(y - 0.5) * (12 + Math.min(1, edge) * 16), false);
          if (now - lastScrollAnnouncement >= 2000) {
            announce("Scrolling");
            lastScrollAnnouncement = now;
          }
        }
      }

      if (pose === "victory" && stableFrames >= 3) {
        if (victoryStarted === 0) victoryStarted = now;
        if (now - victoryStarted >= 700 && now - lastVictory >= 3000) {
          openPing();
          lastVictory = now;
          victoryStarted = 0;
        }
      } else {
        victoryStarted = 0;
      }
    };
    frame = requestAnimationFrame(tick);
    return cleanup;
  } catch (error) {
    cleanup();
    const reason = error instanceof Error ? error.message : "Unable to start hand gesture control";
    onStatus("error", reason);
    return () => undefined;
  }
}
