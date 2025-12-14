import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight,
  RefreshCw,
  User
} from 'lucide-react';
import type { EVerifyCase, NewHire } from '../../../shared/schema';

interface EVerifyDashboardWidgetProps {
  onViewAll?: () => void;
}

interface EVerifyCaseWithNewHire extends EVerifyCase {
  newHire?: NewHire;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: typeof Shield }> = {
  pending: { label: 'Pending', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Clock },
  submitted: { label: 'Submitted', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: RefreshCw },
  employment_authorized: { label: 'Authorized', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle },
  ssa_tnc_issued: { label: 'SSA TNC', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30', icon: AlertTriangle },
  dhs_tnc_issued: { label: 'DHS TNC', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30', icon: AlertTriangle },
  tnc_contested: { label: 'Contested', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', icon: AlertTriangle },
  closed_case_authorized: { label: 'Closed', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle },
};

export default function EVerifyDashboardWidget({ onViewAll }: EVerifyDashboardWidgetProps) {
  const [, setLocation] = useLocation();

  const { data: cases = [], isLoading, isError } = useQuery<EVerifyCaseWithNewHire[]>({
    queryKey: ['/api/e-verify/cases'],
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  const { data: newHires = [] } = useQuery<NewHire[]>({
    queryKey: ['/api/new-hires'],
    staleTime: 1000 * 60 * 5,
  });

  const newHireMap = new Map(newHires.map(nh => [nh.id, nh]));

  const calculateDaysRemaining = (deadline: string | null): number | null => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    return Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const pendingCases = cases.filter(c => c.status === 'pending');
  const overdueCases = cases.filter(c => {
    const daysRemaining = calculateDaysRemaining(c.submissionDeadline);
    return daysRemaining !== null && daysRemaining < 0 && c.status === 'pending';
  });
  const tncCases = cases.filter(c => 
    c.status === 'ssa_tnc_issued' || c.status === 'dhs_tnc_issued' || c.status === 'tnc_contested'
  );

  const urgentCases = cases
    .filter(c => c.status !== 'closed_case_authorized' && c.status !== 'employment_authorized')
    .map(c => ({
      ...c,
      daysRemaining: calculateDaysRemaining(c.submissionDeadline),
      newHire: newHireMap.get(c.newHireId),
    }))
    .sort((a, b) => {
      if (a.daysRemaining === null) return 1;
      if (b.daysRemaining === null) return -1;
      return a.daysRemaining - b.daysRemaining;
    })
    .slice(0, 5);

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      setLocation('/onboarding');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden" data-testid="widget-everify-loading">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-white" />
            <h3 className="text-lg font-semibold text-white">E-Verify Status</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex space-x-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-1 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden" data-testid="widget-everify-error">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-white" />
            <h3 className="text-lg font-semibold text-white">E-Verify Status</h3>
          </div>
        </div>
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <p>Unable to load E-Verify data. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden" data-testid="widget-everify-empty">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-white" />
              <h3 className="text-lg font-semibold text-white">E-Verify Status</h3>
            </div>
            <button
              onClick={handleViewAll}
              className="text-white/80 hover:text-white text-sm font-medium flex items-center transition-colors"
              data-testid="button-everify-view-all-empty"
            >
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
        <div className="p-6 text-center">
          <Shield className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No E-Verify cases to display</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Cases will appear here when new hires begin onboarding</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden" data-testid="widget-everify">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-white" />
            <h3 className="text-lg font-semibold text-white">E-Verify Status</h3>
          </div>
          <button
            onClick={handleViewAll}
            className="text-white/80 hover:text-white text-sm font-medium flex items-center transition-colors"
            data-testid="button-everify-view-all"
          >
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center" data-testid="stat-pending-cases">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-1" />
              <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{pendingCases.length}</span>
            </div>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 font-medium">Pending</p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center" data-testid="stat-overdue-cases">
            <div className="flex items-center justify-center mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mr-1" />
              <span className="text-2xl font-bold text-red-700 dark:text-red-400">{overdueCases.length}</span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-500 font-medium">Overdue</p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center" data-testid="stat-tnc-cases">
            <div className="flex items-center justify-center mb-1">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mr-1" />
              <span className="text-2xl font-bold text-orange-700 dark:text-orange-400">{tncCases.length}</span>
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-500 font-medium">TNC Issued</p>
          </div>
        </div>

        {urgentCases.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Urgent Cases</h4>
            {urgentCases.map((caseItem) => {
              const statusConfig = STATUS_CONFIG[caseItem.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const daysRemaining = caseItem.daysRemaining;
              const isOverdue = daysRemaining !== null && daysRemaining < 0;
              const isDueSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3;
              
              return (
                <div
                  key={caseItem.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isOverdue 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                      : isDueSoon 
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                  }`}
                  data-testid={`card-everify-case-${caseItem.id}`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-full ${statusConfig.bgColor}`}>
                      <User className={`h-4 w-4 ${statusConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate" data-testid={`text-everify-name-${caseItem.id}`}>
                        {caseItem.newHire 
                          ? `${caseItem.newHire.firstName} ${caseItem.newHire.lastName}`
                          : 'Unknown Employee'
                        }
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`} data-testid={`badge-everify-status-${caseItem.id}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-2">
                    {daysRemaining !== null && (
                      <p className={`text-sm font-semibold ${
                        isOverdue 
                          ? 'text-red-600 dark:text-red-400' 
                          : isDueSoon 
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-gray-600 dark:text-gray-400'
                      }`} data-testid={`text-everify-days-${caseItem.id}`}>
                        {isOverdue 
                          ? `${Math.abs(daysRemaining)} days overdue`
                          : daysRemaining === 0 
                            ? 'Due today'
                            : daysRemaining === 1 
                              ? '1 day left'
                              : `${daysRemaining} days left`
                        }
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {urgentCases.length === 0 && cases.length > 0 && (
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">All cases are up to date</p>
          </div>
        )}
      </div>
    </div>
  );
}
