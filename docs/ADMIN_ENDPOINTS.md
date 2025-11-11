# Admin Endpoints Guide

## Quick Start: Reset & Seed Production Database

Follow these steps to populate your production database with fresh demo data:

### Step 1: Deploy Your App

Make sure your latest code is deployed to production:
1. Click **"Deploy"** or **"Publish"** button in Replit
2. Wait for deployment to complete

### Step 2: Clean Old Data (If Any)

Clear any existing demo data from production:

```bash
curl -X POST https://hr-studio-360-robertsala.replit.app/api/admin/cleanup \
  -H "Content-Type: application/json" \
  -d '{"secret": "YOUR_ADMIN_SEED_SECRET"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "All demo data has been deleted successfully",
  "tablesCleared": [...]
}
```

### Step 3: Seed Fresh Data

Create comprehensive demo data:

```bash
curl -X POST https://hr-studio-360-robertsala.replit.app/api/admin/seed \
  -H "Content-Type: application/json" \
  -d '{"secret": "YOUR_ADMIN_SEED_SECRET"}'
```

**Expected Response:**
```json
{
  "success": true,
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

### Step 4: Test Production

1. Visit: https://hr-studio-360-robertsala.replit.app/
2. Login with: `robertsala@gmail.com`
3. Explore the demo data!

### Step 5: Remove Admin Secret (Security)

After seeding, delete the `ADMIN_SEED_SECRET` from App Secrets:
1. Go to **Secrets** (lock icon)
2. Delete `ADMIN_SEED_SECRET`
3. This prevents unauthorized access

---

## One-Command Reset & Reseed

You can chain both commands together:

```bash
# Cleanup first
curl -X POST https://hr-studio-360-robertsala.replit.app/api/admin/cleanup \
  -H "Content-Type: application/json" \
  -d '{"secret": "YOUR_SECRET"}' && \
# Then seed
curl -X POST https://hr-studio-360-robertsala.replit.app/api/admin/seed \
  -H "Content-Type: application/json" \
  -d '{"secret": "YOUR_SECRET"}'
```

---

## Available Admin Endpoints

### POST `/api/admin/cleanup`

**Purpose:** Deletes all demo data from the database

**Security:** Requires `ADMIN_SEED_SECRET` in request body

**Request:**
```json
{
  "secret": "YOUR_ADMIN_SEED_SECRET"
}
```

**Response:**
```json
{
  "success": true,
  "message": "All demo data has been deleted successfully",
  "tablesCleared": ["review_responses", "performance_reviews", ...]
}
```

**What it deletes:**
- All performance review data
- All leave requests and balances
- All candidates and new hires
- All employee records
- All departments and job titles
- All user profiles
- All announcements

### POST `/api/admin/seed`

**Purpose:** Creates comprehensive demo data for HRStudio360

**Security:** Requires `ADMIN_SEED_SECRET` in request body

**Request:**
```json
{
  "secret": "YOUR_ADMIN_SEED_SECRET"
}
```

**Response:**
```json
{
  "success": true,
  "alreadySeeded": false,
  "message": "Production database seeded successfully with comprehensive demo data",
  "summary": {...}
}
```

**What it creates:**
- 7 user profiles + employee records
- 6 departments + 7 job titles
- 7 leave balances + 2 leave requests
- 3 candidates + 1 new hire
- 1 review cycle + 2 performance reviews
- 5 review questions + 10 responses
- 2 announcements

---

## Security Notes

⚠️ **Important Security Practices:**

1. **Always use HTTPS** - Never send secrets over HTTP
2. **Remove secret after seeding** - Delete `ADMIN_SEED_SECRET` from production
3. **Don't commit secrets** - Never put the secret in your code or git
4. **Use strong secrets** - Generate random, complex strings

**Generate a strong secret:**
```bash
openssl rand -base64 32
```

---

## Troubleshooting

### "Unauthorized. Invalid admin secret key"
- Your `ADMIN_SEED_SECRET` is incorrect or not set
- Check App Secrets in Replit

### "Admin cleanup not configured"
- `ADMIN_SEED_SECRET` environment variable is missing
- Add it in Replit > Secrets

### "Cleanup failed"
- Check the error details in the response
- Verify database connection is working

### "Database already contains demo data"
- Run cleanup endpoint first
- Or ignore - it means data is already seeded

---

## Development Testing

You can test these endpoints locally:

```bash
# Test cleanup in development
curl -X POST http://localhost:5000/api/admin/cleanup \
  -H "Content-Type: application/json" \
  -d '{"secret": "YOUR_SECRET"}'

# Test seed in development  
curl -X POST http://localhost:5000/api/admin/seed \
  -H "Content-Type: application/json" \
  -d '{"secret": "YOUR_SECRET"}'
```

---

## Need Help?

If you encounter issues:
1. Check workflow logs for detailed error messages
2. Verify all environment variables are set
3. Ensure database connection is working
4. Check that deployment completed successfully
