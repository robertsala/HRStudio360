# Birthday and Work Anniversary Celebration System

## Overview

The HR Studio 360 celebration system automatically recognizes and celebrates employee birthdays and work anniversaries with beautiful full-screen animations, progressive badge achievements, and lasting recognition.

## Features

### 🎂 Birthday Celebrations
- **Automatic Detection**: System checks for birthdays on login
- **Full-Screen Experience**: Blocking modal with confetti and balloon animations
- **Milestone Recognition**: Enhanced celebrations for milestone birthdays (30, 40, 50, 60, etc.)
- **Replay Capability**: Birthday celebrations can be replayed from notifications for 7 days

### 🏆 Work Anniversary Celebrations
- **40-Badge System**: Unique badges for each year of service (1-40 years)
- **Milestone Highlights**: Special enhanced celebrations every 5 years (5, 10, 15, 20, 25, 30, 35, 40)
- **Tiered Recognition**: Badges progress through 8 tiers:
  - **Bronze** (Years 1-5): Warm copper/orange tones
  - **Silver** (Years 6-10): Cool silver/gray tones
  - **Gold** (Years 11-15): Rich gold/yellow tones
  - **Platinum** (Years 16-20): Bright white/blue tones
  - **Sapphire** (Years 21-25): Deep blue tones
  - **Ruby** (Years 26-30): Rich red/pink tones
  - **Emerald** (Years 31-35): Vibrant green tones
  - **Diamond** (Years 36-40): Crystal/rainbow tones

### 🎨 Premium Animations
- **Birthday**: Multi-color confetti + floating balloons + sparkle effects (milestone)
- **Anniversary**: Fireworks + confetti with company colors
- **Milestone Anniversary**: Golden confetti + enhanced fireworks + sparkle trails

### 🏅 Achievements Section
- **Badge Showcase**: View all earned and locked badges
- **Progress Tracking**: See path to next milestone
- **Public Visibility**: Achievements visible to anyone viewing employee profile
- **Filter Options**: View all badges or milestones only

### 🔔 Notification System
- **Replay Feature**: Replay any celebration within 7 days
- **Celebration History**: Access past celebrations from current year
- **Dashboard Integration**: Celebration notifications appear in notifications panel

### 📊 HR Dashboard Widget
- **Upcoming Celebrations**: See next 30 days of birthdays and anniversaries
- **Milestone Indicators**: Highlighted milestone anniversaries
- **Planning Tool**: Helps HR prepare for employee recognition

## Database Schema

### Tables Created

1. **anniversary_badges**: Master table with all 40 badge definitions
2. **earned_badges**: Tracks which badges each employee has earned
3. **celebration_history**: Records all celebrations shown (prevents duplicates)
4. **celebration_notifications**: Stores celebration notifications with replay capability

### Profile Fields Added

- `date_of_birth`: Employee birthday for celebration detection
- `hire_date`: Employment start date for anniversary calculations
- `last_birthday_shown`: Prevents duplicate birthday celebrations
- `last_anniversary_shown`: Prevents duplicate anniversary celebrations

## How It Works

### Login Detection

1. User logs in to HR Studio 360
2. System checks `date_of_birth` and `hire_date` against today's date
3. If birthday matches, creates birthday celebration
4. If hire date anniversary matches, creates anniversary celebration with badge
5. Celebration shows immediately as blocking full-screen modal
6. After dismissal, celebration saved as notification for 7-day replay

### Celebration Flow

```
Login → Auth Check → Date Comparison → Celebration Detection →
Full-Screen Modal → User Dismisses → Notification Created →
Badge Awarded (if anniversary) → Continue to Dashboard
```

### Prevention of Duplicates

- `last_birthday_shown` and `last_anniversary_shown` fields track when celebrations were last displayed
- System only shows one celebration per type per day
- Replays don't update these fields, allowing multiple replays

## Testing the System

### To Test Birthday Celebration

1. Update your profile's `date_of_birth` in Supabase:
   ```sql
   UPDATE profiles
   SET date_of_birth = CURRENT_DATE - interval '28 years'
   WHERE id = 'your-user-id';
   ```

2. Clear `last_birthday_shown`:
   ```sql
   UPDATE profiles
   SET last_birthday_shown = NULL
   WHERE id = 'your-user-id';
   ```

3. Log out and log back in

### To Test Work Anniversary

1. Update your profile's `hire_date` in Supabase:
   ```sql
   -- For 3 year anniversary
   UPDATE profiles
   SET hire_date = CURRENT_DATE - interval '3 years'
   WHERE id = 'your-user-id';
   ```

2. Clear `last_anniversary_shown`:
   ```sql
   UPDATE profiles
   SET last_anniversary_shown = NULL
   WHERE id = 'your-user-id';
   ```

3. Log out and log back in

### To Test Milestone Anniversary

Use intervals divisible by 5 (5, 10, 15, 20, 25, 30, 35, 40 years):

```sql
-- For 5 year milestone
UPDATE profiles
SET hire_date = CURRENT_DATE - interval '5 years',
    last_anniversary_shown = NULL
WHERE id = 'your-user-id';
```

## Components Reference

### Core Components

- **`celebrationService.ts`**: Main service for celebration detection and management
- **`BirthdayCelebrationModal.tsx`**: Birthday celebration modal with animations
- **`AnniversaryCelebrationModal.tsx`**: Work anniversary modal with badge reveal
- **`AchievementsSection.tsx`**: Badge showcase and achievements display
- **`CelebrationNotifications.tsx`**: Notification panel with replay functionality
- **`UpcomingCelebrationsWidget.tsx`**: HR dashboard widget for upcoming celebrations

### Animation Components

- **`ConfettiAnimation.tsx`**: Multi-color confetti effect
- **`BalloonAnimation.tsx`**: Floating balloons with realistic physics
- **`FireworksAnimation.tsx`**: Burst fireworks effect
- **`SparkleAnimation.tsx`**: Twinkling sparkle overlay

## Integration Points

### AuthContext Integration

The celebration system integrates with authentication:

```typescript
const { celebration, dismissCelebration, user } = useAuth();
```

- `celebration`: Current celebration data (if any)
- `dismissCelebration()`: Function to dismiss active celebration
- `user`: Current user info for personalization

### App.tsx Integration

Celebration modals render at app level:

```tsx
{celebration && celebration.type === 'birthday' && (
  <BirthdayCelebrationModal
    celebration={celebration}
    employeeName={user.name}
    onClose={dismissCelebration}
  />
)}
```

### Employee Profile Integration

Add achievements tab to employee profiles:

```tsx
<AchievementsSection userId={employee.id} userName={employee.name} />
```

### Dashboard Integration

Add upcoming celebrations widget:

```tsx
<UpcomingCelebrationsWidget onViewAll={() => openModal('celebrations')} />
```

## API Reference

### celebrationService Methods

```typescript
// Check for today's celebrations
checkForCelebrations(userId: string): Promise<CelebrationData | null>

// Get all earned badges for employee
getEarnedBadges(userId: string): Promise<EarnedBadge[]>

// Get all 40 badge definitions
getAllBadges(): Promise<Badge[]>

// Get celebration notifications (7-day window)
getCelebrationNotifications(userId: string): Promise<any[]>

// Get upcoming celebrations (30-day window)
getUpcomingCelebrations(): Promise<any[]>

// Replay a celebration
replayCelebration(notificationId: string): Promise<void>

// Mark celebration as dismissed
markCelebrationDismissed(
  userId: string,
  type: 'birthday' | 'anniversary',
  date: string
): Promise<void>

// Mark badge as viewed
markBadgeViewed(badgeId: string, userId: string): Promise<void>
```

## Customization Options

### Celebration Messages

Edit messages in `celebrationService.ts`:

```typescript
message: {
  title: isMilestone ? `Happy ${age}th Birthday!` : 'Happy Birthday!',
  body: 'Your custom message here...'
}
```

### Badge Design

Modify badge colors and tiers in migration:

```sql
UPDATE anniversary_badges
SET badge_color = '#YOUR_COLOR',
    tier_name = 'Your Tier Name'
WHERE year_number = 5;
```

### Animation Timing

Adjust animation durations in component props:

```typescript
<ConfettiAnimation show={showAnimations} duration={5000} />
<BalloonAnimation show={showAnimations} count={30} />
```

## Security and Privacy

- All celebration data is secured with Row Level Security (RLS)
- Users can only view their own celebration history
- Badges and achievements are publicly viewable on profiles
- Celebration notifications auto-expire after 7 days
- HR can view upcoming celebrations for planning purposes

## Troubleshooting

### Celebration Not Showing

1. Check `date_of_birth` or `hire_date` is set in profiles table
2. Verify date matches today's date (month and day)
3. Check `last_birthday_shown` / `last_anniversary_shown` is not today
4. Clear last_shown fields and try again
5. Check browser console for errors

### Badge Not Appearing

1. Verify celebration_history record was created
2. Check earned_badges table for badge entry
3. Confirm years_count matches a badge (1-40)
4. Look for trigger execution errors in Supabase logs

### Animations Not Playing

1. Check browser performance/compatibility
2. Verify animation components are imported
3. Check console for JavaScript errors
4. Try reducing particle counts for better performance

## Future Enhancements

Potential additions to the system:

- 📧 Automated email notifications to managers
- 👥 Team celebration feeds
- 🎁 Gift card integration for milestones
- 📸 Photo uploads for celebrations
- 🎵 Optional celebration music/sounds
- 📱 Push notifications for upcoming celebrations
- 🌐 Social sharing capabilities
- 📊 Celebration analytics and insights

## Support

For issues or questions about the celebration system:

1. Check this guide first
2. Review Supabase logs for errors
3. Verify database migrations ran successfully
4. Check browser console for client-side errors
5. Test with different dates and scenarios

---

**Celebrate Every Milestone! 🎉**
