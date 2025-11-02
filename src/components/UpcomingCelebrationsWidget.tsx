import React, { useEffect, useState } from 'react';
import { Cake, Trophy, Calendar, ChevronRight } from 'lucide-react';
import { celebrationService } from '../utils/celebrationService';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

interface UpcomingCelebrationsWidgetProps {
  onViewAll?: () => void;
}

const UpcomingCelebrationsWidget: React.FC<UpcomingCelebrationsWidgetProps> = ({ onViewAll }) => {
  const { t } = useTranslation();
  const [celebrations, setCelebrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCelebrations();
  }, []);

  const loadCelebrations = async () => {
    setLoading(true);
    const data = await celebrationService.getUpcomingCelebrations();
    setCelebrations(data.slice(0, 5));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (celebrations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-purple-500" />
          {t('celebrations.upcomingCelebrations')}
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center"
          >
            {t('common.viewAll')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {celebrations.map((celebration, index) => {
          const daysUntil = Math.ceil(
            (celebration.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );

          return (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg ${
                celebration.isMilestone
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className={`p-2 rounded-full ${
                  celebration.type === 'birthday'
                    ? 'bg-pink-500'
                    : celebration.isMilestone
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                    : 'bg-blue-500'
                }`}>
                  {celebration.type === 'birthday' ? (
                    <Cake className="h-4 w-4 text-white" />
                  ) : (
                    <Trophy className="h-4 w-4 text-white" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {celebration.employeeName}
                    </p>
                    {celebration.isMilestone && (
                      <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
                        {celebration.yearsCount} {t('celebrations.years')}!
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {celebration.type === 'birthday' ? t('celebrations.birthday') : t('celebrations.yearAnniversary', { years: celebration.yearsCount })}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {daysUntil === 0 ? t('celebrations.today') : daysUntil === 1 ? t('celebrations.tomorrow') : t('celebrations.daysCount', { count: daysUntil })}
                </p>
                <p className="text-xs text-gray-500">
                  {celebration.date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {celebrations.length === 5 && onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full mt-4 text-purple-600 hover:text-purple-700 text-sm font-medium"
        >
          {t('celebrations.viewAllCelebrations')} →
        </button>
      )}
    </div>
  );
};

export default UpcomingCelebrationsWidget;
