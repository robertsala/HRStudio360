import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Save, Camera, FileText, Award, Clock, UserX, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Remote';
  startDate: string;
  location: string;
  manager: string;
  salary: string;
  employeeId: string;
  profileImage?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  skills: string[];
  certifications: string[];
  performanceRating: number;
  ptoBalance: number;
  sickLeaveBalance: number;
}

interface EmployeeProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
}

const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({ isOpen, onClose, employee }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();

  // Determine if current user is HR staff
  const isHRUser = user?.email?.includes('hr') || user?.email?.includes('HR') || 
                   user?.email?.includes('human') || user?.email?.includes('emma.wilson');
  
  // Determine if current user is Product Owner (based on user context from Layout.tsx)
  const isProductOwner = user?.email && !user.email.includes('manager') && !user.email.includes('hr');
  
  // Combined authorization: HR staff OR Product Owner can terminate employees
  const canTerminateEmployees = isHRUser || isProductOwner;

  const [formData, setFormData] = useState(employee || {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1 (555) 123-4567',
    department: 'Engineering',
    role: 'Senior Software Engineer',
    status: 'Active' as const,
    startDate: '2022-03-15',
    location: 'San Francisco, CA',
    manager: 'Mike Chen',
    salary: '$125,000',
    employeeId: 'EMP001',
    profileImage: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    emergencyContact: {
      name: 'John Johnson',
      relationship: 'Spouse',
      phone: '+1 (555) 987-6543'
    },
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS'],
    certifications: ['AWS Solutions Architect', 'Scrum Master'],
    performanceRating: 4.5,
    ptoBalance: 18,
    sickLeaveBalance: 5
  });

  // Check if viewing own profile (compare emails)
  const isViewingOwnProfile = user?.email === formData.email;

  // Show terminate button only if: user has termination privileges AND not viewing their own profile
  const showTerminateButton = canTerminateEmployees && !isViewingOwnProfile;

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

  const handleSave = () => {
    console.log('Saving employee data:', formData);
    setIsEditing(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'personal', label: 'Personal Info' },
    { id: 'employment', label: 'Employment' },
    { id: 'performance', label: 'Performance' },
    { id: 'documents', label: 'Documents' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Remote': return 'bg-blue-100 text-blue-800';
      case 'On Leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-auto resize-both min-w-[300px] min-h-[300px]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt={formData.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-blue-600 text-xl font-bold">
                      {getInitials(formData.name)}
                    </span>
                  </div>
                )}
                <button className="absolute -bottom-1 -right-1 bg-blue-50 dark:bg-blue-900/200 rounded-full p-1 hover:bg-blue-600 transition-colors">
                  <Camera className="h-3 w-3 text-white" />
                </button>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{formData.name}</h2>
                <p className="text-blue-100">{formData.role} • {formData.department}</p>
                <p className="text-blue-200 text-sm">Employee ID: {formData.employeeId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(formData.status)}`}>
                {formData.status}
              </span>
              {isEditing ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
               <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/30 transition-colors flex items-center"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </button>
                {showTerminateButton && (
                  <button
                    onClick={() => {
                      // This would open the termination request modal
                      console.log('Opening termination request for:', formData.name);
                      console.log('Authorized user (HR/Product Owner):', user?.email);
                      alert('Termination request feature - would open TerminationRequestModal');
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    title="Only available to HR staff for other employees"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Terminate Employment
                  </button>
                )}
                </>
              )}
              <button
                onClick={onClose}
                className="text-blue-100 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="overflow-y-auto max-h-96">
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-900">Tenure</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {Math.floor((new Date().getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-900">Performance</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-1">{formData.performanceRating}/5</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="font-medium text-purple-900">PTO Balance</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{formData.ptoBalance} days</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-3" />
                        <span>{formData.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-gray-400 mr-3" />
                        <span>{formData.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                        <span>{formData.location}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Skills & Certifications</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.skills.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Certifications</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.certifications.map((cert, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white dark:text-white">{formData.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white dark:text-white">{formData.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white dark:text-white">{formData.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white dark:text-white">{formData.location}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Emergency Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.emergencyContact.name}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                          })}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white dark:text-white">{formData.emergencyContact.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Relationship</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.emergencyContact.relationship}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                          })}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white dark:text-white">{formData.emergencyContact.relationship}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.emergencyContact.phone}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                          })}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white dark:text-white">{formData.emergencyContact.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Employment Tab */}
            {activeTab === 'employment' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Employment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Department</label>
                    {isEditing ? (
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="HR">HR</option>
                        <option value="Finance">Finance</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 dark:text-white dark:text-white">{formData.department}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Role</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white dark:text-white">{formData.role}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Manager</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.manager}
                        onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white dark:text-white">{formData.manager}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Start Date</label>
                    <p className="text-gray-900 dark:text-white dark:text-white">{new Date(formData.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Salary</label>
                    <p className="text-gray-900 dark:text-white dark:text-white">{formData.salary}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Status</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(formData.status)}`}>
                      {formData.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Performance & Development</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white dark:text-white mb-3">Current Rating</h4>
                    <div className="flex items-center">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Award
                            key={star}
                            className={`h-5 w-5 ${
                              star <= formData.performanceRating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white dark:text-white">{formData.performanceRating}/5</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white dark:text-white mb-3">Time Off Balances</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">PTO:</span>
                        <span className="font-medium">{formData.ptoBalance} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Sick Leave:</span>
                        <span className="font-medium">{formData.sickLeaveBalance} days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Employee Documents</h3>
                <div className="grid gap-4">
                  {[
                    { name: 'I-9 Form', status: 'Complete', date: '2022-03-15' },
                    { name: 'W-4 Form', status: 'Complete', date: '2022-03-15' },
                    { name: 'Direct Deposit Authorization', status: 'Complete', date: '2022-03-16' },
                    { name: 'Benefits Enrollment', status: 'Complete', date: '2022-03-20' },
                    { name: 'Emergency Contact Form', status: 'Complete', date: '2022-03-15' }
                  ].map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white dark:text-white">{doc.name}</p>
                          <p className="text-sm text-gray-500">Completed: {new Date(doc.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfileModal;