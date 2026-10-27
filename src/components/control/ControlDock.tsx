import { useEffect, useMemo, useRef, useState } from "react";
import { isVoiceSupported, startVoice } from "./voice";
import "../styles/ControlDock.css";

export default function ControlDock() {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(min-width: 1025px) and (pointer: fine)").matches;
  });

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [gestureActive, setGestureActive] = useState<boolean>(false);
  const [gestureStatus, setGestureStatus] = useState<string>("");
  const [voiceActive, setVoiceActive] = useState<boolean>(false);
  const [voiceLang, setVoiceLang] = useState<"en" | "ar">("en");
  const [voiceStatus, setVoiceStatus] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const stopGestureRef = useRef<(() => void) | null>(null);
  const stopVoiceRef = useRef<(() => void) | null>(null);
  const gestureWantedRef = useRef<boolean>(false);
  const panelRef = useRef<HTMLElement>(null);

  const voiceSupported = useMemo(() => isVoiceSupported(), []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(min-width: 1025px) and (pointer: fine)");
    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onAnnounce = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent && typeof customEvent.detail === "string") {
        setToastMessage(customEvent.detail);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          setToastMessage(null);
        }, 1600);
      }
    };
    window.addEventListener("control:announce", onAnnounce);
    return () => {
      window.removeEventListener("control:announce", onAnnounce);
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      gestureWantedRef.current = false;
      if (stopGestureRef.current) {
        stopGestureRef.current();
        stopGestureRef.current = null;
      }
      if (stopVoiceRef.current) {
        stopVoiceRef.current();
        stopVoiceRef.current = null;
      }
    };
  }, []);

  const toggleGesture = async () => {
    if (gestureActive) {
      gestureWantedRef.current = false;
      if (stopGestureRef.current) {
        stopGestureRef.current();
        stopGestureRef.current = null;
      }
      setGestureActive(false);
      setGestureStatus("");
    } else {
      gestureWantedRef.current = true;
      setGestureActive(true);
      setGestureStatus("loading");
      try {
        const { startGesture } = await import("./gesture");
        if (!gestureWantedRef.current) return;
        const stop = await startGesture((status, detail) => {
          if (!gestureWantedRef.current) return;
          setGestureStatus(detail ? `${status}: ${detail}` : status);
          if (status === "error") {
            gestureWantedRef.current = false;
            setGestureActive(false);
          }
        });
        if (!gestureWantedRef.current) {
          stop();
        } else {
          stopGestureRef.current = stop;
        }
      } catch {
        if (gestureWantedRef.current) {
          setGestureStatus("error");
        }
      }
    }
  };

  const beginVoice = (lang: "en" | "ar") => {
    setVoiceActive(true);
    setVoiceStatus("Listening…");
    const stop = startVoice((status, text) => {
      if (status === "listening") setVoiceStatus("Listening…");
      else if (status === "heard") setVoiceStatus(text ? `“${text}”` : "");
      else if (status === "thinking") setVoiceStatus("Thinking…");
      else if (status === "error") { setVoiceStatus(text || "Something went wrong. Please try again."); setVoiceActive(false); }
      else if (status === "stopped") setVoiceActive(false);
    }, lang);
    stopVoiceRef.current = stop;
  };
  const toggleVoice = () => {
    if (voiceActive) {
      if (stopVoiceRef.current) {
        stopVoiceRef.current();
        stopVoiceRef.current = null;
      }
      setVoiceActive(false);
      setVoiceStatus("");
    } else {
      try {
        beginVoice(voiceLang);
      } catch {
        setVoiceStatus("Microphone unavailable. Please try again.");
        setVoiceActive(false);
      }
    }
  };

  if (!isDesktop) return null;

  const isAnyActive = gestureActive || voiceActive;
  const isThinking = voiceActive && voiceStatus.toLowerCase().includes("thinking");
  const isListening = voiceActive && !isThinking;
  const isIdle = !gestureActive && !voiceActive && !gestureStatus && !voiceStatus;

  const statusText = useMemo(() => {
    if (voiceStatus) return voiceStatus;
    if (gestureStatus) return gestureStatus;
    if (voiceActive) return "Listening…";
    if (gestureActive) return "Gestures active";
    return voiceLang === "ar" ? 'جرّب: "وريني مشاريعه"' : 'Try: "show me his projects"';
  }, [voiceStatus, gestureStatus, voiceActive, gestureActive, voiceLang]);

  return (
    <>
      {toastMessage && (
        <div
          className={`control-dock-toast ${isOpen ? "is-panel-open" : ""}`}
          role="status"
          aria-live="polite"
          data-control-ui=""
          data-cursor="disable"
        >
          {toastMessage}
        </div>
      )}

      <button
        type="button"
        className={`control-dock-launcher ${isAnyActive ? "is-active" : ""}`}
        aria-label="Hands-free mode"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        data-control-ui=""
        data-cursor="disable"
      >
        <span className="sherif-pulse" aria-hidden="true" />
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          data-control-ui=""
          data-cursor="disable"
        >
          <path d="M18 11V6a2 2 0 0 0-4 0v4" data-control-ui="" data-cursor="disable" />
          <path d="M14 10V4a2 2 0 0 0-4 0v6" data-control-ui="" data-cursor="disable" />
          <path d="M10 10.5V6a2 2 0 0 0-4 0v8" data-control-ui="" data-cursor="disable" />
          <path
            d="M6 14v-1.5a1.5 1.5 0 0 0-3 0v4.5a7 7 0 0 0 7 7h3a7 7 0 0 0 7-7v-5a2 2 0 0 0-4 0v2"
            data-control-ui=""
            data-cursor="disable"
          />
        </svg>
        {isAnyActive && <span className="control-dock-active-dot" data-control-ui="" data-cursor="disable" />}
      </button>

      {isOpen && (
        <section
          className="control-dock-panel"
          ref={panelRef}
          role="dialog"
          aria-label="Hands-free controls"
          data-control-ui=""
          data-cursor="disable"
        >
          <header className="control-dock-header" data-control-ui="" data-cursor="disable">
            <span className="control-dock-title" data-control-ui="" data-cursor="disable">
              hands-free
            </span>
            <div className="control-dock-header-actions" data-control-ui="" data-cursor="disable">
              <div
                className="control-dock-language"
                role="group"
                aria-label="Voice language"
                data-control-ui=""
              >
                <button
                  type="button"
                  aria-pressed={voiceLang === "en"}
                  onClick={() => setVoiceLang("en")}
                  data-control-ui=""
                  data-cursor="disable"
                >
                  EN
                </button>
                <button
                  type="button"
                  aria-pressed={voiceLang === "ar"}
                  onClick={() => setVoiceLang("ar")}
                  data-control-ui=""
                  data-cursor="disable"
                >
                  عربي
                </button>
              </div>
              <button
                type="button"
                className="control-dock-close"
                aria-label="Close hands-free controls"
                onClick={() => setIsOpen(false)}
                data-control-ui=""
                data-cursor="disable"
              >
                ×
              </button>
            </div>
          </header>

          <div className="control-dock-tiles" data-control-ui="" data-cursor="disable">
            <button
              type="button"
              role="switch"
              aria-checked={gestureActive}
              aria-label="Toggle hand gestures"
              className={`control-dock-tile ${gestureActive ? "is-active" : ""}`}
              onClick={() => void toggleGesture()}
              data-control-ui=""
              data-cursor="disable"
            >
              <div className="control-dock-tile-icon" aria-hidden="true" data-control-ui="" data-cursor="disable">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  data-control-ui=""
                  data-cursor="disable"
                >
                  <path d="M18 11V6a2 2 0 0 0-4 0v4" data-control-ui="" data-cursor="disable" />
                  <path d="M14 10V4a2 2 0 0 0-4 0v6" data-control-ui="" data-cursor="disable" />
                  <path d="M10 10.5V6a2 2 0 0 0-4 0v8" data-control-ui="" data-cursor="disable" />
                  <path
                    d="M6 14v-1.5a1.5 1.5 0 0 0-3 0v4.5a7 7 0 0 0 7 7h3a7 7 0 0 0 7-7v-5a2 2 0 0 0-4 0v2"
                    data-control-ui=""
                    data-cursor="disable"
                  />
                </svg>
              </div>
              <span className="control-dock-tile-title" data-control-ui="" data-cursor="disable">
                Gestures
              </span>
              <span className="control-dock-tile-sub" data-control-ui="" data-cursor="disable">
                ☝ move · 🤏 click · 👍👎 scroll · ✋ rest
              </span>
            </button>

            <button
              type="button"
              aria-label="Tap to talk"
              className={`control-dock-tile control-dock-voice-tile ${voiceActive ? "is-active is-voice-active" : ""}`}
              onClick={toggleVoice}
              data-voice-supported={voiceSupported}
              data-control-ui=""
              data-cursor="disable"
            >
              <div className="control-dock-tile-icon" aria-hidden="true" data-control-ui="" data-cursor="disable">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ display: isThinking ? "none" : "block" }}
                  data-control-ui=""
                  data-cursor="disable"
                >
                  <rect x="9" y="2" width="6" height="12" rx="3" data-control-ui="" data-cursor="disable" />
                  <path d="M5 10v2a7 7 0 0 0 14 0v-2" data-control-ui="" data-cursor="disable" />
                  <line x1="12" y1="19" x2="12" y2="22" data-control-ui="" data-cursor="disable" />
                  <line x1="8" y1="22" x2="16" y2="22" data-control-ui="" data-cursor="disable" />
                </svg>
                {isListening && <span className="control-dock-pulse-ring" data-control-ui="" data-cursor="disable" />}
                {isThinking && (
                  <span className="control-dock-thinking-dots" data-control-ui="" data-cursor="disable">
                    <span />
                    <span />
                    <span />
                  </span>
                )}
              </div>
              <span className="control-dock-tile-title" data-control-ui="" data-cursor="disable">
                Voice
              </span>
              <span className="control-dock-tile-sub" data-control-ui="" data-cursor="disable">
                Tap and speak
              </span>
            </button>
          </div>

          <button
            type="button"
            className="control-dock-guide-button"
            onClick={() => void import("./gesture").then(({ showGestureGuide }) => showGestureGuide())}
            data-control-ui=""
            data-cursor="disable"
          >
            How it works
          </button>

          <div
            className={`control-dock-status-line ${isIdle ? "is-hint" : ""}`}
            title={statusText}
            aria-live="polite"
            dir="auto"
            data-control-ui=""
            data-cursor="disable"
          >
            {statusText}
          </div>
        </section>
      )}
    </>
  );
}
