export type CertCategory =
  | "Cloud & Networking"
  | "Programs & Training"
  | "Languages & Skills";

export type Certification = {
  id: string;
  name: string;
  issuer: string;
  date: string; // "" when unknown — the UI must hide empty dates
  category: CertCategory;
  status?: "in-progress";
  hours?: string; // e.g. "120 h"
  featured?: boolean; // shown in the home section (max 4)
  verifyUrl: string; // "" = not added yet -> UI shows no verify link
};

export const certifications: Certification[] = [
  {
    id: "aws-arch",
    name: "AWS Academy Graduate – Cloud Architecting",
    issuer: "AWS Academy",
    date: "Aug 2026",
    category: "Cloud & Networking",
    featured: true,
    verifyUrl: "", // TODO: verify link from LinkedIn
  },
  {
    id: "aws-found",
    name: "AWS Academy Graduate – Cloud Foundations",
    issuer: "AWS Academy",
    date: "Aug 2026",
    category: "Cloud & Networking",
    featured: true,
    verifyUrl: "", // TODO: verify link from LinkedIn
  },
  {
    id: "ccna",
    name: "Cisco CCNA v7: Routing & Switching",
    issuer: "NTI · Digital Egypt Youth",
    date: "Oct 2026",
    category: "Cloud & Networking",
    status: "in-progress",
    hours: "120 h",
    featured: true,
    verifyUrl: "", // TODO: verify link from LinkedIn
  },
  {
    id: "nti-cloud",
    name: "Cloud Architect Internship",
    issuer: "NTI × ITIDA (MCIT)",
    date: "Aug 2026",
    category: "Programs & Training",
    hours: "120 h",
    verifyUrl: "", // TODO: verify link from LinkedIn
  },
  {
    id: "depi-appreciation",
    name: "Certificate of Appreciation – Team Leader",
    issuer: "MCIT · DEPI",
    date: "Jul 2026",
    category: "Programs & Training",
    featured: true,
    verifyUrl: "", // TODO: verify link from LinkedIn
  },
  {
    id: "depi-achievement",
    name: "Certificate of Achievement – Cross-Platform Mobile (Flutter)",
    issuer: "MCIT · DEPI",
    date: "Jul 2026",
    category: "Programs & Training",
    verifyUrl: "", // TODO: verify link from LinkedIn
  },
  {
    id: "nti-php",
    name: "Full Stack Web Development (PHP) Internship",
    issuer: "NTI × ITIDA",
    date: "Jul 2025",
    category: "Programs & Training",
    hours: "120 h",
    verifyUrl: "", // TODO: verify link from LinkedIn
  },
  {
    id: "iti-php",
    name: "Web Development using PHP",
    issuer: "ITI",
    date: "",
    category: "Programs & Training",
    hours: "60 h",
    verifyUrl: "", // TODO: verify link from LinkedIn
  },
  {
    id: "packt-flutter",
    name: "Getting Started with Flutter & Dart",
    issuer: "Packt · Coursera",
    date: "Apr 2026",
    category: "Programs & Training",
    verifyUrl: "https://coursera.org/verify/G3TC13R6ZLMO",
  },
  {
    id: "cisco-english",
    name: "English for IT 1",
    issuer: "Cisco Networking Academy",
    date: "Oct 2025",
    category: "Languages & Skills",
    verifyUrl: "", // TODO: verify link from LinkedIn
  },
  {
    id: "depi-english",
    name: "Business English",
    issuer: "MCIT · DEPI",
    date: "",
    category: "Languages & Skills",
    verifyUrl: "", // TODO: verify link from LinkedIn
  },
  {
    id: "helsinki-ai",
    name: "Elements of AI for Business",
    issuer: "University of Helsinki",
    date: "",
    category: "Languages & Skills",
    verifyUrl: "", // TODO: verify link from LinkedIn
  },
  {
    id: "mckinsey",
    name: "Forward Program",
    issuer: "McKinsey.org",
    date: "Jun 2026",
    category: "Languages & Skills",
    verifyUrl: "", // TODO: verify link from LinkedIn
  },
  {
    id: "build-ai",
    name: "Build with AI: Masr Edition (attendance)",
    issuer: "Google for Developers × ITI",
    date: "",
    category: "Languages & Skills",
    verifyUrl: "", // TODO: verify link from LinkedIn
  },
  {
    id: "sprintup",
    name: "Python",
    issuer: "SprintUp",
    date: "May 2025",
    category: "Languages & Skills",
    verifyUrl: "", // TODO: verify link from LinkedIn
  },
  {
    id: "be-ready",
    name: "Be Ready – Employability Skills",
    issuer: "", // TODO: confirm issuer (UI hides empty issuer)
    date: "Sep 2025",
    category: "Languages & Skills",
    verifyUrl: "", // TODO: verify link from LinkedIn
  },
];
