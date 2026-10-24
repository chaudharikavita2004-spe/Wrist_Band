// Build config for the Windows desktop app: a fully offline, static bundle
// loaded by Electron from disk (file://). Separate from the website build.
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const r = (p: string) => path.resolve(__dirname, p);

export default defineConfig({
  root: r("desktop"),
  base: "./",
  publicDir: false,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      // The website-only error reporter is not part of the desktop app.
      { find: /^@\/lib\/report-error$/, replacement: r("desktop/noop-error-reporting.ts") },
      { find: "@", replacement: r("src") },
    ],
    dedupe: ["react", "react-dom", "@tanstack/react-router"],
  },
  build: {
    outDir: r("desktop/dist"),
    emptyOutDir: true,
    target: "chrome130",
    chunkSizeWarningLimit: 4000,
  },
});
