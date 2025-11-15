import { useState } from 'react';
import {
  X, ChevronRight, ChevronLeft, Clock, Receipt, FileText, CheckCircle,
  AlertTriangle, Brain, DollarSign, Calendar, Users, TrendingUp, Info,
  Check, Circle
} from 'lucide-react';

interface PayrollWizardModalProps {
  onClose: () => void;
  onOpenStudioAI?: () => void;
}

type WizardStep = 'timesheets' | 'expenses' | 'leave' | 'review' | 'finalize';

export const PayrollWizardModal: React.FC<PayrollWizardModalProps> = ({
  onClose,
  onOpenStudioAI
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('timesheets');
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);

  const steps: { id: WizardStep; title: string; description: string }[] = [
    {
      id: 'timesheets',
      title: 'Review Timesheets',
      description: 'Verify hours, overtime, and timesheet approvals'
    },
    {
      id: 'expenses',
      title: 'Process Expenses',
      description: 'Review and approve expense claims'
    },
    {
      id: 'leave',
      title: 'Handle Leave Requests',
      description: 'Process pending leave and PTO requests'
    },
    {
      id: 'review',
      title: 'Review Calculations',
      description: 'Verify payroll calculations and totals'
    },
    {
      id: 'finalize',
      title: 'Finalize & Submit',
      description: 'Run final checks and submit for processing'
    }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const isStepCompleted = (stepId: WizardStep) => completedSteps.includes(stepId);
  const isStepActive = (stepId: WizardStep) => currentStep === stepId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="h-6 w-6" />
              Guided Payroll Wizard
            </h2>
            <p className="text-purple-100 text-sm mt-1">
              Step-by-step payroll processing with AI assistance
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenStudioAI && (
              <button
                onClick={onOpenStudioAI}
                className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2 font-medium"
                data-testid="button-wizard-studio-ai"
              >
                <Brain className="h-4 w-4" />
                Ask Studio AI
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white hover:bg-purple-700 rounded-lg p-2 transition-colors"
              data-testid="button-close-wizard"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-600">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStepIndex + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between gap-2">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 flex-1 ${
                  idx !== steps.length - 1 ? 'relative' : ''
                }`}
              >
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      isStepCompleted(step.id)
                        ? 'bg-green-600 text-white'
                        : isStepActive(step.id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {isStepCompleted(step.id) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium text-center ${
                      isStepActive(step.id)
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {idx !== steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-280px)] p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {steps[currentStepIndex].title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {steps[currentStepIndex].description}
              </p>
            </div>

            {currentStep === 'timesheets' && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Clock className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        What to Check
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>All timesheets have manager approval</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Regular hours and overtime are correctly recorded</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>PTO, sick leave, and unpaid leave are accurately tracked</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>No missing hours or incomplete timesheet entries</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Brain className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        AI Assistance Available
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Studio AI can help you identify timesheet issues, flag unusual patterns, and ensure compliance.
                      </p>
                      {onOpenStudioAI && (
                        <button
                          onClick={onOpenStudioAI}
                          className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium flex items-center gap-1"
                          data-testid="button-ask-ai-timesheets"
                        >
                          Ask Studio AI about timesheets
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Employees</span>
                      <Users className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">247</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">242</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Pending Review</span>
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">5</p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'expenses' && (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Receipt className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Expense Review Checklist
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>All expense claims have receipts attached</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Expenses are within company policy limits</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Manager approvals are complete</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Tax documentation is accurate</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Pending Expenses</span>
                      <Receipt className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">18</p>
                    <p className="text-sm text-gray-500">$4,250.00 total</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Approved for Payment</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600 mb-1">45</p>
                    <p className="text-sm text-gray-500">$12,840.00 total</p>
                  </div>
                </div>

                {onOpenStudioAI && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Need help reviewing expenses? Ask Studio AI
                        </span>
                      </div>
                      <button
                        onClick={onOpenStudioAI}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        data-testid="button-ask-ai-expenses"
                      >
                        Get AI Help
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'leave' && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Leave Management Tasks
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Review and approve pending PTO requests</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Verify sick leave documentation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Process unpaid leave adjustments</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Update leave balances for new period</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">PTO Requests</span>
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Sick Leave</span>
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Unpaid Leave</span>
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'review' && (
              <div className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Calculation Review
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Review the final payroll calculations before submitting for processing.
                      </p>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Gross pay calculations are accurate</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Tax withholdings match employee W-4 forms</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Deductions are correctly applied</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Net pay totals are verified</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Payroll Summary</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Gross Pay</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">$1,245,680.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Deductions</span>
                        <span className="text-sm font-semibold text-red-600">-$186,852.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Taxes</span>
                        <span className="text-sm font-semibold text-red-600">-$311,420.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Reimbursements</span>
                        <span className="text-sm font-semibold text-green-600">+$12,840.00</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
                        <span className="font-semibold text-gray-900 dark:text-white">Total Net Pay</span>
                        <span className="font-bold text-lg text-purple-600">$760,248.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Employee Breakdown</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Hourly Employees</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">45</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Salaried Employees</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">202</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Employees</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">247</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
                        <span className="font-semibold text-gray-900 dark:text-white">Average Net Pay</span>
                        <span className="font-bold text-gray-900 dark:text-white">$3,078.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {onOpenStudioAI && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Run AI validation on calculations
                        </span>
                      </div>
                      <button
                        onClick={onOpenStudioAI}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        data-testid="button-ask-ai-calculations"
                      >
                        Validate with AI
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'finalize' && (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Ready to Process Payroll
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        All checks have been completed. Review the summary below and submit for processing.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span>Timesheets approved</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span>Expenses processed</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span>Leave requests handled</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span>Calculations verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="text-sm font-medium opacity-90">Total Payroll Amount</h5>
                      <p className="text-3xl font-bold">$760,248.00</p>
                    </div>
                    <DollarSign className="h-12 w-12 opacity-50" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
                    <div>
                      <p className="text-xs opacity-75">Employees</p>
                      <p className="text-lg font-semibold">247</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-75">Processing Date</p>
                      <p className="text-lg font-semibold">Jan 20, 2025</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-75">Payment Method</p>
                      <p className="text-lg font-semibold">Direct Deposit</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                        Important Reminder
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Once submitted, payroll will be processed and funds will be distributed on the scheduled payment date. 
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={isFirstStep}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            data-testid="button-wizard-back"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {!isLastStep ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors font-medium flex items-center gap-2"
              data-testid="button-wizard-next"
            >
              Next Step
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                alert('Payroll submitted for processing!');
                onClose();
              }}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-medium flex items-center gap-2 shadow-lg"
              data-testid="button-wizard-submit"
            >
              <CheckCircle className="h-5 w-5" />
              Submit Payroll
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
