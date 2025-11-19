import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../../lib/queryClient';
import { z } from 'zod';
import type { StateTaxForm } from '@shared/schema';

interface StateTaxFormComponentProps {
  newHireId: string;
  state: string;
  onComplete?: () => void;
}

// Massachusetts M-4 Validation Schema (kept for helper validation)
const m4FormSchema = z.object({
  filingStatus: z.enum(['SINGLE', 'MARRIED', 'HEAD_OF_HOUSEHOLD']),
  exemptStatus: z.boolean(),
  dependentAllowances: z.coerce.number().min(0),
  blindAllowances: z.coerce.number().min(0).max(2),
  age65Allowances: z.coerce.number().min(0).max(2),
  headOfHouseholdAllowance: z.boolean(),
  additionalWithholding: z.string().regex(/^[0-9]*\.?[0-9]{0,2}$/, 'Invalid amount').optional(),
});

type M4FormData = z.infer<typeof m4FormSchema>;

const MASSACHUSETTS_FILING_STATUSES = [
  { value: 'SINGLE', label: 'A - Single, or married with 2 incomes (Highest rate)' },
  { value: 'MARRIED', label: 'B - Married with 1 income' },
  { value: 'HEAD_OF_HOUSEHOLD', label: 'C - Head of household' }
] as const;

export default function StateTaxFormComponent({ newHireId, state, onComplete }: StateTaxFormComponentProps) {
  const { toast } = useToast();
  const [existingFormId, setExistingFormId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<M4FormData>({
    filingStatus: 'SINGLE',
    exemptStatus: false,
    dependentAllowances: 0,
    blindAllowances: 0,
    age65Allowances: 0,
    headOfHouseholdAllowance: false,
    additionalWithholding: '0.00',
  });

  // Fetch existing state tax forms
  const { data: existingForms = [] } = useQuery<StateTaxForm[]>({
    queryKey: ['/api/onboarding/state-tax-forms', newHireId],
    queryFn: async () => {
      const response = await fetch(`/api/onboarding/state-tax-forms/new-hire/${newHireId}`);
      if (!response.ok) throw new Error('Failed to fetch state tax forms');
      return response.json();
    },
  });

  const existingMAForm = existingForms.find(f => f.state === 'MA');

  // Load existing form data
  useEffect(() => {
    if (existingMAForm?.id) {
      setExistingFormId(existingMAForm.id);
      setFormData({
        filingStatus: (existingMAForm.filingStatus as any) || 'SINGLE',
        exemptStatus: existingMAForm.exemptStatus || false,
        dependentAllowances: existingMAForm.stateSpecificData?.dependentAllowances || 0,
        blindAllowances: existingMAForm.stateSpecificData?.blindAllowances || 0,
        age65Allowances: existingMAForm.stateSpecificData?.age65Allowances || 0,
        headOfHouseholdAllowance: existingMAForm.stateSpecificData?.headOfHouseholdAllowance || false,
        additionalWithholding: existingMAForm.additionalWithholding || '0.00',
      });
    }
  }, [existingMAForm]);

  const calculateTotalAllowances = () => {
    if (formData.exemptStatus) return 0;
    return formData.dependentAllowances + formData.blindAllowances + formData.age65Allowances + (formData.headOfHouseholdAllowance ? 1 : 0);
  };

  const submitMutation = useMutation({
    mutationFn: async (data: M4FormData) => {
      const totalAllowances = calculateTotalAllowances();
      
      const formPayload = {
        newHireId,
        state: 'MA',
        formType: 'M-4',
        formVersion: '2024',
        filingStatus: data.filingStatus,
        totalAllowances,
        additionalWithholding: data.additionalWithholding || '0.00',
        exemptStatus: data.exemptStatus,
        stateSpecificData: {
          dependentAllowances: data.dependentAllowances,
          blindAllowances: data.blindAllowances,
          age65Allowances: data.age65Allowances,
          headOfHouseholdAllowance: data.headOfHouseholdAllowance
        },
        status: 'Completed',
        signatureDate: new Date().toISOString().split('T')[0]
      };

      if (existingFormId) {
        return apiRequest('PATCH', `/api/onboarding/state-tax-forms/${existingFormId}`, formPayload);
      } else {
        return apiRequest('POST', '/api/onboarding/state-tax-forms', formPayload);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Form Submitted',
        description: 'Massachusetts M-4 form saved successfully.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/state-tax-forms', newHireId] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/checklists/new-hire', newHireId] });
      onComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save M-4 form',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate using Zod schema
    const result = m4FormSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          newErrors[error.path[0].toString()] = error.message;
        }
      });
      setErrors(newErrors);
      toast({
        title: 'Validation Error',
        description: 'Please check the form for errors',
        variant: 'destructive',
      });
      return;
    }

    // Normalize additionalWithholding to always be a valid string
    const normalizedData = {
      ...formData,
      additionalWithholding: formData.additionalWithholding || '0.00'
    };
    submitMutation.mutate(normalizedData);
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
              <h2 className="text-2xl font-bold" data-testid="text-m4-title">Massachusetts Form M-4</h2>
              <p className="text-purple-100 text-sm">Employee's Withholding Exemption Certificate</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div className="text-sm text-purple-900 dark:text-purple-100">
                <p className="font-semibold mb-1">Massachusetts State Tax Withholding</p>
                <p>This form determines the amount of Massachusetts state income tax withheld from your paychecks. Complete all applicable sections.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Filing Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                1. Filing Status <span className="text-red-500">*</span>
              </h3>
              
              <div className="space-y-3">
                {MASSACHUSETTS_FILING_STATUSES.map(status => (
                  <div key={status.value} className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md">
                    <input
                      type="radio"
                      id={status.value}
                      name="filingStatus"
                      value={status.value}
                      checked={formData.filingStatus === status.value}
                      onChange={(e) => setFormData({ ...formData, filingStatus: e.target.value as any })}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      data-testid={`radio-m4-status-${status.value}`}
                    />
                    <label htmlFor={status.value} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                      {status.label}
                    </label>
                  </div>
                ))}
              </div>
              {errors.filingStatus && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.filingStatus}</p>
              )}
            </div>

            {/* Exemption Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                2. Exemption Status
              </h3>
              
              <div className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md">
                <input
                  type="checkbox"
                  id="exemptStatus"
                  checked={formData.exemptStatus}
                  onChange={(e) => setFormData({ ...formData, exemptStatus: e.target.checked })}
                  className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  data-testid="checkbox-m4-exempt"
                />
                <div className="flex-1">
                  <label htmlFor="exemptStatus" className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    I claim exemption from Massachusetts withholding
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Check this box only if you expect to owe no Massachusetts income tax and had no tax liability last year.
                  </p>
                </div>
              </div>
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
                      onChange={(e) => setFormData({ ...formData, dependentAllowances: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="input-m4-dependents"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter number of dependents you will claim
                    </p>
                    {errors.dependentAllowances && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.dependentAllowances}</p>
                    )}
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
                      onChange={(e) => setFormData({ ...formData, blindAllowances: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="input-m4-blind"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      1 if you are blind, 2 if you and spouse are blind
                    </p>
                    {errors.blindAllowances && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.blindAllowances}</p>
                    )}
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
                      onChange={(e) => setFormData({ ...formData, age65Allowances: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="input-m4-age65"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      1 if you are 65+, 2 if you and spouse are 65+
                    </p>
                    {errors.age65Allowances && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.age65Allowances}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 pt-8">
                    <input
                      type="checkbox"
                      id="headOfHouseholdAllowance"
                      checked={formData.headOfHouseholdAllowance}
                      onChange={(e) => setFormData({ ...formData, headOfHouseholdAllowance: e.target.checked })}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      data-testid="checkbox-m4-hoh"
                    />
                    <label htmlFor="headOfHouseholdAllowance" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Head of Household (1 allowance)
                    </label>
                  </div>
                </div>

                {/* Total Allowances Display */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Total Withholding Allowances:</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-m4-total-allowances">
                      {calculateTotalAllowances()}
                    </span>
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
                    value={formData.additionalWithholding}
                    onChange={(e) => setFormData({ ...formData, additionalWithholding: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-7 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-m4-additional"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter extra amount if you want additional tax withheld each pay period
                </p>
                {errors.additionalWithholding && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.additionalWithholding}</p>
                )}
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
                disabled={submitMutation.isPending}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                data-testid="button-submit-m4"
              >
                {submitMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit M-4 Form
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
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
