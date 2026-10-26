import "./styles/Work.css";
import "./styles/WorkCta.css";
import WorkImage from "./WorkImage";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { config } from "../config";

gsap.registerPlugin(ScrollTrigger);

const Work = () => {
  useEffect(() => {
    // Disable pinning on mobile to allow scrolling
    if (window.innerWidth <= 768) return;

    let translateX: number = 0;

    function setTranslateX() {
      const box = document.getElementsByClassName("work-box");
      if (box.length === 0) return;
      const rectLeft = document
        .querySelector(".work-container")!
        .getBoundingClientRect().left;
      const rect = box[0].getBoundingClientRect();
      const parentWidth = box[0].parentElement!.getBoundingClientRect().width;
      let padding: number =
        parseInt(window.getComputedStyle(box[0]).padding) / 2;
      translateX = rect.width * box.length - (rectLeft + parentWidth) + padding;
    }

    setTranslateX();

    let timeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".work-section",
        start: "top top",
        end: `+=${translateX}`,
        scrub: 1,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        id: "work",
        invalidateOnRefresh: true,
      },
    });

    timeline.to(".work-flex", {
      x: -translateX,
      ease: "none",
    });

    // Refresh ScrollTrigger after layout settles
    ScrollTrigger.refresh();

    // Clean up
    return () => {
      timeline.kill();
      ScrollTrigger.getById("work")?.kill();
    };
  }, []);
  return (
    <div className="work-section" id="work">
      <div className="work-container section-container">
        <div className="work-head">
          <h2>
            My <span>Work</span>
          </h2>
          <Link to="/works" className="work-all-link" data-cursor="disable">
            All works →
          </Link>
        </div>
        <div className="work-flex">
          {config.projects.slice(0, 5).map((project, index) => (
            <div className="work-box" key={project.id}>
              <div className="work-info">
                <div className="work-title">
                  <span className="work-num" aria-hidden="true">0{index + 1}</span>

                  <div>
                    <h3 className="work-name">{project.title}</h3>
                    <p>{project.category}</p>
                  </div>
                </div>
                <p className="work-desc">{project.description}</p>
                <div className="work-label">Stack</div>
                <p className="work-stack">{project.technologies}</p>
              </div>
              <WorkImage image={project.image} alt={project.title} link={project.link} />
            </div>
          ))}
          {/* See All Works Button */}
          <div className="work-box work-box-cta">
            <div className="see-all-works">
              <h3>Want to see more?</h3>
              <p>Every project in one place — plus labs and code on GitHub.</p>
              <div className="see-all-actions">
                <Link to="/works" className="see-all-btn" data-cursor="disable">
                  See all works →
                </Link>
                <a
                  href={config.contact.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="see-all-btn-ghost"
                  data-cursor="disable"
                >
                  GitHub ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Work;
