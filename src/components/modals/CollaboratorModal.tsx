import { useState } from 'react';
import { X, Search, UserPlus, Mail, CheckCircle, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { apiClient } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { performAIEmployeeSearch, getEmployeeDisplayName, getEmployeeSubtitle, type SearchableEmployee } from '../../utils/employeeSearch';

interface CollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CollaboratorModal: React.FC<CollaboratorModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useEscapeKey(() => onClose(), isOpen);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [message, setMessage] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Fetch all profiles for employee search
  const { data: allEmployees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['/api/profiles'],
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

  // Create invitation mutation
  const createInvitationMutation = useMutation({
    mutationFn: (data: {
      senderId: string;
      recipientId: string;
      recipientEmail: string;
      message?: string;
    }) => apiClient.createCollaboratorInvitation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborator-invitations'] });
      setNotification({
        type: 'success',
        message: 'Collaboration invitation sent successfully! An email has been sent to the recipient.',
      });
      setSelectedEmployeeId('');
      setMessage('');
      setTimeout(() => setNotification(null), 5000);
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.message || 'Failed to send invitation',
      });
      setTimeout(() => setNotification(null), 5000);
    },
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

  const handleSendInvitation = () => {
    if (!selectedEmployeeId || !user) return;

    const selectedEmployee = allEmployees.find((emp: any) => emp.id === selectedEmployeeId);
    if (!selectedEmployee) return;

    createInvitationMutation.mutate({
      senderId: user.id,
      recipientId: selectedEmployee.id,
      recipientEmail: selectedEmployee.email,
      message: message.trim() || undefined,
    });
  };

  // AI Search
  const searchableEmployees: SearchableEmployee[] = allEmployees.map((emp: any) => ({
    id: emp.id,
    name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email,
    email: emp.email,
    department: emp.role,
    role: emp.role,
    location: `${emp.locationCity || ''}, ${emp.locationState || ''}`.trim(),
    status: 'Active',
  }));

  const filteredEmployees = performAIEmployeeSearch(searchableEmployees, searchTerm)
    .filter(emp => emp.id !== user?.id); // Exclude current user

  if (!isOpen) return null;

  const isLoading = isLoadingEmployees || isLoadingSent || isLoadingReceived;
  const isPending = createInvitationMutation.isPending || 
                    acceptInvitationMutation.isPending || 
                    declineInvitationMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Team Collaboration</h2>
                <p className="text-white/80 text-sm">Invite colleagues to collaborate</p>
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
              Send New Invitation
            </h3>

            {/* AI Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="AI Search: Try 'senior engineer' or 'marketing team'..."
                data-testid="input-search-employees"
                className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Employee Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 max-h-64 overflow-y-auto">
              {isLoadingEmployees ? (
                <div className="col-span-2 text-center py-8 text-gray-500 dark:text-gray-400">
                  Loading employees...
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No employees found matching your search' : 'No employees available'}
                </div>
              ) : (
                filteredEmployees.slice(0, 20).map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => setSelectedEmployeeId(employee.id)}
                    data-testid={`button-select-employee-${employee.id}`}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedEmployeeId === employee.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {getEmployeeDisplayName(employee).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {getEmployeeDisplayName(employee)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {employee.email}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          {getEmployeeSubtitle(employee)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

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
              onClick={handleSendInvitation}
              disabled={!selectedEmployeeId || isPending}
              data-testid="button-send-invitation"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Send className="h-5 w-5" />
              {isPending ? 'Sending...' : 'Send Invitation'}
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
