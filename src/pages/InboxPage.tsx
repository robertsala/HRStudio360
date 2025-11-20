import { useState } from 'react';
import { Inbox, User, DollarSign, Star, CheckCircle, Clock, AlertTriangle, Eye, Filter, Search, X, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDashboardEscape } from '../hooks/useDashboardEscape';
import { DashboardExitButton } from '../components/DashboardExitButton';

interface InboxTask {
  id: string;
  title: string;
  description: string;
  category: 'Salary Review' | 'Performance Review' | 'Benefits' | 'Compliance' | 'General';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  assignedTo: string;
  createdDate: string;
  dueDate: string;
  employeeName?: string;
  currentSalary?: number;
  recommendedIncrease?: number;
  performanceScore?: number;
  requester?: string;
  department?: string;
  employeeManager?: string;
}

interface InboxPageProps {
  initialFilter?: {
    type: 'my-team' | 'my-department' | 'my-location' | 'all';
    managerId?: string;
    department?: string;
    location?: string;
  };
}

const InboxPage: React.FC<InboxPageProps> = ({ initialFilter }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('pending');
  const [filterCategory, setFilterCategory] = useState('All');
  const [teamFilter, setTeamFilter] = useState<'my-team' | 'my-department' | 'my-location' | 'all'>(initialFilter?.type || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<InboxTask | null>(null);

  // ESC key handler: close task detail if open, otherwise return to dashboard
  useDashboardEscape(() => {
    if (selectedTask) {
      setSelectedTask(null);
      return false; // Don't navigate to dashboard yet
    }
    return true; // Allow navigation to dashboard
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [tasks, setTasks] = useState<InboxTask[]>([
    {
      id: '1',
      title: 'Salary Increase Approval - Sarah Johnson',
      description: 'Performance review completed with 4.5/5 score. Recommended 4.5% salary increase.',
      category: 'Salary Review',
      priority: 'High',
      status: 'Pending',
      assignedTo: 'HR Manager',
      createdDate: '2025-01-10T14:30:00Z',
      dueDate: '2025-01-17T17:00:00Z',
      employeeName: 'Sarah Johnson',
      currentSalary: 125000,
      recommendedIncrease: 4.5,
      performanceScore: 4.5,
      requester: 'Mike Chen'
    },
    {
      id: '2',
      title: 'Performance Review Approval - David Kim',
      description: 'Annual performance review submitted for final approval and salary adjustment.',
      category: 'Performance Review',
      priority: 'Medium',
      status: 'Pending',
      assignedTo: 'HR Manager',
      createdDate: '2025-01-09T11:15:00Z',
      dueDate: '2025-01-16T17:00:00Z',
      employeeName: 'David Kim',
      currentSalary: 85000,
      recommendedIncrease: 3.8,
      performanceScore: 3.8,
      requester: 'Lisa Rodriguez'
    },
    {
      id: '3',
      title: 'Benefits Enrollment Issue - Emma Wilson',
      description: 'Employee unable to complete benefits enrollment due to system error.',
      category: 'Benefits',
      priority: 'Medium',
      status: 'In Progress',
      assignedTo: 'HR Specialist',
      createdDate: '2025-01-08T09:45:00Z',
      dueDate: '2025-01-15T17:00:00Z',
      employeeName: 'Emma Wilson',
      requester: 'Emma Wilson'
    },
    {
      id: '4',
      title: 'Compliance Training Overdue - Marketing Team',
      description: '5 employees in marketing have not completed mandatory compliance training.',
      category: 'Compliance',
      priority: 'High',
      status: 'Pending',
      assignedTo: 'HR Manager',
      createdDate: '2025-01-07T16:20:00Z',
      dueDate: '2025-01-14T17:00:00Z',
      requester: 'System'
    },
    {
      id: '5',
      title: 'PTO Request Approval - Michael Anderson',
      description: 'Employee requesting 5 days PTO for family vacation in February.',
      category: 'General',
      priority: 'Low',
      status: 'Pending',
      assignedTo: 'HR Manager',
      createdDate: '2025-01-11T10:15:00Z',
      dueDate: '2025-01-18T17:00:00Z',
      employeeName: 'Michael Anderson',
      requester: 'Michael Anderson'
    }
  ]);

  const handleApproveTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: 'Completed' as const }
        : t
    ));

    setNotification({
      type: 'success',
      message: `Task "${task.title}" has been approved and completed.`
    });
    setTimeout(() => setNotification(null), 4000);
    setSelectedTask(null);
  };

  const handleDenyTask = (taskId: string) => {
    const task = tasks.find(task => task.id === taskId);
    if (!task) return;

    setTasks(prev => prev.filter(task => task.id !== taskId));

    setNotification({
      type: 'info',
      message: `Task "${task.title}" has been denied and removed from inbox.`
    });
    setTimeout(() => setNotification(null), 4000);
    setSelectedTask(null);
  };

  const filteredTasks = tasks.filter(task => {
    if (teamFilter === 'my-team' && initialFilter?.managerId) {
      if (task.employeeManager !== initialFilter.managerId && task.employeeName !== initialFilter.managerId) {
        return false;
      }
    }

    if (teamFilter === 'my-department' && initialFilter?.department) {
      if (task.department !== initialFilter.department) {
        return false;
      }
    }

    const matchesTab = activeTab === 'pending' ? task.status !== 'Completed' : task.status === 'Completed';
    const matchesCategory = filterCategory === 'All' || task.category === filterCategory;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesCategory && matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case t('inbox.salaryReview'): return <DollarSign className="h-5 w-5 text-green-600" />;
      case t('inbox.performanceReview'): return <Star className="h-5 w-5 text-purple-600" />;
      case t('inbox.benefits'): return <User className="h-5 w-5 text-blue-600" />;
      case t('inbox.compliance'): return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Inbox className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case t('inbox.completed'): return 'bg-green-100 text-green-800';
      case t('inbox.inProgress'): return 'bg-blue-100 text-blue-800';
      case t('inbox.pending'): return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = [t('inbox.all'), t('inbox.salaryReview'), t('inbox.performanceReview'), t('inbox.benefits'), t('inbox.compliance'), t('inbox.general')];
  const tabs = [
    { id: 'pending', label: t('inbox.pendingTasksCount'), count: tasks.filter(task => task.status !== t('inbox.completed')).length },
    { id: 'completed', label: t('inbox.completed'), count: tasks.filter(task => task.status === t('inbox.completed')).length }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full min-h-screen overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <DashboardExitButton />
            
            <div className="h-6 w-px bg-gray-300 dark:border-gray-600"></div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">HR Inbox</h2>
              <p className="text-gray-600 dark:text-gray-400">Manage pending approvals and tasks</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              {initialFilter && (
                <div className="flex items-center gap-2 mr-4">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value as any)}
                    className="border-2 border-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-blue-700"
                    data-testid="select-team-filter"
                  >
                    <option value="all">All Employees</option>
                    <option value="my-team">My Team</option>
                    <option value="my-department">My Department</option>
                    <option value="my-location">My Location</option>
                  </select>
                </div>
              )}
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    filterCategory === category
                      ? 'bg-indigo-100 border-indigo-500 text-indigo-700 font-medium'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                  data-testid={`button-filter-${category.toLowerCase().replace(' ', '-')}`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-1 mr-2 animate-pulse">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs font-medium text-purple-600">AI</span>
              </div>
              <input
                type="text"
                placeholder="AI Search: Try 'Sarah', 'Salary', 'Benefits', etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-16 pr-4 py-2 border-2 border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 bg-purple-50 dark:bg-purple-900/20 placeholder-gray-500 transition-all duration-200"
                data-testid="input-search"
              />
            </div>
          </div>
        </div>

        {/* Tasks List or Task Detail View */}
        <div className="overflow-y-auto max-h-[calc(100vh-400px)]">
          {!selectedTask ? (
            <div className="p-6">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No tasks found matching your criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                      data-testid={`card-task-${task.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="bg-white dark:bg-gray-800 rounded-full p-2">
                            {getCategoryIcon(task.category)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                {task.status}
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{task.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Created: {new Date(task.createdDate).toLocaleDateString()}</span>
                              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                              <span>Assigned to: {task.assignedTo}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(task);
                            }}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
                            title="View Details"
                            data-testid={`button-view-${task.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    data-testid="button-back-to-list"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-medium">Back to Tasks</span>
                  </button>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Task Details</h3>
                  <div className="w-24"></div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(selectedTask.category)}
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{selectedTask.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTask.priority)}`}>
                          {selectedTask.priority} Priority
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTask.status)}`}>
                          {selectedTask.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h5>
                    <p className="text-gray-600 dark:text-gray-400">{selectedTask.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Category</h5>
                      <p className="text-gray-600 dark:text-gray-400">{selectedTask.category}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</h5>
                      <p className="text-gray-600 dark:text-gray-400">{selectedTask.assignedTo}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Created Date</h5>
                      <p className="text-gray-600 dark:text-gray-400">{new Date(selectedTask.createdDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</h5>
                      <p className="text-gray-600 dark:text-gray-400">{new Date(selectedTask.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Salary Review Details */}
                  {selectedTask.category === 'Salary Review' && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <h5 className="font-medium text-green-900 mb-3">Salary Review Details</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-green-700">Employee:</span>
                          <p className="text-green-900">{selectedTask.employeeName}</p>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Performance Score:</span>
                          <p className="text-green-900">{selectedTask.performanceScore}/5.0</p>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Current Salary:</span>
                          <p className="text-green-900">${selectedTask.currentSalary?.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Recommended Increase:</span>
                          <p className="text-green-900">{selectedTask.recommendedIncrease}%</p>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">New Salary:</span>
                          <p className="text-green-900 font-bold">
                            ${selectedTask.currentSalary && selectedTask.recommendedIncrease 
                              ? Math.round(selectedTask.currentSalary * (1 + selectedTask.recommendedIncrease / 100)).toLocaleString()
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Increase Amount:</span>
                          <p className="text-green-900 font-bold">
                            +${selectedTask.currentSalary && selectedTask.recommendedIncrease 
                              ? Math.round(selectedTask.currentSalary * (selectedTask.recommendedIncrease / 100)).toLocaleString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Performance Review Details */}
                  {selectedTask.category === 'Performance Review' && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <h5 className="font-medium text-purple-900 mb-3">Performance Review Details</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-purple-700">Employee:</span>
                          <p className="text-purple-900">{selectedTask.employeeName}</p>
                        </div>
                        <div>
                          <span className="font-medium text-purple-700">Reviewer:</span>
                          <p className="text-purple-900">{selectedTask.requester}</p>
                        </div>
                        <div>
                          <span className="font-medium text-purple-700">Performance Score:</span>
                          <p className="text-purple-900">{selectedTask.performanceScore}/5.0</p>
                        </div>
                        <div>
                          <span className="font-medium text-purple-700">Recommended Increase:</span>
                          <p className="text-purple-900">{selectedTask.recommendedIncrease}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  {selectedTask.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleDenyTask(selectedTask.id)}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                        data-testid="button-deny"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Deny
                      </button>
                      <button
                        onClick={() => handleApproveTask(selectedTask.id)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                        data-testid="button-approve"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {selectedTask.category === 'Salary Review' 
                          ? 'Approve Increase' 
                          : selectedTask.category === 'Performance Review' 
                          ? 'Approve Review' 
                          : 'Mark Complete'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center text-white ${
          notification.type === 'success' ? 'bg-green-600' :
          notification.type === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          <div className="mr-3">
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : notification.type === 'error' ? (
              <X className="h-4 w-4" />
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default InboxPage;
