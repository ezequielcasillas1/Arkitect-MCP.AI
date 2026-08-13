import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const spaRoutes = [
  "mcp",
  "reviews",
  "instructions",
  "about",
  "terms",
  "privacy",
  "admin/downloads"
] as const;

function serveStaticHome(): Plugin {
  return {
    name: "serve-static-home",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const pathName = req.url?.split("?")[0] ?? "";
        if (pathName === "/") {
          req.url = "/index.html";
        }
        if (pathName === "/architecture" || pathName === "/architecture/") {
          req.url = "/architecture/index.html";
        }
        next();
      });
    }
  };
}

function copySpaRouteIndexes(): Plugin {
  return {
    name: "copy-spa-route-indexes",
    apply: "build",
    closeBundle() {
      const distDir = path.resolve(rootDir, "dist");
      const spaIndex = path.join(distDir, "spa", "index.html");
      if (!fs.existsSync(spaIndex)) {
        throw new Error("Expected dist/spa/index.html after Vite build");
      }
      const html = fs.readFileSync(spaIndex, "utf8");
      for (const route of spaRoutes) {
        const dir = path.join(distDir, route);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "index.html"), html);
      }
      const leftoverApp = path.join(distDir, "app.html");
      if (fs.existsSync(leftoverApp)) {
        fs.unlinkSync(leftoverApp);
      }
      const leftoverArchitectureHtml = path.join(distDir, "architecture.html");
      if (fs.existsSync(leftoverArchitectureHtml)) {
        fs.unlinkSync(leftoverArchitectureHtml);
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), serveStaticHome(), copySpaRouteIndexes()],
  base: "/",
  build: {
    rollupOptions: {
      input: {
        spa: path.resolve(rootDir, "spa/index.html")
      }
    }
  },
  server: {
    fs: {
      allow: [rootDir, path.resolve(rootDir, "../..")]
    }
  }
});
