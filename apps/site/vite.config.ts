import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { toCanonicalUrl } from "./src/features/seo/canonical";
import { routeSeo } from "./src/features/seo/data";
import { renderSitemapXml } from "./src/features/seo/sitemap";
import type { RouteSeoKey } from "./src/features/seo/types";

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

function applyRouteHead(html: string, route: (typeof spaRoutes)[number]): string {
  const pagePath = `/${route}`;
  const canonical = toCanonicalUrl(pagePath);
  const meta = routeSeo[pagePath as RouteSeoKey];
  let next = html
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonical}" />`);
  if (meta) {
    next = next
      .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
      .replace(
        /<meta name="description" content="[^"]*"\s*\/?>/,
        `<meta name="description" content="${meta.description}" />`
      );
  }
  if (route.startsWith("admin/")) {
    next = next.replace(
      /<meta name="robots" content="[^"]*"\s*\/?>/,
      `<meta name="robots" content="noindex,nofollow" />`
    );
  }
  return next;
}

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
        fs.writeFileSync(path.join(dir, "index.html"), applyRouteHead(html, route));
      }
      fs.rmSync(path.join(distDir, "spa"), { recursive: true, force: true });
      fs.writeFileSync(path.join(distDir, "sitemap.xml"), renderSitemapXml());
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
