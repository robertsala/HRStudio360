import React, { useState } from 'react';
import { X, Calendar, User, Clock, Star, Plus } from 'lucide-react';

interface ScheduleReviewModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

const ScheduleReviewModal: React.FC<ScheduleReviewModalProps> = ({ isOpen = true, onClose }) => {
  const [formData, setFormData] = useState({
    employee: '',
    reviewer: '',
    reviewType: 'Quarterly',
    dueDate: '',
    priority: 'Medium',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle ESC key press
  React.useEffect(() => {
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

  const employees = [
    'Sarah Johnson',
    'Mike Chen',
    'Lisa Rodriguez',
    'David Kim',
    'Emma Wilson',
    'Alex Thompson',
    'John Smith',
    'Maria Garcia'
  ];

  const reviewers = [
    'Sarah Johnson',
    'Mike Chen',
    'Lisa Rodriguez',
    'John Smith',
    'Emma Wilson'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Reset form and close modal
    setFormData({
      employee: '',
      reviewer: '',
      reviewType: 'Quarterly',
      dueDate: '',
      priority: 'Medium',
      notes: ''
    });
    setIsSubmitting(false);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto resize-both min-w-[300px] min-h-[300px]">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-full p-2 mr-3">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">Schedule Performance Review</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-96">
          <div className="p-6 space-y-6">
            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Employee to Review</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={formData.employee}
                  onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(employee => (
                    <option key={employee} value={employee}>{employee}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reviewer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Reviewer</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={formData.reviewer}
                  onChange={(e) => setFormData({ ...formData, reviewer: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Reviewer</option>
                  {reviewers.map(reviewer => (
                    <option key={reviewer} value={reviewer}>{reviewer}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Review Type and Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Review Type</label>
                <select
                  value={formData.reviewType}
                  onChange={(e) => setFormData({ ...formData, reviewType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Annual">Annual Review</option>
                  <option value="Quarterly">Quarterly Review</option>
                  <option value="Mid-Year">Mid-Year Review</option>
                  <option value="90-Day">90-Day Review</option>
                  <option value="Probationary">Probationary Review</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Due Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Priority Level</label>
              <div className="flex space-x-4">
                {['Low', 'Medium', 'High'].map(priority => (
                  <label key={priority} className="flex items-center">
                    <input
                      type="radio"
                      name="priority"
                      value={priority}
                      checked={formData.priority === priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      priority === 'High' ? 'bg-red-100 text-red-800' :
                      priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {priority}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Add any specific areas of focus, goals, or instructions for this review..."
              />
            </div>

            {/* Review Template Preview */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Review Template Preview</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Goal Achievement & Performance Metrics</p>
                <p>• Core Competencies & Skills Assessment</p>
                <p>• Professional Development & Growth Areas</p>
                <p>• Feedback & Communication</p>
                <p>• Career Goals & Future Planning</p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            The review will be automatically sent to both parties with email notifications.
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Review
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleReviewModal;