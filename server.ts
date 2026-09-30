/**
 * AVARTH Intelligence Server Entry Point
 * Runs Express backend with Vite middlewares in dev mode, or serves static build in production.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRouter from './server/routes/api.ts';
import { earthEngineService } from './server/services/earthEngineService.ts';
import { logEvent } from './server/utils/logger.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize Earth Engine once at application startup
  earthEngineService.init();

  app.use(express.json());

  // Mount all backend REST API routes
  app.use('/api', apiRouter);

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logEvent(`AVARTH Tac-Ops Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting AVARTH server:', err);
});
