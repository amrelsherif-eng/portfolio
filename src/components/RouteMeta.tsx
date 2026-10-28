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

// Home keeps the description from index.html; subpages get their own.
const HOME_DESCRIPTION =
  "Amr Elsherif | Network & Cloud Infrastructure | CCNA Track · AWS · Linux | Aspiring DevOps Engineer | ECE '27";
const DESCRIPTIONS: Record<string, string> = {
  "/works":
    "Projects by Amr Elsherif: a beam-steered Li-Fi graduation project (design phase), WeatherLink, DevSync, an open-source ATS resume template and Flutter practice apps.",
  "/certifications":
    "Certifications of Amr Elsherif: AWS Academy Graduate (Cloud Architecting and Cloud Foundations), CCNA in progress, NTI and DEPI programs.",
  "/resume":
    "CVs of Amr Elsherif: Network & Cloud, Embedded & ECE, and Mobile Apps versions. Final-year ECE student, CCNA track, AWS, Linux.",
  "/lab":
    "Network Lab: short browser games on IPv4 subnetting, network troubleshooting and AWS VPC design, built by Amr Elsherif.",
};

function setMeta(attr: "name" | "property", key: string, value: string) {
  const el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (el) el.content = value;
}

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
    const title = known ? (game ? `${game.title} — Network Lab` : TITLES[pathname]) : document.title;
    const description = game
      ? `${game.title}: ${game.tagline} A ${game.minutes}-minute ${game.track} practice game in Amr Elsherif's Network Lab.`
      : DESCRIPTIONS[pathname] ?? HOME_DESCRIPTION;
    setMeta("name", "description", description);
    setMeta("property", "og:description", description);
    setMeta("name", "twitter:description", description);
    setMeta("property", "og:title", title);
    setMeta("name", "twitter:title", title);
    setMeta("property", "og:url", `${BASE}${known ? pathname : "/"}`);
  }, [pathname]);
  return null;
}
