import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, CreditCard as Edit3, Save, Camera, FileText, Award, Clock, UserX, Building, Briefcase, Star, TrendingUp, DollarSign, CheckCircle, AlertTriangle, Eye, Download, Send, Bell, CreditCard, TrendingUp as TrendingUpIcon, History, ChevronRight, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TerminationRequestModal from './TerminationRequestModal';
import DirectDepositModal from './DirectDepositModal';
import { performanceReviewService, CompensationHistory } from '../../utils/performanceReviewService';
import { apiRequest } from '../../lib/queryClient';
import { formatPhoneNumber, formatZipCode, EMERGENCY_CONTACT_RELATIONSHIPS } from '../../lib/formatters';

interface Employee {
  id: string; // Profile or display ID
  employeeRecordId?: string; // Employees table UUID for backend updates
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Remote';
  startDate: string;
  location: string;
  manager: string;
  managerId?: string;
  salary: string;
  employeeId: string;
  profileImage?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact: {
    firstName: string;
    lastName: string;
    middleName?: string;
    relationship: string;
    phone: string;
  };
  skills: string[];
  certifications: string[];
  performanceRating: number;
  ptoBalance: number;
  sickLeaveBalance: number;
}

interface ComprehensiveEmployeeProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
}

const ComprehensiveEmployeeProfileModal: React.FC<ComprehensiveEmployeeProfileModalProps> = ({ isOpen, onClose, employee }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [showDirectDepositModal, setShowDirectDepositModal] = useState(false);
  const [compensationHistory, setCompensationHistory] = useState<CompensationHistory[]>([]);
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [isLoadingCompensation, setIsLoadingCompensation] = useState(false);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [managerName, setManagerName] = useState<string>('Not assigned');
  const [availableManagers, setAvailableManagers] = useState<Array<{ id: string; name: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Determine if current user has HR or admin privileges (authoritative check)
  // Based on backend canManageAnnouncements logic: department === 'HR' OR role === 'Product Owner'
  const isHRUser = user?.department === 'HR' || user?.role === 'Product Owner';
  
  // For compatibility with existing code
  const canTerminateEmployees = isHRUser;

  // Fallback employee data for when no employee prop is provided
  const fallbackEmployee: Employee = React.useMemo(() => ({
    id: '124',
    employeeRecordId: '124', // Fallback - same as id for mock employee
    name: 'Jennifer Martinez',
    email: 'jennifer.martinez@company.com',
    phone: '+1 (555) 124-0001',
    department: 'Customer Service',
    role: 'Customer Service Representative',
    status: 'Active' as const,
    startDate: '2023-06-15',
    location: 'Phoenix, AZ',
    manager: 'Customer Service Manager',
    salary: '$18.50/hr',
    employeeId: 'EMP124',
    profileImage: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    emergencyContact: {
      firstName: 'Carlos',
      lastName: 'Martinez',
      middleName: '',
      relationship: 'Spouse',
      phone: '(555) 987-6543'
    },
    skills: ['Customer Service', 'Problem Solving', 'Communication', 'CRM Software'],
    certifications: ['Customer Service Excellence', 'Conflict Resolution'],
    performanceRating: 4.1,
    ptoBalance: 16,
    sickLeaveBalance: 4
  }), []);

  // Derive display employee from prop - this always reflects the current employee
  const displayEmployee = React.useMemo(() => employee ?? fallbackEmployee, [employee, fallbackEmployee]);

  // Normalize employee data to ensure optional arrays are initialized
  const normalizeEmployee = (emp: Employee): Employee => ({
    ...emp,
    skills: emp.skills ?? [],
    certifications: emp.certifications ?? [],
    emergencyContact: emp.emergencyContact ?? {
      firstName: '',
      lastName: '',
      middleName: '',
      relationship: '',
      phone: ''
    },
  });

  const [formData, setFormData] = useState<Employee>(normalizeEmployee(displayEmployee));

  // Update formData when displayEmployee changes (e.g., when a different employee is selected)
  React.useEffect(() => {
    setFormData(normalizeEmployee(displayEmployee));
  }, [displayEmployee]);

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

  // Check if viewing own profile (compare emails)
  const isViewingOwnProfile = user?.email === formData.email;

  // Show terminate button only if: user has termination privileges AND not viewing their own profile
  const showTerminateButton = canTerminateEmployees && !isViewingOwnProfile;

  const handleSave = async () => {
    // CRITICAL FIX: Use the correct IDs for each table
    // - Employee table ID: formData.employeeRecordId (or fallback to formData.id for employee record)
    // - Profile table ID: formData.userId (this references profiles.id)
    const employeeTableId = formData.employeeRecordId || formData.id;
    const profileId = formData.userId; // FIXED: Use userId which references profiles.id
    
    // Debug logging to help track ID usage
    console.log("=== HandleSave ID Debug ===");
    console.log("formData.id (employee record ID):", formData.id);
    console.log("formData.userId (profile ID):", formData.userId);
    console.log("formData.employeeRecordId:", formData.employeeRecordId);
    console.log("Using employeeTableId for employees table:", employeeTableId);
    console.log("Using profileId for profiles table:", profileId);
    console.log("=========================");
    
    if (!employeeTableId) {
      console.error("Employee record ID is missing");
      alert("Error: Employee record ID is missing. Cannot save changes.");
      return;
    }

    if (!profileId) {
      console.error("Profile ID (userId) is missing");
      alert("Error: Profile ID is missing. Cannot save changes.");
      return;
    }

    setIsSaving(true);
    try {
      // Validate required address fields
      if (formData.address || formData.city || formData.state || formData.zipCode) {
        if (!formData.address || !formData.city || !formData.state || !formData.zipCode) {
          alert("All address fields (Street, City, State, ZIP Code) are required for tax and payroll compliance.");
          setIsSaving(false);
          return;
        }

        // Validate ZIP code format
        const zipPattern = /^[0-9]{5}(-[0-9]{4})?$/;
        if (!zipPattern.test(formData.zipCode)) {
          alert("Please enter a valid ZIP code (e.g., 12345 or 12345-6789)");
          setIsSaving(false);
          return;
        }

        // AI-powered address validation
        try {
          const aiValidation = await apiRequest('/api/ai/validate-address', {
            method: 'POST',
            body: JSON.stringify({
              city: formData.city,
              state: formData.state,
              zipCode: formData.zipCode
            })
          });

          if (!aiValidation.valid) {
            const confirmProceed = confirm(
              `⚠️ Address Validation Warning:\n\n${aiValidation.message}\n\nDo you want to proceed anyway?`
            );
            if (!confirmProceed) {
              setIsSaving(false);
              return;
            }
          }
        } catch (aiError) {
          console.error('AI validation error:', aiError);
          // Continue even if AI validation fails - don't block user
          console.log('Proceeding without AI validation');
        }
      }

      // Prepare employee table updates (managerId only)
      const employeeUpdateData: { managerId?: string | null } = {};
      
      // Only include managerId if it was explicitly changed
      if (formData.managerId !== undefined && formData.managerId !== null && formData.managerId !== '') {
        employeeUpdateData.managerId = formData.managerId;
      } else if (formData.managerId === '' || formData.managerId === null) {
        employeeUpdateData.managerId = null;
      }

      // Check if address fields have changed
      const addressChanged = 
        formData.address !== displayEmployee.address ||
        formData.city !== displayEmployee.city ||
        formData.state !== displayEmployee.state ||
        formData.zipCode !== displayEmployee.zipCode;

      // Determine if user can directly update addresses
      const canDirectlyUpdateAddress = isHRUser || canTerminateEmployees;

      // Prepare profile table updates - WHITELIST ONLY VALID SCHEMA FIELDS
      const profileUpdateData: any = {};
      
      // Handle address fields based on user role
      if (addressChanged && !canDirectlyUpdateAddress) {
        // Non-HR users: Create address change request
        try {
          await apiRequest('/api/address-change-requests', {
            method: 'POST',
            body: JSON.stringify({
              profileId,
              oldAddress: displayEmployee.address || '',
              oldCity: displayEmployee.city || '',
              oldState: displayEmployee.state || '',
              oldZipCode: displayEmployee.zipCode || '',
              newAddress: formData.address,
              newCity: formData.city,
              newState: formData.state,
              newZipCode: formData.zipCode
            })
          });
          console.log("Address change request created successfully");
          
          // Show temporary success message
          setIsEditing(false);
          alert("✅ Address change submitted for review and approval!\n\nYour address update has been sent to HR for verification. You'll be notified once it's processed.");
          setIsSaving(false);
          
          // Close modal and trigger refresh
          if (onClose) onClose();
          return; // Exit early since we're not doing direct updates
        } catch (requestError: any) {
          console.error("Failed to create address change request:", requestError);
          throw new Error(`Failed to submit address change request: ${requestError.message || 'Unknown error'}`);
        }
      } else if (canDirectlyUpdateAddress) {
        // HR users: Save address directly
        if (formData.address) profileUpdateData.address = formData.address;
        if (formData.city) profileUpdateData.city = formData.city;
        if (formData.state) profileUpdateData.state = formData.state;
        if (formData.zipCode) profileUpdateData.zipCode = formData.zipCode;
      }

      // Add other valid profile fields that may have changed
      // CRITICAL: Only include fields that exist in the profiles table schema
      if (formData.phone !== undefined && formData.phone !== displayEmployee.phone) {
        profileUpdateData.phone = formData.phone;
      }
      
      if (formData.profileImage !== undefined && formData.profileImage !== displayEmployee.profileImage) {
        profileUpdateData.profilePicture = formData.profileImage; // Note: DB column is profilePicture
      }

      // Emergency contact fields - structured for third-party integrations
      if (formData.emergencyContact) {
        const ec = formData.emergencyContact;
        if (ec.firstName !== undefined) profileUpdateData.emergencyContactFirstName = ec.firstName || null;
        if (ec.lastName !== undefined) profileUpdateData.emergencyContactLastName = ec.lastName || null;
        if (ec.middleName !== undefined) profileUpdateData.emergencyContactMiddleName = ec.middleName || null;
        if (ec.relationship !== undefined) profileUpdateData.emergencyContactRelationship = ec.relationship || null;
        if (ec.phone !== undefined) profileUpdateData.emergencyContactPhone = ec.phone || null;
      }

      // Debug logging
      console.log("Updating employee table with:", employeeUpdateData);
      console.log("Updating profile table with:", profileUpdateData);

      // Update employee table if needed
      if (Object.keys(employeeUpdateData).length > 0) {
        try {
          await apiRequest(`/api/employees/${employeeTableId}`, {
            method: 'PATCH',
            body: JSON.stringify(employeeUpdateData)
          });
          console.log("Employee table updated successfully");
        } catch (employeeUpdateError: any) {
          console.error("Failed to update employee table:", employeeUpdateError);
          throw new Error(`Failed to update manager assignment: ${employeeUpdateError.message || 'Unknown error'}`);
        }
      }

      // Update profile table if needed
      if (Object.keys(profileUpdateData).length > 0) {
        try {
          await apiRequest(`/api/profiles/${profileId}`, {
            method: 'PATCH',
            body: JSON.stringify(profileUpdateData)
          });
          console.log("Profile table updated successfully");
        } catch (profileUpdateError: any) {
          console.error("Failed to update profile table:", profileUpdateError);
          throw new Error(`Failed to update profile information: ${profileUpdateError.message || 'Unknown error'}`);
        }
      }

      setIsEditing(false);
      alert("✅ Profile updated successfully!");
      
      // Trigger refresh
      if (employee) {
        window.dispatchEvent(new CustomEvent('employee-updated', { detail: { employeeId: employeeTableId } }));
      }
    } catch (error) {
      console.error('Error saving employee data:', error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };


  const handleTerminationRequest = () => {
    setShowTerminationModal(true);
  };

  const handleTerminationRequestSubmitted = (request: any) => {
    console.log('Termination request submitted:', request);
    setShowTerminationModal(false);
    // In a real app, this would update the employee status or trigger other workflows
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5 MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    try {
      setUploading(true);

      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Send base64 data to backend
      const uploadResponse = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          base64Data,
        }),
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const { imageUrl } = await uploadResponse.json();

      setFormData({ ...formData, profileImage: imageUrl });
      setShowImageUpload(false);
      setUploadError(null);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleProfilePictureSelect = (pictureUrl: string) => {
    setFormData({ ...formData, profileImage: pictureUrl });
    setShowImageUpload(false);
  };

  const mockProfilePictures = [
    'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'personal', label: 'Personal Info' },
    { id: 'employment', label: 'Employment' },
    { id: 'payBenefits', label: 'Pay & Benefits' },
    { id: 'schedule', label: 'Schedule & Hours' },
    { id: 'timeTracking', label: 'Time Tracking' },
    { id: 'performance', label: 'Performance & Development' },
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

  useEffect(() => {
    if ((activeTab === 'payBenefits' || activeTab === 'performance')) {
      loadEmployeeData();
    }
  }, [activeTab, user?.id]);

  // Fetch manager name when component mounts or when employee/managerId changes
  useEffect(() => {
    const fetchManagerName = async () => {
      const managerId = employee?.managerId || formData.managerId;
      if (managerId) {
        try {
          // Fetch from employees directory and find manager by employee table ID
          const response = await fetch('/api/employees/directory');
          if (response.ok) {
            const employees = await response.json();
            const manager = employees.find((emp: any) => emp.employeeRecordId === managerId);
            if (manager && manager.profile) {
              const name = `${manager.profile.firstName || ''} ${manager.profile.lastName || ''}`.trim();
              setManagerName(name || 'Not assigned');
              setFormData(prev => ({ ...prev, manager: name || 'Not assigned' }));
            } else {
              setManagerName('Not assigned');
            }
          } else {
            setManagerName('Not assigned');
          }
        } catch (error) {
          console.error('Error fetching manager name:', error);
          setManagerName('Not assigned');
        }
      } else {
        setManagerName('Not assigned');
        setFormData(prev => ({ ...prev, manager: 'Not assigned' }));
      }
    };

    fetchManagerName();
  }, [employee, formData.managerId]);

  // Fetch available employees for manager dropdown when entering edit mode
  useEffect(() => {
    const fetchAvailableManagers = async () => {
      if (isEditing) {
        try {
          const response = await fetch('/api/employees/directory');
          if (response.ok) {
            const employees = await response.json();
            const managers = employees
              .filter((emp: any) => emp.employeeRecordId !== formData.employeeRecordId) // Don't allow selecting self as manager
              .map((emp: any) => ({
                id: emp.employeeRecordId, // Use employee table ID for managerId foreign key
                name: emp.profile ? `${emp.profile.firstName || ''} ${emp.profile.lastName || ''}`.trim() : 'Unknown'
              }))
              .filter((manager: any) => manager.name !== 'Unknown');
            setAvailableManagers(managers);
          }
        } catch (error) {
          console.error('Error fetching employees for manager dropdown:', error);
        }
      }
    };

    fetchAvailableManagers();
  }, [isEditing, formData.employeeRecordId]);

  const loadEmployeeData = async () => {
    // Use employee.id if provided (when viewing another employee), otherwise use user.id (when viewing own profile)
    const employeeId = employee?.id || user?.id;
    if (!employeeId) return;

    if (activeTab === 'payBenefits') {
      setIsLoadingCompensation(true);
      try {
        const history = await performanceReviewService.getCompensationHistory(employeeId);
        setCompensationHistory(history || []);
      } catch (error) {
        console.error('Error loading compensation history:', error);
      } finally {
        setIsLoadingCompensation(false);
      }
    }

    if (activeTab === 'performance') {
      setIsLoadingPerformance(true);
      try {
        const history = await performanceReviewService.getPerformanceHistory(employeeId);
        setPerformanceHistory(history || []);
      } catch (error) {
        console.error('Error loading performance history:', error);
      } finally {
        setIsLoadingPerformance(false);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-white dark:bg-gray-800 dark:bg-gray-800 z-50 overflow-auto">
        <div className="min-h-screen">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 sticky top-0 z-10 shadow-lg">
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
                  {isHRUser && (
                    <button
                      onClick={() => setShowImageUpload(true)}
                      className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 hover:bg-blue-600 transition-colors"
                      title="Upload profile picture (HR only)"
                      data-testid="button-hr-upload-profile-picture"
                    >
                      <Camera className="h-3 w-3 text-white" />
                    </button>
                  )}
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
                      disabled={isSaving}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-save-profile"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-cancel-edit"
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
                      onClick={handleTerminationRequest}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                      title="Only available to HR staff for other employees"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Terminate
                    </button>
                  )}
                  </>
                )}
                <button
                  onClick={onClose}
                  className="text-blue-100 hover:text-white transition-colors"
                  title="Press Esc to close"
                  data-testid="button-close-modal"
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

          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800">
            <div className="max-w-7xl mx-auto p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Hourly Employee Dashboard */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Clock className="h-6 w-6 text-orange-600 mr-2" />
                      <h3 className="text-lg font-semibold text-orange-900">Hourly Employee Dashboard</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {/* Hourly Rate */}
                      <div className="text-center">
                        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                          <DollarSign className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">Hourly Rate</p>
                          <p className="text-2xl font-bold text-blue-600">$18.5/hr</p>
                        </div>
                      </div>
                      
                      {/* Performance */}
                      <div className="text-center">
                        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                          <Star className="h-8 w-8 text-green-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">Performance</p>
                          <p className="text-2xl font-bold text-green-600">4.1/5</p>
                        </div>
                      </div>
                      
                      {/* PTO Balance */}
                      <div className="text-center">
                        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                          <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">PTO Balance</p>
                          <p className="text-2xl font-bold text-purple-600">16 days</p>
                        </div>
                      </div>
                      
                      {/* Tenure */}
                      <div className="text-center">
                        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                          <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">Tenure</p>
                          <p className="text-2xl font-bold text-yellow-600">2 years</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Week Stats */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Current Week</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Hours Worked</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Scheduled:</span>
                            <span className="font-medium text-purple-600">40h</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Worked:</span>
                            <span className="font-medium text-blue-600">38.5h</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Overtime:</span>
                            <span className="font-medium text-orange-600">0h</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Clock Status</h5>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-50 dark:bg-green-900/200 rounded-full mr-2 animate-pulse"></div>
                            <span className="text-green-800 font-medium">Clocked In</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p>Last Clock-In: 08:00</p>
                            <p>Location: Phoenix, AZ</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Compensation</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Hourly Rate:</span>
                            <span className="font-medium text-green-600">$18.5/hr</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">OT Rate:</span>
                            <span className="font-medium text-orange-600">$27.75/hr</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Est. Annual:</span>
                            <span className="font-medium text-blue-600">$38,480</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Weekly Gross:</span>
                            <span className="font-medium text-green-600">$712.25</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
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
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            setFormData({ ...formData, phone: formatted });
                          }}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="(555) 555-5555"
                          maxLength={14}
                          data-testid="input-phone"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white dark:text-white">{formData.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
                        Work Location
                        {isEditing && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Contact HR to change)</span>}
                      </label>
                      <p className="text-gray-900 dark:text-white dark:text-white">{formData.location}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Address Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Street Address <span className="text-red-500">*</span>
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.address || ''}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            required
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="123 Main St, Apt 4B"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white">{formData.address || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          City <span className="text-red-500">*</span>
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.city || ''}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            required
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter city name"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white">{formData.city || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          State <span className="text-red-500">*</span>
                        </label>
                        {isEditing ? (
                          <select
                            value={formData.state || ''}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            required
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Select State</option>
                            {['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'].map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-gray-900 dark:text-white">{formData.state || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          ZIP Code <span className="text-red-500">*</span>
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.zipCode || ''}
                            onChange={(e) => {
                              const formatted = formatZipCode(e.target.value);
                              setFormData({ ...formData, zipCode: formatted });
                            }}
                            required
                            maxLength={10}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="12345 or 12345-6789"
                            data-testid="input-zipcode"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white">{formData.zipCode || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                    {isEditing && formData.city && formData.state && formData.zipCode && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                        💡 AI will verify this address matches {formData.city}, {formData.state} when you save
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.emergencyContact.firstName}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              emergencyContact: { ...formData.emergencyContact, firstName: e.target.value }
                            })}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="First name"
                            data-testid="input-emergency-contact-first-name"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white" data-testid="text-emergency-contact-first-name">{formData.emergencyContact.firstName || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Middle Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.emergencyContact.middleName || ''}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              emergencyContact: { ...formData.emergencyContact, middleName: e.target.value }
                            })}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Optional"
                            data-testid="input-emergency-contact-middle-name"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white" data-testid="text-emergency-contact-middle-name">{formData.emergencyContact.middleName || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.emergencyContact.lastName}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              emergencyContact: { ...formData.emergencyContact, lastName: e.target.value }
                            })}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Last name"
                            data-testid="input-emergency-contact-last-name"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white" data-testid="text-emergency-contact-last-name">{formData.emergencyContact.lastName || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship</label>
                        {isEditing ? (
                          <select
                            value={formData.emergencyContact.relationship}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                            })}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            data-testid="select-emergency-contact-relationship"
                          >
                            <option value="">Select relationship</option>
                            {EMERGENCY_CONTACT_RELATIONSHIPS.map((rel) => (
                              <option key={rel} value={rel}>{rel}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-gray-900 dark:text-white" data-testid="text-emergency-contact-relationship">{formData.emergencyContact.relationship || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={formData.emergencyContact.phone}
                            onChange={(e) => {
                              const formatted = formatPhoneNumber(e.target.value);
                              setFormData({ 
                                ...formData, 
                                emergencyContact: { ...formData.emergencyContact, phone: formatted }
                              });
                            }}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="(555) 555-5555"
                            maxLength={14}
                            data-testid="input-emergency-contact-phone"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white" data-testid="text-emergency-contact-phone">{formData.emergencyContact.phone || 'Not provided'}</p>
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
                          <option value="Customer Service">Customer Service</option>
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
                        <select
                          value={formData.managerId || ''}
                          onChange={(e) => {
                            const selectedManagerId = e.target.value;
                            const selectedManager = availableManagers.find(m => m.id === selectedManagerId);
                            console.log("Manager selected:", { selectedManagerId, selectedManager });
                            setFormData({ 
                              ...formData, 
                              managerId: selectedManagerId || null,
                              manager: selectedManager?.name || 'Not assigned'
                            });
                          }}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          data-testid="select-manager"
                        >
                          <option value="">No Manager</option>
                          {availableManagers.map((manager) => (
                            <option key={manager.id} value={manager.id}>
                              {manager.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-gray-900 dark:text-white dark:text-white">{formData.manager || managerName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Start Date</label>
                      <p className="text-gray-900 dark:text-white dark:text-white">{new Date(formData.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Hourly Rate</label>
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

              {/* Schedule & Hours Tab */}
              {activeTab === 'schedule' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Schedule & Hours</h3>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-4">Current Week Schedule</h4>
                    <div className="grid grid-cols-7 gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                        const hours = index < 5 ? '8h' : index === 5 ? '4h' : 'Off';
                        const time = index < 5 ? '8:00-16:00' : index === 5 ? '8:00-12:00' : '';
                        
                        return (
                          <div key={day} className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-3 text-center border">
                            <p className="font-medium text-gray-900 dark:text-white dark:text-white text-sm">{day}</p>
                            <p className="text-blue-600 font-bold">{hours}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{time}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Weekly Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Scheduled Hours:</span>
                          <span className="font-medium text-purple-600">40h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Hours Worked:</span>
                          <span className="font-medium text-blue-600">38.5h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Overtime:</span>
                          <span className="font-medium text-orange-600">0h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Break Time:</span>
                          <span className="font-medium text-green-600">5h</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Attendance</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">On-Time Rate:</span>
                          <span className="font-medium text-green-600">95%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Absences (YTD):</span>
                          <span className="font-medium text-yellow-600">2 days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Tardiness (YTD):</span>
                          <span className="font-medium text-red-600">3 times</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Tracking Tab */}
              {activeTab === 'timeTracking' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Time Tracking History</h3>
                  
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-b">
                      <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">Recent Time Entries</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Break</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {[
                            { date: '2025-01-20', clockIn: '08:00', clockOut: '16:30', break: '12:00-13:00', hours: 7.5, status: 'Approved' },
                            { date: '2025-01-21', clockIn: '08:15', clockOut: '16:45', break: '12:30-13:30', hours: 7.5, status: 'Approved' },
                            { date: '2025-01-22', clockIn: '08:00', clockOut: '16:30', break: '12:00-13:00', hours: 7.5, status: 'Pending' },
                            { date: '2025-01-23', clockIn: '08:00', clockOut: '16:30', break: '12:00-13:00', hours: 7.5, status: 'Pending' }
                          ].map((entry, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:bg-gray-900">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">
                                {entry.date}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">
                                {entry.clockIn}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">
                                {entry.clockOut}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">
                                {entry.break}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white dark:text-white">
                                {entry.hours}h
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  entry.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {entry.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Pay & Benefits Tab */}
              {activeTab === 'payBenefits' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Pay & Benefits</h3>

                  {/* Current Compensation */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Current Compensation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Salary</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{formData.salary}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Employment Type</p>
                        <p className="text-lg font-medium text-gray-900 dark:text-white dark:text-white">Full-time</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pay Frequency</p>
                        <p className="text-lg font-medium text-gray-900 dark:text-white dark:text-white">Bi-weekly</p>
                      </div>
                    </div>
                  </div>

                  {/* Compensation History */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b flex items-center justify-between">
                      <div className="flex items-center">
                        <History className="h-5 w-5 text-gray-500 mr-2" />
                        <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">Compensation History</h4>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{compensationHistory.length} changes</span>
                    </div>

                    {isLoadingCompensation ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading compensation history...</p>
                      </div>
                    ) : compensationHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Previous Salary</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Salary</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {compensationHistory.map((change) => (
                              <tr key={change.id} className="hover:bg-gray-50 dark:bg-gray-900">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">
                                  {new Date(change.effective_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">
                                  ${change.old_salary.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                  ${change.new_salary.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                                    <span className="text-sm font-medium text-green-600">
                                      +${change.change_amount.toLocaleString()} ({change.change_percentage.toFixed(1)}%)
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">
                                  {change.reason}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                  {change.approved_by_executive ? 'Executive' : change.approved_by_hr ? 'HR' : 'Manager'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No compensation changes on record</p>
                      </div>
                    )}
                  </div>

                  {/* Benefits Summary */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Benefits Enrollment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white dark:text-white">Health Insurance</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Premium Plan</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white dark:text-white">Dental Insurance</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Standard Plan</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white dark:text-white">Vision Insurance</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Standard Plan</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white dark:text-white">401(k)</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">5% contribution</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance & Development Tab */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Performance & Development</h3>

                  {/* Current Performance Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                      <h4 className="font-medium text-gray-900 dark:text-white dark:text-white mb-3 flex items-center">
                        <Star className="h-5 w-5 text-purple-600 mr-2" />
                        Current Rating
                      </h4>
                      <div className="flex items-center">
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-6 w-6 ${
                                star <= formData.performanceRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-3 text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{formData.performanceRating}/5.0</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Last review: {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border">
                      <h4 className="font-medium text-gray-900 dark:text-white dark:text-white mb-3">Total Reviews</h4>
                      <p className="text-3xl font-bold text-blue-600">{performanceHistory.length}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Completed reviews</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border">
                      <h4 className="font-medium text-gray-900 dark:text-white dark:text-white mb-3">Average Rating</h4>
                      <p className="text-3xl font-bold text-green-600">
                        {performanceHistory.length > 0
                          ? (performanceHistory.reduce((sum, r) => sum + (r.final_rating || 0), 0) / performanceHistory.length).toFixed(1)
                          : '0.0'
                        }
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Career average</p>
                    </div>
                  </div>

                  {/* Performance Review History */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b flex items-center justify-between">
                      <div className="flex items-center">
                        <Award className="h-5 w-5 text-gray-500 mr-2" />
                        <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">Review History</h4>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{performanceHistory.length} reviews</span>
                    </div>

                    {isLoadingPerformance ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading performance history...</p>
                      </div>
                    ) : performanceHistory.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {performanceHistory.map((review) => (
                          <div key={review.id} className="p-6 hover:bg-gray-50 dark:bg-gray-900">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h5 className="font-semibold text-gray-900 dark:text-white dark:text-white">{review.cycle_name}</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Review Period: {review.review_period}</p>
                                <p className="text-sm text-gray-500">Completed: {new Date(review.review_date).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center justify-end mb-1">
                                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 mr-1" />
                                  <span className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">{review.final_rating?.toFixed(1) || 'N/A'}</span>
                                </div>
                                {review.compensation_change_percentage && (
                                  <div className="flex items-center text-sm text-green-600 font-medium">
                                    <TrendingUpIcon className="h-4 w-4 mr-1" />
                                    +{review.compensation_change_percentage.toFixed(1)}% increase
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                                <p className="text-xs font-medium text-blue-900 mb-1">Self Rating</p>
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                                  <span className="font-semibold text-gray-900 dark:text-white dark:text-white">{review.self_rating?.toFixed(1) || 'N/A'}</span>
                                </div>
                              </div>
                              <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-3">
                                <p className="text-xs font-medium text-purple-900 mb-1">Manager Rating</p>
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                                  <span className="font-semibold text-gray-900 dark:text-white dark:text-white">{review.manager_rating?.toFixed(1) || 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            {review.key_achievements && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Key Achievements</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{review.key_achievements}</p>
                              </div>
                            )}

                            {review.goals_next_period && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Goals for Next Period</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{review.goals_next_period}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No performance reviews completed yet</p>
                      </div>
                    )}
                  </div>

                  {/* Time Off Balances */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Time Off Balances</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">PTO Available</p>
                        <p className="text-2xl font-bold text-green-600">{formData.ptoBalance} days</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sick Leave</p>
                        <p className="text-2xl font-bold text-blue-600">{formData.sickLeaveBalance} days</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Personal Days</p>
                        <p className="text-2xl font-bold text-purple-600">3 days</p>
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
                      { name: 'I-9 Form', status: 'Complete', date: '2023-06-15', action: null },
                      { name: 'W-4 Form', status: 'Complete', date: '2023-06-15', action: null },
                      { name: 'Direct Deposit Authorization', status: 'Complete', date: '2023-06-16', action: 'direct-deposit' },
                      { name: 'Benefits Enrollment', status: 'Complete', date: '2023-06-20', action: null },
                      { name: 'Emergency Contact Form', status: 'Complete', date: '2023-06-15', action: null }
                    ].map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center">
                          {doc.action === 'direct-deposit' ? (
                            <CreditCard className="h-5 w-5 text-green-600 mr-3" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-400 mr-3" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white dark:text-white">{doc.name}</p>
                            <p className="text-sm text-gray-500">Completed: {new Date(doc.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {doc.status}
                          </span>
                          {doc.action === 'direct-deposit' && (
                            <button
                              onClick={() => setShowDirectDepositModal(true)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Manage
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Termination Request Modal */}
      {showTerminationModal && (
        <TerminationRequestModal
          isOpen={showTerminationModal}
          onClose={() => setShowTerminationModal(false)}
          employee={{
            id: formData.id,
            name: formData.name,
            email: formData.email,
            department: formData.department,
            role: formData.role,
            manager: formData.manager,
            employeeId: formData.employeeId
          }}
          onRequestSubmitted={handleTerminationRequestSubmitted}
        />
      )}

      {/* Direct Deposit Modal */}
      {showDirectDepositModal && (
        <DirectDepositModal
          isOpen={showDirectDepositModal}
          onClose={() => setShowDirectDepositModal(false)}
        />
      )}

      {/* Profile Picture Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upload Employee Profile Picture</h3>
              <button
                onClick={() => {
                  setShowImageUpload(false);
                  setUploadError(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                data-testid="button-close-hr-profile-picture-modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Upload Error Message */}
              {uploadError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center">
                  <X className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
                  <span className="text-red-800 dark:text-red-200 text-sm">{uploadError}</span>
                </div>
              )}

              {/* Upload Your Own Picture */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Upload Profile Picture</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Maximum file size: 5 MB • Accepted formats: JPG, PNG, GIF, WebP
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  data-testid="input-hr-profile-picture-file"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  data-testid="button-hr-upload-employee-picture"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Choose File to Upload
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">or select from below</span>
                </div>
              </div>
              
              {/* Select from Options */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Select a Picture</h4>
                <div className="grid grid-cols-3 gap-4">
                  {mockProfilePictures.map((pictureUrl, index) => (
                    <button
                      key={index}
                      onClick={() => handleProfilePictureSelect(pictureUrl)}
                      disabled={uploading}
                      className="relative group disabled:opacity-50"
                      data-testid={`button-hr-select-preset-picture-${index}`}
                    >
                      <img
                        src={pictureUrl}
                        alt={`Profile option ${index + 1}`}
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 group-hover:border-blue-500 transition-colors"
                      />
                      <div className="absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all"></div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Remove Picture Option */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setFormData({ ...formData, profileImage: '' });
                    setShowImageUpload(false);
                    setUploadError(null);
                  }}
                  disabled={uploading}
                  className="w-full text-center py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                  data-testid="button-hr-remove-profile-picture"
                >
                  Remove current picture (use initials)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ComprehensiveEmployeeProfileModal;