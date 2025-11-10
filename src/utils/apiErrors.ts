/**
 * API Error handling utilities
 * Provides standardized error parsing and user-friendly error messages
 */

import { logger } from './logger';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

/**
 * Parse API response errors into a standardized format
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  let errorData: any;
  
  try {
    errorData = await response.json();
  } catch {
    errorData = { error: response.statusText };
  }

  const error: ApiError = {
    message: errorData.error || errorData.message || 'An unexpected error occurred',
    status: response.status,
    code: errorData.code,
    details: errorData.details,
  };

  return error;
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  // Network error
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  // API error with custom message
  if (isApiError(error)) {
    return error.message;
  }

  // Standard Error object
  if (error instanceof Error) {
    return error.message;
  }

  // Unknown error
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Type guard for ApiError
 * Checks for our custom ApiError structure, not native Error objects
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ApiError).message === 'string' &&
    // Discriminate from native Error/TypeError by requiring status or code
    ('status' in error || 'code' in error)
  );
}

/**
 * Handle API errors with logging and user-friendly messages
 */
export function handleApiError(
  endpoint: string,
  error: unknown,
  context?: Record<string, any>
): string {
  logger.apiError(endpoint, error, context);
  return getUserFriendlyErrorMessage(error);
}

/**
 * Retry utility for API calls with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (isApiError(error) && error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * HTTP status code helpers
 */
export const HttpStatus = {
  isSuccess: (status: number) => status >= 200 && status < 300,
  isClientError: (status: number) => status >= 400 && status < 500,
  isServerError: (status: number) => status >= 500,
  isNotFound: (status: number) => status === 404,
  isUnauthorized: (status: number) => status === 401,
  isForbidden: (status: number) => status === 403,
  isConflict: (status: number) => status === 409,
} as const;
