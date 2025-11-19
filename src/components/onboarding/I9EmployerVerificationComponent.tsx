import { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '../../hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../../lib/queryClient';
import type { I9Form } from '@shared/schema';

interface I9EmployerVerificationComponentProps {
  newHireId: string;
  newHireName: string;
  onComplete?: () => void;
}

// Section 2 Validation Schema with federal I-9 compliant document requirements
const section2Schema = z.object({
  documentChoice: z.enum(['LIST_A', 'LIST_B_AND_C']),
  // List A fields
  listADocumentTitle: z.string().optional(),
  listAIssuingAuthority: z.string().optional(),
  listADocumentNumber: z.string().optional(),
  listAExpirationDate: z.string().optional(),
  // List B fields
  listBDocumentTitle: z.string().optional(),
  listBIssuingAuthority: z.string().optional(),
  listBDocumentNumber: z.string().optional(),
  listBExpirationDate: z.string().optional(),
  // List C fields
  listCDocumentTitle: z.string().optional(),
  listCIssuingAuthority: z.string().optional(),
  listCDocumentNumber: z.string().optional(),
  listCExpirationDate: z.string().optional(),
  // Employer information
  firstDayOfEmployment: z.string().min(1, 'First day of employment is required'),
  employerLastName: z.string().min(1, 'Last name is required'),
  employerFirstName: z.string().min(1, 'First name is required'),
  employerTitle: z.string().min(1, 'Title is required'),
  employerBusinessName: z.string().min(1, 'Business name is required'),
  employerAddress: z.string().min(1, 'Address is required'),
  employerCity: z.string().min(1, 'City is required'),
  employerState: z.string().min(2, 'State is required'),
  employerZipCode: z.string().regex(/^[0-9]{5}(-[0-9]{4})?$/, 'Invalid ZIP code'),
  additionalInformation: z.string().optional(),
})
  .refine(
    (data) => {
      if (data.documentChoice === 'LIST_A') {
        return !!data.listADocumentTitle && data.listADocumentTitle.trim().length > 0;
      }
      return true;
    },
    { message: 'List A document title is required', path: ['listADocumentTitle'] }
  )
  .refine(
    (data) => {
      if (data.documentChoice === 'LIST_A') {
        return !!data.listAIssuingAuthority && data.listAIssuingAuthority.trim().length > 0;
      }
      return true;
    },
    { message: 'List A issuing authority is required', path: ['listAIssuingAuthority'] }
  )
  .refine(
    (data) => {
      if (data.documentChoice === 'LIST_A') {
        return !!data.listADocumentNumber && data.listADocumentNumber.trim().length > 0;
      }
      return true;
    },
    { message: 'List A document number is required', path: ['listADocumentNumber'] }
  )
  .refine(
    (data) => {
      if (data.documentChoice === 'LIST_B_AND_C') {
        return !!data.listBDocumentTitle && data.listBDocumentTitle.trim().length > 0;
      }
      return true;
    },
    { message: 'List B document title is required', path: ['listBDocumentTitle'] }
  )
  .refine(
    (data) => {
      if (data.documentChoice === 'LIST_B_AND_C') {
        return !!data.listBIssuingAuthority && data.listBIssuingAuthority.trim().length > 0;
      }
      return true;
    },
    { message: 'List B issuing authority is required', path: ['listBIssuingAuthority'] }
  )
  .refine(
    (data) => {
      if (data.documentChoice === 'LIST_B_AND_C') {
        return !!data.listBDocumentNumber && data.listBDocumentNumber.trim().length > 0;
      }
      return true;
    },
    { message: 'List B document number is required', path: ['listBDocumentNumber'] }
  )
  .refine(
    (data) => {
      if (data.documentChoice === 'LIST_B_AND_C') {
        return !!data.listCDocumentTitle && data.listCDocumentTitle.trim().length > 0;
      }
      return true;
    },
    { message: 'List C document title is required', path: ['listCDocumentTitle'] }
  )
  .refine(
    (data) => {
      if (data.documentChoice === 'LIST_B_AND_C') {
        return !!data.listCIssuingAuthority && data.listCIssuingAuthority.trim().length > 0;
      }
      return true;
    },
    { message: 'List C issuing authority is required', path: ['listCIssuingAuthority'] }
  )
  .refine(
    (data) => {
      if (data.documentChoice === 'LIST_B_AND_C') {
        return !!data.listCDocumentNumber && data.listCDocumentNumber.trim().length > 0;
      }
      return true;
    },
    { message: 'List C document number is required', path: ['listCDocumentNumber'] }
  );

type Section2FormData = z.infer<typeof section2Schema>;

export default function I9EmployerVerificationComponent({ newHireId, newHireName, onComplete }: I9EmployerVerificationComponentProps) {
  const { toast } = useToast();
  const [i9FormId, setI9FormId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<Section2FormData>({
    documentChoice: 'LIST_A',
    listADocumentTitle: '',
    listAIssuingAuthority: '',
    listADocumentNumber: '',
    listAExpirationDate: '',
    listBDocumentTitle: '',
    listBIssuingAuthority: '',
    listBDocumentNumber: '',
    listBExpirationDate: '',
    listCDocumentTitle: '',
    listCIssuingAuthority: '',
    listCDocumentNumber: '',
    listCExpirationDate: '',
    firstDayOfEmployment: '',
    employerLastName: '',
    employerFirstName: '',
    employerTitle: '',
    employerBusinessName: 'HR Studio 360',
    employerAddress: '',
    employerCity: '',
    employerState: '',
    employerZipCode: '',
    additionalInformation: '',
  });

  // Fetch existing I-9 form (404 is expected if Section 1 isn't complete yet)
  const { data: existingForm } = useQuery<I9Form | null>({
    queryKey: ['/api/onboarding/i9-forms', newHireId],
    queryFn: async () => {
      const response = await fetch(`/api/onboarding/i9-forms/new-hire/${newHireId}`);
      if (!response.ok) {
        if (response.status === 404) return null; // Expected when Section 1 not started
        throw new Error('Failed to fetch I-9 form');
      }
      return response.json();
    },
  });

  // Load existing form data
  useEffect(() => {
    if (existingForm?.id) {
      setI9FormId(existingForm.id);
      
      // Determine document choice based on existing data
      const docChoice = existingForm.listADocumentTitle ? 'LIST_A' : 'LIST_B_AND_C';
      
      setFormData({
        documentChoice: docChoice,
        listADocumentTitle: existingForm.listADocumentTitle || '',
        listAIssuingAuthority: existingForm.listAIssuingAuthority || '',
        listADocumentNumber: existingForm.listADocumentNumber || '',
        listAExpirationDate: existingForm.listAExpirationDate || '',
        listBDocumentTitle: existingForm.listBDocumentTitle || '',
        listBIssuingAuthority: existingForm.listBIssuingAuthority || '',
        listBDocumentNumber: existingForm.listBDocumentNumber || '',
        listBExpirationDate: existingForm.listBExpirationDate || '',
        listCDocumentTitle: existingForm.listCDocumentTitle || '',
        listCIssuingAuthority: existingForm.listCIssuingAuthority || '',
        listCDocumentNumber: existingForm.listCDocumentNumber || '',
        listCExpirationDate: existingForm.listCExpirationDate || '',
        firstDayOfEmployment: existingForm.firstDayOfEmployment || '',
        employerLastName: existingForm.employerLastName || '',
        employerFirstName: existingForm.employerFirstName || '',
        employerTitle: existingForm.employerTitle || '',
        employerBusinessName: existingForm.employerBusinessName || 'HR Studio 360',
        employerAddress: existingForm.employerAddress || '',
        employerCity: existingForm.employerCity || '',
        employerState: existingForm.employerState || '',
        employerZipCode: existingForm.employerZipCode || '',
        additionalInformation: existingForm.additionalInformation || '',
      });
    }
  }, [existingForm]);

  const submitMutation = useMutation({
    mutationFn: async (data: Section2FormData) => {
      if (!i9FormId) {
        throw new Error('I-9 form not found. Employee must complete Section 1 first.');
      }

      // Update Section 2
      return apiRequest('POST', `/api/onboarding/i9-forms/${i9FormId}/section2`, {
        ...data,
        employerSignatureDate: new Date().toISOString().split('T')[0],
        section2Status: 'Completed'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Section 2 Completed',
        description: 'Employer verification completed successfully.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/i9-forms', newHireId] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/checklists/new-hire', newHireId] });
      onComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save Section 2',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate using Zod schema
    const result = section2Schema.safeParse(formData);
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

    submitMutation.mutate(formData);
  };

  // Check if Section 1 is complete
  if (!existingForm || existingForm.section1Status !== 'Completed') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Section 1 Not Completed
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            The employee must complete Section 1 before you can proceed with employer verification.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8" />
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-i9-section2-title">Section 2: Employer Verification</h2>
            <p className="text-indigo-100 text-sm">Review employee documents and complete employer attestation</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
            <div className="text-sm text-purple-900 dark:text-purple-100">
              <p className="font-semibold mb-1">Instructions for Employer/HR Representative</p>
              <p className="mb-2">Examine ONE document from List A OR examine ONE from List B and ONE from List C. Record document information below and ensure documents appear genuine.</p>
              <p className="text-xs">⚠️ Must be completed within 3 business days of employee's first day of employment.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Information Display */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Employee Information (from Section 1)</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">{newHireName}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Citizenship Status:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {existingForm.citizenshipStatus?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Document Choice */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
              Document Verification <span className="text-red-500">*</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 border-2 border-gray-300 dark:border-gray-600 rounded-md">
                <input
                  type="radio"
                  id="list-a"
                  name="documentChoice"
                  value="LIST_A"
                  checked={formData.documentChoice === 'LIST_A'}
                  onChange={(e) => {
                    // Clear List B & C fields when switching to List A
                    setFormData({
                      ...formData,
                      documentChoice: 'LIST_A',
                      listBDocumentTitle: '',
                      listBIssuingAuthority: '',
                      listBDocumentNumber: '',
                      listBExpirationDate: '',
                      listCDocumentTitle: '',
                      listCIssuingAuthority: '',
                      listCDocumentNumber: '',
                      listCExpirationDate: '',
                    });
                  }}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  data-testid="radio-i9-doc-list-a"
                />
                <label htmlFor="list-a" className="text-sm cursor-pointer flex-1">
                  <strong>List A:</strong> ONE document proving BOTH identity AND employment authorization
                  <p className="text-xs text-gray-500 mt-1">Examples: U.S. Passport, Permanent Resident Card, Employment Authorization Document</p>
                </label>
              </div>
              <div className="flex items-start space-x-3 p-3 border-2 border-gray-300 dark:border-gray-600 rounded-md">
                <input
                  type="radio"
                  id="list-bc"
                  name="documentChoice"
                  value="LIST_B_AND_C"
                  checked={formData.documentChoice === 'LIST_B_AND_C'}
                  onChange={(e) => {
                    // Clear List A fields when switching to List B & C
                    setFormData({
                      ...formData,
                      documentChoice: 'LIST_B_AND_C',
                      listADocumentTitle: '',
                      listAIssuingAuthority: '',
                      listADocumentNumber: '',
                      listAExpirationDate: '',
                    });
                  }}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  data-testid="radio-i9-doc-list-bc"
                />
                <label htmlFor="list-bc" className="text-sm cursor-pointer flex-1">
                  <strong>List B + List C:</strong> ONE from List B (identity) AND ONE from List C (employment authorization)
                  <p className="text-xs text-gray-500 mt-1">Examples: Driver's License + Social Security Card</p>
                </label>
              </div>
            </div>
          </div>

          {/* List A Document Fields */}
          {formData.documentChoice === 'LIST_A' && (
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-gray-900 dark:text-white">List A Document Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Document Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.listADocumentTitle}
                    onChange={(e) => setFormData({ ...formData, listADocumentTitle: e.target.value })}
                    placeholder="e.g., U.S. Passport"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-i9-list-a-title"
                  />
                  {errors.listADocumentTitle && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.listADocumentTitle}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Issuing Authority <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.listAIssuingAuthority}
                    onChange={(e) => setFormData({ ...formData, listAIssuingAuthority: e.target.value })}
                    placeholder="e.g., U.S. State Dept"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-i9-list-a-authority"
                  />
                  {errors.listAIssuingAuthority && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.listAIssuingAuthority}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Document Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.listADocumentNumber}
                    onChange={(e) => setFormData({ ...formData, listADocumentNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-i9-list-a-number"
                  />
                  {errors.listADocumentNumber && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.listADocumentNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expiration Date (if any)
                  </label>
                  <input
                    type="date"
                    value={formData.listAExpirationDate}
                    onChange={(e) => setFormData({ ...formData, listAExpirationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-i9-list-a-expiration"
                  />
                </div>
              </div>
            </div>
          )}

          {/* List B & C Document Fields */}
          {formData.documentChoice === 'LIST_B_AND_C' && (
            <div className="space-y-6">
              {/* List B */}
              <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-gray-900 dark:text-white">List B - Identity Document</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Document Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.listBDocumentTitle}
                      onChange={(e) => setFormData({ ...formData, listBDocumentTitle: e.target.value })}
                      placeholder="e.g., Driver's License"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="input-i9-list-b-title"
                    />
                    {errors.listBDocumentTitle && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.listBDocumentTitle}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Issuing Authority <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.listBIssuingAuthority}
                      onChange={(e) => setFormData({ ...formData, listBIssuingAuthority: e.target.value })}
                      placeholder="e.g., State DMV"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="input-i9-list-b-authority"
                    />
                    {errors.listBIssuingAuthority && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.listBIssuingAuthority}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Document Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.listBDocumentNumber}
                      onChange={(e) => setFormData({ ...formData, listBDocumentNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="input-i9-list-b-number"
                    />
                    {errors.listBDocumentNumber && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.listBDocumentNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiration Date (if any)
                    </label>
                    <input
                      type="date"
                      value={formData.listBExpirationDate}
                      onChange={(e) => setFormData({ ...formData, listBExpirationDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="input-i9-list-b-expiration"
                    />
                  </div>
                </div>
              </div>

              {/* List C */}
              <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-semibold text-gray-900 dark:text-white">List C - Employment Authorization Document</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Document Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.listCDocumentTitle}
                      onChange={(e) => setFormData({ ...formData, listCDocumentTitle: e.target.value })}
                      placeholder="e.g., Social Security Card"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="input-i9-list-c-title"
                    />
                    {errors.listCDocumentTitle && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.listCDocumentTitle}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Issuing Authority <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.listCIssuingAuthority}
                      onChange={(e) => setFormData({ ...formData, listCIssuingAuthority: e.target.value })}
                      placeholder="e.g., Social Security Admin"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="input-i9-list-c-authority"
                    />
                    {errors.listCIssuingAuthority && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.listCIssuingAuthority}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Document Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.listCDocumentNumber}
                      onChange={(e) => setFormData({ ...formData, listCDocumentNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="input-i9-list-c-number"
                    />
                    {errors.listCDocumentNumber && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.listCDocumentNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiration Date (if any)
                    </label>
                    <input
                      type="date"
                      value={formData.listCExpirationDate}
                      onChange={(e) => setFormData({ ...formData, listCExpirationDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="input-i9-list-c-expiration"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employment Start Date */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">Employment Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employee's First Day of Employment <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.firstDayOfEmployment}
                onChange={(e) => setFormData({ ...formData, firstDayOfEmployment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="input-i9-first-day"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The actual date employment began (not later than 3 days from now)
              </p>
              {errors.firstDayOfEmployment && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.firstDayOfEmployment}</p>}
            </div>
          </div>

          {/* Employer/HR Representative Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">Employer/HR Representative Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.employerLastName}
                  onChange={(e) => setFormData({ ...formData, employerLastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="input-i9-employer-lastname"
                />
                {errors.employerLastName && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.employerLastName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.employerFirstName}
                  onChange={(e) => setFormData({ ...formData, employerFirstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="input-i9-employer-firstname"
                />
                {errors.employerFirstName && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.employerFirstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.employerTitle}
                  onChange={(e) => setFormData({ ...formData, employerTitle: e.target.value })}
                  placeholder="e.g., HR Manager"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="input-i9-employer-title"
                />
                {errors.employerTitle && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.employerTitle}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.employerBusinessName}
                  onChange={(e) => setFormData({ ...formData, employerBusinessName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="input-i9-employer-business"
                />
                {errors.employerBusinessName && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.employerBusinessName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Business Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.employerAddress}
                onChange={(e) => setFormData({ ...formData, employerAddress: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="input-i9-employer-address"
              />
              {errors.employerAddress && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.employerAddress}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.employerCity}
                  onChange={(e) => setFormData({ ...formData, employerCity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="input-i9-employer-city"
                />
                {errors.employerCity && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.employerCity}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.employerState}
                  onChange={(e) => setFormData({ ...formData, employerState: e.target.value })}
                  placeholder="e.g., MA"
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="input-i9-employer-state"
                />
                {errors.employerState && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.employerState}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.employerZipCode}
                  onChange={(e) => setFormData({ ...formData, employerZipCode: e.target.value })}
                  placeholder="12345"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="input-i9-employer-zipcode"
                />
                {errors.employerZipCode && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.employerZipCode}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Information (Optional)
              </label>
              <textarea
                value={formData.additionalInformation}
                onChange={(e) => setFormData({ ...formData, additionalInformation: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="input-i9-additional-info"
              ></textarea>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Any additional notes or information relevant to this verification
              </p>
            </div>
          </div>

          {/* Certification */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-900 dark:text-red-100">
              <strong>Certification:</strong> I attest, under penalty of perjury, that (1) I have examined the document(s) presented by the above-named employee, (2) the above-listed document(s) appear to be genuine and to relate to the employee named, and (3) to the best of my knowledge the employee is authorized to work in the United States.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              data-testid="button-submit-i9-section2"
            >
              {submitMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Section 2
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
