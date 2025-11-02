import { useEffect } from 'react';

/**
 * Custom hook to handle ESC key press with proper event handling
 * Prevents event propagation conflicts and auth state issues
 *
 * @param callback - Function to call when ESC is pressed
 * @param isActive - Whether the handler should be active (e.g., modal is open)
 */
export const useEscapeKey = (callback: () => void, isActive: boolean = true) => {
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isActive) {
        event.preventDefault();
        event.stopPropagation();
        callback();
      }
    };

    if (isActive) {
      // Use capture phase to handle the event before it bubbles
      document.addEventListener('keydown', handleEscKey, { capture: true });

      return () => {
        document.removeEventListener('keydown', handleEscKey, { capture: true });
      };
    }
  }, [callback, isActive]);
};
