import React, { useState, useMemo, useEffect } from 'react';
import { Building, Users, Briefcase, Settings, Bell, Trash2, Plus, Save, FileText, Shield, AlertTriangle } from 'lucide-react';
import ChangeLogTab from '../components/modals/ChangeLogTab';
import PermissionManagementModal from '../components/modals/PermissionManagementModal';
import CorrectionRequestModal from '../components/modals/CorrectionRequestModal';
import MFASettings from '../components/MFASettings';
import { useDashboardEscape } from '../hooks/useDashboardEscape';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

const SettingsPage: React.FC = () => {
  const [location] = useLocation();
  
  // Reactive URL query parameter parsing for tab
  const query = useMemo(() => new URLSearchParams(location.split('?')[1] ?? ''), [location]);
  const tabFromURL = query.get('tab');
  
  const [activeTab, setActiveTab] = useState('company');
  
  // Check if user is in MFA recovery mode
  const { data: recoveryStatus } = useQuery<{ inRecoveryMode: boolean; expiresAt?: string }>({
    queryKey: ['/api/mfa/recovery-status'],
    refetchInterval: 30000 // Check every 30 seconds
  });
  
  // React to URL changes for active tab and recovery mode
  useEffect(() => {
    if (tabFromURL) {
      setActiveTab(tabFromURL);
    } else if (recoveryStatus?.inRecoveryMode) {
      // Auto-open Access Control tab if in recovery mode
      setActiveTab('accessControl');
    }
  }, [tabFromURL, recoveryStatus?.inRecoveryMode]);
  
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showCorrectionRequestModal, setShowCorrectionRequestModal] = useState(false);

  // ESC key handling - close nested modals first before navigating away
  useDashboardEscape(() => {
    if (showPermissionModal) {
      setShowPermissionModal(false);
      return false;
    }
    if (showCorrectionRequestModal) {
      setShowCorrectionRequestModal(false);
      return false;
    }
    return true;
  });

  const [companyInfo, setCompanyInfo] = useState({
    name: 'HRStudio360',
    address: '123 Business Ave',
    city: 'Amherst',
    state: 'NH',
    zipCode: '03031',
    phone: '+1 (800) HR-STUDIO',
    email: 'contact@hrstudio360.com',
    website: 'https://hrstudio360.com',
    taxId: '12-3456789',
    industry: 'Technology'
  });

  const [departments, setDepartments] = useState([
    'Engineering',
    'Marketing', 
    'Sales',
    'Human Resources',
    'Finance',
    'Operations',
    'Customer Success'
  ]);
  const [newDepartment, setNewDepartment] = useState('');
  const [showAddDepartment, setShowAddDepartment] = useState(false);

  const [jobTitles, setJobTitles] = useState([
    { title: 'Software Engineer', department: 'Engineering' },
    { title: 'Senior Software Engineer', department: 'Engineering' },
    { title: 'Engineering Manager', department: 'Engineering' },
    { title: 'Product Manager', department: 'Engineering' },
    { title: 'Senior Product Manager', department: 'Engineering' },
    { title: 'Marketing Manager', department: 'Marketing' },
    { title: 'Marketing Coordinator', department: 'Marketing' },
    { title: 'Sales Rep', department: 'Sales' },
    { title: 'Sales Manager', department: 'Sales' },
    { title: 'HR Specialist', department: 'Human Resources' },
    { title: 'HR Manager', department: 'Human Resources' },
    { title: 'Financial Analyst', department: 'Finance' },
    { title: 'Operations Manager', department: 'Operations' },
    { title: 'Customer Success Manager', department: 'Customer Success' }
  ]);
  const [newJobTitle, setNewJobTitle] = useState({ title: '', department: '' });
  const [showAddJobTitle, setShowAddJobTitle] = useState(false);

  const notificationSettings = {
    email: {
      enabled: true,
      leaveRequests: true,
      payroll: true,
      performance: true,
      benefits: true,
      announcements: true,
      training: true,
      compliance: true,
      system: true
    },
    sms: {
      enabled: false,
      phone: '',
      urgentOnly: true,
      leaveApprovals: true,
      payrollReady: true,
      complianceDeadlines: true
    },
    inApp: {
      enabled: true,
      desktop: true,
      sound: true,
      badge: true,
      popup: true,
      digest: true
    },
    frequency: 'immediate',
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    },
    emergencyContacts: {
      primary: '',
      secondary: ''
    }
  };

  const systemSettings = {
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour',
    currency: 'USD',
    language: 'English',
    weekStart: 'Monday',
    fiscalYearStart: 'January',
    autoBackup: true,
    dataRetention: '7-years',
    sessionTimeout: '30-minutes',
    passwordPolicy: 'strong',
    twoFactorAuth: true,
    auditLogging: true
  };

  const handleSaveCompanyInfo = () => {
    console.log('Saving company info:', companyInfo);
    setNotification({
      type: 'success',
      message: 'Company information saved successfully!'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddDepartment = () => {
    if (newDepartment.trim() && !departments.includes(newDepartment.trim())) {
      setDepartments(prev => [...prev, newDepartment.trim()]);
      setNewDepartment('');
      setShowAddDepartment(false);
      setNotification({
        type: 'success',
        message: `Department "${newDepartment.trim()}" added successfully!`
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleRemoveDepartment = (department: string) => {
    setDepartments(prev => prev.filter(d => d !== department));
    setJobTitles(prev => prev.filter(jt => jt.department !== department));
    setNotification({
      type: 'info',
      message: `Department "${department}" and its job titles have been removed.`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddJobTitle = () => {
    if (newJobTitle.title.trim() && newJobTitle.department && 
        !jobTitles.some(jt => jt.title === newJobTitle.title.trim() && jt.department === newJobTitle.department)) {
      setJobTitles(prev => [...prev, { 
        title: newJobTitle.title.trim(), 
        department: newJobTitle.department 
      }]);
      setNewJobTitle({ title: '', department: '' });
      setShowAddJobTitle(false);
      setNotification({
        type: 'success',
        message: `Job title "${newJobTitle.title.trim()}" added successfully!`
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleRemoveJobTitle = (title: string, department: string) => {
    setJobTitles(prev => prev.filter(jt => !(jt.title === title && jt.department === department)));
    setNotification({
      type: 'info',
      message: `Job title "${title}" removed successfully.`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const getJobTitleCountByDepartment = (department: string) => {
    return jobTitles.filter(jt => jt.department === department).length;
  };

  const tabs = [
    { id: 'company', label: 'Company Info', icon: Building },
    { id: 'departments', label: 'Departments', icon: Users },
    { id: 'jobTitles', label: 'Job Titles', icon: Briefcase },
    { id: 'accessControl', label: 'Access Control', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'changelog', label: 'Change Log', icon: FileText },
    { id: 'system', label: 'System Settings', icon: Settings }
  ];

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full min-h-screen overflow-auto flex flex-col">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center">
            <Settings className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">System Settings</h2>
              <p className="text-blue-100">Configure company and system preferences</p>
            </div>
          </div>
        </div>

        {recoveryStatus?.inRecoveryMode && (
          <div className="mx-6 mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  ⚠️ Security Alert: MFA Re-enrollment Required
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  For your security, please set up two-step verification again. You must complete this before accessing other parts of the application.
                </p>
                {recoveryStatus.expiresAt && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    Recovery session expires: {new Date(recoveryStatus.expiresAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {notification && (
          <div className={`mx-6 mt-4 p-4 rounded-lg ${
            notification.type === 'success' ? 'bg-green-100 text-green-800' :
            notification.type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {notification.message}
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r bg-gray-50 dark:bg-gray-900 flex-shrink-0">
            <nav className="p-4 space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === 'company' && (
                <div className="max-w-4xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Company Information</h3>
                    <button
                      onClick={handleSaveCompanyInfo}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      data-testid="button-save-company"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-blue-800 dark:text-blue-300 text-sm">
                      Update your company's basic information. This information is used throughout the system for reports, communications, and legal documentation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={companyInfo.name}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Industry</label>
                      <input
                        type="text"
                        value={companyInfo.industry}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'departments' && (
                <div className="max-w-4xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Departments</h3>
                    <button
                      onClick={() => setShowAddDepartment(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Department
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {departments.map((department) => (
                      <div key={department} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{department}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {getJobTitleCountByDepartment(department)} job titles
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveDepartment(department)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {showAddDepartment && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <input
                        type="text"
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        placeholder="Department name"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 bg-white dark:bg-gray-900 dark:text-white"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowAddDepartment(false)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddDepartment}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'jobTitles' && (
                <div className="max-w-4xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Job Titles</h3>
                    <button
                      onClick={() => setShowAddJobTitle(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Job Title
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {jobTitles.map((jt, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{jt.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{jt.department}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveJobTitle(jt.title, jt.department)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {showAddJobTitle && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <input
                        type="text"
                        value={newJobTitle.title}
                        onChange={(e) => setNewJobTitle({ ...newJobTitle, title: e.target.value })}
                        placeholder="Job title"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 bg-white dark:bg-gray-900 dark:text-white"
                      />
                      <select
                        value={newJobTitle.department}
                        onChange={(e) => setNewJobTitle({ ...newJobTitle, department: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 bg-white dark:bg-gray-900 dark:text-white"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowAddJobTitle(false)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddJobTitle}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'accessControl' && (
                <MFASettings />
              )}

              {activeTab === 'notifications' && (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Notification Settings coming soon</p>
                </div>
              )}

              {activeTab === 'changelog' && (
                <ChangeLogTab />
              )}

              {activeTab === 'system' && (
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">System Settings coming soon</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPermissionModal && (
        <PermissionManagementModal
          isOpen={true}
          onClose={() => setShowPermissionModal(false)}
        />
      )}

      {showCorrectionRequestModal && (
        <CorrectionRequestModal
          isOpen={true}
          onClose={() => setShowCorrectionRequestModal(false)}
        />
      )}
    </>
  );
};

export default SettingsPage;
