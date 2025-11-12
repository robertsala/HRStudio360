import { db } from './db';
import { 
  profiles, announcements, departments, jobTitles, 
  employees, leaveBalances, candidates, newHires, leaveRequests,
  reviewCycles, performanceReviews, reviewQuestionsLibrary, reviewQuestionTemplates,
  reviewQuestionAssignments, reviewResponses, reviewGoalsComments, authCredentials
} from '../shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from './lib/password';

export async function seedProductionDatabase(options: { force?: boolean } = {}) {
  console.log('🌱 Starting production database seed...');

  try {
    // Safety check: Prevent duplicate seeding (unless force = true)
    if (!options.force) {
      const existingDemo = await db.select().from(profiles).where(eq(profiles.email, 'demo@hrstudio360.com')).limit(1);
      if (existingDemo.length > 0) {
        console.log('⚠️  Database already seeded (demo user exists).');
        console.log('💡 To re-seed, delete existing data first or use force option.');
        return {
          success: true,
          alreadySeeded: true,
          message: 'Database already contains demo data. Use force:true to reseed.'
        };
      }
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
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoUser&backgroundColor=b6e3f4',
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
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RobertSala&backgroundColor=c0aede',
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
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahJohnson&backgroundColor=ffd5dc',
      },
      {
        email: 'michael.chen@hrstudio360.com',
        firstName: 'Michael',
        lastName: 'Chen',
        department: 'Product',
        role: 'Product Manager',
        canAccessOrgChart: true,
        hireDate: '2023-08-01',
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MichaelChen&backgroundColor=d1d4f9',
      },
      {
        email: 'emily.rodriguez@hrstudio360.com',
        firstName: 'Emily',
        lastName: 'Rodriguez',
        department: 'Design',
        role: 'UX Designer',
        canAccessOrgChart: true,
        hireDate: '2024-02-10',
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EmilyRodriguez&backgroundColor=ffdfbf',
      },
      {
        email: 'james.wilson@hrstudio360.com',
        firstName: 'James',
        lastName: 'Wilson',
        department: 'People',
        role: 'HR Manager',
        canAccessOrgChart: true,
        hireDate: '2023-04-20',
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JamesWilson&backgroundColor=c7ede6',
      },
      {
        email: 'lisa.anderson@hrstudio360.com',
        firstName: 'Lisa',
        lastName: 'Anderson',
        department: 'Marketing',
        role: 'Marketing Director',
        canAccessOrgChart: true,
        hireDate: '2023-09-15',
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LisaAnderson&backgroundColor=feca57',
      },
    ];

    const createdTeamMembers = await db.insert(profiles).values(teamMembers).returning();
    console.log(`   ✓ Created ${createdTeamMembers.length} team members`);

    // Step 3.5: Create authentication credentials for all users
    console.log('3️⃣.5 Creating authentication credentials...');
    const defaultPassword = 'HRStudio360Demo!'; // Strong default password
    const hashedPassword = await hashPassword(defaultPassword);
    
    const authCredentialsData = [
      { profileId: demoUser.id, passwordHash: hashedPassword },
      { profileId: robertSala.id, passwordHash: hashedPassword },
      ...createdTeamMembers.map(member => ({
        profileId: member.id,
        passwordHash: hashedPassword
      }))
    ];
    
    await db.insert(authCredentials).values(authCredentialsData);
    console.log(`   ✓ Created authentication credentials for ${authCredentialsData.length} users`);
    console.log(`   ℹ️  Default password for all users: ${defaultPassword}`);

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

    // Step 8: Create Employee Records
    console.log('8️⃣  Creating employee records...');
    const currentYear = new Date().getFullYear();
    
    const ceoJobTitle = createdJobTitles.find(jt => jt.title === 'CEO');
    const seniorEngJobTitle = createdJobTitles.find(jt => jt.title === 'Senior Engineer');
    const pmJobTitle = createdJobTitles.find(jt => jt.title === 'Product Manager');
    const poJobTitle = createdJobTitles.find(jt => jt.title === 'Product Owner');
    const uxJobTitle = createdJobTitles.find(jt => jt.title === 'UX Designer');
    const hrJobTitle = createdJobTitles.find(jt => jt.title === 'HR Manager');
    const mdJobTitle = createdJobTitles.find(jt => jt.title === 'Marketing Director');
    
    const engineeringDeptFull = createdDepartments.find(d => d.name === 'Engineering');
    const productDeptFull = createdDepartments.find(d => d.name === 'Product');
    const designDeptFull = createdDepartments.find(d => d.name === 'Design');
    const peopleDeptFull = createdDepartments.find(d => d.name === 'People');
    const marketingDeptFull = createdDepartments.find(d => d.name === 'Marketing');
    const executiveDeptFull = createdDepartments.find(d => d.name === 'Executive');

    const employeeRecords = [
      {
        userId: robertSala.id,
        employeeId: 'EMP001',
        departmentId: executiveDeptFull?.id,
        jobTitleId: ceoJobTitle?.id,
        startDate: '2023-01-01',
        employmentType: 'Full-time' as const,
        salary: '250000',
        status: 'Active' as const
      },
      {
        userId: demoUser.id,
        employeeId: 'EMP002',
        departmentId: productDeptFull?.id,
        jobTitleId: poJobTitle?.id,
        startDate: '2024-01-15',
        employmentType: 'Full-time' as const,
        salary: '120000',
        status: 'Active' as const
      },
      {
        userId: createdTeamMembers[0].id, // Sarah Johnson
        employeeId: 'EMP003',
        departmentId: engineeringDeptFull?.id,
        jobTitleId: seniorEngJobTitle?.id,
        startDate: '2023-06-15',
        employmentType: 'Full-time' as const,
        salary: '140000',
        status: 'Active' as const
      },
      {
        userId: createdTeamMembers[1].id, // Michael Chen
        employeeId: 'EMP004',
        departmentId: productDeptFull?.id,
        jobTitleId: pmJobTitle?.id,
        startDate: '2023-08-01',
        employmentType: 'Full-time' as const,
        salary: '130000',
        status: 'Active' as const
      },
      {
        userId: createdTeamMembers[2].id, // Emily Rodriguez
        employeeId: 'EMP005',
        departmentId: designDeptFull?.id,
        jobTitleId: uxJobTitle?.id,
        startDate: '2024-02-10',
        employmentType: 'Full-time' as const,
        salary: '110000',
        status: 'Active' as const
      },
      {
        userId: createdTeamMembers[3].id, // James Wilson
        employeeId: 'EMP006',
        departmentId: peopleDeptFull?.id,
        jobTitleId: hrJobTitle?.id,
        startDate: '2023-04-20',
        employmentType: 'Full-time' as const,
        salary: '105000',
        status: 'Active' as const
      },
      {
        userId: createdTeamMembers[4].id, // Lisa Anderson
        employeeId: 'EMP007',
        departmentId: marketingDeptFull?.id,
        jobTitleId: mdJobTitle?.id,
        startDate: '2023-09-15',
        employmentType: 'Full-time' as const,
        salary: '115000',
        status: 'Active' as const
      }
    ];

    const createdEmployees = await db.insert(employees).values(employeeRecords).returning();
    console.log(`   ✓ Created ${createdEmployees.length} employee records`);

    // Step 9: Create Leave Balances
    console.log('9️⃣  Creating leave balances...');
    const leaveBalanceData = createdEmployees.map(emp => ({
      employeeId: emp.id,
      vacationDays: '20.0',
      sickDays: '10.0',
      personalDays: '5.0',
      year: currentYear
    }));

    const createdLeaveBalances = await db.insert(leaveBalances).values(leaveBalanceData).returning();
    console.log(`   ✓ Created ${createdLeaveBalances.length} leave balance records`);

    // Step 10: Create Sample Candidates
    console.log('🔟 Creating recruitment candidates...');
    const candidateData = [
      {
        name: 'Alex Thompson',
        email: 'alex.thompson@email.com',
        phone: '(555) 123-4567',
        position: 'Senior Software Engineer',
        department: 'Engineering',
        experience: '5 years',
        location: 'San Francisco, CA',
        salaryExpectation: '145000',
        status: 'Interview',
        skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
        education: 'BS Computer Science, Stanford University',
        previousCompany: 'Tech Corp Inc',
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexThompson&backgroundColor=a8e6cf',
        aiMatchScore: 92,
        rating: 5
      },
      {
        name: 'Jessica Martinez',
        email: 'jessica.martinez@email.com',
        phone: '(555) 234-5678',
        position: 'Product Designer',
        department: 'Design',
        experience: '4 years',
        location: 'New York, NY',
        salaryExpectation: '125000',
        status: 'Phone Screen',
        skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'],
        education: 'BFA Design, Parsons',
        previousCompany: 'Creative Studio LLC',
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JessicaMartinez&backgroundColor=ffaaa5',
        aiMatchScore: 88,
        rating: 4
      },
      {
        name: 'David Kim',
        email: 'david.kim@email.com',
        phone: '(555) 345-6789',
        position: 'Marketing Manager',
        department: 'Marketing',
        experience: '6 years',
        location: 'Austin, TX',
        salaryExpectation: '115000',
        status: 'Offer Sent',
        skills: ['SEO', 'Content Marketing', 'Analytics', 'Campaign Management'],
        education: 'MBA Marketing, UT Austin',
        previousCompany: 'Marketing Pro Inc',
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DavidKim&backgroundColor=b4a7d6',
        aiMatchScore: 95,
        rating: 5
      }
    ];

    const createdCandidates = await db.insert(candidates).values(candidateData).returning();
    console.log(`   ✓ Created ${createdCandidates.length} candidates`);

    // Step 11: Create New Hires (for onboarding)
    console.log('1️⃣1️⃣  Creating new hires for onboarding...');
    const newHireData = [
      {
        email: 'new.hire@hrstudio360.com',
        firstName: 'Jordan',
        lastName: 'Williams',
        position: 'Junior Developer',
        department: 'Engineering',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        salary: '85000',
        status: 'Pending'
      }
    ];

    const createdNewHires = await db.insert(newHires).values(newHireData).returning();
    console.log(`   ✓ Created ${createdNewHires.length} new hire records`);

    // Step 12: Create Sample Leave Requests
    console.log('1️⃣2️⃣  Creating sample leave requests...');
    const demoEmployee = createdEmployees.find(e => e.userId === demoUser.id);
    const sarahEmployee = createdEmployees.find(e => e.userId === createdTeamMembers[0].id);
    
    const leaveRequestData = [
      {
        employeeId: sarahEmployee?.id || createdEmployees[2].id,
        type: 'Vacation' as const,
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        days: 5,
        status: 'Pending' as const,
        reason: 'Family vacation to Hawaii',
        coverageArrangements: 'Michael Chen will cover my responsibilities'
      },
      {
        employeeId: demoEmployee?.id || createdEmployees[1].id,
        type: 'Personal' as const,
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        days: 1,
        status: 'Approved' as const,
        reason: 'Personal appointment',
        coverageArrangements: 'Work completed in advance'
      }
    ];

    const createdLeaveRequests = await db.insert(leaveRequests).values(leaveRequestData).returning();
    console.log(`   ✓ Created ${createdLeaveRequests.length} leave requests`);

    // Step 13: Create Review Question Template
    console.log('1️⃣3️⃣  Creating performance review template...');
    const [reviewTemplate] = await db.insert(reviewQuestionTemplates).values({
      templateName: 'Annual Performance Review',
      description: 'Standard annual performance review template'
    }).returning();
    console.log(`   ✓ Review template created`);

    // Step 14: Create Review Questions
    console.log('1️⃣4️⃣  Creating review questions...');
    const reviewQuestions = [
      {
        questionText: 'How well did the employee meet their goals and objectives?',
        category: 'Goals & Objectives',
        weight: '1.0',
        sortOrder: 1,
        questionType: 'rating'
      },
      {
        questionText: 'Rate the employee\'s technical skills and expertise',
        category: 'Technical Skills',
        weight: '1.0',
        sortOrder: 2,
        questionType: 'rating'
      },
      {
        questionText: 'How effectively does the employee collaborate with team members?',
        category: 'Teamwork',
        weight: '1.0',
        sortOrder: 3,
        questionType: 'rating'
      },
      {
        questionText: 'Rate the employee\'s communication skills',
        category: 'Communication',
        weight: '1.0',
        sortOrder: 4,
        questionType: 'rating'
      },
      {
        questionText: 'How would you rate the employee\'s overall performance?',
        category: 'Overall',
        weight: '1.5',
        sortOrder: 5,
        questionType: 'rating'
      }
    ];

    const createdQuestions = await db.insert(reviewQuestionsLibrary).values(reviewQuestions).returning();
    console.log(`   ✓ Created ${createdQuestions.length} review questions`);

    // Step 15: Assign questions to template
    const questionAssignments = createdQuestions.map((q, idx) => ({
      templateId: reviewTemplate.id,
      questionId: q.id,
      sortOrder: idx + 1,
      isRequired: true
    }));
    await db.insert(reviewQuestionAssignments).values(questionAssignments);

    // Step 16: Create Review Cycle
    console.log('1️⃣5️⃣  Creating review cycle...');
    const [reviewCycle] = await db.insert(reviewCycles).values({
      name: '2025 Annual Performance Review',
      reviewType: 'annual',
      templateId: reviewTemplate.id,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      selfAssessmentDeadline: '2025-03-15',
      managerAssessmentDeadline: '2025-03-31',
      status: 'active',
      createdBy: robertSala.id
    }).returning();
    console.log(`   ✓ Review cycle created`);

    // Step 17: Create Performance Reviews
    console.log('1️⃣6️⃣  Creating performance reviews...');
    const robertEmployee = createdEmployees.find(e => e.userId === robertSala.id);
    const sarahEmployee2 = createdEmployees.find(e => e.userId === createdTeamMembers[0].id);
    const michaelEmployee = createdEmployees.find(e => e.userId === createdTeamMembers[1].id);

    const performanceReviewData = [
      {
        reviewCycleId: reviewCycle.id,
        employeeId: sarahEmployee2?.id || createdEmployees[2].id,
        managerId: robertEmployee?.id || createdEmployees[0].id,
        selfAssessmentStatus: 'submitted',
        managerAssessmentStatus: 'submitted',
        selfAssessmentSubmittedAt: new Date('2025-03-10'),
        managerAssessmentSubmittedAt: new Date('2025-03-20'),
        hrReviewStatus: 'reviewed',
        overallStatus: 'completed',
        selfOverallRating: '4.5',
        managerOverallRating: '4.7',
        finalRating: '4.6',
        compensationChange: '8000',
        compensationChangeApproved: true
      },
      {
        reviewCycleId: reviewCycle.id,
        employeeId: michaelEmployee?.id || createdEmployees[3].id,
        managerId: robertEmployee?.id || createdEmployees[0].id,
        selfAssessmentStatus: 'submitted',
        managerAssessmentStatus: 'in_progress',
        selfAssessmentSubmittedAt: new Date('2025-03-12'),
        hrReviewStatus: 'pending',
        overallStatus: 'pending_manager',
        selfOverallRating: '4.2',
        managerOverallRating: null,
        finalRating: null,
        compensationChange: null,
        compensationChangeApproved: false
      }
    ];

    const createdReviews = await db.insert(performanceReviews).values(performanceReviewData).returning();
    console.log(`   ✓ Created ${createdReviews.length} performance reviews`);

    // Step 18: Create Review Responses (for completed review)
    console.log('1️⃣7️⃣  Creating review responses...');
    const completedReview = createdReviews[0];
    const reviewResponseData = createdQuestions.map(q => [
      {
        performanceReviewId: completedReview.id,
        questionId: q.id,
        responseType: 'self_assessment',
        rating: '4.5',
        textResponse: 'Strong performance in this area with room for continued growth',
        comments: 'Self-assessment comments'
      },
      {
        performanceReviewId: completedReview.id,
        questionId: q.id,
        responseType: 'manager_assessment',
        rating: '4.7',
        textResponse: 'Excellent performance, exceeds expectations',
        comments: 'Manager feedback'
      }
    ]).flat();

    const createdResponses = await db.insert(reviewResponses).values(reviewResponseData).returning();
    console.log(`   ✓ Created ${createdResponses.length} review responses`);

    // Step 19: Create Review Goals & Comments
    console.log('1️⃣8️⃣  Creating review goals and comments...');
    const goalCommentsData = [
      {
        performanceReviewId: completedReview.id,
        commentType: 'self_assessment',
        achievements: 'Successfully led 3 major projects, improved code quality metrics by 25%, mentored 2 junior developers',
        developmentAreas: 'Would like to improve presentation skills and learn more about system architecture',
        goalsNextPeriod: 'Lead team architecture initiatives, complete AWS certification, present at tech conference',
        additionalComments: 'Excited about growth opportunities in the coming year'
      },
      {
        performanceReviewId: completedReview.id,
        commentType: 'manager_assessment',
        achievements: 'Outstanding technical leadership, consistently delivers high-quality work, excellent team player',
        developmentAreas: 'Continue developing strategic thinking and cross-functional collaboration skills',
        goalsNextPeriod: 'Take ownership of platform architecture, mentor team members, drive technical standards',
        additionalComments: 'One of our top performers, ready for increased responsibilities'
      }
    ];

    await db.insert(reviewGoalsComments).values(goalCommentsData);
    console.log(`   ✓ Created review goals and comments`);

    console.log('\n✅ Production database seeded successfully!');
    console.log('\n📊 Seed Summary:');
    console.log(`   - 7 user profiles (Demo User, Robert Sala + 5 team members)`);
    console.log(`   - ${createdDepartments.length} departments`);
    console.log(`   - ${createdJobTitles.length} job titles`);
    console.log(`   - ${createdEmployees.length} employee records`);
    console.log(`   - ${createdLeaveBalances.length} leave balances`);
    console.log(`   - ${createdCandidates.length} recruitment candidates`);
    console.log(`   - ${createdNewHires.length} new hires (onboarding)`);
    console.log(`   - ${createdLeaveRequests.length} leave requests`);
    console.log(`   - 1 review cycle (2025 Annual)`);
    console.log(`   - ${createdReviews.length} performance reviews (1 completed, 1 in-progress)`);
    console.log(`   - ${createdQuestions.length} review questions`);
    console.log(`   - ${createdResponses.length} review responses`);
    console.log('   - 2 announcements');
    console.log('\n🔐 Login Credentials:');
    console.log('   Demo Account: demo@hrstudio360.com');
    console.log('   Robert Sala: robertsala@gmail.com');
    console.log('\n💡 One-click login: Just enter email, no password required');
    
    return {
      success: true,
      alreadySeeded: false,
      message: 'Production database seeded successfully with comprehensive demo data',
      summary: {
        profiles: 7,
        departments: createdDepartments.length,
        jobTitles: createdJobTitles.length,
        employees: createdEmployees.length,
        leaveBalances: createdLeaveBalances.length,
        candidates: createdCandidates.length,
        newHires: createdNewHires.length,
        leaveRequests: createdLeaveRequests.length,
        reviewCycles: 1,
        performanceReviews: createdReviews.length,
        reviewQuestions: createdQuestions.length,
        reviewResponses: createdResponses.length,
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
