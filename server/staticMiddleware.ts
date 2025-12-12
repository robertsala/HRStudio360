import express, { type Express } from 'express';
import fs from 'fs';
import path from 'path';

export function setupStaticServing(app: Express) {
  const clientRoot = path.resolve(process.cwd(), process.env.CLIENT_DIST ?? 'dist/public');
  
  console.log(`[Static] Serving files from: ${clientRoot}`);
  
  if (!fs.existsSync(clientRoot)) {
    console.error(`[Static] WARNING: Client dist not found at ${clientRoot}`);
    console.error('[Static] Available directories:', fs.readdirSync(process.cwd()));
  }

  app.use(express.static(clientRoot, {
    maxAge: '1y',
    etag: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    const indexPath = path.join(clientRoot, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
}
