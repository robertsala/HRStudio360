import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Shared hook for handling ESC key to return to dashboard
 * @param onEscape Optional handler that returns true if escape should proceed to dashboard
 */
export function useDashboardEscape(onEscape?: () => boolean) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // If custom handler provided, check if it allows escape
        const shouldProceed = onEscape ? onEscape() : true;
        
        if (shouldProceed) {
          setLocation('/dashboard');
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onEscape, setLocation]);
}
