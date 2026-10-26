import { PropsWithChildren, useEffect, useState } from "react";
import "./styles/Landing.css";
import { config } from "../config";

const ROLES = ["Network", "Cloud", "Systems"];

const Landing = ({ children }: PropsWithChildren) => {
  const [role, setRole] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setRole((r) => (r + 1) % ROLES.length), 2800);
    return () => clearInterval(id);
  }, []);
  const nameParts = config.developer.fullName.split(" ");
  const firstName = nameParts[0] || config.developer.name;
  const lastName = nameParts.slice(1).join(" ") || "";

  return (
    <>
      <div className="landing-section" id="landingDiv">
        <div className="landing-container">
          <div className="landing-intro">
            <p className="landing-hello">Hello! I'm</p>
            <h1>
              {firstName.toUpperCase()}
              {' '}
              <br />
              {lastName && <span>{lastName.toUpperCase()}</span>}
            </h1>
          </div>
          <div className="landing-info">
            <p className="landing-tagline">CCNA Track · AWS · Linux</p>
            <p className="landing-info-h2 landing-role">
              <span className="landing-role-word" key={role}>
                {ROLES[role]}
              </span>
              <span className="landing-role-tail">Engineer</span>
            </p>
            <p className="landing-role-sub">Aspiring DevOps · ECE '27</p>
          </div>
          {/* Mobile photo - shows only on mobile when 3D character is hidden */}
          <div className="mobile-photo">
            <img
              src="/images/profile.webp"
              alt="Amr Elsherif"
              loading="eager"
              onError={(e) => (e.currentTarget.style.display = "none")}
              decoding="async"
            />
          </div>
        </div>
        {children}
      </div>
    </>
  );
};

export default Landing;
