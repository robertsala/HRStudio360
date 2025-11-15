import { useState, useEffect } from 'react';
import { X, History, User, Clock, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface TimesheetAuditTrailModalProps {
  isOpen?: boolean;
  onClose: () => void;
  timesheetEntryId: string;
  employeeName?: string;
}

interface TimesheetChangeAudit {
  id: string;
  timesheetEntryId: string;
  changedBy: string;
  changeType: 'Employee_Edit' | 'Manager_Correction' | 'HR_Override' | 'System_Adjustment';
  oldValues: any;
  newValues: any;
  justification: string | null;
  correctionRequestId: string | null;
  changedAt: Date;
}

const TimesheetAuditTrailModal: React.FC<TimesheetAuditTrailModalProps> = ({ 
  isOpen = true, 
  onClose, 
  timesheetEntryId,
  employeeName 
}) => {
  // Fetch audit trail
  const { data: auditTrail = [], isLoading } = useQuery<TimesheetChangeAudit[]>({
    queryKey: ['/api/timesheet-audit', timesheetEntryId],
    enabled: isOpen && !!timesheetEntryId
  });

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getChangeTypeBadge = (type: string) => {
    const styles = {
      Employee_Edit: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      Manager_Correction: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      HR_Override: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      System_Adjustment: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
    };
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${styles[type as keyof typeof styles]}`}>
        {type.replace(/_/g, ' ')}
      </span>
    );
  };

  const formatHours = (hours: any) => {
    if (typeof hours === 'number') return hours.toFixed(2);
    if (typeof hours === 'string') return parseFloat(hours).toFixed(2);
    return '0.00';
  };

  const getChangedFields = (oldValues: any, newValues: any) => {
    const changes: Array<{ field: string; old: string; new: string }> = [];
    const fields = ['regularHours', 'overtimeHours', 'ptoHours', 'sickHours', 'holidayHours', 'notes'];
    
    fields.forEach(field => {
      const oldVal = field.includes('Hours') ? formatHours(oldValues[field]) : oldValues[field] || '';
      const newVal = field.includes('Hours') ? formatHours(newValues[field]) : newValues[field] || '';
      
      if (oldVal !== newVal) {
        changes.push({
          field: field.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase()),
          old: oldVal,
          new: newVal
        });
      }
    });
    
    return changes;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Timesheet Audit Trail</h2>
              <p className="text-slate-100 text-sm">
                {employeeName ? `Complete change history for ${employeeName}` : 'Complete change history'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            data-testid="button-close-audit-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
            </div>
          ) : auditTrail.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No changes recorded for this timesheet entry</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Timeline */}
              <div className="relative">
                {auditTrail.map((entry, index) => {
                  const changes = getChangedFields(entry.oldValues, entry.newValues);
                  const isLast = index === auditTrail.length - 1;

                  return (
                    <div key={entry.id} className="relative pb-8">
                      {/* Timeline Line */}
                      {!isLast && (
                        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                      )}

                      <div className="flex items-start space-x-4">
                        {/* Timeline Dot */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white z-10 shadow-lg">
                          <Clock className="w-5 h-5" />
                        </div>

                        {/* Content Card */}
                        <div className="flex-1 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                {getChangeTypeBadge(entry.changeType)}
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(entry.changedAt).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                                <User className="w-4 h-4" />
                                <span>Changed by user ID: {entry.changedBy.slice(0, 8)}...</span>
                              </div>
                            </div>
                          </div>

                          {/* Justification */}
                          {entry.justification && (
                            <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-start space-x-2">
                                <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Justification:</span>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{entry.justification}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Changes */}
                          {changes.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Changes Made:</h4>
                              <div className="space-y-2">
                                {changes.map((change, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {change.field}
                                      </span>
                                      <div className="flex items-center space-x-2 text-sm">
                                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded">
                                          {change.old || 'empty'}
                                        </span>
                                        <span className="text-gray-400">→</span>
                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                                          {change.new || 'empty'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Correction Request Link */}
                          {entry.correctionRequestId && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Linked to correction request: {entry.correctionRequestId.slice(0, 8)}...
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/30">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {auditTrail.length} {auditTrail.length === 1 ? 'change' : 'changes'} recorded
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              data-testid="button-close-audit-trail"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimesheetAuditTrailModal;
