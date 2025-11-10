import * as Sentry from '@sentry/node';
import type { Request, Response, NextFunction } from 'express';

let isSentryEnabled = false;

export function initSentry() {
  const sentryDsn = process.env.SENTRY_DSN;
  
  if (!sentryDsn) {
    console.info('Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    
    // Performance Monitoring
    tracesSampleRate: 0.1, // Capture 10% of transactions
    
    // Environment
    environment: process.env.NODE_ENV || 'development',
    
    // Release tracking
    release: `hrstudio360@${process.env.APP_VERSION || '1.0.0'}`,
    
    // Privacy settings
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
        return null;
      }
      
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
      
      return event;
    },
  });
  
  isSentryEnabled = true;
  console.info('✅ Sentry initialized for backend error tracking');
}

// Helper to manually capture errors
export function captureError(error: Error, context?: Record<string, any>) {
  if (isSentryEnabled) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

// Helper to set user context
export function setSentryUser(user: { id: number; email?: string; username?: string }) {
  if (isSentryEnabled) {
    Sentry.setUser({
      id: user.id.toString(),
      email: user.email,
      username: user.username,
    });
  }
}

// Helper to clear user context
export function clearSentryUser() {
  if (isSentryEnabled) {
    Sentry.setUser(null);
  }
}

// Export Sentry handlers with fallbacks for when Sentry is not configured
export const requestHandler = () => isSentryEnabled 
  ? Sentry.requestHandler() 
  : (req: Request, res: Response, next: NextFunction) => next();

export const tracingHandler = () => isSentryEnabled 
  ? Sentry.tracingHandler() 
  : (req: Request, res: Response, next: NextFunction) => next();

export const errorHandler = () => isSentryEnabled 
  ? Sentry.errorHandler() 
  : (err: any, req: Request, res: Response, next: NextFunction) => next(err);
