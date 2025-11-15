import { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, XCircle, AlertCircle, FileText, User, Calendar } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../../lib/queryClient';
import { useAuth } from '../../contexts/AuthContext';

interface CorrectionRequestModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

interface TimesheetCorrectionRequest {
  id: string;
  timesheetEntryId: string;
  requestedById: string;
  originalValues: any;
  requestedValues: any;
  justification: string;
  supportingDocuments: string[] | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const CorrectionRequestModal: React.FC<CorrectionRequestModalProps> = ({ isOpen = true, onClose }) => {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('Pending');
  const [selectedRequest, setSelectedRequest] = useState<TimesheetCorrectionRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Fetch correction requests
  const { data: correctionRequests = [], isLoading, refetch } = useQuery<TimesheetCorrectionRequest[]>({
    queryKey: ['/api/timesheet-corrections', { status: statusFilter }],
    enabled: isOpen
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      return await apiRequest(`/api/timesheet-corrections/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reviewNotes: notes })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timesheet-corrections'] });
      setToast({ type: 'success', message: 'Request approved successfully' });
      setTimeout(() => setToast(null), 3000);
      setSelectedRequest(null);
      setReviewNotes('');
      refetch();
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to approve correction request' });
      setTimeout(() => setToast(null), 3000);
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return await apiRequest(`/api/timesheet-corrections/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reviewNotes: notes })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timesheet-corrections'] });
      setToast({ type: 'success', message: 'Request rejected successfully' });
      setTimeout(() => setToast(null), 3000);
      setSelectedRequest(null);
      setReviewNotes('');
      refetch();
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to reject correction request' });
      setTimeout(() => setToast(null), 3000);
    }
  });

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !selectedRequest) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, selectedRequest, onClose]);

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      Approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      Rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      Cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
    };
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const handleApprove = () => {
    if (!selectedRequest) return;
    approveMutation.mutate({ id: selectedRequest.id, notes: reviewNotes });
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    if (!reviewNotes.trim()) {
      setToast({ type: 'error', message: 'Please provide a reason for rejecting this request' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    rejectMutation.mutate({ id: selectedRequest.id, notes: reviewNotes });
  };

  const formatHours = (hours: any) => {
    if (typeof hours === 'number') return hours.toFixed(2);
    if (typeof hours === 'string') return parseFloat(hours).toFixed(2);
    return '0.00';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Timesheet Correction Requests</h2>
              <p className="text-indigo-100 text-sm">Review and approve timesheet corrections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            data-testid="button-close-correction-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by status:</span>
            {['Pending', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                data-testid={`filter-${status.toLowerCase()}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : correctionRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No {statusFilter.toLowerCase()} correction requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {correctionRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Correction Request #{request.id.slice(0, 8)}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Submitted {new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {request.status === 'Pending' && (user?.role === 'Manager' || user?.role === 'HR' || user?.role === 'Product Owner') && (
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        data-testid={`button-review-${request.id}`}
                      >
                        Review
                      </button>
                    )}
                  </div>

                  {/* Justification */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Justification:</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{request.justification}</p>
                  </div>

                  {/* Changes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">Original Values</h4>
                      <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        <div>Regular: {formatHours(request.originalValues.regularHours)} hrs</div>
                        <div>Overtime: {formatHours(request.originalValues.overtimeHours)} hrs</div>
                        <div>PTO: {formatHours(request.originalValues.ptoHours)} hrs</div>
                        <div>Sick: {formatHours(request.originalValues.sickHours)} hrs</div>
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">Requested Values</h4>
                      <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        <div>Regular: {formatHours(request.requestedValues.regularHours)} hrs</div>
                        <div>Overtime: {formatHours(request.requestedValues.overtimeHours)} hrs</div>
                        <div>PTO: {formatHours(request.requestedValues.ptoHours)} hrs</div>
                        <div>Sick: {formatHours(request.requestedValues.sickHours)} hrs</div>
                      </div>
                    </div>
                  </div>

                  {/* Review Info */}
                  {request.status !== 'Pending' && request.reviewedAt && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="font-medium">Reviewed on {new Date(request.reviewedAt).toLocaleString()}</span>
                      </div>
                      {request.reviewNotes && (
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Notes:</strong> {request.reviewNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Modal */}
        {selectedRequest && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Review Correction Request</h3>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setReviewNotes('');
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  data-testid="button-close-review"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Request Details */}
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Justification</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedRequest.justification}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 dark:text-red-300 mb-3">Original Values</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Regular:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatHours(selectedRequest.originalValues.regularHours)} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Overtime:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatHours(selectedRequest.originalValues.overtimeHours)} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">PTO:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatHours(selectedRequest.originalValues.ptoHours)} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Sick:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatHours(selectedRequest.originalValues.sickHours)} hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-3">Requested Changes</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Regular:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatHours(selectedRequest.requestedValues.regularHours)} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Overtime:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatHours(selectedRequest.requestedValues.overtimeHours)} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">PTO:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatHours(selectedRequest.requestedValues.ptoHours)} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Sick:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatHours(selectedRequest.requestedValues.sickHours)} hrs</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Review Notes {rejectMutation.isPending && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about your decision (required for rejection)..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    data-testid="textarea-review-notes"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setReviewNotes('');
                  }}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  data-testid="button-cancel-review"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  data-testid="button-reject-request"
                >
                  <XCircle className="w-5 h-5" />
                  <span>{rejectMutation.isPending ? 'Rejecting...' : 'Reject'}</span>
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  data-testid="button-approve-request"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>{approveMutation.isPending ? 'Approving...' : 'Approve'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[100] flex items-center text-white ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 mr-2" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorrectionRequestModal;
