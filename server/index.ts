import express, { type Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { registerRoutes } from './routes';
import { setupVite } from './vite';
import { createServer } from 'http';
import { initSentry, setupExpressErrorHandler } from './lib/sentry';
import { ChatWebSocketServer } from './websocket';
import { storage } from './storage';

// Initialize Sentry for backend error tracking
initSentry();

const app = express();

// Health check endpoints for deployment checks (responds immediately, before ANY middleware)
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/_health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Trust proxy for secure cookies behind TLS
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Validate SESSION_SECRET in production
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.warn('WARNING: SESSION_SECRET not set. Using insecure default.');
}

// Session configuration - use MemoryStore for reliable startup
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production-' + Math.random(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax'
  }
});

app.use(sessionMiddleware);

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + '…';
      }
      console.log(logLine);
    }
  });

  next();
});

// Register API routes BEFORE Vite middleware
registerRoutes(app);

// Use process.env.PORT for Autoscale compatibility
const PORT = Number(process.env.PORT) || 5000;
const server = createServer(app);

// Initialize WebSocket server with session authentication
const wsServer = new ChatWebSocketServer(server, sessionMiddleware);

// Make WebSocket server available to routes
app.set('wsServer', wsServer);

// Start server IMMEDIATELY so health checks can respond
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('✅ Health check endpoints ready');
});

// Setup Vite dev server in background (doesn't block health checks)
setupVite(app, server).then(async () => {
  console.log('✅ Vite middleware ready');
  
  // Bootstrap: Ensure default access levels exist (non-blocking)
  try {
    await storage.ensureDefaultAccessLevels();
  } catch (err) {
    console.error('Failed to initialize access levels:', err);
  }
  
  // Setup Sentry error handler AFTER all routes (v10+ API)
  setupExpressErrorHandler(app);
});

// General error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  console.error('Error:', err);
  res.status(status).json({ error: message });
});
