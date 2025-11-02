import React, { useState, useEffect } from 'react';
import {  Clock, Filter, Search, FileText, TrendingUp, Wrench, Sparkles, Settings as SettingsIcon, RefreshCw, GitBranch, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { changeLogService } from '../../utils/changeLogService';
import { useAuth } from '../../contexts/AuthContext';

const ChangeLogTab: React.FC = () => {
  const { user } = useAuth();
  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total_changes: 0, by_type: {}, recent_changes: 0 });

  useEffect(() => {
    loadChanges();
    loadStats();
  }, [selectedType, searchTerm]);

  const loadChanges = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (selectedType !== 'all') {
        filters.change_type = selectedType;
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const data = await changeLogService.getAllChanges(filters, 200);
      setChanges(data);
    } catch (error) {
      console.error('Error loading changes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await changeLogService.getChangeStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleMarkAsRead = async (changeId: string) => {
    if (user?.id) {
      await changeLogService.markNotificationAsRead(changeId, user.id);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="h-5 w-5 text-purple-600" />;
      case 'improvement':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'fix':
        return <Wrench className="h-5 w-5 text-orange-600" />;
      case 'system_change':
        return <SettingsIcon className="h-5 w-5 text-gray-600" />;
      case 'auto_fix':
        return <RefreshCw className="h-5 w-5 text-green-600" />;
      case 'restoration':
        return <GitBranch className="h-5 w-5 text-indigo-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      feature: 'New Feature',
      improvement: 'Improvement',
      fix: 'Bug Fix',
      system_change: 'System Change',
      auto_fix: 'Auto Fix',
      restoration: 'Restoration',
      update: 'Update',
      configuration: 'Configuration'
    };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'improvement':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fix':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'system_change':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'auto_fix':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'restoration':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactIcon = (level?: string) => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'low':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  const changeTypes = [
    { value: 'all', label: 'All Changes' },
    { value: 'feature', label: 'New Features' },
    { value: 'improvement', label: 'Improvements' },
    { value: 'fix', label: 'Bug Fixes' },
    { value: 'system_change', label: 'System Changes' },
    { value: 'auto_fix', label: 'Auto Fixes' },
    { value: 'restoration', label: 'Restorations' }
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Change Log
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          View all system changes, improvements, fixes, and updates. Historical data includes changes from the earliest development.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Changes</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total_changes}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/20 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Recent (7 Days)</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.recent_changes}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">Types Tracked</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{Object.keys(stats.by_type).length}</p>
            </div>
            <Sparkles className="h-8 w-8 text-green-500 opacity-50" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search changes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="sm:w-64 relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          >
            {changeTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading changes...</p>
          </div>
        ) : changes.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No changes found</p>
          </div>
        ) : (
          changes.map((change) => (
            <div
              key={change.id || change.change_date}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-0.5">
                    {getTypeIcon(change.change_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {change.title}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeBadgeColor(change.change_type)}`}>
                        {getTypeLabel(change.change_type)}
                      </span>
                      {change.impact_level && (
                        <span className="inline-flex items-center space-x-1">
                          {getImpactIcon(change.impact_level)}
                          <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                            {change.impact_level}
                          </span>
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {change.description.length > 150 && expandedId !== (change.id || change.change_date)
                        ? `${change.description.substring(0, 150)}...`
                        : change.description}
                    </p>

                    {change.description.length > 150 && (
                      <button
                        onClick={() => setExpandedId(expandedId === (change.id || change.change_date) ? null : (change.id || change.change_date))}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                      >
                        {expandedId === (change.id || change.change_date) ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Show more
                          </>
                        )}
                      </button>
                    )}

                    {change.affected_modules && change.affected_modules.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {change.affected_modules.map((module: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            {module}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {formatDate(change.date || change.created_at || change.change_date)}
                      </div>
                      {change.source && (
                        <div className="flex items-center">
                          <span className="capitalize">{change.source === 'change_log' ? 'Recent' : 'Historical'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {changes.length > 0 && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Showing {changes.length} {changes.length === 1 ? 'change' : 'changes'}
        </div>
      )}
    </div>
  );
};

export default ChangeLogTab;
