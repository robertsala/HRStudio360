import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiClient } from '../lib/api';
import i18n from '../i18n';
import { celebrationService, CelebrationData } from '../utils/celebrationService';

interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  role?: string; // Keep raw role from database for accurate privilege checks
  department?: string;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [actualUser, setActualUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  const loadUserProfile = React.useCallback(async (userId: string, email: string) => {
    try {
      const profile = await apiClient.getProfile(userId);

      // Keep raw role from database for accurate privilege checks (e.g., 'Product Owner')
      const userData: User = {
        id: userId,
        email: email,
        name: profile
          ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || email.split('@')[0]
          : email.split('@')[0],
        profilePicture: profile?.profilePicture || undefined,
        role: profile?.role || undefined,
        department: profile?.department || undefined
      };

      console.log('Loaded user profile:', {
        email: userData.email,
        roleFromDB: profile?.role,
        normalizedRole: userData.role
      });

      // ALWAYS set user as authenticated, even if optional data queries fail
      setUser(userData);
      setIsAuthenticated(true);
      setIsLoading(false);

      // CRITICAL: Set language from database preference FIRST, with fallback to 'en'
      // This ensures database preference ALWAYS overrides browser/localStorage detection
      const userLanguage = profile?.languagePreference || 'en';
      console.log('Setting user language from database:', userLanguage);

      // Force change language and update localStorage to match database
      await i18n.changeLanguage(userLanguage);
      localStorage.setItem('i18nextLng', userLanguage);

      // Check for celebrations asynchronously without blocking
      // Wrapped in try-catch to prevent Supabase errors from breaking auth
      celebrationService.checkForCelebrations(userId)
        .then((celebrationData) => {
          if (celebrationData) {
            console.log('Celebration detected:', celebrationData);
            setCelebration(celebrationData);
          }
        })
        .catch((error) => {
          console.warn('Failed to check for celebrations (non-critical):', error);
          // Don't propagate - celebrations are optional
        });
    } catch (error) {
      console.error('Error loading profile:', error);
      
      // CRITICAL FIX: Don't log out on profile load errors during migration
      // If we have basic user info, keep them logged in
      // NOTE: role and department are undefined here, which will cause privileged 
      // operations to fail safely (user will be treated as unprivileged)
      const userData: User = {
        id: userId,
        email: email,
        name: email.split('@')[0],
        role: undefined,
        department: undefined
      };
      
      console.warn('Profile load failed, using fallback auth with email only. User will have no privileges until profile loads.');
      setUser(userData);
      setIsAuthenticated(true);
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

        // Check session with our backend
        const session = await apiClient.getSession();

        console.log('[AuthContext] Backend session check:', !!session);

        if (!mounted) return;

        // Mark auth check as complete
        authCheckComplete = true;

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

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
    };
  }, [loadUserProfile]);

  // Session refresh is now handled by backend via cookies automatically
  // No manual activity tracking needed

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);

      if (response.user) {
        await loadUserProfile(response.user.id, response.user.email || '');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const response = await apiClient.signup(email, password, firstName, lastName);

      if (response.user) {
        // Auto sign in after signup
        await signIn(email, password);
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

      // Sign out from backend
      await apiClient.logout();

      // Clear only auth-specific storage keys
      const storageKeys = Object.keys(localStorage);
      storageKeys.forEach(key => {
        if (key.startsWith('auth-') || key.includes('session')) {
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

      // Clear auth state
      setUser(null);
      setIsAuthenticated(false);

      // Redirect to homepage
      setLocation('/');

      console.log('Sign out completed successfully');
    } catch (error) {
      console.error('Sign out error:', error);

      // Fallback: force clear auth state even if backend signOut failed
      const languagePreference = localStorage.getItem('i18nextLng');

      const storageKeys = Object.keys(localStorage);
      storageKeys.forEach(key => {
        if (key.startsWith('auth-') || key.includes('session')) {
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

      // Redirect to homepage even on error
      setLocation('/');
    }
  };

  const updateProfilePicture = async (pictureUrl: string) => {
    if (user) {
      try {
        await apiClient.updateProfile(user.id, { profilePicture: pictureUrl });
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

      const profile = await apiClient.getProfile(targetUserId);

      // Normalize the role from database (handle both 'Employee' and 'employee')
      const normalizedRole = profile?.role
        ? profile.role.toLowerCase() as 'employee' | 'hr' | 'admin'
        : 'employee';

      const impersonatedUserData: User = {
        id: targetUserId,
        email: targetEmail,
        name: profile
          ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || targetEmail.split('@')[0]
          : targetEmail.split('@')[0],
        profilePicture: profile?.profilePicture || undefined,
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
    isImpersonating
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

// Export useAuthContext as an alias for useAuth for backwards compatibility
export const useAuthContext = useAuth;
