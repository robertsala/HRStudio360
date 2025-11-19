import { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../../hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../../lib/queryClient';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Button } from '../../components/ui/button';
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

  // Determine document choice based on existing data
  const getDocumentChoice = () => {
    if (existingForm?.listADocumentTitle) return 'LIST_A';
    if (existingForm?.listBDocumentTitle || existingForm?.listCDocumentTitle) return 'LIST_B_AND_C';
    return 'LIST_A';
  };

  const form = useForm<Section2FormData>({
    resolver: zodResolver(section2Schema),
    defaultValues: {
      documentChoice: 'LIST_A' as const,
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
    },
  });

  useEffect(() => {
    if (existingForm?.id) {
      setI9FormId(existingForm.id);
      // Reset form with loaded data
      form.reset({
        documentChoice: getDocumentChoice() as any,
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
  }, [existingForm, form]);

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

  const onSubmit = (data: Section2FormData) => {
    submitMutation.mutate(data);
  };

  const documentChoice = form.watch('documentChoice');

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              <FormField
                control={form.control}
                name="documentChoice"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-3">
                        <div className="flex items-start space-x-3 p-3 border-2 border-gray-300 dark:border-gray-600 rounded-md">
                          <RadioGroupItem value="LIST_A" id="list-a" data-testid="radio-i9-doc-list-a" />
                          <label htmlFor="list-a" className="text-sm cursor-pointer flex-1">
                            <strong>List A:</strong> ONE document proving BOTH identity AND employment authorization
                            <p className="text-xs text-gray-500 mt-1">Examples: U.S. Passport, Permanent Resident Card, Employment Authorization Document</p>
                          </label>
                        </div>
                        <div className="flex items-start space-x-3 p-3 border-2 border-gray-300 dark:border-gray-600 rounded-md">
                          <RadioGroupItem value="LIST_B_AND_C" id="list-bc" data-testid="radio-i9-doc-list-bc" />
                          <label htmlFor="list-bc" className="text-sm cursor-pointer flex-1">
                            <strong>List B + List C:</strong> ONE from List B (identity) AND ONE from List C (employment authorization)
                            <p className="text-xs text-gray-500 mt-1">Examples: Driver's License + Social Security Card</p>
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* List A Document Fields */}
            {documentChoice === 'LIST_A' && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-gray-900 dark:text-white">List A Document Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="listADocumentTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Title <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., U.S. Passport" data-testid="input-i9-list-a-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="listAIssuingAuthority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuing Authority</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., U.S. State Dept" data-testid="input-i9-list-a-authority" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="listADocumentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Number</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-i9-list-a-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="listAExpirationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date (if any)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-i9-list-a-expiration" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* List B & C Document Fields */}
            {documentChoice === 'LIST_B_AND_C' && (
              <div className="space-y-6">
                {/* List B */}
                <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-gray-900 dark:text-white">List B - Identity Document</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="listBDocumentTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Title <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Driver's License" data-testid="input-i9-list-b-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="listBIssuingAuthority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issuing Authority</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., State DMV" data-testid="input-i9-list-b-authority" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="listBDocumentNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Number</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-i9-list-b-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="listBExpirationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiration Date (if any)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-i9-list-b-expiration" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* List C */}
                <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-semibold text-gray-900 dark:text-white">List C - Employment Authorization Document</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="listCDocumentTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Title <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Social Security Card" data-testid="input-i9-list-c-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="listCIssuingAuthority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issuing Authority</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Social Security Admin" data-testid="input-i9-list-c-authority" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="listCDocumentNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Number</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-i9-list-c-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="listCExpirationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiration Date (if any)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-i9-list-c-expiration" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Employment Start Date */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">Employment Information</h3>
              <FormField
                control={form.control}
                name="firstDayOfEmployment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee's First Day of Employment <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-i9-first-day" />
                    </FormControl>
                    <FormDescription>
                      The actual date employment began (not later than 3 days from now)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Employer/HR Representative Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">Employer/HR Representative Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employerLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-i9-employer-lastname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employerFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-i9-employer-firstname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employerTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., HR Manager" data-testid="input-i9-employer-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employerBusinessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-i9-employer-business" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="employerAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-i9-employer-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="employerCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-i9-employer-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employerState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., MA" maxLength={2} data-testid="input-i9-employer-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employerZipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12345" data-testid="input-i9-employer-zipcode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="additionalInformation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="input-i9-additional-info" />
                    </FormControl>
                    <FormDescription>
                      Any additional notes or information relevant to this verification
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Certification */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-900 dark:text-red-100">
                <strong>Certification:</strong> I attest, under penalty of perjury, that (1) I have examined the document(s) presented by the above-named employee, (2) the above-listed document(s) appear to be genuine and to relate to the employee named, and (3) to the best of my knowledge the employee is authorized to work in the United States.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
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
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
