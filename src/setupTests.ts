import '@testing-library/jest-dom';

// Mock import.meta for tests (Vite environment)
Object.defineProperty(globalThis, 'import', {
  writable: true,
  value: {
    meta: {
      env: {
        DEV: true,
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key'
      }
    }
  }
});

// Mock environment variables for tests
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';