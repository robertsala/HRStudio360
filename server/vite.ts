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
    
    // Serve static assets (JS/CSS with hashed names can be cached long-term)
    app.use(express.static(clientPath, {
      maxAge: '1y',
      etag: true,
      setHeaders: (res, filePath) => {
        // Don't cache index.html so browser always fetches latest version after redeploy
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));

    // Serve index.html for all non-API routes (with no-cache headers)
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }

      const indexPath = path.join(clientPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
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
