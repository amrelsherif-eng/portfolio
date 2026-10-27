import { useRef, useEffect, useState, useCallback } from "react";
import { trapTab } from "./utils/focusTrap";
import { certifications, Certification } from "../data/certifications";
import { Link } from "react-router-dom";
import { lenis } from "./Navbar";
import "./styles/Certifications.css";

const featured = certifications.filter((c) => c.featured);

/* ── stat helpers (computed from data, never hard-coded) ── */
// count only finished credentials; in-progress courses are mentioned separately
const totalCount = certifications.filter((c) => c.status !== "in-progress").length;
const inProgress = certifications.find((c) => c.status === "in-progress");
const inProgressShort = inProgress
  ? inProgress.name.split(/[:\u2013\u2014–—]/)[0].replace(/^Cisco\s+/i, "").trim()
  : "";
const statLine = `${totalCount} earned` +
  (inProgress
    ? ` · ${inProgressShort} in progress` + (inProgress.hours ? ` (${inProgress.hours})` : "")
    : "");

/* ── issuer → short monogram ──────────────────────────────── */
function monogram(issuer: string): string {
  if (!issuer) return "·";
  const upper = issuer.toUpperCase();
  // Order matters: check NTI before ITI so "NTI × ITIDA" resolves to NTI.
  // Check Google before ITI so "Google for Developers × ITI" resolves to GDG.
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
  // fallback: first letters of the first two words, max 3 chars
  return issuer
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .substring(0, 3)
    .toUpperCase();
}

/* ── CertViewer (lightbox) ────────────────────────────────── */
export function CertViewer({
  items,
  activeIndex,
  onClose,
  triggerRef,
}: {
  items: Certification[];
  activeIndex: number;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}) {
  const [index, setIndex] = useState(activeIndex);
  const closeRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Items that actually have images
  const withImage = items.filter((c) => c.image);
  const currentCert = withImage[index];

  // Clamp index when items change
  useEffect(() => {
    setIndex(activeIndex);
  }, [activeIndex]);

  // Lock scroll & focus management
  useEffect(() => {
    // index.css forces `overflow: auto !important` on phones, so lock with a class
    // that outranks it (see .scroll-locked in Certifications.css), and pause Lenis too
    document.documentElement.classList.add("scroll-locked");
    lenis?.stop();
    closeRef.current?.focus();

    return () => {
      document.documentElement.classList.remove("scroll-locked");
      lenis?.start();
      // Return focus to trigger
      triggerRef.current?.focus();
    };
  }, [triggerRef]);

  // Keyboard navigation
  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      trapTab(e, overlayRef.current); // keep Tab inside the dialog
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => (i > 0 ? i - 1 : withImage.length - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => (i < withImage.length - 1 ? i + 1 : 0));
      }
    },
    [onClose, withImage.length]
  );

  if (!currentCert) return null;

  return (
    <div
      ref={overlayRef}
      className="cert-viewer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={currentCert.name}
      onKeyDown={handleKey}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Close button */}
      <button
        ref={closeRef}
        className="cert-viewer-close"
        onClick={onClose}
        aria-label="Close preview"
        type="button"
      >
        ×
      </button>

      {/* Prev arrow */}
      {withImage.length > 1 && (
        <button
          className="cert-viewer-arrow cert-viewer-prev"
          onClick={() => setIndex((i) => (i > 0 ? i - 1 : withImage.length - 1))}
          aria-label="Previous certificate"
          type="button"
        >
          ‹
        </button>
      )}

      {/* Figure: image + caption */}
      <figure className="cert-viewer-figure">
        <img
          src={currentCert.image}
          alt={currentCert.name}
          className="cert-viewer-img"
          draggable={false}
        />
        <figcaption className="cert-viewer-caption">
          <span className="cert-viewer-name">{currentCert.name}</span>
          <span className="cert-viewer-meta">
            {currentCert.issuer && <>{currentCert.issuer}</>}
            {currentCert.issuer && currentCert.date && " · "}
            {currentCert.date && <>{currentCert.date}</>}
          </span>
          {currentCert.verifyUrl && (
            <a
              href={currentCert.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cert-viewer-verify"
            >
              Verify ↗
            </a>
          )}
        </figcaption>
      </figure>

      {/* Next arrow */}
      {withImage.length > 1 && (
        <button
          className="cert-viewer-arrow cert-viewer-next"
          onClick={() => setIndex((i) => (i < withImage.length - 1 ? i + 1 : 0))}
          aria-label="Next certificate"
          type="button"
        >
          ›
        </button>
      )}
    </div>
  );
}

/* ── shared row component (also used by CertificationsPage) ─ */
export function CertRow({
  cert,
  onPreview,
}: {
  cert: Certification;
  onPreview?: (cert: Certification, trigger: HTMLElement) => void;
}) {
  const handlePreview = (e: React.MouseEvent<HTMLElement>) => {
    if (onPreview) onPreview(cert, e.currentTarget);
  };

  return (
    <div className="cert-row">
      <div className="cert-row-monogram" aria-hidden="true">
        {monogram(cert.issuer)}
      </div>

      <div className="cert-row-info">
        <h3 className="cert-row-name">{cert.name}</h3>
        {cert.issuer && <p className="cert-row-issuer">{cert.issuer}</p>}
        {cert.status === "in-progress" && (
          <span className="cert-progress-pill">In progress</span>
        )}
      </div>

      <span className="cert-row-date">{cert.date}</span>

      <div className="cert-row-actions">
        {cert.image && (
          <button className="cert-row-preview" onClick={handlePreview} type="button">
            Preview
          </button>
        )}
        {cert.verifyUrl && (
          <a
            href={cert.verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cert-row-verify"
          >
            Verify ↗
          </a>
        )}
      </div>
    </div>
  );
}

/* ── home section ─────────────────────────────────────────── */
function Certifications() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Items with images in the featured list
  const featuredWithImage = featured.filter((c) => c.image);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const openPreview = useCallback(
    (cert: Certification, trigger: HTMLElement) => {
      const idx = featuredWithImage.findIndex((c) => c.id === cert.id);
      if (idx === -1) return;
      triggerRef.current = trigger;
      setViewerIndex(idx);
    },
    [featuredWithImage]
  );

  return (
    <section
      id="certifications"
      ref={sectionRef}
      className={`certifications-section${visible ? " visible" : ""}`}
    >
      <div className="certs-layout">
        {/* ── left column: heading + stats + CTA ── */}
        <div className="certs-left">
          <h2 className="section-title">
            Certi<span>fications</span>
          </h2>
          <p className="certs-intro">
            Cloud and networking credentials, plus the programs behind them.
          </p>
          <p className="certs-stat">{statLine}</p>
          <Link to="/certifications" className="certs-all-link">
            All certifications →
          </Link>
        </div>

        {/* ── right column: featured ledger ── */}
        <div className="certs-ledger">
          {featured.map((cert) => (
            <CertRow cert={cert} key={cert.name} onPreview={openPreview} />
          ))}
        </div>
      </div>

      {/* Lightbox viewer */}
      {viewerIndex !== null && (
        <CertViewer
          items={featured}
          activeIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          triggerRef={triggerRef}
        />
      )}
    </section>
  );
}

export default Certifications;
