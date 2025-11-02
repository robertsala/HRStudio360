import React, { useEffect, useState } from 'react';
import { Award, Trophy, Star, Medal, Shield, Lock, TrendingUp } from 'lucide-react';
import { celebrationService, Badge, EarnedBadge } from '../utils/celebrationService';

interface AchievementsSectionProps {
  userId: string;
  userName?: string;
}

const AchievementsSection: React.FC<AchievementsSectionProps> = ({ userId, userName }) => {
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMilestonesOnly, setShowMilestonesOnly] = useState(false);

  useEffect(() => {
    loadBadges();
  }, [userId]);

  const loadBadges = async () => {
    setLoading(true);
    const [allBadgesData, earnedBadgesData] = await Promise.all([
      celebrationService.getAllBadges(),
      celebrationService.getEarnedBadges(userId)
    ]);

    setAllBadges(allBadgesData);
    setEarnedBadges(earnedBadgesData);
    setLoading(false);
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Award': return Award;
      case 'Trophy': return Trophy;
      case 'Star': return Star;
      case 'Medal': return Medal;
      case 'Shield': return Shield;
      default: return Trophy;
    }
  };

  const hasEarnedBadge = (badgeId: string) => {
    return earnedBadges.some(eb => eb.badge_id === badgeId);
  };

  const getEarnedDate = (badgeId: string) => {
    const earned = earnedBadges.find(eb => eb.badge_id === badgeId);
    return earned ? new Date(earned.earned_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : null;
  };

  const filteredBadges = showMilestonesOnly
    ? allBadges.filter(badge => badge.is_milestone)
    : allBadges;

  const earnedCount = earnedBadges.length;
  const nextMilestone = allBadges.find(badge =>
    badge.is_milestone && badge.year_number > earnedCount
  );

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
        <p className="text-gray-600 dark:text-gray-400 mt-4">Loading achievements...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Trophy className="h-8 w-8 mr-3 text-yellow-500" />
            Achievements
            {userName && <span className="text-gray-500 ml-2">- {userName}</span>}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Celebrating work anniversary milestones
          </p>
        </div>

        <div className="text-right">
          <div className="text-4xl font-bold text-blue-600">{earnedCount}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Badge{earnedCount !== 1 ? 's' : ''} Earned
          </div>
        </div>
      </div>

      {nextMilestone && earnedCount > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-md">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Next Milestone: {nextMilestone.year_number} Years
                </h3>
                <p className="text-gray-700 dark:text-gray-300">{nextMilestone.badge_title}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {nextMilestone.year_number - earnedCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">years to go</div>
            </div>
          </div>
          <div className="mt-4 bg-white dark:bg-gray-800 bg-opacity-50 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
              style={{
                width: `${(earnedCount / nextMilestone.year_number) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setShowMilestonesOnly(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !showMilestonesOnly
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Badges
          </button>
          <button
            onClick={() => setShowMilestonesOnly(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showMilestonesOnly
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Milestones Only
          </button>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredBadges.length} of {allBadges.length} badges
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {filteredBadges.map((badge) => {
          const isEarned = hasEarnedBadge(badge.id);
          const earnedDate = getEarnedDate(badge.id);
          const BadgeIcon = getBadgeIcon(badge.badge_icon);

          return (
            <div
              key={badge.id}
              className={`relative rounded-2xl p-6 transition-all duration-300 ${
                isEarned
                  ? 'bg-white border-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                  : 'bg-gray-50 border-2 border-dashed border-gray-300 opacity-60'
              } ${
                badge.is_milestone && isEarned
                  ? 'border-yellow-400 ring-2 ring-yellow-300 ring-opacity-50'
                  : isEarned
                  ? 'border-gray-200'
                  : ''
              }`}
            >
              {badge.is_milestone && isEarned && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md animate-pulse">
                  Milestone
                </div>
              )}

              <div className="flex flex-col items-center text-center space-y-3">
                <div
                  className={`relative p-4 rounded-full ${
                    isEarned
                      ? badge.is_milestone
                        ? 'bg-gradient-to-br from-yellow-300 to-orange-400 shadow-lg'
                        : 'shadow-md'
                      : 'bg-gray-200'
                  }`}
                  style={isEarned && !badge.is_milestone ? {
                    backgroundColor: badge.badge_color,
                    opacity: 0.9
                  } : {}}
                >
                  {isEarned ? (
                    <BadgeIcon className="h-12 w-12 text-white" />
                  ) : (
                    <Lock className="h-12 w-12 text-gray-400" />
                  )}
                </div>

                <div>
                  <div className={`text-sm font-semibold mb-1 ${
                    isEarned ? 'text-gray-700' : 'text-gray-500'
                  }`}>
                    Year {badge.year_number}
                  </div>
                  <h3 className={`font-bold text-sm ${
                    isEarned ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {badge.badge_title}
                  </h3>
                </div>

                {isEarned && (
                  <>
                    <div className={`text-xs px-3 py-1 rounded-full font-medium ${
                      badge.is_milestone
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {badge.tier_name}
                    </div>
                    {earnedDate && (
                      <div className="text-xs text-gray-500">
                        Earned {earnedDate}
                      </div>
                    )}
                  </>
                )}

                {!isEarned && (
                  <div className="text-xs text-gray-400">
                    Locked
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {earnedCount === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No Badges Earned Yet
          </h3>
          <p className="text-gray-500">
            Work anniversary badges will appear here as milestones are reached
          </p>
        </div>
      )}
    </div>
  );
};

export default AchievementsSection;
