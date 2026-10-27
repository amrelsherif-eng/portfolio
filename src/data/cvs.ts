// The three CV versions offered on /resume.
// TEMPORARY: all three point to the same LinkedIn-export PDF until the real CVs are made.
export type CvVersion = {
  id: string;
  title: string;
  role: string; // the roles this version targets
  summary: string;
  focus: string[];
  file: string; // PDF in /public
  preview: string; // first-page image
  recommended?: boolean;
  updated: string;
  draft?: boolean; // true = placeholder file, shown with a small "Draft" note
};

export const cvs: CvVersion[] = [
  {
    id: "network-cloud",
    title: "Network & Cloud",
    role: "Network · NOC · Cloud · System Admin · Junior DevOps",
    summary:
      "My main CV. CCNA track at NTI, an AWS cloud internship with two AWS Academy Graduate badges, and the Linux path to DevOps.",
    focus: ["CCNA", "AWS", "Linux", "Subnetting", "VPC"],
    file: "/cv/Amr-Elsherif-CV.pdf",
    preview: "/images/cv/network-cloud.webp",
    recommended: true,
    updated: "Oct 2026",
    draft: true,
  },
  {
    id: "embedded-ece",
    title: "Embedded & ECE",
    role: "Embedded · IoT · Instrumentation & Control",
    summary:
      "The engineering side: ESP32 and Raspberry Pi projects, PID auto-tuning in industrial training, and electrical distribution training rated Excellent.",
    focus: ["ESP32", "Raspberry Pi", "C / C++", "PID", "IoT"],
    file: "/cv/Amr-Elsherif-CV.pdf",
    preview: "/images/cv/embedded-ece.webp",
    updated: "Oct 2026",
    draft: true,
  },
  {
    id: "mobile-apps",
    title: "Mobile Apps",
    role: "Flutter Developer · Team Lead",
    summary:
      "DEPI Flutter track (~120 technical hours), Team Leader of a 20-trainee group, and the team behind DevSync and WeatherLink.",
    focus: ["Flutter", "Dart", "Firebase", "BLoC", "Leadership"],
    file: "/cv/Amr-Elsherif-CV.pdf",
    preview: "/images/cv/mobile-apps.webp",
    updated: "Oct 2026",
    draft: true,
  },
];
