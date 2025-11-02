import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { runThemeDiagnostics } from '../utils/themeDiagnostics';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const handleToggleClick = () => {
    console.log('=== THEME TOGGLE CLICKED ===');
    console.log('Current theme before toggle:', theme);
    console.log('Current HTML classList:', Array.from(document.documentElement.classList));

    runThemeDiagnostics();

    toggleTheme();

    setTimeout(() => {
      console.log('After toggle - theme should be:', theme === 'light' ? 'dark' : 'light');
      console.log('After toggle - HTML classList:', Array.from(document.documentElement.classList));
      runThemeDiagnostics();
    }, 100);
  };

  return (
    <button
      onClick={handleToggleClick}
      className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-600 hover:from-blue-100 hover:to-blue-200 dark:hover:from-gray-600 dark:hover:to-gray-500 border-2 border-gray-200 dark:border-gray-500 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Current: ${theme === 'light' ? 'Light' : 'Dark'} mode - Click to switch`}
    >
      {theme === 'light' ? (
        <Sun className="h-6 w-6 text-yellow-500" strokeWidth={2.5} />
      ) : (
        <Moon className="h-6 w-6 text-blue-300" strokeWidth={2.5} />
      )}
    </button>
  );
};

export default ThemeToggle;
