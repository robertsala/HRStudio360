/**
 * STUB: Supabase Client (Migration in Progress)
 * 
 * This is a stub implementation to maintain compatibility while migrating
 * from Supabase to backend APIs. Real-time features are currently disabled.
 * 
 * See docs/SUPABASE_REMOVAL_IMPACT.md for migration status.
 */

// Create a stub Supabase client that returns empty data
// This allows imports to work without crashing the app

const createStubSupabaseClient = () => {
  const emptyResponse = { data: null, error: { message: 'Feature temporarily unavailable - migrating to backend API' } };
  const emptySubscription = {
    subscribe: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) })
    }),
    unsubscribe: () => {}
  };

  return {
    // Auth methods
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signUp: async () => emptyResponse,
      signInWithPassword: async () => emptyResponse,
      signOut: async () => emptyResponse,
      onAuthStateChange: () => ({
        data: { subscription: emptySubscription },
        unsubscribe: () => {}
      })
    },

    // Database methods
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: () => ({ data: [], error: null }),
        neq: () => ({ data: [], error: null }),
        gt: () => ({ data: [], error: null }),
        lt: () => ({ data: [], error: null }),
        single: async () => ({ data: null, error: null }),
        order: () => ({ data: [], error: null }),
        limit: () => ({ data: [], error: null }),
        range: () => ({ data: [], error: null }),
        then: (resolve: any) => resolve({ data: [], error: null })
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: null }),
          then: (resolve: any) => resolve({ data: null, error: null })
        }),
        then: (resolve: any) => resolve({ data: null, error: null })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({ data: null, error: null }),
            then: (resolve: any) => resolve({ data: null, error: null })
          }),
          then: (resolve: any) => resolve({ data: null, error: null })
        }),
        then: (resolve: any) => resolve({ data: null, error: null })
      }),
      delete: () => ({
        eq: () => ({ data: null, error: null }),
        then: (resolve: any) => resolve({ data: null, error: null })
      }),
      upsert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: null }),
          then: (resolve: any) => resolve({ data: null, error: null })
        }),
        then: (resolve: any) => resolve({ data: null, error: null })
      })
    }),

    // Real-time subscriptions (stubbed out)
    channel: (name: string) => ({
      on: () => ({
        on: () => ({
          subscribe: () => emptySubscription
        }),
        subscribe: () => emptySubscription
      }),
      subscribe: () => emptySubscription,
      unsubscribe: () => {}
    }),

    // Storage methods
    storage: {
      from: (bucket: string) => ({
        upload: async () => ({ data: null, error: { message: 'File upload disabled - migrating to backend storage' } }),
        download: async () => ({ data: null, error: { message: 'File download disabled' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: async () => ({ data: null, error: null })
      })
    }
  };
};

// Export stub client
export const supabase = createStubSupabaseClient();

// Log warning in development
if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
  console.warn(
    '%c[SUPABASE STUB] Real-time features disabled during migration',
    'color: orange; font-weight: bold;',
    '\nSee docs/SUPABASE_REMOVAL_IMPACT.md for details'
  );
}
