import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '../lib/queryClient';
import { Shield, Smartphone, Mail, RefreshCw, AlertCircle, Key } from 'lucide-react';

interface MFAMethod {
  methodType: 'sms' | 'email' | 'totp' | 'passkey';
  methodValue: string;
}

export default function MFAVerificationPage() {
  const [, navigate] = useLocation();
  
  // Get MFA data from sessionStorage (set by login flow)
  const mfaData = sessionStorage.getItem('mfaData');
  const parsedData = mfaData ? JSON.parse(mfaData) : null;
  
  const [sessionToken] = useState<string>(parsedData?.sessionToken || '');
  const [methods] = useState<MFAMethod[]>(parsedData?.methods || []);
  const [selectedMethod, setSelectedMethod] = useState<MFAMethod | null>(
    parsedData?.selectedMethod || null
  );
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usingBackupCode, setUsingBackupCode] = useState(false);
  
  // Redirect if no MFA data
  useEffect(() => {
    if (!parsedData || !sessionToken) {
      navigate('/');
    }
  }, [parsedData, sessionToken, navigate]);
  
  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }
    
    setError('');
    setIsVerifying(true);
    
    try {
      const response = await apiRequest('/api/mfa/verify-login', {
        method: 'POST',
        body: JSON.stringify({
          sessionToken,
          code: code.trim()
        })
      });
      
      if (response.success) {
        // Clear MFA data
        sessionStorage.removeItem('mfaData');
        
        // Navigate directly to dashboard - ProtectedRoute will handle auth check
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleResendCode = async () => {
    if (!selectedMethod || countdown > 0) return;
    
    setIsResending(true);
    setError('');
    setSuccess('');
    
    try {
      await apiRequest('/api/mfa/resend-code', {
        method: 'POST',
        body: JSON.stringify({
          sessionToken,
          methodType: selectedMethod.methodType
        })
      });
      
      setSuccess(`A new verification code has been sent to ${selectedMethod.methodValue}`);
      setCountdown(60); // 60 second cooldown
      setCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };
  
  const handleMethodSwitch = async (method: MFAMethod) => {
    if (method.methodType === selectedMethod?.methodType) return;
    
    setSelectedMethod(method);
    setCode('');
    setError('');
    setSuccess('');
    
    // Request new code for this method
    try {
      await apiRequest('/api/mfa/resend-code', {
        method: 'POST',
        body: JSON.stringify({
          sessionToken,
          methodType: method.methodType
        })
      });
      
      setSuccess(`A verification code has been sent to ${method.methodValue}`);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    }
  };
  
  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'sms':
        return <Smartphone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };
  
  const getMethodLabel = (type: string) => {
    switch (type) {
      case 'sms':
        return 'Text Message (Less Secure)';
      case 'email':
        return 'Email (Less Secure)';
      case 'totp':
        return 'Authenticator App';
      case 'passkey':
        return 'Passkey';
      default:
        return type;
    }
  };
  
  if (!parsedData || !sessionToken) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Two-Step Verification</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Enter the verification code sent to {selectedMethod?.methodValue}
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {usingBackupCode ? 'Backup Code' : 'Verification Code'}
            </label>
            <input
              id="code"
              data-testid="input-verification-code"
              type="text"
              placeholder={usingBackupCode ? 'XXXX-XXXX' : 'Enter 6-digit code'}
              value={code}
              onChange={(e) => {
                if (usingBackupCode) {
                  // For backup codes: allow alphanumeric and dash, uppercase, max 9 chars
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 9);
                  setCode(value);
                } else {
                  // For TOTP: only digits, max 6 chars
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(value);
                }
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleVerifyCode();
                }
              }}
              maxLength={usingBackupCode ? 9 : 6}
              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              autoFocus
            />
            {selectedMethod?.methodType === 'totp' && !usingBackupCode && (
              <button
                onClick={() => {
                  setUsingBackupCode(true);
                  setCode('');
                  setError('');
                }}
                data-testid="button-use-backup-code"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Key className="h-4 w-4" />
                Use a backup code instead
              </button>
            )}
            {usingBackupCode && (
              <button
                onClick={() => {
                  setUsingBackupCode(false);
                  setCode('');
                  setError('');
                }}
                data-testid="button-use-totp-code"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Use authenticator app code instead
              </button>
            )}
          </div>
          
          <button
            data-testid="button-verify-code"
            onClick={handleVerifyCode}
            disabled={isVerifying || code.length !== 6}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isVerifying ? 'Verifying...' : 'Verify Code'}
          </button>
          
          <div className="flex items-center justify-center text-sm">
            <button
              data-testid="button-resend-code"
              onClick={handleResendCode}
              disabled={isResending || countdown > 0}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Resend Code
                </>
              )}
            </button>
          </div>
          
          {methods.length > 1 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Use a different method:
              </p>
              <div className="space-y-2">
                {methods.map((method) => (
                  <button
                    key={method.methodType}
                    data-testid={`button-switch-${method.methodType}`}
                    onClick={() => handleMethodSwitch(method)}
                    className={`w-full px-4 py-3 rounded-md border transition-colors flex items-center ${
                      method.methodType === selectedMethod?.methodType
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {getMethodIcon(method.methodType)}
                    <span className="ml-2">{getMethodLabel(method.methodType)}</span>
                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                      {method.methodValue}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <button
            data-testid="button-cancel"
            onClick={() => {
              sessionStorage.removeItem('mfaData');
              navigate('/');
            }}
            className="w-full px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          
          <div className="pt-4 text-center border-t border-gray-200 dark:border-gray-700">
            <a
              href="/mfa-recovery-request"
              data-testid="link-recovery-request"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline"
            >
              Lost access to your device?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
