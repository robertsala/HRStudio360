import { useState } from 'react';
import { X, Bot, Clock, CheckCircle, AlertCircle, Play, Loader2, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';

interface AgentActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ActivityLog {
  id: string;
  action: string;
  status: 'success' | 'error' | 'running';
  details: string;
  timestamp: Date;
}

const AgentActivityModal: React.FC<AgentActivityModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  const statusQuery = useQuery({
    queryKey: ['/api/ai-agent/status'],
    queryFn: async () => {
      const response = await fetch('/api/ai-agent/status');
      if (!response.ok) throw new Error('Failed to fetch agent status');
      return response.json();
    },
    enabled: isOpen
  });

  const runDailyScreeningMutation = useMutation({
    mutationFn: async () => {
      const newActivity: ActivityLog = {
        id: Date.now().toString(),
        action: 'Daily Candidate Screening',
        status: 'running',
        details: 'Autonomous screening workflow initiated...',
        timestamp: new Date()
      };
      setActivities(prev => [newActivity, ...prev]);

      const response = await apiRequest('/api/ai-agent/run-daily-screening', {
        method: 'POST'
      });
      return { response, activityId: newActivity.id };
    },
    onSuccess: ({ response, activityId }) => {
      setActivities(prev => prev.map(act => 
        act.id === activityId 
          ? { ...act, status: 'success' as const, details: `✅ Screened ${response.results?.length || 0} candidates. ${response.message}` }
          : act
      ));
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
    },
    onError: (error: any, _, activityId: any) => {
      setActivities(prev => prev.map(act => 
        act.id === activityId 
          ? { ...act, status: 'error' as const, details: `❌ Error: ${error.message}` }
          : act
      ));
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-xl font-semibold text-white" data-testid="text-modal-title">
                AI Agent Activity Dashboard
              </h2>
              <p className="text-sm text-indigo-100" data-testid="text-modal-subtitle">
                Monitor autonomous agent actions and triggers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            data-testid="button-close-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Agent Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                <Bot className="w-5 h-5 mr-2 text-purple-600" />
                Agent Status
              </h3>
              {statusQuery.isLoading ? (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading status...
                </div>
              ) : statusQuery.data ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Model</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{statusQuery.data.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Capabilities</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{statusQuery.data.capabilities?.length || 0} active</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Manual Trigger Card */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white flex items-center">
                <Play className="w-5 h-5 mr-2 text-purple-600" />
                Manual Triggers
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Manually trigger autonomous workflows for testing and on-demand screening
              </p>
              <button
                onClick={() => runDailyScreeningMutation.mutate()}
                disabled={runDailyScreeningMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                data-testid="button-run-screening"
              >
                {runDailyScreeningMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Running Screening...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Run Daily Screening Now
                  </>
                )}
              </button>
            </div>

            {/* Activity Log */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                Activity Log
              </h3>
              {activities.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No activity yet. Trigger a workflow to see autonomous actions here.
                </p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                      data-testid={`activity-${activity.id}`}
                    >
                      {activity.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />}
                      {activity.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />}
                      {activity.status === 'running' && <Loader2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0 animate-spin" />}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{activity.action}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.details}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {activity.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentActivityModal;
