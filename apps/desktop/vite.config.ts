import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const packagesRoot = path.join(repoRoot, "packages");

const arkitectPackages = [
  "ai",
  "contracts",
  "design-system",
  "github",
  "repo-analyzer"
] as const;

const arkitectAliases = Object.fromEntries(
  arkitectPackages.map((name) => [
    `@arkitect/${name}`,
    path.join(packagesRoot, name, "src/index.ts")
  ])
);

Object.assign(arkitectAliases, {
  "@arkitect/core": path.join(packagesRoot, "core", "src/browser.ts"),
  "@arkitect/mcp-server": path.join(packagesRoot, "mcp-server", "src/browser.ts")
});

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  resolve: {
    alias: arkitectAliases
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    fs: {
      allow: [repoRoot]
    },
    proxy: {
      "/github-api": {
        target: "https://api.github.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/github-api/, "")
      }
    }
  }
});
