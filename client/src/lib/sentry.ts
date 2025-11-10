import * as Sentry from '@sentry/react';

export function initSentry() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!sentryDsn) {
    console.info('Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance Monitoring
    tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // Sample 10% of sessions
    replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors
    
    // Environment
    environment: import.meta.env.MODE,
    
    // Release tracking
    release: `hrstudio360@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    
    // Privacy settings
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (import.meta.env.MODE === 'development' && !import.meta.env.VITE_SENTRY_DEBUG) {
        return null;
      }
      
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
      }
      
      return event;
    },
  });
  
  console.info('Sentry initialized for error tracking and performance monitoring');
}

// Helper to manually capture errors
export function captureError(error: Error, context?: Record<string, any>) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

// Helper to set user context
export function setSentryUser(user: { id: number; email?: string; username?: string }) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser({
      id: user.id.toString(),
      email: user.email,
      username: user.username,
    });
  }
}

// Helper to clear user context on logout
export function clearSentryUser() {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(null);
  }
}
