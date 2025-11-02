import React, { useState } from 'react';
import { Clock, Users, CheckCircle, X, AlertTriangle, CreditCard as Edit3, Save, Send, Eye, Download, Filter, Search, Calendar, TrendingUp, DollarSign, Timer, Coffee, Target, Brain, Zap, Bell, Award } from 'lucide-react';

interface TimeEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakHours: number;
  status: 'active' | 'completed' | 'pending_approval' | 'approved' | 'rejected';
  location?: string;
  notes?: string;
  department: string;
  role: string;
}

interface Timesheet {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  role: string;
  weekStartDate: string;
  weekEndDate: string;
  entries: TimeEntry[];
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalBreakHours: number;
  expectedHours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'processed';
  submittedDate?: string;
  approvedDate?: string;
  approvedBy?: string;
  rejectionReason?: string;
  managerNotes?: string;
  profilePicture?: string;
}

interface AIInsight {
  type: 'warning' | 'error' | 'suggestion' | 'compliance';
  title: string;
  message: string;
  action?: string;
  severity: 'low' | 'medium' | 'high';
  timesheetId?: string;
}

const ManagerTimesheetApprovalModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [showTimesheetDetail, setShowTimesheetDetail] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedTimesheets, setSelectedTimesheets] = useState<string[]>([]);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  // Mock timesheets data
  const [timesheets, setTimesheets] = useState<Timesheet[]>([
    {
      id: '1',
      employeeId: 'emp-001',
      employeeName: 'David Kim',
      department: 'Engineering',
      role: 'Frontend Developer',
      weekStartDate: '2025-01-20',
      weekEndDate: '2025-01-26',
      totalRegularHours: 38.5,
      totalOvertimeHours: 2.5,
      totalBreakHours: 5,
      expectedHours: 40,
      status: 'submitted',
      submittedDate: '2025-01-26T17:00:00Z',
      profilePicture: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      entries: [
        {
          id: 'e1',
          employeeId: 'emp-001',
          employeeName: 'David Kim',
          date: '2025-01-20',
          clockIn: '09:00',
          clockOut: '17:30',
          breakStart: '12:00',
          breakEnd: '13:00',
          totalHours: 7.5,
          regularHours: 7.5,
          overtimeHours: 0,
          breakHours: 1,
          status: 'completed',
          department: 'Engineering',
          role: 'Frontend Developer'
        },
        {
          id: 'e2',
          employeeId: 'emp-001',
          employeeName: 'David Kim',
          date: '2025-01-21',
          clockIn: '08:45',
          clockOut: '18:15',
          breakStart: '12:30',
          breakEnd: '13:30',
          totalHours: 8.5,
          regularHours: 8,
          overtimeHours: 0.5,
          breakHours: 1,
          status: 'completed',
          department: 'Engineering',
          role: 'Frontend Developer'
        }
      ]
    },
    {
      id: '2',
      employeeId: 'emp-002',
      employeeName: 'Emma Wilson',
      department: 'HR',
      role: 'HR Specialist',
      weekStartDate: '2025-01-20',
      weekEndDate: '2025-01-26',
      totalRegularHours: 40,
      totalOvertimeHours: 0,
      totalBreakHours: 5,
      expectedHours: 40,
      status: 'submitted',
      submittedDate: '2025-01-26T16:30:00Z',
      profilePicture: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      entries: []
    },
    {
      id: '3',
      employeeId: 'emp-003',
      employeeName: 'Alex Thompson',
      department: 'Marketing',
      role: 'Marketing Coordinator',
      weekStartDate: '2025-01-20',
      weekEndDate: '2025-01-26',
      totalRegularHours: 35,
      totalOvertimeHours: 0,
      totalBreakHours: 4,
      expectedHours: 40,
      status: 'submitted',
      submittedDate: '2025-01-26T15:45:00Z',
      profilePicture: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      entries: []
    }
  ]);

  // AI Insights for manager
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([
    {
      type: 'warning',
      title: 'Overtime Pattern Alert',
      message: 'David Kim has worked overtime 3 times this week. Consider workload adjustment.',
      action: 'Review workload distribution',
      severity: 'medium',
      timesheetId: '1'
    },
    {
      type: 'suggestion',
      title: 'Productivity Optimization',
      message: 'Team productivity is 15% higher on Tuesdays and Wednesdays. Consider flexible scheduling.',
      action: 'Implement flexible hours',
      severity: 'low'
    },
    {
      type: 'compliance',
      title: 'Break Time Compliance',
      message: 'All team members are taking adequate break time. Great job maintaining work-life balance!',
      severity: 'low'
    }
  ]);

  const filteredTimesheets = timesheets.filter(timesheet => {
    const matchesDepartment = filterDepartment === 'All' || timesheet.department === filterDepartment;
    const matchesSearch = timesheet.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         timesheet.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         timesheet.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'pending' ? timesheet.status === 'submitted' :
                      activeTab === 'approved' ? timesheet.status === 'approved' :
                      activeTab === 'all' ? true : false;
    
    return matchesDepartment && matchesSearch && matchesTab;
  });

  const handleApproveTimesheet = (timesheetId: string) => {
    const timesheet = timesheets.find(t => t.id === timesheetId);
    if (!timesheet) return;

    setTimesheets(prev => prev.map(t => 
      t.id === timesheetId 
        ? { 
            ...t, 
            status: 'approved' as const,
            approvedDate: new Date().toISOString(),
            approvedBy: 'Current Manager'
          }
        : t
    ));

    // Send to payroll
    console.log('Sending approved timesheet to payroll:', {
      timesheetId,
      employeeName: timesheet.employeeName,
      totalRegularHours: timesheet.totalRegularHours,
      totalOvertimeHours: timesheet.totalOvertimeHours,
      weekPeriod: `${timesheet.weekStartDate} to ${timesheet.weekEndDate}`
    });

    setNotification({
      type: 'success',
      message: `Timesheet approved for ${timesheet.employeeName}. Sent to payroll processing.`
    });
    setTimeout(() => setNotification(null), 4000);
    
    setSelectedTimesheet(null);
    setShowTimesheetDetail(false);
  };

  const handleRejectTimesheet = (timesheetId: string, reason: string) => {
    const timesheet = timesheets.find(t => t.id === timesheetId);
    if (!timesheet) return;

    setTimesheets(prev => prev.map(t => 
      t.id === timesheetId 
        ? { 
            ...t, 
            status: 'rejected' as const,
            rejectionReason: reason
          }
        : t
    ));

    setNotification({
      type: 'info',
      message: `Timesheet rejected for ${timesheet.employeeName}. Employee has been notified.`
    });
    setTimeout(() => setNotification(null), 4000);
    
    setSelectedTimesheet(null);
    setShowTimesheetDetail(false);
  };

  const handleBulkApprove = () => {
    const selectedTimesheetData = timesheets.filter(timesheet => selectedTimesheets.includes(t.id));
    
    setTimesheets(prev => prev.map(t => 
      selectedTimesheets.includes(t.id)
        ? { 
            ...t, 
            status: 'approved' as const,
            approvedDate: new Date().toISOString(),
            approvedBy: 'Current Manager'
          }
        : t
    ));

    // Send all to payroll
    selectedTimesheetData.forEach(timesheet => {
      console.log('Bulk sending to payroll:', {
        timesheetId: timesheet.id,
        employeeName: timesheet.employeeName,
        totalHours: timesheet.totalRegularHours + timesheet.totalOvertimeHours
      });
    });

    setNotification({
      type: 'success',
      message: `${selectedTimesheets.length} timesheets approved and sent to payroll.`
    });
    setTimeout(() => setNotification(null), 4000);
    
    setSelectedTimesheets([]);
    setShowBulkActions(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'suggestion': return <Brain className="h-4 w-4 text-blue-600" />;
      case 'compliance': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Brain className="h-4 w-4 text-purple-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'suggestion': return 'border-l-blue-500 bg-blue-50';
      case 'compliance': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-purple-500 bg-purple-50';
    }
  };

  const departments = ['All', ...Array.from(new Set(timesheets.map(t => t.department)))];
  const pendingCount = timesheets.filter(timesheet => t.status === 'submitted').length;
  const approvedCount = timesheets.filter(timesheet => t.status === 'approved').length;

  const tabs = [
    { id: 'pending', label: 'Pending Approval', count: pendingCount },
    { id: 'approved', label: 'Approved', count: approvedCount },
    { id: 'all', label: 'All Timesheets', count: timesheets.length },
    { id: 'analytics', label: 'Team Analytics', count: 0 }
  ];

  return (
    <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center">
            <Users className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Timesheet Approvals</h2>
              <p className="text-purple-100">Review and approve team timesheets</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {pendingCount > 0 && (
              <div className="flex items-center bg-white dark:bg-gray-800 dark:bg-gray-800/20 rounded-full px-3 py-1">
                <Bell className="h-4 w-4 mr-1" />
                <span className="text-sm">{pendingCount} pending</span>
              </div>
            )}
            <button
              onClick={() => setShowAIInsights(true)}
              className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/30 transition-colors flex items-center"
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Insights
            </button>
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
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </button>
            ))}
          </nav>
        </div>

        {/* Filters and Actions */}
        <div className="p-6 border-b bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {activeTab === 'pending' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Bulk Actions
                </button>
                {selectedTimesheets.length > 0 && (
                  <button
                    onClick={handleBulkApprove}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve Selected ({selectedTimesheets.length})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-y-auto max-h-96">
          <div className="p-6">
            {/* Pending Approval Tab */}
            {activeTab === 'pending' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Pending Timesheet Approvals</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredTimesheets.length} timesheet{filteredTimesheets.length !== 1 ? 's' : ''} awaiting approval
                  </div>
                </div>

                <div className="grid gap-6">
                  {filteredTimesheets.map((timesheet) => (
                    <div key={timesheet.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          {showBulkActions && (
                            <input
                              type="checkbox"
                              checked={selectedTimesheets.includes(timesheet.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTimesheets(prev => [...prev, timesheet.id]);
                                } else {
                                  setSelectedTimesheets(prev => prev.filter(id => id !== timesheet.id));
                                }
                              }}
                              className="mt-1 text-purple-600 focus:ring-purple-500"
                            />
                          )}
                          <div className="w-12 h-12 rounded-full overflow-hidden">
                            {timesheet.profilePicture ? (
                              <img
                                src={timesheet.profilePicture}
                                alt={timesheet.employeeName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                {timesheet.employeeName.split(' ').map(n => n.charAt(0)).join('')}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">{timesheet.employeeName}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(timesheet.status)}`}>
                                {timesheet.status.replace('_', ' ')}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                              <div>
                                <span className="font-medium">Department:</span> {timesheet.department}
                              </div>
                              <div>
                                <span className="font-medium">Role:</span> {timesheet.role}
                              </div>
                              <div>
                                <span className="font-medium">Regular Hours:</span> {timesheet.totalRegularHours}h
                              </div>
                              <div>
                                <span className="font-medium">Overtime:</span> 
                                <span className={timesheet.totalOvertimeHours > 0 ? 'text-orange-600 font-bold' : ''}>
                                  {timesheet.totalOvertimeHours}h
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Submitted:</span> {new Date(timesheet.submittedDate!).toLocaleDateString()}
                              </div>
                            </div>

                            {/* Hours Breakdown */}
                            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-3 border">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                  <div className="text-center">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Expected</p>
                                    <p className="font-bold text-gray-900 dark:text-white dark:text-white">{timesheet.expectedHours}h</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Worked</p>
                                    <p className="font-bold text-blue-600">
                                      {timesheet.totalRegularHours + timesheet.totalOvertimeHours}h
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Break</p>
                                    <p className="font-bold text-purple-600">{timesheet.totalBreakHours}h</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Variance</p>
                                    <p className={`font-bold ${
                                      (timesheet.totalRegularHours + timesheet.totalOvertimeHours) > timesheet.expectedHours 
                                        ? 'text-orange-600' 
                                        : 'text-green-600'
                                    }`}>
                                      {((timesheet.totalRegularHours + timesheet.totalOvertimeHours) - timesheet.expectedHours).toFixed(1)}h
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedTimesheet(timesheet);
                                      setShowTimesheetDetail(true);
                                    }}
                                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleRejectTimesheet(timesheet.id, 'Hours need adjustment')}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveTimesheet(timesheet.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve & Send to Payroll
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredTimesheets.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No pending timesheets to approve</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Team Time Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm">Team Utilization</p>
                        <p className="text-3xl font-bold text-blue-700">94%</p>
                      </div>
                      <Target className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm">On-Time Rate</p>
                        <p className="text-3xl font-bold text-green-700">96%</p>
                      </div>
                      <Clock className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-600 text-sm">Overtime Hours</p>
                        <p className="text-3xl font-bold text-orange-700">12.5h</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-500" />
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm">Avg Daily Hours</p>
                        <p className="text-3xl font-bold text-purple-700">7.8h</p>
                      </div>
                      <Award className="h-8 w-8 text-purple-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Department Breakdown</h4>
                  <div className="space-y-4">
                    {[
                      { dept: 'Engineering', hours: 156, overtime: 8, employees: 4 },
                      { dept: 'Marketing', hours: 78, overtime: 2, employees: 2 },
                      { dept: 'HR', hours: 40, overtime: 0, employees: 1 }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="bg-purple-100 rounded-full p-2">
                            <Users className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white dark:text-white">{item.dept}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.employees} employees</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white dark:text-white">{item.hours}h total</p>
                          <p className="text-sm text-orange-600">{item.overtime}h overtime</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timesheet Detail Modal */}
      {showTimesheetDetail && selectedTimesheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  {selectedTimesheet.profilePicture ? (
                    <img
                      src={selectedTimesheet.profilePicture}
                      alt={selectedTimesheet.employeeName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white dark:bg-gray-800 dark:bg-gray-800/20 flex items-center justify-center text-white font-bold">
                      {selectedTimesheet.employeeName.split(' ').map(n => n.charAt(0)).join('')}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedTimesheet.employeeName}</h3>
                  <p className="text-purple-100">
                    {selectedTimesheet.role} • Week of {new Date(selectedTimesheet.weekStartDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTimesheetDetail(false)}
                className="text-purple-100 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Week Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-blue-600 text-sm">Expected Hours</p>
                  <p className="text-2xl font-bold text-blue-700">{selectedTimesheet.expectedHours}h</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-green-600 text-sm">Regular Hours</p>
                  <p className="text-2xl font-bold text-green-700">{selectedTimesheet.totalRegularHours}h</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <p className="text-orange-600 text-sm">Overtime Hours</p>
                  <p className="text-2xl font-bold text-orange-700">{selectedTimesheet.totalOvertimeHours}h</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <p className="text-purple-600 text-sm">Break Hours</p>
                  <p className="text-2xl font-bold text-purple-700">{selectedTimesheet.totalBreakHours}h</p>
                </div>
              </div>

              {/* Daily Breakdown */}
              <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-b">
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">Daily Time Entries</h4>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overtime</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedTimesheet.entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50 dark:bg-gray-900">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">
                            {editingEntry === entry.id ? (
                              <input
                                type="time"
                                defaultValue={entry.clockIn}
                                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs"
                              />
                            ) : (
                              entry.clockIn
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">
                            {editingEntry === entry.id ? (
                              <input
                                type="time"
                                defaultValue={entry.clockOut}
                                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs"
                              />
                            ) : (
                              entry.clockOut || 'N/A'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">
                            {entry.breakStart && entry.breakEnd 
                              ? `${entry.breakStart} - ${entry.breakEnd}` 
                              : 'No break'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white dark:text-white">
                            {entry.totalHours.toFixed(1)}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white dark:text-white">
                            {entry.overtimeHours > 0 ? (
                              <span className="text-orange-600 font-medium">
                                {entry.overtimeHours.toFixed(1)}h
                              </span>
                            ) : (
                              '0h'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingEntry === entry.id ? (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => setEditingEntry(null)}
                                  className="p-1 text-green-600 hover:text-green-700"
                                >
                                  <Save className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => setEditingEntry(null)}
                                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 dark:text-gray-300"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingEntry(entry.id)}
                                className="p-1 text-blue-600 hover:text-blue-700"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Manager Notes */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Manager Notes (Optional)
                </label>
                <textarea
                  placeholder="Add any notes about this timesheet approval..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setShowTimesheetDetail(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleRejectTimesheet(selectedTimesheet.id, 'Requires adjustments')}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </button>
              <button
                onClick={() => handleApproveTimesheet(selectedTimesheet.id)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve & Send to Payroll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Modal */}
      {showAIInsights && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <div className="flex items-center">
                <Brain className="h-8 w-8 mr-3" />
                <div>
                  <h3 className="text-xl font-bold">AI Time Tracking Insights</h3>
                  <p className="text-purple-100">Intelligent analysis of team time patterns</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIInsights(false)}
                className="text-purple-100 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Active Insights</p>
                      <p className="text-3xl font-bold">{aiInsights.length}</p>
                    </div>
                    <Zap className="h-8 w-8 text-blue-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Compliance Score</p>
                      <p className="text-3xl font-bold">98%</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100">Actions Required</p>
                      <p className="text-3xl font-bold">2</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-200" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">AI Recommendations</h4>
                {aiInsights.map((insight, index) => (
                  <div key={index} className={`border-l-4 rounded-lg p-6 ${getInsightColor(insight.type)}`}>
                    <div className="flex items-start space-x-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h5 className="font-medium text-gray-900 dark:text-white dark:text-white">{insight.title}</h5>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            insight.severity === 'high' ? 'bg-red-100 text-red-800' :
                            insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {insight.severity} priority
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3">{insight.message}</p>
                        {insight.action && (
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                            {insight.action}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
          notification.type === 'warning' ? 'bg-yellow-600' :
          'bg-blue-600'
        }`}>
          <div className={`rounded-full p-1 mr-3 ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            notification.type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : notification.type === 'error' ? (
              <X className="h-4 w-4" />
            ) : notification.type === 'warning' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
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

export default ManagerTimesheetApprovalModal;