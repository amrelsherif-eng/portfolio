import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./CvPage.css";
import "./CvTempPage.css";

export default function CvTempPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    const prev = document.title;
    document.title = "CV – Amr Elsherif";
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <main className="cv-page">
      <Link to="/" className="cv-back">
        ← Back to Home
      </Link>

      <h1 className="cv-page-title">
        My <span>CV</span>
      </h1>

      <div className="cvt-card">
        <p className="cvt-mono-label">$ cat cv.pdf</p>
        <h2 className="cvt-title">Amr Elsherif — CV</h2>
        <p className="cvt-subtitle">
          Network & Cloud Infrastructure · CCNA track · AWS · Linux
        </p>

        <div className="cvt-actions">
          <a
            href="/cv/Amr-Elsherif-CV.pdf"
            download
            className="cvt-btn cvt-btn--primary"
          >
            Download PDF
          </a>
          <a
            href="/cv/Amr-Elsherif-CV.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="cvt-btn cvt-btn--secondary"
          >
            Open in new tab
          </a>
        </div>

        <p className="cvt-note">
          Role-focused versions (Network & Cloud, Embedded & ECE, Mobile) are
          coming soon.
        </p>
      </div>
    </main>
  );
}
