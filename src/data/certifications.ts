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
  image?: string; // certificate preview (public/images/certs/<id>.webp)
};

export const certifications: Certification[] = [
  {
    id: "aws-arch",
    name: "AWS Academy Graduate – Cloud Architecting",
    issuer: "AWS Academy",
    date: "Sep 2026",
    category: "Cloud & Networking",
    featured: true,
    verifyUrl: "https://www.credly.com/badges/2a5e97d8-ab58-4e9a-a345-0e21a2687ec7",
    image: "/images/certs/aws-arch.webp",
  },
  {
    id: "aws-found",
    name: "AWS Academy Graduate – Cloud Foundations",
    issuer: "AWS Academy",
    date: "Aug 2026",
    category: "Cloud & Networking",
    featured: true,
    verifyUrl: "https://www.credly.com/badges/2ef79065-9c11-4ee0-b949-a87948e4218d",
    image: "/images/certs/aws-found.webp",
  },
  {
    id: "ccna-itn",
    name: "CCNA: Introduction to Networks",
    issuer: "Cisco Networking Academy · NTI",
    date: "Oct 2026", // course start; ends Dec 2026
    category: "Cloud & Networking",
    status: "in-progress",
    featured: true,
    verifyUrl: "", // TODO: add the Cisco badge link + preview when finished
  },
  {
    id: "ccna-srwe",
    name: "CCNA: Switching, Routing & Wireless Essentials",
    issuer: "Cisco Networking Academy · NTI",
    date: "Oct 2026", // course start; ends Jan 2027
    category: "Cloud & Networking",
    status: "in-progress",
    verifyUrl: "", // TODO: add the Cisco badge link + preview when finished
  },
  {
    id: "ccna-ensa",
    name: "CCNA: Enterprise Networking, Security & Automation",
    issuer: "Cisco Networking Academy · NTI",
    date: "Oct 2026", // course start; ends Jan 2027
    category: "Cloud & Networking",
    status: "in-progress",
    verifyUrl: "", // TODO: add the Cisco badge link + preview when finished
  },
  {
    id: "nti-cloud",
    name: "Cloud Architect Internship",
    issuer: "NTI × ITIDA (MCIT)",
    date: "Aug 2026",
    category: "Programs & Training",
    hours: "120 h",
    verifyUrl: "", // TODO: verify link from LinkedIn
    image: "/images/certs/nti-cloud.webp",
  },
  {
    id: "depi-appreciation",
    name: "Certificate of Appreciation – Team Leader",
    issuer: "MCIT · DEPI",
    date: "Jul 2026",
    category: "Programs & Training",
    featured: true,
    verifyUrl: "", // TODO: verify link from LinkedIn
    image: "/images/certs/depi-appreciation.webp",
  },
  {
    id: "depi-achievement",
    name: "Certificate of Achievement – Cross-Platform Mobile (Flutter)",
    issuer: "MCIT · DEPI",
    date: "Jul 2026",
    category: "Programs & Training",
    verifyUrl: "", // TODO: verify link from LinkedIn
    image: "/images/certs/depi-achievement.webp",
  },
  {
    id: "nti-php",
    name: "Full Stack Web Development (PHP) Internship",
    issuer: "NTI × ITIDA",
    date: "Jul 2025",
    category: "Programs & Training",
    hours: "120 h",
    verifyUrl: "", // TODO: verify link from LinkedIn
    image: "/images/certs/nti-php.webp",
  },
  {
    id: "iti-php",
    name: "Web Development using PHP",
    issuer: "ITI",
    date: "",
    category: "Programs & Training",
    hours: "60 h",
    verifyUrl: "", // TODO: verify link from LinkedIn
    image: "/images/certs/iti-php.webp",
  },
  {
    id: "packt-flutter",
    name: "Getting Started with Flutter & Dart",
    issuer: "Packt · Coursera",
    date: "Apr 2026",
    category: "Programs & Training",
    verifyUrl: "https://coursera.org/verify/G3TC13R6ZLMO",
    image: "/images/certs/packt-flutter.webp",
  },
  {
    id: "cisco-english",
    name: "English for IT 1",
    issuer: "Cisco Networking Academy",
    date: "Oct 2025",
    category: "Languages & Skills",
    verifyUrl: "", // TODO: verify link from LinkedIn
    image: "/images/certs/cisco-english.webp",
  },
  {
    id: "depi-english",
    name: "Business English",
    issuer: "MCIT · DEPI",
    date: "",
    category: "Languages & Skills",
    verifyUrl: "", // TODO: verify link from LinkedIn
    image: "/images/certs/depi-english.webp",
  },
  {
    id: "helsinki-ai",
    name: "Elements of AI for Business",
    issuer: "University of Helsinki",
    date: "",
    category: "Languages & Skills",
    verifyUrl: "", // TODO: verify link from LinkedIn
    image: "/images/certs/helsinki-ai.webp",
  },
  {
    id: "mckinsey",
    name: "Forward Program",
    issuer: "McKinsey.org",
    date: "Jun 2026",
    category: "Languages & Skills",
    verifyUrl: "", // TODO: verify link from LinkedIn
    image: "/images/certs/mckinsey.webp",
  },
  {
    id: "build-ai",
    name: "Build with AI: Masr Edition (attendance)",
    issuer: "Google for Developers × ITI",
    date: "",
    category: "Languages & Skills",
    verifyUrl: "", // TODO: verify link from LinkedIn
    image: "/images/certs/build-ai.webp",
  },
  {
    id: "sprintup",
    name: "Python",
    issuer: "SprintUp",
    date: "May 2025",
    category: "Languages & Skills",
    verifyUrl: "", // TODO: verify link from LinkedIn
    image: "/images/certs/sprintup.webp",
  },
  {
    id: "be-ready",
    name: "Be Ready – Employability Skills",
    issuer: "", // TODO: confirm issuer (UI hides empty issuer)
    date: "Sep 2025",
    category: "Languages & Skills",
    verifyUrl: "", // TODO: verify link from LinkedIn
    image: "/images/certs/be-ready.webp",
  },
];
