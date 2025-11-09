import type { Express } from 'express';
import { storage } from './storage.js';
import { 
  insertProfileSchema, insertEmployeeSchema, insertLeaveRequestSchema, insertLeaveBalanceSchema,
  insertCandidateSchema, insertExpenseCategorySchema, insertExpenseSchema, 
  insertChatChannelSchema, insertChannelMemberSchema, insertChatMessageSchema,
  insertMessageReactionSchema, insertTypingIndicatorSchema, insertUserPresenceSchema,
  insertChangeLogSchema, insertHistoricalChangeSchema, insertChangeNotificationSchema,
  insertEarnedBadgeSchema, insertCelebrationHistorySchema, insertCelebrationNotificationSchema
} from '../shared/schema.js';

export function registerRoutes(app: Express) {
  // Profile routes
  app.get('/api/profiles', async (req, res) => {
    try {
      const profiles = await storage.getProfiles();
      res.json(profiles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/profiles/:id', async (req, res) => {
    try {
      const profile = await storage.getProfileById(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/profiles', async (req, res) => {
    try {
      const validated = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(validated);
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/profiles/:id', async (req, res) => {
    try {
      const profile = await storage.updateProfile(req.params.id, req.body);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Employee routes
  // Note: Specific routes must come before parametric routes
  app.get('/api/employees/directory', async (req, res) => {
    try {
      const employees = await storage.getEmployeesWithProfiles();
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/employees', async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/employees/:id', async (req, res) => {
    try {
      const employee = await storage.getEmployeeById(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/employees', async (req, res) => {
    try {
      const validated = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validated);
      res.status(201).json(employee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Leave request routes
  app.get('/api/leave-requests', async (req, res) => {
    try {
      const requests = await storage.getLeaveRequests();
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/leave-requests', async (req, res) => {
    try {
      const validated = insertLeaveRequestSchema.parse(req.body);
      const request = await storage.createLeaveRequest(validated);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/leave-requests/:id', async (req, res) => {
    try {
      const request = await storage.updateLeaveRequest(req.params.id, req.body);
      if (!request) {
        return res.status(404).json({ error: 'Leave request not found' });
      }
      res.json(request);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Leave balance routes
  app.get('/api/leave-balances', async (req, res) => {
    try {
      const balances = await storage.getLeaveBalances();
      res.json(balances);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/leave-balances/employee/:employeeId', async (req, res) => {
    try {
      const balance = await storage.getLeaveBalanceByEmployeeId(req.params.employeeId);
      if (!balance) {
        return res.status(404).json({ error: 'Leave balance not found' });
      }
      res.json(balance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/leave-balances', async (req, res) => {
    try {
      const validated = insertLeaveBalanceSchema.parse(req.body);
      const balance = await storage.createLeaveBalance(validated);
      res.status(201).json(balance);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/leave-balances/:id', async (req, res) => {
    try {
      const balance = await storage.updateLeaveBalance(req.params.id, req.body);
      if (!balance) {
        return res.status(404).json({ error: 'Leave balance not found' });
      }
      res.json(balance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Candidate routes
  app.get('/api/candidates', async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      res.json(candidates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/candidates/:id', async (req, res) => {
    try {
      const candidate = await storage.getCandidateById(req.params.id);
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }
      res.json(candidate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/candidates', async (req, res) => {
    try {
      const validated = insertCandidateSchema.parse(req.body);
      const candidate = await storage.createCandidate(validated);
      res.status(201).json(candidate);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/candidates/:id', async (req, res) => {
    try {
      const candidate = await storage.updateCandidate(req.params.id, req.body);
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }
      res.json(candidate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Expense Category routes
  app.get('/api/expense-categories', async (req, res) => {
    try {
      const categories = await storage.getExpenseCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/expense-categories/:id', async (req, res) => {
    try {
      const category = await storage.getExpenseCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: 'Expense category not found' });
      }
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Expense routes
  app.get('/api/expenses', async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/expenses', async (req, res) => {
    try {
      const validated = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validated);
      res.status(201).json(expense);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // === CHAT ROUTES ===
  
  // Chat Channel routes
  app.get('/api/chat/channels', async (req, res) => {
    try {
      const channels = await storage.getChatChannels();
      res.json(channels);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/chat/channels/:id', async (req, res) => {
    try {
      const channel = await storage.getChatChannelById(req.params.id);
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      res.json(channel);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/chat/channels', async (req, res) => {
    try {
      const validated = insertChatChannelSchema.parse(req.body);
      const channel = await storage.createChatChannel(validated);
      res.status(201).json(channel);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/chat/channels/:id', async (req, res) => {
    try {
      const channel = await storage.updateChatChannel(req.params.id, req.body);
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      res.json(channel);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Channel Member routes
  app.get('/api/chat/channels/:channelId/members', async (req, res) => {
    try {
      const members = await storage.getChannelMembers(req.params.channelId);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/chat/channels/:channelId/members', async (req, res) => {
    try {
      const memberData = {
        ...req.body,
        channelId: req.params.channelId
      };
      const validated = insertChannelMemberSchema.parse(memberData);
      const member = await storage.addChannelMember(validated);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/chat/channels/:channelId/members/:userId', async (req, res) => {
    try {
      await storage.removeChannelMember(req.params.channelId, req.params.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/chat/channels/:channelId/mark-read', async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      await storage.updateChannelMemberLastRead(req.params.channelId, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Chat Message routes
  app.get('/api/chat/channels/:channelId/messages', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const messages = await storage.getChatMessages(req.params.channelId, limit);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/chat/messages/:id', async (req, res) => {
    try {
      const message = await storage.getChatMessageById(req.params.id);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/chat/channels/:channelId/messages', async (req, res) => {
    try {
      const messageData = {
        ...req.body,
        channelId: req.params.channelId
      };
      const validated = insertChatMessageSchema.parse(messageData);
      const message = await storage.createChatMessage(validated);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/chat/messages/:id', async (req, res) => {
    try {
      const message = await storage.updateChatMessage(req.params.id, req.body);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/chat/messages/:id', async (req, res) => {
    try {
      await storage.deleteChatMessage(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Message Reaction routes
  app.get('/api/chat/messages/:messageId/reactions', async (req, res) => {
    try {
      const reactions = await storage.getMessageReactions(req.params.messageId);
      res.json(reactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/chat/messages/:messageId/reactions', async (req, res) => {
    try {
      const reactionData = {
        messageId: req.params.messageId,
        ...req.body
      };
      const validated = insertMessageReactionSchema.parse(reactionData);
      const reaction = await storage.addMessageReaction(validated);
      res.status(201).json(reaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/chat/messages/:messageId/reactions', async (req, res) => {
    try {
      const { emoji, userId } = req.body;
      if (!emoji || !userId) {
        return res.status(400).json({ error: 'emoji and userId are required' });
      }
      await storage.removeMessageReaction(req.params.messageId, userId, emoji);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Typing Indicator routes
  app.post('/api/chat/channels/:channelId/typing', async (req, res) => {
    try {
      const { userId, isTyping } = req.body;
      if (!userId || isTyping === undefined) {
        return res.status(400).json({ error: 'userId and isTyping are required' });
      }
      
      if (isTyping) {
        const indicatorData = {
          channelId: req.params.channelId,
          userId,
          startedTypingAt: new Date()
        };
        const validated = insertTypingIndicatorSchema.parse(indicatorData);
        const indicator = await storage.setTypingIndicator(validated);
        res.json(indicator);
      } else {
        await storage.removeTypingIndicator(req.params.channelId, userId);
        res.json({ success: true });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/chat/channels/:channelId/typing', async (req, res) => {
    try {
      const indicators = await storage.getTypingIndicators(req.params.channelId);
      res.json(indicators);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Presence routes
  app.post('/api/chat/presence/:userId', async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'status is required' });
      }
      const presenceData = {
        userId: req.params.userId,
        status,
        lastSeenAt: new Date()
      };
      const validated = insertUserPresenceSchema.parse(presenceData);
      const presence = await storage.upsertUserPresence(validated);
      res.json(presence);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/chat/presence/:userId', async (req, res) => {
    try {
      const presence = await storage.getUserPresence(req.params.userId);
      res.json(presence || { userId: req.params.userId, status: 'offline' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // === CHANGELOG ROUTES ===

  // Change Log routes
  app.get('/api/changelog', async (req, res) => {
    try {
      const filters = {
        changeType: req.query.changeType as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined
      };
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const logs = await storage.getChangeLogs(filters, limit);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/changelog/:id', async (req, res) => {
    try {
      const log = await storage.getChangeLogById(req.params.id);
      if (!log) {
        return res.status(404).json({ error: 'Change log not found' });
      }
      res.json(log);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/changelog', async (req, res) => {
    try {
      const validated = insertChangeLogSchema.parse(req.body);
      const log = await storage.createChangeLog(validated);
      res.status(201).json(log);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/changelog/:id', async (req, res) => {
    try {
      const log = await storage.updateChangeLog(req.params.id, req.body);
      if (!log) {
        return res.status(404).json({ error: 'Change log not found' });
      }
      res.json(log);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Historical Changes routes
  app.get('/api/changelog/historical', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const changes = await storage.getHistoricalChanges(limit);
      res.json(changes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/changelog/historical', async (req, res) => {
    try {
      const validated = insertHistoricalChangeSchema.parse(req.body);
      const change = await storage.createHistoricalChange(validated);
      res.status(201).json(change);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Change Notification routes
  app.get('/api/changelog/notifications/:userId', async (req, res) => {
    try {
      const notifications = await storage.getChangeNotifications(req.params.userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/changelog/notifications', async (req, res) => {
    try {
      const validated = insertChangeNotificationSchema.parse(req.body);
      const notification = await storage.createChangeNotification(validated);
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/changelog/notifications/mark-read', async (req, res) => {
    try {
      const { changeLogId, userId } = req.body;
      if (!changeLogId || !userId) {
        return res.status(400).json({ error: 'changeLogId and userId are required' });
      }
      await storage.markChangeNotificationRead(changeLogId, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/expenses/:id', async (req, res) => {
    try {
      const expense = await storage.getExpenseById(req.params.id);
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      res.json(expense);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/expenses/:id', async (req, res) => {
    try {
      const expense = await storage.updateExpense(req.params.id, req.body);
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      res.json(expense);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stub authentication endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Check if profile exists
      let profile = await storage.getProfileByEmail(email);
      
      // Create demo profile if doesn't exist
      if (!profile) {
        profile = await storage.createProfile({
          email,
          firstName: 'Demo',
          lastName: 'User',
          role: 'admin',
          department: 'IT'
        });
      }
      
      res.json({ user: profile });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true });
  });

  app.get('/api/auth/session', (req, res) => {
    // For now, return a mock session
    res.json({ user: null });
  });

  // Onboarding email endpoint (migrated from Supabase Edge Function)
  app.post('/api/onboarding/send-email', async (req, res) => {
    try {
      const { to, firstName, lastName, position, department, startDate, managerName } = req.body;
      
      if (!to || !firstName || !lastName || !position || !startDate) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // In production, integrate with an email service like Resend
      // For now, log the email details
      console.log('Onboarding email would be sent to:', to);
      console.log(`Subject: Welcome to the Team, ${firstName}!`);
      
      res.json({
        success: true,
        message: `Email prepared for ${to} (Email service not configured)`,
        preview: {
          to,
          subject: `Welcome to the Team, ${firstName}! 🎉`,
          position,
          department,
          startDate: formattedStartDate,
          managerName
        }
      });
    } catch (error: any) {
      console.error('Error in send-onboarding-email:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  // AI Assistant chat endpoint (simplified version)
  app.post('/api/ai-assistant/chat', async (req, res) => {
    try {
      const { message, userId } = req.body;

      if (!message || !userId) {
        return res.status(400).json({ error: 'Message and userId are required' });
      }

      // Get user profile
      const profile = await storage.getProfileById(userId);
      const firstName = profile?.firstName || 'there';

      // Simple AI response logic
      const messageLower = message.toLowerCase();
      let response = '';

      if (messageLower.includes('benefit')) {
        response = `Hi ${firstName}! I'd be happy to help with benefits information. 🏥\n\nWe offer comprehensive benefits including health, dental, and vision insurance, 401(k) with company match, paid time off, and more. Check the Benefits & Pay section for details!`;
      } else if (messageLower.includes('pto') || messageLower.includes('time off') || messageLower.includes('vacation')) {
        response = `Hi ${firstName}! For PTO inquiries, go to Leave Management to view your balance and request time off. Your manager typically responds within 24-48 hours.`;
      } else if (messageLower.includes('pay') || messageLower.includes('payroll')) {
        response = `Hi ${firstName}! For payroll questions, paychecks are issued bi-weekly on Fridays. Go to Payroll in your dashboard to view pay stubs, update direct deposit, and more.`;
      } else {
        response = `Hi ${firstName}! 👋 I'm Studio, your HRStudio360 AI Assistant. I can help with HR questions, benefits, PTO, payroll, and more. What can I help you with?`;
      }

      res.json({
        success: true,
        response,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error in AI assistant:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Celebration Badge routes
  app.get('/api/celebration-badges', async (req, res) => {
    try {
      const badges = await storage.getCelebrationBadges();
      res.json(badges);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/celebration-badges/years/:years', async (req, res) => {
    try {
      const badge = await storage.getCelebrationBadgeByYears(parseInt(req.params.years));
      if (!badge) {
        return res.status(404).json({ error: 'Badge not found' });
      }
      res.json(badge);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Earned Badge routes
  app.get('/api/earned-badges/:userId', async (req, res) => {
    try {
      const badges = await storage.getEarnedBadges(req.params.userId);
      res.json(badges);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/earned-badges', async (req, res) => {
    try {
      const validated = insertEarnedBadgeSchema.parse(req.body);
      const badge = await storage.createEarnedBadge(validated);
      res.status(201).json(badge);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/earned-badges/mark-viewed', async (req, res) => {
    try {
      const { userId, badgeId } = req.body;
      if (!userId || !badgeId) {
        return res.status(400).json({ error: 'userId and badgeId are required' });
      }
      await storage.markBadgeViewed(userId, badgeId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Celebration History routes
  app.post('/api/celebration-history', async (req, res) => {
    try {
      const validated = insertCelebrationHistorySchema.parse(req.body);
      const history = await storage.saveCelebrationHistory(validated);
      res.status(201).json(history);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/celebration-history/dismiss', async (req, res) => {
    try {
      const { userId, type, date } = req.body;
      if (!userId || !type || !date) {
        return res.status(400).json({ error: 'userId, type, and date are required' });
      }
      await storage.markCelebrationDismissed(userId, type, date);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Celebration Notification routes
  app.get('/api/celebration-notifications/:userId', async (req, res) => {
    try {
      const notifications = await storage.getCelebrationNotifications(req.params.userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/celebration-notifications', async (req, res) => {
    try {
      const validated = insertCelebrationNotificationSchema.parse(req.body);
      const notification = await storage.createCelebrationNotification(validated);
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
}
