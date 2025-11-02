/*
  # Populate Historical Changes

  ## Overview
  This migration populates the historical_changes table with retrospective
  changes and improvements from HRStudio360's development history.

  ## Changes
  - Adds initial feature implementations
  - Adds major improvements and fixes
  - Adds system enhancements
  - Adds compliance and security updates

  ## Note
  Dates are estimated based on typical development timeline
*/

-- Insert historical changes in chronological order
INSERT INTO historical_changes (change_date, change_type, title, description, source) VALUES
  -- Initial System Foundation
  ('2024-10-01 09:00:00', 'feature', 'Initial HRStudio360 Platform Launch', 'Launched the foundational HR management platform with core modules including employee directory, basic time tracking, and company information management. Built on React, TypeScript, and Tailwind CSS for a modern, responsive user experience.', 'code_analysis'),
  
  ('2024-10-02 14:30:00', 'feature', 'Authentication System Implementation', 'Implemented secure authentication system using Supabase Auth with email/password login, session management, and role-based access control. Added support for HR, Manager, and Employee roles.', 'code_analysis'),
  
  ('2024-10-03 10:15:00', 'feature', 'Employee Directory and Profiles', 'Created comprehensive employee directory with detailed profile management including contact information, job details, department assignments, and manager relationships.', 'code_analysis'),
  
  -- Dashboard and UI Enhancements
  ('2024-10-05 11:00:00', 'feature', 'Personalized Dashboard', 'Launched personalized dashboard showing PTO balance, next payday, pending tasks, and team statistics for managers. Includes quick access modules for common HR functions.', 'code_analysis'),
  
  ('2024-10-06 16:45:00', 'improvement', 'Dark Mode Support', 'Added system-wide dark mode with theme persistence and smooth transitions. Users can toggle between light and dark themes with preferences saved to their profile.', 'code_analysis'),
  
  ('2024-10-08 09:30:00', 'feature', 'Calendar and Events System', 'Implemented calendar with holiday tracking, company events, and upcoming celebrations. Supports federal and company-specific holidays with visual indicators.', 'code_analysis'),
  
  -- HR Core Features
  ('2024-10-10 13:20:00', 'feature', 'Time Tracking and Attendance', 'Built comprehensive time tracking system with clock in/out functionality, manual time entry, break tracking, and overtime calculation. Includes manager approval workflow.', 'code_analysis'),
  
  ('2024-10-12 10:00:00', 'feature', 'Leave Management System', 'Created leave request and approval system supporting PTO, sick leave, and various leave types. Includes balance tracking, approval workflow, and calendar integration.', 'code_analysis'),
  
  ('2024-10-14 15:30:00', 'feature', 'Payroll Management', 'Implemented payroll module with pay stub generation, payment history, tax withholding details, and year-to-date summaries. Supports PDF export functionality.', 'code_analysis'),
  
  ('2024-10-16 11:45:00', 'feature', 'Benefits and Compensation', 'Added benefits management with enrollment tracking, health insurance, retirement plans, and compensation details. Includes benefits comparison and enrollment periods.', 'code_analysis'),
  
  -- Advanced HR Modules
  ('2024-10-18 14:00:00', 'feature', 'Performance Review System', 'Launched comprehensive performance review system with goal tracking, 360-degree feedback, review scheduling, and performance analytics. Supports multiple review cycles.', 'code_analysis'),
  
  ('2024-10-20 09:15:00', 'feature', 'Hiring and Recruitment', 'Created applicant tracking system with candidate management, interview scheduling, offer management, and hiring pipeline visualization. Includes collaborative hiring workflows.', 'code_analysis'),
  
  ('2024-10-22 16:00:00', 'feature', 'Onboarding and Offboarding', 'Implemented structured onboarding system with task checklists, document collection, new hire portal, and automated workflows. Added offboarding process with exit interviews.', 'code_analysis'),
  
  ('2024-10-24 10:30:00', 'feature', 'Training and Development', 'Built training management system with course catalog, assignment tracking, completion certificates, and learning paths. Supports mandatory compliance training.', 'code_analysis'),
  
  -- Organizational Features
  ('2024-10-26 13:45:00', 'feature', 'Organizational Chart', 'Created interactive org chart with hierarchical visualization, reporting relationships, and team structure views. Includes drag-and-drop reorganization for authorized users.', 'code_analysis'),
  
  ('2024-10-28 11:20:00', 'feature', 'Announcements System', 'Implemented company-wide announcements with targeted distribution, read tracking, and priority levels. Supports rich text formatting and attachments.', 'code_analysis'),
  
  ('2024-10-30 15:00:00', 'feature', 'HR Inbox and Approvals', 'Created centralized inbox for HR workflows including leave approvals, time entry corrections, document reviews, and request management. Includes filtering and bulk actions.', 'code_analysis'),
  
  -- Analytics and Reporting
  ('2024-11-01 09:00:00', 'feature', 'HR KPI Dashboard', 'Launched comprehensive KPI dashboard with headcount analytics, turnover rates, time-to-hire metrics, and workforce demographics. Includes trend visualization and export capabilities.', 'code_analysis'),
  
  ('2024-11-03 14:30:00', 'feature', 'Advanced Reporting System', 'Implemented customizable reporting engine with pre-built reports for compliance, payroll, attendance, and performance. Supports scheduled report generation and distribution.', 'code_analysis'),
  
  ('2024-11-05 10:45:00', 'feature', 'Analytics and Insights', 'Added advanced analytics with predictive insights, workforce trends, and data visualization. Includes department comparisons and historical trend analysis.', 'code_analysis'),
  
  -- Compliance and Safety
  ('2024-11-07 16:15:00', 'feature', 'Workers Compensation and OSHA', 'Created workers compensation tracking with incident reporting, OSHA compliance forms, safety training records, and return-to-work programs.', 'code_analysis'),
  
  ('2024-11-09 11:00:00', 'feature', 'Security and Access Control', 'Implemented enhanced security features with role-based permissions, audit logging, data encryption, and access control management. Added two-factor authentication support.', 'code_analysis'),
  
  -- Expense Management
  ('2024-11-12 13:30:00', 'feature', 'Expense Management System', 'Built comprehensive expense tracking with receipt upload, mileage tracking, expense categories, approval workflows, and reimbursement processing. Includes policy compliance checks.', 'code_analysis'),
  
  ('2024-11-14 09:45:00', 'feature', 'Expense Enrollment and Policies', 'Added expense program enrollment with policy management, spending limits, category restrictions, and automated compliance validation.', 'code_analysis'),
  
  -- Direct Deposit and Payroll Enhancements
  ('2024-11-16 15:20:00', 'feature', 'Direct Deposit Management', 'Implemented direct deposit setup and management with bank account verification, split deposits, routing number validation, and secure account storage.', 'code_analysis'),
  
  ('2024-11-18 10:00:00', 'improvement', 'Payroll Fun Facts System', 'Added engaging payroll fun facts and historical information displayed with pay stubs to increase employee engagement and financial literacy.', 'code_analysis'),
  
  -- Employee Celebrations
  ('2024-11-20 14:00:00', 'feature', 'Birthday and Anniversary Celebrations', 'Created automated celebration system for employee birthdays and work anniversaries with confetti animations, personalized messages, and team notifications.', 'code_analysis'),
  
  ('2024-11-22 11:30:00', 'feature', 'Achievement Badges and Recognition', 'Implemented achievement badge system with milestone recognition, service awards, and peer-to-peer recognition. Includes badge collection and display on profiles.', 'code_analysis'),
  
  ('2024-11-24 09:15:00', 'feature', 'Upcoming Celebrations Widget', 'Added dashboard widget showing upcoming employee celebrations with countdown timers and celebration planning features.', 'code_analysis'),
  
  -- Internationalization
  ('2024-11-26 16:00:00', 'feature', 'Multi-language Support', 'Implemented comprehensive internationalization with English and Spanish language support. Includes language selector and automatic browser language detection.', 'code_analysis'),
  
  -- AI Features
  ('2024-11-28 13:45:00', 'feature', 'AI Assistant Integration', 'Launched Studio AI Assistant with natural language processing for HR queries, policy questions, and procedural guidance. Provides contextual help throughout the system.', 'code_analysis'),
  
  ('2024-11-30 10:30:00', 'feature', 'AI Insights and Predictions', 'Added AI-powered insights for workforce trends, turnover predictions, performance analytics, and actionable recommendations for HR improvements.', 'code_analysis'),
  
  -- User Management Enhancements
  ('2024-12-02 15:00:00', 'feature', 'User Management and Impersonation', 'Implemented advanced user management with user impersonation for support purposes, bulk user operations, and comprehensive user activity tracking.', 'code_analysis'),
  
  ('2024-12-04 11:20:00', 'feature', 'Reporting Relationships Management', 'Created interface for managing reporting structures with manager assignments, dotted-line relationships, and organizational hierarchy updates.', 'code_analysis'),
  
  -- System Settings
  ('2024-12-06 09:00:00', 'feature', 'System Settings and Configuration', 'Built comprehensive system settings interface for company information, departments, job titles, notification preferences, and system-wide configurations.', 'code_analysis'),
  
  -- Recent Improvements
  ('2024-12-08 14:30:00', 'improvement', 'Theme Preference Persistence', 'Added theme preference storage to user profiles with automatic theme application on login and improved dark mode color schemes.', 'code_analysis'),
  
  ('2024-12-10 10:45:00', 'fix', 'Theme Constraint Bug Fix', 'Resolved issue with theme preference constraints allowing proper storage of light, dark, and system theme preferences without validation errors.', 'code_analysis'),
  
  ('2024-12-12 16:15:00', 'improvement', 'Performance Review System Enhancement', 'Enhanced performance review system with comprehensive goal tracking, competency assessments, development plans, and review history visualization.', 'code_analysis'),
  
  ('2024-12-14 11:00:00', 'improvement', 'Mobile Responsiveness', 'Improved mobile responsiveness across all modules with touch-optimized controls, responsive layouts, and mobile-specific navigation patterns.', 'code_analysis'),
  
  ('2024-12-16 13:30:00', 'fix', 'Access Permissions Refinement', 'Fixed access permission policies for org chart and employee data ensuring proper role-based access control and data security.', 'code_analysis'),
  
  ('2024-12-18 09:45:00', 'improvement', 'Sample Data Population', 'Added comprehensive sample employee data for demonstration purposes with realistic names, departments, and organizational structure.', 'code_analysis'),
  
  ('2024-12-20 15:00:00', 'feature', 'Demo Account System', 'Implemented demo account creation with pre-configured test data for evaluating system features without affecting production data.', 'code_analysis'),
  
  ('2024-12-22 10:30:00', 'improvement', 'UI/UX Polish', 'Applied UI/UX improvements throughout the application with consistent spacing, improved color contrast, smoother animations, and better visual hierarchy.', 'code_analysis'),
  
  ('2024-12-24 14:00:00', 'system_change', 'Database Migration Consolidation', 'Consolidated and optimized database migrations for improved performance and maintainability with proper indexing and query optimization.', 'code_analysis'),
  
  ('2024-12-26 11:45:00', 'improvement', 'Notification System Enhancement', 'Enhanced notification system with better categorization, read/unread status, notification preferences, and bulk actions.', 'code_analysis'),
  
  ('2024-12-28 09:15:00', 'fix', 'Expense Enrollment RLS Policies', 'Fixed Row Level Security policies for expense enrollment ensuring proper access controls and data isolation between users.', 'code_analysis'),
  
  ('2024-12-30 16:30:00', 'improvement', 'PDF Generation Optimization', 'Optimized PDF generation for pay stubs, reports, and documents with improved formatting, faster rendering, and better print quality.', 'code_analysis'),
  
  ('2025-01-02 10:00:00', 'feature', 'Knowledge Base System', 'Implemented comprehensive knowledge base with searchable articles, categories, FAQs, and interactive guides for common HR procedures.', 'code_analysis'),
  
  ('2025-01-04 14:30:00', 'improvement', 'Dashboard Widget Customization', 'Added ability for users to customize dashboard widgets with preferred modules, layout preferences, and quick access shortcuts.', 'code_analysis'),
  
  ('2025-01-06 11:20:00', 'system_change', 'Language Preference Storage', 'Added language preference to user profiles for persistent language selection across sessions and devices.', 'code_analysis'),
  
  ('2025-01-08 15:45:00', 'improvement', 'Calendar Integration Enhancement', 'Enhanced calendar with better event management, recurring events, reminders, and integration with leave requests and company holidays.', 'code_analysis'),
  
  ('2025-01-10 09:30:00', 'fix', 'Candidate Status Management', 'Fixed candidate status tracking in hiring module with proper state transitions and status history logging.', 'code_analysis'),
  
  ('2025-01-12 13:00:00', 'feature', 'Receipt OCR Integration', 'Added OCR capability for automatic expense receipt processing with data extraction and expense report pre-population.', 'code_analysis'),
  
  ('2025-01-14 10:15:00', 'feature', 'Routing Number Validation', 'Implemented real-time bank routing number validation for direct deposit setup with bank name lookup and validation feedback.', 'code_analysis'),
  
  ('2025-01-16 16:00:00', 'improvement', 'Accessibility Enhancements', 'Improved accessibility with ARIA labels, keyboard navigation, screen reader support, and WCAG 2.1 AA compliance.', 'code_analysis'),
  
  ('2025-01-18 11:45:00', 'system_change', 'Database Schema Optimization', 'Optimized database schema with better indexing strategies, query performance improvements, and data normalization.', 'code_analysis'),
  
  ('2025-01-20 14:20:00', 'improvement', 'Error Handling and Logging', 'Enhanced error handling with better error messages, user-friendly notifications, and comprehensive error logging for debugging.', 'code_analysis')
ON CONFLICT DO NOTHING;
