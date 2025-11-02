import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    let mounted = true;

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        loadUserProfile(session.user.id, session.user.email || '');
      } else {
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      (async () => {
        if (event === 'SIGNED_OUT') {
          setAuthState({ user: null, isAuthenticated: false, isLoading: false });
        } else if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user.id, session.user.email || '');
        } else if (session?.user) {
          await loadUserProfile(session.user.id, session.user.email || '');
        } else {
          setAuthState({ user: null, isAuthenticated: false, isLoading: false });
        }
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string, email: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const user: User = {
      id: userId,
      email: email,
      name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || email.split('@')[0] : email.split('@')[0],
      profilePicture: profile?.profile_picture
    };

    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false
    });
  };

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
        // Create profile
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
      // Sign out from Supabase - this triggers SIGNED_OUT event
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out exception:', error);
      // Still clear local state on error
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    updateProfilePicture: async (pictureUrl: string) => {
      if (authState.user) {
        await supabase
          .from('profiles')
          .update({ profile_picture: pictureUrl })
          .eq('id', authState.user.id);

        setAuthState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, profilePicture: pictureUrl } : null
        }));
      }
    }
  };
};