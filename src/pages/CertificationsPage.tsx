import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { certifications, Certification } from "../data/certifications";
import { CertRow, CertViewer } from "../components/Certifications";
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
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

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

  const filteredWithImage = useMemo(
    () => filtered.filter((c) => c.image),
    [filtered]
  );

  const groups = useMemo(() => groupByCategory(filtered), [filtered]);

  const openPreview = useCallback(
    (cert: Certification, trigger: HTMLElement) => {
      const idx = filteredWithImage.findIndex((c) => c.id === cert.id);
      if (idx === -1) return;
      triggerRef.current = trigger;
      setViewerIndex(idx);
    },
    [filteredWithImage]
  );

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
              <CertRow cert={cert} key={cert.name} onPreview={openPreview} />
            ))}
          </div>
        </section>
      ))}

      {/* Lightbox viewer */}
      {viewerIndex !== null && (
        <CertViewer
          items={filtered}
          activeIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          triggerRef={triggerRef}
        />
      )}
    </main>
  );
}
