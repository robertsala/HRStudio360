import { useState } from 'react';
import { Link } from 'wouter';
import { apiRequest } from '../lib/queryClient';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function MFARecoveryRequestPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      await apiRequest('/api/mfa/request-recovery', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() })
      });
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send recovery email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Check Your Email</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              If an account exists with this email address, you'll receive recovery instructions shortly.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              The recovery link will expire in 30 minutes.
            </p>
            <Link href="/" data-testid="link-back-to-signin">
              <a className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </a>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recover Your Account</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Lost access to your authenticator app? We'll send you a recovery link.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              id="email"
              data-testid="input-recovery-email"
              type="email"
              placeholder="your.email@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white"
              disabled={isSubmitting}
              autoFocus
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter the email address associated with your account
            </p>
          </div>
          
          <button
            type="submit"
            data-testid="button-send-recovery"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send Recovery Link
              </>
            )}
          </button>
          
          <div className="pt-4 text-center">
            <Link href="/" data-testid="link-back-to-signin-bottom">
              <a className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                <ArrowLeft className="h-3 w-3" />
                Back to Sign In
              </a>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
