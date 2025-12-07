import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { authPhase } = useAuth();

  // Show loader while checking auth status or during login transition
  if (authPhase === 'checking' || authPhase === 'authenticating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 mx-auto absolute inset-0"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-6 font-medium">
            {authPhase === 'authenticating' ? 'Signing you in...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Show access restricted when unauthenticated
  if (authPhase === 'unauthenticated') {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-6">
            You need to sign in to access this page. Please sign in to continue.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Render children when authenticated
  return <>{children}</>;
};

export default ProtectedRoute;