// CRITICAL: Minimal imports only - health checks must respond instantly
import express from 'express';
import { createServer } from 'http';

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const server = createServer(app);

// ============================================================================
// HEALTH CHECK ENDPOINTS - MUST BE FIRST, BEFORE ANY MIDDLEWARE
// These respond immediately with 200 OK - no logic, no dependencies
// ============================================================================
app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

app.get('/_health', (_req, res) => {
  res.status(200).send('ok');
});

// Root endpoint: Health probes get 'ok', browsers get passed to Vite later
// If no Accept header or wildcard, assume health probe
app.get('/', (req, res, next) => {
  const acceptHeader = req.headers.accept || '';
  // Only pass to Vite if explicitly requesting HTML (browser navigation)
  if (acceptHeader.includes('text/html') && !acceptHeader.startsWith('*/*')) {
    return next();
  }
  res.status(200).send('ok');
});

// ============================================================================
// START SERVER IMMEDIATELY - Health checks ready NOW
// ============================================================================
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('✅ Health check endpoints ready');
  
  // Start async initialization - does not block health checks
  initializeApp();
});

// ============================================================================
// ASYNC INITIALIZATION - Runs in background after server is listening
// ============================================================================
async function initializeApp() {
  try {
    console.log('[Init] Starting async initialization...');

    // Sentry initialization - fire and forget, wrapped in try-catch
    try {
      const { initSentry } = await import('./lib/sentry');
      initSentry();
      console.log('✅ Sentry initialized');
    } catch (sentryErr: any) {
      console.warn('[Sentry] Initialization failed (non-fatal):', sentryErr.message);
    }

    // Trust proxy for secure cookies behind TLS
    app.set('trust proxy', 1);

    // Body parsing middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Request logging middleware
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

    // Session configuration
    const isProduction = process.env.NODE_ENV === 'production';
    
    const { default: session } = await import('express-session');
    const { default: connectPgSimple } = await import('connect-pg-simple');

    if (isProduction && !process.env.SESSION_SECRET) {
      console.warn('WARNING: SESSION_SECRET not set. Using insecure default.');
    }

    const PgSession = connectPgSimple(session);
    let sessionStore: any = undefined;

    if (isProduction && process.env.DATABASE_URL) {
      try {
        sessionStore = new PgSession({
          conString: process.env.DATABASE_URL,
          tableName: 'user_sessions',
          createTableIfMissing: true,
        });
        console.log('✅ Using PostgreSQL session store for Autoscale compatibility');
      } catch (err) {
        console.error('Failed to create PostgreSQL session store:', err);
      }
    } else {
      console.log('ℹ️ Using MemoryStore for sessions (development mode)');
    }

    const sessionMiddleware = session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production-' + Math.random(),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        sameSite: 'lax'
      }
    });

    app.use(sessionMiddleware);
    console.log('[Init] Session middleware ready');

    // Load routes and services
    const [
      { registerRoutes },
      { ChatWebSocketServer },
      { setupVite },
    ] = await Promise.all([
      import('./routes'),
      import('./websocket'),
      import('./vite'),
    ]);

    // Register API routes
    registerRoutes(app);
    console.log('[Init] Routes registered');

    // Initialize WebSocket server
    const wsServer = new ChatWebSocketServer(server, sessionMiddleware);
    app.set('wsServer', wsServer);
    console.log('✅ WebSocket server initialized at /ws/chat');

    // Setup Vite/static file serving
    await setupVite(app, server);
    console.log('✅ Vite middleware ready');

    // Setup Sentry error handler
    try {
      const { setupExpressErrorHandler } = await import('./lib/sentry');
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

    console.log('[Init] Core initialization complete');

    // Database bootstrap - ONLY with RUN_SEED=true (development only)
    if (process.env.RUN_SEED === 'true') {
      try {
        console.log('[Bootstrap] Starting database initialization...');
        const { storage } = await import('./storage');
        await storage.ensureDefaultAccessLevels();
        console.log('✅ Access levels initialized');

        const { seedComplianceData } = await import('./seedCompliance');
        await seedComplianceData();
        console.log('✅ Compliance data ready');
        console.log('[Bootstrap] Database initialization complete');
      } catch (error) {
        console.error('[Bootstrap] Database initialization error (non-fatal):', error);
      }
    } else {
      console.log('[Bootstrap] Database seeding SKIPPED (RUN_SEED not set)');
    }

  } catch (error) {
    console.error('[Init] Fatal error during initialization:', error);
  }
}
