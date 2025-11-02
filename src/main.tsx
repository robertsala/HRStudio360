import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { initializeAppIcons } from './utils/iconGenerator';
import ErrorBoundary from './components/ErrorBoundary';

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
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);

console.log('[main.tsx] React render initiated');
