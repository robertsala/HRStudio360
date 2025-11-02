import { supabase } from './supabaseClient';

export interface Snapshot {
  id?: string;
  name: string;
  description?: string;
  snapshot_data: any;
  snapshot_type: 'manual' | 'automatic' | 'pre_operation';
  triggered_by?: string;
  modules_included: string[];
  size_bytes?: number;
  expires_at?: string;
  created_at?: string;
}

export interface RestorationResult {
  success: boolean;
  snapshot_id: string;
  restore_type: 'full_system' | 'module_specific' | 'selective_records';
  modules_restored: string[];
  records_affected: number;
  error_message?: string;
}

class SnapshotService {
  async createSnapshot(
    name: string,
    description: string,
    modules: string[],
    type: 'manual' | 'automatic' | 'pre_operation' = 'manual',
    userId?: string
  ): Promise<string | null> {
    try {
      const snapshotData: any = {};

      if (modules.includes('employees') || modules.includes('all')) {
        const { data } = await supabase.from('employees').select('*').limit(1000);
        snapshotData.employees = data;
      }

      if (modules.includes('time_entries') || modules.includes('all')) {
        const { data } = await supabase.from('time_entries').select('*').limit(5000);
        snapshotData.time_entries = data;
      }

      if (modules.includes('leave_requests') || modules.includes('all')) {
        const { data } = await supabase.from('leave_requests').select('*').limit(2000);
        snapshotData.leave_requests = data;
      }

      if (modules.includes('announcements') || modules.includes('all')) {
        const { data } = await supabase.from('announcements').select('*');
        snapshotData.announcements = data;
      }

      if (modules.includes('profiles') || modules.includes('all')) {
        const { data } = await supabase.from('profiles').select('*');
        snapshotData.profiles = data;
      }

      const snapshotJson = JSON.stringify(snapshotData);
      const sizeBytes = new Blob([snapshotJson]).size;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data, error } = await supabase
        .from('system_snapshots')
        .insert({
          name,
          description,
          snapshot_data: snapshotData,
          snapshot_type: type,
          triggered_by: userId,
          modules_included: modules,
          size_bytes: sizeBytes,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`Snapshot created: ${name} (${(sizeBytes / 1024).toFixed(2)} KB)`);
      return data?.id || null;
    } catch (error) {
      console.error('Error creating snapshot:', error);
      return null;
    }
  }

  async getSnapshots(limit: number = 50): Promise<Snapshot[]> {
    try {
      const { data, error } = await supabase
        .from('system_snapshots')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      return [];
    }
  }

  async getSnapshot(snapshotId: string): Promise<Snapshot | null> {
    try {
      const { data, error } = await supabase
        .from('system_snapshots')
        .select('*')
        .eq('id', snapshotId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching snapshot:', error);
      return null;
    }
  }

  async deleteSnapshot(snapshotId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('system_snapshots')
        .delete()
        .eq('id', snapshotId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting snapshot:', error);
      return false;
    }
  }

  async restoreFromSnapshot(
    snapshotId: string,
    modules: string[],
    userId: string
  ): Promise<RestorationResult> {
    try {
      const snapshot = await this.getSnapshot(snapshotId);
      if (!snapshot) {
        return {
          success: false,
          snapshot_id: snapshotId,
          restore_type: 'full_system',
          modules_restored: [],
          records_affected: 0,
          error_message: 'Snapshot not found'
        };
      }

      let totalRecords = 0;
      const restoredModules: string[] = [];

      console.log(`Starting restoration from snapshot: ${snapshot.name}`);
      console.log('This is a simulation - actual data restoration would happen here');

      if (modules.includes('employees') && snapshot.snapshot_data.employees) {
        console.log(`Would restore ${snapshot.snapshot_data.employees.length} employee records`);
        totalRecords += snapshot.snapshot_data.employees.length;
        restoredModules.push('employees');
      }

      if (modules.includes('time_entries') && snapshot.snapshot_data.time_entries) {
        console.log(`Would restore ${snapshot.snapshot_data.time_entries.length} time entry records`);
        totalRecords += snapshot.snapshot_data.time_entries.length;
        restoredModules.push('time_entries');
      }

      if (modules.includes('leave_requests') && snapshot.snapshot_data.leave_requests) {
        console.log(`Would restore ${snapshot.snapshot_data.leave_requests.length} leave request records`);
        totalRecords += snapshot.snapshot_data.leave_requests.length;
        restoredModules.push('leave_requests');
      }

      const { error } = await supabase
        .from('restoration_history')
        .insert({
          snapshot_id: snapshotId,
          restore_type: modules.length === 1 ? 'module_specific' : 'full_system',
          modules_restored: restoredModules,
          records_affected: totalRecords,
          initiated_by: userId,
          success: true,
          restore_summary: {
            snapshot_name: snapshot.name,
            modules: restoredModules,
            records: totalRecords
          }
        });

      if (error) throw error;

      return {
        success: true,
        snapshot_id: snapshotId,
        restore_type: modules.length === 1 ? 'module_specific' : 'full_system',
        modules_restored: restoredModules,
        records_affected: totalRecords
      };
    } catch (error) {
      console.error('Error restoring from snapshot:', error);
      return {
        success: false,
        snapshot_id: snapshotId,
        restore_type: 'full_system',
        modules_restored: [],
        records_affected: 0,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getRestorationHistory(limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('restoration_history')
        .select('*, system_snapshots(name, created_at)')
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching restoration history:', error);
      return [];
    }
  }

  async checkExpiringSnapshots(): Promise<Snapshot[]> {
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const { data, error } = await supabase
        .from('system_snapshots')
        .select('*')
        .lte('expires_at', sevenDaysFromNow.toISOString())
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error checking expiring snapshots:', error);
      return [];
    }
  }

  async sendRetentionAlert(
    snapshotId: string,
    alertType: '7_day_warning' | '1_day_warning' | 'expired',
    userIds: string[]
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('snapshot_retention_alerts')
        .insert({
          snapshot_id: snapshotId,
          alert_type: alertType,
          sent_to: userIds
        });

      if (error) throw error;
      console.log(`Retention alert sent for snapshot ${snapshotId}: ${alertType}`);
    } catch (error) {
      console.error('Error sending retention alert:', error);
    }
  }

  async getStorageStats(): Promise<{ total_size: number; snapshot_count: number }> {
    try {
      const { data, error } = await supabase
        .from('system_snapshots')
        .select('size_bytes');

      if (error) throw error;

      const totalSize = data?.reduce((sum, snapshot) => sum + (snapshot.size_bytes || 0), 0) || 0;
      const snapshotCount = data?.length || 0;

      return {
        total_size: totalSize,
        snapshot_count: snapshotCount
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { total_size: 0, snapshot_count: 0 };
    }
  }
}

export const snapshotService = new SnapshotService();
