import { db } from './db';
import { profiles, announcements } from '../shared/schema';

async function seedDatabase() {
  console.log('🌱 Starting simple database seed...');

  try {
    // Create Demo User Profile
    console.log('Creating demo user profile...');
    await db.insert(profiles).values({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'demo@hrstudio360.com',
      fullName: 'Demo User',
      role: 'Product Owner',
      department: 'Product',
      bio: 'Demo account for HRStudio360 - explore all features!',
      canAccessOrgChart: true,
    }).onConflictDoNothing();

    // Create Robert Sala Profile
    console.log('Creating Robert Sala profile...');
    await db.insert(profiles).values({
      id: '00000000-0000-0000-0000-000000000002',
      email: 'robertsala@gmail.com',
      fullName: 'Robert Sala',
      role: 'CEO',
      department: 'Executive',
      bio: 'Chief Executive Officer at HRStudio360',
      canAccessOrgChart: true,
    }).onConflictDoNothing();

    // Create Sample Profiles
    console.log('Creating sample team members...');
    const sampleProfiles = [
      {
        email: 'sarah.johnson@hrstudio360.com',
        fullName: 'Sarah Johnson',
        role: 'Senior Engineer',
        department: 'Engineering',
        canAccessOrgChart: true,
      },
      {
        email: 'michael.chen@hrstudio360.com',
        fullName: 'Michael Chen',
        role: 'Product Manager',
        department: 'Product',
        canAccessOrgChart: true,
      },
      {
        email: 'emily.rodriguez@hrstudio360.com',
        fullName: 'Emily Rodriguez',
        role: 'UX Designer',
        department: 'Design',
        canAccessOrgChart: true,
      },
    ];

    for (const profile of sampleProfiles) {
      await db.insert(profiles).values(profile).onConflictDoNothing();
    }

    // Create Sample Announcement
    console.log('Creating sample announcement...');
    await db.insert(announcements).values({
      title: 'Welcome to HRStudio360!',
      content: 'We are excited to have you on board. Explore all the features of our AI-powered HR platform.',
      priority: 'high',
      published: true,
      creatorUserId: '00000000-0000-0000-0000-000000000002',
    }).onConflictDoNothing();

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Seed Summary:');
    console.log('- 5 user profiles (Demo User, Robert Sala + 3 team members)');
    console.log('- 1 announcement');
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
