import { QueryClient } from '@tanstack/react-query';
import { parseApiError, HttpStatus, isApiError } from '../utils/apiErrors';
import { logger } from '../utils/logger';

// Default query function that fetches from backend API with enhanced error handling
const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }): Promise<any> => {
  const endpoint = Array.isArray(queryKey) ? queryKey.join('/') : queryKey;
  
  try {
    const response = await fetch(endpoint as string, {
      credentials: 'include', // Include cookies for session management
    });
    
    if (!response.ok) {
      const apiError = await parseApiError(response);
      logger.apiError(endpoint as string, apiError, { queryKey });
      throw apiError;
    }
    
    return response.json();
  } catch (error) {
    // Re-throw API errors (our custom parsed errors)
    if (isApiError(error)) {
      throw error;
    }
    // Wrap network errors with friendly message
    logger.apiError(endpoint as string, error, { queryKey, type: 'network_error' });
    throw new Error('Network error. Please check your connection and try again.');
  }
};

// Retry logic: retry on server errors (5xx) and network errors, but not client errors (4xx)
const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= 3) return false;
  
  // Don't retry client errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;
    if (HttpStatus.isClientError(status)) {
      return false;
    }
  }
  
  // Retry server errors and network errors
  return true;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchOnWindowFocus: false,
      retry: shouldRetry,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

// Helper function for mutations with enhanced error handling
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const apiError = await parseApiError(response);
      logger.apiError(endpoint, apiError, { method: options.method || 'GET' });
      throw apiError;
    }

    return response.json();
  } catch (error) {
    // Re-throw API errors (our custom parsed errors)
    if (isApiError(error)) {
      throw error;
    }
    // Wrap network errors with friendly message
    logger.apiError(endpoint, error, { method: options.method || 'GET', type: 'network_error' });
    throw new Error('Network error. Please check your connection and try again.');
  }
}
