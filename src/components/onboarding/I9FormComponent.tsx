import { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Upload, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface I9FormComponentProps {
  newHireId: string;
  newHireName: string;
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

const CITIZENSHIP_STATUSES = [
  { value: 'US_CITIZEN', label: '1. A citizen of the United States' },
  { value: 'NONCITIZEN_NATIONAL', label: '2. A noncitizen national of the United States' },
  { value: 'PERMANENT_RESIDENT', label: '3. A lawful permanent resident' },
  { value: 'AUTHORIZED_ALIEN', label: '4. An alien authorized to work' }
];

export default function I9FormComponent({ newHireId, newHireName, onComplete }: I9FormComponentProps) {
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Section 1: Employee Information
  const [section1Data, setSection1Data] = useState({
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
    citizenshipStatus: '',
    uscisNumber: '',
    formI94Number: '',
    foreignPassportNumber: '',
    countryOfIssuance: '',
    authorizationExpirationDate: ''
  });

  const handleSection1Change = (field: string, value: string) => {
    setSection1Data(prev => ({ ...prev, [field]: value }));
  };

  const handleSection1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if I-9 form already exists
      let i9FormId: string;
      try {
        const existingForm = await fetch(`/api/onboarding/i9-forms/new-hire/${newHireId}`).then(r => r.json());
        i9FormId = existingForm.id;
      } catch {
        // Create new I-9 form if it doesn't exist
        const newForm = await apiRequest('POST', '/api/onboarding/i9-forms', {
          newHireId,
          section1Status: 'In Progress'
        });
        i9FormId = newForm.id;
      }

      // Update Section 1
      await apiRequest('POST', `/api/onboarding/i9-forms/${i9FormId}/section1`, {
        ...section1Data,
        section1SignatureDate: new Date().toISOString().split('T')[0]
      });

      toast({
        title: 'Section 1 Completed',
        description: 'Employee information and attestation saved successfully.',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/i9-forms'] });
      setCurrentSection(2);
      onComplete?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save Section 1',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8" />
          <div>
            <h2 className="text-2xl font-bold">Form I-9: Employment Eligibility Verification</h2>
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
            }`}>
              {currentSection > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
            </div>
            <span className="font-medium">Section 1: Employee</span>
          </div>
          <div className="h-0.5 flex-1 bg-gray-300 dark:bg-gray-600 mx-4"></div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentSection >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600'
            }`}>
              2
            </div>
            <span className="font-medium">Section 2: Employer</span>
          </div>
        </div>
      </div>

      {/* Section 1: Employee Information and Attestation */}
      {currentSection === 1 && (
        <form onSubmit={handleSection1Submit} className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-1">Instructions for Employee</p>
                <p>Complete Section 1 on or before your first day of employment. Provide your legal name, address, date of birth, and SSN. Select ONE citizenship status and provide required documentation.</p>
              </div>
            </div>
          </div>

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
                  required
                  value={section1Data.lastName}
                  onChange={(e) => handleSection1Change('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  data-testid="input-i9-lastname"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name (Given Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={section1Data.firstName}
                  onChange={(e) => handleSection1Change('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  data-testid="input-i9-firstname"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Middle Initial
                </label>
                <input
                  type="text"
                  maxLength={1}
                  value={section1Data.middleInitial}
                  onChange={(e) => handleSection1Change('middleInitial', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                value={section1Data.otherLastNames}
                onChange={(e) => handleSection1Change('otherLastNames', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Previous names, maiden name, etc."
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
                  required
                  value={section1Data.addressLine1}
                  onChange={(e) => handleSection1Change('addressLine1', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  data-testid="input-i9-address1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Apt. Number
                </label>
                <input
                  type="text"
                  value={section1Data.addressLine2}
                  onChange={(e) => handleSection1Change('addressLine2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  required
                  value={section1Data.city}
                  onChange={(e) => handleSection1Change('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  data-testid="input-i9-city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={section1Data.state}
                  onChange={(e) => handleSection1Change('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  data-testid="select-i9-state"
                >
                  <option value="">Select State/Territory</option>
                  {US_STATES_AND_TERRITORIES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{5}(-[0-9]{4})?"
                  value={section1Data.zipCode}
                  onChange={(e) => handleSection1Change('zipCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="12345 or 12345-6789"
                  data-testid="input-i9-zipcode"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={section1Data.dateOfBirth}
                  onChange={(e) => handleSection1Change('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  data-testid="input-i9-dob"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Social Security Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{3}-[0-9]{2}-[0-9]{4}"
                  value={section1Data.socialSecurityNumber}
                  onChange={(e) => handleSection1Change('socialSecurityNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="###-##-####"
                  data-testid="input-i9-ssn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={section1Data.email}
                  onChange={(e) => handleSection1Change('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  data-testid="input-i9-email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={section1Data.phoneNumber}
                onChange={(e) => handleSection1Change('phoneNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="(555) 555-5555"
                data-testid="input-i9-phone"
              />
            </div>
          </div>

          {/* Citizenship Status Attestation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">Citizenship/Immigration Status <span className="text-red-500">*</span></h3>
            
            <div className="space-y-3">
              {CITIZENSHIP_STATUSES.map(status => (
                <label key={status.value} className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="citizenshipStatus"
                    value={status.value}
                    checked={section1Data.citizenshipStatus === status.value}
                    onChange={(e) => handleSection1Change('citizenshipStatus', e.target.value)}
                    className="mt-1"
                    required
                    data-testid={`radio-i9-citizenship-${status.value}`}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{status.label}</span>
                </label>
              ))}
            </div>

            {/* Additional fields for non-US citizens */}
            {(section1Data.citizenshipStatus === 'PERMANENT_RESIDENT' || section1Data.citizenshipStatus === 'AUTHORIZED_ALIEN') && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md space-y-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Additional Information Required</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      USCIS Number (if applicable)
                    </label>
                    <input
                      type="text"
                      value={section1Data.uscisNumber}
                      onChange={(e) => handleSection1Change('uscisNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      data-testid="input-i9-uscis"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Form I-94 Admission Number
                    </label>
                    <input
                      type="text"
                      value={section1Data.formI94Number}
                      onChange={(e) => handleSection1Change('formI94Number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      data-testid="input-i9-i94"
                    />
                  </div>
                </div>

                {section1Data.citizenshipStatus === 'AUTHORIZED_ALIEN' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Foreign Passport Number
                      </label>
                      <input
                        type="text"
                        value={section1Data.foreignPassportNumber}
                        onChange={(e) => handleSection1Change('foreignPassportNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        data-testid="input-i9-passport"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Country of Issuance
                      </label>
                      <input
                        type="text"
                        value={section1Data.countryOfIssuance}
                        onChange={(e) => handleSection1Change('countryOfIssuance', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        data-testid="input-i9-country"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Work Authorization Expiration Date
                      </label>
                      <input
                        type="date"
                        value={section1Data.authorizationExpirationDate}
                        onChange={(e) => handleSection1Change('authorizationExpirationDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              data-testid="button-submit-i9-section1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Complete Section 1</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Section 2 Placeholder (for HR) */}
      {currentSection === 2 && (
        <div className="p-6 text-center">
          <div className="max-w-md mx-auto">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Section 1 Complete!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your information has been submitted. Section 2 (Employer Verification) will be completed by HR on or before your first day of employment.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Next Steps:</strong> HR will review your submitted documents and complete the employer verification section. You'll be notified once the I-9 process is fully complete.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
