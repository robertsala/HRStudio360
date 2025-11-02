import React, { useState } from 'react';
import { X, Star, User, Calendar, TrendingUp, DollarSign, Send, CheckCircle, AlertCircle, Award, Target, Users, Brain, Clock, FileText } from 'lucide-react';

interface PerformanceQuestion {
  id: string;
  category: string;
  question: string;
  weight: number; // Weight for calculating overall score
}

interface PerformanceReview {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  role: string;
  currentSalary: number;
  salaryType: 'hourly' | 'annual';
  reviewPeriod: string;
  reviewerName: string;
  reviewerRole: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Completed';
  responses: { [questionId: string]: number };
  comments: { [questionId: string]: string };
  overallScore: number;
  recommendedIncrease: number;
  submittedDate?: string;
  completedDate?: string;
  goals: string;
  achievements: string;
  developmentAreas: string;
  nextYearGoals: string;
}

interface PerformanceReviewModalProps {
  onClose?: () => void;
}

const PerformanceReviewModal: React.FC<PerformanceReviewModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('reviews');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [currentReview, setCurrentReview] = useState<PerformanceReview | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showSubmitConfirmation) {
          setShowSubmitConfirmation(false);
        } else if (showReviewForm) {
          setShowReviewForm(false);
        } else if (currentReview) {
          setCurrentReview(null);
        } else if (onClose) {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showSubmitConfirmation, showReviewForm, currentReview, onClose]);

  // Universal performance questions applicable to any role/department
  const performanceQuestions: PerformanceQuestion[] = [
    // Job Performance & Quality (25% weight)
    {
      id: 'job_quality',
      category: 'Job Performance & Quality',
      question: 'Consistently delivers high-quality work that meets or exceeds expectations',
      weight: 0.15
    },
    {
      id: 'job_efficiency',
      category: 'Job Performance & Quality', 
      question: 'Completes tasks efficiently and manages time effectively',
      weight: 0.10
    },
    
    // Goal Achievement (20% weight)
    {
      id: 'goal_achievement',
      category: 'Goal Achievement',
      question: 'Successfully achieved individual goals and objectives set for this review period',
      weight: 0.15
    },
    {
      id: 'initiative',
      category: 'Goal Achievement',
      question: 'Takes initiative and goes beyond basic job requirements',
      weight: 0.05
    },
    
    // Communication & Collaboration (20% weight)
    {
      id: 'communication',
      category: 'Communication & Collaboration',
      question: 'Communicates clearly and effectively with team members and stakeholders',
      weight: 0.10
    },
    {
      id: 'teamwork',
      category: 'Communication & Collaboration',
      question: 'Works collaboratively and contributes positively to team dynamics',
      weight: 0.10
    },
    
    // Problem Solving & Innovation (15% weight)
    {
      id: 'problem_solving',
      category: 'Problem Solving & Innovation',
      question: 'Demonstrates strong problem-solving skills and finds creative solutions',
      weight: 0.10
    },
    {
      id: 'adaptability',
      category: 'Problem Solving & Innovation',
      question: 'Adapts well to change and learns new skills when needed',
      weight: 0.05
    },
    
    // Leadership & Development (10% weight)
    {
      id: 'leadership',
      category: 'Leadership & Development',
      question: 'Shows leadership qualities and helps develop others (when applicable)',
      weight: 0.05
    },
    {
      id: 'growth_mindset',
      category: 'Leadership & Development',
      question: 'Demonstrates commitment to personal and professional growth',
      weight: 0.05
    },
    
    // Reliability & Professionalism (10% weight)
    {
      id: 'reliability',
      category: 'Reliability & Professionalism',
      question: 'Consistently reliable, punctual, and maintains professional standards',
      weight: 0.05
    },
    {
      id: 'company_values',
      category: 'Reliability & Professionalism',
      question: 'Embodies company values and contributes to positive workplace culture',
      weight: 0.05
    }
  ];

  const mockEmployees = [
    { id: '1', name: 'Sarah Johnson', department: 'Engineering', role: 'Senior Software Engineer', salary: 150000, salaryType: 'annual' as const },
    { id: '2', name: 'Mike Chen', department: 'Marketing', role: 'Marketing Manager', salary: 95000, salaryType: 'annual' as const },
    { id: '3', name: 'David Kim', department: 'Engineering', role: 'Frontend Developer', salary: 85000, salaryType: 'annual' as const },
    { id: '4', name: 'Emma Wilson', department: 'HR', role: 'HR Specialist', salary: 65000, salaryType: 'annual' as const },
    { id: '5', name: 'Lisa Rodriguez', department: 'Sales', role: 'Sales Director', salary: 120000, salaryType: 'annual' as const }
  ];

  const [existingReviews, setExistingReviews] = useState<PerformanceReview[]>([
    {
      id: '1',
      employeeName: 'Alex Thompson',
      employeeId: 'EMP006',
      department: 'Marketing',
      role: 'Marketing Coordinator',
      currentSalary: 55000,
      salaryType: 'annual',
      reviewPeriod: '2024',
      reviewerName: 'Mike Chen',
      reviewerRole: 'Marketing Manager',
      status: 'Completed',
      responses: {
        job_quality: 4,
        job_efficiency: 4,
        goal_achievement: 5,
        initiative: 4,
        communication: 5,
        teamwork: 5,
        problem_solving: 4,
        adaptability: 4,
        leadership: 3,
        growth_mindset: 5,
        reliability: 5,
        company_values: 5
      },
      comments: {},
      overallScore: 4.35,
      recommendedIncrease: 4.35,
      submittedDate: '2024-12-15',
      completedDate: '2024-12-20',
      goals: 'Increase social media engagement by 25%',
      achievements: 'Exceeded social media targets by 40%, launched successful product campaign',
      developmentAreas: 'Leadership skills, project management',
      nextYearGoals: 'Lead a major campaign, mentor junior team members'
    }
  ]);

  const handleStartReview = () => {
    if (!selectedEmployee) {
      setNotification({
        type: 'error',
        message: 'Please select an employee to review'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const employee = mockEmployees.find(emp => emp.id === selectedEmployee);
    if (!employee) return;

    const newReview: PerformanceReview = {
      id: Date.now().toString(),
      employeeName: employee.name,
      employeeId: employee.id,
      department: employee.department,
      role: employee.role,
      currentSalary: employee.salary,
      salaryType: employee.salaryType,
      reviewPeriod: '2025',
      reviewerName: 'Current Manager',
      reviewerRole: 'Manager',
      status: 'Draft',
      responses: {},
      comments: {},
      overallScore: 0,
      recommendedIncrease: 0,
      goals: '',
      achievements: '',
      developmentAreas: '',
      nextYearGoals: ''
    };

    setCurrentReview(newReview);
    setShowReviewForm(true);
  };

  const handleRatingChange = (questionId: string, rating: number) => {
    if (!currentReview) return;

    setCurrentReview(prev => prev ? {
      ...prev,
      responses: {
        ...prev.responses,
        [questionId]: rating
      }
    } : null);
  };

  const handleCommentChange = (questionId: string, comment: string) => {
    if (!currentReview) return;

    setCurrentReview(prev => prev ? {
      ...prev,
      comments: {
        ...prev.comments,
        [questionId]: comment
      }
    } : null);
  };

  const calculateOverallScore = () => {
    if (!currentReview) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    performanceQuestions.forEach(question => {
      const rating = currentReview.responses[question.id];
      if (rating) {
        totalScore += rating * question.weight;
        totalWeight += question.weight;
      }
    });

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;
  };

  const handleSubmitReview = () => {
    if (!currentReview) return;

    // Validate all questions are answered
    const unansweredQuestions = performanceQuestions.filter(q => !currentReview.responses[q.id]);
    if (unansweredQuestions.length > 0) {
      setNotification({
        type: 'error',
        message: `Please rate all ${performanceQuestions.length} performance areas before submitting`
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    // Validate required text fields
    if (!currentReview.goals || !currentReview.achievements || !currentReview.nextYearGoals) {
      setNotification({
        type: 'error',
        message: 'Please fill in all required text sections'
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    const overallScore = calculateOverallScore();
    const recommendedIncrease = Math.round(overallScore * 100) / 100;

    const updatedReview: PerformanceReview = {
      ...currentReview,
      overallScore,
      recommendedIncrease,
      status: 'Submitted',
      submittedDate: new Date().toISOString()
    };

    setCurrentReview(updatedReview);
    setShowSubmitConfirmation(true);
  };

  const handleConfirmSubmit = () => {
    if (!currentReview) return;

    // Add to existing reviews
    setExistingReviews(prev => [...prev, currentReview]);

    // Create HR inbox task for salary increase approval
    const salaryIncrease = Math.round(currentReview.currentSalary * (currentReview.recommendedIncrease / 100));
    const newSalary = currentReview.currentSalary + salaryIncrease;
    
    console.log('Creating HR inbox task for salary increase:', {
      taskType: 'salary_increase',
      employee: currentReview.employeeName,
      department: currentReview.department,
      performanceScore: currentReview.overallScore,
      currentSalary: currentReview.currentSalary,
      recommendedIncrease: currentReview.recommendedIncrease,
      newSalary: newSalary,
      reviewer: currentReview.reviewerName
    });

    setNotification({
      type: 'success',
      message: `Performance review submitted! HR inbox task created for ${currentReview.recommendedIncrease}% salary increase approval.`
    });

    setTimeout(() => {
      setNotification(null);
      setShowSubmitConfirmation(false);
      setShowReviewForm(false);
      setCurrentReview(null);
      setSelectedEmployee('');
    }, 3000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-blue-600';
    if (score >= 3.5) return 'text-yellow-600';
    if (score >= 3.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return 'Exceptional';
    if (score >= 4.0) return 'Exceeds Expectations';
    if (score >= 3.5) return 'Meets Expectations';
    if (score >= 3.0) return 'Below Expectations';
    return 'Does Not Meet Expectations';
  };

  const groupedQuestions = performanceQuestions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as { [category: string]: PerformanceQuestion[] });

  const tabs = [
    { id: 'reviews', label: 'Performance Reviews', count: existingReviews.length },
    { id: 'new', label: 'New Review', count: 0 },
    { id: 'analytics', label: 'Review Analytics', count: 0 }
  ];

  return (
    <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center">
            <Award className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Annual Performance Reviews</h2>
              <p className="text-purple-100">Comprehensive performance evaluation and salary review system</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </button>
            ))}
          </nav>
        </div>

        <div className="overflow-y-auto max-h-96">
          <div className="p-6">
            {/* Existing Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Completed Reviews</h3>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    New Review
                  </button>
                </div>

                <div className="grid gap-6">
                  {existingReviews.map((review) => (
                    <div key={review.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">{review.employeeName}</h4>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {review.department}
                            </span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {review.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Role:</span>
                              <p className="text-gray-600 dark:text-gray-400">{review.role}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Review Period:</span>
                              <p className="text-gray-600 dark:text-gray-400">{review.reviewPeriod}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Reviewer:</span>
                              <p className="text-gray-600 dark:text-gray-400">{review.reviewerName}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Completed:</span>
                              <p className="text-gray-600 dark:text-gray-400">{review.completedDate ? new Date(review.completedDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center space-x-3">
                                  <span className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Overall Score:</span>
                                  <span className={`text-2xl font-bold ${getScoreColor(review.overallScore)}`}>
                                    {review.overallScore}/5.0
                                  </span>
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    review.overallScore >= 4.5 ? 'bg-green-100 text-green-800' :
                                    review.overallScore >= 4.0 ? 'bg-blue-100 text-blue-800' :
                                    review.overallScore >= 3.5 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {getScoreLabel(review.overallScore)}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="h-5 w-5 text-green-600" />
                                  <span className="font-medium text-gray-900 dark:text-white dark:text-white">
                                    Recommended Increase: {review.recommendedIncrease}%
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  ${Math.round(review.currentSalary * (review.recommendedIncrease / 100)).toLocaleString()} increase
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {existingReviews.length === 0 && (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No performance reviews completed yet</p>
                      <button
                        onClick={() => setActiveTab('new')}
                        className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Start First Review
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* New Review Tab */}
            {activeTab === 'new' && !showReviewForm && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Start New Performance Review</h3>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-4">Review Process Overview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-blue-800">
                    <div className="flex items-center">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">1</div>
                      <span>Select Employee</span>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">2</div>
                      <span>Rate Performance (12 areas)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">3</div>
                      <span>Add Comments & Goals</span>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">4</div>
                      <span>Submit for HR Review</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Select Employee to Review</h4>
                  <div className="grid gap-4">
                    {mockEmployees.map((employee) => (
                      <label key={employee.id} className="flex items-center p-4 border rounded-lg hover:bg-gray-50 dark:bg-gray-900 cursor-pointer">
                        <input
                          type="radio"
                          name="employee"
                          value={employee.id}
                          checked={selectedEmployee === employee.id}
                          onChange={(e) => setSelectedEmployee(e.target.value)}
                          className="mr-4 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-white dark:text-white">{employee.name}</h5>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">{employee.role} • {employee.department}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900 dark:text-white dark:text-white">
                                ${employee.salary.toLocaleString()} {employee.salaryType}
                              </p>
                              <p className="text-gray-500 text-sm">Current compensation</p>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleStartReview}
                      disabled={!selectedEmployee}
                      className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                    >
                      <Star className="h-5 w-5 mr-2" />
                      Start Performance Review
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Performance Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-green-900 mb-2">Avg Score</h4>
                    <p className="text-3xl font-bold text-green-600">4.2</p>
                    <p className="text-green-700 text-sm">Company average</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Reviews Complete</h4>
                    <p className="text-3xl font-bold text-blue-600">{existingReviews.length}</p>
                    <p className="text-blue-700 text-sm">This cycle</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-purple-900 mb-2">Avg Increase</h4>
                    <p className="text-3xl font-bold text-purple-600">4.1%</p>
                    <p className="text-purple-700 text-sm">Salary adjustments</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-yellow-900 mb-2">Top Performers</h4>
                    <p className="text-3xl font-bold text-yellow-600">15%</p>
                    <p className="text-yellow-700 text-sm">Scored 4.5+</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Performance Distribution</h4>
                  <div className="space-y-4">
                    {[
                      { range: '4.5 - 5.0', label: 'Exceptional', count: 3, color: 'bg-green-500' },
                      { range: '4.0 - 4.4', label: 'Exceeds Expectations', count: 8, color: 'bg-blue-500' },
                      { range: '3.5 - 3.9', label: 'Meets Expectations', count: 12, color: 'bg-yellow-500' },
                      { range: '3.0 - 3.4', label: 'Below Expectations', count: 2, color: 'bg-orange-500' },
                      { range: '1.0 - 2.9', label: 'Does Not Meet', count: 0, color: 'bg-red-500' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded ${item.color}`}></div>
                          <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">{item.range} - {item.label}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${item.color}`}
                              style={{ width: `${(item.count / 25) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-12">{item.count} employees</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Review Form Modal */}
      {showReviewForm && currentReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <div>
                <h3 className="text-xl font-bold">Annual Performance Review</h3>
                <p className="text-purple-100">{currentReview.employeeName} • {currentReview.role} • {currentReview.reviewPeriod}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-purple-100 text-sm">Current Score:</p>
                  <p className={`text-2xl font-bold ${calculateOverallScore() >= 4.0 ? 'text-green-300' : 'text-yellow-300'}`}>
                    {calculateOverallScore()}/5.0
                  </p>
                </div>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="text-purple-100 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-8">
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
                    <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Current Salary:</span>
                    <p className="text-gray-900 dark:text-white dark:text-white">${currentReview.currentSalary.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Review Period:</span>
                    <p className="text-gray-900 dark:text-white dark:text-white">{currentReview.reviewPeriod}</p>
                  </div>
                </div>
              </div>

              {/* Performance Questions by Category */}
              {Object.entries(groupedQuestions).map(([category, questions]) => (
                <div key={category} className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">{category}</h4>
                  <div className="space-y-6">
                    {questions.map((question) => (
                      <div key={question.id} className="space-y-3">
                        <div className="flex items-start justify-between">
                          <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 flex-1 mr-4">{question.question}</p>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Weight: {Math.round(question.weight * 100)}%
                          </span>
                        </div>
                        
                        {/* Rating Stars */}
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mr-3">Rating:</span>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => handleRatingChange(question.id, rating)}
                              className={`p-1 rounded transition-colors ${
                                (currentReview.responses[question.id] || 0) >= rating
                                  ? 'text-yellow-400 hover:text-yellow-500'
                                  : 'text-gray-300 hover:text-yellow-300'
                              }`}
                            >
                              <Star className="h-6 w-6 fill-current" />
                            </button>
                          ))}
                          <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                            {currentReview.responses[question.id] ? (
                              <>
                                {currentReview.responses[question.id]}/5 - {
                                  currentReview.responses[question.id] === 5 ? 'Exceptional' :
                                  currentReview.responses[question.id] === 4 ? 'Exceeds Expectations' :
                                  currentReview.responses[question.id] === 3 ? 'Meets Expectations' :
                                  currentReview.responses[question.id] === 2 ? 'Below Expectations' :
                                  'Does Not Meet Expectations'
                                }
                              </>
                            ) : (
                              'Not rated'
                            )}
                          </span>
                        </div>
                        
                        {/* Comments */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
                            Comments (Optional)
                          </label>
                          <textarea
                            value={currentReview.comments[question.id] || ''}
                            onChange={(e) => handleCommentChange(question.id, e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            rows={2}
                            placeholder="Add specific examples or feedback..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Additional Sections */}
              <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Additional Feedback</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                      Key Goals Achieved This Year *
                    </label>
                    <textarea
                      value={currentReview.goals}
                      onChange={(e) => setCurrentReview(prev => prev ? { ...prev, goals: e.target.value } : null)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="Describe the major goals and objectives achieved during this review period..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                      Notable Achievements & Contributions *
                    </label>
                    <textarea
                      value={currentReview.achievements}
                      onChange={(e) => setCurrentReview(prev => prev ? { ...prev, achievements: e.target.value } : null)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="Highlight specific achievements, projects completed, or exceptional contributions..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                      Areas for Development (Optional)
                    </label>
                    <textarea
                      value={currentReview.developmentAreas}
                      onChange={(e) => setCurrentReview(prev => prev ? { ...prev, developmentAreas: e.target.value } : null)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="Identify areas where the employee can grow and improve..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                      Goals for Next Year *
                    </label>
                    <textarea
                      value={currentReview.nextYearGoals}
                      onChange={(e) => setCurrentReview(prev => prev ? { ...prev, nextYearGoals: e.target.value } : null)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="Set clear, measurable goals and expectations for the upcoming year..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Review Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Review Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Overall Score</p>
                      <p className={`text-3xl font-bold ${getScoreColor(calculateOverallScore())}`}>
                        {calculateOverallScore()}/5.0
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{getScoreLabel(calculateOverallScore())}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Recommended Increase</p>
                      <p className="text-3xl font-bold text-green-600">
                        {calculateOverallScore()}%
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Based on performance</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">New Salary</p>
                      <p className="text-3xl font-bold text-blue-600">
                        ${Math.round(currentReview.currentSalary * (1 + calculateOverallScore() / 100)).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        +${Math.round(currentReview.currentSalary * (calculateOverallScore() / 100)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="bg-purple-600 text-white px-8 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirmation && currentReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-20 h-20 mx-auto mb-4">
                <Award className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white mb-4">Review Ready for Submission</h3>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-purple-100 text-sm">Overall Performance</p>
                    <p className={`text-2xl font-bold ${getScoreColor(currentReview.overallScore)}`}>
                      {currentReview.overallScore}/5.0
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{getScoreLabel(currentReview.overallScore)}</p>
                  </div>
                  <div>
                    <p className="text-purple-100 text-sm">Recommended Increase</p>
                    <p className="text-2xl font-bold text-green-600">{currentReview.recommendedIncrease}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      +${Math.round(currentReview.currentSalary * (currentReview.recommendedIncrease / 100)).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-purple-100 text-sm">New Salary</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${Math.round(currentReview.currentSalary * (1 + currentReview.recommendedIncrease / 100)).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{currentReview.salaryType}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  <strong>Next Steps:</strong> This review will be sent to HR for salary increase approval. 
                  The employee will be notified of their performance score, and HR will review the 
                  recommended {currentReview.recommendedIncrease}% salary increase.
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowSubmitConfirmation(false)}
                  className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className="bg-purple-600 text-white px-8 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit to HR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center text-white ${
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
    </>
  );
};

export default PerformanceReviewModal;