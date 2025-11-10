import { db } from './db.js';
import type { 
  Profile, InsertProfile, 
  Announcement, InsertAnnouncement,
  Employee, InsertEmployee, EmployeeWithProfile,
  LeaveRequest, InsertLeaveRequest,
  LeaveBalance, InsertLeaveBalance,
  Candidate, InsertCandidate,
  NewHire, InsertNewHire,
  ExpenseCategory, InsertExpenseCategory,
  Expense, InsertExpense,
  ChatChannel, InsertChatChannel,
  ChannelMember, InsertChannelMember,
  ChatMessage, InsertChatMessage,
  MessageReaction, InsertMessageReaction,
  TypingIndicator, InsertTypingIndicator,
  UserPresence, InsertUserPresence,
  UserNotification, InsertUserNotification,
  CollaboratorInvitation, InsertCollaboratorInvitation,
  ChangeLog, InsertChangeLog,
  HistoricalChange, InsertHistoricalChange,
  ChangeNotification, InsertChangeNotification,
  CelebrationBadge, InsertCelebrationBadge,
  EarnedBadge, InsertEarnedBadge,
  CelebrationHistory, InsertCelebrationHistory,
  CelebrationNotification, InsertCelebrationNotification,
  ReviewCycle, InsertReviewCycle
} from '../shared/schema.js';
import { 
  profiles, announcements, employees, leaveRequests, leaveBalances,
  candidates, newHires, expenseCategories, expenses, departments,
  chatChannels, channelMembers, chatMessages, messageReactions, typingIndicators, userPresence,
  userNotifications, collaboratorInvitations,
  changeLog, historicalChanges, changeNotifications,
  celebrationBadges, earnedBadges, celebrationHistory, celebrationNotifications,
  reviewCycles
} from '../shared/schema.js';
import { eq, gte, and, desc, or, like, sql as drizzleSql, isNull, isNotNull, lte } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export interface IStorage {
  // Profiles
  getProfiles(): Promise<Profile[]>;
  getProfileById(id: string): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  
  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployeesWithProfiles(): Promise<EmployeeWithProfile[]>;
  getEmployeeById(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  
  // Leave Requests
  getLeaveRequests(): Promise<LeaveRequest[]>;
  getLeaveRequestById(id: string): Promise<LeaveRequest | undefined>;
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequest(id: string, request: Partial<InsertLeaveRequest>): Promise<LeaveRequest | undefined>;

  // Leave Balances
  getLeaveBalances(): Promise<LeaveBalance[]>;
  getLeaveBalanceByEmployeeId(employeeId: string): Promise<LeaveBalance | undefined>;
  createLeaveBalance(balance: InsertLeaveBalance): Promise<LeaveBalance>;
  updateLeaveBalance(id: string, balance: Partial<InsertLeaveBalance>): Promise<LeaveBalance | undefined>;

  // Candidates
  getCandidates(): Promise<Candidate[]>;
  getCandidateById(id: string): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: string, candidate: Partial<InsertCandidate>): Promise<Candidate | undefined>;

  // Expense Categories
  getExpenseCategories(): Promise<ExpenseCategory[]>;
  getExpenseCategoryById(id: string): Promise<ExpenseCategory | undefined>;
  
  // Expenses
  getExpenses(): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;

  // Chat Channels
  getChatChannels(): Promise<ChatChannel[]>;
  getChatChannelById(id: string): Promise<ChatChannel | undefined>;
  createChatChannel(channel: InsertChatChannel): Promise<ChatChannel>;
  updateChatChannel(id: string, channel: Partial<InsertChatChannel>): Promise<ChatChannel | undefined>;
  
  // Channel Members
  getChannelMembers(channelId: string): Promise<ChannelMember[]>;
  addChannelMember(member: InsertChannelMember): Promise<ChannelMember>;
  removeChannelMember(channelId: string, userId: string): Promise<void>;
  updateChannelMemberLastRead(channelId: string, userId: string): Promise<void>;
  
  // Chat Messages
  getChatMessages(channelId: string, limit?: number): Promise<ChatMessage[]>;
  getChatMessageById(id: string): Promise<ChatMessage | undefined>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  updateChatMessage(id: string, message: Partial<InsertChatMessage>): Promise<ChatMessage | undefined>;
  deleteChatMessage(id: string): Promise<void>;
  
  // Message Reactions
  getMessageReactions(messageId: string): Promise<MessageReaction[]>;
  addMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction>;
  removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void>;
  
  // Typing Indicators
  setTypingIndicator(indicator: InsertTypingIndicator): Promise<TypingIndicator>;
  removeTypingIndicator(channelId: string, userId: string): Promise<void>;
  getTypingIndicators(channelId: string): Promise<TypingIndicator[]>;
  
  // User Presence
  upsertUserPresence(presence: InsertUserPresence): Promise<UserPresence>;
  getUserPresence(userId: string): Promise<UserPresence | undefined>;
  
  // User Notifications
  getUserNotifications(userId: string, unreadOnly?: boolean): Promise<UserNotification[]>;
  createUserNotification(notification: InsertUserNotification): Promise<UserNotification>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  
  // Collaborator Invitations
  getCollaboratorInvitations(filters: { senderId?: string; recipientId?: string; status?: string }): Promise<CollaboratorInvitation[]>;
  getCollaboratorInvitationById(id: string): Promise<CollaboratorInvitation | undefined>;
  createCollaboratorInvitation(invitation: InsertCollaboratorInvitation): Promise<CollaboratorInvitation>;
  updateCollaboratorInvitation(id: string, invitation: Partial<InsertCollaboratorInvitation>): Promise<CollaboratorInvitation | undefined>;
  
  // Change Log
  getChangeLogs(filters?: { changeType?: string; startDate?: string; endDate?: string }, limit?: number): Promise<ChangeLog[]>;
  getChangeLogById(id: string): Promise<ChangeLog | undefined>;
  createChangeLog(log: InsertChangeLog): Promise<ChangeLog>;
  updateChangeLog(id: string, log: Partial<InsertChangeLog>): Promise<ChangeLog | undefined>;
  
  // Historical Changes
  getHistoricalChanges(limit?: number): Promise<HistoricalChange[]>;
  createHistoricalChange(change: InsertHistoricalChange): Promise<HistoricalChange>;
  
  // Change Notifications
  getChangeNotifications(userId: string): Promise<ChangeNotification[]>;
  createChangeNotification(notification: InsertChangeNotification): Promise<ChangeNotification>;
  markChangeNotificationRead(changeLogId: string, userId: string): Promise<void>;

  // Celebrations
  getCelebrationBadges(): Promise<CelebrationBadge[]>;
  getCelebrationBadgeByYears(years: number): Promise<CelebrationBadge | undefined>;
  getEarnedBadges(userId: string): Promise<EarnedBadge[]>;
  createEarnedBadge(badge: InsertEarnedBadge): Promise<EarnedBadge>;
  markBadgeViewed(userId: string, badgeId: string): Promise<void>;
  saveCelebrationHistory(history: InsertCelebrationHistory): Promise<CelebrationHistory>;
  markCelebrationDismissed(userId: string, type: string, date: string): Promise<void>;
  getCelebrationNotifications(userId: string): Promise<CelebrationNotification[]>;
  createCelebrationNotification(notification: InsertCelebrationNotification): Promise<CelebrationNotification>;

  // Performance Review Cycles
  getActiveReviewCycles(): Promise<ReviewCycle[]>;
  getReviewCycleById(id: string): Promise<ReviewCycle | undefined>;
  createReviewCycle(cycle: InsertReviewCycle): Promise<ReviewCycle>;
  updateReviewCycle(id: string, cycle: Partial<InsertReviewCycle>): Promise<ReviewCycle | undefined>;
  
  // Dashboard Stats
  getDashboardStats(userId: string): Promise<import('../shared/schema.js').DashboardStats>;
  
  // Announcements
  getPublishedAnnouncements(limit?: number): Promise<import('../shared/schema.js').Announcement[]>;
  
  // User Permissions
  getUserPermissions(userId: string): Promise<import('../shared/schema.js').UserPermissions>;
  
  // New Hires
  getNewHires(): Promise<import('../shared/schema.js').NewHire[]>;
  getNewHireById(id: string): Promise<import('../shared/schema.js').NewHire | undefined>;
  createNewHire(newHire: import('../shared/schema.js').InsertNewHire): Promise<import('../shared/schema.js').NewHire>;
  getNewHireByEmail(email: string): Promise<import('../shared/schema.js').NewHire | undefined>;
  updateNewHire(id: string, newHire: Partial<import('../shared/schema.js').InsertNewHire>): Promise<import('../shared/schema.js').NewHire | undefined>;
  
  // Analytics
  getWorkforceMetrics(timeRange: string): Promise<import('../shared/schema.js').WorkforceMetrics>;
  getPerformanceMetrics(timeRange: string): Promise<import('../shared/schema.js').PerformanceMetrics>;
  getLeaveMetrics(timeRange: string): Promise<import('../shared/schema.js').LeaveMetrics>;
  getFinancialMetrics(timeRange: string): Promise<import('../shared/schema.js').FinancialMetrics>;
  getAnalyticsSummary(timeRange: string): Promise<import('../shared/schema.js').AnalyticsSummary>;
}

// Database storage implementation
export class DbStorage implements IStorage {
  // Profiles
  async getProfiles(): Promise<Profile[]> {
    return db.select().from(profiles);
  }

  async getProfileById(id: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id));
    return result[0];
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.email, email));
    return result[0];
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const result = await db.insert(profiles).values(profile).returning();
    return result[0];
  }

  async updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined> {
    const result = await db.update(profiles).set(profile).where(eq(profiles.id, id)).returning();
    return result[0];
  }

  // Employees
  async getEmployees(): Promise<Employee[]> {
    return db.select().from(employees);
  }

  async getEmployeesWithProfiles(): Promise<EmployeeWithProfile[]> {
    const managerProfiles = alias(profiles, 'managerProfiles');
    
    const result = await db
      .select({
        employee: employees,
        profile: profiles,
        department: departments,
        managerProfile: managerProfiles
      })
      .from(employees)
      .leftJoin(profiles, eq(employees.userId, profiles.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(managerProfiles, eq(employees.managerId, managerProfiles.id));

    return result.map(row => ({
      ...row.employee,
      profile: row.profile ? {
        firstName: row.profile.firstName,
        lastName: row.profile.lastName,
        email: row.profile.email,
        department: row.department?.name || null,
        role: row.profile.role,
        phone: row.profile.phone,
        avatarUrl: row.profile.profilePicture,
        managerName: row.managerProfile 
          ? `${row.managerProfile.firstName || ''} ${row.managerProfile.lastName || ''}`.trim() || null
          : null
      } : null
    }));
  }

  async getEmployeeById(id: string): Promise<Employee | undefined> {
    const result = await db.select().from(employees).where(eq(employees.id, id));
    return result[0];
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const result = await db.insert(employees).values(employee).returning();
    return result[0];
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const result = await db.update(employees).set(employee).where(eq(employees.id, id)).returning();
    return result[0];
  }

  // Leave Requests
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    return db.select().from(leaveRequests);
  }

  async getLeaveRequestById(id: string): Promise<LeaveRequest | undefined> {
    const result = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return result[0];
  }

  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    const result = await db.insert(leaveRequests).values(request).returning();
    return result[0];
  }

  async updateLeaveRequest(id: string, request: Partial<InsertLeaveRequest>): Promise<LeaveRequest | undefined> {
    const result = await db.update(leaveRequests).set(request).where(eq(leaveRequests.id, id)).returning();
    return result[0];
  }

  // Leave Balances
  async getLeaveBalances(): Promise<LeaveBalance[]> {
    return db.select().from(leaveBalances);
  }

  async getLeaveBalanceByEmployeeId(employeeId: string): Promise<LeaveBalance | undefined> {
    const result = await db.select().from(leaveBalances).where(eq(leaveBalances.employeeId, employeeId));
    return result[0];
  }

  async createLeaveBalance(balance: InsertLeaveBalance): Promise<LeaveBalance> {
    const result = await db.insert(leaveBalances).values(balance).returning();
    return result[0];
  }

  async updateLeaveBalance(id: string, balance: Partial<InsertLeaveBalance>): Promise<LeaveBalance | undefined> {
    const result = await db.update(leaveBalances).set(balance).where(eq(leaveBalances.id, id)).returning();
    return result[0];
  }

  // Candidates
  async getCandidates(): Promise<Candidate[]> {
    return db.select().from(candidates);
  }

  async getCandidateById(id: string): Promise<Candidate | undefined> {
    const result = await db.select().from(candidates).where(eq(candidates.id, id));
    return result[0];
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const result = await db.insert(candidates).values(candidate).returning();
    return result[0];
  }

  async updateCandidate(id: string, candidate: Partial<InsertCandidate>): Promise<Candidate | undefined> {
    const result = await db.update(candidates).set(candidate).where(eq(candidates.id, id)).returning();
    return result[0];
  }

  // Expense Categories
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return db.select().from(expenseCategories);
  }

  async getExpenseCategoryById(id: string): Promise<ExpenseCategory | undefined> {
    const result = await db.select().from(expenseCategories).where(eq(expenseCategories.id, id));
    return result[0];
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return db.select().from(expenses);
  }

  async getExpenseById(id: string): Promise<Expense | undefined> {
    const result = await db.select().from(expenses).where(eq(expenses.id, id));
    return result[0];
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const result = await db.insert(expenses).values(expense).returning();
    return result[0];
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const result = await db.update(expenses).set(expense).where(eq(expenses.id, id)).returning();
    return result[0];
  }

  // Chat Channels
  async getChatChannels(): Promise<ChatChannel[]> {
    return db.select().from(chatChannels).orderBy(desc(chatChannels.updatedAt));
  }

  async getChatChannelById(id: string): Promise<ChatChannel | undefined> {
    const result = await db.select().from(chatChannels).where(eq(chatChannels.id, id));
    return result[0];
  }

  async createChatChannel(channel: InsertChatChannel): Promise<ChatChannel> {
    const result = await db.insert(chatChannels).values(channel).returning();
    return result[0];
  }

  async updateChatChannel(id: string, channel: Partial<InsertChatChannel>): Promise<ChatChannel | undefined> {
    const result = await db.update(chatChannels).set(channel).where(eq(chatChannels.id, id)).returning();
    return result[0];
  }

  // Channel Members
  async getChannelMembers(channelId: string): Promise<ChannelMember[]> {
    return db.select().from(channelMembers).where(eq(channelMembers.channelId, channelId));
  }

  async addChannelMember(member: InsertChannelMember): Promise<ChannelMember> {
    const result = await db.insert(channelMembers).values(member).returning();
    return result[0];
  }

  async removeChannelMember(channelId: string, userId: string): Promise<void> {
    await db.delete(channelMembers)
      .where(and(
        eq(channelMembers.channelId, channelId),
        eq(channelMembers.userId, userId)
      ));
  }

  async updateChannelMemberLastRead(channelId: string, userId: string): Promise<void> {
    await db.update(channelMembers)
      .set({ lastReadAt: new Date() })
      .where(and(
        eq(channelMembers.channelId, channelId),
        eq(channelMembers.userId, userId)
      ));
  }

  // Chat Messages
  async getChatMessages(channelId: string, limit: number = 50): Promise<ChatMessage[]> {
    return db.select()
      .from(chatMessages)
      .where(eq(chatMessages.channelId, channelId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async getChatMessageById(id: string): Promise<ChatMessage | undefined> {
    const result = await db.select().from(chatMessages).where(eq(chatMessages.id, id));
    return result[0];
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  async updateChatMessage(id: string, message: Partial<InsertChatMessage>): Promise<ChatMessage | undefined> {
    const result = await db.update(chatMessages).set(message).where(eq(chatMessages.id, id)).returning();
    return result[0];
  }

  async deleteChatMessage(id: string): Promise<void> {
    await db.update(chatMessages)
      .set({ deletedAt: new Date() })
      .where(eq(chatMessages.id, id));
  }

  // Message Reactions
  async getMessageReactions(messageId: string): Promise<MessageReaction[]> {
    return db.select().from(messageReactions).where(eq(messageReactions.messageId, messageId));
  }

  async addMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction> {
    const result = await db.insert(messageReactions).values(reaction).returning();
    return result[0];
  }

  async removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await db.delete(messageReactions)
      .where(and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji)
      ));
  }

  // Typing Indicators
  async setTypingIndicator(indicator: InsertTypingIndicator): Promise<TypingIndicator> {
    const result = await db.insert(typingIndicators)
      .values(indicator)
      .onConflictDoUpdate({
        target: [typingIndicators.channelId, typingIndicators.userId],
        set: { startedTypingAt: new Date() }
      })
      .returning();
    return result[0];
  }

  async removeTypingIndicator(channelId: string, userId: string): Promise<void> {
    await db.delete(typingIndicators)
      .where(and(
        eq(typingIndicators.channelId, channelId),
        eq(typingIndicators.userId, userId)
      ));
  }

  async getTypingIndicators(channelId: string): Promise<TypingIndicator[]> {
    const tenSecondsAgo = new Date(Date.now() - 10000);
    return db.select()
      .from(typingIndicators)
      .where(and(
        eq(typingIndicators.channelId, channelId),
        gte(typingIndicators.startedTypingAt, tenSecondsAgo)
      ));
  }

  // User Presence
  async upsertUserPresence(presence: InsertUserPresence): Promise<UserPresence> {
    const result = await db.insert(userPresence)
      .values(presence)
      .onConflictDoUpdate({
        target: userPresence.userId,
        set: { status: presence.status, lastSeenAt: new Date() }
      })
      .returning();
    return result[0];
  }

  async getUserPresence(userId: string): Promise<UserPresence | undefined> {
    const result = await db.select().from(userPresence).where(eq(userPresence.userId, userId));
    return result[0];
  }

  // User Notifications
  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<UserNotification[]> {
    const conditions = [eq(userNotifications.userId, userId)];
    
    if (unreadOnly) {
      conditions.push(eq(userNotifications.isRead, false));
    }
    
    return db.select()
      .from(userNotifications)
      .where(and(...conditions))
      .orderBy(desc(userNotifications.createdAt));
  }

  async createUserNotification(notification: InsertUserNotification): Promise<UserNotification> {
    const result = await db.insert(userNotifications).values(notification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(userNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(userNotifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(userNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(userNotifications.userId, userId),
        eq(userNotifications.isRead, false)
      ));
  }

  // Collaborator Invitations
  async getCollaboratorInvitations(filters: { senderId?: string; recipientId?: string; status?: string }): Promise<CollaboratorInvitation[]> {
    const conditions = [];
    
    if (filters.senderId) {
      conditions.push(eq(collaboratorInvitations.senderId, filters.senderId));
    }
    if (filters.recipientId) {
      conditions.push(eq(collaboratorInvitations.recipientId, filters.recipientId));
    }
    if (filters.status) {
      conditions.push(eq(collaboratorInvitations.status, filters.status as any));
    }
    
    let query = db.select().from(collaboratorInvitations);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(collaboratorInvitations.createdAt));
  }

  async getCollaboratorInvitationById(id: string): Promise<CollaboratorInvitation | undefined> {
    const result = await db.select().from(collaboratorInvitations).where(eq(collaboratorInvitations.id, id));
    return result[0];
  }

  async createCollaboratorInvitation(invitation: InsertCollaboratorInvitation): Promise<CollaboratorInvitation> {
    const result = await db.insert(collaboratorInvitations).values(invitation).returning();
    return result[0];
  }

  async updateCollaboratorInvitation(id: string, invitation: Partial<InsertCollaboratorInvitation>): Promise<CollaboratorInvitation | undefined> {
    const result = await db.update(collaboratorInvitations)
      .set({ ...invitation, updatedAt: new Date() })
      .where(eq(collaboratorInvitations.id, id))
      .returning();
    return result[0];
  }

  // Change Log
  async getChangeLogs(filters?: { changeType?: string; startDate?: string; endDate?: string }, limit: number = 100): Promise<ChangeLog[]> {
    let query = db.select().from(changeLog);
    
    const conditions = [];
    if (filters?.changeType) {
      conditions.push(eq(changeLog.changeType, filters.changeType));
    }
    if (filters?.startDate) {
      conditions.push(gte(changeLog.createdAt, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      conditions.push(gte(new Date(filters.endDate), changeLog.createdAt));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(changeLog.createdAt)).limit(limit);
  }

  async getChangeLogById(id: string): Promise<ChangeLog | undefined> {
    const result = await db.select().from(changeLog).where(eq(changeLog.id, id));
    return result[0];
  }

  async createChangeLog(log: InsertChangeLog): Promise<ChangeLog> {
    const result = await db.insert(changeLog).values(log).returning();
    return result[0];
  }

  async updateChangeLog(id: string, log: Partial<InsertChangeLog>): Promise<ChangeLog | undefined> {
    const result = await db.update(changeLog).set(log).where(eq(changeLog.id, id)).returning();
    return result[0];
  }

  // Historical Changes
  async getHistoricalChanges(limit: number = 100): Promise<HistoricalChange[]> {
    return db.select()
      .from(historicalChanges)
      .orderBy(desc(historicalChanges.changeDate))
      .limit(limit);
  }

  async createHistoricalChange(change: InsertHistoricalChange): Promise<HistoricalChange> {
    const result = await db.insert(historicalChanges).values(change).returning();
    return result[0];
  }

  // Change Notifications
  async getChangeNotifications(userId: string): Promise<ChangeNotification[]> {
    return db.select()
      .from(changeNotifications)
      .where(eq(changeNotifications.userId, userId))
      .orderBy(desc(changeNotifications.deliveredAt));
  }

  async createChangeNotification(notification: InsertChangeNotification): Promise<ChangeNotification> {
    const result = await db.insert(changeNotifications).values(notification).returning();
    return result[0];
  }

  async markChangeNotificationRead(changeLogId: string, userId: string): Promise<void> {
    await db.update(changeNotifications)
      .set({ readAt: new Date() })
      .where(and(
        eq(changeNotifications.changeLogId, changeLogId),
        eq(changeNotifications.userId, userId)
      ));
  }

  // Celebrations
  async getCelebrationBadges(): Promise<CelebrationBadge[]> {
    return db.select().from(celebrationBadges);
  }

  async getCelebrationBadgeByYears(years: number): Promise<CelebrationBadge | undefined> {
    const result = await db.select().from(celebrationBadges).where(eq(celebrationBadges.years, years));
    return result[0];
  }

  async getEarnedBadges(userId: string): Promise<EarnedBadge[]> {
    return db.select().from(earnedBadges).where(eq(earnedBadges.userId, userId));
  }

  async createEarnedBadge(badge: InsertEarnedBadge): Promise<EarnedBadge> {
    const result = await db.insert(earnedBadges).values(badge).returning();
    return result[0];
  }

  async markBadgeViewed(userId: string, badgeId: string): Promise<void> {
    await db.update(earnedBadges)
      .set({ viewedAt: new Date(), isNew: false })
      .where(and(
        eq(earnedBadges.userId, userId),
        eq(earnedBadges.badgeId, badgeId)
      ));
  }

  async saveCelebrationHistory(history: InsertCelebrationHistory): Promise<CelebrationHistory> {
    const result = await db.insert(celebrationHistory).values(history).returning();
    return result[0];
  }

  async markCelebrationDismissed(userId: string, type: string, date: string): Promise<void> {
    await db.update(celebrationHistory)
      .set({ dismissedAt: new Date() })
      .where(and(
        eq(celebrationHistory.userId, userId),
        eq(celebrationHistory.type, type),
        eq(celebrationHistory.celebrationDate, new Date(date))
      ));
  }

  async getCelebrationNotifications(userId: string): Promise<CelebrationNotification[]> {
    return db.select()
      .from(celebrationNotifications)
      .where(eq(celebrationNotifications.userId, userId));
  }

  async createCelebrationNotification(notification: InsertCelebrationNotification): Promise<CelebrationNotification> {
    const result = await db.insert(celebrationNotifications).values(notification).returning();
    return result[0];
  }

  // Performance Review Cycles
  async getActiveReviewCycles(): Promise<ReviewCycle[]> {
    return db.select()
      .from(reviewCycles)
      .where(or(
        eq(reviewCycles.status, 'draft'),
        eq(reviewCycles.status, 'active'),
        eq(reviewCycles.status, 'completed')
      ))
      .orderBy(desc(reviewCycles.createdAt));
  }

  async getReviewCycleById(id: string): Promise<ReviewCycle | undefined> {
    const result = await db.select()
      .from(reviewCycles)
      .where(eq(reviewCycles.id, id));
    return result[0];
  }

  async createReviewCycle(cycle: InsertReviewCycle): Promise<ReviewCycle> {
    const result = await db.insert(reviewCycles).values(cycle).returning();
    return result[0];
  }

  async updateReviewCycle(id: string, cycle: Partial<InsertReviewCycle>): Promise<ReviewCycle | undefined> {
    const result = await db.update(reviewCycles)
      .set({ ...cycle, updatedAt: new Date() })
      .where(eq(reviewCycles.id, id))
      .returning();
    return result[0];
  }

  // Dashboard Stats
  async getDashboardStats(userId: string): Promise<import('../shared/schema.js').DashboardStats> {
    // Find the employee record for this user
    const employeeResult = await db.select()
      .from(employees)
      .where(eq(employees.userId, userId));
    
    if (!employeeResult || employeeResult.length === 0) {
      // Return default stats if no employee record exists
      return {
        ptoBalance: null,
        nextPayday: null,
        pendingTasks: { count: 0 },
        events: { upcomingCount: 4 } // Static for now
      };
    }

    const employee = employeeResult[0];
    const currentYear = new Date().getFullYear();

    // Get leave balance (latest year)
    const balanceResult = await db.select()
      .from(leaveBalances)
      .where(and(
        eq(leaveBalances.employeeId, employee.id),
        eq(leaveBalances.year, currentYear)
      ));

    const leaveBalance = balanceResult[0];
    
    // Count pending leave requests for this employee
    const pendingRequestsResult = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(leaveRequests)
      .where(and(
        eq(leaveRequests.employeeId, employee.id),
        eq(leaveRequests.status, 'Pending')
      ));
    
    const pendingCount = pendingRequestsResult[0]?.count || 0;

    // Count team size for managers
    const teamResult = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(employees)
      .where(eq(employees.managerId, employee.id));
    
    const teamSize = teamResult[0]?.count || 0;

    // Count pending approvals (leave requests awaiting this user's approval)
    const awaitingApprovalResult = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(leaveRequests)
      .where(and(
        eq(leaveRequests.approverId, employee.id),
        eq(leaveRequests.status, 'Pending')
      ));
    
    const awaitingApprovalCount = awaitingApprovalResult[0]?.count || 0;

    // Calculate next payday (bi-weekly schedule from start date)
    const nextPayday = this.calculateNextPayday(employee.startDate);

    // Build PTO balance
    const ptoBalance = leaveBalance ? {
      total: parseFloat(leaveBalance.vacationDays || '0') + 
             parseFloat(leaveBalance.sickDays || '0') + 
             parseFloat(leaveBalance.personalDays || '0'),
      breakdown: {
        vacation: parseFloat(leaveBalance.vacationDays || '0'),
        sick: parseFloat(leaveBalance.sickDays || '0'),
        personal: parseFloat(leaveBalance.personalDays || '0')
      }
    } : null;

    return {
      ptoBalance,
      nextPayday,
      pendingTasks: {
        count: pendingCount,
        ...(awaitingApprovalCount > 0 && { awaitingApprovalFor: awaitingApprovalCount })
      },
      ...(teamSize > 0 && { team: { size: teamSize } }),
      events: {
        upcomingCount: 4 // Static for now - could query from events table
      }
    };
  }

  // Helper function to calculate next payday (bi-weekly schedule)
  private calculateNextPayday(startDate: string): string | null {
    try {
      const start = new Date(startDate);
      const today = new Date();
      
      // Calculate days since start date
      const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      // Bi-weekly pay period (14 days)
      const payPeriodDays = 14;
      
      // Calculate next payday
      const daysSinceLastPay = daysSinceStart % payPeriodDays;
      const daysUntilNextPay = payPeriodDays - daysSinceLastPay;
      
      const nextPay = new Date(today);
      nextPay.setDate(today.getDate() + daysUntilNextPay);
      
      // Format as "Month Day, Year"
      return nextPay.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      // Fallback: return 15th of current month or next month
      const today = new Date();
      const fifteenth = new Date(today.getFullYear(), today.getMonth(), 15);
      
      if (today.getDate() > 15) {
        // Return 15th of next month
        fifteenth.setMonth(fifteenth.getMonth() + 1);
      }
      
      return fifteenth.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  }

  async getPublishedAnnouncements(limit: number = 10): Promise<import('../shared/schema.js').Announcement[]> {
    const now = new Date();
    
    const result = await db.select()
      .from(announcements)
      .where(
        and(
          eq(announcements.published, true),
          or(
            isNull(announcements.publicationDate),
            lte(announcements.publicationDate, now)
          ),
          or(
            isNull(announcements.expirationDate),
            gte(announcements.expirationDate, now)
          )
        )
      )
      .orderBy(desc(announcements.createdAt))
      .limit(limit);
    
    return result;
  }

  async getUserPermissions(userId: string): Promise<import('../shared/schema.js').UserPermissions> {
    const result = await db.select({
      department: profiles.department,
      role: profiles.role,
      canAccessOrgChart: profiles.canAccessOrgChart,
      managerId: profiles.managerId
    })
    .from(profiles)
    .where(eq(profiles.id, userId));
    
    if (!result || result.length === 0) {
      return {
        department: null,
        role: null,
        canAccessOrgChart: false,
        managerId: null
      };
    }
    
    return result[0];
  }

  // New Hires
  async getNewHires(): Promise<import('../shared/schema.js').NewHire[]> {
    return db.select().from(newHires).orderBy(desc(newHires.startDate));
  }

  async getNewHireById(id: string): Promise<import('../shared/schema.js').NewHire | undefined> {
    const result = await db.select().from(newHires).where(eq(newHires.id, id));
    return result[0];
  }

  async createNewHire(newHire: import('../shared/schema.js').InsertNewHire): Promise<import('../shared/schema.js').NewHire> {
    const result = await db.insert(newHires).values(newHire).returning();
    return result[0];
  }

  async getNewHireByEmail(email: string): Promise<import('../shared/schema.js').NewHire | undefined> {
    const result = await db.select().from(newHires).where(eq(newHires.email, email));
    return result[0];
  }

  async updateNewHire(id: string, newHire: Partial<import('../shared/schema.js').InsertNewHire>): Promise<import('../shared/schema.js').NewHire | undefined> {
    const result = await db.update(newHires).set(newHire).where(eq(newHires.id, id)).returning();
    return result[0];
  }

  // Analytics Methods
  async getWorkforceMetrics(timeRange: string): Promise<import('../shared/schema.js').WorkforceMetrics> {
    const { startDate } = this.getDateRange(timeRange);
    
    // Get total active employees
    const totalEmployeesResult = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(employees)
      .where(eq(employees.status, 'Active'));
    const totalEmployees = totalEmployeesResult[0]?.count || 0;
    
    // Get new hires in time range
    const newHiresResult = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(employees)
      .where(and(
        eq(employees.status, 'Active'),
        gte(employees.startDate, startDate)
      ));
    const newHires = newHiresResult[0]?.count || 0;
    
    // Get department breakdown
    const departmentData = await db.select({
      department: profiles.department,
      count: drizzleSql<number>`count(*)::int`
    })
      .from(profiles)
      .leftJoin(employees, eq(profiles.id, employees.userId))
      .where(eq(employees.status, 'Active'))
      .groupBy(profiles.department);
    
    // Note: departures and remoteWorkers omitted from response until schema supports them
    // TODO: Add termination_date to employees table for reliable departures tracking
    // TODO: Add is_remote to profiles table for remote worker tracking
    
    return {
      totalEmployees,
      newHires,
      // departures and remoteWorkers omitted (not returned) until supported by schema
      departmentBreakdown: departmentData.map(d => ({
        department: d.department || 'Unknown',
        count: d.count
        // satisfaction and performance omitted until real survey/review data available
      }))
    };
  }

  async getPerformanceMetrics(timeRange: string): Promise<import('../shared/schema.js').PerformanceMetrics> {
    // Import performance reviews and responses tables
    const { performanceReviews, reviewResponses } = await import('../shared/schema.js');
    const { startDate } = this.getDateRange(timeRange);
    
    // Build time range filter condition using managerAssessmentSubmittedAt
    const timeFilter = gte(performanceReviews.managerAssessmentSubmittedAt, startDate);
    
    // Get average performance score from manager ratings (time-filtered)
    const avgScoreResult = await db.select({
      avg: drizzleSql<number>`AVG(${performanceReviews.managerOverallRating})::numeric`
    })
      .from(performanceReviews)
      .where(and(isNotNull(performanceReviews.managerAssessmentSubmittedAt), timeFilter));
    const avgPerformanceScore = Number(avgScoreResult[0]?.avg || 0);
    
    // Get total reviews (time-filtered by manager submission)
    const totalResult = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(performanceReviews)
      .where(and(isNotNull(performanceReviews.managerAssessmentSubmittedAt), timeFilter));
    const reviewsTotal = totalResult[0]?.count || 0;
    
    // Get completed reviews (time-filtered)
    const completedResult = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(performanceReviews)
      .where(and(
        eq(performanceReviews.overallStatus, 'completed'),
        isNotNull(performanceReviews.managerAssessmentSubmittedAt),
        timeFilter
      ));
    const reviewsCompleted = completedResult[0]?.count || 0;
    
    // Get goals achieved from review_responses (ratings >= 4.0 for goal-type questions, time-filtered)
    // Join with performance_reviews to apply time filter
    const goalsResult = await db.select({ count: drizzleSql<number>`count(distinct ${reviewResponses.performanceReviewId})::int` })
      .from(reviewResponses)
      .leftJoin(performanceReviews, eq(reviewResponses.performanceReviewId, performanceReviews.id))
      .where(and(
        gte(reviewResponses.rating, drizzleSql`4.0`),
        isNotNull(performanceReviews.managerAssessmentSubmittedAt),
        gte(performanceReviews.managerAssessmentSubmittedAt, startDate)
      ));
    const goalsAchieved = goalsResult[0]?.count || 0;
    
    // Get rating distribution (time-filtered, GROUP BY rounded rating)
    const ratingDist = await db.select({
      rating: drizzleSql<string>`CASE 
        WHEN ${performanceReviews.managerOverallRating} >= 5.0 THEN '5.0'
        WHEN ${performanceReviews.managerOverallRating} >= 4.0 THEN '4.0-4.9'
        WHEN ${performanceReviews.managerOverallRating} >= 3.0 THEN '3.0-3.9'
        WHEN ${performanceReviews.managerOverallRating} >= 2.0 THEN '2.0-2.9'
        ELSE '1.0-1.9'
      END`,
      count: drizzleSql<number>`count(*)::int`
    })
      .from(performanceReviews)
      .where(and(
        isNotNull(performanceReviews.managerOverallRating),
        isNotNull(performanceReviews.managerAssessmentSubmittedAt),
        timeFilter
      ))
      .groupBy(drizzleSql`CASE 
        WHEN ${performanceReviews.managerOverallRating} >= 5.0 THEN '5.0'
        WHEN ${performanceReviews.managerOverallRating} >= 4.0 THEN '4.0-4.9'
        WHEN ${performanceReviews.managerOverallRating} >= 3.0 THEN '3.0-3.9'
        WHEN ${performanceReviews.managerOverallRating} >= 2.0 THEN '2.0-2.9'
        ELSE '1.0-1.9'
      END`);
    
    // Build rating distribution with all categories
    const ratingDistribution = [
      { rating: '5.0', count: 0 },
      { rating: '4.0-4.9', count: 0 },
      { rating: '3.0-3.9', count: 0 },
      { rating: '2.0-2.9', count: 0 },
      { rating: '1.0-1.9', count: 0 }
    ];
    ratingDist.forEach(r => {
      const found = ratingDistribution.find(rd => rd.rating === r.rating);
      if (found) found.count = r.count;
    });
    
    return {
      avgPerformanceScore,
      goalsAchieved,
      reviewsCompleted,
      reviewsTotal,
      skillCertifications: 0, // TODO: Add when skill tracking implemented
      ratingDistribution
    };
  }

  async getLeaveMetrics(timeRange: string): Promise<import('../shared/schema.js').LeaveMetrics> {
    const { startDate } = this.getDateRange(timeRange);
    
    // Get total leave requests in time range
    const totalRequestsResult = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(leaveRequests)
      .where(gte(leaveRequests.submittedDate, new Date(startDate)));
    const totalRequests = totalRequestsResult[0]?.count || 0;
    
    // Get requests by status
    const pendingResult = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(leaveRequests)
      .where(and(
        eq(leaveRequests.status, 'Pending'),
        gte(leaveRequests.submittedDate, new Date(startDate))
      ));
    const pendingRequests = pendingResult[0]?.count || 0;
    
    const approvedResult = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(leaveRequests)
      .where(and(
        eq(leaveRequests.status, 'Approved'),
        gte(leaveRequests.submittedDate, new Date(startDate))
      ));
    const approvedRequests = approvedResult[0]?.count || 0;
    
    const deniedResult = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(leaveRequests)
      .where(and(
        eq(leaveRequests.status, 'Denied'),
        gte(leaveRequests.submittedDate, new Date(startDate))
      ));
    const deniedRequests = deniedResult[0]?.count || 0;
    
    // Get leave type breakdown
    const typeBreakdown = await db.select({
      type: leaveRequests.type,
      count: drizzleSql<number>`count(*)::int`,
      avgDays: drizzleSql<number>`avg(days)::int`
    })
      .from(leaveRequests)
      .where(gte(leaveRequests.submittedDate, new Date(startDate)))
      .groupBy(leaveRequests.type);
    
    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      deniedRequests,
      avgProcessingDays: 3,
      leaveByType: typeBreakdown.map(t => ({
        type: t.type,
        count: t.count,
        avgDays: t.avgDays
      }))
    };
  }

  async getFinancialMetrics(timeRange: string): Promise<import('../shared/schema.js').FinancialMetrics> {
    // Get department-level salary aggregations
    const departmentCosts = await db.select({
      department: profiles.department,
      totalCost: drizzleSql<number>`sum(${employees.salary})::numeric`,
      employeeCount: drizzleSql<number>`count(*)::int`
    })
      .from(employees)
      .leftJoin(profiles, eq(employees.userId, profiles.id))
      .where(eq(employees.status, 'Active'))
      .groupBy(profiles.department);
    
    const totalPayroll = departmentCosts.reduce((sum, d) => sum + Number(d.totalCost || 0), 0);
    const totalEmployees = departmentCosts.reduce((sum, d) => sum + d.employeeCount, 0);
    const avgSalary = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;
    const benefitsCost = totalPayroll * 0.2; // 20% estimate
    const trainingInvestment = 125000; // Mock value
    const costPerHire = 3200; // Mock value
    const revenuePerEmployee = 185000; // Mock value
    const totalExpenses = benefitsCost + trainingInvestment + (costPerHire * 5); // Estimate
    
    return {
      totalPayroll,
      avgSalary,
      totalExpenses,
      benefitsCost,
      trainingInvestment,
      costPerHire,
      revenuePerEmployee,
      payrollByDepartment: departmentCosts.map(d => ({
        department: d.department || 'Unknown',
        totalCost: Number(d.totalCost || 0),
        employeeCount: d.employeeCount,
        avgSalary: d.employeeCount > 0 ? Number(d.totalCost || 0) / d.employeeCount : 0
      }))
    };
  }

  async getAnalyticsSummary(timeRange: string): Promise<import('../shared/schema.js').AnalyticsSummary> {
    const [workforce, performance, leave, financial] = await Promise.all([
      this.getWorkforceMetrics(timeRange),
      this.getPerformanceMetrics(timeRange),
      this.getLeaveMetrics(timeRange),
      this.getFinancialMetrics(timeRange)
    ]);
    
    return {
      workforce,
      performance,
      leave,
      financial,
      timeRange,
      generatedAt: new Date().toISOString()
    };
  }

  private getDateRange(timeRange: string): { startDate: string; endDate: string } {
    const endDate = new Date().toISOString();
    const start = new Date();
    
    switch (timeRange) {
      case '1m':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3m':
        start.setMonth(start.getMonth() - 3);
        break;
      case '6m':
        start.setMonth(start.getMonth() - 6);
        break;
      case '1y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setMonth(start.getMonth() - 3); // Default to 3 months
    }
    
    return { startDate: start.toISOString(), endDate };
  }
}

export const storage = new DbStorage();
