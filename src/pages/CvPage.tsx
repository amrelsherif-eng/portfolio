import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { cvs, CvVersion } from "../data/cvs";
import { lenis } from "../components/Navbar";
import "./CvPage.css";

/* ── CvViewer (lightbox for preview image) ────────────────── */
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

/* ── page component ───────────────────────────────────────── */
export default function CvPage() {
  const [viewerId, setViewerId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const prev = document.title;
    document.title = "CV \u2013 Amr Elsherif";
    return () => {
      document.title = prev;
    };
  }, []);

  const openViewer = useCallback((cv: CvVersion, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setViewerId(cv.id);
  }, []);

  const viewerCv = viewerId ? cvs.find((c) => c.id === viewerId) : undefined;

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

      <div className="cv-grid">
        {cvs.map((cv) => (
          <article
            key={cv.id}
            className={`cv-card${cv.recommended ? " cv-card--recommended" : ""}`}
          >
            {cv.recommended && (
              <span className="cv-recommended-pill">Recommended</span>
            )}

            {/* Preview image */}
            <button
              className="cv-preview-btn"
              onClick={(e) => openViewer(cv, e.currentTarget)}
              aria-label={`Preview ${cv.title} CV`}
              type="button"
            >
              <div className="cv-preview-frame">
                <img
                  src={cv.preview}
                  alt=""
                  className="cv-preview-img"
                  loading="lazy"
                />
              </div>
            </button>

            {/* Text content */}
            <p className="cv-card-role">{cv.role}</p>
            <h2 className="cv-card-title">{cv.title}</h2>
            <p className="cv-card-summary">{cv.summary}</p>

            <div className="cv-focus-tags">
              {cv.focus.map((tag) => (
                <span key={tag} className="cv-focus-tag">
                  {tag}
                </span>
              ))}
            </div>

            {/* Meta line */}
            <div className="cv-meta">
              <span className="cv-updated">Updated {cv.updated}</span>
              {cv.draft && <span className="cv-draft-tag">Draft</span>}
            </div>

            {/* Actions */}
            <div className="cv-actions">
              <a
                href={cv.file}
                download
                className="cv-btn cv-btn--primary"
              >
                Download PDF
              </a>
              <a
                href={cv.file}
                target="_blank"
                rel="noopener noreferrer"
                className="cv-btn cv-btn--ghost"
              >
                Open ↗
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* Lightbox viewer */}
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
