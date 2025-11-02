import React, { useState } from 'react';
import { X, Shield, Users, Key, Lock, AlertTriangle, CheckCircle, Eye, Settings, UserCheck, User, Download, Mail, Clock } from 'lucide-react';

interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

interface SecurityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  ipAddress: string;
  status: 'Success' | 'Failed' | 'Warning';
  details: string;
}

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('roles');
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showEditRole, setShowEditRole] = useState(false);
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [showComplianceAudit, setShowComplianceAudit] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanningStandard, setScanningStandard] = useState('');
  const [auditResults, setAuditResults] = useState<any>(null);
  const [selectedComplianceStandard, setSelectedComplianceStandard] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  const [roleUsers, setRoleUsers] = useState<{[roleId: string]: string[]}>({
    '1': ['emma.wilson@company.com', 'sarah.johnson@company.com', 'mike.chen@company.com'],
    '2': ['john.doe@company.com', 'jane.smith@company.com', 'alex.brown@company.com'],
    '3': ['lisa.rodriguez@company.com', 'david.kim@company.com', 'maria.garcia@company.com'],
    '4': ['admin@company.com', 'it.support@company.com']
  });
  const [availableUsers] = useState([
    'emma.wilson@company.com',
    'sarah.johnson@company.com', 
    'mike.chen@company.com',
    'john.doe@company.com',
    'jane.smith@company.com',
    'alex.brown@company.com',
    'lisa.rodriguez@company.com',
    'david.kim@company.com',
    'maria.garcia@company.com',
    'admin@company.com',
    'it.support@company.com'
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

  const mockRoles: UserRole[] = [
    {
      id: '1',
      name: 'HR Manager',
      description: 'Full access to HR functions and employee data',
      permissions: ['view_employees', 'edit_employees', 'view_payroll', 'manage_benefits', 'generate_reports'],
      userCount: 3
    },
    {
      id: '2',
      name: 'Employee',
      description: 'Basic employee self-service access',
      permissions: ['view_own_profile', 'edit_own_profile', 'request_pto', 'view_paystubs'],
      userCount: 240
    },
    {
      id: '3',
      name: 'Manager',
      description: 'Team management and reporting access',
      permissions: ['view_team', 'approve_pto', 'conduct_reviews', 'view_team_reports'],
      userCount: 15
    },
    {
      id: '4',
      name: 'IT Admin',
      description: 'System administration and security management',
      permissions: ['manage_users', 'system_settings', 'security_logs', 'backup_restore'],
      userCount: 2
    }
  ];

  const mockSecurityLogs: SecurityLog[] = [
    {
      id: '1',
      timestamp: '2025-01-15T14:30:00Z',
      user: 'sarah.johnson@company.com',
      action: 'Login',
      resource: 'Dashboard',
      ipAddress: '192.168.1.100',
      status: 'Success',
      details: 'Successful login from Chrome browser'
    },
    {
      id: '2',
      timestamp: '2025-01-15T14:25:00Z',
      user: 'unknown@external.com',
      action: 'Login Attempt',
      resource: 'Authentication',
      ipAddress: '203.0.113.45',
      status: 'Failed',
      details: 'Failed login attempt - invalid credentials'
    },
    {
      id: '3',
      timestamp: '2025-01-15T14:20:00Z',
      user: 'mike.chen@company.com',
      action: 'Data Export',
      resource: 'Employee Reports',
      ipAddress: '192.168.1.105',
      status: 'Success',
      details: 'Exported employee directory report'
    },
    {
      id: '4',
      timestamp: '2025-01-15T14:15:00Z',
      user: 'admin@company.com',
      action: 'Permission Change',
      resource: 'User Management',
      ipAddress: '192.168.1.10',
      status: 'Warning',
      details: 'Modified permissions for user: david.kim@company.com'
    }
  ];

  const availablePermissions = [
    'view_employees',
    'edit_employees',
    'delete_employees',
    'view_payroll',
    'edit_payroll',
    'manage_benefits',
    'generate_reports',
    'view_own_profile',
    'edit_own_profile',
    'request_pto',
    'approve_pto',
    'view_paystubs',
    'conduct_reviews',
    'view_team',
    'view_team_reports',
    'manage_users',
    'system_settings',
    'security_logs',
    'backup_restore'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success': return 'bg-green-100 text-green-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCreateRole = () => {
    console.log('Creating role:', newRole);
    setShowCreateRole(false);
    setNewRole({ name: '', description: '', permissions: [] });
  };

  const handleEditRole = (role: UserRole) => {
    setEditingRole({ ...role });
    setShowEditRole(true);
  };

  const handleSaveEditRole = () => {
    if (editingRole) {
      console.log('Saving edited role:', editingRole);
      // In a real app, this would update the role via API
      setShowEditRole(false);
      setEditingRole(null);
    }
  };

  const handleManageUsers = (role: UserRole) => {
    setSelectedRole(role);
    setShowManageUsers(true);
  };

  const handleAddUserToRole = (userId: string) => {
    if (selectedRole) {
      setRoleUsers(prev => ({
        ...prev,
        [selectedRole.id]: [...(prev[selectedRole.id] || []), userId]
      }));
    }
  };

  const handleRemoveUserFromRole = (userId: string) => {
    if (selectedRole) {
      setRoleUsers(prev => ({
        ...prev,
        [selectedRole.id]: (prev[selectedRole.id] || []).filter(id => id !== userId)
      }));
    }
  };

  const complianceStandards = [
    {
      id: 'gdpr',
      name: 'GDPR Compliance',
      description: 'General Data Protection Regulation',
      status: 'Compliant',
      color: 'green',
      icon: CheckCircle
    },
    {
      id: 'sox',
      name: 'SOX Compliance', 
      description: 'Sarbanes-Oxley Act',
      status: 'Action Required',
      color: 'yellow',
      icon: AlertTriangle
    },
    {
      id: 'iso27001',
      name: 'ISO 27001',
      description: 'Information Security Management',
      status: 'Compliant',
      color: 'blue',
      icon: Shield
    },
    {
      id: 'encryption',
      name: 'Data Encryption',
      description: 'Data Protection Standards',
      status: 'Compliant',
      color: 'purple',
      icon: Lock
    }
  ];

  const mockAuditData = {
    gdpr: {
      score: 95,
      passed: [
        'Data processing agreements in place',
        'Privacy policies updated and accessible',
        'Employee consent recorded and documented',
        'Data subject rights procedures implemented',
        'Data breach notification process established',
        'Privacy impact assessments completed',
        'Data retention policies defined',
        'Cross-border data transfer safeguards active'
      ],
      failed: [
        'Cookie consent banner needs minor updates'
      ],
      needsAttention: [
        'Annual privacy training completion at 87% (target: 95%)',
        'Data mapping exercise due for Q2 review'
      ],
      lastAudit: '2025-01-10',
      nextAudit: '2025-04-10'
    },
    sox: {
      score: 78,
      passed: [
        'Financial controls documented',
        'Access controls reviewed and updated',
        'Segregation of duties implemented',
        'Change management procedures active',
        'IT general controls established'
      ],
      failed: [
        'Quarterly financial audit overdue by 5 days',
        'Two control deficiencies identified in payroll process'
      ],
      needsAttention: [
        'Management assessment letters pending signature',
        'External auditor recommendations need implementation',
        'Control testing documentation incomplete for Q4'
      ],
      lastAudit: '2024-12-15',
      nextAudit: '2025-03-15'
    },
    iso27001: {
      score: 92,
      passed: [
        'Information security policies current and approved',
        'Risk assessments completed and documented',
        'Incident response plan tested and active',
        'Security awareness training completed',
        'Asset inventory maintained and current',
        'Vulnerability assessments conducted',
        'Business continuity plan tested',
        'Supplier security assessments completed'
      ],
      failed: [],
      needsAttention: [
        'Annual security policy review due in 30 days',
        'Penetration testing scheduled for February',
        'Security metrics reporting needs automation'
      ],
      lastAudit: '2024-11-20',
      nextAudit: '2025-05-20'
    },
    encryption: {
      score: 98,
      passed: [
        'Data at rest encrypted with AES-256',
        'Data in transit secured with TLS 1.3',
        'Database encryption keys properly managed',
        'Backup encryption verified and tested',
        'Key rotation policies implemented',
        'Encryption key access controls active',
        'Mobile device encryption enforced',
        'Email encryption for sensitive data active'
      ],
      failed: [],
      needsAttention: [
        'Legacy system encryption upgrade scheduled for Q2',
        'Encryption key audit due in 45 days'
      ],
      lastAudit: '2025-01-05',
      nextAudit: '2025-07-05'
    }
  };

  const runComplianceAudit = async (standardId: string) => {
    console.log('Running compliance audit for:', standardId);
    setSelectedComplianceStandard(standardId);
    setShowComplianceAudit(true);
    setIsScanning(true);
    setScanProgress(0);
    
    const standard = complianceStandards.find(s => s.id === standardId);
    setScanningStandard(standard?.name || '');
    
    // Simulate scanning process
    const scanSteps = [
      'Initializing compliance scan...',
      'Checking data protection policies...',
      'Verifying access controls...',
      'Analyzing security configurations...',
      'Reviewing audit trails...',
      'Validating documentation...',
      'Generating compliance report...',
      'Finalizing results...'
    ];
    
    for (let i = 0; i <= 100; i += 12.5) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setScanProgress(i);
      if (i < scanSteps.length * 12.5) {
        setScanningStandard(scanSteps[Math.floor(i / 12.5)] || standard?.name || '');
      }
    }
    
    setIsScanning(false);
    setAuditResults(mockAuditData[standardId as keyof typeof mockAuditData]);
  };
  const handlePermissionToggle = (permission: string) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleEditPermissionToggle = (permission: string) => {
    if (editingRole) {
      setEditingRole(prev => prev ? ({
        ...prev,
        permissions: prev.permissions.includes(permission)
          ? prev.permissions.filter(p => p !== permission)
          : [...prev.permissions, permission]
      }) : null);
    }
  };
  const tabs = [
    { id: 'roles', label: 'User Roles' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'audit', label: 'Audit Logs' },
    { id: 'compliance', label: 'Compliance' }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-auto resize-both min-w-[300px] min-h-[300px]">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-red-600 to-pink-600 text-white">
          <div className="flex items-center">
            <Shield className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Security & Compliance</h2>
              <p className="text-red-100">Manage access control and security policies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-red-100 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
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
                    ? 'border-red-500 text-red-600'
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
            {/* User Roles Tab */}
            {activeTab === 'roles' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">User Roles</h3>
                  <button
                    onClick={() => setShowCreateRole(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Create Role
                  </button>
                </div>

                <div className="grid gap-6">
                  {mockRoles.map((role) => (
                    <div key={role.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">{role.name}</h4>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {role.userCount} users
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">{role.description}</p>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Permissions:</p>
                            <div className="flex flex-wrap gap-2">
                              {role.permissions.map((permission, index) => (
                                <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                  {permission.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleManageUsers(role)}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                          >
                            Manage Users
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Permission Matrix</h3>
                
                <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permission</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">HR Manager</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Manager</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Employee</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">IT Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {availablePermissions.slice(0, 10).map((permission) => (
                        <tr key={permission} className="hover:bg-gray-50 dark:bg-gray-900">
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white dark:text-white capitalize">
                            {permission.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {['view_team', 'approve_pto', 'conduct_reviews'].includes(permission) ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {['view_own_profile', 'edit_own_profile', 'request_pto'].includes(permission) ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {['manage_users', 'system_settings', 'security_logs'].includes(permission) ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Security Audit Logs</h3>
                  <div className="flex space-x-3">
                    <select className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent">
                      <option>Last 24 hours</option>
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                    </select>
                    <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                      Export Logs
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {mockSecurityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 dark:bg-gray-900">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">{log.user}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">{log.action}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">{log.resource}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">{log.ipAddress}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button className="text-red-600 hover:text-red-800 text-sm">
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Compliance Tab */}
            {activeTab === 'compliance' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Compliance Status</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {complianceStandards.map((standard) => {
                    const Icon = standard.icon;
                    const colorClasses = {
                      green: 'bg-green-50 text-green-600 border-green-200',
                      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
                      blue: 'bg-blue-50 text-blue-600 border-blue-200',
                      purple: 'bg-purple-50 text-purple-600 border-purple-200'
                    };
                    
                    return (
                      <div key={standard.id} className={`${colorClasses[standard.color as keyof typeof colorClasses]} rounded-lg p-6 border-2`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Icon className={`h-8 w-8 mr-3`} />
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">{standard.name}</h4>
                              <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 text-sm">{standard.status}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => runComplianceAudit(standard.id)}
                            className="bg-white dark:bg-gray-800 dark:bg-gray-800 text-gray-700 dark:text-gray-300 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors text-sm font-medium border cursor-pointer"
                            type="button"
                          >
                            Run Audit
                          </button>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          {standard.id === 'gdpr' && (
                            <>
                              <p>✓ Data processing agreements in place</p>
                              <p>✓ Privacy policies updated</p>
                              <p>✓ Employee consent recorded</p>
                            </>
                          )}
                          {standard.id === 'sox' && (
                            <>
                              <p>✓ Financial controls documented</p>
                              <p>⚠ Quarterly audit pending</p>
                              <p>✓ Access controls reviewed</p>
                            </>
                          )}
                          {standard.id === 'iso27001' && (
                            <>
                              <p>✓ Security policies current</p>
                              <p>✓ Risk assessments completed</p>
                              <p>✓ Incident response plan active</p>
                            </>
                          )}
                          {standard.id === 'encryption' && (
                            <>
                              <p>✓ Data at rest encrypted</p>
                              <p>✓ Data in transit secured</p>
                              <p>✓ Key management active</p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Role Modal */}
        {showCreateRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Create New Role</h3>
                <button
                  onClick={() => setShowCreateRole(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Role Name</label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., Department Manager"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe the role and its responsibilities..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3">Permissions</label>
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {availablePermissions.map((permission) => (
                      <label key={permission} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newRole.permissions.includes(permission)}
                          onChange={() => handlePermissionToggle(permission)}
                          className="mr-2 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 capitalize">
                          {permission.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateRole(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRole}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Create Role
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Role Modal */}
        {showEditRole && editingRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Edit Role: {editingRole.name}</h3>
                <button
                  onClick={() => setShowEditRole(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Role Name</label>
                  <input
                    type="text"
                    value={editingRole.name}
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={editingRole.description}
                    onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3">Permissions</label>
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {availablePermissions.map((permission) => (
                      <label key={permission} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingRole.permissions.includes(permission)}
                          onChange={() => handleEditPermissionToggle(permission)}
                          className="mr-2 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 capitalize">
                          {permission.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditRole(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditRole}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage Users Modal */}
        {showManageUsers && selectedRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Manage Users: {selectedRole.name}</h3>
                <button
                  onClick={() => setShowManageUsers(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Users */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white dark:text-white mb-3">Current Users ({roleUsers[selectedRole.id]?.length || 0})</h4>
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {(roleUsers[selectedRole.id] || []).map((userId, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border-b last:border-b-0">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white dark:text-white">{userId}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveUserFromRole(userId)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {(!roleUsers[selectedRole.id] || roleUsers[selectedRole.id].length === 0) && (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No users assigned to this role
                      </div>
                    )}
                  </div>
                </div>

                {/* Available Users */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white dark:text-white mb-3">Available Users</h4>
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {availableUsers
                      .filter(userId => !(roleUsers[selectedRole.id] || []).includes(userId))
                      .map((userId, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border-b last:border-b-0">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-white dark:text-white">{userId}</span>
                          </div>
                          <button
                            onClick={() => handleAddUserToRole(userId)}
                            className="text-green-600 hover:text-green-800 text-xs"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowManageUsers(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityModal;