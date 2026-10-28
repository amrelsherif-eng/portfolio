# Amr Elsherif — Portfolio

Personal portfolio of Amr Elsherif, Network & Cloud Infrastructure (CCNA track, AWS, Linux), aspiring DevOps engineer, ECE '27.

Live: https://amrelsherif-eng.vercel.app

## What it is

A portfolio presenting Amr's background, work, certifications, resume, and networking/cloud learning through an interactive 3D site.

Pages: `/` (home), `/works`, `/certifications`, `/resume`, `/lab`, and `/lab/:id`.

## Features

- **3D landing page:** An animated character rendered with Three.js and React Three Fiber, with GSAP animation and Lenis smooth scrolling.
- **Network Lab:** Three browser mini-games: Subnetting Sprint, Fix the Network, and Build a VPC.
- **Ping assistant:** Answers questions using information in the portfolio. Chat requests use Gemini; voice requests use Groq with Gemini fallback. The Vercel serverless endpoints apply rate limits and request time budgets. Upstash Redis can provide shared rate limiting when configured.
- **Hands-free control dock:** Voice commands navigate sections, open the resume or Ping, and answer portfolio questions. Hand-gesture controls use MediaPipe and the camera for pointer, click, and scroll interactions.
- **Portfolio pages:** Works, certifications, and a resume/CV page.
- **Discovery and metadata:** Generates `llms.txt` during the build and provides JSON-LD metadata.
- **Deployment security:** `vercel.json` configures a Content Security Policy and other security headers.
- **Continuous integration:** GitHub Actions runs lint, build, and the three Node test scripts listed below.

## Tech stack

- React 18, TypeScript, and Vite 8
- Three.js, React Three Fiber, Drei, and React Three Postprocessing
- GSAP and Lenis
- MediaPipe Tasks Vision
- Vercel Analytics and Speed Insights
- Vercel serverless functions in `api/`
- Node.js 24.x

## Local setup

Requirements: Node.js 24 and npm.

```bash
git clone https://github.com/amrelsherif-eng/portfolio.git
cd portfolio
npm ci
```

Copy `.env.example` to `.env.local` and add provider credentials. Ping chat requires `GEMINI_API_KEY`. Voice requests use `GROQ_API_KEY` and can fall back to Gemini; configure both for that fallback. The numbered key variants are optional. Upstash Redis is optional and enables shared rate limiting across function instances.

```bash
npm run dev
```

The `api/` endpoints are Vercel functions. Use `vercel dev` to run the Vercel functions locally alongside the site; `npm run dev` starts the Vite frontend.

Available project checks and build commands:

```bash
npm run build
npm run lint
node scripts/test-vpc-rules.mjs
node scripts/test-subnetting.mjs
node scripts/test-voice-intent.mjs
```

## Project structure

```text
api/                  Vercel chat and voice functions
public/               Static assets and MediaPipe model files
scripts/              Build and test scripts
src/components/       Shared interface, character, chat, and control dock
src/lab/              Network Lab index, games, and game shell
src/pages/            Works, certifications, and resume pages
src/data/             Portfolio data
```

## Credits

Based on the open-source 3D portfolio template by Redoyanul Haque (https://github.com/red1-for-hek/portfolio-website), MIT License. The content, Network Lab, assistant, control dock, and redesign are Amr's additions.

## License

MIT. See [LICENSE](LICENSE), which retains the original copyright notice.

## Contact

amrelsherif.eng@gmail.com · https://www.linkedin.com/in/amrelsherif-eng · https://github.com/amrelsherif-eng

## Report

- Replaced the template README with a portfolio-specific overview.
- Documented the routes, interactive features, and verified game names.
- Listed the current stack, local commands, environment variables, and CI checks.
- Added project structure, attribution, license, live link, and contact details.
- Unsure: none; the README claims above were checked against the requested source files.
