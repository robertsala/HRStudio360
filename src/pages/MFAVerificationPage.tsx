import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Shield, Smartphone, Mail, RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MFAMethod {
  methodType: 'sms' | 'email' | 'totp' | 'passkey';
  methodValue: string;
}

export default function MFAVerificationPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
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
        
        toast({
          title: 'Verification successful',
          description: 'You have been logged in successfully'
        });
        
        // Reload to establish session
        window.location.href = '/';
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
    
    try {
      await apiRequest('/api/mfa/resend-code', {
        method: 'POST',
        body: JSON.stringify({
          sessionToken,
          methodType: selectedMethod.methodType
        })
      });
      
      toast({
        title: 'Code sent',
        description: `A new verification code has been sent to ${selectedMethod.methodValue}`
      });
      
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
    
    // Request new code for this method
    try {
      await apiRequest('/api/mfa/resend-code', {
        method: 'POST',
        body: JSON.stringify({
          sessionToken,
          methodType: method.methodType
        })
      });
      
      toast({
        title: 'Code sent',
        description: `A verification code has been sent to ${method.methodValue}`
      });
      
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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle>Two-Step Verification</CardTitle>
          <CardDescription>
            Enter the verification code sent to {selectedMethod?.methodValue}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              data-testid="input-verification-code"
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleVerifyCode();
                }
              }}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
          </div>
          
          <Button
            data-testid="button-verify-code"
            onClick={handleVerifyCode}
            disabled={isVerifying || code.length !== 6}
            className="w-full"
          >
            {isVerifying ? 'Verifying...' : 'Verify Code'}
          </Button>
          
          <div className="flex items-center justify-between text-sm">
            <Button
              data-testid="button-resend-code"
              variant="ghost"
              size="sm"
              onClick={handleResendCode}
              disabled={isResending || countdown > 0}
              className="text-blue-600 dark:text-blue-400"
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
            </Button>
          </div>
          
          {methods.length > 1 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Use a different method:
              </p>
              <div className="space-y-2">
                {methods.map((method) => (
                  <Button
                    key={method.methodType}
                    data-testid={`button-switch-${method.methodType}`}
                    variant={method.methodType === selectedMethod?.methodType ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleMethodSwitch(method)}
                    className="w-full justify-start"
                  >
                    {getMethodIcon(method.methodType)}
                    <span className="ml-2">{getMethodLabel(method.methodType)}</span>
                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                      {method.methodValue}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <Button
            data-testid="button-cancel"
            variant="ghost"
            onClick={() => {
              sessionStorage.removeItem('mfaData');
              navigate('/');
            }}
            className="w-full"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
