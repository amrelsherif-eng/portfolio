import type { IconType } from "react-icons";
import {
  SiCisco,
  SiAmazonec2,
  SiAmazons3,
  SiAmazonrds,
  SiAmazoniam,
  SiAmazoncloudwatch,
  SiAwselasticloadbalancing,
  SiAwslambda,
  SiLinux,
  SiGnubash,
  SiGit,
  SiGithub,
  SiDocker,
  SiGithubactions,
  SiTerraform,
  SiEspressif,
  SiArduino,
  SiRaspberrypi,
  SiProteus,
  SiC,
  SiCplusplus,
  SiPython,
  SiFlutter,
  SiDart,
  SiFirebase,
  SiPhp,
  SiMysql,
} from "react-icons/si";
import {
  TbNetwork,
  TbArrowsSplit,
  TbRoute,
  TbBinaryTree,
  TbShieldCheck,
  TbArrowsExchange,
  TbBinary,
  TbCloudNetwork,
  TbCpu,
  TbGauge,
  TbApi,
} from "react-icons/tb";
import "./styles/TechStackNew.css";

interface TechItem {
  name: string;
  icon: IconType;
  badge?: string;
}

interface TechCategory {
  title: string;
  items: TechItem[];
}

const techCategories: TechCategory[] = [
  {
    title: "Networking",
    items: [
      { name: "Cisco IOS", icon: SiCisco },
      { name: "Packet Tracer", icon: TbNetwork },
      { name: "Routing & Switching", icon: TbArrowsSplit },
      { name: "OSPF", icon: TbRoute },
      { name: "VLAN / STP", icon: TbBinaryTree },
      { name: "ACL & NAT", icon: TbShieldCheck },
      { name: "TCP/IP", icon: TbArrowsExchange },
      { name: "Subnetting", icon: TbBinary },
    ],
  },
  {
    title: "Cloud (AWS)",
    items: [
      { name: "EC2", icon: SiAmazonec2 },
      { name: "S3", icon: SiAmazons3 },
      { name: "VPC", icon: TbCloudNetwork },
      { name: "RDS", icon: SiAmazonrds },
      { name: "IAM", icon: SiAmazoniam },
      { name: "CloudWatch", icon: SiAmazoncloudwatch },
      { name: "Load Balancing & Auto Scaling", icon: SiAwselasticloadbalancing },
      { name: "Serverless", icon: SiAwslambda },
    ],
  },
  {
    title: "Linux & DevOps",
    items: [
      { name: "Linux", icon: SiLinux },
      { name: "Bash", icon: SiGnubash },
      { name: "Git", icon: SiGit },
      { name: "GitHub", icon: SiGithub },
      { name: "Docker", icon: SiDocker, badge: "NEXT" },
      { name: "CI/CD", icon: SiGithubactions, badge: "NEXT" },
      { name: "Terraform", icon: SiTerraform, badge: "NEXT" },
    ],
  },
  {
    title: "Embedded & IoT",
    items: [
      { name: "ESP32", icon: SiEspressif },
      { name: "Arduino", icon: SiArduino },
      { name: "Raspberry Pi", icon: SiRaspberrypi },
      { name: "PIC", icon: TbCpu },
      { name: "Proteus", icon: SiProteus },
      { name: "C", icon: SiC },
      { name: "C++", icon: SiCplusplus },
      { name: "PID Control", icon: TbGauge },
    ],
  },
  {
    title: "Code & Mobile",
    items: [
      { name: "Python", icon: SiPython },
      { name: "Flutter", icon: SiFlutter },
      { name: "Dart", icon: SiDart },
      { name: "Firebase", icon: SiFirebase },
      { name: "REST APIs", icon: TbApi },
      { name: "PHP", icon: SiPhp },
      { name: "MySQL", icon: SiMysql },
    ],
  },
];

const TechStackNew = () => {
  return (
    <div className="techstack-new" id="techstack">
      <div className="techstack-container">
        <h2 className="techstack-title">Tech Stack</h2>

        <div className="techstack-grid">
          {techCategories.map((category) => (
            <div key={category.title} className="techstack-card">
              <h3 className="techstack-card-label">{category.title}</h3>
              <div className="techstack-chips">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.name}
                      className="techstack-chip"
                      data-cursor="disable"
                    >
                      <Icon className="techstack-chip-icon" aria-hidden="true" />
                      <span className="techstack-chip-name">{item.name}</span>
                      {item.badge && (
                        <span className="techstack-chip-badge">{item.badge}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechStackNew;
