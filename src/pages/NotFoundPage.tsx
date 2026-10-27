import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./NotFoundPage.css";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "All works", to: "/works" },
  { label: "Certifications", to: "/certifications" },
  { label: "Network Lab", to: "/lab" },
  { label: "CV", to: "/resume" },
];

export default function NotFoundPage() {
  const location = useLocation();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Page not found — Amr Elsherif";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <main className="nf-page">
      <div className="nf-container">
        <header className="nf-hero">
          <p className="nf-kicker">NETWORK DIAGNOSTICS</p>
          <h1 className="nf-title">
            404 <span>Not Found</span>
          </h1>
        </header>

        <section className="nf-terminal" aria-label="Terminal output">
          <div className="nf-terminal-header">
            <span className="nf-terminal-dot close" />
            <span className="nf-terminal-dot min" />
            <span className="nf-terminal-dot max" />
            <span className="nf-terminal-title">icmp echo test</span>
          </div>
          <div className="nf-terminal-body">
            <div className="nf-terminal-line">
              <span className="nf-prompt">$</span> ping {location.pathname}
            </div>
            <div className="nf-terminal-output">
              Request timed out. 404 — page not found.
            </div>
          </div>
        </section>

        <section className="nf-suggestions" aria-label="Available routes">
          <p className="nf-sentence">This page doesn't exist, but these do:</p>
          <nav className="nf-links" aria-label="Available destinations">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="nf-link">
                {link.label}
              </Link>
            ))}
          </nav>
        </section>
      </div>
    </main>
  );
}
