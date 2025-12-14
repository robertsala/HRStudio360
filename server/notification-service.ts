import { Resend } from 'resend';
import { storage } from './storage.js';
import type { HrTicket, HrTicketComment } from '../shared/schema.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface NotificationRecipient {
  userId: string;
  email: string;
  name: string;
  role: 'employee' | 'manager' | 'hr' | 'payroll';
}

export interface AutoFixNotification {
  fixType: string;
  fixTitle: string;
  affectedEmployees: Array<{
    id: string;
    name: string;
    department: string;
  }>;
  approvedBy: string;
  approvedByName: string;
  approvalReason?: string;
  changesSummary: string;
}

class NotificationService {
  async sendAutoFixApprovalNotifications(
    notification: AutoFixNotification,
    recipients: NotificationRecipient[]
  ): Promise<{ emailsSent: string[]; inAppNotificationsSent: string[] }> {
    const emailsSent: string[] = [];
    const inAppNotificationsSent: string[] = [];

    // Group recipients by role for different message templates
    const employeeRecipients = recipients.filter(r => r.role === 'employee');
    const managerRecipients = recipients.filter(r => r.role === 'manager');
    const hrRecipients = recipients.filter(r => r.role === 'hr');
    const payrollRecipients = recipients.filter(r => r.role === 'payroll');

    // Send email notifications to employees
    for (const recipient of employeeRecipients) {
      try {
        await this.sendEmployeeAutoFixEmail(recipient, notification);
        emailsSent.push(recipient.email);
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
      }

      // Create in-app notification
      try {
        await storage.createUserNotification({
          userId: recipient.userId,
          type: 'system',
          title: 'Payroll Auto-Fix Applied',
          message: `An auto-fix has been applied to your payroll: ${notification.fixTitle}`,
          link: '/payroll',
          isRead: false
        });
        inAppNotificationsSent.push(recipient.userId);
      } catch (error) {
        console.error(`Failed to create in-app notification for ${recipient.userId}:`, error);
      }
    }

    // Send email notifications to managers
    for (const recipient of managerRecipients) {
      try {
        await this.sendManagerAutoFixEmail(recipient, notification);
        emailsSent.push(recipient.email);
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
      }

      // Create in-app notification
      try {
        await storage.createUserNotification({
          userId: recipient.userId,
          type: 'system',
          title: 'Payroll Auto-Fix Applied to Team Member',
          message: `An auto-fix was applied affecting ${notification.affectedEmployees.length} team member(s): ${notification.fixTitle}`,
          link: '/payroll',
          isRead: false
        });
        inAppNotificationsSent.push(recipient.userId);
      } catch (error) {
        console.error(`Failed to create in-app notification for ${recipient.userId}:`, error);
      }
    }

    // Send in-app notifications to HR team
    for (const recipient of hrRecipients) {
      try {
        await storage.createUserNotification({
          userId: recipient.userId,
          type: 'system',
          title: 'Auto-Fix Approved',
          message: `${notification.approvedByName} approved an auto-fix: ${notification.fixTitle}`,
          link: '/auto-fix-audit',
          isRead: false
        });
        inAppNotificationsSent.push(recipient.userId);
      } catch (error) {
        console.error(`Failed to create in-app notification for ${recipient.userId}:`, error);
      }
    }

    // Send in-app notifications to Payroll team
    for (const recipient of payrollRecipients) {
      try {
        await storage.createUserNotification({
          userId: recipient.userId,
          type: 'system',
          title: 'Payroll Auto-Fix Applied',
          message: `An auto-fix was approved affecting ${notification.affectedEmployees.length} employee(s). Review changes in payroll module.`,
          link: '/payroll',
          isRead: false
        });
        inAppNotificationsSent.push(recipient.userId);
      } catch (error) {
        console.error(`Failed to create in-app notification for ${recipient.userId}:`, error);
      }
    }

    return { emailsSent, inAppNotificationsSent };
  }

  private async sendEmployeeAutoFixEmail(
    recipient: NotificationRecipient,
    notification: AutoFixNotification
  ): Promise<void> {
    await resend.emails.send({
      from: 'HRStudio360 <noreply@hrstudio360.com>',
      to: recipient.email,
      subject: `Payroll Update: ${notification.fixTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Payroll Update Notification</h2>
          
          <p>Dear ${recipient.name},</p>
          
          <p>This is to inform you that an automated correction has been applied to your payroll records.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Fix Details</h3>
            <p><strong>Type:</strong> ${notification.fixTitle}</p>
            <p><strong>Approved By:</strong> ${notification.approvedByName} (HR Department)</p>
            ${notification.approvalReason ? `<p><strong>Notes:</strong> ${notification.approvalReason}</p>` : ''}
          </div>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <h4 style="margin-top: 0; color: #1e40af;">What Changed</h4>
            <p>${notification.changesSummary}</p>
          </div>
          
          <p style="margin-top: 30px;">You can view the updated details in your employee portal. If you have any questions about this change, please contact the HR department.</p>
          
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
            This is an automated message from HRStudio360. Please do not reply to this email.
          </p>
        </div>
      `
    });
  }

  private async sendManagerAutoFixEmail(
    recipient: NotificationRecipient,
    notification: AutoFixNotification
  ): Promise<void> {
    const employeeNames = notification.affectedEmployees.map(e => e.name).join(', ');

    await resend.emails.send({
      from: 'HRStudio360 <noreply@hrstudio360.com>',
      to: recipient.email,
      subject: `Team Payroll Update: ${notification.fixTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Team Payroll Update</h2>
          
          <p>Dear ${recipient.name},</p>
          
          <p>This is to inform you that an automated correction has been applied to payroll records for members of your team.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Fix Details</h3>
            <p><strong>Type:</strong> ${notification.fixTitle}</p>
            <p><strong>Approved By:</strong> ${notification.approvedByName} (HR Department)</p>
            <p><strong>Affected Employees:</strong> ${employeeNames}</p>
            ${notification.approvalReason ? `<p><strong>Notes:</strong> ${notification.approvalReason}</p>` : ''}
          </div>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <h4 style="margin-top: 0; color: #1e40af;">What Changed</h4>
            <p>${notification.changesSummary}</p>
          </div>
          
          <p style="margin-top: 30px;">You can view the updated details in the payroll module. The affected employees have been notified directly. If you have any questions about this change, please contact the HR department.</p>
          
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
            This is an automated message from HRStudio360. Please do not reply to this email.
          </p>
        </div>
      `
    });
  }

  // ============================================================================
  // HR TICKET NOTIFICATIONS
  // ============================================================================

  async sendTicketSubmittedNotification(ticket: HrTicket, submitterName: string): Promise<void> {
    try {
      // Get all HR staff and Product Owners to notify
      const allProfiles = await storage.getProfiles();
      const hrStaff = allProfiles.filter(p => p.department === 'HR' || p.role === 'Product Owner');

      for (const hrMember of hrStaff) {
        // Create in-app notification
        try {
          await storage.createUserNotification({
            userId: hrMember.id,
            type: 'system',
            title: 'New HR Support Ticket',
            message: `${submitterName} submitted a new ${ticket.category} ticket: "${ticket.subject}"`,
            actionUrl: '/hr-support',
            isRead: false
          });
          console.log(`✅ Sent ticket submitted notification to HR member ${hrMember.email}`);
        } catch (error) {
          console.error(`Failed to create in-app notification for ${hrMember.id}:`, error);
        }

        // Send email notification
        if (hrMember.email) {
          try {
            await this.sendTicketSubmittedEmail(
              hrMember.email,
              hrMember.fullName || 'HR Team Member',
              ticket,
              submitterName
            );
          } catch (error) {
            console.error(`Failed to send ticket submitted email to ${hrMember.email}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to send ticket submitted notifications:', error);
    }
  }

  private async sendTicketSubmittedEmail(
    toEmail: string,
    recipientName: string,
    ticket: HrTicket,
    submitterName: string
  ): Promise<void> {
    const descriptionPreview = ticket.description 
      ? (ticket.description.length > 200 ? ticket.description.substring(0, 200) + '...' : ticket.description)
      : 'No description provided';

    const priorityColor = ticket.priority === 'urgent' ? '#dc2626' 
      : ticket.priority === 'high' ? '#f97316'
      : ticket.priority === 'medium' ? '#eab308'
      : '#22c55e';

    await resend.emails.send({
      from: 'HRStudio360 <noreply@hrstudio360.com>',
      to: toEmail,
      subject: `New HR Support Ticket: ${ticket.ticketNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New HR Support Ticket</h2>
          
          <p>Dear ${recipientName},</p>
          
          <p>A new HR support ticket has been submitted and requires your attention.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Ticket Details</h3>
            <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
            <p><strong>Subject:</strong> ${ticket.subject}</p>
            <p><strong>Category:</strong> ${ticket.category}</p>
            <p><strong>Priority:</strong> <span style="color: ${priorityColor}; font-weight: bold; text-transform: capitalize;">${ticket.priority}</span></p>
            <p><strong>Submitted By:</strong> ${submitterName}</p>
          </div>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <h4 style="margin-top: 0; color: #1e40af;">Description</h4>
            <p>${descriptionPreview}</p>
          </div>
          
          <p style="margin-top: 30px;">
            <a href="https://hrstudio360.com/hr-support" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review Ticket in HR Support
            </a>
          </p>
          
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
            This is an automated message from HRStudio360. Please do not reply to this email.
          </p>
        </div>
      `
    });
    console.log(`✅ Sent ticket submitted email to ${toEmail}`);
  }

  async sendTicketStatusChangedNotification(ticket: HrTicket, oldStatus: string, newStatus: string, updatedByName: string): Promise<void> {
    try {
      // Create in-app notification
      await storage.createUserNotification({
        userId: ticket.submitterId,
        type: 'system',
        title: 'HR Ticket Status Updated',
        message: `Your ticket "${ticket.subject}" has been updated to: ${newStatus} by ${updatedByName}`,
        actionUrl: '/hr-support',
        isRead: false
      });
      console.log(`✅ Sent ticket status change notification to submitter ${ticket.submitterId}`);

      // Get submitter email and send email notification
      const submitterProfile = await storage.getProfileById(ticket.submitterId);
      if (submitterProfile?.email) {
        try {
          await this.sendTicketStatusChangedEmail(
            submitterProfile.email,
            submitterProfile.fullName || 'Valued Employee',
            ticket,
            oldStatus,
            newStatus,
            updatedByName
          );
        } catch (error) {
          console.error(`Failed to send ticket status changed email to ${submitterProfile.email}:`, error);
        }
      }
    } catch (error) {
      console.error(`Failed to send ticket status change notification:`, error);
    }
  }

  private async sendTicketStatusChangedEmail(
    toEmail: string,
    recipientName: string,
    ticket: HrTicket,
    oldStatus: string,
    newStatus: string,
    updatedByName: string
  ): Promise<void> {
    const statusDisplayMap: { [key: string]: { label: string; color: string } } = {
      'open': { label: 'Open', color: '#3b82f6' },
      'in_progress': { label: 'In Progress', color: '#f59e0b' },
      'pending': { label: 'Pending', color: '#8b5cf6' },
      'resolved': { label: 'Resolved', color: '#22c55e' },
      'closed': { label: 'Closed', color: '#6b7280' }
    };

    const oldStatusDisplay = statusDisplayMap[oldStatus] || { label: oldStatus, color: '#6b7280' };
    const newStatusDisplay = statusDisplayMap[newStatus] || { label: newStatus, color: '#6b7280' };

    await resend.emails.send({
      from: 'HRStudio360 <noreply@hrstudio360.com>',
      to: toEmail,
      subject: `Your HR Ticket ${ticket.ticketNumber} Status Updated`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">HR Ticket Status Update</h2>
          
          <p>Dear ${recipientName},</p>
          
          <p>The status of your HR support ticket has been updated.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Ticket Details</h3>
            <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
            <p><strong>Subject:</strong> ${ticket.subject}</p>
          </div>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #1e40af;">Status Change</h4>
            <p style="font-size: 16px;">
              <span style="color: ${oldStatusDisplay.color}; font-weight: bold;">${oldStatusDisplay.label}</span>
              <span style="margin: 0 10px;">→</span>
              <span style="color: ${newStatusDisplay.color}; font-weight: bold;">${newStatusDisplay.label}</span>
            </p>
            <p><strong>Updated By:</strong> ${updatedByName}</p>
          </div>
          
          <p style="margin-top: 30px;">
            <a href="https://hrstudio360.com/hr-support" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Your Ticket
            </a>
          </p>
          
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
            This is an automated message from HRStudio360. Please do not reply to this email.
          </p>
        </div>
      `
    });
    console.log(`✅ Sent ticket status changed email to ${toEmail}`);
  }

  async sendTicketCommentNotification(
    ticket: HrTicket, 
    comment: HrTicketComment, 
    authorName: string, 
    isHrComment: boolean
  ): Promise<void> {
    try {
      if (isHrComment && !comment.isInternal) {
        // HR commented (not internal note), notify submitter
        await storage.createUserNotification({
          userId: ticket.submitterId,
          type: 'system',
          title: 'New Comment on Your HR Ticket',
          message: `${authorName} commented on your ticket "${ticket.subject}"`,
          actionUrl: '/hr-support',
          isRead: false
        });
        console.log(`✅ Sent comment notification to ticket submitter ${ticket.submitterId}`);
      } else if (!isHrComment && ticket.assigneeId) {
        // Submitter commented, notify assignee
        await storage.createUserNotification({
          userId: ticket.assigneeId,
          type: 'system',
          title: 'New Comment on Assigned Ticket',
          message: `${authorName} commented on ticket "${ticket.subject}"`,
          actionUrl: '/hr-support',
          isRead: false
        });
        console.log(`✅ Sent comment notification to ticket assignee ${ticket.assigneeId}`);
      }
    } catch (error) {
      console.error(`Failed to send ticket comment notification:`, error);
    }
  }

  async sendTicketAssignedNotification(
    ticket: HrTicket, 
    assigneeName: string, 
    assignerName: string,
    submitterName: string
  ): Promise<void> {
    try {
      if (ticket.assigneeId) {
        // Create in-app notification
        await storage.createUserNotification({
          userId: ticket.assigneeId,
          type: 'system',
          title: 'HR Ticket Assigned to You',
          message: `${assignerName} assigned you to ticket: "${ticket.subject}"`,
          actionUrl: '/hr-support',
          isRead: false
        });
        console.log(`✅ Sent ticket assigned notification to ${assigneeName} (${ticket.assigneeId})`);

        // Get assignee email and send email notification
        const assigneeProfile = await storage.getProfileById(ticket.assigneeId);
        if (assigneeProfile?.email) {
          try {
            await this.sendTicketAssignedEmail(
              assigneeProfile.email,
              assigneeName,
              ticket,
              submitterName
            );
          } catch (error) {
            console.error(`Failed to send ticket assigned email to ${assigneeProfile.email}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to send ticket assigned notification:`, error);
    }
  }

  private async sendTicketAssignedEmail(
    toEmail: string,
    assigneeName: string,
    ticket: HrTicket,
    submitterName: string
  ): Promise<void> {
    const descriptionPreview = ticket.description 
      ? (ticket.description.length > 200 ? ticket.description.substring(0, 200) + '...' : ticket.description)
      : 'No description provided';

    const priorityColor = ticket.priority === 'urgent' ? '#dc2626' 
      : ticket.priority === 'high' ? '#f97316'
      : ticket.priority === 'medium' ? '#eab308'
      : '#22c55e';

    await resend.emails.send({
      from: 'HRStudio360 <noreply@hrstudio360.com>',
      to: toEmail,
      subject: `HR Ticket Assigned: ${ticket.ticketNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">HR Ticket Assigned to You</h2>
          
          <p>Dear ${assigneeName},</p>
          
          <p>An HR support ticket has been assigned to you and requires your attention.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Ticket Details</h3>
            <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
            <p><strong>Subject:</strong> ${ticket.subject}</p>
            <p><strong>Submitted By:</strong> ${submitterName}</p>
            <p><strong>Priority:</strong> <span style="color: ${priorityColor}; font-weight: bold; text-transform: capitalize;">${ticket.priority}</span></p>
          </div>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <h4 style="margin-top: 0; color: #1e40af;">Description</h4>
            <p>${descriptionPreview}</p>
          </div>
          
          <p style="margin-top: 30px;">
            <a href="https://hrstudio360.com/hr-support" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View and Respond to Ticket
            </a>
          </p>
          
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
            This is an automated message from HRStudio360. Please do not reply to this email.
          </p>
        </div>
      `
    });
    console.log(`✅ Sent ticket assigned email to ${toEmail}`);
  }

  async sendTimesheetApprovalReminder(
    managerEmail: string,
    managerName: string,
    employeeName: string,
    payPeriod: string
  ): Promise<void> {
    try {
      await resend.emails.send({
        from: 'HRStudio360 <noreply@hrstudio360.com>',
        to: managerEmail,
        subject: `Reminder: Timesheet Approval Needed for ${employeeName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Timesheet Approval Reminder</h2>
            
            <p>Dear ${managerName},</p>
            
            <p>This is a friendly reminder that a timesheet is pending your approval:</p>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p><strong>Employee:</strong> ${employeeName}</p>
              <p><strong>Pay Period:</strong> ${payPeriod}</p>
              <p><strong>Status:</strong> Awaiting Manager Approval</p>
            </div>
            
            <p>Please review and approve this timesheet at your earliest convenience to ensure timely payroll processing.</p>
            
            <p style="margin-top: 30px;">
              <a href="https://hrstudio360.com/time-leave" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Review Timesheet
              </a>
            </p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
              This is an automated message from HRStudio360. Please do not reply to this email.
            </p>
          </div>
        `
      });
      console.log(`✅ Sent timesheet approval reminder to ${managerEmail}`);
    } catch (error) {
      console.error(`Failed to send timesheet approval reminder to ${managerEmail}:`, error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();

// Simple helper for routes.ts to send individual auto-fix emails
export async function sendAutoFixNotificationEmail(params: {
  to: string;
  employeeName: string;
  fixTitle: string;
  fixType: string;
  approverName: string;
  beforeState: any;
  afterState: any;
}): Promise<void> {
  const { to, employeeName, fixTitle, fixType, approverName, beforeState, afterState } = params;
  
  const changesSummary = fixType === 'tax_calculation' 
    ? `Tax calculation corrected: Before $${beforeState.taxes?.toLocaleString() || '0.00'}, After $${afterState.taxes?.toLocaleString() || '0.00'}`
    : `${fixTitle} applied successfully`;

  try {
    await resend.emails.send({
      from: 'HRStudio360 <noreply@hrstudio360.com>',
      to,
      subject: `Payroll Auto-Fix Applied: ${fixTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Payroll Auto-Fix Notification</h2>
          
          <p>Dear ${employeeName},</p>
          
          <p>An automated correction has been applied to payroll records.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Fix Details</h3>
            <p><strong>Type:</strong> ${fixTitle}</p>
            <p><strong>Approved By:</strong> ${approverName}</p>
          </div>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <h4 style="margin-top: 0; color: #1e40af;">What Changed</h4>
            <p>${changesSummary}</p>
          </div>
          
          <p style="margin-top: 30px;">You can view the updated details in your employee portal. If you have any questions, please contact HR.</p>
          
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
            This is an automated message from HRStudio360. Please do not reply to this email.
          </p>
        </div>
      `
    });
    console.log(`✅ Sent auto-fix notification to ${to}`);
  } catch (error) {
    console.error(`Failed to send auto-fix notification to ${to}:`, error);
    throw error;
  }
}
