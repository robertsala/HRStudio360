/**
 * Unit tests for logger utility
 */

import { logger } from './logger';

describe('Logger', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('error()', () => {
    it('should log error message with context', () => {
      const message = 'Test error';
      const context = { component: 'TestComponent', userId: '123' };
      
      logger.error(message, undefined, context);
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleErrorSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('[ERROR]');
      expect(loggedMessage).toContain(message);
      expect(loggedMessage).toContain(JSON.stringify(context));
    });

    it('should log error object when provided', () => {
      const message = 'Test error';
      const error = new Error('Original error');
      
      logger.error(message, error);
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, error);
    });

    it('should include timestamp in log message', () => {
      logger.error('Test error');
      
      const loggedMessage = consoleErrorSpy.mock.calls[0][0];
      expect(loggedMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('warn()', () => {
    it('should log warning message with context', () => {
      const message = 'Test warning';
      const context = { action: 'testAction' };
      
      logger.warn(message, context);
      
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleWarnSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('[WARN]');
      expect(loggedMessage).toContain(message);
      expect(loggedMessage).toContain(JSON.stringify(context));
    });

    it('should work without context', () => {
      const message = 'Test warning';
      
      logger.warn(message);
      
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy.mock.calls[0][0]).toContain(message);
    });
  });

  describe('info()', () => {
    it('should log info message', () => {
      const message = 'Test info';
      const context = { userId: 'user-123' };
      
      logger.info(message, context);
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('[INFO]');
      expect(loggedMessage).toContain(message);
    });
  });

  describe('debug()', () => {
    it('should log debug message', () => {
      const message = 'Test debug';
      
      logger.debug(message);
      
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleDebugSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('[DEBUG]');
      expect(loggedMessage).toContain(message);
    });
  });

  describe('componentError()', () => {
    it('should log React component errors with component stack', () => {
      const error = new Error('Component error');
      const errorInfo = {
        componentStack: 'at Component\nat Parent',
      };
      const component = 'TestComponent';
      
      logger.componentError(error, errorInfo as any, component);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedMessage = consoleErrorSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('React component error');
      expect(loggedMessage).toContain(component);
      // Component stack is JSON-stringified, so check for the property
      expect(loggedMessage).toContain('componentStack');
    });
  });

  describe('apiError()', () => {
    it('should log API errors with endpoint', () => {
      const endpoint = '/api/users';
      const error = new Error('API failed');
      const context = { method: 'GET' };
      
      logger.apiError(endpoint, error, context);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedMessage = consoleErrorSpy.mock.calls[0][0];
      expect(loggedMessage).toContain(`API request failed: ${endpoint}`);
      expect(loggedMessage).toContain('api_error');
    });

    it('should handle non-Error objects', () => {
      const endpoint = '/api/data';
      const error = 'String error';
      
      logger.apiError(endpoint, error);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorObject = consoleErrorSpy.mock.calls[1][0];
      expect(errorObject).toBeInstanceOf(Error);
    });
  });
});
