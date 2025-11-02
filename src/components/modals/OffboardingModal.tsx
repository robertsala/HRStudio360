import React, { useState } from 'react';
import { X, UserX, CheckCircle, Clock, AlertTriangle, User, Calendar, Building, Mail, Phone, Download, Send, Plus, Edit3, Save, Filter, Search, Sparkles } from 'lucide-react';

interface OffboardingEmployee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  manager: string;
  terminationDate: string;
  lastWorkingDay: string;
  reason: string;
  status: 'Pending Approval' | 'Approved' | 'In Progress' | 'Completed';
  requestedBy: string;
  requestDate: string;
}

interface OffboardingTask {
  id: string;
  category: string;
  task: string;
  description: string;
  assignedTo: string;
  assignedRole: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Completed' | 'Blocked';
  dependencies?: string[];
  estimatedTime: string;
  completedBy?: string;
  completedDate?: string;
  notes?: string;
}

interface OffboardingTemplate {
  id: string;
  name: string;
  description: string;
  tasks: OffboardingTask[];
  isDefault: boolean;
  createdBy: string;
  createdDate: string;
  lastModified: string;
}

interface OffboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Comprehensive offboarding checklist template
const defaultOffboardingTasks: OffboardingTask[] = [
  // HR Tasks
  {
    id: 'hr-1',
    category: 'HR Administration',
    task: 'Process termination paperwork',
    description: 'Complete all required termination documentation and update HRIS',
    assignedTo: 'HR Specialist',
    assignedRole: 'HR',
    dueDate: '2025-01-29',
    priority: 'High',
    status: 'To Do',
    estimatedTime: '2 hours'
  },
  {
    id: 'hr-2',
    category: 'HR Administration',
    task: 'Calculate final pay and benefits',
    description: 'Calculate final paycheck, unused PTO, and benefit terminations',
    assignedTo: 'Payroll Specialist',
    assignedRole: 'HR',
    dueDate: '2025-01-30',
    priority: 'High',
    status: 'To Do',
    dependencies: ['hr-1'],
    estimatedTime: '1.5 hours'
  },
  {
    id: 'hr-3',
    category: 'HR Administration',
    task: 'Prepare COBRA documentation',
    description: 'Generate and send COBRA continuation paperwork if applicable',
    assignedTo: 'Benefits Administrator',
    assignedRole: 'HR',
    dueDate: '2025-02-01',
    priority: 'Medium',
    status: 'To Do',
    estimatedTime: '1 hour'
  },
  {
    id: 'hr-4',
    category: 'HR Administration',
    task: 'Schedule exit interview',
    description: 'Coordinate and conduct exit interview with departing employee',
    assignedTo: 'HR Business Partner',
    assignedRole: 'HR',
    dueDate: '2025-01-28',
    priority: 'Medium',
    status: 'To Do',
    estimatedTime: '1 hour'
  },
  {
    id: 'hr-5',
    category: 'HR Administration',
    task: 'Update employee status in all systems',
    description: 'Mark employee as terminated in HRIS, payroll, and benefits systems',
    assignedTo: 'HR Specialist',
    assignedRole: 'HR',
    dueDate: '2025-01-31',
    priority: 'High',
    status: 'To Do',
    dependencies: ['hr-1', 'hr-2'],
    estimatedTime: '30 minutes'
  },

  // IT Tasks
  {
    id: 'it-1',
    category: 'IT & Security',
    task: 'Disable user accounts and access',
    description: 'Disable all system accounts, email, VPN, and application access',
    assignedTo: 'IT Administrator',
    assignedRole: 'IT',
    dueDate: '2025-01-29',
    priority: 'High',
    status: 'To Do',
    estimatedTime: '45 minutes'
  },
  {
    id: 'it-2',
    category: 'IT & Security',
    task: 'Collect company devices and equipment',
    description: 'Retrieve laptop, phone, badges, keys, and other company property',
    assignedTo: 'IT Support',
    assignedRole: 'IT',
    dueDate: '2025-01-29',
    priority: 'High',
    status: 'To Do',
    estimatedTime: '30 minutes'
  },
  {
    id: 'it-3',
    category: 'IT & Security',
    task: 'Data backup and transfer',
    description: 'Backup important files and transfer ownership of critical documents',
    assignedTo: 'IT Administrator',
    assignedRole: 'IT',
    dueDate: '2025-01-28',
    priority: 'High',
    status: 'To Do',
    estimatedTime: '1 hour'
  },
  {
    id: 'it-4',
    category: 'IT & Security',
    task: 'Remove from security groups and distribution lists',
    description: 'Remove from all email groups, shared folders, and security groups',
    assignedTo: 'IT Administrator',
    assignedRole: 'IT',
    dueDate: '2025-01-29',
    priority: 'Medium',
    status: 'To Do',
    dependencies: ['it-1'],
    estimatedTime: '30 minutes'
  },

  // Manager Tasks
  {
    id: 'mgr-1',
    category: 'Management',
    task: 'Conduct final performance discussion',
    description: 'Have final conversation about performance, feedback, and transition',
    assignedTo: 'Direct Manager',
    assignedRole: 'Manager',
    dueDate: '2025-01-28',
    priority: 'High',
    status: 'To Do',
    estimatedTime: '1 hour'
  },
  {
    id: 'mgr-2',
    category: 'Management',
    task: 'Document knowledge transfer',
    description: 'Ensure all critical knowledge and processes are documented',
    assignedTo: 'Direct Manager',
    assignedRole: 'Manager',
    dueDate: '2025-01-27',
    priority: 'High',
    status: 'To Do',
    estimatedTime: '2 hours'
  },
  {
    id: 'mgr-3',
    category: 'Management',
    task: 'Reassign responsibilities and projects',
    description: 'Distribute ongoing work and responsibilities to team members',
    assignedTo: 'Direct Manager',
    assignedRole: 'Manager',
    dueDate: '2025-01-26',
    priority: 'High',
    status: 'To Do',
    estimatedTime: '1.5 hours'
  },
  {
    id: 'mgr-4',
    category: 'Management',
    task: 'Update team and stakeholders',
    description: 'Communicate departure to team members and key stakeholders',
    assignedTo: 'Direct Manager',
    assignedRole: 'Manager',
    dueDate: '2025-01-25',
    priority: 'Medium',
    status: 'To Do',
    estimatedTime: '30 minutes'
  },

  // Finance Tasks
  {
    id: 'fin-1',
    category: 'Finance',
    task: 'Process final expense reports',
    description: 'Review and approve any pending expense reports',
    assignedTo: 'Finance Team',
    assignedRole: 'Finance',
    dueDate: '2025-01-30',
    priority: 'Medium',
    status: 'To Do',
    estimatedTime: '30 minutes'
  },
  {
    id: 'fin-2',
    category: 'Finance',
    task: 'Cancel corporate credit cards',
    description: 'Cancel any company credit cards and collect physical cards',
    assignedTo: 'Finance Team',
    assignedRole: 'Finance',
    dueDate: '2025-01-29',
    priority: 'High',
    status: 'To Do',
    estimatedTime: '15 minutes'
  },

  // Facilities Tasks
  {
    id: 'fac-1',
    category: 'Facilities',
    task: 'Collect access badges and keys',
    description: 'Retrieve building access cards, office keys, and parking passes',
    assignedTo: 'Facilities Manager',
    assignedRole: 'Facilities',
    dueDate: '2025-01-29',
    priority: 'High',
    status: 'To Do',
    estimatedTime: '15 minutes'
  },
  {
    id: 'fac-2',
    category: 'Facilities',
    task: 'Clean out workspace',
    description: 'Coordinate workspace cleanup and personal item collection',
    assignedTo: 'Facilities Team',
    assignedRole: 'Facilities',
    dueDate: '2025-01-30',
    priority: 'Low',
    status: 'To Do',
    estimatedTime: '45 minutes'
  },

  // Employee Tasks
  {
    id: 'emp-1',
    category: 'Employee Actions',
    task: 'Complete knowledge transfer documentation',
    description: 'Document all ongoing projects, processes, and important contacts',
    assignedTo: 'Departing Employee',
    assignedRole: 'Employee',
    dueDate: '2025-01-27',
    priority: 'High',
    status: 'To Do',
    estimatedTime: '3 hours'
  },
  {
    id: 'emp-2',
    category: 'Employee Actions',
    task: 'Return all company property',
    description: 'Return laptop, phone, badges, keys, and any other company assets',
    assignedTo: 'Departing Employee',
    assignedRole: 'Employee',
    dueDate: '2025-01-29',
    priority: 'High',
    status: 'To Do',
    estimatedTime: '30 minutes'
  },
  {
    id: 'emp-3',
    category: 'Employee Actions',
    task: 'Complete exit interview',
    description: 'Participate in exit interview with HR',
    assignedTo: 'Departing Employee',
    assignedRole: 'Employee',
    dueDate: '2025-01-28',
    priority: 'Medium',
    status: 'To Do',
    estimatedTime: '1 hour'
  },

  // Legal/Compliance Tasks
  {
    id: 'legal-1',
    category: 'Legal & Compliance',
    task: 'Review non-compete and confidentiality agreements',
    description: 'Ensure all legal agreements are current and enforceable',
    assignedTo: 'Legal Team',
    assignedRole: 'Legal',
    dueDate: '2025-01-26',
    priority: 'High',
    status: 'To Do',
    estimatedTime: '1 hour'
  },
  {
    id: 'legal-2',
    category: 'Legal & Compliance',
    task: 'Document compliance with termination laws',
    description: 'Ensure termination complies with federal, state, and local laws',
    assignedTo: 'Legal Team',
    assignedRole: 'Legal',
    dueDate: '2025-01-25',
    priority: 'High',
    status: 'To Do',
    estimatedTime: '45 minutes'
  }
];

const OffboardingModal: React.FC<OffboardingModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('active');
  const [selectedEmployee, setSelectedEmployee] = useState<OffboardingEmployee | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<OffboardingTemplate | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    tasks: [] as Omit<OffboardingTask, 'id'>[]
  });

  // Handle ESC key press
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedEmployee) {
          setSelectedEmployee(null);
        } else if (showTemplateEditor) {
          setShowTemplateEditor(false);
          setSelectedTemplate(null);
        } else if (showCreateTemplate) {
          setShowCreateTemplate(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose, selectedEmployee, showTemplateEditor, showCreateTemplate]);

  // Mock data for employees being offboarded
  const offboardingEmployees: OffboardingEmployee[] = [
    {
      id: '1',
      name: 'Jennifer Martinez',
      email: 'jennifer.martinez@company.com',
      department: 'Marketing',
      role: 'Marketing Coordinator',
      manager: 'Mike Chen',
      terminationDate: '2025-01-31',
      lastWorkingDay: '2025-01-29',
      reason: 'Voluntary Resignation',
      status: 'In Progress',
      requestedBy: 'Mike Chen',
      requestDate: '2025-01-10'
    },
    {
      id: '2',
      name: 'Robert Thompson',
      email: 'robert.thompson@company.com',
      department: 'Sales',
      role: 'Sales Representative',
      manager: 'Lisa Rodriguez',
      terminationDate: '2025-02-15',
      lastWorkingDay: '2025-02-15',
      reason: 'Layoff - Restructuring',
      status: 'Pending Approval',
      requestedBy: 'Lisa Rodriguez',
      requestDate: '2025-01-12'
    },
    {
      id: '3',
      name: 'Amanda Foster',
      email: 'amanda.foster@company.com',
      department: 'Engineering',
      role: 'Software Engineer',
      manager: 'Sarah Johnson',
      terminationDate: '2025-01-25',
      lastWorkingDay: '2025-01-23',
      reason: 'Voluntary Resignation',
      status: 'Completed',
      requestedBy: 'Sarah Johnson',
      requestDate: '2025-01-05'
    }
  ];

  const [offboardingTemplates, setOffboardingTemplates] = useState<OffboardingTemplate[]>([
    {
      id: '1',
      name: 'Standard Employee Offboarding',
      description: 'Comprehensive checklist for regular employee terminations',
      tasks: defaultOffboardingTasks,
      isDefault: true,
      createdBy: 'HR Team',
      createdDate: '2024-01-15',
      lastModified: '2025-01-10'
    },
    {
      id: '2',
      name: 'Executive Offboarding',
      description: 'Enhanced checklist for executive and senior leadership departures',
      tasks: [
        ...defaultOffboardingTasks,
        {
          id: 'exec-1',
          category: 'Executive Transition',
          task: 'Board notification and communication',
          description: 'Notify board of directors and prepare external communications',
          assignedTo: 'CEO/Executive Team',
          assignedRole: 'Executive',
          dueDate: '2025-01-24',
          priority: 'High',
          status: 'To Do',
          estimatedTime: '2 hours'
        },
        {
          id: 'exec-2',
          category: 'Executive Transition',
          task: 'Succession planning activation',
          description: 'Implement succession plan and interim leadership arrangements',
          assignedTo: 'CEO/Executive Team',
          assignedRole: 'Executive',
          dueDate: '2025-01-25',
          priority: 'High',
          status: 'To Do',
          estimatedTime: '3 hours'
        }
      ],
      isDefault: false,
      createdBy: 'Executive Team',
      createdDate: '2024-06-20',
      lastModified: '2024-12-15'
    },
    {
      id: '3',
      name: 'Remote Employee Offboarding',
      description: 'Specialized checklist for remote workers with shipping logistics',
      tasks: defaultOffboardingTasks.map(task =>
        task.id === 'it-2'
          ? { ...task, description: 'Coordinate shipping of company devices and equipment back to office', estimatedTime: '1 hour' }
          : task.id === 'fac-1'
          ? { ...task, description: 'Coordinate return of access badges via mail', estimatedTime: '30 minutes' }
          : task
      ),
      isDefault: false,
      createdBy: 'HR Team',
      createdDate: '2024-03-10',
      lastModified: '2024-11-22'
    }
  ]);

  const [employeeChecklists, setEmployeeChecklists] = useState<{[employeeId: string]: OffboardingTask[]}>({
    '1': defaultOffboardingTasks.map(task => ({ ...task, id: `${task.id}-emp1` })),
    '3': defaultOffboardingTasks.map(task => ({ ...task, id: `${task.id}-emp3`, status: 'Completed' as const }))
  });

  const filteredEmployees = offboardingEmployees.filter(employee => {
    const matchesStatus = filterStatus === 'All' || employee.status === filterStatus;
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Approval': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-purple-100 text-purple-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTaskStatusChange = (employeeId: string, taskId: string, newStatus: OffboardingTask['status']) => {
    setEmployeeChecklists(prev => ({
      ...prev,
      [employeeId]: prev[employeeId]?.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              completedBy: newStatus === 'Completed' ? 'Current User' : undefined,
              completedDate: newStatus === 'Completed' ? new Date().toISOString() : undefined
            }
          : task
      ) || []
    }));

    if (newStatus === 'Completed') {
      const employee = offboardingEmployees.find(emp => emp.id === employeeId);
      const task = employeeChecklists[employeeId]?.find(t => t.id === taskId);

      if (employee && task) {
        // Send notification to relevant parties
        console.log('Sending task completion notification:', {
          to: `${task.assignedRole.toLowerCase()}@company.com`,
          cc: 'hr@company.com',
          subject: `Offboarding Task Completed - ${employee.name}`,
          message: `Task "${task.task}" has been completed for ${employee.name}'s offboarding process.`
        });

        setNotification({
          type: 'success',
          message: `Task "${task.task}" marked as completed. Relevant teams have been notified.`
        });
        setTimeout(() => setNotification(null), 4000);
      }
    }
  };

  const handleSendTaskNotifications = (employeeId: string) => {
    const employee = offboardingEmployees.find(emp => emp.id === employeeId);
    const tasks = employeeChecklists[employeeId] || [];

    if (!employee) return;

    // Group tasks by assigned role
    const tasksByRole = tasks.reduce((acc, task) => {
      if (!acc[task.assignedRole]) acc[task.assignedRole] = [];
      acc[task.assignedRole].push(task);
      return acc;
    }, {} as {[role: string]: OffboardingTask[]});

    // Send notifications to each role
    Object.entries(tasksByRole).forEach(([role, roleTasks]) => {
      console.log(`Sending offboarding tasks to ${role}:`, {
        to: `${role.toLowerCase()}@company.com`,
        cc: 'hr@company.com',
        subject: `Offboarding Tasks Assigned - ${employee.name}`,
        message: `You have been assigned ${roleTasks.length} tasks for ${employee.name}'s offboarding process. Please complete by ${employee.terminationDate}.`,
        tasks: roleTasks.map(t => ({
          task: t.task,
          dueDate: t.dueDate,
          priority: t.priority,
          description: t.description
        }))
      });
    });

    setNotification({
      type: 'success',
      message: `Offboarding tasks have been assigned and notified to relevant teams for ${employee.name}.`
    });
    setTimeout(() => setNotification(null), 4000);
  };
    
  const handleDuplicateTemplate = (template: OffboardingTemplate) => {
    const duplicatedTemplate: OffboardingTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      isDefault: false,
      createdBy: 'Current User',
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    setOffboardingTemplates([...offboardingTemplates, duplicatedTemplate]);
    setNotification({
      type: 'success',
      message: `Template "${template.name}" has been duplicated successfully.`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDownloadReport = (employee: OffboardingEmployee) => {
    console.log('Generating offboarding report for:', employee.name);
    setNotification({
      type: 'success',
      message: `Offboarding report for ${employee.name} is being generated and will download shortly.`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name || newTemplate.tasks.length === 0) {
      setNotification({
        type: 'error',
        message: 'Please provide a template name and add at least one task.'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const template: OffboardingTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      description: newTemplate.description,
      tasks: newTemplate.tasks.map((task, index) => ({
        ...task,
        id: `custom-${Date.now()}-${index}`
      })) as OffboardingTask[],
      isDefault: false,
      createdBy: 'Current User',
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    setOffboardingTemplates([...offboardingTemplates, template]);
    setShowCreateTemplate(false);
    setNewTemplate({ name: '', description: '', tasks: [] });
    setNotification({
      type: 'success',
      message: `Template "${template.name}" has been created successfully.`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const tabs = [
    { id: 'active', label: 'Active Processes', count: offboardingEmployees.filter(emp => emp.status !== 'Completed').length },
    { id: 'completed', label: 'Completed', count: offboardingEmployees.filter(emp => emp.status === 'Completed').length },
    { id: 'templates', label: 'Templates', count: offboardingTemplates.length },
  ];

  return (
    <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        <div className="flex items-start justify-between p-6 border-b bg-gradient-to-r from-red-600 to-orange-600 text-white">
          <div className="flex items-center flex-1 min-w-0 pr-4">
            <UserX className="h-8 w-8 mr-3 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-2xl font-bold break-words">Employee Offboarding</h2>
              <p className="text-red-100 break-words">Manage employee departures and transition processes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-red-100 hover:text-white transition-colors flex-shrink-0"
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
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="All">All Statuses</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-1 mr-2 animate-pulse">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs font-medium text-purple-600">AI</span>
              </div>
              <input
                type="text"
                placeholder="AI Search: Try 'Sarah', 'Engineering', etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-16 pr-4 py-2 border-2 border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 bg-purple-50 dark:bg-purple-900/20/50 placeholder-gray-500 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-96">
          <div className="p-6">
            {/* Active Offboarding Tab */}
            {activeTab === 'active' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Active Offboarding Processes</h3>
                  <button
                    onClick={() => setActiveTab('templates')}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Manage Templates
                  </button>
                </div>

                <div className="grid gap-6">
                  {filteredEmployees.filter(emp => emp.status !== 'Completed').map((employee) => (
                    <div
                      key={employee.id}
                      className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="bg-red-100 rounded-full p-3">
                            <UserX className="h-6 w-6 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">{employee.name}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                                {employee.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                              <div>
                                <span className="font-medium">Department:</span> {employee.department}
                              </div>
                              <div>
                                <span className="font-medium">Role:</span> {employee.role}
                              </div>
                              <div>
                                <span className="font-medium">Manager:</span> {employee.manager}
                              </div>
                              <div>
                                <span className="font-medium">Termination Date:</span> {new Date(employee.terminationDate).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Reason: {employee.reason}</span>
                              <span>Requested: {new Date(employee.requestDate).toLocaleDateString()}</span>
                              <span>By: {employee.requestedBy}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {employee.status === 'In Progress' && (
                            <div className="text-right">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Tasks: {employeeChecklists[employee.id]?.filter(task => task.status === 'Completed').length || 0}/
                                {employeeChecklists[employee.id]?.length || 0}
                              </p>
                              <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                  className="bg-red-600 h-2 rounded-full"
                                  style={{
                                    width: `${((employeeChecklists[employee.id]?.filter(task => task.status === 'Completed').length || 0) /
                                              (employeeChecklists[employee.id]?.length || 1)) * 100}%`
                                    }}
                                ></div>
                              </div>
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendTaskNotifications(employee.id);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Send Tasks
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredEmployees.filter(emp => emp.status !== 'Completed').length === 0 && (
                    <div className="text-center py-8">
                      <UserX className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No active offboarding processes</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Completed Tab */}
            {activeTab === 'completed' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Completed Offboarding</h3>

                <div className="grid gap-4">
                  {offboardingEmployees.filter(emp => emp.status === 'Completed').map((employee) => (
                    <div key={employee.id} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-green-100 rounded-full p-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">{employee.name}</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">{employee.role} • {employee.department}</p>
                            <p className="text-gray-500 text-xs">
                              Completed: {new Date(employee.terminationDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedEmployee(employee)}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadReport(employee);
                            }}
                            className="text-green-600 hover:text-green-700 text-sm"
                          >
                            Download Report
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Offboarding Templates</h3>
                  <button
                    onClick={() => setShowCreateTemplate(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </button>
                </div>

                <div className="grid gap-6">
                  {offboardingTemplates.map((template) => (
                    <div key={template.id} className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">{template.name}</h4>
                            {template.isDefault && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">{template.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                            <div>
                              <span className="font-medium">Tasks:</span> {template.tasks.length}
                            </div>
                            <div>
                              <span className="font-medium">Created by:</span> {template.createdBy}
                            </div>
                            <div>
                              <span className="font-medium">Created:</span> {new Date(template.createdDate).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Modified:</span> {new Date(template.lastModified).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedTemplate(template);
                              setShowTemplateEditor(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDuplicateTemplate(template)}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                          >
                            Duplicate
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Employee Detail Modal with Checklist */}
      {selectedEmployee && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[70] overflow-y-auto"
          onClick={() => setSelectedEmployee(null)}
        >
          <div className="min-h-screen flex items-center justify-center p-4">
            <div
              className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-7xl w-full my-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-start justify-between p-6 border-b bg-gradient-to-r from-red-600 to-orange-600 text-white">
              <div className="flex-1 pr-4">
                <h3 className="text-xl font-bold break-words">{selectedEmployee.name} - Offboarding Checklist</h3>
                <p className="text-red-100 text-sm break-words">
                  {selectedEmployee.role} • {selectedEmployee.department} • Last Day: {new Date(selectedEmployee.lastWorkingDay).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-red-100 hover:text-white transition-colors flex-shrink-0"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Progress Overview */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">Overall Progress</h4>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {employeeChecklists[selectedEmployee.id]?.filter(task => task.status === 'Completed').length || 0} of{' '}
                    {employeeChecklists[selectedEmployee.id]?.length || 0} tasks completed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-red-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${((employeeChecklists[selectedEmployee.id]?.filter(task => task.status === 'Completed').length || 0) /
                                (employeeChecklists[selectedEmployee.id]?.length || 1)) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Checklist by Category */}
              <div className="space-y-6">
                {['HR Administration', 'IT & Security', 'Management', 'Finance', 'Facilities', 'Employee Actions', 'Legal & Compliance', 'Executive Transition'].map(category => {
                  const categoryTasks = employeeChecklists[selectedEmployee.id]?.filter(task => task.category === category) || [];
                  if (categoryTasks.length === 0) return null;

                  return (
                    <div key={category} className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4 flex items-center">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm mr-2">
                          {categoryTasks.filter(task => task.status === 'Completed').length}/{categoryTasks.length}
                        </span>
                        {category}
                      </h5>
                      <div className="space-y-3">
                        {categoryTasks.map(task => (
                          <div key={task.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <input
                              type="checkbox"
                              checked={task.status === 'Completed'}
                              onChange={(e) => handleTaskStatusChange(
                                selectedEmployee.id,
                                task.id,
                                e.target.checked ? 'Completed' : 'To Do'
                              )}
                              className="mt-1 h-5 w-5 text-red-600 rounded flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                <h6 className={`font-medium flex-1 min-w-0 break-words ${task.status === 'Completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                  {task.task}
                                </h6>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getTaskStatusColor(task.status)}`}>
                                    {task.status}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 break-words">{task.description}</p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                <span className="break-words">👤 {task.assignedTo}</span>
                                <span className="whitespace-nowrap">📅 Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                <span className="whitespace-nowrap">⏱️ {task.estimatedTime}</span>
                              </div>
                              {task.dependencies && task.dependencies.length > 0 && (
                                <div className="mt-2 text-xs text-gray-500 break-words">
                                  Dependencies: {task.dependencies.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadReport(selectedEmployee)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[70] overflow-y-auto"
          onClick={() => setShowCreateTemplate(false)}
        >
          <div className="min-h-screen flex items-center justify-center p-4">
            <div
              className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Create Offboarding Template</h3>
              <button
                onClick={() => setShowCreateTemplate(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Template Name *</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Contractor Offboarding"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the purpose and use case for this template..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Base Template</label>
                <select
                  onChange={(e) => {
                    const template = offboardingTemplates.find(t => t.id === e.target.value);
                    if (template) {
                      setNewTemplate({
                        ...newTemplate,
                        tasks: template.tasks.map(({ id, ...task }) => task)
                      });
                    }
                  }}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select a template to copy tasks from</option>
                  {offboardingTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.tasks.length} tasks)
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You can start with an existing template and customize it, or create a template from scratch after creation using the template editor.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateTemplate(false);
                  setNewTemplate({ name: '', description: '', tasks: [] });
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Create Template
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {showTemplateEditor && selectedTemplate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[70] overflow-y-auto"
          onClick={() => {
            setShowTemplateEditor(false);
            setSelectedTemplate(null);
          }}
        >
          <div className="min-h-screen flex items-center justify-center p-4">
            <div
              className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-4xl w-full my-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Edit Template: {selectedTemplate.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedTemplate.description}</p>
              </div>
              <button
                onClick={() => {
                  setShowTemplateEditor(false);
                  setSelectedTemplate(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-2">Template Tasks ({selectedTemplate.tasks.length})</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Review and customize the tasks for this offboarding template.</p>
              </div>

              <div className="space-y-4">
                {selectedTemplate.tasks.map((task, index) => (
                  <div key={task.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-gray-200 text-gray-700 dark:text-gray-300 dark:text-gray-300 px-2 py-1 rounded text-xs font-medium">
                            {task.category}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <h5 className="font-medium text-gray-900 dark:text-white dark:text-white mb-1">{task.task}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{task.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>👤 {task.assignedTo}</span>
                          <span>⏱️ {task.estimatedTime}</span>
                        </div>
                      </div>
                      <div className="text-gray-400 ml-4">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Template Editing:</strong> This template contains {selectedTemplate.tasks.length} tasks across {new Set(selectedTemplate.tasks.map(t => t.category)).size} categories. You can use this template as-is or duplicate it to create a customized version.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => {
                  setShowTemplateEditor(false);
                  setSelectedTemplate(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDuplicateTemplate(selectedTemplate);
                  setShowTemplateEditor(false);
                  setSelectedTemplate(null);
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Duplicate Template
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
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
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
    </>
  );
};

export default OffboardingModal;