# Quick Start: Testing Crisalida's Hiring Journey

This is a condensed guide to quickly test the complete hiring workflow with Crisalida Gutierrez.

## In 5 Minutes: Add Candidate → Hire → Onboard → Email

### Step 1: Add Candidate (1 minute)

1. Open **Hiring** modal from dashboard
2. Click **"Add candidate"** button (orange, top-right)
3. Fill in the form:
   - **Name:** Crisalida Gutierrez
   - **Email:** crissgood@gmail.com
   - **Position:** Regional Store Manager
   - **Department:** Sales
   - **Location:** Nashua, NH
   - **Salary:** 120000
   - **Skills:** Training, coaching, mentorship, inventory, logistics, annual performance reviews
4. Click **"Add Candidate"**
5. ✅ Verify she appears in "New Candidate" column

### Step 2: Move Through Pipeline (2 minutes)

**Quick path:** Drag cards through stages

1. **New Candidate** → **Phone Screen** (drag card)
2. **Phone Screen** → **Interview** (drag card)
3. Click on card in **Interview** → **"Create Offer"**
   - Fill offer details (use defaults)
   - Save offer
4. **Interview** → **Offer Sent** (drag card or auto-moves)
5. **Offer Sent** → **Offer Accepted** (drag card)

### Step 3: Convert to New Hire (1 minute)

1. Click on Crisalida's card in **"Offer Accepted"** column
2. Click **"Convert to New Hire"** (teal gradient button)
3. Verify pre-filled info:
   - Name: Crisalida Gutierrez
   - Email: crissgood@gmail.com
   - Position: Regional Store Manager
   - Salary: 120000
4. Add start date (~2 weeks ahead)
5. Click **"Convert to New Hire"**
6. ✅ Watch confetti animation!
7. ✅ See success message with email confirmation

### Step 4: Check Email (1 minute)

**Without Resend API key:**
- Open browser console (F12)
- Look for: "Email prepared for crissgood@gmail.com"
- See full email preview in logs

**With Resend API key:**
- Check Gmail inbox at crissgood@gmail.com
- Look for email from "HR Studio"
- Subject: "Welcome to the Team, Crisalida! 🎉"

### Step 5: Verify Onboarding (30 seconds)

1. Open **Onboarding** modal from dashboard
2. Find Crisalida in new hires list
3. ✅ Verify onboarding tasks are generated
4. ✅ Check task categories (New Hire, Manager, HR, IT)

---

## What You Just Tested

✅ **Candidate Management**
- Add new candidate with validation
- Database persistence
- Auto-generated profile and AI score

✅ **Hiring Pipeline**
- Drag-and-drop stage movement
- Status tracking
- Offer creation and management

✅ **Employee Conversion**
- Candidate → New hire transformation
- Database record creation
- Status updates

✅ **Email Notifications**
- Professional HTML email generation
- Personalized content
- Real email delivery (with API key)

✅ **Onboarding System**
- Automatic task generation
- Role-based assignments
- Task categorization

---

## Expected Results at Each Step

### After Adding Candidate
```
✅ Candidate card appears with:
   - Name: Crisalida Gutierrez
   - Salary: 120k USD
   - AI Score: 70-100%
   - Status: New Candidate
```

### After Moving Through Stages
```
✅ Card position updates in real-time
✅ Status changes reflected immediately
✅ "Create Offer" button appears in Interview stage
✅ Candidate reaches "Offer Accepted"
```

### After Converting to New Hire
```
✅ Confetti animation displays
✅ Success notification appears
✅ Candidate status → "Hired"
✅ Card moves to "Hired" column
✅ Console shows email confirmation
```

### Email Content (Check inbox or console)
```
✅ Subject: "Welcome to the Team, Crisalida! 🎉"
✅ Personalized greeting
✅ Job details box with:
   - Start date
   - Position: Regional Store Manager
   - Department: Sales
✅ Next steps checklist
✅ Professional formatting
```

### Onboarding Record
```
✅ New hire appears in list
✅ Start date displayed
✅ Generated tasks include:
   - New Hire: Complete paperwork, training
   - Manager: Schedule meetings, workspace prep
   - HR: Process paperwork, orientation
   - IT: Setup accounts, equipment
```

---

## Troubleshooting Quick Fixes

**Candidate not appearing?**
→ Refresh page, check console for errors

**Can't move through stages?**
→ Click card first, then use "Move to Next Stage" button

**Email not sending?**
→ Normal! Check console for preview. Add Resend API key for real emails.

**Convert button not showing?**
→ Ensure candidate is in "Offer Accepted" stage

**Tasks not generated?**
→ Verify conversion completed successfully, check new_hires table

---

## Console Commands to Verify

Open browser console (F12) and check for:

```javascript
// After adding candidate
"Candidate created successfully"

// After sending email
"Email prepared for crissgood@gmail.com"
// OR (with API key)
"Onboarding email sent successfully"

// If errors occur
// Look for red error messages with details
```

---

## Database Verification (Optional)

Check Supabase dashboard:

1. **candidates table:**
   - Find Crisalida by email
   - Status should be "Hired"

2. **new_hires table:**
   - New record with Crisalida's info
   - Status: "pending" or "in_progress"

3. **onboarding_tasks table:**
   - Multiple tasks linked to Crisalida's new_hire_id
   - Different assignee_types (new_hire, manager, hr, it)

---

## What to Test Next

After completing the basic workflow:

**Advanced Features:**
- [ ] Add comments to candidates
- [ ] Rate candidates (1-5 stars)
- [ ] Like/unlike candidates
- [ ] Search and filter candidates
- [ ] Disqualify and restore candidates
- [ ] Create custom offers
- [ ] Complete onboarding tasks
- [ ] Test worker classification

**Email Features:**
- [ ] Set up Resend API key
- [ ] Send real emails
- [ ] Verify Gmail delivery
- [ ] Test email on mobile
- [ ] Check spam folder handling

---

## Success Checklist

Complete workflow is successful when:

- [x] Crisalida added to database
- [x] Appears in New Candidate column
- [x] Moves through all pipeline stages
- [x] Offer created and accepted
- [x] Converted to new hire
- [x] Email sent or logged
- [x] Onboarding tasks generated
- [x] No console errors
- [x] Notifications display correctly
- [x] Confetti animation plays

---

## Ready for Production

Once tested successfully:

1. **Configure Resend API** (see RESEND_EMAIL_SETUP.md)
2. **Customize email template** (add branding)
3. **Set up custom domain** (professional emails)
4. **Configure email tracking** (monitor delivery)
5. **Test with multiple candidates** (scale testing)

---

## Support Files

- `HIRING_WORKFLOW_TEST_GUIDE.md` - Detailed step-by-step guide
- `RESEND_EMAIL_SETUP.md` - Email configuration guide
- Browser console - Real-time debugging
- Supabase dashboard - Database verification

---

## Quick Tips

💡 **Tip 1:** Use drag-and-drop for fastest stage movement
💡 **Tip 2:** Console logs show all email details without API key
💡 **Tip 3:** Refresh page if candidate doesn't appear immediately
💡 **Tip 4:** Check spam folder for Resend emails
💡 **Tip 5:** Confetti = Success! Everything worked.

---

You're ready to test! Start with Step 1 and follow through to Step 5. The whole process takes about 5 minutes. 🚀
