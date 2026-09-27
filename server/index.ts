import express, { type Request, type Response } from 'express';
import path from 'node:path';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc';

const app = express();
app.disable('x-powered-by');

// ─── tRPC API ───
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
  }),
);

// ─── 靜態檔案（Vite 產出）───
const distDir = path.resolve(process.cwd(), 'dist');

app.use(
  express.static(distDir, {
    index: false,
    etag: true,
    lastModified: true,
    setHeaders: (res: Response, filePath: string) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('cache-control', 'no-cache');
      } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        // 有雜湊檔名的資源可以永久快取
        res.setHeader('cache-control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('cache-control', 'public, max-age=3600');
      }
    },
  }),
);

// ─── SPA fallback：所有非 API 路徑都回 index.html ───
app.get('*', (req: Request, res: Response, next) => {
  if (req.path.startsWith('/trpc')) return next();
  res.setHeader('cache-control', 'no-cache');
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) {
      res
        .status(503)
        .type('text/plain; charset=utf-8')
        .send('前端尚未建置，請先執行 pnpm build');
    }
  });
});

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  console.log(`島嶼探險家已啟動：http://localhost:${port} (NODE_ENV=${process.env.NODE_ENV ?? 'development'})`);
});
