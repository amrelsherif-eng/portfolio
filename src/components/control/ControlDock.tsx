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

  const toggleVoice = () => {
    if (voiceActive) {
      if (stopVoiceRef.current) {
        stopVoiceRef.current();
        stopVoiceRef.current = null;
      }
      setVoiceActive(false);
      setVoiceStatus("");
    } else {
      setVoiceActive(true);
      setVoiceStatus("listening");
      try {
        const stop = startVoice((status, text) => {
          if (status === "listening") {
            setVoiceStatus("listening");
          } else if (status === "heard") {
            setVoiceStatus(text ? `heard: "${text}"` : "heard");
          } else if (status === "error") {
            setVoiceStatus(text ? `error: ${text}` : "error");
            setVoiceActive(false);
          } else if (status === "stopped") {
            setVoiceStatus("");
            setVoiceActive(false);
          }
        });
        stopVoiceRef.current = stop;
      } catch {
        setVoiceStatus("error");
        setVoiceActive(false);
      }
    }
  };

  if (!isDesktop) return null;

  const isAnyActive = gestureActive || voiceActive;

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
              $ hands-free
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

          <div className="control-dock-body" data-control-ui="" data-cursor="disable">
            <div className="control-dock-row" data-control-ui="" data-cursor="disable">
              <div className="control-dock-info" data-control-ui="" data-cursor="disable">
                <div className="control-dock-row-title" data-control-ui="" data-cursor="disable">
                  Hand gestures
                </div>
                <div className="control-dock-row-sub" data-control-ui="" data-cursor="disable">
                  Camera stays on your device
                </div>
                {gestureStatus && (
                  <div className="control-dock-status" data-control-ui="" data-cursor="disable">
                    {gestureStatus}
                  </div>
                )}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={gestureActive}
                aria-label="Toggle hand gestures"
                className={`control-dock-switch ${gestureActive ? "is-checked" : ""}`}
                onClick={() => void toggleGesture()}
                data-control-ui=""
                data-cursor="disable"
              >
                <span className="control-dock-switch-track" data-control-ui="" data-cursor="disable">
                  <span className="control-dock-switch-thumb" data-control-ui="" data-cursor="disable" />
                </span>
              </button>
            </div>

            {voiceSupported && (
              <div className="control-dock-row" data-control-ui="" data-cursor="disable">
                <div className="control-dock-info" data-control-ui="" data-cursor="disable">
                  <div className="control-dock-row-title" data-control-ui="" data-cursor="disable">
                    Voice commands
                  </div>
                  <div className="control-dock-row-sub" data-control-ui="" data-cursor="disable">
                    Chrome / Edge
                  </div>
                  {voiceStatus && (
                    <div className="control-dock-status" data-control-ui="" data-cursor="disable">
                      {voiceStatus}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={voiceActive}
                  aria-label="Toggle voice commands"
                  className={`control-dock-switch ${voiceActive ? "is-checked" : ""}`}
                  onClick={toggleVoice}
                  data-control-ui=""
                  data-cursor="disable"
                >
                  <span className="control-dock-switch-track" data-control-ui="" data-cursor="disable">
                    <span className="control-dock-switch-thumb" data-control-ui="" data-cursor="disable" />
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="control-dock-cheatsheet" data-control-ui="" data-cursor="disable">
            <p data-control-ui="" data-cursor="disable">
              ☝ point = move · 🤏 pinch = click · ✋ open hand up/down = scroll · ✌ = open Ping
            </p>
            <p data-control-ui="" data-cursor="disable">
              Say: &quot;go to work&quot;, &quot;scroll down&quot;, &quot;open resume&quot;
            </p>
          </div>
        </section>
      )}
    </>
  );
}
