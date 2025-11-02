import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CollaborationInviteRequest {
  to: string;
  inviterName: string;
  candidateName: string;
  candidatePosition: string;
  role: string;
  collaborationId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: CollaborationInviteRequest = await req.json();
    const { to, inviterName, candidateName, candidatePosition, role, collaborationId } = body;

    if (!to || !inviterName || !candidateName || !candidatePosition || !role) {
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

    const roleDescriptions: Record<string, string> = {
      viewer: 'view candidate details',
      commenter: 'view and add comments',
      decision_maker: 'view, comment, and rate candidates'
    };

    const roleDescription = roleDescriptions[role] || 'collaborate on';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Hiring Collaboration Invitation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 0; text-align: center;">
                <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🤝 Collaboration Invitation</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="font-size: 18px; color: #18181b; margin: 0 0 20px 0;">Hello,</p>

                      <p style="font-size: 16px; color: #3f3f46; line-height: 1.6; margin: 0 0 20px 0;">
                        <strong>${inviterName}</strong> has invited you to collaborate on a candidate evaluation in HRStudio360.
                      </p>

                      <!-- Candidate Info Box -->
                      <table role="presentation" style="width: 100%; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">Candidate Details</h2>
                            <table role="presentation" style="width: 100%;">
                              <tr>
                                <td style="padding: 8px 0; color: #3f3f46; font-size: 15px;"><strong>Name:</strong></td>
                                <td style="padding: 8px 0; color: #3f3f46; font-size: 15px; text-align: right;">${candidateName}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #3f3f46; font-size: 15px;"><strong>Position:</strong></td>
                                <td style="padding: 8px 0; color: #3f3f46; font-size: 15px; text-align: right;">${candidatePosition}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #3f3f46; font-size: 15px;"><strong>Your Role:</strong></td>
                                <td style="padding: 8px 0; color: #3f3f46; font-size: 15px; text-align: right;">${role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <p style="font-size: 16px; color: #3f3f46; line-height: 1.6; margin: 0 0 20px 0;">
                        As a collaborator, you'll be able to <strong>${roleDescription}</strong> for this hiring process.
                      </p>

                      <!-- What You Can Do -->
                      <h2 style="color: #18181b; margin: 30px 0 15px 0; font-size: 20px;">What You Can Do</h2>
                      <ul style="font-size: 16px; color: #3f3f46; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
                        ${role === 'viewer' ? `
                          <li>View candidate profile and qualifications</li>
                          <li>Review candidate documents and resume</li>
                          <li>See evaluation progress</li>
                        ` : role === 'commenter' ? `
                          <li>View candidate profile and qualifications</li>
                          <li>Add comments and feedback</li>
                          <li>Participate in discussions</li>
                          <li>Review other team members' comments</li>
                        ` : `
                          <li>View complete candidate profile</li>
                          <li>Add comments and detailed feedback</li>
                          <li>Rate the candidate</li>
                          <li>Participate in hiring decisions</li>
                          <li>Move candidate through pipeline stages</li>
                        `}
                      </ul>

                      <!-- Call to Action -->
                      <table role="presentation" style="margin: 30px 0;">
                        <tr>
                          <td style="text-align: center;">
                            <p style="font-size: 16px; color: #3f3f46; margin: 0 0 20px 0;">
                              Log in to HRStudio360 to accept this invitation and start collaborating.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <p style="font-size: 16px; color: #3f3f46; line-height: 1.6; margin: 30px 0 0 0;">
                        If you have any questions about this collaboration, please reach out to ${inviterName} or your HR team.
                      </p>

                      <p style="font-size: 16px; color: #3f3f46; line-height: 1.6; margin: 20px 0 0 0;">
                        <strong>The HRStudio360 Team</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f4f4f5; padding: 30px; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="font-size: 14px; color: #71717a; margin: 0;">
                        This is an automated message from HRStudio360
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
Hiring Collaboration Invitation

Hello,

${inviterName} has invited you to collaborate on a candidate evaluation in HRStudio360.

Candidate Details:
- Name: ${candidateName}
- Position: ${candidatePosition}
- Your Role: ${role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}

As a collaborator, you'll be able to ${roleDescription} for this hiring process.

Log in to HRStudio360 to accept this invitation and start collaborating.

If you have any questions about this collaboration, please reach out to ${inviterName} or your HR team.

The HRStudio360 Team
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
          from: 'HR Studio <collaboration@resend.dev>',
          to: [to],
          subject: `🤝 You've been invited to collaborate on ${candidateName}'s hiring process`,
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
          message: `Collaboration invitation sent successfully to ${to}`
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
      console.log('Subject:', `🤝 You've been invited to collaborate on ${candidateName}'s hiring process`);
      console.log('Content:', emailText);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Email prepared for ${to} (Resend API key not configured)`,
          preview: {
            to,
            subject: `🤝 You've been invited to collaborate on ${candidateName}'s hiring process`,
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
    console.error('Error in send-collaboration-invite function:', error);

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