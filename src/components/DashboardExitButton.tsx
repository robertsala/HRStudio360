import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface DashboardExitButtonProps {
  className?: string;
}

/**
 * Shared component for "Exit to Dashboard" button
 * Provides consistent styling and behavior across all page components
 */
export function DashboardExitButton({ className = '' }: DashboardExitButtonProps) {
  const [, setLocation] = useLocation();

  return (
    <button
      onClick={() => setLocation('/dashboard')}
      className={`text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 ${className}`}
      data-testid="button-exit-dashboard"
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="text-sm font-medium">Exit to Dashboard</span>
    </button>
  );
}
