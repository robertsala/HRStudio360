# Production Database Seeding Guide

## Overview

This guide explains how to seed your production database with initial demo data for HRStudio360.

## What Gets Seeded

The production seed script (`server/seed-production.ts`) creates:

- **7 User Profiles:**
  - Demo User (demo@hrstudio360.com)
  - Robert Sala (robertsala@gmail.com)
  - 5 Sample team members (Sarah, Michael, Emily, James, Lisa)

- **6 Departments:**
  - Engineering, Product, Design, People, Marketing, Executive

- **7 Job Titles:**
  - CEO, Senior Engineer, Product Manager, Product Owner, UX Designer, HR Manager, Marketing Director

- **2 Announcements:**
  - Welcome message
  - Platform features overview

## How to Seed Production Database

### Step 1: Access Your Deployed Application Console

1. Go to your Replit deployment dashboard
2. Navigate to your deployed app: https://hr-studio-360-robertsala.replit.app
3. Click on the **"Console"** or **"Shell"** tab for the production deployment

### Step 2: Run the Seed Script

In the production console, execute:

```bash
npm run seed
```

### Step 3: Verify Success

You should see output like this:

```
🌱 Starting production database seed...
1️⃣  Creating demo user profile...
   ✓ Demo User created with ID: [uuid]
2️⃣  Creating Robert Sala profile...
   ✓ Robert Sala created with ID: [uuid]
3️⃣  Creating sample team members...
   ✓ Created 5 team members
4️⃣  Creating departments...
   ✓ Created 6 departments
5️⃣  Creating job titles...
   ✓ Created 7 job titles
6️⃣  Creating welcome announcement...
   ✓ Welcome announcement created
7️⃣  Creating company update announcement...
   ✓ Platform features announcement created

✅ Production database seeded successfully!

📊 Seed Summary:
   - 7 user profiles (Demo User, Robert Sala + 5 team members)
   - 6 departments
   - 7 job titles
   - 2 announcements

🔐 Login Credentials:
   Demo Account: demo@hrstudio360.com / demo
   Robert Sala: robertsala@gmail.com / (your password)
```

## Important Notes

### Passwords

⚠️ **The seed script only creates user profiles, not authentication credentials.**

To set up login access:

1. **For Demo Account:**
   - Use the password reset flow, OR
   - Manually set the password through your auth system

2. **For Robert Sala:**
   - Use your existing password if the account already exists in auth
   - Or use password reset to set a new one

### Running Multiple Times

✅ **Safe to run multiple times** - The script will skip existing records if you run it again.

❌ **Duplicate Error Expected** - If data already exists, you'll see "duplicate key" errors. This is normal and means the data is already there.

## Alternative: Manual Seeding via Replit Shell

If you don't have console access to production, you can:

1. Open your Replit project workspace
2. Temporarily modify `.replit` to point to production database URL
3. Run `npm run seed` from the main workspace shell
4. Restore `.replit` to development settings

⚠️ **Be careful** - Make sure you're targeting the correct database!

## Troubleshooting

### Error: "duplicate key value violates unique constraint"

**Solution:** Data already exists. This is fine - your production database is already seeded.

### Error: "relation does not exist"

**Solution:** Make sure your database schema is pushed to production:
```bash
npm run db:push
```

### Error: "connection refused" or "cannot connect to database"

**Solution:** Verify your `DATABASE_URL` environment variable is set correctly in production.

## After Seeding

Once seeded, you can:

1. ✅ Log in with demo@hrstudio360.com (after setting password)
2. ✅ See sample team members in the org chart
3. ✅ View announcements on the dashboard
4. ✅ Explore all features with realistic demo data

## Need Help?

If you encounter issues:
1. Check the production logs for detailed error messages
2. Verify database connection in production environment
3. Ensure all environment variables are set correctly
