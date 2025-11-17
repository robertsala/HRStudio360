import OpenAI from 'openai';
import { storage } from './storage.js';

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

5. **Personalized Employee Information** (when employee context is available)
   - Answer specific questions about the user's PTO balance, manager, department, job title
   - Provide timesheet summaries and hours worked
   - Show benefits enrollment status
   - Give personalized answers based on the employee's actual data

IMPORTANT GUIDELINES:
- **WHEN EMPLOYEE CONTEXT IS PROVIDED:** Use the specific data to give personalized, accurate answers. For example, if asked "What's my PTO balance?", respond with their actual numbers from the employee context.
- **WHEN EMPLOYEE CONTEXT IS NOT AVAILABLE:** Politely explain that you don't have access to their personal data and suggest they check the relevant section of HRStudio360 or contact HR.
- If you don't know something specific to the company, acknowledge it and suggest contacting HR directly
- For sensitive topics (disciplinary actions, terminations, legal matters), recommend speaking with HR
- Always maintain employee privacy and confidentiality
- Provide step-by-step instructions when explaining processes
- Use examples to clarify complex concepts

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

interface EmployeeContext {
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    department: string | null;
    jobTitle: string | null;
    manager?: {
      name: string;
      email: string;
    } | null;
  };
  leaveBalance?: {
    vacationDays: number;
    sickDays: number;
    personalDays: number;
    year: number;
  };
  timesheetSummary?: {
    currentWeekHours: number;
    lastApprovalDate: string | null;
  };
  benefits?: string[];
}

async function getEmployeeContext(userId: string): Promise<EmployeeContext> {
  try {
    const profile = await storage.getProfileById(userId);
    if (!profile) {
      return {};
    }

    const allEmployees = await storage.getEmployees();
    const employee = allEmployees.find(emp => emp.userId === userId);
    
    if (!employee) {
      return {};
    }

    const context: EmployeeContext = {
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email,
        department: profile.department,
        jobTitle: profile.role,
      }
    };

    if (employee.managerId) {
      const allEmployeesWithManager = await storage.getEmployees();
      const managerEmployee = allEmployeesWithManager.find(emp => emp.id === employee.managerId);
      if (managerEmployee && managerEmployee.userId) {
        const managerProfile = await storage.getProfileById(managerEmployee.userId);
        if (managerProfile) {
          context.employee!.manager = {
            name: `${managerProfile.firstName || ''} ${managerProfile.lastName || ''}`.trim(),
            email: managerProfile.email
          };
        }
      }
    }

    const leaveBalance = await storage.getLeaveBalanceByEmployeeId(employee.id);
    if (leaveBalance) {
      context.leaveBalance = {
        vacationDays: parseFloat(leaveBalance.vacationDays as string),
        sickDays: parseFloat(leaveBalance.sickDays as string),
        personalDays: parseFloat(leaveBalance.personalDays as string),
        year: leaveBalance.year
      };
    }

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    try {
      const timesheetEntries = await storage.getTimesheetEntries(
        formatDate(startOfWeek),
        formatDate(endOfWeek)
      );
      
      const employeeTimesheets = timesheetEntries.filter(
        entry => entry.employeeId === employee.id
      );

      if (employeeTimesheets.length > 0) {
        const currentWeekHours = employeeTimesheets.reduce((total, entry) => {
          const regular = parseFloat(entry.regularHours as string) || 0;
          const overtime = parseFloat(entry.overtimeHours as string) || 0;
          return total + regular + overtime;
        }, 0);

        const approvedTimesheets = employeeTimesheets.filter(
          entry => entry.status === 'Approved'
        );
        const lastApproved = approvedTimesheets.length > 0 
          ? approvedTimesheets[approvedTimesheets.length - 1]
          : null;

        context.timesheetSummary = {
          currentWeekHours: Math.round(currentWeekHours * 10) / 10,
          lastApprovalDate: lastApproved?.updatedAt 
            ? new Date(lastApproved.updatedAt).toLocaleDateString()
            : null
        };
      }
    } catch (error) {
      console.log('[Employee Context] Could not fetch timesheet data:', error);
    }

    const benefits: string[] = [];
    const expenseCategories = await storage.getExpenseCategories();
    if (expenseCategories.length > 0) {
      benefits.push('Expense Reimbursement Program');
    }

    if (benefits.length > 0) {
      context.benefits = benefits;
    }

    return context;
  } catch (error) {
    console.error('[Employee Context] Error fetching employee context:', error);
    return {};
  }
}

export async function chatWithStudioAI(
  userMessage: string,
  userId?: string,
  conversationHistory: ConversationMessage[] = []
): Promise<string> {
  try {
    let systemPrompt = STUDIO_AI_SYSTEM_PROMPT;

    if (userId) {
      const employeeContext = await getEmployeeContext(userId);
      
      if (employeeContext.employee) {
        systemPrompt += `\n\n--- EMPLOYEE CONTEXT ---
You are currently chatting with: ${employeeContext.employee.firstName} ${employeeContext.employee.lastName}

Employee Details:
- Employee ID: ${employeeContext.employee.employeeId}
- Email: ${employeeContext.employee.email}
- Department: ${employeeContext.employee.department || 'Not specified'}
- Job Title: ${employeeContext.employee.jobTitle || 'Not specified'}`;

        if (employeeContext.employee.manager) {
          systemPrompt += `
- Manager: ${employeeContext.employee.manager.name} (${employeeContext.employee.manager.email})`;
        } else {
          systemPrompt += `
- Manager: No manager assigned`;
        }

        if (employeeContext.leaveBalance) {
          systemPrompt += `

Leave Balance (${employeeContext.leaveBalance.year}):
- Vacation Days: ${employeeContext.leaveBalance.vacationDays}
- Sick Days: ${employeeContext.leaveBalance.sickDays}
- Personal Days: ${employeeContext.leaveBalance.personalDays}`;
        }

        if (employeeContext.timesheetSummary) {
          systemPrompt += `

Timesheet Summary:
- Current Week Hours: ${employeeContext.timesheetSummary.currentWeekHours} hours`;
          if (employeeContext.timesheetSummary.lastApprovalDate) {
            systemPrompt += `
- Last Timesheet Approval: ${employeeContext.timesheetSummary.lastApprovalDate}`;
          }
        }

        if (employeeContext.benefits && employeeContext.benefits.length > 0) {
          systemPrompt += `

Benefits Enrolled:
${employeeContext.benefits.map(b => `- ${b}`).join('\n')}`;
        }

        systemPrompt += `\n\nUse this information to provide personalized, specific answers to the employee's questions. Always reference their actual data when answering questions about PTO, manager, timesheet, or benefits.`;
      }
    }

    const messages: ConversationMessage[] = [
      { role: 'system', content: systemPrompt },
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
