import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { certifications } from "../data/certifications";
import { CertRow } from "../components/Certifications";
import "./CertificationsPage.css";

/* ── helpers ──────────────────────────────────────────────── */
const ALL = "All";

function getCategories(certs: typeof certifications): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const c of certs) {
    if (!seen.has(c.category)) {
      seen.add(c.category);
      ordered.push(c.category);
    }
  }
  return ordered;
}

function groupByCategory(
  certs: typeof certifications
): Record<string, typeof certifications> {
  const map: Record<string, typeof certifications> = {};
  for (const c of certs) {
    (map[c.category] ??= []).push(c);
  }
  return map;
}

/* ── page component ───────────────────────────────────────── */
export default function CertificationsPage() {
  const [active, setActive] = useState(ALL);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const categories = useMemo(() => getCategories(certifications), []);

  const filtered = useMemo(
    () =>
      active === ALL
        ? certifications
        : certifications.filter((c) => c.category === active),
    [active]
  );

  const groups = useMemo(() => groupByCategory(filtered), [filtered]);

  return (
    <main className="certs-page">
      <Link to="/#certifications" className="certs-back">
        ← Back to Home
      </Link>

      <h1 className="certs-page-title">
        Certi<span>fications</span>
      </h1>
      <p className="certs-page-subtitle">
        Credentials, programs and training, grouped by domain.
      </p>

      {/* ── filter chips ── */}
      <div className="certs-filters" role="group" aria-label="Filter by category">
        <button
          className={`certs-chip${active === ALL ? " certs-chip--active" : ""}`}
          aria-pressed={active === ALL}
          onClick={() => setActive(ALL)}
          type="button"
        >
          {ALL}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`certs-chip${active === cat ? " certs-chip--active" : ""}`}
            aria-pressed={active === cat}
            onClick={() => setActive(cat)}
            type="button"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── grouped rows ── */}
      {Object.entries(groups).map(([cat, items]) => (
        <section key={cat} className="certs-group">
          <h2 className="certs-group-title">
            {cat}{" "}
            <span className="certs-group-count">({items.length})</span>
          </h2>

          <div className="certs-list">
            {items.map((cert) => (
              <CertRow cert={cert} key={cert.name} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
