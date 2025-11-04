import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { apiClient } from '../lib/api';
import i18n from '../i18n';
import { celebrationService, CelebrationData } from '../utils/celebrationService';

interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  role?: 'employee' | 'hr' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  celebration: CelebrationData | null;
  dismissCelebration: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfilePicture: (pictureUrl: string) => Promise<void>;
  impersonatedUser: User | null;
  actualUser: User | null;
  startImpersonation: (targetUserId: string, targetEmail: string) => Promise<void>;
  stopImpersonation: () => void;
  isImpersonating: boolean;
  sessionExpiryWarning: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [actualUser, setActualUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [sessionExpiryWarning, setSessionExpiryWarning] = useState<number | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());

  const loadUserProfile = React.useCallback(async (userId: string, email: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Normalize the role from database (handle both 'Employee' and 'employee')
      const normalizedRole = profile?.role
        ? profile.role.toLowerCase() as 'employee' | 'hr' | 'admin'
        : 'employee';

      const userData: User = {
        id: userId,
        email: email,
        name: profile
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || email.split('@')[0]
          : email.split('@')[0],
        profilePicture: profile?.profile_picture,
        role: normalizedRole
      };

      console.log('Loaded user profile:', {
        email: userData.email,
        roleFromDB: profile?.role,
        normalizedRole: userData.role
      });

      setUser(userData);
      setIsAuthenticated(true);
      setIsLoading(false);

      // CRITICAL: Set language from database preference FIRST, with fallback to 'en'
      // This ensures database preference ALWAYS overrides browser/localStorage detection
      const userLanguage = profile?.preferred_language || 'en';
      console.log('Setting user language from database:', userLanguage);

      // Force change language and update localStorage to match database
      await i18n.changeLanguage(userLanguage);
      localStorage.setItem('i18nextLng', userLanguage);

      // Check for celebrations asynchronously without blocking
      celebrationService.checkForCelebrations(userId)
        .then((celebrationData) => {
          if (celebrationData) {
            console.log('Celebration detected:', celebrationData);
            setCelebration(celebrationData);
          }
        })
        .catch((error) => {
          console.warn('Failed to check for celebrations:', error);
        });
    } catch (error) {
      console.error('Error loading profile:', error);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let authCheckComplete = false;

    // Retry logic with exponential backoff
    const initAuthWithRetry = async (retryCount = 0, maxRetries = 3) => {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);

      try {
        console.log(`[AuthContext] Starting auth initialization (attempt ${retryCount + 1}/${maxRetries + 1})...`);

        // Remove aggressive timeout - let Supabase handle its own timeouts
        // This prevents premature sign-outs when network is slow
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log('[AuthContext] Auth check completed - session:', !!session, 'error:', error);

        if (!mounted) return;

        // Mark auth check as complete
        authCheckComplete = true;

        if (error) {
          console.error('[AuthContext] Session error:', error);

          // Check if this is a retryable error (network, timeout, etc.)
          const isRetryable = error.message?.includes('network') ||
                             error.message?.includes('timeout') ||
                             error.message?.includes('fetch') ||
                             error.status === 429 || // Rate limit
                             error.status === 503 || // Service unavailable
                             error.status === 504;   // Gateway timeout

          if (isRetryable && retryCount < maxRetries && mounted) {
            console.log(`[AuthContext] Retryable error detected, retrying in ${delay}ms...`);
            authCheckComplete = false; // Reset to allow retry
            await new Promise(resolve => setTimeout(resolve, delay));
            if (mounted) {
              return initAuthWithRetry(retryCount + 1, maxRetries);
            }
          }

          // Only clear auth state if there's a legitimate auth error
          // Don't clear on network errors or timeouts
          if (error.message?.includes('Auth') || error.message?.includes('session')) {
            setUser(null);
            setIsAuthenticated(false);
          }
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('[AuthContext] Found session for user:', session.user.email);
          await loadUserProfile(session.user.id, session.user.email || '');
        } else {
          console.log('[AuthContext] No session found - showing landing page');
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error('[AuthContext] Auth initialization error:', error);

        if (mounted) {
          // Check if this is a retryable exception
          const isRetryable = error.name === 'NetworkError' ||
                             error.name === 'TimeoutError' ||
                             error.message?.includes('network') ||
                             error.message?.includes('fetch');

          if (isRetryable && retryCount < maxRetries && mounted) {
            console.log(`[AuthContext] Retryable exception, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            if (mounted) {
              return initAuthWithRetry(retryCount + 1, maxRetries);
            }
          }

          // Mark as complete even on error to prevent fallback from triggering
          authCheckComplete = true;
          console.log('[AuthContext] Auth check failed after retries, but not forcing sign-out');
          // Only set loading to false, don't clear user state on errors
          setIsLoading(false);
        }
      }
    };

    const initAuth = () => initAuthWithRetry();

    // Extended fallback timeout (60 seconds) to handle slow networks
    // Only triggers if auth check hasn't completed at all
    const fallbackTimeout = setTimeout(() => {
      if (mounted && isLoading && !authCheckComplete) {
        console.log('[AuthContext] Fallback timeout after 60s - showing landing page without forcing sign-out');
        // Don't clear user state, just stop showing loading spinner
        setIsLoading(false);
      }
    }, 60000);

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      console.log('[AuthContext] Auth state change:', event, 'session exists:', !!session);

      (async () => {
        if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] Handling SIGNED_OUT event');
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        } else if (event === 'SIGNED_IN' && session?.user) {
          console.log('[AuthContext] Handling SIGNED_IN event for:', session.user.email);
          await loadUserProfile(session.user.id, session.user.email || '');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('[AuthContext] Token refreshed for:', session.user.email);
          // Don't reload profile on token refresh, just update the session silently
        } else if (session?.user) {
          console.log('[AuthContext] Handling session update for:', session.user.email);
          await loadUserProfile(session.user.id, session.user.email || '');
        } else if (event === 'USER_UPDATED') {
          console.log('[AuthContext] User updated, reloading profile');
          if (session?.user) {
            await loadUserProfile(session.user.id, session.user.email || '');
          }
        } else {
          console.log('[AuthContext] Auth event with no session:', event);
          // Only clear state if this is a legitimate sign-out event
          if (event === 'SIGNED_OUT' || !session) {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
          }
        }
      })();
    });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  // Activity tracking to keep session alive
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const updateActivity = () => {
      setLastActivityTime(Date.now());
    };

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // Refresh session token periodically when user is active
    const sessionRefreshInterval = setInterval(async () => {
      const timeSinceActivity = Date.now() - lastActivityTime;
      // Only refresh if user has been active in the last 5 minutes
      if (timeSinceActivity < 5 * 60 * 1000) {
        try {
          console.log('[AuthContext] Attempting to refresh session...');
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('[AuthContext] Session refresh error:', error);
            // Don't sign out on refresh errors - the session might still be valid
            // Supabase will handle session expiry through onAuthStateChange
          } else {
            console.log('[AuthContext] Session refreshed successfully at', new Date().toISOString());
          }
        } catch (error) {
          console.error('[AuthContext] Failed to refresh session:', error);
          // Don't sign out on exceptions - let Supabase handle it
        }
      } else {
        console.log('[AuthContext] Skipping session refresh - user inactive for', Math.round(timeSinceActivity / 1000), 'seconds');
      }
    }, 10 * 60 * 1000); // Check every 10 minutes

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(sessionRefreshInterval);
    };
  }, [isAuthenticated, user, lastActivityTime]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        await loadUserProfile(data.user.id, data.user.email || '');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            first_name: firstName,
            last_name: lastName
          });

        await loadUserProfile(data.user.id, data.user.email || '');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');

      // Store non-auth data we want to preserve
      const languagePreference = localStorage.getItem('i18nextLng');

      // Sign out from Supabase - this will trigger the SIGNED_OUT event in onAuthStateChange
      const { error } = await supabase.auth.signOut({ scope: 'global' });

      if (error) {
        console.error('Supabase signOut error:', error);
        throw error;
      }

      // Clear only Supabase-specific storage keys
      const storageKeys = Object.keys(localStorage);
      storageKeys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });

      // Restore non-auth data
      if (languagePreference) {
        localStorage.setItem('i18nextLng', languagePreference);
      }

      // Clear impersonation state if active
      setActualUser(null);
      setImpersonatedUser(null);
      setIsImpersonating(false);

      console.log('Sign out completed successfully');

      // The onAuthStateChange listener will handle setting user to null
    } catch (error) {
      console.error('Sign out error:', error);

      // Fallback: force clear auth state even if Supabase signOut failed
      const languagePreference = localStorage.getItem('i18nextLng');

      const storageKeys = Object.keys(localStorage);
      storageKeys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });

      if (languagePreference) {
        localStorage.setItem('i18nextLng', languagePreference);
      }

      // Manually update state as fallback
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      setActualUser(null);
      setImpersonatedUser(null);
      setIsImpersonating(false);
    }
  };

  const updateProfilePicture = async (pictureUrl: string) => {
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ profile_picture: pictureUrl })
          .eq('id', user.id);

        setUser({ ...user, profilePicture: pictureUrl });
      } catch (error) {
        console.error('Error updating profile picture:', error);
        throw error;
      }
    }
  };

  const dismissCelebration = () => {
    if (celebration && user) {
      const dateStr = celebration.date.toISOString().split('T')[0];
      celebrationService.markCelebrationDismissed(user.id, celebration.type, dateStr);
    }
    setCelebration(null);
  };

  const startImpersonation = async (targetUserId: string, targetEmail: string) => {
    try {
      if (!user) {
        throw new Error('No authenticated user');
      }

      if (user.role !== 'hr' && user.role !== 'admin' && user.email !== 'robertsala@gmail.com') {
        throw new Error('Insufficient permissions to impersonate users');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle();

      // Normalize the role from database (handle both 'Employee' and 'employee')
      const normalizedRole = profile?.role
        ? profile.role.toLowerCase() as 'employee' | 'hr' | 'admin'
        : 'employee';

      const impersonatedUserData: User = {
        id: targetUserId,
        email: targetEmail,
        name: profile
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || targetEmail.split('@')[0]
          : targetEmail.split('@')[0],
        profilePicture: profile?.profile_picture,
        role: normalizedRole
      };

      setActualUser(user);
      setImpersonatedUser(impersonatedUserData);
      setUser(impersonatedUserData);
      setIsImpersonating(true);

      console.log('Started impersonation:', {
        actualUser: user.email,
        actualRole: user.role,
        impersonatedUser: impersonatedUserData.email,
        impersonatedRole: impersonatedUserData.role,
        profileRoleFromDB: profile?.role
      });
    } catch (error) {
      console.error('Error starting impersonation:', error);
      throw error;
    }
  };

  const stopImpersonation = () => {
    if (actualUser) {
      setUser(actualUser);
      setImpersonatedUser(null);
      setActualUser(null);
      setIsImpersonating(false);
      console.log('Stopped impersonation');
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    celebration,
    dismissCelebration,
    signIn,
    signUp,
    signOut,
    updateProfilePicture,
    impersonatedUser,
    actualUser,
    startImpersonation,
    stopImpersonation,
    isImpersonating,
    sessionExpiryWarning
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
