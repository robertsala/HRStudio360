import React, { useState, useEffect } from 'react';
import { X, Check, XCircle, MapPin, User, Calendar, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/queryClient';

interface AddressChangeRequest {
  id: string;
  profileId: string;
  requestedBy: string;
  oldAddress: string;
  oldCity: string;
  oldState: string;
  oldZipCode: string;
  newAddress: string;
  newCity: string;
  newState: string;
  newZipCode: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

interface AddressChangeApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddressChangeApprovalModal: React.FC<AddressChangeApprovalModalProps> = ({ isOpen, onClose }) => {
  const [requests, setRequests] = useState<AddressChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      fetchPendingRequests();
    }
  }, [isOpen]);

  const fetchPendingRequests = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/address-change-requests');
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
      alert('Failed to load pending address change requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    const confirmApprove = confirm('Are you sure you want to approve this address change?');
    if (!confirmApprove) return;

    setProcessing(requestId);
    try {
      await apiRequest(`/api/address-change-requests/${requestId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({
          reviewNotes: reviewNotes[requestId] || ''
        })
      });
      
      alert('✅ Address change approved successfully!');
      await fetchPendingRequests(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to approve request:', error);
      alert(`Failed to approve address change: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt('Please provide a reason for rejecting this address change:');
    if (!reason) return;

    setProcessing(requestId);
    try {
      await apiRequest(`/api/address-change-requests/${requestId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({
          reviewNotes: reason
        })
      });
      
      alert('❌ Address change rejected');
      await fetchPendingRequests(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      alert(`Failed to reject address change: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="modal-address-approval">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Address Change Approvals</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            data-testid="button-close-modal"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400">Loading pending requests...</div>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p className="text-lg">No pending address change requests</p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                  data-testid={`request-${request.id}`}
                >
                  {/* Request Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        Employee ID: {request.profileId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(request.submittedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Address Comparison */}
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    {/* Old Address */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Current Address</h3>
                      <div className="space-y-1 text-gray-900 dark:text-white">
                        <div>{request.oldAddress || 'N/A'}</div>
                        <div>
                          {request.oldCity}, {request.oldState} {request.oldZipCode}
                        </div>
                      </div>
                    </div>

                    {/* New Address */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">Requested Address</h3>
                      <div className="space-y-1 text-gray-900 dark:text-white">
                        <div>{request.newAddress}</div>
                        <div>
                          {request.newCity}, {request.newState} {request.newZipCode}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review Notes Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Review Notes (Optional)
                    </label>
                    <textarea
                      value={reviewNotes[request.id] || ''}
                      onChange={(e) => setReviewNotes({ ...reviewNotes, [request.id]: e.target.value })}
                      placeholder="Add any notes about this review..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      data-testid={`input-notes-${request.id}`}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={processing === request.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                      data-testid={`button-approve-${request.id}`}
                    >
                      <Check className="w-5 h-5" />
                      {processing === request.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={processing === request.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                      data-testid={`button-reject-${request.id}`}
                    >
                      <XCircle className="w-5 h-5" />
                      {processing === request.id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressChangeApprovalModal;
