import { useState } from 'react';
import {
  X, Save, DollarSign, Clock, Calendar, AlertTriangle, CheckCircle,
  TrendingUp, FileText, Receipt, Edit2, User
} from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

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

interface EmployeePayrollDetailModalProps {
  employee: Employee;
  onClose: () => void;
  onSave: (updatedEmployee: Employee) => void;
}

export const EmployeePayrollDetailModal: React.FC<EmployeePayrollDetailModalProps> = ({
  employee,
  onClose,
  onSave
}) => {
  const [editedEmployee, setEditedEmployee] = useState<Employee>(employee);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'timesheet' | 'calculations'>('overview');

  const handleSave = () => {
    onSave(editedEmployee);
    onClose();
  };

  const totalHours = (editedEmployee.regularHours || 0) +
    (editedEmployee.overtimeHours || 0) +
    (editedEmployee.ptoHours || 0) +
    (editedEmployee.sickHours || 0) +
    (editedEmployee.unpaidLeaveHours || 0);

  const updateField = (field: keyof Employee, value: any) => {
    setEditedEmployee(prev => {
      const updated = { ...prev, [field]: value };
      
      if (editedEmployee.employeeType === 'Hourly' && (field === 'regularHours' || field === 'overtimeHours' || field === 'hourlyRate')) {
        const regular = field === 'regularHours' ? value : updated.regularHours || 0;
        const overtime = field === 'overtimeHours' ? value : updated.overtimeHours || 0;
        const rate = field === 'hourlyRate' ? value : updated.hourlyRate || 0;
        
        const grossPay = (regular * rate) + (overtime * rate * 1.5);
        const taxes = grossPay * 0.25;
        const deductions = grossPay * 0.15;
        const netPay = grossPay - taxes - deductions + (updated.expenses || 0);
        
        return { ...updated, grossPay, taxes, deductions, netPay };
      }
      
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <User className="h-6 w-6" />
              {editedEmployee.name} - Payroll Details
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              {editedEmployee.department} | {editedEmployee.employeeType} Employee
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={handleSave}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 font-medium"
                data-testid="button-save-payroll"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-800 rounded-lg p-2 transition-colors"
              data-testid="button-close-detail-modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              data-testid="tab-overview"
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('timesheet')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'timesheet'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              data-testid="tab-timesheet"
            >
              Timesheet
            </button>
            <button
              onClick={() => setActiveTab('calculations')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'calculations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              data-testid="tab-calculations"
            >
              Calculations
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Employee Information</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm font-medium"
                  data-testid="button-toggle-edit"
                >
                  <Edit2 className="h-4 w-4" />
                  {isEditing ? 'Cancel Edit' : 'Edit Details'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium block">
                    Employee Type
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editedEmployee.employeeType}
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium block">
                    {editedEmployee.employeeType === 'Hourly' ? 'Hourly Rate' : 'Annual Salary'}
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedEmployee.employeeType === 'Hourly' ? editedEmployee.hourlyRate : editedEmployee.salary}
                      onChange={(e) => updateField(
                        editedEmployee.employeeType === 'Hourly' ? 'hourlyRate' : 'salary',
                        parseFloat(e.target.value)
                      )}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      data-testid="input-rate-salary"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(
                        editedEmployee.employeeType === 'Hourly' ? editedEmployee.hourlyRate || 0 : editedEmployee.salary || 0,
                        editedEmployee.currency
                      )}
                      {editedEmployee.employeeType === 'Hourly' && '/hr'}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Hours Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium block">
                      Regular Hours
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedEmployee.regularHours || 0}
                        onChange={(e) => updateField('regularHours', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        data-testid="input-regular-hours"
                      />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {editedEmployee.regularHours || 0}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-xs text-orange-700 dark:text-orange-400 mb-1 font-medium block">
                      Overtime Hours
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedEmployee.overtimeHours || 0}
                        onChange={(e) => updateField('overtimeHours', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-orange-300 dark:border-orange-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        data-testid="input-overtime-hours"
                      />
                    ) : (
                      <p className="text-2xl font-bold text-orange-600">
                        {editedEmployee.overtimeHours || 0}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-xs text-green-700 dark:text-green-400 mb-1 font-medium block">
                      PTO Hours
                    </label>
                    <p className="text-2xl font-bold text-green-600">
                      {editedEmployee.ptoHours || 0}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-blue-700 dark:text-blue-400 mb-1 font-medium block">
                      Sick Hours
                    </label>
                    <p className="text-2xl font-bold text-blue-600">
                      {editedEmployee.sickHours || 0}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium block">
                      Total Hours
                    </label>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalHours}
                    </p>
                  </div>
                </div>
              </div>

              {(editedEmployee.warnings && editedEmployee.warnings.length > 0) && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Warnings
                  </h4>
                  {editedEmployee.warnings.map((warning, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 rounded-lg">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              {editedEmployee.timesheetApproved && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <div>
                      <p className="font-semibold">Timesheet Approved</p>
                      <p className="text-sm">
                        By {editedEmployee.timesheetApprovedBy} on {editedEmployee.timesheetApprovedAt}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timesheet' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Timesheet Details - Pay Period: Jan 6 - Jan 19, 2025
              </h3>
              {editedEmployee.timesheetEntries && editedEmployee.timesheetEntries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Day</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Regular</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Overtime</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">PTO</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sick</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Unpaid</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {editedEmployee.timesheetEntries.map((entry, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{entry.date}</td>
                          <td className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">{entry.day}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">{entry.regularHours}</td>
                          <td className="px-4 py-3 text-center text-sm">
                            {entry.overtimeHours > 0 ? (
                              <span className="font-medium text-orange-600">{entry.overtimeHours}</span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {entry.ptoHours > 0 ? (
                              <span className="font-medium text-green-600">{entry.ptoHours}</span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {entry.sickHours > 0 ? (
                              <span className="font-medium text-blue-600">{entry.sickHours}</span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {entry.unpaidLeaveHours > 0 ? (
                              <span className="font-medium text-gray-600 dark:text-gray-400">{entry.unpaidLeaveHours}</span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 italic">
                            {entry.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No timesheet entries available for this employee.
                </div>
              )}
            </div>
          )}

          {activeTab === 'calculations' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Payroll Calculations Breakdown
              </h3>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Gross Pay</h4>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(editedEmployee.grossPay, editedEmployee.currency)}
                  </div>
                </div>
                {editedEmployee.employeeType === 'Hourly' && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>Regular: {editedEmployee.regularHours} hrs × {formatCurrency(editedEmployee.hourlyRate || 0, editedEmployee.currency)}/hr = {formatCurrency((editedEmployee.regularHours || 0) * (editedEmployee.hourlyRate || 0), editedEmployee.currency)}</p>
                    {(editedEmployee.overtimeHours || 0) > 0 && (
                      <p>Overtime: {editedEmployee.overtimeHours} hrs × {formatCurrency((editedEmployee.hourlyRate || 0) * 1.5, editedEmployee.currency)}/hr = {formatCurrency((editedEmployee.overtimeHours || 0) * (editedEmployee.hourlyRate || 0) * 1.5, editedEmployee.currency)}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-red-600" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Deductions</h4>
                    </div>
                    <div className="text-lg font-bold text-red-600">
                      -{formatCurrency(editedEmployee.deductions, editedEmployee.currency)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Health insurance, 401(k), and other pre-tax deductions
                  </p>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-orange-600" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Taxes</h4>
                    </div>
                    <div className="text-lg font-bold text-orange-600">
                      -{formatCurrency(editedEmployee.taxes, editedEmployee.currency)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Federal, state, and local income taxes
                  </p>
                </div>

                {(editedEmployee.expenses || 0) > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">Approved Expenses</h4>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        +{formatCurrency(editedEmployee.expenses || 0, editedEmployee.currency)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Reimbursable expenses approved for this pay period
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-8 w-8" />
                    <div>
                      <h4 className="text-sm font-medium opacity-90">Net Pay</h4>
                      <p className="text-xs opacity-75">Amount to be paid to employee</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold">
                    {formatCurrency(editedEmployee.netPay, editedEmployee.currency)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
