# HR Admin Test Guide

## Test HR Admin Account

We've created a dedicated test HR admin account for testing approval workflows and role-based features.

### Login Credentials

**Email:** `hradmin@hrstudio360.com`  
**Password:** `HRStudio360Demo!`

### Other Test Accounts

For testing multi-user scenarios, you can use these additional accounts:

| Email | Password | Role |
|-------|----------|------|
| `robertsala@gmail.com` | `HRStudio360Demo!` | Product Owner / CEO |
| `demo@hrstudio360.com` | `HRStudio360Demo!` | Product Owner |
| `james.wilson@hrstudio360.com` | `HRStudio360Demo!` | HR Manager |
| `sarah.johnson@hrstudio360.com` | `HRStudio360Demo!` | Senior Engineer |
| `michael.chen@hrstudio360.com` | `HRStudio360Demo!` | Product Manager |

## Testing Address Change Approval Workflow

### As a Regular Employee:

1. Log in with `sarah.johnson@hrstudio360.com`
2. Navigate to Dashboard → Click "My Profile"
3. Click "Edit" button
4. Update your address (e.g., change street, city, state, or ZIP)
5. Click "Save Changes"
6. You should see a message: "Address change submitted for HR review"

### As HR Admin:

1. Log out from the employee account
2. Log in with `hradmin@hrstudio360.com`
3. Navigate to Dashboard
4. Look for "Address Change Requests" or similar notification
5. Click to open the approval modal
6. Review the address change request
7. Choose to:
   - **Approve**: Updates employee's address immediately
   - **Reject**: Employee keeps old address, receives notification

### Solo Testing Workflow

Since you're currently a solo user, here's how to test the approval workflow:

1. **Browser 1 (Incognito)**: Log in as regular employee (`sarah.johnson@hrstudio360.com`)
2. **Browser 2 (Regular)**: Log in as HR admin (`hradmin@hrstudio360.com`)
3. In Browser 1, submit an address change
4. In Browser 2, approve or reject the request
5. Refresh Browser 1 to see the result

## "View As" User Impersonation Feature

The "View As" feature allows HR admins and Product Owners to impersonate other users to troubleshoot their issues.

### How to Use:

1. Log in as HR admin (`hradmin@hrstudio360.com`)
2. Navigate to Employee Directory
3. Find the employee you want to impersonate
4. Click the "View As" or "Impersonate" button (👁️ eye icon)
5. You'll see a banner indicating you're viewing as that user
6. You can now see exactly what they see
7. Click "Exit View As" to return to your account

**Note:** The feature may need to be restored - see issue tracking for status.

## Role-Based Profile Viewing

### Full Profile Access (HR & Product Owner):
- See all profile data including:
  - Full address
  - Emergency contact details
  - Salary information
  - Personal details

### Limited Profile Access (Regular Employees):
- See only public information:
  - Name
  - Email
  - Phone
  - Department
  - Role
  - Location (city/state only)

Test this by:
1. Logging in as `hradmin@hrstudio360.com` - view any employee profile (full access)
2. Logging in as `sarah.johnson@hrstudio360.com` - view another employee profile (limited access)

## Resetting Test Data

If you need to reset the test accounts or re-seed the database:

```bash
npm run seed:production
```

This will recreate all test accounts with default data.

## Troubleshooting

### Can't see address change requests?
- Make sure you're logged in as HR Manager or Product Owner
- Check the notifications bell icon
- Look for "Address Change Approval" modal in the dashboard

### Address changes apply immediately?
- This happens if you're logged in as HR or Product Owner
- HR/Product Owner roles bypass the approval workflow
- Test with a regular employee account instead

### Need more test users?
- You can create additional users through the "Add Employee" modal
- Or modify `server/seed-production.ts` to add more test accounts
