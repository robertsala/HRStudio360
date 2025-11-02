import React, { useState, useEffect } from 'react';
import { X, Users, Shield, Save, Edit, CheckCircle, AlertCircle, UserPlus, Download, Filter, Sparkles, Plus, Settings, Eye } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { mockOrgChartEmployees } from '../../data/mockOrgChartEmployees';

interface UserManagementModalProps {
  onClose?: () => void;
}

interface AccessLevel {
  id: string;
  name: string;
  code: string;
  description: string;
  priority: number;
}

interface EmployeeWithAccess {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  accessLevel?: AccessLevel;
  hasAccount: boolean;
}

interface AIAccessLevelSuggestion {
  employeeId: string;
  employeeName: string;
  currentRole: string;
  department: string;
  suggestedAccessLevel: string;
  suggestedAccessLevelId: string;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ onClose }) => {
  const { user, startImpersonation } = useAuth();
  const [employees, setEmployees] = useState<EmployeeWithAccess[]>([]);
  const [accessLevels, setAccessLevels] = useState<AccessLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterAccessLevel, setFilterAccessLevel] = useState('All');
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [selectedAccessLevelId, setSelectedAccessLevelId] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showCreateAccessLevel, setShowCreateAccessLevel] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIAccessLevelSuggestion[]>([]);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [newAccessLevel, setNewAccessLevel] = useState({
    name: '',
    description: '',
    priority: 50,
    can_view_all_employees: false,
    can_view_compensation: false,
    can_view_performance: false,
    can_edit_employees: false,
    can_manage_users: false,
    can_view_reports: false,
    can_manage_org_chart: false
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  const loadData = async () => {
    try {
      const { data: accessLevelsData, error: accessLevelsError } = await supabase
        .from('access_levels')
        .select('*')
        .order('priority', { ascending: false });

      if (accessLevelsError) throw accessLevelsError;
      setAccessLevels(accessLevelsData || []);

      // Load access level assignments from localStorage
      const storedAssignments = localStorage.getItem('employee_access_assignments');
      const assignments: Record<string, string> = storedAssignments ? JSON.parse(storedAssignments) : {};

      // Use the same employee data source as Employee Directory
      const employeesWithAccess: EmployeeWithAccess[] = mockOrgChartEmployees.map(emp => {
        const assignedLevelId = assignments[emp.id];
        const assignedLevel = assignedLevelId ? accessLevelsData?.find(al => al.id === assignedLevelId) : undefined;

        return {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          department: emp.department,
          role: emp.title,
          accessLevel: assignedLevel,
          hasAccount: false
        };
      });

      setEmployees(employeesWithAccess);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const analyzeAccessLevels = () => {
    setAiProcessing(true);

    const suggestions: AIAccessLevelSuggestion[] = employees.map(emp => {
      const role = emp.role.toLowerCase();
      const title = emp.role;

      let suggestedLevel = '';
      let suggestedId = '';
      let reasoning = '';
      let confidence: 'high' | 'medium' | 'low' = 'high';

      if (title === 'Chief Executive Officer') {
        suggestedLevel = 'CEO';
        reasoning = 'CEO position requires complete organizational access';
      } else if (role.includes('chief') && (
        role.includes('financial') ||
        role.includes('technology') ||
        role.includes('operating') ||
        role.includes('marketing') ||
        role.includes('human resources')
      )) {
        suggestedLevel = 'C-Suite Executive';
        reasoning = 'C-level executive requires strategic access to all departments';
      } else if (role.includes('vp') || role.includes('vice president') || role.includes('director')) {
        suggestedLevel = 'Department Head';
        reasoning = 'VP/Director role requires full access to department data and team management';
      } else if (role.includes('manager') && !role.includes('product')) {
        suggestedLevel = 'Manager';
        reasoning = 'Management position requires access to direct reports and team data';
      } else if (role.includes('hr') && (role.includes('administrator') || role.includes('manager') || role.includes('director'))) {
        suggestedLevel = 'HR Administrator';
        reasoning = 'HR administrative role requires full HR system access';
      } else if (role.includes('hr') && (role.includes('specialist') || role.includes('coordinator') || role.includes('generalist'))) {
        suggestedLevel = 'HR Staff';
        reasoning = 'HR staff role requires access to employee data and compensation';
      } else if (
        role.includes('senior') ||
        role.includes('lead') ||
        role.includes('principal') ||
        role.includes('staff') ||
        role.includes('product manager') ||
        role.includes('designer')
      ) {
        suggestedLevel = 'Employee';
        reasoning = 'Senior/specialist position requires basic employee access';
        confidence = 'medium';
      } else {
        suggestedLevel = 'Employee';
        reasoning = 'Standard employee position requires basic access to own data';
        confidence = 'low';
      }

      const accessLevel = accessLevels.find(al => al.name === suggestedLevel);
      suggestedId = accessLevel?.id || '';

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        currentRole: emp.role,
        department: emp.department,
        suggestedAccessLevel: suggestedLevel,
        suggestedAccessLevelId: suggestedId,
        reasoning,
        confidence
      };
    });

    setAiSuggestions(suggestions);
    setSelectedSuggestions(new Set(suggestions.map(s => s.employeeId)));
    setShowAISuggestions(true);
    setAiProcessing(false);
  };

  const toggleSuggestion = (employeeId: string) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  const applySelectedSuggestions = async () => {
    setAiProcessing(true);

    try {
      // Load existing assignments from localStorage
      const storedAssignments = localStorage.getItem('employee_access_assignments');
      const assignments: Record<string, string> = storedAssignments ? JSON.parse(storedAssignments) : {};

      // Apply selected suggestions
      let successCount = 0;
      for (const suggestion of aiSuggestions) {
        if (!selectedSuggestions.has(suggestion.employeeId)) continue;
        if (!suggestion.suggestedAccessLevelId) continue;

        assignments[suggestion.employeeId] = suggestion.suggestedAccessLevelId;
        successCount++;
      }

      // Save back to localStorage
      localStorage.setItem('employee_access_assignments', JSON.stringify(assignments));

      setAiProcessing(false);
      setShowAISuggestions(false);

      if (successCount > 0) {
        showToast(`Successfully assigned access levels to ${successCount} employee${successCount > 1 ? 's' : ''}`, 'success');
        loadData();
      }
    } catch (error) {
      console.error('Error applying suggestions:', error);
      setAiProcessing(false);
      showToast('Failed to apply access levels', 'error');
    }
  };

  const handleEditEmployee = (employee: EmployeeWithAccess) => {
    setEditingEmployeeId(employee.id);
    setSelectedAccessLevelId(employee.accessLevel?.id || '');
  };

  const handleSaveAccessLevel = async (employeeId: string) => {
    if (!selectedAccessLevelId) {
      showToast('Please select an access level', 'error');
      return;
    }

    try {
      // Load existing assignments from localStorage
      const storedAssignments = localStorage.getItem('employee_access_assignments');
      const assignments: Record<string, string> = storedAssignments ? JSON.parse(storedAssignments) : {};

      // Update the assignment
      assignments[employeeId] = selectedAccessLevelId;

      // Save back to localStorage
      localStorage.setItem('employee_access_assignments', JSON.stringify(assignments));

      showToast('Access level saved successfully!', 'success');
      setEditingEmployeeId(null);

      await loadData();
    } catch (error: any) {
      console.error('Error saving access level:', error);
      showToast('Failed to save access level', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingEmployeeId(null);
    setSelectedAccessLevelId('');
  };

  const handleCreateAccessLevel = async () => {
    if (!newAccessLevel.name || !newAccessLevel.description) {
      showToast('Please fill in name and description', 'error');
      return;
    }

    try {
      const code = newAccessLevel.name.toLowerCase().replace(/\s+/g, '_');

      const { data, error } = await supabase
        .from('access_levels')
        .insert({
          name: newAccessLevel.name,
          code: code,
          description: newAccessLevel.description,
          priority: newAccessLevel.priority
        })
        .select()
        .single();

      if (error) throw error;

      showToast(`Access level "${newAccessLevel.name}" created successfully!`, 'success');
      setShowCreateAccessLevel(false);
      setNewAccessLevel({
        name: '',
        description: '',
        priority: 50,
        can_view_all_employees: false,
        can_view_compensation: false,
        can_view_performance: false,
        can_edit_employees: false,
        can_manage_users: false,
        can_view_reports: false,
        can_manage_org_chart: false
      });

      loadData();
    } catch (error) {
      console.error('Error creating access level:', error);
      showToast('Failed to create access level', 'error');
    }
  };

  const departments = ['All', ...Array.from(new Set(employees.map(emp => emp.department)))];
  const accessLevelOptions = ['All', ...accessLevels.map(al => al.name)];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'All' || emp.department === filterDepartment;
    const matchesAccessLevel = filterAccessLevel === 'All' || emp.accessLevel?.name === filterAccessLevel;
    return matchesSearch && matchesDepartment && matchesAccessLevel;
  });

  const getAccessLevelBadgeColor = (priority?: number) => {
    if (!priority) return 'bg-gray-100 text-gray-700';
    if (priority >= 70) return 'bg-red-100 text-red-800';
    if (priority >= 50) return 'bg-orange-100 text-orange-800';
    if (priority >= 30) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const handleViewAsEmployee = async (employee: EmployeeWithAccess) => {
    try {
      await startImpersonation(employee.id, employee.email);
      showToast(`Now viewing as ${employee.name}`, 'success');
      if (onClose) onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to impersonate user', 'error');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <div className="flex items-center">
          <Shield className="h-8 w-8 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">User Management</h2>
            <p className="text-blue-100">{filteredEmployees.length} employees • Manage access levels and permissions</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="p-6 border-b bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 space-y-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            <div className="relative">
              <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
              <div className="absolute inset-0 h-5 w-5 text-purple-400 animate-ping opacity-75">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">AI</span>
          </div>
          <input
            type="text"
            placeholder="AI Search: Try 'Sarah', 'Engineering', 'Manager', etc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-24 pr-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-white dark:bg-gray-800 dark:bg-gray-800 shadow-sm transition-all hover:shadow-md"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select
              value={filterAccessLevel}
              onChange={(e) => setFilterAccessLevel(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {accessLevelOptions.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredEmployees.length} of {employees.length} employees
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-blue-900">Access Level Guide</h3>
            <div className="flex gap-2">
              <button
                onClick={analyzeAccessLevels}
                disabled={aiProcessing}
                className="flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-sm shadow-md disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {aiProcessing ? 'Analyzing...' : 'AI Auto-Assign'}
              </button>
              <button
                onClick={() => setShowCreateAccessLevel(true)}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Custom Access Level
              </button>
            </div>
          </div>
          <div className="space-y-2 text-sm text-blue-800">
            {accessLevels.map(level => (
              <div key={level.id} className="flex items-start">
                <span className={`px-2 py-1 rounded text-xs font-medium mr-2 ${getAccessLevelBadgeColor(level.priority)}`}>
                  {level.name}
                </span>
                <span>{level.description}</span>
              </div>
            ))}
          </div>
        </div>

        {showCreateAccessLevel && (
          <div className="mb-6 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Settings className="h-6 w-6 text-purple-600 mr-2" />
                <h3 className="font-bold text-gray-900 dark:text-white dark:text-white text-lg">Create Custom Access Level</h3>
              </div>
              <button
                onClick={() => setShowCreateAccessLevel(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Access Level Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., CEO, C-Suite Executive, Department Head"
                  value={newAccessLevel.name}
                  onChange={(e) => setNewAccessLevel({ ...newAccessLevel, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  placeholder="Describe the access level and what it allows"
                  value={newAccessLevel.description}
                  onChange={(e) => setNewAccessLevel({ ...newAccessLevel, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Priority Level: {newAccessLevel.priority}
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={newAccessLevel.priority}
                  onChange={(e) => setNewAccessLevel({ ...newAccessLevel, priority: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Lower Access (1)</span>
                  <span>Higher Access (100)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3">
                  Granular Permissions
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'can_view_all_employees', label: 'View All Employees', icon: Users },
                    { key: 'can_view_compensation', label: 'View Compensation', icon: Shield },
                    { key: 'can_view_performance', label: 'View Performance', icon: Shield },
                    { key: 'can_edit_employees', label: 'Edit Employees', icon: Edit },
                    { key: 'can_manage_users', label: 'Manage Users', icon: UserPlus },
                    { key: 'can_view_reports', label: 'View Reports', icon: Shield },
                    { key: 'can_manage_org_chart', label: 'Manage Org Chart', icon: Users }
                  ].map(({ key, label, icon: Icon }) => (
                    <label
                      key={key}
                      className="flex items-center p-3 border-2 border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={newAccessLevel[key as keyof typeof newAccessLevel] as boolean}
                        onChange={(e) => setNewAccessLevel({ ...newAccessLevel, [key]: e.target.checked })}
                        className="h-4 w-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 mr-3"
                      />
                      <Icon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t">
                <button
                  onClick={handleCreateAccessLevel}
                  className="flex items-center px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Access Level
                </button>
                <button
                  onClick={() => setShowCreateAccessLevel(false)}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showAISuggestions && (
          <div className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white dark:text-white text-lg">AI Access Level Suggestions</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Review and approve suggested access levels based on job titles</p>
                </div>
              </div>
              <button
                onClick={() => setShowAISuggestions(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex items-center justify-between bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-3 border">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
                  {selectedSuggestions.size} of {aiSuggestions.length} selected
                </span>
                <button
                  onClick={() => setSelectedSuggestions(new Set(aiSuggestions.map(s => s.employeeId)))}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedSuggestions(new Set())}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 dark:text-gray-300 font-medium"
                >
                  Clear All
                </button>
              </div>
              <button
                onClick={applySelectedSuggestions}
                disabled={selectedSuggestions.size === 0 || aiProcessing}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold disabled:opacity-50 text-sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {aiProcessing ? 'Applying...' : `Apply Selected (${selectedSuggestions.size})`}
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {aiSuggestions.map((suggestion) => (
                <div
                  key={suggestion.employeeId}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    selectedSuggestions.has(suggestion.employeeId)
                      ? 'bg-purple-50 border-purple-300'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedSuggestions.has(suggestion.employeeId)}
                      onChange={() => toggleSuggestion(suggestion.employeeId)}
                      className="mt-1 h-5 w-5 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{suggestion.employeeName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{suggestion.currentRole} • {suggestion.department}</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            suggestion.confidence === 'high'
                              ? 'bg-green-100 text-green-700'
                              : suggestion.confidence === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {suggestion.confidence.toUpperCase()} CONFIDENCE
                        </span>
                      </div>
                      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold text-purple-700 text-sm">
                            Suggested: {suggestion.suggestedAccessLevel}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">{suggestion.reasoning}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading employees...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No employees found matching your criteria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                className="border rounded-lg p-4 bg-white dark:bg-gray-800 dark:bg-gray-800 hover:shadow-md transition-shadow"
              >
                {editingEmployeeId === employee.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{employee.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{employee.role} • {employee.department}</p>
                        <p className="text-xs text-gray-500">{employee.email}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                        Access Level *
                      </label>
                      <select
                        value={selectedAccessLevelId}
                        onChange={(e) => setSelectedAccessLevelId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Access Level</option>
                        {accessLevels.map((level) => (
                          <option key={level.id} value={level.id}>
                            {level.name} - {level.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSaveAccessLevel(employee.id)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-200 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{employee.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{employee.role} • {employee.department}</p>
                          <p className="text-xs text-gray-500">{employee.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {employee.accessLevel ? (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAccessLevelBadgeColor(employee.accessLevel.priority)}`}>
                          {employee.accessLevel.name}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 dark:text-gray-400">
                          No Access Level
                        </span>
                      )}

                      <button
                        onClick={() => handleViewAsEmployee(employee)}
                        className="flex items-center px-3 py-2 text-purple-600 hover:bg-purple-50 dark:bg-purple-900/20 rounded-lg transition-colors text-sm"
                        title="View application as this employee (read-only)"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View As
                      </button>

                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors text-sm"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementModal;
