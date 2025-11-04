import { apiClient } from '../lib/api';
import i18n from '../i18n';

// Normalization helpers to convert camelCase API responses to snake_case for backward compatibility
function normalizeBadge(badge: any): Badge | null {
  if (!badge) return null;
  return {
    id: badge.id,
    year_number: badge.yearNumber,
    badge_title: badge.badgeTitle,
    badge_description: badge.badgeDescription,
    badge_color: badge.badgeColor,
    badge_icon: badge.badgeIcon,
    tier_name: badge.tierName,
    is_milestone: badge.isMilestone ?? false,
    sort_order: badge.sortOrder
  };
}

function normalizeEarnedBadge(earnedBadge: any): EarnedBadge | null {
  if (!earnedBadge) return null;
  return {
    id: earnedBadge.id,
    employee_id: earnedBadge.userId,
    badge_id: earnedBadge.badgeId,
    earned_date: earnedBadge.earnedAt,
    viewed_at: earnedBadge.viewedAt,
    is_new: earnedBadge.isNew ?? true,
    badge: normalizeBadge(earnedBadge.badge) as Badge
  };
}

export interface CelebrationData {
  type: 'birthday' | 'anniversary';
  date: Date;
  yearsCount?: number;
  isMilestone: boolean;
  badgeId?: string;
  badgeInfo?: {
    title: string;
    description: string;
    color: string;
    icon: string;
    tierName: string;
  };
  message: {
    title: string;
    body: string;
  };
}

export interface Badge {
  id: string;
  year_number: number;
  badge_title: string;
  badge_description: string;
  badge_color: string;
  badge_icon: string;
  tier_name: string;
  is_milestone: boolean;
  sort_order: number;
}

export interface EarnedBadge {
  id: string;
  employee_id: string;
  badge_id: string;
  earned_date: string;
  viewed_at?: string;
  is_new: boolean;
  badge: Badge;
}

export const celebrationService = {
  async checkForCelebrations(userId: string): Promise<CelebrationData | null> {
    try {
      const profile = await apiClient.getProfile(userId);

      if (!profile) {
        return null;
      }

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      if (profile.dateOfBirth) {
        const birthDate = new Date(profile.dateOfBirth);
        const isBirthday = this.isSameMonthDay(today, birthDate);

        if (isBirthday && profile.lastBirthdayShown !== todayStr) {
          const age = this.calculateAge(birthDate, today);
          const isMilestone = this.isBirthdayMilestone(age);

          await apiClient.updateProfile(userId, { lastBirthdayShown: todayStr });

          const celebration: CelebrationData = {
            type: 'birthday',
            date: today,
            isMilestone,
            message: {
              title: isMilestone
                ? i18n.t('celebrations.happyBirthdayMilestone', { age })
                : i18n.t('celebrations.happyBirthday'),
              body: isMilestone
                ? i18n.t('celebrations.birthdayMilestoneMessage', { age })
                : i18n.t('celebrations.birthdayMessage')
            }
          };

          await this.saveCelebrationHistory(userId, celebration);
          await this.createCelebrationNotification(userId, celebration);

          return celebration;
        }
      }

      if (profile.hireDate) {
        const hireDate = new Date(profile.hireDate);
        const isAnniversary = this.isSameMonthDay(today, hireDate);

        if (isAnniversary && profile.lastAnniversaryShown !== todayStr) {
          const yearsOfService = this.calculateYearsOfService(hireDate, today);

          if (yearsOfService > 0) {
            const isMilestone = yearsOfService % 5 === 0;

            const badgeData = await apiClient.getCelebrationBadgeByYears(yearsOfService);
            const badge = normalizeBadge(badgeData);

            await apiClient.updateProfile(userId, { lastAnniversaryShown: todayStr });

            const yearLabel = yearsOfService === 1
              ? i18n.t('celebrations.year')
              : i18n.t('celebrations.years');

            const celebration: CelebrationData = {
              type: 'anniversary',
              date: today,
              yearsCount: yearsOfService,
              isMilestone,
              badgeId: badge?.id,
              badgeInfo: badge ? {
                title: badge.badge_title,
                description: badge.badge_description,
                color: badge.badge_color,
                icon: badge.badge_icon,
                tierName: badge.tier_name
              } : undefined,
              message: {
                title: isMilestone
                  ? i18n.t('celebrations.yearsOfExcellence', { years: yearsOfService })
                  : i18n.t('celebrations.congratulationsYears', { years: yearsOfService, yearLabel }),
                body: isMilestone
                  ? i18n.t('celebrations.anniversaryMilestoneMessage', { years: yearsOfService })
                  : i18n.t('celebrations.anniversaryMessage', { years: yearsOfService, yearLabel })
              }
            };

            await this.saveCelebrationHistory(userId, celebration);
            await this.createCelebrationNotification(userId, celebration);

            return celebration;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking for celebrations:', error);
      return null;
    }
  },

  isSameMonthDay(date1: Date, date2: Date): boolean {
    const d1Month = date1.getMonth();
    const d1Day = date1.getDate();
    const d2Month = date2.getMonth();
    let d2Day = date2.getDate();

    if (d2Month === 1 && d2Day === 29) {
      const isLeapYear = (date1.getFullYear() % 4 === 0 && date1.getFullYear() % 100 !== 0) || (date1.getFullYear() % 400 === 0);
      if (!isLeapYear && d1Month === 1 && d1Day === 28) {
        return true;
      }
    }

    return d1Month === d2Month && d1Day === d2Day;
  },

  calculateAge(birthDate: Date, currentDate: Date): number {
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  },

  calculateYearsOfService(hireDate: Date, currentDate: Date): number {
    return this.calculateAge(hireDate, currentDate);
  },

  isBirthdayMilestone(age: number): boolean {
    return age % 10 === 0 && age >= 30;
  },

  async saveCelebrationHistory(userId: string, celebration: CelebrationData): Promise<void> {
    try {
      await apiClient.saveCelebrationHistory({
        userId,
        type: celebration.type,
        celebrationDate: celebration.date.toISOString().split('T')[0],
        yearsCount: celebration.yearsCount || null,
        isMilestone: celebration.isMilestone
      });
    } catch (error) {
      console.error('Error saving celebration history:', error);
    }
  },

  async createCelebrationNotification(userId: string, celebration: CelebrationData): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await apiClient.createCelebrationNotification({
        userId,
        type: celebration.type,
        celebrationDate: celebration.date.toISOString().split('T')[0],
        yearsCount: celebration.yearsCount || null,
        isMilestone: celebration.isMilestone,
        badgeId: celebration.badgeId || null,
        messageTitle: celebration.message.title,
        messageBody: celebration.message.body,
        canReplay: true,
        expiresAt: expiresAt.toISOString()
      });
    } catch (error) {
      console.error('Error creating celebration notification:', error);
    }
  },

  async markCelebrationDismissed(userId: string, celebrationType: 'birthday' | 'anniversary', celebrationDate: string): Promise<void> {
    try {
      await apiClient.markCelebrationDismissed(userId, celebrationType, celebrationDate);
    } catch (error) {
      console.error('Error marking celebration dismissed:', error);
    }
  },

  async replayCelebration(notificationId: string): Promise<void> {
    try {
      // TODO: Implement replay celebration functionality
      // This requires additional backend support for replay tracking
      console.log('Replay celebration:', notificationId);
    } catch (error) {
      console.error('Error replaying celebration:', error);
    }
  },

  async getEarnedBadges(userId: string): Promise<EarnedBadge[]> {
    try {
      const badges = await apiClient.getEarnedBadges(userId);
      return badges.map((badge: any) => normalizeEarnedBadge(badge)).filter((b: any) => b !== null) as EarnedBadge[];
    } catch (error) {
      console.error('Error fetching earned badges:', error);
      return [];
    }
  },

  async getAllBadges(): Promise<Badge[]> {
    try {
      const badges = await apiClient.getCelebrationBadges();
      return badges.map((badge: any) => normalizeBadge(badge)).filter((b: any) => b !== null) as Badge[];
    } catch (error) {
      console.error('Error fetching all badges:', error);
      return [];
    }
  },

  async markBadgeViewed(badgeId: string, userId: string): Promise<void> {
    try {
      await apiClient.markBadgeViewed(userId, badgeId);
    } catch (error) {
      console.error('Error marking badge viewed:', error);
    }
  },

  async getCelebrationNotifications(userId: string): Promise<any[]> {
    try {
      const notifications = await apiClient.getCelebrationNotifications(userId);
      // Filter for non-expired notifications
      const now = new Date().toISOString();
      return notifications.filter((n: any) => n.expiresAt && n.expiresAt >= now);
    } catch (error) {
      console.error('Error fetching celebration notifications:', error);
      return [];
    }
  },

  async getUpcomingCelebrations(): Promise<any[]> {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const profiles = await apiClient.getProfiles();
      const celebrations: any[] = [];

      profiles?.forEach((profile: any) => {
        if (profile.dateOfBirth) {
          const birthday = new Date(profile.dateOfBirth);
          const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());

          if (thisYearBirthday >= today && thisYearBirthday <= thirtyDaysFromNow) {
            celebrations.push({
              type: 'birthday',
              date: thisYearBirthday,
              employeeName: `${profile.firstName} ${profile.lastName}`,
              employeeId: profile.id
            });
          }
        }

        if (profile.hireDate) {
          const hireDate = new Date(profile.hireDate);
          const thisYearAnniversary = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate());
          const yearsOfService = this.calculateYearsOfService(hireDate, thisYearAnniversary);

          if (thisYearAnniversary >= today && thisYearAnniversary <= thirtyDaysFromNow && yearsOfService > 0) {
            celebrations.push({
              type: 'anniversary',
              date: thisYearAnniversary,
              employeeName: `${profile.firstName} ${profile.lastName}`,
              employeeId: profile.id,
              yearsCount: yearsOfService,
              isMilestone: yearsOfService % 5 === 0
            });
          }
        }
      });

      return celebrations.sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error('Error fetching upcoming celebrations:', error);
      return [];
    }
  }
};
