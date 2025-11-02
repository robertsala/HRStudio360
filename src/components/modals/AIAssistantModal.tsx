import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Clock, Calendar, DollarSign, Heart, FileText, Users, HelpCircle, Sparkles, MessageCircle, Zap } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  type?: 'text' | 'quick_action' | 'suggestion';
}

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hi there! 👋 I'm Studio, your HRStudio360 AI Assistant. I'm here to help you with HR questions, company policies, benefits information, and more. What can I help you with today?",
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickActions = [
    { icon: MessageCircle, text: "How do I use Enterprise Chat?", category: "chat" },
    { icon: MessageCircle, text: "How do I start a direct message?", category: "chat" },
    { icon: Clock, text: "How do I add a manual time entry?", category: "time-tracking" },
    { icon: Clock, text: "What if I forgot to clock out?", category: "time-tracking" },
    { icon: DollarSign, text: "When is the next payday?", category: "payroll" },
    { icon: Heart, text: "How do I enroll in benefits?", category: "benefits" },
    { icon: Calendar, text: "What are upcoming celebrations?", category: "celebrations" },
    { icon: FileText, text: "How do I submit expenses?", category: "expenses" }
  ];

  const getAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    // Time Tracking - Manual Entry
    if (message.includes('manual') && (message.includes('time') || message.includes('entry') || message.includes('add'))) {
      return "To add a manual time entry: 1) Go to the 'My Timesheet' tab in Time Tracking, 2) Click on the day you need to add hours for, 3) Enter your clock in/out times and any break periods, 4) Add notes explaining why it's a manual entry (e.g., 'Forgot to clock in'), 5) Submit for manager approval. Manual entries require manager review before they count toward payroll. Need help with a specific date?";
    }

    // Forgot to Clock In/Out
    if (message.includes('forgot') && (message.includes('clock') || message.includes('punch'))) {
      return "No worries, it happens! If you forgot to clock in or out: 1) Contact your manager as soon as possible, 2) They can add a manual time entry on your behalf, or 3) You can submit a manual entry through the 'My Timesheet' tab with an explanation. For yesterday's missed clock-out, check your timesheet - the system may have auto-clocked you out at your scheduled shift end. Always submit corrections within 24 hours when possible.";
    }

    // Overtime Calculations
    if (message.includes('overtime') && (message.includes('calculate') || message.includes('work') || message.includes('how'))) {
      return "Overtime is calculated as follows: Regular hours are the first 40 hours worked in a week (Monday-Sunday). Any hours beyond 40 are overtime, paid at 1.5x your regular rate. The system automatically tracks this in your timesheet. For example, if you work 45 hours in a week, you'll have 40 regular hours and 5 overtime hours. Note: Some states have daily overtime rules too. Check your current week's totals in the 'My Timesheet' tab!";
    }

    // Break Time Rules
    if (message.includes('break') && (message.includes('rule') || message.includes('policy') || message.includes('time') || message.includes('long') || message.includes('many'))) {
      return "Company break policy: For shifts under 6 hours, you get one 15-minute paid break. For 6-8 hour shifts, you get one 30-minute unpaid meal break plus two 15-minute paid breaks. For shifts over 8 hours, you get one 60-minute unpaid meal break plus two 15-minute paid breaks. Break times are automatically deducted from your total hours. Remember to clock your breaks in the Time Clock tab!";
    }

    // Timesheet Submission and Approval
    if (message.includes('timesheet') && (message.includes('submit') || message.includes('approval') || message.includes('due') || message.includes('when'))) {
      return "Timesheets are due every Friday by 5 PM for the current week (Monday-Sunday). To submit: 1) Review your hours in the 'My Timesheet' tab, 2) Verify all entries are accurate, 3) Click 'Submit for Approval' at the bottom, 4) Your manager (Sarah Johnson) will review and approve by Monday. Once approved, it goes to payroll for the next pay cycle. You'll get a notification when it's approved or if corrections are needed.";
    }

    // Clock In Issues
    if (message.includes('clock in') || message.includes('clock out') || message.includes('clocking')) {
      return "Having trouble clocking in/out? Make sure: 1) You're on the 'Time Clock' tab, 2) Click the blue 'Clock In' button at the start of your shift, 3) Use 'Start Break' and 'End Break' for meal periods, 4) Click 'Clock Out' when your shift ends. The system tracks your location for remote workers. If the button is grayed out, you may already be clocked in. Check 'Today's Timeline' below the clock buttons to see your current status.";
    }

    // Timesheet Corrections
    if (message.includes('correct') || message.includes('fix') || message.includes('error') || message.includes('mistake') || (message.includes('timesheet') && message.includes('wrong'))) {
      return "To correct a timesheet error: 1) If not yet submitted: Go to 'My Timesheet' tab, click the day with the error, and edit the times directly. 2) If already submitted but not approved: Contact your manager to reject it, then resubmit with corrections. 3) If already approved: You'll need to submit a manual adjustment entry with an explanation. Add detailed notes about what needs correcting so your manager can process it quickly.";
    }

    // Time Tracking Reports
    if (message.includes('report') && message.includes('time')) {
      return "You can view your time tracking reports in the 'Analytics' tab! This shows: Average daily hours, weekly trends, attendance rate, overtime patterns, and productivity scores. For detailed reports: Go to Reports > Time & Attendance to export your hours by date range, view year-to-date totals, and analyze your work patterns. Managers can pull team reports for payroll processing.";
    }

    // Celebrations, Anniversaries, Birthdays, Badges
    if (message.includes('celebration') || message.includes('anniversary') || message.includes('birthday') || message.includes('badge') || message.includes('milestone') || message.includes('service award')) {
      return "We have an exciting celebrations system! You can view upcoming birthdays and work anniversaries on your dashboard. Employees earn service badges based on tenure: New Hire (< 1 year), Bronze (1-5 years), Silver (6-10 years), Gold (11-15 years), Platinum (16-20 years), Ruby (21-25 years), and Emerald (26+ years). Special milestone celebrations happen at 5-year increments! Check the Celebrations widget to see who's celebrating soon.";
    }

    // Expense Management - Enhanced
    if (message.includes('expense') || message.includes('receipt') || message.includes('reimbursement') || message.includes('mileage') || message.includes('travel expense')) {
      return "Our Expense Management system is comprehensive! You can submit expenses with receipts (required for amounts over $25), track approval status, and view reimbursement history. Categories include Travel, Meals, Lodging, Transportation, Office Supplies, and more. Managers can approve/reject expenses with comments. Typical reimbursement takes 5-7 business days after approval. Need help submitting an expense or checking status?";
    }

    // Performance Reviews - Enhanced
    if (message.includes('review') || message.includes('performance') || message.includes('feedback') || message.includes('360') || message.includes('goal') || message.includes('competenc')) {
      return "Our Performance Review system supports 360-degree feedback! You can participate in self-reviews, manager reviews, peer reviews, and subordinate reviews. Reviews include competency assessments (Communication, Leadership, Teamwork, Problem Solving, Technical Skills), goal tracking, and development plans. Your next review is scheduled for March 2025. Your last score was 4.5/5 - excellent work! View your review history, set goals, and track progress in the Performance section.";
    }

    // Workers' Compensation, OSHA, Incidents
    if (message.includes('injury') || message.includes('accident') || message.includes('incident') || message.includes('workers comp') || message.includes('osha') || message.includes('safety') || message.includes('claim')) {
      return "For workplace injuries or incidents, report them immediately using our Workers' Compensation system. You can file incident reports, track claims status, view OSHA logs, and access safety documentation. All workplace injuries must be reported within 24 hours. For emergencies, call 911 first, then notify your supervisor and HR. The system tracks incident types (injury, near miss, property damage, safety violation) and body parts affected. Need help filing a report?";
    }

    // Announcements
    if (message.includes('announcement') || message.includes('news') || message.includes('company update') || message.includes('communication')) {
      return "Check the Announcements section for important company updates! Announcements can be company-wide or department-specific, with priority levels (normal, important, urgent). You'll receive notifications for urgent announcements. Recent topics include policy updates, events, system changes, and celebrations. HR and managers can create announcements for their teams. Want to know about the latest announcements?";
    }

    // Onboarding
    if (message.includes('onboard') || message.includes('new hire') || message.includes('orientation') || message.includes('first day') || message.includes('starting')) {
      return "Welcome to our comprehensive Onboarding system! New hires receive a personalized onboarding portal with tasks, checklists, and important documents. The process includes orientation sessions, paperwork completion (I-9, W-4, direct deposit), equipment setup, system access, and team introductions. HR and managers can track onboarding progress. Typical onboarding takes 2-4 weeks. Starting soon or helping a new hire? I can guide you through the process!";
    }

    // Hiring, Recruitment, Candidates
    if (message.includes('hiring') || message.includes('recruitment') || message.includes('candidate') || message.includes('job opening') || message.includes('applicant') || message.includes('interview') || message.includes('offer letter')) {
      return "Our Recruitment system manages the entire hiring pipeline! Track candidates from application through offer acceptance. Stages include: Applied, Phone Screen, First Interview, Second Interview, Final Interview, Offer Extended, Offer Accepted, and Disqualified. HR and hiring managers can review applications, schedule interviews, add notes, and generate offer letters. We also track candidate sources (job boards, referrals, LinkedIn) and time-to-hire metrics. Need help with a specific candidate or position?";
    }

    // Offboarding, Termination, Exit
    if (message.includes('offboard') || message.includes('termination') || message.includes('exit') || message.includes('resign') || message.includes('quit') || message.includes('last day') || message.includes('leaving')) {
      return "Our Offboarding system ensures smooth transitions. The process includes exit interviews, equipment return checklists, system access revocation, final paycheck processing, COBRA notifications, and knowledge transfer. Managers submit termination requests (voluntary resignation, involuntary termination, retirement, end of contract) with effective dates and reasons. HR coordinates all offboarding tasks and conducts exit interviews to gather feedback. Typical offboarding takes 2 weeks. Need assistance with an offboarding process?";
    }

    // Schedule Management, Shifts
    if (message.includes('schedule') || message.includes('shift') || message.includes('availability') || message.includes('roster') || message.includes('coverage')) {
      return "Our Schedule Management system handles shift planning and employee availability! Managers can create schedules, assign shifts, view coverage gaps, and handle shift swaps. Employees can submit availability preferences, request shift changes, and view their upcoming schedule. The system tracks shift types (morning, afternoon, evening, night, split), calculates labor costs, and ensures adequate coverage. You can also set up recurring schedules. Need help viewing your schedule or requesting a change?";
    }

    // Time Tracking, Timesheets, Clock In/Out
    if (message.includes('timesheet') || message.includes('clock') || message.includes('time tracking') || message.includes('hours worked') || message.includes('overtime') || message.includes('punch')) {
      return "Our Time Tracking system records hours worked for accurate payroll! Hourly employees can clock in/out, submit timesheets, and track overtime. Managers review and approve timesheets before payroll processing. The system calculates regular hours, overtime (over 40 hours/week), and break times. You can view your current week hours, scheduled hours, and overtime balance. Timesheets are due every Friday by 5 PM. Currently clocked in? Need help submitting your timesheet?";
    }

    // Leave Management - Enhanced
    if (message.includes('leave') || message.includes('fmla') || message.includes('maternity') || message.includes('paternity') || message.includes('medical leave') || message.includes('sabbatical') || message.includes('unpaid leave')) {
      return "Our Leave Management system handles all leave types! We support: PTO, Sick Leave, FMLA, Parental Leave (12 weeks paid), Medical Leave, Bereavement (5 days), Jury Duty, Military Leave, and Sabbatical. Track leave balances, accruals, and request history. FMLA requires medical certification. Parental leave must be requested 30 days in advance. The system calculates accruals based on tenure and tracks intermittent FMLA usage. Need help requesting leave or checking your balance?";
    }

    // PTO and Time Off - Enhanced
    if (message.includes('pto') || message.includes('vacation') || message.includes('time off')) {
      return "Based on your current records, you have 18 days of PTO remaining this year. Your last vacation was in September, and you've used 7 days so far. PTO accrues at 1.25 days per month (15 days/year for 0-5 years, 20 days/year for 5+ years). You can carry over up to 5 days to next year. Submit requests at least 2 weeks in advance for manager approval. Check the Leave Management section for detailed balances and request time off easily!";
    }

    // Payroll and Pay
    if (message.includes('pay') || message.includes('salary') || message.includes('payroll') || message.includes('payday')) {
      return "Your next payday is February 5th, 2025. Your current bi-weekly gross pay is $5,208.33. Payroll runs bi-weekly on Fridays. You can view pay stubs, update direct deposit, adjust tax withholdings (W-4), and track YTD earnings in the Payroll section. For hourly employees, submitted timesheets must be approved by Friday for the next payroll cycle. Need help with direct deposit, tax documents, or pay stub access?";
    }

    // Benefits
    if (message.includes('benefit') || message.includes('health') || message.includes('insurance') || message.includes('401k') || message.includes('dental')) {
      return "You're currently enrolled in our Blue Cross Blue Shield PPO plan with family coverage. Your monthly contribution is $125. We offer: Medical (PPO, HMO, HDHP), Dental, Vision, Life Insurance (2x salary), Disability, FSA, HSA, and 401(k) with 4% company match. Benefits become effective on your first day. Open enrollment is in November for the following year, but you can make changes with qualifying life events (marriage, birth, adoption). Need help with a specific benefit or enrollment?";
    }

    // Company holidays
    if (message.includes('holiday') || message.includes('calendar')) {
      return "Here are the upcoming company holidays: Martin Luther King Jr. Day (Jan 20), Presidents' Day (Feb 17), Memorial Day (May 26), Independence Day (Jul 4), Labor Day (Sep 1), Thanksgiving (Nov 27-28), and Christmas (Dec 25-26). We also offer 3 floating holidays per year that you can use anytime. Check the company calendar for complete details and to see team birthdays and work anniversaries!";
    }

    // Tax documents
    if (message.includes('w-2') || message.includes('w2') || message.includes('tax') || message.includes('1099')) {
      return "Your 2024 W-2 will be available by January 31st in the Benefits & Pay section of your dashboard. You'll receive an email notification when it's ready for download. You can also access previous year tax documents (up to 7 years). For 1099 contractors, 1099-MISC forms are available by January 31st. Need help updating your W-4 tax withholdings?";
    }

    // HR contacts
    if (message.includes('hr') || message.includes('human resources') || message.includes('contact')) {
      return "Your HR Business Partner is Emma Wilson (emma.wilson@hrstudio360.com). For general HR questions, reach our HR team at hr@hrstudio360.com or call 1-800-HR-STUDIO. For specific needs: Payroll (payroll@hrstudio360.com), Benefits (benefits@hrstudio360.com), Recruitment (recruiting@hrstudio360.com), or Training (learning@hrstudio360.com). I'm here 24/7 for quick questions too!";
    }

    // Company policies
    if (message.includes('policy') || message.includes('handbook') || message.includes('dress code') || message.includes('remote work')) {
      return "You can find all company policies in the Employee Handbook section of your dashboard. Our remote work policy allows up to 3 days per week remote work with manager approval. We have policies for: Code of Conduct, Dress Code, Remote Work, Expense Reimbursement, PTO, Leave of Absence, Performance Management, Safety, Discrimination & Harassment, and more. Policies are reviewed annually. Need help finding a specific policy?";
    }

    // Training and development
    if (message.includes('training') || message.includes('course') || message.includes('development') || message.includes('certification')) {
      return "Great question! We have several training programs available. Based on your role, I recommend the 'Advanced React Development' course starting February 1st. You can browse all available training in the Learning & Development section. We offer: Technical Skills, Leadership Development, Compliance Training (required annually), Software Certifications, and Professional Development. The company reimburses up to $2,500/year for external certifications and courses. Want to explore specific training opportunities?";
    }

    // IT support
    if (message.includes('password') || message.includes('computer') || message.includes('laptop') || message.includes('it support') || message.includes('technical')) {
      return "For IT support, contact our help desk at it-support@hrstudio360.com or call ext. 4357. For password resets, use the self-service portal at https://help.hrstudio360.com. Common requests: software installation, equipment requests, VPN access, email issues, and hardware repairs. Response time: Critical (1 hour), High (4 hours), Normal (1 business day). Submit tickets through the IT portal for tracking. I can also help you with basic troubleshooting - what's the issue?";
    }

    // Enterprise Chat - How to Access
    if ((message.includes('chat') || message.includes('messaging')) && (message.includes('how') || message.includes('access') || message.includes('find') || message.includes('open') || message.includes('use'))) {
      return "To access Enterprise Chat: 1) Go to your Dashboard, 2) Look for the 'Enterprise Chat' tile in the Quick Access section - it has a gradient blue-purple background, 3) Click on it to open the chat interface. You'll automatically see your personal 'Studio AI Assistant' channel. When you open it for the first time, the system generates encryption keys for you automatically - this keeps your conversations completely secure!";
    }

    // Enterprise Chat - Creating Channels/DMs
    if (message.includes('chat') && (message.includes('create') || message.includes('start') || message.includes('new') || message.includes('direct message') || message.includes('dm') || message.includes('group'))) {
      return "To start a new chat conversation: 1) Open Enterprise Chat, 2) Click the 'New Channel' button (blue button at top of sidebar), 3) Choose your channel type: Direct Message (1-on-1), Group Chat (multiple people), or Department Channel (team-wide), 4) Search for colleagues by name, email, or department, 5) Select the people you want to chat with, 6) Click 'Create Channel'. For direct messages, just select one person. For group chats, you can add multiple team members and give your group a name!";
    }

    // Enterprise Chat - Sending Messages
    if (message.includes('chat') && (message.includes('send') || message.includes('message') || message.includes('type') || message.includes('write'))) {
      return "Sending messages in Enterprise Chat is easy! 1) Select a channel from the left sidebar, 2) Type your message in the input box at the bottom, 3) Press Enter to send (or click the Send button). Pro tips: Press Shift+Enter to add a new line without sending, and all your messages are automatically encrypted for security before being sent. Your messages appear in blue bubbles on the right side!";
    }

    // Enterprise Chat - Finding People/Colleagues
    if ((message.includes('chat') || message.includes('message')) && (message.includes('find') || message.includes('search') || message.includes('who') || message.includes('people') || message.includes('colleague') || message.includes('employee'))) {
      return "To find colleagues in Enterprise Chat: 1) Click 'New Channel' button, 2) Choose 'Direct Message' or 'Group Chat', 3) Use the search box to find people by name, email, or department, 4) You'll see a list of all employees with their avatars, departments, and email addresses. You can search for anyone in your company! If someone doesn't show up, make sure you're spelling their name correctly or try searching by their email address.";
    }

    // Enterprise Chat - Security/Encryption
    if (message.includes('chat') && (message.includes('secure') || message.includes('safe') || message.includes('private') || message.includes('encrypt') || message.includes('security') || message.includes('read'))) {
      return "Enterprise Chat uses military-grade end-to-end encryption! Here's what that means: Your messages are encrypted on YOUR device before being sent, your private encryption keys never leave your device and are stored securely in your browser, even HRStudio360 servers cannot read your messages - only you and your intended recipients can decrypt them. This is the same level of security used by banking apps and government communications. Your conversations are completely private!";
    }

    // Enterprise Chat - Notifications
    if (message.includes('chat') && (message.includes('notification') || message.includes('alert') || message.includes('bubble') || message.includes('pop up') || message.includes('notify'))) {
      return "Enterprise Chat notifications keep you updated! When someone sends you a message: A notification bubble appears in the bottom-right corner with the sender's avatar and message preview, a floating chat button shows your total unread count, channel names appear in bold when they have unread messages, and blue badges show the number of unread messages per channel. Click any notification bubble to jump directly to that conversation! You can also click the floating button to open chat and see all your unread messages.";
    }

    // Enterprise Chat - Studio AI Assistant Channel
    if (message.includes('chat') && (message.includes('studio') || message.includes('ai assistant') || message.includes('ai channel') || message.includes('bot'))) {
      return "Your Studio AI Assistant channel is your personal helper in Enterprise Chat! It's automatically created for you and appears with a purple robot icon. This channel is private - only you can see it. You can ask me anything about: HR policies, benefits, time off, payroll, how to use HRStudio360 features, company procedures, and more. I'm available 24/7 and give instant responses. Think of me as your always-available HR expert!";
    }

    // Enterprise Chat - Channel Types
    if (message.includes('chat') && (message.includes('channel') || message.includes('type') || message.includes('difference') || message.includes('direct') || message.includes('group') || message.includes('department'))) {
      return "Enterprise Chat has 4 channel types: **Direct Messages** (person avatar) - Private 1-on-1 conversations, perfect for quick questions. **Group Chats** (people icon) - Multiple team members, great for project teams. **Department Channels** (# hashtag) - Organized by department for team-wide discussions. **Studio AI Assistant** (purple robot) - Your personal AI helper for HR questions, private to you only. Each type serves different communication needs!";
    }

    // Enterprise Chat - Troubleshooting
    if (message.includes('chat') && (message.includes('not working') || message.includes('broken') || message.includes('error') || message.includes('problem') || message.includes('no channels') || message.includes('cannot see'))) {
      return "Troubleshooting Enterprise Chat: If you see 'No channels found', try refreshing the page - your Studio AI Assistant channel should always appear. If messages aren't sending, check your internet connection and try again. If you can't find a colleague, verify spelling or try searching by email. For persistent issues, clear your browser cache or contact IT support. Your encryption keys are managed automatically, but if you see decryption errors, refresh the page. Need more specific help?";
    }

    // Enterprise Chat - General Info
    if (message.includes('chat') || message.includes('messaging') || message.includes('enterprise chat')) {
      return "Enterprise Chat is your secure team messaging system! It's like having Slack or Teams built right into HRStudio360, but with military-grade encryption. You can send direct messages to colleagues, create group chats for projects, join department channels, and chat with me (Studio AI Assistant) anytime. All messages are end-to-end encrypted, meaning they're completely private and secure. Find it on your Dashboard in the Quick Access section - look for the gradient blue-purple tile!";
    }

    // Default responses for unmatched queries
    const defaultResponses = [
      "That's a great question! While I'm still learning about that topic, I'd recommend reaching out to your HR team at hr@hrstudio360.com or checking the Employee Handbook in your dashboard. Is there anything else I can help you with?",
      "I don't have specific information about that right now, but I'm constantly learning! For the most accurate answer, please contact your manager or HR representative. I can help you find their contact information if needed.",
      "Hmm, I'm not sure about that one yet. My knowledge base is growing every day! In the meantime, you might find the answer in your employee dashboard or by contacting HR at 1-800-HR-STUDIO.",
      "That's outside my current expertise, but I'm always eager to learn! For immediate assistance, please reach out to the appropriate department or check the company resources in your dashboard. What else can I help you with?"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: getAIResponse(userMessage.text),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, aiResponse]);
    setIsTyping(false);
  };

  const handleQuickAction = async (action: typeof quickActions[0]) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: action.text,
      timestamp: new Date(),
      type: 'quick_action'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: getAIResponse(action.text),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, aiResponse]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl resize-both min-w-[600px] min-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-emerald-500 to-blue-500 text-white">
          <div className="flex items-center">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800/20 rounded-full p-2 mr-3">
              <Bot className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Studio AI Assistant</h2>
              <p className="text-emerald-100">Your 24/7 HR companion</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-white dark:bg-gray-800 dark:bg-gray-800/20 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></div>
              <span className="text-emerald-100 text-sm">Online</span>
            </div>
            <button
              onClick={onClose}
              className="text-emerald-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(100vh-200px)] min-h-[400px]">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[80%] ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === 'user' 
                        ? 'bg-blue-500' 
                        : 'bg-gradient-to-br from-emerald-500 to-blue-500'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    
                    {/* Message Bubble */}
                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      <p className={`text-xs mt-2 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-[80%]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t bg-white dark:bg-gray-800 dark:bg-gray-800 p-4 flex-shrink-0">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about HR, benefits, policies..."
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      disabled={isTyping}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputText.trim() || isTyping}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-3 flex items-center">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Quick questions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action)}
                        disabled={isTyping}
                        className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon className="h-3 w-3 mr-2" />
                        {action.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* AI Assistant Info */}
              <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white">Studio</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI HR Assistant</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">
                  I'm powered by advanced AI and trained on HRStudio360's comprehensive HR system.
                  I can help with everything from time off and payroll to performance reviews, expense reports,
                  celebrations, onboarding, safety incidents, and much more!
                </p>
              </div>

              {/* Capabilities */}
              <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border">
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-3 flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-emerald-500" />
                  What I Can Help With
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">PTO, leave & time tracking</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Benefits and enrollment</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Payroll and tax documents</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Performance reviews & feedback</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Expense reports & reimbursement</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Celebrations & service badges</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Onboarding & offboarding</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Hiring & recruitment</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Schedule & shift management</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Safety & incident reporting</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Company policies & training</span>
                  </div>
                </div>
              </div>

              {/* Popular Questions */}
              <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border">
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-3 flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2 text-blue-500" />
                  Popular Questions
                </h4>
                <div className="space-y-2">
                  {[
                    "How do I add a manual time entry?",
                    "What if I forgot to clock out yesterday?",
                    "How is overtime calculated?",
                    "When is my timesheet due for approval?",
                    "What are the break time rules?",
                    "How do I correct a timesheet error?",
                    "How do I submit an expense report?"
                  ].map((question, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInputText(question);
                        inputRef.current?.focus();
                      }}
                      className="w-full text-left p-2 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 rounded transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg p-4 border border-emerald-200">
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-2 flex items-center">
                  <MessageCircle className="h-4 w-4 mr-2 text-emerald-600" />
                  Feedback
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3">
                  Help me improve! Was my response helpful?
                </p>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-emerald-100 text-emerald-700 py-2 px-3 rounded-lg hover:bg-emerald-200 transition-colors text-sm">
                    👍 Helpful
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 dark:text-gray-300 dark:text-gray-300 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                    👎 Not helpful
                  </button>
                </div>
              </div>

              {/* Contact HR */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Need More Help?</h4>
                <p className="text-sm text-blue-800 mb-3">
                  For complex issues, connect with our HR team directly.
                </p>
                <div className="space-y-2">
                  <button className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    Contact HR Team
                  </button>
                  <button className="w-full bg-white dark:bg-gray-800 dark:bg-gray-800 text-blue-600 border border-blue-300 py-2 px-3 rounded-lg hover:bg-blue-50 dark:bg-blue-900/20 transition-colors text-sm">
                    Schedule Meeting
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantModal;