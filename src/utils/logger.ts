/**
 * Centralized logger utility for error tracking and monitoring
 * Integrated with Sentry for production error tracking
 */
import { captureError } from '../lib/sentry';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const formattedMessage = this.formatMessage('error', message, context);
    
    if (this.isDevelopment) {
      console.error(formattedMessage);
      if (error) {
        console.error(error);
      }
    }

    // Send to Sentry if available
    if (error instanceof Error) {
      captureError(error, { message, ...context });
    }
  }

  warn(message: string, context?: LogContext) {
    const formattedMessage = this.formatMessage('warn', message, context);
    
    if (this.isDevelopment) {
      console.warn(formattedMessage);
    }

    // Future: Send to monitoring service
  }

  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('info', message, context);
      console.log(formattedMessage);
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('debug', message, context);
      console.debug(formattedMessage);
    }
  }

  // Specific method for React Error Boundary errors
  componentError(error: Error, errorInfo: React.ErrorInfo, component?: string) {
    this.error(
      'React component error',
      error,
      {
        component,
        componentStack: errorInfo.componentStack,
        type: 'react_error',
      }
    );
    
    // Note: Sentry is already called in ErrorBoundary.componentDidCatch
    // to avoid duplicate error reports
  }

  // Specific method for API errors
  apiError(endpoint: string, error: unknown, context?: LogContext) {
    this.error(
      `API request failed: ${endpoint}`,
      error instanceof Error ? error : new Error(String(error)),
      {
        ...context,
        endpoint,
        type: 'api_error',
      }
    );
  }
}

export const logger = new Logger();
