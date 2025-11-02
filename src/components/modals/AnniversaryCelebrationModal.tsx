import React, { useEffect, useState } from 'react';
import { X, Award, Trophy, Star, Medal, Shield } from 'lucide-react';
import ConfettiAnimation from '../ConfettiAnimation';
import FireworksAnimation from '../animations/FireworksAnimation';
import SparkleAnimation from '../animations/SparkleAnimation';
import { CelebrationData } from '../../utils/celebrationService';

interface AnniversaryCelebrationModalProps {
  celebration: CelebrationData;
  employeeName: string;
  onClose: () => void;
}

const AnniversaryCelebrationModal: React.FC<AnniversaryCelebrationModalProps> = ({
  celebration,
  employeeName,
  onClose
}) => {
  const [showAnimations, setShowAnimations] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowAnimations(true), 100);
    setTimeout(() => setShowBadge(true), celebration.isMilestone ? 1500 : 1000);
    setTimeout(() => setCanClose(true), celebration.isMilestone ? 3000 : 2000);
  }, [celebration.isMilestone]);

  const firstName = employeeName.split(' ')[0];
  const badgeInfo = celebration.badgeInfo;

  const getBadgeIcon = () => {
    if (!badgeInfo) return Trophy;
    switch (badgeInfo.icon) {
      case 'Award': return Award;
      case 'Trophy': return Trophy;
      case 'Star': return Star;
      case 'Medal': return Medal;
      case 'Shield': return Shield;
      default: return Trophy;
    }
  };

  const BadgeIcon = getBadgeIcon();

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${
            celebration.isMilestone
              ? 'from-yellow-400 via-orange-400 to-red-500'
              : 'from-blue-400 via-indigo-400 to-purple-500'
          } opacity-10`} />

          {canClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
          )}

          <div className="relative p-12 text-center">
            <h1 className={`${
              celebration.isMilestone ? 'text-7xl' : 'text-5xl'
            } font-bold mb-4 bg-gradient-to-r ${
              celebration.isMilestone
                ? 'from-yellow-500 via-orange-500 to-red-500'
                : 'from-blue-600 via-indigo-600 to-purple-600'
            } bg-clip-text text-transparent ${
              celebration.isMilestone ? 'animate-pulse' : ''
            }`}>
              {celebration.message.title}
            </h1>

            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              {firstName}! 🎊
            </h2>

            {celebration.isMilestone && (
              <div className="flex items-center justify-center space-x-2 mb-6">
                <div className="h-1 w-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full" />
                <Star className="h-6 w-6 text-yellow-500" fill="currentColor" />
                <span className="text-lg font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300 uppercase tracking-wider">
                  Milestone Achievement
                </span>
                <Star className="h-6 w-6 text-yellow-500" fill="currentColor" />
                <div className="h-1 w-16 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full" />
              </div>
            )}

            <div className={`transform transition-all duration-1000 ${
              showBadge ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            } mb-8`}>
              <div className="relative inline-block">
                <div className={`relative p-8 rounded-full ${
                  celebration.isMilestone ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400' : 'bg-gradient-to-br from-blue-400 to-purple-500'
                } shadow-2xl`}>
                  {celebration.isMilestone && (
                    <div className="absolute inset-0 rounded-full animate-ping opacity-50"
                      style={{
                        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, transparent 70%)'
                      }}
                    />
                  )}
                  <BadgeIcon
                    className={`${
                      celebration.isMilestone ? 'h-32 w-32' : 'h-24 w-24'
                    } text-white relative z-10`}
                  />
                </div>

                {badgeInfo && (
                  <div className="mt-6 bg-white dark:bg-gray-800 dark:bg-gray-800 bg-opacity-90 rounded-2xl p-6 shadow-lg">
                    <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-2 ${
                      celebration.isMilestone ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {badgeInfo.tierName} Tier
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {badgeInfo.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {badgeInfo.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 bg-opacity-50 rounded-2xl p-6 backdrop-blur-sm mb-8 max-w-2xl mx-auto">
              <p className="text-xl text-gray-700 dark:text-gray-300 dark:text-gray-300 leading-relaxed">
                {celebration.message.body}
              </p>
            </div>

            {celebration.isMilestone && (
              <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-300">
                <p className="text-lg font-semibold text-gray-800 mb-2">
                  🌟 Your Journey with Us 🌟
                </p>
                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">
                  From your first day to today, you've been an integral part of our success.
                  Thank you for your unwavering commitment and exceptional contributions!
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              disabled={!canClose}
              className={`${
                canClose ? 'opacity-100' : 'opacity-50 cursor-not-allowed'
              } bg-gradient-to-r ${
                celebration.isMilestone
                  ? 'from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600'
                  : 'from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600'
              } text-white px-10 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200`}
            >
              {canClose ? 'Continue to Dashboard' : 'Please wait...'}
            </button>

            <p className="text-sm text-gray-500 mt-4">
              Your badge has been added to your Achievements • Replay anytime from notifications
            </p>
          </div>
        </div>
      </div>

      <ConfettiAnimation show={showAnimations} />
      {celebration.isMilestone ? (
        <>
          <FireworksAnimation show={showAnimations} isMilestone={true} />
          <SparkleAnimation show={showAnimations} color="#FFD700" />
        </>
      ) : (
        <FireworksAnimation show={showAnimations} isMilestone={false} />
      )}
    </>
  );
};

export default AnniversaryCelebrationModal;
