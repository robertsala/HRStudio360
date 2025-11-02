import React, { useState } from 'react';
import { X, AlertTriangle, Calendar, Clock, FileText, User, Building, Send, CheckCircle } from 'lucide-react';

interface TerminationRequestModalProps {
  isOpen?: boolean;
  onClose: () => void;
  employee?: {
    id: string;
    name: string;
    email: string;
    department: string;
    role: string;
    manager: string;
    employeeId: string;
  };
  onRequestSubmitted?: (request: any) => void;
}

const TerminationRequestModal: React.FC<TerminationRequestModalProps> = ({
  isOpen = true,
  onClose,
  employee,
  onRequestSubmitted
}) => {
  const [formData, setFormData] = useState({
    reason: '',
    effectiveDate: '',
    effectiveTime: '17:00', // Default to 5 PM
    lastWorkingDay: '',
    justification: '',
    immediateTermination: false,
    securityConcerns: false,
    returnCompanyProperty: true,
    finalPayDetails: '',
    benefitsContinuation: '',
    referencePolicy: 'positive',
    rehireEligible: true,
    exitInterviewRequired: true,
    notificationList: [] as string[]
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Handle ESC key press
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !employee) return null;

  const terminationReasons = [
    { value: 'voluntary_resignation', label: 'Voluntary Resignation' },
    { value: 'involuntary_performance', label: 'Involuntary Termination - Performance' },
    { value: 'involuntary_conduct', label: 'Involuntary Termination - Conduct' },
    { value: 'involuntary_violation', label: 'Involuntary Termination - Policy Violation' },
    { value: 'layoff_restructuring', label: 'Layoff/Restructuring' },
    { value: 'layoff_economic', label: 'Layoff - Economic Reasons' },
    { value: 'retirement', label: 'Retirement' },
    { value: 'contract_expiration', label: 'Contract Expiration' },
    { value: 'job_abandonment', label: 'Job Abandonment' },
    { value: 'death', label: 'Death' },
    { value: 'other', label: 'Other (specify in notes)' }
  ];

  const referenceOptions = [
    { value: 'positive', label: 'Positive Reference' },
    { value: 'neutral', label: 'Neutral Reference (Dates/Title Only)' },
    { value: 'negative', label: 'Negative Reference' },
    { value: 'no_reference', label: 'No Reference Policy' }
  ];

  const notificationRecipients = [
    'Direct Manager',
    'HR Business Partner', 
    'Department Head',
    'IT Security',
    'Facilities',
    'Payroll',
    'Benefits Administration',
    'Legal/Compliance',
    'Finance',
    'Executive Team'
  ];

  const handleSubmit = async () => {
    // Validation
    if (!formData.reason || !formData.effectiveDate || !formData.justification) {
      setNotification({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const terminationRequest = {
      id: Date.now().toString(),
      employeeId: employee.id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      department: employee.department,
      role: employee.role,
      manager: employee.manager,
      requestedBy: 'Current Manager', // In real app, get from auth context
      requestDate: new Date().toISOString(),
      reason: formData.reason,
      effectiveDate: formData.effectiveDate,
      effectiveTime: formData.effectiveTime,
      lastWorkingDay: formData.lastWorkingDay,
      justification: formData.justification,
      immediateTermination: formData.immediateTermination,
      securityConcerns: formData.securityConcerns,
      returnCompanyProperty: formData.returnCompanyProperty,
      finalPayDetails: formData.finalPayDetails,
      benefitsContinuation: formData.benefitsContinuation,
      referencePolicy: formData.referencePolicy,
      rehireEligible: formData.rehireEligible,
      exitInterviewRequired: formData.exitInterviewRequired,
      notificationList: formData.notificationList,
      status: 'Pending HR Approval',
      approvalChain: [
        { role: 'HR Manager', status: 'Pending', required: true },
        { role: 'Department Head', status: 'Pending', required: true },
        { role: 'Executive Approval', status: 'Pending', required: formData.reason.includes('involuntary') }
      ]
    };

    // Send notifications to approval chain
    console.log('Sending termination request notifications:', {
      hrManager: {
        to: 'hr-manager@company.com',
        subject: `Termination Request Requires Approval - ${employee.name}`,
        message: `A termination request has been submitted for ${employee.name} (${employee.department}). Please review and approve in the HR Inbox.`,
        priority: 'High'
      },
      departmentHead: {
        to: 'dept-head@company.com',
        subject: `Termination Request - ${employee.name}`,
        message: `Please review the termination request for ${employee.name}. HR approval is also required.`,
        priority: 'High'
      }
    });

    if (onRequestSubmitted) {
      onRequestSubmitted(terminationRequest);
    }

    setIsSubmitting(false);
    setShowConfirmation(true);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleNotificationToggle = (recipient: string) => {
    setFormData(prev => ({
      ...prev,
      notificationList: prev.notificationList.includes(recipient)
        ? prev.notificationList.filter(r => r !== recipient)
        : [...prev.notificationList, recipient]
    }));
  };

  if (showConfirmation) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleOverlayClick}
      >
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">Termination Request Submitted</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The termination request for {employee.name} has been submitted for approval. 
              HR and department leadership have been notified.
            </p>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <p>• HR Manager approval required</p>
              <p>• Department Head approval required</p>
              {formData.reason.includes('involuntary') && <p>• Executive approval required</p>}
              <p>• Offboarding checklist will be generated upon approval</p>
            </div>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-red-600 to-orange-600 text-white">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Employee Termination Request</h2>
              <p className="text-red-100">Initiate formal termination process</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-red-100 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step < currentStep ? 'bg-red-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Employee & Reason</span>
            <span>Termination Details</span>
            <span>Review & Submit</span>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Employee Info & Reason */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="font-medium text-red-900">
                    Warning: This action will initiate the formal termination process
                  </span>
                </div>
              </div>

              {/* Employee Information */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Employee Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Employee Name</p>
                      <p className="font-medium text-gray-900 dark:text-white dark:text-white">{employee.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Employee ID</p>
                      <p className="font-medium text-gray-900 dark:text-white dark:text-white">{employee.employeeId}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
                      <p className="font-medium text-gray-900 dark:text-white dark:text-white">{employee.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
                      <p className="font-medium text-gray-900 dark:text-white dark:text-white">{employee.role}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Termination Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Reason for Termination *
                </label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="">Select termination reason</option>
                  {terminationReasons.map(reason => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Justification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Justification & Documentation *
                </label>
                <textarea
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={4}
                  placeholder="Provide detailed justification for this termination. Include relevant documentation, performance issues, incidents, or other supporting information..."
                  required
                />
              </div>

              {/* Special Circumstances */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white dark:text-white">Special Circumstances</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.immediateTermination}
                      onChange={(e) => setFormData({ ...formData, immediateTermination: e.target.checked })}
                      className="mr-3 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Immediate termination required (no notice period)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.securityConcerns}
                      onChange={(e) => setFormData({ ...formData, securityConcerns: e.target.checked })}
                      className="mr-3 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Security concerns (immediate access revocation required)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Termination Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Termination Details</h3>

              {/* Effective Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Effective Termination Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.effectiveDate}
                      onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Effective Time
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="time"
                      value={formData.effectiveTime}
                      onChange={(e) => setFormData({ ...formData, effectiveTime: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Last Working Day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Last Working Day (if different from termination date)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.lastWorkingDay}
                    onChange={(e) => setFormData({ ...formData, lastWorkingDay: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Final Pay Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Final Pay & Compensation Details
                </label>
                <textarea
                  value={formData.finalPayDetails}
                  onChange={(e) => setFormData({ ...formData, finalPayDetails: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  placeholder="Include details about final paycheck, unused PTO payout, severance, commission, bonuses, etc..."
                />
              </div>

              {/* Benefits Continuation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Benefits Continuation (COBRA, etc.)
                </label>
                <textarea
                  value={formData.benefitsContinuation}
                  onChange={(e) => setFormData({ ...formData, benefitsContinuation: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={2}
                  placeholder="Specify COBRA eligibility, benefit continuation options, or other relevant information..."
                />
              </div>

              {/* Reference Policy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Reference Policy
                </label>
                <select
                  value={formData.referencePolicy}
                  onChange={(e) => setFormData({ ...formData, referencePolicy: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {referenceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Options */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white dark:text-white">Additional Options</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.rehireEligible}
                      onChange={(e) => setFormData({ ...formData, rehireEligible: e.target.checked })}
                      className="mr-3 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Eligible for rehire</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.exitInterviewRequired}
                      onChange={(e) => setFormData({ ...formData, exitInterviewRequired: e.target.checked })}
                      className="mr-3 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Exit interview required</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.returnCompanyProperty}
                      onChange={(e) => setFormData({ ...formData, returnCompanyProperty: e.target.checked })}
                      className="mr-3 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Company property return required</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Notifications & Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Review & Notifications</h3>

              {/* Notification Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3">
                  Notify the Following Teams/Individuals
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {notificationRecipients.map(recipient => (
                    <label key={recipient} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notificationList.includes(recipient)}
                        onChange={() => handleNotificationToggle(recipient)}
                        className="mr-3 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">{recipient}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Review Summary */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Termination Request Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Employee:</span>
                    <p className="text-gray-900 dark:text-white dark:text-white">{employee.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Department:</span>
                    <p className="text-gray-900 dark:text-white dark:text-white">{employee.department}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Reason:</span>
                    <p className="text-gray-900 dark:text-white dark:text-white">
                      {terminationReasons.find(r => r.value === formData.reason)?.label || 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Effective Date:</span>
                    <p className="text-gray-900 dark:text-white dark:text-white">
                      {formData.effectiveDate ? new Date(formData.effectiveDate).toLocaleDateString() : 'Not set'} 
                      {formData.effectiveTime && ` at ${formData.effectiveTime}`}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Immediate Termination:</span>
                    <p className="text-gray-900 dark:text-white dark:text-white">{formData.immediateTermination ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Security Concerns:</span>
                    <p className="text-gray-900 dark:text-white dark:text-white">{formData.securityConcerns ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              {/* Approval Chain Preview */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Required Approvals</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <span>HR Manager approval (required)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <span>Department Head approval (required)</span>
                  </div>
                  {formData.reason.includes('involuntary') && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      <span>Executive approval (required for involuntary terminations)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Notice */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">Legal Compliance Notice</h4>
                    <p className="text-yellow-800 text-sm">
                      Ensure all termination procedures comply with federal, state, and local employment laws. 
                      Consider consulting with legal counsel for involuntary terminations or situations involving 
                      potential discrimination claims.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Previous
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && (!formData.reason || !formData.justification)) ||
                  (currentStep === 2 && !formData.effectiveDate)
                }
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Termination Request
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-70 flex items-center text-white ${
            notification.type === 'success' ? 'bg-green-600' :
            notification.type === 'error' ? 'bg-red-600' :
            'bg-blue-600'
          }`}>
            <div className={`rounded-full p-1 mr-3 ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' :
              'bg-blue-500'
            }`}>
              {notification.type === 'success' ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : notification.type === 'error' ? (
                <X className="h-4 w-4" />
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)} 
              className="ml-3 opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminationRequestModal;