import { supabase } from './supabaseClient';

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
      const { data, error } = await supabase
        .from('change_log')
        .insert({
          change_type: entry.change_type,
          title: entry.title,
          description: entry.description,
          affected_modules: entry.affected_modules || [],
          impact_level: entry.impact_level,
          visibility_scope: entry.visibility_scope,
          user_id: entry.user_id,
          technical_details: entry.technical_details,
          notification_sent: false,
          version: entry.version
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`Change log created: ${entry.title}`);
      return data?.id || null;
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
      let query = supabase
        .from('change_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filters?.change_type) {
        query = query.eq('change_type', filters.change_type);
      }

      if (filters?.impact_level) {
        query = query.eq('impact_level', filters.impact_level);
      }

      if (filters?.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters?.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching change logs:', error);
      return [];
    }
  }

  async getHistoricalChanges(limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('historical_changes')
        .select('*')
        .order('change_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
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
      const { data: recentChanges, error: changesError } = await supabase
        .from('change_log')
        .select('id')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (changesError) throw changesError;

      const changeIds = recentChanges?.map(c => c.id) || [];

      if (changeIds.length === 0) return 0;

      const { data: readNotifications, error: notifError } = await supabase
        .from('change_notifications')
        .select('change_log_id')
        .eq('user_id', userId)
        .not('read_at', 'is', null);

      if (notifError) throw notifError;

      const readChangeIds = new Set(readNotifications?.map(n => n.change_log_id) || []);
      const unreadCount = changeIds.filter(id => !readChangeIds.has(id)).length;

      return unreadCount;
    } catch (error) {
      console.error('Error getting unread changes count:', error);
      return 0;
    }
  }

  async createNotifications(changeLogId: string, userIds: string[]): Promise<void> {
    try {
      const notifications = userIds.map(userId => ({
        change_log_id: changeLogId,
        user_id: userId,
        notification_type: 'in_app' as const
      }));

      const { error } = await supabase
        .from('change_notifications')
        .insert(notifications);

      if (error) throw error;

      await supabase
        .from('change_log')
        .update({ notification_sent: true })
        .eq('id', changeLogId);

      console.log(`Notifications created for ${userIds.length} users`);
    } catch (error) {
      console.error('Error creating notifications:', error);
    }
  }

  async markNotificationAsRead(changeLogId: string, userId: string): Promise<void> {
    try {
      let { data: existing, error: fetchError } = await supabase
        .from('change_notifications')
        .select('id')
        .eq('change_log_id', changeLogId)
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        const { error: updateError } = await supabase
          .from('change_notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('change_log_id', changeLogId)
          .eq('user_id', userId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('change_notifications')
          .insert({
            change_log_id: changeLogId,
            user_id: userId,
            notification_type: 'in_app',
            read_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('change_notifications')
        .select('*, change_log(*)')
        .eq('user_id', userId)
        .order('delivered_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
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
      const { data: allChanges, error } = await supabase
        .from('change_log')
        .select('change_type, created_at');

      if (error) throw error;

      const byType: Record<string, number> = {};
      let recentChanges = 0;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      allChanges?.forEach(change => {
        byType[change.change_type] = (byType[change.change_type] || 0) + 1;
        if (new Date(change.created_at) > sevenDaysAgo) {
          recentChanges++;
        }
      });

      return {
        total_changes: allChanges?.length || 0,
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

      if (visibilityScope === 'all_employees') {
        const { data: users, error } = await supabase
          .from('profiles')
          .select('id');

        if (error) throw error;
        userIds = users?.map(u => u.id) || [];
      } else if (visibilityScope === 'hr_only') {
        const { data: users, error } = await supabase
          .from('profiles')
          .select('id')
          .or('role.eq.hr,department.eq.HR');

        if (error) throw error;
        userIds = users?.map(u => u.id) || [];
      } else if (visibilityScope === 'product_owner_only') {
        const { data: users, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin');

        if (error) throw error;
        userIds = users?.map(u => u.id) || [];
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
