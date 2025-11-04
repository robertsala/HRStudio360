import { apiClient } from '../lib/api';

// Helper to convert camelCase API response to snake_case for backward compatibility
function normalizeChangeLog(log: any): any {
  if (!log) return null;
  return {
    id: log.id,
    change_type: log.changeType,
    title: log.title,
    description: log.description,
    affected_modules: log.affectedModules,
    impact_level: log.impactLevel,
    visibility_scope: log.visibilityScope,
    user_id: log.userId,
    technical_details: log.technicalDetails,
    notification_sent: log.notificationSent,
    version: log.version,
    created_at: log.createdAt
  };
}

function normalizeHistoricalChange(change: any): any {
  if (!change) return null;
  return {
    id: change.id,
    change_date: change.changeDate,
    title: change.title,
    description: change.description,
    change_type: change.changeType,
    created_at: change.createdAt
  };
}

function normalizeChangeNotification(notification: any): any {
  if (!notification) return null;
  return {
    id: notification.id,
    change_log_id: notification.changeLogId,
    user_id: notification.userId,
    notification_type: notification.notificationType,
    delivered_at: notification.deliveredAt,
    read_at: notification.readAt,
    acknowledged: notification.acknowledged,
    change_log: notification.change_log ? normalizeChangeLog(notification.change_log) : undefined
  };
}

export interface ChangeLogEntry {
  id?: string;
  change_type: 'update' | 'improvement' | 'fix' | 'feature' | 'system_change' | 'auto_fix' | 'restoration' | 'configuration';
  title: string;
  description: string;
  affected_modules?: string[];
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  visibility_scope: 'all_employees' | 'hr_only' | 'product_owner_only';
  user_id?: string;
  technical_details?: any;
  notification_sent?: boolean;
  version?: string;
  created_at?: string;
}

export interface ChangeNotification {
  id?: string;
  change_log_id: string;
  user_id: string;
  notification_type: 'in_app' | 'email' | 'digest';
  delivered_at?: string;
  read_at?: string;
  acknowledged?: boolean;
}

class ChangeLogService {
  async createChangeLog(entry: ChangeLogEntry): Promise<string | null> {
    try {
      const changeLog: any = await apiClient.createChangeLog({
        changeType: entry.change_type,
        title: entry.title,
        description: entry.description,
        affectedModules: entry.affected_modules || [],
        impactLevel: entry.impact_level,
        visibilityScope: entry.visibility_scope,
        userId: entry.user_id,
        technicalDetails: entry.technical_details,
        notificationSent: false,
        version: entry.version
      });

      console.log(`Change log created: ${entry.title}`);
      return changeLog?.id || null;
    } catch (error) {
      console.error('Error creating change log:', error);
      return null;
    }
  }

  async getChangeLogs(
    filters?: {
      change_type?: string;
      impact_level?: string;
      start_date?: string;
      end_date?: string;
      search?: string;
    },
    limit: number = 100
  ): Promise<ChangeLogEntry[]> {
    try {
      const apiFilters: any = {};
      if (filters?.change_type) apiFilters.changeType = filters.change_type;
      if (filters?.start_date) apiFilters.startDate = filters.start_date;
      if (filters?.end_date) apiFilters.endDate = filters.end_date;

      let logs: any[] = await apiClient.getChangeLogs(apiFilters, limit);

      // Apply client-side filtering for features not supported by backend
      if (filters?.impact_level) {
        logs = logs.filter((log: any) => log.impactLevel === filters.impact_level);
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        logs = logs.filter((log: any) =>
          log.title?.toLowerCase().includes(searchLower) ||
          log.description?.toLowerCase().includes(searchLower)
        );
      }

      // Normalize to snake_case for backward compatibility
      return logs.map(normalizeChangeLog);
    } catch (error) {
      console.error('Error fetching change logs:', error);
      return [];
    }
  }

  async getHistoricalChanges(limit: number = 100): Promise<any[]> {
    try {
      const changes = await apiClient.getHistoricalChanges(limit);
      // Normalize to snake_case for backward compatibility
      return (changes || []).map(normalizeHistoricalChange);
    } catch (error) {
      console.error('Error fetching historical changes:', error);
      return [];
    }
  }

  async getAllChanges(
    filters?: {
      change_type?: string;
      start_date?: string;
      end_date?: string;
      search?: string;
    },
    limit: number = 100
  ): Promise<any[]> {
    try {
      const [changeLogs, historicalChanges] = await Promise.all([
        this.getChangeLogs(filters, limit),
        this.getHistoricalChanges(limit)
      ]);

      const allChanges = [
        ...changeLogs.map(log => ({
          ...log,
          source: 'change_log',
          date: log.created_at
        })),
        ...historicalChanges.map(change => ({
          ...change,
          source: 'historical',
          date: change.change_date,
          impact_level: 'medium',
          visibility_scope: 'all_employees'
        }))
      ];

      allChanges.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (filters?.change_type) {
        return allChanges.filter(change => change.change_type === filters.change_type);
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        return allChanges.filter(change =>
          change.title?.toLowerCase().includes(searchLower) ||
          change.description?.toLowerCase().includes(searchLower)
        );
      }

      return allChanges.slice(0, limit);
    } catch (error) {
      console.error('Error fetching all changes:', error);
      return [];
    }
  }

  async getUnreadChangesCount(userId: string): Promise<number> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const recentChanges: any[] = await apiClient.getChangeLogs({ startDate: sevenDaysAgo });

      const changeIds = recentChanges.map(c => c.id);
      if (changeIds.length === 0) return 0;

      const notifications: any[] = await apiClient.getChangeNotifications(userId);
      const readChangeIds = new Set(
        notifications
          .filter(n => n.readAt)
          .map(n => n.changeLogId)
      );

      const unreadCount = changeIds.filter(id => !readChangeIds.has(id)).length;
      return unreadCount;
    } catch (error) {
      console.error('Error getting unread changes count:', error);
      return 0;
    }
  }

  async createNotifications(changeLogId: string, userIds: string[]): Promise<void> {
    try {
      await Promise.all(
        userIds.map(userId =>
          apiClient.createChangeNotification({
            changeLogId,
            userId,
            notificationType: 'in_app'
          })
        )
      );

      await apiClient.updateChangeLog(changeLogId, { notificationSent: true });
      console.log(`Notifications created for ${userIds.length} users`);
    } catch (error) {
      console.error('Error creating notifications:', error);
    }
  }

  async markNotificationAsRead(changeLogId: string, userId: string): Promise<void> {
    try {
      await apiClient.markChangeNotificationRead(changeLogId, userId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<any[]> {
    try {
      let notifications: any[] = await apiClient.getChangeNotifications(userId);
      
      // Fetch change log details for each notification
      const notificationsWithDetails = await Promise.all(
        notifications.slice(0, limit).map(async (notification: any) => {
          try {
            const changeLog = await apiClient.getChangeLog(notification.changeLogId);
            return normalizeChangeNotification({
              ...notification,
              change_log: changeLog
            });
          } catch (error) {
            console.error('Failed to fetch change log details:', error);
            return normalizeChangeNotification(notification);
          }
        })
      );

      return notificationsWithDetails;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }

  async getChangeStats(): Promise<{
    total_changes: number;
    by_type: Record<string, number>;
    recent_changes: number;
  }> {
    try {
      const allChanges: any[] = await apiClient.getChangeLogs({}, 1000);

      const byType: Record<string, number> = {};
      let recentChanges = 0;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      allChanges.forEach(change => {
        byType[change.changeType] = (byType[change.changeType] || 0) + 1;
        if (new Date(change.createdAt) > sevenDaysAgo) {
          recentChanges++;
        }
      });

      return {
        total_changes: allChanges.length,
        by_type: byType,
        recent_changes: recentChanges
      };
    } catch (error) {
      console.error('Error getting change stats:', error);
      return { total_changes: 0, by_type: {}, recent_changes: 0 };
    }
  }

  async sendChangeNotifications(changeLogId: string, visibilityScope: string): Promise<void> {
    try {
      let userIds: string[] = [];

      // Get all profiles
      const profiles: any[] = await apiClient.getProfiles();

      if (visibilityScope === 'all_employees') {
        userIds = profiles.map(u => u.id);
      } else if (visibilityScope === 'hr_only') {
        userIds = profiles
          .filter(u => u.role === 'hr' || u.department === 'HR')
          .map(u => u.id);
      } else if (visibilityScope === 'product_owner_only') {
        userIds = profiles
          .filter(u => u.role === 'admin')
          .map(u => u.id);
      }

      if (userIds.length > 0) {
        await this.createNotifications(changeLogId, userIds);
      }
    } catch (error) {
      console.error('Error sending change notifications:', error);
    }
  }
}

export const changeLogService = new ChangeLogService();
