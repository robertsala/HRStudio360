import { supabase } from './supabaseClient';
import i18n from '../i18n';

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
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('date_of_birth, hire_date, last_birthday_shown, last_anniversary_shown')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile for celebration check:', profileError);
        return null;
      }

      if (!profile) {
        return null;
      }

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      if (profile.date_of_birth) {
        const birthDate = new Date(profile.date_of_birth);
        const isBirthday = this.isSameMonthDay(today, birthDate);

        if (isBirthday && profile.last_birthday_shown !== todayStr) {
          const age = this.calculateAge(birthDate, today);
          const isMilestone = this.isBirthdayMilestone(age);

          await supabase
            .from('profiles')
            .update({ last_birthday_shown: todayStr })
            .eq('id', userId);

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

      if (profile.hire_date) {
        const hireDate = new Date(profile.hire_date);
        const isAnniversary = this.isSameMonthDay(today, hireDate);

        if (isAnniversary && profile.last_anniversary_shown !== todayStr) {
          const yearsOfService = this.calculateYearsOfService(hireDate, today);

          if (yearsOfService > 0) {
            const isMilestone = yearsOfService % 5 === 0;

            const { data: badge } = await supabase
              .from('anniversary_badges')
              .select('*')
              .eq('year_number', yearsOfService)
              .maybeSingle();

            await supabase
              .from('profiles')
              .update({ last_anniversary_shown: todayStr })
              .eq('id', userId);

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
      await supabase
        .from('celebration_history')
        .insert({
          employee_id: userId,
          celebration_type: celebration.type,
          celebration_date: celebration.date.toISOString().split('T')[0],
          years_count: celebration.yearsCount || null,
          is_milestone: celebration.isMilestone
        });
    } catch (error) {
      console.error('Error saving celebration history:', error);
    }
  },

  async createCelebrationNotification(userId: string, celebration: CelebrationData): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await supabase
        .from('celebration_notifications')
        .insert({
          employee_id: userId,
          celebration_type: celebration.type,
          celebration_date: celebration.date.toISOString().split('T')[0],
          years_count: celebration.yearsCount || null,
          is_milestone: celebration.isMilestone,
          badge_id: celebration.badgeId || null,
          message_title: celebration.message.title,
          message_body: celebration.message.body,
          can_replay: true,
          expires_at: expiresAt.toISOString()
        });
    } catch (error) {
      console.error('Error creating celebration notification:', error);
    }
  },

  async markCelebrationDismissed(userId: string, celebrationType: 'birthday' | 'anniversary', celebrationDate: string): Promise<void> {
    try {
      await supabase
        .from('celebration_history')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('employee_id', userId)
        .eq('celebration_type', celebrationType)
        .eq('celebration_date', celebrationDate);
    } catch (error) {
      console.error('Error marking celebration dismissed:', error);
    }
  },

  async replayCelebration(notificationId: string): Promise<void> {
    try {
      const { data: notification } = await supabase
        .from('celebration_notifications')
        .select('*')
        .eq('id', notificationId)
        .maybeSingle();

      if (!notification) return;

      await supabase
        .from('celebration_history')
        .update({
          replay_count: supabase.rpc('increment_replay_count', { celebration_id: notification.id }),
          last_replayed_at: new Date().toISOString()
        })
        .eq('employee_id', notification.employee_id)
        .eq('celebration_type', notification.celebration_type)
        .eq('celebration_date', notification.celebration_date);

      await supabase
        .from('celebration_notifications')
        .update({ replayed_at: new Date().toISOString() })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error replaying celebration:', error);
    }
  },

  async getEarnedBadges(userId: string): Promise<EarnedBadge[]> {
    try {
      const { data, error } = await supabase
        .from('earned_badges')
        .select(`
          *,
          badge:anniversary_badges(*)
        `)
        .eq('employee_id', userId)
        .order('earned_date', { ascending: false });

      if (error) {
        console.error('Error fetching earned badges:', error);
        return [];
      }

      return data as EarnedBadge[];
    } catch (error) {
      console.error('Error fetching earned badges:', error);
      return [];
    }
  },

  async getAllBadges(): Promise<Badge[]> {
    try {
      const { data, error } = await supabase
        .from('anniversary_badges')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching all badges:', error);
        return [];
      }

      return data as Badge[];
    } catch (error) {
      console.error('Error fetching all badges:', error);
      return [];
    }
  },

  async markBadgeViewed(badgeId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('earned_badges')
        .update({ viewed_at: new Date().toISOString(), is_new: false })
        .eq('employee_id', userId)
        .eq('badge_id', badgeId);
    } catch (error) {
      console.error('Error marking badge viewed:', error);
    }
  },

  async getCelebrationNotifications(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('celebration_notifications')
        .select('*')
        .eq('employee_id', userId)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching celebration notifications:', error);
        return [];
      }

      return data || [];
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

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, date_of_birth, hire_date')
        .not('date_of_birth', 'is', null)
        .not('hire_date', 'is', null);

      if (error) {
        console.error('Error fetching upcoming celebrations:', error);
        return [];
      }

      const celebrations: any[] = [];

      data?.forEach(profile => {
        if (profile.date_of_birth) {
          const birthday = new Date(profile.date_of_birth);
          const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());

          if (thisYearBirthday >= today && thisYearBirthday <= thirtyDaysFromNow) {
            celebrations.push({
              type: 'birthday',
              date: thisYearBirthday,
              employeeName: `${profile.first_name} ${profile.last_name}`,
              employeeId: profile.id
            });
          }
        }

        if (profile.hire_date) {
          const hireDate = new Date(profile.hire_date);
          const thisYearAnniversary = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate());
          const yearsOfService = this.calculateYearsOfService(hireDate, thisYearAnniversary);

          if (thisYearAnniversary >= today && thisYearAnniversary <= thirtyDaysFromNow && yearsOfService > 0) {
            celebrations.push({
              type: 'anniversary',
              date: thisYearAnniversary,
              employeeName: `${profile.first_name} ${profile.last_name}`,
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
