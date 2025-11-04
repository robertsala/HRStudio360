import { db } from './db.js';
import type { Profile, InsertProfile, Employee, InsertEmployee, LeaveRequest, InsertLeaveRequest } from '../shared/schema.js';
import { profiles, employees, leaveRequests, departments, jobTitles, leaveBalances } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

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
}

export const storage = new DbStorage();
