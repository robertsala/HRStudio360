import { Resend } from 'resend';
import { storage } from './storage.js';

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
