import { db } from './db.js';
import type { 
  Profile, InsertProfile, 
  Employee, InsertEmployee, EmployeeWithProfile,
  LeaveRequest, InsertLeaveRequest,
  Candidate, InsertCandidate,
  ExpenseCategory, InsertExpenseCategory,
  Expense, InsertExpense,
  ChatChannel, InsertChatChannel,
  ChannelMember, InsertChannelMember,
  ChatMessage, InsertChatMessage,
  MessageReaction, InsertMessageReaction,
  TypingIndicator, InsertTypingIndicator,
  UserPresence, InsertUserPresence,
  ChangeLog, InsertChangeLog,
  HistoricalChange, InsertHistoricalChange,
  ChangeNotification, InsertChangeNotification,
  CelebrationBadge, InsertCelebrationBadge,
  EarnedBadge, InsertEarnedBadge,
  CelebrationHistory, InsertCelebrationHistory,
  CelebrationNotification, InsertCelebrationNotification
} from '../shared/schema.js';
import { 
  profiles, employees, leaveRequests,
  candidates, expenseCategories, expenses,
  chatChannels, channelMembers, chatMessages, messageReactions, typingIndicators, userPresence,
  changeLog, historicalChanges, changeNotifications,
  celebrationBadges, earnedBadges, celebrationHistory, celebrationNotifications
} from '../shared/schema.js';
import { eq, gte, and, desc, or, like, sql as drizzleSql } from 'drizzle-orm';

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
    const result = await db
      .select({
        employee: employees,
        profile: profiles
      })
      .from(employees)
      .leftJoin(profiles, eq(employees.userId, profiles.id));

    return result.map(row => ({
      ...row.employee,
      profile: row.profile ? {
        firstName: row.profile.firstName,
        lastName: row.profile.lastName,
        email: row.profile.email,
        department: row.profile.department,
        role: row.profile.role,
        phone: row.profile.phone,
        avatarUrl: row.profile.profilePicture
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
}

export const storage = new DbStorage();
