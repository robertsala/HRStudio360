import React, { useState, useEffect } from 'react';
import { X, Users, Search, Edit, Save, History, AlertCircle, TrendingUp, User, ArrowRight } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface ReportingRelationshipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Employee {
  id: string;
  first_name?: string;
  last_name?: string;
  name: string;
  email: string;
  department: string;
  job_title: string;
  manager_id: string | null;
}

interface ReportingRelationship {
  id: string;
  employee_id: string;
  manager_id: string | null;
  effective_from: string;
  effective_to: string | null;
  reason: string | null;
  employee?: Employee;
  manager?: Employee;
}

interface RelationshipHistory {
  id: string;
  employee_id: string;
  old_manager_id: string | null;
  new_manager_id: string | null;
  change_reason: string;
  effective_date: string;
  changed_by: string;
  employee?: Employee;
  old_manager?: Employee;
  new_manager?: Employee;
}

const ReportingRelationshipsModal: React.FC<ReportingRelationshipsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [relationships, setRelationships] = useState<ReportingRelationship[]>([]);
  const [history, setHistory] = useState<RelationshipHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [cardFilter, setCardFilter] = useState<'all' | 'managers' | 'noManager' | null>(null);

  const [editForm, setEditForm] = useState({
    manager_id: '',
    effective_from: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          email,
          job_title,
          manager_id,
          department:departments(name)
        `)
        .eq('status', 'Active')
        .order('first_name');

      // Transform data to add computed name field
      const employeesWithName = (empData || []).map((emp: any) => ({
        id: emp.id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
        email: emp.email || '',
        department: emp.department?.name || 'Unknown',
        job_title: emp.job_title || 'Unknown',
        manager_id: emp.manager_id
      }));

      if (empError) throw empError;
      setEmployees(employeesWithName);

      if (activeTab === 'current') {
        const { data: relData, error: relError } = await supabase
          .from('employee_reporting_relationships')
          .select('*')
          .is('effective_to', null)
          .order('effective_from', { ascending: false });

        if (relError && relError.code !== 'PGRST116') throw relError;

        const enrichedRelationships = (relData || []).map(rel => ({
          ...rel,
          employee: empData?.find(e => e.id === rel.employee_id),
          manager: empData?.find(e => e.id === rel.manager_id)
        }));

        setRelationships(enrichedRelationships);
      } else {
        const { data: histData, error: histError } = await supabase
          .from('reporting_relationship_history')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (histError && histError.code !== 'PGRST116') throw histError;

        const enrichedHistory = (histData || []).map(hist => ({
          ...hist,
          employee: empData?.find(e => e.id === hist.employee_id),
          old_manager: empData?.find(e => e.id === hist.old_manager_id),
          new_manager: empData?.find(e => e.id === hist.new_manager_id)
        }));

        setHistory(enrichedHistory);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('error', 'Failed to load reporting relationships');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRelationship = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    const currentRel = relationships.find(r => r.employee_id === employeeId);

    setSelectedEmployee(employeeId);
    setEditForm({
      manager_id: currentRel?.manager_id || employee?.manager_id || '',
      effective_from: new Date().toISOString().split('T')[0],
      reason: ''
    });
    setShowEditModal(true);
  };

  const validateRelationship = (employeeId: string, managerId: string): string | null => {
    if (employeeId === managerId) {
      return 'An employee cannot report to themselves';
    }

    const checkCircular = (empId: string, visited: Set<string> = new Set()): boolean => {
      if (visited.has(empId)) return true;
      visited.add(empId);

      const manager = employees.find(e => e.id === empId)?.manager_id;
      if (!manager) return false;
      if (manager === employeeId) return true;

      return checkCircular(manager, visited);
    };

    if (checkCircular(managerId)) {
      return 'This would create a circular reporting relationship';
    }

    return null;
  };

  const handleSaveRelationship = async () => {
    if (!selectedEmployee) return;

    if (!editForm.reason.trim()) {
      showNotification('error', 'Please provide a reason for this change');
      return;
    }

    const validationError = validateRelationship(selectedEmployee, editForm.manager_id);
    if (validationError) {
      showNotification('error', validationError);
      return;
    }

    setLoading(true);
    try {
      // User already available from useAuth hook
      if (!user) throw new Error('Not authenticated');

      const currentRel = relationships.find(r => r.employee_id === selectedEmployee);
      const employee = employees.find(e => e.id === selectedEmployee);

      if (currentRel) {
        const { error: endError } = await supabase
          .from('employee_reporting_relationships')
          .update({
            effective_to: new Date(editForm.effective_from).toISOString().split('T')[0]
          })
          .eq('id', currentRel.id);

        if (endError) throw endError;
      }

      const { error: insertError } = await supabase
        .from('employee_reporting_relationships')
        .insert([{
          employee_id: selectedEmployee,
          manager_id: editForm.manager_id || null,
          effective_from: editForm.effective_from,
          effective_to: null,
          reason: editForm.reason,
          changed_by: userData.user.id
        }]);

      if (insertError) throw insertError;

      const { error: historyError } = await supabase
        .from('reporting_relationship_history')
        .insert([{
          employee_id: selectedEmployee,
          old_manager_id: currentRel?.manager_id || employee?.manager_id || null,
          new_manager_id: editForm.manager_id || null,
          change_reason: editForm.reason,
          effective_date: editForm.effective_from,
          changed_by: userData.user.id
        }]);

      if (historyError) throw historyError;

      const { error: empUpdateError } = await supabase
        .from('employees')
        .update({ manager_id: editForm.manager_id || null })
        .eq('id', selectedEmployee);

      if (empUpdateError) throw empUpdateError;

      showNotification('success', 'Reporting relationship updated successfully');
      setShowEditModal(false);
      setSelectedEmployee(null);
      loadData();
    } catch (error: any) {
      console.error('Error saving relationship:', error);
      showNotification('error', error.message || 'Failed to save reporting relationship');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Calculate who are actual managers (employees with direct reports)
  const activeManagers = employees.filter(emp => {
    return employees.some(e => e.manager_id === emp.id);
  });
  const activeManagersCount = activeManagers.length;

  const employeesWithoutManagers = employees.filter(e => !e.manager_id);
  const employeesWithoutManagersCount = employeesWithoutManagers.length;

  // Apply card filter first
  let baseFilteredEmployees = employees;
  if (cardFilter === 'managers') {
    baseFilteredEmployees = activeManagers;
  } else if (cardFilter === 'noManager') {
    baseFilteredEmployees = employeesWithoutManagers;
  }

  // Then apply search filter
  const filteredEmployees = baseFilteredEmployees.filter(emp => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(search) ||
      emp.email.toLowerCase().includes(search) ||
      emp.department.toLowerCase().includes(search)
    );
  });

  const handleCardClick = (filter: 'all' | 'managers' | 'noManager') => {
    if (cardFilter === filter) {
      setCardFilter(null);
    } else {
      setCardFilter(filter);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Reporting Relationships Management</h2>
              <p className="text-indigo-100 text-sm mt-1">
                Manage direct report relationships and approval hierarchies
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white dark:bg-gray-800 dark:bg-gray-800 hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {notification && (
          <div className={`mx-6 mt-4 p-4 rounded-lg ${
            notification.type === 'success' ? 'bg-green-50 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-yellow-50 text-yellow-800'
          }`}>
            {notification.message}
          </div>
        )}

        <div className="p-6 border-b">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => handleCardClick('all')}
              className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 transition-all hover:shadow-lg hover:scale-105 cursor-pointer ${
                cardFilter === 'all' ? 'border-blue-600 ring-2 ring-blue-300' : 'border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-700">{employees.length}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Total Employees</p>
              {cardFilter === 'all' && (
                <p className="text-xs text-blue-600 mt-1 font-medium">Click to clear filter</p>
              )}
              {!cardFilter && (
                <p className="text-xs text-blue-500 mt-1 opacity-0 group-hover:opacity-100">Click to filter</p>
              )}
            </button>

            <button
              onClick={() => handleCardClick('managers')}
              className={`bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-2 transition-all hover:shadow-lg hover:scale-105 cursor-pointer ${
                cardFilter === 'managers' ? 'border-green-600 ring-2 ring-green-300' : 'border-green-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-700">{activeManagersCount}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Active Managers</p>
              {cardFilter === 'managers' && (
                <p className="text-xs text-green-600 mt-1 font-medium">Click to clear filter</p>
              )}
            </button>

            <button
              onClick={() => handleCardClick('noManager')}
              className={`bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border-2 transition-all hover:shadow-lg hover:scale-105 cursor-pointer ${
                cardFilter === 'noManager' ? 'border-yellow-600 ring-2 ring-yellow-300' : 'border-yellow-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-700">{employeesWithoutManagersCount}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">No Manager Assigned</p>
              {cardFilter === 'noManager' && (
                <p className="text-xs text-yellow-600 mt-1 font-medium">Click to clear filter</p>
              )}
            </button>
          </div>

          {cardFilter && (
            <div className="mb-4 flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                  {cardFilter === 'all' && `Showing all ${employees.length} employees`}
                  {cardFilter === 'managers' && `Showing ${activeManagersCount} active managers`}
                  {cardFilter === 'noManager' && `Showing ${employeesWithoutManagersCount} employees without managers`}
                </span>
              </div>
              <button
                onClick={() => setCardFilter(null)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 font-medium flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear Filter
              </button>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'current'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Current Relationships
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <History className="h-4 w-4" />
              Change History
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'current' ? (
            loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading relationships...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEmployees.map((employee) => {
                  const currentManager = employees.find(e => e.id === employee.manager_id);
                  const directReports = employees.filter(e => e.manager_id === employee.id);

                  return (
                    <div
                      key={employee.id}
                      className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{employee.name}</h3>
                            {directReports.length > 0 && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                Manager
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {employee.job_title} • {employee.department}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            {currentManager ? (
                              <>
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600 dark:text-gray-400">Reports to:</span>
                                <span className="font-medium text-gray-900 dark:text-white dark:text-white">{currentManager.name}</span>
                              </>
                            ) : (
                              <span className="text-yellow-600 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                No manager assigned
                              </span>
                            )}
                          </div>
                          {directReports.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">{directReports.length}</span> direct report{directReports.length !== 1 ? 's' : ''}:
                              <span className="ml-1">{directReports.map(r => r.name).join(', ')}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleEditRelationship(employee.id)}
                          className="px-4 py-2 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No relationship changes recorded</p>
                </div>
              ) : (
                history.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 bg-indigo-100 rounded-full p-2">
                        <ArrowRight className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-1">
                          {record.employee?.name}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span>
                            {record.old_manager ? record.old_manager.name : 'No Manager'}
                          </span>
                          <ArrowRight className="h-4 w-4" />
                          <span className="font-medium text-gray-900 dark:text-white dark:text-white">
                            {record.new_manager ? record.new_manager.name : 'No Manager'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <span className="font-medium">Reason:</span> {record.change_reason}
                        </p>
                        <p className="text-xs text-gray-500">
                          Effective: {new Date(record.effective_date).toLocaleDateString()} •
                          Changed: {new Date(record.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold">Update Reporting Relationship</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {employees.find(e => e.id === selectedEmployee)?.name}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Reports To (Manager) *
                </label>
                <select
                  value={editForm.manager_id}
                  onChange={(e) => setEditForm({ ...editForm, manager_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a manager</option>
                  {employees
                    .filter(e => e.id !== selectedEmployee)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.job_title}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Effective Date *
                </label>
                <input
                  type="date"
                  value={editForm.effective_from}
                  onChange={(e) => setEditForm({ ...editForm, effective_from: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The date when this reporting relationship takes effect
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Reason for Change *
                </label>
                <textarea
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="e.g., Department reorganization, promotion, manager departure..."
                  required
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Important Notes</p>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      <li>This change will affect expense approval workflows</li>
                      <li>Pending expenses will continue with the current approver</li>
                      <li>New expenses will route to the new manager</li>
                      <li>All changes are logged for audit purposes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEmployee(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRelationship}
                disabled={loading || !editForm.manager_id || !editForm.reason.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportingRelationshipsModal;
