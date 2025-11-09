import { pgTable, text, uuid, timestamp, integer, numeric, date, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

// Enums
export const employmentTypeEnum = pgEnum('employment_type', ['Full-time', 'Part-time', 'Contract', 'Intern']);
export const employeeStatusEnum = pgEnum('employee_status', ['Active', 'On Leave', 'Terminated', 'Pending']);
export const leaveTypeEnum = pgEnum('leave_type', ['Vacation', 'Sick', 'Personal', 'Bereavement', 'Maternity', 'Paternity', 'FMLA']);
export const leaveStatusEnum = pgEnum('leave_status', ['Pending', 'Approved', 'Denied', 'Cancelled']);

// Profiles table
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').unique().notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  profilePicture: text('profile_picture'),
  department: text('department'),
  role: text('role'),
  dateOfBirth: date('date_of_birth'),
  hireDate: date('hire_date'),
  lastBirthdayShown: date('last_birthday_shown'),
  lastAnniversaryShown: date('last_anniversary_shown'),
  languagePreference: text('language_preference').default('en'),
  themePreference: text('theme_preference').default('light'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Departments table
export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').unique().notNull(),
  description: text('description'),
  managerId: uuid('manager_id').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow()
});

// Job titles table
export const jobTitles = pgTable('job_titles', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow()
});

// Employees table
export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => profiles.id),
  employeeId: text('employee_id').unique().notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  jobTitleId: uuid('job_title_id').references(() => jobTitles.id),
  managerId: uuid('manager_id').references((): any => employees.id),
  startDate: date('start_date').notNull(),
  employmentType: employmentTypeEnum('employment_type').default('Full-time'),
  salary: numeric('salary', { precision: 10, scale: 2 }),
  status: employeeStatusEnum('status').default('Active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Leave requests table
export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  type: leaveTypeEnum('type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  days: integer('days').notNull(),
  status: leaveStatusEnum('status').default('Pending'),
  reason: text('reason').notNull(),
  approverId: uuid('approver_id').references(() => employees.id),
  coverageArrangements: text('coverage_arrangements'),
  emergencyContact: text('emergency_contact'),
  medicalCertification: boolean('medical_certification').default(false),
  notes: text('notes'),
  submittedDate: timestamp('submitted_date').defaultNow(),
  approvedDate: timestamp('approved_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Leave balances table
export const leaveBalances = pgTable('leave_balances', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  vacationDays: numeric('vacation_days', { precision: 5, scale: 2 }).default('20.0'),
  sickDays: numeric('sick_days', { precision: 5, scale: 2 }).default('10.0'),
  personalDays: numeric('personal_days', { precision: 5, scale: 2 }).default('5.0'),
  year: integer('year').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Candidates table (for hiring/recruitment)
export const candidates = pgTable('candidates', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  phone: text('phone'),
  position: text('position').notNull(),
  department: text('department').notNull(),
  experience: text('experience'),
  location: text('location'),
  salaryExpectation: numeric('salary_expectation', { precision: 10, scale: 2 }),
  appliedDate: date('applied_date').defaultNow(),
  status: text('status').default('New Candidate'),
  skills: text('skills').array(),
  education: text('education'),
  previousCompany: text('previous_company'),
  profilePicture: text('profile_picture'),
  likes: integer('likes').default(0),
  views: integer('views').default(0),
  commentsCount: integer('comments_count').default(0),
  aiMatchScore: integer('ai_match_score').default(0),
  rating: integer('rating').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Candidate collaborators (hiring team collaboration)
export const candidateCollaborators = pgTable('candidate_collaborators', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  candidateId: uuid('candidate_id').references(() => candidates.id).notNull(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  invitedBy: uuid('invited_by').references(() => profiles.id).notNull(),
  role: text('role').notNull(),
  status: text('status').default('pending'),
  invitedAt: timestamp('invited_at').defaultNow(),
  respondedAt: timestamp('responded_at')
});

// Candidate comments
export const candidateComments = pgTable('candidate_comments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  candidateId: uuid('candidate_id').references(() => candidates.id).notNull(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  commentText: text('comment_text').notNull(),
  isPrivate: boolean('is_private').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// Candidate ratings
export const candidateRatings = pgTable('candidate_ratings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  candidateId: uuid('candidate_id').references(() => candidates.id).notNull(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  rating: integer('rating').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// New hires (candidates converted to hires)
export const newHires = pgTable('new_hires', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').unique().notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  position: text('position').notNull(),
  department: text('department').notNull(),
  startDate: date('start_date').notNull(),
  salary: numeric('salary', { precision: 10, scale: 2 }),
  managerId: uuid('manager_id').references(() => employees.id),
  status: text('status').default('Pending'),
  createdAt: timestamp('created_at').defaultNow()
});

// Currencies table (for payroll)
export const currencies = pgTable('currencies', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  code: text('code').unique().notNull(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// Expense categories
export const expenseCategories = pgTable('custom_expense_categories', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  icon: text('icon'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// Expense vendors
export const expenseVendors = pgTable('expense_vendors', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  category: text('category'),
  createdAt: timestamp('created_at').defaultNow()
});

// Expenses
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  categoryId: uuid('category_id').references(() => expenseCategories.id),
  vendorId: uuid('vendor_id').references(() => expenseVendors.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  description: text('description'),
  date: date('date').notNull(),
  status: text('status').default('pending'),
  receiptUrl: text('receipt_url'),
  reportingToAtSubmission: uuid('reporting_to_at_submission').references(() => employees.id),
  submittedAt: timestamp('submitted_at').defaultNow(),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// Employee expense enrollment
export const employeeExpenseEnrollment = pgTable('employee_expense_enrollment', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  isEnrolled: boolean('is_enrolled').default(false),
  enrolledAt: timestamp('enrolled_at')
});

// Chat channels
export const chatChannels = pgTable('chat_channels', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  channelType: text('channel_type').notNull(),
  department: text('department'),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdBy: uuid('created_by').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Channel members
export const channelMembers = pgTable('channel_members', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  channelId: uuid('channel_id').references(() => chatChannels.id).notNull(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  role: text('role').default('member'),
  joinedAt: timestamp('joined_at').defaultNow(),
  lastReadAt: timestamp('last_read_at').defaultNow(),
  notificationsEnabled: boolean('notifications_enabled').default(true)
});

// Chat messages
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  channelId: uuid('channel_id').references(() => chatChannels.id).notNull(),
  senderId: uuid('sender_id').references(() => profiles.id),
  encryptedContent: text('encrypted_content').notNull(),
  messageType: text('message_type').default('text'),
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  fileSize: integer('file_size'),
  replyToMessageId: uuid('reply_to_message_id').references((): any => chatMessages.id),
  editedAt: timestamp('edited_at'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// Message reactions
export const messageReactions = pgTable('message_reactions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  messageId: uuid('message_id').references(() => chatMessages.id).notNull(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  emoji: text('emoji').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Typing indicators
export const typingIndicators = pgTable('typing_indicators', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  channelId: uuid('channel_id').references(() => chatChannels.id).notNull(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  startedTypingAt: timestamp('started_typing_at').defaultNow()
});

// User presence
export const userPresence = pgTable('user_presence', {
  userId: uuid('user_id').primaryKey().references(() => profiles.id).notNull(),
  status: text('status').default('offline'),
  lastSeenAt: timestamp('last_seen_at').defaultNow()
});

// Change log
export const changeLog = pgTable('change_log', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  changeType: text('change_type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  affectedModules: text('affected_modules').array(),
  impactLevel: text('impact_level').notNull(),
  visibilityScope: text('visibility_scope').notNull(),
  userId: uuid('user_id').references(() => profiles.id),
  technicalDetails: text('technical_details'),
  notificationSent: boolean('notification_sent').default(false),
  version: text('version'),
  createdAt: timestamp('created_at').defaultNow()
});

// Historical changes
export const historicalChanges = pgTable('historical_changes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  changeDate: timestamp('change_date').notNull(),
  changeType: text('change_type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow()
});

// Change notifications
export const changeNotifications = pgTable('change_notifications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  changeLogId: uuid('change_log_id').references(() => changeLog.id).notNull(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  notificationType: text('notification_type').notNull(),
  deliveredAt: timestamp('delivered_at').defaultNow(),
  readAt: timestamp('read_at'),
  acknowledged: boolean('acknowledged').default(false)
});

// Celebration badges
export const celebrationBadges = pgTable('celebration_badges', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  yearNumber: integer('year_number').notNull(),
  badgeTitle: text('badge_title').notNull(),
  badgeDescription: text('badge_description'),
  badgeColor: text('badge_color').notNull(),
  badgeIcon: text('badge_icon').notNull(),
  tierName: text('tier_name').notNull(),
  isMilestone: boolean('is_milestone').default(false),
  sortOrder: integer('sort_order').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Earned badges
export const earnedBadges = pgTable('earned_badges', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  badgeId: uuid('badge_id').references(() => celebrationBadges.id).notNull(),
  earnedAt: timestamp('earned_at').defaultNow(),
  viewedAt: timestamp('viewed_at'),
  isNew: boolean('is_new').default(true)
});

// Celebration history
export const celebrationHistory = pgTable('celebration_history', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  type: text('type').notNull(),
  celebrationDate: text('celebration_date').notNull(),
  yearsCount: integer('years_count'),
  isMilestone: boolean('is_milestone').default(false),
  shownAt: timestamp('shown_at').defaultNow(),
  dismissedAt: timestamp('dismissed_at'),
  replayCount: integer('replay_count').default(0)
});

// Celebration notifications
export const celebrationNotifications = pgTable('celebration_notifications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  type: text('type').notNull(),
  celebrationDate: text('celebration_date').notNull(),
  yearsCount: integer('years_count'),
  isMilestone: boolean('is_milestone').default(false),
  badgeId: uuid('badge_id').references(() => celebrationBadges.id),
  messageTitle: text('message_title').notNull(),
  messageBody: text('message_body').notNull(),
  canReplay: boolean('can_replay').default(true),
  expiresAt: text('expires_at').notNull(),
  viewedAt: timestamp('viewed_at'),
  dismissedAt: timestamp('dismissed_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// Insert schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCandidateSchema = createInsertSchema(candidates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCurrencySchema = createInsertSchema(currencies).omit({ id: true, createdAt: true });
export const insertExpenseCategorySchema = createInsertSchema(expenseCategories).omit({ id: true, createdAt: true });
export const insertExpenseVendorSchema = createInsertSchema(expenseVendors).omit({ id: true, createdAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export const insertChatChannelSchema = createInsertSchema(chatChannels).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChannelMemberSchema = createInsertSchema(channelMembers).omit({ id: true, joinedAt: true, lastReadAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertMessageReactionSchema = createInsertSchema(messageReactions).omit({ id: true, createdAt: true });
export const insertTypingIndicatorSchema = createInsertSchema(typingIndicators).omit({ id: true, startedTypingAt: true });
export const insertUserPresenceSchema = createInsertSchema(userPresence).omit({ lastSeenAt: true });
export const insertChangeLogSchema = createInsertSchema(changeLog).omit({ id: true, createdAt: true });
export const insertHistoricalChangeSchema = createInsertSchema(historicalChanges).omit({ id: true, createdAt: true });
export const insertChangeNotificationSchema = createInsertSchema(changeNotifications).omit({ id: true, deliveredAt: true });
export const insertCelebrationBadgeSchema = createInsertSchema(celebrationBadges).omit({ id: true, createdAt: true });
export const insertEarnedBadgeSchema = createInsertSchema(earnedBadges).omit({ id: true, earnedAt: true });
export const insertCelebrationHistorySchema = createInsertSchema(celebrationHistory).omit({ id: true, shownAt: true });
export const insertCelebrationNotificationSchema = createInsertSchema(celebrationNotifications).omit({ id: true, createdAt: true });

// Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Currency = typeof currencies.$inferSelect;
export type InsertCurrency = z.infer<typeof insertCurrencySchema>;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;
export type ExpenseVendor = typeof expenseVendors.$inferSelect;
export type InsertExpenseVendor = z.infer<typeof insertExpenseVendorSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type ChatChannel = typeof chatChannels.$inferSelect;
export type InsertChatChannel = z.infer<typeof insertChatChannelSchema>;
export type ChannelMember = typeof channelMembers.$inferSelect;
export type InsertChannelMember = z.infer<typeof insertChannelMemberSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type TypingIndicator = typeof typingIndicators.$inferSelect;
export type InsertTypingIndicator = z.infer<typeof insertTypingIndicatorSchema>;
export type UserPresence = typeof userPresence.$inferSelect;
export type InsertUserPresence = z.infer<typeof insertUserPresenceSchema>;
export type ChangeLog = typeof changeLog.$inferSelect;
export type InsertChangeLog = z.infer<typeof insertChangeLogSchema>;
export type HistoricalChange = typeof historicalChanges.$inferSelect;
export type InsertHistoricalChange = z.infer<typeof insertHistoricalChangeSchema>;
export type ChangeNotification = typeof changeNotifications.$inferSelect;
export type InsertChangeNotification = z.infer<typeof insertChangeNotificationSchema>;
export type CelebrationBadge = typeof celebrationBadges.$inferSelect;
export type InsertCelebrationBadge = z.infer<typeof insertCelebrationBadgeSchema>;
export type EarnedBadge = typeof earnedBadges.$inferSelect;
export type InsertEarnedBadge = z.infer<typeof insertEarnedBadgeSchema>;
export type CelebrationHistory = typeof celebrationHistory.$inferSelect;
export type InsertCelebrationHistory = z.infer<typeof insertCelebrationHistorySchema>;
export type CelebrationNotification = typeof celebrationNotifications.$inferSelect;
export type InsertCelebrationNotification = z.infer<typeof insertCelebrationNotificationSchema>;
