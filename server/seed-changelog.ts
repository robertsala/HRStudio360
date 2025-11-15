import { db } from './db.js';
import { changeLog } from '../shared/schema.js';

const historicalChanges = [
  {
    changeType: 'system_change',
    title: 'Initial HR Studio 360 Platform Launch',
    description: 'Launched comprehensive HR management platform with modular dashboard, employee lifecycle management, and dark mode support',
    affectedModules: ['Core Platform', 'Dashboard', 'UI/UX'],
    impactLevel: 'critical',
    visibilityScope: 'all_employees',
    notificationSent: false,
    version: '1.0.0'
  },
  {
    changeType: 'feature',
    title: 'Authentication & Authorization System',
    description: 'Implemented secure server-side authentication with Argon2id password hashing, progressive account lockout, rate limiting, and httpOnly cookies. Includes demo account with passwordless access',
    affectedModules: ['Security', 'Authentication'],
    impactLevel: 'critical',
    visibilityScope: 'all_employees',
    notificationSent: false,
    version: '1.1.0'
  },
  {
    changeType: 'feature',
    title: 'Real-time Chat System',
    description: 'Built WebSocket-based chat system with session authentication, real-time messaging, typing indicators, and presence tracking using ws library',
    affectedModules: ['Communication', 'Real-time Features'],
    impactLevel: 'high',
    visibilityScope: 'all_employees',
    notificationSent: false,
    version: '1.2.0'
  },
  {
    changeType: 'feature',
    title: 'Enterprise ATS Module - Job Postings',
    description: 'Launched public career portal with job browsing, application submission, resume upload, and AI-powered auto-fill. Added 11 new database tables and 20+ REST API endpoints',
    affectedModules: ['Recruitment', 'Job Postings', 'Database'],
    impactLevel: 'high',
    visibilityScope: 'all_employees',
    notificationSent: false,
    version: '2.0.0'
  },
  {
    changeType: 'feature',
    title: 'Studio AI Agent - Autonomous Screening',
    description: 'Introduced Studio AI powered by GPT-4o for autonomous candidate screening, batch pipeline processing, hiring insights, and natural language HR conversations',
    affectedModules: ['AI', 'Recruitment', 'Studio AI'],
    impactLevel: 'high',
    visibilityScope: 'all_employees',
    notificationSent: false,
    version: '2.1.0'
  },
  {
    changeType: 'feature',
    title: 'Candidate Pipeline Management Interface',
    description: 'Built HiringModal with kanban-style candidate pipeline management, interview stages, and contextual Studio AI access for recruitment insights',
    affectedModules: ['Recruitment', 'UI/UX'],
    impactLevel: 'medium',
    visibilityScope: 'hr_only',
    notificationSent: false,
    version: '2.2.0'
  },
  {
    changeType: 'improvement',
    title: 'Component Extraction - JobPostingsPanel',
    description: 'Extracted reusable JobPostingsPanel component for unified job posting management across JobManagementModal and HiringModal',
    affectedModules: ['Code Architecture', 'Recruitment'],
    impactLevel: 'low',
    visibilityScope: 'product_owner_only',
    notificationSent: false,
    version: '2.2.1'
  },
  {
    changeType: 'feature',
    title: 'Collaborator Invitation System',
    description: 'Implemented collaborator invitations with database tracking, email notifications, in-app notifications, and AI-powered employee search',
    affectedModules: ['Collaboration', 'Email', 'AI'],
    impactLevel: 'medium',
    visibilityScope: 'all_employees',
    notificationSent: false,
    version: '2.3.0'
  },
  {
    changeType: 'system_change',
    title: 'Production Monitoring with Sentry',
    description: 'Integrated Sentry for comprehensive error tracking and performance monitoring in production environment',
    affectedModules: ['Monitoring', 'Production'],
    impactLevel: 'high',
    visibilityScope: 'product_owner_only',
    notificationSent: false,
    version: '2.4.0'
  },
  {
    changeType: 'improvement',
    title: 'Comprehensive Testing Infrastructure',
    description: 'Established testing suite with Jest and Testing Library for frontend unit and backend integration tests',
    affectedModules: ['Testing', 'Quality Assurance'],
    impactLevel: 'medium',
    visibilityScope: 'product_owner_only',
    notificationSent: false,
    version: '2.4.1'
  },
  {
    changeType: 'improvement',
    title: 'Enhanced Error Handling & Resilience',
    description: 'Implemented ErrorBoundary components, centralized logger utility, apiErrors for user-friendly messages, and TanStack Query smart retry logic',
    affectedModules: ['Error Handling', 'User Experience'],
    impactLevel: 'medium',
    visibilityScope: 'all_employees',
    notificationSent: false,
    version: '2.5.0'
  },
  {
    changeType: 'feature',
    title: 'Internationalization Support',
    description: 'Added i18next integration for multi-language support with browser language detection',
    affectedModules: ['Localization', 'UI/UX'],
    impactLevel: 'medium',
    visibilityScope: 'all_employees',
    notificationSent: false,
    version: '2.6.0'
  },
  {
    changeType: 'system_change',
    title: 'Database Migration - Supabase to PostgreSQL',
    description: 'Migrated entire application from Supabase to Neon-hosted PostgreSQL with Drizzle ORM for improved type safety and performance',
    affectedModules: ['Database', 'Backend'],
    impactLevel: 'critical',
    visibilityScope: 'product_owner_only',
    notificationSent: false,
    version: '3.0.0'
  },
  {
    changeType: 'restoration',
    title: 'Paycheck Fun Facts - Database Migration',
    description: 'Restored paycheck fun facts feature with PostgreSQL migration. Added 3 database tables (templates, history, daily usage) with 20 seeded templates across 8 categories',
    affectedModules: ['Benefits & Pay', 'Database'],
    impactLevel: 'medium',
    visibilityScope: 'all_employees',
    notificationSent: false,
    version: '3.1.0'
  },
  {
    changeType: 'feature',
    title: 'Fun Facts - Smart Rotation System',
    description: 'Implemented history-based fact exclusion preventing repeats by tracking last 10 shown facts per employee',
    affectedModules: ['Benefits & Pay', 'User Experience'],
    impactLevel: 'low',
    visibilityScope: 'all_employees',
    notificationSent: false,
    version: '3.1.1'
  },
  {
    changeType: 'feature',
    title: 'Fun Facts - Daily Generation Limits',
    description: 'Added 3-per-day manual refresh limit with usage tracking and user-friendly notifications. Automatic facts shown with paychecks do not count against limit',
    affectedModules: ['Benefits & Pay', 'User Experience'],
    impactLevel: 'low',
    visibilityScope: 'all_employees',
    notificationSent: false,
    version: '3.1.2'
  },
  {
    changeType: 'fix',
    title: 'Fun Facts - Display Counter Fix',
    description: 'Fixed usage counter display to properly show "Fun Facts Today: X/3 (Y left)" format with correct API response mapping',
    affectedModules: ['Benefits & Pay', 'UI/UX'],
    impactLevel: 'medium',
    visibilityScope: 'all_employees',
    notificationSent: false,
    version: '3.1.3'
  },
  {
    changeType: 'feature',
    title: 'Production Database Seeding Endpoint',
    description: 'Created /api/fun-facts/seed endpoint for one-click production database seeding with safety checks to prevent duplicates',
    affectedModules: ['Deployment', 'Backend'],
    impactLevel: 'medium',
    visibilityScope: 'product_owner_only',
    notificationSent: false,
    version: '3.1.4'
  },
  {
    changeType: 'fix',
    title: 'Recruitment UI - Duplicate Button Removal',
    description: 'Fixed duplicate "Ask Studio AI" buttons in HiringModal by removing filter-row instance, keeping only header button',
    affectedModules: ['Recruitment', 'UI/UX'],
    impactLevel: 'low',
    visibilityScope: 'hr_only',
    notificationSent: false,
    version: '3.1.5'
  },
  {
    changeType: 'system_change',
    title: 'Deployment Platform Migration',
    description: 'Migrated from Vercel to Replit deployments as primary hosting platform. Pushed complete codebase to GitHub, replacing old Bolt version',
    affectedModules: ['Deployment', 'Infrastructure'],
    impactLevel: 'high',
    visibilityScope: 'product_owner_only',
    notificationSent: false,
    version: '3.2.0'
  }
];

export async function seedChangeLog() {
  try {
    console.log('Seeding change log with historical entries...');
    
    const existingLogs = await db.select().from(changeLog);
    
    if (existingLogs.length > 0) {
      console.log(`Change log already has ${existingLogs.length} entries. Skipping seed.`);
      return { seeded: false, count: existingLogs.length };
    }

    await db.insert(changeLog).values(historicalChanges);
    
    console.log(`Successfully seeded ${historicalChanges.length} change log entries`);
    return { seeded: true, count: historicalChanges.length };
  } catch (error) {
    console.error('Error seeding change log:', error);
    throw error;
  }
}
