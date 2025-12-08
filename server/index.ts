// CRITICAL: Minimal imports only - health checks must respond in <100ms
// Everything else is dynamically imported in phased initialization
import express from 'express';
import { createServer } from 'http';

const app = express();
const PORT = 5000;
const server = createServer(app);

// CRITICAL: Health check endpoints registered FIRST, before ANY other setup
// These MUST respond immediately for Replit Autoscale deployment
app.get('/', (_req, res) => {
  res.status(200).send('ok');
});

app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

app.get('/_health', (_req, res) => {
  res.status(200).send('ok');
});

// CRITICAL: Start server listening IMMEDIATELY
// Health checks are ready NOW - no waiting for any initialization
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('✅ Health check endpoints ready');
  
  // Phase 1: Core middleware and routes (runs via setImmediate - yields to event loop first)
  setImmediate(() => {
    phase1CoreMiddleware().catch(err => {
      console.error('[Phase 1] Fatal error:', err);
    });
  });
});

// Phase 1: Lightweight middleware and route registration
// This runs first, as fast as possible, without waiting for heavy services
async function phase1CoreMiddleware() {
  console.log('[Phase 1] Starting core middleware initialization...');
  
  // Fire-and-forget Sentry initialization - DO NOT await
  import('./lib/sentry').then(({ initSentry }) => {
    initSentry();
    console.log('✅ Sentry initialized (async)');
  }).catch(err => {
    console.warn('[Sentry] Non-blocking initialization failed:', err.message);
  });

  // Trust proxy for secure cookies behind TLS
  app.set('trust proxy', 1);

  // Body parsing middleware - synchronous, fast
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

  console.log('[Phase 1] Core middleware ready');
  
  // Phase 2: Session, routes, WebSocket (runs via setTimeout - slight delay)
  setTimeout(() => {
    phase2Services().catch(err => {
      console.error('[Phase 2] Fatal error:', err);
    });
  }, 10);
}

// Phase 2: Session management, routes, WebSocket, Vite
async function phase2Services() {
  console.log('[Phase 2] Starting services initialization...');

  const isProduction = process.env.NODE_ENV === 'production';

  // Dynamic import session modules
  const [
    { default: session },
    { default: connectPgSimple },
  ] = await Promise.all([
    import('express-session'),
    import('connect-pg-simple'),
  ]);

  // Validate SESSION_SECRET in production
  if (isProduction && !process.env.SESSION_SECRET) {
    console.warn('WARNING: SESSION_SECRET not set. Using insecure default.');
  }

  // Session store configuration
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
      console.error('Failed to create PostgreSQL session store, falling back to MemoryStore:', err);
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
  console.log('[Phase 2] Session middleware ready');

  // Load routes and WebSocket in parallel
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
  console.log('[Phase 2] Routes registered');

  // Initialize WebSocket server
  const wsServer = new ChatWebSocketServer(server, sessionMiddleware);
  app.set('wsServer', wsServer);
  console.log('✅ WebSocket server initialized at /ws/chat');

  // Setup Vite/static file serving
  await setupVite(app, server);
  console.log('✅ Vite middleware ready');

  // Setup Sentry error handler (non-blocking import)
  import('./lib/sentry').then(({ setupExpressErrorHandler }) => {
    setupExpressErrorHandler(app);
  }).catch(() => {});

  // General error handling middleware
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    console.error('Error:', err);
    res.status(status).json({ error: message });
  });

  console.log('[Phase 2] All services initialized');

  // Phase 3: Database bootstrap - ONLY runs with RUN_SEED=true
  // This is DISABLED by default in production Autoscale to prevent race conditions
  if (process.env.RUN_SEED === 'true') {
    setTimeout(() => {
      phase3DatabaseBootstrap().catch(err => {
        console.error('[Phase 3] Non-fatal error during database bootstrap:', err);
      });
    }, 500);
  } else {
    console.log('[Phase 3] Database seeding SKIPPED (set RUN_SEED=true to enable)');
  }
}

// Phase 3: Database bootstrap operations
// ONLY runs when RUN_SEED=true - NOT on every Autoscale instance
async function phase3DatabaseBootstrap() {
  console.log('[Phase 3] Starting database bootstrap (RUN_SEED=true)...');

  try {
    const { storage } = await import('./storage');
    await storage.ensureDefaultAccessLevels();
    console.log('✅ Access levels initialized');
  } catch (error) {
    console.error('[Phase 3] Access levels error (non-fatal):', error);
  }

  try {
    const { seedComplianceData } = await import('./seedCompliance');
    await seedComplianceData();
    console.log('✅ Compliance data seeded');
  } catch (error) {
    console.error('[Phase 3] Compliance seed error (non-fatal):', error);
  }

  console.log('[Phase 3] Database bootstrap complete');
}
