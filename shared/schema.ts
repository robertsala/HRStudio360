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
  managerId: uuid('manager_id').references(() => employees.id),
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

// Insert schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
