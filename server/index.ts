// CRITICAL: Minimal imports only - everything else is dynamically imported AFTER server starts
// This ensures health checks respond within milliseconds, not seconds
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
// Do NOT wait for any imports or initialization
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('✅ Health check endpoints ready');
  
  // NOW load and initialize everything else asynchronously
  // Using setTimeout to ensure we yield to the event loop first
  setTimeout(() => {
    initializeApp().catch(err => {
      console.error('[InitializeApp] Fatal error during initialization:', err);
    });
  }, 0);
});

async function initializeApp() {
  try {
    console.log('[Init] Starting async initialization...');
    
    // Dynamic imports - these don't block the health check endpoints
    const [
      { default: session },
      { default: connectPgSimple },
      { initSentry, setupExpressErrorHandler },
    ] = await Promise.all([
      import('express-session'),
      import('connect-pg-simple'),
      import('./lib/sentry'),
    ]);

    // Initialize Sentry
    initSentry();
    console.log('✅ Sentry initialized for backend error tracking');

    // Trust proxy for secure cookies behind TLS
    app.set('trust proxy', 1);

    // Body parsing middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Validate SESSION_SECRET in production
    if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
      console.warn('WARNING: SESSION_SECRET not set. Using insecure default.');
    }

    // Session store configuration - lazy loaded
    const PgSession = connectPgSimple(session);
    const isProduction = process.env.NODE_ENV === 'production';

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

    // Now dynamically import heavy modules that touch the database
    console.log('[Init] Loading routes and WebSocket...');
    const [
      { registerRoutes },
      { ChatWebSocketServer },
      { setupVite },
    ] = await Promise.all([
      import('./routes'),
      import('./websocket'),
      import('./vite'),
    ]);

    // Register API routes BEFORE Vite middleware
    registerRoutes(app);

    // Initialize WebSocket server with session authentication
    const wsServer = new ChatWebSocketServer(server, sessionMiddleware);
    app.set('wsServer', wsServer);

    // Setup Vite/static file serving
    await setupVite(app, server);
    console.log('✅ Vite middleware ready');

    // Setup Sentry error handler AFTER all routes
    setupExpressErrorHandler(app);

    // General error handling middleware
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      console.error('Error:', err);
      res.status(status).json({ error: message });
    });

    console.log('[Init] Core initialization complete');

    // Bootstrap database operations run LAST, completely non-blocking
    // These are deferred even further to not impact app readiness
    setTimeout(async () => {
      try {
        console.log('[Bootstrap] Starting database initialization...');
        const { storage } = await import('./storage');
        await storage.ensureDefaultAccessLevels();
        
        const { seedComplianceData } = await import('./seedCompliance');
        await seedComplianceData();
        
        console.log('[Bootstrap] Database initialization complete');
      } catch (error) {
        console.error('[Bootstrap] Error during database initialization (non-fatal):', error);
      }
    }, 1000); // Wait 1 second after core init before database operations

  } catch (error) {
    console.error('[InitializeApp] Error during app initialization:', error);
  }
}
