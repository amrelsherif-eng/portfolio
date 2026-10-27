import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { cvs, CvVersion, emphasisRows } from "../data/cvs";
import { lenis } from "../components/Navbar";
import "./CvPage.css";

/* ── CvViewer (full-size lightbox) ────────────────────────── */
function CvViewer({
  cv,
  onClose,
  triggerRef,
}: {
  cv: CvVersion;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("scroll-locked");
    lenis?.stop();
    closeRef.current?.focus();

    return () => {
      document.documentElement.classList.remove("scroll-locked");
      lenis?.start();
      triggerRef.current?.focus();
    };
  }, [triggerRef]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  return (
    <div
      ref={overlayRef}
      className="cv-viewer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${cv.title} CV preview`}
      onKeyDown={handleKey}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      onWheel={(e) => e.stopPropagation()}
    >
      <button
        ref={closeRef}
        className="cv-viewer-close"
        onClick={onClose}
        aria-label="Close preview"
        type="button"
      >
        ×
      </button>

      <figure className="cv-viewer-figure">
        <img
          src={cv.preview}
          alt={`${cv.title} CV first page`}
          className="cv-viewer-img"
          draggable={false}
        />
        <figcaption className="cv-viewer-caption">
          <span className="cv-viewer-name">{cv.title}</span>
          <span className="cv-viewer-role">{cv.role}</span>
        </figcaption>
      </figure>
    </div>
  );
}

/* ── helpers ──────────────────────────────────────────────── */
const defaultIndex = cvs.findIndex((c) => c.recommended) ?? 0;

function padIndex(i: number): string {
  return String(i + 1).padStart(2, "0");
}

/* ── page component ──────────────────────────────────────── */
export default function CvPage() {
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selected = cvs[selectedIndex];

  useEffect(() => {
    window.scrollTo(0, 0);
    const prev = document.title;
    document.title = "CV \u2013 Amr Elsherif";
    return () => {
      document.title = prev;
    };
  }, []);

  /* keyboard nav for radiogroup */
  const handleSelectorKey = useCallback(
    (e: React.KeyboardEvent) => {
      let next = selectedIndex;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        next = (selectedIndex + 1) % cvs.length;
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        next = (selectedIndex - 1 + cvs.length) % cvs.length;
      } else {
        return;
      }
      e.preventDefault();
      setSelectedIndex(next);
      rowRefs.current[next]?.focus();
    },
    [selectedIndex]
  );

  const openViewer = useCallback((trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setViewerId("open");
  }, []);

  const viewerCv = viewerId ? selected : undefined;

  return (
    <main className="cv-page">
      <Link to="/" className="cv-back">
        ← Back to Home
      </Link>

      <h1 className="cv-page-title">
        Choose a <span>CV</span>
      </h1>
      <p className="cv-page-subtitle">
        Three versions of the same experience, each focused on a different role.
      </p>
      <p className="cv-page-note">
        <svg
          className="cv-note-icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.5 10.5 4-4.5-1-1-3 3.4L6 8l-1 1 2.5 2.5Z"
            fill="currentColor"
          />
        </svg>
        All three versions share the same verified experience — only the focus
        changes.
      </p>

      {/* ── two-column body ──────────────────────────────────── */}
      <div className="cv-body">
        {/* ── left: selector ─────────────────────────────────── */}
        <div
          className="cv-selector"
          role="radiogroup"
          aria-label="CV version"
          onKeyDown={handleSelectorKey}
        >
          {cvs.map((cv, i) => {
            const isSelected = i === selectedIndex;
            return (
              <button
                key={cv.id}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                role="radio"
                aria-checked={isSelected}
                className={`cv-row${isSelected ? " cv-row--selected" : ""}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setSelectedIndex(i)}
                type="button"
              >
                <span className="cv-row-radio" aria-hidden="true" />
                <span className="cv-row-index">{padIndex(i)}</span>
                <div className="cv-row-body">
                  <h2 className="cv-row-title">{cv.title}</h2>
                  <p className="cv-row-role">{cv.role}</p>
                  <p className="cv-row-summary">{cv.summary}</p>
                  <div className="cv-focus-tags">
                    {cv.focus.map((tag) => (
                      <span key={tag} className="cv-focus-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="cv-row-meta">
                  <span className="cv-updated">Updated {cv.updated}</span>
                  {cv.recommended && (
                    <span className="cv-recommended-pill">Recommended</span>
                  )}
                  {cv.draft && <span className="cv-draft-tag">Draft</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── right: live preview window ─────────────────────── */}
        <div className="cv-preview-window">
          {/* top bar */}
          <div className="cv-pw-bar">
            <span className="cv-pw-dots" aria-hidden="true">
              <span className="cv-pw-dot" />
              <span className="cv-pw-dot" />
              <span className="cv-pw-dot" />
            </span>
            <span className="cv-pw-filename">{selected.filename}</span>
            <button
              className="cv-pw-expand"
              type="button"
              aria-label="Expand to full size"
              onClick={(e) => openViewer(e.currentTarget)}
            >
              1:1
            </button>
          </div>

          {/* preview image area */}
          <div className="cv-pw-canvas">
            {cvs.map((cv, i) => (
              <img
                key={cv.id}
                src={cv.preview}
                alt={
                  i === selectedIndex
                    ? `${cv.title} CV first page`
                    : ""
                }
                className={`cv-pw-img${
                  i === selectedIndex ? " cv-pw-img--active" : ""
                }`}
                loading={i === selectedIndex ? "eager" : "lazy"}
                draggable={false}
              />
            ))}
          </div>

          {/* bottom bar */}
          <div className="cv-pw-status">
            <span className="cv-pw-status-text">
              Selected: {selected.title}
            </span>
            <div className="cv-pw-actions">
              <a
                href={selected.file}
                download
                className="cv-btn cv-btn--primary"
              >
                Download PDF
              </a>
              <a
                href={selected.file}
                target="_blank"
                rel="noopener noreferrer"
                className="cv-btn cv-btn--ghost"
              >
                Open ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── comparison table (desktop + tablet) ──────────────── */}
      <section className="cv-comparison">
        <h2 className="cv-comparison-heading">What each version emphasizes</h2>

        <table className="cv-table">
          <caption className="cv-table-caption">
            Comparison of emphasis across CV versions
          </caption>
          <thead>
            <tr>
              <th className="cv-table-corner" scope="col" />
              {cvs.map((cv, i) => (
                <th
                  key={cv.id}
                  scope="col"
                  className={`cv-table-colhead${
                    i === selectedIndex ? " cv-table-colhead--active" : ""
                  }`}
                >
                  <button
                    className="cv-table-colbtn"
                    type="button"
                    onClick={() => setSelectedIndex(i)}
                  >
                    {cv.title}
                    {cv.recommended && (
                      <span className="cv-table-rec">Recommended</span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {emphasisRows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="cv-table-rowlabel">
                  {row.label}
                </th>
                {cvs.map((cv, i) => (
                  <td
                    key={cv.id}
                    className={`cv-table-cell${
                      i === selectedIndex ? " cv-table-cell--active" : ""
                    }`}
                  >
                    {cv.emphasis[row.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── stacked cards (≤ 640px) ────────────────────────── */}
        <div className="cv-cards-stack">
          {cvs.map((cv, i) => (
            <button
              key={cv.id}
              className={`cv-stack-card${
                i === selectedIndex ? " cv-stack-card--active" : ""
              }`}
              type="button"
              onClick={() => setSelectedIndex(i)}
            >
              <h3 className="cv-stack-card-title">
                {cv.title}
                {cv.recommended && (
                  <span className="cv-table-rec">Recommended</span>
                )}
              </h3>
              <dl className="cv-stack-dl">
                {emphasisRows.map((row) => (
                  <div key={row.key} className="cv-stack-pair">
                    <dt>{row.label}</dt>
                    <dd>{cv.emphasis[row.key]}</dd>
                  </div>
                ))}
              </dl>
            </button>
          ))}
        </div>
      </section>

      {/* ── full-size lightbox viewer ────────────────────────── */}
      {viewerCv && (
        <CvViewer
          cv={viewerCv}
          onClose={() => setViewerId(null)}
          triggerRef={triggerRef}
        />
      )}
    </main>
  );
}
