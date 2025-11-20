import { useState } from 'react';
import { Shield, Smartphone, Mail, Check, Trash2, AlertCircle, Key, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MFAMethod {
  id: string;
  methodType: 'sms' | 'email' | 'totp' | 'passkey';
  methodValue: string | null;
  isPrimary: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface OrgSettings {
  mfaEnabled: boolean;
  mfaEnforced: boolean;
  allowedMethods: string[];
}

export default function MFASettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [addingMethod, setAddingMethod] = useState(false);
  const [selectedMethodType, setSelectedMethodType] = useState<'sms' | 'email' | 'totp' | 'passkey' | null>(null);
  const [methodValue, setMethodValue] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingMethodId, setPendingMethodId] = useState<string | null>(null);
  const [pendingSessionToken, setPendingSessionToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  // Fetch existing MFA methods
  const { data: methods = [], isLoading } = useQuery<MFAMethod[]>({
    queryKey: ['/api/mfa/methods'],
    enabled: !!user
  });
  
  // Fetch organization settings
  const { data: orgSettings } = useQuery<OrgSettings>({
    queryKey: ['/api/mfa/settings']
  });
  
  // Add new MFA method
  const addMethodMutation = useMutation({
    mutationFn: async (data: { methodType: string; methodValue: string }) => {
      return apiRequest('/api/mfa/methods', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      if (data.requiresVerification) {
        setPendingMethodId(data.methodId);
        setPendingSessionToken(data.sessionToken);
        setVerificationCode('');
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/mfa/methods'] });
        resetForm();
      }
      setError('');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to add MFA method');
    }
  });
  
  // Verify MFA method
  const verifyMethodMutation = useMutation({
    mutationFn: async (data: { sessionToken: string; code: string }) => {
      return apiRequest('/api/mfa/verify-enrollment', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mfa/methods'] });
      resetForm();
      setError('');
    },
    onError: (err: any) => {
      setError(err.message || 'Invalid verification code');
    }
  });
  
  // Remove MFA method
  const removeMethodMutation = useMutation({
    mutationFn: async (methodId: string) => {
      return apiRequest(`/api/mfa/methods/${methodId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mfa/methods'] });
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to remove MFA method');
    }
  });
  
  // Set primary method
  const setPrimaryMutation = useMutation({
    mutationFn: async (methodId: string) => {
      return apiRequest(`/api/mfa/methods/${methodId}/primary`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mfa/methods'] });
    }
  });
  
  const resetForm = () => {
    setAddingMethod(false);
    setSelectedMethodType(null);
    setMethodValue('');
    setVerificationCode('');
    setPendingMethodId(null);
    setPendingSessionToken(null);
    setError('');
  };
  
  const handleAddMethod = () => {
    if (!selectedMethodType) {
      setError('Please select a verification method');
      return;
    }
    
    if ((selectedMethodType === 'sms' || selectedMethodType === 'email') && !methodValue.trim()) {
      setError(`Please enter your ${selectedMethodType === 'sms' ? 'phone number' : 'email address'}`);
      return;
    }
    
    addMethodMutation.mutate({
      methodType: selectedMethodType,
      methodValue: methodValue.trim()
    });
  };
  
  const handleVerifyMethod = () => {
    if (!pendingSessionToken || !verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }
    
    verifyMethodMutation.mutate({
      sessionToken: pendingSessionToken,
      code: verificationCode.trim()
    });
  };
  
  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'sms':
        return <Smartphone className="h-5 w-5" />;
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'totp':
        return <Key className="h-5 w-5" />;
      case 'passkey':
        return <Lock className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };
  
  const getMethodLabel = (type: string) => {
    switch (type) {
      case 'sms':
        return 'Text Message';
      case 'email':
        return 'Email';
      case 'totp':
        return 'Authenticator App';
      case 'passkey':
        return 'Passkey';
      default:
        return type;
    }
  };
  
  const getSecurityLabel = (type: string) => {
    if (type === 'sms' || type === 'email') {
      return <span className="text-orange-600 dark:text-orange-400 text-xs font-medium">(Less Secure)</span>;
    }
    return <span className="text-green-600 dark:text-green-400 text-xs font-medium">(Recommended)</span>;
  };
  
  if (!user) {
    return <div className="text-center py-12 text-gray-600 dark:text-gray-400">Please sign in to manage MFA settings</div>;
  }
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-blue-600"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-4">Loading MFA settings...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Two-Step Verification</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Add an extra layer of security to your account by requiring a second verification step
        </p>
      </div>
      
      {orgSettings?.mfaEnabled === false && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Multi-factor authentication is currently disabled by your organization administrator.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Current Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Active Verification Methods
          </CardTitle>
          <CardDescription>
            These methods can be used to verify your identity during sign-in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {methods.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="mb-2">No verification methods configured</p>
              <p className="text-sm">Add a method below to secure your account</p>
            </div>
          ) : (
            <div className="space-y-3">
              {methods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                  data-testid={`mfa-method-${method.id}`}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                      {getMethodIcon(method.methodType)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {getMethodLabel(method.methodType)}
                        </span>
                        {getSecurityLabel(method.methodType)}
                        {method.isPrimary && (
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                        {method.isVerified && (
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      {method.methodValue && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{method.methodValue}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!method.isPrimary && method.isVerified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrimaryMutation.mutate(method.id)}
                        data-testid={`button-set-primary-${method.id}`}
                      >
                        Set as Primary
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMethodMutation.mutate(method.id)}
                      disabled={methods.length === 1 && method.isVerified}
                      data-testid={`button-remove-${method.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add New Method */}
      <Card>
        <CardHeader>
          <CardTitle>Add Verification Method</CardTitle>
          <CardDescription>
            Recommended: Use authenticator apps or passkeys for the highest security
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!addingMethod && !pendingMethodId ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col space-y-2"
                onClick={() => {
                  setSelectedMethodType('sms');
                  setAddingMethod(true);
                  setError('');
                }}
                data-testid="button-add-sms"
              >
                <Smartphone className="h-6 w-6" />
                <span>Text Message</span>
                <span className="text-xs text-orange-600 dark:text-orange-400">(Less Secure)</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 flex-col space-y-2"
                onClick={() => {
                  setSelectedMethodType('email');
                  setAddingMethod(true);
                  setError('');
                }}
                data-testid="button-add-email"
              >
                <Mail className="h-6 w-6" />
                <span>Email</span>
                <span className="text-xs text-orange-600 dark:text-orange-400">(Less Secure)</span>
              </Button>
            </div>
          ) : pendingMethodId ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter the verification code sent to your {selectedMethodType === 'sms' ? 'phone' : 'email'}
              </p>
              <div>
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  data-testid="input-verification-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleVerifyMethod}
                  disabled={verifyMethodMutation.isPending || verificationCode.length !== 6}
                  data-testid="button-verify-method"
                >
                  {verifyMethodMutation.isPending ? 'Verifying...' : 'Verify'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="method-value">
                  {selectedMethodType === 'sms' ? 'Phone Number' : 'Email Address'}
                </Label>
                <Input
                  id="method-value"
                  data-testid="input-method-value"
                  type={selectedMethodType === 'sms' ? 'tel' : 'email'}
                  placeholder={selectedMethodType === 'sms' ? '+1 (555) 123-4567' : 'your@email.com'}
                  value={methodValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMethodValue(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleAddMethod}
                  disabled={addMethodMutation.isPending}
                  data-testid="button-submit-method"
                >
                  {addMethodMutation.isPending ? 'Adding...' : 'Add Method'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Information */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Tip:</strong> For maximum security, we recommend using authenticator apps or passkeys.
          SMS and email codes can be intercepted and are less secure.
        </AlertDescription>
      </Alert>
    </div>
  );
}
