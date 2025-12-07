import express, { type Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { registerRoutes } from './routes';
import { setupVite } from './vite';
import { createServer } from 'http';
import { initSentry, setupExpressErrorHandler } from './lib/sentry';
import { ChatWebSocketServer } from './websocket';
import { storage } from './storage';
import { seedComplianceData } from './seedCompliance';

// Initialize Sentry for backend error tracking
initSentry();

const app = express();
const PORT = 5000;
const server = createServer(app);

// CRITICAL: Health check endpoints MUST be registered FIRST
// These respond immediately before ANY middleware runs
// This is essential for Replit Autoscale deployment health checks
app.get('/_health', (_req, res) => {
  res.status(200).send('ok');
});

app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

app.get('/', (_req, res, next) => {
  const acceptHeader = _req.headers.accept || '';
  if (!acceptHeader || !acceptHeader.includes('text/html')) {
    return res.status(200).send('ok');
  }
  next();
});

// CRITICAL: Start server listening IMMEDIATELY
// Do NOT wait for Vite setup or any async operations
// Health checks must respond before anything else initializes
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('✅ Health check endpoints ready');
  
  // NOW initialize everything else asynchronously
  initializeApp();
});

async function initializeApp() {
  try {
    // Trust proxy for secure cookies behind TLS
    app.set('trust proxy', 1);

    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Validate SESSION_SECRET in production
    if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
      console.warn('WARNING: SESSION_SECRET not set. Using insecure default.');
    }

    // Session store configuration
    const PgSession = connectPgSimple(session);
    const isProduction = process.env.NODE_ENV === 'production';

    const sessionStore = isProduction && process.env.DATABASE_URL
      ? new PgSession({
          conString: process.env.DATABASE_URL,
          tableName: 'user_sessions',
          createTableIfMissing: true,
        })
      : undefined;

    const sessionMiddleware = session({
      store: sessionStore,
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

    if (isProduction && sessionStore) {
      console.log('✅ Using PostgreSQL session store for Autoscale compatibility');
    } else {
      console.log('ℹ️ Using MemoryStore for sessions (development mode)');
    }

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

    // Initialize WebSocket server with session authentication
    const wsServer = new ChatWebSocketServer(server, sessionMiddleware);
    app.set('wsServer', wsServer);

    // Setup Vite dev server (this can take time, but server is already listening)
    await setupVite(app, server);
    console.log('✅ Vite middleware ready');

    // Setup Sentry error handler AFTER all routes
    setupExpressErrorHandler(app);

    // General error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      console.error('Error:', err);
      res.status(status).json({ error: message });
    });

    // Bootstrap operations run LAST, completely non-blocking
    setImmediate(async () => {
      try {
        await storage.ensureDefaultAccessLevels();
        await seedComplianceData();
      } catch (error) {
        console.error('[Bootstrap] Error during initialization (non-fatal):', error);
      }
    });

  } catch (error) {
    console.error('[InitializeApp] Error during app initialization:', error);
  }
}
