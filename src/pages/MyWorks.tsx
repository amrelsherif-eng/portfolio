import { useEffect } from "react";
import { Link } from "react-router-dom";
import { config } from "../config";
import { responsiveImage } from "../utils/responsiveImage";
import SubpageNav from "../components/SubpageNav";
import "./MyWorks.css";

const MyWorks = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    const prevTitle = document.title;
    document.title = "All Works — Amr Elsherif";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <div className="works-page">
      <SubpageNav />
      <header className="works-header">
        <h1 className="works-title">
          All <span>Works</span>
        </h1>
        <p className="works-subtitle">
          Projects, team builds and coursework.
        </p>
      </header>

      <main className="works-grid-container">
        <Link to="/lab" className="works-lab-link">Network Lab — play the mini-games →</Link>
        <div className="works-grid">
          {config.projects.map((project, index) => {
            const formattedIndex = String(index + 1).padStart(2, "0");
            const techChips = project.technologies
              ? project.technologies
                  .split(", ")
                  .map((t) => t.trim())
                  .filter(Boolean)
              : [];

            return (
              <article className="works-card" key={project.id}>
                <div className="works-card-media">
                  <span className="works-card-badge" aria-hidden="true">
                    {formattedIndex}
                  </span>
                  <img
                    {...responsiveImage(project.image)}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                    alt={project.title}
                    className="works-card-img"
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    decoding="async"
                  />
                </div>

                <div className="works-card-content">
                  <div className="works-card-body">
                    <h2 className="works-card-title">{project.title}</h2>
                    <p className="works-card-category">{project.category}</p>
                    <p className="works-card-desc">{project.description}</p>
                    {techChips.length > 0 && (
                      <div className="works-card-chips" aria-label="Technologies used">
                        {techChips.map((tech) => (
                          <span key={tech} className="works-tech-chip">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="works-card-footer">
                    {project.link ? (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="works-card-btn"
                        data-cursor="disable"
                      >
                        View on GitHub ↗
                      </a>
                    ) : (
                      <span className="works-status-badge">
                        In design phase
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default MyWorks;
