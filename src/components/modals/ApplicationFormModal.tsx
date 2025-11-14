import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Loader2, Sparkles, CheckCircle, User, X } from 'lucide-react';
import { ObjectUploader } from '../ObjectUploader';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
}

interface ApplicationFormModalProps {
  job: JobPosting;
  onClose: () => void;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
  currentCompany: string;
  currentJobTitle: string;
  yearsOfExperience: number;
  educationLevel: string;
  coverLetter: string;
  skills: string;
  resumeUrl: string;
  profilePictureUrl: string;
  sourceId: string;
}

export default function ApplicationFormModal({ job, onClose }: ApplicationFormModalProps) {
  const queryClient = useQueryClient();
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeParsed, setResumeParsed] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'details'>('upload');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    portfolioUrl: '',
    currentCompany: '',
    currentJobTitle: '',
    yearsOfExperience: 0,
    educationLevel: '',
    coverLetter: '',
    skills: '',
    resumeUrl: '',
    profilePictureUrl: '',
    sourceId: 'career_page'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle resume upload and AI parsing
  const handleResumeUpload = async (resumeUrl: string) => {
    setFormData(prev => ({ ...prev, resumeUrl }));
    setIsParsingResume(true);

    try {
      // Call AI resume parsing endpoint
      const response = await fetch('/api/careers/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeUrl })
      });

      if (!response.ok) {
        throw new Error('Failed to parse resume');
      }

      const parsedData = await response.json();

      // Auto-fill form fields with parsed data
      const updates: Partial<FormData> = {};
      if (parsedData.parsedName) updates.fullName = parsedData.parsedName;
      if (parsedData.parsedEmail) updates.email = parsedData.parsedEmail;
      if (parsedData.parsedPhone) updates.phone = parsedData.parsedPhone;
      if (parsedData.parsedLocation) updates.location = parsedData.parsedLocation;
      if (parsedData.parsedSkills?.length > 0) updates.skills = parsedData.parsedSkills.join(', ');
      if (parsedData.totalYearsExperience) updates.yearsOfExperience = parsedData.totalYearsExperience;
      if (parsedData.parsedEducation?.length > 0) updates.educationLevel = parsedData.parsedEducation[0].degree;
      if (parsedData.parsedExperience?.length > 0) {
        const currentJob = parsedData.parsedExperience[0];
        if (currentJob.company) updates.currentCompany = currentJob.company;
        if (currentJob.title) updates.currentJobTitle = currentJob.title;
      }

      setFormData(prev => ({ ...prev, ...updates }));
      setResumeParsed(true);
      setNotification({
        type: 'success',
        message: 'Resume parsed successfully! Your information has been auto-filled.'
      });
      setTimeout(() => setNotification(null), 5000);
      setCurrentStep('details');
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: 'Resume parsing failed. Please fill out the form manually.'
      });
      setTimeout(() => setNotification(null), 5000);
      setCurrentStep('details');
    } finally {
      setIsParsingResume(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName || formData.fullName.length < 2) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.phone || formData.phone.length < 10) {
      newErrors.phone = 'Valid phone number is required';
    }
    if (!formData.location || formData.location.length < 2) {
      newErrors.location = 'Location is required';
    }
    if (!formData.educationLevel) {
      newErrors.educationLevel = 'Education level is required';
    }
    if (!formData.coverLetter || formData.coverLetter.length < 50) {
      newErrors.coverLetter = 'Cover letter must be at least 50 characters';
    }
    if (!formData.skills) {
      newErrors.skills = 'Please list your skills';
    }
    if (!formData.resumeUrl) {
      newErrors.resumeUrl = 'Resume is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit application
  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`/api/careers/jobs/${job.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit application');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setNotification({
        type: 'success',
        message: `Your application for ${job.title} has been successfully submitted!`
      });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/careers/jobs'] });
        onClose();
      }, 2000);
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.message || 'Failed to submit application. Please try again.'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      submitMutation.mutate(formData);
    }
  };

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-application-modal-title">
              Apply for {job.title}
            </h2>
            <p className="text-blue-100 text-sm mt-1" data-testid="text-job-department">
              {job.department} • {job.location} • {job.employmentType}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            data-testid="button-close-modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`px-6 py-3 ${notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        )}

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${currentStep === 'upload' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${currentStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                1
              </div>
              <span className="text-sm font-medium">Upload Resume</span>
            </div>
            <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600 mx-4"></div>
            <div className={`flex items-center gap-2 ${currentStep === 'details' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${currentStep === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                2
              </div>
              <span className="text-sm font-medium">Application Details</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {currentStep === 'upload' && (
            <div className="space-y-6">
              {isParsingResume ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
                  <Sparkles className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    AI is analyzing your resume...
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    We're extracting your information to auto-fill the application form
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Parsing in progress...</span>
                  </div>
                </div>
              ) : resumeParsed ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-1">
                        Resume parsed successfully!
                      </h3>
                      <p className="text-green-700 dark:text-green-300 text-sm">
                        Your information has been auto-filled. Click "Continue to Application" to review and complete any missing fields.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Upload Your Resume
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                      Our AI will automatically extract your information and pre-fill the application form
                    </p>
                  </div>
                  
                  <ObjectUploader
                    onUploadComplete={handleResumeUpload}
                    accept=".pdf,.doc,.docx"
                    maxSizeMB={10}
                    label="Resume (PDF or Word document)"
                    data-testid="uploader-resume"
                  />

                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900 dark:text-blue-100">
                        <p className="font-semibold mb-1">AI-Powered Auto-Fill</p>
                        <p className="text-blue-700 dark:text-blue-300">
                          Upload your resume and we'll automatically extract your name, contact information, skills, experience, and education to speed up your application.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep('details')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    data-testid="button-skip-resume"
                  >
                    Skip and fill manually
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  <User className="h-5 w-5" />
                  <h3>Personal Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      placeholder="John Doe"
                      className={`w-full px-4 py-2 border ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
                      data-testid="input-full-name"
                    />
                    {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="john@example.com"
                      className={`w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
                      data-testid="input-email"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className={`w-full px-4 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
                      data-testid="input-phone"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => updateField('location', e.target.value)}
                      placeholder="San Francisco, CA"
                      className={`w-full px-4 py-2 border ${errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
                      data-testid="input-location"
                    />
                    {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profile Picture (Optional)
                  </label>
                  <ObjectUploader
                    onUploadComplete={(url) => updateField('profilePictureUrl', url)}
                    accept="image/*"
                    maxSizeMB={5}
                    label="Profile Picture"
                    data-testid="uploader-profile-picture"
                  />
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  <FileText className="h-5 w-5" />
                  <h3>Professional Background</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Company
                    </label>
                    <input
                      type="text"
                      value={formData.currentCompany}
                      onChange={(e) => updateField('currentCompany', e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      data-testid="input-current-company"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.currentJobTitle}
                      onChange={(e) => updateField('currentJobTitle', e.target.value)}
                      placeholder="Software Engineer"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      data-testid="input-current-job-title"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.yearsOfExperience}
                      onChange={(e) => updateField('yearsOfExperience', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      data-testid="input-years-experience"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Education Level *
                    </label>
                    <select
                      value={formData.educationLevel}
                      onChange={(e) => updateField('educationLevel', e.target.value)}
                      className={`w-full px-4 py-2 border ${errors.educationLevel ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
                      data-testid="select-education-level"
                    >
                      <option value="">Select education level</option>
                      <option value="High School">High School</option>
                      <option value="Associate Degree">Associate Degree</option>
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="Doctorate">Doctorate</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.educationLevel && <p className="mt-1 text-sm text-red-600">{errors.educationLevel}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Skills *
                  </label>
                  <textarea
                    value={formData.skills}
                    onChange={(e) => updateField('skills', e.target.value)}
                    placeholder="JavaScript, React, Node.js, SQL, etc."
                    rows={2}
                    className={`w-full px-4 py-2 border ${errors.skills ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
                    data-testid="input-skills"
                  />
                  {errors.skills && <p className="mt-1 text-sm text-red-600">{errors.skills}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => updateField('linkedinUrl', e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      data-testid="input-linkedin"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Portfolio / Website
                    </label>
                    <input
                      type="url"
                      value={formData.portfolioUrl}
                      onChange={(e) => updateField('portfolioUrl', e.target.value)}
                      placeholder="https://yourportfolio.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      data-testid="input-portfolio"
                    />
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  <FileText className="h-5 w-5" />
                  <h3>Cover Letter</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Why are you interested in this position? *
                  </label>
                  <textarea
                    value={formData.coverLetter}
                    onChange={(e) => updateField('coverLetter', e.target.value)}
                    placeholder="Tell us why you're a great fit for this role..."
                    rows={6}
                    className={`w-full px-4 py-2 border ${errors.coverLetter ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
                    data-testid="input-cover-letter"
                  />
                  {errors.coverLetter && <p className="mt-1 text-sm text-red-600">{errors.coverLetter}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitMutation.isPending}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  data-testid="button-cancel-application"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="button-submit-application"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Resume Upload Step Actions */}
        {currentStep === 'upload' && resumeParsed && (
          <div className="px-6 pb-6">
            <button
              onClick={() => setCurrentStep('details')}
              className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              data-testid="button-continue-to-application"
            >
              Continue to Application
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
