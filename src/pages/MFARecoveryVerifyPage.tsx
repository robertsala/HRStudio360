import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '../lib/queryClient';
import { Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function MFARecoveryVerifyPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    const verifyToken = async () => {
      // Get token from URL query params
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (!token) {
        setError('No recovery token provided');
        setIsVerifying(false);
        return;
      }
      
      try {
        const response = await apiRequest('/api/mfa/verify-recovery', {
          method: 'POST',
          body: JSON.stringify({ token })
        });
        
        if (response.success) {
          setSuccess(true);
          toast({
            title: 'Recovery Successful',
            description: 'Please set up two-step verification again to secure your account.',
            variant: 'default'
          });
          
          // Redirect to settings after 2 seconds
          setTimeout(() => {
            navigate('/settings?tab=accessControl');
          }, 2000);
        }
      } catch (err: any) {
        setError(err.message || 'Invalid or expired recovery link');
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyToken();
  }, [navigate, toast]);
  
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Verifying Recovery Link</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we verify your identity...
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Recovery Successful!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your identity has been verified. Redirecting to security settings...
            </p>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Important:</strong> You must set up two-step verification again before accessing other parts of the application.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Recovery Failed</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          
          <div className="space-y-3">
            <a
              href="/mfa-recovery-request"
              data-testid="link-request-new-recovery"
              className="block w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Request New Recovery Link
            </a>
            
            <a
              href="/"
              data-testid="link-back-to-signin"
              className="block w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium py-3 px-4"
            >
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
