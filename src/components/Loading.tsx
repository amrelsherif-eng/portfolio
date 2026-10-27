import { useEffect, useState } from "react";
import "./styles/Loading.css";
import { useLoading } from "../context/LoadingProvider";
import Marquee from "react-fast-marquee";

const Loading = ({ percent }: { percent: number }) => {
  const { setIsLoading } = useLoading();
  const [loaded, setLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const displayPercent = Math.min(100, Math.max(0, Math.round(percent)));

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener("change", handler);
    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, []);

  if (percent >= 100) {
    setTimeout(() => {
      setLoaded(true);
      setTimeout(() => {
        setIsLoaded(true);
      }, 500);
    }, 200);
  }

  useEffect(() => {
    import("./utils/initialFX").then((module) => {
      if (isLoaded) {
        setClicked(true);
        setTimeout(() => {
          if (module.initialFX) {
            module.initialFX();
          }
          setIsLoading(false);
        }, 600);
      }
    });
  }, [isLoaded]);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  }

  const isComplete = loaded || percent >= 100;
  const marqueeSpeed = clicked ? 160 : isComplete ? 120 : 35;

  return (
    <>
      <div className={`loading-header ${clicked ? "loading-clicked" : ""}`}>
        <a href="/#" className="loader-title" data-cursor="disable">
          <img src="/wordmark.svg" alt="シャリーフ · Amr Elsherif" className="loader-logo" />
        </a>
        <div className="loader-status">
          <span className="loader-status-dot" />
          SYS_INIT // LIVE
        </div>
      </div>
      <div
        className={`loading-screen ${clicked ? "loading-clicked" : ""}`}
        onMouseMove={handleMouseMove}
      >
        <div
          className={`loading-marquee ${isComplete ? "loading-marquee--fast" : ""}`}
          aria-hidden="true"
        >
          <Marquee
            autoFill
            speed={marqueeSpeed}
            play={!prefersReducedMotion}
            gradient={false}
          >
            <span className="loading-marquee-cycle">
              <span className="loading-marquee-word">NETWORK</span>
              <span className="loading-marquee-sep">·</span>
              <span className="loading-marquee-word loading-marquee-word--filled">
                CLOUD
              </span>
              <span className="loading-marquee-sep">·</span>
              <span className="loading-marquee-word">LINUX</span>
              <span className="loading-marquee-sep">·</span>
              <span className="loading-marquee-word">DEVOPS</span>
              <span className="loading-marquee-sep">·</span>
            </span>
          </Marquee>
        </div>
        <div
          className={`loading-wrap ${loaded ? "loading-complete" : ""} ${
            clicked ? "loading-clicked" : ""
          }`}
        >
          <div className="loading-logo-wrap">
            <img
              src="/logo.svg"
              alt="Logo"
              className="loading-logo"
              width="64"
              height="64"
            />
          </div>
          <div className="loading-status">
            <span className="loading-prompt">&gt;</span> establishing
            connection…{" "}
            <span className="loading-pct">{displayPercent}%</span>
            <span className="loading-cursor">_</span>
          </div>
          <div className="loading-progress-bar">
            <div
              className="loading-progress-fill"
              style={{ width: `${displayPercent}%` }}
            >
              <div
                className="loading-progress-dot"
                style={{ opacity: displayPercent > 0 ? 1 : 0 }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Loading;

export const setProgress = (setLoading: (value: number) => void) => {
  let percent: number = 0;

  let interval = setInterval(() => {
    if (percent <= 50) {
      let rand = Math.round(Math.random() * 5);
      percent = percent + rand;
      setLoading(percent);
    } else {
      clearInterval(interval);
      interval = setInterval(() => {
        percent = percent + Math.round(Math.random());
        setLoading(percent);
        if (percent > 91) {
          clearInterval(interval);
        }
      }, 2000);
    }
  }, 100);

  function clear() {
    clearInterval(interval);
    setLoading(100);
  }

  function loaded() {
    return new Promise<number>((resolve) => {
      clearInterval(interval);
      interval = setInterval(() => {
        if (percent < 100) {
          percent++;
          setLoading(percent);
        } else {
          resolve(percent);
          clearInterval(interval);
        }
      }, 2);
    });
  }
  return { loaded, percent, clear };
};
