/**
 * Script to create a sample job posting for testing the ATS
 * Run with: npx tsx scripts/create-sample-job.ts
 */

import { db } from '../server/db.js';
import { jobPostings, interviewStages } from '../shared/schema.js';
import { sql } from 'drizzle-orm';

async function createSampleJob() {
  console.log('Creating sample job posting...');
  
  try {
    // Get demo user ID (assuming demo user exists)
    const demoUser = await db.execute(sql`
      SELECT id FROM profiles WHERE email = 'demo@hrstudio360.com' LIMIT 1
    `);
    
    const userId = demoUser.rows[0]?.id;
    
    if (!userId) {
      console.error('Demo user not found. Please ensure the demo account exists.');
      process.exit(1);
    }

    // Create a sample job posting
    const [job] = await db.insert(jobPostings).values({
      title: 'Senior Full-Stack Engineer',
      department: 'Engineering',
      location: 'San Francisco, CA (Remote)',
      employmentType: 'full_time',
      salaryMin: 140000,
      salaryMax: 180000,
      description: 'We are seeking a talented Senior Full-Stack Engineer to join our growing team. You will work on building scalable HR technology solutions that impact thousands of users.',
      requirements: [
        '5+ years of professional software development experience',
        'Strong proficiency in TypeScript, React, and Node.js',
        'Experience with PostgreSQL or similar relational databases',
        'Knowledge of modern web development practices and tools',
        'Excellent problem-solving and communication skills'
      ],
      responsibilities: [
        'Design and implement new features across the full stack',
        'Collaborate with product and design teams to deliver user-focused solutions',
        'Write clean, maintainable, and well-tested code',
        'Participate in code reviews and mentor junior developers',
        'Contribute to technical architecture and design decisions'
      ],
      benefits: [
        'Competitive salary and equity package',
        'Comprehensive health, dental, and vision insurance',
        'Unlimited PTO and flexible work arrangements',
        '401(k) with company matching',
        'Professional development budget',
        'Remote-first culture'
      ],
      experienceLevel: '5+ years',
      educationLevel: "Bachelor's Degree or equivalent experience",
      isPublic: true,
      status: 'active',
      postedBy: userId,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      totalApplications: 0,
      totalViews: 0
    }).returning();

    console.log('✅ Sample job created:', job);

    // Create default interview stages for this job
    const stages = [
      { name: 'Applied', jobPostingId: job.id, stageOrder: 1, isDefault: true },
      { name: 'Phone Screen', jobPostingId: job.id, stageOrder: 2, isDefault: false },
      { name: 'Technical Interview', jobPostingId: job.id, stageOrder: 3, isDefault: false },
      { name: 'Team Interview', jobPostingId: job.id, stageOrder: 4, isDefault: false },
      { name: 'Offer', jobPostingId: job.id, stageOrder: 5, isDefault: false },
      { name: 'Hired', jobPostingId: job.id, stageOrder: 6, isDefault: false }
    ];

    await db.insert(interviewStages).values(stages);
    console.log('✅ Interview stages created');

    console.log('\n🎉 Sample job posting created successfully!');
    console.log('Visit /careers to see it in action');
    
  } catch (error) {
    console.error('❌ Error creating sample job:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

createSampleJob();
