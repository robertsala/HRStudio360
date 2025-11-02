/*
  # Populate Interactive Guides for HRStudio360

  1. New Data
    - Comprehensive interactive guides for all user levels
    - Employee guides: time off, pay stubs, profile, time clock
    - Supervisor guides: timesheet approval, team management
    - Manager guides: hiring, performance reviews, reports
    - Director guides: analytics, system settings, compliance
    - General guides: navigation, notifications, knowledge base

  2. Security
    - All guides have appropriate target_roles set
    - Guides are published and ready for use
*/

-- Clear existing guides to start fresh
DELETE FROM kb_interactive_guides;

-- EMPLOYEE LEVEL GUIDES

INSERT INTO kb_interactive_guides (title, description, feature_area, steps, target_roles, published) VALUES
(
  'Your First Time Off Request',
  'Step-by-step walkthrough for requesting time off',
  'time_off',
  '[
    {
      "title": "Open Time Off & Leave",
      "description": "Click on the Time & Attendance tile, then select Leave Management from the menu.",
      "action": "Navigate to Leave Management modal",
      "tip": "You can also use the search bar at the top to quickly find Leave Management"
    },
    {
      "title": "Click Request Time Off",
      "description": "Look for the green Request Time Off button at the top right of the modal.",
      "action": "Click the Request Time Off button",
      "tip": "Make sure you know your current balance before requesting"
    },
    {
      "title": "Select Leave Type",
      "description": "Choose the type of leave: Vacation, Sick Leave, Personal Day, or other options.",
      "action": "Select from the Leave Type dropdown",
      "tip": "Each leave type may have different approval requirements"
    },
    {
      "title": "Choose Your Dates",
      "description": "Select the start and end dates for your time off. You can also choose half-day options.",
      "action": "Use the date picker to select dates",
      "tip": "Check the calendar to avoid conflicts with team schedules"
    },
    {
      "title": "Add a Reason",
      "description": "Provide a brief reason for your time off request. This helps your manager understand the context.",
      "action": "Type your reason in the text field",
      "tip": "Keep it professional and concise"
    },
    {
      "title": "Submit Your Request",
      "description": "Review all details and click Submit. Your manager will be notified and you will receive updates via email.",
      "action": "Click Submit Request button",
      "tip": "You can track the status in your Time Off History"
    }
  ]'::jsonb,
  ARRAY['Employee', 'Manager', 'Supervisor', 'Director', 'admin'],
  true
),
(
  'Viewing Your Pay Stub',
  'Learn how to access and understand your pay stub',
  'payroll',
  '[
    {
      "title": "Navigate to Payroll",
      "description": "Click on the Benefits & Pay tile on your dashboard.",
      "action": "Open Benefits & Pay modal",
      "tip": "Your most recent pay stub will be shown first"
    },
    {
      "title": "View Pay History",
      "description": "You will see a list of all your pay periods. The most recent is at the top.",
      "action": "Browse the pay period list",
      "tip": "You can search by date if you need an older pay stub"
    },
    {
      "title": "Open a Pay Stub",
      "description": "Click on any pay period to view the detailed breakdown of earnings, deductions, and taxes.",
      "action": "Click on a pay period row",
      "tip": "Look for the eye icon to view details"
    },
    {
      "title": "Understanding Your Pay",
      "description": "Review your gross pay, deductions (taxes, insurance, 401k), and net pay.",
      "action": "Read through each section",
      "tip": "Questions? Contact HR or Payroll department"
    }
  ]'::jsonb,
  ARRAY['Employee', 'Manager', 'Supervisor', 'Director', 'admin'],
  true
),
(
  'How to Clock In and Out',
  'Quick guide to using the time clock system',
  'time_clock',
  '[
    {
      "title": "Find the Time Clock",
      "description": "Click on Time & Attendance from your dashboard, then select Time Clock.",
      "action": "Navigate to Time Clock",
      "tip": "You can also access this from the mobile app"
    },
    {
      "title": "Clock In to Start Your Shift",
      "description": "Click the green Clock In button when you arrive at work. The system will record the exact time.",
      "action": "Click Clock In button",
      "tip": "Make sure to clock in as soon as you start working"
    },
    {
      "title": "Take a Break",
      "description": "When taking a meal break, click Start Break. This pauses your time tracking.",
      "action": "Click Start Break button",
      "tip": "Remember to end your break when you return to work"
    },
    {
      "title": "End Your Break",
      "description": "When returning from break, click End Break to resume time tracking.",
      "action": "Click End Break button",
      "tip": "Your total break time is calculated automatically"
    },
    {
      "title": "Clock Out at End of Day",
      "description": "When your shift is complete, click Clock Out. Review your total hours for the day.",
      "action": "Click Clock Out button",
      "tip": "Your hours will appear on your timesheet for approval"
    }
  ]'::jsonb,
  ARRAY['Employee'],
  true
),
(
  'Updating Your Profile',
  'How to keep your personal information current',
  'profile',
  '[
    {
      "title": "Access Your Profile",
      "description": "Click on your profile icon in the top right corner, then select My Profile.",
      "action": "Open user profile menu",
      "tip": "Keep your information up to date for accurate records"
    },
    {
      "title": "Edit Personal Information",
      "description": "Click the Edit button to update your phone number, address, emergency contacts, etc.",
      "action": "Click Edit Profile button",
      "tip": "Some fields may require manager or HR approval"
    },
    {
      "title": "Update Emergency Contacts",
      "description": "Make sure your emergency contact information is current and accurate.",
      "action": "Update emergency contact section",
      "tip": "You can add multiple emergency contacts"
    },
    {
      "title": "Save Your Changes",
      "description": "Review all changes and click Save. You will receive a confirmation.",
      "action": "Click Save button",
      "tip": "Some changes may require verification by HR"
    }
  ]'::jsonb,
  ARRAY['Employee', 'Manager', 'Supervisor', 'Director', 'admin'],
  true
),
(
  'Viewing and Correcting Your Timesheet',
  'How to review your timesheet and request corrections',
  'timesheet',
  '[
    {
      "title": "Open Your Timesheet",
      "description": "Navigate to Time & Attendance, then click on Timesheet.",
      "action": "Open Timesheet view",
      "tip": "Your timesheet updates in real-time as you clock in/out"
    },
    {
      "title": "Review Your Hours",
      "description": "Check each day to ensure your clock in/out times are correct. Look for any missing punches.",
      "action": "Examine each time entry",
      "tip": "Missing punches will be highlighted in red or yellow"
    },
    {
      "title": "Request a Correction",
      "description": "If you see an error, click on that day and select Request Correction.",
      "action": "Click Request Correction",
      "tip": "Provide a clear explanation of what needs to be corrected"
    },
    {
      "title": "Submit Correction Request",
      "description": "Enter the correct times and reason for the change, then submit for manager approval.",
      "action": "Fill out correction form and submit",
      "tip": "Your manager will review and approve or deny the request"
    },
    {
      "title": "Track Your Request",
      "description": "You can see the status of your correction requests in the Pending Changes section.",
      "action": "View pending corrections",
      "tip": "You will be notified when your manager responds"
    }
  ]'::jsonb,
  ARRAY['Employee'],
  true
);

-- SUPERVISOR/MANAGER LEVEL GUIDES

INSERT INTO kb_interactive_guides (title, description, feature_area, steps, target_roles, published) VALUES
(
  'Reviewing and Approving Timesheets',
  'Manager guide to reviewing team timesheets and approving hours',
  'timesheet_approval',
  '[
    {
      "title": "Access Team Timesheets",
      "description": "Go to Time & Attendance and select Timesheet Approval. You will see all your direct reports.",
      "action": "Navigate to Timesheet Approval",
      "tip": "Filter by pay period or employee to find specific timesheets"
    },
    {
      "title": "Review Employee Hours",
      "description": "Click on an employee to see their detailed timesheet. Check for accuracy and completeness.",
      "action": "Select an employee timesheet",
      "tip": "Look for overtime, missing punches, or unusual patterns"
    },
    {
      "title": "Handle Correction Requests",
      "description": "If there are pending correction requests, review the employee explanation and evidence.",
      "action": "Review correction request details",
      "tip": "You can approve, deny, or request more information"
    },
    {
      "title": "Approve or Reject",
      "description": "Once verified, click Approve to accept the timesheet or Reject with a reason if corrections are needed.",
      "action": "Click Approve or Reject button",
      "tip": "Rejected timesheets will return to the employee for correction"
    },
    {
      "title": "Bulk Approve",
      "description": "To save time, you can select multiple timesheets and approve them all at once.",
      "action": "Use checkboxes and Bulk Approve button",
      "tip": "Only use bulk approve after reviewing each timesheet"
    },
    {
      "title": "Submit to Payroll",
      "description": "After all timesheets are approved, click Submit to Payroll to finalize the pay period.",
      "action": "Click Submit to Payroll button",
      "tip": "Double-check before submitting - changes after this require payroll intervention"
    }
  ]'::jsonb,
  ARRAY['Manager', 'Supervisor', 'Director', 'admin'],
  true
),
(
  'Managing Team Time Off Requests',
  'How to review and approve employee leave requests',
  'leave_approval',
  '[
    {
      "title": "View Pending Requests",
      "description": "Open Time & Attendance and go to Leave Management. Look for the Pending Approvals section.",
      "action": "Navigate to Pending Approvals",
      "tip": "You will also receive email notifications for new requests"
    },
    {
      "title": "Review Request Details",
      "description": "Click on a request to see the dates, leave type, reason, and employee balance.",
      "action": "Open request details",
      "tip": "Consider team coverage and project deadlines"
    },
    {
      "title": "Check Team Calendar",
      "description": "Review the team calendar to see if other employees are also out during that period.",
      "action": "View team calendar overlay",
      "tip": "Maintain adequate coverage for your department"
    },
    {
      "title": "Approve or Deny",
      "description": "Make your decision and provide comments if needed. The employee will be notified immediately.",
      "action": "Click Approve or Deny with optional comments",
      "tip": "Be clear in your communication, especially when denying requests"
    },
    {
      "title": "Suggest Alternative Dates",
      "description": "If you need to deny the request, you can suggest alternative dates that work better for the team.",
      "action": "Use the suggest alternative dates feature",
      "tip": "Work with your employee to find a mutually agreeable solution"
    }
  ]'::jsonb,
  ARRAY['Manager', 'Supervisor', 'Director', 'admin'],
  true
),
(
  'Conducting Performance Reviews',
  'Complete guide to the performance review process',
  'performance',
  '[
    {
      "title": "Start a Performance Review",
      "description": "Navigate to Performance & Reviews, select an employee, and click Start Review.",
      "action": "Click Start New Review button",
      "tip": "Prepare notes and examples before starting the review"
    },
    {
      "title": "Complete Review Sections",
      "description": "Rate the employee on each competency area: goals, skills, collaboration, leadership, etc.",
      "action": "Fill in ratings and comments for each section",
      "tip": "Provide specific examples to support your ratings"
    },
    {
      "title": "Set Goals for Next Period",
      "description": "Work with the employee to establish clear, measurable goals for the next review period.",
      "action": "Add SMART goals in the goals section",
      "tip": "Goals should be Specific, Measurable, Achievable, Relevant, and Time-bound"
    },
    {
      "title": "Identify Development Opportunities",
      "description": "Note areas for improvement and suggest training or development opportunities.",
      "action": "Complete development plan section",
      "tip": "Connect development areas to available courses in the Knowledge Base"
    },
    {
      "title": "Schedule Review Meeting",
      "description": "Set up a 1-on-1 meeting to discuss the review with your employee.",
      "action": "Use the schedule meeting button",
      "tip": "Allow at least 30-60 minutes for thorough discussion"
    },
    {
      "title": "Submit for Employee Acknowledgment",
      "description": "After the meeting, submit the review. The employee can add comments before signing.",
      "action": "Click Submit Review button",
      "tip": "HR will receive a copy once both parties have signed"
    }
  ]'::jsonb,
  ARRAY['Manager', 'Supervisor', 'Director', 'admin'],
  true
),
(
  'Posting and Managing Job Openings',
  'How to create job postings and manage candidates',
  'hiring',
  '[
    {
      "title": "Create a Job Opening",
      "description": "Go to Hiring & Recruitment and click Post New Job Opening.",
      "action": "Navigate to hiring module",
      "tip": "Have the job description ready before starting"
    },
    {
      "title": "Fill in Job Details",
      "description": "Enter the job title, department, salary range, requirements, and responsibilities.",
      "action": "Complete the job posting form",
      "tip": "Be specific about required skills and qualifications"
    },
    {
      "title": "Set Approval Workflow",
      "description": "Define who needs to be involved in the interview process and approval chain.",
      "action": "Configure approval workflow",
      "tip": "Include key stakeholders early in the process"
    },
    {
      "title": "Publish the Opening",
      "description": "Review the posting and publish it internally and/or externally.",
      "action": "Click Publish Job button",
      "tip": "Internal postings give current employees first opportunity"
    },
    {
      "title": "Review Applications",
      "description": "As applications come in, review resumes and move qualified candidates forward.",
      "action": "Screen candidates in the applicant tracking system",
      "tip": "Use the scoring rubric to objectively evaluate candidates"
    },
    {
      "title": "Schedule Interviews",
      "description": "Coordinate interview times with candidates and interview panel members.",
      "action": "Use the interview scheduling tool",
      "tip": "Send calendar invites with video conferencing links"
    },
    {
      "title": "Make an Offer",
      "description": "Once you have selected a candidate, create and send the offer letter through the system.",
      "action": "Generate offer letter with compensation details",
      "tip": "Get HR and finance approval before sending the offer"
    }
  ]'::jsonb,
  ARRAY['Manager', 'Director', 'admin', 'HR Manager'],
  true
);

-- DIRECTOR/ADMIN LEVEL GUIDES

INSERT INTO kb_interactive_guides (title, description, feature_area, steps, target_roles, published) VALUES
(
  'Understanding HR Analytics Dashboard',
  'How to interpret key HR metrics and generate insights',
  'analytics',
  '[
    {
      "title": "Access the Analytics Dashboard",
      "description": "From the main dashboard, click on HR Data & Reporting, then select Analytics.",
      "action": "Navigate to Analytics module",
      "tip": "Analytics are updated nightly with the latest data"
    },
    {
      "title": "Review Key Metrics",
      "description": "View critical HR KPIs: headcount, turnover rate, time-to-fill, employee satisfaction, etc.",
      "action": "Examine the KPI summary cards",
      "tip": "Red indicators show metrics that need attention"
    },
    {
      "title": "Analyze Trends",
      "description": "Use the trend charts to see how metrics have changed over time (monthly, quarterly, yearly).",
      "action": "Explore trend visualizations",
      "tip": "Look for patterns that might indicate systemic issues"
    },
    {
      "title": "Drill Down by Department",
      "description": "Filter data by department, location, or other dimensions to identify problem areas.",
      "action": "Use filter controls to segment data",
      "tip": "Compare departments to identify best practices"
    },
    {
      "title": "Export Reports",
      "description": "Generate custom reports and export to Excel or PDF for presentations.",
      "action": "Use the export functionality",
      "tip": "Schedule automatic reports to be emailed regularly"
    },
    {
      "title": "Take Action on Insights",
      "description": "Use the insights to make data-driven decisions about hiring, retention, and development.",
      "action": "Create action plans based on findings",
      "tip": "Track progress on initiatives in the Goals module"
    }
  ]'::jsonb,
  ARRAY['Director', 'admin', 'HR Manager'],
  true
),
(
  'Configuring System Settings',
  'Admin guide to configuring HRStudio360 settings',
  'settings',
  '[
    {
      "title": "Access System Settings",
      "description": "Click the gear icon in the top right, then select System Settings.",
      "action": "Open System Settings modal",
      "tip": "Only admins can access these settings"
    },
    {
      "title": "Configure Company Information",
      "description": "Update company name, logo, address, and other basic information.",
      "action": "Edit company profile section",
      "tip": "This information appears on reports and employee documents"
    },
    {
      "title": "Set Up Departments",
      "description": "Create and manage departments, cost centers, and organizational structure.",
      "action": "Manage departments and hierarchy",
      "tip": "Keep the org structure current as the company grows"
    },
    {
      "title": "Configure Leave Policies",
      "description": "Set up leave types, accrual rules, carryover limits, and approval workflows.",
      "action": "Customize leave policy settings",
      "tip": "Different policies can apply to different employee groups"
    },
    {
      "title": "Set Payroll Schedules",
      "description": "Define pay periods, pay dates, and payroll processing calendars.",
      "action": "Configure payroll calendar",
      "tip": "Ensure pay dates align with bank processing times"
    },
    {
      "title": "Manage User Permissions",
      "description": "Control who has access to different modules and features based on roles.",
      "action": "Edit role-based permissions",
      "tip": "Follow the principle of least privilege for security"
    }
  ]'::jsonb,
  ARRAY['admin', 'super_admin'],
  true
),
(
  'Managing User Access and Permissions',
  'How to grant and revoke system access for users',
  'user_management',
  '[
    {
      "title": "Open User Management",
      "description": "Navigate to System Settings and select User Management.",
      "action": "Access User Management module",
      "tip": "You can search for users by name, email, or department"
    },
    {
      "title": "View User Permissions",
      "description": "Click on a user to see their current role, permissions, and access levels.",
      "action": "Select a user to view details",
      "tip": "Review permissions regularly to ensure they are still appropriate"
    },
    {
      "title": "Change User Role",
      "description": "Update the user role if their responsibilities have changed (Employee, Manager, Admin, etc.).",
      "action": "Use the role dropdown to change user role",
      "tip": "Role changes take effect immediately"
    },
    {
      "title": "Grant Special Permissions",
      "description": "Add specific access rights like Org Chart access, Expense Approval, or Report Builder.",
      "action": "Toggle special permission switches",
      "tip": "Document why special permissions were granted"
    },
    {
      "title": "Deactivate Users",
      "description": "When employees leave, deactivate their account to revoke access while preserving data.",
      "action": "Click Deactivate User button",
      "tip": "Never delete users - deactivation maintains data integrity"
    }
  ]'::jsonb,
  ARRAY['admin', 'super_admin', 'HR Manager'],
  true
);

-- GENERAL PLATFORM GUIDES

INSERT INTO kb_interactive_guides (title, description, feature_area, steps, target_roles, published) VALUES
(
  'Navigating HRStudio360',
  'Overview of the HRStudio360 interface and key features',
  'navigation',
  '[
    {
      "title": "Understanding the Dashboard",
      "description": "The dashboard is your home base. It shows quick actions, notifications, and key information.",
      "action": "Explore the main dashboard tiles",
      "tip": "You can customize which tiles appear on your dashboard"
    },
    {
      "title": "Using the Search Bar",
      "description": "The search bar at the top lets you quickly find employees, documents, or navigate to features.",
      "action": "Try searching for something",
      "tip": "Use keywords like employee names, document types, or feature names"
    },
    {
      "title": "Accessing Quick Actions",
      "description": "Common tasks like requesting time off or viewing pay stubs are available via Quick Actions.",
      "action": "Click the Quick Actions menu",
      "tip": "The most frequently used actions appear at the top"
    },
    {
      "title": "Checking Notifications",
      "description": "The bell icon shows pending approvals, messages, and system notifications.",
      "action": "Click the notification bell",
      "tip": "Red badges indicate items that need your attention"
    },
    {
      "title": "Using the Knowledge Base",
      "description": "Access help articles, training courses, and resources anytime from the Knowledge Base.",
      "action": "Open Knowledge Base from the menu",
      "tip": "Bookmark frequently needed articles for quick access"
    }
  ]'::jsonb,
  ARRAY['Employee', 'Manager', 'Supervisor', 'Director', 'admin'],
  true
),
(
  'Using the Knowledge Base Effectively',
  'Learn how to find answers and resources in the Knowledge Base',
  'knowledge_base',
  '[
    {
      "title": "Accessing the Knowledge Base",
      "description": "Click on the Knowledge Base tile or use the search bar to access help resources.",
      "action": "Open Knowledge Base modal",
      "tip": "The Knowledge Base is available 24/7 for self-service help"
    },
    {
      "title": "Searching for Articles",
      "description": "Use the search bar to find articles by keyword. Results show relevance ranking.",
      "action": "Try searching for a topic",
      "tip": "Be specific in your search terms for better results"
    },
    {
      "title": "Browsing by Category",
      "description": "Explore articles organized by topic: Time Off, Payroll, Benefits, Performance, etc.",
      "action": "Click on a category to browse",
      "tip": "Categories help you discover related articles"
    },
    {
      "title": "Taking Courses",
      "description": "Complete interactive training courses to learn new skills and earn certificates.",
      "action": "Navigate to the Courses tab",
      "tip": "Some courses may be required for your role"
    },
    {
      "title": "Following Interactive Guides",
      "description": "Use step-by-step guides that walk you through common tasks.",
      "action": "Go to the Guides tab",
      "tip": "Guides are tailored to your role and permissions"
    },
    {
      "title": "Bookmarking Useful Content",
      "description": "Bookmark articles, courses, or guides you reference frequently for quick access.",
      "action": "Click the bookmark icon on any content",
      "tip": "Your bookmarks are saved in My Bookmarks"
    },
    {
      "title": "Downloading Resources",
      "description": "Access company policies, handbooks, forms, and templates from the Resources tab.",
      "action": "Open the Resources tab",
      "tip": "Always use the latest version from the Knowledge Base"
    }
  ]'::jsonb,
  ARRAY['Employee', 'Manager', 'Supervisor', 'Director', 'admin'],
  true
),
(
  'Managing Your Notifications',
  'How to configure and respond to system notifications',
  'notifications',
  '[
    {
      "title": "Understanding Notification Types",
      "description": "HRStudio360 sends notifications for approvals, deadlines, messages, and system updates.",
      "action": "Review the notification categories",
      "tip": "Critical notifications are marked with a red badge"
    },
    {
      "title": "Viewing Your Notifications",
      "description": "Click the bell icon to see all recent notifications. Unread items are highlighted.",
      "action": "Open the notifications panel",
      "tip": "Notifications are organized by date and priority"
    },
    {
      "title": "Taking Action on Notifications",
      "description": "Click on a notification to go directly to the item that needs your attention.",
      "action": "Click on a notification",
      "tip": "This is the fastest way to handle pending tasks"
    },
    {
      "title": "Marking as Read",
      "description": "Mark notifications as read to clear them from your list, or mark all as read at once.",
      "action": "Use the mark as read options",
      "tip": "Keep your notification list manageable"
    },
    {
      "title": "Configuring Notification Preferences",
      "description": "Choose which notifications you receive via email, in-app, or mobile push.",
      "action": "Go to Settings > Notifications",
      "tip": "Balance staying informed with avoiding notification overload"
    }
  ]'::jsonb,
  ARRAY['Employee', 'Manager', 'Supervisor', 'Director', 'admin'],
  true
);

-- Update counts for features
UPDATE kb_interactive_guides SET created_at = now(), updated_at = now();
