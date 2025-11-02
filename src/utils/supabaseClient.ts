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

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://cgqoazepziswoziybhiz.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncW9hemVwemlzd296aXliaGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTgwNDEsImV4cCI6MjA3NzQzNDA0MX0.WGxrf8LVcSXVfRH1OM2mlnNJfxwWKP-PewgSeq_rHeM';

console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000)
      }).catch(error => {
        console.error('Supabase fetch error:', error);
        throw error;
      });
    }
  }
});
