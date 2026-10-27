import { Link } from "react-router-dom";
import { labGames } from "../lab/games";
import "./styles/LabTeaser.css";

const LabTeaser = () => {
  return (
    <section className="lab-teaser-section" aria-labelledby="lab-teaser-title">
      <div className="lab-teaser-card">
        <div className="lab-teaser-topbar" aria-hidden="true">
          <div className="lab-teaser-dots">
            <span className="lab-teaser-dot lab-teaser-dot--red" />
            <span className="lab-teaser-dot lab-teaser-dot--yellow" />
            <span className="lab-teaser-dot lab-teaser-dot--green" />
          </div>
          <span className="lab-teaser-topbar-title">~/network-lab</span>
        </div>

        <div className="lab-teaser-body">
          <div className="lab-teaser-left">
            <p className="lab-teaser-eyebrow">$ ./network-lab</p>
            <h2 className="lab-teaser-title" id="lab-teaser-title">
              Network Lab
            </h2>
            <p className="lab-teaser-desc">
              Short browser games on the CCNA and AWS topics I'm studying.
            </p>
            <Link
              to="/lab"
              className="lab-teaser-cta"
              data-cursor="disable"
            >
              Open the Lab →
            </Link>
          </div>

          <div className="lab-teaser-games">
            {labGames.map((game) => {
              const trackClass =
                game.track === "AWS"
                  ? "lab-teaser-badge--aws"
                  : "lab-teaser-badge--ccna";

              return (
                <Link
                  key={game.id}
                  to={`/lab/${game.id}`}
                  className="lab-teaser-game-row"
                  data-cursor="disable"
                >
                  <div className="lab-teaser-game-main">
                    <div className="lab-teaser-game-header">
                      <span className={`lab-teaser-badge ${trackClass}`}>
                        {game.track}
                      </span>
                      <span className="lab-teaser-game-title">{game.title}</span>
                    </div>
                    <p className="lab-teaser-game-tagline">{game.tagline}</p>
                  </div>
                  <div className="lab-teaser-game-meta">
                    <span className="lab-teaser-game-time">
                      ~{game.minutes} min
                    </span>
                    <span className="lab-teaser-arrow" aria-hidden="true">
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LabTeaser;
