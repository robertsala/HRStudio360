import { db } from './db.js';
import type { 
  Profile, InsertProfile, 
  Employee, InsertEmployee, 
  LeaveRequest, InsertLeaveRequest,
  Candidate, InsertCandidate,
  Expense, InsertExpense,
  ChatChannel, InsertChatChannel,
  ChatMessage, InsertChatMessage,
  CelebrationBadge, InsertCelebrationBadge,
  EarnedBadge, InsertEarnedBadge,
  CelebrationHistory, InsertCelebrationHistory,
  CelebrationNotification, InsertCelebrationNotification
} from '../shared/schema.js';
import { 
  profiles, employees, leaveRequests, departments, jobTitles, leaveBalances,
  candidates, candidateCollaborators, candidateComments, candidateRatings, newHires,
  currencies, expenseCategories, expenseVendors, expenses, employeeExpenseEnrollment,
  chatChannels, channelMembers, chatMessages,
  celebrationBadges, earnedBadges, celebrationHistory, celebrationNotifications
} from '../shared/schema.js';
import { eq, gte, and } from 'drizzle-orm';

export interface IStorage {
  // Profiles
  getProfiles(): Promise<Profile[]>;
  getProfileById(id: string): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  
  // Employees
  getEmployees(): Promise<Employee[]>;
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

  // Expenses
  getExpenses(): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;

  // Channels
  getChannels(): Promise<ChatChannel[]>;
  getChannelById(id: string): Promise<ChatChannel | undefined>;
  createChannel(channel: InsertChatChannel): Promise<ChatChannel>;

  // Messages
  getMessages(channelId: string): Promise<ChatMessage[]>;
  createMessage(message: InsertChatMessage): Promise<ChatMessage>;
  updateMessage(id: string, message: Partial<InsertChatMessage>): Promise<ChatMessage | undefined>;

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

  // Channels
  async getChannels(): Promise<ChatChannel[]> {
    return db.select().from(chatChannels);
  }

  async getChannelById(id: string): Promise<ChatChannel | undefined> {
    const result = await db.select().from(chatChannels).where(eq(chatChannels.id, id));
    return result[0];
  }

  async createChannel(channel: InsertChatChannel): Promise<ChatChannel> {
    const result = await db.insert(chatChannels).values(channel).returning();
    return result[0];
  }

  // Messages
  async getMessages(channelId: string): Promise<ChatMessage[]> {
    return db.select().from(chatMessages).where(eq(chatMessages.channelId, channelId));
  }

  async createMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  async updateMessage(id: string, message: Partial<InsertChatMessage>): Promise<ChatMessage | undefined> {
    const result = await db.update(chatMessages).set(message).where(eq(chatMessages.id, id)).returning();
    return result[0];
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
