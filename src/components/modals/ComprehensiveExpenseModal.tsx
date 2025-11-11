import React, { useState, useEffect } from 'react';
import { X, Plus, Upload, DollarSign, Calendar, Tag, FileText, CheckCircle, XCircle, Clock, Search, Filter, Download, Eye, Users, Settings, TrendingUp, AlertTriangle, BarChart3, UserCheck, Building2, Receipt, Sparkles, HelpCircle, Info } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface ComprehensiveExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

interface Expense {
  id: string;
  employee_id: string;
  category_id: string;
  vendor_id: string | null;
  amount: number;
  currency: string;
  expense_date: string;
  merchant: string;
  description: string;
  receipt_url: string | null;
  receipt_images: string[] | null;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  submitted_at: string;
  rejection_reason: string | null;
  reporting_to_at_submission: string | null;
  batch_id: string | null;
  project_code: string | null;
  cost_center: string | null;
  is_billable: boolean;
  employee?: {
    name: string;
    department: string;
  };
  category?: {
    name: string;
  };
  vendor?: {
    name: string;
  };
  manager?: {
    name: string;
  };
}

interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  requires_receipt: boolean;
  requires_manager_approval: boolean;
  approval_threshold: number;
  icon: string;
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  is_preferred: boolean;
}

interface EnrollmentStatus {
  is_enrolled: boolean;
  max_single_expense: number;
  monthly_limit: number;
  requires_receipt_over: number;
}

const ComprehensiveExpenseModal: React.FC<ComprehensiveExpenseModalProps> = ({
  isOpen,
  onClose,
  userRole = 'employee'
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-expenses' | 'submit' | 'approvals' | 'enrollment' | 'categories' | 'vendors' | 'reports'>('my-expenses');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<Array<{type: 'assistant' | 'user', message: string}>>([]);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [scanningReceipt, setScanningReceipt] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    category_id: '',
    vendor_id: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    merchant: '',
    description: '',
    project_code: '',
    cost_center: '',
    is_billable: false,
    receipt_files: [] as File[]
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const isHR = userRole === 'hr' || userRole === 'admin';
  const isManager = userRole === 'manager' || isHR;

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab, filterStatus]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (activeTab === 'submit') {
      validateForm();
    }
  }, [formData, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadExpenses(),
        loadCategories(),
        loadVendors(),
        loadEnrollmentStatus()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      // User already available from useAuth hook
      if (!user) return;

      let query = supabase
        .from('expenses')
        .select(`
          *,
          employee:employees!expenses_employee_id_fkey(first_name, last_name, department:departments(name)),
          category:custom_expense_categories(name, icon),
          vendor:expense_vendors(name, category),
          manager:employees!expenses_reporting_to_at_submission_fkey(first_name, last_name)
        `)
        .order('submitted_at', { ascending: false });

      if (activeTab === 'my-expenses') {
        const { data: empData } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', userData.user.id)
          .single();

        if (empData) {
          query = query.eq('employee_id', empData.id);
        }
      } else if (activeTab === 'approvals' && isManager) {
        const { data: empData } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', userData.user.id)
          .single();

        if (empData) {
          query = query.eq('reporting_to_at_submission', empData.id);
        }
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform nested data to flat structure
      const transformedExpenses = (data || []).map((exp: any) => ({
        ...exp,
        employee: exp.employee ? {
          name: `${exp.employee.first_name || ''} ${exp.employee.last_name || ''}`.trim(),
          department: exp.employee.department?.name || 'Unknown'
        } : undefined,
        manager: exp.manager ? {
          name: `${exp.manager.first_name || ''} ${exp.manager.last_name || ''}`.trim()
        } : undefined
      }));

      setExpenses(transformedExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_expense_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_vendors')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const loadEnrollmentStatus = async () => {
    try {
      // User already available from useAuth hook
      if (!user) return;

      const { data: empData } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!empData) return;

      const { data, error } = await supabase
        .from('employee_expense_enrollment')
        .select('*')
        .eq('employee_id', empData.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setEnrollmentStatus(data || { is_enrolled: false, max_single_expense: 0, monthly_limit: 0, requires_receipt_over: 25 });
    } catch (error) {
      console.error('Error loading enrollment:', error);
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!enrollmentStatus?.is_enrolled) {
      showNotification('error', 'You are not enrolled in the expense system. Please contact HR.');
      return;
    }

    if (!formData.category_id || !formData.amount || !formData.merchant || !formData.description) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (enrollmentStatus.max_single_expense && amount > enrollmentStatus.max_single_expense) {
      showNotification('error', `Expense exceeds maximum single expense limit of $${enrollmentStatus.max_single_expense}`);
      return;
    }

    setLoading(true);
    try {
      // User already available from useAuth hook
      if (!user) throw new Error('Not authenticated');

      const { data: employeeData } = await supabase
        .from('employees')
        .select('id, manager_id')
        .eq('user_id', userData.user.id)
        .single();

      if (!employeeData) throw new Error('Employee profile not found');

      const { data: insertData, error } = await supabase
        .from('expenses')
        .insert([{
          employee_id: employeeData.id,
          category_id: formData.category_id,
          vendor_id: formData.vendor_id || null,
          amount: amount,
          expense_date: formData.expense_date,
          merchant: formData.merchant,
          description: formData.description,
          project_code: formData.project_code || null,
          cost_center: formData.cost_center || null,
          is_billable: formData.is_billable,
          submitted_by: userData.user.id,
          reporting_to_at_submission: employeeData.manager_id,
          policy_acknowledged: true,
          status: 'pending'
        }])
        .select();

      if (error) throw error;

      showNotification('success', 'Expense submitted successfully and sent for approval');
      setActiveTab('my-expenses');
      loadExpenses();
      resetForm();
    } catch (error: any) {
      console.error('Error submitting expense:', error);
      showNotification('error', error.message || 'Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveExpense = async (expenseId: string, comments: string = '') => {
    setLoading(true);
    try {
      // User already available from useAuth hook
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          status: 'approved',
          manager_approved_by: userData.user.id,
          manager_approved_at: new Date().toISOString()
        })
        .eq('id', expenseId);

      if (updateError) throw updateError;

      const { error: workflowError } = await supabase
        .from('expense_approval_workflow')
        .update({
          status: 'approved',
          action_date: new Date().toISOString(),
          comments: comments
        })
        .eq('expense_id', expenseId)
        .eq('approver_id', userData.user.id)
        .eq('status', 'pending');

      if (workflowError) throw workflowError;

      showNotification('success', 'Expense approved successfully');
      loadExpenses();
    } catch (error: any) {
      console.error('Error approving expense:', error);
      showNotification('error', error.message || 'Failed to approve expense');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectExpense = async (expenseId: string, reason: string) => {
    if (!reason.trim()) {
      showNotification('error', 'Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      // User already available from useAuth hook
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', expenseId);

      if (updateError) throw updateError;

      const { error: workflowError } = await supabase
        .from('expense_approval_workflow')
        .update({
          status: 'rejected',
          action_date: new Date().toISOString(),
          comments: reason
        })
        .eq('expense_id', expenseId)
        .eq('approver_id', userData.user.id)
        .eq('status', 'pending');

      if (workflowError) throw workflowError;

      showNotification('success', 'Expense rejected');
      loadExpenses();
      setSelectedExpense(null);
    } catch (error: any) {
      console.error('Error rejecting expense:', error);
      showNotification('error', error.message || 'Failed to reject expense');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      vendor_id: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      merchant: '',
      description: '',
      project_code: '',
      cost_center: '',
      is_billable: false,
      receipt_files: []
    });
    setFormErrors([]);
    setAssistantMessages([]);
    setScanResult(null);
  };

  const handleScanReceipt = async (file: File) => {
    setScanningReceipt(true);
    setScanResult(null);

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/receipt-ocr`;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to scan receipt');
      }

      const result = await response.json();
      setScanResult(result);

      if (result.success && result.data) {
        const scannedData = result.data;
        const updates: any = {};

        if (scannedData.merchant) {
          updates.merchant = scannedData.merchant;
        }
        if (scannedData.amount) {
          updates.amount = scannedData.amount.toString();
        }
        if (scannedData.date) {
          try {
            const dateObj = new Date(scannedData.date);
            if (!isNaN(dateObj.getTime())) {
              updates.expense_date = dateObj.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error('Error parsing date:', e);
          }
        }
        if (scannedData.description) {
          updates.description = scannedData.description;
        }
        if (scannedData.category) {
          const matchingCategory = categories.find(
            c => c.name.toLowerCase() === scannedData.category.toLowerCase()
          );
          if (matchingCategory) {
            updates.category_id = matchingCategory.id;
          }
        }

        setFormData(prev => ({ ...prev, ...updates }));

        showNotification(
          result.data.confidence > 50 ? 'success' : 'info',
          result.message || 'Receipt scanned successfully'
        );
      }
    } catch (error: any) {
      console.error('Error scanning receipt:', error);
      showNotification('error', 'Failed to scan receipt. Please enter details manually.');
    } finally {
      setScanningReceipt(false);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    const selectedCategory = categories.find(c => c.id === formData.category_id);

    if (!formData.category_id) {
      errors.push('Please select an expense category');
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.push('Please enter a valid amount greater than $0');
    }
    if (!formData.merchant || formData.merchant.trim().length === 0) {
      errors.push('Please enter the merchant/vendor name');
    }
    if (!formData.description || formData.description.trim().length === 0) {
      errors.push('Please provide a detailed business purpose');
    }
    if (formData.amount && enrollmentStatus?.max_single_expense && parseFloat(formData.amount) > enrollmentStatus.max_single_expense) {
      errors.push(`Amount exceeds your maximum single expense limit of $${enrollmentStatus.max_single_expense.toFixed(2)}`);
    }
    if (selectedCategory?.requires_receipt && formData.receipt_files.length === 0) {
      errors.push('This category requires a receipt to be uploaded');
    }
    if (formData.amount && enrollmentStatus?.requires_receipt_over && parseFloat(formData.amount) > enrollmentStatus.requires_receipt_over && formData.receipt_files.length === 0) {
      errors.push(`Receipt required for expenses over $${enrollmentStatus.requires_receipt_over.toFixed(2)}`);
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const getAssistantHelp = () => {
    const errors = formErrors;
    if (errors.length === 0) {
      return {
        type: 'success' as const,
        message: "Great job! Your expense form looks complete. You're ready to submit."
      };
    }

    const messages: Array<{type: 'assistant' | 'user', message: string}> = [
      {
        type: 'assistant',
        message: "Hi! I'm here to help you submit your expense successfully. I noticed a few things that need your attention:"
      }
    ];

    errors.forEach((error, index) => {
      messages.push({
        type: 'assistant',
        message: `${index + 1}. ${error}`
      });
    });

    if (errors.some(e => e.includes('category'))) {
      messages.push({
        type: 'assistant',
        message: "💡 Tip: Choose the category that best matches your expense type (e.g., Travel, Meals, Office Supplies)"
      });
    }

    if (errors.some(e => e.includes('amount'))) {
      messages.push({
        type: 'assistant',
        message: "💡 Tip: Enter the total amount shown on your receipt, including tax if applicable."
      });
    }

    if (errors.some(e => e.includes('merchant'))) {
      messages.push({
        type: 'assistant',
        message: "💡 Tip: Enter the business name exactly as it appears on your receipt (e.g., 'Starbucks' or 'Delta Airlines')."
      });
    }

    if (errors.some(e => e.includes('business purpose'))) {
      messages.push({
        type: 'assistant',
        message: "💡 Tip: Explain why this expense was necessary for work. For example: 'Client meeting lunch' or 'Travel to conference'."
      });
    }

    if (errors.some(e => e.includes('receipt') || e.includes('Receipt'))) {
      messages.push({
        type: 'assistant',
        message: "💡 Tip: Upload a clear photo of your receipt and our AI will automatically extract the merchant, amount, and date for you!"
      });
    }

    if (errors.some(e => e.includes('limit') || e.includes('exceeds'))) {
      messages.push({
        type: 'assistant',
        message: "⚠️ Important: This expense exceeds your approved limit. Please contact your manager or HR for pre-approval."
      });
    }

    setAssistantMessages(messages);
    return { type: 'info' as const, message: `I found ${errors.length} ${errors.length === 1 ? 'issue' : 'issues'} that need attention.` };
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
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
        expense.category?.name.toLowerCase().includes(search) ||
        expense.employee?.name.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const totalPending = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
  const totalReimbursed = expenses.filter(e => e.status === 'reimbursed').reduce((sum, e) => sum + e.amount, 0);
  const pendingApprovalCount = expenses.filter(e => e.status === 'pending').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-800 dark:bg-gray-800 z-50 flex flex-col">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Comprehensive Expense Management</h2>
              <p className="text-green-100 text-sm mt-1">
                Submit, track, and manage expense reimbursements with full approval workflow
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

        {!enrollmentStatus?.is_enrolled && activeTab !== 'approvals' && !isHR && (
          <div className="mx-6 mt-4 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">Expense Access Not Enabled</p>
                <p className="text-sm text-orange-800 mt-1">
                  You are not currently enrolled in the expense reimbursement system. Please contact HR to request access.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 p-6 pb-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('my-expenses')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'my-expenses'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Receipt className="h-4 w-4" />
            My Expenses
          </button>
          {enrollmentStatus?.is_enrolled && (
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'submit'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Plus className="h-4 w-4" />
              Submit Expense
            </button>
          )}
          {isManager && (
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 relative ${
                activeTab === 'approvals'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              Approvals
              {pendingApprovalCount > 0 && activeTab !== 'approvals' && (
                <span className="absolute -top-1 -right-1 bg-red-50 dark:bg-red-900/200 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingApprovalCount}
                </span>
              )}
            </button>
          )}
          {isHR && (
            <>
              <button
                onClick={() => setActiveTab('enrollment')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'enrollment'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Users className="h-4 w-4" />
                Enrollment
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'categories'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Tag className="h-4 w-4" />
                Categories
              </button>
              <button
                onClick={() => setActiveTab('vendors')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'vendors'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Building2 className="h-4 w-4" />
                Vendors
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Reports
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
          {activeTab === 'my-expenses' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-6 w-6 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-700">{expenses.filter(e => e.status === 'pending').length}</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-700">${totalPending.toFixed(2)}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">Pending Approval</p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-xs font-medium text-green-700">{expenses.filter(e => e.status === 'approved').length}</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">${totalApproved.toFixed(2)}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">Approved</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">{expenses.filter(e => e.status === 'reimbursed').length}</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">${totalReimbursed.toFixed(2)}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">Reimbursed</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300">${(totalPending + totalApproved + totalReimbursed).toFixed(2)}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">Total Expenses</p>
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500"
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading expenses...</p>
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No expenses found</p>
                    {enrollmentStatus?.is_enrolled && (
                      <button
                        onClick={() => setActiveTab('submit')}
                        className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Submit Your First Expense
                      </button>
                    )}
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
                            {expense.is_billable && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                Billable
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{expense.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Tag className="h-4 w-4" />
                              {expense.category?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(expense.expense_date).toLocaleDateString()}
                            </span>
                            {expense.manager && (
                              <span className="flex items-center gap-1">
                                Approver: {expense.manager.name}
                              </span>
                            )}
                            {expense.project_code && (
                              <span className="text-gray-600 dark:text-gray-400">
                                Project: {expense.project_code}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
                            ${expense.amount.toFixed(2)}
                          </p>
                          {expense.receipt_url && (
                            <button
                              onClick={() => {
                                setSelectedExpense(expense);
                                setShowReceiptModal(true);
                              }}
                              className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1 mt-2 ml-auto"
                            >
                              <Eye className="h-4 w-4" />
                              View Receipt
                            </button>
                          )}
                        </div>
                      </div>
                      {expense.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {expense.rejection_reason}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'submit' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              <form onSubmit={handleSubmitExpense} className="lg:col-span-2">
                <div className="space-y-6 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Submit New Expense</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const help = getAssistantHelp();
                        setShowAssistant(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <Sparkles className="h-4 w-4" />
                      Need Help?
                    </button>
                  </div>

                  {formErrors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-red-900 mb-2">Please fix the following issues:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                            {formErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Your Expense Limits</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">Max Single Expense:</p>
                        <p className="font-bold text-blue-900">${enrollmentStatus?.max_single_expense?.toFixed(2) || 'No limit'}</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Monthly Limit:</p>
                        <p className="font-bold text-blue-900">${enrollmentStatus?.monthly_limit?.toFixed(2) || 'No limit'}</p>
                      </div>
                    </div>
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                      Expense Category *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                      Vendor (Optional)
                    </label>
                    <select
                      value={formData.vendor_id}
                      onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select or enter manually</option>
                      {vendors.filter(v => v.is_preferred).map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name} {vendor.is_preferred && '⭐'}
                        </option>
                      ))}
                      <option disabled>──────────</option>
                      {vendors.filter(v => !v.is_preferred).map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Merchant/Vendor Name *
                  </label>
                  <input
                    type="text"
                    value={formData.merchant}
                    onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Starbucks, Delta Airlines"
                    required
                  />
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500"
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
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500"
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Business Purpose *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Provide a detailed business purpose for this expense..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                      Project Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.project_code}
                      onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., PROJ-2024-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                      Cost Center (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.cost_center}
                      onChange={(e) => setFormData({ ...formData, cost_center: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Marketing, R&D"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="billable"
                    checked={formData.is_billable}
                    onChange={(e) => setFormData({ ...formData, is_billable: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500"
                  />
                  <label htmlFor="billable" className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">
                    This expense is billable to a client
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Receipt Upload *
                  </label>
                  <div
                    onClick={() => document.getElementById('receipt-upload')?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer"
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Click to upload receipt or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                    <input
                      id="receipt-upload"
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        setFormData({ ...formData, receipt_files: files });

                        if (files.length > 0 && files[0].type.startsWith('image/')) {
                          await handleScanReceipt(files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                  {scanningReceipt && (
                    <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <div>
                          <p className="text-sm font-medium text-blue-900">AI Scanning Receipt...</p>
                          <p className="text-xs text-blue-700">Extracting merchant, amount, and date information</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {scanResult && scanResult.success && (
                    <div className="mt-3 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900 mb-2">Receipt Scanned Successfully!</p>
                          <div className="text-xs text-green-800 space-y-1">
                            {scanResult.data.merchant && (
                              <p>✓ Merchant: {scanResult.data.merchant}</p>
                            )}
                            {scanResult.data.amount && (
                              <p>✓ Amount: ${scanResult.data.amount.toFixed(2)}</p>
                            )}
                            {scanResult.data.date && (
                              <p>✓ Date: {scanResult.data.date}</p>
                            )}
                            {scanResult.data.category && (
                              <p>✓ Category: {scanResult.data.category}</p>
                            )}
                          </div>
                          <p className="text-xs text-green-700 mt-2">
                            Confidence: {scanResult.data.confidence}% - Please verify the extracted information
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {formData.receipt_files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Selected Files:</p>
                        {formData.receipt_files.length > 0 && formData.receipt_files[0].type.startsWith('image/') && !scanningReceipt && (
                          <button
                            type="button"
                            onClick={() => handleScanReceipt(formData.receipt_files[0])}
                            className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                          >
                            <Sparkles className="h-3 w-3" />
                            Scan Again
                          </button>
                        )}
                      </div>
                      {formData.receipt_files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 rounded px-3 py-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newFiles = formData.receipt_files.filter((_, i) => i !== index);
                              setFormData({ ...formData, receipt_files: newFiles });
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Receipt required for expenses over ${enrollmentStatus?.requires_receipt_over?.toFixed(2) || '25.00'}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="policy"
                      required
                      className="mt-1 w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500"
                    />
                    <label htmlFor="policy" className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">
                      I acknowledge that this expense complies with company expense policy and is submitted for legitimate business purposes
                    </label>
                  </div>
                </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('my-expenses');
                        resetForm();
                      }}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || formErrors.length > 0}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? 'Submitting...' : 'Submit for Approval'}
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </form>

              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg shadow-sm p-6 border border-purple-200 sticky top-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-purple-600 rounded-lg p-2">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white">Studio Assistant</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Here to help you submit expenses</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {formErrors.length === 0 ? (
                      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border border-green-200">
                        <div className="flex items-start gap-3">
                          <div className="bg-green-100 rounded-full p-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white dark:text-white mb-1">Looking good!</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Your expense form is complete and ready to submit.</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border border-purple-200">
                          <div className="flex items-start gap-3">
                            <div className="bg-purple-100 rounded-full p-2 flex-shrink-0">
                              <Info className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white dark:text-white mb-2">
                                I found {formErrors.length} {formErrors.length === 1 ? 'issue' : 'issues'} that need attention
                              </p>
                              <div className="space-y-2">
                                {formErrors.map((error, index) => (
                                  <div key={index} className="flex items-start gap-2">
                                    <span className="text-purple-600 font-bold text-xs mt-0.5">{index + 1}.</span>
                                    <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-300">{error}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {formErrors.some(e => e.toLowerCase().includes('category')) && (
                          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-start gap-2">
                              <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-blue-900 mb-1">Category Help</p>
                                <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-300">
                                  Choose the category that best matches your expense: Travel for transportation, Meals for food, Office Supplies for materials, etc.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {formErrors.some(e => e.toLowerCase().includes('amount')) && (
                          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-start gap-2">
                              <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-blue-900 mb-1">Amount Help</p>
                                <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-300">
                                  Enter the total amount from your receipt, including tax. Double-check for typos.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {formErrors.some(e => e.toLowerCase().includes('merchant') || e.toLowerCase().includes('vendor')) && (
                          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-start gap-2">
                              <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-blue-900 mb-1">Merchant Help</p>
                                <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-300">
                                  Enter the business name exactly as shown on your receipt (e.g., "Starbucks" or "Delta Airlines").
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {formErrors.some(e => e.toLowerCase().includes('purpose') || e.toLowerCase().includes('description')) && (
                          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-start gap-2">
                              <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-blue-900 mb-1">Business Purpose Help</p>
                                <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                                  Explain why this expense was necessary for work. Good examples:
                                </p>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  <li>• "Lunch meeting with client ABC Corp"</li>
                                  <li>• "Flight to attend Q4 sales conference"</li>
                                  <li>• "Office supplies for team project"</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {formErrors.some(e => e.toLowerCase().includes('receipt')) && (
                          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-start gap-2">
                              <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-blue-900 mb-1">AI Receipt Scanning</p>
                                <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                                  Upload a clear photo of your receipt and our AI will automatically extract:
                                </p>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  <li>• Merchant name</li>
                                  <li>• Purchase amount</li>
                                  <li>• Transaction date</li>
                                  <li>• Suggested category</li>
                                </ul>
                                <p className="text-xs text-gray-500 mt-2">
                                  Just verify the details and submit!
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {formErrors.some(e => e.toLowerCase().includes('limit') || e.toLowerCase().includes('exceed')) && (
                          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border border-orange-200">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-orange-900 mb-1">Expense Limit Exceeded</p>
                                <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-300">
                                  This expense exceeds your approved limit. Please contact your manager or HR for pre-approval before submitting.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-900 dark:text-white dark:text-white mb-2">Quick Tips</p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                        <li className="flex items-start gap-2">
                          <Sparkles className="h-3 w-3 text-purple-600 mt-0.5" />
                          <span>Use AI scanning to auto-fill expense details from receipts</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">•</span>
                          <span>Submit expenses within 30 days of purchase</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">•</span>
                          <span>Keep original receipts for your records</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">•</span>
                          <span>Personal expenses should not be submitted</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">•</span>
                          <span>Questions? Contact HR for assistance</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'approvals' && isManager && (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Pending Approvals</h3>
                {filteredExpenses.filter(e => e.status === 'pending').length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-green-300 mx-auto mb-4" />
                    <p className="text-gray-500">No pending approvals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredExpenses.filter(e => e.status === 'pending').map((expense) => (
                      <div
                        key={expense.id}
                        className="bg-white dark:bg-gray-800 dark:bg-gray-800 border-2 border-yellow-200 rounded-lg p-6"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-lg">{expense.employee?.name}</h3>
                              <span className="text-sm text-gray-600 dark:text-gray-400">{expense.employee?.department}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Merchant:</p>
                                <p className="font-semibold">{expense.merchant}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Category:</p>
                                <p className="font-semibold">{expense.category?.name}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Date:</p>
                                <p className="font-semibold">{new Date(expense.expense_date).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Submitted:</p>
                                <p className="font-semibold">{new Date(expense.submitted_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <p className="text-gray-600 dark:text-gray-400 text-sm">Business Purpose:</p>
                              <p className="text-gray-900 dark:text-white dark:text-white">{expense.description}</p>
                            </div>
                          </div>
                          <div className="text-right ml-6">
                            <p className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white">
                              ${expense.amount.toFixed(2)}
                            </p>
                            {expense.receipt_url && (
                              <button
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setShowReceiptModal(true);
                                }}
                                className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1 mt-2 ml-auto"
                              >
                                <Eye className="h-4 w-4" />
                                View Receipt
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t">
                          <button
                            onClick={() => {
                              const reason = prompt('Please provide a reason for rejection:');
                              if (reason) {
                                handleRejectExpense(expense.id, reason);
                              }
                            }}
                            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 dark:bg-red-900/20 transition-colors flex items-center gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveExpense(expense.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'enrollment' && isHR && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Employee Enrollment Management</p>
              <p className="text-sm text-gray-400 mt-2">Feature coming soon - Manage which employees have expense access</p>
            </div>
          )}

          {activeTab === 'categories' && isHR && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Expense Categories</h3>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Category
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{category.name}</h4>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{category.description}</p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Receipt: {category.requires_receipt ? 'Required' : 'Optional'}</span>
                      <span>Threshold: ${category.approval_threshold}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'vendors' && isHR && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Vendor Management</h3>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Vendor
                </button>
              </div>
              <div className="space-y-2">
                {vendors.map((vendor) => (
                  <div key={vendor.id} className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">
                        {vendor.name} {vendor.is_preferred && <span className="text-yellow-500">⭐</span>}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{vendor.category}</p>
                    </div>
                    <button className="text-green-600 hover:text-green-700 text-sm">
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Expense Reports & Analytics</p>
              <p className="text-sm text-gray-400 mt-2">Comprehensive reporting dashboard coming soon</p>
            </div>
          )}
        </div>

        {showReceiptModal && selectedExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold">Receipt - {selectedExpense.merchant}</h3>
                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                    setSelectedExpense(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-center text-gray-500">Receipt preview would display here</p>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default ComprehensiveExpenseModal;
