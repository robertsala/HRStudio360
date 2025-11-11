# 🚀 HRStudio360 - Vercel Deployment Guide

## Quick Start (5 Minutes)

### Step 1: Prepare Your GitHub Repository ✅
Your repository is ready to deploy! The correct Supabase credentials are already configured.

### Step 2: Deploy to Vercel

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Sign in with your GitHub account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select **robertsala/HRStudio360** from your repositories
   - If you don't see it, click "Adjust GitHub App Permissions" and grant access

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   Click "Environment Variables" and add these **TWO** variables:

   **Important**: Get these values from your [Supabase Dashboard → Project Settings → API](https://supabase.com/dashboard/project/cgqoazepziswoziybhiz/settings/api)

   ```
   Variable Name: VITE_SUPABASE_URL
   Value: [Your Project URL from Supabase Dashboard]
   ```

   ```
   Variable Name: VITE_SUPABASE_ANON_KEY
   Value: [Your anon/public key from Supabase Dashboard]
   ```
   
   **Security Note**: Never commit these values to your Git repository. Always use environment variables or secrets management.

5. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes for the build to complete
   - Your app will be live! 🎉

---

## 🔧 What Was Fixed

### ✅ Project Name
- Changed from `vite-react-typescript-starter` to `HRStudio360`

### ✅ Supabase Configuration
- **Removed** wrong credentials from deleted project (`auuqmldhxjhnmqhgeeav`)
- **Confirmed** correct credentials for active project (`cgqoazepziswoziybhiz`)
- **Cleaned** corrupted file that had duplicate credentials

### ✅ File Structure
- `src/utils/supabaseClient.ts` - Now has only correct credentials
- `.env.example` - Template with instructions
- `package.json` - Updated project name

---

## 📋 Your Supabase Project Details

| Property | Value |
|----------|-------|
| **Project ID** | `cgqoazepziswoziybhiz` |
| **Project URL** | https://cgqoazepziswoziybhiz.supabase.co |
| **Dashboard** | https://supabase.com/dashboard/project/cgqoazepziswoziybhiz |
| **API Settings** | https://supabase.com/dashboard/project/cgqoazepziswoziybhiz/settings/api |

---

## 🎯 After Deployment

### Your App URL
After deployment, Vercel will provide a URL like:
- `https://hrstudio360.vercel.app`
- `https://hrstudio360-[username].vercel.app`
- Or a custom domain if you configure one

### Test User Creation
1. Go to your deployed app
2. Click "Sign Up"
3. Create a new account
4. **This should now work!** ✨

If you see any errors:
- Check Vercel deployment logs
- Verify environment variables are set correctly
- Check Supabase dashboard for database errors

---

## 🔐 Important Notes

### Environment Variables in Vercel
- Environment variables are **encrypted** and **secure**
- The ANON key is **safe to use in frontend** code
- Supabase RLS (Row Level Security) protects your data
- **Never** use the SERVICE ROLE key in frontend/Vercel

### Automatic Deployments
- Every push to `main` branch will trigger a new deployment
- You can disable this in Vercel project settings if needed
- Use branches for testing before merging to main

### Domain Configuration
- Vercel provides a free `.vercel.app` domain
- You can add a custom domain in Project Settings
- SSL/HTTPS is automatic and free

---

## 🆘 Troubleshooting

### Build Fails
**Error**: "Module not found" or similar
- **Solution**: Check that all dependencies are in `package.json`
- Try: `npm install` locally to verify

### App Loads But Shows Errors
**Error**: "Invalid API credentials"
- **Solution**: Double-check environment variables in Vercel
- Make sure you used the ANON key, not SERVICE ROLE key

### Database Errors
**Error**: "Database error saving new user"
- **Solution**: Run all migrations in `supabase/migrations/`
- Go to Supabase SQL Editor and execute them in order

### Can't See Recent Changes
**Solution**: 
1. Go to Vercel dashboard
2. Click "Redeploy" 
3. Check "Use existing Build Cache" is **unchecked**

---

## 🎓 Next Steps

After successful deployment:

1. **Test Core Features**
   - User registration/login
   - Employee directory
   - Payroll features
   - Chat system

2. **Configure Production Settings**
   - Set up email templates in Supabase
   - Configure authentication providers if needed
   - Review RLS policies for security

3. **Monitor Performance**
   - Check Vercel analytics
   - Monitor Supabase usage
   - Set up error tracking (Sentry, LogRocket, etc.)

4. **Share With Team**
   - Send them the Vercel URL
   - Set up user roles/permissions
   - Provide training/documentation

---

## 📚 Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **HRStudio360 Repository**: https://github.com/robertsala/HRStudio360

---

## ✅ Deployment Checklist

- [ ] GitHub repository is up to date
- [ ] Merged PR with correct credentials
- [ ] Signed into Vercel with GitHub
- [ ] Imported HRStudio360 project
- [ ] Added VITE_SUPABASE_URL environment variable
- [ ] Added VITE_SUPABASE_ANON_KEY environment variable
- [ ] Clicked Deploy
- [ ] Tested user registration on deployed app
- [ ] Shared URL with team

---

**Ready to deploy? Let's go! 🚀**

If you encounter any issues, refer to the troubleshooting section above or check the `.env.example` file for additional guidance.
