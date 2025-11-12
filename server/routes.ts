import type { Express } from 'express';
import { storage } from './storage.js';
import { 
  insertProfileSchema, insertEmployeeSchema, insertLeaveRequestSchema, insertLeaveBalanceSchema,
  insertCandidateSchema, insertExpenseCategorySchema, insertExpenseSchema, 
  insertChatChannelSchema, insertChannelMemberSchema, insertChatMessageSchema,
  insertMessageReactionSchema, insertTypingIndicatorSchema, insertUserPresenceSchema,
  insertUserNotificationSchema, insertCollaboratorInvitationSchema,
  insertChangeLogSchema, insertHistoricalChangeSchema, insertChangeNotificationSchema,
  insertEarnedBadgeSchema, insertCelebrationHistorySchema, insertCelebrationNotificationSchema,
  insertReviewCycleSchema,
  profiles,
  authCredentials,
  passwordResetTokens,
  passwordAuditLog
} from '../shared/schema.js';
import { sendCollaboratorInviteEmail, sendCollaboratorAcceptedEmail } from './emailService.js';
import { seedProductionDatabase } from './seed-production.js';
import { hashPassword, verifyPassword, validatePassword, isAccountLocked } from './lib/password.js';
import rateLimit from 'express-rate-limit';
import { db } from './db.js';
import { eq } from 'drizzle-orm';

export function registerRoutes(app: Express) {
  // Rate limiting for authentication endpoints to prevent brute-force attacks
  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: 'Too many authentication attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for demo account to ensure accessibility
    skip: (req) => req.body?.email === 'demo@hrstudio360.com'
  });

  // Helper function to check if user can manage announcements
  async function canManageAnnouncements(userId: string): Promise<boolean> {
    try {
      const profile = await storage.getProfileById(userId);
      if (!profile) return false;
      
      return profile.department === 'HR' || profile.role === 'Product Owner';
    } catch (error) {
      return false;
    }
  }

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
      // Require authentication
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check if user has permission to create profiles with elevated roles
      const hasPrivilegedRole = await canManageAnnouncements(userId);
      
      // Extract role and department from request
      const { role, department, ...basicFields } = req.body;
      const requestingElevatedRole = role === 'Product Owner' || role === 'Admin';
      const requestingHRDepartment = department === 'HR';

      // Only privileged users can create profiles with elevated roles or HR department
      if ((requestingElevatedRole || requestingHRDepartment) && !hasPrivilegedRole) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can create profiles with elevated roles' 
        });
      }

      // Build the profile data with safe defaults for non-privileged users
      const profileData = hasPrivilegedRole 
        ? req.body 
        : { ...basicFields, role: role || 'Employee', department: department || 'General' };

      const validated = insertProfileSchema.parse(profileData);
      const profile = await storage.createProfile(validated);
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/profiles/:id', async (req, res) => {
    try {
      // Require authentication
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const targetProfileId = req.params.id;
      const isOwnProfile = userId === targetProfileId;
      
      // Check if user has permission to manage profiles
      const hasPrivilegedRole = await canManageAnnouncements(userId);
      
      // Restrict who can edit which profiles
      if (!isOwnProfile && !hasPrivilegedRole) {
        return res.status(403).json({ error: 'Forbidden: You can only edit your own profile' });
      }

      // Extract sensitive fields from the update payload
      const { role, department, ...basicFields } = req.body;
      const hasSensitiveFields = role !== undefined || department !== undefined;

      // Only privileged users can change role/department
      if (hasSensitiveFields && !hasPrivilegedRole) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can change role or department' 
        });
      }

      // Build the final update payload
      const updateData = hasSensitiveFields && hasPrivilegedRole
        ? req.body  // Include all fields for privileged users
        : basicFields;  // Only basic fields for regular users

      const profile = await storage.updateProfile(targetProfileId, updateData);
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
      console.log('[PATCH channel] ID:', req.params.id, 'Body:', req.body);
      const channel = await storage.updateChatChannel(req.params.id, req.body);
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      res.json(channel);
    } catch (error: any) {
      console.error('[PATCH channel] Error:', error);
      res.status(500).json({ error: error.message || 'Failed to update channel' });
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
      
      // Broadcast new message via WebSocket to all connected clients
      const wsServer = app.get('wsServer');
      if (wsServer) {
        wsServer.broadcastToChannel(req.params.channelId, {
          type: 'new_message',
          payload: {
            id: message.id,
            channelId: message.channelId,
            senderId: message.senderId,
            content: message.encryptedContent,
            messageType: message.messageType,
            timestamp: message.createdAt,
            ...message
          }
        });
      }
      
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

  // Authentication endpoints with session management
  app.post('/api/auth/login', authRateLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Check if profile exists
      let profile = await storage.getProfileByEmail(email);
      
      // Demo account passwordless login for backward compatibility
      if (email === 'demo@hrstudio360.com' && !password) {
        if (!profile) {
          profile = await storage.createProfile({
            email,
            firstName: 'Demo',
            lastName: 'User',
            role: 'Product Manager',
            department: 'Product'
          });
        }
        
        // Safety check (should always be defined at this point)
        if (!profile) {
          return res.status(500).json({ error: 'Failed to create demo profile' });
        }
        
        // Capture profile for closure
        const demoProfile = profile;
        
        // Regenerate session for demo login
        req.session.regenerate((err) => {
          if (err) {
            console.error('Session regeneration error:', err);
            return res.status(500).json({ error: 'Login failed' });
          }
          
          (req.session as any).userId = demoProfile.id;
          
          req.session.save((err) => {
            if (err) {
              console.error('Session save error:', err);
              return res.status(500).json({ error: 'Login failed' });
            }
            res.json({ user: demoProfile });
          });
        });
        return;
      }
      
      // Password-based authentication
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }
      
      if (!profile) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Get auth credentials
      const authCredential = await storage.getAuthCredentialByProfileId(profile.id);
      if (!authCredential) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check if account is locked
      if (isAccountLocked(authCredential.lockedUntil)) {
        const lockTime = new Date(authCredential.lockedUntil!);
        const minutesRemaining = Math.ceil((lockTime.getTime() - Date.now()) / (60 * 1000));
        return res.status(403).json({ 
          error: `Account locked due to multiple failed login attempts. Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.` 
        });
      }
      
      // Verify password
      const isValidPassword = await verifyPassword(authCredential.passwordHash, password);
      
      if (!isValidPassword) {
        // Increment failed attempts
        await storage.incrementFailedLoginAttempts(profile.id);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Successful login - reset failed attempts
      await storage.resetFailedLoginAttempts(profile.id);
      
      // Regenerate session to prevent fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ error: 'Login failed' });
        }
        
        // Store user ID in new session
        (req.session as any).userId = profile.id;
        
        // Save session before responding
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: 'Login failed' });
          }
          res.json({ user: profile });
        });
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  app.post('/api/auth/signup', authRateLimiter, async (req, res) => {
    try {
      const { email, firstName, lastName, password, preferredLanguage } = req.body;
      
      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ error: 'Email, first name, last name, and password are required' });
      }
      
      // Validate password
      const passwordValidation = validatePassword(password, email);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: 'Password does not meet requirements', 
          details: passwordValidation.errors 
        });
      }
      
      // Check if profile already exists
      const existingProfile = await storage.getProfileByEmail(email);
      if (existingProfile) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Create new profile
      const profile = await storage.createProfile({
        email,
        firstName,
        lastName,
        role: 'employee',
        department: 'General',
        languagePreference: preferredLanguage || 'en'
      });
      
      // Create auth credentials
      await storage.createAuthCredential({
        profileId: profile.id,
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null
      });
      
      // Log the user in immediately by creating a session
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ error: 'Signup successful but login failed' });
        }
        
        (req.session as any).userId = profile.id;
        
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: 'Signup successful but login failed' });
          }
          res.status(201).json({ user: profile });
        });
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/auth/session', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      
      if (!userId) {
        return res.json({ user: null });
      }
      
      const profile = await storage.getProfileById(userId);
      
      if (!profile) {
        return res.json({ user: null });
      }
      
      res.json({ user: profile });
    } catch (error: any) {
      console.error('Session check error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Password reset - request reset email
  app.post('/api/auth/forgot-password', authRateLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const profile = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
      
      if (!profile || profile.length === 0) {
        return res.json({ 
          success: true, 
          message: 'If an account exists with this email, a password reset link has been sent.' 
        });
      }

      const user = profile[0];
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await db.insert(passwordResetTokens).values({
        profileId: user.id,
        token,
        expiresAt,
        used: false
      });

      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      if (RESEND_API_KEY) {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(RESEND_API_KEY);

          const domain = process.env.REPLIT_DEV_DOMAIN || 'localhost:5000';
          const protocol = process.env.REPLIT_DEV_DOMAIN ? 'https' : 'http';
          const resetUrl = `${protocol}://${domain}/reset-password?token=${token}`;

          console.log('[Password Reset] Attempting to send email to:', email);
          console.log('[Password Reset] Reset URL:', resetUrl);

          const result = await resend.emails.send({
            from: 'HRStudio360 <onboarding@resend.dev>',
            to: email,
            subject: 'Password Reset Request - HRStudio360',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Password Reset Request</h2>
                <p>Hello ${user.firstName || 'there'},</p>
                <p>We received a request to reset your password for your HRStudio360 account.</p>
                <p>Click the button below to reset your password. This link will expire in 30 minutes.</p>
                <div style="margin: 30px 0;">
                  <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Reset Password
                  </a>
                </div>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <p style="color: #666; font-size: 12px; margin-top: 40px;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  ${resetUrl}
                </p>
              </div>
            `
          });

          console.log('[Password Reset] Email sent successfully:', result);
        } catch (emailError: any) {
          console.error('[Password Reset] Failed to send email:', emailError.message);
          console.error('[Password Reset] Full error:', emailError);
        }
      } else {
        console.warn('[Password Reset] RESEND_API_KEY not configured - email not sent');
      }

      res.json({ 
        success: true, 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  });

  // Password reset - complete reset with token
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      const resetToken = await db.select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token))
        .limit(1);

      if (!resetToken || resetToken.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      const tokenData = resetToken[0];

      if (tokenData.used) {
        return res.status(400).json({ error: 'This reset link has already been used' });
      }

      if (new Date() > new Date(tokenData.expiresAt)) {
        return res.status(400).json({ error: 'This reset link has expired' });
      }

      const validationResult = validatePassword(newPassword);
      if (!validationResult.valid) {
        return res.status(400).json({ error: validationResult.errors.join(', ') });
      }

      const hashedPassword = await hashPassword(newPassword);

      await db.update(authCredentials)
        .set({ 
          passwordHash: hashedPassword,
          passwordUpdatedAt: new Date(),
          failedAttempts: 0,
          lockedUntil: null
        })
        .where(eq(authCredentials.profileId, tokenData.profileId));

      await db.update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, tokenData.id));

      const ipAddress = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      await db.insert(passwordAuditLog).values({
        profileId: tokenData.profileId,
        action: 'password_reset',
        method: 'email_reset_link',
        adminId: null,
        ipAddress,
        userAgent,
        success: true
      });

      res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // Weather API proxy endpoint
  app.get('/api/weather/:lat/:lon', async (req, res) => {
    try {
      const { lat, lon } = req.params;
      const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HR-Studio-Weather-Widget/1.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('met.no API error:', response.status, errorText);
        return res.status(response.status).json({ error: 'Weather API error' });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Weather proxy error:', error);
      res.status(500).json({ error: error.message });
    }
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

  // Performance Review Cycle routes
  app.get('/api/performance/review-cycles', async (req, res) => {
    try {
      const cycles = await storage.getActiveReviewCycles();
      res.json(cycles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/performance/review-cycles/:id', async (req, res) => {
    try {
      const cycle = await storage.getReviewCycleById(req.params.id);
      if (!cycle) {
        return res.status(404).json({ error: 'Review cycle not found' });
      }
      res.json(cycle);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/performance/review-cycles', async (req, res) => {
    try {
      const validated = insertReviewCycleSchema.parse(req.body);
      const cycle = await storage.createReviewCycle(validated);
      res.status(201).json(cycle);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/performance/review-cycles/:id', async (req, res) => {
    try {
      const cycle = await storage.updateReviewCycle(req.params.id, req.body);
      if (!cycle) {
        return res.status(404).json({ error: 'Review cycle not found' });
      }
      res.json(cycle);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Performance Reviews
  app.get('/api/performance/reviews', async (req, res) => {
    try {
      const cycleId = req.query.cycleId as string | undefined;
      const reviews = await storage.getPerformanceReviews(cycleId);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/performance/reviews/:id', async (req, res) => {
    try {
      const review = await storage.getPerformanceReviewById(req.params.id);
      if (!review) {
        return res.status(404).json({ error: 'Performance review not found' });
      }
      res.json(review);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Notification routes
  app.get('/api/user-notifications', async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const unreadOnly = req.query.unreadOnly === 'true';
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      
      const notifications = await storage.getUserNotifications(userId, unreadOnly);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/user-notifications', async (req, res) => {
    try {
      const validated = insertUserNotificationSchema.parse(req.body);
      const notification = await storage.createUserNotification(validated);
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/user-notifications/:id/read', async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/user-notifications/read-all', async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Collaborator Invitation routes
  app.get('/api/collaborator-invitations', async (req, res) => {
    try {
      const filters = {
        senderId: req.query.senderId as string | undefined,
        recipientId: req.query.recipientId as string | undefined,
        status: req.query.status as string | undefined
      };
      
      const invitations = await storage.getCollaboratorInvitations(filters);
      res.json(invitations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/collaborator-invitations/:id', async (req, res) => {
    try {
      const invitation = await storage.getCollaboratorInvitationById(req.params.id);
      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }
      res.json(invitation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/collaborator-invitations', async (req, res) => {
    try {
      const validated = insertCollaboratorInvitationSchema.parse(req.body);
      const invitation = await storage.createCollaboratorInvitation(validated);
      
      await storage.createUserNotification({
        userId: validated.recipientId,
        type: 'collaborator_invite',
        title: 'New Collaboration Invite',
        message: `You have received a collaboration invite`,
        triggeredBy: validated.senderId,
        relatedId: invitation.id,
        isRead: false
      });
      
      const [sender, recipient] = await Promise.all([
        storage.getProfileById(validated.senderId),
        storage.getProfileById(validated.recipientId)
      ]);
      
      if (sender && recipient) {
        const senderName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.email;
        const recipientName = `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || recipient.email;
        
        await sendCollaboratorInviteEmail({
          recipientEmail: validated.recipientEmail,
          recipientName,
          senderName,
          message: validated.message || undefined,
          invitationId: invitation.id
        });
      }
      
      res.status(201).json(invitation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/collaborator-invitations/:id/accept', async (req, res) => {
    try {
      const invitation = await storage.getCollaboratorInvitationById(req.params.id);
      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }
      
      if (invitation.status !== 'pending') {
        return res.status(409).json({ 
          error: 'Invitation cannot be accepted',
          reason: `Current status is "${invitation.status}". Only pending invitations can be accepted.`
        });
      }
      
      const updated = await storage.updateCollaboratorInvitation(req.params.id, {
        status: 'accepted',
        respondedAt: new Date()
      });
      
      if (!updated) {
        return res.status(500).json({ error: 'Failed to update invitation' });
      }
      
      await storage.createUserNotification({
        userId: invitation.senderId,
        type: 'collaborator_accepted',
        title: 'Collaboration Invite Accepted',
        message: `Your collaboration invite has been accepted`,
        triggeredBy: invitation.recipientId,
        relatedId: invitation.id,
        isRead: false
      });
      
      const [sender, recipient] = await Promise.all([
        storage.getProfileById(invitation.senderId),
        storage.getProfileById(invitation.recipientId)
      ]);
      
      if (sender && recipient) {
        const senderName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.email;
        const recipientName = `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || recipient.email;
        
        await sendCollaboratorAcceptedEmail({
          recipientEmail: sender.email,
          recipientName: senderName,
          acceptedByName: recipientName
        });
      }
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/collaborator-invitations/:id/decline', async (req, res) => {
    try {
      const invitation = await storage.getCollaboratorInvitationById(req.params.id);
      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }
      
      if (invitation.status !== 'pending') {
        return res.status(409).json({ 
          error: 'Invitation cannot be declined',
          reason: `Current status is "${invitation.status}". Only pending invitations can be declined.`
        });
      }
      
      const updated = await storage.updateCollaboratorInvitation(req.params.id, {
        status: 'declined',
        respondedAt: new Date()
      });
      
      if (!updated) {
        return res.status(500).json({ error: 'Failed to update invitation' });
      }
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'userId parameter is required' });
      }

      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Announcements endpoints
  app.get('/api/announcements', async (req, res) => {
    try {
      let limit = 10; // Default
      if (req.query.limit) {
        const parsed = parseInt(req.query.limit as string);
        if (isNaN(parsed) || parsed < 1 || parsed > 100) {
          return res.status(400).json({ error: 'Invalid limit parameter. Must be a number between 1 and 100.' });
        }
        limit = parsed;
      }
      const announcements = await storage.getPublishedAnnouncements(limit);
      res.json(announcements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/announcements', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check authorization
      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Forbidden: Only HR department and Product Owners can create announcements' });
      }

      // Validate request body
      const announcementData = {
        ...req.body,
        creatorUserId: userId // Use authenticated user ID, not client-provided
      };

      const announcement = await storage.createAnnouncement(announcementData);
      res.status(201).json(announcement);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/announcements/:id', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check authorization
      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Forbidden: Only HR department and Product Owners can edit announcements' });
      }

      const { id } = req.params;
      const announcement = await storage.updateAnnouncement(id, req.body);
      
      if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      res.json(announcement);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/announcements/:id', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check authorization
      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Forbidden: Only HR department and Product Owners can delete announcements' });
      }

      const { id } = req.params;
      await storage.deleteAnnouncement(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/announcements/:id/read', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      await storage.markAnnouncementAsRead(id, userId);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User permissions endpoint
  app.get('/api/profiles/:id/permissions', async (req, res) => {
    try {
      const { id } = req.params;
      const permissions = await storage.getUserPermissions(id);
      res.json(permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // New hires endpoints
  app.get('/api/new-hires', async (_req, res) => {
    try {
      const newHires = await storage.getNewHires();
      res.json(newHires);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/new-hires/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const newHire = await storage.getNewHireById(id);
      if (!newHire) {
        return res.status(404).json({ error: 'New hire not found' });
      }
      res.json(newHire);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/new-hires', async (req, res) => {
    try {
      const { insertNewHireSchema } = await import('../shared/schema.js');
      
      // Validate request body
      const validatedData = insertNewHireSchema.parse(req.body);
      
      // Check if email already exists
      const existingHire = await storage.getNewHireByEmail(validatedData.email);
      if (existingHire) {
        return res.status(409).json({ error: 'A new hire with this email already exists' });
      }
      
      // Create new hire
      const newHire = await storage.createNewHire(validatedData);
      res.status(201).json(newHire);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/new-hires/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { insertNewHireSchema } = await import('../shared/schema.js');
      
      // Validate request body (partial update)
      const validatedData = insertNewHireSchema.partial().parse(req.body);
      
      // Update new hire
      const updatedHire = await storage.updateNewHire(id, validatedData);
      if (!updatedHire) {
        return res.status(404).json({ error: 'New hire not found' });
      }
      res.json(updatedHire);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Analytics routes
  const validateTimeRange = (timeRange: string | undefined): string => {
    const validRanges = ['1m', '3m', '6m', '1y'];
    // If no time range provided (undefined/null), use default
    if (timeRange === undefined || timeRange === null) {
      return '3m';
    }
    // If time range provided (including empty string) but invalid, throw error
    if (!validRanges.includes(timeRange)) {
      throw new Error(`Invalid timeRange. Must be one of: ${validRanges.join(', ')}`);
    }
    return timeRange;
  };

  app.get('/api/analytics/workforce', async (req, res) => {
    try {
      const timeRange = validateTimeRange(req.query.timeRange as string | undefined);
      const metrics = await storage.getWorkforceMetrics(timeRange);
      res.json(metrics);
    } catch (error: any) {
      if (error.message.includes('Invalid timeRange')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/analytics/performance', async (req, res) => {
    try {
      const timeRange = validateTimeRange(req.query.timeRange as string | undefined);
      const metrics = await storage.getPerformanceMetrics(timeRange);
      res.json(metrics);
    } catch (error: any) {
      if (error.message.includes('Invalid timeRange')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/analytics/leave', async (req, res) => {
    try {
      const timeRange = validateTimeRange(req.query.timeRange as string | undefined);
      const metrics = await storage.getLeaveMetrics(timeRange);
      res.json(metrics);
    } catch (error: any) {
      if (error.message.includes('Invalid timeRange')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/analytics/financial', async (req, res) => {
    try {
      const timeRange = validateTimeRange(req.query.timeRange as string | undefined);
      const metrics = await storage.getFinancialMetrics(timeRange);
      res.json(metrics);
    } catch (error: any) {
      if (error.message.includes('Invalid timeRange')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/analytics/summary', async (req, res) => {
    try {
      const timeRange = validateTimeRange(req.query.timeRange as string | undefined);
      const summary = await storage.getAnalyticsSummary(timeRange);
      res.json(summary);
    } catch (error: any) {
      if (error.message.includes('Invalid timeRange')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Admin cleanup endpoint - Deletes all demo data
  app.post('/api/admin/cleanup', async (req, res) => {
    try {
      // Security: Check for admin secret key
      const providedSecret = req.body.secret || req.query.secret;
      const adminSecret = process.env.ADMIN_SEED_SECRET;

      if (!adminSecret) {
        return res.status(500).json({ 
          error: 'Admin cleanup not configured. Set ADMIN_SEED_SECRET environment variable.' 
        });
      }

      if (providedSecret !== adminSecret) {
        console.warn('⚠️  Unauthorized cleanup attempt with invalid secret');
        return res.status(401).json({ 
          error: 'Unauthorized. Invalid admin secret key.' 
        });
      }

      // Delete data in correct order (respecting foreign key constraints)
      console.log('🔐 Admin cleanup endpoint called with valid credentials');
      console.log('🧹 Starting database cleanup...');
      
      const { db } = await import('./db.js');
      const { 
        reviewResponses, reviewGoalsComments, performanceReviews,
        reviewQuestionAssignments, reviewQuestionsLibrary, reviewQuestionTemplates, reviewCycles,
        leaveRequests, leaveBalances, newHires, candidates, employees,
        announcements, jobTitles, departments, profiles
      } = await import('../shared/schema.js');

      // Delete in reverse dependency order
      await db.delete(reviewResponses);
      console.log('   ✓ Deleted review responses');
      
      await db.delete(reviewGoalsComments);
      console.log('   ✓ Deleted review goals/comments');
      
      await db.delete(performanceReviews);
      console.log('   ✓ Deleted performance reviews');
      
      await db.delete(reviewQuestionAssignments);
      console.log('   ✓ Deleted review question assignments');
      
      await db.delete(reviewQuestionsLibrary);
      console.log('   ✓ Deleted review questions');
      
      await db.delete(reviewQuestionTemplates);
      console.log('   ✓ Deleted review templates');
      
      await db.delete(reviewCycles);
      console.log('   ✓ Deleted review cycles');
      
      await db.delete(leaveRequests);
      console.log('   ✓ Deleted leave requests');
      
      await db.delete(leaveBalances);
      console.log('   ✓ Deleted leave balances');
      
      await db.delete(newHires);
      console.log('   ✓ Deleted new hires');
      
      await db.delete(candidates);
      console.log('   ✓ Deleted candidates');
      
      await db.delete(employees);
      console.log('   ✓ Deleted employees');
      
      await db.delete(announcements);
      console.log('   ✓ Deleted announcements');
      
      await db.delete(jobTitles);
      console.log('   ✓ Deleted job titles');
      
      await db.delete(departments);
      console.log('   ✓ Deleted departments');
      
      await db.delete(profiles);
      console.log('   ✓ Deleted profiles');

      console.log('✅ Database cleanup completed successfully!');
      
      res.json({
        success: true,
        message: 'All demo data has been deleted successfully',
        tablesCleared: [
          'review_responses', 'review_goals_comments', 'performance_reviews',
          'review_question_assignments', 'review_questions_library', 'review_question_templates', 'review_cycles',
          'leave_requests', 'leave_balances', 'new_hires', 'candidates', 'employees',
          'announcements', 'job_titles', 'departments', 'profiles'
        ]
      });
    } catch (error: any) {
      console.error('❌ Admin cleanup endpoint error:', error);
      res.status(500).json({ 
        error: 'Cleanup failed', 
        details: error.message 
      });
    }
  });

  // Admin seed endpoint - Protected with secret key
  app.post('/api/admin/seed', async (req, res) => {
    try {
      // Security: Check for admin secret key
      const providedSecret = req.body.secret || req.query.secret;
      const adminSecret = process.env.ADMIN_SEED_SECRET;

      if (!adminSecret) {
        return res.status(500).json({ 
          error: 'Admin seeding not configured. Set ADMIN_SEED_SECRET environment variable.' 
        });
      }

      if (providedSecret !== adminSecret) {
        console.warn('⚠️  Unauthorized seed attempt with invalid secret');
        return res.status(401).json({ 
          error: 'Unauthorized. Invalid admin secret key.' 
        });
      }

      // Run the seed function
      console.log('🔐 Admin seed endpoint called with valid credentials');
      const result = await seedProductionDatabase();
      
      res.json(result);
    } catch (error: any) {
      console.error('❌ Admin seed endpoint error:', error);
      res.status(500).json({ 
        error: 'Seeding failed', 
        details: error.message 
      });
    }
  });
}
