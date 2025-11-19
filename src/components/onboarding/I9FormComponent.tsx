import { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../../hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../../lib/queryClient';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Button } from '../../components/ui/button';
import type { InsertI9Form, I9Form } from '@shared/schema';

interface I9FormComponentProps {
  newHireId: string;
  onComplete?: () => void;
}

const US_STATES_AND_TERRITORIES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'GU', 'VI', 'AS', 'MP'
];

// Section 1 Validation Schema
const section1Schema = z.object({
  lastName: z.string().min(1, 'Last name is required'),
  firstName: z.string().min(1, 'First name is required'),
  middleInitial: z.string().max(1).optional(),
  otherLastNames: z.string().optional(),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().regex(/^[0-9]{5}(-[0-9]{4})?$/, 'Invalid ZIP code'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  socialSecurityNumber: z.string().regex(/^[0-9]{3}-[0-9]{2}-[0-9]{4}$/, 'SSN format: ###-##-####'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  citizenshipStatus: z.enum(['US_CITIZEN', 'NONCITIZEN_NATIONAL', 'PERMANENT_RESIDENT', 'AUTHORIZED_ALIEN']),
  uscisNumber: z.string().optional(),
  formI94Number: z.string().optional(),
  foreignPassportNumber: z.string().optional(),
  countryOfIssuance: z.string().optional(),
  authorizationExpirationDate: z.string().optional(),
});

type Section1FormData = z.infer<typeof section1Schema>;

export default function I9FormComponent({ newHireId, onComplete }: I9FormComponentProps) {
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState<1 | 2>(1);
  const [i9FormId, setI9FormId] = useState<string | null>(null);

  // Fetch existing I-9 form
  const { data: existingForm } = useQuery<I9Form>({
    queryKey: ['/api/onboarding/i9-forms', newHireId],
    queryFn: async () => {
      const response = await fetch(`/api/onboarding/i9-forms/new-hire/${newHireId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch I-9 form');
      }
      return response.json();
    },
  });

  const form = useForm<Section1FormData>({
    resolver: zodResolver(section1Schema),
    defaultValues: {
      lastName: existingForm?.lastName || '',
      firstName: existingForm?.firstName || '',
      middleInitial: existingForm?.middleInitial || '',
      otherLastNames: existingForm?.otherLastNames || '',
      addressLine1: existingForm?.addressLine1 || '',
      addressLine2: existingForm?.addressLine2 || '',
      city: existingForm?.city || '',
      state: existingForm?.state || '',
      zipCode: existingForm?.zipCode || '',
      dateOfBirth: existingForm?.dateOfBirth || '',
      socialSecurityNumber: existingForm?.socialSecurityNumber || '',
      email: existingForm?.email || '',
      phoneNumber: existingForm?.phoneNumber || '',
      citizenshipStatus: existingForm?.citizenshipStatus as any || 'US_CITIZEN',
      uscisNumber: existingForm?.uscisNumber || '',
      formI94Number: existingForm?.formI94Number || '',
      foreignPassportNumber: existingForm?.foreignPassportNumber || '',
      countryOfIssuance: existingForm?.countryOfIssuance || '',
      authorizationExpirationDate: existingForm?.authorizationExpirationDate || '',
    },
  });

  useEffect(() => {
    if (existingForm?.id) {
      setI9FormId(existingForm.id);
      if (existingForm.section1Status === 'Completed') {
        setCurrentSection(2);
      }
      // Reset form with loaded data
      form.reset({
        lastName: existingForm.lastName || '',
        firstName: existingForm.firstName || '',
        middleInitial: existingForm.middleInitial || '',
        otherLastNames: existingForm.otherLastNames || '',
        addressLine1: existingForm.addressLine1 || '',
        addressLine2: existingForm.addressLine2 || '',
        city: existingForm.city || '',
        state: existingForm.state || '',
        zipCode: existingForm.zipCode || '',
        dateOfBirth: existingForm.dateOfBirth || '',
        socialSecurityNumber: existingForm.socialSecurityNumber || '',
        email: existingForm.email || '',
        phoneNumber: existingForm.phoneNumber || '',
        citizenshipStatus: existingForm.citizenshipStatus as any || 'US_CITIZEN',
        uscisNumber: existingForm.uscisNumber || '',
        formI94Number: existingForm.formI94Number || '',
        foreignPassportNumber: existingForm.foreignPassportNumber || '',
        countryOfIssuance: existingForm.countryOfIssuance || '',
        authorizationExpirationDate: existingForm.authorizationExpirationDate || '',
      });
    }
  }, [existingForm, form]);

  const submitMutation = useMutation({
    mutationFn: async (data: Section1FormData) => {
      let formId = i9FormId;

      // Create form if doesn't exist
      if (!formId) {
        const newForm = await apiRequest<I9Form>('POST', '/api/onboarding/i9-forms', {
          newHireId,
          section1Status: 'In Progress'
        });
        formId = newForm.id;
        setI9FormId(formId);
      }

      // Update Section 1
      return apiRequest('POST', `/api/onboarding/i9-forms/${formId}/section1`, {
        ...data,
        section1SignatureDate: new Date().toISOString().split('T')[0],
        section1Status: 'Completed'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Section 1 Completed',
        description: 'Employee information and attestation saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/i9-forms', newHireId] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/checklists/new-hire', newHireId] });
      setCurrentSection(2);
      onComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save Section 1',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: Section1FormData) => {
    submitMutation.mutate(data);
  };

  const citizenshipStatus = form.watch('citizenshipStatus');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8" />
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-i9-title">Form I-9: Employment Eligibility Verification</h2>
            <p className="text-blue-100 text-sm">Federal form required for all U.S. states and territories</p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentSection >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600'
            }`} data-testid="progress-section1">
              {currentSection > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
            </div>
            <span className="font-medium">Section 1: Employee</span>
          </div>
          <div className="h-0.5 flex-1 bg-gray-300 dark:bg-gray-600 mx-4"></div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentSection >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600'
            }`} data-testid="progress-section2">
              2
            </div>
            <span className="font-medium">Section 2: Employer</span>
          </div>
        </div>
      </div>

      {/* Section 1: Employee Information */}
      {currentSection === 1 && (
        <div className="p-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-1">Instructions for Employee</p>
                <p>Complete Section 1 on or before your first day of employment. Provide your legal name, address, date of birth, and SSN. Select ONE citizenship status and provide required documentation.</p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name (Family Name) <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-i9-lastname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name (Given Name) <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-i9-firstname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="middleInitial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Initial</FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={1} data-testid="input-i9-middleinitial" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="otherLastNames"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Last Names Used (if any)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Previous names, maiden name, etc." data-testid="input-i9-otherlastnames" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address (Street Number and Name) <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-i9-address1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apt. Number</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-i9-address2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City or Town <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-i9-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-i9-state">
                              <SelectValue placeholder="Select State/Territory" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {US_STATES_AND_TERRITORIES.map(state => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="12345 or 12345-6789" data-testid="input-i9-zipcode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-i9-dob" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="socialSecurityNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Security Number <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="###-##-####" data-testid="input-i9-ssn" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-i9-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="(555) 555-5555" data-testid="input-i9-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Citizenship Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">Citizenship/Immigration Status <span className="text-red-500">*</span></h3>
                
                <FormField
                  control={form.control}
                  name="citizenshipStatus"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-3">
                          <div className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md">
                            <RadioGroupItem value="US_CITIZEN" id="us-citizen" data-testid="radio-i9-citizenship-US_CITIZEN" />
                            <label htmlFor="us-citizen" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                              1. A citizen of the United States
                            </label>
                          </div>
                          <div className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md">
                            <RadioGroupItem value="NONCITIZEN_NATIONAL" id="noncitizen-national" data-testid="radio-i9-citizenship-NONCITIZEN_NATIONAL" />
                            <label htmlFor="noncitizen-national" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                              2. A noncitizen national of the United States
                            </label>
                          </div>
                          <div className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md">
                            <RadioGroupItem value="PERMANENT_RESIDENT" id="permanent-resident" data-testid="radio-i9-citizenship-PERMANENT_RESIDENT" />
                            <label htmlFor="permanent-resident" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                              3. A lawful permanent resident
                            </label>
                          </div>
                          <div className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md">
                            <RadioGroupItem value="AUTHORIZED_ALIEN" id="authorized-alien" data-testid="radio-i9-citizenship-AUTHORIZED_ALIEN" />
                            <label htmlFor="authorized-alien" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                              4. An alien authorized to work
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Additional fields for non-US citizens */}
                {(citizenshipStatus === 'PERMANENT_RESIDENT' || citizenshipStatus === 'AUTHORIZED_ALIEN') && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md space-y-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Additional Information Required</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="uscisNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>USCIS Number (if applicable)</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-i9-uscis" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="formI94Number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Form I-94 Admission Number</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-i9-i94" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {citizenshipStatus === 'AUTHORIZED_ALIEN' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="foreignPassportNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Foreign Passport Number</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-i9-passport" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="countryOfIssuance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country of Issuance</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-i9-country" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="authorizationExpirationDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Work Authorization Expiration Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-i9-auth-expiration" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Digital Signature Agreement */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  <strong>Attestation:</strong> I attest, under penalty of perjury, that I am (check one of the boxes above) and that the information I have provided is true and correct. I understand that knowingly and willfully providing false or misleading information or documentation may subject me to criminal penalties.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-submit-i9-section1"
                >
                  {submitMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Section 1
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {/* Section 2: Employer Review and Verification (for HR) */}
      {currentSection === 2 && (
        <div className="p-6 text-center">
          <div className="max-w-md mx-auto">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" data-testid="icon-section1-complete" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Section 1 Complete!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Employee information has been submitted successfully. Section 2 (Employer Verification) will be completed by HR.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Next Steps:</strong> HR will review the employee's submitted documents (List A, or List B + List C) and complete employer verification within 3 business days of the employee's first day.
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Section 2 & 3 employer verification forms are accessible via the HR admin panel.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
