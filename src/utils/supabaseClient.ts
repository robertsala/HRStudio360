import { createClient } from '@supabase/supabase-js';

/**
 * Supabase connection for HRStudio360
 * Project: cgqoazepziswoziybhiz
 * URL: https://cgqoazepziswoziybhiz.supabase.co
 * Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncW9hemVwemlzd296aXliaGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTgwNDEsImV4cCI6MjA3NzQzNDA0MX0.WGxrf8LVcSXVfRH1OM2mlnNJfxwWKP-PewgSeq_rHeM
 */

// ✅ Your current, verified Supabase project credentials
const SUPABASE_URL = 'https://cgqoazepziswoziybhiz.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncW9hemVwemlzd296aXliaGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTgwNDEsImV4cCI6MjA3NzQzNDA0MX0.WGxrf8LVcSXVfRH1OM2mlnNJfxwWKP-PewgSeq_rHeM';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    fetch: async (url, options = {}) => {
      try {
        // Timeout safeguard on requests
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeout);
        return response;
      } catch (error) {
        console.error('Supabase fetch error:', error);
        throw error;
      }
    }
  }
});

console.log('✅ Supabase client configured for cgqoazepziswoziybhiz');