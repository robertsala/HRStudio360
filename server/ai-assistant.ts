// AI Assistant Response Generator
// This provides keyword-based responses for the HR AI Assistant

export function getAIResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();

  // Time Tracking - Manual Entry
  if (message.includes('manual') && (message.includes('time') || message.includes('entry') || message.includes('add'))) {
    return "To add a manual time entry: 1) Go to the 'My Timesheet' tab in Time Tracking, 2) Click on the day you need to add hours for, 3) Enter your clock in/out times and any break periods, 4) Add notes explaining why it's a manual entry (e.g., 'Forgot to clock in'), 5) Submit for manager approval. Manual entries require manager review before they count toward payroll. Need help with a specific date?";
  }

  // Enterprise Chat
  if (message.includes('enterprise chat') || message.includes('how do i use')) {
    return "Enterprise Chat allows you to communicate with colleagues and the AI Assistant! To start: Click on AI Assistant (that's me!) for help, or use 'New Channel' to create team channels. You can send direct messages, share files, and get real-time responses. Try asking me about HR policies, time tracking, or benefits!";
  }

  // Direct Messages
  if (message.includes('direct message') || (message.includes('dm') && message.includes('how'))) {
    return "To start a direct message: 1) Click 'New Channel' button, 2) Select 'Direct Message' as the channel type, 3) Choose the colleague you want to message, 4) Start chatting! Direct messages are private and only visible to you and the recipient.";
  }

  // Forgot to Clock In/Out
  if (message.includes('forgot') && (message.includes('clock') || message.includes('punch'))) {
    return "No worries, it happens! If you forgot to clock in or out: 1) Contact your manager as soon as possible, 2) They can add a manual time entry on your behalf, or 3) You can submit a manual entry through the 'My Timesheet' tab with an explanation. For yesterday's missed clock-out, check your timesheet - the system may have auto-clocked you out at your scheduled shift end. Always submit corrections within 24 hours when possible.";
  }

  // General HR Questions
  if (message.includes('hr') || message.includes('policy') || message.includes('help')) {
    return "I'm here to help with HR questions! I can assist with: Time Tracking & Timesheets, Leave Requests (PTO, sick days), Payroll Questions, Benefits & Insurance, Performance Reviews, Training & Development, Company Policies, and more. What would you like to know about?";
  }

  // Greetings
  if (message.includes('hello') || message.includes('hi ') || message.startsWith('hi') || message.includes('hey')) {
    return "Hello! I'm Studio, your HR AI Assistant. I'm here to help you with HR questions, time tracking, benefits, and company policies. What can I help you with today?";
  }

  // Thank you
  if (message.includes('thank') || message.includes('thanks')) {
    return "You're welcome! Feel free to ask if you have any other questions. I'm here to help!";
  }

  // Default response
  return "I'm here to help with HR-related questions! You can ask me about time tracking, leave requests, payroll, benefits, performance reviews, company policies, and more. What would you like to know?";
}
