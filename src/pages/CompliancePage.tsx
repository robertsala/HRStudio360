import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Shield, AlertTriangle, CheckCircle2, XCircle, Clock, FileText, 
  Search, Filter, User, ChevronDown, ChevronRight,
  AlertCircle, Info, Loader2, ClipboardCheck, BookOpen
} from 'lucide-react';
import { useDashboardEscape } from '../hooks/useDashboardEscape';
import { apiRequest, queryClient } from '../lib/queryClient';
import type { 
  ComplianceFramework, ComplianceAlert, ComplianceAuditTrail, 
  CompliancePolicy, ComplianceControl 
} from '../../shared/schema';

interface DashboardData {
  frameworks: ComplianceFramework[];
  activeFrameworks: ComplianceFramework[];
  controls: ComplianceControl[];
  alerts: ComplianceAlert[];
  policies: CompliancePolicy[];
  overallScore: number;
  totalControls: number;
  compliantControls: number;
  openAlerts: number;
  criticalAlerts: number;
  pendingPolicies: number;
  overdueTraining: number;
}

const CompliancePage: React.FC = () => {
  const [location] = useLocation();
  
  const query = useMemo(() => new URLSearchParams(location.split('?')[1] ?? ''), [location]);
  const tabFromURL = query.get('tab') || 'dashboard';
  
  const [activeTab, setActiveTab] = useState(tabFromURL);
  const [, setLocation] = useLocation();
  
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<string>('all');
  const [alertStatusFilter, setAlertStatusFilter] = useState<string>('all');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>('all');
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [expandedFramework, setExpandedFramework] = useState<string | null>(null);
  
  useDashboardEscape(() => {
    if (expandedFramework) {
      setExpandedFramework(null);
      return false;
    }
    return true;
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setLocation(`/compliance?tab=${tab}`);
  };

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ['/api/compliance/dashboard'],
  });

  const { data: frameworks = [], isLoading: frameworksLoading } = useQuery<ComplianceFramework[]>({
    queryKey: ['/api/compliance/frameworks'],
    enabled: activeTab === 'frameworks',
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<ComplianceAlert[]>({
    queryKey: ['/api/compliance/alerts'],
    enabled: activeTab === 'alerts',
  });

  const { data: auditTrail = [], isLoading: auditLoading } = useQuery<ComplianceAuditTrail[]>({
    queryKey: ['/api/compliance/audit-trail'],
    enabled: activeTab === 'audit',
  });

  const { data: policies = [], isLoading: policiesLoading } = useQuery<CompliancePolicy[]>({
    queryKey: ['/api/compliance/policies'],
    enabled: activeTab === 'policies',
  });

  const { data: controls = [] } = useQuery<ComplianceControl[]>({
    queryKey: ['/api/compliance/controls'],
    enabled: activeTab === 'frameworks' && !!expandedFramework,
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return apiRequest(`/api/compliance/alerts/${alertId}/acknowledge`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/dashboard'] });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: string; notes?: string }) => {
      return apiRequest(`/api/compliance/alerts/${alertId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'resolved', resolutionNotes: notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/dashboard'] });
    },
  });

  const acknowledgePolicyMutation = useMutation({
    mutationFn: async (policyId: string) => {
      return apiRequest(`/api/compliance/policy-acknowledgments`, {
        method: 'POST',
        body: JSON.stringify({ policyId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/policies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/dashboard'] });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400';
      case 'info': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400';
      case 'non_compliant': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400';
      case 'partial': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400';
      case 'pending_review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400';
    }
  };

  const getAlertStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400';
      case 'dismissed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400';
    }
  };

  const getFrameworkIcon = (code: string) => {
    switch (code) {
      case 'SOC1':
      case 'SOC2': return <Shield className="h-6 w-6 text-blue-500" />;
      case 'GDPR':
      case 'CCPA': return <FileText className="h-6 w-6 text-purple-500" />;
      case 'HIPAA': return <Shield className="h-6 w-6 text-red-500" />;
      case 'ISO27001': return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'PCI_DSS': return <Shield className="h-6 w-6 text-orange-500" />;
      case 'NIST': return <Shield className="h-6 w-6 text-indigo-500" />;
      default: return <Shield className="h-6 w-6 text-gray-500" />;
    }
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (alertSeverityFilter !== 'all' && alert.severity !== alertSeverityFilter) return false;
      if (alertStatusFilter !== 'all' && alert.status !== alertStatusFilter) return false;
      return true;
    });
  }, [alerts, alertSeverityFilter, alertStatusFilter]);

  const filteredAuditTrail = useMemo(() => {
    return auditTrail.filter(entry => {
      if (auditCategoryFilter !== 'all' && entry.category !== auditCategoryFilter) return false;
      if (auditSearchTerm && !entry.action.toLowerCase().includes(auditSearchTerm.toLowerCase())) return false;
      return true;
    });
  }, [auditTrail, auditCategoryFilter, auditSearchTerm]);

  const controlsForFramework = useMemo(() => {
    if (!expandedFramework) return [];
    return controls.filter(c => c.frameworkId === expandedFramework);
  }, [controls, expandedFramework]);

  const alertCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    const openAlerts = dashboardData?.alerts || alerts;
    openAlerts
      .filter(a => a.status === 'open')
      .forEach(a => {
        counts[a.severity as keyof typeof counts]++;
      });
    return counts;
  }, [dashboardData?.alerts, alerts]);

  const overallScore = dashboardData?.overallScore ?? 0;

  const renderDashboardTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Overall Compliance Score</h3>
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={overallScore >= 80 ? '#22c55e' : overallScore >= 60 ? '#eab308' : '#ef4444'}
                strokeWidth="8"
                strokeDasharray={`${overallScore * 2.83} 283`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-800 dark:text-white">{overallScore}%</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {dashboardData?.compliantControls ?? 0} of {dashboardData?.totalControls ?? 0} controls compliant
          </p>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Alerts Summary</h3>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Critical', count: alertCounts.critical, color: 'bg-red-500' },
              { label: 'High', count: alertCounts.high, color: 'bg-orange-500' },
              { label: 'Medium', count: alertCounts.medium, color: 'bg-yellow-500' },
              { label: 'Low', count: alertCounts.low, color: 'bg-blue-500' },
              { label: 'Info', count: alertCounts.info, color: 'bg-gray-500' },
            ].map(item => (
              <div 
                key={item.label}
                className="flex flex-col items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <div className={`w-3 h-3 rounded-full ${item.color} mb-2`} />
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{item.count}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Controls', value: dashboardData?.totalControls ?? 0, icon: ClipboardCheck, color: 'text-blue-500' },
          { label: 'Compliant', value: dashboardData?.compliantControls ?? 0, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Open Alerts', value: dashboardData?.openAlerts ?? 0, icon: AlertTriangle, color: 'text-orange-500' },
          { label: 'Pending Policies', value: dashboardData?.pendingPolicies ?? 0, icon: FileText, color: 'text-purple-500' },
          { label: 'Overdue Training', value: dashboardData?.overdueTraining ?? 0, icon: BookOpen, color: 'text-red-500' },
        ].map(stat => (
          <div 
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Framework Status</h3>
        {dashboardLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : !dashboardData?.activeFrameworks?.length ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No active compliance frameworks configured</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Add frameworks to track your compliance status</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.activeFrameworks.map(framework => (
              <div 
                key={framework.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  handleTabChange('frameworks');
                  setExpandedFramework(framework.id);
                }}
                data-testid={`card-framework-${framework.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getFrameworkIcon(framework.code)}
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white">{framework.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{framework.code}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(framework.overallStatus || 'pending_review')}`}>
                    {(framework.overallStatus || 'pending_review').replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Compliance Score</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{framework.complianceScore ?? 0}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last Audit</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatDate(framework.lastAuditDate)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAlertsTab = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={alertSeverityFilter}
            onChange={(e) => setAlertSeverityFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white text-sm"
            data-testid="select-severity-filter"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={alertStatusFilter}
            onChange={(e) => setAlertStatusFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white text-sm"
            data-testid="select-status-filter"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredAlerts.length} alerts
        </span>
      </div>

      {alertsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No alerts match your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map(alert => (
            <div 
              key={alert.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              data-testid={`alert-item-${alert.id}`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white">{alert.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{alert.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAlertStatusColor(alert.status)}`}>
                        {alert.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>Category: {alert.category}</span>
                    {alert.dueDate && <span>Due: {formatDate(alert.dueDate)}</span>}
                  </div>
                  {(alert.status === 'open' || alert.status === 'acknowledged') && (
                    <div className="flex items-center gap-2 mt-3">
                      {alert.status === 'open' && (
                        <button
                          onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                          disabled={acknowledgeAlertMutation.isPending}
                          className="px-3 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors disabled:opacity-50"
                          data-testid={`button-acknowledge-${alert.id}`}
                        >
                          {acknowledgeAlertMutation.isPending ? 'Acknowledging...' : 'Acknowledge'}
                        </button>
                      )}
                      <button
                        onClick={() => resolveAlertMutation.mutate({ alertId: alert.id })}
                        disabled={resolveAlertMutation.isPending}
                        className="px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        data-testid={`button-resolve-${alert.id}`}
                      >
                        {resolveAlertMutation.isPending ? 'Resolving...' : 'Resolve'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFrameworksTab = () => (
    <div className="space-y-4">
      {frameworksLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : frameworks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No compliance frameworks configured</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Contact your administrator to set up compliance tracking</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {frameworks.map(framework => (
            <div 
              key={framework.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              data-testid={`framework-card-${framework.id}`}
            >
              <div 
                className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => setExpandedFramework(expandedFramework === framework.id ? null : framework.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getFrameworkIcon(framework.code)}
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white">{framework.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{framework.description || framework.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800 dark:text-white">{framework.complianceScore ?? 0}%</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {framework.compliantControls ?? 0}/{framework.totalControls ?? 0} controls
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(framework.overallStatus || 'pending_review')}`}>
                      {(framework.overallStatus || 'pending_review').replace('_', ' ')}
                    </span>
                    {expandedFramework === framework.id ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {expandedFramework === framework.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-800/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Last Audit</p>
                      <p className="font-medium text-gray-800 dark:text-white">{formatDate(framework.lastAuditDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Next Audit</p>
                      <p className="font-medium text-gray-800 dark:text-white">{formatDate(framework.nextAuditDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Certification Expiry</p>
                      <p className="font-medium text-gray-800 dark:text-white">{formatDate(framework.certificationExpiry)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Auditor</p>
                      <p className="font-medium text-gray-800 dark:text-white">{framework.auditorOrganization || 'N/A'}</p>
                    </div>
                  </div>

                  <h5 className="font-semibold text-gray-800 dark:text-white mb-3">Controls</h5>
                  {controlsForFramework.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No controls defined for this framework</p>
                  ) : (
                    <div className="space-y-2">
                      {controlsForFramework.map(control => (
                        <div 
                          key={control.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {control.status === 'compliant' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : control.status === 'non_compliant' ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-500" />
                            )}
                            <div>
                              <p className="font-medium text-gray-800 dark:text-white">{control.controlId}: {control.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{control.category}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(control.status)}`}>
                            {control.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAuditTab = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search audit logs..."
            value={auditSearchTerm}
            onChange={(e) => setAuditSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm"
            data-testid="input-audit-search"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={auditCategoryFilter}
            onChange={(e) => setAuditCategoryFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white text-sm"
            data-testid="select-audit-category"
          >
            <option value="all">All Categories</option>
            <option value="authentication">Authentication</option>
            <option value="authorization">Authorization</option>
            <option value="data_access">Data Access</option>
            <option value="data_modification">Data Modification</option>
            <option value="system_change">System Change</option>
            <option value="user_management">User Management</option>
            <option value="security">Security</option>
            <option value="compliance">Compliance</option>
          </select>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredAuditTrail.length} entries
        </span>
      </div>

      {auditLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : filteredAuditTrail.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No audit entries found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actor</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Resource</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAuditTrail.slice(0, 50).map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400">
                        {entry.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">{entry.action}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {entry.actorEmail || 'System'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {entry.resourceName || entry.resourceType}
                    </td>
                    <td className="px-4 py-3">
                      {entry.success ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400">
                          Success
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400">
                          Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderPoliciesTab = () => (
    <div className="space-y-4">
      {policiesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : policies.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No compliance policies available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Policies will appear here when created by administrators</p>
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map(policy => (
            <div 
              key={policy.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
              data-testid={`policy-item-${policy.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <FileText className="h-8 w-8 text-purple-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white">{policy.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{policy.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>Version: {policy.version}</span>
                      <span>Category: {policy.category}</span>
                      <span>Effective: {formatDate(policy.effectiveDate)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${policy.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400'}`}>
                    {policy.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {policy.requiresAcknowledgment && (
                    <button
                      onClick={() => acknowledgePolicyMutation.mutate(policy.id)}
                      disabled={acknowledgePolicyMutation.isPending}
                      className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      data-testid={`button-acknowledge-policy-${policy.id}`}
                    >
                      {acknowledgePolicyMutation.isPending ? 'Acknowledging...' : 'Acknowledge'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Shield },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'frameworks', label: 'Frameworks', icon: ClipboardCheck },
    { id: 'audit', label: 'Audit Trail', icon: FileText },
    { id: 'policies', label: 'Policies', icon: BookOpen },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
          <div className="flex items-center">
            <Shield className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Compliance Hub</h2>
              <p className="text-blue-100">Centralized compliance management and monitoring</p>
            </div>
          </div>
          <button
            disabled
            className="px-4 py-2 bg-white/20 text-white rounded-lg cursor-not-allowed opacity-70 flex items-center gap-2"
            title="Coming Soon"
            data-testid="button-run-compliance-check"
          >
            <CheckCircle2 className="h-4 w-4" />
            Run Compliance Check
            <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full">Coming Soon</span>
          </button>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <nav className="flex space-x-1 px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && renderDashboardTab()}
          {activeTab === 'alerts' && renderAlertsTab()}
          {activeTab === 'frameworks' && renderFrameworksTab()}
          {activeTab === 'audit' && renderAuditTab()}
          {activeTab === 'policies' && renderPoliciesTab()}
        </div>
      </div>
    </div>
  );
};

export default CompliancePage;
