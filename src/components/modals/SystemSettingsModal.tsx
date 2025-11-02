import React, { useState } from 'react';
import { X, Building, Users, Briefcase, Settings, Bell, Mail, Smartphone, Monitor, Clock, UserPlus, Trash2, Plus, Save, CheckCircle, FileText } from 'lucide-react';
import ChangeLogTab from './ChangeLogTab';

interface SystemSettingsModalProps {
  onClose?: () => void;
  initialTab?: string;
}

const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({ onClose, initialTab = 'company' }) => {
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Company Info State
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

  // Departments State
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

  // Job Titles State
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

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
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
  });

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
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
  });

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
    // Also remove job titles from this department
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

  const handleSaveNotifications = () => {
    console.log('Saving notification settings:', notificationSettings);
    setNotification({
      type: 'success',
      message: 'Notification settings saved successfully!'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveSystemSettings = () => {
    console.log('Saving system settings:', systemSettings);
    setNotification({
      type: 'success',
      message: 'System settings saved successfully!'
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
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'changelog', label: 'Change Log', icon: FileText },
    { id: 'system', label: 'System Settings', icon: Settings }
  ];

  return (
    <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center">
            <Settings className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">System Settings</h2>
              <p className="text-blue-100">Configure company and system preferences</p>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
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
                        ? 'bg-blue-100 text-blue-700 font-medium shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto max-h-96">
            <div className="p-6">
              {/* Company Info Tab */}
              {activeTab === 'company' && (
                <div className="max-w-4xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Company Information</h3>
                    <button
                      onClick={handleSaveCompanyInfo}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200">
                    <p className="text-blue-800 text-sm">
                      Update your company's basic information. This information is used throughout the system for reports, communications, and legal documentation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={companyInfo.name}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Industry</label>
                      <select
                        value={companyInfo.industry}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Technology">Technology</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Finance">Finance</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Retail">Retail</option>
                        <option value="Education">Education</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Address</label>
                      <input
                        type="text"
                        value={companyInfo.address}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={companyInfo.phone}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">City</label>
                      <input
                        type="text"
                        value={companyInfo.city}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={companyInfo.email}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">State</label>
                      <input
                        type="text"
                        value={companyInfo.state}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, state: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Website</label>
                      <input
                        type="url"
                        value={companyInfo.website}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">ZIP Code</label>
                      <input
                        type="text"
                        value={companyInfo.zipCode}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, zipCode: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Tax ID</label>
                      <input
                        type="text"
                        value={companyInfo.taxId}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, taxId: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Departments Tab */}
              {activeTab === 'departments' && (
                <div className="max-w-4xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Company Departments</h3>
                    <button
                      onClick={() => setShowAddDepartment(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Department
                    </button>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200">
                    <p className="text-blue-800 text-sm">
                      Manage your company's organizational departments. Each department can contain multiple job titles and employees.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {departments.map((department) => (
                      <div key={department} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 rounded-full p-2">
                              <Building className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">{department}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {getJobTitleCountByDepartment(department)} job titles
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveDepartment(department)}
                            className="text-red-600 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50 dark:bg-red-900/20"
                            title="Remove Department"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Titles Tab */}
              {activeTab === 'jobTitles' && (
                <div className="max-w-4xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Company Job Titles</h3>
                    <button
                      onClick={() => setShowAddJobTitle(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Job Title
                    </button>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200">
                    <p className="text-green-800 text-sm">
                      Manage job titles across all departments. Job titles are used for employee profiles, hiring, and organizational reporting.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {jobTitles.map((jobTitle, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-green-100 rounded-full p-2">
                              <Briefcase className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">{jobTitle.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{jobTitle.department} Department</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveJobTitle(jobTitle.title, jobTitle.department)}
                            className="text-red-600 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50 dark:bg-red-900/20"
                            title="Remove Job Title"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Job Titles by Department Overview */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Job Titles by Department</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {departments.map(department => {
                        const titleCount = getJobTitleCountByDepartment(department);
                        const departmentTitles = jobTitles.filter(jt => jt.department === department);
                        
                        return (
                          <div key={department} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-gray-900 dark:text-white dark:text-white">{department}</h5>
                              <span className="text-sm text-gray-600 dark:text-gray-400">{titleCount} titles</span>
                            </div>
                            <div className="space-y-1">
                              {departmentTitles.map((jt, idx) => (
                                <div key={idx} className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded px-2 py-1">
                                  {jt.title}
                                </div>
                              ))}
                              {titleCount === 0 && (
                                <p className="text-sm text-gray-500 italic">No job titles assigned</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="max-w-4xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Notification Settings</h3>
                    <button
                      onClick={handleSaveNotifications}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </button>
                  </div>

                  {/* Email Notifications */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Mail className="h-6 w-6 text-blue-600 mr-3" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Email Notifications</h4>
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notificationSettings.email.enabled}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            email: { ...notificationSettings.email, enabled: e.target.checked }
                          })}
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Enable Email Notifications</span>
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'leaveRequests', label: 'Leave Request Updates' },
                        { key: 'payroll', label: 'Payroll Notifications' },
                        { key: 'performance', label: 'Performance Reviews' },
                        { key: 'benefits', label: 'Benefits Updates' },
                        { key: 'announcements', label: 'Company Announcements' },
                        { key: 'training', label: 'Training & Development' },
                        { key: 'compliance', label: 'Compliance Alerts' },
                        { key: 'system', label: 'System Notifications' }
                      ].map(item => (
                        <label key={item.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={notificationSettings.email[item.key as keyof typeof notificationSettings.email] as boolean}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              email: {
                                ...notificationSettings.email,
                                [item.key]: e.target.checked
                              }
                            })}
                            disabled={!notificationSettings.email.enabled}
                            className="mr-3 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          />
                          <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* SMS Notifications */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Smartphone className="h-6 w-6 text-green-600 mr-3" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">SMS Notifications</h4>
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notificationSettings.sms.enabled}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            sms: { ...notificationSettings.sms, enabled: e.target.checked }
                          })}
                          className="mr-2 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Enable SMS Notifications</span>
                      </label>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={notificationSettings.sms.phone}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            sms: { ...notificationSettings.sms, phone: e.target.value }
                          })}
                          disabled={!notificationSettings.sms.enabled}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { key: 'urgentOnly', label: 'Urgent Alerts Only' },
                          { key: 'leaveApprovals', label: 'Leave Approvals' },
                          { key: 'payrollReady', label: 'Payroll Ready' },
                          { key: 'complianceDeadlines', label: 'Compliance Deadlines' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={notificationSettings.sms[item.key as keyof typeof notificationSettings.sms] as boolean}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                sms: {
                                  ...notificationSettings.sms,
                                  [item.key]: e.target.checked
                                }
                              })}
                              disabled={!notificationSettings.sms.enabled}
                              className="mr-3 text-green-600 focus:ring-green-500 disabled:opacity-50"
                            />
                            <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* In-App Notifications */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Monitor className="h-6 w-6 text-purple-600 mr-3" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">In-App Notifications</h4>
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notificationSettings.inApp.enabled}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            inApp: { ...notificationSettings.inApp, enabled: e.target.checked }
                          })}
                          className="mr-2 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Enable In-App Notifications</span>
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'desktop', label: 'Desktop Notifications' },
                        { key: 'sound', label: 'Sound Alerts' },
                        { key: 'badge', label: 'Badge Notifications' },
                        { key: 'popup', label: 'Popup Notifications' },
                        { key: 'digest', label: 'Daily Digest' }
                      ].map(item => (
                        <label key={item.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={notificationSettings.inApp[item.key as keyof typeof notificationSettings.inApp] as boolean}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              inApp: {
                                ...notificationSettings.inApp,
                                [item.key]: e.target.checked
                              }
                            })}
                            disabled={!notificationSettings.inApp.enabled}
                            className="mr-3 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                          />
                          <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Notification Frequency & Timing */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Clock className="h-6 w-6 text-orange-600 mr-3" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Frequency & Timing</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Notification Frequency</label>
                        <select
                          value={notificationSettings.frequency}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            frequency: e.target.value
                          })}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="hourly">Hourly Digest</option>
                          <option value="daily">Daily Digest</option>
                          <option value="weekly">Weekly Digest</option>
                        </select>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Quiet Hours</label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={notificationSettings.quietHours.enabled}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                quietHours: { ...notificationSettings.quietHours, enabled: e.target.checked }
                              })}
                              className="mr-2 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">Enable</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="time"
                            value={notificationSettings.quietHours.startTime}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              quietHours: { ...notificationSettings.quietHours, startTime: e.target.value }
                            })}
                            disabled={!notificationSettings.quietHours.enabled}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 text-sm"
                          />
                          <input
                            type="time"
                            value={notificationSettings.quietHours.endTime}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              quietHours: { ...notificationSettings.quietHours, endTime: e.target.value }
                            })}
                            disabled={!notificationSettings.quietHours.enabled}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contacts */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <UserPlus className="h-6 w-6 text-red-600 mr-3" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Emergency Contacts</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Primary Emergency Contact</label>
                        <input
                          type="email"
                          value={notificationSettings.emergencyContacts.primary}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            emergencyContacts: { ...notificationSettings.emergencyContacts, primary: e.target.value }
                          })}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="primary@company.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Secondary Emergency Contact</label>
                        <input
                          type="email"
                          value={notificationSettings.emergencyContacts.secondary}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            emergencyContacts: { ...notificationSettings.emergencyContacts, secondary: e.target.value }
                          })}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="secondary@company.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Change Log Tab */}
              {activeTab === 'changelog' && (
                <ChangeLogTab />
              )}

              {/* System Settings Tab */}
              {activeTab === 'system' && (
                <div className="max-w-4xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Advanced System Configuration</h3>
                    <button
                      onClick={handleSaveSystemSettings}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </button>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200">
                    <p className="text-blue-800 text-sm">
                      Advanced system settings including security policies, data retention settings, integration configurations, and more.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Timezone</label>
                      <select
                        value={systemSettings.timezone}
                        onChange={(e) => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Date Format</label>
                      <select
                        value={systemSettings.dateFormat}
                        onChange={(e) => setSystemSettings({ ...systemSettings, dateFormat: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Time Format</label>
                      <select
                        value={systemSettings.timeFormat}
                        onChange={(e) => setSystemSettings({ ...systemSettings, timeFormat: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="12-hour">12-hour (AM/PM)</option>
                        <option value="24-hour">24-hour</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Currency</label>
                      <select
                        value={systemSettings.currency}
                        onChange={(e) => setSystemSettings({ ...systemSettings, currency: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD (C$)</option>
                      </select>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Security & Compliance</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={systemSettings.twoFactorAuth}
                            onChange={(e) => setSystemSettings({ ...systemSettings, twoFactorAuth: e.target.checked })}
                            className="mr-3 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Require Two-Factor Authentication</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={systemSettings.auditLogging}
                            onChange={(e) => setSystemSettings({ ...systemSettings, auditLogging: e.target.checked })}
                            className="mr-3 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Enable Audit Logging</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={systemSettings.autoBackup}
                            onChange={(e) => setSystemSettings({ ...systemSettings, autoBackup: e.target.checked })}
                            className="mr-3 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Automatic Data Backup</span>
                        </label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Session Timeout</label>
                          <select
                            value={systemSettings.sessionTimeout}
                            onChange={(e) => setSystemSettings({ ...systemSettings, sessionTimeout: e.target.value })}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="15-minutes">15 minutes</option>
                            <option value="30-minutes">30 minutes</option>
                            <option value="1-hour">1 hour</option>
                            <option value="4-hours">4 hours</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Password Policy</label>
                          <select
                            value={systemSettings.passwordPolicy}
                            onChange={(e) => setSystemSettings({ ...systemSettings, passwordPolicy: e.target.value })}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="basic">Basic</option>
                            <option value="strong">Strong</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Data Retention</label>
                          <select
                            value={systemSettings.dataRetention}
                            onChange={(e) => setSystemSettings({ ...systemSettings, dataRetention: e.target.value })}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="3-years">3 years</option>
                            <option value="5-years">5 years</option>
                            <option value="7-years">7 years</option>
                            <option value="indefinite">Indefinite</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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
                    onClick={() => {
                      setShowAddDepartment(false);
                      setNewDepartment('');
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
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
                    value={newJobTitle.title}
                    onChange={(e) => setNewJobTitle({ ...newJobTitle, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Senior Product Manager"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Department</label>
                  <select
                    value={newJobTitle.department}
                    onChange={(e) => setNewJobTitle({ ...newJobTitle, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowAddJobTitle(false);
                      setNewJobTitle({ title: '', department: '' });
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddJobTitle}
                    disabled={!newJobTitle.title.trim() || !newJobTitle.department}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Job Title
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                <CheckCircle className="h-4 w-4" />
              ) : notification.type === 'error' ? (
                <X className="h-4 w-4" />
              ) : (
                <Settings className="h-4 w-4" />
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
    </>
  );
};

export default SystemSettingsModal;