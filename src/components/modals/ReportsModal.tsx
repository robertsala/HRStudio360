import React, { useState } from 'react';
import { X, FileText, Download, Eye, Calendar, Users, DollarSign, BarChart3, TrendingUp, Filter, Search, Plus, Send, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface Report {
  id: string;
  name: string;
  category: string;
  description: string;
  lastGenerated: string;
  format: string;
  size: string;
  status: 'Ready' | 'Generating' | 'Error';
}

interface GeneratedReport {
  id: string;
  name: string;
  category: string;
  format: string;
  size: string;
  generatedDate: string;
  generatedBy: string;
  downloadCount: number;
  sharedWith: string[];
  filePath: string;
  status: 'Available' | 'Expired' | 'Archived';
}

interface ReportsModalProps {
  onClose?: () => void;
}

const ReportsModal: React.FC<ReportsModalProps> = ({ onClose }) => {
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

  const [activeTab, setActiveTab] = useState('available');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedGeneratedReport, setSelectedGeneratedReport] = useState<GeneratedReport | null>(null);
  const [showCustomReportModal, setShowCustomReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareReportId, setShareReportId] = useState('');
  const [shareEmails, setShareEmails] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [shareSuccessMessage, setShareSuccessMessage] = useState('');
  const [customReport, setCustomReport] = useState({
    name: '',
    category: 'HR',
    dateRange: '30days',
    format: 'PDF',
    fields: [] as string[]
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedReport) {
          setSelectedReport(null);
        } else if (selectedGeneratedReport) {
          setSelectedGeneratedReport(null);
        } else if (showCustomReportModal) {
          setShowCustomReportModal(false);
        } else if (showShareModal) {
          setShowShareModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedReport, selectedGeneratedReport, showCustomReportModal, showShareModal]);

  const reports: Report[] = [
    // HR Reports
    {
      id: '1',
      name: 'Employee Directory',
      category: 'HR',
      description: 'Complete list of all active employees with contact information',
      lastGenerated: '2025-01-10',
      format: 'PDF',
      size: '2.3 MB',
      status: 'Ready'
    },
    {
      id: '2',
      name: 'Headcount by Department',
      category: 'HR',
      description: 'Employee count breakdown by department and job level',
      lastGenerated: '2025-01-09',
      format: 'Excel',
      size: '1.1 MB',
      status: 'Ready'
    },
    {
      id: '3',
      name: 'New Hire Report',
      category: 'HR',
      description: 'Recent hires with onboarding status and completion rates',
      lastGenerated: '2025-01-08',
      format: 'PDF',
      size: '890 KB',
      status: 'Ready'
    },
    {
      id: '4',
      name: 'Turnover Analysis',
      category: 'HR',
      description: 'Employee turnover rates by department and reasons for leaving',
      lastGenerated: '2025-01-07',
      format: 'Excel',
      size: '1.5 MB',
      status: 'Ready'
    },
    // Payroll Reports
    {
      id: '5',
      name: 'Payroll Register',
      category: 'Payroll',
      description: 'Detailed payroll breakdown for current pay period',
      lastGenerated: '2025-01-10',
      format: 'PDF',
      size: '3.2 MB',
      status: 'Ready'
    },
    {
      id: '6',
      name: 'Tax Liability Summary',
      category: 'Payroll',
      description: 'Summary of all tax withholdings and employer contributions',
      lastGenerated: '2025-01-10',
      format: 'Excel',
      size: '1.8 MB',
      status: 'Ready'
    },
    {
      id: '7',
      name: 'Labor Cost Analysis',
      category: 'Payroll',
      description: 'Department-wise labor costs and budget variance analysis',
      lastGenerated: '2025-01-09',
      format: 'PDF',
      size: '2.1 MB',
      status: 'Ready'
    },
    {
      id: '8',
      name: 'Year-to-Date Earnings',
      category: 'Payroll',
      description: 'YTD earnings summary for all employees',
      lastGenerated: '2025-01-08',
      format: 'Excel',
      size: '2.7 MB',
      status: 'Ready'
    },
    // Performance Reports
    {
      id: '9',
      name: 'Performance Review Summary',
      category: 'Performance',
      description: 'Completed performance reviews with ratings distribution',
      lastGenerated: '2025-01-06',
      format: 'PDF',
      size: '1.9 MB',
      status: 'Ready'
    },
    {
      id: '10',
      name: 'Goal Achievement Report',
      category: 'Performance',
      description: 'Employee goal completion rates by department',
      lastGenerated: '2025-01-05',
      format: 'Excel',
      size: '1.3 MB',
      status: 'Ready'
    },
    {
      id: '11',
      name: 'Training Completion Report',
      category: 'Performance',
      description: 'Training program completion rates and certifications',
      lastGenerated: '2025-01-04',
      format: 'PDF',
      size: '1.6 MB',
      status: 'Ready'
    },
    // Benefits Reports
    {
      id: '12',
      name: 'Benefits Enrollment Summary',
      category: 'Benefits',
      description: 'Employee benefits enrollment by plan type',
      lastGenerated: '2025-01-03',
      format: 'Excel',
      size: '1.4 MB',
      status: 'Ready'
    },
    {
      id: '13',
      name: 'Healthcare Utilization',
      category: 'Benefits',
      description: 'Healthcare plan usage and cost analysis',
      lastGenerated: '2025-01-02',
      format: 'PDF',
      size: '2.0 MB',
      status: 'Ready'
    },
    {
      id: '14',
      name: 'Retirement Plan Participation',
      category: 'Benefits',
      description: '401(k) participation rates and contribution levels',
      lastGenerated: '2025-01-01',
      format: 'Excel',
      size: '1.2 MB',
      status: 'Ready'
    },
    // Compliance Reports
    {
      id: '15',
      name: 'EEO-1 Report',
      category: 'Compliance',
      description: 'Equal Employment Opportunity workforce demographics',
      lastGenerated: '2024-12-30',
      format: 'PDF',
      size: '980 KB',
      status: 'Ready'
    },
    {
      id: '16',
      name: 'FMLA Usage Report',
      category: 'Compliance',
      description: 'Family and Medical Leave Act usage tracking',
      lastGenerated: '2024-12-29',
      format: 'Excel',
      size: '1.1 MB',
      status: 'Ready'
    },
    {
      id: '17',
      name: 'Safety Incident Report',
      category: 'Compliance',
      description: 'Workplace safety incidents and corrective actions',
      lastGenerated: '2024-12-28',
      format: 'PDF',
      size: '1.5 MB',
      status: 'Ready'
    }
  ];

  const generatedReports: GeneratedReport[] = [
    {
      id: 'gen-1',
      name: 'Employee Directory - January 2025',
      category: 'HR',
      format: 'PDF',
      size: '2.3 MB',
      generatedDate: '2025-01-10T14:30:00Z',
      generatedBy: 'Sarah Johnson',
      downloadCount: 5,
      sharedWith: ['mike.chen@company.com', 'lisa.rodriguez@company.com'],
      filePath: '/reports/employee-directory-jan-2025.pdf',
      status: 'Available'
    },
    {
      id: 'gen-2',
      name: 'Payroll Register - Pay Period 01/01-01/15',
      category: 'Payroll',
      format: 'Excel',
      size: '3.2 MB',
      generatedDate: '2025-01-10T09:15:00Z',
      generatedBy: 'Emma Wilson',
      downloadCount: 12,
      sharedWith: ['finance@company.com'],
      filePath: '/reports/payroll-register-jan-01-15.xlsx',
      status: 'Available'
    },
    {
      id: 'gen-3',
      name: 'Q4 Performance Review Summary',
      category: 'Performance',
      format: 'PDF',
      size: '1.9 MB',
      generatedDate: '2025-01-08T16:45:00Z',
      generatedBy: 'Mike Chen',
      downloadCount: 8,
      sharedWith: ['hr@company.com', 'managers@company.com'],
      filePath: '/reports/q4-performance-summary.pdf',
      status: 'Available'
    },
    {
      id: 'gen-4',
      name: 'Benefits Enrollment Report - 2025',
      category: 'Benefits',
      format: 'Excel',
      size: '1.4 MB',
      generatedDate: '2025-01-07T11:20:00Z',
      generatedBy: 'David Kim',
      downloadCount: 3,
      sharedWith: ['benefits@company.com'],
      filePath: '/reports/benefits-enrollment-2025.xlsx',
      status: 'Available'
    },
    {
      id: 'gen-5',
      name: 'Custom Labor Cost Analysis - Engineering',
      category: 'Payroll',
      format: 'PDF',
      size: '2.1 MB',
      generatedDate: '2025-01-06T13:10:00Z',
      generatedBy: 'Sarah Johnson',
      downloadCount: 15,
      sharedWith: ['engineering-leads@company.com', 'finance@company.com'],
      filePath: '/reports/labor-cost-engineering.pdf',
      status: 'Available'
    },
    {
      id: 'gen-6',
      name: 'EEO-1 Report - 2024',
      category: 'Compliance',
      format: 'PDF',
      size: '980 KB',
      generatedDate: '2024-12-30T10:00:00Z',
      generatedBy: 'Lisa Rodriguez',
      downloadCount: 2,
      sharedWith: [],
      filePath: '/reports/eeo-1-2024.pdf',
      status: 'Archived'
    }
  ];

  const categories = ['All', 'HR', 'Payroll', 'Performance', 'Benefits', 'Compliance'];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'HR': return <Users className="h-5 w-5 text-blue-600" />;
      case 'Payroll': return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'Performance': return <TrendingUp className="h-5 w-5 text-purple-600" />;
      case 'Benefits': return <BarChart3 className="h-5 w-5 text-orange-600" />;
      case 'Compliance': return <FileText className="h-5 w-5 text-red-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
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

  const getGeneratedStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Expired': return 'bg-yellow-100 text-yellow-800';
      case 'Archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
    alert(`Downloading ${reportName}...`);
  };

  const handleShareReport = (reportId: string) => {
    setShareReportId(reportId);
    setShowShareModal(true);
  };

  const handleSendShare = () => {
    if (!shareEmails.trim()) {
      setNotification({
        type: 'error',
        message: 'Please enter at least one email address'
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    
    const emails = shareEmails.split(',').map(email => email.trim());
    console.log('Sharing report:', shareReportId, 'with:', emails, 'message:', shareMessage);
    
    setShareSuccessMessage(`Report shared successfully with ${emails.length} recipient(s)!`);
    setShowShareSuccess(true);
    
    setTimeout(() => {
      setShowShareSuccess(false);
      setShareSuccessMessage('');
    }, 3000);
    
    setShareEmails('');
    setShareMessage('');
    setShowShareModal(false);
    setShareReportId('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' at ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredReports = reports.filter(report => {
    const matchesCategory = activeCategory === 'All' || report.category === activeCategory;
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredGeneratedReports = generatedReports.filter(report => {
    const matchesCategory = activeCategory === 'All' || report.category === activeCategory;
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const tabs = [
    { id: 'available', label: 'Available Reports', count: reports.length },
    { id: 'generated', label: 'Generated Reports', count: generatedReports.length }
  ];

  return (
    <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-orange-600 to-red-600 text-white">
          <div className="flex items-center">
            <FileText className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Reports Center</h2>
              <p className="text-orange-100">Generate and download comprehensive HR reports</p>
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
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    activeCategory === category
                      ? 'bg-orange-100 border-orange-500 text-orange-700 font-medium'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-1 mr-2 animate-pulse">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-purple-600">AI</span>
                </div>
                <input
                  type="text"
                  placeholder="AI Search: Try 'Payroll', 'Benefits', 'Q4', etc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-16 pr-4 py-2 border-2 border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 bg-purple-50 dark:bg-purple-900/20/50 placeholder-gray-500 transition-all duration-200"
                />
              </div>
              <button
                onClick={() => setShowCustomReportModal(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Custom Report
              </button>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="overflow-y-auto max-h-96">
          <div className="p-6">
            {/* Available Reports Tab */}
            {activeTab === 'available' && (
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
                          onClick={() => handleGenerateReport(report.id)}
                          className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
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
            )}

            {/* Generated Reports Tab */}
            {activeTab === 'generated' && (
              <div className="grid gap-4">
                {filteredGeneratedReports.map((report) => (
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
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGeneratedStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                            <span>Generated: {formatDate(report.generatedDate)}</span>
                            <span>By: {report.generatedBy}</span>
                            <span>Format: {report.format}</span>
                            <span>Size: {report.size}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                            <span>Downloads: {report.downloadCount}</span>
                            <span>Shared with: {report.sharedWith.length} people</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedGeneratedReport(report)}
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
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredGeneratedReports.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No generated reports found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadReport(selectedReport.id, selectedReport.name)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
              <button
                onClick={() => handleGenerateReport(selectedReport.id)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Report Details Modal */}
      {selectedGeneratedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Generated Report Details</h3>
              <button
                onClick={() => setSelectedGeneratedReport(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {getCategoryIcon(selectedGeneratedReport.category)}
                <div>
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white dark:text-white">{selectedGeneratedReport.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGeneratedStatusColor(selectedGeneratedReport.status)}`}>
                    {selectedGeneratedReport.status}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Category</h5>
                  <p className="text-gray-600 dark:text-gray-400">{selectedGeneratedReport.category}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Format</h5>
                  <p className="text-gray-600 dark:text-gray-400">{selectedGeneratedReport.format}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Generated Date</h5>
                  <p className="text-gray-600 dark:text-gray-400">{formatDate(selectedGeneratedReport.generatedDate)}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Generated By</h5>
                  <p className="text-gray-600 dark:text-gray-400">{selectedGeneratedReport.generatedBy}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">File Size</h5>
                  <p className="text-gray-600 dark:text-gray-400">{selectedGeneratedReport.size}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Download Count</h5>
                  <p className="text-gray-600 dark:text-gray-400">{selectedGeneratedReport.downloadCount} times</p>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Shared With ({selectedGeneratedReport.sharedWith.length})</h5>
                {selectedGeneratedReport.sharedWith.length > 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    {selectedGeneratedReport.sharedWith.map((email, index) => (
                      <div key={index} className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        • {email}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Not shared with anyone yet</p>
                )}
              </div>
              
              <div>
                <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">File Path</h5>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                  {selectedGeneratedReport.filePath}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedGeneratedReport(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleShareReport(selectedGeneratedReport.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Share Report
              </button>
              <button
                onClick={() => handleDownloadReport(selectedGeneratedReport.id, selectedGeneratedReport.name)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Report Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Share Report</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Email Addresses (comma-separated)
                </label>
                <textarea
                  value={shareEmails}
                  onChange={(e) => setShareEmails(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="john.doe@company.com, jane.smith@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Please find the attached report for your review..."
                />
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> Recipients will receive an email with a secure link to download the report. 
                  The link will expire in 30 days for security purposes.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendShare}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Report Modal */}
      {showCustomReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Custom Report Generator</h3>
              <button
                onClick={() => setShowCustomReportModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Report Name *</label>
                <input
                  type="text"
                  value={customReport.name}
                  onChange={(e) => setCustomReport({ ...customReport, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Q1 Department Headcount"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Category *</label>
                  <select
                    value={customReport.category}
                    onChange={(e) => setCustomReport({ ...customReport, category: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="HR">HR</option>
                    <option value="Payroll">Payroll</option>
                    <option value="Performance">Performance</option>
                    <option value="Benefits">Benefits</option>
                    <option value="Time & Attendance">Time & Attendance</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Date Range *</label>
                  <select
                    value={customReport.dateRange}
                    onChange={(e) => setCustomReport({ ...customReport, dateRange: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                    <option value="thisyear">This Year</option>
                    <option value="lastyear">Last Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Report Format *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['PDF', 'Excel', 'CSV'].map((format) => (
                    <button
                      key={format}
                      onClick={() => setCustomReport({ ...customReport, format })}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        customReport.format === format
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Include Fields</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Employee Name',
                    'Department',
                    'Position',
                    'Hire Date',
                    'Salary',
                    'Status',
                    'Manager',
                    'Location'
                  ].map((field) => (
                    <label key={field} className="flex items-center space-x-2">
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
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{field}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Report Preview</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Name:</strong> {customReport.name || 'Not specified'}</p>
                  <p><strong>Category:</strong> {customReport.category}</p>
                  <p><strong>Format:</strong> {customReport.format}</p>
                  <p><strong>Fields:</strong> {customReport.fields.length > 0 ? customReport.fields.join(', ') : 'None selected'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCustomReportModal(false);
                  setCustomReport({
                    name: '',
                    category: 'HR',
                    dateRange: '30days',
                    format: 'PDF',
                    fields: []
                  });
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (customReport.name && customReport.fields.length > 0) {
                    setShowCustomReportModal(false);
                    setNotification({
                      type: 'success',
                      message: `Custom report "${customReport.name}" has been generated successfully!`
                    });
                    setTimeout(() => setNotification(null), 3000);
                    setCustomReport({
                      name: '',
                      category: 'HR',
                      dateRange: '30days',
                      format: 'PDF',
                      fields: []
                    });
                  } else {
                    setNotification({
                      type: 'error',
                      message: 'Please provide a report name and select at least one field.'
                    });
                    setTimeout(() => setNotification(null), 3000);
                  }
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Success Notification */}
      {showShareSuccess && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-70 flex items-center">
          <div className="bg-green-50 dark:bg-green-900/200 rounded-full p-1 mr-3">
            <CheckCircle className="h-4 w-4" />
          </div>
          <span>{shareSuccessMessage}</span>
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
              <AlertCircle className="h-4 w-4" />
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

export default ReportsModal;