import path from "path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function asyncCssPlugin(): Plugin {
  return {
    name: "async-css",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return html.replace(
          /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
          (_, href) =>
            `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">` +
            `<noscript><link rel="stylesheet" href="${href}"></noscript>`,
        );
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), asyncCssPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react-chessboard") ||
            id.includes("node_modules/@dnd-kit")
          ) {
            return "chessboard";
          }
          if (
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react/jsx-runtime") ||
            id.includes("node_modules/react/index")
          ) {
            return "react-vendor";
          }
          if (
            id.includes("node_modules/react-router") ||
            id.includes("node_modules/@remix-run/router")
          ) {
            return "router";
          }
          if (
            id.includes("node_modules/convex") ||
            id.includes("node_modules/@convex-dev")
          ) {
            return "convex-vendor";
          }
        },
      },
    },
  },
});
