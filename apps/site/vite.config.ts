import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function serveStaticHome(): Plugin {
  return {
    name: "serve-static-home",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const pathName = req.url?.split("?")[0] ?? "";
        if (pathName === "/") {
          req.url = "/index.html";
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), serveStaticHome()],
  build: {
    rollupOptions: {
      input: {
        app: path.resolve(rootDir, "app.html")
      }
    }
  },
  server: {
    fs: {
      allow: [rootDir, path.resolve(rootDir, "../..")]
    }
  }
});
