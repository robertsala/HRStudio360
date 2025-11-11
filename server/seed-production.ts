import { db } from './db';
import { profiles, announcements, departments, jobTitles } from '../shared/schema';
import { eq } from 'drizzle-orm';

export async function seedProductionDatabase() {
  console.log('🌱 Starting production database seed...');

  try {
    // Safety check: Prevent duplicate seeding
    const existingDemo = await db.select().from(profiles).where(eq(profiles.email, 'demo@hrstudio360.com')).limit(1);
    if (existingDemo.length > 0) {
      console.log('⚠️  Database already seeded (demo user exists). Skipping...');
      return {
        success: true,
        alreadySeeded: true,
        message: 'Database already contains demo data'
      };
    }
    // Step 1: Create Demo User Profile
    console.log('1️⃣  Creating demo user profile...');
    const [demoUser] = await db.insert(profiles).values({
      email: 'demo@hrstudio360.com',
      firstName: 'Demo',
      lastName: 'User',
      department: 'Product',
      role: 'Product Owner',
      canAccessOrgChart: true,
      hireDate: '2024-01-15',
    }).returning();
    console.log(`   ✓ Demo User created with ID: ${demoUser.id}`);

    // Step 2: Create Robert Sala Profile
    console.log('2️⃣  Creating Robert Sala profile...');
    const [robertSala] = await db.insert(profiles).values({
      email: 'robertsala@gmail.com',
      firstName: 'Robert',
      lastName: 'Sala',
      department: 'Executive',
      role: 'CEO',
      canAccessOrgChart: true,
      hireDate: '2023-01-01',
    }).returning();
    console.log(`   ✓ Robert Sala created with ID: ${robertSala.id}`);

    // Step 3: Create Sample Team Members
    console.log('3️⃣  Creating sample team members...');
    const teamMembers = [
      {
        email: 'sarah.johnson@hrstudio360.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        department: 'Engineering',
        role: 'Senior Engineer',
        canAccessOrgChart: true,
        hireDate: '2023-06-15',
      },
      {
        email: 'michael.chen@hrstudio360.com',
        firstName: 'Michael',
        lastName: 'Chen',
        department: 'Product',
        role: 'Product Manager',
        canAccessOrgChart: true,
        hireDate: '2023-08-01',
      },
      {
        email: 'emily.rodriguez@hrstudio360.com',
        firstName: 'Emily',
        lastName: 'Rodriguez',
        department: 'Design',
        role: 'UX Designer',
        canAccessOrgChart: true,
        hireDate: '2024-02-10',
      },
      {
        email: 'james.wilson@hrstudio360.com',
        firstName: 'James',
        lastName: 'Wilson',
        department: 'People',
        role: 'HR Manager',
        canAccessOrgChart: true,
        hireDate: '2023-04-20',
      },
      {
        email: 'lisa.anderson@hrstudio360.com',
        firstName: 'Lisa',
        lastName: 'Anderson',
        department: 'Marketing',
        role: 'Marketing Director',
        canAccessOrgChart: true,
        hireDate: '2023-09-15',
      },
    ];

    const createdTeamMembers = await db.insert(profiles).values(teamMembers).returning();
    console.log(`   ✓ Created ${createdTeamMembers.length} team members`);

    // Step 4: Create Departments
    console.log('4️⃣  Creating departments...');
    const departmentData = [
      { name: 'Engineering', description: 'Software development and technical teams', managerId: robertSala.id },
      { name: 'Product', description: 'Product management and strategy', managerId: robertSala.id },
      { name: 'Design', description: 'UX/UI design team', managerId: robertSala.id },
      { name: 'People', description: 'Human Resources', managerId: robertSala.id },
      { name: 'Marketing', description: 'Marketing and communications', managerId: robertSala.id },
      { name: 'Executive', description: 'Executive leadership', managerId: null },
    ];

    const createdDepartments = await db.insert(departments).values(departmentData).returning();
    console.log(`   ✓ Created ${createdDepartments.length} departments`);

    // Step 5: Create Job Titles
    console.log('5️⃣  Creating job titles...');
    const engineeringDept = createdDepartments.find(d => d.name === 'Engineering');
    const productDept = createdDepartments.find(d => d.name === 'Product');
    const designDept = createdDepartments.find(d => d.name === 'Design');
    const peopleDept = createdDepartments.find(d => d.name === 'People');
    const marketingDept = createdDepartments.find(d => d.name === 'Marketing');
    const executiveDept = createdDepartments.find(d => d.name === 'Executive');

    const jobTitleData = [
      { title: 'CEO', departmentId: executiveDept?.id, description: 'Chief Executive Officer' },
      { title: 'Senior Engineer', departmentId: engineeringDept?.id, description: 'Senior software engineer' },
      { title: 'Product Manager', departmentId: productDept?.id, description: 'Product management' },
      { title: 'Product Owner', departmentId: productDept?.id, description: 'Product ownership' },
      { title: 'UX Designer', departmentId: designDept?.id, description: 'User experience design' },
      { title: 'HR Manager', departmentId: peopleDept?.id, description: 'Human resources management' },
      { title: 'Marketing Director', departmentId: marketingDept?.id, description: 'Marketing leadership' },
    ];

    const createdJobTitles = await db.insert(jobTitles).values(jobTitleData).returning();
    console.log(`   ✓ Created ${createdJobTitles.length} job titles`);

    // Step 6: Create Welcome Announcement
    console.log('6️⃣  Creating welcome announcement...');
    await db.insert(announcements).values({
      title: 'Welcome to HRStudio360!',
      content: 'We are excited to have you on board. Explore all the features of our AI-powered HR platform including recruitment, employee management, payroll, performance reviews, and more!',
      priority: 'high',
      published: true,
      creatorUserId: robertSala.id,
      publicationDate: new Date(),
    });
    console.log('   ✓ Welcome announcement created');

    // Step 7: Create Additional Announcement
    console.log('7️⃣  Creating company update announcement...');
    await db.insert(announcements).values({
      title: 'Platform Features',
      content: 'HRStudio360 includes comprehensive HR tools: AI-powered recruitment, employee onboarding, time tracking, payroll management, performance reviews, benefits administration, real-time chat, celebrations system, and advanced analytics.',
      priority: 'medium',
      published: true,
      creatorUserId: robertSala.id,
      publicationDate: new Date(),
    });
    console.log('   ✓ Platform features announcement created');

    console.log('\n✅ Production database seeded successfully!');
    console.log('\n📊 Seed Summary:');
    console.log(`   - 7 user profiles (Demo User, Robert Sala + 5 team members)`);
    console.log(`   - ${createdDepartments.length} departments`);
    console.log(`   - ${createdJobTitles.length} job titles`);
    console.log('   - 2 announcements');
    console.log('\n🔐 Login Credentials:');
    console.log('   Demo Account: demo@hrstudio360.com / demo');
    console.log('   Robert Sala: robertsala@gmail.com / (your password)');
    console.log('\n💡 Note: Passwords need to be set via the authentication system');
    
    return {
      success: true,
      alreadySeeded: false,
      message: 'Production database seeded successfully',
      summary: {
        profiles: 7,
        departments: createdDepartments.length,
        jobTitles: createdJobTitles.length,
        announcements: 2
      }
    };
    
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    throw error;
  }
}

// Only run if this file is executed directly (not imported as module)
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProductionDatabase()
    .then((result) => {
      console.log('\n🎉 Production seeding completed successfully!');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Production seeding failed:', error);
      process.exit(1);
    });
}
