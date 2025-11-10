import express, { type Express } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

export async function setupVite(app: Express, server: any) {
  if (isProduction) {
    // Production mode: serve static files from dist
    const distPath = path.resolve(__dirname, '../dist');
    const clientPath = path.join(distPath, 'public');
    
    // Serve static assets
    app.use(express.static(clientPath, {
      maxAge: '1y',
      etag: true,
    }));

    // Serve index.html for all non-API routes
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }

      const indexPath = path.join(clientPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        next();
      }
    });
  } else {
    // Development mode: use Vite dev server
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          server: server
        }
      },
      appType: 'spa',
      root: path.resolve(__dirname, '..'),
    });

    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      const url = req.originalUrl;

      // Skip API routes
      if (url.startsWith('/api')) {
        return next();
      }

      try {
        let template = fs.readFileSync(
          path.resolve(__dirname, '../index.html'),
          'utf-8'
        );
        template = await vite.transformIndexHtml(url, template);
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }
}
