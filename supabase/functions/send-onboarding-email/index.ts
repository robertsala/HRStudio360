import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OnboardingEmailRequest {
  to: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  startDate: string;
  managerName?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: OnboardingEmailRequest = await req.json();
    const { to, firstName, lastName, position, department, startDate, managerName } = body;

    if (!to || !firstName || !lastName || !position || !startDate) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Our Team!</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 0; text-align: center;">
                <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">Welcome to the Team! 🎉</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="font-size: 18px; color: #18181b; margin: 0 0 20px 0;">Hi ${firstName},</p>

                      <p style="font-size: 16px; color: #3f3f46; line-height: 1.6; margin: 0 0 20px 0;">
                        Congratulations! We're thrilled to officially welcome you to our team. Your journey with us is about to begin, and we couldn't be more excited to have you join us as our new <strong>${position}</strong> in the <strong>${department}</strong> department.
                      </p>

                      <!-- Key Details Box -->
                      <table role="presentation" style="width: 100%; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">Your Start Details</h2>
                            <table role="presentation" style="width: 100%;">
                              <tr>
                                <td style="padding: 8px 0; color: #3f3f46; font-size: 15px;"><strong>Start Date:</strong></td>
                                <td style="padding: 8px 0; color: #3f3f46; font-size: 15px; text-align: right;">${formattedStartDate}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #3f3f46; font-size: 15px;"><strong>Position:</strong></td>
                                <td style="padding: 8px 0; color: #3f3f46; font-size: 15px; text-align: right;">${position}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #3f3f46; font-size: 15px;"><strong>Department:</strong></td>
                                <td style="padding: 8px 0; color: #3f3f46; font-size: 15px; text-align: right;">${department}</td>
                              </tr>
                              ${managerName ? `
                              <tr>
                                <td style="padding: 8px 0; color: #3f3f46; font-size: 15px;"><strong>Manager:</strong></td>
                                <td style="padding: 8px 0; color: #3f3f46; font-size: 15px; text-align: right;">${managerName}</td>
                              </tr>
                              ` : ''}
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Next Steps -->
                      <h2 style="color: #18181b; margin: 30px 0 15px 0; font-size: 20px;">What's Next?</h2>
                      <p style="font-size: 16px; color: #3f3f46; line-height: 1.6; margin: 0 0 15px 0;">
                        Over the coming days, you'll receive additional information about your onboarding process, including:
                      </p>
                      <ul style="font-size: 16px; color: #3f3f46; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
                        <li>Required paperwork and documentation</li>
                        <li>Equipment setup and IT access</li>
                        <li>Your personalized onboarding checklist</li>
                        <li>Introduction to your team members</li>
                        <li>Training schedule and resources</li>
                      </ul>

                      <!-- Call to Action -->
                      <table role="presentation" style="margin: 30px 0;">
                        <tr>
                          <td style="text-align: center;">
                            <p style="font-size: 16px; color: #3f3f46; margin: 0 0 20px 0;">
                              Your HR team will be in touch soon with your complete onboarding checklist and next steps.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <p style="font-size: 16px; color: #3f3f46; line-height: 1.6; margin: 30px 0 0 0;">
                        If you have any questions before your start date, please don't hesitate to reach out to our HR team.
                      </p>

                      <p style="font-size: 16px; color: #3f3f46; line-height: 1.6; margin: 20px 0 0 0;">
                        We're looking forward to working with you!
                      </p>

                      <p style="font-size: 16px; color: #3f3f46; line-height: 1.6; margin: 5px 0 0 0;">
                        <strong>The HR Team</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f4f4f5; padding: 30px; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="font-size: 14px; color: #71717a; margin: 0;">
                        This is an automated message from your HR Management System
                      </p>
                      <p style="font-size: 12px; color: #a1a1aa; margin: 10px 0 0 0;">
                        © ${new Date().getFullYear()} HR Studio. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const emailText = `
Welcome to Our Team!

Hi ${firstName},

Congratulations! We're thrilled to officially welcome you to our team. Your journey with us is about to begin, and we couldn't be more excited to have you join us as our new ${position} in the ${department} department.

Your Start Details:
- Start Date: ${formattedStartDate}
- Position: ${position}
- Department: ${department}
${managerName ? `- Manager: ${managerName}` : ''}

What's Next?
Over the coming days, you'll receive additional information about your onboarding process, including:
- Required paperwork and documentation
- Equipment setup and IT access
- Your personalized onboarding checklist
- Introduction to your team members
- Training schedule and resources

Your HR team will be in touch soon with your complete onboarding checklist and next steps.

If you have any questions before your start date, please don't hesitate to reach out to our HR team.

We're looking forward to working with you!

The HR Team
    `;

    // Send email using Resend API
    if (RESEND_API_KEY) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'HR Studio <onboarding@resend.dev>',
          to: [to],
          subject: `Welcome to the Team, ${firstName}! 🎉`,
          html: emailHtml,
          text: emailText,
        }),
      });

      const resendData = await resendResponse.json();

      if (!resendResponse.ok) {
        console.error('Resend API error:', resendData);
        throw new Error(resendData.message || 'Failed to send email');
      }

      return new Response(
        JSON.stringify({
          success: true,
          messageId: resendData.id,
          message: `Onboarding email sent successfully to ${to}`
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      // Fallback: Log email details (for testing without Resend API key)
      console.log('Email would be sent to:', to);
      console.log('Subject:', `Welcome to the Team, ${firstName}! 🎉`);
      console.log('Content:', emailText);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Email prepared for ${to} (Resend API key not configured)`,
          preview: {
            to,
            subject: `Welcome to the Team, ${firstName}! 🎉`,
            content: emailText
          }
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

  } catch (error) {
    console.error('Error in send-onboarding-email function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});