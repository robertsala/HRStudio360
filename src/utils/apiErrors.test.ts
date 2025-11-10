/**
 * Unit tests for apiErrors utility
 */

import {
  parseApiError,
  getUserFriendlyErrorMessage,
  isApiError,
  handleApiError,
  retryWithBackoff,
  HttpStatus,
  ApiError,
} from './apiErrors';

describe('apiErrors utilities', () => {
  describe('parseApiError()', () => {
    it('should parse JSON error response', async () => {
      const mockResponse = {
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({
          error: 'Invalid input',
          code: 'VALIDATION_ERROR',
          details: { field: 'email' },
        }),
      } as unknown as Response;

      const result = await parseApiError(mockResponse);

      expect(result).toEqual({
        message: 'Invalid input',
        status: 400,
        code: 'VALIDATION_ERROR',
        details: { field: 'email' },
      });
    });

    it('should handle JSON parsing errors', async () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Response;

      const result = await parseApiError(mockResponse);

      expect(result.message).toBe('Internal Server Error');
      expect(result.status).toBe(500);
    });

    it('should use default message when no error in response', async () => {
      const mockResponse = {
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response;

      const result = await parseApiError(mockResponse);

      expect(result.message).toBe('An unexpected error occurred');
      expect(result.status).toBe(404);
    });
  });

  describe('getUserFriendlyErrorMessage()', () => {
    it('should return network error message for TypeError with fetch', () => {
      const error = new TypeError('fetch failed');
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toBe('Network error. Please check your connection and try again.');
    });

    it('should return ApiError message for ApiError objects', () => {
      const error: ApiError = {
        message: 'User not found',
        status: 404,
      };
      
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toBe('User not found');
    });

    it('should return Error message for Error objects', () => {
      const error = new Error('Something went wrong');
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toBe('Something went wrong');
    });

    it('should return default message for unknown errors', () => {
      const error = 'string error';
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('isApiError()', () => {
    it('should return true for valid ApiError with status', () => {
      const error: ApiError = {
        message: 'Error message',
        status: 400,
      };
      
      expect(isApiError(error)).toBe(true);
    });

    it('should return true for valid ApiError with code', () => {
      const error: ApiError = {
        message: 'Error message',
        code: 'ERROR_CODE',
      };
      
      expect(isApiError(error)).toBe(true);
    });

    it('should return false for native Error objects', () => {
      const error = new Error('Native error');
      
      expect(isApiError(error)).toBe(false);
    });

    it('should return false for TypeError objects', () => {
      const error = new TypeError('Type error');
      
      expect(isApiError(error)).toBe(false);
    });

    it('should return false for objects without status or code', () => {
      const error = { message: 'Error' };
      
      expect(isApiError(error)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isApiError(null)).toBe(false);
      expect(isApiError(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isApiError('string')).toBe(false);
      expect(isApiError(123)).toBe(false);
    });
  });

  describe('handleApiError()', () => {
    it('should log error and return user-friendly message', () => {
      const endpoint = '/api/test';
      const error: ApiError = {
        message: 'Test error',
        status: 400,
      };
      
      const message = handleApiError(endpoint, error);
      
      expect(message).toBe('Test error');
    });
  });

  describe('retryWithBackoff()', () => {
    it('should succeed on first try', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await retryWithBackoff(mockFn, 3, 100);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on server errors', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({ message: 'Server error', status: 500 })
        .mockResolvedValue('success');
      
      const result = await retryWithBackoff(mockFn, 3, 100);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on client errors (4xx)', async () => {
      const error: ApiError = { message: 'Bad request', status: 400 };
      const mockFn = jest.fn().mockRejectedValue(error);
      
      await expect(retryWithBackoff(mockFn, 3, 100)).rejects.toEqual(error);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should throw last error after max retries', async () => {
      const error = new Error('Persistent error');
      const mockFn = jest.fn().mockRejectedValue(error);
      
      await expect(retryWithBackoff(mockFn, 3, 100)).rejects.toEqual(error);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
      jest.useFakeTimers();
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success');
      
      const promise = retryWithBackoff(mockFn, 3, 1000);
      
      await jest.runAllTimersAsync();
      await promise;
      
      expect(mockFn).toHaveBeenCalledTimes(3);
      
      jest.useRealTimers();
    });
  });

  describe('HttpStatus helpers', () => {
    describe('isSuccess()', () => {
      it('should return true for 2xx status codes', () => {
        expect(HttpStatus.isSuccess(200)).toBe(true);
        expect(HttpStatus.isSuccess(201)).toBe(true);
        expect(HttpStatus.isSuccess(299)).toBe(true);
      });

      it('should return false for non-2xx status codes', () => {
        expect(HttpStatus.isSuccess(199)).toBe(false);
        expect(HttpStatus.isSuccess(300)).toBe(false);
        expect(HttpStatus.isSuccess(400)).toBe(false);
      });
    });

    describe('isClientError()', () => {
      it('should return true for 4xx status codes', () => {
        expect(HttpStatus.isClientError(400)).toBe(true);
        expect(HttpStatus.isClientError(404)).toBe(true);
        expect(HttpStatus.isClientError(499)).toBe(true);
      });

      it('should return false for non-4xx status codes', () => {
        expect(HttpStatus.isClientError(200)).toBe(false);
        expect(HttpStatus.isClientError(500)).toBe(false);
      });
    });

    describe('isServerError()', () => {
      it('should return true for 5xx status codes', () => {
        expect(HttpStatus.isServerError(500)).toBe(true);
        expect(HttpStatus.isServerError(503)).toBe(true);
      });

      it('should return false for non-5xx status codes', () => {
        expect(HttpStatus.isServerError(200)).toBe(false);
        expect(HttpStatus.isServerError(400)).toBe(false);
      });
    });

    describe('specific status checks', () => {
      it('should check isNotFound correctly', () => {
        expect(HttpStatus.isNotFound(404)).toBe(true);
        expect(HttpStatus.isNotFound(400)).toBe(false);
      });

      it('should check isUnauthorized correctly', () => {
        expect(HttpStatus.isUnauthorized(401)).toBe(true);
        expect(HttpStatus.isUnauthorized(403)).toBe(false);
      });

      it('should check isForbidden correctly', () => {
        expect(HttpStatus.isForbidden(403)).toBe(true);
        expect(HttpStatus.isForbidden(401)).toBe(false);
      });

      it('should check isConflict correctly', () => {
        expect(HttpStatus.isConflict(409)).toBe(true);
        expect(HttpStatus.isConflict(400)).toBe(false);
      });
    });
  });
});
