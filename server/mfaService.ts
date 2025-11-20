import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send verification code via email using Resend
 */
export async function sendEmailOTP(email: string, code: string): Promise<void> {
  try {
    await resend.emails.send({
      from: 'HRStudio360 <no-reply@hrstudio360.com>',
      to: email,
      subject: 'Your verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Two-Step Verification</h2>
          <p>Your verification code is:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="margin: 0; font-size: 36px; letter-spacing: 8px; color: #1f2937;">${code}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px;">HRStudio360 - Enterprise HR Platform</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Failed to send email OTP:', error);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Send verification code via SMS using Twilio
 * This is optional and requires Twilio setup
 */
export async function sendSMSOTP(phoneNumber: string, code: string): Promise<void> {
  // Check if Twilio is configured
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhone) {
    throw new Error('SMS verification is not configured. Please contact your administrator.');
  }

  try {
    // Dynamically import Twilio only if configured
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);

    await client.messages.create({
      body: `Your HRStudio360 verification code is: ${code}. This code expires in 10 minutes.`,
      from: twilioPhone,
      to: phoneNumber
    });
  } catch (error) {
    console.error('Failed to send SMS OTP:', error);
    throw new Error('Failed to send SMS verification code');
  }
}
