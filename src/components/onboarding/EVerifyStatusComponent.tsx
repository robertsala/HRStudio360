import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '../../lib/queryClient';
import { useToast } from '../../hooks/use-toast';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Play,
  RefreshCw,
  FileText,
  Calendar,
  User,
  Building2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { EVerifyCase, NewHire, EVerifyCaseHistory } from '../../../shared/schema';

interface EVerifyStatusComponentProps {
  newHire: NewHire;
  i9FormId?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: typeof Shield }> = {
  pending: { label: 'Pending Submission', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Clock },
  submitted: { label: 'Submitted', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: RefreshCw },
  employment_authorized: { label: 'Employment Authorized', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle },
  ssa_tnc_issued: { label: 'SSA TNC Issued', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', icon: AlertTriangle },
  dhs_tnc_issued: { label: 'DHS TNC Issued', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', icon: AlertTriangle },
  tnc_contested: { label: 'TNC Contested', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', icon: FileText },
  tnc_resolved_authorized: { label: 'TNC Resolved - Authorized', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle },
  tnc_resolved_final_nonconfirmation: { label: 'Final Nonconfirmation', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
  closed_case_authorized: { label: 'Closed - Authorized', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle },
  closed_case_unauthorized: { label: 'Closed - Unauthorized', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
  case_in_continuance: { label: 'Case in Continuance', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700', icon: Clock }
};

export default function EVerifyStatusComponent({ newHire, i9FormId }: EVerifyStatusComponentProps) {
  const { toast } = useToast();
  const [showHistory, setShowHistory] = useState(false);

  const { data: eVerifyCase, isLoading, isError } = useQuery<EVerifyCase | null>({
    queryKey: ['/api/e-verify/cases/new-hire', newHire.id],
    enabled: !!newHire?.id,
    retry: false,
  });

  const { data: caseHistory = [] } = useQuery<EVerifyCaseHistory[]>({
    queryKey: ['/api/e-verify/cases', eVerifyCase?.id, 'history'],
    enabled: !!eVerifyCase?.id && showHistory,
  });

  const createCaseMutation = useMutation({
    mutationFn: async () => {
      if (!i9FormId) {
        throw new Error('I-9 form must be completed before creating E-Verify case');
      }
      return apiRequest('/api/e-verify/cases', {
        method: 'POST',
        body: JSON.stringify({
          i9FormId,
          newHireId: newHire.id,
          hireDate: newHire.startDate,
          status: 'pending'
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/e-verify/cases/new-hire', newHire.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/e-verify/cases'] });
      toast({
        title: 'E-Verify Case Created',
        description: 'The E-Verify case has been initiated. Submit within the deadline shown.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create E-Verify case. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateCaseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      return apiRequest(`/api/e-verify/cases/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/e-verify/cases/new-hire', newHire.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/e-verify/cases'] });
      toast({
        title: 'Case Updated',
        description: 'E-Verify case status has been updated.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update E-Verify case. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const calculateDaysRemaining = (deadline: string | null): number | null => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    return Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDeadlineStatus = (daysRemaining: number | null) => {
    if (daysRemaining === null) return null;
    if (daysRemaining < 0) return { text: `${Math.abs(daysRemaining)} days overdue`, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', urgent: true };
    if (daysRemaining === 0) return { text: 'Due today!', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', urgent: true };
    if (daysRemaining === 1) return { text: '1 day remaining', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', urgent: true };
    if (daysRemaining <= 3) return { text: `${daysRemaining} days remaining`, color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', urgent: false };
    return { text: `${daysRemaining} days remaining`, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', urgent: false };
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-teal-600" />
          <span className="text-gray-600 dark:text-gray-400">Loading E-Verify status...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-6" data-testid="everify-error">
        <div className="flex items-start space-x-4">
          <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg">
            <XCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Unable to Load E-Verify Status</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              There was a problem loading the E-Verify case information. Please try refreshing the page or contact support if the issue persists.
            </p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/e-verify/cases/new-hire', newHire.id] })}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              data-testid="button-retry-everify"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!eVerifyCase) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6" data-testid="everify-no-case">
        <div className="flex items-start space-x-4">
          <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 p-3 rounded-lg">
            <Shield className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">E-Verify Case</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              No E-Verify case has been created for this new hire yet. 
              {!i9FormId && ' Complete the I-9 form first before initiating E-Verify.'}
            </p>
            
            {i9FormId ? (
              <button
                onClick={() => createCaseMutation.mutate()}
                disabled={createCaseMutation.isPending}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                data-testid="button-create-everify-case"
              >
                {createCaseMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>{createCaseMutation.isPending ? 'Creating...' : 'Initiate E-Verify Case'}</span>
              </button>
            ) : (
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                <span>Complete I-9 form first</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[eVerifyCase.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const daysRemaining = calculateDaysRemaining(eVerifyCase.submissionDeadline);
  const deadlineStatus = getDeadlineStatus(daysRemaining);
  const isSubmitted = eVerifyCase.submittedAt !== null;

  return (
    <div className="space-y-4" data-testid="everify-case-status">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className={`${statusConfig.bgColor} ${statusConfig.color} p-3 rounded-lg`}>
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">E-Verify Case</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                  {eVerifyCase.caseNumber && (
                    <span className="text-sm text-gray-500">
                      Case #{eVerifyCase.caseNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {!isSubmitted && deadlineStatus && (
              <div className={`px-4 py-2 rounded-lg ${deadlineStatus.bgColor} ${deadlineStatus.urgent ? 'animate-pulse' : ''}`}>
                <div className="flex items-center space-x-2">
                  <Clock className={`h-4 w-4 ${deadlineStatus.color}`} />
                  <span className={`font-medium ${deadlineStatus.color}`}>{deadlineStatus.text}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Hire Date:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(eVerifyCase.hireDate).toLocaleDateString()}
              </span>
            </div>
            
            {eVerifyCase.submissionDeadline && (
              <div className="flex items-center space-x-3 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Submission Deadline:</span>
                <span className={`font-medium ${deadlineStatus && daysRemaining !== null && daysRemaining < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                  {new Date(eVerifyCase.submissionDeadline).toLocaleDateString()}
                </span>
              </div>
            )}

            {eVerifyCase.submittedAt && (
              <div className="flex items-center space-x-3 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-600 dark:text-gray-400">Submitted:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(eVerifyCase.submittedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {eVerifyCase.ssaVerificationStatus && (
              <div className="flex items-center space-x-3 text-sm">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">SSA Status:</span>
                <span className={`font-medium px-2 py-0.5 rounded ${
                  eVerifyCase.ssaVerificationStatus === 'verified' ? 'bg-green-100 text-green-600' :
                  eVerifyCase.ssaVerificationStatus === 'tnc' ? 'bg-orange-100 text-orange-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {eVerifyCase.ssaVerificationStatus.toUpperCase()}
                </span>
              </div>
            )}

            {eVerifyCase.dhsVerificationStatus && (
              <div className="flex items-center space-x-3 text-sm">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">DHS Status:</span>
                <span className={`font-medium px-2 py-0.5 rounded ${
                  eVerifyCase.dhsVerificationStatus === 'verified' ? 'bg-green-100 text-green-600' :
                  eVerifyCase.dhsVerificationStatus === 'tnc' ? 'bg-orange-100 text-orange-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {eVerifyCase.dhsVerificationStatus.toUpperCase()}
                </span>
              </div>
            )}

            {eVerifyCase.photoMatchRequired && (
              <div className="flex items-center space-x-3 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Photo Match:</span>
                <span className={`font-medium px-2 py-0.5 rounded ${
                  eVerifyCase.photoMatchStatus === 'matched' ? 'bg-green-100 text-green-600' :
                  eVerifyCase.photoMatchStatus === 'no_match' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {(eVerifyCase.photoMatchStatus || 'Pending').replace('_', ' ').toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {eVerifyCase.tncIssued && (
          <div className="p-4 mx-6 mb-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-orange-800 dark:text-orange-200">Tentative Nonconfirmation (TNC) Issued</h5>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Type: {eVerifyCase.tncType?.toUpperCase()} | 
                  Contested: {eVerifyCase.tncContested ? 'Yes' : 'No'}
                  {eVerifyCase.tncReferralDeadline && (
                    <span> | Referral Deadline: {new Date(eVerifyCase.tncReferralDeadline).toLocaleDateString()}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 pb-6 flex items-center justify-between">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center space-x-1"
            data-testid="button-toggle-history"
          >
            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span>{showHistory ? 'Hide' : 'Show'} Case History</span>
          </button>

          {eVerifyCase.status === 'pending' && !isSubmitted && (
            <button
              onClick={() => updateCaseMutation.mutate({
                id: eVerifyCase.id,
                updates: { status: 'submitted', submittedAt: new Date().toISOString() }
              })}
              disabled={updateCaseMutation.isPending}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              data-testid="button-mark-submitted"
            >
              {updateCaseMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span>Mark as Submitted</span>
            </button>
          )}
        </div>

        {showHistory && caseHistory.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">Case History</h5>
            <div className="space-y-3">
              {caseHistory.map((entry) => (
                <div key={entry.id} className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 dark:text-white">
                        {entry.previousStatus ? `${entry.previousStatus} → ${entry.newStatus}` : entry.newStatus}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : ''}
                      </span>
                    </div>
                    {entry.changeReason && (
                      <p className="text-gray-600 dark:text-gray-400 mt-0.5">{entry.changeReason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {eVerifyCase.employerCaseNote && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>HR Notes</span>
          </h5>
          <p className="text-sm text-gray-600 dark:text-gray-400">{eVerifyCase.employerCaseNote}</p>
        </div>
      )}
    </div>
  );
}
