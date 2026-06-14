import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
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
