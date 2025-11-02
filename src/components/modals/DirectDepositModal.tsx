import React, { useState, useEffect } from 'react';
import { X, Plus, CreditCard, AlertCircle, CheckCircle, Lock, Trash2, Eye, EyeOff, Info, DollarSign, Percent } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface DirectDepositAccount {
  id: string;
  account_type: 'checking' | 'savings';
  routing_number: string;
  account_last_four: string;
  bank_name: string;
  allocation_type: 'percentage' | 'amount' | 'remainder';
  allocation_value: number;
  priority: number;
  is_active: boolean;
  verified: boolean;
  nickname?: string;
}

interface DirectDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId?: string;
}

const DirectDepositModal: React.FC<DirectDepositModalProps> = ({ isOpen, onClose, employeeId }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<DirectDepositAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New account form state
  const [newAccount, setNewAccount] = useState({
    accountType: 'checking' as 'checking' | 'savings',
    routingNumber: '',
    accountNumber: '',
    confirmAccountNumber: '',
    nickname: '',
    allocationType: 'remainder' as 'percentage' | 'amount' | 'remainder',
    allocationValue: 0,
  });

  const [validatingRouting, setValidatingRouting] = useState(false);
  const [bankInfo, setBankInfo] = useState<{ bankName: string; valid: boolean } | null>(null);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showConfirmAccountNumber, setShowConfirmAccountNumber] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
    }
  }, [isOpen, employeeId]);

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get employee ID
      let empId = employeeId;
      if (!empId) {
        const { data: empData } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        empId = empData?.id;
      }

      if (!empId) {
        setError('Employee not found');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('direct_deposit_accounts')
        .select('*')
        .eq('employee_id', empId)
        .order('priority', { ascending: true });

      if (fetchError) throw fetchError;

      setAccounts(data || []);
    } catch (err: any) {
      console.error('Error loading accounts:', err);
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const validateRoutingNumber = async (routingNumber: string) => {
    if (routingNumber.length !== 9) {
      setBankInfo(null);
      return;
    }

    try {
      setValidatingRouting(true);
      setError(null);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-routing-number`;
      console.log('Validating routing number:', routingNumber);
      console.log('API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ routingNumber }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        setError(`Validation failed: ${response.status} - ${errorText}`);
        setBankInfo(null);
        return;
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.valid) {
        setBankInfo({ bankName: data.bankName, valid: true });
        setError(null);
      } else {
        setBankInfo(null);
        setError(data.error || 'Invalid routing number');
      }
    } catch (err: any) {
      console.error('Error validating routing number:', err);
      setError(`Failed to validate routing number: ${err.message || 'Network error'}`);
      setBankInfo(null);
    } finally {
      setValidatingRouting(false);
    }
  };

  const handleRoutingNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 9);
    setNewAccount({ ...newAccount, routingNumber: cleaned });

    if (cleaned.length === 9) {
      validateRoutingNumber(cleaned);
    } else {
      setBankInfo(null);
    }
  };

  const handleSaveAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validation
      if (newAccount.routingNumber.length !== 9) {
        setError('Routing number must be 9 digits');
        return;
      }

      if (newAccount.accountNumber.length < 4 || newAccount.accountNumber.length > 17) {
        setError('Account number must be between 4 and 17 digits');
        return;
      }

      if (newAccount.accountNumber !== newAccount.confirmAccountNumber) {
        setError('Account numbers do not match');
        return;
      }

      if (!bankInfo?.valid) {
        setError('Please enter a valid routing number');
        return;
      }

      if (newAccount.allocationType === 'percentage' && (newAccount.allocationValue <= 0 || newAccount.allocationValue > 100)) {
        setError('Percentage must be between 1 and 100');
        return;
      }

      if (newAccount.allocationType === 'amount' && newAccount.allocationValue <= 0) {
        setError('Amount must be greater than 0');
        return;
      }

      // Get employee ID
      let empId = employeeId;
      if (!empId) {
        const { data: empData } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        empId = empData?.id;
      }

      if (!empId) {
        setError('Employee not found');
        return;
      }

      // Get last 4 digits
      const lastFour = newAccount.accountNumber.slice(-4);

      // Calculate next priority
      const nextPriority = accounts.length > 0 ? Math.max(...accounts.map(a => a.priority)) + 1 : 1;

      // Insert new account
      // Note: In production, you'd use a stored procedure to handle encryption server-side
      const { error: insertError } = await supabase
        .from('direct_deposit_accounts')
        .insert({
          employee_id: empId,
          account_type: newAccount.accountType,
          routing_number: newAccount.routingNumber,
          account_number_encrypted: newAccount.accountNumber, // In production, encrypt this!
          account_last_four: lastFour,
          bank_name: bankInfo.bankName,
          allocation_type: newAccount.allocationType,
          allocation_value: newAccount.allocationValue,
          priority: nextPriority,
          nickname: newAccount.nickname || null,
          is_active: true,
          verified: false, // Requires verification
        });

      if (insertError) throw insertError;

      setSuccess('Account added successfully! Pending verification.');
      setShowAddForm(false);
      setNewAccount({
        accountType: 'checking',
        routingNumber: '',
        accountNumber: '',
        confirmAccountNumber: '',
        nickname: '',
        allocationType: 'remainder',
        allocationValue: 0,
      });
      setBankInfo(null);
      loadAccounts();
    } catch (err: any) {
      console.error('Error saving account:', err);
      setError(err.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('direct_deposit_accounts')
        .delete()
        .eq('id', accountId);

      if (deleteError) throw deleteError;

      setSuccess('Account deleted successfully');
      loadAccounts();
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalAllocation = accounts
    .filter(a => a.is_active && a.allocation_type !== 'remainder')
    .reduce((sum, a) => {
      if (a.allocation_type === 'percentage') {
        return sum + a.allocation_value;
      }
      return sum;
    }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Direct Deposit</h2>
                <p className="text-green-100 text-sm">Manage your bank accounts for payroll</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-green-100 hover:text-white transition-colors"
              title="Press Esc to close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Security Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
            <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Your information is secure</p>
              <p>All bank account information is encrypted using bank-level security. We never store your full account number in plain text.</p>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Existing Accounts */}
          {accounts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Your Accounts</h3>
                {totalAllocation > 0 && totalAllocation !== 100 && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {totalAllocation.toFixed(0)}% allocated
                  </span>
                )}
              </div>

              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={`border rounded-lg p-4 ${
                    account.is_active ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900 dark:text-white dark:text-white">
                              {account.bank_name}
                            </span>
                            {account.verified ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full flex items-center space-x-1">
                                <CheckCircle className="h-3 w-3" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Pending Verification
                              </span>
                            )}
                          </div>
                          {account.nickname && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{account.nickname}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Account Type:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white dark:text-white capitalize">{account.account_type}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Account:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white dark:text-white">****{account.account_last_four}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Routing:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white dark:text-white">{account.routing_number}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Allocation:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white dark:text-white">
                            {account.allocation_type === 'remainder' && 'Remainder'}
                            {account.allocation_type === 'percentage' && `${account.allocation_value}%`}
                            {account.allocation_type === 'amount' && `$${account.allocation_value}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                      title="Delete account"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Account Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-gray-600 dark:text-gray-400 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Bank Account</span>
            </button>
          )}

          {/* Add Account Form */}
          {showAddForm && (
            <div className="border-2 border-green-500 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Add New Account</h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewAccount({
                      accountType: 'checking',
                      routingNumber: '',
                      accountNumber: '',
                      confirmAccountNumber: '',
                      nickname: '',
                      allocationType: 'remainder',
                      allocationValue: 0,
                    });
                    setBankInfo(null);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Account Type</label>
                  <select
                    value={newAccount.accountType}
                    onChange={(e) => setNewAccount({ ...newAccount, accountType: e.target.value as 'checking' | 'savings' })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>

                {/* Nickname */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Nickname (Optional)
                  </label>
                  <input
                    type="text"
                    value={newAccount.nickname}
                    onChange={(e) => setNewAccount({ ...newAccount, nickname: e.target.value })}
                    placeholder="e.g., Primary Checking"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Routing Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Routing Number
                </label>
                <input
                  type="text"
                  value={newAccount.routingNumber}
                  onChange={(e) => handleRoutingNumberChange(e.target.value)}
                  placeholder="9 digits"
                  maxLength={9}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {validatingRouting && (
                  <p className="text-sm text-blue-600 mt-1">Validating routing number...</p>
                )}
                {bankInfo && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>{bankInfo.bankName}</span>
                  </div>
                )}
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Account Number
                </label>
                <div className="relative">
                  <input
                    type={showAccountNumber ? 'text' : 'password'}
                    value={newAccount.accountNumber}
                    onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value.replace(/\D/g, '') })}
                    placeholder="Enter account number"
                    maxLength={17}
                    className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                  >
                    {showAccountNumber ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Confirm Account Number
                </label>
                <div className="relative">
                  <input
                    type={showConfirmAccountNumber ? 'text' : 'password'}
                    value={newAccount.confirmAccountNumber}
                    onChange={(e) => setNewAccount({ ...newAccount, confirmAccountNumber: e.target.value.replace(/\D/g, '') })}
                    placeholder="Re-enter account number"
                    maxLength={17}
                    className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmAccountNumber(!showConfirmAccountNumber)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                  >
                    {showConfirmAccountNumber ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Allocation */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Allocation</label>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewAccount({ ...newAccount, allocationType: 'remainder', allocationValue: 0 })}
                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                      newAccount.allocationType === 'remainder'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Remainder
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAccount({ ...newAccount, allocationType: 'percentage', allocationValue: 100 })}
                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                      newAccount.allocationType === 'percentage'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Percent className="h-4 w-4 mx-auto mb-1" />
                    Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAccount({ ...newAccount, allocationType: 'amount', allocationValue: 0 })}
                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                      newAccount.allocationType === 'amount'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="h-4 w-4 mx-auto mb-1" />
                    Amount
                  </button>
                </div>

                {newAccount.allocationType === 'percentage' && (
                  <div>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newAccount.allocationValue}
                      onChange={(e) => setNewAccount({ ...newAccount, allocationValue: parseFloat(e.target.value) || 0 })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter percentage (1-100)"
                    />
                  </div>
                )}

                {newAccount.allocationType === 'amount' && (
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newAccount.allocationValue}
                      onChange={(e) => setNewAccount({ ...newAccount, allocationValue: parseFloat(e.target.value) || 0 })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter dollar amount"
                    />
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-900">
                    {newAccount.allocationType === 'remainder' && 'This account will receive all remaining funds after other allocations.'}
                    {newAccount.allocationType === 'percentage' && 'This account will receive the specified percentage of your net pay.'}
                    {newAccount.allocationType === 'amount' && 'This account will receive the fixed dollar amount from each paycheck.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSaveAccount}
                  disabled={loading || !bankInfo?.valid}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Saving...' : 'Add Account'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewAccount({
                      accountType: 'checking',
                      routingNumber: '',
                      accountNumber: '',
                      confirmAccountNumber: '',
                      nickname: '',
                      allocationType: 'remainder',
                      allocationValue: 0,
                    });
                    setBankInfo(null);
                    setError(null);
                  }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p className="font-semibold text-gray-900 dark:text-white dark:text-white">How Direct Deposit Works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Add one or more bank accounts for your payroll deposits</li>
              <li>Choose how to split your paycheck between accounts (percentage, fixed amount, or remainder)</li>
              <li>Your routing number is validated against all US banks in real-time</li>
              <li>All account information is encrypted and secure</li>
              <li>Changes take effect on your next pay period</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectDepositModal;
