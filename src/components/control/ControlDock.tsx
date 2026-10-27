import { useEffect, useMemo, useRef, useState } from "react";
import { isVoiceSupported, startVoice } from "./voice";
import "./ControlDock.css";

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
  const [voicePhase, setVoicePhase] = useState<
    "idle" | "listening" | "thinking" | "heard" | "replied" | "error"
  >("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [reply, setReply] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const stopGestureRef = useRef<(() => void) | null>(null);
  const gestureAbortRef = useRef<AbortController | null>(null);
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
      gestureAbortRef.current?.abort();
      gestureAbortRef.current = null;
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
      gestureAbortRef.current?.abort();
      gestureAbortRef.current = null;
      if (stopGestureRef.current) {
        stopGestureRef.current();
        stopGestureRef.current = null;
      }
      setGestureActive(false);
      setGestureStatus("");
    } else {
      gestureWantedRef.current = true;
      const abortController = new AbortController();
      gestureAbortRef.current = abortController;
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
            if (voicePhase === "idle") {
              setErrorMessage(
                detail || (voiceLang === "ar" ? "الكاميرا غير متاحة." : "Camera unavailable. Please check permissions.")
              );
              setVoicePhase("error");
            }
          }
        }, abortController.signal);
        if (!gestureWantedRef.current) {
          stop();
        } else {
          stopGestureRef.current = stop;
        }
      } catch {
        if (gestureWantedRef.current) {
          setGestureStatus("error");
          setGestureActive(false);
          if (voicePhase === "idle") {
            setErrorMessage(
              voiceLang === "ar" ? "الكاميرا غير متاحة." : "Camera unavailable. Please check permissions."
            );
            setVoicePhase("error");
          }
        }
      }
    }
  };

  const beginVoice = (lang: "en" | "ar") => {
    setVoiceActive(true);
    setVoicePhase("listening");
    setTranscript("");
    setReply("");
    setErrorMessage("");

    const stop = startVoice((status, text) => {
      const s = status as string;
      if (s === "listening") {
        setVoicePhase("listening");
      } else if (s === "thinking") {
        setVoicePhase("thinking");
      } else if (s === "heard") {
        setTranscript(text || "");
        setVoicePhase("heard");
      } else if (s === "replied") {
        setReply(text || "");
        setVoicePhase("replied");
      } else if (s === "error") {
        setErrorMessage(
          text || (lang === "ar" ? "حصلت مشكلة، جرّب تاني." : "Something went wrong. Please try again.")
        );
        setVoicePhase("error");
        setVoiceActive(false);
      } else if (s === "stopped") {
        setVoiceActive(false);
      }
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
      if (voicePhase === "listening" || voicePhase === "thinking") {
        setVoicePhase("idle");
      }
    } else {
      try {
        beginVoice(voiceLang);
      } catch {
        setErrorMessage(
          voiceLang === "ar" ? "الميكروفون غير متاح." : "Microphone unavailable. Please try again."
        );
        setVoicePhase("error");
        setVoiceActive(false);
      }
    }
  };

  // Ensure all hooks are invoked before any early return (Rules of Hooks)
  if (!isDesktop) return null;

  const isAnyActive = gestureActive || voiceActive;
  const isThinking = voiceActive && voicePhase === "thinking";
  const isListening = voiceActive && voicePhase === "listening";

  const renderConsoleContent = () => {
    if (voicePhase === "listening") {
      return (
        <>
          <div
            className="control-dock-console-line control-dock-console-dim"
            dir="auto"
            data-control-ui=""
            data-cursor="disable"
          >
            <span data-control-ui="" data-cursor="disable">{"> listening…"}</span>
            <span className="control-dock-cursor" aria-hidden="true" data-control-ui="" data-cursor="disable" />
          </div>
          <div
            className="control-dock-console-line"
            dir="auto"
            aria-hidden="true"
            data-control-ui=""
            data-cursor="disable"
          >
            {"\u00A0"}
          </div>
        </>
      );
    }

    if (voicePhase === "thinking") {
      return (
        <>
          <div
            className="control-dock-console-line control-dock-console-dim"
            dir="auto"
            data-control-ui=""
            data-cursor="disable"
          >
            {"> thinking…"}
          </div>
          <div
            className="control-dock-console-line"
            dir="auto"
            aria-hidden="true"
            data-control-ui=""
            data-cursor="disable"
          >
            {"\u00A0"}
          </div>
        </>
      );
    }

    if (voicePhase === "heard") {
      const formattedTranscript = transcript
        ? transcript.startsWith('"') || transcript.startsWith("“")
          ? transcript
          : `"${transcript}"`
        : "";
      return (
        <>
          <div
            className="control-dock-console-line control-dock-console-dim"
            dir="auto"
            data-control-ui=""
            data-cursor="disable"
          >
            {formattedTranscript}
          </div>
          <div
            className="control-dock-console-line"
            dir="auto"
            aria-hidden="true"
            data-control-ui=""
            data-cursor="disable"
          >
            {"\u00A0"}
          </div>
        </>
      );
    }

    if (voicePhase === "replied") {
      const formattedTranscript = transcript
        ? transcript.startsWith('"') || transcript.startsWith("“")
          ? transcript
          : `"${transcript}"`
        : "";
      return (
        <>
          <div
            className="control-dock-console-line control-dock-console-dim"
            dir="auto"
            data-control-ui=""
            data-cursor="disable"
          >
            {formattedTranscript}
          </div>
          <div
            className="control-dock-console-line control-dock-console-cyan"
            dir="auto"
            data-control-ui=""
            data-cursor="disable"
          >
            {reply}
          </div>
        </>
      );
    }

    if (voicePhase === "error") {
      return (
        <>
          <div
            className="control-dock-console-line control-dock-console-amber"
            dir="auto"
            data-control-ui=""
            data-cursor="disable"
          >
            {errorMessage}
          </div>
          <div
            className="control-dock-console-line"
            dir="auto"
            aria-hidden="true"
            data-control-ui=""
            data-cursor="disable"
          >
            {"\u00A0"}
          </div>
        </>
      );
    }

    // Gesture status (loading / camera errors) when voice is idle
    if (gestureStatus) {
      const isGestureError = gestureStatus.toLowerCase().includes("error");
      return (
        <>
          <div
            className={`control-dock-console-line ${isGestureError ? "control-dock-console-amber" : "control-dock-console-dim"}`}
            dir="auto"
            data-control-ui=""
            data-cursor="disable"
          >
            {`> gestures: ${gestureStatus === "error" ? "camera unavailable. Check the permission and try again." : gestureStatus}`}
          </div>
          <div className="control-dock-console-line" dir="auto" aria-hidden="true" data-control-ui="" data-cursor="disable">
            {" "}
          </div>
        </>
      );
    }

    // Default / idle state
    return (
      <>
        <div
          className="control-dock-console-line control-dock-console-dim"
          dir="auto"
          data-control-ui=""
          data-cursor="disable"
        >
          {voiceLang === "ar" ? 'جرّب: "وريني مشاريعه"' : '> Try: "show me his projects"'}
        </div>
        <div
          className="control-dock-console-line"
          dir="auto"
          aria-hidden="true"
          data-control-ui=""
          data-cursor="disable"
        >
          {"\u00A0"}
        </div>
      </>
    );
  };

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
          {/* 1. Header: mono label hands-free on left, close x (44x44) on right. Thin divider. */}
          <header className="control-dock-header" data-control-ui="" data-cursor="disable">
            <span className="control-dock-title" data-control-ui="" data-cursor="disable">
              hands-free
            </span>
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
          </header>

          <div className="control-dock-rows" data-control-ui="" data-cursor="disable">
            {/* 2. Row "Hand gestures" */}
            <div className="control-dock-row-wrapper" data-control-ui="" data-cursor="disable">
              <div className="control-dock-row" data-control-ui="" data-cursor="disable">
                <div
                  className={`control-dock-row-icon ${gestureActive ? "is-active" : ""}`}
                  aria-hidden="true"
                  data-control-ui=""
                  data-cursor="disable"
                >
                  <svg
                    width="20"
                    height="20"
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
                <div className="control-dock-row-content" data-control-ui="" data-cursor="disable">
                  <span className="control-dock-row-title" data-control-ui="" data-cursor="disable">
                    Hand gestures
                  </span>
                  <span className="control-dock-row-sub" data-control-ui="" data-cursor="disable">
                    Camera stays on your device
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={gestureActive}
                  aria-label="Toggle hand gestures"
                  className={`control-dock-switch ${gestureActive ? "is-active" : ""}`}
                  onClick={() => void toggleGesture()}
                  data-control-ui=""
                  data-cursor="disable"
                >
                  <span className="control-dock-switch-track" aria-hidden="true" data-control-ui="" data-cursor="disable">
                    <span className="control-dock-switch-thumb" data-control-ui="" data-cursor="disable" />
                  </span>
                </button>
              </div>

              {gestureActive && (
                <div className="control-dock-chips" data-control-ui="" data-cursor="disable">
                  <div className="control-dock-chip" data-control-ui="" data-cursor="disable">
                    <span className="control-dock-chip-emoji" aria-hidden="true" data-control-ui="" data-cursor="disable">
                      ☝
                    </span>
                    <span className="control-dock-chip-text" data-control-ui="" data-cursor="disable">
                      Move
                    </span>
                  </div>
                  <div className="control-dock-chip" data-control-ui="" data-cursor="disable">
                    <span className="control-dock-chip-emoji" aria-hidden="true" data-control-ui="" data-cursor="disable">
                      🤏
                    </span>
                    <span className="control-dock-chip-text" data-control-ui="" data-cursor="disable">
                      Click
                    </span>
                  </div>
                  <div className="control-dock-chip" data-control-ui="" data-cursor="disable">
                    <span className="control-dock-chip-emoji" aria-hidden="true" data-control-ui="" data-cursor="disable">
                      👍👎
                    </span>
                    <span className="control-dock-chip-text" data-control-ui="" data-cursor="disable">
                      Scroll
                    </span>
                  </div>
                  <div className="control-dock-chip" data-control-ui="" data-cursor="disable">
                    <span className="control-dock-chip-emoji" aria-hidden="true" data-control-ui="" data-cursor="disable">
                      ✋
                    </span>
                    <span className="control-dock-chip-text" data-control-ui="" data-cursor="disable">
                      Rest
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Row "Voice commands" */}
            <div className="control-dock-row" data-control-ui="" data-cursor="disable">
              <div
                className={`control-dock-row-icon ${voiceActive ? "is-active" : ""}`}
                aria-hidden="true"
                data-control-ui=""
                data-cursor="disable"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  data-control-ui=""
                  data-cursor="disable"
                >
                  <path d="M12 3v18" data-control-ui="" data-cursor="disable" />
                  <path d="M8 8v8" data-control-ui="" data-cursor="disable" />
                  <path d="M4 11v2" data-control-ui="" data-cursor="disable" />
                  <path d="M16 8v8" data-control-ui="" data-cursor="disable" />
                  <path d="M20 11v2" data-control-ui="" data-cursor="disable" />
                </svg>
              </div>
              <div className="control-dock-row-content" data-control-ui="" data-cursor="disable">
                <span className="control-dock-row-title" data-control-ui="" data-cursor="disable">
                  Voice commands
                </span>
                <div
                  className="control-dock-language"
                  role="group"
                  aria-label="Voice language"
                  data-control-ui=""
                  data-cursor="disable"
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
              </div>
              <button
                type="button"
                className={`control-dock-mic-btn ${voiceActive ? "is-active" : ""}`}
                aria-label="Tap to talk"
                onClick={toggleVoice}
                data-voice-supported={voiceSupported}
                data-control-ui=""
                data-cursor="disable"
              >
                {isListening && (
                  <span className="control-dock-pulse-ring" aria-hidden="true" data-control-ui="" data-cursor="disable" />
                )}
                {isThinking ? (
                  <span className="control-dock-thinking-dots" aria-hidden="true" data-control-ui="" data-cursor="disable">
                    <span data-control-ui="" data-cursor="disable" />
                    <span data-control-ui="" data-cursor="disable" />
                    <span data-control-ui="" data-cursor="disable" />
                  </span>
                ) : (
                  <svg
                    width="20"
                    height="20"
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
                    <rect x="9" y="2" width="6" height="12" rx="3" data-control-ui="" data-cursor="disable" />
                    <path d="M5 10v2a7 7 0 0 0 14 0v-2" data-control-ui="" data-cursor="disable" />
                    <line x1="12" y1="19" x2="12" y2="22" data-control-ui="" data-cursor="disable" />
                    <line x1="8" y1="22" x2="16" y2="22" data-control-ui="" data-cursor="disable" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 4. Status console: always 2 lines tall */}
          <div
            className="control-dock-console"
            role="status"
            aria-live="polite"
            data-control-ui=""
            data-cursor="disable"
          >
            {renderConsoleContent()}
          </div>

          {/* 5. Footer: text link-style "How it works →" */}
          <footer className="control-dock-footer" data-control-ui="" data-cursor="disable">
            <button
              type="button"
              className="control-dock-guide-link"
              onClick={() => void import("./gesture").then(({ showGestureGuide }) => showGestureGuide())}
              data-control-ui=""
              data-cursor="disable"
            >
              How it works →
            </button>
          </footer>
        </section>
      )}
    </>
  );
}

// ## Done
// Redesigned hands-free panel to professional compact 340px list rows layout.
// Fixed rules-of-hooks violation (all hooks called before early returns).
// Handled all 6 voice statuses (listening, heard, thinking, replied, error, stopped).
// Preserved transcript/reply on stopped until new voice command starts.
// Ensured full accessibility (>=44px tap targets, contrast AA, visible focus, prefers-reduced-motion).
