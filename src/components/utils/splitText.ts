import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextSplitter } from "../../utils/textSplitter";

interface ParaElement extends HTMLElement {
  anim?: gsap.core.Animation;
  split?: TextSplitter;
}

gsap.registerPlugin(ScrollTrigger);

// register the "re-split on refresh" listener only once (it used to be added on every call and pile up)
let refreshListenerAdded = false;

// reveal as soon as the section is well into view; when scrolling back up, hide 3x faster
function revealTrigger(trigger: Element | null | undefined, anim: () => gsap.core.Animation | undefined) {
  return {
    trigger,
    start: window.innerWidth <= 1024 ? "top 70%" : "top 65%",
    onEnter: () => anim()?.timeScale(1).play(),
    onLeaveBack: () => anim()?.timeScale(3).reverse(),
  };
}

export default function setSplitText() {
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (window.innerWidth < 900) return;
  const paras: NodeListOf<ParaElement> = document.querySelectorAll(".para");
  const titles: NodeListOf<ParaElement> = document.querySelectorAll(".title");


  paras.forEach((para: ParaElement) => {
    para.classList.add("visible");
    if (para.anim) {
      para.anim.progress(1).kill();
      para.split?.revert();
    }

    para.split = new TextSplitter(para, {
      type: "lines,words",
      linesClass: "split-line",
    });

    para.anim = gsap.fromTo(
      para.split.words,
      { autoAlpha: 0, y: 80 },
      {
        autoAlpha: 1,
        paused: true,
        scrollTrigger: revealTrigger(para.parentElement?.parentElement, () => para.anim),
        duration: 0.8,
        ease: "power3.out",
        y: 0,
        stagger: 0.012,
      }
    );
  });
  titles.forEach((title: ParaElement) => {
    if (title.anim) {
      title.anim.progress(1).kill();
      title.split?.revert();
    }
    title.split = new TextSplitter(title, {
      type: "chars,lines",
      linesClass: "split-line",
    });
    title.anim = gsap.fromTo(
      title.split.chars,
      { autoAlpha: 0, y: 80, rotate: 10 },
      {
        autoAlpha: 1,
        paused: true,
        scrollTrigger: revealTrigger(title.parentElement?.parentElement, () => title.anim),
        duration: 0.8,
        ease: "power2.inOut",
        y: 0,
        rotate: 0,
        stagger: 0.03,
      }
    );
  });

  if (!refreshListenerAdded) {
    refreshListenerAdded = true;
    ScrollTrigger.addEventListener("refresh", () => setSplitText());
  }
}
