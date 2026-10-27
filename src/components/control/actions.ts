// Shared actions for hand-gesture and voice control.
// Both input modes call ONLY these functions, so the site logic lives in one place.
import { lenis } from "../Navbar";

export type SectionId = "top" | "about" | "work" | "techstack" | "certifications" | "contact";

export function navigateTo(path: string): void {
  window.dispatchEvent(new CustomEvent<string>("control:navigate", { detail: path }));
}

const SECTION_SELECTOR: Record<SectionId, string> = {
  top: "#landingDiv",
  about: "#about",
  work: "#work",
  techstack: "#techstack",
  certifications: "#certifications",
  contact: "#contact",
};

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Scroll the page by `px` (positive = down). Uses Lenis when it is running. */
export function scrollByPx(px: number, smooth = true): void {
  if (lenis && window.location.pathname === "/" && !document.documentElement.classList.contains("scroll-locked")) {
    lenis.scrollTo(lenis.scroll + px, { immediate: !smooth || reducedMotion(), duration: 0.6 });
  } else {
    window.scrollBy({ top: px, behavior: smooth && !reducedMotion() ? "smooth" : "auto" });
  }
}

/** Jump to a home-page section. Returns false when the section is not on this page. */
export function goToSection(id: SectionId): boolean {
  if (id === "top" && window.location.pathname !== "/") {
    window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
    return true;
  }
  const el = document.querySelector<HTMLElement>(SECTION_SELECTOR[id]);
  if (!el) {
    if (window.location.pathname !== "/") {
      try { sessionStorage.setItem("control:pending-section", id); } catch { /* storage may be unavailable */ }
      navigateTo("/");
      return true;
    }
    return false;
  }
  if (lenis && !document.documentElement.classList.contains("scroll-locked")) lenis.scrollTo(el, { offset: 0, duration: 1.5, immediate: reducedMotion() });
  else el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
  return true;
}

/** Open the Ping chat panel (SherifChat listens for this event). */
export function openPing(): void {
  window.dispatchEvent(new Event("sherif:open"));
}

/** Open the CV page through the existing router link, so no full reload happens. */
export function openResume(): void {
  if (window.location.pathname === "/resume") return;
  navigateTo("/resume");
}

/** Move the site's custom glowing cursor (Cursor.tsx follows document mousemove). */
export function moveCursor(x: number, y: number): void {
  document.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }));
}

/** Click whatever interactive element is under a viewport point. Returns true if something was clicked. */
export function clickAt(x: number, y: number): boolean {
  const hit = document.elementFromPoint(x, y);
  const target = hit?.closest<HTMLElement>("a, button, [role='button'], input, summary, [tabindex]");
  if (!target || target.closest("[data-control-ui]")) return false;
  target.click();
  return true;
}

/** Event other modules use to show a short status toast in the control dock, e.g. "Scrolling down". */
export function announce(message: string): void {
  window.dispatchEvent(new CustomEvent<string>("control:announce", { detail: message }));
}
