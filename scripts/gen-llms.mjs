import { writeFile } from "node:fs/promises";
import { config } from "../src/config.ts";
import { certifications } from "../src/data/certifications.ts";

const clean = (value) => String(value ?? "").replace(/[\r\n]+/g, " ").trim();

const experienceLines = config.experiences.map(
  ({ position, company, period, description }) =>
    `- ${clean(position)} — ${clean(company)} (${clean(period)}): ${clean(description)}`,
);

const projectLines = config.projects.map(({ title, description, link }) => {
  const safeLink = clean(link);
  const linkLabel = safeLink ? ` — [GitHub](${safeLink})` : "";
  return `- ${clean(title)}${linkLabel}: ${clean(description)}`;
});

const certificationLines = certifications.map(({ name, issuer, date, status, verifyUrl }) => {
  const safeIssuer = clean(issuer);
  const safeDate = clean(date);
  const safeVerifyUrl = clean(verifyUrl);
  const issuerPart = safeIssuer ? ` — ${safeIssuer}` : "";
  const datePart = safeDate ? `, ${safeDate}` : "";
  const statusPart = status === "in-progress" ? " (in progress)" : "";
  const verifyPart = safeVerifyUrl ? `: ${safeVerifyUrl}` : "";
  return `- ${clean(name)}${issuerPart}${datePart}${statusPart}${verifyPart}`;
});

const content = `# ${clean(config.developer.fullName)}

> ${clean(config.developer.description)}

${clean(config.about.description)}

## Focus & roadmap
- Direction: Network & Cloud Infrastructure → DevOps.
- Roadmap: CCNA (now, exam expected late 2026) → Linux (RHCSA, starting) → AWS SAA-C03 (later) → DevOps (Docker, CI/CD, Terraform).
- Target roles: Network Engineer, NOC Engineer, Cloud Engineer, System Administrator, Junior DevOps. Internships now; full-time from July 2027.

## Experience
${experienceLines.join("\n")}

## Projects
${projectLines.join("\n")}

## Certifications
${certificationLines.join("\n")}

## Network Lab
- [Network Lab](https://amrelsherif-eng.vercel.app/lab): three short browser mini-games following the learning path (practice games for visitors, not work experience).
- [Subnetting Sprint](https://amrelsherif-eng.vercel.app/lab/subnetting): IPv4 subnetting quiz.
- [Fix the Network](https://amrelsherif-eng.vercel.app/lab/troubleshoot): CCNA troubleshooting cases.
- [Build a VPC](https://amrelsherif-eng.vercel.app/lab/vpc): AWS VPC building puzzle.

## Pages
- [Home](https://amrelsherif-eng.vercel.app/)
- [All works](https://amrelsherif-eng.vercel.app/works)
- [Certifications](https://amrelsherif-eng.vercel.app/certifications)
- [Resume](https://amrelsherif-eng.vercel.app/resume)

## Contact
- Email: ${clean(config.contact.email)}
- LinkedIn: ${clean(config.contact.linkedin)}
- GitHub: ${clean(config.contact.github)}
`;

await writeFile(new URL("../public/llms.txt", import.meta.url), content, {
  encoding: "utf8",
  newline: "\n",
});
