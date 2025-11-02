Here's the result of running `cat -n` on /home/ubuntu/hrstudio360_project/project/src/utils/supabaseClient.ts:
     1	import { createClient } from '@supabase/supabase-js';
     2	
     3	const getEnvVar = (key: string): string => {
     4	  try {
     5	    if (typeof import.meta !== 'undefined' && import.meta.env) {
     6	      return import.meta.env[key] || '';
     7	    }
     8	    return process.env[key] || '';
     9	  } catch (error) {
    10	    console.warn(`Error accessing environment variable ${key}:`, error);
    11	    return '';
    12	  }
    13	};
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://cgqoazepziswoziybhiz.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncW9hemVwemlzd296aXliaGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTgwNDEsImV4cCI6MjA3NzQzNDA0MX0.WGxrf8LVcSXVfRH1OM2mlnNJfxwWKP-PewgSeq_rHeM';
    16	const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dXFtbGRoeGpobm1xaGdlZWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDY0ODUsImV4cCI6MjA3NDkyMjQ4NX0.bqK3up9bAW2Q1N8l29Xqnx6nqg5HDT5ZusyEYihNO1Q';
    17	
    18	console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing');
    19	console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');
    20	
    21	export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    22	  auth: {
    23	    persistSession: true,
    24	    autoRefreshToken: true,
    25	    detectSessionInUrl: true,
    26	    flowType: 'pkce'
    27	  },
    28	  global: {
    29	    fetch: (url, options = {}) => {
    30	      return fetch(url, {
    31	        ...options,
    32	        signal: AbortSignal.timeout(30000)
    33	      }).catch(error => {
    34	        console.error('Supabase fetch error:', error);
    35	        throw error;
    36	      });
    37	    }
    38	  }
    39	});
    40	