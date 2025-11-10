import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

if (!resend) {
  console.warn('⚠️  RESEND_API_KEY not found - email notifications will be logged but not sent');
}

export interface CollaboratorInviteEmailParams {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  message?: string;
  invitationId: string;
}

export interface CollaboratorAcceptedEmailParams {
  recipientEmail: string;
  recipientName: string;
  acceptedByName: string;
}

export async function sendCollaboratorInviteEmail(params: CollaboratorInviteEmailParams): Promise<void> {
  if (!resend) {
    console.log(`📧 [Email Skipped] Would send collaboration invite to ${params.recipientEmail} from ${params.senderName}`);
    return;
  }

  try {
    await resend.emails.send({
      from: 'HRStudio360 <noreply@hrstudio360.com>',
      to: params.recipientEmail,
      subject: `${params.senderName} invited you to collaborate on HRStudio360`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .message { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🤝 Collaboration Invitation</h1>
              </div>
              <div class="content">
                <p>Hi ${params.recipientName},</p>
                <p><strong>${params.senderName}</strong> has invited you to collaborate on HRStudio360!</p>
                ${params.message ? `
                  <div class="message">
                    <strong>Message:</strong>
                    <p>${params.message}</p>
                  </div>
                ` : ''}
                <p>Click the button below to log in to HRStudio360 and accept the invitation:</p>
                <center>
                  <a href="${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}" class="button">
                    View Invitation
                  </a>
                </center>
                <p>You can view and manage all your collaboration invites in your notifications inbox.</p>
                <div class="footer">
                  <p>This is an automated email from HRStudio360. Please do not reply to this email.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    });
  } catch (error) {
    console.error('⚠️  Failed to send collaborator invite email:', error);
  }
}

export async function sendCollaboratorAcceptedEmail(params: CollaboratorAcceptedEmailParams): Promise<void> {
  if (!resend) {
    console.log(`📧 [Email Skipped] Would send acceptance notification to ${params.recipientEmail} from ${params.acceptedByName}`);
    return;
  }

  try {
    await resend.emails.send({
      from: 'HRStudio360 <noreply@hrstudio360.com>',
      to: params.recipientEmail,
      subject: `${params.acceptedByName} accepted your collaboration invite`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .success-icon { font-size: 48px; margin: 10px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">✅</div>
                <h1>Invitation Accepted!</h1>
              </div>
              <div class="content">
                <p>Hi ${params.recipientName},</p>
                <p>Great news! <strong>${params.acceptedByName}</strong> has accepted your collaboration invitation on HRStudio360.</p>
                <p>You can now work together on projects and collaborate seamlessly.</p>
                <center>
                  <a href="${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}" class="button">
                    Go to HRStudio360
                  </a>
                </center>
                <div class="footer">
                  <p>This is an automated email from HRStudio360. Please do not reply to this email.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    });
  } catch (error) {
    console.error('⚠️  Failed to send collaborator accepted email:', error);
  }
}
