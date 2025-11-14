/**
 * Script to create a sample job posting via API
 * Run with: npx tsx scripts/create-sample-job-via-api.ts
 */

async function createSampleJobViaAPI() {
  console.log('Creating sample job posting via API...');
  
  const jobData = {
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
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  try {
    const response = await fetch('http://localhost:5000/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=test-session' // This will fail auth, but that's okay for now
      },
      body: JSON.stringify(jobData)
    });

    if (response.ok) {
      const job = await response.json();
      console.log('✅ Sample job created:', job);
    } else {
      const error = await response.json();
      console.log('ℹ️  API returned:', error);
      console.log('Note: This is expected if not authenticated. Use the job management UI instead.');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createSampleJobViaAPI();
