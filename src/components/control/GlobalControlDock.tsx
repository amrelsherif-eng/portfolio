import { lazy, Suspense, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ControlDock = lazy(() => import("./ControlDock"));

export default function GlobalControlDock() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onNavigate = (event: Event) => {
      const path = (event as CustomEvent<string>).detail;
      if (typeof path === "string") navigate(path);
    };
    window.addEventListener("control:navigate", onNavigate);
    return () => window.removeEventListener("control:navigate", onNavigate);
  }, [navigate]);

  if (pathname === "/lab" || pathname.startsWith("/lab/")) return null;
  return <Suspense fallback={null}><ControlDock /></Suspense>;
}
