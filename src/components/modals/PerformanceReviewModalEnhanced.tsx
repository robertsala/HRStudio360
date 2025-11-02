import React, { useState } from 'react';
import { X, Star, User, Calendar, CheckCircle, AlertCircle, Clock, FileText, Eye, Send, Users, TrendingUp, Plus, Edit, Save } from 'lucide-react';

interface ReviewStatusBadgeProps {
  status: 'not_started' | 'in_progress' | 'submitted';
  type: 'self' | 'manager';
}

const ReviewStatusBadge: React.FC<ReviewStatusBadgeProps> = ({ status, type }) => {
  const colors = {
    not_started: 'bg-gray-100 text-gray-700 border-gray-300',
    in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    submitted: 'bg-green-100 text-green-700 border-green-300'
  };

  const icons = {
    not_started: <Clock className="h-3 w-3" />,
    in_progress: <FileText className="h-3 w-3" />,
    submitted: <CheckCircle className="h-3 w-3" />
  };

  const labels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    submitted: 'Submitted'
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status]}`}>
      {icons[status]}
      <span>{type === 'self' ? 'Self' : 'Manager'}: {labels[status]}</span>
    </div>
  );
};

interface PerformanceReviewEnhancedModalProps {
  onClose?: () => void;
  initialFilter?: {
    type: 'my-team' | 'my-department' | 'my-location' | 'all';
    managerId?: string;
    department?: string;
    location?: string;
  };
}

interface ReviewCycle {
  id: string;
  name: string;
  reviewType: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface QuestionResponse {
  question: string;
  category: string;
  selfRating?: number;
  selfComment?: string;
  managerRating?: number;
  managerComment?: string;
}

interface PerformanceReview {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  role: string;
  managerName: string;
  selfAssessmentStatus: 'not_started' | 'in_progress' | 'submitted';
  managerAssessmentStatus: 'not_started' | 'in_progress' | 'submitted';
  selfSubmittedAt?: string;
  managerSubmittedAt?: string;
  overallStatus: 'pending_self' | 'pending_manager' | 'pending_hr' | 'completed';
  selfOverallRating?: number;
  managerOverallRating?: number;
  finalRating?: number;
  responses?: QuestionResponse[];
  selfGoals?: string;
  selfAchievements?: string;
  selfDevelopmentAreas?: string;
  managerGoals?: string;
  managerAchievements?: string;
  managerDevelopmentAreas?: string;
}

const PerformanceReviewEnhancedModal: React.FC<PerformanceReviewEnhancedModalProps> = ({ onClose, initialFilter }) => {
  const [activeTab, setActiveTab] = useState<'hr-dashboard' | 'schedule-cycle' | 'my-reviews' | 'team-reviews'>('schedule-cycle');
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [isEditingCycle, setIsEditingCycle] = useState(false);
  const [teamFilter, setTeamFilter] = useState<'my-team' | 'my-department' | 'my-location' | 'all'>(initialFilter?.type || 'all');

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const [editableCycle, setEditableCycle] = useState({
    id: '1',
    name: '2025 Annual Performance Review',
    reviewType: 'annual',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    status: 'active'
  });

  const [newCycle, setNewCycle] = useState({
    name: '',
    reviewType: 'annual',
    startDate: '',
    endDate: '',
  });

  const mockReviewCycle: ReviewCycle = {
    id: '1',
    name: '2025 Annual Performance Review',
    reviewType: 'annual',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    status: 'active'
  };

  const mockQuestionResponses: QuestionResponse[] = [
    {
      category: 'Job Performance & Quality',
      question: 'Consistently delivers high-quality work that meets or exceeds expectations',
      selfRating: 4,
      selfComment: 'I consistently delivered high-quality code with minimal bugs. Received positive feedback from code reviews.',
      managerRating: 5,
      managerComment: 'Sarah consistently exceeds expectations in code quality. Her work requires minimal revisions and serves as a model for the team.'
    },
    {
      category: 'Job Performance & Quality',
      question: 'Completes tasks efficiently and manages time effectively',
      selfRating: 4,
      selfComment: 'Completed all assigned tasks on time. Used agile methodologies to prioritize work effectively.',
      managerRating: 4,
      managerComment: 'Excellent time management. Consistently meets deadlines and proactively communicates any potential delays.'
    },
    {
      category: 'Goal Achievement',
      question: 'Successfully achieved individual goals and objectives set for this review period',
      selfRating: 4,
      selfComment: 'Achieved 4 out of 5 major goals. The payment integration project took longer than expected but was completed successfully.',
      managerRating: 5,
      managerComment: 'Exceeded expectations on the payment integration despite challenges. Showed great problem-solving skills.'
    },
    {
      category: 'Communication & Collaboration',
      question: 'Communicates clearly and effectively with team members and stakeholders',
      selfRating: 4,
      selfComment: 'Maintained clear communication with team. Led several technical discussions and documentation efforts.',
      managerRating: 4,
      managerComment: 'Strong communicator who effectively bridges technical and non-technical stakeholders.'
    },
    {
      category: 'Problem Solving & Innovation',
      question: 'Identifies problems and proposes effective solutions',
      selfRating: 5,
      selfComment: 'Identified and resolved critical performance bottleneck that improved load time by 40%.',
      managerRating: 5,
      managerComment: 'Exceptional problem-solving skills. The performance optimization she led had significant business impact.'
    },
    {
      category: 'Leadership & Influence',
      question: 'Shows leadership qualities and positively influences others',
      selfRating: 3,
      selfComment: 'Mentored two junior developers. Would like to take on more leadership opportunities.',
      managerRating: 4,
      managerComment: 'Natural mentor who has positively influenced team culture. Ready for more leadership responsibilities.'
    }
  ];

  const allReviews: PerformanceReview[] = [
    {
      id: '1',
      employeeName: 'Sarah Johnson',
      employeeId: '1',
      department: 'Engineering',
      role: 'Senior Software Engineer',
      managerName: 'Mike Chen',
      selfAssessmentStatus: 'submitted',
      managerAssessmentStatus: 'submitted',
      selfSubmittedAt: '2025-01-15',
      managerSubmittedAt: '2025-01-20',
      overallStatus: 'completed',
      selfOverallRating: 4.2,
      managerOverallRating: 4.5,
      finalRating: 4.4,
      responses: mockQuestionResponses,
      selfAchievements: 'Led the payment integration project, mentored junior developers, improved system performance by 40%',
      selfDevelopmentAreas: 'Would like to develop leadership skills and take on more strategic projects',
      selfGoals: 'Lead a major feature launch, complete advanced architecture training, mentor 3+ developers',
      managerAchievements: 'Exceptional technical leadership on payment integration. Significant positive impact on team productivity and code quality.',
      managerDevelopmentAreas: 'Continue developing leadership and strategic thinking skills. Consider architecture certification.',
      managerGoals: 'Recommend for tech lead role. Assign ownership of Q2 major feature. Sponsor for leadership training program.'
    },
    {
      id: '2',
      employeeName: 'David Kim',
      employeeId: '4',
      department: 'Engineering',
      role: 'Frontend Developer',
      managerName: 'Mike Chen',
      selfAssessmentStatus: 'submitted',
      managerAssessmentStatus: 'in_progress',
      selfSubmittedAt: '2025-01-18',
      overallStatus: 'pending_manager',
      selfOverallRating: 3.8
    },
    {
      id: '3',
      employeeName: 'Lisa Rodriguez',
      employeeId: '3',
      department: 'Sales',
      role: 'Sales Director',
      managerName: 'Robert Sala',
      selfAssessmentStatus: 'in_progress',
      managerAssessmentStatus: 'not_started',
      overallStatus: 'pending_self'
    },
    {
      id: '4',
      employeeName: 'Emma Wilson',
      employeeId: '5',
      department: 'Human Resources',
      role: 'HR Specialist',
      managerName: 'Olivia Harris',
      selfAssessmentStatus: 'not_started',
      managerAssessmentStatus: 'not_started',
      overallStatus: 'pending_self'
    },
    {
      id: '5',
      employeeName: 'Alex Thompson',
      employeeId: '6',
      department: 'Marketing',
      role: 'Marketing Manager',
      managerName: 'Robert Sala',
      selfAssessmentStatus: 'submitted',
      managerAssessmentStatus: 'not_started',
      selfSubmittedAt: '2025-01-12',
      overallStatus: 'pending_manager',
      selfOverallRating: 4.0
    }
  ];

  const mockReviews = allReviews.filter(review => {
    if (teamFilter === 'my-team' && initialFilter?.managerId) {
      if (review.managerName !== initialFilter.managerId && review.employeeName !== initialFilter.managerId) {
        return false;
      }
    }

    if (teamFilter === 'my-department' && initialFilter?.department) {
      if (review.department !== initialFilter.department) {
        return false;
      }
    }

    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_self': return 'text-red-600 bg-red-50';
      case 'pending_manager': return 'text-yellow-600 bg-yellow-50';
      case 'pending_hr': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_self': return 'Awaiting Self-Assessment';
      case 'pending_manager': return 'Awaiting Manager Review';
      case 'pending_hr': return 'Awaiting HR Review';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const getStatusStats = () => {
    return {
      total: mockReviews.length,
      pendingSelf: mockReviews.filter(r => r.overallStatus === 'pending_self').length,
      pendingManager: mockReviews.filter(r => r.overallStatus === 'pending_manager').length,
      pendingHR: mockReviews.filter(r => r.overallStatus === 'pending_hr').length,
      completed: mockReviews.filter(r => r.overallStatus === 'completed').length,
      selfSubmitted: mockReviews.filter(r => r.selfAssessmentStatus === 'submitted').length,
      managerSubmitted: mockReviews.filter(r => r.managerAssessmentStatus === 'submitted').length
    };
  };

  const stats = getStatusStats();

  const handleCreateCycle = () => {
    console.log('Creating review cycle:', newCycle);
    setShowCreateCycle(false);
    setNewCycle({ name: '', reviewType: 'annual', startDate: '', endDate: '' });
  };

  const handleSaveCycle = () => {
    console.log('Saving review cycle:', editableCycle);
    setIsEditingCycle(false);
  };

  const handleEditCycle = () => {
    setIsEditingCycle(true);
    setEditableCycle({
      id: mockReviewCycle.id,
      name: mockReviewCycle.name,
      reviewType: mockReviewCycle.reviewType,
      startDate: mockReviewCycle.startDate,
      endDate: mockReviewCycle.endDate,
      status: mockReviewCycle.status
    });
  };

  const handleViewReview = (review: PerformanceReview) => {
    setSelectedReview(review);
  };

  return (
    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 flex justify-between items-center rounded-t-lg">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="h-7 w-7" />
              Annual Performance Reviews
            </h2>
            <p className="text-purple-100 text-sm mt-1">
              Comprehensive performance evaluation and salary review system
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-purple-800 rounded-lg p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 dark:border-gray-700 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('schedule-cycle')}
              className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'schedule-cycle'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Schedule Review Cycle
            </button>
            <button
              onClick={() => setActiveTab('hr-dashboard')}
              className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'hr-dashboard'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              HR Dashboard
            </button>
            <button
              onClick={() => setActiveTab('my-reviews')}
              className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'my-reviews'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Reviews
            </button>
            <button
              onClick={() => setActiveTab('team-reviews')}
              className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'team-reviews'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Team Reviews
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'schedule-cycle' && (
            <div>
              {/* Current Active Cycle */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    {isEditingCycle ? (
                      <input
                        type="text"
                        value={editableCycle.name}
                        onChange={(e) => setEditableCycle({ ...editableCycle, name: e.target.value })}
                        className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white mb-2 px-3 py-1 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white mb-2">{mockReviewCycle.name}</h3>
                    )}
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {isEditingCycle ? (
                      <>
                        <button
                          onClick={handleSaveCycle}
                          className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <Save className="h-4 w-4" />
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingCycle(false)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 dark:text-gray-300 font-medium text-sm px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleEditCycle}
                        className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">
                  <div>
                    <span className="font-medium">Review Period:</span>{' '}
                    {isEditingCycle ? (
                      <span className="inline-flex gap-2">
                        <input
                          type="date"
                          value={editableCycle.startDate}
                          onChange={(e) => setEditableCycle({ ...editableCycle, startDate: e.target.value })}
                          className="px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-purple-500"
                        />
                        to
                        <input
                          type="date"
                          value={editableCycle.endDate}
                          onChange={(e) => setEditableCycle({ ...editableCycle, endDate: e.target.value })}
                          className="px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-purple-500"
                        />
                      </span>
                    ) : (
                      <span>{mockReviewCycle.startDate} to {mockReviewCycle.endDate}</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>{' '}
                    {isEditingCycle ? (
                      <select
                        value={editableCycle.reviewType}
                        onChange={(e) => setEditableCycle({ ...editableCycle, reviewType: e.target.value })}
                        className="px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="annual">Annual</option>
                        <option value="mid_year">Mid-Year</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="probationary">Probationary</option>
                      </select>
                    ) : (
                      <span>{mockReviewCycle.reviewType.charAt(0).toUpperCase() + mockReviewCycle.reviewType.slice(1)}</span>
                    )}
                  </div>
                </div>
                <div className="mt-4 p-4 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2 font-medium">Timeline:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Both employees and managers complete their assessments during the same period: <strong>{mockReviewCycle.startDate} - {mockReviewCycle.endDate}</strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Employees cannot view manager assessments until they submit their own self-assessment.
                  </p>
                </div>
              </div>

              {/* Create New Cycle */}
              <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Schedule New Review Cycle</h3>
                  <button
                    onClick={() => setShowCreateCycle(!showCreateCycle)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Cycle
                  </button>
                </div>

                {showCreateCycle && (
                  <div className="border-t border-gray-200 dark:border-gray-700 dark:border-gray-700 pt-6 mt-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                          Cycle Name
                        </label>
                        <input
                          type="text"
                          value={newCycle.name}
                          onChange={(e) => setNewCycle({ ...newCycle, name: e.target.value })}
                          placeholder="e.g., 2025 Annual Performance Review"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                          Review Type
                        </label>
                        <select
                          value={newCycle.reviewType}
                          onChange={(e) => setNewCycle({ ...newCycle, reviewType: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="annual">Annual</option>
                          <option value="mid_year">Mid-Year</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="probationary">Probationary</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                          Review Period Start Date
                        </label>
                        <input
                          type="date"
                          value={newCycle.startDate}
                          onChange={(e) => setNewCycle({ ...newCycle, startDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                          Review Period End Date
                        </label>
                        <input
                          type="date"
                          value={newCycle.endDate}
                          onChange={(e) => setNewCycle({ ...newCycle, endDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900 font-medium mb-2">Review Process:</p>
                      <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Employees and managers both complete reviews during the same time period</li>
                        <li>Employees must submit their self-assessment first</li>
                        <li>Manager assessments remain hidden until employee submits their self-assessment</li>
                        <li>HR reviews both assessments after submission and provides final approval</li>
                      </ul>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={handleCreateCycle}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        Create Review Cycle
                      </button>
                      <button
                        onClick={() => setShowCreateCycle(false)}
                        className="px-6 py-2 bg-gray-200 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'hr-dashboard' && (
            <div>
              {/* Review Cycle Info */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-5 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-2">{mockReviewCycle.name}</h3>
                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Review Period: <strong>{mockReviewCycle.startDate} to {mockReviewCycle.endDate}</strong></span>
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Active
                  </span>
                </div>
              </div>

              {/* Statistics Dashboard */}
              <div className="grid grid-cols-6 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white">{stats.total}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Reviews</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-4">
                  <div className="text-3xl font-bold text-red-600">{stats.pendingSelf}</div>
                  <div className="text-sm text-red-700 mt-1">Pending Self</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4">
                  <div className="text-3xl font-bold text-yellow-600">{stats.pendingManager}</div>
                  <div className="text-sm text-yellow-700 mt-1">Pending Manager</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-sm text-green-700 mt-1">Completed</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-600">{stats.selfSubmitted}</div>
                  <div className="text-sm text-blue-700 mt-1">Self Submitted</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-600">{stats.managerSubmitted}</div>
                  <div className="text-sm text-purple-700 mt-1">Manager Submitted</div>
                </div>
              </div>

              {/* Reviews Table */}
              <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white">All Performance Reviews</h3>
                  {initialFilter && (
                    <select
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value as any)}
                      className="border-2 border-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-blue-700 text-sm"
                    >
                      <option value="all">All Employees</option>
                      <option value="my-team">My Team</option>
                      <option value="my-department">My Department</option>
                      <option value="my-location">My Location</option>
                    </select>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Self-Assessment</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Manager Review</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Self Rating</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Manager Rating</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {mockReviews.map(review => (
                        <tr key={review.id} className="hover:bg-gray-50 dark:bg-gray-900">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white dark:text-white">{review.employeeName}</div>
                              <div className="text-sm text-gray-500">{review.role}</div>
                              <div className="text-xs text-gray-400">{review.department}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white dark:text-white">{review.managerName}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <ReviewStatusBadge status={review.selfAssessmentStatus} type="self" />
                            {review.selfSubmittedAt && (
                              <div className="text-xs text-gray-500 mt-1">{review.selfSubmittedAt}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <ReviewStatusBadge status={review.managerAssessmentStatus} type="manager" />
                            {review.managerSubmittedAt && (
                              <div className="text-xs text-gray-500 mt-1">{review.managerSubmittedAt}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {review.selfOverallRating ? (
                              <div className="flex items-center justify-center gap-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-semibold text-gray-900 dark:text-white dark:text-white">{review.selfOverallRating.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {review.managerOverallRating ? (
                              <div className="flex items-center justify-center gap-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-semibold text-gray-900 dark:text-white dark:text-white">{review.managerOverallRating.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(review.overallStatus)}`}>
                              {getStatusLabel(review.overallStatus)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleViewReview(review)}
                              className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1 mx-auto"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'my-reviews' && (
            <div className="text-center py-12">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white dark:text-white mb-2">My Performance Reviews</h3>
              <p className="text-gray-500">View and complete your self-assessments</p>
            </div>
          )}

          {activeTab === 'team-reviews' && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white dark:text-white mb-2">Team Reviews</h3>
              <p className="text-gray-500">Complete performance reviews for your direct reports</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Legend:</span>
              <span className="ml-4 inline-flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-50 dark:bg-green-900/200"></div>
                Submitted
              </span>
              <span className="ml-3 inline-flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-50 dark:bg-yellow-900/200"></div>
                In Progress
              </span>
              <span className="ml-3 inline-flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                Not Started
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedReview.employeeName} - Performance Review
                </h2>
                <p className="text-purple-100 text-sm mt-1">
                  {selectedReview.role} | {selectedReview.department}
                </p>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="text-white hover:bg-purple-800 rounded-lg p-2 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Manager</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">{selectedReview.managerName}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Review Status</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReview.overallStatus)}`}>
                    {getStatusLabel(selectedReview.overallStatus)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-900">Self-Assessment</p>
                    <ReviewStatusBadge status={selectedReview.selfAssessmentStatus} type="self" />
                  </div>
                  {selectedReview.selfSubmittedAt && (
                    <p className="text-xs text-blue-700 mb-2">Submitted: {selectedReview.selfSubmittedAt}</p>
                  )}
                  {selectedReview.selfOverallRating && (
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{selectedReview.selfOverallRating.toFixed(1)}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">/ 5.0</span>
                    </div>
                  )}
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-purple-900">Manager Assessment</p>
                    <ReviewStatusBadge status={selectedReview.managerAssessmentStatus} type="manager" />
                  </div>
                  {selectedReview.managerSubmittedAt && (
                    <p className="text-xs text-purple-700 mb-2">Submitted: {selectedReview.managerSubmittedAt}</p>
                  )}
                  {selectedReview.managerOverallRating && (
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{selectedReview.managerOverallRating.toFixed(1)}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">/ 5.0</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedReview.selfAssessmentStatus === 'not_started' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Self-Assessment Not Started</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Employee must complete their self-assessment before manager assessment can be viewed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedReview.overallStatus === 'completed' && selectedReview.finalRating && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-900">Final Rating (HR Approved)</p>
                      <p className="text-sm text-green-700 mt-1">
                        Combined assessment approved by HR
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                      <span className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white">{selectedReview.finalRating.toFixed(1)}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">/ 5.0</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Question Responses */}
              {selectedReview.responses && selectedReview.responses.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Detailed Performance Ratings</h3>
                  <div className="space-y-4">
                    {selectedReview.responses.map((response, idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-4">
                        <div className="mb-3">
                          <span className="text-xs font-semibold text-purple-600 uppercase">{response.category}</span>
                          <p className="text-sm font-medium text-gray-900 dark:text-white dark:text-white mt-1">{response.question}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-blue-900">SELF-ASSESSMENT</span>
                              {response.selfRating && (
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-3 w-3 ${star <= response.selfRating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                    />
                                  ))}
                                  <span className="ml-1 text-sm font-semibold text-gray-900 dark:text-white dark:text-white">{response.selfRating}</span>
                                </div>
                              )}
                            </div>
                            {response.selfComment && (
                              <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-300">{response.selfComment}</p>
                            )}
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-purple-900">MANAGER ASSESSMENT</span>
                              {response.managerRating && (
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-3 w-3 ${star <= response.managerRating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                    />
                                  ))}
                                  <span className="ml-1 text-sm font-semibold text-gray-900 dark:text-white dark:text-white">{response.managerRating}</span>
                                </div>
                              )}
                            </div>
                            {response.managerComment && (
                              <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-300">{response.managerComment}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals and Comments Section */}
              {(selectedReview.selfAchievements || selectedReview.managerAchievements) && (
                <div className="mt-6 grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Self-Assessment Comments</h3>
                    {selectedReview.selfAchievements && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Key Achievements</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{selectedReview.selfAchievements}</p>
                      </div>
                    )}
                    {selectedReview.selfDevelopmentAreas && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Development Areas</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{selectedReview.selfDevelopmentAreas}</p>
                      </div>
                    )}
                    {selectedReview.selfGoals && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Goals for Next Period</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{selectedReview.selfGoals}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-purple-900 mb-4">Manager Assessment Comments</h3>
                    {selectedReview.managerAchievements && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 rounded-lg p-4 mb-4">
                        <p className="text-sm font-semibold text-purple-900 mb-2">Key Achievements</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{selectedReview.managerAchievements}</p>
                      </div>
                    )}
                    {selectedReview.managerDevelopmentAreas && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 rounded-lg p-4 mb-4">
                        <p className="text-sm font-semibold text-purple-900 mb-2">Development Areas</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{selectedReview.managerDevelopmentAreas}</p>
                      </div>
                    )}
                    {selectedReview.managerGoals && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-purple-900 mb-2">Goals for Next Period</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{selectedReview.managerGoals}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700 dark:border-gray-700 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                This review record is maintained for compliance and audit purposes
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceReviewEnhancedModal;
