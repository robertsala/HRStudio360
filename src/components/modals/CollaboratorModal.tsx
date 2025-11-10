import { useState, useMemo } from 'react';
import { X, Search, UserPlus, Mail, CheckCircle, Send, Sparkles, Users, Building, Filter, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { apiClient } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { performAIEmployeeSearch, getEmployeeDisplayName, getEmployeeSubtitle, type SearchableEmployee } from '../../utils/employeeSearch';

interface CollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterType = 'all' | 'my-team' | 'department';

interface EmployeeWithProfile {
  id: string;
  userId: string | null;
  employeeId: string;
  managerId: string | null;
  departmentId: string | null;
  status: string;
  profile?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    department: string | null;
    avatarUrl: string | null;
  } | null;
}

const CollaboratorModal: React.FC<CollaboratorModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useEscapeKey(() => onClose(), isOpen);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Fetch all employees with profile data (includes managerId)
  const { data: allEmployees = [], isLoading: isLoadingEmployees } = useQuery<EmployeeWithProfile[]>({
    queryKey: ['/api/employees/directory'],
    queryFn: () => apiClient.getEmployeesWithProfiles(),
    enabled: isOpen,
  });

  // Fetch sent invitations
  const { data: sentInvitations = [], isLoading: isLoadingSent } = useQuery({
    queryKey: ['/api/collaborator-invitations', 'sent', user?.id],
    queryFn: () => apiClient.getCollaboratorInvitations({ senderId: user?.id }),
    enabled: isOpen && !!user,
  });

  // Fetch received invitations
  const { data: receivedInvitations = [], isLoading: isLoadingReceived } = useQuery({
    queryKey: ['/api/collaborator-invitations', 'received', user?.id],
    queryFn: () => apiClient.getCollaboratorInvitations({ recipientId: user?.id }),
    enabled: isOpen && !!user,
  });

  // Derive current user's employee ID for "My Team" filtering
  const currentEmployeeId = useMemo(() => {
    return allEmployees.find(emp => emp.userId === user?.id)?.id || null;
  }, [allEmployees, user?.id]);

  // Derive department options from all employees
  const departmentOptions = useMemo(() => {
    const departments = new Set<string>();
    allEmployees.forEach(emp => {
      if (emp.profile?.department) {
        departments.add(emp.profile.department);
      }
    });
    return Array.from(departments).sort();
  }, [allEmployees]);

  // Derive "My Team" employee IDs (direct reports + same department fallback)
  const myTeamIds = useMemo(() => {
    const teamIds = new Set<string>();
    
    // Find direct reports (employees where managerId = currentEmployeeId)
    const directReports = allEmployees.filter(emp => emp.managerId === currentEmployeeId);
    directReports.forEach(emp => teamIds.add(emp.userId || emp.id));
    
    // Fallback: if no direct reports, use same department
    if (teamIds.size === 0 && user) {
      const currentDepartment = allEmployees.find(emp => emp.userId === user.id)?.profile?.department;
      if (currentDepartment) {
        allEmployees
          .filter(emp => emp.profile?.department === currentDepartment && emp.userId !== user.id)
          .forEach(emp => teamIds.add(emp.userId || emp.id));
      }
    }
    
    return teamIds;
  }, [allEmployees, currentEmployeeId, user]);

  // Convert employees to searchable format
  const searchableEmployees: SearchableEmployee[] = useMemo(() => {
    return allEmployees
      .filter(emp => emp.userId !== user?.id && emp.status === 'Active') // Exclude current user and inactive employees
      .map(emp => ({
        id: emp.userId || emp.id,
        name: `${emp.profile?.firstName || ''} ${emp.profile?.lastName || ''}`.trim() || emp.profile?.email || '',
        email: emp.profile?.email || '',
        department: emp.profile?.department || '',
        role: emp.profile?.department || '',
        location: '',
        status: emp.status,
      }));
  }, [allEmployees, user?.id]);

  // Apply filters and AI search
  const filteredEmployees = useMemo(() => {
    let filtered = searchableEmployees;

    // Apply filter type
    if (activeFilter === 'my-team') {
      filtered = filtered.filter(emp => myTeamIds.has(emp.id));
    } else if (activeFilter === 'department' && selectedDepartment) {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }

    // Apply AI search
    if (searchTerm.trim()) {
      filtered = performAIEmployeeSearch(filtered, searchTerm);
    }

    return filtered;
  }, [searchableEmployees, activeFilter, selectedDepartment, myTeamIds, searchTerm]);

  // Create invitation mutation
  const createInvitationMutation = useMutation({
    mutationFn: (data: {
      senderId: string;
      recipientId: string;
      recipientEmail: string;
      message?: string;
    }) => apiClient.createCollaboratorInvitation(data),
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => apiClient.acceptCollaboratorInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborator-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-notifications'] });
      setNotification({
        type: 'success',
        message: 'Invitation accepted! The sender has been notified.',
      });
      setTimeout(() => setNotification(null), 5000);
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.message || 'Failed to accept invitation',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  // Decline invitation mutation
  const declineInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => apiClient.declineCollaboratorInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborator-invitations'] });
      setNotification({
        type: 'info',
        message: 'Invitation declined.',
      });
      setTimeout(() => setNotification(null), 5000);
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.message || 'Failed to decline invitation',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  // Handle batch invitation sending
  const handleSendBatchInvitations = async () => {
    if (selectedEmployeeIds.length === 0 || !user) return;

    const selectedEmployees = searchableEmployees.filter(emp => selectedEmployeeIds.includes(emp.id));
    if (selectedEmployees.length === 0) return;

    // Send all invitations in parallel with Promise.allSettled
    const results = await Promise.allSettled(
      selectedEmployees.map(employee =>
        createInvitationMutation.mutateAsync({
          senderId: user.id,
          recipientId: employee.id,
          recipientEmail: employee.email,
          message: message.trim() || undefined,
        })
      )
    );

    // Count successes and failures
    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.filter(r => r.status === 'rejected').length;

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['/api/collaborator-invitations'] });

    // Show notification and reset form only on complete success
    if (failures === 0) {
      setNotification({
        type: 'success',
        message: `Successfully sent ${successes} invitation${successes > 1 ? 's' : ''}! Email notifications have been sent.`,
      });
      // Only clear selection on complete success
      setSelectedEmployeeIds([]);
      setMessage('');
      setTimeout(() => setNotification(null), 5000);
    } else if (successes === 0) {
      setNotification({
        type: 'error',
        message: `Failed to send all ${failures} invitation${failures > 1 ? 's' : ''}. Please try again.`,
      });
      setTimeout(() => setNotification(null), 5000);
    } else {
      setNotification({
        type: 'info',
        message: `Sent ${successes} invitation${successes > 1 ? 's' : ''}, but ${failures} failed. Selection preserved - please retry the failed invitations.`,
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Toggle employee selection
  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  if (!isOpen) return null;

  const isLoading = isLoadingEmployees || isLoadingSent || isLoadingReceived;
  const isPending = createInvitationMutation.isPending || 
                    acceptInvitationMutation.isPending || 
                    declineInvitationMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Team Collaboration</h2>
                <p className="text-white/80 text-sm">Invite colleagues to collaborate on projects</p>
              </div>
            </div>
            <button
              onClick={onClose}
              data-testid="button-close-collaborator-modal"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Notification */}
          {notification && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                notification.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                  : notification.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
              }`}
              data-testid="notification-message"
            >
              {notification.type === 'success' && <CheckCircle className="h-5 w-5" />}
              <p>{notification.message}</p>
            </div>
          )}

          {/* Send Invitation Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send New Invitations
            </h3>

            {/* Filter Toolbar */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              {/* Segmented Filter Buttons */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setActiveFilter('all')}
                  data-testid="filter-all"
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  All Employees
                </button>
                <button
                  onClick={() => setActiveFilter('my-team')}
                  data-testid="filter-my-team"
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeFilter === 'my-team'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  My Team ({myTeamIds.size})
                </button>
                <button
                  onClick={() => setActiveFilter('department')}
                  data-testid="filter-department"
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeFilter === 'department'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Building className="h-4 w-4" />
                  Department
                </button>
              </div>

              {/* Department Dropdown (conditional) */}
              {activeFilter === 'department' && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    data-testid="select-department"
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departmentOptions.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* AI Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="AI Search: Try 'senior engineer', 'marketing team', or search by name..."
                data-testid="input-search-employees"
                className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Employee Selection Grid with Checkboxes */}
            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                {isLoadingEmployees ? (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                    Loading employees...
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No employees found matching your search' : 
                     activeFilter === 'my-team' ? 'No team members found' :
                     activeFilter === 'department' && !selectedDepartment ? 'Please select a department' :
                     activeFilter === 'department' ? `No employees in ${selectedDepartment}` :
                     'No employees available'}
                  </div>
                ) : (
                  filteredEmployees.map((employee) => {
                    const isSelected = selectedEmployeeIds.includes(employee.id);
                    return (
                      <button
                        key={employee.id}
                        onClick={() => toggleEmployeeSelection(employee.id)}
                        data-testid={`button-toggle-employee-${employee.id}`}
                        className={`p-3 rounded-lg border-2 transition-all text-left relative ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`absolute top-3 right-3 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>

                        <div className="flex items-start gap-3 pr-8">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {getEmployeeDisplayName(employee).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                              {getEmployeeDisplayName(employee)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              {employee.email}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                              {getEmployeeSubtitle(employee)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selection Summary */}
            {selectedEmployeeIds.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {selectedEmployeeIds.length} employee{selectedEmployeeIds.length > 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedEmployeeIds([])}
                    data-testid="button-clear-selection"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            {/* Message */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message (optional)"
              data-testid="input-invitation-message"
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />

            {/* Send Button */}
            <button
              onClick={handleSendBatchInvitations}
              disabled={selectedEmployeeIds.length === 0 || isPending}
              data-testid="button-send-invitations"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Send className="h-5 w-5" />
              {isPending ? 'Sending...' : `Send ${selectedEmployeeIds.length} Invitation${selectedEmployeeIds.length !== 1 ? 's' : ''}`}
            </button>
          </div>

          {/* Invitations Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sent Invitations */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Sent Invitations ({sentInvitations.length})
              </h3>
              <div className="space-y-3">
                {isLoadingSent ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading...</div>
                ) : sentInvitations.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No invitations sent yet
                  </div>
                ) : (
                  sentInvitations.map((invitation: any) => (
                    <div
                      key={invitation.id}
                      data-testid={`invitation-sent-${invitation.id}`}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {invitation.recipientEmail}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {invitation.message || 'No message'}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            invitation.status === 'pending'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                              : invitation.status === 'accepted'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                          }`}
                          data-testid={`status-${invitation.status}`}
                        >
                          {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(invitation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Received Invitations */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Received Invitations ({receivedInvitations.filter((inv: any) => inv.status === 'pending').length})
              </h3>
              <div className="space-y-3">
                {isLoadingReceived ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading...</div>
                ) : receivedInvitations.filter((inv: any) => inv.status === 'pending').length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No pending invitations
                  </div>
                ) : (
                  receivedInvitations
                    .filter((inv: any) => inv.status === 'pending')
                    .map((invitation: any) => (
                      <div
                        key={invitation.id}
                        data-testid={`invitation-received-${invitation.id}`}
                        className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">
                          From: {invitation.recipientEmail}
                        </p>
                        {invitation.message && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">
                            "{invitation.message}"
                          </p>
                        )}
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => acceptInvitationMutation.mutate(invitation.id)}
                            disabled={isPending}
                            data-testid={`button-accept-${invitation.id}`}
                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => declineInvitationMutation.mutate(invitation.id)}
                            disabled={isPending}
                            data-testid={`button-decline-${invitation.id}`}
                            className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium disabled:opacity-50 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorModal;
