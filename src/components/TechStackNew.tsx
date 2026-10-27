import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { IconType } from "react-icons";
import {
  SiCisco, SiAmazonec2, SiAmazons3, SiAmazonrds, SiAmazoniam, SiLinux,
  SiGit, SiGithub, SiEspressif, SiArduino,
  SiRaspberrypi, SiProteus, SiC, SiCplusplus, SiPython, SiFlutter, SiDart,
  SiFirebase, SiPhp, SiMysql,
} from "react-icons/si";
import {
  TbNetwork, TbArrowsSplit, TbRoute, TbBinaryTree, TbShieldCheck,
  TbArrowsExchange, TbBinary, TbCloudNetwork, TbCpu, TbApi,
} from "react-icons/tb";
import "./styles/TechStackNew.css";

interface TechItem { name: string; icon: IconType; color: string }
interface TechCategory { title: string; terminal: string; items: TechItem[] }
interface LearningItem { name: string; status: "In progress" | "Next" }

const techCategories: TechCategory[] = [
  { title: "Networking", terminal: "$ ls networking/", items: [
    { name: "Cisco Routing & Switching", icon: SiCisco, color: "#1BA0D7" },
    { name: "Subnetting", icon: TbBinary, color: "var(--accentColor)" },
    { name: "OSPF", icon: TbRoute, color: "var(--accentColor)" },
    { name: "VLAN", icon: TbBinaryTree, color: "var(--accentColor)" },
    { name: "ACL", icon: TbShieldCheck, color: "var(--accentColor)" },
    { name: "NAT", icon: TbArrowsExchange, color: "var(--accentColor)" },
    { name: "TCP/IP", icon: TbArrowsSplit, color: "var(--accentColor)" },
  ] },
  { title: "Cloud (AWS)", terminal: "$ ls cloud-aws/", items: [
    { name: "EC2", icon: SiAmazonec2, color: "#FF9900" },
    { name: "S3", icon: SiAmazons3, color: "#FF9900" },
    { name: "VPC", icon: TbCloudNetwork, color: "var(--accentColor)" },
    { name: "RDS", icon: SiAmazonrds, color: "#FF9900" },
    { name: "IAM", icon: SiAmazoniam, color: "#FF9900" },
    { name: "Load Balancing & Auto Scaling", icon: TbArrowsSplit, color: "var(--accentColor)" },
    { name: "CloudWatch", icon: TbBinaryTree, color: "var(--accentColor)" },
    { name: "Serverless", icon: TbApi, color: "var(--accentColor)" },
  ] },
  { title: "Embedded", terminal: "$ ls embedded/", items: [
    { name: "ESP32", icon: SiEspressif, color: "#E7352C" },
    { name: "Arduino", icon: SiArduino, color: "#00979D" },
    { name: "PIC", icon: TbCpu, color: "var(--accentColor)" },
    { name: "Raspberry Pi", icon: SiRaspberrypi, color: "#C51A4A" },
    { name: "Proteus", icon: SiProteus, color: "#00599C" },
  ] },
  { title: "Linux & Tools", terminal: "$ ls tools/", items: [
    { name: "Linux", icon: SiLinux, color: "#FCC624" },
    { name: "Git", icon: SiGit, color: "#F05032" },
    { name: "GitHub", icon: SiGithub, color: "#ffffff" },
    { name: "Packet Tracer", icon: TbNetwork, color: "var(--accentColor)" },
  ] },
  { title: "Code & Mobile", terminal: "$ ls code-mobile/", items: [
    { name: "Python", icon: SiPython, color: "#3776AB" },
    { name: "C", icon: SiC, color: "#659AD2" },
    { name: "C++", icon: SiCplusplus, color: "#659AD2" },
    { name: "Dart", icon: SiDart, color: "#29B6F6" },
    { name: "Flutter", icon: SiFlutter, color: "#54C5F8" },
    { name: "Firebase", icon: SiFirebase, color: "#FFCA28" },
    { name: "PHP", icon: SiPhp, color: "#777BB4" },
    { name: "MySQL", icon: SiMysql, color: "#5FA8D3" },
    { name: "REST APIs", icon: TbApi, color: "var(--accentColor)" },
  ] },
];

// Keep each two-column row balanced at tablet and desktop widths.
const techCategoriesInGridOrder = techCategories; // desktop placement is done with CSS order (see TechStackNew.css)

const currentlyLearningItems: LearningItem[] = [
  { name: "CCNA 200-301", status: "In progress" },
  { name: "Linux (RHCSA path)", status: "In progress" },
  { name: "AWS Solutions Architect (SAA-C03)", status: "Next" },
  { name: "Docker & CI/CD", status: "Next" },
];

const TechStackNew = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }
    const current = sectionRef.current;
    if (!current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(current);
      }
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    observer.observe(current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return (
    <div className="techstack-new" id="techstack" ref={sectionRef}>
      <div className="techstack-container">
        <h2 className="techstack-title">Tech Stack</h2>
        <div className="techstack-grid">
          {techCategoriesInGridOrder.map((category, index) => (
            <div key={category.title} className={`techstack-card ${isVisible ? "techstack-card--visible" : ""}`} style={{ "--card-index": index } as CSSProperties} onMouseMove={handleMouseMove}>
              <div className="techstack-card-header">
                <span className="techstack-card-terminal">{category.terminal}</span>
                <h3 className="techstack-card-label">{category.title}</h3>
              </div>
              <div className="techstack-chips">
                {category.items.map(({ name, icon: Icon, color }) => (
                  <div key={name} className="techstack-chip" style={{ "--brand": color } as CSSProperties} data-cursor="disable">
                    <Icon className="techstack-chip-icon" aria-hidden="true" />
                    <span className="techstack-chip-name">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className={`techstack-card techstack-card--learning ${isVisible ? "techstack-card--visible" : ""}`} style={{ "--card-index": 5 } as CSSProperties} onMouseMove={handleMouseMove}>
            <div className="techstack-card-header">
              <span className="techstack-card-terminal">$ cat roadmap.md</span>
              <h3 className="techstack-card-label">Currently Learning</h3>
            </div>
            <div className="techstack-learning-list">
              {currentlyLearningItems.map(({ name, status }) => (
                <div key={name} className="techstack-learning-row" data-cursor="disable">
                  <span className="techstack-learning-name">{name}</span>
                  <span className={`techstack-learning-pill ${status === "In progress" ? "techstack-learning-pill--progress" : "techstack-learning-pill--pending"}`}>
                    {status === "In progress" && <span className="techstack-learning-dot" aria-hidden="true" />}{status}
                  </span>
                </div>
              ))}
            </div>
            <p className="techstack-motto">Your speed doesn't matter, forward is forward. <span aria-hidden="true">🐢</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechStackNew;
