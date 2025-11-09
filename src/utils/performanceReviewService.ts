import { supabase } from './supabaseClient';
import type { ReviewCycle } from '../../shared/schema';

export interface PerformanceReview {
  id: string;
  review_cycle_id: string;
  employee_id: string;
  manager_id: string;
  self_assessment_status: 'not_started' | 'in_progress' | 'submitted';
  manager_assessment_status: 'not_started' | 'in_progress' | 'submitted';
  self_assessment_submitted_at?: string;
  manager_assessment_submitted_at?: string;
  hr_review_status: 'pending' | 'reviewed' | 'approved';
  overall_status: 'pending_self' | 'pending_manager' | 'pending_hr' | 'completed';
  self_overall_rating?: number;
  manager_overall_rating?: number;
  final_rating?: number;
  compensation_change?: number;
  compensation_change_approved?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReviewQuestion {
  id: string;
  question_text: string;
  category: string;
  weight: number;
  sort_order: number;
  question_type?: string;
}

export interface ReviewResponse {
  id: string;
  performance_review_id: string;
  question_id: string;
  response_type: 'self_assessment' | 'manager_assessment';
  rating: number;
  comments?: string;
}

export interface ReviewGoalsComments {
  id?: string;
  performance_review_id: string;
  comment_type: 'self_assessment' | 'manager_assessment';
  achievements?: string;
  development_areas?: string;
  goals_next_period?: string;
  additional_comments?: string;
}

export interface CompensationApproval {
  id?: string;
  performance_review_id: string;
  employee_id: string;
  current_salary: number;
  recommended_salary: number;
  recommended_increase_amount: number;
  recommended_increase_percentage: number;
  manager_id: string;
  manager_justification: string;
  hr_approval_status?: string;
  executive_approval_status?: string;
  requires_executive_approval?: boolean;
  final_approval_status?: string;
}

export interface CompensationHistory {
  id: string;
  employee_id: string;
  review_id?: string;
  old_salary: number;
  new_salary: number;
  change_amount: number;
  change_percentage: number;
  effective_date: string;
  reason: string;
  notes?: string;
  approved_by_manager?: string;
  approved_by_hr?: string;
  approved_by_executive?: string;
  created_at?: string;
}

export const performanceReviewService = {
  async createReviewCycle(cycleData: Partial<ReviewCycle>) {
    const response = await fetch('/api/performance/review-cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cycleData)
    });
    if (!response.ok) throw new Error('Failed to create review cycle');
    return response.json();
  },

  async getActiveReviewCycles() {
    const response = await fetch('/api/performance/review-cycles');
    if (!response.ok) throw new Error('Failed to fetch review cycles');
    return response.json();
  },

  async getReviewCycleById(id: string) {
    const response = await fetch(`/api/performance/review-cycles/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch review cycle');
    }
    return response.json();
  },

  async updateReviewCycle(id: string, updates: Partial<ReviewCycle>) {
    const response = await fetch(`/api/performance/review-cycles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update review cycle');
    return response.json();
  },

  async getStandardQuestions() {
    const { data: template, error: templateError } = await supabase
      .from('review_question_templates')
      .select('id')
      .eq('template_name', 'Standard Performance Review Template')
      .maybeSingle();

    if (templateError) throw templateError;
    if (!template) return [];

    const { data, error } = await supabase
      .from('review_question_assignments')
      .select(`
        question_id,
        sort_order,
        is_required,
        review_questions_library (
          id,
          question_text,
          category,
          weight,
          sort_order,
          question_type
        )
      `)
      .eq('template_id', template.id)
      .order('sort_order');

    if (error) throw error;
    return data?.map(item => item.review_questions_library).filter(Boolean) || [];
  },

  async getQuestionsForEmployee(employeeId: string) {
    return this.getStandardQuestions();
  },

  async getPerformanceReview(reviewId: string) {
    const { data, error } = await supabase
      .from('performance_reviews')
      .select('*')
      .eq('id', reviewId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getReviewsByCycle(cycleId: string) {
    const { data, error } = await supabase
      .from('performance_reviews')
      .select(`
        *,
        employee:profiles!performance_reviews_employee_id_fkey(id, first_name, last_name, email),
        manager:profiles!performance_reviews_manager_id_fkey(id, first_name, last_name, email)
      `)
      .eq('review_cycle_id', cycleId);

    if (error) throw error;
    return data;
  },

  async getMyReviews(userId: string) {
    const { data, error } = await supabase
      .from('performance_reviews')
      .select(`
        *,
        review_cycles(name, review_type, start_date, end_date)
      `)
      .eq('employee_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getTeamReviews(managerId: string) {
    const { data, error } = await supabase
      .from('performance_reviews')
      .select(`
        *,
        employee:profiles!performance_reviews_employee_id_fkey(id, first_name, last_name, email),
        review_cycles(name, review_type, start_date, end_date)
      `)
      .eq('manager_id', managerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async saveReviewResponse(response: Omit<ReviewResponse, 'id'>) {
    const { data, error } = await supabase
      .from('review_responses')
      .upsert([response], {
        onConflict: 'performance_review_id,question_id,response_type'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getReviewResponses(reviewId: string, responseType?: 'self_assessment' | 'manager_assessment') {
    let query = supabase
      .from('review_responses')
      .select(`
        *,
        review_questions_library(question_text, category, weight)
      `)
      .eq('performance_review_id', reviewId);

    if (responseType) {
      query = query.eq('response_type', responseType);
    }

    const { data, error } = await query.order('created_at');

    if (error) throw error;
    return data;
  },

  async saveReviewGoalsComments(goalsComments: ReviewGoalsComments) {
    const { data, error } = await supabase
      .from('review_goals_comments')
      .upsert([goalsComments], {
        onConflict: 'performance_review_id,comment_type'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getReviewGoalsComments(reviewId: string, commentType?: 'self_assessment' | 'manager_assessment') {
    let query = supabase
      .from('review_goals_comments')
      .select('*')
      .eq('performance_review_id', reviewId);

    if (commentType) {
      query = query.eq('comment_type', commentType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async submitSelfAssessment(reviewId: string, overallRating: number) {
    const { data, error } = await supabase
      .from('performance_reviews')
      .update({
        self_assessment_status: 'submitted',
        self_assessment_submitted_at: new Date().toISOString(),
        self_overall_rating: overallRating,
        overall_status: 'pending_manager',
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async submitManagerAssessment(reviewId: string, overallRating: number) {
    const { data, error } = await supabase
      .from('performance_reviews')
      .update({
        manager_assessment_status: 'submitted',
        manager_assessment_submitted_at: new Date().toISOString(),
        manager_overall_rating: overallRating,
        overall_status: 'pending_hr',
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createCompensationApproval(approval: CompensationApproval) {
    const requiresExecutive =
      approval.recommended_increase_amount >= (approval as any).threshold_amount ||
      approval.recommended_increase_percentage >= (approval as any).threshold_percentage;

    const { data, error } = await supabase
      .from('compensation_approvals')
      .insert([{
        ...approval,
        requires_executive_approval: requiresExecutive,
        hr_approval_status: 'pending',
        executive_approval_status: requiresExecutive ? 'pending' : 'not_required',
        final_approval_status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCompensationApproval(id: string, updates: Partial<CompensationApproval>) {
    const { data, error } = await supabase
      .from('compensation_approvals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async approveCompensationHR(approvalId: string, hrUserId: string, comments?: string, modifiedAmount?: number) {
    const updates: any = {
      hr_approval_status: 'approved',
      hr_approved_by: hrUserId,
      hr_approved_at: new Date().toISOString(),
      hr_comments: comments,
      updated_at: new Date().toISOString()
    };

    if (modifiedAmount) {
      updates.hr_modified_amount = modifiedAmount;
      updates.hr_approval_status = 'modified';
    }

    const { data, error } = await supabase
      .from('compensation_approvals')
      .update(updates)
      .eq('id', approvalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async approveCompensationExecutive(approvalId: string, executiveUserId: string, comments?: string, modifiedAmount?: number) {
    const updates: any = {
      executive_approval_status: 'approved',
      executive_approved_by: executiveUserId,
      executive_approved_at: new Date().toISOString(),
      executive_comments: comments,
      updated_at: new Date().toISOString()
    };

    if (modifiedAmount) {
      updates.executive_modified_amount = modifiedAmount;
      updates.executive_approval_status = 'modified';
    }

    const { data, error } = await supabase
      .from('compensation_approvals')
      .update(updates)
      .eq('id', approvalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCompensationHistory(employeeId: string) {
    const { data, error } = await supabase
      .from('compensation_history')
      .select(`
        *,
        manager:profiles!compensation_history_approved_by_manager_fkey(first_name, last_name),
        hr:profiles!compensation_history_approved_by_hr_fkey(first_name, last_name),
        executive:profiles!compensation_history_approved_by_executive_fkey(first_name, last_name)
      `)
      .eq('employee_id', employeeId)
      .order('effective_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getPerformanceHistory(employeeId: string) {
    const { data, error } = await supabase
      .from('performance_review_history')
      .select('*')
      .eq('employee_id', employeeId)
      .order('review_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getPendingApprovals(userId: string, role: string) {
    let query = supabase
      .from('compensation_approvals')
      .select(`
        *,
        employee:profiles!compensation_approvals_employee_id_fkey(first_name, last_name, email),
        performance_reviews(review_cycle_id, self_overall_rating, manager_overall_rating)
      `);

    if (role === 'hr_admin' || role === 'hr_manager') {
      query = query.eq('hr_approval_status', 'pending');
    } else if (role === 'executive') {
      query = query
        .eq('hr_approval_status', 'approved')
        .eq('executive_approval_status', 'pending')
        .eq('requires_executive_approval', true);
    }

    const { data, error } = await query.order('created_at');

    if (error) throw error;
    return data;
  },

  calculateOverallRating(responses: ReviewResponse[], questions: ReviewQuestion[]): number {
    if (!responses || responses.length === 0) return 0;

    let totalWeightedScore = 0;
    let totalWeight = 0;

    responses.forEach(response => {
      const question = questions.find(q => q.id === response.question_id);
      if (question && response.rating) {
        totalWeightedScore += response.rating * question.weight;
        totalWeight += question.weight;
      }
    });

    return totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) / 100 : 0;
  },

  async createAuditLog(actionType: string, entityType: string, entityId: string, userId: string, description: string, oldValue?: any, newValue?: any) {
    const { error } = await supabase
      .from('review_audit_log')
      .insert([{
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        user_id: userId,
        description,
        old_value: oldValue,
        new_value: newValue
      }]);

    if (error) console.error('Audit log error:', error);
  }
};
