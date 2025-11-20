import React, { useState, useMemo, useEffect } from 'react';
import { Star, User, Calendar, TrendingUp, DollarSign, Send, CheckCircle, AlertCircle, Award, Target, Users, Brain, Clock, FileText } from 'lucide-react';
import { useDashboardEscape } from '../hooks/useDashboardEscape';
import { DashboardExitButton } from '../components/DashboardExitButton';
import { useLocation } from 'wouter';

interface PerformanceQuestion {
  id: string;
  category: string;
  question: string;
  weight: number;
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

const PerformancePage: React.FC = () => {
  const [location] = useLocation();
  
  // Reactive URL query parameter parsing for filters
  const query = useMemo(() => new URLSearchParams(location.split('?')[1] ?? ''), [location]);
  const filterFromURL = query.get('filter');
  const departmentFromURL = query.get('department');
  
  const [activeTab, setActiveTab] = useState('reviews');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  
  // React to URL changes for department filter
  useEffect(() => {
    if (departmentFromURL) {
      setFilterDepartment(departmentFromURL);
    }
  }, [departmentFromURL]);
  const [currentReview, setCurrentReview] = useState<PerformanceReview | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // ESC key handling - close nested modals first before navigating away
  useDashboardEscape(() => {
    if (showSubmitConfirmation) {
      setShowSubmitConfirmation(false);
      return false;
    }
    if (showReviewForm) {
      setShowReviewForm(false);
      return false;
    }
    if (currentReview) {
      setCurrentReview(null);
      return false;
    }
    return true;
  });

  const performanceQuestions: PerformanceQuestion[] = [
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

    const unansweredQuestions = performanceQuestions.filter(q => !currentReview.responses[q.id]);
    if (unansweredQuestions.length > 0) {
      setNotification({
        type: 'error',
        message: `Please rate all ${performanceQuestions.length} performance areas before submitting`
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

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

    setExistingReviews(prev => [...prev, currentReview]);

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
    <div className="bg-white dark:bg-gray-800 rounded-lg w-full min-h-screen overflow-auto">
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="flex items-center">
          <Award className="h-8 w-8 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">Annual Performance Reviews</h2>
            <p className="text-purple-100">Comprehensive performance evaluation and salary review system</p>
          </div>
        </div>
        <DashboardExitButton className="text-purple-100 hover:text-white" />
      </div>

      {notification && (
        <div className={`mx-6 mt-4 p-4 rounded-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' :
          notification.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </nav>
      </div>

      <div className="overflow-y-auto">
        <div className="p-6">
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Completed Reviews</h3>
                <button
                  onClick={() => setActiveTab('new')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                  data-testid="button-new-review"
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
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{review.employeeName}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 text-xs rounded-full">
                            {review.department}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 text-xs rounded-full">
                            {review.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Role:</span>
                            <p className="text-gray-600 dark:text-gray-400">{review.role}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Review Period:</span>
                            <p className="text-gray-600 dark:text-gray-400">{review.reviewPeriod}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Reviewer:</span>
                            <p className="text-gray-600 dark:text-gray-400">{review.reviewerName}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Completed:</span>
                            <p className="text-gray-600 dark:text-gray-400">{review.completedDate ? new Date(review.completedDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-3">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">Overall Score:</span>
                                <span className={`text-2xl font-bold ${getScoreColor(review.overallScore)}`}>
                                  {review.overallScore}/5.0
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  review.overallScore >= 4.5 ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' :
                                  review.overallScore >= 4.0 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400' :
                                  review.overallScore >= 3.5 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' :
                                  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'
                                }`}>
                                  {getScoreLabel(review.overallScore)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                <span className="font-medium text-gray-900 dark:text-white">
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
                    <p className="text-gray-500 dark:text-gray-400">No performance reviews completed yet</p>
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

          {activeTab === 'new' && !showReviewForm && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Start New Performance Review</h3>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-4">Review Process Overview</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-blue-800 dark:text-blue-400">
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

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Select Employee to Review</h4>
                <div className="grid gap-4">
                  {mockEmployees.map((employee) => (
                    <label key={employee.id} className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="employee"
                        value={employee.id}
                        checked={selectedEmployee === employee.id}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="mr-4 text-purple-600 focus:ring-purple-500"
                        data-testid={`radio-employee-${employee.id}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white">{employee.name}</h5>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">{employee.role} • {employee.department}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">
                              ${employee.salary.toLocaleString()} {employee.salaryType}
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleStartReview}
                  disabled={!selectedEmployee}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-start-review"
                >
                  Start Review
                </button>
              </div>
            </div>
          )}

          {activeTab === 'new' && showReviewForm && currentReview && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Performance Review: {currentReview.employeeName}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {currentReview.role} - {currentReview.department}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Salary</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ${currentReview.currentSalary.toLocaleString()} {currentReview.salaryType}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(groupedQuestions).map(([category, questions]) => (
                  <div key={category} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{category}</h4>
                    <div className="space-y-4">
                      {questions.map((question) => (
                        <div key={question.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                          <p className="text-gray-900 dark:text-white mb-2">{question.question}</p>
                          <div className="flex items-center space-x-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                onClick={() => handleRatingChange(question.id, rating)}
                                className={`p-2 rounded ${
                                  currentReview.responses[question.id] === rating
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                                data-testid={`rating-${question.id}-${rating}`}
                              >
                                <Star className={`h-4 w-4 ${
                                  currentReview.responses[question.id] === rating ? 'fill-current' : ''
                                }`} />
                              </button>
                            ))}
                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-4">
                              {currentReview.responses[question.id] ? `${currentReview.responses[question.id]}/5` : 'Not rated'}
                            </span>
                          </div>
                          <textarea
                            value={currentReview.comments[question.id] || ''}
                            onChange={(e) => handleCommentChange(question.id, e.target.value)}
                            placeholder="Add comments (optional)"
                            className="mt-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white"
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Goals for Review Period *
                      </label>
                      <textarea
                        value={currentReview.goals}
                        onChange={(e) => setCurrentReview(prev => prev ? { ...prev, goals: e.target.value } : null)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Key Achievements *
                      </label>
                      <textarea
                        value={currentReview.achievements}
                        onChange={(e) => setCurrentReview(prev => prev ? { ...prev, achievements: e.target.value } : null)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Development Areas
                      </label>
                      <textarea
                        value={currentReview.developmentAreas}
                        onChange={(e) => setCurrentReview(prev => prev ? { ...prev, developmentAreas: e.target.value } : null)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Goals for Next Year *
                      </label>
                      <textarea
                        value={currentReview.nextYearGoals}
                        onChange={(e) => setCurrentReview(prev => prev ? { ...prev, nextYearGoals: e.target.value } : null)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setShowReviewForm(false);
                    setCurrentReview(null);
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                  data-testid="button-submit-review"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Review
                </button>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Review Analytics coming soon</p>
            </div>
          )}
        </div>
      </div>

      {showSubmitConfirmation && currentReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              Confirm Review Submission
            </h3>
            <div className="space-y-4 mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                You are about to submit a performance review for <strong>{currentReview.employeeName}</strong>.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">Overall Score:</span>
                  <span className={`text-2xl font-bold ${getScoreColor(calculateOverallScore())}`}>
                    {calculateOverallScore()}/5.0
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Recommended Salary Increase:</span>
                  <span className="text-lg font-bold text-green-600">
                    {calculateOverallScore()}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This will create an HR inbox task for salary increase approval.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSubmitConfirmation(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                data-testid="button-confirm-submit"
              >
                <Send className="h-4 w-4 mr-2" />
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformancePage;
