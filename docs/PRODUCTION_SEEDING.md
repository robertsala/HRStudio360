# Production Database Seeding Guide

## Overview

The production seed script creates a complete, realistic demo environment showcasing all HRStudio360 capabilities. This is designed for client presentations and demos, providing a fully-populated platform that looks like an active, established HR system.

## What Gets Created

### 📊 Complete Demo Data Summary

**Organizational Structure** (14 records)
- 7 user profiles (Demo User, Robert Sala, + 5 team members)
- 6 departments (Engineering, Product, Design, People, Marketing, Executive)
- 7 job titles with department assignments

**Employee Management** (16 records)
- 7 employee records with full employment details
- 7 leave balance records (20 vacation, 10 sick, 5 personal days each)
- 2 sample leave requests:
  - Sarah Johnson: 5-day Hawaii vacation (Pending approval)
  - Demo User: 1 personal day (Approved)

**Recruitment Pipeline** (4 records)
- 3 active candidates at different stages:
  - Alex Thompson - Senior Software Engineer (Interview stage)
  - Jessica Martinez - Product Designer (Phone Screen stage)
  - David Kim - Marketing Manager (Offer Sent)
- 1 new hire ready for onboarding:
  - Jordan Williams - Junior Developer (starts in 7 days)

**Performance Management** (20+ records)
- 1 active review cycle (2025 Annual Performance Review)
- 2 performance reviews:
  - Sarah Johnson: Completed review with 4.6 final rating
  - Michael Chen: In-progress review awaiting manager assessment
- 5 standardized review questions
- 10 review responses (5 self-assessments + 5 manager assessments)
- Detailed goals, achievements, and development plans

**Communications** (2 records)
- Welcome announcement
- Platform features overview

### 👥 User Profiles

All profiles are fully configured with realistic data:

| Name | Email | Role | Department | Employee ID |
|------|-------|------|------------|-------------|
| Robert Sala | robertsala@gmail.com | CEO | Executive | EMP001 |
| Demo User | demo@hrstudio360.com | Product Owner | Product | EMP002 |
| Sarah Johnson | sarah.johnson@hrstudio360.com | Senior Engineer | Engineering | EMP003 |
| Michael Chen | michael.chen@hrstudio360.com | Product Manager | Product | EMP004 |
| Emily Rodriguez | emily.rodriguez@hrstudio360.com | UX Designer | Design | EMP005 |
| James Wilson | james.wilson@hrstudio360.com | HR Manager | People | EMP006 |
| Lisa Anderson | lisa.anderson@hrstudio360.com | Marketing Director | Marketing | EMP007 |

## How to Seed Production

### Prerequisites

1. You need the `ADMIN_SEED_SECRET` environment variable set in production
2. Access to production database (via Database pane or API endpoint)

### Step 1: Clear Existing Demo Data (If Any)

If you've already seeded production before, you need to clear old data first:

**Option A: Using Database Pane**
1. Open **Database** pane in Replit
2. Switch to **Production** database
3. Delete records from these tables (in order):
   - `review_responses`
   - `review_goals_comments`
   - `performance_reviews`
   - `review_question_assignments`
   - `review_questions_library`
   - `review_question_templates`
   - `review_cycles`
   - `leave_requests`
   - `leave_balances`
   - `new_hires`
   - `candidates`
   - `employees`
   - `announcements`
   - `job_titles`
   - `departments`
   - `profiles`

**Option B: SQL Query** (faster)
```sql
-- Run this in Database pane > Production > Query
DELETE FROM review_responses;
DELETE FROM review_goals_comments;
DELETE FROM performance_reviews;
DELETE FROM review_question_assignments;
DELETE FROM review_questions_library;
DELETE FROM review_question_templates;
DELETE FROM review_cycles;
DELETE FROM leave_requests;
DELETE FROM leave_balances;
DELETE FROM new_hires;
DELETE FROM candidates;
DELETE FROM employees;
DELETE FROM announcements;
DELETE FROM job_titles;
DELETE FROM departments;
DELETE FROM profiles;
```

### Step 2: Run the Seed Script

**Using the Admin API Endpoint:**

```bash
curl -X POST https://hr-studio-360-robertsala.replit.app/api/admin/seed \
  -H "Content-Type: application/json" \
  -d '{"secret": "YOUR_ADMIN_SEED_SECRET"}'
```

Replace `YOUR_ADMIN_SEED_SECRET` with the actual secret from your App Secrets.

**Expected Response:**
```json
{
  "success": true,
  "alreadySeeded": false,
  "message": "Production database seeded successfully with comprehensive demo data",
  "summary": {
    "profiles": 7,
    "departments": 6,
    "jobTitles": 7,
    "employees": 7,
    "leaveBalances": 7,
    "candidates": 3,
    "newHires": 1,
    "leaveRequests": 2,
    "reviewCycles": 1,
    "performanceReviews": 2,
    "reviewQuestions": 5,
    "reviewResponses": 10,
    "announcements": 2
  }
}
```

### Step 3: Test the Seeded Data

1. Visit: https://hr-studio-360-robertsala.replit.app
2. Click "Try Demo Account" or enter: `robertsala@gmail.com`
3. You should see "Robert Sala" instead of "Demo User"
4. Explore the platform:
   - **Dashboard**: See employee count, leave balances, announcements
   - **Employees**: View 7 team members with full profiles
   - **Recruitment**: Browse 3 active candidates + 1 new hire
   - **Time Off**: Check leave requests and balances
   - **Performance**: View review cycles and completed reviews

### Step 4: Security - Remove Admin Secret

After seeding, remove the `ADMIN_SEED_SECRET` from App Secrets for security:

1. Go to **Secrets** (lock icon) in Replit
2. Delete the `ADMIN_SEED_SECRET` variable
3. This prevents unauthorized re-seeding of your production database

## What Clients See in Demo

When you present HRStudio360 to potential clients, they'll see:

✅ **Active Organization** - 7 employees across 6 departments, not an empty system  
✅ **Hiring Pipeline** - Real candidates with ratings, skills, and interview stages  
✅ **Performance Management** - Completed reviews with detailed feedback and goals  
✅ **Time-Off System** - Leave balances and approval workflows in action  
✅ **Onboarding Ready** - New hire starting next week with assigned manager  
✅ **Professional Data** - Realistic names, roles, and company structure  

This makes HRStudio360 look like an established, production-ready platform — not a prototype.

## Troubleshooting

### "Database already contains demo data"

This means seeding was already run. Clear the database first (see Step 1) or the script will refuse to run to prevent duplicate data.

### "Invalid or missing secret"

Your `ADMIN_SEED_SECRET` environment variable is not set or incorrect. Check App Secrets.

### Foreign Key Errors

You need to delete data in the correct order (dependencies first). Use the SQL query in Step 1 Option B.

### Login Shows "Demo User" Instead of "Robert Sala"

The old auto-created profile is still in the database. Clear all profiles and reseed.

## Competitive Advantage

Most HR platforms show demos with:
- Empty databases
- Generic "John Doe" placeholder data
- Sales-led demos requiring scheduling

HRStudio360 offers:
- **One-click instant access** - No scheduling, no sales calls
- **Fully populated system** - Looks like a real company
- **Complete workflows** - Recruitment, reviews, time-off all functional
- **Professional presentation** - Makes HRStudio360 appear enterprise-ready

This seed script is your secret weapon for closing deals faster than competitors like BambooHR, ADP, and Paylocity.

## Script Location

The seed script is located at: `server/seed-production.ts`

It's called via the admin endpoint: `POST /api/admin/seed` (defined in `server/routes.ts`)
