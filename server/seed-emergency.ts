import { db } from './db';
import { profiles, authCredentials, departments, jobTitles, employees } from '../shared/schema';
import { hashPassword } from './lib/password';

/**
 * Emergency minimal seed for production when schema is out of sync
 * Only uses core columns that exist in older schema versions
 */
export async function seedEmergency(options: { force?: boolean } = {}) {
  console.log('🚨 Emergency seed starting (minimal columns only)...');

  try {
    // Force cleanup if requested
    if (options.force) {
      console.log('🔥 Force cleanup...');
      await db.delete(employees);
      await db.delete(authCredentials);
      await db.delete(jobTitles);
      await db.delete(departments);
      await db.delete(profiles);
      console.log('✅ Cleanup done');
    }

    // Create departments
    console.log('1️⃣ Creating departments...');
    const [execDept] = await db.insert(departments).values({ name: 'Executive' }).returning();
    const [hrDept] = await db.insert(departments).values({ name: 'HR' }).returning();
    const [salesDept] = await db.insert(departments).values({ name: 'Sales' }).returning();
    const [financeDept] = await db.insert(departments).values({ name: 'Finance' }).returning();
    const [productDept] = await db.insert(departments).values({ name: 'Product' }).returning();

    // Create job titles
    console.log('2️⃣ Creating job titles...');
    const [ceoJob] = await db.insert(jobTitles).values({ title: 'CEO', departmentId: execDept.id }).returning();
    const [cfoJob] = await db.insert(jobTitles).values({ title: 'CFO', departmentId: financeDept.id }).returning();
    const [hrManagerJob] = await db.insert(jobTitles).values({ title: 'HR Manager', departmentId: hrDept.id }).returning();
    const [hrSpecJob] = await db.insert(jobTitles).values({ title: 'HR Specialist', departmentId: hrDept.id }).returning();
    const [salesDirJob] = await db.insert(jobTitles).values({ title: 'Sales Director', departmentId: salesDept.id }).returning();
    const [productOwnerJob] = await db.insert(jobTitles).values({ title: 'Product Owner', departmentId: productDept.id }).returning();

    // Create profiles (MINIMAL columns only - no profile_picture, address, etc)
    console.log('3️⃣ Creating profiles (minimal data)...');
    
    const [demoUser] = await db.insert(profiles).values({
      email: 'demo@hrstudio360.com',
      firstName: 'Demo',
      lastName: 'User',
      phone: '(555) 000-0000',
    }).returning();

    const [robertSala] = await db.insert(profiles).values({
      email: 'robertsala@gmail.com',
      firstName: 'Robert',
      lastName: 'Sala',
      phone: '(555) 000-0000',
    }).returning();

    const [sarahJohnson] = await db.insert(profiles).values({
      email: 'sarah.johnson@hrstudio360.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '(555) 111-1111',
    }).returning();

    const [jessicaWilliams] = await db.insert(profiles).values({
      email: 'jessica.williams@hrstudio360.com',
      firstName: 'Jessica',
      lastName: 'Williams',
      phone: '(555) 222-2222',
    }).returning();

    const [mikeChen] = await db.insert(profiles).values({
      email: 'mike.chen@hrstudio360.com',
      firstName: 'Mike',
      lastName: 'Chen',
      phone: '(555) 333-3333',
    }).returning();

    const [victorMartinez] = await db.insert(profiles).values({
      email: 'victor.martinez@company.com',
      firstName: 'Victor',
      lastName: 'Martinez',
      phone: '(555) 444-4444',
    }).returning();

    // Create employee records
    console.log('4️⃣ Creating employee records...');
    await db.insert(employees).values([
      { userId: demoUser.id, employeeId: 'EMP001', departmentId: productDept.id, jobTitleId: productOwnerJob.id, status: 'Active', startDate: '2024-01-15', salary: '120000', employmentType: 'Full-time' },
      { userId: robertSala.id, employeeId: 'EMP002', departmentId: execDept.id, jobTitleId: ceoJob.id, status: 'Active', startDate: '2023-01-01', salary: '250000', employmentType: 'Full-time' },
      { userId: sarahJohnson.id, employeeId: 'EMP003', departmentId: hrDept.id, jobTitleId: hrSpecJob.id, status: 'Active', startDate: '2023-06-15', salary: '75000', employmentType: 'Full-time' },
      { userId: jessicaWilliams.id, employeeId: 'EMP004', departmentId: hrDept.id, jobTitleId: hrManagerJob.id, status: 'Active', startDate: '2023-08-01', salary: '95000', employmentType: 'Full-time' },
      { userId: mikeChen.id, employeeId: 'EMP005', departmentId: salesDept.id, jobTitleId: salesDirJob.id, status: 'Active', startDate: '2024-02-10', salary: '125000', employmentType: 'Full-time' },
      { userId: victorMartinez.id, employeeId: 'EMP006', departmentId: financeDept.id, jobTitleId: cfoJob.id, status: 'Active', startDate: '2023-04-20', salary: '180000', employmentType: 'Full-time' },
    ]);

    // Create auth credentials
    console.log('5️⃣ Creating auth credentials...');
    const defaultPassword = await hashPassword('HRStudio360Demo!');
    
    await db.insert(authCredentials).values([
      { profileId: demoUser.id, passwordHash: defaultPassword },
      { profileId: robertSala.id, passwordHash: defaultPassword },
      { profileId: sarahJohnson.id, passwordHash: defaultPassword },
      { profileId: jessicaWilliams.id, passwordHash: defaultPassword },
      { profileId: mikeChen.id, passwordHash: defaultPassword },
      { profileId: victorMartinez.id, passwordHash: defaultPassword },
    ]);

    console.log('✅ Emergency seed completed successfully!');
    console.log('📧 All users have password: HRStudio360Demo!');
    
    return { success: true, message: 'Emergency seed completed' };
  } catch (error: any) {
    console.error('❌ Emergency seed failed:', error);
    return { success: false, error: error.message };
  }
}
