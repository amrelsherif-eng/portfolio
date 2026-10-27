import { useState } from "react";
import { Link } from "react-router-dom";
import { config } from "../config";
import "./styles/CallToAction.css";

// Closing block before Contact: a short invitation + the three actions a recruiter needs.
const CallToAction = () => {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(config.social.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${config.social.email}`; // clipboard blocked: fall back to mail app
    }
  };

  return (
    <section className="cta-section" aria-labelledby="cta-title">
      <div className="cta-inner">
        <p className="cta-eyebrow">$ ping amr</p>
        <h2 className="cta-title" id="cta-title">
          Have a role in <span>mind?</span>
        </h2>
        <p className="cta-text">
          Open to internships now and full-time roles from July 2027 · Alexandria, Cairo or remote.
        </p>
        <div className="cta-buttons">
          <a href={`mailto:${config.social.email}`} className="cta-btn cta-btn-primary" data-cursor="disable">
            Email me →
          </a>
          <button type="button" className="cta-btn cta-btn-ghost" onClick={copyEmail} data-cursor="disable">
            {copied ? "Copied ✓" : "Copy email"}
          </button>
          <Link to="/resume" className="cta-btn cta-btn-ghost" data-cursor="disable">
            View CV
          </Link>
        </div>
        <span className="cta-sr" aria-live="polite">{copied ? "Email address copied" : ""}</span>
      </div>
    </section>
  );
};

export default CallToAction;
