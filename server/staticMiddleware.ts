import express, { type Express } from 'express';
import fs from 'fs';
import path from 'path';

export function setupStaticServing(app: Express) {
  const cwd = process.cwd();
  
  // List of paths to try, in order of preference
  const pathsToTry = [
    process.env.CLIENT_DIST,
    'dist/public',
    './dist/public',
    path.join(cwd, 'dist/public'),
    'public',
    './public',
    path.join(cwd, 'public'),
  ].filter(Boolean) as string[];

  console.log('[Static] Current working directory:', cwd);
  console.log('[Static] Searching for static files in candidate paths...');

  // Find the first path that exists
  let clientRoot: string | null = null;
  const attemptedPaths: string[] = [];

  for (const candidatePath of pathsToTry) {
    const resolvedPath = path.isAbsolute(candidatePath) 
      ? candidatePath 
      : path.resolve(cwd, candidatePath);
    
    attemptedPaths.push(resolvedPath);
    
    if (fs.existsSync(resolvedPath)) {
      const indexPath = path.join(resolvedPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        clientRoot = resolvedPath;
        console.log(`[Static] ✅ Found static files at: ${clientRoot}`);
        break;
      } else {
        console.log(`[Static] Directory exists but no index.html: ${resolvedPath}`);
      }
    }
  }

  // Log directory contents for debugging if no path was found
  if (!clientRoot) {
    console.error('[Static] ❌ Could not find static files directory!');
    console.error('[Static] Attempted paths:', attemptedPaths);
    console.error('[Static] Current directory contents:');
    try {
      const cwdContents = fs.readdirSync(cwd);
      cwdContents.forEach(item => {
        const itemPath = path.join(cwd, item);
        const isDir = fs.statSync(itemPath).isDirectory();
        console.error(`  ${isDir ? '📁' : '📄'} ${item}`);
      });
      
      // Check if dist directory exists and list its contents
      const distPath = path.join(cwd, 'dist');
      if (fs.existsSync(distPath)) {
        console.error('[Static] dist/ directory contents:');
        const distContents = fs.readdirSync(distPath);
        distContents.forEach(item => {
          const itemPath = path.join(distPath, item);
          const isDir = fs.statSync(itemPath).isDirectory();
          console.error(`  ${isDir ? '📁' : '📄'} dist/${item}`);
        });
      }
    } catch (err: any) {
      console.error('[Static] Error listing directory:', err?.message);
    }
    
    // Use fallback path even if it doesn't exist
    clientRoot = path.resolve(cwd, 'dist/public');
    console.error(`[Static] Using fallback path: ${clientRoot}`);
  }

  // Setup static file serving
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

  // SPA fallback - serve index.html for non-API routes
  app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }

    // Skip health check routes (already handled)
    if (req.path === '/health' || req.path === '/_health') {
      return next();
    }

    const indexPath = path.join(clientRoot!, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(indexPath);
    } else {
      console.error(`[Static] index.html not found at: ${indexPath}`);
      res.status(503).json({ 
        error: 'Application not fully deployed',
        details: 'Static files not found',
        path: indexPath
      });
    }
  });
}
