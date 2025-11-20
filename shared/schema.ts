import { pgTable, text, uuid, timestamp, integer, numeric, date, boolean, pgEnum, json, smallint, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

// Enums
export const employmentTypeEnum = pgEnum('employment_type', ['Full-time', 'Part-time', 'Contract', 'Intern']);
export const employeeStatusEnum = pgEnum('employee_status', ['Active', 'On Leave', 'Terminated', 'Pending']);
export const leaveTypeEnum = pgEnum('leave_type', ['Vacation', 'Sick', 'Personal', 'Bereavement', 'Maternity', 'Paternity', 'FMLA']);
export const leaveStatusEnum = pgEnum('leave_status', ['Pending', 'Approved', 'Denied', 'Cancelled']);
export const addressChangeStatusEnum = pgEnum('address_change_status', ['Pending', 'Approved', 'Rejected']);
export const userRoleEnum = pgEnum('user_role', ['HR', 'Manager', 'Employee', 'Product Owner']);
export const dashboardWidgetCategoryEnum = pgEnum('dashboard_widget_category', ['stats', 'team', 'analytics', 'notifications', 'quick-actions', 'calendar', 'ai']);
export const timesheetStatusEnum = pgEnum('timesheet_status', ['Draft', 'Pending_Approval', 'Approved', 'Rejected', 'Locked']);
export const payrollLockStatusEnum = pgEnum('payroll_lock_status', ['Locked', 'Processing', 'Completed']);
export const correctionStatusEnum = pgEnum('correction_status', ['Pending', 'Approved', 'Rejected', 'Cancelled']);
export const changeTypeEnum = pgEnum('change_type', ['Employee_Edit', 'Manager_Correction', 'HR_Override', 'System_Adjustment']);

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
  // Tax jurisdiction fields
  workLocationState: text('work_location_state'), // State where employee performs work
  workLocationCity: text('work_location_city'), // City for local taxes
  residenceState: text('residence_state'), // State where employee lives (for tax purposes)
  residenceCity: text('residence_city'), // City of residence
  canAccessOrgChart: boolean('can_access_org_chart').default(false),
  managerId: uuid('manager_id').references((): any => profiles.id, { onDelete: 'set null' }),
  // Structured emergency contact fields for third-party integration compatibility (SCIM/Azure AD)
  emergencyContactFirstName: text('emergency_contact_first_name'),
  emergencyContactLastName: text('emergency_contact_last_name'),
  emergencyContactMiddleName: text('emergency_contact_middle_name'),
  emergencyContactRelationship: text('emergency_contact_relationship'), // Spouse, Parent, Sibling, Child, Friend, Other
  emergencyContactPhone: text('emergency_contact_phone'), // Formatted: (555) 555-5555
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Authentication credentials table
export const authCredentials = pgTable('auth_credentials', {
  profileId: uuid('profile_id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  passwordHash: text('password_hash').notNull(),
  passwordUpdatedAt: timestamp('password_updated_at').defaultNow(),
  failedAttempts: smallint('failed_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until')
});

// Password reset tokens table
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Password audit log table
export const passwordAuditLog = pgTable('password_audit_log', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  action: text('action').notNull(),
  method: text('method').notNull(),
  adminId: uuid('admin_id').references(() => profiles.id, { onDelete: 'set null' }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  success: boolean('success').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Address change requests table - for employee address updates requiring HR approval
export const addressChangeRequests = pgTable('address_change_requests', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  requestedBy: uuid('requested_by').references(() => profiles.id).notNull(),
  // Old address fields (current values)
  oldAddress: text('old_address'),
  oldCity: text('old_city'),
  oldState: text('old_state'),
  oldZipCode: text('old_zip_code'),
  // New address fields (requested values)
  newAddress: text('new_address').notNull(),
  newCity: text('new_city').notNull(),
  newState: text('new_state').notNull(),
  newZipCode: text('new_zip_code').notNull(),
  // Approval workflow
  status: addressChangeStatusEnum('status').default('Pending').notNull(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => profiles.id),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').defaultNow()
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
}, (table) => ({
  publishedCreatedIdx: index('announcements_published_created_idx').on(table.published, table.createdAt)
}));

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
  benefits: text('benefits').array(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdIdx: index('employees_user_id_idx').on(table.userId)
}));

export type EmployeeWithProfile = Employee & {
  profile?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    department: string | null;
    role: string | null;
    phone: string | null;
    avatarUrl: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    emergencyContactFirstName: string | null;
    emergencyContactLastName: string | null;
    emergencyContactMiddleName: string | null;
    emergencyContactRelationship: string | null;
    emergencyContactPhone: string | null;
    profilePicture: string | null;
    managerName?: string | null;
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
}, (table) => ({
  employeeYearIdx: index('leave_balances_employee_year_idx').on(table.employeeId, table.year)
}));

// Candidates table (for hiring/recruitment)
// NOTE: position and department are optional here since candidates can apply to multiple jobs
// Job-specific details are stored in the applications table
export const candidates = pgTable('candidates', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  phone: text('phone'),
  position: text('position'), // Optional - for backward compatibility
  department: text('department'), // Optional - for backward compatibility
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

// Onboarding checklists - Overall onboarding progress per new hire
export const onboardingChecklists = pgTable('onboarding_checklists', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  newHireId: uuid('new_hire_id').references(() => newHires.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').default('In Progress').notNull(), // In Progress, Completed, Blocked
  overallProgress: integer('overall_progress').default(0), // Percentage 0-100
  i9Status: text('i9_status').default('Not Started'), // Not Started, In Progress, Completed, Needs Review
  stateTaxFormStatus: text('state_tax_form_status').default('Not Started'),
  workstationStatus: text('workstation_status').default('Not Started'),
  benefitsStatus: text('benefits_status').default('Not Started'),
  trainingStatus: text('training_status').default('Not Started'),
  orientationStatus: text('orientation_status').default('Not Started'),
  dueDate: date('due_date'),
  completedDate: timestamp('completed_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  newHireIdx: index('onboarding_checklists_new_hire_idx').on(table.newHireId)
}));

// Onboarding tasks - Individual checklist items
export const onboardingTasks = pgTable('onboarding_tasks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  checklistId: uuid('checklist_id').references(() => onboardingChecklists.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(), // I-9 Verification, Tax Forms, IT Setup, HR Paperwork, Training, Benefits, etc.
  assigneeType: text('assignee_type').notNull(), // New Hire, HR, IT, Manager
  assigneeId: uuid('assignee_id').references(() => profiles.id),
  status: text('status').default('Pending').notNull(), // Pending, In Progress, Completed, Blocked
  priority: text('priority').default('Medium'), // Low, Medium, High, Critical
  dueDate: date('due_date'),
  completedDate: timestamp('completed_date'),
  completedBy: uuid('completed_by').references(() => profiles.id),
  estimatedMinutes: integer('estimated_minutes'),
  notes: text('notes'),
  order: integer('order').default(0),
  dependencies: uuid('dependencies').array(), // IDs of tasks that must be completed first
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  checklistIdx: index('onboarding_tasks_checklist_idx').on(table.checklistId),
  statusIdx: index('onboarding_tasks_status_idx').on(table.status)
}));

// I-9 Forms - Federal Employment Eligibility Verification (same for all 50 states + territories)
export const i9Forms = pgTable('i9_forms', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  newHireId: uuid('new_hire_id').references(() => newHires.id, { onDelete: 'cascade' }).notNull().unique(),
  
  // Section 1: Employee Information and Attestation (completed by employee)
  section1Status: text('section1_status').default('Not Started'), // Not Started, In Progress, Completed
  lastName: text('last_name'),
  firstName: text('first_name'),
  middleInitial: text('middle_initial'),
  otherLastNames: text('other_last_names'),
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  dateOfBirth: date('date_of_birth'),
  socialSecurityNumber: text('social_security_number'), // Encrypted in production
  email: text('email'),
  phoneNumber: text('phone_number'),
  
  // Citizenship status attestation (employee selects one)
  citizenshipStatus: text('citizenship_status'), // US_CITIZEN, NONCITIZEN_NATIONAL, PERMANENT_RESIDENT, AUTHORIZED_ALIEN
  uscisNumber: text('uscis_number'), // For permanent residents/authorized aliens
  formI94Number: text('form_i94_number'),
  foreignPassportNumber: text('foreign_passport_number'),
  countryOfIssuance: text('country_of_issuance'),
  authorizationExpirationDate: date('authorization_expiration_date'),
  
  section1Signature: text('section1_signature'), // Digital signature data
  section1SignatureDate: date('section1_signature_date'),
  section1CompletedAt: timestamp('section1_completed_at'),
  
  // Section 2: Employer Review and Verification (completed by HR)
  section2Status: text('section2_status').default('Not Started'),
  listADocumentTitle: text('list_a_document_title'), // Single document proving identity AND employment authorization
  listAIssuingAuthority: text('list_a_issuing_authority'),
  listADocumentNumber: text('list_a_document_number'),
  listAExpirationDate: date('list_a_expiration_date'),
  listADocumentUrl: text('list_a_document_url'), // Object storage URL
  
  listBDocumentTitle: text('list_b_document_title'), // Document proving identity
  listBIssuingAuthority: text('list_b_issuing_authority'),
  listBDocumentNumber: text('list_b_document_number'),
  listBExpirationDate: date('list_b_expiration_date'),
  listBDocumentUrl: text('list_b_document_url'),
  
  listCDocumentTitle: text('list_c_document_title'), // Document proving employment authorization
  listCIssuingAuthority: text('list_c_issuing_authority'),
  listCDocumentNumber: text('list_c_document_number'),
  listCExpirationDate: date('list_c_expiration_date'),
  listCDocumentUrl: text('list_c_document_url'),
  
  additionalInformation: text('additional_information'),
  firstDayOfEmployment: date('first_day_of_employment'),
  employerSignature: text('employer_signature'),
  employerSignatureDate: date('employer_signature_date'),
  employerTitle: text('employer_title'),
  employerLastName: text('employer_last_name'),
  employerFirstName: text('employer_first_name'),
  employerBusinessName: text('employer_business_name'),
  employerAddress: text('employer_address'),
  employerCity: text('employer_city'),
  employerState: text('employer_state'),
  employerZipCode: text('employer_zip_code'),
  section2CompletedAt: timestamp('section2_completed_at'),
  section2CompletedBy: uuid('section2_completed_by').references(() => profiles.id),
  
  // Section 3: Reverification and Rehires (if applicable)
  section3Status: text('section3_status').default('Not Applicable'),
  rehireDate: date('rehire_date'),
  section3Signature: text('section3_signature'),
  section3SignatureDate: date('section3_signature_date'),
  section3CompletedAt: timestamp('section3_completed_at'),
  section3CompletedBy: uuid('section3_completed_by').references(() => profiles.id),
  
  // E-Verify integration fields (optional)
  eVerifyStatus: text('e_verify_status'), // Not Started, In Progress, Verified, Needs Correction
  eVerifyCaseNumber: text('e_verify_case_number'),
  eVerifyDate: timestamp('e_verify_date'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  newHireIdx: index('i9_forms_new_hire_idx').on(table.newHireId)
}));

// State tax withholding forms (state-specific: M-4 for MA, W-4 federal, etc.)
export const stateTaxForms = pgTable('state_tax_forms', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  newHireId: uuid('new_hire_id').references(() => newHires.id, { onDelete: 'cascade' }).notNull(),
  
  // State information
  state: text('state').notNull(), // MA, CA, NY, etc. (includes all 50 states + DC, PR, GU, VI, AS, MP)
  formType: text('form_type').notNull(), // M-4, DE-4, IT-2104, W-4, etc.
  formVersion: text('form_version'), // e.g., "2024", "Rev. 01/24"
  
  // Universal fields (most state forms have these)
  filingStatus: text('filing_status'), // Single, Married, Head of Household, etc.
  totalAllowances: integer('total_allowances').default(0),
  additionalWithholding: numeric('additional_withholding', { precision: 10, scale: 2 }).default('0.00'),
  exemptStatus: boolean('exempt_status').default(false),
  
  // State-specific JSON data (flexible for each state's unique fields)
  stateSpecificData: json('state_specific_data'),
  
  // Signature and completion
  employeeSignature: text('employee_signature'),
  signatureDate: date('signature_date'),
  status: text('status').default('Not Started'), // Not Started, In Progress, Completed, Needs Review
  completedAt: timestamp('completed_at'),
  reviewedBy: uuid('reviewed_by').references(() => profiles.id),
  reviewedAt: timestamp('reviewed_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  newHireStateIdx: index('state_tax_forms_new_hire_state_idx').on(table.newHireId, table.state)
}));

// Onboarding documents - General document uploads (ID verification, certifications, etc.)
export const onboardingDocuments = pgTable('onboarding_documents', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  newHireId: uuid('new_hire_id').references(() => newHires.id, { onDelete: 'cascade' }).notNull(),
  taskId: uuid('task_id').references(() => onboardingTasks.id, { onDelete: 'set null' }), // Optional link to specific task
  
  documentType: text('document_type').notNull(), // ID_Verification, Tax_Form, Background_Check, Certification, etc.
  documentName: text('document_name').notNull(),
  description: text('description'),
  fileUrl: text('file_url').notNull(), // Object storage URL
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'), // bytes
  mimeType: text('mime_type'),
  
  uploadedBy: uuid('uploaded_by').references(() => profiles.id).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  
  // Review/approval workflow
  status: text('status').default('Pending Review'), // Pending Review, Approved, Rejected, Needs Revision
  reviewedBy: uuid('reviewed_by').references(() => profiles.id),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  
  expirationDate: date('expiration_date'), // For documents like certifications
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  newHireIdx: index('onboarding_documents_new_hire_idx').on(table.newHireId),
  typeIdx: index('onboarding_documents_type_idx').on(table.documentType)
}));

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

// Weather cache table
export const weatherCache = pgTable('weather_cache', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => profiles.id),
  locationLat: numeric('location_lat', { precision: 10, scale: 7 }),
  locationLon: numeric('location_lon', { precision: 10, scale: 7 }),
  locationName: text('location_name'),
  temperature: numeric('temperature', { precision: 5, scale: 2 }),
  temperatureUnit: text('temperature_unit'),
  weatherCondition: text('weather_condition'),
  weatherIcon: text('weather_icon'),
  windSpeed: numeric('wind_speed', { precision: 5, scale: 2 }),
  humidity: integer('humidity'),
  feelsLike: numeric('feels_like', { precision: 5, scale: 2 }),
  forecastData: json('forecast_data'),
  lastUpdated: timestamp('last_updated').defaultNow(),
  cacheExpiresAt: timestamp('cache_expires_at')
});

// Dashboard Widget Customization Tables

// Dashboard widget presets - defines all available widgets and their role-based defaults
export const dashboardWidgetPresets = pgTable('dashboard_widget_presets', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  widgetId: text('widget_id').notNull().unique(), // e.g., 'weather', 'team-overview', 'kpi-dashboard'
  widgetName: text('widget_name').notNull(),
  widgetDescription: text('widget_description'),
  category: dashboardWidgetCategoryEnum('category').notNull(),
  defaultVisibleForRoles: text('default_visible_for_roles').array(), // Array of role values
  defaultDisplayOrder: integer('default_display_order').notNull(),
  widgetSettings: json('widget_settings'), // Future: per-widget configuration options
  isActive: boolean('is_active').default(true).notNull(), // Allow disabling widgets system-wide
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// User dashboard preferences - individual user customization overrides
export const userDashboardPreferences = pgTable('user_dashboard_preferences', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  widgetId: text('widget_id').notNull(), // References widgetId from dashboardWidgetPresets
  isVisible: boolean('is_visible').notNull(),
  displayOrder: integer('display_order').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  uniqueUserWidget: sql`unique (user_id, widget_id)`,
  userIdIdx: index('user_dashboard_preferences_user_id_idx').on(table.userId)
}));

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

// ================================
// APPLICANT TRACKING SYSTEM (ATS)
// ================================

// Job posting status enum
export const jobPostingStatusEnum = pgEnum('job_posting_status', [
  'draft',
  'active',
  'on_hold',
  'closed',
  'filled'
]);

// Employment type enum
export const jobEmploymentTypeEnum = pgEnum('job_employment_type', [
  'full_time',
  'part_time',
  'contract',
  'temporary',
  'internship'
]);

// Application status enum
export const applicationStatusEnum = pgEnum('application_status', [
  'applied',
  'screening',
  'phone_screen',
  'interview',
  'assessment',
  'offer',
  'hired',
  'rejected',
  'withdrawn'
]);

// Job postings table
export const jobPostings = pgTable('job_postings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  description: text('description').notNull(),
  requirements: text('requirements').notNull(),
  responsibilities: text('responsibilities').notNull(),
  qualifications: text('qualifications'),
  departmentId: uuid('department_id').references(() => departments.id).notNull(),
  jobTitleId: uuid('job_title_id').references(() => jobTitles.id),
  location: text('location').notNull(),
  workMode: text('work_mode').notNull(), // 'remote' | 'hybrid' | 'onsite'
  employmentType: jobEmploymentTypeEnum('employment_type').notNull(),
  salaryMin: numeric('salary_min', { precision: 10, scale: 2 }),
  salaryMax: numeric('salary_max', { precision: 10, scale: 2 }),
  salaryCurrency: text('salary_currency').default('USD'),
  skills: text('skills').array(),
  experience: text('experience'),
  educationLevel: text('education_level'),
  benefits: text('benefits').array(),
  applicationDeadline: date('application_deadline'),
  status: jobPostingStatusEnum('status').default('draft'),
  postedBy: uuid('posted_by').references(() => profiles.id).notNull(),
  hiringManagerId: uuid('hiring_manager_id').references(() => profiles.id),
  openings: integer('openings').default(1),
  isPublic: boolean('is_public').default(false),
  isRemoteAllowed: boolean('is_remote_allowed').default(false),
  applicationCount: integer('application_count').default(0),
  viewCount: integer('view_count').default(0),
  publishedAt: timestamp('published_at'),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Applications table - links candidates to job postings
export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  jobPostingId: uuid('job_posting_id').references(() => jobPostings.id).notNull(),
  candidateId: uuid('candidate_id').references(() => candidates.id).notNull(),
  status: applicationStatusEnum('status').default('applied'),
  sourceId: uuid('source_id').references(() => jobSources.id),
  referredBy: uuid('referred_by').references(() => profiles.id),
  currentStageId: uuid('current_stage_id').references(() => interviewStages.id),
  coverLetter: text('cover_letter'),
  resumeUrl: text('resume_url'),
  portfolioUrl: text('portfolio_url'),
  linkedinUrl: text('linkedin_url'),
  availableStartDate: date('available_start_date'),
  willingToRelocate: boolean('willing_to_relocate').default(false),
  salaryExpectation: numeric('salary_expectation', { precision: 10, scale: 2 }),
  applicationAnswers: json('application_answers'),
  screeningAnswers: json('screening_answers'),
  rating: integer('rating').default(0),
  aiMatchScore: integer('ai_match_score').default(0),
  notes: text('notes'),
  appliedAt: timestamp('applied_at').defaultNow(),
  lastActivityAt: timestamp('last_activity_at').defaultNow(),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),
  offeredAt: timestamp('offered_at'),
  hiredAt: timestamp('hired_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  uniqueJobCandidate: sql`CONSTRAINT unique_job_candidate UNIQUE (${table.jobPostingId}, ${table.candidateId})`
}));

// Resume data - AI-parsed resume information
export const resumeData = pgTable('resume_data', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid('application_id').references(() => applications.id).notNull(),
  candidateId: uuid('candidate_id').references(() => candidates.id).notNull(),
  parsedName: text('parsed_name'),
  parsedEmail: text('parsed_email'),
  parsedPhone: text('parsed_phone'),
  parsedLocation: text('parsed_location'),
  parsedSkills: text('parsed_skills').array(),
  parsedExperience: json('parsed_experience'), // Array of { company, title, startDate, endDate, description }
  parsedEducation: json('parsed_education'), // Array of { school, degree, field, startDate, endDate }
  parsedCertifications: text('parsed_certifications').array(),
  parsedLanguages: text('parsed_languages').array(),
  totalYearsExperience: integer('total_years_experience'),
  rawResumeText: text('raw_resume_text'),
  parsingConfidence: numeric('parsing_confidence', { precision: 5, scale: 2 }),
  parsedAt: timestamp('parsed_at').defaultNow(),
  parsingService: text('parsing_service'), // 'openai' | 'rchilli' | 'affinda' | etc
  createdAt: timestamp('created_at').defaultNow()
});

// Interview stages - custom pipeline stages per job
export const interviewStages = pgTable('interview_stages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  jobPostingId: uuid('job_posting_id').references(() => jobPostings.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  stageType: text('stage_type').notNull(), // 'screening' | 'phone' | 'technical' | 'behavioral' | 'final' | 'offer'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// Interview schedule
export const interviews = pgTable('interviews', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid('application_id').references(() => applications.id).notNull(),
  interviewStageId: uuid('interview_stage_id').references(() => interviewStages.id),
  interviewType: text('interview_type').notNull(), // 'phone' | 'video' | 'in_person' | 'technical'
  scheduledAt: timestamp('scheduled_at').notNull(),
  duration: integer('duration').default(60), // minutes
  location: text('location'),
  meetingLink: text('meeting_link'),
  interviewerIds: uuid('interviewer_ids').array(),
  status: text('status').default('scheduled'), // 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  feedback: text('feedback'),
  rating: integer('rating'),
  recommendation: text('recommendation'), // 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no'
  notes: text('notes'),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Team assignments - assign recruiters/hiring managers to jobs
export const teamAssignments = pgTable('team_assignments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  jobPostingId: uuid('job_posting_id').references(() => jobPostings.id).notNull(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  role: text('role').notNull(), // 'recruiter' | 'hiring_manager' | 'interviewer' | 'coordinator'
  permissions: text('permissions').array(), // ['view', 'edit', 'interview', 'hire', 'reject']
  assignedBy: uuid('assigned_by').references(() => profiles.id).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow(),
  removedAt: timestamp('removed_at')
});

// Job sources - track application sources
export const jobSources = pgTable('job_sources', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull().unique(),
  category: text('category').notNull(), // 'job_board' | 'social_media' | 'referral' | 'career_page' | 'agency'
  url: text('url'),
  apiIntegrationEnabled: boolean('api_integration_enabled').default(false),
  isActive: boolean('is_active').default(true),
  applicationCount: integer('application_count').default(0),
  hireCount: integer('hire_count').default(0),
  costPerHire: numeric('cost_per_hire', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow()
});

// Application stage transitions - tracks pipeline movement
export const applicationStageTransitions = pgTable('application_stage_transitions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid('application_id').references(() => applications.id).notNull(),
  fromStageId: uuid('from_stage_id').references(() => interviewStages.id),
  toStageId: uuid('to_stage_id').references(() => interviewStages.id).notNull(),
  movedBy: uuid('moved_by').references(() => profiles.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
});

// Application activity log
export const applicationActivityLog = pgTable('application_activity_log', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid('application_id').references(() => applications.id).notNull(),
  userId: uuid('user_id').references(() => profiles.id),
  activityType: text('activity_type').notNull(), // 'status_change' | 'stage_change' | 'note_added' | 'interview_scheduled' | etc
  description: text('description').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow()
});

// Offer letters
export const offerLetters = pgTable('offer_letters', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid('application_id').references(() => applications.id).notNull(),
  jobPostingId: uuid('job_posting_id').references(() => jobPostings.id).notNull(),
  candidateId: uuid('candidate_id').references(() => candidates.id).notNull(),
  jobTitle: text('job_title').notNull(),
  department: text('department').notNull(),
  salary: numeric('salary', { precision: 10, scale: 2 }).notNull(),
  startDate: date('start_date').notNull(),
  benefits: text('benefits').array(),
  terms: text('terms'),
  letterContent: text('letter_content').notNull(),
  status: text('status').default('pending'), // 'pending' | 'sent' | 'accepted' | 'declined' | 'expired'
  sentAt: timestamp('sent_at'),
  respondedAt: timestamp('responded_at'),
  expiresAt: timestamp('expires_at'),
  signatureUrl: text('signature_url'),
  createdBy: uuid('created_by').references(() => profiles.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Insert schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAuthCredentialSchema = createInsertSchema(authCredentials).omit({ passwordUpdatedAt: true });
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });
export const insertPasswordAuditLogSchema = createInsertSchema(passwordAuditLog).omit({ id: true, createdAt: true });
export const insertAddressChangeRequestSchema = createInsertSchema(addressChangeRequests).omit({ id: true, createdAt: true, submittedAt: true, reviewedAt: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeaveBalanceSchema = createInsertSchema(leaveBalances).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCandidateSchema = createInsertSchema(candidates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNewHireSchema = createInsertSchema(newHires).omit({ id: true, createdAt: true });
export const insertOnboardingChecklistSchema = createInsertSchema(onboardingChecklists).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOnboardingTaskSchema = createInsertSchema(onboardingTasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertI9FormSchema = createInsertSchema(i9Forms).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStateTaxFormSchema = createInsertSchema(stateTaxForms).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOnboardingDocumentSchema = createInsertSchema(onboardingDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCurrencySchema = createInsertSchema(currencies).omit({ id: true, createdAt: true });
export const insertExpenseCategorySchema = createInsertSchema(expenseCategories).omit({ id: true, createdAt: true });
export const insertExpenseVendorSchema = createInsertSchema(expenseVendors).omit({ id: true, createdAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export const insertChatChannelSchema = createInsertSchema(chatChannels).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChannelMemberSchema = createInsertSchema(channelMembers).omit({ id: true, joinedAt: true, lastReadAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true }).extend({
  fileUrl: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileSize: z.number().nullable().optional(),
  replyToMessageId: z.string().uuid().nullable().optional(),
  editedAt: z.date().nullable().optional(),
  deletedAt: z.date().nullable().optional()
});
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
export const insertWeatherCacheSchema = createInsertSchema(weatherCache).omit({ id: true, lastUpdated: true, cacheExpiresAt: true });

// ATS Insert Schemas
export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertResumeDataSchema = createInsertSchema(resumeData).omit({ id: true, createdAt: true, parsedAt: true });
export const insertInterviewStageSchema = createInsertSchema(interviewStages).omit({ id: true, createdAt: true });
export const insertInterviewSchema = createInsertSchema(interviews).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamAssignmentSchema = createInsertSchema(teamAssignments).omit({ id: true, assignedAt: true });
export const insertJobSourceSchema = createInsertSchema(jobSources).omit({ id: true, createdAt: true });
export const insertApplicationStageTransitionSchema = createInsertSchema(applicationStageTransitions).omit({ id: true, createdAt: true });
export const insertApplicationActivityLogSchema = createInsertSchema(applicationActivityLog).omit({ id: true, createdAt: true });
export const insertOfferLetterSchema = createInsertSchema(offerLetters).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type AuthCredential = typeof authCredentials.$inferSelect;
export type InsertAuthCredential = z.infer<typeof insertAuthCredentialSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordAuditLog = typeof passwordAuditLog.$inferSelect;
export type InsertPasswordAuditLog = z.infer<typeof insertPasswordAuditLogSchema>;
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
export type NewHire = typeof newHires.$inferSelect;
export type InsertNewHire = z.infer<typeof insertNewHireSchema>;
export type OnboardingChecklist = typeof onboardingChecklists.$inferSelect;
export type InsertOnboardingChecklist = z.infer<typeof insertOnboardingChecklistSchema>;
export type OnboardingTask = typeof onboardingTasks.$inferSelect;
export type InsertOnboardingTask = z.infer<typeof insertOnboardingTaskSchema>;
export type I9Form = typeof i9Forms.$inferSelect;
export type InsertI9Form = z.infer<typeof insertI9FormSchema>;
export type StateTaxForm = typeof stateTaxForms.$inferSelect;
export type InsertStateTaxForm = z.infer<typeof insertStateTaxFormSchema>;
export type OnboardingDocument = typeof onboardingDocuments.$inferSelect;
export type InsertOnboardingDocument = z.infer<typeof insertOnboardingDocumentSchema>;
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
export type WeatherCache = typeof weatherCache.$inferSelect;
export type InsertWeatherCache = z.infer<typeof insertWeatherCacheSchema>;

// ATS Types
export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type ResumeData = typeof resumeData.$inferSelect;
export type InsertResumeData = z.infer<typeof insertResumeDataSchema>;
export type InterviewStage = typeof interviewStages.$inferSelect;
export type InsertInterviewStage = z.infer<typeof insertInterviewStageSchema>;
export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type TeamAssignment = typeof teamAssignments.$inferSelect;
export type InsertTeamAssignment = z.infer<typeof insertTeamAssignmentSchema>;
export type JobSource = typeof jobSources.$inferSelect;
export type InsertJobSource = z.infer<typeof insertJobSourceSchema>;
export type ApplicationStageTransition = typeof applicationStageTransitions.$inferSelect;
export type InsertApplicationStageTransition = z.infer<typeof insertApplicationStageTransitionSchema>;
export type ApplicationActivityLog = typeof applicationActivityLog.$inferSelect;
export type InsertApplicationActivityLog = z.infer<typeof insertApplicationActivityLogSchema>;
export type OfferLetter = typeof offerLetters.$inferSelect;
export type InsertOfferLetter = z.infer<typeof insertOfferLetterSchema>;

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

// Paycheck fun facts tables
export const paycheckFunFacts = pgTable('paycheck_fun_facts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  category: text('category').notNull(),
  minAmount: numeric('min_amount', { precision: 10, scale: 2 }).notNull(),
  maxAmount: numeric('max_amount', { precision: 10, scale: 2 }).notNull(),
  factTemplate: text('fact_template').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const employeeFunFactHistory = pgTable('employee_fun_fact_history', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid('employee_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  payStubId: uuid('pay_stub_id'),
  funFactId: uuid('fun_fact_id').references(() => paycheckFunFacts.id, { onDelete: 'cascade' }).notNull(),
  funFactText: text('fun_fact_text').notNull(),
  shownAt: timestamp('shown_at').defaultNow()
});

export const dailyFunFactUsage = pgTable('daily_fun_fact_usage', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid('employee_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  funFactId: uuid('fun_fact_id').references(() => paycheckFunFacts.id, { onDelete: 'cascade' }).notNull(),
  isManualGeneration: boolean('is_manual_generation').default(true).notNull(),
  generatedAt: timestamp('generated_at').defaultNow()
});

// Insert schemas for fun facts
export const insertPaycheckFunFactSchema = createInsertSchema(paycheckFunFacts).omit({
  id: true,
  createdAt: true
});

export const insertEmployeeFunFactHistorySchema = createInsertSchema(employeeFunFactHistory).omit({
  id: true,
  shownAt: true
});

export const insertDailyFunFactUsageSchema = createInsertSchema(dailyFunFactUsage).omit({
  id: true,
  generatedAt: true
});

// Select types for fun facts
export type PaycheckFunFact = typeof paycheckFunFacts.$inferSelect;
export type InsertPaycheckFunFact = z.infer<typeof insertPaycheckFunFactSchema>;

export type EmployeeFunFactHistory = typeof employeeFunFactHistory.$inferSelect;
export type InsertEmployeeFunFactHistory = z.infer<typeof insertEmployeeFunFactHistorySchema>;

export type DailyFunFactUsage = typeof dailyFunFactUsage.$inferSelect;
export type InsertDailyFunFactUsage = z.infer<typeof insertDailyFunFactUsageSchema>;

// Dashboard Widget Customization schemas and types
export const insertDashboardWidgetPresetSchema = createInsertSchema(dashboardWidgetPresets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserDashboardPreferenceSchema = createInsertSchema(userDashboardPreferences).omit({ id: true, createdAt: true, updatedAt: true });

export type DashboardWidgetPreset = typeof dashboardWidgetPresets.$inferSelect;
export type InsertDashboardWidgetPreset = z.infer<typeof insertDashboardWidgetPresetSchema>;

export type UserDashboardPreference = typeof userDashboardPreferences.$inferSelect;
export type InsertUserDashboardPreference = z.infer<typeof insertUserDashboardPreferenceSchema>;

// Tutorial System - Knowledge Base Tutorials
export const tutorialCategoryEnum = pgEnum('tutorial_category', [
  'getting-started',
  'payroll',
  'hiring',
  'employee-management',
  'performance',
  'benefits',
  'analytics',
  'ai-features'
]);

export const tutorialDifficultyEnum = pgEnum('tutorial_difficulty', [
  'beginner',
  'intermediate',
  'advanced'
]);

export const tutorials = pgTable('tutorials', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: tutorialCategoryEnum('category').notNull(),
  difficulty: tutorialDifficultyEnum('difficulty').notNull(),
  estimatedMinutes: integer('estimated_minutes').notNull(),
  roleAccess: text('role_access').array().notNull(), // Array of roles: ['HR', 'Manager', 'Employee', 'Product Owner']
  tags: text('tags').array(),
  thumbnailUrl: text('thumbnail_url'),
  isPublished: boolean('is_published').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const tutorialSteps = pgTable('tutorial_steps', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tutorialId: uuid('tutorial_id').references(() => tutorials.id, { onDelete: 'cascade' }).notNull(),
  stepNumber: integer('step_number').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(), // Markdown or HTML content
  actionType: text('action_type'), // 'open-modal', 'navigate', 'none', etc.
  actionTarget: text('action_target'), // Modal name or URL
  actionLabel: text('action_label'), // "Try it now" button text
  imageUrl: text('image_url'),
  videoUrl: text('video_url'),
  checklist: text('checklist').array(), // Array of checklist items for this step
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const tutorialCompletions = pgTable('tutorial_completions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  tutorialId: uuid('tutorial_id').references(() => tutorials.id, { onDelete: 'cascade' }).notNull(),
  currentStepNumber: integer('current_step_number').default(1).notNull(),
  completedSteps: integer('completed_steps').array().default(sql`ARRAY[]::integer[]`).notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  lastAccessedAt: timestamp('last_accessed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Tutorial Certificates - Issued completion certificates
export const tutorialCertificates = pgTable('tutorial_certificates', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  tutorialId: uuid('tutorial_id').references(() => tutorials.id, { onDelete: 'cascade' }).notNull(),
  certificateNumber: text('certificate_number').notNull().unique(), // e.g., "CERT-2025-001234"
  userName: text('user_name').notNull(), // Snapshot of user's name at certificate issue
  tutorialTitle: text('tutorial_title').notNull(), // Snapshot of tutorial title
  issueDate: timestamp('issue_date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  userTutorialUnique: uniqueIndex('tutorial_certificates_user_tutorial_idx').on(table.userId, table.tutorialId)
}));

// Tutorial Badges - Predefined achievement badges
export const tutorialBadges = pgTable('tutorial_badges', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull().unique(), // e.g., "Tutorial Novice", "Payroll Master"
  description: text('description').notNull(),
  iconName: text('icon_name').notNull(), // lucide-react icon name
  iconColor: text('icon_color').default('#3b82f6').notNull(), // hex color
  category: text('category').notNull(), // 'completion', 'streak', 'mastery', 'special'
  requirement: text('requirement').notNull(), // Human-readable requirement
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// User Tutorial Badges - Tracks earned badges
export const userTutorialBadges = pgTable('user_tutorial_badges', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  badgeId: uuid('badge_id').references(() => tutorialBadges.id, { onDelete: 'cascade' }).notNull(),
  tutorialId: uuid('tutorial_id').references(() => tutorials.id, { onDelete: 'set null' }), // Optional - which tutorial earned this
  earnedAt: timestamp('earned_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  userBadgeUnique: uniqueIndex('user_tutorial_badges_user_badge_idx').on(table.userId, table.badgeId)
}));

// Insert schemas for tutorials
export const insertTutorialSchema = createInsertSchema(tutorials).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTutorialStepSchema = createInsertSchema(tutorialSteps).omit({
  id: true,
  createdAt: true
});

export const insertTutorialCompletionSchema = createInsertSchema(tutorialCompletions).omit({
  id: true,
  createdAt: true,
  lastAccessedAt: true
});

// Select types for tutorials
export type Tutorial = typeof tutorials.$inferSelect;
export type InsertTutorial = z.infer<typeof insertTutorialSchema>;

export type TutorialStep = typeof tutorialSteps.$inferSelect;
export type InsertTutorialStep = z.infer<typeof insertTutorialStepSchema>;

export type TutorialCompletion = typeof tutorialCompletions.$inferSelect;
export type InsertTutorialCompletion = z.infer<typeof insertTutorialCompletionSchema>;

// Insert schemas for certificates and badges
export const insertTutorialCertificateSchema = createInsertSchema(tutorialCertificates).omit({
  id: true,
  createdAt: true
});

export const insertTutorialBadgeSchema = createInsertSchema(tutorialBadges).omit({
  id: true,
  createdAt: true
});

export const insertUserTutorialBadgeSchema = createInsertSchema(userTutorialBadges).omit({
  id: true,
  createdAt: true,
  earnedAt: true
});

// Select types for certificates and badges
export type TutorialCertificate = typeof tutorialCertificates.$inferSelect;
export type InsertTutorialCertificate = z.infer<typeof insertTutorialCertificateSchema>;

export type TutorialBadge = typeof tutorialBadges.$inferSelect;
export type InsertTutorialBadge = z.infer<typeof insertTutorialBadgeSchema>;

export type UserTutorialBadge = typeof userTutorialBadges.$inferSelect;
export type InsertUserTutorialBadge = z.infer<typeof insertUserTutorialBadgeSchema>;

// User Permissions type
export interface UserPermissions {
  department: string | null;
  role: string | null;
  canAccessOrgChart: boolean;
  managerId: string | null;
}

// Analytics types
export interface WorkforceMetrics {
  totalEmployees: number;
  newHires: number;
  departures?: number; // Optional until termination_date field exists
  remoteWorkers?: number; // Optional until is_remote field exists
  departmentBreakdown: Array<{
    department: string;
    count: number;
    satisfaction?: number;
    performance?: number;
  }>;
}

export interface PerformanceMetrics {
  avgPerformanceScore: number;
  goalsAchieved: number;
  reviewsCompleted: number;
  reviewsTotal: number;
  skillCertifications: number;
  ratingDistribution: Array<{
    rating: string;
    count: number;
  }>;
}

export interface LeaveMetrics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  deniedRequests: number;
  avgProcessingDays: number;
  leaveByType: Array<{
    type: string;
    count: number;
    avgDays: number;
  }>;
}

export interface FinancialMetrics {
  totalPayroll: number;
  avgSalary: number;
  totalExpenses: number;
  benefitsCost: number;
  trainingInvestment: number;
  costPerHire: number;
  revenuePerEmployee: number;
  payrollByDepartment: Array<{
    department: string;
    totalCost: number;
    employeeCount: number;
    avgSalary: number;
  }>;
}

export interface AnalyticsSummary {
  workforce: WorkforceMetrics;
  performance: PerformanceMetrics;
  leave: LeaveMetrics;
  financial: FinancialMetrics;
  timeRange: string;
  generatedAt: string;
}

// Tax Jurisdiction Management
export const taxJurisdictions = pgTable('tax_jurisdictions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  jurisdictionType: text('jurisdiction_type').notNull(), // 'federal', 'state', 'local'
  jurisdictionName: text('jurisdiction_name').notNull(), // e.g., 'California', 'New York City'
  stateCode: text('state_code'), // Two-letter state code
  cityName: text('city_name'), // For local taxes
  federalIncomeTaxRate: numeric('federal_income_tax_rate', { precision: 5, scale: 4 }), // 0.2200 = 22%
  stateIncomeTaxRate: numeric('state_income_tax_rate', { precision: 5, scale: 4 }),
  localIncomeTaxRate: numeric('local_income_tax_rate', { precision: 5, scale: 4 }),
  socialSecurityRate: numeric('social_security_rate', { precision: 5, scale: 4 }), // FICA
  medicareRate: numeric('medicare_rate', { precision: 5, scale: 4 }), // FICA
  additionalMedicareRate: numeric('additional_medicare_rate', { precision: 5, scale: 4 }), // High earners
  unemploymentTaxRate: numeric('unemployment_tax_rate', { precision: 5, scale: 4 }),
  isActive: boolean('is_active').default(true),
  effectiveDate: date('effective_date').notNull(),
  expirationDate: date('expiration_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Reciprocal Tax Agreements between states
export const reciprocalAgreements = pgTable('reciprocal_agreements', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workStateCode: text('work_state_code').notNull(), // State where employee works
  residenceStateCode: text('residence_state_code').notNull(), // State where employee lives
  agreementType: text('agreement_type').notNull(), // 'full_reciprocity', 'partial_reciprocity'
  description: text('description'),
  isActive: boolean('is_active').default(true),
  effectiveDate: date('effective_date').notNull(),
  expirationDate: date('expiration_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Tax Data Sources - Track authoritative tax data sources
export const taxDataSources = pgTable('tax_data_sources', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sourceType: text('source_type').notNull(), // 'irs_publication', 'state_website', 'api_provider'
  sourceName: text('source_name').notNull(), // e.g., 'IRS Publication 15-T', 'California FTB'
  sourceUrl: text('source_url'), // URL to official documentation
  dataType: text('data_type').notNull(), // 'federal_tax_brackets', 'state_tax_rates', 'reciprocal_agreements'
  taxYear: integer('tax_year').notNull(), // 2025, 2026, etc.
  dataVersion: text('data_version'), // Version or revision number
  lastUpdated: timestamp('last_updated').notNull(),
  lastVerified: timestamp('last_verified'),
  dataPayload: json('data_payload').notNull(), // Structured tax data (rates, brackets, etc.)
  confidenceScore: integer('confidence_score').default(100), // 0-100, how reliable is this data
  verifiedBy: uuid('verified_by').references(() => profiles.id), // HR Admin who verified
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// AI Tax Configuration Suggestions
export const aiTaxSuggestions = pgTable('ai_tax_suggestions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }), // For employee-specific suggestions
  suggestionType: text('suggestion_type').notNull(), // 'tax_jurisdiction', 'employee_tax_config'
  suggestedConfig: json('suggested_config').notNull(), // The AI's recommended configuration
  reasoning: text('reasoning'), // AI's explanation of the suggestion
  dataSourceIds: uuid('data_source_ids').array(), // References to taxDataSources used
  confidence: integer('confidence').notNull(), // 0-100
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
  requestedBy: uuid('requested_by').references(() => profiles.id).notNull(),
  reviewedBy: uuid('reviewed_by').references(() => profiles.id),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  appliedAt: timestamp('applied_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// Employee Tax Configuration
export const employeeTaxConfiguration = pgTable('employee_tax_configuration', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  workLocationState: text('work_location_state'), // State where employee performs work
  workLocationCity: text('work_location_city'), // City for local tax
  residenceState: text('residence_state'), // State where employee lives
  residenceCity: text('residence_city'),
  federalFilingStatus: text('federal_filing_status'), // 'single', 'married', 'head_of_household'
  federalAllowances: integer('federal_allowances').default(0),
  stateFilingStatus: text('state_filing_status'),
  stateAllowances: integer('state_allowances').default(0),
  additionalWithholding: numeric('additional_withholding', { precision: 10, scale: 2 }).default('0'),
  exemptFromFederal: boolean('exempt_from_federal').default(false),
  exemptFromState: boolean('exempt_from_state').default(false),
  exemptFromLocal: boolean('exempt_from_local').default(false),
  reciprocalAgreementApplies: boolean('reciprocal_agreement_applies').default(false),
  reciprocalAgreementId: uuid('reciprocal_agreement_id').references(() => reciprocalAgreements.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Auto-fix Audit Log
export const autoFixAuditLog = pgTable('auto_fix_audit_log', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  fixType: text('fix_type').notNull(), // 'timesheet_approval', 'tax_calculation', etc.
  affectedEmployeeIds: uuid('affected_employee_ids').array().notNull(),
  beforeState: json('before_state'), // JSON snapshot of data before fix
  afterState: json('after_state'), // JSON snapshot of data after fix
  approvedBy: uuid('approved_by').references(() => profiles.id).notNull(),
  approvedAt: timestamp('approved_at').defaultNow(),
  reason: text('reason'),
  notificationsSent: json('notifications_sent'), // Track who was notified
  createdAt: timestamp('created_at').defaultNow()
});

// Timesheet Entries
export const timesheetEntries = pgTable('timesheet_entries', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  payPeriodStart: date('pay_period_start').notNull(),
  payPeriodEnd: date('pay_period_end').notNull(),
  regularHours: numeric('regular_hours', { precision: 10, scale: 2 }).notNull().default('0'),
  overtimeHours: numeric('overtime_hours', { precision: 10, scale: 2 }).notNull().default('0'),
  ptoHours: numeric('pto_hours', { precision: 10, scale: 2 }).notNull().default('0'),
  sickHours: numeric('sick_hours', { precision: 10, scale: 2 }).notNull().default('0'),
  holidayHours: numeric('holiday_hours', { precision: 10, scale: 2 }).notNull().default('0'),
  status: timesheetStatusEnum('status').default('Draft').notNull(),
  submittedAt: timestamp('submitted_at'),
  submittedBy: uuid('submitted_by').references(() => profiles.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  employeePeriodIdx: uniqueIndex('employee_period_idx').on(table.employeeId, table.payPeriodStart, table.payPeriodEnd)
}));

// Timesheet Approvals
export const timesheetApprovals = pgTable('timesheet_approvals', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  timesheetId: uuid('timesheet_id').references(() => timesheetEntries.id, { onDelete: 'cascade' }).notNull(),
  approverId: uuid('approver_id').references(() => profiles.id).notNull(),
  status: timesheetStatusEnum('status').notNull(), // 'Approved' or 'Rejected'
  approvedAt: timestamp('approved_at').defaultNow(),
  comments: text('comments'),
  createdAt: timestamp('created_at').defaultNow()
});

// Payroll Locks
export const payrollLocks = pgTable('payroll_locks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  payPeriodStart: date('pay_period_start').notNull(),
  payPeriodEnd: date('pay_period_end').notNull(),
  status: payrollLockStatusEnum('status').default('Locked').notNull(),
  lockedBy: uuid('locked_by').references(() => profiles.id).notNull(),
  lockedAt: timestamp('locked_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  employeeIds: uuid('employee_ids').array(), // Employees included in this payroll run
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  periodIdx: uniqueIndex('payroll_period_idx').on(table.payPeriodStart, table.payPeriodEnd)
}));

// Permissions Catalog - Granular permissions for access control
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  code: text('code').unique().notNull(), // e.g., 'timesheets.edit_own_draft'
  category: text('category').notNull(), // e.g., 'Timesheets', 'Payroll', 'Leave'
  name: text('name').notNull(), // Display name
  description: text('description'), // What this permission allows
  createdAt: timestamp('created_at').defaultNow()
});

// Role-Permission Mapping - Many-to-many relationship
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  role: text('role').notNull(), // e.g., 'Manager', 'HR', 'Employee'
  permissionId: uuid('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  rolePermissionIdx: uniqueIndex('role_permission_idx').on(table.role, table.permissionId)
}));

// Timesheet Correction Requests - Employee-initiated correction workflow
export const timesheetCorrectionRequests = pgTable('timesheet_correction_requests', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  timesheetEntryId: uuid('timesheet_entry_id').references(() => timesheetEntries.id, { onDelete: 'cascade' }).notNull(),
  requestedById: uuid('requested_by_id').references(() => profiles.id).notNull(), // Employee who requested
  originalValues: json('original_values').notNull(), // Snapshot of original timesheet data
  requestedValues: json('requested_values').notNull(), // Requested changes
  justification: text('justification').notNull(), // Required explanation
  supportingDocuments: text('supporting_documents').array(), // Optional file paths/URLs
  status: correctionStatusEnum('status').default('Pending').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => profiles.id), // Manager/HR who reviewed
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'), // Approval/rejection notes
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Timesheet Change Audit Trail - Complete history of all timesheet modifications
export const timesheetChangeAudit = pgTable('timesheet_change_audit', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  timesheetEntryId: uuid('timesheet_entry_id').references(() => timesheetEntries.id, { onDelete: 'cascade' }).notNull(),
  changedBy: uuid('changed_by').references(() => profiles.id).notNull(), // Who made the change
  changeType: changeTypeEnum('change_type').notNull(), // Type of change
  oldValues: json('old_values'), // Previous values
  newValues: json('new_values').notNull(), // New values
  justification: text('justification'), // Why the change was made
  correctionRequestId: uuid('correction_request_id').references(() => timesheetCorrectionRequests.id), // Link to correction request if applicable
  changedAt: timestamp('changed_at').defaultNow()
});

// **PHASE 3: ADVANCED ACCESS CONTROL FEATURES**

// Permission Templates - Reusable permission sets for quick role setup
export const permissionTemplates = pgTable('permission_templates', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').unique().notNull(), // e.g., 'Standard Manager', 'Department Lead'
  description: text('description'), // What this template includes
  targetRole: text('target_role'), // Suggested role (optional)
  permissionIds: uuid('permission_ids').array().notNull(), // Array of permission IDs
  isSystemTemplate: boolean('is_system_template').default(false), // Can't be deleted
  createdBy: uuid('created_by').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Role Hierarchy - Parent-child relationships for permission inheritance
export const roleHierarchy = pgTable('role_hierarchy', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  role: text('role').unique().notNull(), // Child role
  parentRole: text('parent_role'), // Parent role (null for top-level roles)
  inheritsPermissions: boolean('inherits_permissions').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// Time-Based Permission Grants - Temporary elevated access with auto-expiration
export const timeBasedPermissionGrants = pgTable('time_based_permission_grants', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  permissionId: uuid('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull(),
  grantedBy: uuid('granted_by').references(() => profiles.id).notNull(),
  reason: text('reason').notNull(), // Why temporary access is needed
  startTime: timestamp('start_time').defaultNow(),
  endTime: timestamp('end_time').notNull(), // Auto-revoke after this time
  isActive: boolean('is_active').default(true),
  revokedBy: uuid('revoked_by').references(() => profiles.id),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// Permission Request Workflows - Employee-initiated permission requests
export const permissionRequests = pgTable('permission_requests', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  requestedById: uuid('requested_by_id').references(() => profiles.id).notNull(),
  permissionIds: uuid('permission_ids').array().notNull(), // Requested permissions
  justification: text('justification').notNull(), // Why these permissions are needed
  requestType: text('request_type').notNull(), // 'temporary' or 'permanent'
  duration: integer('duration'), // Hours for temporary access (null for permanent)
  status: correctionStatusEnum('status').default('Pending').notNull(), // Reuse existing enum
  reviewedBy: uuid('reviewed_by').references(() => profiles.id),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Permission Change Audit - Track all permission changes for compliance
export const permissionChangeAudit = pgTable('permission_change_audit', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  targetType: text('target_type').notNull(), // 'role' or 'user'
  targetId: text('target_id').notNull(), // Role name or user ID
  changeType: text('change_type').notNull(), // 'grant', 'revoke', 'template_apply'
  permissionIds: uuid('permission_ids').array().notNull(),
  changedBy: uuid('changed_by').references(() => profiles.id).notNull(),
  reason: text('reason'), // Optional justification
  metadata: json('metadata'), // Additional context (e.g., template ID, request ID)
  changedAt: timestamp('changed_at').defaultNow()
});

// Access Levels - Defines available access levels for employees
export const accessLevels = pgTable('access_levels', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull().unique(), // Display name (e.g., "CEO", "C-Suite Executive")
  code: text('code').notNull().unique(), // Machine-readable code (e.g., "ceo", "c_suite_exec")
  description: text('description').notNull(),
  priority: integer('priority').notNull().default(0), // Higher = more access
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Employee Access Assignments - Maps individual employees to access levels
export const employeeAccessAssignments = pgTable('employee_access_assignments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  employeeId: text('employee_id').notNull(), // Employee ID from mockOrgChartEmployees
  accessLevelId: uuid('access_level_id').references(() => accessLevels.id).notNull(),
  assignedBy: uuid('assigned_by').references(() => profiles.id).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow(),
  source: text('source').default('manual'), // 'manual' or 'ai_suggestion'
  aiConfidence: text('ai_confidence'), // 'high', 'medium', 'low' if AI-assigned
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  employeeAccessIdx: uniqueIndex('employee_access_idx').on(table.employeeId)
}));

// Insert schemas
export const insertTaxJurisdictionSchema = createInsertSchema(taxJurisdictions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertTaxJurisdiction = z.infer<typeof insertTaxJurisdictionSchema>;
export type TaxJurisdiction = typeof taxJurisdictions.$inferSelect;

export const insertReciprocalAgreementSchema = createInsertSchema(reciprocalAgreements).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertReciprocalAgreement = z.infer<typeof insertReciprocalAgreementSchema>;
export type ReciprocalAgreement = typeof reciprocalAgreements.$inferSelect;

export const insertTaxDataSourceSchema = createInsertSchema(taxDataSources).omit({
  id: true,
  createdAt: true
});
export type InsertTaxDataSource = z.infer<typeof insertTaxDataSourceSchema>;
export type TaxDataSource = typeof taxDataSources.$inferSelect;

export const insertAiTaxSuggestionSchema = createInsertSchema(aiTaxSuggestions).omit({
  id: true,
  createdAt: true
});
export type InsertAiTaxSuggestion = z.infer<typeof insertAiTaxSuggestionSchema>;
export type AiTaxSuggestion = typeof aiTaxSuggestions.$inferSelect;

export const insertEmployeeTaxConfigurationSchema = createInsertSchema(employeeTaxConfiguration).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertEmployeeTaxConfiguration = z.infer<typeof insertEmployeeTaxConfigurationSchema>;
export type EmployeeTaxConfiguration = typeof employeeTaxConfiguration.$inferSelect;

export const insertAutoFixAuditLogSchema = createInsertSchema(autoFixAuditLog).omit({
  id: true,
  createdAt: true
});
export type InsertAutoFixAuditLog = z.infer<typeof insertAutoFixAuditLogSchema>;
export type AutoFixAuditLog = typeof autoFixAuditLog.$inferSelect;

export const insertTimesheetEntrySchema = createInsertSchema(timesheetEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertTimesheetEntry = z.infer<typeof insertTimesheetEntrySchema>;
export type TimesheetEntry = typeof timesheetEntries.$inferSelect;

export const insertTimesheetApprovalSchema = createInsertSchema(timesheetApprovals).omit({
  id: true,
  createdAt: true
});
export type InsertTimesheetApproval = z.infer<typeof insertTimesheetApprovalSchema>;
export type TimesheetApproval = typeof timesheetApprovals.$inferSelect;

export const insertPayrollLockSchema = createInsertSchema(payrollLocks).omit({
  id: true,
  createdAt: true
});
export type InsertPayrollLock = z.infer<typeof insertPayrollLockSchema>;
export type PayrollLock = typeof payrollLocks.$inferSelect;

// Insert schemas for new access control and correction tables
export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true
});
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true
});
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

export const insertTimesheetCorrectionRequestSchema = createInsertSchema(timesheetCorrectionRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertTimesheetCorrectionRequest = z.infer<typeof insertTimesheetCorrectionRequestSchema>;
export type TimesheetCorrectionRequest = typeof timesheetCorrectionRequests.$inferSelect;

export const insertTimesheetChangeAuditSchema = createInsertSchema(timesheetChangeAudit).omit({
  id: true,
  changedAt: true
});
export type InsertTimesheetChangeAudit = z.infer<typeof insertTimesheetChangeAuditSchema>;
export type TimesheetChangeAudit = typeof timesheetChangeAudit.$inferSelect;

// Phase 3: Insert schemas for advanced access control features
export const insertPermissionTemplateSchema = createInsertSchema(permissionTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPermissionTemplate = z.infer<typeof insertPermissionTemplateSchema>;
export type PermissionTemplate = typeof permissionTemplates.$inferSelect;

export const insertRoleHierarchySchema = createInsertSchema(roleHierarchy).omit({
  id: true,
  createdAt: true
});
export type InsertRoleHierarchy = z.infer<typeof insertRoleHierarchySchema>;
export type RoleHierarchy = typeof roleHierarchy.$inferSelect;

export const insertTimeBasedPermissionGrantSchema = createInsertSchema(timeBasedPermissionGrants).omit({
  id: true,
  createdAt: true
});
export type InsertTimeBasedPermissionGrant = z.infer<typeof insertTimeBasedPermissionGrantSchema>;
export type TimeBasedPermissionGrant = typeof timeBasedPermissionGrants.$inferSelect;

export const insertPermissionRequestSchema = createInsertSchema(permissionRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPermissionRequest = z.infer<typeof insertPermissionRequestSchema>;
export type PermissionRequest = typeof permissionRequests.$inferSelect;

export const insertPermissionChangeAuditSchema = createInsertSchema(permissionChangeAudit).omit({
  id: true,
  changedAt: true
});
export type InsertPermissionChangeAudit = z.infer<typeof insertPermissionChangeAuditSchema>;
export type PermissionChangeAudit = typeof permissionChangeAudit.$inferSelect;

export const insertAccessLevelSchema = createInsertSchema(accessLevels).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertAccessLevel = z.infer<typeof insertAccessLevelSchema>;
export type AccessLevel = typeof accessLevels.$inferSelect;

export const insertEmployeeAccessAssignmentSchema = createInsertSchema(employeeAccessAssignments).omit({
  id: true,
  assignedAt: true,
  updatedAt: true
});
export type InsertEmployeeAccessAssignment = z.infer<typeof insertEmployeeAccessAssignmentSchema>;
export type EmployeeAccessAssignment = typeof employeeAccessAssignments.$inferSelect;

export const callTypeEnum = pgEnum('call_type', ['voice', 'video']);
export const callStatusEnum = pgEnum('call_status', ['ringing', 'active', 'ended', 'missed', 'declined']);
export const participantStatusEnum = pgEnum('participant_status', ['calling', 'connected', 'disconnected']);
export const signalTypeEnum = pgEnum('signal_type', ['offer', 'answer', 'ice-candidate']);

export const callSessions = pgTable('call_sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  channelId: uuid('channel_id').references(() => chatChannels.id, { onDelete: 'cascade' }).notNull(),
  callerId: uuid('caller_id').references(() => profiles.id).notNull(),
  callType: callTypeEnum('call_type').notNull(),
  status: callStatusEnum('status').default('ringing').notNull(),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  duration: integer('duration').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

export const callParticipants = pgTable('call_participants', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  callSessionId: uuid('call_session_id').references(() => callSessions.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  status: participantStatusEnum('status').default('calling').notNull(),
  joinedAt: timestamp('joined_at'),
  leftAt: timestamp('left_at'),
  createdAt: timestamp('created_at').defaultNow()
});

export const callSignaling = pgTable('call_signaling', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  callSessionId: uuid('call_session_id').references(() => callSessions.id, { onDelete: 'cascade' }).notNull(),
  fromUserId: uuid('from_user_id').references(() => profiles.id).notNull(),
  toUserId: uuid('to_user_id').references(() => profiles.id),
  signalType: signalTypeEnum('signal_type').notNull(),
  signalData: json('signal_data').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const insertCallSessionSchema = createInsertSchema(callSessions).omit({
  id: true,
  createdAt: true
});
export type InsertCallSession = z.infer<typeof insertCallSessionSchema>;
export type CallSession = typeof callSessions.$inferSelect;

export const insertCallParticipantSchema = createInsertSchema(callParticipants).omit({
  id: true,
  createdAt: true
});
export type InsertCallParticipant = z.infer<typeof insertCallParticipantSchema>;
export type CallParticipant = typeof callParticipants.$inferSelect;

export const insertCallSignalingSchema = createInsertSchema(callSignaling).omit({
  id: true,
  createdAt: true
});
export type InsertCallSignaling = z.infer<typeof insertCallSignalingSchema>;
export type CallSignaling = typeof callSignaling.$inferSelect;

// MFA (Multi-Factor Authentication) Tables
export const mfaMethodTypeEnum = pgEnum('mfa_method_type', ['email', 'sms', 'totp', 'webauthn']);
export const mfaChallengeStatusEnum = pgEnum('mfa_challenge_status', ['pending', 'verified', 'expired', 'failed']);

// Organization settings table - for tenant-level MFA configuration
export const organizationSettings = pgTable('organization_settings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationName: text('organization_name').notNull().default('HRStudio360'),
  mfaEnabled: boolean('mfa_enabled').default(true).notNull(), // Can disable built-in MFA for external providers
  mfaRequired: boolean('mfa_required').default(false).notNull(), // Force all users to enroll
  mfaRequiredForRoles: text('mfa_required_for_roles').array().default(sql`ARRAY['HR', 'Product Owner']::text[]`), // Roles that must use MFA
  allowedMfaMethods: text('allowed_mfa_methods').array().default(sql`ARRAY['email', 'sms']::text[]`), // Which methods are allowed
  externalMfaProvider: text('external_mfa_provider'), // 'okta', 'microsoft', 'duo', etc.
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// MFA methods table - stores enrolled 2FA methods per user
export const mfaMethods = pgTable('mfa_methods', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  methodType: mfaMethodTypeEnum('method_type').notNull(),
  methodValue: text('method_value'), // Phone number for SMS, email for email, null for TOTP/WebAuthn
  totpSecret: text('totp_secret'), // TOTP secret key (encrypted)
  webauthnCredentialId: text('webauthn_credential_id'), // WebAuthn credential ID
  webauthnPublicKey: text('webauthn_public_key'), // WebAuthn public key
  isPrimary: boolean('is_primary').default(false).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// MFA challenges table - stores temporary verification codes
export const mfaChallenges = pgTable('mfa_challenges', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  methodId: uuid('method_id').references(() => mfaMethods.id, { onDelete: 'cascade' }), // Links to specific MFA method being verified
  methodType: mfaMethodTypeEnum('method_type').notNull(),
  code: text('code').notNull(), // 6-digit code (hashed for security)
  sessionToken: text('session_token').notNull().unique(), // Temporary session token before MFA verification
  status: mfaChallengeStatusEnum('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at').notNull(), // Codes expire after 10 minutes
  attempts: smallint('attempts').default(0).notNull(), // Track failed attempts
  maxAttempts: smallint('max_attempts').default(3).notNull(),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// MFA backup codes table - one-time use recovery codes
export const mfaBackupCodes = pgTable('mfa_backup_codes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  codeHash: text('code_hash').notNull(), // Hashed backup code
  used: boolean('used').default(false).notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// MFA audit log table - track all MFA events for security
export const mfaAuditLog = pgTable('mfa_audit_log', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  action: text('action').notNull(), // 'enrollment', 'verification', 'failure', 'disable', etc.
  methodType: text('method_type'), // Which MFA method was used
  success: boolean('success').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow()
});

// Insert schemas for MFA tables
export const insertOrganizationSettingsSchema = createInsertSchema(organizationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertOrganizationSettings = z.infer<typeof insertOrganizationSettingsSchema>;
export type OrganizationSettings = typeof organizationSettings.$inferSelect;

export const insertMfaMethodSchema = createInsertSchema(mfaMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertMfaMethod = z.infer<typeof insertMfaMethodSchema>;
export type MfaMethod = typeof mfaMethods.$inferSelect;

export const insertMfaChallengeSchema = createInsertSchema(mfaChallenges).omit({
  id: true,
  createdAt: true
});
export type InsertMfaChallenge = z.infer<typeof insertMfaChallengeSchema>;
export type MfaChallenge = typeof mfaChallenges.$inferSelect;

export const insertMfaBackupCodeSchema = createInsertSchema(mfaBackupCodes).omit({
  id: true,
  createdAt: true
});
export type InsertMfaBackupCode = z.infer<typeof insertMfaBackupCodeSchema>;
export type MfaBackupCode = typeof mfaBackupCodes.$inferSelect;

export const insertMfaAuditLogSchema = createInsertSchema(mfaAuditLog).omit({
  id: true,
  createdAt: true
});
export type InsertMfaAuditLog = z.infer<typeof insertMfaAuditLogSchema>;
export type MfaAuditLog = typeof mfaAuditLog.$inferSelect;
