import React, { useState } from 'react';
import { X, BarChart3, FileText, Users, TrendingUp, Download, Eye, Filter, Search, Plus, Calendar, DollarSign, Clock, Target, Award, Brain, Zap, Globe, Mail, Share2, Settings, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

interface Report {
  id: string;
  name: string;
  category: string;
  description: string;
  lastGenerated: string;
  format: string;
  size: string;
  status: 'Ready' | 'Generating' | 'Error';
  isCustom: boolean;
  frequency?: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
  recipients?: string[];
}

interface DataInsight {
  id: string;
  title: string;
  type: 'trend' | 'alert' | 'recommendation' | 'metric';
  description: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  category: string;
}

interface CustomReportBuilder {
  name: string;
  description: string;
  dataSource: string;
  filters: {
    departments: string[];
    dateRange: string;
    employeeTypes: string[];
    locations: string[];
  };
  fields: string[];
  groupBy: string;
  sortBy: string;
  format: string;
  schedule?: {
    frequency: string;
    recipients: string[];
    enabled: boolean;
  };
}

interface HRDataReportingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HRDataReportingModal: React.FC<HRDataReportingModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomReportBuilder, setShowCustomReportBuilder] = useState(false);
  const [showDataVisualization, setShowDataVisualization] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<DataInsight | null>(null);
  const [customReport, setCustomReport] = useState<CustomReportBuilder>({
    name: '',
    description: '',
    dataSource: 'employees',
    filters: {
      departments: [],
      dateRange: 'last-30-days',
      employeeTypes: [],
      locations: []
    },
    fields: [],
    groupBy: 'department',
    sortBy: 'name',
    format: 'PDF',
    schedule: {
      frequency: 'monthly',
      recipients: [],
      enabled: false
    }
  });
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

  if (!isOpen) return null;

  // Pre-built reports matching BambooHR's offerings
  const reports: Report[] = [
    // Employee Data Reports
    {
      id: '1',
      name: 'Employee Directory',
      category: 'Employee Data',
      description: 'Complete employee directory with contact information and organizational structure',
      lastGenerated: '2025-01-15',
      format: 'PDF',
      size: '2.3 MB',
      status: 'Ready',
      isCustom: false,
      frequency: 'Weekly',
      recipients: ['hr@company.com']
    },
    {
      id: '2',
      name: 'Headcount by Department',
      category: 'Employee Data',
      description: 'Employee count breakdown by department, location, and job level',
      lastGenerated: '2025-01-14',
      format: 'Excel',
      size: '1.1 MB',
      status: 'Ready',
      isCustom: false
    },
    {
      id: '3',
      name: 'Employee Demographics',
      category: 'Employee Data',
      description: 'Diversity and demographic analysis across the organization',
      lastGenerated: '2025-01-13',
      format: 'PDF',
      size: '1.8 MB',
      status: 'Ready',
      isCustom: false
    },
    {
      id: '4',
      name: 'Organizational Chart',
      category: 'Employee Data',
      description: 'Visual representation of company structure and reporting relationships',
      lastGenerated: '2025-01-12',
      format: 'PDF',
      size: '3.2 MB',
      status: 'Ready',
      isCustom: false
    },

    // Hiring & Recruitment Reports
    {
      id: '5',
      name: 'Candidate Sources Report',
      category: 'Hiring & Recruitment',
      description: 'Track where your best candidates come from to optimize recruiting channels',
      lastGenerated: '2025-01-15',
      format: 'Excel',
      size: '1.5 MB',
      status: 'Ready',
      isCustom: false,
      frequency: 'Monthly'
    },
    {
      id: '6',
      name: 'Candidate Funnel Analysis',
      category: 'Hiring & Recruitment',
      description: 'Identify bottlenecks in your hiring process and improve conversion rates',
      lastGenerated: '2025-01-14',
      format: 'PDF',
      size: '2.1 MB',
      status: 'Ready',
      isCustom: false
    },
    {
      id: '7',
      name: 'Time to Hire Report',
      category: 'Hiring & Recruitment',
      description: 'Average time to hire by department and position level',
      lastGenerated: '2025-01-13',
      format: 'Excel',
      size: '980 KB',
      status: 'Ready',
      isCustom: false
    },
    {
      id: '8',
      name: 'New Hire Report',
      category: 'Hiring & Recruitment',
      description: 'Recent hires with onboarding status and completion rates',
      lastGenerated: '2025-01-12',
      format: 'PDF',
      size: '1.3 MB',
      status: 'Ready',
      isCustom: false
    },

    // Performance & Development Reports
    {
      id: '9',
      name: 'Performance Review Summary',
      category: 'Performance & Development',
      description: 'Completed performance reviews with ratings distribution and trends',
      lastGenerated: '2025-01-11',
      format: 'PDF',
      size: '2.4 MB',
      status: 'Ready',
      isCustom: false,
      frequency: 'Quarterly'
    },
    {
      id: '10',
      name: 'Goal Achievement Report',
      category: 'Performance & Development',
      description: 'Employee goal completion rates and performance metrics by department',
      lastGenerated: '2025-01-10',
      format: 'Excel',
      size: '1.7 MB',
      status: 'Ready',
      isCustom: false
    },
    {
      id: '11',
      name: 'Training Completion Report',
      category: 'Performance & Development',
      description: 'Training program completion rates, certifications, and skill development',
      lastGenerated: '2025-01-09',
      format: 'PDF',
      size: '1.9 MB',
      status: 'Ready',
      isCustom: false
    },
    {
      id: '12',
      name: 'Skills Gap Analysis',
      category: 'Performance & Development',
      description: 'Identify skill gaps and training needs across departments',
      lastGenerated: '2025-01-08',
      format: 'Excel',
      size: '1.4 MB',
      status: 'Ready',
      isCustom: false
    },

    // Compensation & Benefits Reports
    {
      id: '13',
      name: 'Compensation Analysis',
      category: 'Compensation & Benefits',
      description: 'Salary benchmarking and pay equity analysis across the organization',
      lastGenerated: '2025-01-15',
      format: 'Excel',
      size: '2.8 MB',
      status: 'Ready',
      isCustom: false,
      frequency: 'Quarterly'
    },
    {
      id: '14',
      name: 'Benefits Enrollment Summary',
      category: 'Compensation & Benefits',
      description: 'Employee benefits enrollment by plan type and utilization rates',
      lastGenerated: '2025-01-14',
      format: 'PDF',
      size: '1.6 MB',
      status: 'Ready',
      isCustom: false
    },
    {
      id: '15',
      name: 'Payroll Register',
      category: 'Compensation & Benefits',
      description: 'Detailed payroll breakdown with earnings, deductions, and taxes',
      lastGenerated: '2025-01-13',
      format: 'Excel',
      size: '3.5 MB',
      status: 'Ready',
      isCustom: false,
      frequency: 'Bi-weekly'
    },
    {
      id: '16',
      name: 'Pay Equity Report',
      category: 'Compensation & Benefits',
      description: 'Analysis of pay equity across gender, ethnicity, and other demographics',
      lastGenerated: '2025-01-12',
      format: 'PDF',
      size: '2.2 MB',
      status: 'Ready',
      isCustom: false
    },

    // Time & Attendance Reports
    {
      id: '17',
      name: 'Time & Attendance Summary',
      category: 'Time & Attendance',
      description: 'Employee attendance patterns, overtime, and time-off usage',
      lastGenerated: '2025-01-15',
      format: 'Excel',
      size: '2.1 MB',
      status: 'Ready',
      isCustom: false,
      frequency: 'Weekly'
    },
    {
      id: '18',
      name: 'PTO Usage Report',
      category: 'Time & Attendance',
      description: 'Paid time off usage patterns and remaining balances',
      lastGenerated: '2025-01-14',
      format: 'PDF',
      size: '1.4 MB',
      status: 'Ready',
      isCustom: false
    },
    {
      id: '19',
      name: 'Overtime Analysis',
      category: 'Time & Attendance',
      description: 'Overtime hours and costs by department and employee',
      lastGenerated: '2025-01-13',
      format: 'Excel',
      size: '1.2 MB',
      status: 'Ready',
      isCustom: false
    },

    // Compliance & Legal Reports
    {
      id: '20',
      name: 'EEO-1 Report',
      category: 'Compliance & Legal',
      description: 'Equal Employment Opportunity workforce demographics for government filing',
      lastGenerated: '2025-01-10',
      format: 'PDF',
      size: '1.1 MB',
      status: 'Ready',
      isCustom: false,
      frequency: 'Annually'
    },
    {
      id: '21',
      name: 'FMLA Usage Report',
      category: 'Compliance & Legal',
      description: 'Family and Medical Leave Act usage tracking and compliance',
      lastGenerated: '2025-01-09',
      format: 'Excel',
      size: '1.3 MB',
      status: 'Ready',
      isCustom: false
    },
    {
      id: '22',
      name: 'I-9 Compliance Report',
      category: 'Compliance & Legal',
      description: 'Employment eligibility verification compliance status',
      lastGenerated: '2025-01-08',
      format: 'PDF',
      size: '890 KB',
      status: 'Ready',
      isCustom: false
    }
  ];

  // AI-powered insights matching BambooHR's capabilities
  const dataInsights: DataInsight[] = [
    {
      id: '1',
      title: 'Turnover Risk Alert',
      type: 'alert',
      description: 'Engineering department showing 23% higher turnover risk than company average',
      value: '23%',
      change: '+8% from last quarter',
      trend: 'up',
      priority: 'high',
      actionable: true,
      category: 'Retention'
    },
    {
      id: '2',
      title: 'Hiring Velocity Improvement',
      type: 'trend',
      description: 'Time to hire decreased significantly with new ATS implementation',
      value: '18 days',
      change: '-12 days from last quarter',
      trend: 'down',
      priority: 'medium',
      actionable: false,
      category: 'Hiring'
    },
    {
      id: '3',
      title: 'Pay Equity Opportunity',
      type: 'recommendation',
      description: 'Salary analysis reveals potential pay gaps in Marketing department',
      value: '8.5%',
      change: 'Gap identified',
      trend: 'stable',
      priority: 'high',
      actionable: true,
      category: 'Compensation'
    },
    {
      id: '4',
      title: 'Training ROI Success',
      type: 'metric',
      description: 'Leadership training program showing excellent performance improvement',
      value: '340%',
      change: '+15% from target',
      trend: 'up',
      priority: 'low',
      actionable: false,
      category: 'Development'
    },
    {
      id: '5',
      title: 'Benefits Utilization Low',
      type: 'alert',
      description: 'Mental health benefits underutilized - only 12% employee participation',
      value: '12%',
      change: '-3% from last year',
      trend: 'down',
      priority: 'medium',
      actionable: true,
      category: 'Benefits'
    },
    {
      id: '6',
      title: 'Remote Work Productivity',
      type: 'trend',
      description: 'Remote employees showing 15% higher productivity scores',
      value: '15%',
      change: '+7% improvement',
      trend: 'up',
      priority: 'low',
      actionable: false,
      category: 'Performance'
    }
  ];

  // Key metrics for dashboard
  const keyMetrics = [
    { label: 'Total Employees', value: '247', change: '+12', trend: 'up', icon: Users, color: 'text-blue-600' },
    { label: 'Employee Satisfaction', value: '87%', change: '+5%', trend: 'up', icon: Award, color: 'text-green-600' },
    { label: 'Retention Rate', value: '94%', change: '+2%', trend: 'up', icon: Target, color: 'text-purple-600' },
    { label: 'Time to Hire', value: '18 days', change: '-12 days', trend: 'down', icon: Clock, color: 'text-emerald-600' },
    { label: 'Training Completion', value: '92%', change: '+8%', trend: 'up', icon: Brain, color: 'text-orange-600' },
    { label: 'Cost per Hire', value: '$3,200', change: '-$400', trend: 'down', icon: DollarSign, color: 'text-pink-600' }
  ];

  const categories = ['All', 'Employee Data', 'Hiring & Recruitment', 'Performance & Development', 'Compensation & Benefits', 'Time & Attendance', 'Compliance & Legal'];

  const filteredReports = reports.filter(report => {
    const matchesCategory = selectedCategory === 'All' || report.category === selectedCategory;
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Employee Data': return <Users className="h-5 w-5 text-blue-600" />;
      case 'Hiring & Recruitment': return <Target className="h-5 w-5 text-green-600" />;
      case 'Performance & Development': return <TrendingUp className="h-5 w-5 text-purple-600" />;
      case 'Compensation & Benefits': return <DollarSign className="h-5 w-5 text-emerald-600" />;
      case 'Time & Attendance': return <Clock className="h-5 w-5 text-orange-600" />;
      case 'Compliance & Legal': return <FileText className="h-5 w-5 text-red-600" />;
      default: return <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ready': return 'bg-green-100 text-green-800';
      case 'Generating': return 'bg-yellow-100 text-yellow-800';
      case 'Error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'alert': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'recommendation': return <Brain className="h-5 w-5 text-purple-600" />;
      case 'metric': return <BarChart3 className="h-5 w-5 text-green-600" />;
      default: return <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getInsightColor = (type: string, priority: string) => {
    if (priority === 'high') return 'border-l-red-500 bg-red-50';
    if (priority === 'medium') return 'border-l-yellow-500 bg-yellow-50';
    return 'border-l-blue-500 bg-blue-50';
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleGenerateReport = (reportId: string) => {
    console.log('Generating report:', reportId);
    setNotification({
      type: 'info',
      message: 'Report generation started! You will be notified when it\'s ready.'
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDownloadReport = (reportId: string, reportName: string) => {
    console.log('Downloading report:', reportId, reportName);
    setNotification({
      type: 'success',
      message: `Downloading ${reportName}...`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleShareReport = (reportId: string) => {
    console.log('Sharing report:', reportId);
    setNotification({
      type: 'info',
      message: 'Share dialog would open here in a real application'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateCustomReport = () => {
    if (!customReport.name || !customReport.dataSource || customReport.fields.length === 0) {
      setNotification({
        type: 'error',
        message: 'Please fill in all required fields and select at least one data field'
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    console.log('Creating custom report:', customReport);
    setNotification({
      type: 'success',
      message: `Custom report "${customReport.name}" created successfully!`
    });
    setTimeout(() => setNotification(null), 4000);
    setShowCustomReportBuilder(false);
    
    // Reset form
    setCustomReport({
      name: '',
      description: '',
      dataSource: 'employees',
      filters: {
        departments: [],
        dateRange: 'last-30-days',
        employeeTypes: [],
        locations: []
      },
      fields: [],
      groupBy: 'department',
      sortBy: 'name',
      format: 'PDF',
      schedule: {
        frequency: 'monthly',
        recipients: [],
        enabled: false
      }
    });
  };

  const availableFields = {
    employees: ['Name', 'Employee ID', 'Department', 'Job Title', 'Hire Date', 'Salary', 'Manager', 'Location', 'Status', 'Performance Rating'],
    payroll: ['Gross Pay', 'Net Pay', 'Federal Tax', 'State Tax', 'FICA', 'Benefits Deductions', 'Overtime Hours', 'Regular Hours'],
    performance: ['Overall Rating', 'Goal Achievement', 'Review Date', 'Reviewer', 'Development Areas', 'Strengths', 'Next Review Date'],
    attendance: ['Clock In', 'Clock Out', 'Total Hours', 'Overtime', 'PTO Used', 'Sick Leave Used', 'Attendance Rate'],
    benefits: ['Health Plan', 'Dental Plan', 'Vision Plan', '401k Contribution', 'Life Insurance', 'Enrollment Date', 'Premium Cost']
  };

  const tabs = [
    { id: 'dashboard', label: 'Analytics Dashboard', icon: BarChart3 },
    { id: 'reports', label: 'Pre-built Reports', icon: FileText },
    { id: 'custom', label: 'Custom Reports', icon: Plus },
    { id: 'insights', label: 'AI Insights', icon: Brain },
    { id: 'automation', label: 'Automated Reporting', icon: Zap }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">HR Data & Reporting</h2>
              <p className="text-blue-100">Transform your HR data into strategic insights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50 dark:bg-gray-900">
            <nav className="p-4 space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
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
              {/* Analytics Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">HR Analytics Dashboard</h3>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowDataVisualization(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Data Visualization
                      </button>
                      <button
                        onClick={() => setShowAIInsights(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        AI Insights
                      </button>
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {keyMetrics.map((metric, index) => {
                      const Icon = metric.icon;
                      return (
                        <div key={index} className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{metric.value}</p>
                            </div>
                            <div className="text-right">
                              <Icon className={`h-8 w-8 ${metric.color}`} />
                              <div className={`text-sm font-medium ${
                                metric.trend === 'up' ? 'text-green-600' : 
                                metric.trend === 'down' ? 'text-red-600' : 
                                'text-gray-600'
                              }`}>
                                {metric.change}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Insights Preview */}
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-semibold">AI-Powered Insights</h4>
                      <button
                        onClick={() => setShowAIInsights(true)}
                        className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/30 transition-colors"
                      >
                        View All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {dataInsights.slice(0, 4).map((insight, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 dark:bg-gray-800/10 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            {getInsightIcon(insight.type)}
                            <h5 className="font-medium">{insight.title}</h5>
                          </div>
                          <p className="text-blue-100 text-sm">{insight.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-lg font-bold">{insight.value}</span>
                            <span className="text-blue-200 text-sm">{insight.change}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Report Generation */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Quick Report Generation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { name: 'Employee Directory', icon: Users, color: 'bg-blue-100 text-blue-600' },
                        { name: 'Headcount Report', icon: BarChart3, color: 'bg-green-100 text-green-600' },
                        { name: 'Turnover Analysis', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
                        { name: 'Compensation Summary', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' }
                      ].map((quickReport, index) => {
                        const Icon = quickReport.icon;
                        return (
                          <button
                            key={index}
                            onClick={() => handleGenerateReport(`quick-${index}`)}
                            className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                          >
                            <div className={`rounded-full p-3 ${quickReport.color} mb-2`}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white dark:text-white">{quickReport.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Pre-built Reports Tab */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Pre-built Reports</h3>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search reports..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={() => setShowCustomReportBuilder(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Custom Report
                      </button>
                    </div>
                  </div>

                  {/* Category Filters */}
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          selectedCategory === category
                            ? 'bg-blue-100 border-blue-500 text-blue-700 font-medium'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  {/* Reports Grid */}
                  <div className="grid gap-4">
                    {filteredReports.map((report) => (
                      <div
                        key={report.id}
                        className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-full p-2">
                              {getCategoryIcon(report.category)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white">{report.name}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                  {report.status}
                                </span>
                                {report.frequency && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                    {report.frequency}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{report.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>Category: {report.category}</span>
                                <span>Last Generated: {report.lastGenerated}</span>
                                <span>Format: {report.format}</span>
                                <span>Size: {report.size}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadReport(report.id, report.name)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors"
                              title="Download Report"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleShareReport(report.id)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 transition-colors"
                              title="Share Report"
                            >
                              <Share2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleGenerateReport(report.id)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              Generate
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {filteredReports.length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No reports found matching your criteria</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Reports Tab */}
              {activeTab === 'custom' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Custom Report Builder</h3>
                    <button
                      onClick={() => setShowCustomReportBuilder(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Build Custom Report
                    </button>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-4">Custom Report Capabilities</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-blue-800">Drag-and-drop report builder</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-blue-800">Advanced filtering and grouping</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-blue-800">Multiple export formats (PDF, Excel, CSV)</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-blue-800">Scheduled automated delivery</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-blue-800">Real-time data connections</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-blue-800">Interactive charts and graphs</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-blue-800">Secure sharing with permissions</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-blue-800">Mobile-optimized viewing</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sample Custom Reports */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Sample Custom Reports</h4>
                    <div className="grid gap-4">
                      {[
                        { name: 'Executive Dashboard', description: 'High-level metrics for leadership team', fields: 8, lastRun: '2025-01-15' },
                        { name: 'Department Performance Scorecard', description: 'Performance metrics by department', fields: 12, lastRun: '2025-01-14' },
                        { name: 'Diversity & Inclusion Report', description: 'Comprehensive D&I metrics and trends', fields: 15, lastRun: '2025-01-13' },
                        { name: 'Cost Center Analysis', description: 'Labor costs and budget variance by cost center', fields: 10, lastRun: '2025-01-12' }
                      ].map((report, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white dark:text-white">{report.name}</h5>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">{report.description}</p>
                            <p className="text-gray-500 text-xs">{report.fields} fields • Last run: {report.lastRun}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Insights Tab */}
              {activeTab === 'insights' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">AI-Powered Data Insights</h3>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Insights
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {dataInsights.map((insight) => (
                      <div
                        key={insight.id}
                        className={`border-l-4 rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow ${getInsightColor(insight.type, insight.priority)}`}
                        onClick={() => setSelectedInsight(insight)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {getInsightIcon(insight.type)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">{insight.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {insight.priority} priority
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:text-gray-300 dark:text-gray-300 text-xs rounded-full">
                                  {insight.category}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3">{insight.description}</p>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{insight.value}</span>
                                  <span className={`text-sm font-medium ${
                                    insight.trend === 'up' ? 'text-green-600' : 
                                    insight.trend === 'down' ? 'text-red-600' : 
                                    'text-gray-600'
                                  }`}>
                                    {insight.change}
                                  </span>
                                </div>
                                {insight.actionable && (
                                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                                    Take Action
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Automated Reporting Tab */}
              {activeTab === 'automation' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Automated Reporting</h3>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      New Automation
                    </button>
                  </div>

                  <div className="grid gap-6">
                    {[
                      {
                        name: 'Weekly Headcount Report',
                        description: 'Automated weekly employee count by department',
                        frequency: 'Weekly - Mondays at 9:00 AM',
                        recipients: ['hr@company.com', 'executives@company.com'],
                        status: 'Active',
                        lastSent: '2025-01-13'
                      },
                      {
                        name: 'Monthly Turnover Analysis',
                        description: 'Monthly turnover rates and exit interview insights',
                        frequency: 'Monthly - 1st of month',
                        recipients: ['hr@company.com', 'managers@company.com'],
                        status: 'Active',
                        lastSent: '2025-01-01'
                      },
                      {
                        name: 'Quarterly Performance Summary',
                        description: 'Performance review completion and rating distribution',
                        frequency: 'Quarterly - End of quarter',
                        recipients: ['hr@company.com', 'leadership@company.com'],
                        status: 'Paused',
                        lastSent: '2024-12-31'
                      }
                    ].map((automation, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">{automation.name}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                automation.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {automation.status}
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{automation.description}</p>
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                <span>{automation.frequency}</span>
                              </div>
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2" />
                                <span>{automation.recipients.length} recipient(s)</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>Last sent: {automation.lastSent}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors">
                              <Settings className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors">
                              <RefreshCw className="h-4 w-4" />
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

        {/* Custom Report Builder Modal */}
        {showCustomReportBuilder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Custom Report Builder</h3>
                <button
                  onClick={() => setShowCustomReportBuilder(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Report Name</label>
                    <input
                      type="text"
                      value={customReport.name}
                      onChange={(e) => setCustomReport({ ...customReport, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Q1 Department Performance Report"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Data Source</label>
                    <select
                      value={customReport.dataSource}
                      onChange={(e) => setCustomReport({ ...customReport, dataSource: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="employees">Employee Data</option>
                      <option value="payroll">Payroll Data</option>
                      <option value="performance">Performance Data</option>
                      <option value="attendance">Time & Attendance</option>
                      <option value="benefits">Benefits Data</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Description</label>
                  <textarea
                    value={customReport.description}
                    onChange={(e) => setCustomReport({ ...customReport, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Describe what this report will show..."
                  />
                </div>

                {/* Data Fields Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Select Data Fields</label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableFields[customReport.dataSource as keyof typeof availableFields]?.map(field => (
                        <label key={field} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={customReport.fields.includes(field)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCustomReport({
                                  ...customReport,
                                  fields: [...customReport.fields, field]
                                });
                              } else {
                                setCustomReport({
                                  ...customReport,
                                  fields: customReport.fields.filter(f => f !== field)
                                });
                              }
                            }}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{field}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Departments</label>
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-32 overflow-y-auto">
                      {['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'].map(dept => (
                        <label key={dept} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={customReport.filters.departments.includes(dept)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCustomReport({
                                  ...customReport,
                                  filters: {
                                    ...customReport.filters,
                                    departments: [...customReport.filters.departments, dept]
                                  }
                                });
                              } else {
                                setCustomReport({
                                  ...customReport,
                                  filters: {
                                    ...customReport.filters,
                                    departments: customReport.filters.departments.filter(d => d !== dept)
                                  }
                                });
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{dept}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Date Range</label>
                    <select
                      value={customReport.filters.dateRange}
                      onChange={(e) => setCustomReport({
                        ...customReport,
                        filters: { ...customReport.filters, dateRange: e.target.value }
                      })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="last-7-days">Last 7 Days</option>
                      <option value="last-30-days">Last 30 Days</option>
                      <option value="last-90-days">Last 90 Days</option>
                      <option value="current-quarter">Current Quarter</option>
                      <option value="last-quarter">Last Quarter</option>
                      <option value="current-year">Current Year</option>
                      <option value="last-year">Last Year</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                </div>

                {/* Output Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Group By</label>
                    <select
                      value={customReport.groupBy}
                      onChange={(e) => setCustomReport({ ...customReport, groupBy: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="department">Department</option>
                      <option value="location">Location</option>
                      <option value="job-title">Job Title</option>
                      <option value="manager">Manager</option>
                      <option value="hire-date">Hire Date</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Sort By</label>
                    <select
                      value={customReport.sortBy}
                      onChange={(e) => setCustomReport({ ...customReport, sortBy: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="name">Name</option>
                      <option value="date">Date</option>
                      <option value="department">Department</option>
                      <option value="value">Value</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Format</label>
                    <select
                      value={customReport.format}
                      onChange={(e) => setCustomReport({ ...customReport, format: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="PDF">PDF</option>
                      <option value="Excel">Excel (.xlsx)</option>
                      <option value="CSV">CSV</option>
                      <option value="HTML">HTML</option>
                    </select>
                  </div>
                </div>

                {/* Scheduling */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white dark:text-white">Automated Scheduling (Optional)</h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customReport.schedule?.enabled || false}
                        onChange={(e) => setCustomReport({
                          ...customReport,
                          schedule: { ...customReport.schedule!, enabled: e.target.checked }
                        })}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Enable automated delivery</span>
                    </label>
                  </div>
                  
                  {customReport.schedule?.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Frequency</label>
                        <select
                          value={customReport.schedule.frequency}
                          onChange={(e) => setCustomReport({
                            ...customReport,
                            schedule: { ...customReport.schedule!, frequency: e.target.value }
                          })}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Recipients</label>
                        <input
                          type="text"
                          placeholder="email1@company.com, email2@company.com"
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Report Preview</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Name:</strong> {customReport.name || 'Untitled Report'}</p>
                    <p><strong>Data Source:</strong> {customReport.dataSource.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p><strong>Fields:</strong> {customReport.fields.length} selected</p>
                    <p><strong>Filters:</strong> {customReport.filters.departments.length > 0 ? `${customReport.filters.departments.length} departments` : 'All departments'}</p>
                    <p><strong>Format:</strong> {customReport.format}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 dark:bg-gray-900">
                <button
                  onClick={() => setShowCustomReportBuilder(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCustomReport}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Details Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Report Details</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {getCategoryIcon(selectedReport.category)}
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white dark:text-white">{selectedReport.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                      {selectedReport.status}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Description</h5>
                  <p className="text-gray-600 dark:text-gray-400">{selectedReport.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Category</h5>
                    <p className="text-gray-600 dark:text-gray-400">{selectedReport.category}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Format</h5>
                    <p className="text-gray-600 dark:text-gray-400">{selectedReport.format}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Last Generated</h5>
                    <p className="text-gray-600 dark:text-gray-400">{selectedReport.lastGenerated}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">File Size</h5>
                    <p className="text-gray-600 dark:text-gray-400">{selectedReport.size}</p>
                  </div>
                </div>

                {selectedReport.frequency && (
                  <div>
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Automation</h5>
                    <p className="text-gray-600 dark:text-gray-400">Generated {selectedReport.frequency.toLowerCase()}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleShareReport(selectedReport.id)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
                <button
                  onClick={() => handleDownloadReport(selectedReport.id, selectedReport.name)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Visualization Modal */}
        {showDataVisualization && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div>
                  <h3 className="text-xl font-bold">Data Visualization Center</h3>
                  <p className="text-blue-100">Interactive charts and graphs for your HR data</p>
                </div>
                <button
                  onClick={() => setShowDataVisualization(false)}
                  className="text-blue-100 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Headcount Trends */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Headcount Trends</h4>
                    <div className="h-48 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-400">Interactive chart showing headcount growth over time</p>
                      </div>
                    </div>
                  </div>

                  {/* Department Distribution */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Department Distribution</h4>
                    <div className="h-48 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Users className="h-12 w-12 text-green-600 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-400">Pie chart showing employee distribution by department</p>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Performance Metrics</h4>
                    <div className="h-48 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-400">Line chart showing performance trends over time</p>
                      </div>
                    </div>
                  </div>

                  {/* Compensation Analysis */}
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Compensation Analysis</h4>
                    <div className="h-48 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <DollarSign className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-400">Scatter plot showing salary distribution and equity</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Interactive Features:</strong> Click and drag to zoom, hover for details, export charts as images, 
                    filter data in real-time, and create custom visualizations with our drag-and-drop builder.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights Detail Modal */}
        {selectedInsight && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">AI Insight Details</h3>
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {getInsightIcon(selectedInsight.type)}
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white dark:text-white">{selectedInsight.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedInsight.priority === 'high' ? 'bg-red-100 text-red-800' :
                        selectedInsight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedInsight.priority} priority
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:text-gray-300 dark:text-gray-300 text-xs rounded-full">
                        {selectedInsight.category}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Analysis</h5>
                  <p className="text-gray-600 dark:text-gray-400">{selectedInsight.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Current Value</h5>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{selectedInsight.value}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Change</h5>
                    <p className={`text-lg font-medium ${
                      selectedInsight.trend === 'up' ? 'text-green-600' : 
                      selectedInsight.trend === 'down' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {selectedInsight.change}
                    </p>
                  </div>
                </div>

                {selectedInsight.actionable && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <h5 className="font-medium text-yellow-900 mb-2">Recommended Actions</h5>
                    <div className="space-y-2 text-sm text-yellow-800">
                      {selectedInsight.category === 'Retention' && (
                        <>
                          <p>• Schedule retention conversations with at-risk employees</p>
                          <p>• Conduct exit interview analysis to identify patterns</p>
                          <p>• Review compensation and benefits competitiveness</p>
                          <p>• Implement employee engagement initiatives</p>
                        </>
                      )}
                      {selectedInsight.category === 'Compensation' && (
                        <>
                          <p>• Conduct detailed pay equity analysis</p>
                          <p>• Review job descriptions and compensation bands</p>
                          <p>• Benchmark against market rates</p>
                          <p>• Develop salary adjustment plan</p>
                        </>
                      )}
                      {selectedInsight.category === 'Benefits' && (
                        <>
                          <p>• Survey employees about benefit preferences</p>
                          <p>• Increase awareness through communication campaigns</p>
                          <p>• Review benefit offerings and accessibility</p>
                          <p>• Consider alternative benefit options</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                {selectedInsight.actionable && (
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Create Action Plan
                  </button>
                )}
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

export default HRDataReportingModal;