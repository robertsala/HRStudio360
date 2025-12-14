import { useState, useMemo } from 'react';
import { MessageCircle, Plus, Send, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, X, User, Calendar, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardEscape } from '../hooks/useDashboardEscape';
import HRTicketDashboard from '../components/hr-tickets/HRTicketDashboard';
import type { HrTicket, HrTicketComment, HrTicketStatusHistory } from '../../shared/schema';

type TicketCategory = 'Payroll' | 'Benefits' | 'Time Off' | 'Workplace' | 'Policy' | 'Training' | 'Technical' | 'Other';
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
type TicketStatus = 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';

interface TicketWithAuthor extends HrTicket {
  submitterName?: string;
  assigneeName?: string;
}

interface CommentWithAuthor extends HrTicketComment {
  authorName?: string;
  authorEmail?: string;
}

interface StatusHistoryWithAuthor extends HrTicketStatusHistory {
  changedByName?: string;
}

const CATEGORIES: TicketCategory[] = ['Payroll', 'Benefits', 'Time Off', 'Workplace', 'Policy', 'Training', 'Technical', 'Other'];
const PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

const getCategoryColor = (category: TicketCategory): string => {
  const colors: Record<TicketCategory, string> = {
    'Payroll': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Benefits': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'Time Off': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Workplace': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'Policy': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    'Training': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    'Technical': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
    'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  };
  return colors[category] || colors['Other'];
};

const getPriorityColor = (priority: TicketPriority): string => {
  const colors: Record<TicketPriority, string> = {
    'Low': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'High': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'Urgent': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  };
  return colors[priority];
};

const getStatusColor = (status: TicketStatus): string => {
  const colors: Record<TicketStatus, string> = {
    'Open': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'In Progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Pending': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'Resolved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Closed': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
  };
  return colors[status];
};

const getStatusIcon = (status: TicketStatus) => {
  switch (status) {
    case 'Open': return <AlertCircle className="h-4 w-4" />;
    case 'In Progress': return <Clock className="h-4 w-4" />;
    case 'Pending': return <Clock className="h-4 w-4" />;
    case 'Resolved': return <CheckCircle className="h-4 w-4" />;
    case 'Closed': return <CheckCircle className="h-4 w-4" />;
    default: return null;
  }
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const HRSupportPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'submit' | 'myTickets'>('submit');
  const [selectedTicket, setSelectedTicket] = useState<TicketWithAuthor | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [showHRDashboard, setShowHRDashboard] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: '',
    category: 'Other' as TicketCategory,
    priority: 'Medium' as TicketPriority,
    description: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newComment, setNewComment] = useState('');
  
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const isHRUser = user?.role === 'Product Owner' || user?.department === 'HR';

  useDashboardEscape(() => {
    if (selectedTicket) {
      setSelectedTicket(null);
      return false;
    }
    return true;
  });

  const { data: tickets = [], isLoading: isLoadingTickets, isError: isErrorTickets } = useQuery<TicketWithAuthor[]>({
    queryKey: ['/api/hr-tickets'],
    enabled: activeTab === 'myTickets' || !!expandedTicketId
  });

  const { data: ticketComments = [], isLoading: isLoadingComments } = useQuery<CommentWithAuthor[]>({
    queryKey: ['/api/hr-tickets', expandedTicketId, 'comments'],
    enabled: !!expandedTicketId
  });

  const { data: ticketHistory = [], isLoading: isLoadingHistory } = useQuery<StatusHistoryWithAuthor[]>({
    queryKey: ['/api/hr-tickets', expandedTicketId, 'history'],
    enabled: !!expandedTicketId
  });

  const submitTicketMutation = useMutation({
    mutationFn: async (data: { subject: string; category: TicketCategory; priority: TicketPriority; description: string }) => {
      return apiRequest('/api/hr-tickets', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          submitterId: user?.id
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr-tickets'] });
      setFormData({ subject: '', category: 'Other', priority: 'Medium', description: '' });
      setFormErrors({});
      setActiveTab('myTickets');
      setNotification({
        type: 'success',
        message: 'Your ticket has been submitted successfully!'
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error?.message || 'Failed to submit ticket. Please try again.'
      });
      setTimeout(() => setNotification(null), 4000);
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      return apiRequest(`/api/hr-tickets/${ticketId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          authorId: user?.id,
          isInternal: false
        })
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr-tickets', variables.ticketId, 'comments'] });
      setNewComment('');
      setNotification({
        type: 'success',
        message: 'Comment added successfully!'
      });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error?.message || 'Failed to add comment'
      });
      setTimeout(() => setNotification(null), 4000);
    }
  });

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      submitTicketMutation.mutate(formData);
    }
  };

  const handleAddComment = (ticketId: string) => {
    if (newComment.trim()) {
      addCommentMutation.mutate({ ticketId, content: newComment.trim() });
    }
  };

  const toggleTicketExpand = (ticketId: string) => {
    setExpandedTicketId(expandedTicketId === ticketId ? null : ticketId);
  };

  const myTickets = useMemo(() => {
    return tickets.filter(ticket => ticket.submitterId === user?.id);
  }, [tickets, user?.id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                HR Support
              </h1>
            </div>
            {isHRUser && (
              <button
                onClick={() => setShowHRDashboard(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md"
                data-testid="button-open-hr-dashboard"
              >
                <Settings className="h-4 w-4" />
                Admin Dashboard
              </button>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Submit and track your HR inquiries and support requests
          </p>
        </div>

        {notification && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : notification.type === 'error'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            }`}
            data-testid="notification-banner"
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 hover:opacity-70"
              data-testid="button-dismiss-notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('submit')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'submit'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                data-testid="tab-submit-ticket"
              >
                <Plus className="h-4 w-4 inline-block mr-2" />
                Submit Ticket
              </button>
              <button
                onClick={() => setActiveTab('myTickets')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'myTickets'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                data-testid="tab-my-tickets"
              >
                <MessageCircle className="h-4 w-4 inline-block mr-2" />
                My Tickets
                {myTickets.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                    {myTickets.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'submit' && (
              <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-submit-ticket">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief summary of your inquiry"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      formErrors.subject
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent`}
                    data-testid="input-subject"
                  />
                  {formErrors.subject && (
                    <p className="mt-1 text-sm text-red-500" data-testid="error-subject">{formErrors.subject}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="select-category"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="select-priority"
                    >
                      {PRIORITIES.map((pri) => (
                        <option key={pri} value={pri}>{pri}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Please describe your inquiry in detail (minimum 20 characters)"
                    rows={5}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      formErrors.description
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent resize-none`}
                    data-testid="input-description"
                  />
                  <div className="flex justify-between mt-1">
                    {formErrors.description ? (
                      <p className="text-sm text-red-500" data-testid="error-description">{formErrors.description}</p>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formData.description.length}/20 characters minimum
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitTicketMutation.isPending}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                  data-testid="button-submit-ticket"
                >
                  {submitTicketMutation.isPending ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Submit Ticket
                    </>
                  )}
                </button>
              </form>
            )}

            {activeTab === 'myTickets' && (
              <div className="space-y-4" data-testid="my-tickets-list">
                {isLoadingTickets ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                  </div>
                ) : isErrorTickets ? (
                  <div className="text-center py-12 text-red-500" data-testid="error-loading-tickets">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>Failed to load tickets. Please try again.</p>
                  </div>
                ) : myTickets.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400" data-testid="empty-tickets">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No tickets yet</p>
                    <p className="text-sm">Submit your first HR support request to get started.</p>
                    <button
                      onClick={() => setActiveTab('submit')}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      data-testid="button-create-first-ticket"
                    >
                      <Plus className="h-4 w-4 inline-block mr-2" />
                      Create Ticket
                    </button>
                  </div>
                ) : (
                  myTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      data-testid={`ticket-card-${ticket.id}`}
                    >
                      <div
                        className="p-4 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                        onClick={() => toggleTicketExpand(ticket.id)}
                        data-testid={`ticket-header-${ticket.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                                {ticket.ticketNumber}
                              </span>
                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getCategoryColor(ticket.category as TicketCategory)}`}>
                                {ticket.category}
                              </span>
                            </div>
                            <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                              {ticket.subject}
                            </h3>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${getPriorityColor(ticket.priority as TicketPriority)}`}>
                                {ticket.priority}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${getStatusColor(ticket.status as TicketStatus)}`}>
                                {getStatusIcon(ticket.status as TicketStatus)}
                                {ticket.status}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(ticket.createdAt)}
                              </span>
                            </div>
                          </div>
                          <button
                            className="ml-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            data-testid={`button-expand-ticket-${ticket.id}`}
                          >
                            {expandedTicketId === ticket.id ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {expandedTicketId === ticket.id && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-6" data-testid={`ticket-details-${ticket.id}`}>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h4>
                            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                              {ticket.description}
                            </p>
                          </div>

                          {ticket.resolution && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resolution</h4>
                              <p className="text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                {ticket.resolution}
                              </p>
                            </div>
                          )}

                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Status History</h4>
                            {isLoadingHistory ? (
                              <div className="flex items-center gap-2 text-gray-500">
                                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                                Loading history...
                              </div>
                            ) : ticketHistory.length === 0 ? (
                              <p className="text-gray-500 dark:text-gray-400 text-sm">No status changes yet.</p>
                            ) : (
                              <div className="space-y-3">
                                {ticketHistory.map((history, index) => (
                                  <div key={history.id} className="flex items-start gap-3" data-testid={`history-item-${index}`}>
                                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500" />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        {history.previousStatus && (
                                          <>
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(history.previousStatus as TicketStatus)}`}>
                                              {history.previousStatus}
                                            </span>
                                            <span className="text-gray-400">→</span>
                                          </>
                                        )}
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(history.newStatus as TicketStatus)}`}>
                                          {history.newStatus}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {formatDate(history.createdAt)}
                                        {history.changedByName && ` by ${history.changedByName}`}
                                      </p>
                                      {history.changeNote && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{history.changeNote}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Comments</h4>
                            {isLoadingComments ? (
                              <div className="flex items-center gap-2 text-gray-500">
                                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                                Loading comments...
                              </div>
                            ) : ticketComments.length === 0 ? (
                              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">No comments yet.</p>
                            ) : (
                              <div className="space-y-3 mb-4">
                                {ticketComments.map((comment) => (
                                  <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg" data-testid={`comment-${comment.id}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <User className="h-3 w-3 text-white" />
                                      </div>
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {comment.authorName || 'HR Team'}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDate(comment.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm pl-8">
                                      {comment.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                data-testid={`input-comment-${ticket.id}`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment(ticket.id);
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleAddComment(ticket.id)}
                                disabled={!newComment.trim() || addCommentMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                data-testid={`button-add-comment-${ticket.id}`}
                              >
                                {addCommentMutation.isPending ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showHRDashboard && (
        <HRTicketDashboard
          isOpen={showHRDashboard}
          onClose={() => setShowHRDashboard(false)}
        />
      )}
    </div>
  );
};

export default HRSupportPage;
