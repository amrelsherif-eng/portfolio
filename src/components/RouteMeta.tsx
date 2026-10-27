import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { labGames } from "../lab/games";

const BASE = "https://amrelsherif-eng.vercel.app";
const TITLES: Record<string, string> = {
  "/": "Amr Elsherif - Network & Cloud Infrastructure Engineer",
  "/works": "All Works — Amr Elsherif",
  "/certifications": "Certifications — Amr Elsherif",
  "/resume": "Resume — Amr Elsherif",
  "/lab": "Network Lab — Amr Elsherif",
};

export default function RouteMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const game = pathname.startsWith("/lab/")
      ? labGames.find((item) => item.id === pathname.slice("/lab/".length))
      : undefined;
    const known = Boolean(TITLES[pathname] || game);
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (known) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.append(canonical);
      }
      canonical.href = `${BASE}${pathname}`;
    } else {
      canonical?.remove();
    }
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!known) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.append(robots);
      }
      robots.content = "noindex";
      document.title = "Page not found — Amr Elsherif";
    } else {
      robots?.remove();
      document.title = game ? `${game.title} — Network Lab` : TITLES[pathname];
    }
  }, [pathname]);
  return null;
}
