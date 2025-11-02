import React, { useState } from 'react';
import { X, Brain, TrendingUp, Users, AlertTriangle, CheckCircle, Target, Zap, BarChart3 } from 'lucide-react';

interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIInsightsModal: React.FC<AIInsightsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: string;
    title: string;
    data?: any;
  }>({
    isOpen: false,
    type: '',
    title: '',
    data: null
  });
  const [detailView, setDetailView] = useState<'insights' | 'confidence' | 'actions' | null>(null);

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

  const handleTakeAction = (insightType: string, insightTitle: string, insightData?: any) => {
    setActionModal({
      isOpen: true,
      type: insightType,
      title: insightTitle,
      data: insightData
    });
  };

  const closeActionModal = () => {
    setActionModal({
      isOpen: false,
      type: '',
      title: '',
      data: null
    });
  };

  const executeAction = async (actionType: string, data?: any) => {
    // Simulate action execution
    console.log(`Executing action: ${actionType}`, data);
    
    // Show success message (in real app, this would trigger actual workflows)
    setNotification({
      type: 'success',
      message: `Action "${actionType.replace(/_/g, ' ')}" has been initiated successfully!`
    });
    setTimeout(() => setNotification(null), 4000);
    closeActionModal();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const insights = {
    workforce: [
      {
        title: 'Flight Risk Analysis',
        type: 'warning',
        confidence: 87,
        description: 'AI identified 3 employees with high probability of leaving within 60 days',
        action: 'Schedule retention conversations',
        employees: ['Sarah Johnson', 'Mike Chen', 'David Kim'],
        priority: 'high'
      },
      {
        title: 'Performance Trends',
        type: 'success',
        confidence: 92,
        description: 'Team productivity increased 15% after implementing flexible work policies',
        action: 'Expand flexible work options company-wide',
        impact: '+$125K annual productivity gain',
        priority: 'medium'
      },
      {
        title: 'Skill Gap Detection',
        type: 'info',
        confidence: 78,
        description: 'Engineering team lacks cloud architecture expertise for upcoming projects',
        action: 'Recommend targeted training or hiring',
        skills: ['AWS Solutions Architecture', 'Kubernetes', 'DevOps'],
        priority: 'high'
      },
      {
        title: 'Team Satisfaction Trend',
        type: 'success',
        confidence: 85,
        description: 'Employee satisfaction scores increased by 18% in Q4 2024',
        action: 'Document and replicate successful practices',
        priority: 'low'
      }
    ],
    compliance: [
      {
        title: 'Regulatory Changes',
        type: 'warning',
        confidence: 95,
        description: 'New California labor laws effective Feb 1st impact overtime calculations',
        action: 'Update payroll system and policies',
        deadline: '2025-02-01',
        priority: 'high'
      },
      {
        title: 'Benefits Compliance',
        type: 'success',
        confidence: 100,
        description: 'All benefits enrollments meet ACA requirements for 2025',
        action: 'No action required',
        status: 'Compliant',
        priority: 'low'
      },
      {
        title: 'I-9 Verification Audit',
        type: 'warning',
        confidence: 88,
        description: '12 employee I-9 forms need re-verification within 30 days',
        action: 'Schedule I-9 updates with affected employees',
        priority: 'high'
      },
      {
        title: 'Training Compliance',
        type: 'info',
        confidence: 82,
        description: '23 employees need annual harassment prevention training renewal',
        action: 'Send training reminders and track completion',
        priority: 'medium'
      }
    ],
    predictions: [
      {
        title: 'Hiring Forecast',
        type: 'info',
        confidence: 84,
        description: 'Based on growth trends, recommend hiring 12 new employees in Q2',
        departments: ['Engineering: 5', 'Sales: 4', 'Marketing: 3'],
        timeline: 'April - June 2025',
        priority: 'high'
      },
      {
        title: 'Budget Optimization',
        type: 'success',
        confidence: 91,
        description: 'AI suggests reallocating $45K from underutilized benefits to training',
        savings: '$45,000 annually',
        impact: '23% increase in employee skill development',
        priority: 'medium'
      },
      {
        title: 'Turnover Prediction',
        type: 'info',
        confidence: 79,
        description: 'Expected 8% turnover rate in Q1 based on industry trends',
        action: 'Prepare succession plans for critical roles',
        priority: 'medium'
      },
      {
        title: 'Compensation Analysis',
        type: 'warning',
        confidence: 86,
        description: '15% of employees below market rate for their positions',
        action: 'Review compensation bands and plan adjustments',
        priority: 'high'
      }
    ]
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Brain },
    { id: 'workforce', label: 'Workforce', icon: Users },
    { id: 'compliance', label: 'Compliance', icon: AlertTriangle },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp }
  ];

  const getAllInsights = () => {
    return [
      ...insights.workforce,
      ...insights.compliance,
      ...insights.predictions
    ];
  };

  const getHighPriorityActions = () => {
    return getAllInsights().filter(insight => insight.priority === 'high');
  };

  const calculateAverageConfidence = () => {
    const allInsights = getAllInsights();
    const total = allInsights.reduce((sum, insight) => sum + insight.confidence, 0);
    return Math.round(total / allInsights.length);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info': return <Target className="h-5 w-5 text-blue-600" />;
      default: return <Brain className="h-5 w-5 text-purple-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'info': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-purple-500 bg-purple-50';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-auto resize-both min-w-[300px] min-h-[300px]">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center">
            <Brain className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">AI Insights Dashboard</h2>
              <p className="text-purple-100">Powered by advanced machine learning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-100 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50 dark:bg-gray-900">
            <nav className="p-4 space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-100 text-purple-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto max-h-96">
            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && !detailView && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">AI Insights Overview</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                      onClick={() => setDetailView('insights')}
                      className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white hover:shadow-lg transition-all transform hover:scale-105 cursor-pointer text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100">Active Insights</p>
                          <p className="text-3xl font-bold">{getAllInsights().length}</p>
                        </div>
                        <Zap className="h-8 w-8 text-blue-200" />
                      </div>
                      <p className="text-sm text-blue-100 mt-2">Click to view all insights</p>
                    </button>

                    <button
                      onClick={() => setDetailView('confidence')}
                      className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-6 text-white hover:shadow-lg transition-all transform hover:scale-105 cursor-pointer text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100">Confidence Score</p>
                          <p className="text-3xl font-bold">{calculateAverageConfidence()}%</p>
                        </div>
                        <Target className="h-8 w-8 text-green-200" />
                      </div>
                      <p className="text-sm text-green-100 mt-2">Click to view breakdown</p>
                    </button>

                    <button
                      onClick={() => setDetailView('actions')}
                      className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg p-6 text-white hover:shadow-lg transition-all transform hover:scale-105 cursor-pointer text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-100">Actions Required</p>
                          <p className="text-3xl font-bold">{getHighPriorityActions().length}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-yellow-200" />
                      </div>
                      <p className="text-sm text-yellow-100 mt-2">Click to view required actions</p>
                    </button>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Recent AI Discoveries</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                          <span>Identified optimal hiring timeline for Q2 expansion</span>
                        </div>
                        <span className="text-sm text-gray-500">2 hours ago</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                          <span>Detected potential compliance issue with new regulations</span>
                        </div>
                        <span className="text-sm text-gray-500">4 hours ago</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center">
                          <Target className="h-5 w-5 text-blue-600 mr-3" />
                          <span>Recommended skill development programs for engineering team</span>
                        </div>
                        <span className="text-sm text-gray-500">1 day ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detail Views for Active Insights */}
              {activeTab === 'overview' && detailView === 'insights' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">All Active Insights ({getAllInsights().length})</h3>
                    <button
                      onClick={() => setDetailView(null)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Back to Overview
                    </button>
                  </div>

                  <div className="space-y-4">
                    {getAllInsights().map((insight, index) => (
                      <div key={index} className={`border-l-4 rounded-lg p-6 ${getInsightColor(insight.type)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            {getInsightIcon(insight.type)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">{insight.title}</h4>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 dark:text-gray-300 dark:text-gray-300 text-xs rounded-full">
                                  {insight.confidence}% confidence
                                </span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {insight.priority} priority
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">{insight.description}</p>
                              <p className="text-sm font-medium text-gray-800">
                                Recommended Action: {insight.action}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detail View for Confidence Score */}
              {activeTab === 'overview' && detailView === 'confidence' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Confidence Score Breakdown</h3>
                    <button
                      onClick={() => setDetailView(null)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Back to Overview
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-8 border border-green-200">
                    <div className="text-center mb-6">
                      <div className="text-6xl font-bold text-green-600 mb-2">{calculateAverageConfidence()}%</div>
                      <p className="text-gray-600 dark:text-gray-400">Average Confidence Score</p>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 text-center">
                      Based on {getAllInsights().length} active insights across workforce, compliance, and predictions
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-700 font-semibold">Workforce</span>
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {Math.round(insights.workforce.reduce((sum, i) => sum + i.confidence, 0) / insights.workforce.length)}%
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{insights.workforce.length} insights</p>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-yellow-700 font-semibold">Compliance</span>
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="text-3xl font-bold text-yellow-600 mb-1">
                        {Math.round(insights.compliance.reduce((sum, i) => sum + i.confidence, 0) / insights.compliance.length)}%
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{insights.compliance.length} insights</p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-700 font-semibold">Predictions</span>
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="text-3xl font-bold text-purple-600 mb-1">
                        {Math.round(insights.predictions.reduce((sum, i) => sum + i.confidence, 0) / insights.predictions.length)}%
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{insights.predictions.length} insights</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Confidence Score Distribution</h4>
                    <div className="space-y-4">
                      {getAllInsights().sort((a, b) => b.confidence - a.confidence).map((insight, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-48 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 truncate">{insight.title}</div>
                          <div className="flex-1 mx-4">
                            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  insight.confidence >= 90 ? 'bg-green-500' :
                                  insight.confidence >= 80 ? 'bg-blue-500' :
                                  insight.confidence >= 70 ? 'bg-yellow-500' :
                                  'bg-orange-500'
                                }`}
                                style={{ width: `${insight.confidence}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-16 text-right font-medium text-gray-900 dark:text-white dark:text-white">{insight.confidence}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Detail View for Actions Required */}
              {activeTab === 'overview' && detailView === 'actions' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">High Priority Actions Required ({getHighPriorityActions().length})</h3>
                    <button
                      onClick={() => setDetailView(null)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Back to Overview
                    </button>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">Immediate Attention Required</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">These insights require action to maintain optimal HR operations</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {getHighPriorityActions().map((insight, index) => (
                      <div key={index} className={`border-l-4 rounded-lg p-6 ${getInsightColor(insight.type)} border-2 border-orange-200`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            {getInsightIcon(insight.type)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">{insight.title}</h4>
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-semibold">
                                  HIGH PRIORITY
                                </span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 dark:text-gray-300 dark:text-gray-300 text-xs rounded-full">
                                  {insight.confidence}% confidence
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3">{insight.description}</p>

                              {'employees' in insight && (
                                <div className="mb-3">
                                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Affected Employees:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {insight.employees.map((emp, i) => (
                                      <span key={i} className="px-2 py-1 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded text-sm border">{emp}</span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {'skills' in insight && (
                                <div className="mb-3">
                                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Required Skills:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {insight.skills.map((skill, i) => (
                                      <span key={i} className="px-2 py-1 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded text-sm border">{skill}</span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {'departments' in insight && (
                                <div className="mb-3">
                                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Hiring Breakdown:</p>
                                  <div className="space-y-1">
                                    {insight.departments.map((dept, i) => (
                                      <p key={i} className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">• {dept}</p>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {'deadline' in insight && (
                                <div className="mb-3 flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Deadline:</span>
                                  <span className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded font-medium">
                                    {new Date(insight.deadline).toLocaleDateString()}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Recommended Action:</p>
                                  <p className="text-sm font-semibold text-gray-800">{insight.action}</p>
                                </div>
                                <button
                                  onClick={() => handleTakeAction(
                                    insight.title.toLowerCase().replace(/\s+/g, '_'),
                                    insight.title,
                                    insight
                                  )}
                                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                                >
                                  Take Action
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Content for Other Tabs */}
              {activeTab !== 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white capitalize">{activeTab} Insights</h3>
                  
                  <div className="space-y-4">
                    {insights[activeTab as keyof typeof insights]?.map((insight, index) => (
                      <div key={index} className={`border-l-4 rounded-lg p-6 ${getInsightColor(insight.type)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {getInsightIcon(insight.type)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">{insight.title}</h4>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 dark:text-gray-300 dark:text-gray-300 text-xs rounded-full">
                                  {insight.confidence}% confidence
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3">{insight.description}</p>
                              
                              {/* Additional Details */}
                              {'employees' in insight && (
                                <div className="mb-3">
                                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Affected Employees:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {insight.employees.map((emp, i) => (
                                      <span key={i} className="px-2 py-1 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded text-sm">{emp}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {'skills' in insight && (
                                <div className="mb-3">
                                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Required Skills:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {insight.skills.map((skill, i) => (
                                      <span key={i} className="px-2 py-1 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded text-sm">{skill}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {'departments' in insight && (
                                <div className="mb-3">
                                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Hiring Breakdown:</p>
                                  <div className="space-y-1">
                                    {insight.departments.map((dept, i) => (
                                      <p key={i} className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">• {dept}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-800">
                                  Recommended Action: {insight.action}
                                </p>
                                <button 
                                  onClick={() => handleTakeAction(
                                    insight.title.toLowerCase().replace(/\s+/g, '_'),
                                    insight.title,
                                    insight
                                  )}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                  Take Action
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Modal */}
        {actionModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Take Action: {actionModal.title}</h3>
                <button
                  onClick={closeActionModal}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Flight Risk Analysis Actions */}
              {actionModal.type === 'flight_risk_analysis' && (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    AI has identified employees at risk of leaving. Choose your action:
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => executeAction('schedule_retention_meetings', actionModal.data?.employees)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Schedule Retention Meetings</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Automatically schedule 1-on-1s with at-risk employees</div>
                    </button>
                    <button
                      onClick={() => executeAction('create_retention_plan', actionModal.data?.employees)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Create Retention Plans</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Generate personalized retention strategies for each employee</div>
                    </button>
                    <button
                      onClick={() => executeAction('send_engagement_survey', actionModal.data?.employees)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Send Engagement Survey</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Deploy targeted surveys to understand concerns</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Performance Trends Actions */}
              {actionModal.type === 'performance_trends' && (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Productivity has increased significantly. Expand successful practices:
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => executeAction('expand_flexible_work', 'company-wide')}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Expand Flexible Work Policies</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Roll out flexible work options to all departments</div>
                    </button>
                    <button
                      onClick={() => executeAction('document_best_practices', 'productivity')}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Document Best Practices</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Create playbook for successful productivity strategies</div>
                    </button>
                    <button
                      onClick={() => executeAction('schedule_team_training', 'productivity')}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Schedule Team Training</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Train other teams on successful productivity methods</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Skill Gap Detection Actions */}
              {actionModal.type === 'skill_gap_detection' && (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Critical skills gaps identified. Choose your approach:
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => executeAction('create_training_program', actionModal.data?.skills)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Create Training Program</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Develop internal training for required skills</div>
                    </button>
                    <button
                      onClick={() => executeAction('post_job_openings', actionModal.data?.skills)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Post Job Openings</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Hire external talent with required expertise</div>
                    </button>
                    <button
                      onClick={() => executeAction('partner_with_vendors', actionModal.data?.skills)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Partner with Training Vendors</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Engage external training providers for specialized skills</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Regulatory Changes Actions */}
              {actionModal.type === 'regulatory_changes' && (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    New regulations require immediate compliance updates:
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => executeAction('update_payroll_system', actionModal.data?.deadline)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Update Payroll System</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Implement new overtime calculation rules</div>
                    </button>
                    <button
                      onClick={() => executeAction('review_hr_policies', actionModal.data?.deadline)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Review HR Policies</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Update employee handbook and policies</div>
                    </button>
                    <button
                      onClick={() => executeAction('schedule_compliance_training', actionModal.data?.deadline)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Schedule Manager Training</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Train managers on new compliance requirements</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Hiring Forecast Actions */}
              {actionModal.type === 'hiring_forecast' && (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    AI recommends strategic hiring for Q2 growth:
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => executeAction('create_hiring_plan', actionModal.data?.departments)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Create Detailed Hiring Plan</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Develop timeline and requirements for each department</div>
                    </button>
                    <button
                      onClick={() => executeAction('approve_hiring_budget', actionModal.data?.departments)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Approve Hiring Budget</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Allocate budget for 12 new positions</div>
                    </button>
                    <button
                      onClick={() => executeAction('start_recruitment', actionModal.data?.departments)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Start Recruitment Process</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Begin recruiting for priority roles immediately</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Budget Optimization Actions */}
              {actionModal.type === 'budget_optimization' && (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Optimize budget allocation for better ROI:
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => executeAction('reallocate_budget', actionModal.data?.savings)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Reallocate Budget</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Move $45K from underused benefits to training programs</div>
                    </button>
                    <button
                      onClick={() => executeAction('analyze_benefits_usage', actionModal.data?.savings)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Analyze Benefits Usage</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Generate detailed report on benefit utilization</div>
                    </button>
                    <button
                      onClick={() => executeAction('survey_employee_preferences', actionModal.data?.savings)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Survey Employee Preferences</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Understand which benefits employees value most</div>
                    </button>
                  </div>
                </div>
              )}

              {/* I-9 Verification Audit Actions */}
              {actionModal.type === 'i-9_verification_audit' && (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Employee I-9 forms require re-verification:
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => executeAction('send_i9_reminders', 'affected_employees')}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Send Automated Reminders</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Email employees requesting updated I-9 documentation</div>
                    </button>
                    <button
                      onClick={() => executeAction('schedule_i9_meetings', 'affected_employees')}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Schedule Verification Meetings</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Book 1-on-1 appointments with affected employees</div>
                    </button>
                    <button
                      onClick={() => executeAction('generate_i9_report', 'affected_employees')}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Generate Compliance Report</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Create audit trail for I-9 verification process</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Compensation Analysis Actions */}
              {actionModal.type === 'compensation_analysis' && (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Multiple employees are below market rate for their positions:
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => executeAction('review_compensation_bands', 'market_data')}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Review Compensation Bands</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Analyze current pay scales against market data</div>
                    </button>
                    <button
                      onClick={() => executeAction('create_adjustment_plan', 'affected_employees')}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Create Adjustment Plan</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Develop phased approach to bring salaries to market rate</div>
                    </button>
                    <button
                      onClick={() => executeAction('schedule_compensation_review', 'management')}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Schedule Leadership Review</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Present compensation recommendations to leadership team</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Generic fallback for any other action types */}
              {!['flight_risk_analysis', 'performance_trends', 'skill_gap_detection', 'regulatory_changes',
                  'hiring_forecast', 'budget_optimization', 'i-9_verification_audit', 'compensation_analysis'].includes(actionModal.type) && (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Select an action to address this insight:
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => executeAction('review_insight', actionModal.data)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Review in Detail</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Conduct thorough analysis of this insight</div>
                    </button>
                    <button
                      onClick={() => executeAction('assign_to_team', actionModal.data)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Assign to Team</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Delegate this task to the appropriate team</div>
                    </button>
                    <button
                      onClick={() => executeAction('schedule_followup', actionModal.data)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">Schedule Follow-up</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Set reminder to revisit this insight later</div>
                    </button>
                  </div>
                </div>
              )}
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

export default AIInsightsModal;