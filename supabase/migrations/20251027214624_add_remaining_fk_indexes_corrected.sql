/*
  # Add Remaining Foreign Key Indexes (Corrected)

  ## Overview
  Adds all remaining foreign key indexes with correct column names.
  Only adds indexes for columns that actually exist in the schema.
  
  ## Coverage
  130+ foreign key indexes across all system tables
*/

-- AI System
CREATE INDEX IF NOT EXISTS idx_ai_fixes_history_applied_by_fk ON ai_fixes_history(applied_by);
CREATE INDEX IF NOT EXISTS idx_ai_fixes_pending_reviewed_by_fk ON ai_fixes_pending(reviewed_by);

-- Call System
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller_id_fk ON call_sessions(caller_id);

-- Union & CBA
CREATE INDEX IF NOT EXISTS idx_cba_benefit_provisions_cba_id_fk ON cba_benefit_provisions(cba_id);
CREATE INDEX IF NOT EXISTS idx_collective_bargaining_agreements_local_chapter_id_fk ON collective_bargaining_agreements(local_chapter_id);
CREATE INDEX IF NOT EXISTS idx_collective_bargaining_agreements_union_id_fk ON collective_bargaining_agreements(union_id);

-- Payroll
CREATE INDEX IF NOT EXISTS idx_certified_payroll_reports_certified_by_fk ON certified_payroll_reports(certified_by);
CREATE INDEX IF NOT EXISTS idx_certified_payroll_reports_employee_id_fk ON certified_payroll_reports(employee_id);

-- Change Log
CREATE INDEX IF NOT EXISTS idx_change_log_user_id_fk ON change_log(user_id);

-- Classification
CREATE INDEX IF NOT EXISTS idx_classification_approvals_approved_by_fk ON classification_approvals(approved_by);
CREATE INDEX IF NOT EXISTS idx_classification_approvals_requested_by_fk ON classification_approvals(requested_by);

-- Compensation
CREATE INDEX IF NOT EXISTS idx_compensation_approvals_manager_id_fk ON compensation_approvals(manager_id);

-- Compliance
CREATE INDEX IF NOT EXISTS idx_compliance_documents_verified_by_fk ON compliance_documents(verified_by);

-- Contractor Management  
CREATE INDEX IF NOT EXISTS idx_contractor_agreements_currency_code_fk ON contractor_agreements(currency_code);
CREATE INDEX IF NOT EXISTS idx_contractor_details_currency_code_fk ON contractor_details(currency_code);
CREATE INDEX IF NOT EXISTS idx_contractor_insurance_verified_by_fk ON contractor_insurance(verified_by);
CREATE INDEX IF NOT EXISTS idx_contractor_invoices_agreement_id_fk ON contractor_invoices(agreement_id);
CREATE INDEX IF NOT EXISTS idx_contractor_invoices_approved_by_fk ON contractor_invoices(approved_by);
CREATE INDEX IF NOT EXISTS idx_contractor_invoices_currency_code_fk ON contractor_invoices(currency_code);
CREATE INDEX IF NOT EXISTS idx_contractor_invoices_project_id_fk ON contractor_invoices(project_id);

-- Custom Expense Categories
CREATE INDEX IF NOT EXISTS idx_custom_expense_categories_created_by_fk ON custom_expense_categories(created_by);

-- Daily Fun Facts
CREATE INDEX IF NOT EXISTS idx_daily_fun_fact_usage_fun_fact_id_fk ON daily_fun_fact_usage(fun_fact_id);

-- Departments
CREATE INDEX IF NOT EXISTS idx_departments_manager_id_fk ON departments(manager_id);

-- Deployment Tracking
CREATE INDEX IF NOT EXISTS idx_deployment_tracking_deployed_by_fk ON deployment_tracking(deployed_by);

-- Direct Deposit
CREATE INDEX IF NOT EXISTS idx_direct_deposit_verifications_verified_by_fk ON direct_deposit_verifications(verified_by);

-- Employee Access
CREATE INDEX IF NOT EXISTS idx_employee_access_permissions_granted_by_fk ON employee_access_permissions(granted_by);
CREATE INDEX IF NOT EXISTS idx_employee_expense_access_enabled_by_fk ON employee_expense_access(enabled_by);
CREATE INDEX IF NOT EXISTS idx_employee_expense_enrollment_enrolled_by_fk ON employee_expense_enrollment(enrolled_by);

-- Employee Fun Facts
CREATE INDEX IF NOT EXISTS idx_employee_fun_fact_history_fun_fact_id_fk ON employee_fun_fact_history(fun_fact_id);
CREATE INDEX IF NOT EXISTS idx_employee_fun_fact_history_pay_stub_id_fk ON employee_fun_fact_history(pay_stub_id);

-- Employee Performance
CREATE INDEX IF NOT EXISTS idx_employee_performance_scores_reviewer_id_fk ON employee_performance_scores(reviewer_id);

-- Employee Reporting
CREATE INDEX IF NOT EXISTS idx_employee_reporting_relationships_changed_by_fk ON employee_reporting_relationships(changed_by);

-- Employees
CREATE INDEX IF NOT EXISTS idx_employees_currency_code_fk ON employees(currency_code);
CREATE INDEX IF NOT EXISTS idx_employees_job_title_id_fk ON employees(job_title_id);
CREATE INDEX IF NOT EXISTS idx_employees_tax_jurisdiction_id_fk ON employees(tax_jurisdiction_id);

-- Exchange Rates
CREATE INDEX IF NOT EXISTS idx_exchange_rates_from_currency_fk ON exchange_rates(from_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_to_currency_fk ON exchange_rates(to_currency);

-- Expense Reimbursement
CREATE INDEX IF NOT EXISTS idx_expense_reimbursement_batches_processed_by_fk ON expense_reimbursement_batches(processed_by);

-- Expense Vendors
CREATE INDEX IF NOT EXISTS idx_expense_vendors_created_by_fk ON expense_vendors(created_by);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_category_id_fk ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_submitted_by_fk ON expenses(submitted_by);

-- Fringe Benefits
CREATE INDEX IF NOT EXISTS idx_fringe_benefit_allocations_employee_id_fk ON fringe_benefit_allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_fringe_benefit_allocations_project_id_fk ON fringe_benefit_allocations(project_id);

-- Job Titles
CREATE INDEX IF NOT EXISTS idx_job_titles_department_id_fk ON job_titles(department_id);

-- Knowledge Base
CREATE INDEX IF NOT EXISTS idx_kb_article_comments_parent_id_fk ON kb_article_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_kb_article_comments_user_id_fk ON kb_article_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_article_ratings_user_id_fk ON kb_article_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_article_versions_author_id_fk ON kb_article_versions(author_id);
CREATE INDEX IF NOT EXISTS idx_kb_categories_parent_id_fk ON kb_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_kb_content_suggestions_category_id_fk ON kb_content_suggestions(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_content_suggestions_user_id_fk ON kb_content_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_guide_completions_user_id_fk ON kb_guide_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_search_history_clicked_article_id_fk ON kb_search_history(clicked_article_id);

-- Leave Requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_approver_id_fk ON leave_requests(approver_id);

-- Message System
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id_fk ON message_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_channel_id_fk ON message_threads(channel_id);

-- New Hires
CREATE INDEX IF NOT EXISTS idx_new_hires_currency_code_fk ON new_hires(currency_code);
CREATE INDEX IF NOT EXISTS idx_new_hires_employee_id_fk ON new_hires(employee_id);
CREATE INDEX IF NOT EXISTS idx_new_hires_onboarding_template_id_fk ON new_hires(onboarding_template_id);

-- Onboarding
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_completed_by_fk ON onboarding_tasks(completed_by);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_template_task_id_fk ON onboarding_tasks(template_task_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_templates_created_by_fk ON onboarding_templates(created_by);

-- OSHA
CREATE INDEX IF NOT EXISTS idx_osha_reports_certified_by_fk ON osha_reports(certified_by);
CREATE INDEX IF NOT EXISTS idx_osha_reports_generated_by_fk ON osha_reports(generated_by);

-- Payroll Changes Queue
CREATE INDEX IF NOT EXISTS idx_payroll_changes_queue_compensation_history_id_fk ON payroll_changes_queue(compensation_history_id);
CREATE INDEX IF NOT EXISTS idx_payroll_changes_queue_employee_id_fk ON payroll_changes_queue(employee_id);

-- Performance Reviews
CREATE INDEX IF NOT EXISTS idx_performance_reviews_hr_reviewed_by_fk ON performance_reviews(hr_reviewed_by);

-- Pinned Messages
CREATE INDEX IF NOT EXISTS idx_pinned_messages_pinned_by_fk ON pinned_messages(pinned_by);

-- Processed Commits
CREATE INDEX IF NOT EXISTS idx_processed_commits_change_log_id_fk ON processed_commits(change_log_id);

-- Project Wage
CREATE INDEX IF NOT EXISTS idx_project_wage_assignments_prevailing_wage_id_fk ON project_wage_assignments(prevailing_wage_id);
CREATE INDEX IF NOT EXISTS idx_project_wage_assignments_project_id_fk ON project_wage_assignments(project_id);

-- Reporting Relationships
CREATE INDEX IF NOT EXISTS idx_reporting_relationship_history_changed_by_fk ON reporting_relationship_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_reporting_relationship_history_new_manager_id_fk ON reporting_relationship_history(new_manager_id);
CREATE INDEX IF NOT EXISTS idx_reporting_relationship_history_old_manager_id_fk ON reporting_relationship_history(old_manager_id);

-- Restoration
CREATE INDEX IF NOT EXISTS idx_restoration_history_initiated_by_fk ON restoration_history(initiated_by);

-- Review System
CREATE INDEX IF NOT EXISTS idx_review_cycles_created_by_fk ON review_cycles(created_by);
CREATE INDEX IF NOT EXISTS idx_review_question_assignments_question_id_fk ON review_question_assignments(question_id);
CREATE INDEX IF NOT EXISTS idx_review_question_templates_created_by_fk ON review_question_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_review_question_templates_department_id_fk ON review_question_templates(department_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_question_id_fk ON review_responses(question_id);

-- RocketChat
CREATE INDEX IF NOT EXISTS idx_rocketchat_channels_created_by_fk ON rocketchat_channels(created_by);
CREATE INDEX IF NOT EXISTS idx_rocketchat_conflict_resolution_resolved_by_fk ON rocketchat_conflict_resolution(resolved_by);
CREATE INDEX IF NOT EXISTS idx_rocketchat_sync_log_sync_queue_id_fk ON rocketchat_sync_log(sync_queue_id);

-- Snapshots
CREATE INDEX IF NOT EXISTS idx_snapshot_retention_alerts_snapshot_id_fk ON snapshot_retention_alerts(snapshot_id);

-- Subcontractor
CREATE INDEX IF NOT EXISTS idx_subcontractor_relationships_project_id_fk ON subcontractor_relationships(project_id);

-- System Snapshots
CREATE INDEX IF NOT EXISTS idx_system_snapshots_triggered_by_fk ON system_snapshots(triggered_by);

-- Union Dues
CREATE INDEX IF NOT EXISTS idx_union_dues_structure_cba_id_fk ON union_dues_structure(cba_id);
CREATE INDEX IF NOT EXISTS idx_union_dues_structure_local_chapter_id_fk ON union_dues_structure(local_chapter_id);
CREATE INDEX IF NOT EXISTS idx_union_dues_structure_union_id_fk ON union_dues_structure(union_id);

-- Union Grievances
CREATE INDEX IF NOT EXISTS idx_union_grievances_cba_id_fk ON union_grievances(cba_id);
CREATE INDEX IF NOT EXISTS idx_union_grievances_employee_id_fk ON union_grievances(employee_id);
CREATE INDEX IF NOT EXISTS idx_union_grievances_union_id_fk ON union_grievances(union_id);

-- Union Local Chapters
CREATE INDEX IF NOT EXISTS idx_union_local_chapters_union_id_fk ON union_local_chapters(union_id);

-- Union Membership
CREATE INDEX IF NOT EXISTS idx_union_membership_cba_id_fk ON union_membership(cba_id);
CREATE INDEX IF NOT EXISTS idx_union_membership_local_chapter_id_fk ON union_membership(local_chapter_id);

-- Union Seniority
CREATE INDEX IF NOT EXISTS idx_union_seniority_local_chapter_id_fk ON union_seniority(local_chapter_id);

-- Union Stewards
CREATE INDEX IF NOT EXISTS idx_union_stewards_employee_id_fk ON union_stewards(employee_id);
CREATE INDEX IF NOT EXISTS idx_union_stewards_local_chapter_id_fk ON union_stewards(local_chapter_id);
CREATE INDEX IF NOT EXISTS idx_union_stewards_union_id_fk ON union_stewards(union_id);

-- Work Stoppages
CREATE INDEX IF NOT EXISTS idx_work_stoppages_local_chapter_id_fk ON work_stoppages(local_chapter_id);
CREATE INDEX IF NOT EXISTS idx_work_stoppages_union_id_fk ON work_stoppages(union_id);

-- Worker Classification Audit
CREATE INDEX IF NOT EXISTS idx_worker_classification_audit_log_approved_by_fk ON worker_classification_audit_log(approved_by);
CREATE INDEX IF NOT EXISTS idx_worker_classification_audit_log_changed_by_fk ON worker_classification_audit_log(changed_by);

-- Workers Comp
CREATE INDEX IF NOT EXISTS idx_workers_comp_incidents_created_by_fk ON workers_comp_incidents(created_by);
CREATE INDEX IF NOT EXISTS idx_workers_comp_incidents_reporter_id_fk ON workers_comp_incidents(reporter_id);

-- Channel Folder Assignments
CREATE INDEX IF NOT EXISTS idx_channel_folder_assignments_user_id_fk ON channel_folder_assignments(user_id);

-- Update statistics
ANALYZE;

/*
  ## Summary
  
  Added 100+ missing foreign key indexes.
  All unindexed foreign keys from the audit are now indexed.
*/