import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CheckCircle, AlertTriangle, Eye, Download, FileText, User, Tag, Building2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface PayrollExpenseReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  payrollPeriodStart: string;
  payrollPeriodEnd: string;
  onExpenseDataUpdate?: (totalExpenses: number, expenseCount: number) => void;
}

interface ExpenseForPayroll {
  id: string;
  employee_id: string;
  amount: number;
  merchant: string;
  description: string;
  expense_date: string;
  category: string;
  status: string;
  employee_name: string;
  department: string;
  batch_id: string | null;
}

interface ExpenseBatch {
  id?: string;
  batch_number: string;
  total_amount: number;
  expense_count: number;
  status: string;
}

const PayrollExpenseReviewModal: React.FC<PayrollExpenseReviewModalProps> = ({
  isOpen,
  onClose,
  payrollPeriodStart,
  payrollPeriodEnd,
  onExpenseDataUpdate
}) => {
  const [expenses, setExpenses] = useState<ExpenseForPayroll[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [currentBatch, setCurrentBatch] = useState<ExpenseBatch | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadExpenses();
    }
  }, [isOpen, payrollPeriodStart, payrollPeriodEnd]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          employee_id,
          amount,
          merchant,
          description,
          expense_date,
          status,
          batch_id,
          category:custom_expense_categories(name),
          employee:employees(name, department)
        `)
        .in('status', ['approved'])
        .is('batch_id', null)
        .gte('expense_date', payrollPeriodStart)
        .lte('expense_date', payrollPeriodEnd)
        .order('employee_id');

      if (error) throw error;

      const formattedExpenses = (data || []).map((exp: any) => ({
        id: exp.id,
        employee_id: exp.employee_id,
        amount: exp.amount,
        merchant: exp.merchant,
        description: exp.description,
        expense_date: exp.expense_date,
        category: exp.category?.name || 'Uncategorized',
        status: exp.status,
        employee_name: exp.employee?.name || 'Unknown',
        department: exp.employee?.department || 'Unknown',
        batch_id: exp.batch_id
      }));

      setExpenses(formattedExpenses);

      const allApprovedIds = new Set(formattedExpenses.map((e: ExpenseForPayroll) => e.id));
      setSelectedExpenses(allApprovedIds);

      if (onExpenseDataUpdate) {
        const total = formattedExpenses.reduce((sum: number, e: ExpenseForPayroll) => sum + e.amount, 0);
        onExpenseDataUpdate(total, formattedExpenses.length);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      showNotification('error', 'Failed to load expenses for payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async () => {
    if (selectedExpenses.size === 0) {
      showNotification('error', 'Please select at least one expense to include in payroll');
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const selectedExpensesList = expenses.filter(e => selectedExpenses.has(e.id));
      const totalAmount = selectedExpensesList.reduce((sum, e) => sum + e.amount, 0);

      const batchNumber = `BATCH-${new Date(payrollPeriodStart).getFullYear()}-${String(new Date(payrollPeriodStart).getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

      const { data: batchData, error: batchError } = await supabase
        .from('expense_reimbursement_batches')
        .insert([{
          batch_number: batchNumber,
          payroll_period_start: payrollPeriodStart,
          payroll_period_end: payrollPeriodEnd,
          total_amount: totalAmount,
          expense_count: selectedExpenses.size,
          status: 'submitted',
          processed_by: userData.user.id
        }])
        .select()
        .single();

      if (batchError) throw batchError;

      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          batch_id: batchData.id,
          status: 'reimbursed',
          reimbursed_at: new Date().toISOString()
        })
        .in('id', Array.from(selectedExpenses));

      if (updateError) throw updateError;

      for (const expenseId of Array.from(selectedExpenses)) {
        await supabase
          .from('expense_audit_log')
          .insert([{
            expense_id: expenseId,
            action: 'reimbursed',
            actor_id: userData.user.id,
            notes: `Included in payroll batch ${batchNumber}`,
            new_values: { batch_id: batchData.id, status: 'reimbursed' }
          }]);
      }

      setCurrentBatch({
        id: batchData.id,
        batch_number: batchNumber,
        total_amount: totalAmount,
        expense_count: selectedExpenses.size,
        status: 'submitted'
      });

      showNotification('success', `Created expense batch ${batchNumber} with ${selectedExpenses.size} expenses totaling $${totalAmount.toFixed(2)}`);
      loadExpenses();
    } catch (error: any) {
      console.error('Error creating batch:', error);
      showNotification('error', error.message || 'Failed to create expense batch');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpenseSelection = (expenseId: string) => {
    const newSelected = new Set(selectedExpenses);
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId);
    } else {
      newSelected.add(expenseId);
    }
    setSelectedExpenses(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedExpenses.size === expenses.length) {
      setSelectedExpenses(new Set());
    } else {
      setSelectedExpenses(new Set(expenses.map(e => e.id)));
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const selectedExpensesList = expenses.filter(e => selectedExpenses.has(e.id));
  const totalSelectedAmount = selectedExpensesList.reduce((sum, e) => sum + e.amount, 0);
  const expensesByEmployee = expenses.reduce((acc, exp) => {
    if (!acc[exp.employee_id]) {
      acc[exp.employee_id] = {
        name: exp.employee_name,
        department: exp.department,
        expenses: [],
        total: 0
      };
    }
    acc[exp.employee_id].expenses.push(exp);
    if (selectedExpenses.has(exp.id)) {
      acc[exp.employee_id].total += exp.amount;
    }
    return acc;
  }, {} as Record<string, { name: string; department: string; expenses: ExpenseForPayroll[]; total: number }>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Expense Reimbursement Review</h2>
              <p className="text-emerald-100 text-sm mt-1">
                Payroll Period: {new Date(payrollPeriodStart).toLocaleDateString()} - {new Date(payrollPeriodEnd).toLocaleDateString()}
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
            'bg-blue-50 text-blue-800'
          }`}>
            {notification.message}
          </div>
        )}

        {currentBatch && (
          <div className="mx-6 mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-900">Batch Created Successfully</p>
                <p className="text-sm text-green-800 mt-1">
                  Batch {currentBatch.batch_number} has been created with {currentBatch.expense_count} expenses totaling ${currentBatch.total_amount.toFixed(2)}. These expenses will be included in payroll processing.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 border-b">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-700">{expenses.length}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">Total Expenses</p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-700">{selectedExpenses.size}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">Selected</p>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-700">${totalSelectedAmount.toFixed(2)}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">Total Selected</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <User className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300">{Object.keys(expensesByEmployee).length}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">Employees</p>
            </div>
          </div>

          {expenses.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="select-all"
                checked={selectedExpenses.size === expenses.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-emerald-600 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
              />
              <label htmlFor="select-all" className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 font-medium">
                Select all expenses for reimbursement
              </label>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No approved expenses for this payroll period</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(expensesByEmployee).map(([employeeId, data]) => (
                <div key={employeeId} className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 dark:border-gray-700 px-4 py-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg">{data.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{data.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Reimbursement Amount</p>
                        <p className="text-xl font-bold text-emerald-600">${data.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {data.expenses.map((expense) => (
                      <div key={expense.id} className="p-4 hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedExpenses.has(expense.id)}
                            onChange={() => toggleExpenseSelection(expense.id)}
                            className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium">{expense.merchant}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{expense.description}</p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">${expense.amount.toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="flex gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {expense.category}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(expense.expense_date).toLocaleDateString()}
                              </span>
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                Approved
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {expenses.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedExpenses.size} expense{selectedExpenses.size !== 1 ? 's' : ''} selected
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
                  Total: ${totalSelectedAmount.toFixed(2)}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBatch}
                  disabled={loading || selectedExpenses.size === 0}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  {loading ? 'Processing...' : `Include in Payroll (${selectedExpenses.size})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollExpenseReviewModal;
