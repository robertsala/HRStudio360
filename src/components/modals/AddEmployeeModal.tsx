import React, { useState } from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, Building, Briefcase } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onEmployeeAdded?: (employee: any) => void;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen = true, onClose, onEmployeeAdded }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    department: '',
    role: '',
    startDate: '',
    salary: '',
    employeeType: 'Full-time',
    manager: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showEmailNotification, setShowEmailNotification] = useState(false);
  const [emailNotificationData, setEmailNotificationData] = useState<{
    managerName: string;
    managerEmail: string;
    employeeName: string;
    isNewHire: boolean;
  } | null>(null);
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [showAddJobTitle, setShowAddJobTitle] = useState(false);
  const [newDepartment, setNewDepartment] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobTitleDepartment, setNewJobTitleDepartment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Organization data - should match SystemSettingsModal data
  const [departments, setDepartments] = useState([
    'Engineering',
    'Marketing',
    'Sales',
    'Human Resources',
    'Finance',
    'Operations',
    'Customer Success'
  ]);

  const [jobTitles, setJobTitles] = useState([
    'Software Engineer',
    'Senior Software Engineer',
    'Product Manager',
    'Senior Product Manager',
    'Marketing Manager',
    'Sales Rep',
    'HR Specialist',
    'Financial Analyst',
    'Operations Manager',
    'Customer Success Manager'
  ]);

  const [managers, setManagers] = useState([
    'Sarah Johnson',
    'Mike Chen', 
    'Lisa Rodriguez',
    'David Kim',
    'Emma Wilson',
    'Alex Thompson',
    'John Smith',
    'Maria Garcia'
  ]);

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

  if (!isOpen) return null;

  const handleAddDepartment = () => {
    if (newDepartment.trim()) {
      setDepartments(prev => [...prev, newDepartment.trim()]);
      setFormData({ ...formData, department: newDepartment.trim() });
      setNewDepartment('');
      setShowAddDepartment(false);
      // In a real app, this would make an API call to save the department
      console.log('Added new department:', newDepartment.trim());
    }
  };

  const handleAddJobTitle = () => {
    if (newJobTitle.trim()) {
      setJobTitles(prev => [...prev, newJobTitle.trim()]);
      setFormData({ ...formData, role: newJobTitle.trim() });
      setNewJobTitle('');
      setNewJobTitleDepartment('');
      setShowAddJobTitle(false);
      // In a real app, this would make an API call to save the job title
      console.log('Added new job title:', newJobTitle.trim());
    }
  };

  const sendManagerNotification = async (managerName: string, employeeName: string, isNewHire: boolean = true) => {
    // Find manager's email
    const manager = managers.find(m => m.name === managerName);
    if (!manager) return;

    // Simulate email sending (in real app, this would be an API call)
    console.log('Sending email notification to manager:', {
      to: manager.email,
      subject: isNewHire ? 'New Team Member Assigned' : 'Team Member Reassignment',
      employeeName,
      managerName,
      isNewHire
    });

    // Show notification to user
    setEmailNotificationData({
      managerName,
      managerEmail: manager.email,
      employeeName,
      isNewHire
    });
    setShowEmailNotification(true);

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setShowEmailNotification(false);
      setEmailNotificationData(null);
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.department || !formData.role || !formData.startDate) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create employee object
    const newEmployee = {
      id: Date.now().toString(), // Simple ID generation
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      department: formData.department,
      role: formData.role,
      status: 'Active' as const,
      startDate: formData.startDate,
      phone: formData.phone || '+1 (555) 000-0000',
      location: formData.city && formData.state ? `${formData.city}, ${formData.state}` : 'Not specified'
    };
    
    // Call the callback to add employee
    if (onEmployeeAdded) {
      onEmployeeAdded(newEmployee);
    }

    // Send manager notification if manager is selected
    if (formData.manager) {
      await sendManagerNotification(formData.manager, `${formData.firstName} ${formData.lastName}`, true);
    }
    
    // Reset form and close modal
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      department: '',
      role: '',
      startDate: '',
      salary: '',
      employeeType: 'Full-time',
      manager: ''
    });
    setCurrentStep(1);
    setIsSubmitting(false);
    setSuccess('Employee added successfully!');
    setTimeout(() => setSuccess(''), 3000);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto resize-both min-w-[300px] min-h-[300px]">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">Add New Employee</h2>
            <p className="text-gray-600 dark:text-gray-400">Step {currentStep} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
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
                  step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Personal Info</span>
            <span>Work Details</span>
            <span>Review</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-96">
          <div className="p-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Personal Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">State</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select State</option>
                      <option value="AL">Alabama</option>
                      <option value="AK">Alaska</option>
                      <option value="AZ">Arizona</option>
                      <option value="AR">Arkansas</option>
                      <option value="CA">California</option>
                      <option value="CO">Colorado</option>
                      <option value="CT">Connecticut</option>
                      <option value="DE">Delaware</option>
                      <option value="FL">Florida</option>
                      <option value="GA">Georgia</option>
                      <option value="HI">Hawaii</option>
                      <option value="ID">Idaho</option>
                      <option value="IL">Illinois</option>
                      <option value="IN">Indiana</option>
                      <option value="IA">Iowa</option>
                      <option value="KS">Kansas</option>
                      <option value="KY">Kentucky</option>
                      <option value="LA">Louisiana</option>
                      <option value="ME">Maine</option>
                      <option value="MD">Maryland</option>
                      <option value="MA">Massachusetts</option>
                      <option value="MI">Michigan</option>
                      <option value="MN">Minnesota</option>
                      <option value="MS">Mississippi</option>
                      <option value="MO">Missouri</option>
                      <option value="MT">Montana</option>
                      <option value="NE">Nebraska</option>
                      <option value="NV">Nevada</option>
                      <option value="NH">New Hampshire</option>
                      <option value="NJ">New Jersey</option>
                      <option value="NM">New Mexico</option>
                      <option value="NY">New York</option>
                      <option value="NC">North Carolina</option>
                      <option value="ND">North Dakota</option>
                      <option value="OH">Ohio</option>
                      <option value="OK">Oklahoma</option>
                      <option value="OR">Oregon</option>
                      <option value="PA">Pennsylvania</option>
                      <option value="RI">Rhode Island</option>
                      <option value="SC">South Carolina</option>
                      <option value="SD">South Dakota</option>
                      <option value="TN">Tennessee</option>
                      <option value="TX">Texas</option>
                      <option value="UT">Utah</option>
                      <option value="VT">Vermont</option>
                      <option value="VA">Virginia</option>
                      <option value="WA">Washington</option>
                      <option value="WV">West Virginia</option>
                      <option value="WI">Wisconsin</option>
                      <option value="WY">Wyoming</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Work Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Work Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Department</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <div className="flex">
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="flex-1 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowAddDepartment(true)}
                        className="px-3 py-2 bg-blue-600 text-white border border-blue-600 rounded-r-lg hover:bg-blue-700 transition-colors text-sm"
                        title="Add New Department"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Job Title</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <div className="flex">
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="flex-1 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Job Title</option>
                        {jobTitles.map(title => (
                          <option key={title} value={title}>{title}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowAddJobTitle(true)}
                        className="px-3 py-2 bg-blue-600 text-white border border-blue-600 rounded-r-lg hover:bg-blue-700 transition-colors text-sm"
                        title="Add New Job Title"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Employment Type</label>
                    <select
                      value={formData.employeeType}
                      onChange={(e) => setFormData({ ...formData, employeeType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Annual Salary</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="65000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Reporting Manager</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      value={formData.manager}
                      onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Manager</option>
                      {managers.map(manager => (
                        <option key={manager} value={manager}>{manager}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Review Information</h3>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Name</p>
                      <p className="text-gray-900 dark:text-white dark:text-white">{formData.firstName} {formData.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Email</p>
                      <p className="text-gray-900 dark:text-white dark:text-white">{formData.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Department</p>
                      <p className="text-gray-900 dark:text-white dark:text-white">{formData.department}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Role</p>
                      <p className="text-gray-900 dark:text-white dark:text-white">{formData.role}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Start Date</p>
                      <p className="text-gray-900 dark:text-white dark:text-white">{formData.startDate ? new Date(formData.startDate).toLocaleDateString() : ''}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Salary</p>
                      <p className="text-gray-900 dark:text-white dark:text-white">{formData.salary ? `$${parseInt(formData.salary).toLocaleString()}` : ''}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Error Notification */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-70 flex items-center">
            <div className="bg-red-50 dark:bg-red-900/200 rounded-full p-1 mr-3">
              <X className="h-4 w-4" />
            </div>
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-3 text-red-200 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Success Notification */}
        {success && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-70 flex items-center">
            <div className="bg-green-50 dark:bg-green-900/200 rounded-full p-1 mr-3">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>{success}</span>
          </div>
        )}

        {/* Add Department Modal */}
        {showAddDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white mb-4">Add New Department</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Department Name</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Customer Success"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddDepartment(false);
                      setNewDepartment('');
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddDepartment}
                    disabled={!newDepartment.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Department
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Job Title Modal */}
        {showAddJobTitle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white mb-4">Add New Job Title</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Senior Product Manager"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Department</label>
                  <select
                    value={newJobTitleDepartment}
                    onChange={(e) => setNewJobTitleDepartment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddJobTitle(false);
                      setNewJobTitle('');
                      setNewJobTitleDepartment('');
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddJobTitle}
                    disabled={!newJobTitle.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Job Title
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  (currentStep === 1 && (!formData.firstName || !formData.lastName || !formData.email)) ||
                  (currentStep === 2 && (!formData.department || !formData.role || !formData.startDate))
                }
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Adding Employee...
                  </>
                ) : (
                  'Add Employee'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeModal;