import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import "./styles/SubpageNav.css";

interface SubpageLink {
  label: string;
  path: string;
}

const NAV_ITEMS: readonly SubpageLink[] = [
  { label: "Works", path: "/works" },
  { label: "Certifications", path: "/certifications" },
  { label: "CV", path: "/resume" },
  { label: "Lab", path: "/lab" },
];

export default function SubpageNav() {
  const location = useLocation();

  return (
    <nav className="subpage-nav" aria-label="Subpage navigation">
      <div className="subpage-nav-left">
        <Link to="/" className="subpage-nav-home" data-cursor="disable">
          ← Home
        </Link>
      </div>
      <div className="subpage-nav-right">
        {NAV_ITEMS.map((item, index) => {
          const isCurrent =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + "/");
          return (
            <Fragment key={item.path}>
              {index > 0 && (
                <span className="subpage-nav-sep" aria-hidden="true">
                  ·
                </span>
              )}
              <Link
                to={item.path}
                className={`subpage-nav-link${isCurrent ? " is-active" : ""}`}
                aria-current={isCurrent ? "page" : undefined}
                data-cursor="disable"
              >
                {item.label}
              </Link>
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
}
