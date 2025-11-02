import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  encrypted_content: string;
  message_type: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department?: string;
  role?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { message, userId } = await req.json();

    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, department, role')
      .eq('id', userId)
      .maybeSingle();

    const firstName = profile?.first_name || 'there';
    const userDepartment = profile?.department || 'your department';
    const userRole = profile?.role || 'your role';

    const { data: employeeData } = await supabase
      .from('employees')
      .select('start_date, employment_type')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: leaveBalance } = await supabase
      .from('leave_balances')
      .select('vacation_days, sick_days, personal_days')
      .eq('employee_id', (await supabase.from('employees').select('id').eq('user_id', userId).maybeSingle()).data?.id)
      .eq('year', new Date().getFullYear())
      .maybeSingle();

    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('encrypted_content, message_type, sender_id')
      .eq('channel_id', message.channel_id)
      .order('created_at', { ascending: false })
      .limit(10);

    const isFirstMessage = !recentMessages || recentMessages.length <= 1;

    const aiResponse = await generateAIResponse(
      message.encrypted_content,
      firstName,
      userDepartment,
      userRole,
      recentMessages || [],
      isFirstMessage,
      leaveBalance,
      employeeData
    );

    await new Promise(resolve => setTimeout(resolve, 800));

    const { data: responseMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: message.channel_id,
        sender_id: userId,
        encrypted_content: aiResponse,
        message_type: 'system'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting AI response:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, message: responseMessage }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in AI assistant:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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

async function generateAIResponse(
  userMessage: string,
  firstName: string,
  department: string,
  role: string,
  recentMessages: any[],
  isFirstMessage: boolean,
  leaveBalance: any,
  employeeData: any
): Promise<string> {
  const messageLower = userMessage.toLowerCase();

  if (isFirstMessage) {
    return `Hi ${firstName}! 👋 I'm Studio, your HRStudio360 AI Assistant. I'm here to help you with HR questions, company policies, benefits information, and more. What can I help you with today?`;
  }

  const responses: Record<string, string[]> = {
    benefits: [
      `Hi ${firstName}! I'd be happy to help with benefits information. 🏥\n\nWe offer comprehensive benefits including:\n• Health, dental, and vision insurance\n• 401(k) with company match\n• Paid time off (PTO)\n• Parental leave\n• Life and disability insurance\n• Wellness programs\n• Professional development funds\n\nYou can view and manage your benefits in the **Benefits & Pay** section of your dashboard. Need help with enrollment or have questions about a specific benefit?`,
    ],
    pto: [
      `Hi ${firstName}! For PTO inquiries:\n\n**Your current balance:**${leaveBalance ? `\n• Vacation: ${leaveBalance.vacation_days} days\n• Sick: ${leaveBalance.sick_days} days\n• Personal: ${leaveBalance.personal_days} days` : '\n• Check your balance in Leave Management'}\n\n**To request time off:**\n1. Go to **Leave Management**\n2. Click **Request Time Off**\n3. Select dates and type\n4. Submit for manager approval\n\nYour manager typically responds within 24-48 hours. Need help with a specific request?`,
    ],
    payroll: [
      `Hi ${firstName}! For payroll questions:\n\n**Paycheck Schedule:**\n• Paychecks are issued bi-weekly on Fridays\n• Next payday: Check the Payroll section\n\n**What you can do:**\n✓ View pay stubs\n✓ Update direct deposit\n✓ Adjust tax withholdings\n✓ Review YTD earnings\n\nGo to **Payroll** in your dashboard to access all pay information. What specific payroll help do you need?`,
    ],
    chat: [
      `Hi ${firstName}! To chat with other employees:\n\n**Start a Direct Message:**\n1. Click **+ New Channel** button\n2. Select **Direct Message**\n3. Search for the person's name\n4. Click their name to select\n5. Click **Create Channel**\n\n**Create a Group Chat:**\n1. Click **+ New Channel**\n2. Select **Group Chat**\n3. Add multiple people\n4. Give it a name\n5. Click **Create Channel**\n\nYou can add team members from ${department} or anyone in the company. Want me to walk you through it?`,
    ],
    help: [
      `Hi ${firstName}! I'm here to help with:\n\n**💼 HR & Benefits**\n• Benefits enrollment\n• Insurance questions\n• Retirement planning\n\n**🏖️ Time Off**\n• PTO requests\n• Leave balances\n• Holiday calendar\n\n**💰 Payroll & Pay**\n• Direct deposit\n• Pay stubs\n• Tax forms\n\n**💬 Communication**\n• Enterprise Chat\n• Find employees\n• Team collaboration\n\nWhat can I help you with today?`,
    ],
  };

  let responseCategory = 'help';
  
  if (messageLower.includes('benefit') || messageLower.includes('insurance') || messageLower.includes('enroll')) {
    responseCategory = 'benefits';
  } else if (messageLower.includes('pto') || messageLower.includes('time off') || messageLower.includes('vacation') || messageLower.includes('leave')) {
    responseCategory = 'pto';
  } else if (messageLower.includes('pay') || messageLower.includes('salary') || messageLower.includes('paycheck')) {
    responseCategory = 'payroll';
  } else if (messageLower.includes('chat') || messageLower.includes('message') || messageLower.includes('talk to') || messageLower.includes('direct message')) {
    responseCategory = 'chat';
  }

  const categoryResponses = responses[responseCategory] || responses['help'];
  const randomIndex = Math.floor(Math.random() * categoryResponses.length);
  
  return categoryResponses[randomIndex];
}
