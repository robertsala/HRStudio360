import { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '../../hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../../lib/queryClient';
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<Section1FormData>({
    lastName: '',
    firstName: '',
    middleInitial: '',
    otherLastNames: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    dateOfBirth: '',
    socialSecurityNumber: '',
    email: '',
    phoneNumber: '',
    citizenshipStatus: 'US_CITIZEN',
    uscisNumber: '',
    formI94Number: '',
    foreignPassportNumber: '',
    countryOfIssuance: '',
    authorizationExpirationDate: '',
  });

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

  // Load existing form data
  useEffect(() => {
    if (existingForm?.id) {
      setI9FormId(existingForm.id);
      if (existingForm.section1Status === 'Completed') {
        setCurrentSection(2);
      }
      setFormData({
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
        citizenshipStatus: (existingForm.citizenshipStatus as any) || 'US_CITIZEN',
        uscisNumber: existingForm.uscisNumber || '',
        formI94Number: existingForm.formI94Number || '',
        foreignPassportNumber: existingForm.foreignPassportNumber || '',
        countryOfIssuance: existingForm.countryOfIssuance || '',
        authorizationExpirationDate: existingForm.authorizationExpirationDate || '',
      });
    }
  }, [existingForm]);

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
        variant: 'default',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate using Zod schema
    const result = section1Schema.safeParse(formData);
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name (Family Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-i9-lastname"
                  />
                  {errors.lastName && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.lastName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name (Given Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-i9-firstname"
                  />
                  {errors.firstName && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Middle Initial
                  </label>
                  <input
                    type="text"
                    value={formData.middleInitial}
                    onChange={(e) => setFormData({ ...formData, middleInitial: e.target.value })}
                    maxLength={1}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-i9-middleinitial"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Other Last Names Used (if any)
                </label>
                <input
                  type="text"
                  value={formData.otherLastNames}
                  onChange={(e) => setFormData({ ...formData, otherLastNames: e.target.value })}
                  placeholder="Previous names, maiden name, etc."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="input-i9-otherlastnames"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address (Street Number and Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-i9-address1"
                  />
                  {errors.addressLine1 && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.addressLine1}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Apt. Number
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-i9-address2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City or Town <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-i9-city"
                  />
                  {errors.city && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="select-i9-state"
                  >
                    <option value="">Select State/Territory</option>
                    {US_STATES_AND_TERRITORIES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.state && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.state}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="12345 or 12345-6789"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-i9-zipcode"
                  />
                  {errors.zipCode && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.zipCode}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-i9-dob"
                  />
                  {errors.dateOfBirth && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.dateOfBirth}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Social Security Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.socialSecurityNumber}
                    onChange={(e) => setFormData({ ...formData, socialSecurityNumber: e.target.value })}
                    placeholder="###-##-####"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-i9-ssn"
                  />
                  {errors.socialSecurityNumber && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.socialSecurityNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-i9-email"
                  />
                  {errors.email && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="(555) 555-5555"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="input-i9-phone"
                />
              </div>
            </div>

            {/* Citizenship Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">Citizenship/Immigration Status <span className="text-red-500">*</span></h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md">
                  <input
                    type="radio"
                    id="us-citizen"
                    name="citizenshipStatus"
                    value="US_CITIZEN"
                    checked={formData.citizenshipStatus === 'US_CITIZEN'}
                    onChange={(e) => setFormData({ ...formData, citizenshipStatus: e.target.value as any })}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    data-testid="radio-i9-citizenship-US_CITIZEN"
                  />
                  <label htmlFor="us-citizen" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                    1. A citizen of the United States
                  </label>
                </div>
                <div className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md">
                  <input
                    type="radio"
                    id="noncitizen-national"
                    name="citizenshipStatus"
                    value="NONCITIZEN_NATIONAL"
                    checked={formData.citizenshipStatus === 'NONCITIZEN_NATIONAL'}
                    onChange={(e) => setFormData({ ...formData, citizenshipStatus: e.target.value as any })}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    data-testid="radio-i9-citizenship-NONCITIZEN_NATIONAL"
                  />
                  <label htmlFor="noncitizen-national" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                    2. A noncitizen national of the United States
                  </label>
                </div>
                <div className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md">
                  <input
                    type="radio"
                    id="permanent-resident"
                    name="citizenshipStatus"
                    value="PERMANENT_RESIDENT"
                    checked={formData.citizenshipStatus === 'PERMANENT_RESIDENT'}
                    onChange={(e) => setFormData({ ...formData, citizenshipStatus: e.target.value as any })}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    data-testid="radio-i9-citizenship-PERMANENT_RESIDENT"
                  />
                  <label htmlFor="permanent-resident" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                    3. A lawful permanent resident
                  </label>
                </div>
                <div className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md">
                  <input
                    type="radio"
                    id="authorized-alien"
                    name="citizenshipStatus"
                    value="AUTHORIZED_ALIEN"
                    checked={formData.citizenshipStatus === 'AUTHORIZED_ALIEN'}
                    onChange={(e) => setFormData({ ...formData, citizenshipStatus: e.target.value as any })}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    data-testid="radio-i9-citizenship-AUTHORIZED_ALIEN"
                  />
                  <label htmlFor="authorized-alien" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                    4. An alien authorized to work
                  </label>
                </div>
              </div>

              {/* Additional fields for non-US citizens */}
              {(formData.citizenshipStatus === 'PERMANENT_RESIDENT' || formData.citizenshipStatus === 'AUTHORIZED_ALIEN') && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md space-y-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Additional Information Required</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        USCIS Number (if applicable)
                      </label>
                      <input
                        type="text"
                        value={formData.uscisNumber}
                        onChange={(e) => setFormData({ ...formData, uscisNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        data-testid="input-i9-uscis"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Form I-94 Admission Number
                      </label>
                      <input
                        type="text"
                        value={formData.formI94Number}
                        onChange={(e) => setFormData({ ...formData, formI94Number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        data-testid="input-i9-i94"
                      />
                    </div>
                  </div>

                  {formData.citizenshipStatus === 'AUTHORIZED_ALIEN' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Foreign Passport Number
                        </label>
                        <input
                          type="text"
                          value={formData.foreignPassportNumber}
                          onChange={(e) => setFormData({ ...formData, foreignPassportNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          data-testid="input-i9-passport"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Country of Issuance
                        </label>
                        <input
                          type="text"
                          value={formData.countryOfIssuance}
                          onChange={(e) => setFormData({ ...formData, countryOfIssuance: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          data-testid="input-i9-country"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Work Authorization Expiration Date
                        </label>
                        <input
                          type="date"
                          value={formData.authorizationExpirationDate}
                          onChange={(e) => setFormData({ ...formData, authorizationExpirationDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          data-testid="input-i9-auth-expiration"
                        />
                      </div>
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
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
              </button>
            </div>
          </form>
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
