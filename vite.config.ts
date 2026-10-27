import { defineConfig, loadEnv, Plugin } from "vite";
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
  plugins: [react(), localChatPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three', 'three-stdlib'],
          'react-three': ['@react-three/fiber', '@react-three/drei'],
          'gsap': ['gsap'],
          'vendor': ['react', 'react-dom', 'react-router-dom']
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
