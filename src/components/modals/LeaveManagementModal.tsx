import React, { useState, useMemo } from 'react';
import { X, Calendar, User, Clock, CheckCircle, AlertCircle, Plus, Filter, Download, Mail, Bell, MapPin, Users, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type EmployeeDirectoryEntry } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { LeaveRequest as DBLeaveRequest, LeaveBalance } from '../../../shared/schema';

interface LeaveRequestWithEmployee {
  id: string;
  employeeId: string;
  employeeNumber?: string; // The actual employee number (not UUID)
  employeeName: string;
  department?: string;
  manager?: string;
  employeeEmail?: string;
  type: 'Vacation' | 'Sick' | 'Personal' | 'Bereavement' | 'Maternity' | 'Paternity' | 'FMLA';
  startDate: string;
  endDate: string;
  days: number;
  status: 'Pending' | 'Approved' | 'Denied' | 'Cancelled';
  reason: string;
  approverId?: string | null;
  coverageArrangements?: string | null;
  emergencyContact?: string | null;
  medicalCertification?: boolean | null;
  notes?: string | null;
  submittedDate?: string | null;
  approvedDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  department: string;
  role: string;
  email: string;
  currentLeave?: {
    type: string;
    startDate: string;
    endDate: string;
    status: string;
  };
}

interface LeaveManagementModalProps {
  onClose?: () => void;
  initialFilter?: {
    type: 'my-team' | 'my-department' | 'my-location' | 'all';
    managerId?: string;
    department?: string;
    location?: string;
  };
  navigationParams?: {
    employeeId?: string;
    employeeName?: string;
    department?: string;
    date?: string;
    type?: 'PTO' | 'Sick';
  };
}

const LeaveManagementModal: React.FC<LeaveManagementModalProps> = ({ onClose, initialFilter, navigationParams }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('requests');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState(
    navigationParams?.type === 'PTO' ? 'Vacation' : navigationParams?.type === 'Sick' ? 'Sick' : 'All'
  );
  const [teamFilter, setTeamFilter] = useState<'my-team' | 'my-department' | 'my-location' | 'all'>(initialFilter?.type || 'all');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestWithEmployee | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showTeamCalendar, setShowTeamCalendar] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const { data: rawLeaveRequests = [], isLoading: isLoadingRequests, isError: isErrorRequests } = useQuery<DBLeaveRequest[]>({
    queryKey: ['/api/leave-requests'],
    enabled: true
  });

  const { data: employeeDirectory = [], isLoading: isLoadingDirectory, isError: isErrorDirectory } = useQuery<EmployeeDirectoryEntry[]>({
    queryKey: ['/api/employees', 'directory'],
    enabled: true
  });

  const { data: leaveBalances = [], isLoading: isLoadingBalances } = useQuery<LeaveBalance[]>({
    queryKey: ['/api/leave-balances'],
    enabled: activeTab === 'balances'
  });

  const currentEmployee = useMemo(() => 
    employeeDirectory.find(emp => emp.userId === user?.id),
    [employeeDirectory, user?.id]
  );

  const leaveRequests = useMemo<LeaveRequestWithEmployee[]>(() => {
    return rawLeaveRequests.map(request => {
      const employee = employeeDirectory.find(emp => emp.id === request.employeeId);
      const fullName = employee?.profile 
        ? `${employee.profile.firstName || ''} ${employee.profile.lastName || ''}`.trim()
        : 'Unknown Employee';
      
      return {
        ...request,
        employeeNumber: employee?.employeeId || undefined, // The actual employee number
        employeeName: fullName || 'Unknown Employee',
        department: employee?.profile?.department || undefined,
        manager: employee?.profile?.managerName || undefined,
        employeeEmail: employee?.profile?.email || undefined
      };
    });
  }, [rawLeaveRequests, employeeDirectory]);

  const approveRequestMutation = useMutation({
    mutationFn: (requestId: string) => apiClient.updateLeaveRequest(requestId, { status: 'Approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests'] });
      setNotification({
        type: 'success',
        message: 'Leave request approved successfully!'
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error?.message || 'Failed to approve leave request'
      });
      setTimeout(() => setNotification(null), 4000);
    }
  });

  const denyRequestMutation = useMutation({
    mutationFn: (requestId: string) => apiClient.updateLeaveRequest(requestId, { status: 'Denied' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests'] });
      setNotification({
        type: 'info',
        message: 'Leave request denied.'
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error?.message || 'Failed to deny leave request'
      });
      setTimeout(() => setNotification(null), 4000);
    }
  });

  const submitRequestMutation = useMutation({
    mutationFn: (request: any) => apiClient.createLeaveRequest(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests'] });
      setNotification({
        type: 'success',
        message: 'Leave request submitted successfully!'
      });
      setTimeout(() => setNotification(null), 4000);
      setShowRequestForm(false);
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error?.message || 'Failed to submit leave request'
      });
      setTimeout(() => setNotification(null), 4000);
    }
  });

  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedRequest) {
          setSelectedRequest(null);
        } else if (showRequestForm) {
          setShowRequestForm(false);
        } else if (showTeamCalendar) {
          setShowTeamCalendar(false);
        } else if (onClose) {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedRequest, showRequestForm, showTeamCalendar, onClose]);

  const [newRequest, setNewRequest] = useState({
    employeeName: 'Current User',
    type: 'Vacation',
    startDate: '',
    endDate: '',
    reason: '',
    coverageArrangements: '',
    emergencyContact: ''
  });

  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      department: 'Engineering',
      role: 'Senior Developer',
      email: 'sarah.johnson@company.com',
      currentLeave: {
        type: 'Personal',
        startDate: '2025-01-25',
        endDate: '2025-01-25',
        status: 'Pending'
      }
    },
    {
      id: '2',
      name: 'David Kim',
      department: 'Engineering',
      role: 'Frontend Developer',
      email: 'david.kim@company.com',
      currentLeave: {
        type: 'Vacation',
        startDate: '2025-02-10',
        endDate: '2025-02-14',
        status: 'Pending'
      }
    },
    {
      id: '3',
      name: 'Emma Wilson',
      department: 'HR',
      role: 'HR Specialist',
      email: 'emma.wilson@company.com'
    },
    {
      id: '4',
      name: 'Mike Chen',
      department: 'Engineering',
      role: 'Engineering Manager',
      email: 'mike.chen@company.com'
    }
  ];

  const handleApproveRequest = (requestId: string) => {
    approveRequestMutation.mutate(requestId);
  };

  const handleDenyRequest = (requestId: string) => {
    denyRequestMutation.mutate(requestId);
  };

  const handleSubmitRequest = () => {
    if (!newRequest.startDate || !newRequest.endDate || !newRequest.reason) {
      setNotification({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (!currentEmployee?.id) {
      setNotification({
        type: 'error',
        message: 'Unable to find your employee record. Please contact HR.'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const start = new Date(newRequest.startDate);
    const end = new Date(newRequest.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const requestData = {
      employeeId: currentEmployee.id,
      type: newRequest.type,
      startDate: newRequest.startDate,
      endDate: newRequest.endDate,
      days,
      reason: newRequest.reason,
      status: 'Pending',
      coverageArrangements: newRequest.coverageArrangements || undefined,
      emergencyContact: newRequest.emergencyContact || undefined
    };

    submitRequestMutation.mutate(requestData);
    
    setNewRequest({
      employeeName: 'Current User',
      type: 'Vacation',
      startDate: '',
      endDate: '',
      reason: '',
      coverageArrangements: '',
      emergencyContact: ''
    });
  };

  const filteredRequests = leaveRequests.filter(request => {
    // If navigated from payroll, filter by specific employee
    if (navigationParams?.employeeName && request.employeeName !== navigationParams.employeeName) {
      return false;
    }

    // If specific date is provided, filter by that date range
    if (navigationParams?.date) {
      const requestStart = new Date(request.startDate);
      const requestEnd = new Date(request.endDate);
      const targetDate = new Date(navigationParams.date);
      if (targetDate < requestStart || targetDate > requestEnd) {
        return false;
      }
    }

    if (teamFilter === 'my-team' && initialFilter?.managerId) {
      if (request.manager !== initialFilter.managerId && request.employeeName !== initialFilter.managerId) {
        return false;
      }
    }

    if (teamFilter === 'my-department' && initialFilter?.department) {
      if (request.department !== initialFilter.department) {
        return false;
      }
    }

    const matchesStatus = filterStatus === 'All' || request.status === filterStatus;
    const matchesType = filterType === 'All' || request.type === filterType;
    return matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Denied': return 'bg-red-100 text-red-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Vacation': return 'bg-blue-100 text-blue-800';
      case 'Sick': return 'bg-red-100 text-red-800';
      case 'Personal': return 'bg-purple-100 text-purple-800';
      case 'Bereavement': return 'bg-gray-100 text-gray-800';
      case 'Maternity': return 'bg-pink-100 text-pink-800';
      case 'Paternity': return 'bg-indigo-100 text-indigo-800';
      case 'FMLA': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'requests', label: 'Leave Requests', count: leaveRequests.length },
    { id: 'calendar', label: 'Team Calendar', count: teamMembers.filter(m => m.currentLeave).length },
    { id: 'analytics', label: 'Leave Analytics', count: 0 },
    { id: 'policies', label: 'Leave Policies', count: 0 }
  ];

  return (
    <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Leave Management</h2>
              <p className="text-emerald-100">Comprehensive leave tracking and approval system</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:bg-gray-900">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              {initialFilter && (
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value as any)}
                  className="border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/30 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-blue-700 dark:text-blue-300"
                >
                  <option value="all">All Employees</option>
                  <option value="my-team">My Team</option>
                  <option value="my-department">My Department</option>
                  <option value="my-location">My Location</option>
                </select>
              )}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Denied">Denied</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="All">All Types</option>
                <option value="Vacation">Vacation</option>
                <option value="Sick">Sick Leave</option>
                <option value="Personal">Personal</option>
                <option value="FMLA">FMLA</option>
                <option value="Maternity">Maternity</option>
                <option value="Paternity">Paternity</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRequestForm(true)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </button>
              <button
                onClick={() => setShowTeamCalendar(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Team Calendar
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-96">
          <div className="p-6">
            {/* Loading State */}
            {(isLoadingRequests || isLoadingDirectory) && (
              <div className="flex items-center justify-center py-12" data-testid="loading-state">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading leave data...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {(isErrorRequests || isErrorDirectory) && !isLoadingRequests && !isLoadingDirectory && (
              <div className="flex items-center justify-center py-12" data-testid="error-state">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 dark:text-red-400 font-medium">Failed to load leave data</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Please try again later or contact support.</p>
                </div>
              </div>
            )}

            {/* Leave Requests Tab */}
            {activeTab === 'requests' && !isLoadingRequests && !isLoadingDirectory && !isErrorRequests && !isErrorDirectory && (
              <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12" data-testid="empty-state">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No leave requests found</p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Submit a new request to get started</p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                  <div key={request.id} className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="bg-emerald-100 dark:bg-emerald-900/40 rounded-full p-2">
                          <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white">{request.employeeName}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(request.type)}`}>
                              {request.type}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <div>
                              <span className="font-medium">Department:</span> {request.department}
                            </div>
                            <div>
                              <span className="font-medium">Duration:</span> {request.days} day{request.days > 1 ? 's' : ''}
                            </div>
                            <div>
                              <span className="font-medium">Dates:</span> {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Submitted:</span> {new Date(request.submittedDate).toLocaleDateString()}
                            </div>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 text-sm">
                            <span className="font-medium">Reason:</span> {request.reason}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {request.status === 'Pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              disabled={approveRequestMutation.isPending || denyRequestMutation.isPending}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              data-testid={`button-approve-${request.id}`}
                            >
                              {approveRequestMutation.isPending ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                  Approving...
                                </>
                              ) : (
                                'Approve'
                              )}
                            </button>
                            <button
                              onClick={() => handleDenyRequest(request.id)}
                              disabled={approveRequestMutation.isPending || denyRequestMutation.isPending}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              data-testid={`button-deny-${request.id}`}
                            >
                              {denyRequestMutation.isPending ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                  Denying...
                                </>
                              ) : (
                                'Deny'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            )}

            {/* Team Calendar Tab */}
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Team Leave Calendar</h3>
                
                <div className="grid gap-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`rounded-full p-2 ${
                            member.currentLeave ? 'bg-red-100' : 'bg-green-100'
                          }`}>
                            <User className={`h-5 w-5 ${
                              member.currentLeave ? 'text-red-600' : 'text-green-600'
                            }`} />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white dark:text-white">{member.name}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">{member.role} • {member.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {member.currentLeave ? (
                            <div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(member.currentLeave.status)}`}>
                                On {member.currentLeave.type}
                              </span>
                              <p className="text-sm text-gray-500 mt-1">
                                Until {new Date(member.currentLeave.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              Available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upcoming Leave */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Upcoming Leave (Next 30 Days)</h4>
                  <div className="space-y-3">
                    {leaveRequests
                      .filter(r => r.status === 'Approved' && new Date(r.startDate) > new Date())
                      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                      .map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white dark:text-white">{request.employeeName}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                                {request.type} • {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm text-blue-600 font-medium">
                            {request.days} day{request.days > 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Leave Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Total Requests</h4>
                    <p className="text-3xl font-bold text-blue-600">{leaveRequests.length}</p>
                    <p className="text-blue-700 text-sm">This month</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-green-900 mb-2">Approved</h4>
                    <p className="text-3xl font-bold text-green-600">
                      {leaveRequests.filter(r => r.status === 'Approved').length}
                    </p>
                    <p className="text-green-700 text-sm">
                      {Math.round((leaveRequests.filter(r => r.status === 'Approved').length / leaveRequests.length) * 100)}% approval rate
                    </p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-yellow-900 mb-2">Pending</h4>
                    <p className="text-3xl font-bold text-yellow-600">
                      {leaveRequests.filter(r => r.status === 'Pending').length}
                    </p>
                    <p className="text-yellow-700 text-sm">Awaiting approval</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-purple-900 mb-2">Avg Days</h4>
                    <p className="text-3xl font-bold text-purple-600">
                      {Math.round(leaveRequests.reduce((sum, r) => sum + r.days, 0) / leaveRequests.length)}
                    </p>
                    <p className="text-purple-700 text-sm">Per request</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Leave by Type</h4>
                  <div className="space-y-3">
                    {['Vacation', 'Sick', 'Personal', 'FMLA'].map(type => {
                      const count = leaveRequests.filter(r => r.type === type).length;
                      const percentage = leaveRequests.length > 0 ? (count / leaveRequests.length) * 100 : 0;
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">{type}</span>
                          <div className="flex items-center space-x-3">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-emerald-600 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-12">{count} requests</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Policies Tab */}
            {activeTab === 'policies' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Leave Policies</h3>
                
                <div className="grid gap-6">
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Vacation Policy</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Annual Allowance:</span>
                        <p className="text-gray-900 dark:text-white dark:text-white">20 days</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Carryover Limit:</span>
                        <p className="text-gray-900 dark:text-white dark:text-white">5 days</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Advance Notice:</span>
                        <p className="text-gray-900 dark:text-white dark:text-white">2 weeks</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Sick Leave Policy</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Annual Allowance:</span>
                        <p className="text-gray-900 dark:text-white dark:text-white">10 days</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Medical Cert Required:</span>
                        <p className="text-gray-900 dark:text-white dark:text-white">After 3 consecutive days</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Advance Notice:</span>
                        <p className="text-gray-900 dark:text-white dark:text-white">As soon as possible</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">FMLA Policy</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Maximum Duration:</span>
                        <p className="text-gray-900 dark:text-white dark:text-white">12 weeks per year</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Eligibility:</span>
                        <p className="text-gray-900 dark:text-white dark:text-white">12 months employment</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Advance Notice:</span>
                        <p className="text-gray-900 dark:text-white dark:text-white">30 days when foreseeable</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Leave Request Details</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Employee:</span>
                    <p className="text-gray-900 dark:text-white dark:text-white">{selectedRequest.employeeName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Employee ID:</span>
                    <p className="text-gray-900 dark:text-white dark:text-white">{selectedRequest.employeeNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Department:</span>
                    <p className="text-gray-900 dark:text-white dark:text-white">{selectedRequest.department}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Manager:</span>
                    <p className="text-gray-900 dark:text-white dark:text-white">{selectedRequest.manager}</p>
                  </div>
                </div>
              </div>

              {/* Leave Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-3">Leave Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Type:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedRequest.type)}`}>
                        {selectedRequest.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                      <span className="font-medium">{new Date(selectedRequest.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">End Date:</span>
                      <span className="font-medium">{new Date(selectedRequest.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Days:</span>
                      <span className="font-medium">{selectedRequest.days} day{selectedRequest.days > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-3">Additional Information</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Reason:</span>
                      <p className="text-gray-900 dark:text-white dark:text-white mt-1">{selectedRequest.reason}</p>
                    </div>
                    {selectedRequest.coverageArrangements && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Coverage Arrangements:</span>
                        <p className="text-gray-900 dark:text-white dark:text-white mt-1">{selectedRequest.coverageArrangements}</p>
                      </div>
                    )}
                    {selectedRequest.emergencyContact && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Emergency Contact:</span>
                        <p className="text-gray-900 dark:text-white dark:text-white mt-1">{selectedRequest.emergencyContact}</p>
                      </div>
                    )}
                    {selectedRequest.medicalCertification && (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-green-800 text-sm">Medical certification provided</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              {selectedRequest.status === 'Pending' && (
                <>
                  <button
                    onClick={() => {
                      handleDenyRequest(selectedRequest.id);
                      setSelectedRequest(null);
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Deny Request
                  </button>
                  <button
                    onClick={() => {
                      handleApproveRequest(selectedRequest.id);
                      setSelectedRequest(null);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve Request
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Submit Leave Request</h3>
              <button
                onClick={() => setShowRequestForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Leave Type *</label>
                <select
                  value={newRequest.type}
                  onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="Vacation">Vacation</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Personal">Personal</option>
                  <option value="Bereavement">Bereavement</option>
                  <option value="Maternity">Maternity Leave</option>
                  <option value="Paternity">Paternity Leave</option>
                  <option value="FMLA">FMLA</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={newRequest.startDate}
                    onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">End Date *</label>
                  <input
                    type="date"
                    value={newRequest.endDate}
                    onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Reason *</label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={3}
                  placeholder="Please provide a brief reason for your leave request..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Coverage Arrangements</label>
                <textarea
                  value={newRequest.coverageArrangements}
                  onChange={(e) => setNewRequest({ ...newRequest, coverageArrangements: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={2}
                  placeholder="Who will cover your responsibilities while you're away?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Emergency Contact</label>
                <input
                  type="tel"
                  value={newRequest.emergencyContact}
                  onChange={(e) => setNewRequest({ ...newRequest, emergencyContact: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRequestForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={submitRequestMutation.isPending}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                data-testid="button-submit-request"
              >
                {submitRequestMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Calendar Modal */}
      {showTeamCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
              <div>
                <h3 className="text-xl font-bold">Team Leave Calendar</h3>
                <p className="text-blue-100">View team member availability and leave schedules</p>
              </div>
              <button
                onClick={() => setShowTeamCalendar(false)}
                className="text-blue-100 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Current Team Status</h4>
                <div className="grid gap-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`rounded-full p-2 ${
                          member.currentLeave ? 'bg-yellow-100' : 'bg-green-100'
                        }`}>
                          <User className={`h-5 w-5 ${
                            member.currentLeave ? 'text-yellow-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white dark:text-white">{member.name}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{member.role} • {member.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {member.currentLeave ? (
                          <div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(member.currentLeave.type)}`}>
                              {member.currentLeave.type} - {member.currentLeave.status}
                            </span>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(member.currentLeave.startDate).toLocaleDateString()} - {new Date(member.currentLeave.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Available
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Leave */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Upcoming Leave (Next 30 Days)</h4>
                <div className="space-y-3">
                  {leaveRequests
                    .filter(r => r.status === 'Approved' && new Date(r.startDate) > new Date())
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white dark:text-white">{request.employeeName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                              {request.type} • {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-blue-600 font-medium">
                          {request.days} day{request.days > 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end p-6 border-t bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setShowTeamCalendar(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center text-white ${
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

export default LeaveManagementModal;