import React, { useState, useEffect } from 'react';
import { X, Plus, Search, UserCheck, UserX, CreditCard as Edit, Save, Building2, DollarSign, Calendar, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { mockOrgChartEmployees, type MockEmployee } from '../../data/mockOrgChartEmployees';

interface ExpenseEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  name?: string;
  email: string;
  department: string;
  job_title: string;
  manager_id?: string;
  manager_name?: string;
}

interface EnrollmentRecord {
  id: string;
  employee_id: string;
  is_enrolled: boolean;
  enrollment_date: string | null;
  max_single_expense: number | null;
  monthly_limit: number | null;
  requires_receipt_over: number;
  auto_approve_under: number;
  notes: string | null;
  employee?: Employee;
}

const ExpenseEnrollmentModal: React.FC<ExpenseEnrollmentModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnrolled, setFilterEnrolled] = useState<'all' | 'enrolled' | 'not-enrolled'>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editForm, setEditForm] = useState({
    is_enrolled: false,
    max_single_expense: '',
    monthly_limit: '',
    requires_receipt_over: '25.00',
    auto_approve_under: '0.00',
    notes: '',
    manager_id: ''
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

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
    setLoading(true);
    setNotification(null);

    try {
      // Get all employees from database with their managers
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          email,
          job_title,
          department:departments(name),
          manager:manager_id(first_name, last_name)
        `)
        .order('first_name');

      if (empError) throw empError;

      // If no real employees, fall back to mock data for demo
      const allPeople = empData && empData.length > 0
        ? empData.map((emp: any) => ({
            id: emp.id,
            first_name: emp.first_name,
            last_name: emp.last_name,
            name: `${emp.first_name} ${emp.last_name}`,
            email: emp.email,
            department: emp.department?.name || 'Unknown',
            job_title: emp.job_title || 'Unknown',
            manager_id: emp.manager_id,
            manager_name: emp.manager ? `${emp.manager.first_name} ${emp.manager.last_name}` : null
          }))
        : mockOrgChartEmployees.map((emp: MockEmployee) => ({
            id: emp.id,
            first_name: emp.firstName,
            last_name: emp.lastName,
            name: emp.name,
            email: emp.email,
            department: emp.department,
            job_title: emp.title,
            manager_id: emp.managerId,
            manager_name: null
          }));

      console.log('Loaded employees:', allPeople.length);

      const { data: enrollData, error: enrollError } = await supabase
        .from('employee_expense_enrollment')
        .select('*');

      if (enrollError && enrollError.code !== 'PGRST116') throw enrollError;

      setEmployees(allPeople);

      const enrichedEnrollments = allPeople.map(emp => {
        const enrollment = (enrollData || []).find(e => e.employee_id === emp.id);
        return {
          id: enrollment?.id || '',
          employee_id: emp.id,
          is_enrolled: enrollment?.is_enrolled || false,
          enrollment_date: enrollment?.enrollment_date || null,
          max_single_expense: enrollment?.max_single_expense || null,
          monthly_limit: enrollment?.monthly_limit || null,
          requires_receipt_over: enrollment?.requires_receipt_over || 25.00,
          auto_approve_under: enrollment?.auto_approve_under || 0,
          notes: enrollment?.notes || null,
          employee: emp
        };
      });

      setEnrollments(enrichedEnrollments);
      console.log('Successfully loaded enrollments:', enrichedEnrollments.length);
    } catch (error: any) {
      console.error('Error loading data:', error);
      const errorMessage = error?.message || 'Failed to load enrollment data';
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableExpense = (employeeId: string) => {
    const enrollment = enrollments.find(e => e.employee_id === employeeId);
    const employee = employees.find(e => e.id === employeeId);
    setSelectedEmployee(employeeId);
    setEditForm({
      is_enrolled: enrollment?.is_enrolled || false,
      max_single_expense: enrollment?.max_single_expense?.toString() || '5000.00',
      monthly_limit: enrollment?.monthly_limit?.toString() || '10000.00',
      requires_receipt_over: enrollment?.requires_receipt_over?.toString() || '25.00',
      auto_approve_under: enrollment?.auto_approve_under?.toString() || '0.00',
      notes: enrollment?.notes || '',
      manager_id: employee?.manager_id || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEnrollment = async () => {
    if (!selectedEmployee) return;

    setLoading(true);
    try {
      // User already available from useAuth hook
      if (!user) throw new Error('Not authenticated');

      const enrollment = enrollments.find(e => e.employee_id === selectedEmployee);

      // Update manager if changed
      if (editForm.manager_id) {
        const { error: managerError } = await supabase
          .from('employees')
          .update({ manager_id: editForm.manager_id || null })
          .eq('id', selectedEmployee);

        if (managerError) {
          console.error('Error updating manager:', managerError);
          // Continue even if manager update fails
        }
      }

      const enrollmentData = {
        employee_id: selectedEmployee,
        is_enrolled: editForm.is_enrolled,
        enrollment_date: editForm.is_enrolled ? new Date().toISOString() : null,
        max_single_expense: editForm.max_single_expense ? parseFloat(editForm.max_single_expense) : null,
        monthly_limit: editForm.monthly_limit ? parseFloat(editForm.monthly_limit) : null,
        requires_receipt_over: parseFloat(editForm.requires_receipt_over),
        auto_approve_under: parseFloat(editForm.auto_approve_under),
        notes: editForm.notes || null,
        enrolled_by: userData.user.id,
        updated_at: new Date().toISOString()
      };

      if (enrollment?.id) {
        const { error } = await supabase
          .from('employee_expense_enrollment')
          .update(enrollmentData)
          .eq('id', enrollment.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('employee_expense_enrollment')
          .insert([enrollmentData]);

        if (error) throw error;
      }

      showNotification('success', `Expense access ${editForm.is_enrolled ? 'enabled' : 'disabled'} successfully`);
      setShowEditModal(false);
      setSelectedEmployee(null);
      loadData();
    } catch (error: any) {
      console.error('Error saving enrollment:', error);
      showNotification('error', error.message || 'Failed to save enrollment');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEnroll = async (department: string) => {
    if (!confirm(`Enable expense access for all employees in ${department}?`)) return;

    setLoading(true);
    try {
      // User already available from useAuth hook
      if (!user) throw new Error('Not authenticated');

      const deptEmployees = enrollments.filter(
        e => e.employee?.department === department && !e.is_enrolled
      );

      const enrollmentData = deptEmployees.map(e => ({
        employee_id: e.employee_id,
        is_enrolled: true,
        enrollment_date: new Date().toISOString(),
        max_single_expense: 5000.00,
        monthly_limit: 10000.00,
        requires_receipt_over: 25.00,
        auto_approve_under: 0,
        enrolled_by: userData.user.id
      }));

      const { error } = await supabase
        .from('employee_expense_enrollment')
        .upsert(enrollmentData, { onConflict: 'employee_id' });

      if (error) throw error;

      showNotification('success', `Enabled expense access for ${deptEmployees.length} employees in ${department}`);
      loadData();
    } catch (error: any) {
      console.error('Error bulk enrolling:', error);
      showNotification('error', error.message || 'Failed to bulk enroll');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = searchTerm === '' ||
      enrollment.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.employee?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.employee?.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterEnrolled === 'all' ||
      (filterEnrolled === 'enrolled' && enrollment.is_enrolled) ||
      (filterEnrolled === 'not-enrolled' && !enrollment.is_enrolled);

    const matchesDepartment =
      filterDepartment === '' ||
      enrollment.employee?.department === filterDepartment;

    return matchesSearch && matchesFilter && matchesDepartment;
  });

  const enrolledCount = enrollments.filter(e => e.is_enrolled).length;
  const notEnrolledCount = enrollments.filter(e => !e.is_enrolled).length;
  const departments = [...new Set(employees.map(e => e.department))];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 w-full h-full overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Expense Enrollment Management</h2>
              <p className="text-teal-100 text-sm mt-1">
                Control which employees have access to submit expenses
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
            notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {notification.message}
          </div>
        )}

        <div className="p-6 border-b">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => {
                setFilterEnrolled('enrolled');
                setSearchTerm('');
                setFilterDepartment('');
              }}
              className={`text-left rounded-lg p-4 border transition-all hover:shadow-md cursor-pointer ${
                filterEnrolled === 'enrolled'
                  ? 'bg-green-100 border-green-400 ring-2 ring-green-500 ring-offset-1'
                  : 'bg-green-50 border-green-200 hover:border-green-300'
              }`}
              title="Click to filter enrolled employees"
            >
              <div className="flex items-center justify-between mb-2">
                <UserCheck className="h-6 w-6 text-green-600" />
                {filterEnrolled === 'enrolled' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <p className="text-2xl font-bold text-green-700">{enrolledCount}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">Enrolled</p>
            </button>

            <button
              onClick={() => {
                setFilterEnrolled('not-enrolled');
                setSearchTerm('');
                setFilterDepartment('');
              }}
              className={`text-left rounded-lg p-4 border transition-all hover:shadow-md cursor-pointer ${
                filterEnrolled === 'not-enrolled'
                  ? 'bg-gray-100 border-gray-400 ring-2 ring-gray-500 ring-offset-1'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
              title="Click to filter not enrolled employees"
            >
              <div className="flex items-center justify-between mb-2">
                <UserX className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                {filterEnrolled === 'not-enrolled' && (
                  <CheckCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                )}
              </div>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300">{notEnrolledCount}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">Not Enrolled</p>
            </button>

            <button
              onClick={() => {
                setFilterEnrolled('all');
                setSearchTerm('');
                setFilterDepartment('');
              }}
              className={`text-left rounded-lg p-4 border transition-all hover:shadow-md cursor-pointer ${
                filterEnrolled === 'all' && searchTerm === '' && !filterDepartment
                  ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-500 ring-offset-1'
                  : 'bg-blue-50 border-blue-200 hover:border-blue-300'
              }`}
              title="Click to view all employees"
            >
              <div className="flex items-center justify-between mb-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                {filterEnrolled === 'all' && searchTerm === '' && !filterDepartment && (
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <p className="text-2xl font-bold text-blue-700">{departments.length}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">Departments</p>
            </button>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5 bg-white dark:bg-gray-800 dark:bg-gray-800 px-2 py-1 rounded-md">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-medium text-purple-600">AI</span>
              </div>
              <input
                type="text"
                placeholder="AI Search: Try 'Sarah', 'Engineering', 'San Francisco'"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-4 py-2.5 border-2 border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 bg-purple-50 dark:bg-purple-900/20/50 placeholder-gray-500 transition-all duration-200"
              />
            </div>
            <select
              value={filterEnrolled}
              onChange={(e) => setFilterEnrolled(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Employees</option>
              <option value="enrolled">Enrolled Only</option>
              <option value="not-enrolled">Not Enrolled</option>
            </select>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Filter by Department:</p>
              {filterDepartment && (
                <button
                  onClick={() => setFilterDepartment('')}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  Clear Filter
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {departments.map(dept => {
                const deptEnrollments = enrollments.filter(e => e.employee?.department === dept);
                const deptEnrolledCount = deptEnrollments.filter(e => e.is_enrolled).length;
                const isActive = filterDepartment === dept;

                return (
                  <button
                    key={dept}
                    onClick={() => {
                      if (isActive) {
                        setFilterDepartment('');
                      } else {
                        setFilterDepartment(dept);
                        setSearchTerm('');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white ring-2 ring-teal-500 ring-offset-1 shadow-md'
                        : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
                    }`}
                  >
                    {dept}
                    <span className={`ml-1.5 text-xs ${isActive ? 'text-teal-100' : 'text-teal-500'}`}>
                      ({deptEnrolledCount}/{deptEnrollments.length})
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 dark:border-gray-700">
              <p className="text-xs text-gray-500 mb-2">Bulk Actions:</p>
              <div className="flex gap-2 flex-wrap">
                {departments.map(dept => (
                  <button
                    key={`bulk-${dept}`}
                    onClick={() => handleBulkEnroll(dept)}
                    className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 rounded text-xs hover:bg-green-100 transition-colors border border-green-200"
                  >
                    Enable All in {dept}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {(filterEnrolled !== 'all' || filterDepartment || searchTerm) && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-blue-900">Active Filters:</span>
                  {filterEnrolled !== 'all' && (
                    <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs font-medium">
                      {filterEnrolled === 'enrolled' ? 'Enrolled Only' : 'Not Enrolled'}
                    </span>
                  )}
                  {filterDepartment && (
                    <span className="px-2 py-1 bg-teal-200 text-teal-800 rounded text-xs font-medium">
                      {filterDepartment}
                    </span>
                  )}
                  {searchTerm && (
                    <span className="px-2 py-1 bg-purple-200 text-purple-800 rounded text-xs font-medium">
                      Search: "{searchTerm}"
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setFilterEnrolled('all');
                    setFilterDepartment('');
                    setSearchTerm('');
                  }}
                  className="text-xs text-blue-700 hover:text-blue-900 font-medium underline"
                >
                  Clear All
                </button>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Showing {filteredEnrollments.length} of {enrollments.length} employees
              </p>
            </div>
          )}

          {loading && enrollments.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading employees...</p>
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="text-center py-12">
              <UserX className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-2">No Employees Found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || filterEnrolled !== 'all' || filterDepartment
                  ? 'No employees match your current filters. Try adjusting your search or filter settings.'
                  : 'No employees are available in the system. Employees will appear here once they are added to the database.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEnrollments.map((enrollment) => (
                <div
                  key={enrollment.employee_id}
                  className={`bg-white border rounded-lg p-4 transition-all ${
                    enrollment.is_enrolled ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{enrollment.employee?.name}</h3>
                        {enrollment.is_enrolled ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Enrolled
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded text-xs font-medium">
                            Not Enrolled
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{enrollment.employee?.email}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>{enrollment.employee?.department}</span>
                        <span>{enrollment.employee?.job_title}</span>
                        {enrollment.employee?.manager_name && (
                          <span className="text-blue-600">Reports to: {enrollment.employee.manager_name}</span>
                        )}
                      </div>
                      {enrollment.is_enrolled && (
                        <div className="mt-2 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                          {enrollment.max_single_expense && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Max: ${enrollment.max_single_expense.toFixed(2)}
                            </span>
                          )}
                          {enrollment.monthly_limit && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Monthly: ${enrollment.monthly_limit.toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleEnableExpense(enrollment.employee_id)}
                      className="px-4 py-2 border border-teal-300 text-teal-700 rounded-lg hover:bg-teal-50 transition-colors flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      {enrollment.is_enrolled ? 'Edit' : 'Enable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold">Configure Expense Access</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {enrollments.find(e => e.employee_id === selectedEmployee)?.employee?.name}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <input
                  type="checkbox"
                  id="is_enrolled"
                  checked={editForm.is_enrolled}
                  onChange={(e) => setEditForm({ ...editForm, is_enrolled: e.target.checked })}
                  className="w-5 h-5 text-teal-600 border-gray-300 dark:border-gray-600 rounded focus:ring-teal-500"
                />
                <label htmlFor="is_enrolled" className="font-medium">
                  Enable expense submission access
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Reports To
                </label>
                <select
                  value={editForm.manager_id}
                  onChange={(e) => setEditForm({ ...editForm, manager_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">No Manager / Direct Report to Executive</option>
                  {employees
                    .filter(emp => emp.id !== selectedEmployee)
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.job_title}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select who this employee reports to for expense approvals
                </p>
              </div>

              {editForm.is_enrolled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                        Max Single Expense
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.max_single_expense}
                          onChange={(e) => setEditForm({ ...editForm, max_single_expense: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500"
                          placeholder="5000.00"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Leave empty for no limit</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                        Monthly Limit
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.monthly_limit}
                          onChange={(e) => setEditForm({ ...editForm, monthly_limit: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500"
                          placeholder="10000.00"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Leave empty for no limit</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                        Receipt Required Over
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.requires_receipt_over}
                          onChange={(e) => setEditForm({ ...editForm, requires_receipt_over: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                        Auto-Approve Under
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.auto_approve_under}
                          onChange={(e) => setEditForm({ ...editForm, auto_approve_under: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500"
                      rows={3}
                      placeholder="Add any notes about this employee's expense access..."
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Policy Enforcement</p>
                        <ul className="text-xs space-y-1 list-disc list-inside">
                          <li>Expenses exceeding limits will be automatically flagged</li>
                          <li>Manager approval required for all expenses</li>
                          <li>Receipt validation enforced at submission</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
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
                onClick={handleSaveEnrollment}
                disabled={loading}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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

export default ExpenseEnrollmentModal;
