import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const applyThemeToDom = (theme: Theme) => {
  console.log(`[ThemeContext] Applying theme to DOM: ${theme}`);
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
    console.log('[ThemeContext] Added "dark" class to HTML element');
  } else {
    root.classList.remove('dark');
    console.log('[ThemeContext] Removed "dark" class from HTML element');
  }

  console.log('[ThemeContext] Current HTML classList:', Array.from(root.classList));
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'light';
    console.log('[ThemeContext] Initializing with theme:', initialTheme);
    applyThemeToDom(initialTheme);
    return initialTheme;
  });

  const { user, isAuthenticated } = useAuth();
  const hasLoadedFromDb = useRef(false);
  const isUpdating = useRef(false);

  const loadThemePreference = useCallback(async () => {
    if (!user || !isAuthenticated || hasLoadedFromDb.current) {
      console.log('[ThemeContext] Skipping DB load - already loaded or no user');
      return;
    }

    console.log('[ThemeContext] Loading theme preference from database for user:', user.id);

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('theme_preference')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[ThemeContext] Error loading theme from DB:', error);
        return;
      }

      if (profile?.theme_preference && (profile.theme_preference === 'light' || profile.theme_preference === 'dark')) {
        const dbTheme = profile.theme_preference as Theme;
        const localTheme = localStorage.getItem('theme');

        console.log('[ThemeContext] DB theme:', dbTheme);
        console.log('[ThemeContext] Local theme:', localTheme);

        if (localTheme !== dbTheme) {
          console.log('[ThemeContext] Syncing DB theme to local');
          setThemeState(dbTheme);
          applyThemeToDom(dbTheme);
          localStorage.setItem('theme', dbTheme);
        }

        hasLoadedFromDb.current = true;
      } else {
        console.log('[ThemeContext] No theme preference in database, keeping local:', theme);
        hasLoadedFromDb.current = true;
      }
    } catch (err) {
      console.error('[ThemeContext] Exception loading theme:', err);
    }
  }, [user, isAuthenticated, theme]);

  useEffect(() => {
    if (isAuthenticated && user && !hasLoadedFromDb.current) {
      loadThemePreference();
    } else if (!isAuthenticated) {
      hasLoadedFromDb.current = false;
    }
  }, [isAuthenticated, user?.id, loadThemePreference]);

  useEffect(() => {
    console.log('[ThemeContext] Theme state changed to:', theme);
    applyThemeToDom(theme);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    if (newTheme !== 'light' && newTheme !== 'dark') {
      console.error('[ThemeContext] Invalid theme value:', newTheme);
      return;
    }

    if (isUpdating.current) {
      console.log('[ThemeContext] Update already in progress, skipping');
      return;
    }

    isUpdating.current = true;
    console.log('[ThemeContext] Setting theme to:', newTheme);

    setThemeState(newTheme);
    applyThemeToDom(newTheme);
    localStorage.setItem('theme', newTheme);
    console.log('[ThemeContext] Updated localStorage to:', newTheme);

    if (user && isAuthenticated) {
      try {
        console.log('[ThemeContext] Saving theme to database');
        const { error } = await supabase
          .from('profiles')
          .update({ theme_preference: newTheme })
          .eq('id', user.id);

        if (error) {
          console.error('[ThemeContext] Error saving theme to DB:', error);
        } else {
          console.log('[ThemeContext] Successfully saved theme to DB');
        }
      } catch (error) {
        console.error('[ThemeContext] Exception saving theme:', error);
      }
    }

    isUpdating.current = false;
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('[ThemeContext] Toggle theme from', theme, 'to', newTheme);
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
