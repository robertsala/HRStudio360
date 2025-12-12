// CRITICAL: MINIMAL TOP-LEVEL IMPORTS ONLY
// These are the only imports that run before health checks can respond
import express from 'express';
import { createServer } from 'http';

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const server = createServer(app);

// Track initialization state
let isReady = false;

// ============================================================================
// HEALTH CHECK ROUTES - Defined IMMEDIATELY, before any other code runs
// ============================================================================
app.get('/', (req, res, next) => {
  const acceptHeader = req.headers.accept || '';
  // Health probes don't request HTML - return JSON immediately
  if (!isReady || !acceptHeader.includes('text/html')) {
    return res.status(200).json({ status: 'ok', ready: isReady });
  }
  // Browser requesting HTML after app is ready - pass to Vite
  next();
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', ready: isReady });
});

app.get('/_health', (_req, res) => {
  res.status(200).json({ status: 'ok', ready: isReady });
});

// ============================================================================
// START SERVER IMMEDIATELY - Health checks respond NOW
// ============================================================================
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
  console.log('✅ Health check endpoints responding');
  
  // Start full application initialization in background
  bootstrap().catch(err => {
    console.error('❌ Bootstrap failed:', err);
    process.exit(1);
  });
});

// ============================================================================
// BOOTSTRAP - All expensive initialization happens here via dynamic imports
// This runs AFTER server.listen(), so health checks already work
// ============================================================================
async function bootstrap() {
  console.log('[Bootstrap] Starting application initialization...');

  // Dynamic imports - these don't block health checks
  const [
    { default: session },
    { registerRoutes },
    { setupVite },
    { initSentry, setupExpressErrorHandler },
    { ChatWebSocketServer },
    { storage },
  ] = await Promise.all([
    import('express-session'),
    import('./routes'),
    import('./vite'),
    import('./lib/sentry'),
    import('./websocket'),
    import('./storage'),
  ]);

  console.log('[Bootstrap] Modules loaded');

  // Initialize Sentry
  try {
    initSentry();
    console.log('✅ Sentry initialized');
  } catch (err) {
    console.warn('[Sentry] Initialization failed (non-fatal):', err);
  }

  // Trust proxy for secure cookies behind TLS
  app.set('trust proxy', 1);

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Session configuration
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    console.warn('WARNING: SESSION_SECRET not set. Using insecure default.');
  }

  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production-' + Math.random(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: 'lax'
    }
  });

  app.use(sessionMiddleware);
  console.log('[Bootstrap] Session middleware ready');

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

  // Register API routes
  registerRoutes(app);
  console.log('[Bootstrap] Routes registered');

  // Initialize WebSocket server
  const wsServer = new ChatWebSocketServer(server, sessionMiddleware);
  app.set('wsServer', wsServer);
  console.log('✅ WebSocket server initialized');

  // Setup Vite/static file serving
  await setupVite(app, server);
  console.log('✅ Vite middleware ready');

  // Setup Sentry error handler
  try {
    setupExpressErrorHandler(app);
  } catch (err) {
    console.warn('[Sentry] Error handler setup failed (non-fatal)');
  }

  // General error handling middleware
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    console.error('Error:', err);
    res.status(status).json({ error: message });
  });

  // Bootstrap database (non-blocking)
  try {
    await storage.ensureDefaultAccessLevels();
    console.log('✅ Access levels initialized');
  } catch (err) {
    console.error('Failed to initialize access levels:', err);
  }

  // Mark as fully ready
  isReady = true;
  console.log('✅ Application fully initialized and ready');
}
