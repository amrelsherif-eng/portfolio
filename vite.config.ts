import { defineConfig, loadEnv, Plugin, type Rolldown } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
function localChatPlugin(): Plugin {
  return {
    name: "local-chat-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const route = (req as typeof req & { url?: string }).url?.split("?")[0];
        if (route !== "/api/chat" && route !== "/api/voice") return next();
        // Vite's dev server does not parse bodies like Vercel does: read the JSON ourselves.
        // (vite.config has no Node/DOM typings here, so describe the two APIs we use)
        type Decoder = { decode(input?: Uint8Array, opts?: { stream: boolean }): string };
        const Decoder = (globalThis as unknown as { TextDecoder: new () => Decoder }).TextDecoder;
        const stream = req as unknown as { on(event: string, cb: (chunk: Uint8Array) => void): void; destroy?: () => void };
        let body: string;
        try { body = await new Promise<string>((resolve, reject) => {
          const decoder = new Decoder();
          let data = "";
          let size = 0;
          stream.on("data", (chunk) => { size += chunk.byteLength; if (size > (route === "/api/voice" ? 2 * 1024 * 1024 : 1024 * 1024)) { stream.destroy?.(); reject(new Error("Request body too large")); return; } data += decoder.decode(chunk, { stream: true }); });
          stream.on("end", () => resolve(data + decoder.decode()));
        }); } catch {
          res.statusCode = 413; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify({ error: "Request body too large" })); return;
        }
        (req as typeof req & { body?: string }).body = body;
        const { default: handler } = route === "/api/chat" ? await import("./api/chat") : await import("./api/voice");
        await handler(req as unknown as Parameters<typeof handler>[0], res as unknown as Parameters<typeof handler>[1]);
      });
    },
  };
}

function homePreloadPlugin(): Plugin {
  return {
    name: "home-route-preload",
    enforce: "post",
    apply: "build",
    generateBundle(_options, bundle) {
      const chunks = Object.values(bundle).filter((item) => item.type === "chunk");
      // Match by the chunk's entry module, or by any module inside it (Rolldown may name a shared chunk after another module).
      const findChunk = (suffix: string) =>
        chunks.find((chunk) => chunk.facadeModuleId?.replace(/\\/g, "/").endsWith(suffix)) ??
        chunks.find((chunk) => chunk.moduleIds.some((id) => id.replace(/\\/g, "/").endsWith(suffix)));
      const roots = [findChunk("src/components/MainContainer.tsx"), findChunk("src/components/utils/initialFX.ts")].filter((chunk): chunk is Rolldown.OutputChunk => Boolean(chunk));
      const js = new Set<string>();
      const css = new Set<string>();
      const visited = new Set<string>();
      const visit = (chunk: Rolldown.OutputChunk) => {
        if (visited.has(chunk.fileName)) return;
        visited.add(chunk.fileName);
        js.add(`/${chunk.fileName}`);
        for (const file of chunk.viteMetadata?.importedCss ?? []) css.add(`/${file}`);
        for (const imported of chunk.imports) {
          const dependency = bundle[imported];
          if (dependency?.type === "chunk") visit(dependency);
        }
      };
      roots.forEach(visit);

      const html = Object.values(bundle).find((item) => item.type === "asset" && item.fileName.endsWith("index.html"));
      if (!html || html.type !== "asset") return;
      const source = typeof html.source === "string" ? html.source : String.fromCharCode(...html.source);
      const existing = new Set<string>();
      for (const tag of source.match(/<link\b[^>]*>/g) ?? []) {
        if (/\brel=["'](?:modulepreload|stylesheet)["']/.test(tag)) {
          const href = tag.match(/\bhref=["']([^"']+)["']/)?.[1];
          if (href) existing.add(href);
        }
      }
      for (const tag of source.match(/<script\b[^>]*>/g) ?? []) {
        if (/\btype=["']module["']/.test(tag)) {
          const src = tag.match(/\bsrc=["']([^"']+)["']/)?.[1];
          if (src) existing.add(src);
        }
      }
      const urls = [...js].filter((url) => !existing.has(url) && !existing.has(url.slice(1)));
      const cssUrls = [...css].filter((url) => !existing.has(url) && !existing.has(url.slice(1)));
      const ref = this.emitFile({ type: "asset", name: "home-preload.js", source: `if(location.pathname==="/"){const js=${JSON.stringify(urls)},css=${JSON.stringify(cssUrls)};for(const href of js){const l=document.createElement("link");l.rel="modulepreload";l.href=href;document.head.appendChild(l)}for(const href of css){const l=document.createElement("link");l.rel="preload";l.as="style";l.href=href;document.head.appendChild(l)}}` });
      const loaderUrl = `/${this.getFileName(ref)}`;
      html.source = source.replace(/(<head(?:\s[^>]*)?>)/i, `$1\n    <script async src="${loaderUrl}"></script>`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const runtime = globalThis as typeof globalThis & { process: { cwd: () => string; env: Record<string, string | undefined> } };
  const env = loadEnv(mode, runtime.process.cwd(), "");
  if (env.GEMINI_API_KEY) runtime.process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (env.GEMINI_API_KEY_2) runtime.process.env.GEMINI_API_KEY_2 = env.GEMINI_API_KEY_2;
  if (env.GEMINI_API_KEY_3) runtime.process.env.GEMINI_API_KEY_3 = env.GEMINI_API_KEY_3;
  if (env.GEMINI_MODEL) runtime.process.env.GEMINI_MODEL = env.GEMINI_MODEL;
  if (env.GROQ_API_KEY) runtime.process.env.GROQ_API_KEY = env.GROQ_API_KEY;
  if (env.GROQ_MODEL) runtime.process.env.GROQ_MODEL = env.GROQ_MODEL;
  return {
  plugins: [react(), localChatPlugin(), homePreloadPlugin()],
  build: {
    // Vite 5's default browser target; Vite 7+ raised it. Kept so the same browsers are supported.
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    rolldownOptions: {
      output: {
        // Same four vendor chunks as before (Vite 8 / Rolldown has no object-form manualChunks).
        codeSplitting: {
          groups: [
            { name: 'three', test: /[\\/]node_modules[\\/](three|three-stdlib)[\\/]/, priority: 4 },
            { name: 'react-three', test: /[\\/]node_modules[\\/]@react-three[\\/](fiber|drei)[\\/]/, priority: 3 },
            { name: 'gsap', test: /[\\/]node_modules[\\/]gsap[\\/]/, priority: 2 },
            { name: 'vendor', test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/, priority: 1 }
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['three', 'gsap', 'lenis']
  }
  };
});
