import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const STUDIO_AI_SYSTEM_PROMPT = `You are Studio AI, the intelligent assistant for HRStudio360 - an enterprise-grade HR management platform.

PERSONALITY & TONE:
- Friendly, professional, and helpful
- Use clear, everyday language (avoid jargon unless necessary)
- Be concise but thorough
- Show empathy and understanding
- Use a warm, conversational tone

YOUR CAPABILITIES:
You can help employees with:

1. **Platform Navigation & Features**
   - How to use HRStudio360 modules and features
   - Enterprise Chat, Time Tracking, Payroll, Benefits, etc.
   - Navigation tips and shortcuts
   
2. **HR Policies & Procedures**
   - Time tracking and timesheet management
   - Leave requests (PTO, sick days, vacation)
   - Payroll questions and paystub information
   - Benefits enrollment and management
   - Performance review process
   - Training and development opportunities
   
3. **Common Workflows**
   - How to submit manual time entries
   - How to request time off
   - How to view pay stubs and tax documents
   - How to update personal information
   - How to contact HR or managers

4. **General Work Questions**
   - Company policies and procedures
   - Department information
   - Troubleshooting common issues
   - Best practices

IMPORTANT GUIDELINES:
- If you don't know something specific to the company, acknowledge it and suggest contacting HR directly
- For sensitive topics (disciplinary actions, terminations, legal matters), recommend speaking with HR
- Always maintain employee privacy and confidentiality
- Provide step-by-step instructions when explaining processes
- Use examples to clarify complex concepts
- If asked about personal employee data you don't have access to, explain that you can only provide general guidance

RESPONSE STYLE:
- Start with a friendly acknowledgment
- Provide clear, actionable information
- Use numbered lists for multi-step processes
- End with an offer to help further if needed
- Keep responses under 200 words when possible (expand for complex topics)

Remember: You're here to make employees' work lives easier and help them navigate the HRStudio360 platform effectively!`;

interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatWithStudioAI(
  userMessage: string,
  conversationHistory: ConversationMessage[] = []
): Promise<string> {
  try {
    const messages: ConversationMessage[] = [
      { role: 'system', content: STUDIO_AI_SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = response.choices[0].message.content || 
      "I apologize, but I'm having trouble processing that right now. Could you try rephrasing your question?";

    return aiResponse;
  } catch (error) {
    console.error('[Studio AI] Error generating response:', error);
    return "I'm experiencing technical difficulties at the moment. Please try again in a few moments, or contact your HR department for immediate assistance.";
  }
}

export function getAIResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();

  if (message.includes('manual') && (message.includes('time') || message.includes('entry') || message.includes('add'))) {
    return "To add a manual time entry: 1) Go to the 'My Timesheet' tab in Time Tracking, 2) Click on the day you need to add hours for, 3) Enter your clock in/out times and any break periods, 4) Add notes explaining why it's a manual entry (e.g., 'Forgot to clock in'), 5) Submit for manager approval. Manual entries require manager review before they count toward payroll. Need help with a specific date?";
  }

  if (message.includes('enterprise chat') || message.includes('how do i use')) {
    return "Enterprise Chat allows you to communicate with colleagues and the AI Assistant! To start: Click on AI Assistant (that's me!) for help, or use 'New Channel' to create team channels. You can send direct messages, share files, and get real-time responses. Try asking me about HR policies, time tracking, or benefits!";
  }

  if (message.includes('direct message') || (message.includes('dm') && message.includes('how'))) {
    return "To start a direct message: 1) Click 'New Channel' button, 2) Select 'Direct Message' as the channel type, 3) Choose the colleague you want to message, 4) Start chatting! Direct messages are private and only visible to you and the recipient.";
  }

  if (message.includes('forgot') && (message.includes('clock') || message.includes('punch'))) {
    return "No worries, it happens! If you forgot to clock in or out: 1) Contact your manager as soon as possible, 2) They can add a manual time entry on your behalf, or 3) You can submit a manual entry through the 'My Timesheet' tab with an explanation. For yesterday's missed clock-out, check your timesheet - the system may have auto-clocked you out at your scheduled shift end. Always submit corrections within 24 hours when possible.";
  }

  if (message.includes('hr') || message.includes('policy') || message.includes('help')) {
    return "I'm here to help with HR questions! I can assist with: Time Tracking & Timesheets, Leave Requests (PTO, sick days), Payroll Questions, Benefits & Insurance, Performance Reviews, Training & Development, Company Policies, and more. What would you like to know about?";
  }

  if (message.includes('hello') || message.includes('hi ') || message.startsWith('hi') || message.includes('hey')) {
    return "Hello! I'm Studio, your HR AI Assistant. I'm here to help you with HR questions, time tracking, benefits, and company policies. What can I help you with today?";
  }

  if (message.includes('thank') || message.includes('thanks')) {
    return "You're welcome! Feel free to ask if you have any other questions. I'm here to help!";
  }

  return "I'm here to help with HR-related questions! You can ask me about time tracking, leave requests, payroll, benefits, performance reviews, company policies, and more. What would you like to know?";
}
