import { useState } from 'react';
import { DollarSign, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface StateTaxFormComponentProps {
  newHireId: string;
  state: string;
  onComplete?: () => void;
}

// Massachusetts M-4 Form (Employee's Withholding Exemption Certificate)
const MASSACHUSETTS_FILING_STATUSES = [
  { value: 'SINGLE', label: 'A - Single, or married with 2 incomes (Highest rate)' },
  { value: 'MARRIED', label: 'B - Married with 1 income' },
  { value: 'HEAD_OF_HOUSEHOLD', label: 'C - Head of household' }
];

export default function StateTaxFormComponent({ newHireId, state, onComplete }: StateTaxFormComponentProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Massachusetts M-4 specific fields
  const [formData, setFormData] = useState({
    filingStatus: '',
    totalAllowances: 0,
    additionalWithholding: '',
    exemptStatus: false,
    dependentAllowances: 0,
    blindAllowances: 0,
    age65Allowances: 0,
    headOfHouseholdAllowance: false
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotalAllowances = () => {
    if (formData.exemptStatus) return 0;
    
    return Number(formData.dependentAllowances) +
           Number(formData.blindAllowances) +
           Number(formData.age65Allowances) +
           (formData.headOfHouseholdAllowance ? 1 : 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalAllowances = calculateTotalAllowances();
      
      // Check if form already exists
      const existingForms = await fetch(`/api/onboarding/state-tax-forms/new-hire/${newHireId}`).then(r => r.json());
      const existingMAForm = existingForms.find((f: any) => f.state === 'MA');

      const formPayload = {
        newHireId,
        state: 'MA',
        formType: 'M-4',
        formVersion: '2024',
        filingStatus: formData.filingStatus,
        totalAllowances,
        additionalWithholding: formData.additionalWithholding || '0.00',
        exemptStatus: formData.exemptStatus,
        stateSpecificData: {
          dependentAllowances: formData.dependentAllowances,
          blindAllowances: formData.blindAllowances,
          age65Allowances: formData.age65Allowances,
          headOfHouseholdAllowance: formData.headOfHouseholdAllowance
        },
        status: 'Completed',
        signatureDate: new Date().toISOString().split('T')[0]
      };

      if (existingMAForm) {
        await apiRequest('PATCH', `/api/onboarding/state-tax-forms/${existingMAForm.id}`, formPayload);
      } else {
        await apiRequest('POST', '/api/onboarding/state-tax-forms', formPayload);
      }

      toast({
        title: 'Form Submitted',
        description: 'Massachusetts M-4 form saved successfully.',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/state-tax-forms'] });
      onComplete?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save M-4 form',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Massachusetts M-4 Form
  if (state === 'MA') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">Massachusetts Form M-4</h2>
              <p className="text-purple-100 text-sm">Employee's Withholding Exemption Certificate</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div className="text-sm text-purple-900 dark:text-purple-100">
                <p className="font-semibold mb-1">Massachusetts State Tax Withholding</p>
                <p>This form determines the amount of Massachusetts state income tax withheld from your paychecks. Complete all applicable sections.</p>
              </div>
            </div>
          </div>

          {/* Filing Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
              1. Filing Status <span className="text-red-500">*</span>
            </h3>
            
            <div className="space-y-3">
              {MASSACHUSETTS_FILING_STATUSES.map(status => (
                <label key={status.value} className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="filingStatus"
                    value={status.value}
                    checked={formData.filingStatus === status.value}
                    onChange={(e) => handleChange('filingStatus', e.target.value)}
                    className="mt-1"
                    required
                    data-testid={`radio-m4-status-${status.value}`}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Exemption Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
              2. Exemption Status
            </h3>
            
            <label className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.exemptStatus}
                onChange={(e) => handleChange('exemptStatus', e.target.checked)}
                className="mt-1"
                data-testid="checkbox-m4-exempt"
              />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium">I claim exemption from Massachusetts withholding</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Check this box only if you expect to owe no Massachusetts income tax and had no tax liability last year.
                </p>
              </div>
            </label>
          </div>

          {/* Allowances (only if not exempt) */}
          {!formData.exemptStatus && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                3. Withholding Allowances
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Number of Dependents
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.dependentAllowances}
                    onChange={(e) => handleChange('dependentAllowances', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="input-m4-dependents"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter number of dependents you will claim
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Blind Allowances
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    value={formData.blindAllowances}
                    onChange={(e) => handleChange('blindAllowances', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="input-m4-blind"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    1 if you are blind, 2 if you and spouse are blind
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Age 65+ Allowances
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    value={formData.age65Allowances}
                    onChange={(e) => handleChange('age65Allowances', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="input-m4-age65"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    1 if you are 65+, 2 if you and spouse are 65+
                  </p>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.headOfHouseholdAllowance}
                      onChange={(e) => handleChange('headOfHouseholdAllowance', e.target.checked)}
                      className="rounded"
                      data-testid="checkbox-m4-hoh"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Head of Household (1 allowance)
                    </span>
                  </label>
                </div>
              </div>

              {/* Total Allowances Display */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">Total Withholding Allowances:</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calculateTotalAllowances()}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  More allowances = less tax withheld from each paycheck
                </p>
              </div>
            </div>
          )}

          {/* Additional Withholding */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
              4. Additional Withholding (Optional)
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Amount to Withhold Per Pay Period
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <input
                  type="text"
                  pattern="[0-9]*\.?[0-9]{0,2}"
                  value={formData.additionalWithholding}
                  onChange={(e) => handleChange('additionalWithholding', e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                  data-testid="input-m4-additional"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter extra amount if you want additional tax withheld each pay period
              </p>
            </div>
          </div>

          {/* Digital Signature Agreement */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              <strong>Employee Certification:</strong> I certify under penalties of perjury that I am entitled to the number of withholding allowances claimed on this certificate.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              data-testid="button-submit-m4"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Submit M-4 Form</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Default fallback for other states
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="text-center py-8">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          State Tax Form Not Yet Configured
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          State-specific tax withholding form for {state} will be available soon.
        </p>
      </div>
    </div>
  );
}
