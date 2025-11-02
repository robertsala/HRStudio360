/*
  # Populate Knowledge Base with Sample Content

  This migration adds sample categories, articles, courses, guides, and resources
  to demonstrate the knowledge base functionality.
*/

-- Insert categories
INSERT INTO kb_categories (name, slug, description, icon, display_order) VALUES
  ('Getting Started', 'getting-started', 'New to HRStudio360? Start here to learn the basics', 'Rocket', 1),
  ('Time Off Management', 'time-off', 'Learn how to request, approve, and manage time off', 'Calendar', 2),
  ('Payroll & Benefits', 'payroll-benefits', 'Everything about pay, benefits, and compensation', 'DollarSign', 3),
  ('Performance Reviews', 'performance', 'Conduct reviews, set goals, and track performance', 'TrendingUp', 4),
  ('Employee Management', 'employees', 'Managing employee data, profiles, and directories', 'Users', 5),
  ('Reporting & Analytics', 'reporting', 'Generate reports and analyze HR data', 'BarChart3', 6),
  ('Training & Development', 'training', 'Access learning resources and development programs', 'GraduationCap', 7),
  ('Security & Compliance', 'security', 'Security settings, compliance, and data protection', 'Shield', 8),
  ('Mobile App', 'mobile', 'Using HRStudio360 on mobile devices', 'Smartphone', 9);

-- Insert sample articles
INSERT INTO kb_articles (category_id, title, slug, content, excerpt, difficulty_level, estimated_reading_time, published, published_at, featured, view_count, helpful_count) VALUES
  (
    (SELECT id FROM kb_categories WHERE slug = 'getting-started'),
    'Welcome to HRStudio360',
    'welcome-to-hrstudio360',
    '# Welcome to HRStudio360

Welcome to HRStudio360, your all-in-one HR management platform! This guide will help you get started.

## What is HRStudio360?

HRStudio360 is a comprehensive HR management system that helps organizations manage their entire employee lifecycle - from recruitment to retirement.

## Key Features

- **Employee Management**: Maintain complete employee records and profiles
- **Time & Attendance**: Track work hours, schedules, and time off
- **Payroll**: Process payroll and manage compensation
- **Performance Reviews**: Conduct evaluations and track goals
- **Training**: Access learning resources and development programs
- **Analytics**: Generate insights with powerful reporting tools

## Getting Started Steps

1. **Complete Your Profile**: Add your personal information and emergency contacts
2. **Explore the Dashboard**: Familiarize yourself with the main navigation
3. **Check Your Schedule**: View your work schedule and upcoming events
4. **Review Company Policies**: Read the employee handbook and company resources
5. **Set Up Notifications**: Configure your notification preferences

## Need Help?

Browse our knowledge base articles, watch tutorial videos, or contact your HR team for assistance.

Welcome aboard!',
    'Learn the basics of HRStudio360 and get started with your new HR platform',
    'beginner',
    8,
    true,
    now(),
    true,
    234,
    189
  ),
  (
    (SELECT id FROM kb_categories WHERE slug = 'time-off'),
    'How to Request Time Off',
    'how-to-request-time-off',
    '# How to Request Time Off

This guide explains how to submit time off requests in HRStudio360.

## Steps to Request Time Off

1. **Navigate to Leave Management**
   - Click on "Time & Leave" in the left sidebar
   - Or use Quick Access from the dashboard

2. **Create New Request**
   - Click the "Request Time Off" button
   - Select the type of leave (PTO, Sick Leave, etc.)

3. **Choose Dates**
   - Select start and end dates
   - Indicate if it''s full day or partial day
   - Review your available balance

4. **Add Details**
   - Provide a reason (optional but recommended)
   - Add any notes for your manager
   - Attach supporting documents if required

5. **Submit for Approval**
   - Review your request details
   - Click "Submit Request"
   - You''ll receive email notification when approved

## Checking Request Status

View your pending, approved, and denied requests in the Leave Management section. You''ll receive real-time notifications about status changes.

## Canceling a Request

To cancel an approved time off request, contact your manager or HR team directly.',
    'Step-by-step guide to requesting time off and managing your leave balance',
    'beginner',
    5,
    true,
    now(),
    true,
    567,
    423
  ),
  (
    (SELECT id FROM kb_categories WHERE slug = 'payroll-benefits'),
    'Understanding Your Pay Stub',
    'understanding-pay-stub',
    '# Understanding Your Pay Stub

Learn how to read and understand your pay stub in HRStudio360.

## Accessing Your Pay Stubs

Navigate to **Pay & Benefits** > **Pay Stubs** to view all your payment history.

## Pay Stub Components

### Gross Pay
Your total earnings before any deductions. This includes:
- Base salary/hourly wages
- Overtime pay
- Bonuses and commissions
- Other earnings

### Deductions
Amounts subtracted from your gross pay:
- **Federal Income Tax**: Required federal withholding
- **State Income Tax**: State-specific withholding
- **Social Security**: 6.2% of gross pay
- **Medicare**: 1.45% of gross pay
- **Health Insurance**: Your premium contribution
- **Retirement (401k)**: Your contribution percentage

### Net Pay
Your take-home pay after all deductions - the amount deposited to your account.

## Year-to-Date (YTD) Totals

The YTD column shows cumulative totals for the current calendar year. This is useful for:
- Tax preparation
- Tracking benefit contributions
- Monitoring overtime earnings

## Questions About Your Pay

If you notice any discrepancies, contact the Payroll department immediately through the HR Inbox.',
    'Complete breakdown of your pay stub components and how to access payment history',
    'beginner',
    6,
    true,
    now(),
    false,
    445,
    367
  ),
  (
    (SELECT id FROM kb_categories WHERE slug = 'performance'),
    'Preparing for Your Performance Review',
    'preparing-for-performance-review',
    '# Preparing for Your Performance Review

Make the most of your performance review with proper preparation.

## Before the Review

### Self-Assessment
1. Review your job description and goals
2. List your accomplishments and contributions
3. Identify areas for growth and development
4. Prepare specific examples of your work
5. Think about your career goals

### Gather Evidence
- Positive feedback from colleagues
- Completed projects and results
- Metrics showing your impact
- Learning and development activities
- Any challenges you overcame

## During the Review

### Be Engaged
- Listen actively to feedback
- Ask clarifying questions
- Share your perspective professionally
- Discuss goals and expectations
- Take notes on key points

### Focus on Growth
- Accept constructive criticism gracefully
- Discuss development opportunities
- Align on goals for next period
- Request resources or support needed

## After the Review

1. Review and sign your evaluation
2. Create action plan for goals
3. Follow up on commitments
4. Schedule check-ins with manager
5. Track progress throughout the year

## Tips for Success

- Be honest and specific
- Focus on facts and results
- Maintain positive attitude
- Come prepared with questions
- Follow through on action items',
    'Tips and strategies for preparing for and participating in your performance review',
    'intermediate',
    10,
    true,
    now(),
    false,
    312,
    278
  ),
  (
    (SELECT id FROM kb_categories WHERE slug = 'employees'),
    'Using the Employee Directory',
    'using-employee-directory',
    '# Using the Employee Directory

Find and connect with colleagues using the HRStudio360 directory.

## Accessing the Directory

Click **Directory** in the left sidebar or use the AI-powered search in the header.

## Search Features

### Basic Search
Type any of the following:
- Employee name
- Department name
- Job title
- Location
- Skills or expertise

### Advanced Filters
Refine your search by:
- Department
- Location/Office
- Job title or role
- Manager
- Employment type

## Employee Profiles

Click on any employee to view:
- Contact information (email, phone)
- Department and role
- Reporting structure
- Office location
- Skills and certifications
- Recent activity

## Organization Chart

View the company structure by clicking the **Org Chart** button. This shows:
- Reporting relationships
- Team hierarchies
- Department structure
- Leadership team

## Contacting Employees

From any profile, you can:
- Send an email
- Call their phone number
- View their calendar (if shared)
- Schedule a meeting

## Privacy Note

Information visibility depends on your role and permissions. Some details may be restricted.',
    'Navigate and search the employee directory to find colleagues and view org structure',
    'beginner',
    7,
    true,
    now(),
    false,
    289,
    221
  );

-- Insert article tags
INSERT INTO kb_article_tags (article_id, tag) VALUES
  ((SELECT id FROM kb_articles WHERE slug = 'welcome-to-hrstudio360'), 'onboarding'),
  ((SELECT id FROM kb_articles WHERE slug = 'welcome-to-hrstudio360'), 'getting-started'),
  ((SELECT id FROM kb_articles WHERE slug = 'welcome-to-hrstudio360'), 'new-users'),
  ((SELECT id FROM kb_articles WHERE slug = 'how-to-request-time-off'), 'pto'),
  ((SELECT id FROM kb_articles WHERE slug = 'how-to-request-time-off'), 'vacation'),
  ((SELECT id FROM kb_articles WHERE slug = 'how-to-request-time-off'), 'leave'),
  ((SELECT id FROM kb_articles WHERE slug = 'understanding-pay-stub'), 'payroll'),
  ((SELECT id FROM kb_articles WHERE slug = 'understanding-pay-stub'), 'compensation'),
  ((SELECT id FROM kb_articles WHERE slug = 'understanding-pay-stub'), 'salary'),
  ((SELECT id FROM kb_articles WHERE slug = 'preparing-for-performance-review'), 'reviews'),
  ((SELECT id FROM kb_articles WHERE slug = 'preparing-for-performance-review'), 'goals'),
  ((SELECT id FROM kb_articles WHERE slug = 'preparing-for-performance-review'), 'development'),
  ((SELECT id FROM kb_articles WHERE slug = 'using-employee-directory'), 'directory'),
  ((SELECT id FROM kb_articles WHERE slug = 'using-employee-directory'), 'search'),
  ((SELECT id FROM kb_articles WHERE slug = 'using-employee-directory'), 'org-chart');

-- Insert sample courses
INSERT INTO kb_courses (title, slug, description, category, difficulty_level, duration_hours, instructor_name, instructor_bio, objectives, prerequisites, certification_awarded, max_enrollments, published, featured) VALUES
  (
    'HRStudio360 Fundamentals',
    'hrstudio360-fundamentals',
    'Master the basics of HRStudio360 with this comprehensive introductory course. Learn navigation, key features, and best practices.',
    'Getting Started',
    'beginner',
    2,
    'Sarah Johnson',
    'Senior HR Technology Specialist with 10+ years of experience',
    ARRAY['Navigate the HRStudio360 dashboard', 'Understand core HR features', 'Complete common HR tasks', 'Use search and reporting tools'],
    ARRAY['Basic computer skills', 'Employee account access'],
    'HRStudio360 Certified User',
    100,
    true,
    true
  ),
  (
    'Advanced Payroll Management',
    'advanced-payroll-management',
    'Deep dive into payroll processing, tax compliance, and benefit administration. Learn advanced techniques for efficient payroll management.',
    'Payroll & Benefits',
    'advanced',
    6,
    'Mike Chen',
    'Certified Payroll Professional (CPP) with expertise in HR systems',
    ARRAY['Process complex payroll scenarios', 'Manage tax withholdings', 'Handle benefit deductions', 'Generate payroll reports', 'Ensure compliance'],
    ARRAY['Basic payroll knowledge', 'HRStudio360 fundamentals', '1+ years payroll experience'],
    'Advanced Payroll Specialist',
    50,
    true,
    true
  ),
  (
    'Conducting Effective Performance Reviews',
    'effective-performance-reviews',
    'Learn how to conduct meaningful performance reviews that drive employee development and organizational success.',
    'Performance Management',
    'intermediate',
    4,
    'Lisa Rodriguez',
    'Leadership Development Coach and HR Director',
    ARRAY['Prepare for review meetings', 'Deliver constructive feedback', 'Set SMART goals', 'Handle difficult conversations', 'Document reviews properly'],
    ARRAY['Management role or HR position', 'Basic HRStudio360 knowledge'],
    'Performance Management Certificate',
    75,
    true,
    false
  );

-- Insert course modules
INSERT INTO kb_course_modules (course_id, title, description, display_order, duration_minutes, content) VALUES
  (
    (SELECT id FROM kb_courses WHERE slug = 'hrstudio360-fundamentals'),
    'Introduction to HRStudio360',
    'Overview of the platform, navigation, and key concepts',
    1,
    30,
    '# Introduction to HRStudio360

Welcome to Module 1! In this module, you will learn the fundamentals of navigating HRStudio360.

## Topics Covered
- Platform overview
- Dashboard navigation
- Quick access features
- AI-powered search
- User profile settings'
  ),
  (
    (SELECT id FROM kb_courses WHERE slug = 'hrstudio360-fundamentals'),
    'Employee Management Basics',
    'Learn how to manage employee data and profiles',
    2,
    45,
    '# Employee Management Basics

Learn the essentials of managing employee information in HRStudio360.

## Topics Covered
- Employee directory
- Profile management
- Organization chart
- Adding new employees
- Updating employee information'
  ),
  (
    (SELECT id FROM kb_courses WHERE slug = 'hrstudio360-fundamentals'),
    'Time and Attendance',
    'Master time tracking, schedules, and time off management',
    3,
    45,
    '# Time and Attendance

Understand how to manage time tracking and attendance in the system.

## Topics Covered
- Time tracking
- Schedule management
- Time off requests
- Attendance policies
- Reporting'
  );

-- Insert interactive guides
INSERT INTO kb_interactive_guides (title, description, feature_area, steps, target_roles, published) VALUES
  (
    'Your First Time Off Request',
    'Step-by-step guide to submitting your first time off request',
    'leave-management',
    '[
      {
        "title": "Open Leave Management",
        "description": "Click on Time & Leave in the sidebar or Quick Access on the dashboard",
        "action": "Navigate to Leave Management"
      },
      {
        "title": "Click Request Time Off",
        "description": "Find and click the Request Time Off button in the top right",
        "action": "Open request form"
      },
      {
        "title": "Select Leave Type",
        "description": "Choose the type of leave you want to request (PTO, Sick Leave, etc.)",
        "action": "Select leave type"
      },
      {
        "title": "Choose Dates",
        "description": "Select your start and end dates. Your available balance will be shown",
        "action": "Select dates"
      },
      {
        "title": "Add Details",
        "description": "Optionally add a reason and any notes for your manager",
        "action": "Enter details"
      },
      {
        "title": "Submit Request",
        "description": "Review your request and click Submit. You will receive a confirmation",
        "action": "Submit request"
      }
    ]'::jsonb,
    ARRAY['employee', 'manager', 'hr'],
    true
  ),
  (
    'Viewing Your Pay Stub',
    'Learn how to access and understand your pay stub',
    'payroll',
    '[
      {
        "title": "Navigate to Pay & Benefits",
        "description": "Click Pay & Benefits in Quick Access or the sidebar",
        "action": "Open Pay & Benefits"
      },
      {
        "title": "Select Pay Stubs",
        "description": "Click on the Pay Stubs tab at the top of the page",
        "action": "View pay stubs"
      },
      {
        "title": "Choose Pay Period",
        "description": "Select the pay period you want to view from the list",
        "action": "Select period"
      },
      {
        "title": "Review Details",
        "description": "Review your earnings, deductions, and net pay. Click Download to save a PDF copy",
        "action": "Review and download"
      }
    ]'::jsonb,
    ARRAY['employee'],
    true
  );

-- Insert company resources
INSERT INTO kb_company_resources (title, description, resource_type, file_url, version, required_reading, target_departments, target_roles) VALUES
  (
    'Employee Handbook 2025',
    'Complete employee handbook covering policies, procedures, and expectations',
    'handbook',
    '/resources/employee-handbook-2025.pdf',
    '2025.1',
    true,
    ARRAY['All Departments'],
    ARRAY['employee', 'manager', 'hr']
  ),
  (
    'Code of Conduct',
    'Company code of conduct and ethical guidelines',
    'policy',
    '/resources/code-of-conduct.pdf',
    '3.0',
    true,
    ARRAY['All Departments'],
    ARRAY['employee', 'manager', 'hr']
  ),
  (
    'Time Off Request Form',
    'Printable time off request form for manual submissions',
    'form',
    '/resources/time-off-request-form.pdf',
    '1.2',
    false,
    ARRAY['All Departments'],
    ARRAY['employee', 'manager']
  ),
  (
    'New Hire Onboarding Checklist',
    'Complete checklist for new employee onboarding process',
    'checklist',
    '/resources/onboarding-checklist.pdf',
    '2.5',
    false,
    ARRAY['Human Resources'],
    ARRAY['hr', 'manager']
  ),
  (
    'Remote Work Policy',
    'Guidelines and requirements for remote and hybrid work arrangements',
    'policy',
    '/resources/remote-work-policy.pdf',
    '1.0',
    true,
    ARRAY['All Departments'],
    ARRAY['employee', 'manager', 'hr']
  );
