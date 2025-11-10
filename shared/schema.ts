import { pgTable, text, uuid, timestamp, integer, numeric, date, boolean, pgEnum, json } from 'drizzle-orm/pg-core';
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
  locationLat: numeric('location_lat', { precision: 10, scale: 7 }),
  locationLon: numeric('location_lon', { precision: 10, scale: 7 }),
  locationCity: text('location_city'),
  locationState: text('location_state'),
  locationZipCode: text('location_zip_code'),
  locationManualOverride: boolean('location_manual_override').default(false),
  canAccessOrgChart: boolean('can_access_org_chart').default(false),
  managerId: uuid('manager_id').references((): any => profiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Announcements table
export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  content: text('content').notNull(),
  priority: text('priority'),
  targetAudienceType: text('target_audience_type'),
  specificEmployeeIds: uuid('specific_employee_ids').array(),
  departments: text('departments').array(),
  locations: text('locations').array(),
  published: boolean('published').default(false),
  publicationDate: timestamp('publication_date'),
  expirationDate: timestamp('expiration_date'),
  creatorUserId: uuid('creator_user_id').references(() => profiles.id).notNull(),
  createdAt: timestamp('created_at').defaultNow()
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

export type EmployeeWithProfile = Employee & {
  profile?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    department: string | null;
    role: string | null;
    phone: string | null;
    avatarUrl: string | null;
  } | null;
};

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
  disqualifiedReason: text('disqualified_reason'),
  disqualifiedDate: timestamp('disqualified_date'),
  previousStatus: text('previous_status'),
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

// Notification types enum
export const notificationTypeEnum = pgEnum('notification_type', [
  'mention',
  'reply',
  'reaction',
  'direct_message',
  'channel_invite',
  'collaborator_invite',
  'collaborator_accepted',
  'leave_request',
  'expense_approval',
  'review_reminder',
  'system'
]);

// User notifications
export const userNotifications = pgTable('user_notifications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  actionUrl: text('action_url'),
  triggeredBy: uuid('triggered_by').references(() => profiles.id),
  relatedId: uuid('related_id'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  readAt: timestamp('read_at')
});

// Collaborator invitation status enum
export const collaboratorInvitationStatusEnum = pgEnum('collaborator_invitation_status', [
  'pending',
  'accepted',
  'declined',
  'cancelled'
]);

// Collaborator invitations
export const collaboratorInvitations = pgTable('collaborator_invitations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  senderId: uuid('sender_id').references(() => profiles.id).notNull(),
  recipientId: uuid('recipient_id').references(() => profiles.id).notNull(),
  recipientEmail: text('recipient_email').notNull(),
  message: text('message'),
  status: collaboratorInvitationStatusEnum('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  respondedAt: timestamp('responded_at'),
  updatedAt: timestamp('updated_at').defaultNow()
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

// Performance Review System Tables

// Review cycles
export const reviewCycles = pgTable('review_cycles', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  reviewType: text('review_type').notNull(), // 'annual' | 'quarterly' | 'probationary' | 'mid_year'
  templateId: uuid('template_id').references(() => reviewQuestionTemplates.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  selfAssessmentDeadline: date('self_assessment_deadline').notNull(),
  managerAssessmentDeadline: date('manager_assessment_deadline').notNull(),
  status: text('status').notNull(), // 'draft' | 'active' | 'completed' | 'archived'
  employeeSelectionCriteria: json('employee_selection_criteria'),
  notificationSettings: json('notification_settings'),
  approvalThresholdAmount: numeric('approval_threshold_amount', { precision: 10, scale: 2 }),
  approvalThresholdPercentage: numeric('approval_threshold_percentage', { precision: 5, scale: 2 }),
  createdBy: uuid('created_by').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Performance reviews
export const performanceReviews = pgTable('performance_reviews', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  reviewCycleId: uuid('review_cycle_id').references(() => reviewCycles.id).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  managerId: uuid('manager_id').references(() => employees.id).notNull(),
  selfAssessmentStatus: text('self_assessment_status').notNull(), // 'not_started' | 'in_progress' | 'submitted'
  managerAssessmentStatus: text('manager_assessment_status').notNull(), // 'not_started' | 'in_progress' | 'submitted'
  selfAssessmentSubmittedAt: timestamp('self_assessment_submitted_at'),
  managerAssessmentSubmittedAt: timestamp('manager_assessment_submitted_at'),
  hrReviewStatus: text('hr_review_status').notNull(), // 'pending' | 'reviewed' | 'approved'
  overallStatus: text('overall_status').notNull(), // 'pending_self' | 'pending_manager' | 'pending_hr' | 'completed'
  selfOverallRating: numeric('self_overall_rating', { precision: 3, scale: 2 }),
  managerOverallRating: numeric('manager_overall_rating', { precision: 3, scale: 2 }),
  finalRating: numeric('final_rating', { precision: 3, scale: 2 }),
  compensationChange: numeric('compensation_change', { precision: 10, scale: 2 }),
  compensationChangeApproved: boolean('compensation_change_approved').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Review questions library
export const reviewQuestionsLibrary = pgTable('review_questions_library', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  questionText: text('question_text').notNull(),
  category: text('category').notNull(),
  weight: numeric('weight', { precision: 3, scale: 2 }).notNull(),
  sortOrder: integer('sort_order').notNull(),
  questionType: text('question_type')
});

// Review question templates
export const reviewQuestionTemplates = pgTable('review_question_templates', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  templateName: text('template_name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow()
});

// Review question assignments
export const reviewQuestionAssignments = pgTable('review_question_assignments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  templateId: uuid('template_id').references(() => reviewQuestionTemplates.id).notNull(),
  questionId: uuid('question_id').references(() => reviewQuestionsLibrary.id).notNull(),
  sortOrder: integer('sort_order').notNull(),
  isRequired: boolean('is_required').default(true)
});

// Review responses
export const reviewResponses = pgTable('review_responses', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  performanceReviewId: uuid('performance_review_id').references(() => performanceReviews.id).notNull(),
  questionId: uuid('question_id').references(() => reviewQuestionsLibrary.id).notNull(),
  responseType: text('response_type').notNull(), // 'self_assessment' | 'manager_assessment'
  rating: numeric('rating', { precision: 3, scale: 2 }),
  textResponse: text('text_response'),
  comments: text('comments'),
  createdAt: timestamp('created_at').defaultNow()
});

// Review goals and comments
export const reviewGoalsComments = pgTable('review_goals_comments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  performanceReviewId: uuid('performance_review_id').references(() => performanceReviews.id).notNull(),
  commentType: text('comment_type').notNull(), // 'self_assessment' | 'manager_assessment'
  achievements: text('achievements'),
  developmentAreas: text('development_areas'),
  goalsNextPeriod: text('goals_next_period'),
  additionalComments: text('additional_comments'),
  createdAt: timestamp('created_at').defaultNow()
});

// Compensation approvals
export const compensationApprovals = pgTable('compensation_approvals', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  performanceReviewId: uuid('performance_review_id').references(() => performanceReviews.id).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  currentSalary: numeric('current_salary', { precision: 10, scale: 2 }).notNull(),
  recommendedSalary: numeric('recommended_salary', { precision: 10, scale: 2 }).notNull(),
  recommendedIncreaseAmount: numeric('recommended_increase_amount', { precision: 10, scale: 2 }).notNull(),
  recommendedIncreasePercentage: numeric('recommended_increase_percentage', { precision: 5, scale: 2 }).notNull(),
  managerId: uuid('manager_id').references(() => employees.id).notNull(),
  managerJustification: text('manager_justification').notNull(),
  hrApprovalStatus: text('hr_approval_status').default('pending'),
  hrApprovedBy: uuid('hr_approved_by').references(() => profiles.id),
  hrApprovedAt: timestamp('hr_approved_at'),
  hrComments: text('hr_comments'),
  hrModifiedAmount: numeric('hr_modified_amount', { precision: 10, scale: 2 }),
  executiveApprovalStatus: text('executive_approval_status').default('pending'),
  executiveApprovedBy: uuid('executive_approved_by').references(() => profiles.id),
  executiveApprovedAt: timestamp('executive_approved_at'),
  executiveComments: text('executive_comments'),
  executiveModifiedAmount: numeric('executive_modified_amount', { precision: 10, scale: 2 }),
  requiresExecutiveApproval: boolean('requires_executive_approval').default(false),
  finalApprovalStatus: text('final_approval_status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Compensation history
export const compensationHistory = pgTable('compensation_history', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  reviewId: uuid('review_id').references(() => performanceReviews.id),
  oldSalary: numeric('old_salary', { precision: 10, scale: 2 }).notNull(),
  newSalary: numeric('new_salary', { precision: 10, scale: 2 }).notNull(),
  changeAmount: numeric('change_amount', { precision: 10, scale: 2 }).notNull(),
  changePercentage: numeric('change_percentage', { precision: 5, scale: 2 }).notNull(),
  effectiveDate: date('effective_date').notNull(),
  reason: text('reason').notNull(),
  notes: text('notes'),
  approvedByManager: uuid('approved_by_manager').references(() => profiles.id),
  approvedByHr: uuid('approved_by_hr').references(() => profiles.id),
  approvedByExecutive: uuid('approved_by_executive').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow()
});

// Performance review history
export const performanceReviewHistory = pgTable('performance_review_history', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  reviewDate: date('review_date').notNull(),
  reviewType: text('review_type').notNull(),
  rating: numeric('rating', { precision: 3, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
});

// Review audit log
export const reviewAuditLog = pgTable('review_audit_log', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  actionType: text('action_type').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  description: text('description').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at').defaultNow()
});

// Insert schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeaveBalanceSchema = createInsertSchema(leaveBalances).omit({ id: true, createdAt: true, updatedAt: true });
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
export const insertUserNotificationSchema = createInsertSchema(userNotifications).omit({ id: true, createdAt: true });
export const insertCollaboratorInvitationSchema = createInsertSchema(collaboratorInvitations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChangeLogSchema = createInsertSchema(changeLog).omit({ id: true, createdAt: true });
export const insertHistoricalChangeSchema = createInsertSchema(historicalChanges).omit({ id: true, createdAt: true });
export const insertChangeNotificationSchema = createInsertSchema(changeNotifications).omit({ id: true, deliveredAt: true });
export const insertCelebrationBadgeSchema = createInsertSchema(celebrationBadges).omit({ id: true, createdAt: true });
export const insertEarnedBadgeSchema = createInsertSchema(earnedBadges).omit({ id: true, earnedAt: true });
export const insertCelebrationHistorySchema = createInsertSchema(celebrationHistory).omit({ id: true, shownAt: true });
export const insertCelebrationNotificationSchema = createInsertSchema(celebrationNotifications).omit({ id: true, createdAt: true });
export const insertReviewCycleSchema = createInsertSchema(reviewCycles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPerformanceReviewSchema = createInsertSchema(performanceReviews).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReviewQuestionLibrarySchema = createInsertSchema(reviewQuestionsLibrary).omit({ id: true });
export const insertReviewQuestionTemplateSchema = createInsertSchema(reviewQuestionTemplates).omit({ id: true, createdAt: true });
export const insertReviewQuestionAssignmentSchema = createInsertSchema(reviewQuestionAssignments).omit({ id: true });
export const insertReviewResponseSchema = createInsertSchema(reviewResponses).omit({ id: true, createdAt: true });
export const insertReviewGoalsCommentsSchema = createInsertSchema(reviewGoalsComments).omit({ id: true, createdAt: true });
export const insertCompensationApprovalSchema = createInsertSchema(compensationApprovals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCompensationHistorySchema = createInsertSchema(compensationHistory).omit({ id: true, createdAt: true });
export const insertPerformanceReviewHistorySchema = createInsertSchema(performanceReviewHistory).omit({ id: true, createdAt: true });
export const insertReviewAuditLogSchema = createInsertSchema(reviewAuditLog).omit({ id: true, createdAt: true });

// Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
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
export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = z.infer<typeof insertUserNotificationSchema>;
export type CollaboratorInvitation = typeof collaboratorInvitations.$inferSelect;
export type InsertCollaboratorInvitation = z.infer<typeof insertCollaboratorInvitationSchema>;
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
export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type InsertLeaveBalance = z.infer<typeof insertLeaveBalanceSchema>;
export type ReviewCycle = typeof reviewCycles.$inferSelect;
export type InsertReviewCycle = z.infer<typeof insertReviewCycleSchema>;
export type PerformanceReview = typeof performanceReviews.$inferSelect;
export type InsertPerformanceReview = z.infer<typeof insertPerformanceReviewSchema>;
export type ReviewQuestionLibrary = typeof reviewQuestionsLibrary.$inferSelect;
export type InsertReviewQuestionLibrary = z.infer<typeof insertReviewQuestionLibrarySchema>;
export type ReviewQuestionTemplate = typeof reviewQuestionTemplates.$inferSelect;
export type InsertReviewQuestionTemplate = z.infer<typeof insertReviewQuestionTemplateSchema>;
export type ReviewQuestionAssignment = typeof reviewQuestionAssignments.$inferSelect;
export type InsertReviewQuestionAssignment = z.infer<typeof insertReviewQuestionAssignmentSchema>;
export type ReviewResponse = typeof reviewResponses.$inferSelect;
export type InsertReviewResponse = z.infer<typeof insertReviewResponseSchema>;
export type ReviewGoalsComments = typeof reviewGoalsComments.$inferSelect;
export type InsertReviewGoalsComments = z.infer<typeof insertReviewGoalsCommentsSchema>;
export type CompensationApproval = typeof compensationApprovals.$inferSelect;
export type InsertCompensationApproval = z.infer<typeof insertCompensationApprovalSchema>;
export type CompensationHistory = typeof compensationHistory.$inferSelect;
export type InsertCompensationHistory = z.infer<typeof insertCompensationHistorySchema>;
export type PerformanceReviewHistory = typeof performanceReviewHistory.$inferSelect;
export type InsertPerformanceReviewHistory = z.infer<typeof insertPerformanceReviewHistorySchema>;
export type ReviewAuditLog = typeof reviewAuditLog.$inferSelect;
export type InsertReviewAuditLog = z.infer<typeof insertReviewAuditLogSchema>;

// Dashboard Stats type
export interface DashboardStats {
  ptoBalance: {
    total: number;
    breakdown: {
      vacation: number;
      sick: number;
      personal: number;
    };
  } | null;
  nextPayday: string | null;
  pendingTasks: {
    count: number;
    awaitingApprovalFor?: number; // For managers: tasks awaiting their approval
  };
  team?: {
    size: number;
    memberIds?: string[];
  };
  events: {
    upcomingCount: number;
    nextEvent?: {
      id: string;
      title: string;
      date: string;
      type: string;
    };
  };
}

// User Permissions type
export interface UserPermissions {
  department: string | null;
  role: string | null;
  canAccessOrgChart: boolean;
  managerId: string | null;
}
