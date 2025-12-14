// CRITICAL: MINIMAL TOP-LEVEL IMPORTS ONLY
// These are the only imports that run before health checks can respond
import express from 'express';
import { createServer } from 'http';

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const server = createServer(app);

// Track initialization state
let isReady = false;
let bootstrapError: string | null = null;

// Log environment details at startup
console.log('='.repeat(60));
console.log('[Startup] Environment Details:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  PORT: ${PORT}`);
console.log(`  CWD: ${process.cwd()}`);
console.log(`  Platform: ${process.platform}`);
console.log(`  Node Version: ${process.version}`);
console.log('='.repeat(60));

// ============================================================================
// HEALTH CHECK ROUTES - Defined IMMEDIATELY, before any other code runs
// ============================================================================
app.get('/', (req, res, next) => {
  const acceptHeader = req.headers.accept || '';
  // Health probes don't request HTML - return JSON immediately
  if (!isReady || !acceptHeader.includes('text/html')) {
    return res.status(200).json({ 
      status: 'ok', 
      ready: isReady,
      error: bootstrapError 
    });
  }
  // Browser requesting HTML after app is ready - pass to Vite
  next();
});

app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    ready: isReady,
    error: bootstrapError 
  });
});

app.get('/_health', (_req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    ready: isReady,
    error: bootstrapError 
  });
});

// ============================================================================
// START SERVER IMMEDIATELY - Health checks respond NOW
// ============================================================================
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
  console.log('✅ Health check endpoints responding');
  
  // Start full application initialization in background
  bootstrap().catch(err => {
    console.error('='.repeat(60));
    console.error('❌ BOOTSTRAP FAILED - Full error details:');
    console.error('Error message:', err?.message || 'Unknown error');
    console.error('Error stack:', err?.stack || 'No stack trace');
    try {
      console.error('Error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    } catch (e) {
      console.error('Error object (non-serializable):', err);
    }
    console.error('='.repeat(60));
    bootstrapError = err?.message || 'Unknown bootstrap error';
    // Don't exit immediately - keep health checks responding for debugging
    // The app will be in a degraded state but operators can see the error
  });
});

// ============================================================================
// BOOTSTRAP - All expensive initialization happens here via dynamic imports
// This runs AFTER server.listen(), so health checks already work
// ============================================================================
async function bootstrap() {
  console.log('[Bootstrap] Starting application initialization...');
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`[Bootstrap] Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

  // Dynamic imports - these don't block health checks
  // Only import vite in development, only import staticMiddleware in production
  // Note: .js extensions required for Node ESM in production
  
  let session: any;
  let registerRoutes: any;
  let initSentry: any;
  let setupExpressErrorHandler: any;
  let ChatWebSocketServer: any;
  let storage: any;
  
  try {
    console.log('[Bootstrap] Loading express-session...');
    const sessionModule = await import('express-session');
    session = sessionModule.default;
    console.log('[Bootstrap] ✅ express-session loaded');
  } catch (err: any) {
    console.error('[Bootstrap] ❌ Failed to load express-session:', err?.message);
    console.error('[Bootstrap] express-session error stack:', err?.stack);
    throw err;
  }
  
  try {
    console.log('[Bootstrap] Loading routes.js...');
    const routesModule = await import('./routes.js');
    registerRoutes = routesModule.registerRoutes;
    console.log('[Bootstrap] ✅ routes.js loaded');
  } catch (err: any) {
    console.error('[Bootstrap] ❌ Failed to load routes.js:', err?.message);
    console.error('[Bootstrap] Routes error stack:', err?.stack);
    throw err;
  }
  
  try {
    console.log('[Bootstrap] Loading sentry.js...');
    const sentryModule = await import('./lib/sentry.js');
    initSentry = sentryModule.initSentry;
    setupExpressErrorHandler = sentryModule.setupExpressErrorHandler;
    console.log('[Bootstrap] ✅ sentry.js loaded');
  } catch (err: any) {
    console.warn('[Bootstrap] ⚠️ Failed to load sentry.js (non-fatal):', err?.message);
    initSentry = () => { console.log('[Sentry] Skipped - module failed to load'); };
    setupExpressErrorHandler = () => {};
  }
  
  try {
    console.log('[Bootstrap] Loading websocket.js...');
    const wsModule = await import('./websocket.js');
    ChatWebSocketServer = wsModule.ChatWebSocketServer;
    console.log('[Bootstrap] ✅ websocket.js loaded');
  } catch (err: any) {
    console.error('[Bootstrap] ❌ Failed to load websocket.js:', err?.message);
    console.error('[Bootstrap] WebSocket error stack:', err?.stack);
    throw err;
  }
  
  try {
    console.log('[Bootstrap] Loading storage.js...');
    const storageModule = await import('./storage.js');
    storage = storageModule.storage;
    console.log('[Bootstrap] ✅ storage.js loaded');
  } catch (err: any) {
    console.error('[Bootstrap] ❌ Failed to load storage.js:', err?.message);
    console.error('[Bootstrap] Storage error stack:', err?.stack);
    throw err;
  }

  console.log('[Bootstrap] All core modules loaded successfully');

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

  // Setup static file serving (production) or Vite dev server (development)
  if (isProduction) {
    try {
      console.log('[Bootstrap] Loading staticMiddleware.js...');
      const { setupStaticServing } = await import('./staticMiddleware.js');
      setupStaticServing(app);
      console.log('✅ Static file serving ready');
    } catch (err: any) {
      console.error('[Bootstrap] ❌ Failed to setup static serving:', err?.message);
      console.error('[Bootstrap] Static middleware error stack:', err?.stack);
      // Don't throw - health checks should still work, app will just lack static files
    }
  } else {
    try {
      console.log('[Bootstrap] Loading vite.js...');
      const { setupVite } = await import('./vite.js');
      await setupVite(app, server);
      console.log('✅ Vite dev server ready');
    } catch (err: any) {
      console.error('[Bootstrap] ❌ Failed to setup Vite:', err?.message);
      console.error('[Bootstrap] Vite error stack:', err?.stack);
      throw err;
    }
  }

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

  // Mark as fully ready BEFORE database operations
  // This ensures the app can serve requests even if DB is slow/unavailable
  isReady = true;
  console.log('='.repeat(60));
  console.log('✅ Application fully initialized and ready');
  console.log('='.repeat(60));

  // Bootstrap database with timeout (non-blocking, runs after app is ready)
  // We fire-and-forget with proper error handling to avoid unhandled rejections
  const dbTimeout = 10000; // 10 second timeout for database operations
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    console.warn('⚠️ Database initialization timed out after 10 seconds');
    console.warn('   App is running but some features may be limited until database is available');
  }, dbTimeout);

  // Run DB init with proper error handling for both timeout and late rejections
  storage.ensureDefaultAccessLevels()
    .then(() => {
      clearTimeout(timeoutId);
      if (!timedOut) {
        console.log('✅ Access levels initialized');
      } else {
        console.log('✅ Access levels initialized (late, after timeout)');
      }
    })
    .catch((err: any) => {
      clearTimeout(timeoutId);
      const msg = err?.message || 'Unknown error';
      if (!timedOut) {
        console.warn(`⚠️ Database initialization failed: ${msg}`);
      } else {
        console.warn(`⚠️ Database initialization failed (late, after timeout): ${msg}`);
      }
      console.warn('   App is running but some features may be limited');
    });
}
