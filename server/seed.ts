import { db } from './db';
import { 
  profiles, 
  announcements,
  leaveRequests,
  celebrationBadges,
  performanceReviews,
  earnedBadges
} from '../shared/schema';

async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Create Demo User Profile
    console.log('Creating demo user profile...');
    await db.insert(profiles).values({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'demo@hrstudio360.com',
      fullName: 'Demo User',
      role: 'Product Owner',
      department: 'Product',
      avatarUrl: null,
      bio: 'Demo account for HRStudio360 - explore all features!',
      canAccessOrgChart: true,
      managerId: null,
    }).onConflictDoNothing();

    // Create Robert Sala Profile
    console.log('Creating Robert Sala profile...');
    await db.insert(profiles).values({
      id: '00000000-0000-0000-0000-000000000002',
      email: 'robertsala@gmail.com',
      fullName: 'Robert Sala',
      role: 'CEO',
      department: 'Executive',
      avatarUrl: null,
      bio: 'Chief Executive Officer at HRStudio360',
      canAccessOrgChart: true,
      managerId: null,
    }).onConflictDoNothing();

    // Create Additional Sample Profiles
    console.log('Creating additional sample profiles...');
    const sampleProfiles = [
      {
        id: '00000000-0000-0000-0000-000000000010',
        email: 'sarah.johnson@hrstudio360.com',
        fullName: 'Sarah Johnson',
        role: 'Senior Engineer',
        department: 'Engineering',
        canAccessOrgChart: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000011',
        email: 'michael.chen@hrstudio360.com',
        fullName: 'Michael Chen',
        role: 'Product Manager',
        department: 'Product',
        canAccessOrgChart: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000012',
        email: 'emily.rodriguez@hrstudio360.com',
        fullName: 'Emily Rodriguez',
        role: 'UX Designer',
        department: 'Design',
        canAccessOrgChart: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000013',
        email: 'james.wilson@hrstudio360.com',
        fullName: 'James Wilson',
        role: 'HR Manager',
        department: 'People',
        canAccessOrgChart: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000014',
        email: 'lisa.anderson@hrstudio360.com',
        fullName: 'Lisa Anderson',
        role: 'Marketing Director',
        department: 'Marketing',
        canAccessOrgChart: true,
      },
    ];

    for (const profile of sampleProfiles) {
      await db.insert(profiles).values(profile).onConflictDoNothing();
    }

    // Create Sample Announcements
    console.log('Creating sample announcements...');
    const now = new Date();
    const sampleAnnouncements = [
      {
        id: '00000000-0000-0000-0000-000000000020',
        title: 'Welcome to HRStudio360!',
        content: 'We are excited to have you on board. Explore all the features of our AI-powered HR platform.',
        type: 'general' as const,
        priority: 'high' as const,
        published: true,
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        authorId: '00000000-0000-0000-0000-000000000002',
      },
      {
        id: '00000000-0000-0000-0000-000000000021',
        title: 'Q1 Company All-Hands Meeting',
        content: 'Join us this Friday at 2 PM for our quarterly all-hands meeting. We will discuss company performance, upcoming initiatives, and celebrate our wins!',
        type: 'event' as const,
        priority: 'medium' as const,
        published: true,
        startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        authorId: '00000000-0000-0000-0000-000000000002',
      },
    ];

    for (const announcement of sampleAnnouncements) {
      await db.insert(announcements).values(announcement).onConflictDoNothing();
    }

    // Create Sample Leave Requests  
    console.log('Creating sample leave requests...');
    await db.insert(leaveRequests).values({
      id: '00000000-0000-0000-0000-000000000030',
      userId: '00000000-0000-0000-0000-000000000010',
      leaveType: 'Vacation',
      startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reason: 'Family vacation',
      status: 'Approved',
    }).onConflictDoNothing();

    // Create Sample Earned Badge
    console.log('Creating sample earned badge...');
    await db.insert(earnedBadges).values({
      id: '00000000-0000-0000-0000-000000000040',
      userId: '00000000-0000-0000-0000-000000000001',
      badgeId: '00000000-0000-0000-0000-000000000060',
      earnedAt: new Date(2024, 5, 15).toISOString(),
    }).onConflictDoNothing();

    // Create Sample Performance Reviews
    console.log('Creating sample performance reviews...');
    await db.insert(performanceReviews).values({
      id: '00000000-0000-0000-0000-000000000050',
      userId: '00000000-0000-0000-0000-000000000010',
      reviewCycleId: null,
      submittedAt: new Date(2024, 8, 1).toISOString(),
      status: 'submitted',
    }).onConflictDoNothing();

    // Create Sample Celebration Badge Templates
    console.log('Creating sample celebration badge templates...');
    await db.insert(celebrationBadges).values({
      id: '00000000-0000-0000-0000-000000000060',
      name: '1 Year Anniversary',
      description: 'Congratulations on 1 year with the company!',
      badgeType: 'work_anniversary',
      iconType: 'trophy',
      colorScheme: 'gold',
    }).onConflictDoNothing();

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Seed Summary:');
    console.log('- 7 user profiles (Demo User, Robert Sala + 5 team members)');
    console.log('- 2 announcements');
    console.log('- 1 leave request');
    console.log('- 1 performance review');
    console.log('- 1 celebration badge template');
    console.log('- 1 earned badge');
    console.log('\n🔐 Login Credentials:');
    console.log('Demo Account: demo@hrstudio360.com / demo');
    console.log('Robert Sala: robertsala@gmail.com / (use your password)');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('\n🎉 Seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  });
