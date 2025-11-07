import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] || '';
    }
    return process.env[key] || '';
  } catch (error) {
    console.warn(`Error accessing environment variable ${key}:`, error);
    return '';
  }
};

// Old Supabase project ID: auuqmldhxjhnmqhgeeav
// Old anon key: the one that worked before migration
const supabaseUrl =
  getEnvVar('VITE_SUPABASE_URL') ||
  'https://auuqmldhxjhnmqhgeeav.supabase.co';

const supabaseAnonKey =
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dXFtbGRoeGpobm1xaGdlZWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDY0ODUsImV4cCI6MjA3NDkyMjQ4NX0.bqK3up9bAW2Q1N8l29Xqnx6nqg5HDT5ZusyEYihNO1Q';

console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

export const supabase = createClient(supabase