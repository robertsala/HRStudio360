import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Define the interfaces once for clarity
interface Message {
  id?: string;
  channel_id?: string;
  sender_id?: string;
  encrypted_content?: string;
  message_type?: string;
  created_at?: string;
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
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();

    const message: Message | undefined = body?.message;
    const userId: string | undefined = body?.userId;

    if (!message || typeof message !== "object") {
      throw new Error("Invalid or missing 'message' object in request.");
    }
    if (!userId || typeof userId !== "string") {
      throw new Error("Invalid or missing 'userId' in request.");
    }

    // Pull user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, department, role")
      .eq("id", userId)
      .maybeSingle();

    const firstName = profile?.first_name || "there";
    const userDepartment = profile?.department || "your department";
    const userRole = profile?.role || "your role";

    // Pull employee and leave info
    const { data: employeeData } = await supabase
      .from("employees")
      .select("start_date, employment_type")
      .eq("user_id", userId)
      .maybeSingle();

    const employeeId =
      (
        await supabase
          .from("employees")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle()
      ).data?.id ?? null;

    const { data: leaveBalance } = await supabase
      .from("leave_balances")
      .select("vacation_days, sick_days, personal_days")
      .eq("employee_id", employeeId)
      .eq("year", new Date().getFullYear())
      .maybeSingle();

    // Get recent chat context
    const { data: recentMessages } = await supabase
      .from("chat_messages")
      .select("encrypted_content, message_type, sender_id")
      .eq("channel_id", message.channel_id)
      .order("created_at", { ascending: false })
      .limit(10);

    const isFirstMessage = !recentMessages || recentMessages.length <= 1;

    const aiResponse = await generateAIResponse(
      message.encrypted_content ?? "",
      firstName,
      userDepartment,
      userRole,
      recentMessages || [],
      isFirstMessage,
      leaveBalance,
      employeeData
    );

    // artificial small delay for UI smoothness
    await new Promise((resolve) => setTimeout(resolve, 800));

    const { data: responseMessage, error: insertError } = await supabase
      .from("chat_messages")
      .insert({
        channel_id: message.channel_id,
        sender_id: userId,
        encrypted_content: aiResponse,
        message_type: "system",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting AI response:", insertError);
      throw insertError;
    }

    return new Response(JSON.stringify({ success: true, message: responseMessage }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in AI assistant:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/** Generates the text AI response safely */
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
  // Safely normalize message
  const messageLower = typeof userMessage === "string" ? userMessage.toLowerCase() : "";

  if (isFirstMessage) {
    return `Hi ${firstName}! 👋 I'm Studio, your HRStudio360 AI Assistant. I'm here to help you with HR questions, company policies, benefits information, and more. What can I help you with today?`;
  }

  // Response categories
  const responses: Record<string, string[]> = {
    benefits: [
      `Hi ${firstName}! I'd be happy to help with benefits information. 🏥

We offer comprehensive benefits including:
• Health, dental, and vision insurance
• 401(k) with company match
• Paid time off (PTO)
• Parental leave
• Life and disability insurance
• Wellness programs
• Professional development funds

You can view and manage your benefits in the **Benefits & Pay** section of your dashboard. Need help with enrollment or have questions about a specific benefit?`,
    ],
    pto: [
      `Hi ${firstName}! For PTO inquiries:

**Your current balance:**${
        leaveBalance
          ? `\n• Vacation: ${leaveBalance.vacation_days} days\n• Sick: ${leaveBalance.sick_days} days\n• Personal: ${leaveBalance.personal_days} days`
          : "\n• Check your balance in Leave Management"
      }

**To request time off:**
1. Go to **Leave Management**
2. Click **Request Time Off**
3. Select dates and type
4. Submit for manager approval

Your manager typically responds within 24–48 hours. Need help with a specific request?`,
    ],
    payroll: [
      `Hi ${firstName}! For payroll questions:

**Paycheck Schedule:**
• Paychecks are issued bi‑weekly on Fridays
• Next payday: Check the Payroll section

**What you can do:**
✓ View pay stubs
✓ Update direct deposit
✓ Adjust tax withholdings
✓ Review YTD earnings

Go to **Payroll** in your dashboard to access all pay information. What specific payroll help do you need?`,
    ],
    chat: [
      `Hi ${firstName}! To chat with other employees:

**Start a Direct Message:**
1. Click **+ New Channel**
2. Select **Direct Message**
3. Search for the person's name
4. Click their name
5. Click **Create Channel**

**Create a Group Chat:**
1. Click **+ New Channel**
2. Select **Group Chat**
3. Add multiple people
4. Give it a name
5. Click **Create Channel**

You can add team members from ${department} or anyone in the company. Want me to walk you through it?`,
    ],
    help: [
      `Hi ${firstName}! I'm here to help with:

💼 HR & Benefits
• Benefits enrollment
• Insurance questions
• Retirement planning

🏖️ Time Off
• PTO requests
• Leave balances
• Holiday calendar

💰 Payroll & Pay
• Direct deposit
• Pay stubs
• Tax forms

💬 Communication
• Enterprise Chat
• Find employees
• Team collaboration

What can I help you with today?`,
    ],
  };

  // Detect topic keywords
  let responseCategory = "help";
  if (messageLower.includes("benefit") || messageLower.includes("insurance") || messageLower.includes("enroll")) {
    responseCategory = "benefits";
  } else if (
    messageLower.includes("pto") ||
    messageLower.includes("time off") ||
    messageLower.includes("vacation") ||
    messageLower.includes("leave")
  ) {
    responseCategory = "pto";
  } else if (messageLower.includes("pay") || messageLower.includes("salary") || messageLower.includes("paycheck")) {
    responseCategory = "payroll";
  } else if (
    messageLower.includes("chat") ||
    messageLower.includes("message") ||
    messageLower.includes("talk to") ||
    messageLower.includes("direct message")
  ) {
    responseCategory = "chat";
  }

  const categoryResponses = responses[responseCategory] || responses["help"];
  const randomIndex = Math.floor(Math.random() * categoryResponses.length);
  return categoryResponses[randomIndex];
}