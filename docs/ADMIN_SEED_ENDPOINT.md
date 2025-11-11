# Admin Seed Endpoint - Production Database Setup

## 🔒 Security Warning

**This is a one-time setup endpoint.** After seeding your production database, you should:
1. Delete the `ADMIN_SEED_SECRET` environment variable from production
2. Or comment out the endpoint in `server/routes.ts`

This endpoint is protected but should not remain active in production indefinitely.

---

## 📋 Setup Instructions

### Step 1: Set Your Admin Secret

Before deploying, add an environment variable in Replit:

1. Open your Replit project
2. Click on **"Secrets"** in the left sidebar (lock icon)
3. Add a new secret:
   - **Key**: `ADMIN_SEED_SECRET`
   - **Value**: Choose a strong random string (e.g., `prod_seed_2024_xyz789abc`)
4. Click **"Add Secret"**

**Important**: Make this secret strong and unique. It protects your production database.

---

### Step 2: Deploy Your Application

1. Click the **"Publish"** button in Replit
2. Wait for deployment to complete
3. Your app will be live at: `https://your-app.replit.app`

---

### Step 3: Seed Production Database

Once deployed, you can seed the production database by calling the admin endpoint.

#### Option A: Using cURL (Recommended)

```bash
curl -X POST https://your-app.replit.app/api/admin/seed \
  -H "Content-Type: application/json" \
  -d '{"secret": "YOUR_ADMIN_SEED_SECRET"}'
```

#### Option B: Using Browser (Simple Method)

1. Open your browser's developer console (F12)
2. Go to your deployed app URL
3. Run this JavaScript:

```javascript
fetch('/api/admin/seed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secret: 'YOUR_ADMIN_SEED_SECRET' })
})
  .then(r => r.json())
  .then(data => console.log('✅ Seed result:', data))
  .catch(err => console.error('❌ Error:', err));
```

#### Option C: Using Postman or Thunder Client

1. Create a new **POST** request
2. URL: `https://your-app.replit.app/api/admin/seed`
3. Headers: `Content-Type: application/json`
4. Body (JSON):
   ```json
   {
     "secret": "YOUR_ADMIN_SEED_SECRET"
   }
   ```
5. Send the request

---

## ✅ Expected Response

### Success Response

```json
{
  "success": true,
  "alreadySeeded": false,
  "message": "Production database seeded successfully",
  "summary": {
    "profiles": 7,
    "departments": 6,
    "jobTitles": 7,
    "announcements": 2
  }
}
```

### Already Seeded Response

```json
{
  "success": true,
  "alreadySeeded": true,
  "message": "Database already contains demo data"
}
```

### Error Responses

**Invalid Secret:**
```json
{
  "error": "Unauthorized. Invalid admin secret key."
}
```

**Not Configured:**
```json
{
  "error": "Admin seeding not configured. Set ADMIN_SEED_SECRET environment variable."
}
```

---

## 🎯 What Gets Created

When you seed the database, it creates:

### 7 User Profiles
- **Demo User** (`demo@hrstudio360.com`) - Product Owner
- **Robert Sala** (`robertsala@gmail.com`) - CEO
- **Sarah Johnson** - Senior Engineer
- **Michael Chen** - Product Manager
- **Emily Rodriguez** - UX Designer
- **James Wilson** - HR Manager
- **Lisa Anderson** - Marketing Director

### 6 Departments
- Engineering
- Product
- Design
- People (HR)
- Marketing
- Executive

### 7 Job Titles
- CEO
- Senior Engineer
- Product Manager
- Product Owner
- UX Designer
- HR Manager
- Marketing Director

### 2 Announcements
- Welcome to HRStudio360
- Platform Features Overview

---

## 🧪 Testing After Seeding

1. Visit your deployed app: `https://your-app.replit.app`
2. Click **"Try Demo Account"** button
3. You should be automatically logged in as Demo User
4. Verify you see:
   - Populated employee directory
   - Department listings
   - Welcome announcements

---

## 🔐 Post-Seeding Security

**IMPORTANT**: After successfully seeding, remove the admin endpoint access:

### Option 1: Delete the Secret (Recommended)
1. Go to Replit **Secrets**
2. Delete `ADMIN_SEED_SECRET`
3. Redeploy your app

The endpoint will remain in code but will return a 500 error without the secret.

### Option 2: Comment Out the Endpoint
1. Open `server/routes.ts`
2. Comment out the entire `/api/admin/seed` endpoint (lines 1371-1403)
3. Redeploy your app

---

## 🆘 Troubleshooting

### "Unauthorized" Error
- Double-check your secret key matches exactly (no extra spaces)
- Verify the secret is set in production (not just development)

### "Already Seeded" Message
- This is normal if you've already run the seed
- The database prevents duplicate seeding automatically
- If you need to reset, manually delete data from production database

### "Admin seeding not configured"
- The `ADMIN_SEED_SECRET` environment variable is missing
- Add it in Replit Secrets and redeploy

### Seeding Failed
- Check the production logs in Replit for detailed error messages
- Verify your database is accessible
- Ensure `DATABASE_URL` is correctly set in production

---

## 📚 Related Documentation

- Main project docs: `replit.md`
- Production seeding overview: `docs/PRODUCTION_SEEDING.md`
- Database schema: `shared/schema.ts`
- Seed script: `server/seed-production.ts`

---

## 🎉 Success!

Once seeded, your production demo account is ready! Share this with clients:

> "Visit https://your-app.replit.app and click **Try Demo Account** for instant access - no signup required!"

This gives you a competitive advantage over traditional HR platforms that require sales calls and lengthy demos.
