import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import './i18n';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { initializeAppIcons } from './utils/iconGenerator';
import ErrorBoundary from './components/ErrorBoundary';
import { queryClient } from './lib/queryClient';
import { initSentry } from './lib/sentry';

// Initialize Sentry for error tracking and performance monitoring
initSentry();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        console.log('ServiceWorker unregistered');
      });
    });
  });
}

// Initialize icons asynchronously without blocking render
setTimeout(() => {
  initializeAppIcons().catch((error) => {
    console.warn('Failed to initialize app icons:', error);
  });
}, 100);

console.log('[main.tsx] Starting React render...');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);

console.log('[main.tsx] React render initiated');
