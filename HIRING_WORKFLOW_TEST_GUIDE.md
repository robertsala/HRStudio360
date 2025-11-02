# Complete Hiring to Onboarding Workflow - Testing Guide

This guide will walk you through testing the complete hiring workflow from adding a candidate through to onboarding with real email notifications.

## Prerequisites

- Access to the HR Studio application
- Gmail account for testing email delivery (crissgood@gmail.com)
- User account with HR or Product Owner role permissions

## Test Workflow Overview

1. Add new candidate (Crisalida Gutierrez)
2. Move candidate through hiring pipeline stages
3. Create and send offer letter
4. Convert candidate to new hire
5. Verify onboarding email delivery
6. Complete onboarding checklist

---

## Step 1: Add New Candidate

### Action Steps

1. **Open Hiring Modal**
   - Navigate to the Dashboard
   - Click on the "Hiring" or "Recruitment" card

2. **Click "Add candidate" button**
   - Located in the top-right area of the hiring pipeline view
   - Orange button with plus icon

3. **Fill in Candidate Information**

   Use the following information for Crisalida Gutierrez:

   ```
   Full Name: Crisalida Gutierrez
   Email: crissgood@gmail.com
   Position: Regional Store Manager
   Department: Sales
   Location: Nashua, NH
   Salary Expectation: 120000
   Phone: (optional)
   Skills: Training, coaching, mentorship, inventory, logistics, annual performance reviews
   ```

4. **Submit the Form**
   - Click "Add Candidate" button
   - Wait for success notification
   - Verify candidate appears in the "New Candidate" column

### Expected Results

✅ Success notification appears: "Crisalida Gutierrez added successfully!"
✅ Candidate card appears in the "New Candidate" column with:
   - Profile picture (randomly assigned)
   - Name: Crisalida Gutierrez
   - Salary: 120k USD
   - AI Match Score: 70-100%
   - Applied date: Today's date

### Troubleshooting

- **Candidate not appearing:** Check browser console for errors
- **Email already exists:** Use a different email or delete existing candidate first
- **Required fields error:** Ensure Name, Email, Position, and Department are filled

---

## Step 2: Move Candidate Through Pipeline

### Stage 1: New Candidate → Phone Screen

1. **Click on Crisalida's candidate card** in the New Candidate column
2. **Review candidate details** in the modal
3. **Close modal** (or click "Move to Next Stage" button)
4. **Drag and drop** Crisalida's card to the "Phone Screen" column
   - OR click "Move to Next Stage" in the candidate details modal

### Stage 2: Phone Screen → Interview

1. Wait for status to update (instant)
2. **Drag Crisalida's card** to the "Interview" column
3. Verify status updates

### Stage 3: Interview → Create Offer

1. **Click on Crisalida's card** in Interview column
2. **Click "Create Offer" button** (green button)
3. **Fill out Offer Management form:**
   ```
   Position: Regional Store Manager
   Department: Sales
   Base Salary: 120000
   Start Date: [2 weeks from today]
   Employment Type: Full-time
   Benefits: Standard package
   ```
4. **Save and send offer**

### Stage 4: Offer Sent → Offer Accepted

1. **Drag Crisalida's card** to "Offer Sent" column (or it moves automatically)
2. **Simulate offer acceptance:**
   - Drag card to "Offer Accepted" column
   - OR click on card and use "Move to Next Stage"

### Expected Results

✅ Candidate moves smoothly through each stage
✅ Status updates are reflected in the card
✅ "Create Offer" button appears in Interview stage
✅ Candidate reaches "Offer Accepted" stage

---

## Step 3: Convert to New Hire

### Action Steps

1. **Click on Crisalida's card** in the "Offer Accepted" column

2. **Click "Convert to New Hire" button**
   - Teal/cyan gradient button
   - Located at the bottom of candidate details modal

3. **Review Pre-filled Information**
   - First Name: Crisalida
   - Last Name: Gutierrez
   - Email: crissgood@gmail.com
   - Position: Regional Store Manager
   - Department: Sales

4. **Complete Required Fields:**
   ```
   Phone: [Fill in if desired]
   Start Date: [Verify date - should be ~2 weeks ahead]
   Salary: 120000
   Employment Type: Full-time
   Manager: [Optional - can be left empty for testing]
   ```

5. **Click "Convert to New Hire" button**

### Expected Results

✅ Confetti animation appears
✅ Success notification: "Crisalida Gutierrez successfully hired! Onboarding email sent to crissgood@gmail.com."
✅ Candidate status updates to "Hired"
✅ Candidate card moves to "Hired" column
✅ Modal closes automatically after 3 seconds

### Database Verification

The system automatically:
- Creates new_hires record
- Updates candidate status to 'Hired'
- Generates role-based onboarding tasks
- Assigns tasks to new hire, manager, HR, IT, and other departments
- Sends onboarding email

---

## Step 4: Verify Email Delivery

### Action Steps

1. **Check Gmail Inbox** at crissgood@gmail.com

2. **Look for email from:** HR Studio <onboarding@resend.dev>

3. **Verify email subject:** "Welcome to the Team, Crisalida! 🎉"

### Email Content Verification

The email should contain:

**Header Section:**
- Blue-to-green gradient header
- "Welcome to the Team! 🎉" title

**Main Content:**
- Personalized greeting: "Hi Crisalida,"
- Congratulatory message
- Job details in a highlighted box:
  - Start Date: [Your specified date]
  - Position: Regional Store Manager
  - Department: Sales
  - Manager: [If specified]

**What's Next Section:**
- Bullet points listing:
  - Required paperwork and documentation
  - Equipment setup and IT access
  - Personalized onboarding checklist
  - Introduction to team members
  - Training schedule and resources

**Footer:**
- HR Team signature
- Automated message disclaimer
- Copyright notice

### Expected Results

✅ Email received within 1-2 minutes
✅ Email is properly formatted (HTML version)
✅ All personalized details are correct
✅ Links and images display correctly (if any)

### Troubleshooting Email Delivery

**If email not received:**

1. **Check Spam/Junk folder**
   - Resend emails often end up in spam initially
   - Mark as "Not Spam" if found

2. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for email sending logs
   - Check for any error messages

3. **Verify Edge Function**
   - Email function logs success even without Resend API key
   - Check console for: "Email prepared for crissgood@gmail.com"

4. **Resend API Configuration**
   - Note: Without a Resend API key, emails won't actually send
   - The system will log email details to console instead
   - To send real emails, configure RESEND_API_KEY in Supabase Edge Function secrets

---

## Step 5: Verify Onboarding System

### Action Steps

1. **Navigate to Onboarding Modal**
   - From Dashboard, click "Onboarding" or "New Hire Onboarding"
   - OR click "Onboarding" button in candidate details after hiring

2. **Locate Crisalida in New Hires List**
   - Should appear in the list of active onboarding employees
   - Status: "in_progress" or "pending"

3. **Review Onboarding Tasks**
   - Click on Crisalida's onboarding record
   - View generated tasks organized by:
     - New Hire Tasks (for Crisalida to complete)
     - Manager Tasks
     - HR Tasks
     - IT Tasks
     - Other Department Tasks

### Expected Onboarding Tasks

**New Hire Tasks (for Crisalida):**
- Review and sign offer letter
- Complete I-9 form
- Set up direct deposit
- Complete W-4 tax form
- Review employee handbook
- Complete benefits enrollment
- Complete training modules

**Manager Tasks:**
- Schedule first day meeting
- Prepare workspace
- Introduce to team
- Set 30/60/90 day goals

**HR Tasks:**
- Process new hire paperwork
- Create employee file
- Schedule orientation
- Add to payroll system

**IT Tasks:**
- Create user accounts
- Set up email
- Provide equipment
- Grant system access

### Expected Results

✅ Crisalida appears in new hires list
✅ Start date is correct
✅ Role-specific tasks are generated
✅ Tasks are properly categorized by assignee type
✅ Tasks have appropriate due dates (based on start date)
✅ Tasks can be marked as complete

---

## Step 6: Complete Testing Checklist

### Overall System Verification

- [ ] Candidate successfully added to database
- [ ] Candidate appears in New Candidate column
- [ ] Candidate can be moved through all pipeline stages
- [ ] Offer management modal works correctly
- [ ] Convert to New Hire function works
- [ ] Onboarding email is sent (or logged if no API key)
- [ ] New hire record created in database
- [ ] Onboarding tasks generated automatically
- [ ] Tasks properly assigned to different roles
- [ ] Confetti animation displays on success
- [ ] All notifications display correctly
- [ ] No console errors during process

### Email Verification Checklist

- [ ] Email received at crissgood@gmail.com
- [ ] Email subject is correct
- [ ] Email HTML formatting displays properly
- [ ] Personalization is accurate (name, position, dates)
- [ ] All sections present (header, details, next steps, footer)
- [ ] Email is mobile-responsive

---

## Common Issues and Solutions

### Issue: Candidate not saving

**Solution:**
- Verify all required fields are filled (Name, Email, Position, Department)
- Check browser console for specific error messages
- Ensure user has HR or Product Owner role permissions

### Issue: Cannot move candidate to next stage

**Solution:**
- Try clicking candidate card and using "Move to Next Stage" button
- Check if candidate is in correct current stage
- Refresh page and try again

### Issue: Email not received

**Solutions:**
1. Check spam/junk folder
2. Verify email address is correct
3. Check browser console for email sending confirmation
4. Note: Without Resend API key, emails are logged but not sent
5. To send real emails, configure RESEND_API_KEY in Supabase

### Issue: Convert to New Hire fails

**Solution:**
- Ensure candidate has "Offer Accepted" status
- Verify all required fields in conversion form
- Check if email already exists in new_hires table
- Review browser console for specific error

### Issue: Onboarding tasks not generated

**Solution:**
- Verify onboarding template exists for the role
- Check database for new_hires record
- Ensure convert_candidate_to_new_hire function completed
- Review Supabase logs for errors

---

## Testing Notes

### Without Resend API Key

The system will:
- ✅ Complete all candidate management functions
- ✅ Convert candidates to new hires
- ✅ Generate onboarding tasks
- ✅ Log email details to console
- ❌ NOT send actual emails

**Console Output Example:**
```
Email would be sent to: crissgood@gmail.com
Subject: Welcome to the Team, Crisalida! 🎉
Content: [Full email text]
```

### With Resend API Key Configured

The system will:
- ✅ Send real emails to specified addresses
- ✅ Use professional email template
- ✅ Track email delivery status
- ✅ Handle email delivery errors gracefully

**To Configure Resend:**
1. Sign up at resend.com
2. Get API key from dashboard
3. Add RESEND_API_KEY to Supabase Edge Function secrets
4. Update "from" email address in function if needed

---

## Success Criteria

The complete workflow is successful when:

1. ✅ Candidate added and appears in pipeline
2. ✅ Candidate moves through all stages smoothly
3. ✅ Offer created and sent
4. ✅ Candidate converted to new hire
5. ✅ Email sent (or logged) with correct information
6. ✅ Onboarding record created with tasks
7. ✅ All database records properly created
8. ✅ No errors in browser console
9. ✅ User receives appropriate notifications
10. ✅ Email delivered to crissgood@gmail.com (with API key)

---

## Next Steps After Testing

Once the workflow is verified:

1. **Complete Onboarding Tasks**
   - Test task completion workflow
   - Verify task status updates
   - Check notifications for task assignments

2. **Test Additional Features**
   - Add comments to candidates
   - Rate candidates
   - Disqualify and restore candidates
   - Test search and filter functionality

3. **Production Configuration**
   - Set up Resend API key for real email delivery
   - Configure custom domain for emails
   - Set up email templates for branding
   - Configure email notification preferences

---

## Support and Documentation

For additional help:
- Check browser console for detailed error messages
- Review Supabase logs for backend errors
- Verify database records in Supabase dashboard
- Check Edge Function logs for email sending status

**Key Database Tables:**
- `candidates` - All candidate records
- `new_hires` - Converted candidates in onboarding
- `onboarding_tasks` - Generated tasks for new hires
- `onboarding_templates` - Task templates by role

---

## Conclusion

This complete workflow demonstrates:
- End-to-end hiring pipeline functionality
- Seamless candidate-to-employee conversion
- Automated email notifications
- Role-based onboarding task generation
- Professional communication with new hires

The system is now ready for testing with Crisalida Gutierrez's information and will send onboarding emails to crissgood@gmail.com once properly configured.
