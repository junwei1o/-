import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// 前端建置：client/ 為根目錄，產出到 dist/（與 server bundle 同目錄）
// @/ 路徑別名與 tsconfig.json 的 paths 對齊，供 client/src 內部使用。
export default defineConfig({
  root: 'client',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./client/src', import.meta.url)),
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/trpc': 'http://127.0.0.1:3001',
    },
  },
});
