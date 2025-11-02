import React, { useState } from 'react';
import { X, BarChart3, TrendingUp, Users, DollarSign, Clock, Target, Award, AlertCircle } from 'lucide-react';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('3months');

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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'workforce', label: 'Workforce', icon: Users },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'financial', label: 'Financial', icon: DollarSign }
  ];

  const metrics = {
    overview: [
      { label: 'Employee Satisfaction', value: '87%', change: '+5%', trend: 'up', color: 'text-green-600' },
      { label: 'Retention Rate', value: '94%', change: '+2%', trend: 'up', color: 'text-green-600' },
      { label: 'Time to Hire', value: '18 days', change: '-3 days', trend: 'down', color: 'text-green-600' },
      { label: 'Training Completion', value: '92%', change: '+8%', trend: 'up', color: 'text-green-600' }
    ],
    workforce: [
      { label: 'Total Employees', value: '247', change: '+12', trend: 'up', color: 'text-blue-600' },
      { label: 'New Hires (YTD)', value: '34', change: '+8', trend: 'up', color: 'text-green-600' },
      { label: 'Departures (YTD)', value: '15', change: '-3', trend: 'down', color: 'text-green-600' },
      { label: 'Remote Workers', value: '156', change: '+22', trend: 'up', color: 'text-blue-600' }
    ],
    performance: [
      { label: 'Avg Performance Score', value: '4.2/5', change: '+0.3', trend: 'up', color: 'text-green-600' },
      { label: 'Goals Achieved', value: '89%', change: '+7%', trend: 'up', color: 'text-green-600' },
      { label: 'Reviews Completed', value: '95%', change: '+12%', trend: 'up', color: 'text-green-600' },
      { label: 'Skill Certifications', value: '156', change: '+45', trend: 'up', color: 'text-green-600' }
    ],
    financial: [
      { label: 'Total Payroll', value: '$2.4M', change: '+8%', trend: 'up', color: 'text-blue-600' },
      { label: 'Benefits Cost', value: '$480K', change: '+3%', trend: 'up', color: 'text-yellow-600' },
      { label: 'Training Investment', value: '$125K', change: '+25%', trend: 'up', color: 'text-green-600' },
      { label: 'Cost per Hire', value: '$3,200', change: '-$400', trend: 'down', color: 'text-green-600' }
    ]
  };

  const departmentData = [
    { name: 'Engineering', employees: 89, satisfaction: 91, performance: 4.3 },
    { name: 'Sales', employees: 45, satisfaction: 85, performance: 4.1 },
    { name: 'Marketing', employees: 32, satisfaction: 88, performance: 4.2 },
    { name: 'HR', employees: 12, satisfaction: 92, performance: 4.4 },
    { name: 'Finance', employees: 18, satisfaction: 86, performance: 4.0 },
    { name: 'Operations', employees: 51, satisfaction: 84, performance: 3.9 }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-7xl w-full max-h-[90vh] overflow-auto resize-both min-w-[300px] min-h-[300px]">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-pink-600 to-purple-600 text-white">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">HR Analytics Dashboard</h2>
              <p className="text-pink-100">Data-driven insights for strategic decisions</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-white dark:bg-gray-800 dark:bg-gray-800/20 text-white border border-white/30 rounded-lg px-3 py-1 text-sm"
            >
              <option value="1month" className="text-gray-900 dark:text-white dark:text-white">Last Month</option>
              <option value="3months" className="text-gray-900 dark:text-white dark:text-white">Last 3 Months</option>
              <option value="6months" className="text-gray-900 dark:text-white dark:text-white">Last 6 Months</option>
              <option value="1year" className="text-gray-900 dark:text-white dark:text-white">Last Year</option>
            </select>
            <button
              onClick={onClose}
              className="text-pink-100 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
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
                        ? 'bg-pink-100 text-pink-700 font-medium'
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
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {metrics[activeTab as keyof typeof metrics]?.map((metric, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{metric.value}</p>
                      </div>
                      <div className={`text-right ${metric.color}`}>
                        <div className="flex items-center">
                          {metric.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingUp className="h-4 w-4 mr-1 transform rotate-180" />
                          )}
                          <span className="text-sm font-medium">{metric.change}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Department Breakdown */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Department Overview</h3>
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Employees
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Satisfaction
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Performance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 dark:bg-gray-800 divide-y divide-gray-200">
                          {departmentData.map((dept, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:bg-gray-900">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900 dark:text-white dark:text-white">{dept.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white dark:text-white">
                                {dept.employees}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                    <div 
                                      className="bg-green-600 h-2 rounded-full" 
                                      style={{ width: `${dept.satisfaction}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-900 dark:text-white dark:text-white">{dept.satisfaction}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Award className="h-4 w-4 text-yellow-500 mr-1" />
                                  <span className="text-gray-900 dark:text-white dark:text-white">{dept.performance}/5</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  dept.satisfaction >= 90 ? 'bg-green-100 text-green-800' :
                                  dept.satisfaction >= 85 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {dept.satisfaction >= 90 ? 'Excellent' :
                                   dept.satisfaction >= 85 ? 'Good' : 'Needs Attention'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Workforce Analytics */}
              {activeTab === 'workforce' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Hiring Trends</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Q4 2024</span>
                          <span className="font-medium">12 hires</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Q1 2025 (projected)</span>
                          <span className="font-medium">15 hires</span>
                        </div>
                        <div className="pt-3 border-t">
                          <div className="flex items-center text-green-600">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            <span className="text-sm">25% increase in hiring velocity</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Diversity Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Gender Balance</span>
                          <span className="font-medium">52% / 48%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Leadership Diversity</span>
                          <span className="font-medium">45%</span>
                        </div>
                        <div className="pt-3 border-t">
                          <div className="flex items-center text-blue-600">
                            <Target className="h-4 w-4 mr-2" />
                            <span className="text-sm">On track for 2025 diversity goals</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Analytics */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Performance Distribution</h4>
                    <div className="grid grid-cols-5 gap-4">
                      {[
                        { rating: '5.0', count: 45, percentage: 18 },
                        { rating: '4.0-4.9', count: 128, percentage: 52 },
                        { rating: '3.0-3.9', count: 58, percentage: 23 },
                        { rating: '2.0-2.9', count: 14, percentage: 6 },
                        { rating: '1.0-1.9', count: 2, percentage: 1 }
                      ].map((item, index) => (
                        <div key={index} className="text-center">
                          <div className="bg-gray-200 rounded-full h-20 w-20 mx-auto mb-2 flex items-center justify-center">
                            <span className="text-lg font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300">{item.count}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white dark:text-white">{item.rating}</p>
                          <p className="text-xs text-gray-500">{item.percentage}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Analytics */}
              {activeTab === 'financial' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Cost Breakdown</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Base Salaries</span>
                          <span className="font-medium">$1.8M (75%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Benefits</span>
                          <span className="font-medium">$480K (20%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Training & Development</span>
                          <span className="font-medium">$120K (5%)</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">ROI Metrics</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Revenue per Employee</span>
                          <span className="font-medium">$185K</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Training ROI</span>
                          <span className="font-medium text-green-600">340%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Retention Savings</span>
                          <span className="font-medium text-green-600">$450K</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsModal;