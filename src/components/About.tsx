import "./styles/About.css";
import { config } from "../config";

const About = () => {
  return (
    <div className="about-section" id="about">
      <div className="about-me">
        <h2 className="title">{config.about.title}</h2>
        <p className="para">
          {config.about.description}
        </p>
      </div>
    </div>
  );
};

export default About;
