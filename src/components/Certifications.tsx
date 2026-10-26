import { Link } from "react-router-dom";
import { certifications, type Certification } from "../data/certifications";
import "./styles/Certifications.css";

/* ── Shared card component (also used by CertificationsPage) ── */
export const CertCard = ({ cert }: { cert: Certification }) => (
  <article className="cert-card">
    <p className="cert-card-category">{cert.category}</p>
    <h3>{cert.name}</h3>
    {cert.issuer && <p className="cert-card-issuer">{cert.issuer}</p>}

    {(cert.date || cert.hours || cert.status === "in-progress") && (
      <div className="cert-card-meta">
        {cert.date && <span className="cert-card-date">{cert.date}</span>}
        {cert.hours && <span className="cert-card-hours">{cert.hours}</span>}
        {cert.status === "in-progress" && (
          <span className="cert-card-pill">In progress</span>
        )}
      </div>
    )}

    {cert.verifyUrl && (
      <div className="cert-card-footer">
        <a
          href={cert.verifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cert-card-verify"
          data-cursor="disable"
        >
          Verify ↗
        </a>
      </div>
    )}
  </article>
);

/* ── Home section ── */
const Certifications = () => {
  const featured = certifications.filter((c) => c.featured);

  return (
    <section className="certs-section section-container" id="certifications">
      <h2>
        Certifi<span>cations</span>
      </h2>

      <div className="certs-grid">
        {featured.map((cert) => (
          <CertCard key={cert.id} cert={cert} />
        ))}
      </div>

      <div className="certs-all-wrap">
        <Link to="/certifications" className="certs-all-btn" data-cursor="disable">
          All certifications →
        </Link>
      </div>
    </section>
  );
};

export default Certifications;
