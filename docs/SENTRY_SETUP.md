# Sentry Integration Setup Guide

## Overview

HRStudio360 now includes **production-grade error tracking and performance monitoring** via Sentry! This allows you to:

- **Track errors in real-time** across frontend and backend
- **Monitor performance** (slow API calls, page load times)
- **Session replay** to see what users did before an error occurred
- **User context** to know which users experienced errors
- **Privacy-first** (automatically masks sensitive data)

---

## Step 1: Get Your Sentry DSN

1. Go to **https://sentry.io** and create a free account
2. Create a new project and select **"React"** as the platform  
3. Copy your **DSN** (looks like: `https://abc123...@o12345.ingest.sentry.io/67890`)

---

## Step 2: Add Secrets to Replit

### Method 1: Using Replit Tools UI
1. In the Replit left sidebar, click **"Tools"** or **"All tools"**
2. Find and select **"Secrets"**
3. Click **"New Secret"** and add these two secrets:

   **Secret #1:**
   - **Key:** `SENTRY_DSN`
   - **Value:** (paste your DSN from Step 1)

   **Secret #2:**
   - **Key:** `VITE_SENTRY_DSN`
   - **Value:** (paste the same DSN)

4. Click **"Add Secret"** for each

### Method 2: Using .env file (Local Development)
1. Create a `.env` file in your project root (if it doesn't exist)
2. Add these lines:
   ```
   SENTRY_DSN=https://your-dsn-here@o123456.ingest.sentry.io/987654
   VITE_SENTRY_DSN=https://your-dsn-here@o123456.ingest.sentry.io/987654
   ```
3. Save the file

---

## Step 3: Restart the Application

1. Stop the running workflow (if needed)
2. Start it again or refresh the page
3. You should see in the console:
   ```
   ✅ Sentry initialized for error tracking and performance monitoring
   ✅ Sentry initialized for backend error tracking
   ```

---

## Step 4: Verify It Works

### Test Frontend Error Tracking:
1. Open your browser's developer console
2. Run this command:
   ```javascript
   throw new Error("Test Sentry Error")
   ```
3. Go to your Sentry dashboard and you should see the error appear within seconds!

### Test Backend Error Tracking:
1. Make an API request that doesn't exist: `GET /api/test-error`
2. Check Sentry for the 404 error

---

## What Gets Tracked?

### ✅ Frontend:
- React component errors (via ErrorBoundary)
- API request failures
- Network errors
- Performance metrics (page load, API response times)
- Session replay (10% of sessions, 100% of sessions with errors)

### ✅ Backend:
- Express API errors
- Database query failures
- Unhandled exceptions
- API performance metrics

---

## Privacy Settings

Sentry is configured with **privacy-first defaults**:

- ✅ **Passwords masked** automatically
- ✅ **Cookies excluded** from error reports
- ✅ **Session replay** masks all text by default
- ✅ **Development mode disabled** (errors only sent in production)

---

## Optional: Enable in Development

By default, Sentry is disabled in development mode to avoid noise. To enable:

Add these secrets:
```
SENTRY_DEBUG=true
VITE_SENTRY_DEBUG=true
```

---

## Pricing

- **Free Tier:** 5,000 errors/month, session replay, performance monitoring
- **Paid Plans:** Start at $29/month for higher limits

For HRStudio360, the free tier should be sufficient for most use cases!

---

## Troubleshooting

### "Sentry DSN not configured" message in console

**Solution:** Make sure you added both `SENTRY_DSN` and `VITE_SENTRY_DSN` secrets to Replit.

### Errors not appearing in Sentry

1. Check that you're in **production mode** (or enabled `SENTRY_DEBUG=true`)
2. Verify the DSN is correct (no typos)
3. Check browser console for "✅ Sentry initialized" message

### Want to disable Sentry?

Simply remove the `SENTRY_DSN` and `VITE_SENTRY_DSN` secrets. The app will work fine without them!

---

## Learn More

- **Sentry Documentation:** https://docs.sentry.io/platforms/javascript/guides/react/
- **Sentry Dashboard:** https://sentry.io/organizations/your-org/issues/

---

**Congratulations!** 🎉 You now have production-grade error tracking for HRStudio360!
