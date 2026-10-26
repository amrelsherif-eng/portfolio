import { useRef, useEffect, useState } from "react";
import { certifications, Certification } from "../data/certifications";
import { Link } from "react-router-dom";
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

/* ── shared row component (also used by CertificationsPage) ─ */
export function CertRow({ cert }: { cert: Certification }) {
  return (
    <div className="cert-row">
      <div className="cert-row-monogram" aria-hidden="true">
        {monogram(cert.issuer)}
      </div>

      <div className="cert-row-info">
        <h3 className="cert-row-name">{cert.name}</h3>
        {cert.issuer && <p className="cert-row-issuer">{cert.issuer}</p>}
      </div>

      <div className="cert-row-end">
        {cert.status === "in-progress" && (
          <span className="cert-progress-pill">In progress</span>
        )}
        {cert.date && <span className="cert-row-date">{cert.date}</span>}
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
            <CertRow cert={cert} key={cert.name} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Certifications;
