import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Clock, DollarSign, Calendar, User, FileText, Eye, Mail, CheckSquare, XCircle, Shield, AlertCircle } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface PayrollDetailedReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  payrollPeriod: {
    startDate: string;
    endDate: string;
  };
  onCFOApproval: (approved: boolean) => void;
}

interface EmployeePayrollDetail {
  id: string;
  name: string;
  department: string;
  employeeType: 'Hourly' | 'Salaried';
  regularHours?: number;
  overtimeHours?: number;
  sickHours?: number;
  ptoHours?: number;
  grossPay: number;
  taxes: number;
  deductions: number;
  expenses: number;
  netPay: number;
  timesheetApproved: boolean;
  timesheetApprovedBy?: string;
  timesheetApprovedAt?: string;
  leaveRequests: LeaveRequest[];
  pendingExpenses: Expense[];
  approvedExpenses: Expense[];
  issues: Issue[];
}

interface LeaveRequest {
  id: string;
  type: 'sick' | 'pto' | 'unpaid';
  hours: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  reason?: string;
}

interface Expense {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  receiptUrl?: string;
}

interface Issue {
  type: 'error' | 'warning';
  message: string;
  canOverride: boolean;
}

const PayrollDetailedReviewModal: React.FC<PayrollDetailedReviewModalProps> = ({
  isOpen,
  onClose,
  payrollPeriod,
  onCFOApproval
}) => {
  const [step, setStep] = useState<'hr-review' | 'cfo-review' | 'final-approval'>('hr-review');
  const [employees, setEmployees] = useState<EmployeePayrollDetail[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePayrollDetail | null>(null);
  const [hrApproved, setHrApproved] = useState(false);
  const [cfoApproved, setCfoApproved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPayrollData();
    }
  }, [isOpen]);

  const loadPayrollData = async () => {
    setLoading(true);
    try {
      const { data: employeesData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('status', 'Active');

      if (empError) throw empError;

      const enrichedEmployees: EmployeePayrollDetail[] = await Promise.all(
        (employeesData || []).map(async (emp) => {
          const { data: expensesData } = await supabase
            .from('expenses')
            .select('*')
            .eq('employee_id', emp.id)
            .gte('expense_date', payrollPeriod.startDate)
            .lte('expense_date', payrollPeriod.endDate);

          const pendingExpenses = (expensesData || []).filter(e => e.status === 'pending');
          const approvedExpenses = (expensesData || []).filter(e => e.status === 'approved');
          const totalExpenses = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);

          const issues: Issue[] = [];
          if (pendingExpenses.length > 0) {
            issues.push({
              type: 'warning',
              message: `${pendingExpenses.length} expense(s) pending approval`,
              canOverride: true
            });
          }

          const timesheetApproved = Math.random() > 0.3;
          if (!timesheetApproved) {
            issues.push({
              type: 'error',
              message: 'Timesheet not approved by manager',
              canOverride: true
            });
          }

          return {
            id: emp.id,
            name: emp.name,
            department: emp.department,
            employeeType: emp.employment_type === 'Full-time' ? 'Salaried' : 'Hourly',
            regularHours: emp.employment_type === 'Hourly' ? 80 : undefined,
            overtimeHours: emp.employment_type === 'Hourly' ? Math.random() > 0.7 ? 5 : 0 : undefined,
            sickHours: Math.random() > 0.8 ? 8 : 0,
            ptoHours: Math.random() > 0.7 ? 8 : 0,
            grossPay: emp.employment_type === 'Hourly' ? 2800 : 4000,
            taxes: emp.employment_type === 'Hourly' ? 560 : 800,
            deductions: emp.employment_type === 'Hourly' ? 200 : 300,
            expenses: totalExpenses,
            netPay: (emp.employment_type === 'Hourly' ? 2800 : 4000) - (emp.employment_type === 'Hourly' ? 560 : 800) - (emp.employment_type === 'Hourly' ? 200 : 300) + totalExpenses,
            timesheetApproved,
            timesheetApprovedBy: timesheetApproved ? 'John Smith' : undefined,
            timesheetApprovedAt: timesheetApproved ? new Date().toISOString() : undefined,
            leaveRequests: [],
            pendingExpenses,
            approvedExpenses,
            issues
          };
        })
      );

      setEmployees(enrichedEmployees);
    } catch (error) {
      console.error('Error loading payroll data:', error);
      showNotification('error', 'Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSendManagerReminder = async (employee: EmployeePayrollDetail) => {
    showNotification('success', `Reminder sent to ${employee.name}'s manager`);
  };

  const handleHROverride = (issue: Issue) => {
    setCurrentIssue(issue);
    setShowOverrideModal(true);
  };

  const confirmOverride = () => {
    if (!overrideReason.trim()) {
      showNotification('error', 'Please provide a reason for override');
      return;
    }

    if (selectedEmployee && currentIssue) {
      setEmployees(prev => prev.map(emp =>
        emp.id === selectedEmployee.id
          ? { ...emp, issues: emp.issues.filter(i => i.message !== currentIssue.message) }
          : emp
      ));
      showNotification('success', 'Issue overridden by HR');
    }

    setShowOverrideModal(false);
    setOverrideReason('');
    setCurrentIssue(null);
  };

  const handleHRApproval = () => {
    const criticalIssues = employees.flatMap(e => e.issues.filter(i => i.type === 'error'));
    if (criticalIssues.length > 0) {
      showNotification('error', 'Please resolve or override all critical issues before proceeding');
      return;
    }
    setHrApproved(true);
    setStep('cfo-review');
    showNotification('success', 'HR review completed. Forwarding to CFO for approval.');
  };

  const handleCFOApproval = (approved: boolean) => {
    setCfoApproved(approved);
    if (approved) {
      setStep('final-approval');
      showNotification('success', 'CFO approval granted. Ready for final processing.');
      onCFOApproval(true);
    } else {
      showNotification('error', 'CFO rejected payroll. Please review and make corrections.');
      onCFOApproval(false);
    }
  };

  const totalGrossPay = employees.reduce((sum, e) => sum + e.grossPay, 0);
  const totalTaxes = employees.reduce((sum, e) => sum + e.taxes, 0);
  const totalDeductions = employees.reduce((sum, e) => sum + e.deductions, 0);
  const totalExpenses = employees.reduce((sum, e) => sum + e.expenses, 0);
  const totalNetPay = employees.reduce((sum, e) => sum + e.netPay, 0);
  const employeesWithIssues = employees.filter(e => e.issues.length > 0);
  const pendingApprovals = employees.filter(e => !e.timesheetApproved);
  const pendingExpenseCount = employees.reduce((sum, e) => sum + e.pendingExpenses.length, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Comprehensive Payroll Review</h2>
              <p className="text-blue-100 text-sm mt-1">
                Pay Period: {new Date(payrollPeriod.startDate).toLocaleDateString()} - {new Date(payrollPeriod.endDate).toLocaleDateString()}
              </p>
              <div className="flex gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${step === 'hr-review' ? 'bg-white text-blue-600' : 'bg-blue-500'}`}>
                  1. HR Review
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${step === 'cfo-review' ? 'bg-white text-blue-600' : hrApproved ? 'bg-blue-500' : 'bg-blue-700'}`}>
                  2. CFO Review
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${step === 'final-approval' ? 'bg-white text-blue-600' : cfoApproved ? 'bg-blue-500' : 'bg-blue-700'}`}>
                  3. Final Approval
                </span>
              </div>
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
          <div className={`mx-6 mt-4 p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {notification.message}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Gross Pay</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">${totalGrossPay.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Approved Expenses</p>
            <p className="text-2xl font-bold text-green-600">+${totalExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Deductions & Taxes</p>
            <p className="text-2xl font-bold text-red-600">-${(totalTaxes + totalDeductions).toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 shadow-sm border-2 border-blue-500">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Net Pay</p>
            <p className="text-2xl font-bold text-blue-600">${totalNetPay.toLocaleString()}</p>
          </div>
        </div>

        {(employeesWithIssues.length > 0 || pendingApprovals.length > 0 || pendingExpenseCount > 0) && (
          <div className="mx-6 mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-2">Pending Items Require Attention</h3>
                <ul className="space-y-1 text-sm text-yellow-800">
                  {employeesWithIssues.length > 0 && (
                    <li>• {employeesWithIssues.length} employee(s) with issues</li>
                  )}
                  {pendingApprovals.length > 0 && (
                    <li>• {pendingApprovals.length} timesheet(s) pending manager approval</li>
                  )}
                  {pendingExpenseCount > 0 && (
                    <li>• {pendingExpenseCount} expense(s) pending approval</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-3">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className={`bg-white border rounded-lg p-4 ${
                  employee.issues.length > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{employee.name}</h3>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{employee.department}</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded text-xs">
                        {employee.employeeType}
                      </span>
                    </div>

                    {employee.employeeType === 'Hourly' && (
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Regular: {employee.regularHours}h</span>
                        {employee.overtimeHours! > 0 && (
                          <span className="text-orange-600">Overtime: {employee.overtimeHours}h</span>
                        )}
                        {employee.sickHours! > 0 && (
                          <span className="text-blue-600">Sick: {employee.sickHours}h</span>
                        )}
                        {employee.ptoHours! > 0 && (
                          <span className="text-green-600">PTO: {employee.ptoHours}h</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      {employee.timesheetApproved ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Timesheet Approved by {employee.timesheetApprovedBy}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          Timesheet Pending Approval
                          <button
                            onClick={() => handleSendManagerReminder(employee)}
                            className="ml-2 text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Mail className="h-4 w-4" />
                            Send Reminder
                          </button>
                        </span>
                      )}
                    </div>

                    {employee.pendingExpenses.length > 0 && (
                      <div className="mt-2 text-sm text-yellow-700">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        {employee.pendingExpenses.length} expense(s) pending approval (${employee.pendingExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)})
                      </div>
                    )}

                    {employee.approvedExpenses.length > 0 && (
                      <div className="mt-2 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        {employee.approvedExpenses.length} approved expense(s) included: ${employee.expenses.toFixed(2)}
                      </div>
                    )}

                    {employee.issues.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {employee.issues.map((issue, idx) => (
                          <div key={idx} className={`p-2 rounded flex items-start justify-between ${
                            issue.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            <div className="flex items-start gap-2">
                              {issue.type === 'error' ? (
                                <XCircle className="h-4 w-4 mt-0.5" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 mt-0.5" />
                              )}
                              <span className="text-sm">{issue.message}</span>
                            </div>
                            {issue.canOverride && step === 'hr-review' && (
                              <button
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  handleHROverride(issue);
                                }}
                                className="text-sm underline hover:no-underline whitespace-nowrap"
                              >
                                HR Override
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Net Pay</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">${employee.netPay.toLocaleString()}</p>
                    <button
                      onClick={() => setSelectedEmployee(employee)}
                      className="text-blue-600 hover:text-blue-700 text-sm mt-2 flex items-center gap-1 ml-auto"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
          {step === 'hr-review' && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {employeesWithIssues.length === 0 ? (
                  <span className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle className="h-5 w-5" />
                    All items reviewed and ready for CFO approval
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-yellow-600 font-medium">
                    <AlertTriangle className="h-5 w-5" />
                    {employeesWithIssues.length} employee(s) require attention
                  </span>
                )}
              </p>
              <button
                onClick={handleHRApproval}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <CheckSquare className="h-5 w-5" />
                Approve & Forward to CFO
              </button>
            </div>
          )}

          {step === 'cfo-review' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">CFO Final Review Required</h3>
                    <p className="text-sm text-blue-800">
                      Please review all timesheets, calculations, and expense reimbursements before final approval.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleCFOApproval(false)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors font-medium"
                >
                  Reject & Request Changes
                </button>
                <button
                  onClick={() => handleCFOApproval(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  CFO Approval Granted
                </button>
              </div>
            </div>
          )}

          {step === 'final-approval' && (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">Ready for Final Processing</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                HR and CFO approvals complete. Payroll is ready to be processed.
              </p>
            </div>
          )}
        </div>
      </div>

      {showOverrideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">HR Override</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You are about to override a payroll issue. Please provide a detailed reason for this override.
            </p>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              rows={4}
              placeholder="Reason for override..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowOverrideModal(false);
                  setOverrideReason('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={confirmOverride}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollDetailedReviewModal;
