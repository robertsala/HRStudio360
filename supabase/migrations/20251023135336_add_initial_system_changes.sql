/*
  # Add Initial System Changes to Change Log

  ## Overview
  This migration adds initial entries to the change_log table demonstrating
  the new AI-powered auto-fix, recommendations, and restoration system.

  ## Changes
  - Adds change log entries for the new features
  - Demonstrates different change types and impact levels
*/

INSERT INTO change_log (change_type, title, description, affected_modules, impact_level, visibility_scope, version, created_at) VALUES
  (
    'feature',
    'AI-Powered Auto-Fix System Launched',
    'Introduced comprehensive AI diagnostics system that continuously monitors data quality and proposes automatic fixes for common issues. Product Owner and HR team can review and approve proposed fixes before they are applied. Includes intelligent detection of email format issues, phone number standardization, missing department assignments, and data validation errors.',
    ARRAY['system', 'employees', 'data_quality'],
    'high',
    'all_employees',
    '2.0.0',
    now()
  ),
  (
    'feature',
    'System Snapshot and Restoration Capability',
    'Implemented point-in-time snapshot system with 30-day retention policy. Product Owner and HR can create manual snapshots before critical operations and restore the system to any previous state within the retention window. Includes automatic snapshots before payroll runs and mass updates. Retention expiration alerts are sent 7 days and 1 day before snapshots expire.',
    ARRAY['system', 'backup', 'restoration'],
    'critical',
    'hr_only',
    '2.0.0',
    now()
  ),
  (
    'feature',
    'Comprehensive Change Log and History Tracking',
    'Launched complete change tracking system with historical change mining dating back to earliest development. All system modifications, improvements, fixes, and updates are now logged with timestamp, change type, affected modules, and impact level. Users receive notifications for applicable changes based on their role.',
    ARRAY['system', 'auditing', 'notifications'],
    'medium',
    'all_employees',
    '2.0.0',
    now()
  ),
  (
    'feature',
    'AI Recommendations and Insights',
    'Added AI-powered recommendation engine that analyzes workforce trends and suggests actionable improvements. Includes turnover risk predictions, workforce optimization suggestions, benefits enrollment recommendations, training needs analysis, and salary equity insights. Recommendations are prioritized by potential impact.',
    ARRAY['analytics', 'ai', 'insights'],
    'high',
    'hr_only',
    '2.0.0',
    now()
  ),
  (
    'feature',
    'System Health Metrics Dashboard',
    'Implemented continuous system health monitoring with real-time metrics for data quality, performance, and security. Product Owner and HR can view detailed health reports and trend analysis. Automatic alerts are generated when metrics fall below defined thresholds.',
    ARRAY['system', 'monitoring', 'analytics'],
    'medium',
    'hr_only',
    '2.0.0',
    now()
  ),
  (
    'improvement',
    'Change Notification System Enhanced',
    'Enhanced notification system to support change log notifications with role-based targeting. Employees receive notifications for changes marked as applicable to all, while HR and Product Owner receive all change notifications. Includes notification read tracking and acknowledgment.',
    ARRAY['notifications', 'system'],
    'medium',
    'all_employees',
    '2.0.0',
    now()
  ),
  (
    'feature',
    'Historical Change Mining and Population',
    'Automatically populated change log with historical improvements and features dating back to initial platform launch. Includes 60+ historical entries documenting the evolution of HRStudio360 from inception to current state.',
    ARRAY['system', 'documentation'],
    'low',
    'all_employees',
    '2.0.0',
    now()
  ),
  (
    'system_change',
    'Database Schema Expansion for AI Features',
    'Extended database schema with new tables for system snapshots, AI fixes (pending and history), health metrics, recommendations, restoration history, and snapshot retention alerts. All tables include comprehensive Row Level Security policies ensuring proper access control.',
    ARRAY['database', 'security'],
    'high',
    'product_owner_only',
    '2.0.0',
    now()
  ),
  (
    'improvement',
    'System Settings Modal Reorganized',
    'Added new Change Log tab to System Settings modal positioned after Notifications. Provides easy access to view all system changes, improvements, and fixes with filtering and search capabilities.',
    ARRAY['ui', 'settings'],
    'low',
    'all_employees',
    '2.0.0',
    now()
  ),
  (
    'feature',
    'Role-Based Access Controls for Restoration',
    'Implemented strict role-based access controls ensuring only Product Owner and HR team members can access snapshot creation, restoration, and AI fix approval features. Includes comprehensive audit logging of all restoration operations.',
    ARRAY['security', 'access_control'],
    'critical',
    'hr_only',
    '2.0.0',
    now()
  )
ON CONFLICT DO NOTHING;
