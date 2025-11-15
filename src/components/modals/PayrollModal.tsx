import React, { useState, useEffect } from 'react';
import {
  DollarSign, Calendar, Users, CheckCircle, AlertTriangle, Play, FileText, Download,
  Eye, Filter, Search, X, Clock, TrendingUp, AlertCircle, Zap, Brain,
  ArrowRight, ChevronRight, Shield, Target, RefreshCw, CheckSquare, XCircle,
  Info, Edit2, Save, BarChart3, PieChart, TrendingDown, Heart, Calendar as CalendarIcon, Receipt, Globe, Bell
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { formatCurrency, Currency, sumByCurrency, getCurrencySymbol, getCurrencyFlag } from '../../utils/currencyUtils';
import { EmployeePayrollDetailModal } from './EmployeePayrollDetailModal';
import { PayrollWizardModal } from './PayrollWizardModal';
import LeaveManagementModal from './LeaveManagementModal';
import AutoFixReviewModal from './AutoFixReviewModal';
import CorrectionRequestModal from './CorrectionRequestModal';
import { apiRequest, queryClient } from '../../lib/queryClient';
import { useQuery } from '@tanstack/react-query';

interface TimesheetEntry {
  date: string;
  day: string;
  regularHours: number;
  overtimeHours: number;
  ptoHours: number;
  sickHours: number;
  unpaidLeaveHours: number;
  notes?: string;
}

interface Employee {
  id: string;
  name: string;
  department: string;
  employeeType: 'Hourly' | 'Salaried';
  hourlyRate?: number;
  salary?: number;
  regularHours?: number;
  overtimeHours?: number;
  sickHours?: number;
  ptoHours?: number;
  unpaidLeaveHours?: number;
  grossPay: number;
  deductions: number;
  taxes: number;
  expenses?: number;
  netPay: number;
  currency?: string;
  status: 'Verified' | 'Needs Review' | 'Error' | 'Pending';
  timesheetApproved?: boolean;
  timesheetApprovedBy?: string;
  timesheetApprovedAt?: string;
  pendingLeaveRequests?: number;
  pendingExpenses?: number;
  approvedExpenses?: number;
  errors?: string[];
  warnings?: string[];
  timesheetEntries?: TimesheetEntry[];
}

interface AIInsight {
  id: string;
  type: 'error' | 'warning' | 'suggestion' | 'info';
  category: string;
  title: string;
  description: string;
  affectedEmployees: string[];
  impact: 'High' | 'Medium' | 'Low';
  autoFixAvailable: boolean;
  action?: () => void;
}

interface PayrollModalProps {
  onClose?: () => void;
  onOpenStudioAI?: () => void;
}

const PayrollModal: React.FC<PayrollModalProps> = ({ onClose, onOpenStudioAI }) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);

  useEffect(() => {
    loadCurrencies();
  }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const loadCurrencies = async () => {
    try {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      if (data) {
        setCurrencies(data);
      }
    } catch (error) {
      console.error('Error loading currencies:', error);
    } finally {
      setIsLoadingCurrencies(false);
    }
  };

  const [currentStep, setCurrentStep] = useState<'select-type' | 'review' | 'ai-check' | 'final-review' | 'processing' | 'complete'>('select-type');
  const [payrollType, setPayrollType] = useState<'Hourly' | 'Salaried' | 'Both' | null>(null);
  const [activeTab, setActiveTab] = useState('employees');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiAnalysisComplete, setAiAnalysisComplete] = useState(false);
  const [selectedEmployeeTimesheet, setSelectedEmployeeTimesheet] = useState<Employee | null>(null);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<Employee | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [editingEntryIndex, setEditingEntryIndex] = useState<number | null>(null);
  const [showCorrectionRequestModal, setShowCorrectionRequestModal] = useState(false);

  // Query for pending correction requests
  const { data: correctionRequests = [] } = useQuery<any[]>({
    queryKey: ['/api/timesheet-corrections'],
  });

  const pendingCorrectionCount = correctionRequests?.filter((req: any) => req.status === 'Pending').length || 0;
  const [editedEntry, setEditedEntry] = useState<TimesheetEntry | null>(null);
  const [isSavingTimesheet, setIsSavingTimesheet] = useState(false);
  const [isSavingTimesheets, setIsSavingTimesheets] = useState(false);
  const [timesheetsSaved, setTimesheetsSaved] = useState(false);
  
  // Calculate pay period (current bi-weekly period)
  const getPayPeriod = () => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const days = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil(days / 7);
    const payPeriodNumber = Math.floor((weekNumber - 1) / 2);
    
    const periodStartDate = new Date(startOfYear);
    periodStartDate.setDate(periodStartDate.getDate() + (payPeriodNumber * 14));
    
    const periodEndDate = new Date(periodStartDate);
    periodEndDate.setDate(periodEndDate.getDate() + 13);
    
    return {
      start: periodStartDate.toISOString().split('T')[0],
      end: periodEndDate.toISOString().split('T')[0]
    };
  };
  
  const [payPeriod] = useState(getPayPeriod());
  const [autoFixSuggestions, setAutoFixSuggestions] = useState<any[]>([]);
  const [selectedFixForReview, setSelectedFixForReview] = useState<any | null>(null);
  const [isLoadingAutoFixes, setIsLoadingAutoFixes] = useState(false);
  const [isApprovingFix, setIsApprovingFix] = useState(false);
  const [leaveNavigationParams, setLeaveNavigationParams] = useState<{
    employeeId: string;
    employeeName: string;
    department: string;
    date?: string;
    type?: 'PTO' | 'Sick';
  } | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      department: 'Engineering',
      employeeType: 'Hourly',
      hourlyRate: 45,
      regularHours: 80,
      overtimeHours: 8,
      sickHours: 0,
      ptoHours: 0,
      unpaidLeaveHours: 0,
      grossPay: 4140,
      deductions: 620,
      taxes: 1035,
      expenses: 0,
      netPay: 2485,
      currency: 'USD',
      status: 'Needs Review',
      timesheetApproved: true,
      timesheetApprovedBy: 'John Smith (Manager)',
      timesheetApprovedAt: '2025-01-18 14:30',
      pendingLeaveRequests: 0,
      pendingExpenses: 0,
      approvedExpenses: 0,
      warnings: ['Overtime hours exceed department average by 15%'],
      timesheetEntries: [
        { date: '2025-01-06', day: 'Mon', regularHours: 8, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-07', day: 'Tue', regularHours: 8, overtimeHours: 1, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-08', day: 'Wed', regularHours: 8, overtimeHours: 2, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-09', day: 'Thu', regularHours: 8, overtimeHours: 2, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-10', day: 'Fri', regularHours: 8, overtimeHours: 3, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-11', day: 'Sat', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-12', day: 'Sun', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-13', day: 'Mon', regularHours: 8, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-14', day: 'Tue', regularHours: 8, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-15', day: 'Wed', regularHours: 8, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-16', day: 'Thu', regularHours: 8, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-17', day: 'Fri', regularHours: 8, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-18', day: 'Sat', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-19', day: 'Sun', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 }
      ]
    },
    {
      id: '2',
      name: 'Mike Chen',
      department: 'Engineering',
      employeeType: 'Salaried',
      salary: 120000,
      regularHours: 0,
      overtimeHours: 0,
      sickHours: 0,
      ptoHours: 8,
      unpaidLeaveHours: 0,
      grossPay: 4615,
      deductions: 850,
      taxes: 1155,
      expenses: 250,
      netPay: 2865,
      currency: 'USD',
      status: 'Verified',
      timesheetApproved: true,
      timesheetApprovedBy: 'John Smith (Manager)',
      timesheetApprovedAt: '2025-01-17 10:15',
      pendingLeaveRequests: 0,
      pendingExpenses: 0,
      approvedExpenses: 1,
      timesheetEntries: [
        { date: '2025-01-06', day: 'Mon', regularHours: 0, overtimeHours: 0, ptoHours: 8, sickHours: 0, unpaidLeaveHours: 0, notes: 'PTO - Family Event' },
        { date: '2025-01-07', day: 'Tue', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-08', day: 'Wed', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-09', day: 'Thu', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-10', day: 'Fri', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-11', day: 'Sat', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-12', day: 'Sun', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-13', day: 'Mon', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-14', day: 'Tue', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-15', day: 'Wed', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-16', day: 'Thu', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-17', day: 'Fri', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-18', day: 'Sat', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-19', day: 'Sun', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 }
      ]
    },
    {
      id: '3',
      name: 'Lisa Rodriguez',
      department: 'Marketing',
      employeeType: 'Hourly',
      hourlyRate: 38,
      regularHours: 80,
      overtimeHours: 0,
      sickHours: 0,
      ptoHours: 0,
      unpaidLeaveHours: 0,
      grossPay: 3040,
      deductions: 455,
      taxes: 760,
      expenses: 0,
      netPay: 1825,
      currency: 'EUR',
      status: 'Verified',
      timesheetApproved: true,
      timesheetApprovedBy: 'Sarah Lee (Manager)',
      timesheetApprovedAt: '2025-01-18 09:45',
      pendingLeaveRequests: 0,
      pendingExpenses: 0,
      approvedExpenses: 0
    },
    {
      id: '4',
      name: 'David Kim',
      department: 'Sales',
      employeeType: 'Salaried',
      salary: 95000,
      sickHours: 0,
      ptoHours: 0,
      currency: 'GBP',
      unpaidLeaveHours: 0,
      grossPay: 3654,
      deductions: 548,
      taxes: 914,
      expenses: 425,
      netPay: 2617,
      status: 'Verified',
      timesheetApproved: true,
      timesheetApprovedBy: 'Mary Johnson (Manager)',
      timesheetApprovedAt: '2025-01-18 11:20',
      pendingLeaveRequests: 0,
      pendingExpenses: 0,
      approvedExpenses: 2
    },
    {
      id: '5',
      name: 'Emma Wilson',
      department: 'HR',
      employeeType: 'Hourly',
      hourlyRate: 42,
      regularHours: 78,
      overtimeHours: 5,
      sickHours: 0,
      ptoHours: 0,
      unpaidLeaveHours: 0,
      grossPay: 3591,
      deductions: 539,
      taxes: 898,
      expenses: 0,
      netPay: 2154,
      status: 'Needs Review',
      timesheetApproved: false,
      timesheetApprovedBy: undefined,
      timesheetApprovedAt: undefined,
      pendingLeaveRequests: 0,
      pendingExpenses: 1,
      approvedExpenses: 0,
      warnings: ['Missing timesheet approval from manager', 'Has 1 pending expense for $85'],
      timesheetEntries: [
        { date: '2025-01-06', day: 'Mon', regularHours: 8, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-07', day: 'Tue', regularHours: 8, overtimeHours: 1, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-08', day: 'Wed', regularHours: 8, overtimeHours: 1, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-09', day: 'Thu', regularHours: 8, overtimeHours: 1, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-10', day: 'Fri', regularHours: 8, overtimeHours: 2, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-11', day: 'Sat', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-12', day: 'Sun', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-13', day: 'Mon', regularHours: 8, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-14', day: 'Tue', regularHours: 8, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-15', day: 'Wed', regularHours: 6, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 2, notes: 'Left early - family emergency' },
        { date: '2025-01-16', day: 'Thu', regularHours: 8, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-17', day: 'Fri', regularHours: 8, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-18', day: 'Sat', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 },
        { date: '2025-01-19', day: 'Sun', regularHours: 0, overtimeHours: 0, ptoHours: 0, sickHours: 0, unpaidLeaveHours: 0 }
      ]
    }
  ]);

  const [aiInsights, setAiInsights] = useState<AIInsight[]>([
    {
      id: '1',
      type: 'error',
      category: 'Tax Calculation',
      title: 'Tax Calculation Mismatch Detected',
      description: 'Lisa Rodriguez has a tax calculation discrepancy. The system calculated $740 but should be $760 based on current tax brackets.',
      affectedEmployees: ['Lisa Rodriguez'],
      impact: 'High',
      autoFixAvailable: true
    },
    {
      id: '2',
      type: 'warning',
      category: 'Overtime',
      title: 'Unusual Overtime Hours',
      description: 'Sarah Johnson worked 8 hours of overtime, which is 15% above the department average. This may require manager approval.',
      affectedEmployees: ['Sarah Johnson'],
      impact: 'Medium',
      autoFixAvailable: false
    },
    {
      id: '3',
      type: 'warning',
      category: 'Approval',
      title: 'Missing Timesheet Approval',
      description: 'Emma Wilson\'s timesheet has not been approved by their manager. Processing without approval may violate company policy.',
      affectedEmployees: ['Emma Wilson'],
      impact: 'High',
      autoFixAvailable: true
    },
    {
      id: '4',
      type: 'suggestion',
      category: 'Optimization',
      title: 'Potential Cost Savings',
      description: '3 employees are approaching overtime threshold. Consider schedule adjustments to reduce overtime costs by approximately $2,400 this period.',
      affectedEmployees: ['Sarah Johnson', 'Emma Wilson', 'James Taylor'],
      impact: 'Medium',
      autoFixAvailable: false
    },
    {
      id: '5',
      type: 'info',
      category: 'Compliance',
      title: 'State Minimum Wage Compliance',
      description: 'All hourly employees meet or exceed the updated state minimum wage requirements ($15.50/hr as of Jan 1, 2025).',
      affectedEmployees: [],
      impact: 'Low',
      autoFixAvailable: false
    }
  ]);

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const runAIAnalysis = async () => {
    setShowAIInsights(true);
    setAiAnalysisComplete(false);
    setIsLoadingAutoFixes(false);
    setAutoFixSuggestions([]);

    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2500));

    setAiAnalysisComplete(true);
    const errors = aiInsights.filter(i => i.type === 'error').length;
    const warnings = aiInsights.filter(i => i.type === 'warning').length;
    const suggestions = aiInsights.filter(i => i.type === 'suggestion').length;
    showNotification('success', `AI analysis complete! Found ${errors} error${errors !== 1 ? 's' : ''}, ${warnings} warning${warnings !== 1 ? 's' : ''}, and ${suggestions} suggestion${suggestions !== 1 ? 's' : ''}.`);

    // After AI validation, fetch auto-fix suggestions
    await fetchAutoFixSuggestions();
  };

  const fetchAutoFixSuggestions = async () => {
    setIsLoadingAutoFixes(true);
    
    try {
      // Create a mock validation result based on current insights
      const validation = {
        score: 75,
        criticalIssues: aiInsights
          .filter(i => i.type === 'error')
          .map(insight => ({
            employeeId: employees.find(e => insight.affectedEmployees.includes(e.name))?.id || '',
            employeeName: insight.affectedEmployees[0] || '',
            issue: insight.title,
            suggestion: insight.description
          })),
        warnings: aiInsights
          .filter(i => i.type === 'warning')
          .map(insight => ({
            employeeId: employees.find(e => insight.affectedEmployees.includes(e.name))?.id || '',
            employeeName: insight.affectedEmployees[0] || '',
            warning: insight.title,
            suggestion: insight.description
          })),
        summary: 'AI analysis complete',
        recommendations: []
      };

      const response = await apiRequest('/api/ai-payroll/auto-fix-suggestions', {
        method: 'POST',
        body: JSON.stringify({
          validation,
          employees: filteredEmployees.map(emp => ({
            id: emp.id,
            name: emp.name,
            department: emp.department,
            employeeType: emp.employeeType,
            hourlyRate: emp.hourlyRate,
            salary: emp.salary,
            regularHours: emp.regularHours,
            overtimeHours: emp.overtimeHours,
            grossPay: emp.grossPay,
            deductions: emp.deductions,
            taxes: emp.taxes,
            netPay: emp.netPay,
            status: emp.status,
            errors: emp.errors,
            warnings: emp.warnings
          }))
        })
      });

      if (response.success && response.suggestions) {
        setAutoFixSuggestions(response.suggestions);
        if (response.suggestions.length > 0) {
          showNotification('info', `Found ${response.suggestions.length} auto-fix suggestion${response.suggestions.length !== 1 ? 's' : ''} available for review.`);
        }
      }
    } catch (error: any) {
      console.error('Error fetching auto-fix suggestions:', error);
      showNotification('error', error.message || 'Failed to fetch auto-fix suggestions');
    } finally {
      setIsLoadingAutoFixes(false);
    }
  };

  const autoFixError = (insightId: string) => {
    const insight = aiInsights.find(i => i.id === insightId);
    if (!insight) return;

    if (insightId === '1') {
      // Fix Lisa's tax calculation
      setEmployees(prev => prev.map(emp =>
        emp.name === 'Lisa Rodriguez'
          ? { ...emp, taxes: 760, netPay: 1825, status: 'Verified', errors: [] }
          : emp
      ));

      // Remove the error insight from the list
      setAiInsights(prev => prev.filter(i => i.id !== insightId));

      showNotification('success', 'Tax calculation corrected for Lisa Rodriguez');
    } else if (insightId === '3') {
      // Mark Emma Wilson's timesheet as approved
      setEmployees(prev => prev.map(emp =>
        emp.name === 'Emma Wilson'
          ? { ...emp, status: 'Verified', warnings: [] }
          : emp
      ));

      // Remove the warning insight from the list
      setAiInsights(prev => prev.filter(i => i.id !== insightId));

      showNotification('success', 'Timesheet approval granted for Emma Wilson');
    }
  };

  const handleApproveAutoFix = async (reason?: string) => {
    if (!selectedFixForReview) return;

    setIsApprovingFix(true);
    
    try {
      const response = await apiRequest('/api/auto-fix/approve', {
        method: 'POST',
        body: JSON.stringify({
          fixId: selectedFixForReview.id,
          fixData: selectedFixForReview,
          reason: reason || undefined
        })
      });

      if (response.success) {
        // Apply the fix to local state
        const affectedEmployeeIds = selectedFixForReview.affectedEmployees.map((e: any) => e.id);
        
        setEmployees(prev => prev.map(emp => {
          if (affectedEmployeeIds.includes(emp.id)) {
            // Update based on fix type
            if (selectedFixForReview.type === 'tax_calculation') {
              return {
                ...emp,
                taxes: selectedFixForReview.afterState.taxes,
                netPay: selectedFixForReview.afterState.netPay,
                status: 'Verified' as const,
                errors: []
              };
            } else if (selectedFixForReview.type === 'timesheet_approval') {
              return {
                ...emp,
                timesheetApproved: true,
                timesheetApprovedBy: 'HR Department (Auto-Approved)',
                timesheetApprovedAt: new Date().toLocaleString(),
                status: 'Verified' as const,
                warnings: emp.warnings?.filter(w => !w.includes('approval')) || []
              };
            }
          }
          return emp;
        }));

        // Remove the auto-fix suggestion from the list
        setAutoFixSuggestions(prev => prev.filter(s => s.id !== selectedFixForReview.id));

        // Remove corresponding insight from the list
        setAiInsights(prev => prev.filter(insight => 
          !selectedFixForReview.affectedEmployees.some((emp: any) => 
            insight.affectedEmployees.includes(emp.name)
          )
        ));

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/payroll'] });
        
        showNotification('success', `Auto-fix approved and applied successfully!`);
        
        // Close the modal
        setSelectedFixForReview(null);
      }
    } catch (error: any) {
      console.error('Error approving auto-fix:', error);
      showNotification('error', error.message || 'Failed to approve auto-fix');
      throw error; // Re-throw to let modal handle it
    } finally {
      setIsApprovingFix(false);
    }
  };

  const handleProceedToReview = () => {
    if (!payrollType) {
      showNotification('error', 'Please select a payroll type');
      return;
    }
    setCurrentStep('review');
  };

  const handleProceedToAICheck = async () => {
    // Save timesheets to database before proceeding to AI check
    if (!timesheetsSaved) {
      setIsSavingTimesheets(true);
      try {
        const timesheets = filteredEmployees.map(emp => ({
          employeeId: emp.id,
          regularHours: emp.regularHours || 0,
          overtimeHours: emp.overtimeHours || 0,
          ptoHours: emp.ptoHours || 0,
          sickHours: emp.sickHours || 0,
          notes: null
        }));

        await apiRequest('/api/timesheets/bulk-save', {
          method: 'POST',
          body: JSON.stringify({
            timesheets,
            payPeriodStart: payPeriod.start,
            payPeriodEnd: payPeriod.end
          })
        });

        setTimesheetsSaved(true);
        showNotification('success', 'Timesheets saved to database successfully');
      } catch (error: any) {
        console.error('Error saving timesheets:', error);
        showNotification('error', 'Failed to save timesheets: ' + (error.message || 'Unknown error'));
        setIsSavingTimesheets(false);
        return; // Don't proceed if save failed
      } finally {
        setIsSavingTimesheets(false);
      }
    }
    
    setCurrentStep('ai-check');
    runAIAnalysis();
  };

  const handleProceedToFinalReview = () => {
    const criticalIssues = aiInsights.filter(i => i.type === 'error' || (i.type === 'warning' && i.impact === 'High'));
    if (criticalIssues.length > 0) {
      showNotification('error', 'Please resolve all critical issues before proceeding');
      return;
    }
    setCurrentStep('final-review');
  };

  const handleProcessPayroll = async () => {
    // Validation: Ensure timesheets are saved before processing
    if (!timesheetsSaved) {
      showNotification('error', 'Timesheets must be saved before processing payroll');
      return;
    }

    // Additional validation: Check if timesheets are approved
    try {
      const approvedTimesheets = await apiRequest(`/api/timesheets/approved?payPeriodStart=${payPeriod.start}&payPeriodEnd=${payPeriod.end}`);
      
      if (!approvedTimesheets || approvedTimesheets.length === 0) {
        showNotification('error', 'No approved timesheets found. Timesheets must be approved before processing payroll.');
        return;
      }

      // Check if all filtered employees have approved timesheets
      const employeesWithoutTimesheets = filteredEmployees.filter(emp => 
        !approvedTimesheets.some((ts: any) => ts.employeeId === emp.id)
      );

      if (employeesWithoutTimesheets.length > 0) {
        showNotification('error', 
          `${employeesWithoutTimesheets.length} employee(s) do not have approved timesheets. All timesheets must be approved before processing payroll.`
        );
        return;
      }
    } catch (error: any) {
      console.error('Error checking approved timesheets:', error);
      showNotification('error', 'Failed to verify timesheet approvals: ' + (error.message || 'Unknown error'));
      return;
    }

    setCurrentStep('processing');

    // Simulate payroll processing
    await new Promise(resolve => setTimeout(resolve, 3500));

    setCurrentStep('complete');
  };

  const handleSaveEmployeeChanges = (updatedEmployee: Employee) => {
    setEmployees(prev => prev.map(emp =>
      emp.id === updatedEmployee.id ? updatedEmployee : emp
    ));
    showNotification('success', `Updated payroll for ${updatedEmployee.name}`);
  };

  const handleEditEntry = (index: number, entry: TimesheetEntry) => {
    setEditingEntryIndex(index);
    setEditedEntry({ ...entry });
  };

  const handleCancelEdit = () => {
    setEditingEntryIndex(null);
    setEditedEntry(null);
  };

  const handleSaveEntry = async () => {
    if (!editedEntry || editingEntryIndex === null || !selectedEmployeeTimesheet) return;

    setIsSavingTimesheet(true);
    
    try {
      // Update the timesheet entry in the local state
      const updatedEntries = [...(selectedEmployeeTimesheet.timesheetEntries || [])];
      updatedEntries[editingEntryIndex] = editedEntry;

      // Recalculate totals
      const newRegularHours = updatedEntries.reduce((sum, e) => sum + e.regularHours, 0);
      const newOvertimeHours = updatedEntries.reduce((sum, e) => sum + e.overtimeHours, 0);
      const newPtoHours = updatedEntries.reduce((sum, e) => sum + e.ptoHours, 0);
      const newSickHours = updatedEntries.reduce((sum, e) => sum + e.sickHours, 0);
      const newUnpaidHours = updatedEntries.reduce((sum, e) => sum + e.unpaidLeaveHours, 0);

      // Update the selected employee timesheet
      const updatedTimesheet = {
        ...selectedEmployeeTimesheet,
        timesheetEntries: updatedEntries,
        regularHours: newRegularHours,
        overtimeHours: newOvertimeHours,
        ptoHours: newPtoHours,
        sickHours: newSickHours,
        unpaidLeaveHours: newUnpaidHours
      };

      setSelectedEmployeeTimesheet(updatedTimesheet);

      // Update the employee in the main employees list
      setEmployees(prev => prev.map(emp =>
        emp.id === selectedEmployeeTimesheet.id ? updatedTimesheet : emp
      ));

      showNotification('success', 'Timesheet entry updated successfully');
      setEditingEntryIndex(null);
      setEditedEntry(null);
    } catch (error: any) {
      console.error('Error saving timesheet entry:', error);
      showNotification('error', 'Failed to save timesheet entry: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSavingTimesheet(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    if (payrollType !== 'Both' && emp.employeeType !== payrollType) return false;
    if (selectedCurrency !== 'all' && emp.currency !== selectedCurrency) return false;
    return true;
  });

  const totalsByCurrency = filteredEmployees.reduce((acc, emp) => {
    const curr = emp.currency || 'USD';
    if (!acc[curr]) {
      acc[curr] = { gross: 0, net: 0, taxes: 0, deductions: 0, count: 0 };
    }
    acc[curr].gross += emp.grossPay;
    acc[curr].net += emp.netPay;
    acc[curr].taxes += emp.taxes;
    acc[curr].deductions += emp.deductions;
    acc[curr].count++;
    return acc;
  }, {} as Record<string, { gross: number; net: number; taxes: number; deductions: number; count: number }>);

  const totalGross = filteredEmployees.reduce((sum, emp) => sum + emp.grossPay, 0);
  const totalNet = filteredEmployees.reduce((sum, emp) => sum + emp.netPay, 0);
  const totalTaxes = filteredEmployees.reduce((sum, emp) => sum + emp.taxes, 0);
  const totalDeductions = filteredEmployees.reduce((sum, emp) => sum + emp.deductions, 0);
  const employeeCount = filteredEmployees.length;
  const currenciesInUse = Object.keys(totalsByCurrency);

  const errorCount = aiInsights.filter(i => i.type === 'error').length;
  const warningCount = aiInsights.filter(i => i.type === 'warning').length;
  const criticalIssuesCount = aiInsights.filter(i => i.type === 'error' || (i.type === 'warning' && i.impact === 'High')).length;
  const verifiedCount = aiInsights.filter(i => i.type === 'info').length + employees.filter(e => e.status === 'Verified').length;

  // Step 1: Select Payroll Type
  if (currentStep === 'select-type') {
    return (
      <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">Payroll Management</h2>
            <p className="text-gray-600 dark:text-gray-400">AI-powered payroll processing with error detection</p>
          </div>
          <div className="flex items-center space-x-3">
            {pendingCorrectionCount > 0 && (
              <button
                onClick={() => setShowCorrectionRequestModal(true)}
                className="relative bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-400 px-4 py-2 rounded-lg transition-all flex items-center text-sm shadow-md hover:shadow-lg font-medium border border-orange-300 dark:border-orange-700"
                data-testid="button-correction-requests"
              >
                <Bell className="h-4 w-4 mr-1" />
                <span className="mr-2">Correction Requests</span>
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
                  {pendingCorrectionCount}
                </span>
              </button>
            )}
            {onOpenStudioAI && (
              <button
                onClick={onOpenStudioAI}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all flex items-center text-sm shadow-md hover:shadow-lg font-medium"
                data-testid="button-open-studio-ai-payroll"
              >
                <Brain className="h-4 w-4 mr-1" />
                Ask Studio AI
              </button>
            )}
          </div>
        </div>

        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="bg-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-4">
                <DollarSign className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">Start Payroll Processing</h3>
              <p className="text-gray-600 dark:text-gray-400">Select the type of payroll you want to process for this pay period</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <button
                onClick={() => setPayrollType('Hourly')}
                className={`p-6 border-2 rounded-xl transition-all hover:shadow-lg ${
                  payrollType === 'Hourly'
                    ? 'border-blue-500 bg-blue-50 dark:bg-gray-800 shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400 dark:bg-gray-800'
                }`}
              >
                <div className="text-center">
                  <div className={`rounded-full p-3 w-16 h-16 mx-auto mb-4 ${
                    payrollType === 'Hourly' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Clock className={`h-10 w-10 ${payrollType === 'Hourly' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hourly Employees</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Process payroll based on timesheets and hourly rates</p>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">45</div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Employees</p>
                </div>
              </button>

              <button
                onClick={() => setPayrollType('Salaried')}
                className={`p-6 border-2 rounded-xl transition-all hover:shadow-lg ${
                  payrollType === 'Salaried'
                    ? 'border-green-500 bg-green-50 dark:bg-gray-800 shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-400 dark:bg-gray-800'
                }`}
              >
                <div className="text-center">
                  <div className={`rounded-full p-3 w-16 h-16 mx-auto mb-4 ${
                    payrollType === 'Salaried' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Calendar className={`h-10 w-10 ${payrollType === 'Salaried' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Salaried Employees</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Process fixed salary payments</p>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">202</div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Employees</p>
                </div>
              </button>

              <button
                onClick={() => setPayrollType('Both')}
                className={`p-6 border-2 rounded-xl transition-all hover:shadow-lg ${
                  payrollType === 'Both'
                    ? 'border-purple-500 bg-purple-50 dark:bg-gray-800 shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-400 dark:bg-gray-800'
                }`}
              >
                <div className="text-center">
                  <div className={`rounded-full p-3 w-16 h-16 mx-auto mb-4 ${
                    payrollType === 'Both' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Users className={`h-10 w-10 ${payrollType === 'Both' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">All Employees</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Process complete payroll for all employees</p>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">247</div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Employees</p>
                </div>
              </button>
            </div>

            {payrollType && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">What happens next?</h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white dark:text-white">Step 1: Review Employee Data</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Verify hours, rates, and deductions for all employees</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white dark:text-white">Step 2: AI Error Detection</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Our AI will scan for errors, anomalies, and optimization opportunities</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white dark:text-white">Step 3: Final Review & Approval</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Review summary and approve payroll for processing</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white dark:text-white">Step 4: Process & Distribute</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Payments will be processed and distributed automatically</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  if (!payrollType) {
                    showNotification('error', 'Please select a payroll type');
                    return;
                  }
                  setShowWizard(true);
                }}
                disabled={!payrollType}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-lg font-medium shadow-lg"
                data-testid="button-start-wizard"
              >
                <Zap className="h-5 w-5 mr-2" />
                Start Guided Payroll
              </button>
              
              <button
                onClick={handleProceedToReview}
                disabled={!payrollType}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-lg font-medium"
                data-testid="button-continue-manual"
              >
                Continue to Review
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Wizard Modal */}
      {showWizard && (
        <PayrollWizardModal
          onClose={() => setShowWizard(false)}
          onOpenStudioAI={onOpenStudioAI}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[80] flex items-center text-white ${
          notification.type === 'success' ? 'bg-green-600' :
          notification.type === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          {notification.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
          {notification.type === 'error' && <XCircle className="h-5 w-5 mr-2" />}
          {notification.type === 'info' && <Info className="h-5 w-5 mr-2" />}
          <span>{notification.message}</span>
        </div>
      )}
      </>
    );
  }

  // Step 2: Review Employee Data
  if (currentStep === 'review') {
    return (
      <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">Review Payroll Data</h2>
            <p className="text-gray-600 dark:text-gray-400">Step 1 of 4: Verify employee hours, rates, and calculations</p>
          </div>
          <button
            onClick={() => setCurrentStep('select-type')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 flex items-center"
          >
            <ArrowRight className="h-5 w-5 transform rotate-180 mr-2" />
            Back
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">Step 1: Review Data</span>
            <span className="text-sm text-gray-500">25% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>

        {/* Currency Filter */}
        {currenciesInUse.length > 1 && (
          <div className="px-6 pb-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Multi-Currency Payroll</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {currenciesInUse.length} currencies detected: {currenciesInUse.map(c => getCurrencySymbol(c)).join(', ')}
                    </p>
                  </div>
                </div>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                >
                  <option value="all">All Currencies ({employeeCount})</option>
                  {currenciesInUse.map(curr => (
                    <option key={curr} value={curr}>
                      {getCurrencyFlag(curr)} {curr} ({totalsByCurrency[curr].count} employees)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="p-6">
          {/* Timesheet Quick Review */}
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Timesheet Hours Summary (Bi-Weekly Pay Period)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Regular</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Overtime</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">PTO</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sick</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Unpaid</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase font-bold">Total Hours</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmployees.map((emp) => {
                    const totalHours = (emp.regularHours || 0) + (emp.overtimeHours || 0) + (emp.ptoHours || 0) + (emp.sickHours || 0) + (emp.unpaidLeaveHours || 0);
                    const isMissingHours = totalHours < 80;
                    const isOvertime = (emp.overtimeHours || 0) > 0;

                    return (
                      <tr
                        key={emp.id}
                        className={`${isMissingHours ? 'bg-red-50' : 'hover:bg-gray-50'} cursor-pointer transition-colors`}
                        onClick={() => setSelectedEmployeeTimesheet(emp)}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white dark:text-white">{emp.name}</div>
                            <div className="text-xs text-gray-500">{emp.department}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            emp.employeeType === 'Hourly'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {emp.employeeType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-900 dark:text-white dark:text-white font-medium">
                          {emp.regularHours || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(emp.overtimeHours || 0) > 0 ? (
                            <span className="font-medium text-orange-600">{emp.overtimeHours}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(emp.ptoHours || 0) > 0 ? (
                            <span className="font-medium text-green-600">{emp.ptoHours}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(emp.sickHours || 0) > 0 ? (
                            <span className="font-medium text-blue-600">{emp.sickHours}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(emp.unpaidLeaveHours || 0) > 0 ? (
                            <span className="font-medium text-gray-600 dark:text-gray-400">{emp.unpaidLeaveHours}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`text-lg font-bold ${
                              isMissingHours ? 'text-red-600' : totalHours === 80 ? 'text-green-600' : 'text-gray-900'
                            }`}>
                              {totalHours}
                            </span>
                            <span className="text-sm text-gray-500">/ 80</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isMissingHours ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Missing {80 - totalHours}h
                            </span>
                          ) : totalHours === 80 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Clock className="h-3 w-3 mr-1" />
                              {totalHours - 80}h over
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {emp.timesheetApproved ? (
                            <div className="flex items-center gap-1 text-xs text-green-700">
                              <CheckCircle className="h-4 w-4" />
                              <span>Approved</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-red-700">
                              <XCircle className="h-4 w-4" />
                              <button className="underline hover:no-underline">
                                Pending
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Missing Hours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Complete (80 hours)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Over 80 hours</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-6 w-6 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">{payrollType}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{employeeCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Employees</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                {currenciesInUse.length > 1 && <Globe className="h-4 w-4 text-green-600" />}
              </div>
              {selectedCurrency === 'all' && currenciesInUse.length > 1 ? (
                <div className="space-y-1">
                  {currenciesInUse.slice(0, 2).map(curr => (
                    <p key={curr} className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(totalsByCurrency[curr].gross, curr, true)}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">${(totalGross / 1000).toFixed(0)}K</p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">Gross Pay</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-6 w-6 text-purple-600" />
                {currenciesInUse.length > 1 && <Globe className="h-4 w-4 text-purple-600" />}
              </div>
              {selectedCurrency === 'all' && currenciesInUse.length > 1 ? (
                <div className="space-y-1">
                  {currenciesInUse.slice(0, 2).map(curr => (
                    <p key={curr} className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(totalsByCurrency[curr].net, curr, true)}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">${(totalNet / 1000).toFixed(0)}K</p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">Net Pay</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">${(totalTaxes / 1000).toFixed(0)}K</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taxes</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">${(totalDeductions / 1000).toFixed(0)}K</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Deductions</p>
            </div>
          </div>

          {/* Employee Table with Detailed Information */}
          <div className="space-y-3 mb-6">
            {filteredEmployees.map((emp) => (
              <div key={emp.id} className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white dark:text-white">{emp.name}</h3>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{emp.department}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          emp.employeeType === 'Hourly'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {emp.employeeType}
                        </span>
                        {emp.currency && emp.currency !== 'USD' && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {getCurrencyFlag(emp.currency)} {emp.currency}
                          </span>
                        )}
                      </div>

                      {/* Hours Breakdown */}
                      <div className="flex gap-4 text-sm mb-3">
                        {emp.employeeType === 'Hourly' && (
                          <>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Regular: <strong>{emp.regularHours}h</strong></span>
                            </div>
                            {emp.overtimeHours! > 0 && (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                <span className="text-orange-700">OT: <strong>{emp.overtimeHours}h</strong></span>
                              </div>
                            )}
                          </>
                        )}
                        {emp.sickHours! > 0 && (
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4 text-blue-500" />
                            <span className="text-blue-700">Sick: <strong>{emp.sickHours}h</strong></span>
                          </div>
                        )}
                        {emp.ptoHours! > 0 && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4 text-green-500" />
                            <span className="text-green-700">PTO: <strong>{emp.ptoHours}h</strong></span>
                          </div>
                        )}
                        {emp.unpaidLeaveHours! > 0 && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Unpaid: <strong>{emp.unpaidLeaveHours}h</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Timesheet Approval Status */}
                      <div className="mb-3">
                        {emp.timesheetApproved ? (
                          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg inline-block">
                            <CheckCircle className="h-4 w-4" />
                            <span>Timesheet Approved by {emp.timesheetApprovedBy} on {emp.timesheetApprovedAt}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg inline-block">
                            <XCircle className="h-4 w-4" />
                            <span className="font-medium">Timesheet Pending Manager Approval</span>
                            <button 
                              onClick={() => {
                                // TODO: Implement send reminder functionality
                                console.log('Send reminder to manager for', emp.name);
                              }}
                              className="ml-2 text-blue-600 hover:text-blue-700 underline text-xs"
                              data-testid="button-send-reminder"
                            >
                              Send Reminder
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Expenses */}
                      {(emp.approvedExpenses! > 0 || emp.pendingExpenses! > 0) && (
                        <div className="flex gap-3 text-sm mb-3">
                          {emp.approvedExpenses! > 0 && (
                            <div className="flex items-center gap-1 text-green-700 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                              <CheckCircle className="h-4 w-4" />
                              <span>{emp.approvedExpenses} approved expense(s): +${emp.expenses}</span>
                            </div>
                          )}
                          {emp.pendingExpenses! > 0 && (
                            <div className="flex items-center gap-1 text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                              <Clock className="h-4 w-4" />
                              <span>{emp.pendingExpenses} pending expense(s)</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Leave Requests */}
                      {emp.pendingLeaveRequests! > 0 && (
                        <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg mb-3 inline-block">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{emp.pendingLeaveRequests} leave request(s) pending approval</span>
                        </div>
                      )}

                      {/* Pay Breakdown */}
                      <div className="grid grid-cols-5 gap-3 text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Gross Pay</p>
                          <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{formatCurrency(emp.grossPay, emp.currency)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Deductions</p>
                          <p className="font-semibold text-red-600">-{formatCurrency(emp.deductions, emp.currency)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Taxes</p>
                          <p className="font-semibold text-red-600">-{formatCurrency(emp.taxes, emp.currency)}</p>
                        </div>
                        {emp.expenses! > 0 && (
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Expenses</p>
                            <p className="font-semibold text-green-600">+{formatCurrency(emp.expenses || 0, emp.currency)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Net Pay</p>
                          <p className="font-bold text-gray-900 dark:text-white dark:text-white text-lg">{formatCurrency(emp.netPay, emp.currency)}</p>
                        </div>
                      </div>

                      {/* Warnings and Errors */}
                      {(emp.warnings && emp.warnings.length > 0) && (
                        <div className="mt-3 space-y-2">
                          {emp.warnings.map((warning, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded">
                              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{warning}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {(emp.errors && emp.errors.length > 0) && (
                        <div className="mt-3 space-y-2">
                          {emp.errors.map((error, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                              <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{error}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <div className="flex items-center justify-end mb-2">
                        {emp.status === 'Verified' && (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="h-5 w-5 mr-1" />
                            <span className="text-sm font-medium">Verified</span>
                          </span>
                        )}
                        {emp.status === 'Needs Review' && (
                          <span className="flex items-center text-yellow-600">
                            <AlertTriangle className="h-5 w-5 mr-1" />
                            <span className="text-sm font-medium">Review</span>
                          </span>
                        )}
                        {emp.status === 'Error' && (
                          <span className="flex items-center text-red-600">
                            <XCircle className="h-5 w-5 mr-1" />
                            <span className="text-sm font-medium">Error</span>
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedEmployeeDetail(emp)}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 ml-auto"
                        data-testid={`button-edit-employee-${emp.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Info className="h-4 w-4 mr-2" />
              Review all employee data before proceeding to AI analysis
            </div>
            <button
              onClick={handleProceedToAICheck}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium"
            >
              Proceed to AI Analysis
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[80] flex items-center text-white ${
          notification.type === 'success' ? 'bg-green-600' :
          notification.type === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          {notification.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
          {notification.type === 'error' && <XCircle className="h-5 w-5 mr-2" />}
          {notification.type === 'info' && <Info className="h-5 w-5 mr-2" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Timesheet Detail Modal */}
      {selectedEmployeeTimesheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedEmployeeTimesheet.name} - Timesheet Details
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {selectedEmployeeTimesheet.department} | Pay Period: Jan 6 - Jan 19, 2025
                </p>
              </div>
              <button
                onClick={() => setSelectedEmployeeTimesheet(null)}
                className="text-white hover:bg-blue-800 rounded-lg p-2 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
              <div className="grid grid-cols-5 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Regular Hours</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{selectedEmployeeTimesheet.regularHours}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200">
                  <p className="text-xs text-orange-700 mb-1 font-medium">Overtime</p>
                  <p className="text-2xl font-bold text-orange-600">{selectedEmployeeTimesheet.overtimeHours}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200">
                  <p className="text-xs text-green-700 mb-1 font-medium">PTO</p>
                  <p className="text-2xl font-bold text-green-600">{selectedEmployeeTimesheet.ptoHours}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-blue-700 mb-1 font-medium">Sick</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedEmployeeTimesheet.sickHours}</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
                    {(selectedEmployeeTimesheet.regularHours || 0) +
                      (selectedEmployeeTimesheet.overtimeHours || 0) +
                      (selectedEmployeeTimesheet.ptoHours || 0) +
                      (selectedEmployeeTimesheet.sickHours || 0) +
                      (selectedEmployeeTimesheet.unpaidLeaveHours || 0)}
                  </p>
                </div>
              </div>

              {selectedEmployeeTimesheet.timesheetApproved ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">Timesheet Approved</p>
                    <p className="text-sm text-green-700">
                      Approved by {selectedEmployeeTimesheet.timesheetApprovedBy} on {selectedEmployeeTimesheet.timesheetApprovedAt}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-900">Pending Manager Approval</p>
                    <p className="text-sm text-red-700">
                      This timesheet requires manager approval before processing payroll
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    Send Reminder
                  </button>
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white">Daily Hours Breakdown</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Edit2 className="h-3 w-3" />
                    Click any row to edit hours
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Regular</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Overtime</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">PTO</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sick</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Unpaid</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedEmployeeTimesheet.timesheetEntries?.map((entry, idx) => {
                        const dayTotal =
                          entry.regularHours +
                          entry.overtimeHours +
                          entry.ptoHours +
                          entry.sickHours +
                          entry.unpaidLeaveHours;
                        const isWeekend = entry.day === 'Sat' || entry.day === 'Sun';
                        const isEditing = editingEntryIndex === idx;

                        if (isEditing && editedEntry) {
                          const editedTotal =
                            editedEntry.regularHours +
                            editedEntry.overtimeHours +
                            editedEntry.ptoHours +
                            editedEntry.sickHours +
                            editedEntry.unpaidLeaveHours;

                          return (
                            <tr key={idx} className="bg-blue-50 dark:bg-blue-900/20">
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{entry.date}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{entry.day}</td>
                              <td className="px-2 py-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={editedEntry.regularHours}
                                  onChange={(e) => setEditedEntry({ ...editedEntry, regularHours: parseFloat(e.target.value) || 0 })}
                                  className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded text-center text-sm"
                                  data-testid="input-regular-hours"
                                />
                              </td>
                              <td className="px-2 py-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={editedEntry.overtimeHours}
                                  onChange={(e) => setEditedEntry({ ...editedEntry, overtimeHours: parseFloat(e.target.value) || 0 })}
                                  className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded text-center text-sm"
                                  data-testid="input-overtime-hours"
                                />
                              </td>
                              <td className="px-2 py-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={editedEntry.ptoHours}
                                  onChange={(e) => setEditedEntry({ ...editedEntry, ptoHours: parseFloat(e.target.value) || 0 })}
                                  className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded text-center text-sm"
                                  data-testid="input-pto-hours"
                                />
                              </td>
                              <td className="px-2 py-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={editedEntry.sickHours}
                                  onChange={(e) => setEditedEntry({ ...editedEntry, sickHours: parseFloat(e.target.value) || 0 })}
                                  className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded text-center text-sm"
                                  data-testid="input-sick-hours"
                                />
                              </td>
                              <td className="px-2 py-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={editedEntry.unpaidLeaveHours}
                                  onChange={(e) => setEditedEntry({ ...editedEntry, unpaidLeaveHours: parseFloat(e.target.value) || 0 })}
                                  className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded text-center text-sm"
                                  data-testid="input-unpaid-hours"
                                />
                              </td>
                              <td className="px-4 py-3 text-center text-sm">
                                <span className="font-bold text-blue-600">{editedTotal}h</span>
                              </td>
                              <td className="px-2 py-3">
                                <input
                                  type="text"
                                  value={editedEntry.notes || ''}
                                  onChange={(e) => setEditedEntry({ ...editedEntry, notes: e.target.value })}
                                  placeholder="Add notes..."
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded text-sm"
                                  data-testid="input-notes"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={handleSaveEntry}
                                    disabled={isSavingTimesheet}
                                    className="p-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                    data-testid="button-save-entry"
                                    title="Save changes"
                                  >
                                    {isSavingTimesheet ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Save className="h-4 w-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    disabled={isSavingTimesheet}
                                    className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500 disabled:opacity-50"
                                    data-testid="button-cancel-edit"
                                    title="Cancel"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr 
                            key={idx} 
                            className={`${isWeekend ? 'bg-gray-50 dark:bg-gray-900' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} cursor-pointer transition-colors group`}
                            onClick={() => handleEditEntry(idx, entry)}
                            data-testid={`row-timesheet-${idx}`}
                          >
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{entry.date}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{entry.day}</td>
                            <td className="px-4 py-3 text-center text-sm">
                              {entry.regularHours > 0 ? (
                                <span className="font-medium text-gray-900 dark:text-white">{entry.regularHours}h</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              {entry.overtimeHours > 0 ? (
                                <span className="font-medium text-orange-600">{entry.overtimeHours}h</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              {entry.ptoHours > 0 ? (
                                <span className="font-medium text-green-600">{entry.ptoHours}h</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              {entry.sickHours > 0 ? (
                                <span className="font-medium text-blue-600">{entry.sickHours}h</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              {entry.unpaidLeaveHours > 0 ? (
                                <span className="font-medium text-gray-600 dark:text-gray-400">{entry.unpaidLeaveHours}h</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              {dayTotal > 0 ? (
                                <span className="font-bold text-gray-900 dark:text-white">{dayTotal}h</span>
                              ) : (
                                <span className="text-gray-400">0h</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 italic">
                              {entry.notes || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <Edit2 className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                            </td>
                          </tr>
                        );
                      })}

                      <tr className="bg-blue-50 dark:bg-blue-900/20 font-semibold">
                        <td colSpan={2} className="px-4 py-3 text-sm text-gray-900 dark:text-white dark:text-white uppercase">
                          Totals
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white dark:text-white">
                          {selectedEmployeeTimesheet.regularHours}h
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-orange-600">
                          {selectedEmployeeTimesheet.overtimeHours}h
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-green-600">
                          {selectedEmployeeTimesheet.ptoHours}h
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-blue-600">
                          {selectedEmployeeTimesheet.sickHours}h
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                          {selectedEmployeeTimesheet.unpaidLeaveHours}h
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white dark:text-white">
                          {(selectedEmployeeTimesheet.regularHours || 0) +
                            (selectedEmployeeTimesheet.overtimeHours || 0) +
                            (selectedEmployeeTimesheet.ptoHours || 0) +
                            (selectedEmployeeTimesheet.sickHours || 0) +
                            (selectedEmployeeTimesheet.unpaidLeaveHours || 0)}h
                        </td>
                        <td className="px-4 py-3 text-sm"></td>
                        <td className="px-4 py-3 text-sm"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setSelectedEmployeeTimesheet(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 dark:text-gray-300 bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors font-medium"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export to PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Payroll Detail Modal */}
      {selectedEmployeeDetail && !showLeaveModal && (
        <EmployeePayrollDetailModal
          employee={selectedEmployeeDetail}
          onClose={() => setSelectedEmployeeDetail(null)}
          onSave={handleSaveEmployeeChanges}
          onNavigateToLeave={(params) => {
            // Close the payroll detail modal first
            setSelectedEmployeeDetail(null);
            // Then open the leave modal with navigation params
            setLeaveNavigationParams(params);
            setShowLeaveModal(true);
          }}
        />
      )}

      {/* Leave Management Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  Time & Leave - {leaveNavigationParams?.employeeName}
                </h2>
                {leaveNavigationParams && (
                  <p className="text-emerald-100 text-sm mt-1">
                    {leaveNavigationParams.type ? `${leaveNavigationParams.type} Request` : 'Leave Requests'}
                    {leaveNavigationParams.date && ` - ${leaveNavigationParams.date}`}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  setLeaveNavigationParams(null);
                }}
                className="text-white hover:bg-emerald-800 rounded-lg p-2 transition-colors"
                data-testid="button-close-leave-modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <LeaveManagementModal
                onClose={() => {
                  setShowLeaveModal(false);
                  setLeaveNavigationParams(null);
                }}
                navigationParams={leaveNavigationParams || undefined}
              />
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  // Step 3: AI Analysis
  if (currentStep === 'ai-check') {
    return (
      <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">AI Error Detection</h2>
            <p className="text-gray-600 dark:text-gray-400">Step 2 of 4: Scanning for errors and anomalies</p>
          </div>
          <button
            onClick={() => setCurrentStep('review')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 flex items-center"
          >
            <ArrowRight className="h-5 w-5 transform rotate-180 mr-2" />
            Back
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">Step 2: AI Analysis</span>
            <span className="text-sm text-gray-500">50% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
          </div>
        </div>

        <div className="p-6">
          {!aiAnalysisComplete ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full p-6 mb-6 animate-pulse">
                <Brain className="h-16 w-16 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">AI Analysis in Progress</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
                Our AI is analyzing {employeeCount} employee records for errors, anomalies, and optimization opportunities...
              </p>
              <div className="w-full max-w-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Checking tax calculations...</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Verifying overtime hours...</span>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-sm">Analyzing deductions...</span>
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-sm">Compliance check...</span>
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-600">{errorCount}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 font-medium">Critical Errors</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <p className="text-3xl font-bold text-yellow-600">{warningCount}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 font-medium">Warnings</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-600">1</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 font-medium">Suggestions</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-600">{employeeCount - 3}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 font-medium">Verified</p>
                </div>
              </div>

              {/* AI Insights */}
              <div className="space-y-4 mb-6">
                {aiInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`border-l-4 rounded-lg p-4 ${
                      insight.type === 'error'
                        ? 'bg-red-50 border-red-500'
                        : insight.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-500'
                        : insight.type === 'suggestion'
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-green-50 border-green-500'
                    }`}
                    data-testid={`insight-${insight.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {insight.type === 'error' && <XCircle className="h-5 w-5 text-red-600 mr-2" />}
                          {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />}
                          {insight.type === 'suggestion' && <Zap className="h-5 w-5 text-blue-600 mr-2" />}
                          {insight.type === 'info' && <Info className="h-5 w-5 text-green-600 mr-2" />}
                          <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">{insight.title}</h4>
                          <span
                            className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                              insight.impact === 'High'
                                ? 'bg-red-100 text-red-800'
                                : insight.impact === 'Medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {insight.impact} Impact
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">{insight.description}</p>
                        {insight.affectedEmployees.length > 0 && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Affects: {insight.affectedEmployees.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col space-y-2">
                        {insight.autoFixAvailable && (
                          <button
                            onClick={() => autoFixError(insight.id)}
                            className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors flex items-center whitespace-nowrap"
                            data-testid={`button-auto-fix-${insight.id}`}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Auto Fix
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedInsight(insight)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          data-testid={`button-view-details-${insight.id}`}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Auto-Fix Suggestions Section */}
              {isLoadingAutoFixes && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-blue-900 dark:text-blue-100 font-medium">
                      Generating auto-fix suggestions...
                    </span>
                  </div>
                </div>
              )}

              {!isLoadingAutoFixes && autoFixSuggestions.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Auto-Fix Suggestions
                      </h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {autoFixSuggestions.length} Available
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3" data-testid="auto-fix-suggestions-list">
                    {autoFixSuggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.id}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4"
                        data-testid={`auto-fix-suggestion-${suggestion.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="h-5 w-5 text-blue-600" />
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {suggestion.title}
                              </h4>
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  suggestion.severity === 'critical'
                                    ? 'bg-red-100 text-red-800'
                                    : suggestion.severity === 'high'
                                    ? 'bg-orange-100 text-orange-800'
                                    : suggestion.severity === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {suggestion.severity.toUpperCase()}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                              {suggestion.explanation}
                            </p>

                            {suggestion.affectedEmployees && suggestion.affectedEmployees.length > 0 && (
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <Users className="h-4 w-4" />
                                <span>
                                  Affects: {suggestion.affectedEmployees.map((e: any) => e.name).join(', ')}
                                </span>
                              </div>
                            )}

                            <div className="mt-2 flex flex-wrap gap-1">
                              {suggestion.impact && suggestion.impact.map((item: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-2 py-1 rounded"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedFixForReview(suggestion)}
                            className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium whitespace-nowrap"
                            data-testid={`button-review-approve-${suggestion.id}`}
                          >
                            <CheckSquare className="h-4 w-4" />
                            Review & Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  {criticalIssuesCount > 0 ? (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                      <span className="text-red-600 font-medium">
                        Please resolve {criticalIssuesCount} critical issue{criticalIssuesCount !== 1 ? 's' : ''} before proceeding
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      <span className="text-green-600 font-medium">All critical issues resolved</span>
                    </>
                  )}
                </div>
                <button
                  onClick={handleProceedToFinalReview}
                  disabled={criticalIssuesCount > 0}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Final Review
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[80] flex items-center text-white ${
          notification.type === 'success' ? 'bg-green-600' :
          notification.type === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          {notification.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
          {notification.type === 'error' && <XCircle className="h-5 w-5 mr-2" />}
          {notification.type === 'info' && <Info className="h-5 w-5 mr-2" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[90] overflow-y-auto flex items-center justify-center p-4"
          onClick={() => setSelectedInsight(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between p-6 border-b ${
              selectedInsight.type === 'error' ? 'bg-red-50' :
              selectedInsight.type === 'warning' ? 'bg-yellow-50' :
              selectedInsight.type === 'suggestion' ? 'bg-blue-50' :
              'bg-green-50'
            }`}>
              <div className="flex items-center">
                {selectedInsight.type === 'error' && (
                  <div className="bg-red-100 rounded-full p-2 mr-3">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                )}
                {selectedInsight.type === 'warning' && (
                  <div className="bg-yellow-100 rounded-full p-2 mr-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                )}
                {selectedInsight.type === 'suggestion' && (
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                )}
                {selectedInsight.type === 'info' && (
                  <div className="bg-green-100 rounded-full p-2 mr-3">
                    <Info className="h-6 w-6 text-green-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">{selectedInsight.title}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                    selectedInsight.impact === 'High' ? 'bg-red-100 text-red-800' :
                    selectedInsight.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedInsight.impact} Impact
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedInsight(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Category */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Category</h4>
                <p className="text-gray-900 dark:text-white dark:text-white">{selectedInsight.category}</p>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Description</h4>
                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 leading-relaxed">{selectedInsight.description}</p>
              </div>

              {/* Affected Employees */}
              {selectedInsight.affectedEmployees.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Affected Employees</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedInsight.affectedEmployees.map((emp, idx) => (
                      <span key={idx} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">
                        {emp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              <div className={`border-l-4 rounded-lg p-4 ${
                selectedInsight.type === 'error' ? 'bg-red-50 border-red-500' :
                selectedInsight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                selectedInsight.type === 'suggestion' ? 'bg-blue-50 border-blue-500' :
                'bg-green-50 border-green-500'
              }`}>
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-2">Recommendation</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">
                  {selectedInsight.type === 'error' &&
                    'This issue must be resolved before processing payroll. Use the Auto Fix button or manually correct the data.'
                  }
                  {selectedInsight.type === 'warning' && selectedInsight.impact === 'High' &&
                    'This issue should be addressed before processing payroll to ensure compliance and accuracy.'
                  }
                  {selectedInsight.type === 'warning' && selectedInsight.impact === 'Medium' &&
                    'Review this issue and take appropriate action. You may proceed with caution.'
                  }
                  {selectedInsight.type === 'suggestion' &&
                    'Consider implementing this suggestion to optimize your payroll process and reduce costs.'
                  }
                  {selectedInsight.type === 'info' &&
                    'This is informational only. No action required.'
                  }
                </p>
              </div>

              {/* Additional Details */}
              {selectedInsight.category === 'Tax Calculation' && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-3">Tax Calculation Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Federal Tax Rate:</span>
                      <span className="text-gray-900 dark:text-white dark:text-white font-medium">22%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">State Tax Rate:</span>
                      <span className="text-gray-900 dark:text-white dark:text-white font-medium">6.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">FICA Rate:</span>
                      <span className="text-gray-900 dark:text-white dark:text-white font-medium">7.65%</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedInsight.category === 'Overtime' && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-3">Overtime Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Department Average:</span>
                      <span className="text-gray-900 dark:text-white dark:text-white font-medium">5.2 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Employee Overtime:</span>
                      <span className="text-gray-900 dark:text-white dark:text-white font-medium">8 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Difference:</span>
                      <span className="text-red-600 font-medium">+54%</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedInsight.category === 'Optimization' && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-3">Cost Savings Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Current Overtime Cost:</span>
                      <span className="text-gray-900 dark:text-white dark:text-white font-medium">$4,800</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Potential Savings:</span>
                      <span className="text-green-600 font-medium">$2,400 (50%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Annual Projection:</span>
                      <span className="text-green-600 font-medium">$62,400</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setSelectedInsight(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              {selectedInsight.autoFixAvailable && (
                <button
                  onClick={() => {
                    autoFixError(selectedInsight.id);
                    setSelectedInsight(null);
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Auto Fix Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auto-Fix Review Modal */}
      {selectedFixForReview && (
        <AutoFixReviewModal
          onClose={() => setSelectedFixForReview(null)}
          onApprove={handleApproveAutoFix}
          fixData={selectedFixForReview}
        />
      )}
      </>
    );
  }

  // Step 4: Final Review
  if (currentStep === 'final-review') {
    return (
      <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">Final Review & Approval</h2>
            <p className="text-gray-600 dark:text-gray-400">Step 3 of 4: Review summary and approve for processing</p>
          </div>
          <button
            onClick={() => setCurrentStep('ai-check')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 flex items-center"
          >
            <ArrowRight className="h-5 w-5 transform rotate-180 mr-2" />
            Back
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">Step 3: Final Review</span>
            <span className="text-sm text-gray-500">75% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Payroll Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white mb-4">Payroll Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pay Period</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Jan 1-15, 2025</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Employees</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{employeeCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Gross</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">${totalGross.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Net</p>
                  <p className="text-lg font-bold text-green-600">${totalNet.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Payment Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Gross Wages</span>
                    <span className="font-medium text-gray-900 dark:text-white dark:text-white">${totalGross.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Federal Taxes</span>
                    <span className="font-medium text-gray-900 dark:text-white dark:text-white">-${Math.round(totalTaxes * 0.6).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">State Taxes</span>
                    <span className="font-medium text-gray-900 dark:text-white dark:text-white">-${Math.round(totalTaxes * 0.25).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">FICA</span>
                    <span className="font-medium text-gray-900 dark:text-white dark:text-white">-${Math.round(totalTaxes * 0.15).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Benefits</span>
                    <span className="font-medium text-gray-900 dark:text-white dark:text-white">-${Math.round(totalDeductions * 0.7).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Other Deductions</span>
                    <span className="font-medium text-gray-900 dark:text-white dark:text-white">-${Math.round(totalDeductions * 0.3).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white dark:text-white">Total Net Pay</span>
                    <span className="font-bold text-green-600">${totalNet.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Processing Details</h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white dark:text-white">Direct Deposit</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{employeeCount} employees via ACH</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white dark:text-white">Tax Filings</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Federal, state, and local automatically filed</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white dark:text-white">Employee Notifications</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pay stubs sent via email and portal</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white dark:text-white">Accounting Integration</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Journal entries synced to QuickBooks</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expense Reimbursements Warning */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Receipt className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">Expense Reimbursements</h4>
                    <button
                      onClick={() => {
                        onClose();
                        setTimeout(() => {
                          const modal = document.querySelector('[data-modal="payrollExpenseReview"]');
                          if (modal) modal.click();
                        }, 100);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                    >
                      Review Expenses →
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Before processing payroll, ensure all approved expense reimbursements are included.
                  </p>
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded border border-blue-200 p-3 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Approved & Unpaid Expenses</span>
                      <span className="font-semibold text-gray-900 dark:text-white dark:text-white">Check Expense System →</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Click "Review Expenses" to see all approved expenses ready for reimbursement. You can create a batch and include it in this payroll run.
                    </p>
                  </div>
                  <div className="mt-2 flex items-start">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <strong>Important:</strong> Employees will not receive expense reimbursements unless they're added to a payroll batch. Review the expense system before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-2">Important Information</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 space-y-1 list-disc list-inside">
                    <li>Payments will be processed on January 20, 2025</li>
                    <li>Funds must be available in your account by January 19, 2025</li>
                    <li>This action cannot be undone once processing begins</li>
                    <li>All employees will receive email notifications</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Approval */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 mb-6">
              <div className="text-center">
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-2">Final Approval Required</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  By approving this payroll, you confirm that all information is accurate and authorize processing of ${totalNet.toLocaleString()} to {employeeCount} employees.
                </p>
                <label className="flex items-center justify-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">I have reviewed and approve this payroll for processing</span>
                </label>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleProcessPayroll}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center font-medium text-lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Process Payroll
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[80] flex items-center text-white ${
          notification.type === 'success' ? 'bg-green-600' :
          notification.type === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          {notification.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
          {notification.type === 'error' && <XCircle className="h-5 w-5 mr-2" />}
          {notification.type === 'info' && <Info className="h-5 w-5 mr-2" />}
          <span>{notification.message}</span>
        </div>
      )}
      </>
    );
  }

  // Step 5: Processing
  if (currentStep === 'processing') {
    return (
      <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto flex items-center justify-center">
        <div className="text-center py-12 px-6">
          <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 animate-pulse">
            <RefreshCw className="h-16 w-16 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">Processing Payroll...</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Please wait while we process payments for {employeeCount} employees</p>

          <div className="max-w-md mx-auto space-y-4 text-left">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Initiating direct deposits</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Filing tax withholdings</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Generating pay stubs</span>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="text-sm text-gray-500">Creating journal entries</span>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="text-sm text-gray-500">Sending notifications</span>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[80] flex items-center text-white ${
          notification.type === 'success' ? 'bg-green-600' :
          notification.type === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          {notification.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
          {notification.type === 'error' && <XCircle className="h-5 w-5 mr-2" />}
          {notification.type === 'info' && <Info className="h-5 w-5 mr-2" />}
          <span>{notification.message}</span>
        </div>
      )}
      </>
    );
  }

  // Step 6: Complete
  if (currentStep === 'complete') {
    return (
      <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        <div className="text-center py-12 px-6">
          <div className="bg-green-100 rounded-full p-8 w-32 h-32 mx-auto mb-6">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">Payroll Processed Successfully!</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Payroll for {employeeCount} employees has been processed and payments are on the way
          </p>

          <div className="max-w-3xl mx-auto mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Processed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">${totalNet.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Employees Paid</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{employeeCount}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Taxes Withheld</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">${totalTaxes.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Process Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">3.5s</p>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-green-900 mb-3">What happens next?</h4>
              <div className="space-y-2 text-sm text-green-800">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Direct deposits will arrive on January 20, 2025</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Employee pay stubs sent via email</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Tax filings submitted to authorities</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Journal entries synced to accounting system</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setCurrentStep('select-type')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Process Another Payroll
            </button>
            <button className="bg-gray-200 text-gray-700 dark:text-gray-300 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Download Reports
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[80] flex items-center text-white ${
          notification.type === 'success' ? 'bg-green-600' :
          notification.type === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          {notification.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
          {notification.type === 'error' && <XCircle className="h-5 w-5 mr-2" />}
          {notification.type === 'info' && <Info className="h-5 w-5 mr-2" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Correction Request Modal */}
      {showCorrectionRequestModal && (
        <CorrectionRequestModal onClose={() => setShowCorrectionRequestModal(false)} />
      )}
      </>
    );
  }

  return null;
};

export default PayrollModal;
