import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { certifications, type CertCategory } from "../data/certifications";
import { CertCard } from "../components/Certifications";
import "./CertificationsPage.css";
// Also import shared card styles
import "../components/styles/Certifications.css";

const categoryOrder: CertCategory[] = [
  "Cloud & Networking",
  "Programs & Training",
  "Languages & Skills",
];

const CertificationsPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    const prevTitle = document.title;
    document.title = "Certifications — Amr Elsherif";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  const groups = categoryOrder.map((cat) => ({
    category: cat,
    items: certifications.filter((c) => c.category === cat),
  }));

  return (
    <div className="certs-page" ref={containerRef}>
      <header className="certs-page-header">
        <div className="certs-page-back-wrap">
          <Link to="/" className="certs-page-back-btn" data-cursor="disable">
            ← Back to Home
          </Link>
        </div>
        <h1 className="certs-page-title">
          Certifi<span>cations</span>
        </h1>
        <p className="certs-page-subtitle">
          Credentials, programs and training — newest first in each group.
        </p>
      </header>

      <main className="certs-page-groups">
        {groups.map((group) => (
          <section key={group.category}>
            <h2 className="certs-page-group-title">
              {group.category}
              <span className="certs-page-group-count">
                ({group.items.length})
              </span>
            </h2>
            <div className="certs-page-grid">
              {group.items.map((cert) => (
                <CertCard key={cert.id} cert={cert} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default CertificationsPage;
