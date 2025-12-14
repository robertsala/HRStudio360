import { db } from './db.js';
import { tutorials, tutorialSteps } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const hrTicketingTutorial = {
  title: 'HR Support Ticketing System',
  description: 'Learn how to submit support tickets to HR and track their resolution. This system helps you get answers to HR-related questions about payroll, benefits, time off, and more.',
  category: 'employee-management' as const,
  difficulty: 'beginner' as const,
  estimatedMinutes: 5,
  roleAccess: ['Employee', 'HR', 'Manager', 'Product Owner'],
  tags: ['HR', 'Support', 'Tickets', 'Help'],
  isPublished: true,
  sortOrder: 50
};

const hrTicketingSteps = [
  {
    stepNumber: 1,
    title: 'Access HR Support',
    content: `## Getting Started with HR Support

The HR Support system allows you to submit questions and requests directly to the HR team.

**To access HR Support:**
1. Look for "HR Support" in the left sidebar menu
2. Click to open the HR Support page

This page has two main sections:
- **Submit New Ticket** - Create a new support request
- **My Tickets** - Track your existing requests`,
    actionType: 'navigate',
    actionTarget: '/hr-support',
    actionLabel: 'Go to HR Support',
    checklist: ['Find HR Support in the sidebar', 'Open the HR Support page']
  },
  {
    stepNumber: 2,
    title: 'Submit a New Ticket',
    content: `## Creating a Support Ticket

When you need help from HR, submit a ticket with the following information:

**Required fields:**
- **Subject** - A brief title for your request (e.g., "Question about PTO balance")
- **Category** - Select the type of issue:
  - Payroll - Pay-related questions
  - Benefits - Health insurance, 401k, etc.
  - Time Off - PTO, sick leave, holidays
  - Workplace - Office/remote work issues
  - Policy - Company policy questions
  - Training - Learning & development
  - Technical - System access issues
  - Other - Anything else
- **Priority** - How urgent is your request:
  - Low - General questions, no time pressure
  - Medium - Needs attention within a few days
  - High - Time-sensitive matter
  - Urgent - Requires immediate attention
- **Description** - Detailed explanation of your request

Click "Submit Ticket" when ready.`,
    actionType: 'none',
    checklist: ['Enter a clear subject line', 'Select the appropriate category', 'Set the correct priority', 'Provide detailed description']
  },
  {
    stepNumber: 3,
    title: 'Track Your Tickets',
    content: `## Monitoring Ticket Status

After submitting, you can track your ticket's progress in "My Tickets":

**Ticket Statuses:**
- **Open** - Ticket received, awaiting assignment
- **In Progress** - HR is actively working on it
- **Pending** - Waiting for additional information
- **Resolved** - Issue has been addressed
- **Closed** - Ticket is complete

**For each ticket you can see:**
- Ticket number (e.g., HR-2025-00001)
- Current status and priority
- HR staff assigned to help you
- Comments and updates from HR
- Resolution details when complete

Click on any ticket to view full details and conversation history.`,
    actionType: 'none',
    checklist: ['View your submitted tickets', 'Check ticket status', 'Read any HR responses']
  },
  {
    stepNumber: 4,
    title: 'Respond to HR Comments',
    content: `## Communicating with HR

HR staff may add comments to your ticket with questions or updates.

**To respond:**
1. Open your ticket from "My Tickets"
2. Scroll to the Comments section
3. Type your response in the comment box
4. Click "Add Comment" to send

**Tips for effective communication:**
- Check your tickets regularly for updates
- Respond promptly to any questions
- Provide additional details when requested
- Keep all related discussion in the ticket thread

You'll also receive notifications when HR updates your ticket.`,
    actionType: 'none',
    checklist: ['Check for HR comments', 'Reply with requested information', 'Confirm when issue is resolved']
  }
];

const hrAdminTutorial = {
  title: 'HR Ticket Administration',
  description: 'Learn how to manage employee support tickets as an HR administrator. Assign tickets, update statuses, add internal notes, and resolve employee inquiries efficiently.',
  category: 'employee-management' as const,
  difficulty: 'intermediate' as const,
  estimatedMinutes: 10,
  roleAccess: ['HR', 'Product Owner'],
  tags: ['HR', 'Admin', 'Tickets', 'Management'],
  isPublished: true,
  sortOrder: 51
};

const hrAdminSteps = [
  {
    stepNumber: 1,
    title: 'Access the Admin Dashboard',
    content: `## HR Ticket Management Dashboard

As HR staff or Product Owner, you have access to the full ticket management system.

**To access the dashboard:**
1. Navigate to the Dashboard
2. Click the "HR Tickets" option in the sidebar or dashboard
3. The full management interface will open

**Dashboard Overview:**
- Stats showing Open, Assigned to Me, Unassigned, and Urgent tickets
- Search and filter controls
- Complete ticket list with all details
- Detail panel for selected tickets`,
    actionType: 'none',
    checklist: ['Access the HR Ticket Dashboard', 'Review the stats overview']
  },
  {
    stepNumber: 2,
    title: 'Quick-Assign Tickets',
    content: `## Assigning Tickets to HR Staff

Tickets should be assigned to specific HR team members for accountability.

**Quick-Assign from the list:**
1. Find the ticket in the list
2. In the "Actions" column, use the dropdown
3. Select the HR staff member to assign
4. Assignment happens immediately

**Assign from the detail panel:**
1. Click on a ticket to open details
2. Find "Assign Ticket" section
3. Select assignee from dropdown
4. Click "Assign" button

**Best Practices:**
- Assign based on expertise (payroll to payroll specialist)
- Balance workload across team
- Reassign if needed`,
    actionType: 'none',
    checklist: ['Use quick-assign dropdown', 'Assign a ticket to yourself or colleague']
  },
  {
    stepNumber: 3,
    title: 'Update Ticket Status',
    content: `## Managing Ticket Workflow

Keep tickets moving through the resolution process:

**Status Options:**
- **Open** - New ticket, not started
- **In Progress** - Actively working on resolution
- **Pending** - Waiting for employee response or external info
- **Resolved** - Issue addressed, awaiting confirmation
- **Closed** - Ticket complete

**To update status:**
1. Open the ticket detail panel
2. Find "Update Status" section
3. Select new status
4. Add optional note explaining the change
5. If resolving, add resolution description
6. Click "Update Status"

All status changes are logged in the ticket history.`,
    actionType: 'none',
    checklist: ['Open a ticket', 'Change status to In Progress', 'Add a status note']
  },
  {
    stepNumber: 4,
    title: 'Add Comments and Internal Notes',
    content: `## Communicating on Tickets

Two types of comments are available:

**Regular Comments:**
- Visible to the employee who submitted the ticket
- Use for updates, questions, and resolution details
- Employee receives notification

**Internal Notes:**
- Only visible to HR staff
- Use for internal discussion
- Helpful for handoffs between team members

**To add a comment:**
1. Open the ticket
2. Find the Comments section
3. Type your message
4. Check "Internal note" if HR-only
5. Click "Add Comment"

**Tips:**
- Be professional in employee-visible comments
- Use internal notes for sensitive discussions
- Document decisions for audit trail`,
    actionType: 'none',
    checklist: ['Add a comment to a ticket', 'Try adding an internal note']
  },
  {
    stepNumber: 5,
    title: 'Resolve and Close Tickets',
    content: `## Completing Tickets

When an issue is resolved:

**To resolve:**
1. Update status to "Resolved"
2. Add a Resolution description explaining how the issue was addressed
3. Click "Update Status"

**Resolution should include:**
- What action was taken
- Any follow-up needed
- Relevant policy references

**After employee confirms:**
- Update status to "Closed"
- Ticket moves to history

**Filtering & Reporting:**
- Use filters to view resolved/closed tickets
- Track resolution times
- Identify common issues for process improvement`,
    actionType: 'none',
    checklist: ['Resolve a ticket with description', 'View ticket history', 'Close a confirmed ticket']
  }
];

export async function seedHRTicketingTutorials() {
  try {
    console.log('Seeding HR Ticketing tutorials...');
    
    const existingTutorial = await db.query.tutorials.findFirst({
      where: eq(tutorials.title, hrTicketingTutorial.title)
    });
    
    if (existingTutorial) {
      console.log('HR Ticketing tutorial already exists. Skipping seed.');
      return { seeded: false, count: 0 };
    }

    const [employeeTutorial] = await db.insert(tutorials).values([hrTicketingTutorial]).returning();
    console.log(`Created employee tutorial: ${employeeTutorial.id}`);

    const employeeSteps = hrTicketingSteps.map(step => ({
      ...step,
      tutorialId: employeeTutorial.id
    }));
    await db.insert(tutorialSteps).values(employeeSteps);
    console.log(`Added ${employeeSteps.length} steps to employee tutorial`);

    const [adminTutorial] = await db.insert(tutorials).values([hrAdminTutorial]).returning();
    console.log(`Created admin tutorial: ${adminTutorial.id}`);

    const adminSteps = hrAdminSteps.map(step => ({
      ...step,
      tutorialId: adminTutorial.id
    }));
    await db.insert(tutorialSteps).values(adminSteps);
    console.log(`Added ${adminSteps.length} steps to admin tutorial`);

    console.log('Successfully seeded HR Ticketing tutorials');
    return { seeded: true, count: 2 };
  } catch (error) {
    console.error('Error seeding HR Ticketing tutorials:', error);
    throw error;
  }
}
