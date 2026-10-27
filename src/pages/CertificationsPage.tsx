import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { certifications, Certification, CertCategory } from "../data/certifications";
import { CertViewer } from "../components/Certifications";
import "./CertificationsPage.css";

/* ── local monogram (not exported from Certifications.tsx) ── */
function monogram(issuer: string): string {
  if (!issuer) return "·";
  const upper = issuer.toUpperCase();
  if (upper.includes("AWS"))                        return "AWS";
  if (upper.includes("CISCO"))                      return "CSCO";
  if (upper.includes("NTI"))                        return "NTI";
  if (upper.includes("MCIT") || upper.includes("DEPI")) return "DEPI";
  if (upper.includes("COURSERA") || upper.includes("PACKT")) return "PKT";
  if (upper.includes("HELSINKI"))                    return "UH";
  if (upper.includes("MCKINSEY"))                   return "McK";
  if (upper.includes("GOOGLE"))                     return "GDG";
  if (upper.includes("SPRINTUP") || upper.includes("SPRINTS")) return "SPR";
  if (upper.includes("ITI") && !upper.includes("NTI") && !upper.includes("ITIDA")) return "ITI";
  return issuer
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .substring(0, 3)
    .toUpperCase();
}

/* ── data slices (computed from data, never hard-coded) ───── */
const awsItems = certifications.filter(
  (c) => c.issuer.toUpperCase().includes("AWS")
);
const ccnaItems = certifications.filter(
  (c) => c.status === "in-progress" && c.issuer.toUpperCase().includes("CISCO")
);
const awsIds = new Set(awsItems.map((c) => c.id));
const ccnaIds = new Set(ccnaItems.map((c) => c.id));

const restItems = certifications.filter(
  (c) => !awsIds.has(c.id) && !ccnaIds.has(c.id)
);

/* stat strip values */
const earnedCount = certifications.filter((c) => c.status !== "in-progress").length;
const awsBadgeCount = awsItems.length;
const inProgressCount = ccnaItems.length;

/* categories present in "rest" items only */
function getRestCategories(certs: Certification[]): CertCategory[] {
  const seen = new Set<CertCategory>();
  const ordered: CertCategory[] = [];
  for (const c of certs) {
    if (!seen.has(c.category)) {
      seen.add(c.category);
      ordered.push(c.category);
    }
  }
  return ordered;
}
const restCategories = getRestCategories(restItems);

const ALL = "All" as const;
type FilterValue = typeof ALL | CertCategory;

/* ── page component ───────────────────────────────────────── */
export default function CertificationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterValue>(ALL);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerItems, setViewerItems] = useState<Certification[]>([]);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = "Certifications – Amr Elsherif";
    window.scrollTo(0, 0);
    return () => {
      document.title = prev;
    };
  }, []);

  /* filtered "rest" items */
  const filteredRest = useMemo(
    () =>
      activeFilter === ALL
        ? restItems
        : restItems.filter((c) => c.category === activeFilter),
    [activeFilter]
  );

  /* open CertViewer for any set of items */
  const openPreview = useCallback(
    (pool: Certification[], cert: Certification, trigger: HTMLElement) => {
      const withImg = pool.filter((c) => c.image);
      const idx = withImg.findIndex((c) => c.id === cert.id);
      if (idx === -1) return;
      triggerRef.current = trigger;
      setViewerItems(withImg);
      setViewerIndex(idx);
    },
    []
  );

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <main className="cpg">
      {/* ── HEADER ──────────────────────────────────────────── */}
      <header className="cpg-header">
        <Link to="/#certifications" className="cpg-back">
          ← Back to Home
        </Link>

        <h1 className="cpg-title">
          Certi<span>fications</span>
        </h1>
        <p className="cpg-subtitle">
          Credentials, programs and training, grouped by domain.
        </p>

        <div className="cpg-stats" aria-label="Certification statistics">
          <div className="cpg-stat-tile">
            <span className="cpg-stat-num">{earnedCount}</span>
            <span className="cpg-stat-label">earned</span>
          </div>
          <div className="cpg-stat-tile">
            <span className="cpg-stat-num">{awsBadgeCount}</span>
            <span className="cpg-stat-label">AWS badges</span>
          </div>
          <div className="cpg-stat-tile">
            <span className="cpg-stat-num">{inProgressCount}</span>
            <span className="cpg-stat-label">CCNA courses in progress</span>
          </div>
        </div>
      </header>

      {/* ── FEATURED — AWS ─────────────────────────────────── */}
      <section className="cpg-section">
        <h2 className="cpg-h2">AWS badges</h2>
        <div className="cpg-aws-grid">
          {awsItems.map((cert) => (
            <div className="cpg-aws-card" key={cert.id}>
              {cert.image && (
                <button
                  className="cpg-aws-thumb-btn"
                  type="button"
                  aria-label={`Preview ${cert.name}`}
                  onClick={(e) => openPreview(awsItems, cert, e.currentTarget)}
                >
                  <img
                    src={cert.image}
                    alt={cert.name}
                    className="cpg-aws-thumb"
                    loading="lazy"
                  />
                </button>
              )}
              <div className="cpg-aws-body">
                <div className="cpg-mono-tile" aria-hidden="true">
                  {monogram(cert.issuer)}
                </div>
                <h3 className="cpg-aws-name">{cert.name}</h3>
                {cert.issuer && <p className="cpg-aws-issuer">{cert.issuer}</p>}
                {cert.date && <p className="cpg-aws-date">{cert.date}</p>}
                {cert.hours && <p className="cpg-aws-hours">{cert.hours}</p>}
                <div className="cpg-aws-actions">
                  {cert.verifyUrl && (
                    <a
                      href={cert.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cpg-pill cpg-pill--primary"
                    >
                      Verify ↗
                    </a>
                  )}
                  {cert.image && (
                    <button
                      className="cpg-pill cpg-pill--ghost"
                      type="button"
                      onClick={(e) => openPreview(awsItems, cert, e.currentTarget)}
                    >
                      Preview
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CCNA TRACKER ───────────────────────────────────── */}
      <section className="cpg-section">
        <h2 className="cpg-h2">CCNA in progress</h2>
        <div className="cpg-ccna-panel">
          <p className="cpg-ccna-meta">
            Cisco Networking Academy · NTI — target: CCNA 200-301 exam
          </p>
          <div className="cpg-ccna-steps">
            {ccnaItems.map((cert, i) => (
              <div className="cpg-ccna-step" key={cert.id}>
                <span className="cpg-ccna-num" aria-hidden="true">
                  {pad(i + 1)}
                </span>
                <h3 className="cpg-ccna-name">{cert.name}</h3>
                <p className="cpg-ccna-date">
                  {cert.date}
                  {cert.endDate ? ` → ${cert.endDate}` : ""}
                </p>
                <span className="cpg-ccna-pill">In progress</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALL CREDENTIALS ────────────────────────────────── */}
      <section className="cpg-section">
        <h2 className="cpg-h2">All credentials</h2>

        <div className="cpg-filters" role="group" aria-label="Filter by category">
          <button
            className={`cpg-chip${activeFilter === ALL ? " cpg-chip--on" : ""}`}
            aria-pressed={activeFilter === ALL}
            onClick={() => setActiveFilter(ALL)}
            type="button"
          >
            All
          </button>
          {restCategories.map((cat) => (
            <button
              key={cat}
              className={`cpg-chip${activeFilter === cat ? " cpg-chip--on" : ""}`}
              aria-pressed={activeFilter === cat}
              onClick={() => setActiveFilter(cat)}
              type="button"
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="cpg-grid">
          {filteredRest.map((cert) => (
            <div className="cpg-card" key={cert.id}>
              <div className="cpg-mono-tile" aria-hidden="true">
                {monogram(cert.issuer)}
              </div>
              <h3 className="cpg-card-name">{cert.name}</h3>
              {cert.issuer && <p className="cpg-card-issuer">{cert.issuer}</p>}
              {cert.date && <p className="cpg-card-date">{cert.date}</p>}
              <div className="cpg-card-actions">
                {cert.image && (
                  <button
                    className="cpg-pill cpg-pill--ghost"
                    type="button"
                    onClick={(e) => openPreview(restItems, cert, e.currentTarget)}
                  >
                    Preview
                  </button>
                )}
                {cert.verifyUrl && (
                  <a
                    href={cert.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cpg-pill cpg-pill--ghost"
                  >
                    Verify ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIGHTBOX ───────────────────────────────────────── */}
      {viewerIndex !== null && (
        <CertViewer
          items={viewerItems}
          activeIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          triggerRef={triggerRef}
        />
      )}
    </main>
  );
}
