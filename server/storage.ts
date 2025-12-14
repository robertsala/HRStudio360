import { db } from './db.js';
import type { 
  Profile, InsertProfile,
  AuthCredential, InsertAuthCredential,
  Announcement, InsertAnnouncement,
  Employee, InsertEmployee, EmployeeWithProfile,
  LeaveRequest, InsertLeaveRequest,
  LeaveBalance, InsertLeaveBalance,
  Candidate, InsertCandidate,
  ExpenseCategory,
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
  CelebrationBadge,
  EarnedBadge, InsertEarnedBadge,
  CelebrationHistory, InsertCelebrationHistory,
  CelebrationNotification, InsertCelebrationNotification,
  ReviewCycle, InsertReviewCycle,
  PaycheckFunFact, InsertPaycheckFunFact,
  EmployeeFunFactHistory, InsertEmployeeFunFactHistory,
  DailyFunFactUsage, InsertDailyFunFactUsage,
  DashboardWidgetPreset, InsertDashboardWidgetPreset,
  UserDashboardPreference,
  TimesheetEntry, InsertTimesheetEntry,
  TimesheetApproval, InsertTimesheetApproval,
  PayrollLock, InsertPayrollLock,
  Permission, InsertPermission,
  RolePermission, InsertRolePermission,
  TimesheetCorrectionRequest, InsertTimesheetCorrectionRequest,
  TimesheetChangeAudit, InsertTimesheetChangeAudit,
  PermissionTemplate, InsertPermissionTemplate,
  RoleHierarchy, InsertRoleHierarchy,
  TimeBasedPermissionGrant, InsertTimeBasedPermissionGrant,
  PermissionRequest, InsertPermissionRequest,
  PermissionChangeAudit, InsertPermissionChangeAudit,
  AccessLevel, InsertAccessLevel,
  EmployeeAccessAssignment, InsertEmployeeAccessAssignment,
  CallSession, InsertCallSession,
  CallParticipant, InsertCallParticipant,
  CallSignaling, InsertCallSignaling,
  OnboardingChecklist, InsertOnboardingChecklist,
  OnboardingTask, InsertOnboardingTask,
  I9Form, InsertI9Form,
  StateTaxForm, InsertStateTaxForm,
  OnboardingDocument, InsertOnboardingDocument,
  ComplianceFramework, InsertComplianceFramework,
  ComplianceControl, InsertComplianceControl,
  ComplianceEvidence, InsertComplianceEvidence,
  ComplianceAlert, InsertComplianceAlert,
  ComplianceAuditTrail, InsertComplianceAuditTrail,
  CompliancePolicy, InsertCompliancePolicy,
  PolicyAcknowledgment, InsertPolicyAcknowledgment,
  RegulatoryUpdate, InsertRegulatoryUpdate,
  ComplianceMetrics, InsertComplianceMetrics,
  EVerifyCase, InsertEVerifyCase,
  EVerifyCaseHistory, InsertEVerifyCaseHistory
} from '../shared/schema.js';
import { 
  profiles, authCredentials, addressChangeRequests, announcements, employees, leaveRequests, leaveBalances,
  candidates, newHires, onboardingChecklists, onboardingTasks, i9Forms, stateTaxForms, onboardingDocuments,
  expenseCategories, expenses, departments,
  chatChannels, channelMembers, chatMessages, messageReactions, typingIndicators, userPresence,
  userNotifications, collaboratorInvitations,
  changeLog, historicalChanges, changeNotifications,
  celebrationBadges, earnedBadges, celebrationHistory, celebrationNotifications,
  reviewCycles,
  jobPostings, applications, resumeData, interviewStages, applicationActivityLog, applicationStageTransitions, teamAssignments,
  paycheckFunFacts, employeeFunFactHistory, dailyFunFactUsage,
  dashboardWidgetPresets, userDashboardPreferences,
  taxJurisdictions, reciprocalAgreements, employeeTaxConfiguration, taxDataSources, aiTaxSuggestions, autoFixAuditLog,
  timesheetEntries, timesheetApprovals, payrollLocks,
  permissions, rolePermissions, timesheetCorrectionRequests, timesheetChangeAudit,
  permissionTemplates, roleHierarchy, timeBasedPermissionGrants, permissionRequests, permissionChangeAudit,
  accessLevels, employeeAccessAssignments,
  callSessions, callParticipants, callSignaling,
  complianceFrameworks, complianceControls, complianceEvidence, complianceAlerts,
  complianceAuditTrail, compliancePolicies, policyAcknowledgments, regulatoryUpdates, complianceMetrics,
  eVerifyCases, eVerifyCaseHistory
} from '../shared/schema.js';
import { eq, gte, and, desc, or, sql as drizzleSql, isNull, isNotNull, lte, notInArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export interface IStorage {
  // Profiles
  getProfiles(): Promise<Profile[]>;
  getProfileById(id: string): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  
  // Address Change Requests
  getPendingAddressChangeRequests(): Promise<any[]>;
  getAddressChangeRequestsByProfileId(profileId: string): Promise<any[]>;
  createAddressChangeRequest(request: any): Promise<any>;
  approveAddressChangeRequest(id: string, reviewedBy: string, reviewNotes?: string): Promise<any>;
  rejectAddressChangeRequest(id: string, reviewedBy: string, reviewNotes?: string): Promise<any>;
  
  // Auth Credentials
  createAuthCredential(credential: InsertAuthCredential): Promise<AuthCredential>;
  getAuthCredentialByProfileId(profileId: string): Promise<AuthCredential | undefined>;
  updateAuthCredential(profileId: string, updates: Partial<InsertAuthCredential>): Promise<AuthCredential | undefined>;
  incrementFailedLoginAttempts(profileId: string): Promise<void>;
  resetFailedLoginAttempts(profileId: string): Promise<void>;
  lockAccount(profileId: string, lockedUntil: Date): Promise<void>;
  
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
  getCandidateByEmail(email: string): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: string, candidate: Partial<InsertCandidate>): Promise<Candidate | undefined>;
  
  // ATS - Job Postings
  getActiveJobPostings(): Promise<any[]>;
  getAllJobPostings(): Promise<any[]>;
  getJobPostingById(id: string): Promise<any | undefined>;
  createJobPosting(job: any): Promise<any>;
  updateJobPosting(id: string, job: any): Promise<any | undefined>;
  incrementJobPostingViews(id: string): Promise<void>;
  incrementJobPostingApplications(id: string): Promise<void>;
  createDefaultInterviewStages(jobId: string): Promise<void>;
  
  // ATS - Applications
  getAllApplications(): Promise<any[]>;
  getApplicationsByJob(jobId: string): Promise<any[]>;
  getApplicationById(id: string): Promise<any | undefined>;
  getApplicationByJobAndCandidate(jobId: string, candidateId: string): Promise<any | undefined>;
  createApplication(application: any): Promise<any>;
  updateApplication(id: string, application: any): Promise<any | undefined>;
  
  // ATS - Resume Data
  createResumeData(data: any): Promise<any>;
  getResumeDataById(id: string): Promise<any | undefined>;
  
  // ATS - Interview Stages
  getInterviewStagesByJob(jobId: string): Promise<any[]>;
  getDefaultInterviewStage(jobId: string): Promise<any | undefined>;
  createInterviewStage(stage: any): Promise<any>;
  
  // ATS - Activity Logging
  createApplicationActivityLog(log: any): Promise<any>;
  createApplicationStageTransition(transition: any): Promise<any>;
  
  // ATS - Team Assignments
  getTeamAssignmentsByJob(jobId: string): Promise<any[]>;
  createTeamAssignment(assignment: any): Promise<any>;

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
  getAllUserPresence(): Promise<UserPresence[]>;
  
  // Call Sessions
  createCallSession(session: InsertCallSession): Promise<CallSession>;
  getCallSessionById(id: string): Promise<CallSession | undefined>;
  updateCallSession(id: string, session: Partial<InsertCallSession>): Promise<CallSession | undefined>;
  addCallParticipant(participant: InsertCallParticipant): Promise<CallParticipant>;
  updateCallParticipant(id: string, participant: Partial<InsertCallParticipant>): Promise<CallParticipant | undefined>;
  getCallParticipants(callSessionId: string): Promise<CallParticipant[]>;
  createCallSignal(signal: InsertCallSignaling): Promise<CallSignaling>;
  getCallSignals(callSessionId: string, fromTime?: Date): Promise<CallSignaling[]>;
  
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
  
  // Performance Reviews
  getPerformanceReviews(cycleId?: string): Promise<any[]>;
  getPerformanceReviewById(id: string): Promise<any | undefined>;
  
  // Dashboard Stats
  getDashboardStats(userId: string): Promise<import('../shared/schema.js').DashboardStats>;
  
  // Announcements
  getPublishedAnnouncements(limit?: number): Promise<import('../shared/schema.js').Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: string): Promise<void>;
  markAnnouncementAsRead(announcementId: string, userId: string): Promise<void>;
  
  // User Permissions
  getUserPermissions(userId: string): Promise<import('../shared/schema.js').UserPermissions>;
  
  // New Hires
  getNewHires(): Promise<import('../shared/schema.js').NewHire[]>;
  getNewHireById(id: string): Promise<import('../shared/schema.js').NewHire | undefined>;
  createNewHire(newHire: import('../shared/schema.js').InsertNewHire): Promise<import('../shared/schema.js').NewHire>;
  getNewHireByEmail(email: string): Promise<import('../shared/schema.js').NewHire | undefined>;
  updateNewHire(id: string, newHire: Partial<import('../shared/schema.js').InsertNewHire>): Promise<import('../shared/schema.js').NewHire | undefined>;
  
  // Onboarding Checklists
  getOnboardingChecklists(): Promise<OnboardingChecklist[]>;
  getOnboardingChecklistById(id: string): Promise<OnboardingChecklist | undefined>;
  getOnboardingChecklistByNewHireId(newHireId: string): Promise<OnboardingChecklist | undefined>;
  createOnboardingChecklist(checklist: InsertOnboardingChecklist): Promise<OnboardingChecklist>;
  updateOnboardingChecklist(id: string, checklist: Partial<InsertOnboardingChecklist>): Promise<OnboardingChecklist | undefined>;
  
  // Onboarding Tasks
  getOnboardingTasks(checklistId: string): Promise<OnboardingTask[]>;
  getOnboardingTaskById(id: string): Promise<OnboardingTask | undefined>;
  createOnboardingTask(task: InsertOnboardingTask): Promise<OnboardingTask>;
  updateOnboardingTask(id: string, task: Partial<InsertOnboardingTask>): Promise<OnboardingTask | undefined>;
  completeOnboardingTask(id: string, completedBy: string): Promise<OnboardingTask | undefined>;
  
  // I-9 Forms
  getI9Forms(): Promise<I9Form[]>;
  getI9FormById(id: string): Promise<I9Form | undefined>;
  getI9FormByNewHireId(newHireId: string): Promise<I9Form | undefined>;
  createI9Form(form: InsertI9Form): Promise<I9Form>;
  updateI9Form(id: string, form: Partial<InsertI9Form>): Promise<I9Form | undefined>;
  updateI9FormSection1(id: string, data: any): Promise<I9Form | undefined>;
  updateI9FormSection2(id: string, data: any, completedBy: string): Promise<I9Form | undefined>;
  
  // State Tax Forms
  getStateTaxForms(newHireId: string): Promise<StateTaxForm[]>;
  getStateTaxFormById(id: string): Promise<StateTaxForm | undefined>;
  getStateTaxFormByNewHireAndState(newHireId: string, state: string): Promise<StateTaxForm | undefined>;
  createStateTaxForm(form: InsertStateTaxForm): Promise<StateTaxForm>;
  updateStateTaxForm(id: string, form: Partial<InsertStateTaxForm>): Promise<StateTaxForm | undefined>;
  
  // Onboarding Documents
  getOnboardingDocuments(newHireId: string): Promise<OnboardingDocument[]>;
  getOnboardingDocumentById(id: string): Promise<OnboardingDocument | undefined>;
  createOnboardingDocument(document: InsertOnboardingDocument): Promise<OnboardingDocument>;
  updateOnboardingDocument(id: string, document: Partial<InsertOnboardingDocument>): Promise<OnboardingDocument | undefined>;
  
  // Analytics
  getWorkforceMetrics(timeRange: string): Promise<import('../shared/schema.js').WorkforceMetrics>;
  getPerformanceMetrics(timeRange: string): Promise<import('../shared/schema.js').PerformanceMetrics>;
  getLeaveMetrics(timeRange: string): Promise<import('../shared/schema.js').LeaveMetrics>;
  getFinancialMetrics(timeRange: string): Promise<import('../shared/schema.js').FinancialMetrics>;
  getAnalyticsSummary(timeRange: string): Promise<import('../shared/schema.js').AnalyticsSummary>;

  // Fun Facts
  getRandomFunFact(netPayAmount: number, employeeId: string, excludeFactIds?: string[]): Promise<PaycheckFunFact | undefined>;
  saveFunFactHistory(employeeId: string, funFactId: string, funFactText: string, payStubId?: string): Promise<EmployeeFunFactHistory>;
  getDailyUsageInfo(employeeId: string): Promise<{ count: number; limit: number; remaining: number }>;
  trackManualFunFactGeneration(employeeId: string, funFactId: string): Promise<void>;

  // Dashboard Widget Customization (Phase 1: Read-only + seeding)
  getDashboardWidgetPresets(): Promise<DashboardWidgetPreset[]>;
  bulkCreateDashboardWidgetPresets(presets: InsertDashboardWidgetPreset[]): Promise<DashboardWidgetPreset[]>;
  getUserDashboardPreferences(userId: string): Promise<UserDashboardPreference[]>;

  // Tax Jurisdictions
  getTaxJurisdictions(): Promise<import('../shared/schema.js').TaxJurisdiction[]>;
  getTaxJurisdictionById(id: string): Promise<import('../shared/schema.js').TaxJurisdiction | undefined>;
  getTaxJurisdictionByState(stateCode: string): Promise<import('../shared/schema.js').TaxJurisdiction | undefined>;
  getTaxJurisdictionByCity(stateCode: string, cityName: string): Promise<import('../shared/schema.js').TaxJurisdiction | undefined>;
  createTaxJurisdiction(jurisdiction: import('../shared/schema.js').InsertTaxJurisdiction): Promise<import('../shared/schema.js').TaxJurisdiction>;
  updateTaxJurisdiction(id: string, jurisdiction: Partial<import('../shared/schema.js').InsertTaxJurisdiction>): Promise<import('../shared/schema.js').TaxJurisdiction | undefined>;
  deleteTaxJurisdiction(id: string): Promise<void>;

  // Reciprocal Agreements
  getReciprocalAgreements(): Promise<import('../shared/schema.js').ReciprocalAgreement[]>;
  getReciprocalAgreementById(id: string): Promise<import('../shared/schema.js').ReciprocalAgreement | undefined>;
  getReciprocalAgreementByStates(workState: string, residenceState: string): Promise<import('../shared/schema.js').ReciprocalAgreement | undefined>;
  createReciprocalAgreement(agreement: import('../shared/schema.js').InsertReciprocalAgreement): Promise<import('../shared/schema.js').ReciprocalAgreement>;
  updateReciprocalAgreement(id: string, agreement: Partial<import('../shared/schema.js').InsertReciprocalAgreement>): Promise<import('../shared/schema.js').ReciprocalAgreement | undefined>;
  deleteReciprocalAgreement(id: string): Promise<void>;

  // Employee Tax Configuration
  getEmployeeTaxConfiguration(employeeId: string): Promise<import('../shared/schema.js').EmployeeTaxConfiguration | undefined>;
  createEmployeeTaxConfiguration(config: import('../shared/schema.js').InsertEmployeeTaxConfiguration): Promise<import('../shared/schema.js').EmployeeTaxConfiguration>;
  updateEmployeeTaxConfiguration(id: string, config: Partial<import('../shared/schema.js').InsertEmployeeTaxConfiguration>): Promise<import('../shared/schema.js').EmployeeTaxConfiguration | undefined>;

  // Tax Data Sources
  getTaxDataSources(): Promise<import('../shared/schema.js').TaxDataSource[]>;
  getTaxDataSourceById(id: string): Promise<import('../shared/schema.js').TaxDataSource | undefined>;
  getTaxDataSourcesByType(dataType: string, taxYear?: number): Promise<import('../shared/schema.js').TaxDataSource[]>;
  createTaxDataSource(source: import('../shared/schema.js').InsertTaxDataSource): Promise<import('../shared/schema.js').TaxDataSource>;
  updateTaxDataSource(id: string, source: Partial<import('../shared/schema.js').InsertTaxDataSource>): Promise<import('../shared/schema.js').TaxDataSource | undefined>;

  // AI Tax Suggestions
  getAiTaxSuggestions(status?: string): Promise<import('../shared/schema.js').AiTaxSuggestion[]>;
  getAiTaxSuggestionById(id: string): Promise<import('../shared/schema.js').AiTaxSuggestion | undefined>;
  createAiTaxSuggestion(suggestion: import('../shared/schema.js').InsertAiTaxSuggestion): Promise<import('../shared/schema.js').AiTaxSuggestion>;
  updateAiTaxSuggestion(id: string, suggestion: Partial<import('../shared/schema.js').InsertAiTaxSuggestion>): Promise<import('../shared/schema.js').AiTaxSuggestion | undefined>;

  // Auto-fix Audit Log
  getAutoFixAuditLogs(): Promise<import('../shared/schema.js').AutoFixAuditLog[]>;
  getAutoFixAuditLogById(id: string): Promise<import('../shared/schema.js').AutoFixAuditLog | undefined>;
  createAutoFixAuditLog(log: import('../shared/schema.js').InsertAutoFixAuditLog): Promise<import('../shared/schema.js').AutoFixAuditLog>;

  // Timesheet Management
  getTimesheetEntries(payPeriodStart: string, payPeriodEnd: string): Promise<TimesheetEntry[]>;
  getTimesheetEntryByEmployeeAndPeriod(employeeId: string, payPeriodStart: string, payPeriodEnd: string): Promise<TimesheetEntry | undefined>;
  createTimesheetEntry(entry: InsertTimesheetEntry): Promise<TimesheetEntry>;
  updateTimesheetEntry(id: string, entry: Partial<InsertTimesheetEntry>): Promise<TimesheetEntry | undefined>;
  bulkCreateTimesheetEntries(entries: InsertTimesheetEntry[]): Promise<TimesheetEntry[]>;
  getApprovedTimesheetsByPeriod(payPeriodStart: string, payPeriodEnd: string): Promise<TimesheetEntry[]>;
  
  // Timesheet Approvals
  createTimesheetApproval(approval: InsertTimesheetApproval): Promise<TimesheetApproval>;
  getTimesheetApprovalsByTimesheetId(timesheetId: string): Promise<TimesheetApproval[]>;
  
  // Payroll Locks
  getPayrollLock(payPeriodStart: string, payPeriodEnd: string): Promise<PayrollLock | undefined>;
  createPayrollLock(lock: InsertPayrollLock): Promise<PayrollLock>;
  updatePayrollLock(id: string, lock: Partial<InsertPayrollLock>): Promise<PayrollLock | undefined>;

  // Permission Management
  getPermissions(): Promise<import('../shared/schema.js').Permission[]>;
  getPermissionById(id: string): Promise<import('../shared/schema.js').Permission | undefined>;
  getPermissionByCode(code: string): Promise<import('../shared/schema.js').Permission | undefined>;
  getPermissionsByCategory(category: string): Promise<import('../shared/schema.js').Permission[]>;
  createPermission(permission: import('../shared/schema.js').InsertPermission): Promise<import('../shared/schema.js').Permission>;
  updatePermission(id: string, permission: Partial<import('../shared/schema.js').InsertPermission>): Promise<import('../shared/schema.js').Permission | undefined>;
  deletePermission(id: string): Promise<void>;

  // Role-Permission Mapping
  getRolePermissions(role: string): Promise<import('../shared/schema.js').RolePermission[]>;
  assignPermissionToRole(rolePermission: import('../shared/schema.js').InsertRolePermission): Promise<import('../shared/schema.js').RolePermission>;
  revokePermissionFromRole(role: string, permissionId: string): Promise<void>;
  hasPermission(role: string, permissionCode: string): Promise<boolean>;

  // Timesheet Correction Requests
  getCorrectionRequests(filters?: { timesheetEntryId?: string; requestedById?: string; status?: string }): Promise<import('../shared/schema.js').TimesheetCorrectionRequest[]>;
  getCorrectionRequestById(id: string): Promise<import('../shared/schema.js').TimesheetCorrectionRequest | undefined>;
  createCorrectionRequest(request: import('../shared/schema.js').InsertTimesheetCorrectionRequest): Promise<import('../shared/schema.js').TimesheetCorrectionRequest>;
  updateCorrectionRequest(id: string, request: Partial<import('../shared/schema.js').InsertTimesheetCorrectionRequest>): Promise<import('../shared/schema.js').TimesheetCorrectionRequest | undefined>;
  approveCorrectionRequest(id: string, reviewerId: string, reviewNotes?: string): Promise<import('../shared/schema.js').TimesheetCorrectionRequest | undefined>;
  rejectCorrectionRequest(id: string, reviewerId: string, reviewNotes: string): Promise<import('../shared/schema.js').TimesheetCorrectionRequest | undefined>;
  approveCorrectionRequestAtomic(id: string, reviewerId: string, changeType: 'Manager_Correction' | 'HR_Override', reviewNotes?: string): Promise<import('../shared/schema.js').TimesheetCorrectionRequest>;
  rejectCorrectionRequestAtomic(id: string, reviewerId: string, reviewNotes: string): Promise<import('../shared/schema.js').TimesheetCorrectionRequest>;

  // Timesheet Change Audit Trail
  getTimesheetChangeAudit(timesheetEntryId: string): Promise<import('../shared/schema.js').TimesheetChangeAudit[]>;
  createTimesheetChangeAudit(audit: import('../shared/schema.js').InsertTimesheetChangeAudit): Promise<import('../shared/schema.js').TimesheetChangeAudit>;

  // **PHASE 3: ADVANCED ACCESS CONTROL**
  
  // Permission Templates
  getPermissionTemplates(): Promise<import('../shared/schema.js').PermissionTemplate[]>;
  getPermissionTemplateById(id: string): Promise<import('../shared/schema.js').PermissionTemplate | undefined>;
  createPermissionTemplate(template: import('../shared/schema.js').InsertPermissionTemplate): Promise<import('../shared/schema.js').PermissionTemplate>;
  updatePermissionTemplate(id: string, template: Partial<import('../shared/schema.js').InsertPermissionTemplate>): Promise<import('../shared/schema.js').PermissionTemplate | undefined>;
  deletePermissionTemplate(id: string): Promise<void>;
  applyTemplateToRole(templateId: string, role: string, appliedBy: string): Promise<void>;
  
  // Role Hierarchy & Inheritance
  getRoleHierarchy(): Promise<import('../shared/schema.js').RoleHierarchy[]>;
  getRoleHierarchyByRole(role: string): Promise<import('../shared/schema.js').RoleHierarchy | undefined>;
  createRoleHierarchy(hierarchy: import('../shared/schema.js').InsertRoleHierarchy): Promise<import('../shared/schema.js').RoleHierarchy>;
  updateRoleHierarchy(id: string, hierarchy: Partial<import('../shared/schema.js').InsertRoleHierarchy>): Promise<import('../shared/schema.js').RoleHierarchy | undefined>;
  getInheritedPermissions(role: string): Promise<import('../shared/schema.js').Permission[]>;
  
  // Time-Based Permission Grants
  getActiveTimeBasedGrants(userId: string): Promise<import('../shared/schema.js').TimeBasedPermissionGrant[]>;
  getAllTimeBasedGrants(userId?: string): Promise<import('../shared/schema.js').TimeBasedPermissionGrant[]>;
  createTimeBasedGrant(grant: import('../shared/schema.js').InsertTimeBasedPermissionGrant): Promise<import('../shared/schema.js').TimeBasedPermissionGrant>;
  revokeTimeBasedGrant(id: string, revokedBy: string): Promise<void>;
  expireOldGrants(): Promise<number>;
  
  // Permission Requests
  getPermissionRequests(filters?: { requestedById?: string; status?: string }): Promise<import('../shared/schema.js').PermissionRequest[]>;
  getPermissionRequestById(id: string): Promise<import('../shared/schema.js').PermissionRequest | undefined>;
  createPermissionRequest(request: import('../shared/schema.js').InsertPermissionRequest): Promise<import('../shared/schema.js').PermissionRequest>;
  approvePermissionRequest(id: string, reviewerId: string, reviewNotes?: string): Promise<import('../shared/schema.js').PermissionRequest>;
  rejectPermissionRequest(id: string, reviewerId: string, reviewNotes: string): Promise<import('../shared/schema.js').PermissionRequest>;
  
  // Permission Change Audit
  getPermissionChangeAudit(targetType?: string, targetId?: string): Promise<import('../shared/schema.js').PermissionChangeAudit[]>;
  createPermissionChangeAudit(audit: import('../shared/schema.js').InsertPermissionChangeAudit): Promise<import('../shared/schema.js').PermissionChangeAudit>;
  
  // Bulk Operations
  bulkAssignPermissions(role: string, permissionIds: string[], assignedBy: string, reason?: string): Promise<void>;
  bulkRevokePermissions(role: string, permissionIds: string[], revokedBy: string, reason?: string): Promise<void>;

  // Access Levels
  getAccessLevels(): Promise<import('../shared/schema.js').AccessLevel[]>;
  getAccessLevelById(id: string): Promise<import('../shared/schema.js').AccessLevel | undefined>;
  createAccessLevel(accessLevel: import('../shared/schema.js').InsertAccessLevel): Promise<import('../shared/schema.js').AccessLevel>;
  updateAccessLevel(id: string, accessLevel: Partial<import('../shared/schema.js').InsertAccessLevel>): Promise<import('../shared/schema.js').AccessLevel | undefined>;
  deleteAccessLevel(id: string): Promise<void>;

  // Employee Access Assignments
  getEmployeeAccessAssignments(): Promise<import('../shared/schema.js').EmployeeAccessAssignment[]>;
  getEmployeeAccessAssignmentByEmployeeId(employeeId: string): Promise<import('../shared/schema.js').EmployeeAccessAssignment | undefined>;
  assignEmployeeAccessLevel(assignment: import('../shared/schema.js').InsertEmployeeAccessAssignment): Promise<import('../shared/schema.js').EmployeeAccessAssignment>;
  revokeEmployeeAccessLevel(employeeId: string): Promise<void>;
  bulkAssignEmployeeAccessLevels(assignments: import('../shared/schema.js').InsertEmployeeAccessAssignment[]): Promise<void>;

  // ============================================================================
  // COMPLIANCE MANAGEMENT SYSTEM
  // ============================================================================

  // Compliance Frameworks
  getComplianceFrameworks(): Promise<ComplianceFramework[]>;
  getComplianceFrameworkById(id: string): Promise<ComplianceFramework | undefined>;
  getActiveComplianceFrameworks(): Promise<ComplianceFramework[]>;
  getComplianceFrameworksByStatus(status: string): Promise<ComplianceFramework[]>;
  createComplianceFramework(framework: InsertComplianceFramework): Promise<ComplianceFramework>;
  updateComplianceFramework(id: string, framework: Partial<InsertComplianceFramework>): Promise<ComplianceFramework | undefined>;
  deleteComplianceFramework(id: string): Promise<void>;

  // Compliance Controls
  getComplianceControls(): Promise<ComplianceControl[]>;
  getComplianceControlById(id: string): Promise<ComplianceControl | undefined>;
  getComplianceControlsByFramework(frameworkId: string): Promise<ComplianceControl[]>;
  getOverdueComplianceControls(): Promise<ComplianceControl[]>;
  createComplianceControl(control: InsertComplianceControl): Promise<ComplianceControl>;
  updateComplianceControl(id: string, control: Partial<InsertComplianceControl>): Promise<ComplianceControl | undefined>;
  deleteComplianceControl(id: string): Promise<void>;

  // Compliance Evidence
  getComplianceEvidence(): Promise<ComplianceEvidence[]>;
  getComplianceEvidenceById(id: string): Promise<ComplianceEvidence | undefined>;
  getComplianceEvidenceByControl(controlId: string): Promise<ComplianceEvidence[]>;
  createComplianceEvidence(evidence: InsertComplianceEvidence): Promise<ComplianceEvidence>;
  updateComplianceEvidence(id: string, evidence: Partial<InsertComplianceEvidence>): Promise<ComplianceEvidence | undefined>;
  deleteComplianceEvidence(id: string): Promise<void>;

  // Compliance Alerts
  getComplianceAlerts(): Promise<ComplianceAlert[]>;
  getComplianceAlertById(id: string): Promise<ComplianceAlert | undefined>;
  getOpenComplianceAlerts(): Promise<ComplianceAlert[]>;
  getComplianceAlertsBySeverity(severity: string): Promise<ComplianceAlert[]>;
  createComplianceAlert(alert: InsertComplianceAlert): Promise<ComplianceAlert>;
  updateComplianceAlert(id: string, alert: Partial<InsertComplianceAlert>): Promise<ComplianceAlert | undefined>;
  acknowledgeComplianceAlert(id: string, acknowledgedById: string): Promise<ComplianceAlert | undefined>;
  resolveComplianceAlert(id: string, resolvedById: string, resolutionNotes?: string): Promise<ComplianceAlert | undefined>;

  // Compliance Audit Trail
  createComplianceAuditEntry(entry: InsertComplianceAuditTrail): Promise<ComplianceAuditTrail>;
  getComplianceAuditTrail(filters?: { category?: string; startDate?: string; endDate?: string; actorId?: string }): Promise<ComplianceAuditTrail[]>;

  // Compliance Policies
  getCompliancePolicies(): Promise<CompliancePolicy[]>;
  getCompliancePolicyById(id: string): Promise<CompliancePolicy | undefined>;
  getActiveCompliancePolicies(): Promise<CompliancePolicy[]>;
  createCompliancePolicy(policy: InsertCompliancePolicy): Promise<CompliancePolicy>;
  updateCompliancePolicy(id: string, policy: Partial<InsertCompliancePolicy>): Promise<CompliancePolicy | undefined>;
  deleteCompliancePolicy(id: string): Promise<void>;

  // Policy Acknowledgments
  getPolicyAcknowledgments(): Promise<PolicyAcknowledgment[]>;
  getPolicyAcknowledgmentById(id: string): Promise<PolicyAcknowledgment | undefined>;
  getPolicyAcknowledgmentsByPolicy(policyId: string): Promise<PolicyAcknowledgment[]>;
  getEmployeePendingPolicyAcknowledgments(employeeId: string): Promise<CompliancePolicy[]>;
  createPolicyAcknowledgment(acknowledgment: InsertPolicyAcknowledgment): Promise<PolicyAcknowledgment>;
  updatePolicyAcknowledgment(id: string, acknowledgment: Partial<InsertPolicyAcknowledgment>): Promise<PolicyAcknowledgment | undefined>;
  deletePolicyAcknowledgment(id: string): Promise<void>;

  // Regulatory Updates
  getRegulatoryUpdates(): Promise<RegulatoryUpdate[]>;
  getRegulatoryUpdateById(id: string): Promise<RegulatoryUpdate | undefined>;
  getUnreviewedRegulatoryUpdates(): Promise<RegulatoryUpdate[]>;
  createRegulatoryUpdate(update: InsertRegulatoryUpdate): Promise<RegulatoryUpdate>;
  updateRegulatoryUpdate(id: string, update: Partial<InsertRegulatoryUpdate>): Promise<RegulatoryUpdate | undefined>;
  deleteRegulatoryUpdate(id: string): Promise<void>;

  // Compliance Metrics
  createComplianceMetrics(metrics: InsertComplianceMetrics): Promise<ComplianceMetrics>;
  getLatestComplianceMetrics(frameworkId?: string): Promise<ComplianceMetrics[]>;

  // ============================================================================
  // E-VERIFY CASE MANAGEMENT
  // ============================================================================

  // E-Verify Cases CRUD
  getEVerifyCases(): Promise<EVerifyCase[]>;
  getEVerifyCaseById(id: string): Promise<EVerifyCase | undefined>;
  getEVerifyCaseByNewHireId(newHireId: string): Promise<EVerifyCase | undefined>;
  getEVerifyCasesByStatus(status: string): Promise<EVerifyCase[]>;
  getPendingEVerifyCases(): Promise<EVerifyCase[]>;
  getOverdueEVerifyCases(): Promise<EVerifyCase[]>;
  createEVerifyCase(eVerifyCase: InsertEVerifyCase): Promise<EVerifyCase>;
  updateEVerifyCase(id: string, updates: Partial<InsertEVerifyCase>): Promise<EVerifyCase | undefined>;

  // E-Verify Case History
  getEVerifyCaseHistory(caseId: string): Promise<EVerifyCaseHistory[]>;
  createEVerifyCaseHistoryEntry(entry: InsertEVerifyCaseHistory): Promise<EVerifyCaseHistory>;
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

  // Address Change Requests
  async getPendingAddressChangeRequests(): Promise<any[]> {
    return db.select().from(addressChangeRequests)
      .where(eq(addressChangeRequests.status, 'Pending'))
      .orderBy(desc(addressChangeRequests.submittedAt));
  }

  async getAddressChangeRequestsByProfileId(profileId: string): Promise<any[]> {
    return db.select().from(addressChangeRequests)
      .where(eq(addressChangeRequests.profileId, profileId))
      .orderBy(desc(addressChangeRequests.submittedAt));
  }

  async createAddressChangeRequest(request: any): Promise<any> {
    const result = await db.insert(addressChangeRequests).values(request).returning();
    return result[0];
  }

  async approveAddressChangeRequest(id: string, reviewedBy: string, reviewNotes?: string): Promise<any> {
    // DEFENSE-IN-DEPTH: Verify reviewer has HR/Product Owner privileges before approving
    const reviewer = await this.getProfileById(reviewedBy);
    if (!reviewer) {
      throw new Error('Reviewer profile not found');
    }
    
    const hasPrivileges = reviewer.department === 'HR' || reviewer.role === 'Product Owner';
    if (!hasPrivileges) {
      console.error(`[Security] Unauthorized approval attempt by user ${reviewedBy} (role: ${reviewer.role}, dept: ${reviewer.department})`);
      throw new Error('Forbidden: Only HR department or Product Owners can approve address changes');
    }
    
    // Get the request and verify it's still pending
    const requests = await db.select().from(addressChangeRequests).where(eq(addressChangeRequests.id, id));
    if (!requests.length) {
      throw new Error('Address change request not found');
    }
    
    const request = requests[0];
    
    // Verify request is still pending
    if (request.status !== 'Pending') {
      throw new Error(`Cannot approve request: current status is ${request.status}`);
    }
    
    // TRANSACTION: Update profile and mark request as approved atomically
    return await db.transaction(async (tx) => {
      // Update the profile with the new address
      await tx.update(profiles)
        .set({
          address: request.newAddress,
          city: request.newCity,
          state: request.newState,
          zipCode: request.newZipCode
        })
        .where(eq(profiles.id, request.profileId));
      
      // Mark the request as approved
      const result = await tx.update(addressChangeRequests)
        .set({
          status: 'Approved',
          reviewedAt: new Date(),
          reviewedBy,
          reviewNotes
        })
        .where(and(
          eq(addressChangeRequests.id, id),
          eq(addressChangeRequests.status, 'Pending') // Double-check status in transaction
        ))
        .returning();
      
      if (!result.length) {
        throw new Error('Failed to approve request - status may have changed');
      }
      
      console.log(`[Audit] Address change approved by ${reviewer.email} (${reviewer.department}/${reviewer.role}) for profile ${request.profileId}`);
      return result[0];
    });
  }

  async rejectAddressChangeRequest(id: string, reviewedBy: string, reviewNotes?: string): Promise<any> {
    // DEFENSE-IN-DEPTH: Verify reviewer has HR/Product Owner privileges before rejecting
    const reviewer = await this.getProfileById(reviewedBy);
    if (!reviewer) {
      throw new Error('Reviewer profile not found');
    }
    
    const hasPrivileges = reviewer.department === 'HR' || reviewer.role === 'Product Owner';
    if (!hasPrivileges) {
      console.error(`[Security] Unauthorized rejection attempt by user ${reviewedBy} (role: ${reviewer.role}, dept: ${reviewer.department})`);
      throw new Error('Forbidden: Only HR department or Product Owners can reject address changes');
    }
    
    // Verify request exists and is still pending
    const requests = await db.select().from(addressChangeRequests).where(eq(addressChangeRequests.id, id));
    if (!requests.length) {
      throw new Error('Address change request not found');
    }
    
    const request = requests[0];
    
    if (request.status !== 'Pending') {
      throw new Error(`Cannot reject request: current status is ${request.status}`);
    }
    
    // Update the request status
    const result = await db.update(addressChangeRequests)
      .set({
        status: 'Rejected',
        reviewedAt: new Date(),
        reviewedBy,
        reviewNotes
      })
      .where(and(
        eq(addressChangeRequests.id, id),
        eq(addressChangeRequests.status, 'Pending') // Ensure still pending
      ))
      .returning();
    
    if (!result.length) {
      throw new Error('Failed to reject request - status may have changed');
    }
    
    console.log(`[Audit] Address change rejected by ${reviewer.email} (${reviewer.department}/${reviewer.role}) for profile ${request.profileId}`);
    return result[0];
  }

  // Auth Credentials
  async createAuthCredential(credential: InsertAuthCredential): Promise<AuthCredential> {
    const result = await db.insert(authCredentials).values(credential).returning();
    return result[0];
  }

  async getAuthCredentialByProfileId(profileId: string): Promise<AuthCredential | undefined> {
    const result = await db.select().from(authCredentials).where(eq(authCredentials.profileId, profileId));
    return result[0];
  }

  /**
   * Update auth credential. IMPORTANT: passwordHash must be pre-hashed with hashPassword()
   */
  async updateAuthCredential(profileId: string, updates: Partial<InsertAuthCredential>): Promise<AuthCredential | undefined> {
    const result = await db.update(authCredentials)
      .set(updates)
      .where(eq(authCredentials.profileId, profileId))
      .returning();
    return result[0];
  }

  /**
   * Atomically increment failed login attempts and lock account if threshold reached
   */
  async incrementFailedLoginAttempts(profileId: string): Promise<void> {
    // First, get current failed attempts to calculate lockout
    const credential = await this.getAuthCredentialByProfileId(profileId);
    if (!credential) return;

    const newFailedAttempts = (credential.failedAttempts || 0) + 1;
    
    // Calculate lockout duration based on failed attempts
    const lockoutMs = this.calculateLockoutDuration(newFailedAttempts);
    const lockedUntil = lockoutMs > 0 ? new Date(Date.now() + lockoutMs) : null;

    // Atomic update: increment attempts and set lock in single operation
    await db.update(authCredentials)
      .set({
        failedAttempts: newFailedAttempts,
        lockedUntil: lockedUntil
      })
      .where(eq(authCredentials.profileId, profileId));
  }

  /**
   * Reset failed login attempts and clear account lock
   */
  async resetFailedLoginAttempts(profileId: string): Promise<void> {
    await db.update(authCredentials)
      .set({
        failedAttempts: 0,
        lockedUntil: null
      })
      .where(eq(authCredentials.profileId, profileId));
  }

  /**
   * Lock account until specified time
   */
  async lockAccount(profileId: string, lockedUntil: Date): Promise<void> {
    await db.update(authCredentials)
      .set({ lockedUntil })
      .where(eq(authCredentials.profileId, profileId));
  }

  /**
   * Calculate lockout duration based on failed attempts
   * Progressive lockout: 5 failures = 15 min, 10 = 30 min, 15+ = 1 hour
   */
  private calculateLockoutDuration(failedAttempts: number): number {
    if (failedAttempts >= 15) return 60 * 60 * 1000; // 1 hour
    if (failedAttempts >= 10) return 30 * 60 * 1000; // 30 minutes
    if (failedAttempts >= 5) return 15 * 60 * 1000;  // 15 minutes
    return 0; // No lockout yet
  }

  // Employees
  async getEmployees(): Promise<Employee[]> {
    return db.select().from(employees);
  }

  async getEmployeesWithProfiles(): Promise<EmployeeWithProfile[]> {
    const managerEmployees = alias(employees, 'managerEmployees');
    const managerProfiles = alias(profiles, 'managerProfiles');
    
    const result = await db
      .select({
        employee: employees,
        profile: profiles,
        department: departments,
        managerEmployee: managerEmployees,
        managerProfile: managerProfiles
      })
      .from(employees)
      .leftJoin(profiles, eq(employees.userId, profiles.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(managerEmployees, eq(employees.managerId, managerEmployees.id))
      .leftJoin(managerProfiles, eq(managerEmployees.userId, managerProfiles.id));

    return result.map(row => ({
      ...row.employee,
      userId: row.employee.userId, // Profile UUID
      employeeRecordId: row.employee.id, // Employee table UUID for backend operations
      profile: row.profile ? {
        firstName: row.profile.firstName,
        lastName: row.profile.lastName,
        email: row.profile.email,
        department: row.department?.name || null,
        role: row.profile.role,
        phone: row.profile.phone,
        avatarUrl: row.profile.profilePicture,
        // Address fields from profiles table
        address: row.profile.address,
        city: row.profile.city,
        state: row.profile.state,
        zipCode: row.profile.zipCode,
        // Emergency contact fields from profiles table
        emergencyContactFirstName: row.profile.emergencyContactFirstName,
        emergencyContactLastName: row.profile.emergencyContactLastName,
        emergencyContactMiddleName: row.profile.emergencyContactMiddleName,
        emergencyContactRelationship: row.profile.emergencyContactRelationship,
        emergencyContactPhone: row.profile.emergencyContactPhone,
        // Profile picture (base64 data) from profiles table
        profilePicture: row.profile.profilePicture,
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

  async getCandidateByEmail(email: string): Promise<Candidate | undefined> {
    const result = await db.select().from(candidates).where(eq(candidates.email, email));
    return result[0];
  }

  // ATS - Job Postings
  async getActiveJobPostings(): Promise<any[]> {
    return db.select().from(jobPostings)
      .where(and(eq(jobPostings.isPublic, true), eq(jobPostings.status, 'active')))
      .orderBy(desc(jobPostings.publishedAt));
  }

  async getAllJobPostings(): Promise<any[]> {
    return db.select().from(jobPostings).orderBy(desc(jobPostings.createdAt));
  }

  async getJobPostingById(id: string): Promise<any | undefined> {
    const result = await db.select().from(jobPostings).where(eq(jobPostings.id, id));
    return result[0];
  }

  async createJobPosting(job: any): Promise<any> {
    const result = await db.insert(jobPostings).values(job).returning();
    return result[0];
  }

  async updateJobPosting(id: string, job: any): Promise<any | undefined> {
    const result = await db.update(jobPostings).set(job).where(eq(jobPostings.id, id)).returning();
    return result[0];
  }

  async incrementJobPostingViews(id: string): Promise<void> {
    await db.update(jobPostings)
      .set({ viewCount: drizzleSql`${jobPostings.viewCount} + 1` })
      .where(eq(jobPostings.id, id));
  }

  async incrementJobPostingApplications(id: string): Promise<void> {
    await db.update(jobPostings)
      .set({ applicationCount: drizzleSql`${jobPostings.applicationCount} + 1` })
      .where(eq(jobPostings.id, id));
  }

  async createDefaultInterviewStages(jobId: string): Promise<void> {
    const defaultStages = [
      { jobPostingId: jobId, name: 'Applied', order: 1, stageType: 'screening', isActive: true },
      { jobPostingId: jobId, name: 'Phone Screen', order: 2, stageType: 'phone', isActive: true },
      { jobPostingId: jobId, name: 'Interview', order: 3, stageType: 'technical', isActive: true },
      { jobPostingId: jobId, name: 'Final Round', order: 4, stageType: 'final', isActive: true },
      { jobPostingId: jobId, name: 'Offer', order: 5, stageType: 'offer', isActive: true }
    ];
    await db.insert(interviewStages).values(defaultStages);
  }

  // ATS - Applications
  async getAllApplications(): Promise<any[]> {
    return db.select().from(applications).orderBy(desc(applications.appliedAt));
  }

  async getApplicationsByJob(jobId: string): Promise<any[]> {
    return db.select().from(applications)
      .where(eq(applications.jobPostingId, jobId))
      .orderBy(desc(applications.appliedAt));
  }

  async getApplicationById(id: string): Promise<any | undefined> {
    const result = await db.select().from(applications).where(eq(applications.id, id));
    return result[0];
  }

  async getApplicationByJobAndCandidate(jobId: string, candidateId: string): Promise<any | undefined> {
    const result = await db.select().from(applications)
      .where(and(
        eq(applications.jobPostingId, jobId),
        eq(applications.candidateId, candidateId)
      ));
    return result[0];
  }

  async createApplication(application: any): Promise<any> {
    const result = await db.insert(applications).values(application).returning();
    return result[0];
  }

  async updateApplication(id: string, application: any): Promise<any | undefined> {
    const result = await db.update(applications).set(application).where(eq(applications.id, id)).returning();
    return result[0];
  }

  // ATS - Resume Data
  async createResumeData(data: any): Promise<any> {
    const result = await db.insert(resumeData).values(data).returning();
    return result[0];
  }

  async getResumeDataById(id: string): Promise<any | undefined> {
    const result = await db.select().from(resumeData).where(eq(resumeData.id, id));
    return result[0];
  }

  // ATS - Interview Stages
  async getInterviewStagesByJob(jobId: string): Promise<any[]> {
    return db.select().from(interviewStages)
      .where(and(eq(interviewStages.jobPostingId, jobId), eq(interviewStages.isActive, true)))
      .orderBy(interviewStages.order);
  }

  async getDefaultInterviewStage(jobId: string): Promise<any | undefined> {
    const result = await db.select().from(interviewStages)
      .where(and(
        eq(interviewStages.jobPostingId, jobId),
        eq(interviewStages.order, 1),
        eq(interviewStages.isActive, true)
      ));
    return result[0];
  }

  async createInterviewStage(stage: any): Promise<any> {
    const result = await db.insert(interviewStages).values(stage).returning();
    return result[0];
  }

  // ATS - Activity Logging
  async createApplicationActivityLog(log: any): Promise<any> {
    const result = await db.insert(applicationActivityLog).values(log).returning();
    return result[0];
  }

  async createApplicationStageTransition(transition: any): Promise<any> {
    const result = await db.insert(applicationStageTransitions).values(transition).returning();
    return result[0];
  }

  // ATS - Team Assignments
  async getTeamAssignmentsByJob(jobId: string): Promise<any[]> {
    return db.select().from(teamAssignments)
      .where(and(eq(teamAssignments.jobPostingId, jobId), isNull(teamAssignments.removedAt)));
  }

  async createTeamAssignment(assignment: any): Promise<any> {
    const result = await db.insert(teamAssignments).values(assignment).returning();
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

  async getAllUserPresence(): Promise<UserPresence[]> {
    return db.select().from(userPresence);
  }

  // Call Sessions
  async createCallSession(session: InsertCallSession): Promise<CallSession> {
    const result = await db.insert(callSessions).values(session).returning();
    return result[0];
  }

  async getCallSessionById(id: string): Promise<CallSession | undefined> {
    const result = await db.select().from(callSessions).where(eq(callSessions.id, id));
    return result[0];
  }

  async updateCallSession(id: string, session: Partial<InsertCallSession>): Promise<CallSession | undefined> {
    const result = await db.update(callSessions)
      .set(session)
      .where(eq(callSessions.id, id))
      .returning();
    return result[0];
  }

  async addCallParticipant(participant: InsertCallParticipant): Promise<CallParticipant> {
    const result = await db.insert(callParticipants).values(participant).returning();
    return result[0];
  }

  async updateCallParticipant(id: string, participant: Partial<InsertCallParticipant>): Promise<CallParticipant | undefined> {
    const result = await db.update(callParticipants)
      .set(participant)
      .where(eq(callParticipants.id, id))
      .returning();
    return result[0];
  }

  async getCallParticipants(callSessionId: string): Promise<CallParticipant[]> {
    return db.select().from(callParticipants)
      .where(eq(callParticipants.callSessionId, callSessionId));
  }

  async createCallSignal(signal: InsertCallSignaling): Promise<CallSignaling> {
    const result = await db.insert(callSignaling).values(signal).returning();
    return result[0];
  }

  async getCallSignals(callSessionId: string, fromTime?: Date): Promise<CallSignaling[]> {
    const conditions = [eq(callSignaling.callSessionId, callSessionId)];
    if (fromTime) {
      conditions.push(gte(callSignaling.createdAt, fromTime));
    }
    return db.select().from(callSignaling)
      .where(and(...conditions))
      .orderBy(callSignaling.createdAt);
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
    query = query.orderBy(desc(collaboratorInvitations.createdAt));
    
    return await query;
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
      conditions.push(lte(changeLog.createdAt, new Date(filters.endDate)));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    query = query.orderBy(desc(changeLog.createdAt)).limit(limit);
    
    return await query;
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
    const result = await db.select().from(celebrationBadges).where(eq(celebrationBadges.yearNumber, years));
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
        eq(celebrationHistory.celebrationDate, date)
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

  async getPerformanceReviews(cycleId?: string): Promise<any[]> {
    const { performanceReviews } = await import('../shared/schema.js');
    let query = db.select().from(performanceReviews);
    
    if (cycleId) {
      query = query.where(eq(performanceReviews.reviewCycleId, cycleId)) as any;
    }
    
    return query.orderBy(desc(performanceReviews.createdAt));
  }

  async getPerformanceReviewById(id: string): Promise<any | undefined> {
    const { performanceReviews } = await import('../shared/schema.js');
    const result = await db.select()
      .from(performanceReviews)
      .where(eq(performanceReviews.id, id));
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

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const result = await db.insert(announcements).values(announcement).returning();
    return result[0];
  }

  async updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const result = await db.update(announcements)
      .set(announcement)
      .where(eq(announcements.id, id))
      .returning();
    return result[0];
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  async markAnnouncementAsRead(announcementId: string, userId: string): Promise<void> {
    // TODO: Implement when announcement_reads table is added to schema
    // For now, this is a no-op
    console.log(`Mark announcement ${announcementId} as read for user ${userId}`);
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
    
    return {
      ...result[0],
      canAccessOrgChart: result[0].canAccessOrgChart ?? false
    };
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

  // Onboarding Checklists
  async getOnboardingChecklists(): Promise<OnboardingChecklist[]> {
    return db.select().from(onboardingChecklists).orderBy(desc(onboardingChecklists.createdAt));
  }

  async getOnboardingChecklistById(id: string): Promise<OnboardingChecklist | undefined> {
    const result = await db.select().from(onboardingChecklists).where(eq(onboardingChecklists.id, id));
    return result[0];
  }

  async getOnboardingChecklistByNewHireId(newHireId: string): Promise<OnboardingChecklist | undefined> {
    const result = await db.select().from(onboardingChecklists).where(eq(onboardingChecklists.newHireId, newHireId));
    return result[0];
  }

  async createOnboardingChecklist(checklist: InsertOnboardingChecklist): Promise<OnboardingChecklist> {
    const result = await db.insert(onboardingChecklists).values(checklist).returning();
    return result[0];
  }

  async updateOnboardingChecklist(id: string, checklist: Partial<InsertOnboardingChecklist>): Promise<OnboardingChecklist | undefined> {
    const result = await db.update(onboardingChecklists)
      .set({ ...checklist, updatedAt: new Date() })
      .where(eq(onboardingChecklists.id, id))
      .returning();
    return result[0];
  }

  // Onboarding Tasks
  async getOnboardingTasks(checklistId: string): Promise<OnboardingTask[]> {
    return db.select().from(onboardingTasks)
      .where(eq(onboardingTasks.checklistId, checklistId))
      .orderBy(onboardingTasks.order, onboardingTasks.createdAt);
  }

  async getOnboardingTaskById(id: string): Promise<OnboardingTask | undefined> {
    const result = await db.select().from(onboardingTasks).where(eq(onboardingTasks.id, id));
    return result[0];
  }

  async createOnboardingTask(task: InsertOnboardingTask): Promise<OnboardingTask> {
    const result = await db.insert(onboardingTasks).values(task).returning();
    return result[0];
  }

  async updateOnboardingTask(id: string, task: Partial<InsertOnboardingTask>): Promise<OnboardingTask | undefined> {
    const result = await db.update(onboardingTasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(onboardingTasks.id, id))
      .returning();
    return result[0];
  }

  async completeOnboardingTask(id: string, completedBy: string): Promise<OnboardingTask | undefined> {
    const result = await db.update(onboardingTasks)
      .set({ 
        status: 'Completed',
        completedDate: new Date(),
        completedBy,
        updatedAt: new Date()
      })
      .where(eq(onboardingTasks.id, id))
      .returning();
    return result[0];
  }

  // I-9 Forms
  async getI9Forms(): Promise<I9Form[]> {
    return db.select().from(i9Forms).orderBy(desc(i9Forms.createdAt));
  }

  async getI9FormById(id: string): Promise<I9Form | undefined> {
    const result = await db.select().from(i9Forms).where(eq(i9Forms.id, id));
    return result[0];
  }

  async getI9FormByNewHireId(newHireId: string): Promise<I9Form | undefined> {
    const result = await db.select().from(i9Forms).where(eq(i9Forms.newHireId, newHireId));
    return result[0];
  }

  async createI9Form(form: InsertI9Form): Promise<I9Form> {
    const result = await db.insert(i9Forms).values(form).returning();
    return result[0];
  }

  async updateI9Form(id: string, form: Partial<InsertI9Form>): Promise<I9Form | undefined> {
    const result = await db.update(i9Forms)
      .set({ ...form, updatedAt: new Date() })
      .where(eq(i9Forms.id, id))
      .returning();
    return result[0];
  }

  async updateI9FormSection1(id: string, data: any): Promise<I9Form | undefined> {
    const result = await db.update(i9Forms)
      .set({ 
        ...data,
        section1Status: 'Completed',
        section1CompletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(i9Forms.id, id))
      .returning();
    return result[0];
  }

  async updateI9FormSection2(id: string, data: any, completedBy: string): Promise<I9Form | undefined> {
    const result = await db.update(i9Forms)
      .set({ 
        ...data,
        section2Status: 'Completed',
        section2CompletedAt: new Date(),
        section2CompletedBy: completedBy,
        updatedAt: new Date()
      })
      .where(eq(i9Forms.id, id))
      .returning();
    return result[0];
  }

  // State Tax Forms
  async getStateTaxForms(newHireId: string): Promise<StateTaxForm[]> {
    return db.select().from(stateTaxForms)
      .where(eq(stateTaxForms.newHireId, newHireId))
      .orderBy(stateTaxForms.state);
  }

  async getStateTaxFormById(id: string): Promise<StateTaxForm | undefined> {
    const result = await db.select().from(stateTaxForms).where(eq(stateTaxForms.id, id));
    return result[0];
  }

  async getStateTaxFormByNewHireAndState(newHireId: string, state: string): Promise<StateTaxForm | undefined> {
    const result = await db.select().from(stateTaxForms)
      .where(and(
        eq(stateTaxForms.newHireId, newHireId),
        eq(stateTaxForms.state, state)
      ));
    return result[0];
  }

  async createStateTaxForm(form: InsertStateTaxForm): Promise<StateTaxForm> {
    const result = await db.insert(stateTaxForms).values(form).returning();
    return result[0];
  }

  async updateStateTaxForm(id: string, form: Partial<InsertStateTaxForm>): Promise<StateTaxForm | undefined> {
    const result = await db.update(stateTaxForms)
      .set({ ...form, updatedAt: new Date() })
      .where(eq(stateTaxForms.id, id))
      .returning();
    return result[0];
  }

  // Onboarding Documents
  async getOnboardingDocuments(newHireId: string): Promise<OnboardingDocument[]> {
    return db.select().from(onboardingDocuments)
      .where(eq(onboardingDocuments.newHireId, newHireId))
      .orderBy(desc(onboardingDocuments.uploadedAt));
  }

  async getOnboardingDocumentById(id: string): Promise<OnboardingDocument | undefined> {
    const result = await db.select().from(onboardingDocuments).where(eq(onboardingDocuments.id, id));
    return result[0];
  }

  async createOnboardingDocument(document: InsertOnboardingDocument): Promise<OnboardingDocument> {
    const result = await db.insert(onboardingDocuments).values(document).returning();
    return result[0];
  }

  async updateOnboardingDocument(id: string, document: Partial<InsertOnboardingDocument>): Promise<OnboardingDocument | undefined> {
    const result = await db.update(onboardingDocuments)
      .set({ ...document, updatedAt: new Date() })
      .where(eq(onboardingDocuments.id, id))
      .returning();
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
    const startDateObj = new Date(startDate);
    
    // Build time range filter condition using managerAssessmentSubmittedAt
    const timeFilter = gte(performanceReviews.managerAssessmentSubmittedAt, startDateObj);
    
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
        gte(performanceReviews.managerAssessmentSubmittedAt, startDateObj)
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
    const startDateObj = new Date(startDate);
    
    // Get total leave requests in time range
    const totalRequestsResult = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(leaveRequests)
      .where(gte(leaveRequests.submittedDate, startDateObj));
    const totalRequests = totalRequestsResult[0]?.count || 0;
    
    // Get requests by status
    const pendingResult = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(leaveRequests)
      .where(and(
        eq(leaveRequests.status, 'Pending'),
        gte(leaveRequests.submittedDate, startDateObj)
      ));
    const pendingRequests = pendingResult[0]?.count || 0;
    
    const approvedResult = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(leaveRequests)
      .where(and(
        eq(leaveRequests.status, 'Approved'),
        gte(leaveRequests.submittedDate, startDateObj)
      ));
    const approvedRequests = approvedResult[0]?.count || 0;
    
    const deniedResult = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(leaveRequests)
      .where(and(
        eq(leaveRequests.status, 'Denied'),
        gte(leaveRequests.submittedDate, startDateObj)
      ));
    const deniedRequests = deniedResult[0]?.count || 0;
    
    // Get leave type breakdown
    const typeBreakdown = await db.select({
      type: leaveRequests.type,
      count: drizzleSql<number>`count(*)::int`,
      avgDays: drizzleSql<number>`avg(days)::int`
    })
      .from(leaveRequests)
      .where(gte(leaveRequests.submittedDate, startDateObj))
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

  async getFinancialMetrics(_timeRange: string): Promise<import('../shared/schema.js').FinancialMetrics> {
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

  // Fun Facts
  async getRandomFunFact(netPayAmount: number, _employeeId: string, excludeFactIds?: string[]): Promise<PaycheckFunFact | undefined> {
    const whereConditions = [
      eq(paycheckFunFacts.enabled, true),
      lte(paycheckFunFacts.minAmount, netPayAmount.toString()),
      gte(paycheckFunFacts.maxAmount, netPayAmount.toString())
    ];

    if (excludeFactIds && excludeFactIds.length > 0) {
      whereConditions.push(notInArray(paycheckFunFacts.id, excludeFactIds));
    }

    const facts = await db.select()
      .from(paycheckFunFacts)
      .where(and(...whereConditions));
    
    if (facts.length === 0) {
      return undefined;
    }

    const randomIndex = Math.floor(Math.random() * facts.length);
    return facts[randomIndex];
  }

  async saveFunFactHistory(employeeId: string, funFactId: string, funFactText: string, payStubId?: string): Promise<EmployeeFunFactHistory> {
    const result = await db.insert(employeeFunFactHistory).values({
      employeeId,
      funFactId,
      funFactText,
      payStubId: payStubId || null
    }).returning();
    return result[0];
  }

  async getDailyUsageInfo(employeeId: string): Promise<{ count: number; limit: number; remaining: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const usageRecords = await db.select()
      .from(dailyFunFactUsage)
      .where(
        and(
          eq(dailyFunFactUsage.employeeId, employeeId),
          eq(dailyFunFactUsage.isManualGeneration, true),
          gte(dailyFunFactUsage.generatedAt, today),
          lte(dailyFunFactUsage.generatedAt, tomorrow)
        )
      );

    const count = usageRecords.length;
    const limit = 3;
    const remaining = Math.max(0, limit - count);

    return { count, limit, remaining };
  }

  async getRecentFunFactIds(employeeId: string, limit: number = 10): Promise<string[]> {
    const recentHistory = await db.select({ funFactId: employeeFunFactHistory.funFactId })
      .from(employeeFunFactHistory)
      .where(
        and(
          eq(employeeFunFactHistory.employeeId, employeeId),
          isNotNull(employeeFunFactHistory.shownAt)
        )
      )
      .orderBy(desc(employeeFunFactHistory.shownAt))
      .limit(limit);
    
    return recentHistory.map(h => h.funFactId);
  }

  async trackManualFunFactGeneration(employeeId: string, funFactId: string): Promise<void> {
    await db.insert(dailyFunFactUsage).values({
      employeeId,
      funFactId,
      isManualGeneration: true
    });
  }

  // Dashboard Widget Customization (Phase 1: Read-only + seeding)
  
  async getDashboardWidgetPresets(): Promise<DashboardWidgetPreset[]> {
    // Return ALL presets (including inactive) so API layer can decide what to show
    // API will filter based on isActive flag
    return await db.select()
      .from(dashboardWidgetPresets)
      .orderBy(dashboardWidgetPresets.defaultDisplayOrder);
  }

  async bulkCreateDashboardWidgetPresets(presets: InsertDashboardWidgetPreset[]): Promise<DashboardWidgetPreset[]> {
    if (presets.length === 0) {
      return [];
    }
    
    return await db.insert(dashboardWidgetPresets)
      .values(presets)
      .returning();
  }

  async getUserDashboardPreferences(userId: string): Promise<UserDashboardPreference[]> {
    return await db.select()
      .from(userDashboardPreferences)
      .where(eq(userDashboardPreferences.userId, userId))
      .orderBy(userDashboardPreferences.displayOrder);
  }

  // Tax Jurisdictions
  async getTaxJurisdictions(): Promise<import('../shared/schema.js').TaxJurisdiction[]> {
    return await db.select()
      .from(taxJurisdictions)
      .where(eq(taxJurisdictions.isActive, true))
      .orderBy(taxJurisdictions.jurisdictionType, taxJurisdictions.jurisdictionName);
  }

  async getTaxJurisdictionById(id: string): Promise<import('../shared/schema.js').TaxJurisdiction | undefined> {
    const result = await db.select().from(taxJurisdictions).where(eq(taxJurisdictions.id, id));
    return result[0];
  }

  async getTaxJurisdictionByState(stateCode: string): Promise<import('../shared/schema.js').TaxJurisdiction | undefined> {
    const result = await db.select()
      .from(taxJurisdictions)
      .where(
        and(
          eq(taxJurisdictions.stateCode, stateCode),
          eq(taxJurisdictions.jurisdictionType, 'state'),
          eq(taxJurisdictions.isActive, true)
        )
      );
    return result[0];
  }

  async getTaxJurisdictionByCity(stateCode: string, cityName: string): Promise<import('../shared/schema.js').TaxJurisdiction | undefined> {
    const result = await db.select()
      .from(taxJurisdictions)
      .where(
        and(
          eq(taxJurisdictions.stateCode, stateCode),
          eq(taxJurisdictions.cityName, cityName),
          eq(taxJurisdictions.jurisdictionType, 'local'),
          eq(taxJurisdictions.isActive, true)
        )
      );
    return result[0];
  }

  async createTaxJurisdiction(jurisdiction: import('../shared/schema.js').InsertTaxJurisdiction): Promise<import('../shared/schema.js').TaxJurisdiction> {
    const result = await db.insert(taxJurisdictions).values(jurisdiction).returning();
    return result[0];
  }

  async updateTaxJurisdiction(id: string, jurisdiction: Partial<import('../shared/schema.js').InsertTaxJurisdiction>): Promise<import('../shared/schema.js').TaxJurisdiction | undefined> {
    const result = await db.update(taxJurisdictions)
      .set({ ...jurisdiction, updatedAt: new Date() })
      .where(eq(taxJurisdictions.id, id))
      .returning();
    return result[0];
  }

  async deleteTaxJurisdiction(id: string): Promise<void> {
    await db.delete(taxJurisdictions).where(eq(taxJurisdictions.id, id));
  }

  // Reciprocal Agreements
  async getReciprocalAgreements(): Promise<import('../shared/schema.js').ReciprocalAgreement[]> {
    return await db.select()
      .from(reciprocalAgreements)
      .where(eq(reciprocalAgreements.isActive, true))
      .orderBy(reciprocalAgreements.workStateCode, reciprocalAgreements.residenceStateCode);
  }

  async getReciprocalAgreementById(id: string): Promise<import('../shared/schema.js').ReciprocalAgreement | undefined> {
    const result = await db.select().from(reciprocalAgreements).where(eq(reciprocalAgreements.id, id));
    return result[0];
  }

  async getReciprocalAgreementByStates(workState: string, residenceState: string): Promise<import('../shared/schema.js').ReciprocalAgreement | undefined> {
    const result = await db.select()
      .from(reciprocalAgreements)
      .where(
        and(
          eq(reciprocalAgreements.workStateCode, workState),
          eq(reciprocalAgreements.residenceStateCode, residenceState),
          eq(reciprocalAgreements.isActive, true)
        )
      );
    return result[0];
  }

  async createReciprocalAgreement(agreement: import('../shared/schema.js').InsertReciprocalAgreement): Promise<import('../shared/schema.js').ReciprocalAgreement> {
    const result = await db.insert(reciprocalAgreements).values(agreement).returning();
    return result[0];
  }

  async updateReciprocalAgreement(id: string, agreement: Partial<import('../shared/schema.js').InsertReciprocalAgreement>): Promise<import('../shared/schema.js').ReciprocalAgreement | undefined> {
    const result = await db.update(reciprocalAgreements)
      .set({ ...agreement, updatedAt: new Date() })
      .where(eq(reciprocalAgreements.id, id))
      .returning();
    return result[0];
  }

  async deleteReciprocalAgreement(id: string): Promise<void> {
    await db.delete(reciprocalAgreements).where(eq(reciprocalAgreements.id, id));
  }

  // Employee Tax Configuration
  async getEmployeeTaxConfiguration(employeeId: string): Promise<import('../shared/schema.js').EmployeeTaxConfiguration | undefined> {
    const result = await db.select()
      .from(employeeTaxConfiguration)
      .where(eq(employeeTaxConfiguration.employeeId, employeeId));
    return result[0];
  }

  async createEmployeeTaxConfiguration(config: import('../shared/schema.js').InsertEmployeeTaxConfiguration): Promise<import('../shared/schema.js').EmployeeTaxConfiguration> {
    const result = await db.insert(employeeTaxConfiguration).values(config).returning();
    return result[0];
  }

  async updateEmployeeTaxConfiguration(id: string, config: Partial<import('../shared/schema.js').InsertEmployeeTaxConfiguration>): Promise<import('../shared/schema.js').EmployeeTaxConfiguration | undefined> {
    const result = await db.update(employeeTaxConfiguration)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(employeeTaxConfiguration.id, id))
      .returning();
    return result[0];
  }

  // Tax Data Sources
  async getTaxDataSources(): Promise<import('../shared/schema.js').TaxDataSource[]> {
    return await db.select()
      .from(taxDataSources)
      .where(eq(taxDataSources.isActive, true))
      .orderBy(desc(taxDataSources.taxYear), taxDataSources.dataType);
  }

  async getTaxDataSourceById(id: string): Promise<import('../shared/schema.js').TaxDataSource | undefined> {
    const result = await db.select().from(taxDataSources).where(eq(taxDataSources.id, id));
    return result[0];
  }

  async getTaxDataSourcesByType(dataType: string, taxYear?: number): Promise<import('../shared/schema.js').TaxDataSource[]> {
    if (taxYear) {
      return await db.select()
        .from(taxDataSources)
        .where(
          and(
            eq(taxDataSources.dataType, dataType),
            eq(taxDataSources.taxYear, taxYear),
            eq(taxDataSources.isActive, true)
          )
        )
        .orderBy(desc(taxDataSources.lastUpdated));
    }
    return await db.select()
      .from(taxDataSources)
      .where(
        and(
          eq(taxDataSources.dataType, dataType),
          eq(taxDataSources.isActive, true)
        )
      )
      .orderBy(desc(taxDataSources.taxYear), desc(taxDataSources.lastUpdated));
  }

  async createTaxDataSource(source: import('../shared/schema.js').InsertTaxDataSource): Promise<import('../shared/schema.js').TaxDataSource> {
    const result = await db.insert(taxDataSources).values(source).returning();
    return result[0];
  }

  async updateTaxDataSource(id: string, source: Partial<import('../shared/schema.js').InsertTaxDataSource>): Promise<import('../shared/schema.js').TaxDataSource | undefined> {
    const result = await db.update(taxDataSources)
      .set(source)
      .where(eq(taxDataSources.id, id))
      .returning();
    return result[0];
  }

  // AI Tax Suggestions
  async getAiTaxSuggestions(status?: string): Promise<import('../shared/schema.js').AiTaxSuggestion[]> {
    if (status) {
      return await db.select()
        .from(aiTaxSuggestions)
        .where(eq(aiTaxSuggestions.status, status))
        .orderBy(desc(aiTaxSuggestions.createdAt));
    }
    return await db.select()
      .from(aiTaxSuggestions)
      .orderBy(desc(aiTaxSuggestions.createdAt));
  }

  async getAiTaxSuggestionById(id: string): Promise<import('../shared/schema.js').AiTaxSuggestion | undefined> {
    const result = await db.select().from(aiTaxSuggestions).where(eq(aiTaxSuggestions.id, id));
    return result[0];
  }

  async createAiTaxSuggestion(suggestion: import('../shared/schema.js').InsertAiTaxSuggestion): Promise<import('../shared/schema.js').AiTaxSuggestion> {
    const result = await db.insert(aiTaxSuggestions).values(suggestion).returning();
    return result[0];
  }

  async updateAiTaxSuggestion(id: string, suggestion: Partial<import('../shared/schema.js').InsertAiTaxSuggestion>): Promise<import('../shared/schema.js').AiTaxSuggestion | undefined> {
    const result = await db.update(aiTaxSuggestions)
      .set(suggestion)
      .where(eq(aiTaxSuggestions.id, id))
      .returning();
    return result[0];
  }

  // Auto-fix Audit Log
  async getAutoFixAuditLogs(): Promise<import('../shared/schema.js').AutoFixAuditLog[]> {
    return await db.select()
      .from(autoFixAuditLog)
      .orderBy(desc(autoFixAuditLog.createdAt))
      .limit(100);
  }

  async getAutoFixAuditLogById(id: string): Promise<import('../shared/schema.js').AutoFixAuditLog | undefined> {
    const result = await db.select().from(autoFixAuditLog).where(eq(autoFixAuditLog.id, id));
    return result[0];
  }

  async createAutoFixAuditLog(log: import('../shared/schema.js').InsertAutoFixAuditLog): Promise<import('../shared/schema.js').AutoFixAuditLog> {
    const result = await db.insert(autoFixAuditLog).values(log).returning();
    return result[0];
  }

  // Timesheet Management
  async getTimesheetEntries(payPeriodStart: string, payPeriodEnd: string): Promise<TimesheetEntry[]> {
    return await db.select()
      .from(timesheetEntries)
      .where(and(
        eq(timesheetEntries.payPeriodStart, payPeriodStart),
        eq(timesheetEntries.payPeriodEnd, payPeriodEnd)
      ));
  }

  async getTimesheetEntryByEmployeeAndPeriod(employeeId: string, payPeriodStart: string, payPeriodEnd: string): Promise<TimesheetEntry | undefined> {
    const result = await db.select()
      .from(timesheetEntries)
      .where(and(
        eq(timesheetEntries.employeeId, employeeId),
        eq(timesheetEntries.payPeriodStart, payPeriodStart),
        eq(timesheetEntries.payPeriodEnd, payPeriodEnd)
      ));
    return result[0];
  }

  async createTimesheetEntry(entry: InsertTimesheetEntry): Promise<TimesheetEntry> {
    const result = await db.insert(timesheetEntries).values(entry).returning();
    return result[0];
  }

  async updateTimesheetEntry(id: string, entry: Partial<InsertTimesheetEntry>): Promise<TimesheetEntry | undefined> {
    const result = await db.update(timesheetEntries)
      .set({ ...entry, updatedAt: new Date() })
      .where(eq(timesheetEntries.id, id))
      .returning();
    return result[0];
  }

  async bulkCreateTimesheetEntries(entries: InsertTimesheetEntry[]): Promise<TimesheetEntry[]> {
    if (entries.length === 0) return [];
    return await db.insert(timesheetEntries).values(entries).returning();
  }

  async getApprovedTimesheetsByPeriod(payPeriodStart: string, payPeriodEnd: string): Promise<TimesheetEntry[]> {
    return await db.select()
      .from(timesheetEntries)
      .where(and(
        eq(timesheetEntries.payPeriodStart, payPeriodStart),
        eq(timesheetEntries.payPeriodEnd, payPeriodEnd),
        eq(timesheetEntries.status, 'Approved')
      ));
  }

  // Timesheet Approvals
  async createTimesheetApproval(approval: InsertTimesheetApproval): Promise<TimesheetApproval> {
    const result = await db.insert(timesheetApprovals).values(approval).returning();
    return result[0];
  }

  async getTimesheetApprovalsByTimesheetId(timesheetId: string): Promise<TimesheetApproval[]> {
    return await db.select()
      .from(timesheetApprovals)
      .where(eq(timesheetApprovals.timesheetId, timesheetId))
      .orderBy(desc(timesheetApprovals.createdAt));
  }

  // Payroll Locks
  async getPayrollLock(payPeriodStart: string, payPeriodEnd: string): Promise<PayrollLock | undefined> {
    const result = await db.select()
      .from(payrollLocks)
      .where(and(
        eq(payrollLocks.payPeriodStart, payPeriodStart),
        eq(payrollLocks.payPeriodEnd, payPeriodEnd)
      ));
    return result[0];
  }

  async createPayrollLock(lock: InsertPayrollLock): Promise<PayrollLock> {
    const result = await db.insert(payrollLocks).values(lock).returning();
    return result[0];
  }

  async updatePayrollLock(id: string, lock: Partial<InsertPayrollLock>): Promise<PayrollLock | undefined> {
    const result = await db.update(payrollLocks)
      .set(lock)
      .where(eq(payrollLocks.id, id))
      .returning();
    return result[0];
  }

  // Permission Management
  async getPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions).orderBy(permissions.category, permissions.name);
  }

  async getPermissionById(id: string): Promise<Permission | undefined> {
    const result = await db.select().from(permissions).where(eq(permissions.id, id));
    return result[0];
  }

  async getPermissionByCode(code: string): Promise<Permission | undefined> {
    const result = await db.select().from(permissions).where(eq(permissions.code, code));
    return result[0];
  }

  async getPermissionsByCategory(category: string): Promise<Permission[]> {
    return await db.select()
      .from(permissions)
      .where(eq(permissions.category, category))
      .orderBy(permissions.name);
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const result = await db.insert(permissions).values(permission).returning();
    return result[0];
  }

  async updatePermission(id: string, permission: Partial<InsertPermission>): Promise<Permission | undefined> {
    const result = await db.update(permissions)
      .set(permission)
      .where(eq(permissions.id, id))
      .returning();
    return result[0];
  }

  async deletePermission(id: string): Promise<void> {
    await db.delete(permissions).where(eq(permissions.id, id));
  }

  // Role-Permission Mapping
  async getRolePermissions(role: string): Promise<RolePermission[]> {
    return await db.select()
      .from(rolePermissions)
      .where(eq(rolePermissions.role, role))
      .orderBy(rolePermissions.createdAt);
  }

  async assignPermissionToRole(rolePermission: InsertRolePermission): Promise<RolePermission> {
    const result = await db.insert(rolePermissions).values(rolePermission).returning();
    return result[0];
  }

  async revokePermissionFromRole(role: string, permissionId: string): Promise<void> {
    await db.delete(rolePermissions)
      .where(and(
        eq(rolePermissions.role, role),
        eq(rolePermissions.permissionId, permissionId)
      ));
  }

  async hasPermission(role: string, permissionCode: string): Promise<boolean> {
    const result = await db.select()
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(and(
        eq(rolePermissions.role, role),
        eq(permissions.code, permissionCode)
      ))
      .limit(1);
    return result.length > 0;
  }

  // Timesheet Correction Requests
  async getCorrectionRequests(filters?: { timesheetEntryId?: string; requestedById?: string; status?: string }): Promise<TimesheetCorrectionRequest[]> {
    const conditions = [];
    if (filters?.timesheetEntryId) {
      conditions.push(eq(timesheetCorrectionRequests.timesheetEntryId, filters.timesheetEntryId));
    }
    if (filters?.requestedById) {
      conditions.push(eq(timesheetCorrectionRequests.requestedById, filters.requestedById));
    }
    if (filters?.status) {
      conditions.push(eq(timesheetCorrectionRequests.status, filters.status as any));
    }

    const query = db.select().from(timesheetCorrectionRequests);
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(timesheetCorrectionRequests.createdAt));
    }
    return await query.orderBy(desc(timesheetCorrectionRequests.createdAt));
  }

  async getCorrectionRequestById(id: string): Promise<TimesheetCorrectionRequest | undefined> {
    const result = await db.select().from(timesheetCorrectionRequests).where(eq(timesheetCorrectionRequests.id, id));
    return result[0];
  }

  async createCorrectionRequest(request: InsertTimesheetCorrectionRequest): Promise<TimesheetCorrectionRequest> {
    const result = await db.insert(timesheetCorrectionRequests).values(request).returning();
    return result[0];
  }

  async updateCorrectionRequest(id: string, request: Partial<InsertTimesheetCorrectionRequest>): Promise<TimesheetCorrectionRequest | undefined> {
    const result = await db.update(timesheetCorrectionRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(timesheetCorrectionRequests.id, id))
      .returning();
    return result[0];
  }

  async approveCorrectionRequest(id: string, reviewerId: string, reviewNotes?: string): Promise<TimesheetCorrectionRequest | undefined> {
    const result = await db.update(timesheetCorrectionRequests)
      .set({
        status: 'Approved',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes,
        updatedAt: new Date()
      })
      .where(eq(timesheetCorrectionRequests.id, id))
      .returning();
    return result[0];
  }

  async rejectCorrectionRequest(id: string, reviewerId: string, reviewNotes: string): Promise<TimesheetCorrectionRequest | undefined> {
    const result = await db.update(timesheetCorrectionRequests)
      .set({
        status: 'Rejected',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes,
        updatedAt: new Date()
      })
      .where(eq(timesheetCorrectionRequests.id, id))
      .returning();
    return result[0];
  }

  // Timesheet Change Audit Trail
  async getTimesheetChangeAudit(timesheetEntryId: string): Promise<TimesheetChangeAudit[]> {
    return await db.select()
      .from(timesheetChangeAudit)
      .where(eq(timesheetChangeAudit.timesheetEntryId, timesheetEntryId))
      .orderBy(desc(timesheetChangeAudit.changedAt));
  }

  async createTimesheetChangeAudit(audit: InsertTimesheetChangeAudit): Promise<TimesheetChangeAudit> {
    const result = await db.insert(timesheetChangeAudit).values(audit).returning();
    return result[0];
  }

  // Atomic correction approval - all operations in a single transaction
  async approveCorrectionRequestAtomic(
    id: string,
    reviewerId: string,
    changeType: 'Manager_Correction' | 'HR_Override',
    reviewNotes?: string
  ): Promise<TimesheetCorrectionRequest> {
    return await db.transaction(async (tx) => {
      // Step 1: Get the correction request
      const correctionRequestResult = await tx
        .select()
        .from(timesheetCorrectionRequests)
        .where(eq(timesheetCorrectionRequests.id, id));
      
      const correctionRequest = correctionRequestResult[0];
      if (!correctionRequest) {
        throw new Error('Correction request not found');
      }

      if (correctionRequest.status !== 'Pending') {
        throw new Error('Correction request has already been reviewed');
      }

      // Step 2: Update the correction request to Approved
      const approvedRequestResult = await tx
        .update(timesheetCorrectionRequests)
        .set({
          status: 'Approved',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          reviewNotes,
          updatedAt: new Date()
        })
        .where(eq(timesheetCorrectionRequests.id, id))
        .returning();

      const approvedRequest = approvedRequestResult[0];

      // Step 3: Apply the changes to the timesheet entry
      await tx
        .update(timesheetEntries)
        .set(correctionRequest.requestedValues as any)
        .where(eq(timesheetEntries.id, correctionRequest.timesheetEntryId));

      // Step 4: Create audit trail entry
      await tx.insert(timesheetChangeAudit).values({
        timesheetEntryId: correctionRequest.timesheetEntryId,
        changedBy: reviewerId,
        changeType,
        oldValues: correctionRequest.originalValues as any,
        newValues: correctionRequest.requestedValues as any,
        justification: `Approved correction request: ${reviewNotes || 'No notes provided'}`,
        correctionRequestId: id
      });

      return approvedRequest;
    });
  }

  // Atomic correction rejection - all operations in a single transaction
  async rejectCorrectionRequestAtomic(
    id: string,
    reviewerId: string,
    reviewNotes: string
  ): Promise<TimesheetCorrectionRequest> {
    return await db.transaction(async (tx) => {
      // Step 1: Get the correction request
      const correctionRequestResult = await tx
        .select()
        .from(timesheetCorrectionRequests)
        .where(eq(timesheetCorrectionRequests.id, id));
      
      const correctionRequest = correctionRequestResult[0];
      if (!correctionRequest) {
        throw new Error('Correction request not found');
      }

      if (correctionRequest.status !== 'Pending') {
        throw new Error('Correction request has already been reviewed');
      }

      // Step 2: Update the correction request to Rejected
      const rejectedRequestResult = await tx
        .update(timesheetCorrectionRequests)
        .set({
          status: 'Rejected',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          reviewNotes,
          updatedAt: new Date()
        })
        .where(eq(timesheetCorrectionRequests.id, id))
        .returning();

      return rejectedRequestResult[0];
    });
  }

  // ==================== PHASE 3: ADVANCED ACCESS CONTROL ====================

  // Permission Templates
  async getPermissionTemplates(): Promise<PermissionTemplate[]> {
    return db.select().from(permissionTemplates).orderBy(permissionTemplates.name);
  }

  async getPermissionTemplateById(id: string): Promise<PermissionTemplate | undefined> {
    const result = await db.select().from(permissionTemplates).where(eq(permissionTemplates.id, id));
    return result[0];
  }

  async createPermissionTemplate(template: InsertPermissionTemplate): Promise<PermissionTemplate> {
    const result = await db.insert(permissionTemplates).values(template).returning();
    return result[0];
  }

  async updatePermissionTemplate(id: string, template: Partial<InsertPermissionTemplate>): Promise<PermissionTemplate | undefined> {
    const result = await db
      .update(permissionTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(permissionTemplates.id, id))
      .returning();
    return result[0];
  }

  async deletePermissionTemplate(id: string): Promise<void> {
    await db.delete(permissionTemplates).where(eq(permissionTemplates.id, id));
  }

  async applyTemplateToRole(templateId: string, role: string, appliedBy: string): Promise<void> {
    return await db.transaction(async (tx) => {
      const templateResult = await tx
        .select()
        .from(permissionTemplates)
        .where(eq(permissionTemplates.id, templateId));
      
      const template = templateResult[0];
      if (!template) {
        throw new Error('Permission template not found');
      }

      for (const permissionId of template.permissionIds) {
        const existing = await tx
          .select()
          .from(rolePermissions)
          .where(and(
            eq(rolePermissions.role, role),
            eq(rolePermissions.permissionId, permissionId)
          ));

        if (existing.length === 0) {
          await tx.insert(rolePermissions).values({
            role,
            permissionId
          });
        }
      }

      await tx.insert(permissionChangeAudit).values({
        targetType: 'role',
        targetId: role,
        changeType: 'template_apply',
        permissionIds: template.permissionIds,
        changedBy: appliedBy,
        reason: `Applied template: ${template.name}`,
        metadata: { templateId, templateName: template.name }
      });
    });
  }

  // Role Hierarchy
  async getRoleHierarchy(): Promise<RoleHierarchy[]> {
    return db.select().from(roleHierarchy);
  }

  async getRoleHierarchyByRole(role: string): Promise<RoleHierarchy | undefined> {
    const result = await db.select().from(roleHierarchy).where(eq(roleHierarchy.role, role));
    return result[0];
  }

  async createRoleHierarchy(hierarchy: InsertRoleHierarchy): Promise<RoleHierarchy> {
    const result = await db.insert(roleHierarchy).values(hierarchy).returning();
    return result[0];
  }

  async updateRoleHierarchy(id: string, hierarchy: Partial<InsertRoleHierarchy>): Promise<RoleHierarchy | undefined> {
    const result = await db
      .update(roleHierarchy)
      .set(hierarchy)
      .where(eq(roleHierarchy.id, id))
      .returning();
    return result[0];
  }

  async getInheritedPermissions(role: string): Promise<Permission[]> {
    const inheritedPermissions: Permission[] = [];
    const visitedRoles = new Set<string>();
    
    const getPermissionsRecursive = async (currentRole: string): Promise<void> => {
      if (visitedRoles.has(currentRole)) {
        return;
      }
      visitedRoles.add(currentRole);

      const hierarchyResult = await db
        .select()
        .from(roleHierarchy)
        .where(eq(roleHierarchy.role, currentRole));
      
      const hierarchy = hierarchyResult[0];
      
      if (hierarchy?.parentRole && hierarchy.inheritsPermissions) {
        const parentPermissions = await db
          .select({ permission: permissions })
          .from(rolePermissions)
          .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
          .where(eq(rolePermissions.role, hierarchy.parentRole));

        for (const { permission } of parentPermissions) {
          if (!inheritedPermissions.some(p => p.id === permission.id)) {
            inheritedPermissions.push(permission);
          }
        }

        await getPermissionsRecursive(hierarchy.parentRole);
      }
    };

    await getPermissionsRecursive(role);
    return inheritedPermissions;
  }

  // Time-Based Permission Grants
  async getActiveTimeBasedGrants(userId: string): Promise<TimeBasedPermissionGrant[]> {
    const now = new Date();
    return db
      .select()
      .from(timeBasedPermissionGrants)
      .where(and(
        eq(timeBasedPermissionGrants.userId, userId),
        eq(timeBasedPermissionGrants.isActive, true),
        gte(timeBasedPermissionGrants.endTime, now)
      ))
      .orderBy(desc(timeBasedPermissionGrants.createdAt));
  }

  async getAllTimeBasedGrants(userId?: string): Promise<TimeBasedPermissionGrant[]> {
    if (userId) {
      return db
        .select()
        .from(timeBasedPermissionGrants)
        .where(eq(timeBasedPermissionGrants.userId, userId))
        .orderBy(desc(timeBasedPermissionGrants.createdAt));
    }
    return db.select().from(timeBasedPermissionGrants).orderBy(desc(timeBasedPermissionGrants.createdAt));
  }

  async createTimeBasedGrant(grant: InsertTimeBasedPermissionGrant): Promise<TimeBasedPermissionGrant> {
    const result = await db.insert(timeBasedPermissionGrants).values(grant).returning();
    return result[0];
  }

  async revokeTimeBasedGrant(id: string, revokedBy: string): Promise<void> {
    await db
      .update(timeBasedPermissionGrants)
      .set({
        isActive: false,
        revokedBy,
        revokedAt: new Date()
      })
      .where(eq(timeBasedPermissionGrants.id, id));
  }

  async expireOldGrants(): Promise<number> {
    const now = new Date();
    const result = await db
      .update(timeBasedPermissionGrants)
      .set({ isActive: false })
      .where(and(
        lte(timeBasedPermissionGrants.endTime, now),
        eq(timeBasedPermissionGrants.isActive, true)
      ))
      .returning();
    
    return result.length;
  }

  // Permission Requests
  async getPermissionRequests(filters?: { requestedById?: string; status?: string }): Promise<PermissionRequest[]> {
    let query = db.select().from(permissionRequests);

    const conditions = [];
    if (filters?.requestedById) {
      conditions.push(eq(permissionRequests.requestedById, filters.requestedById));
    }
    if (filters?.status) {
      conditions.push(eq(permissionRequests.status, filters.status as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return query.orderBy(desc(permissionRequests.createdAt));
  }

  async getPermissionRequestById(id: string): Promise<PermissionRequest | undefined> {
    const result = await db.select().from(permissionRequests).where(eq(permissionRequests.id, id));
    return result[0];
  }

  async createPermissionRequest(request: InsertPermissionRequest): Promise<PermissionRequest> {
    const result = await db.insert(permissionRequests).values(request).returning();
    return result[0];
  }

  async approvePermissionRequest(id: string, reviewerId: string, reviewNotes?: string): Promise<PermissionRequest> {
    return await db.transaction(async (tx) => {
      const requestResult = await tx
        .select()
        .from(permissionRequests)
        .where(eq(permissionRequests.id, id));
      
      const request = requestResult[0];
      if (!request) {
        throw new Error('Permission request not found');
      }

      if (request.status !== 'Pending') {
        throw new Error('Permission request has already been reviewed');
      }

      const reviewerResult = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.id, reviewerId));
      
      const reviewer = reviewerResult[0];
      if (!reviewer || !reviewer.role) {
        throw new Error('Reviewer not found or has no role');
      }

      if (request.requestType === 'permanent') {
        for (const permissionId of request.permissionIds) {
          const existing = await tx
            .select()
            .from(rolePermissions)
            .where(and(
              eq(rolePermissions.role, reviewer.role),
              eq(rolePermissions.permissionId, permissionId)
            ));

          if (existing.length === 0) {
            await tx.insert(rolePermissions).values({
              role: reviewer.role,
              permissionId
            });
          }
        }

        await tx.insert(permissionChangeAudit).values({
          targetType: 'role',
          targetId: reviewer.role,
          changeType: 'grant',
          permissionIds: request.permissionIds,
          changedBy: reviewerId,
          reason: `Approved permission request: ${request.justification}`,
          metadata: { requestId: id }
        });
      } else if (request.requestType === 'temporary') {
        const durationHours = request.duration || 24;
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + durationHours);

        for (const permissionId of request.permissionIds) {
          await tx.insert(timeBasedPermissionGrants).values({
            userId: request.requestedById,
            permissionId,
            grantedBy: reviewerId,
            reason: `Approved request: ${request.justification}`,
            endTime
          });
        }

        await tx.insert(permissionChangeAudit).values({
          targetType: 'user',
          targetId: request.requestedById,
          changeType: 'grant',
          permissionIds: request.permissionIds,
          changedBy: reviewerId,
          reason: `Approved temporary permission request (${durationHours}h): ${request.justification}`,
          metadata: { requestId: id, duration: durationHours }
        });
      }

      const approvedResult = await tx
        .update(permissionRequests)
        .set({
          status: 'Approved',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          reviewNotes,
          updatedAt: new Date()
        })
        .where(eq(permissionRequests.id, id))
        .returning();

      return approvedResult[0];
    });
  }

  async rejectPermissionRequest(id: string, reviewerId: string, reviewNotes: string): Promise<PermissionRequest> {
    const result = await db
      .update(permissionRequests)
      .set({
        status: 'Rejected',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes,
        updatedAt: new Date()
      })
      .where(eq(permissionRequests.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error('Permission request not found');
    }
    
    return result[0];
  }

  // Permission Change Audit
  async getPermissionChangeAudit(targetType?: string, targetId?: string): Promise<PermissionChangeAudit[]> {
    let query = db.select().from(permissionChangeAudit);

    const conditions = [];
    if (targetType) {
      conditions.push(eq(permissionChangeAudit.targetType, targetType));
    }
    if (targetId) {
      conditions.push(eq(permissionChangeAudit.targetId, targetId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return query.orderBy(desc(permissionChangeAudit.changedAt));
  }

  async createPermissionChangeAudit(audit: InsertPermissionChangeAudit): Promise<PermissionChangeAudit> {
    const result = await db.insert(permissionChangeAudit).values(audit).returning();
    return result[0];
  }

  // Bulk Operations
  async bulkAssignPermissions(role: string, permissionIds: string[], assignedBy: string, reason?: string): Promise<void> {
    return await db.transaction(async (tx) => {
      for (const permissionId of permissionIds) {
        const existing = await tx
          .select()
          .from(rolePermissions)
          .where(and(
            eq(rolePermissions.role, role),
            eq(rolePermissions.permissionId, permissionId)
          ));

        if (existing.length === 0) {
          await tx.insert(rolePermissions).values({
            role,
            permissionId
          });
        }
      }

      await tx.insert(permissionChangeAudit).values({
        targetType: 'role',
        targetId: role,
        changeType: 'grant',
        permissionIds,
        changedBy: assignedBy,
        reason: reason || 'Bulk permission assignment',
        metadata: { bulk: true, count: permissionIds.length }
      });
    });
  }

  async bulkRevokePermissions(role: string, permissionIds: string[], revokedBy: string, reason?: string): Promise<void> {
    return await db.transaction(async (tx) => {
      for (const permissionId of permissionIds) {
        await tx
          .delete(rolePermissions)
          .where(and(
            eq(rolePermissions.role, role),
            eq(rolePermissions.permissionId, permissionId)
          ));
      }

      await tx.insert(permissionChangeAudit).values({
        targetType: 'role',
        targetId: role,
        changeType: 'revoke',
        permissionIds,
        changedBy: revokedBy,
        reason: reason || 'Bulk permission revocation',
        metadata: { bulk: true, count: permissionIds.length }
      });
    });
  }

  // Access Levels
  async getAccessLevels(): Promise<AccessLevel[]> {
    return db.select().from(accessLevels).orderBy(desc(accessLevels.priority));
  }

  async getAccessLevelById(id: string): Promise<AccessLevel | undefined> {
    const result = await db.select().from(accessLevels).where(eq(accessLevels.id, id));
    return result[0];
  }

  async createAccessLevel(accessLevel: InsertAccessLevel): Promise<AccessLevel> {
    const result = await db.insert(accessLevels).values(accessLevel).returning();
    return result[0];
  }

  async updateAccessLevel(id: string, accessLevel: Partial<InsertAccessLevel>): Promise<AccessLevel | undefined> {
    const result = await db
      .update(accessLevels)
      .set({ ...accessLevel, updatedAt: new Date() })
      .where(eq(accessLevels.id, id))
      .returning();
    return result[0];
  }

  async deleteAccessLevel(id: string): Promise<void> {
    await db.delete(accessLevels).where(eq(accessLevels.id, id));
  }

  // Employee Access Assignments
  async getEmployeeAccessAssignments(): Promise<EmployeeAccessAssignment[]> {
    return db.select().from(employeeAccessAssignments);
  }

  async getEmployeeAccessAssignmentByEmployeeId(employeeId: string): Promise<EmployeeAccessAssignment | undefined> {
    const result = await db
      .select()
      .from(employeeAccessAssignments)
      .where(eq(employeeAccessAssignments.employeeId, employeeId));
    return result[0];
  }

  async assignEmployeeAccessLevel(assignment: InsertEmployeeAccessAssignment): Promise<EmployeeAccessAssignment> {
    const existing = await this.getEmployeeAccessAssignmentByEmployeeId(assignment.employeeId);
    
    if (existing) {
      const result = await db
        .update(employeeAccessAssignments)
        .set({
          ...assignment,
          updatedAt: new Date()
        })
        .where(eq(employeeAccessAssignments.employeeId, assignment.employeeId))
        .returning();
      return result[0];
    } else {
      const result = await db
        .insert(employeeAccessAssignments)
        .values(assignment)
        .returning();
      return result[0];
    }
  }

  async revokeEmployeeAccessLevel(employeeId: string): Promise<void> {
    await db
      .delete(employeeAccessAssignments)
      .where(eq(employeeAccessAssignments.employeeId, employeeId));
  }

  async bulkAssignEmployeeAccessLevels(assignments: InsertEmployeeAccessAssignment[]): Promise<void> {
    return await db.transaction(async (tx) => {
      for (const assignment of assignments) {
        const existing = await tx
          .select()
          .from(employeeAccessAssignments)
          .where(eq(employeeAccessAssignments.employeeId, assignment.employeeId));

        if (existing.length > 0) {
          await tx
            .update(employeeAccessAssignments)
            .set({
              ...assignment,
              updatedAt: new Date()
            })
            .where(eq(employeeAccessAssignments.employeeId, assignment.employeeId));
        } else {
          await tx.insert(employeeAccessAssignments).values(assignment);
        }
      }
    });
  }

  // Bootstrap Helper: Ensure default access levels exist
  async ensureDefaultAccessLevels(): Promise<void> {
    const existing = await this.getAccessLevels();
    
    if (existing.length > 0) {
      console.log(`✅ Access levels already seeded (${existing.length} levels exist)`);
      return;
    }

    console.log('🌱 Seeding default access levels...');

    const defaultAccessLevels: InsertAccessLevel[] = [
      {
        name: 'CEO',
        code: 'ceo',
        description: 'Chief Executive Officer - Complete organizational access',
        priority: 100
      },
      {
        name: 'C-Suite Executive',
        code: 'c_suite_exec',
        description: 'C-level executive - Strategic access to all departments',
        priority: 90
      },
      {
        name: 'Department Head',
        code: 'dept_head',
        description: 'VP/Director - Full access to department data and team management',
        priority: 70
      },
      {
        name: 'Manager',
        code: 'manager',
        description: 'Manager - Access to direct reports and team data',
        priority: 50
      },
      {
        name: 'HR Administrator',
        code: 'hr_admin',
        description: 'HR Administrator - Full HR system access',
        priority: 80
      },
      {
        name: 'HR Staff',
        code: 'hr_staff',
        description: 'HR Staff - Access to employee data and compensation',
        priority: 60
      },
      {
        name: 'Employee',
        code: 'employee',
        description: 'Standard employee - Basic access to own data',
        priority: 10
      }
    ];

    for (const level of defaultAccessLevels) {
      await this.createAccessLevel(level);
    }

    console.log(`✅ Seeded ${defaultAccessLevels.length} default access levels`);
  }

  // ============================================================================
  // COMPLIANCE MANAGEMENT SYSTEM IMPLEMENTATION
  // ============================================================================

  // Compliance Frameworks
  async getComplianceFrameworks(): Promise<ComplianceFramework[]> {
    return db.select().from(complianceFrameworks).orderBy(desc(complianceFrameworks.createdAt));
  }

  async getComplianceFrameworkById(id: string): Promise<ComplianceFramework | undefined> {
    const result = await db.select().from(complianceFrameworks).where(eq(complianceFrameworks.id, id));
    return result[0];
  }

  async getActiveComplianceFrameworks(): Promise<ComplianceFramework[]> {
    return db.select().from(complianceFrameworks)
      .where(eq(complianceFrameworks.isActive, true))
      .orderBy(desc(complianceFrameworks.createdAt));
  }

  async getComplianceFrameworksByStatus(status: string): Promise<ComplianceFramework[]> {
    return db.select().from(complianceFrameworks)
      .where(eq(complianceFrameworks.overallStatus, status as any))
      .orderBy(desc(complianceFrameworks.createdAt));
  }

  async createComplianceFramework(framework: InsertComplianceFramework): Promise<ComplianceFramework> {
    const result = await db.insert(complianceFrameworks).values(framework).returning();
    return result[0];
  }

  async updateComplianceFramework(id: string, framework: Partial<InsertComplianceFramework>): Promise<ComplianceFramework | undefined> {
    const result = await db
      .update(complianceFrameworks)
      .set({ ...framework, updatedAt: new Date() })
      .where(eq(complianceFrameworks.id, id))
      .returning();
    return result[0];
  }

  async deleteComplianceFramework(id: string): Promise<void> {
    await db.delete(complianceFrameworks).where(eq(complianceFrameworks.id, id));
  }

  // Compliance Controls
  async getComplianceControls(): Promise<ComplianceControl[]> {
    return db.select().from(complianceControls).orderBy(desc(complianceControls.createdAt));
  }

  async getComplianceControlById(id: string): Promise<ComplianceControl | undefined> {
    const result = await db.select().from(complianceControls).where(eq(complianceControls.id, id));
    return result[0];
  }

  async getComplianceControlsByFramework(frameworkId: string): Promise<ComplianceControl[]> {
    return db.select().from(complianceControls)
      .where(eq(complianceControls.frameworkId, frameworkId))
      .orderBy(complianceControls.priority);
  }

  async getOverdueComplianceControls(): Promise<ComplianceControl[]> {
    const now = new Date();
    return db.select().from(complianceControls)
      .where(and(
        isNotNull(complianceControls.dueDate),
        lte(complianceControls.dueDate, now)
      ))
      .orderBy(complianceControls.dueDate);
  }

  async createComplianceControl(control: InsertComplianceControl): Promise<ComplianceControl> {
    const result = await db.insert(complianceControls).values(control).returning();
    return result[0];
  }

  async updateComplianceControl(id: string, control: Partial<InsertComplianceControl>): Promise<ComplianceControl | undefined> {
    const result = await db
      .update(complianceControls)
      .set({ ...control, updatedAt: new Date() })
      .where(eq(complianceControls.id, id))
      .returning();
    return result[0];
  }

  async deleteComplianceControl(id: string): Promise<void> {
    await db.delete(complianceControls).where(eq(complianceControls.id, id));
  }

  // Compliance Evidence
  async getComplianceEvidence(): Promise<ComplianceEvidence[]> {
    return db.select().from(complianceEvidence).orderBy(desc(complianceEvidence.createdAt));
  }

  async getComplianceEvidenceById(id: string): Promise<ComplianceEvidence | undefined> {
    const result = await db.select().from(complianceEvidence).where(eq(complianceEvidence.id, id));
    return result[0];
  }

  async getComplianceEvidenceByControl(controlId: string): Promise<ComplianceEvidence[]> {
    return db.select().from(complianceEvidence)
      .where(eq(complianceEvidence.controlId, controlId))
      .orderBy(desc(complianceEvidence.createdAt));
  }

  async createComplianceEvidence(evidence: InsertComplianceEvidence): Promise<ComplianceEvidence> {
    const result = await db.insert(complianceEvidence).values(evidence).returning();
    return result[0];
  }

  async updateComplianceEvidence(id: string, evidence: Partial<InsertComplianceEvidence>): Promise<ComplianceEvidence | undefined> {
    const result = await db
      .update(complianceEvidence)
      .set(evidence)
      .where(eq(complianceEvidence.id, id))
      .returning();
    return result[0];
  }

  async deleteComplianceEvidence(id: string): Promise<void> {
    await db.delete(complianceEvidence).where(eq(complianceEvidence.id, id));
  }

  // Compliance Alerts
  async getComplianceAlerts(): Promise<ComplianceAlert[]> {
    return db.select().from(complianceAlerts).orderBy(desc(complianceAlerts.createdAt));
  }

  async getComplianceAlertById(id: string): Promise<ComplianceAlert | undefined> {
    const result = await db.select().from(complianceAlerts).where(eq(complianceAlerts.id, id));
    return result[0];
  }

  async getOpenComplianceAlerts(): Promise<ComplianceAlert[]> {
    return db.select().from(complianceAlerts)
      .where(eq(complianceAlerts.status, 'open'))
      .orderBy(desc(complianceAlerts.createdAt));
  }

  async getComplianceAlertsBySeverity(severity: string): Promise<ComplianceAlert[]> {
    return db.select().from(complianceAlerts)
      .where(eq(complianceAlerts.severity, severity as any))
      .orderBy(desc(complianceAlerts.createdAt));
  }

  async createComplianceAlert(alert: InsertComplianceAlert): Promise<ComplianceAlert> {
    const result = await db.insert(complianceAlerts).values(alert).returning();
    return result[0];
  }

  async updateComplianceAlert(id: string, alert: Partial<InsertComplianceAlert>): Promise<ComplianceAlert | undefined> {
    const result = await db
      .update(complianceAlerts)
      .set({ ...alert, updatedAt: new Date() })
      .where(eq(complianceAlerts.id, id))
      .returning();
    return result[0];
  }

  async acknowledgeComplianceAlert(id: string, acknowledgedById: string): Promise<ComplianceAlert | undefined> {
    const result = await db
      .update(complianceAlerts)
      .set({
        status: 'acknowledged',
        acknowledgedAt: new Date(),
        acknowledgedById,
        updatedAt: new Date()
      })
      .where(eq(complianceAlerts.id, id))
      .returning();
    return result[0];
  }

  async resolveComplianceAlert(id: string, resolvedById: string, resolutionNotes?: string): Promise<ComplianceAlert | undefined> {
    const result = await db
      .update(complianceAlerts)
      .set({
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedById,
        resolutionNotes,
        updatedAt: new Date()
      })
      .where(eq(complianceAlerts.id, id))
      .returning();
    return result[0];
  }

  // Compliance Audit Trail
  async createComplianceAuditEntry(entry: InsertComplianceAuditTrail): Promise<ComplianceAuditTrail> {
    const result = await db.insert(complianceAuditTrail).values(entry).returning();
    return result[0];
  }

  async getComplianceAuditTrail(filters?: { category?: string; startDate?: string; endDate?: string; actorId?: string }): Promise<ComplianceAuditTrail[]> {
    let query = db.select().from(complianceAuditTrail);
    const conditions: any[] = [];

    if (filters?.category) {
      conditions.push(eq(complianceAuditTrail.category, filters.category as any));
    }
    if (filters?.actorId) {
      conditions.push(eq(complianceAuditTrail.actorId, filters.actorId));
    }
    if (filters?.startDate) {
      conditions.push(gte(complianceAuditTrail.createdAt, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      conditions.push(lte(complianceAuditTrail.createdAt, new Date(filters.endDate)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return query.orderBy(desc(complianceAuditTrail.createdAt));
  }

  // Compliance Policies
  async getCompliancePolicies(): Promise<CompliancePolicy[]> {
    return db.select().from(compliancePolicies).orderBy(desc(compliancePolicies.createdAt));
  }

  async getCompliancePolicyById(id: string): Promise<CompliancePolicy | undefined> {
    const result = await db.select().from(compliancePolicies).where(eq(compliancePolicies.id, id));
    return result[0];
  }

  async getActiveCompliancePolicies(): Promise<CompliancePolicy[]> {
    return db.select().from(compliancePolicies)
      .where(eq(compliancePolicies.isActive, true))
      .orderBy(desc(compliancePolicies.createdAt));
  }

  async createCompliancePolicy(policy: InsertCompliancePolicy): Promise<CompliancePolicy> {
    const result = await db.insert(compliancePolicies).values(policy).returning();
    return result[0];
  }

  async updateCompliancePolicy(id: string, policy: Partial<InsertCompliancePolicy>): Promise<CompliancePolicy | undefined> {
    const result = await db
      .update(compliancePolicies)
      .set({ ...policy, updatedAt: new Date() })
      .where(eq(compliancePolicies.id, id))
      .returning();
    return result[0];
  }

  async deleteCompliancePolicy(id: string): Promise<void> {
    await db.delete(compliancePolicies).where(eq(compliancePolicies.id, id));
  }

  // Policy Acknowledgments
  async getPolicyAcknowledgments(): Promise<PolicyAcknowledgment[]> {
    return db.select().from(policyAcknowledgments).orderBy(desc(policyAcknowledgments.createdAt));
  }

  async getPolicyAcknowledgmentById(id: string): Promise<PolicyAcknowledgment | undefined> {
    const result = await db.select().from(policyAcknowledgments).where(eq(policyAcknowledgments.id, id));
    return result[0];
  }

  async getPolicyAcknowledgmentsByPolicy(policyId: string): Promise<PolicyAcknowledgment[]> {
    return db.select().from(policyAcknowledgments)
      .where(eq(policyAcknowledgments.policyId, policyId))
      .orderBy(desc(policyAcknowledgments.acknowledgedAt));
  }

  async getEmployeePendingPolicyAcknowledgments(employeeId: string): Promise<CompliancePolicy[]> {
    const acknowledgedPolicies = await db
      .select({ policyId: policyAcknowledgments.policyId })
      .from(policyAcknowledgments)
      .where(eq(policyAcknowledgments.employeeId, employeeId));
    
    const acknowledgedPolicyIds = acknowledgedPolicies.map(p => p.policyId);
    
    if (acknowledgedPolicyIds.length === 0) {
      return db.select().from(compliancePolicies)
        .where(and(
          eq(compliancePolicies.isActive, true),
          eq(compliancePolicies.requiresAcknowledgment, true)
        ))
        .orderBy(desc(compliancePolicies.createdAt));
    }
    
    return db.select().from(compliancePolicies)
      .where(and(
        eq(compliancePolicies.isActive, true),
        eq(compliancePolicies.requiresAcknowledgment, true),
        notInArray(compliancePolicies.id, acknowledgedPolicyIds)
      ))
      .orderBy(desc(compliancePolicies.createdAt));
  }

  async createPolicyAcknowledgment(acknowledgment: InsertPolicyAcknowledgment): Promise<PolicyAcknowledgment> {
    const result = await db.insert(policyAcknowledgments).values(acknowledgment).returning();
    return result[0];
  }

  async updatePolicyAcknowledgment(id: string, acknowledgment: Partial<InsertPolicyAcknowledgment>): Promise<PolicyAcknowledgment | undefined> {
    const result = await db
      .update(policyAcknowledgments)
      .set(acknowledgment)
      .where(eq(policyAcknowledgments.id, id))
      .returning();
    return result[0];
  }

  async deletePolicyAcknowledgment(id: string): Promise<void> {
    await db.delete(policyAcknowledgments).where(eq(policyAcknowledgments.id, id));
  }

  // Regulatory Updates
  async getRegulatoryUpdates(): Promise<RegulatoryUpdate[]> {
    return db.select().from(regulatoryUpdates).orderBy(desc(regulatoryUpdates.createdAt));
  }

  async getRegulatoryUpdateById(id: string): Promise<RegulatoryUpdate | undefined> {
    const result = await db.select().from(regulatoryUpdates).where(eq(regulatoryUpdates.id, id));
    return result[0];
  }

  async getUnreviewedRegulatoryUpdates(): Promise<RegulatoryUpdate[]> {
    return db.select().from(regulatoryUpdates)
      .where(eq(regulatoryUpdates.isReviewed, false))
      .orderBy(desc(regulatoryUpdates.createdAt));
  }

  async createRegulatoryUpdate(update: InsertRegulatoryUpdate): Promise<RegulatoryUpdate> {
    const result = await db.insert(regulatoryUpdates).values(update).returning();
    return result[0];
  }

  async updateRegulatoryUpdate(id: string, update: Partial<InsertRegulatoryUpdate>): Promise<RegulatoryUpdate | undefined> {
    const result = await db
      .update(regulatoryUpdates)
      .set(update)
      .where(eq(regulatoryUpdates.id, id))
      .returning();
    return result[0];
  }

  async deleteRegulatoryUpdate(id: string): Promise<void> {
    await db.delete(regulatoryUpdates).where(eq(regulatoryUpdates.id, id));
  }

  // Compliance Metrics
  async createComplianceMetrics(metrics: InsertComplianceMetrics): Promise<ComplianceMetrics> {
    const result = await db.insert(complianceMetrics).values(metrics).returning();
    return result[0];
  }

  async getLatestComplianceMetrics(frameworkId?: string): Promise<ComplianceMetrics[]> {
    if (frameworkId) {
      return db.select().from(complianceMetrics)
        .where(eq(complianceMetrics.frameworkId, frameworkId))
        .orderBy(desc(complianceMetrics.metricDate))
        .limit(10);
    }
    return db.select().from(complianceMetrics)
      .orderBy(desc(complianceMetrics.metricDate))
      .limit(50);
  }

  // ============================================================================
  // E-VERIFY CASE MANAGEMENT
  // ============================================================================

  async getEVerifyCases(): Promise<EVerifyCase[]> {
    return db.select().from(eVerifyCases).orderBy(desc(eVerifyCases.createdAt));
  }

  async getEVerifyCaseById(id: string): Promise<EVerifyCase | undefined> {
    const result = await db.select().from(eVerifyCases).where(eq(eVerifyCases.id, id));
    return result[0];
  }

  async getEVerifyCaseByNewHireId(newHireId: string): Promise<EVerifyCase | undefined> {
    const result = await db.select().from(eVerifyCases).where(eq(eVerifyCases.newHireId, newHireId));
    return result[0];
  }

  async getEVerifyCasesByStatus(status: string): Promise<EVerifyCase[]> {
    return db.select().from(eVerifyCases)
      .where(eq(eVerifyCases.status, status))
      .orderBy(desc(eVerifyCases.createdAt));
  }

  async getPendingEVerifyCases(): Promise<EVerifyCase[]> {
    return db.select().from(eVerifyCases)
      .where(eq(eVerifyCases.requiresAction, true))
      .orderBy(desc(eVerifyCases.createdAt));
  }

  async getOverdueEVerifyCases(): Promise<EVerifyCase[]> {
    return db.select().from(eVerifyCases)
      .where(eq(eVerifyCases.isOverdue, true))
      .orderBy(desc(eVerifyCases.createdAt));
  }

  async createEVerifyCase(eVerifyCase: InsertEVerifyCase): Promise<EVerifyCase> {
    const result = await db.insert(eVerifyCases).values(eVerifyCase).returning();
    return result[0];
  }

  async updateEVerifyCase(id: string, updates: Partial<InsertEVerifyCase>): Promise<EVerifyCase | undefined> {
    const result = await db
      .update(eVerifyCases)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(eVerifyCases.id, id))
      .returning();
    return result[0];
  }

  // E-Verify Case History
  async getEVerifyCaseHistory(caseId: string): Promise<EVerifyCaseHistory[]> {
    return db.select().from(eVerifyCaseHistory)
      .where(eq(eVerifyCaseHistory.caseId, caseId))
      .orderBy(desc(eVerifyCaseHistory.changedAt));
  }

  async createEVerifyCaseHistoryEntry(entry: InsertEVerifyCaseHistory): Promise<EVerifyCaseHistory> {
    const result = await db.insert(eVerifyCaseHistory).values(entry).returning();
    return result[0];
  }
}

export const storage = new DbStorage();

/**
 * Calculate the submission deadline for E-Verify cases.
 * Deadline is 3 business days from the hire date (skipping weekends).
 * @param hireDate - The employee's first day of work
 * @returns Date representing the submission deadline
 */
export function calculateSubmissionDeadline(hireDate: Date): Date {
  const deadline = new Date(hireDate);
  let businessDaysAdded = 0;
  
  while (businessDaysAdded < 3) {
    deadline.setDate(deadline.getDate() + 1);
    const dayOfWeek = deadline.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDaysAdded++;
    }
  }
  
  return deadline;
}
