import { useState, useMemo } from 'react';
import { 
  Ticket, X, Search, User, Clock, CheckCircle, AlertCircle, 
  Send, MessageSquare, UserCheck, AlertTriangle,
  Eye, RefreshCw, Lock, FileText
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';
import { useAuth } from '../../contexts/AuthContext';
import type { HrTicket, HrTicketComment, HrTicketStatusHistory, Profile } from '../../../shared/schema';

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

interface HRTicketDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: TicketCategory[] = ['Payroll', 'Benefits', 'Time Off', 'Workplace', 'Policy', 'Training', 'Technical', 'Other'];
const PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];

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
    case 'Closed': return <Lock className="h-4 w-4" />;
    default: return null;
  }
};

const formatDate = (dateValue: string | Date | null | undefined): string => {
  if (!dateValue) return 'N/A';
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateShort = (dateValue: string | Date | null | undefined): string => {
  if (!dateValue) return 'N/A';
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const HRTicketDashboard: React.FC<HRTicketDashboardProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedTicket, setSelectedTicket] = useState<TicketWithAuthor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState({
    status: 'All',
    category: 'All',
    priority: 'All',
    assignee: 'All'
  });
  
  const [newComment, setNewComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [newStatus, setNewStatus] = useState<TicketStatus | ''>('');
  const [newAssignee, setNewAssignee] = useState<string>('');
  const [resolution, setResolution] = useState('');
  
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const isHRUser = user?.role === 'Product Owner' || user?.department === 'HR';

  const { data: allTickets = [], isLoading: isLoadingTickets, refetch: refetchTickets } = useQuery<TicketWithAuthor[]>({
    queryKey: ['/api/hr-tickets'],
    enabled: isOpen && isHRUser
  });

  const { data: profiles = [] } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
    enabled: isOpen && isHRUser
  });

  const { data: ticketComments = [], isLoading: isLoadingComments } = useQuery<CommentWithAuthor[]>({
    queryKey: ['/api/hr-tickets', selectedTicket?.id, 'comments'],
    enabled: !!selectedTicket?.id
  });

  const { data: ticketHistory = [] } = useQuery<StatusHistoryWithAuthor[]>({
    queryKey: ['/api/hr-tickets', selectedTicket?.id, 'history'],
    enabled: !!selectedTicket?.id
  });

  const hrStaff = useMemo(() => {
    return profiles.filter(p => p.role === 'Product Owner' || p.department === 'HR');
  }, [profiles]);

  const profileMap = useMemo(() => {
    const map: Record<string, Profile> = {};
    profiles.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [profiles]);

  const ticketsWithNames = useMemo(() => {
    return allTickets.map(ticket => ({
      ...ticket,
      submitterName: profileMap[ticket.submitterId]
        ? `${profileMap[ticket.submitterId].firstName || ''} ${profileMap[ticket.submitterId].lastName || ''}`.trim() || profileMap[ticket.submitterId].email
        : 'Unknown',
      assigneeName: ticket.assigneeId && profileMap[ticket.assigneeId]
        ? `${profileMap[ticket.assigneeId].firstName || ''} ${profileMap[ticket.assigneeId].lastName || ''}`.trim() || profileMap[ticket.assigneeId].email
        : undefined
    }));
  }, [allTickets, profileMap]);

  const stats = useMemo(() => {
    const openTickets = ticketsWithNames.filter(t => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Pending');
    const assignedToMe = ticketsWithNames.filter(t => t.assigneeId === user?.id);
    const unassigned = ticketsWithNames.filter(t => !t.assigneeId && t.status !== 'Closed' && t.status !== 'Resolved');
    const urgent = ticketsWithNames.filter(t => t.priority === 'Urgent' && t.status !== 'Closed' && t.status !== 'Resolved');
    
    return {
      totalOpen: openTickets.length,
      assignedToMe: assignedToMe.filter(t => t.status !== 'Closed' && t.status !== 'Resolved').length,
      unassigned: unassigned.length,
      urgent: urgent.length
    };
  }, [ticketsWithNames, user?.id]);

  const filteredTickets = useMemo(() => {
    return ticketsWithNames.filter(ticket => {
      if (filters.status !== 'All' && ticket.status !== filters.status) return false;
      if (filters.category !== 'All' && ticket.category !== filters.category) return false;
      if (filters.priority !== 'All' && ticket.priority !== filters.priority) return false;
      if (filters.assignee === 'Unassigned' && ticket.assigneeId) return false;
      if (filters.assignee === 'Assigned to me' && ticket.assigneeId !== user?.id) return false;
      
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          ticket.ticketNumber?.toLowerCase().includes(search) ||
          ticket.subject.toLowerCase().includes(search) ||
          ticket.submitterName?.toLowerCase().includes(search) ||
          ticket.description.toLowerCase().includes(search)
        );
      }
      
      return true;
    });
  }, [ticketsWithNames, filters, searchTerm, user?.id]);

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: string; updates: Record<string, any> }) => {
      return apiRequest(`/api/hr-tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr-tickets'] });
      if (selectedTicket) {
        queryClient.invalidateQueries({ queryKey: ['/api/hr-tickets', selectedTicket.id, 'history'] });
      }
      setNotification({ type: 'success', message: 'Ticket updated successfully!' });
      setTimeout(() => setNotification(null), 3000);
      setNewStatus('');
      setStatusUpdateNote('');
      setNewAssignee('');
      setResolution('');
    },
    onError: (error: any) => {
      setNotification({ type: 'error', message: error?.message || 'Failed to update ticket' });
      setTimeout(() => setNotification(null), 4000);
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ ticketId, content, isInternal }: { ticketId: string; content: string; isInternal: boolean }) => {
      return apiRequest(`/api/hr-tickets/${ticketId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          authorId: user?.id,
          isInternal
        })
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr-tickets', variables.ticketId, 'comments'] });
      setNewComment('');
      setIsInternalNote(false);
      setNotification({ type: 'success', message: 'Comment added successfully!' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error: any) => {
      setNotification({ type: 'error', message: error?.message || 'Failed to add comment' });
      setTimeout(() => setNotification(null), 4000);
    }
  });

  const handleStatusUpdate = () => {
    if (!selectedTicket || !newStatus) return;
    
    const updates: Record<string, any> = {
      status: newStatus,
      statusNote: statusUpdateNote || undefined
    };
    
    if (newStatus === 'Resolved' && resolution) {
      updates.resolution = resolution;
    }
    
    updateTicketMutation.mutate({ ticketId: selectedTicket.id, updates });
  };

  const handleAssigneeUpdate = () => {
    if (!selectedTicket) return;
    
    updateTicketMutation.mutate({
      ticketId: selectedTicket.id,
      updates: { assigneeId: newAssignee || null }
    });
  };

  const handleAddComment = () => {
    if (!selectedTicket || !newComment.trim()) return;
    
    addCommentMutation.mutate({
      ticketId: selectedTicket.id,
      content: newComment.trim(),
      isInternal: isInternalNote
    });
  };

  const handleTicketSelect = (ticket: TicketWithAuthor) => {
    setSelectedTicket(ticket);
    setNewStatus('');
    setStatusUpdateNote('');
    setNewAssignee(ticket.assigneeId || '');
    setResolution(ticket.resolution || '');
  };

  if (!isOpen) return null;

  if (!isHRUser) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="hr-dashboard-unauthorized">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This dashboard is only accessible to HR staff and Product Owners.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            data-testid="button-close-unauthorized"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="hr-ticket-dashboard">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-[95vw] h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Ticket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-dashboard-title">
                HR Ticket Management
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage and respond to employee support tickets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetchTickets()}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              data-testid="button-refresh-tickets"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              data-testid="button-close-dashboard"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {notification && (
          <div
            className={`mx-4 mt-4 p-3 rounded-lg flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : notification.type === 'error'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            }`}
            data-testid="notification-banner"
          >
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="hover:opacity-70" data-testid="button-dismiss-notification">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          <div className={`${selectedTicket ? 'w-1/2' : 'w-full'} flex flex-col border-r border-gray-200 dark:border-gray-700`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4" data-testid="stat-open-tickets">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Open Tickets</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalOpen}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-blue-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4" data-testid="stat-assigned-to-me">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">Assigned to Me</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.assignedToMe}</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4" data-testid="stat-unassigned">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Unassigned</p>
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.unassigned}</p>
                    </div>
                    <User className="h-8 w-8 text-yellow-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4" data-testid="stat-urgent">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">Urgent</p>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.urgent}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tickets..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="input-search-tickets"
                  />
                </div>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  data-testid="select-filter-status"
                >
                  <option value="All">All Statuses</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  data-testid="select-filter-category"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  data-testid="select-filter-priority"
                >
                  <option value="All">All Priorities</option>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                
                <select
                  value={filters.assignee}
                  onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  data-testid="select-filter-assignee"
                >
                  <option value="All">All Assignees</option>
                  <option value="Unassigned">Unassigned</option>
                  <option value="Assigned to me">Assigned to me</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {isLoadingTickets ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <Ticket className="h-16 w-16 mb-4 opacity-30" />
                  <p>No tickets found</p>
                </div>
              ) : (
                <table className="w-full" data-testid="table-tickets">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ticket</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submitter</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assignee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                          selectedTicket?.id === ticket.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => handleTicketSelect(ticket)}
                        data-testid={`row-ticket-${ticket.id}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400" data-testid={`text-ticket-number-${ticket.id}`}>
                            {ticket.ticketNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            <span className="ml-2 text-sm text-gray-900 dark:text-white" data-testid={`text-submitter-${ticket.id}`}>
                              {ticket.submitterName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900 dark:text-white line-clamp-1" data-testid={`text-subject-${ticket.id}`}>
                            {ticket.subject}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(ticket.category as TicketCategory)}`} data-testid={`badge-category-${ticket.id}`}>
                            {ticket.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority as TicketPriority)}`} data-testid={`badge-priority-${ticket.id}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status as TicketStatus)}`} data-testid={`badge-status-${ticket.id}`}>
                            {getStatusIcon(ticket.status as TicketStatus)}
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" data-testid={`text-created-${ticket.id}`}>
                          {formatDateShort(ticket.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {ticket.assigneeName ? (
                            <span className="text-sm text-gray-900 dark:text-white" data-testid={`text-assignee-${ticket.id}`}>
                              {ticket.assigneeName}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500 italic" data-testid={`text-assignee-${ticket.id}`}>
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <select
                              value={ticket.assigneeId || ''}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateTicketMutation.mutate({
                                  ticketId: ticket.id,
                                  updates: { assigneeId: e.target.value || null }
                                });
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 max-w-[120px]"
                              title="Quick Assign"
                              data-testid={`select-quick-assign-${ticket.id}`}
                            >
                              <option value="">Unassigned</option>
                              {hrStaff.map(staff => (
                                <option key={staff.id} value={staff.id}>
                                  {`${staff.firstName || ''} ${staff.lastName || ''}`.trim() || staff.email}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTicketSelect(ticket);
                              }}
                              className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                              title="View Details"
                              data-testid={`button-view-ticket-${ticket.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {selectedTicket && (
            <div className="w-1/2 flex flex-col overflow-hidden" data-testid="panel-ticket-detail">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="text-detail-ticket-number">
                    {selectedTicket.ticketNumber}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Submitted by {selectedTicket.submitterName} on {formatDate(selectedTicket.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  data-testid="button-close-detail-panel"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Subject</h3>
                  <p className="text-gray-900 dark:text-white font-medium" data-testid="text-detail-subject">
                    {selectedTicket.subject}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap" data-testid="text-detail-description">
                    {selectedTicket.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Category</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(selectedTicket.category as TicketCategory)}`}>
                      {selectedTicket.category}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Priority</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedTicket.priority as TicketPriority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Update Status</h3>
                  <div className="space-y-3">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      data-testid="select-update-status"
                    >
                      <option value="">Select new status...</option>
                      {STATUSES.map(s => (
                        <option key={s} value={s} disabled={s === selectedTicket.status}>{s}</option>
                      ))}
                    </select>
                    
                    {newStatus === 'Resolved' && (
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Resolution</label>
                        <textarea
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          placeholder="Describe how this ticket was resolved..."
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                          data-testid="input-resolution"
                        />
                      </div>
                    )}
                    
                    <input
                      type="text"
                      value={statusUpdateNote}
                      onChange={(e) => setStatusUpdateNote(e.target.value)}
                      placeholder="Optional note for status change..."
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      data-testid="input-status-note"
                    />
                    
                    <button
                      onClick={handleStatusUpdate}
                      disabled={!newStatus || updateTicketMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      data-testid="button-update-status"
                    >
                      {updateTicketMutation.isPending ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Assign Ticket</h3>
                  <div className="flex gap-2">
                    <select
                      value={newAssignee}
                      onChange={(e) => setNewAssignee(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      data-testid="select-assignee"
                    >
                      <option value="">Unassigned</option>
                      {hrStaff.map(staff => (
                        <option key={staff.id} value={staff.id}>
                          {`${staff.firstName || ''} ${staff.lastName || ''}`.trim() || staff.email}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssigneeUpdate}
                      disabled={updateTicketMutation.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      data-testid="button-assign"
                    >
                      {updateTicketMutation.isPending ? 'Saving...' : 'Assign'}
                    </button>
                  </div>
                </div>

                {selectedTicket.resolution && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Resolution
                    </h3>
                    <p className="text-green-800 dark:text-green-300" data-testid="text-resolution">
                      {selectedTicket.resolution}
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comments ({ticketComments.length})
                  </h3>
                  
                  <div className="space-y-3 max-h-64 overflow-auto mb-4">
                    {isLoadingComments ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : ticketComments.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No comments yet</p>
                    ) : (
                      ticketComments.map((comment) => {
                        const author = profileMap[comment.authorId];
                        const authorName = author ? `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email : 'Unknown';
                        
                        return (
                          <div
                            key={comment.id}
                            className={`p-3 rounded-lg ${
                              comment.isInternal
                                ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                                : 'bg-gray-50 dark:bg-gray-700/50'
                            }`}
                            data-testid={`comment-${comment.id}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {authorName}
                                </span>
                                {comment.isInternal && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                                    <Lock className="h-3 w-3" />
                                    Internal
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="space-y-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      data-testid="input-new-comment"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <input
                          type="checkbox"
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          data-testid="checkbox-internal-note"
                        />
                        <Lock className="h-4 w-4" />
                        Internal note (only visible to HR)
                      </label>
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || addCommentMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        data-testid="button-add-comment"
                      >
                        <Send className="h-4 w-4" />
                        {addCommentMutation.isPending ? 'Sending...' : 'Add Comment'}
                      </button>
                    </div>
                  </div>
                </div>

                {ticketHistory.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Status History
                    </h3>
                    <div className="space-y-2">
                      {ticketHistory.map((history) => {
                        const changedBy = profileMap[history.changedById || ''];
                        const changedByName = changedBy 
                          ? `${changedBy.firstName || ''} ${changedBy.lastName || ''}`.trim() || changedBy.email 
                          : 'System';
                        
                        return (
                          <div
                            key={history.id}
                            className="flex items-start gap-3 text-sm"
                            data-testid={`history-${history.id}`}
                          >
                            <div className="w-2 h-2 rounded-full bg-gray-400 mt-2"></div>
                            <div className="flex-1">
                              <p className="text-gray-700 dark:text-gray-300">
                                <span className="font-medium">{changedByName}</span>
                                {' changed status from '}
                                <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${getStatusColor(history.previousStatus as TicketStatus || 'Open')}`}>
                                  {history.previousStatus || 'New'}
                                </span>
                                {' to '}
                                <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${getStatusColor(history.newStatus as TicketStatus)}`}>
                                  {history.newStatus}
                                </span>
                              </p>
                              {history.changeNote && (
                                <p className="text-gray-500 dark:text-gray-400 mt-1">"{history.changeNote}"</p>
                              )}
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {formatDate(history.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRTicketDashboard;
