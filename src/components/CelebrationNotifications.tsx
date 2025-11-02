import React, { useEffect, useState } from 'react';
import { Cake, Trophy, Play, X } from 'lucide-react';
import { celebrationService } from '../utils/celebrationService';
import BirthdayCelebrationModal from './modals/BirthdayCelebrationModal';
import AnniversaryCelebrationModal from './modals/AnniversaryCelebrationModal';
import { CelebrationData } from '../utils/celebrationService';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

interface CelebrationNotificationsProps {
  userId: string;
  userName: string;
}

const CelebrationNotifications: React.FC<CelebrationNotificationsProps> = ({ userId, userName }) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedCelebration, setSelectedCelebration] = useState<CelebrationData | null>(null);

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const loadNotifications = async () => {
    const data = await celebrationService.getCelebrationNotifications(userId);
    setNotifications(data);
  };

  const handleReplay = async (notification: any) => {
    await celebrationService.replayCelebration(notification.id);

    const celebration: CelebrationData = {
      type: notification.celebration_type,
      date: new Date(notification.celebration_date),
      yearsCount: notification.years_count,
      isMilestone: notification.is_milestone,
      badgeId: notification.badge_id,
      message: {
        title: notification.message_title,
        body: notification.message_body
      }
    };

    if (notification.badge_id) {
      const allBadges = await celebrationService.getAllBadges();
      const badge = allBadges.find(b => b.id === notification.badge_id);
      if (badge) {
        celebration.badgeInfo = {
          title: badge.badge_title,
          description: badge.badge_description,
          color: badge.badge_color,
          icon: badge.badge_icon,
          tierName: badge.tier_name
        };
      }
    }

    setSelectedCelebration(celebration);
  };

  const handleDelete = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border-2 ${
              notification.is_milestone
                ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300'
                : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className={`p-2 rounded-full ${
                  notification.celebration_type === 'birthday'
                    ? 'bg-pink-500'
                    : notification.is_milestone
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                    : 'bg-blue-500'
                }`}>
                  {notification.celebration_type === 'birthday' ? (
                    <Cake className="h-5 w-5 text-white" />
                  ) : (
                    <Trophy className="h-5 w-5 text-white" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-gray-900">
                      {notification.message_title}
                    </h4>
                    {notification.is_milestone && (
                      <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
                        {t('celebrations.milestone')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    {notification.message_body.length > 100
                      ? notification.message_body.substring(0, 100) + '...'
                      : notification.message_body}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.celebration_date).toLocaleDateString(i18n.language, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleReplay(notification)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all ${
                    notification.is_milestone
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  title={t('celebrations.replayCelebration')}
                >
                  <Play className="h-4 w-4" />
                  <span className="text-sm">{t('celebrations.replay')}</span>
                </button>

                <button
                  onClick={() => handleDelete(notification.id)}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  title={t('celebrations.dismissNotification')}
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCelebration && selectedCelebration.type === 'birthday' && (
        <BirthdayCelebrationModal
          celebration={selectedCelebration}
          employeeName={userName}
          onClose={() => setSelectedCelebration(null)}
        />
      )}

      {selectedCelebration && selectedCelebration.type === 'anniversary' && (
        <AnniversaryCelebrationModal
          celebration={selectedCelebration}
          employeeName={userName}
          onClose={() => setSelectedCelebration(null)}
        />
      )}
    </>
  );
};

export default CelebrationNotifications;
