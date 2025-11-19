import { useState, useCallback } from 'react';

export interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: Toast) => {
    // For now, just log to console
    // This can be upgraded to use a toast notification library later
    const message = `[${variant.toUpperCase()}] ${title}${description ? `: ${description}` : ''}`;
    
    if (variant === 'destructive') {
      console.error(message);
    } else {
      console.log(message);
    }

    // Store toast in state for potential UI rendering
    const newToast = { title, description, variant };
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t !== newToast));
    }, 5000);
  }, []);

  return { toast, toasts };
}
