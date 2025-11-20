import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, User, Clock, CheckCircle, AlertCircle, Plus, Filter, Download, Mail, Bell, MapPin, Users, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type EmployeeDirectoryEntry } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { LeaveRequest as DBLeaveRequest, LeaveBalance } from '../../shared/schema';
import { useDashboardEscape } from '../hooks/useDashboardEscape';
import { DashboardExitButton } from '../components/DashboardExitButton';
import { useLocation } from 'wouter';

interface LeaveRequestWithEmployee {
  id: string;
  employeeId: string;
  employeeNumber?: string;
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

interface LeavePageProps {
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

const LeavePage: React.FC<LeavePageProps> = ({ initialFilter, navigationParams }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  // Reactive URL query parameter parsing for filters
  const query = useMemo(() => new URLSearchParams(location.split('?')[1] ?? ''), [location]);
  const filterFromURL = query.get('filter') as 'my-team' | 'my-department' | 'my-location' | 'all' | null;
  const managerIdFromURL = query.get('managerId');
  const departmentFromURL = query.get('department');
  const locationFromURL = query.get('location');
  
  // Use URL params as fallback if initialFilter prop is not provided
  const effectiveFilter = useMemo(() => initialFilter || (filterFromURL ? {
    type: filterFromURL,
    managerId: managerIdFromURL || undefined,
    department: departmentFromURL || undefined,
    location: locationFromURL || undefined
  } : undefined), [initialFilter, filterFromURL, managerIdFromURL, departmentFromURL, locationFromURL]);
  
  const [activeTab, setActiveTab] = useState('requests');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState(
    navigationParams?.type === 'PTO' ? 'Vacation' : navigationParams?.type === 'Sick' ? 'Sick' : 'All'
  );
  const [teamFilter, setTeamFilter] = useState<'my-team' | 'my-department' | 'my-location' | 'all'>(effectiveFilter?.type || 'all');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestWithEmployee | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showTeamCalendar, setShowTeamCalendar] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // ESC key handling - close nested modals first before navigating away
  useDashboardEscape(() => {
    if (selectedRequest) {
      setSelectedRequest(null);
      return false;
    }
    if (showRequestForm) {
      setShowRequestForm(false);
      return false;
    }
    if (showTeamCalendar) {
      setShowTeamCalendar(false);
      return false;
    }
    return true;
  });

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
        employeeNumber: employee?.employeeId || undefined,
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
    if (navigationParams?.employeeName && request.employeeName !== navigationParams.employeeName) {
      return false;
    }

    if (navigationParams?.date) {
      const requestStart = new Date(request.startDate);
      const requestEnd = new Date(request.endDate);
      const targetDate = new Date(navigationParams.date);
      if (targetDate < requestStart || targetDate > requestEnd) {
        return false;
      }
    }

    if (teamFilter === 'my-team' && effectiveFilter?.managerId) {
      if (request.manager !== effectiveFilter.managerId && request.employeeName !== effectiveFilter.managerId) {
        return false;
      }
    }

    if (teamFilter === 'my-department' && effectiveFilter?.department) {
      if (request.department !== effectiveFilter.department) {
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
    <div className="bg-white dark:bg-gray-800 rounded-lg w-full min-h-screen overflow-auto">
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
        <div className="flex items-center">
          <Calendar className="h-8 w-8 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">Leave Management</h2>
            <p className="text-emerald-100">Comprehensive leave tracking and approval system</p>
          </div>
        </div>
        <DashboardExitButton />
      </div>

      {notification && (
        <div className={`mx-6 mt-4 p-4 rounded-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' :
          notification.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="border-b border-gray-200 dark:border-gray-700">
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

      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            {effectiveFilter && (
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value as any)}
                className="border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-blue-700 dark:text-blue-300"
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
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Denied">Denied</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              data-testid="button-new-request"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </button>
            <button
              onClick={() => setShowTeamCalendar(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              data-testid="button-team-calendar"
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

      <div className="overflow-y-auto">
        <div className="p-6">
          {(isLoadingRequests || isLoadingDirectory) && (
            <div className="flex items-center justify-center py-12" data-testid="loading-state">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading leave data...</p>
              </div>
            </div>
          )}

          {(isErrorRequests || isErrorDirectory) && !isLoadingRequests && !isLoadingDirectory && (
            <div className="flex items-center justify-center py-12" data-testid="error-state">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400 font-medium">Failed to load leave data</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Please try again later or contact support.</p>
              </div>
            </div>
          )}

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
                <div key={request.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="bg-emerald-100 dark:bg-emerald-900/40 rounded-full p-2">
                        <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{request.employeeName}</h3>
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
                            <span className="font-medium">Submitted:</span> {request.submittedDate ? new Date(request.submittedDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          <span className="font-medium">Reason:</span> {request.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
                        title="View Details"
                        data-testid={`button-view-${request.id}`}
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
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            data-testid={`button-deny-${request.id}`}
                          >
                            Deny
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

          {activeTab === 'calendar' && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Team Calendar view coming soon</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Leave Analytics coming soon</p>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Leave Policies coming soon</p>
            </div>
          )}
        </div>
      </div>

      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Submit Leave Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Leave Type</label>
                <select
                  value={newRequest.type}
                  onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white"
                >
                  <option value="Vacation">Vacation</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Personal">Personal</option>
                  <option value="FMLA">FMLA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Start Date</label>
                <input
                  type="date"
                  value={newRequest.startDate}
                  onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">End Date</label>
                <input
                  type="date"
                  value={newRequest.endDate}
                  onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Reason</label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={submitRequestMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  data-testid="button-submit-request"
                >
                  {submitRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Leave Request Details</h3>
            <div className="space-y-4">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Employee:</span>
                <p className="text-gray-900 dark:text-white">{selectedRequest.employeeName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                <p className="text-gray-900 dark:text-white">{selectedRequest.type}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Dates:</span>
                <p className="text-gray-900 dark:text-white">{new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Duration:</span>
                <p className="text-gray-900 dark:text-white">{selectedRequest.days} day{selectedRequest.days > 1 ? 's' : ''}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Reason:</span>
                <p className="text-gray-900 dark:text-white">{selectedRequest.reason}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTeamCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Team Calendar</h3>
            <div className="space-y-4">
              {teamMembers.map(member => (
                <div key={member.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{member.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{member.role} - {member.department}</p>
                    </div>
                    {member.currentLeave && (
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(member.currentLeave.type)}`}>
                          {member.currentLeave.type}
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(member.currentLeave.startDate).toLocaleDateString()} - {new Date(member.currentLeave.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowTeamCalendar(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavePage;
