import React, { useState, useEffect } from 'react';
import { X, Clock, User, Star, Calendar, Filter, Plus } from 'lucide-react';

interface Review {
  id: string;
  employeeName: string;
  reviewerName: string;
  type: 'Annual' | 'Quarterly' | '90-Day' | 'Mid-Year';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  dueDate: string;
  department: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleReview?: () => void;
}

const mockReviews: Review[] = [
  {
    id: '1',
    employeeName: 'Sarah Johnson',
    reviewerName: 'Mike Chen',
    type: 'Annual',
    status: 'Pending',
    dueDate: '2025-01-15',
    department: 'Engineering',
    priority: 'High'
  },
  {
    id: '2',
    employeeName: 'David Kim',
    reviewerName: 'Lisa Rodriguez',
    type: 'Quarterly',
    status: 'In Progress',
    dueDate: '2025-01-20',
    department: 'Engineering',
    priority: 'Medium'
  },
  {
    id: '3',
    employeeName: 'Emma Wilson',
    reviewerName: 'John Smith',
    type: '90-Day',
    status: 'Overdue',
    dueDate: '2025-01-05',
    department: 'HR',
    priority: 'High'
  },
  {
    id: '4',
    employeeName: 'Alex Thompson',
    reviewerName: 'Sarah Johnson',
    type: 'Mid-Year',
    status: 'Pending',
    dueDate: '2025-01-25',
    department: 'Marketing',
    priority: 'Low'
  }
];

const ReviewsModal: React.FC<ReviewsModalProps> = ({ isOpen, onClose, onScheduleReview }) => {
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [reviewData, setReviewData] = useState({
    overallRating: '',
    goals: '',
    strengths: '',
    improvements: '',
    comments: ''
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredReviews = mockReviews.filter(review =>
    filterStatus === 'All' || review.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleStartReview = (review: Review) => {
    setCurrentReview(review);
    setSelectedReview(null);
    setShowReviewForm(true);
  };

  const handleSubmitReview = () => {
    if (!reviewData.overallRating || !reviewData.goals) {
      setNotification({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // Simulate review submission
    console.log('Submitting review for:', currentReview?.employeeName, reviewData);
    
    setNotification({
      type: 'success',
      message: `Performance review for ${currentReview?.employeeName} has been submitted successfully!`
    });
    
    // Reset form
    setReviewData({
      overallRating: '',
      goals: '',
      strengths: '',
      improvements: '',
      comments: ''
    });
    
    setTimeout(() => {
      setNotification(null);
      setShowReviewForm(false);
      setCurrentReview(null);
    }, 2000);
  };

  const handleCancelReview = () => {
    setShowReviewForm(false);
    setCurrentReview(null);
    setReviewData({
      overallRating: '',
      goals: '',
      strengths: '',
      improvements: '',
      comments: ''
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-auto resize-both min-w-[300px] min-h-[300px]">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">Pending Reviews (12)</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Overdue">Overdue</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <button
              onClick={onScheduleReview}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule New Review
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-96">
          <div className="p-6">
            <div className="grid gap-4">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setSelectedReview(review)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-purple-600 rounded-full p-2">
                        <Star className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white">{review.employeeName}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{review.type} Review • {review.department}</p>
                        <p className="text-sm text-gray-500">Reviewer: {review.reviewerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(review.priority)}`}>
                          {review.priority} Priority
                        </span>
                        <p className="text-sm text-gray-500 mt-1">Due: {new Date(review.dueDate).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(review.status)}`}>
                        {review.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Review Details Modal */}
        {selectedReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Review Details</h3>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Employee</label>
                    <p className="text-gray-900 dark:text-white dark:text-white">{selectedReview.employeeName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Reviewer</label>
                    <p className="text-gray-900 dark:text-white dark:text-white">{selectedReview.reviewerName}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Review Type</label>
                    <p className="text-gray-900 dark:text-white dark:text-white">{selectedReview.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Department</label>
                    <p className="text-gray-900 dark:text-white dark:text-white">{selectedReview.department}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Due Date</label>
                    <p className="text-gray-900 dark:text-white dark:text-white">{new Date(selectedReview.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Priority</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedReview.priority)}`}>
                      {selectedReview.priority}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Status</label>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReview.status)}`}>
                    {selectedReview.status}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors">
                  Reschedule
                </button>
                <button
                  onClick={() => handleStartReview(selectedReview)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Performance Review Form Modal */}
        {showReviewForm && currentReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <div>
                  <h3 className="text-xl font-bold">Performance Review</h3>
                  <p className="text-purple-100">{currentReview.employeeName} • {currentReview.type}</p>
                </div>
                <button
                  onClick={handleCancelReview}
                  className="text-purple-100 hover:text-white transition-colors"
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
                      <p className="text-gray-900 dark:text-white dark:text-white">{currentReview.employeeName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Department:</span>
                      <p className="text-gray-900 dark:text-white dark:text-white">{currentReview.department}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Review Type:</span>
                      <p className="text-gray-900 dark:text-white dark:text-white">{currentReview.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Due Date:</span>
                      <p className="text-gray-900 dark:text-white dark:text-white">{new Date(currentReview.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Review Form */}
                <div className="space-y-6">
                  {/* Overall Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                      Overall Performance Rating *
                    </label>
                    <select
                      value={reviewData.overallRating}
                      onChange={(e) => setReviewData({ ...reviewData, overallRating: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Rating</option>
                      <option value="5">5 - Exceptional (Exceeds all expectations)</option>
                      <option value="4">4 - Exceeds Expectations</option>
                      <option value="3">3 - Meets Expectations</option>
                      <option value="2">2 - Below Expectations</option>
                      <option value="1">1 - Does Not Meet Expectations</option>
                    </select>
                  </div>

                  {/* Goal Achievement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                      Goal Achievement & Key Accomplishments *
                    </label>
                    <textarea
                      value={reviewData.goals}
                      onChange={(e) => setReviewData({ ...reviewData, goals: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={4}
                      placeholder="Describe the employee's progress on goals and key accomplishments during this review period..."
                      required
                    />
                  </div>

                  {/* Strengths */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                      Key Strengths & Skills
                    </label>
                    <textarea
                      value={reviewData.strengths}
                      onChange={(e) => setReviewData({ ...reviewData, strengths: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="Highlight the employee's key strengths, skills, and positive contributions..."
                    />
                  </div>

                  {/* Areas for Development */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                      Areas for Development & Growth
                    </label>
                    <textarea
                      value={reviewData.improvements}
                      onChange={(e) => setReviewData({ ...reviewData, improvements: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="Identify areas where the employee can grow and develop further..."
                    />
                  </div>

                  {/* Additional Comments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                      Additional Comments & Future Goals
                    </label>
                    <textarea
                      value={reviewData.comments}
                      onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={4}
                      placeholder="Additional feedback, career development suggestions, and goals for the next review period..."
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    onClick={handleCancelReview}
                    className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Submit Review
                  </button>
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
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
      </div>
    </div>
  );
};

export default ReviewsModal;