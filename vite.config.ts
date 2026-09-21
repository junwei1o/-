import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const PROJECT_ROOT = import.meta.dirname;

const plugins = [react(), tailwindcss(), jsxLocPlugin()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // 程式碼分包：大型第三方庫拆成獨立、可長期快取的檔，換頁／改版不重複下載。
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-hook-form", "@tanstack/react-query"],
          "trpc-vendor": ["@trpc/client", "@trpc/react-query", "@trpc/server", "superjson", "zod"],
          "ui-vendor": [
            "class-variance-authority",
            "clsx",
            "tailwind-merge",
            // framer-motion 僅「深度反思」lazy 頁使用，移出首屏必載的 ui-vendor，
            // 由 Rollup 跟隨使用它的 lazy chunk（PaperExam）。
            "lucide-react",
            "sonner",
          ],
          "charts-vendor": ["recharts"],
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
