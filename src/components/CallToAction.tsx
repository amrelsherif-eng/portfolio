import { Link } from "react-router-dom";
import { config } from "../config";
import "./styles/CallToAction.css";

// Closing block before Contact: a short invitation + the three actions a recruiter needs.
const CallToAction = () => {
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
          <a href={config.contact.linkedin} target="_blank" rel="noopener noreferrer" className="cta-btn cta-btn-ghost" data-cursor="disable">
            LinkedIn ↗
          </a>
          <Link to="/resume" className="cta-btn cta-btn-ghost" data-cursor="disable">
            View CV
          </Link>
        </div>
        <Link to="/lab" className="cta-terminal-hint" data-cursor="disable">
          $ ./network-lab — play 3 short networking games →
        </Link>
      </div>
    </section>
  );
};

export default CallToAction;
