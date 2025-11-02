import React, { useState, useEffect } from 'react';
import { X, User, Calendar, CheckCircle, Clock, AlertTriangle, Users, Briefcase, ChevronRight, Filter, Search } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface NewHireOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NewHire {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department: string;
  start_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  manager_id: string;
  tasks_total: number;
  tasks_completed: number;
}

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  assignee_type: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  completed_at: string | null;
  assignee_id: string;
  notes: string;
}

export default function NewHireOnboardingModal({ isOpen, onClose }: NewHireOnboardingModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks'>('overview');
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [selectedNewHire, setSelectedNewHire] = useState<NewHire | null>(null);
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        if (selectedNewHire) {
          setSelectedNewHire(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, selectedNewHire, onClose]);

  useEffect(() => {
    if (isOpen) {
      fetchNewHires();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedNewHire) {
      fetchTasks(selectedNewHire.id);
    }
  }, [selectedNewHire]);

  const fetchNewHires = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('new_hires')
        .select(`
          *,
          tasks:onboarding_tasks(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedHires = await Promise.all((data || []).map(async (hire: any) => {
        const { count: completedCount } = await supabase
          .from('onboarding_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('new_hire_id', hire.id)
          .eq('status', 'completed');

        const { count: totalCount } = await supabase
          .from('onboarding_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('new_hire_id', hire.id);

        return {
          ...hire,
          tasks_total: totalCount || 0,
          tasks_completed: completedCount || 0
        };
      }));

      setNewHires(formattedHires);
    } catch (error) {
      console.error('Error fetching new hires:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (newHireId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('onboarding_tasks')
        .select('*')
        .eq('new_hire_id', newHireId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const updates: any = { status, updated_at: new Date().toISOString() };

      if (status === 'completed') {
        const { data: { user } } = await supabase.auth.getUser();
        updates.completed_at = new Date().toISOString();
        updates.completed_by = user?.id;
      }

      const { error } = await supabase
        .from('onboarding_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      if (selectedNewHire) {
        fetchTasks(selectedNewHire.id);
        fetchNewHires();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const updateTaskNotes = async (taskId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('onboarding_tasks')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating task notes:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const categories = ['all', ...Array.from(new Set(tasks.map(t => t.category)))];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">New Hire Onboarding</h2>
              <p className="text-teal-100 text-sm">Manage onboarding process and tasks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white dark:bg-gray-800 dark:bg-gray-800 hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex space-x-1 p-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:bg-opacity-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>New Hires Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:bg-opacity-50'
              }`}
              disabled={!selectedNewHire}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Onboarding Tasks</span>
              </div>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading new hires...</p>
                </div>
              ) : newHires.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg">No new hires found</p>
                  <p className="text-gray-400 text-sm mt-2">New hires will appear here after accepting offers</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {newHires.map((hire) => {
                    const progress = getProgressPercentage(hire.tasks_completed, hire.tasks_total);
                    const daysUntilStart = Math.ceil((new Date(hire.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <div
                        key={hire.id}
                        onClick={() => {
                          setSelectedNewHire(hire);
                          setActiveTab('tasks');
                        }}
                        className="bg-white dark:bg-gray-800 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl p-6 hover:border-teal-500 hover:shadow-lg transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4">
                            <div className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-lg font-bold">
                              {hire.first_name[0]}{hire.last_name[0]}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">
                                {hire.first_name} {hire.last_name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{hire.role}</p>
                              <p className="text-xs text-gray-500">{hire.department}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(hire.status)}`}>
                              {hire.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <p className="text-xs text-gray-500 mt-2">
                              {daysUntilStart > 0 ? `Starts in ${daysUntilStart} days` : 'Started'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Onboarding Progress</span>
                            <span className="font-medium text-gray-900 dark:text-white dark:text-white">
                              {hire.tasks_completed} / {hire.tasks_total} tasks
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Start: {new Date(hire.start_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>{hire.email}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && selectedNewHire && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-full h-14 w-14 flex items-center justify-center text-xl font-bold">
                      {selectedNewHire.first_name[0]}{selectedNewHire.last_name[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">
                        {selectedNewHire.first_name} {selectedNewHire.last_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedNewHire.role} - {selectedNewHire.department}</p>
                      <p className="text-xs text-gray-500 mt-1">Start Date: {new Date(selectedNewHire.start_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNewHire(null)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white dark:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading tasks...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg">No tasks found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">{task.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{task.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Briefcase className="h-3 w-3" />
                              <span className="capitalize">{task.assignee_type.replace('_', ' ')}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">{task.category}</span>
                            </div>
                          </div>
                        </div>
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          className="ml-4 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>
                      {task.completed_at && (
                        <div className="text-xs text-green-600 mb-2 flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Completed on {new Date(task.completed_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="mt-3">
                        <textarea
                          placeholder="Add notes..."
                          value={task.notes}
                          onChange={(e) => updateTaskNotes(task.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
