import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, ArrowRight, Users, Calendar, FileText } from 'lucide-react';

interface AutoFixReviewModalProps {
  onClose: () => void;
  onApprove: (reason?: string) => Promise<void>;
  fixData: {
    id: string;
    title: string;
    type: 'timesheet_approval' | 'tax_calculation' | 'expense_validation' | 'leave_request';
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedEmployees: Array<{
      id: string;
      name: string;
      department: string;
    }>;
    beforeState: any;
    afterState: any;
    explanation: string;
    recommendation: string;
    impact: string[];
  };
}

export default function AutoFixReviewModal({ onClose, onApprove, fixData }: AutoFixReviewModalProps) {
  const [approvalReason, setApprovalReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
      case 'medium':
        return <AlertTriangle className="h-5 w-5" />;
      case 'low':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(approvalReason || undefined);
      setNotification({
        type: 'success',
        message: 'Auto-fix approved successfully. Notifications sent to all stakeholders.'
      });
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to approve auto-fix. Please try again.'
      });
      setIsApproving(false);
    }
  };

  const renderBeforeAfter = () => {
    const { beforeState, afterState } = fixData;

    // Handle different fix types
    if (fixData.type === 'timesheet_approval') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
              <X className="h-4 w-4" />
              Before
            </h4>
            <div className="space-y-1 text-sm text-red-800 dark:text-red-200">
              <p><span className="font-medium">Status:</span> {beforeState?.status || 'Pending Approval'}</p>
              <p><span className="font-medium">Approved By:</span> {beforeState?.approvedBy || 'None'}</p>
              <p><span className="font-medium">Approved At:</span> {beforeState?.approvedAt || 'N/A'}</p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              After
            </h4>
            <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
              <p><span className="font-medium">Status:</span> {afterState?.status || 'Approved'}</p>
              <p><span className="font-medium">Approved By:</span> {afterState?.approvedBy || 'HR Department'}</p>
              <p><span className="font-medium">Approved At:</span> {afterState?.approvedAt || new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      );
    }

    if (fixData.type === 'tax_calculation') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
              <X className="h-4 w-4" />
              Before (Incorrect)
            </h4>
            <div className="space-y-1 text-sm text-red-800 dark:text-red-200">
              <p><span className="font-medium">Gross Pay:</span> ${beforeState?.grossPay?.toLocaleString() || '0.00'}</p>
              <p><span className="font-medium">Total Tax:</span> ${beforeState?.taxes?.toLocaleString() || '0.00'}</p>
              <p><span className="font-medium">Net Pay:</span> ${beforeState?.netPay?.toLocaleString() || '0.00'}</p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              After (Corrected)
            </h4>
            <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
              <p><span className="font-medium">Gross Pay:</span> ${afterState?.grossPay?.toLocaleString() || '0.00'}</p>
              <p><span className="font-medium">Total Tax:</span> ${afterState?.taxes?.toLocaleString() || '0.00'}</p>
              <p><span className="font-medium">Net Pay:</span> ${afterState?.netPay?.toLocaleString() || '0.00'}</p>
            </div>
          </div>
        </div>
      );
    }

    // Generic before/after for other types
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Before</h4>
          <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-48">
            {JSON.stringify(beforeState, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">After</h4>
          <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-48">
            {JSON.stringify(afterState, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Review Auto-Fix
            </h2>
            <p className="text-blue-100 text-sm mt-1">Review changes before applying</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 rounded-lg p-2 transition-colors"
            data-testid="button-close-auto-fix-review"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mx-6 mt-4 px-4 py-3 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
          {/* Fix Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{fixData.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{fixData.explanation}</p>
            </div>
            <div className={`px-3 py-1 rounded-full border ${getSeverityColor(fixData.severity)} flex items-center gap-1 text-sm font-medium`}>
              {getSeverityIcon(fixData.severity)}
              {fixData.severity.toUpperCase()}
            </div>
          </div>

          {/* Affected Employees */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Affected Employees ({fixData.affectedEmployees.length})
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {fixData.affectedEmployees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                  <div className="h-8 w-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center font-semibold">
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">{emp.department}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Before/After Comparison */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Changes to be Applied
            </h4>
            {renderBeforeAfter()}
          </div>

          {/* Impact Analysis */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Impact Analysis
            </h4>
            <ul className="space-y-1">
              {fixData.impact.map((item, idx) => (
                <li key={idx} className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendation */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              AI Recommendation
            </h4>
            <p className="text-sm text-green-800 dark:text-green-200">{fixData.recommendation}</p>
          </div>

          {/* Approval Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Approval Notes (Optional)
            </label>
            <textarea
              value={approvalReason}
              onChange={(e) => setApprovalReason(e.target.value)}
              placeholder="Add any notes about why you're approving this fix..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={3}
              data-testid="textarea-approval-reason"
            />
          </div>

          {/* Notification Info */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              After Approval
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The following stakeholders will be notified:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>✓ Affected employees (via email and in-app notification)</li>
              <li>✓ Employee managers (via email and in-app notification)</li>
              <li>✓ HR team (in-app notification)</li>
              <li>✓ Payroll team (in-app notification)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
            disabled={isApproving}
            data-testid="button-cancel-auto-fix"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium flex items-center gap-2"
            data-testid="button-approve-auto-fix"
          >
            {isApproving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Approving...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Approve & Apply Fix</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
