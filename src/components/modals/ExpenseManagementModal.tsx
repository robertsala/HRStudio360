import React, { useState, useEffect } from 'react';
import { X, Plus, Upload, DollarSign, Calendar, Tag, FileText, CheckCircle, XCircle, Clock, Search, Eye } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface ExpenseManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId?: string;
  isHRView?: boolean;
}

interface Expense {
  id: string;
  employeeId: string;
  categoryId: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  receiptUrl: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  submittedAt: string;
  employee?: {
    name: string;
    department: string;
  };
  category?: {
    name: string;
  };
}

interface ExpenseCategory {
  id: string;
  name: string;
  icon?: string;
  displayOrder?: number;
  isActive?: boolean;
  createdAt?: string;
}

const ExpenseManagementModal: React.FC<ExpenseManagementModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  isHRView = false
}) => {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'submit'>('list');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    merchant: '',
    description: '',
    receiptUrl: ''
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadExpenses();
      loadCategories();
    }
  }, [isOpen, filterStatus]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const [expensesData, employeesData, categoriesData] = await Promise.all([
        apiClient.getExpenses(),
        apiClient.getEmployees(),
        apiClient.getExpenseCategories()
      ]);

      const employeeMap = new Map(employeesData.map((emp: any) => [emp.id, emp]));
      const categoryMap = new Map(categoriesData.map((cat: any) => [cat.id, cat]));

      let filteredExpenses = expensesData;

      if (!isHRView && employeeId) {
        filteredExpenses = filteredExpenses.filter((exp: any) => exp.employeeId === employeeId);
      }

      if (filterStatus !== 'all') {
        filteredExpenses = filteredExpenses.filter((exp: any) => exp.status === filterStatus);
      }

      const enrichedExpenses = filteredExpenses.map((expense: any) => {
        const employee = employeeMap.get(expense.employeeId) as any;
        const category = categoryMap.get(expense.categoryId) as any;
        
        return {
          ...expense,
          employee: employee ? {
            name: `${employee.firstName} ${employee.lastName}`,
            department: employee.department || ''
          } : undefined,
          category: category ? {
            name: category.name
          } : undefined
        };
      }).sort((a: any, b: any) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );

      setExpenses(enrichedExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
      showNotification('error', 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await apiClient.getExpenseCategories();
      const activeCategories = data.filter((cat: any) => cat.isActive);
      setCategories(activeCategories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId || !formData.amount || !formData.merchant || !formData.description) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    if (!user) {
      showNotification('error', 'Not authenticated');
      return;
    }

    setLoading(true);
    try {
      const employees = await apiClient.getEmployees();
      const employeeRecord = employees.find((emp: any) => emp.userId === user.id);

      if (!employeeRecord) {
        throw new Error('Employee profile not found');
      }

      await apiClient.createExpense({
        employeeId: employeeRecord.id,
        categoryId: formData.categoryId,
        amount: formData.amount,
        currency: 'USD',
        date: formData.date,
        description: `${formData.merchant} - ${formData.description}`,
        receiptUrl: formData.receiptUrl || null,
        status: 'pending'
      });

      showNotification('success', 'Expense submitted successfully');
      setView('list');
      loadExpenses();
      resetForm();
    } catch (error: any) {
      console.error('Error submitting expense:', error);
      showNotification('error', error.message || 'Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      categoryId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      merchant: '',
      description: '',
      receiptUrl: ''
    });
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      reimbursed: 'bg-blue-100 text-blue-800'
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'reimbursed':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        expense.merchant.toLowerCase().includes(search) ||
        expense.description.toLowerCase().includes(search) ||
        expense.category?.name.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const totalPending = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
  const totalReimbursed = expenses.filter(e => e.status === 'reimbursed').reduce((sum, e) => sum + e.amount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Expense Management</h2>
            <p className="text-blue-100 text-sm mt-1">Submit and track expense reimbursements</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white dark:bg-gray-800 dark:bg-gray-800 hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {notification && (
          <div className={`mx-6 mt-4 p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {notification.message}
          </div>
        )}

        <div className="flex gap-2 p-6 pb-0">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            My Expenses
          </button>
          <button
            onClick={() => setView('submit')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
              view === 'submit'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit Expense
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {view === 'list' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-700">${totalPending.toFixed(2)}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">Pending Approval</p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-700">${totalApproved.toFixed(2)}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">Approved</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-700">${totalReimbursed.toFixed(2)}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">Reimbursed</p>
                </div>
              </div>

              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="reimbursed">Reimbursed</option>
                </select>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading expenses...</p>
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No expenses found</p>
                  </div>
                ) : (
                  filteredExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{expense.merchant}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusBadge(expense.status)}`}>
                              {getStatusIcon(expense.status)}
                              {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{expense.description}</p>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Tag className="h-4 w-4" />
                              {expense.category?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(expense.date).toLocaleDateString()}
                            </span>
                            {isHRView && expense.employee && (
                              <span className="flex items-center gap-1">
                                {expense.employee.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
                            ${expense.amount.toFixed(2)}
                          </p>
                          {expense.receiptUrl && (
                            <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 mt-2">
                              <Eye className="h-4 w-4" />
                              View Receipt
                            </button>
                          )}
                        </div>
                      </div>
                      {expense.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {expense.rejectionReason}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmitExpense} className="max-w-2xl mx-auto">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Expense Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                      Amount *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                      Expense Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Merchant/Vendor *
                  </label>
                  <input
                    type="text"
                    value={formData.merchant}
                    onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Starbucks, Delta Airlines"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Provide details about this expense..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Receipt Upload
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Click to upload receipt</p>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Receipt is required for reimbursement approval
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setView('list');
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit Expense'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseManagementModal;
