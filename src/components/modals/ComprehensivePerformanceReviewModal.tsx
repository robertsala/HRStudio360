import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, Star, Award, TrendingUp, CheckCircle, Clock, AlertCircle, Eye, Plus, Edit, Save, Send, DollarSign, FileText, Download, Search, Building, UserCheck, ChevronDown } from 'lucide-react';
import { performanceReviewService, ReviewCycle, PerformanceReview, ReviewQuestion, CompensationApproval } from '../../utils/performanceReviewService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabaseClient';

interface ComprehensivePerformanceReviewModalProps {
  onClose?: () => void;
}

const ComprehensivePerformanceReviewModal: React.FC<ComprehensivePerformanceReviewModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'cycles' | 'hr-dashboard' | 'my-reviews' | 'team-reviews' | 'approvals'>('cycles');
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<ReviewCycle | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [viewingReviewDetails, setViewingReviewDetails] = useState(false);

  const { user } = useAuth();
  const isHR = user?.email?.includes('hr') || user?.email?.includes('HR');
  const isExecutive = user?.email?.includes('executive') || user?.email?.includes('ceo');

  const [newCycle, setNewCycle] = useState({
    name: '',
    review_type: 'annual' as 'annual' | 'quarterly' | 'probationary' | 'mid_year',
    start_date: '',
    end_date: '',
    self_assessment_deadline: '',
    manager_assessment_deadline: '',
    status: 'draft' as 'draft' | 'active' | 'completed' | 'archived'
  });

  // Employee selection state
  const [employeeSelectionType, setEmployeeSelectionType] = useState<'all' | 'department' | 'individual'>('all');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeList, setShowEmployeeList] = useState(false);

  useEffect(() => {
    loadData();
    loadDepartmentsAndEmployees();
  }, [activeTab]);

  const loadDepartmentsAndEmployees = async () => {
    try {
      // Load departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (deptError) throw deptError;
      setDepartments(deptData || []);

      // Load all active employees with their profiles
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select(`
          id,
          employee_id,
          user_id,
          department_id,
          status,
          profiles:user_id (
            id,
            first_name,
            last_name,
            email
          ),
          departments:department_id (
            id,
            name
          )
        `)
        .eq('status', 'Active')
        .order('employee_id');

      if (empError) throw empError;
      setAllEmployees(empData || []);
      setFilteredEmployees(empData || []);
    } catch (error) {
      console.error('Error loading departments/employees:', error);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'cycles' || activeTab === 'hr-dashboard') {
        const cyclesData = await performanceReviewService.getActiveReviewCycles();
        setCycles(cyclesData || []);
        if (cyclesData && cyclesData.length > 0 && !selectedCycle) {
          setSelectedCycle(cyclesData[0]);
          loadCycleReviews(cyclesData[0].id);
        }
      }

      if (activeTab === 'my-reviews' && user?.id) {
        const myReviews = await performanceReviewService.getMyReviews(user.id);
        setReviews(myReviews || []);
      }

      if (activeTab === 'team-reviews' && user?.id) {
        const teamReviews = await performanceReviewService.getTeamReviews(user.id);
        setReviews(teamReviews || []);
      }

      if (activeTab === 'approvals' && user?.id) {
        const role = isHR ? 'hr_admin' : isExecutive ? 'executive' : '';
        if (role) {
          const approvals = await performanceReviewService.getPendingApprovals(user.id, role);
          setPendingApprovals(approvals || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('error', 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCycleReviews = async (cycleId: string) => {
    try {
      const reviewsData = await performanceReviewService.getReviewsByCycle(cycleId);
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error loading cycle reviews:', error);
    }
  };

  useEffect(() => {
    // Filter employees based on search term
    if (employeeSearchTerm) {
      const filtered = allEmployees.filter(emp => {
        const fullName = `${emp.profiles?.first_name} ${emp.profiles?.last_name}`.toLowerCase();
        const email = emp.profiles?.email?.toLowerCase() || '';
        const empId = emp.employee_id?.toLowerCase() || '';
        const searchLower = employeeSearchTerm.toLowerCase();
        return fullName.includes(searchLower) || email.includes(searchLower) || empId.includes(searchLower);
      });
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(allEmployees);
    }
  }, [employeeSearchTerm, allEmployees]);

  const handleDepartmentToggle = (deptId: string) => {
    setSelectedDepartments(prev =>
      prev.includes(deptId)
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const handleEmployeeToggle = (empId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const getSelectedEmployeeCount = () => {
    if (employeeSelectionType === 'all') {
      return allEmployees.length;
    } else if (employeeSelectionType === 'department') {
      return allEmployees.filter(emp =>
        selectedDepartments.includes(emp.department_id)
      ).length;
    } else {
      return selectedEmployees.length;
    }
  };

  const handleCreateCycle = async () => {
    if (!newCycle.name || !newCycle.start_date || !newCycle.end_date) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    if (employeeSelectionType === 'department' && selectedDepartments.length === 0) {
      showNotification('error', 'Please select at least one department');
      return;
    }

    if (employeeSelectionType === 'individual' && selectedEmployees.length === 0) {
      showNotification('error', 'Please select at least one employee');
      return;
    }

    try {
      // Build employee selection criteria
      const employeeSelectionCriteria = {
        type: employeeSelectionType,
        departments: employeeSelectionType === 'department' ? selectedDepartments : [],
        employees: employeeSelectionType === 'individual' ? selectedEmployees : []
      };

      const createdCycle = await performanceReviewService.createReviewCycle({
        ...newCycle,
        employee_selection_criteria: employeeSelectionCriteria
      });

      showNotification('success', `Review cycle created successfully with ${getSelectedEmployeeCount()} employees`);
      setShowCreateCycle(false);

      // Reset form
      setNewCycle({
        name: '',
        review_type: 'annual',
        start_date: '',
        end_date: '',
        self_assessment_deadline: '',
        manager_assessment_deadline: '',
        status: 'draft'
      });
      setEmployeeSelectionType('all');
      setSelectedDepartments([]);
      setSelectedEmployees([]);
      setEmployeeSearchTerm('');

      loadData();
    } catch (error) {
      console.error('Error creating cycle:', error);
      showNotification('error', 'Failed to create review cycle');
    }
  };

  const handleActivateCycle = async (cycleId: string) => {
    try {
      await performanceReviewService.updateReviewCycle(cycleId, { status: 'active' });
      showNotification('success', 'Review cycle activated');
      loadData();
    } catch (error) {
      console.error('Error activating cycle:', error);
      showNotification('error', 'Failed to activate cycle');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_self': return 'bg-red-100 text-red-700';
      case 'pending_manager': return 'bg-yellow-100 text-yellow-700';
      case 'pending_hr': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
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

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const tabs = [
    { id: 'cycles', label: 'Review Cycles', icon: Calendar, count: cycles.length },
    { id: 'hr-dashboard', label: 'HR Dashboard', icon: Users, count: 0 },
    { id: 'my-reviews', label: 'My Reviews', icon: FileText, count: 0 },
    { id: 'team-reviews', label: 'Team Reviews', icon: Award, count: 0 },
    { id: 'approvals', label: 'Pending Approvals', icon: CheckCircle, count: pendingApprovals.length }
  ];

  const stats = {
    total: reviews.length,
    pendingSelf: reviews.filter(r => r.overall_status === 'pending_self').length,
    pendingManager: reviews.filter(r => r.overall_status === 'pending_manager').length,
    pendingHR: reviews.filter(r => r.overall_status === 'pending_hr').length,
    completed: reviews.filter(r => r.overall_status === 'completed').length
  };

  return (
    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-5 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Award className="h-7 w-7" />
            Performance Review System
          </h2>
          <p className="text-purple-100 text-sm mt-1">
            Comprehensive review management with multi-level approvals
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-purple-700 rounded-lg p-2 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 dark:border-gray-700 px-6 bg-white dark:bg-gray-800 dark:bg-gray-800">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className="bg-red-50 dark:bg-red-900/200 text-white text-xs rounded-full px-2 py-0.5">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Review Cycles Tab */}
        {activeTab === 'cycles' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Review Cycles</h3>
              <button
                onClick={() => setShowCreateCycle(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create New Cycle
              </button>
            </div>

            {showCreateCycle && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Create New Review Cycle</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Cycle Name *</label>
                    <input
                      type="text"
                      value={newCycle.name}
                      onChange={(e) => setNewCycle({ ...newCycle, name: e.target.value })}
                      placeholder="e.g., 2025 Annual Performance Review"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Review Type *</label>
                    <select
                      value={newCycle.review_type}
                      onChange={(e) => setNewCycle({ ...newCycle, review_type: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="annual">Annual</option>
                      <option value="mid_year">Mid-Year</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="probationary">Probationary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Start Date *</label>
                    <input
                      type="date"
                      value={newCycle.start_date}
                      onChange={(e) => setNewCycle({ ...newCycle, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">End Date *</label>
                    <input
                      type="date"
                      value={newCycle.end_date}
                      onChange={(e) => setNewCycle({ ...newCycle, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Self-Assessment Deadline *</label>
                    <input
                      type="date"
                      value={newCycle.self_assessment_deadline}
                      onChange={(e) => setNewCycle({ ...newCycle, self_assessment_deadline: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Manager Assessment Deadline *</label>
                    <input
                      type="date"
                      value={newCycle.manager_assessment_deadline}
                      onChange={(e) => setNewCycle({ ...newCycle, manager_assessment_deadline: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Employee Selection Section */}
                <div className="border-t pt-4 mt-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Select Employees for Review *
                  </h5>

                  {/* Selection Type Radio Buttons */}
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="selectionType"
                        checked={employeeSelectionType === 'all'}
                        onChange={() => setEmployeeSelectionType('all')}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">All Employees ({allEmployees.length})</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="selectionType"
                        checked={employeeSelectionType === 'department'}
                        onChange={() => setEmployeeSelectionType('department')}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">By Department</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="selectionType"
                        checked={employeeSelectionType === 'individual'}
                        onChange={() => setEmployeeSelectionType('individual')}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Select Individual Employees</span>
                    </label>
                  </div>

                  {/* Department Selection */}
                  {employeeSelectionType === 'department' && (
                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Select one or more departments:</p>
                      <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                        {departments.map(dept => (
                          <label key={dept.id} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedDepartments.includes(dept.id)}
                              onChange={() => handleDepartmentToggle(dept.id)}
                              className="w-4 h-4 text-purple-600 rounded"
                            />
                            <Building className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white dark:text-white">{dept.name}</span>
                            <span className="text-xs text-gray-500 ml-auto">
                              ({allEmployees.filter(e => e.department_id === dept.id).length})
                            </span>
                          </label>
                        ))}
                      </div>
                      {selectedDepartments.length > 0 && (
                        <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 rounded-lg">
                          <p className="text-sm font-medium text-purple-900">
                            {getSelectedEmployeeCount()} employees selected from {selectedDepartments.length} department(s)
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Individual Employee Selection */}
                  {employeeSelectionType === 'individual' && (
                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-4">
                      <div className="mb-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search employees by name, email, or ID..."
                            value={employeeSearchTerm}
                            onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto space-y-2">
                        {filteredEmployees.map(emp => (
                          <label
                            key={emp.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedEmployees.includes(emp.user_id)}
                              onChange={() => handleEmployeeToggle(emp.user_id)}
                              className="w-4 h-4 text-purple-600 rounded"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white dark:text-white">
                                  {emp.profiles?.first_name} {emp.profiles?.last_name}
                                </span>
                                <span className="text-xs text-gray-500">({emp.employee_id})</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-600 dark:text-gray-400">{emp.profiles?.email}</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">{emp.departments?.name || 'No Department'}</span>
                              </div>
                            </div>
                          </label>
                        ))}
                        {filteredEmployees.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No employees found matching your search
                          </div>
                        )}
                      </div>
                      {selectedEmployees.length > 0 && (
                        <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 rounded-lg flex items-center justify-between">
                          <p className="text-sm font-medium text-purple-900">
                            {selectedEmployees.length} employee(s) selected
                          </p>
                          <button
                            onClick={() => setSelectedEmployees([])}
                            className="text-xs text-purple-700 hover:text-purple-900 font-medium"
                          >
                            Clear Selection
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* All Employees Info */}
                  {employeeSelectionType === 'all' && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-green-600" />
                        <p className="text-sm font-medium text-green-900">
                          All {allEmployees.length} active employees will be included in this review cycle
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCreateCycle}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Create Cycle ({getSelectedEmployeeCount()} employees)
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateCycle(false);
                      setEmployeeSelectionType('all');
                      setSelectedDepartments([]);
                      setSelectedEmployees([]);
                      setEmployeeSearchTerm('');
                    }}
                    className="bg-gray-200 text-gray-700 dark:text-gray-300 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-6">
              {cycles.map(cycle => (
                <div key={cycle.id} className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">{cycle.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {cycle.review_type.charAt(0).toUpperCase() + cycle.review_type.slice(1)} Review
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      cycle.status === 'active' ? 'bg-green-100 text-green-700' :
                      cycle.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                      cycle.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Period:</span>
                      <p className="text-gray-600 dark:text-gray-400">{cycle.start_date} to {cycle.end_date}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Self Deadline:</span>
                      <p className="text-gray-600 dark:text-gray-400">{cycle.self_assessment_deadline}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Manager Deadline:</span>
                      <p className="text-gray-600 dark:text-gray-400">{cycle.manager_assessment_deadline}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Created:</span>
                      <p className="text-gray-600 dark:text-gray-400">{new Date(cycle.created_at || '').toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {cycle.status === 'draft' && (
                      <button
                        onClick={() => handleActivateCycle(cycle.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Activate Cycle
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedCycle(cycle);
                        loadCycleReviews(cycle.id);
                        setActiveTab('hr-dashboard');
                      }}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      View Reviews
                    </button>
                  </div>
                </div>
              ))}

              {cycles.length === 0 && !showCreateCycle && (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No review cycles created yet</p>
                  <button
                    onClick={() => setShowCreateCycle(true)}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Create First Cycle
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HR Dashboard Tab */}
        {activeTab === 'hr-dashboard' && (
          <div className="space-y-6">
            {selectedCycle && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-2">{selectedCycle.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review Period: {selectedCycle.start_date} to {selectedCycle.end_date}
                </p>
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-4">
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
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600">{stats.pendingHR}</div>
                <div className="text-sm text-blue-700 mt-1">Pending HR</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-green-700 mt-1">Completed</div>
              </div>
            </div>

            {/* Reviews Table */}
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b">
                <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white">All Performance Reviews</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Self Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Manager Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Overall Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reviews.map(review => (
                      <tr key={review.id} className="hover:bg-gray-50 dark:bg-gray-900">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white dark:text-white">
                            {review.employee?.first_name} {review.employee?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{review.employee?.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white dark:text-white">
                          {review.manager?.first_name} {review.manager?.last_name}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            review.self_assessment_status === 'submitted' ? 'bg-green-100 text-green-700' :
                            review.self_assessment_status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {review.self_assessment_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            review.manager_assessment_status === 'submitted' ? 'bg-green-100 text-green-700' :
                            review.manager_assessment_status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {review.manager_assessment_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(review.overall_status)}`}>
                            {getStatusLabel(review.overall_status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedReview(review);
                              setViewingReviewDetails(true);
                            }}
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

        {/* Placeholder tabs */}
        {(activeTab === 'my-reviews' || activeTab === 'team-reviews' || activeTab === 'approvals') && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white dark:text-white mb-2">
              {activeTab === 'my-reviews' && 'My Performance Reviews'}
              {activeTab === 'team-reviews' && 'Team Reviews'}
              {activeTab === 'approvals' && 'Pending Approvals'}
            </h3>
            <p className="text-gray-500">This section is under development</p>
          </div>
        )}
      </div>

      {/* Review Details Modal */}
      {viewingReviewDetails && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <div>
                <h3 className="text-2xl font-bold">Performance Review Details</h3>
                <p className="text-purple-100 mt-1">
                  {selectedReview.employee?.first_name} {selectedReview.employee?.last_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setViewingReviewDetails(false);
                  setSelectedReview(null);
                }}
                className="text-purple-100 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedReview.employee?.first_name} {selectedReview.employee?.last_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedReview.employee?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manager/Reviewer</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedReview.manager?.first_name} {selectedReview.manager?.last_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedReview.manager?.email}</p>
                  </div>
                </div>
              </div>

              {/* Ratings Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                  <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Self Rating</div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {selectedReview.self_overall_rating ? parseFloat(selectedReview.self_overall_rating).toFixed(2) : 'N/A'}
                    <span className="text-lg text-gray-500">/5.0</span>
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 text-center">
                  <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">Manager Rating</div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {selectedReview.manager_overall_rating ? parseFloat(selectedReview.manager_overall_rating).toFixed(2) : 'N/A'}
                    <span className="text-lg text-gray-500">/5.0</span>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                  <div className="text-sm text-green-700 dark:text-green-300 mb-1">Final Rating</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {selectedReview.final_rating ? parseFloat(selectedReview.final_rating).toFixed(2) : 'N/A'}
                    <span className="text-lg text-gray-500">/5.0</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white dark:bg-gray-900 border rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Review Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Self-Assessment</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedReview.self_assessment_status === 'submitted' ? 'bg-green-100 text-green-700' :
                      selectedReview.self_assessment_status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedReview.self_assessment_status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Manager Assessment</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedReview.manager_assessment_status === 'submitted' ? 'bg-green-100 text-green-700' :
                      selectedReview.manager_assessment_status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedReview.manager_assessment_status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Overall Status</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReview.overall_status)}`}>
                      {getStatusLabel(selectedReview.overall_status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              {(selectedReview.self_assessment_submitted_at || selectedReview.manager_assessment_submitted_at) && (
                <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    {selectedReview.self_assessment_submitted_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Self-Assessment Submitted:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(selectedReview.self_assessment_submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedReview.manager_assessment_submitted_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Manager Assessment Submitted:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(selectedReview.manager_assessment_submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setViewingReviewDetails(false);
                  setSelectedReview(null);
                }}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
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
          {notification.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> :
           notification.type === 'error' ? <AlertCircle className="h-5 w-5 mr-2" /> :
           <Clock className="h-5 w-5 mr-2" />}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-3 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ComprehensivePerformanceReviewModal;
