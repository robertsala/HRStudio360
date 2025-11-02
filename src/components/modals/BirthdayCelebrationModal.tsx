import React, { useEffect, useState } from 'react';
import { X, Cake, Gift } from 'lucide-react';
import ConfettiAnimation from '../ConfettiAnimation';
import BalloonAnimation from '../animations/BalloonAnimation';
import SparkleAnimation from '../animations/SparkleAnimation';
import { CelebrationData } from '../../utils/celebrationService';

interface BirthdayCelebrationModalProps {
  celebration: CelebrationData;
  employeeName: string;
  onClose: () => void;
}

const BirthdayCelebrationModal: React.FC<BirthdayCelebrationModalProps> = ({
  celebration,
  employeeName,
  onClose
}) => {
  const [showAnimations, setShowAnimations] = useState(false);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowAnimations(true), 100);
    setTimeout(() => setCanClose(true), 2000);
  }, []);

  const firstName = employeeName.split(' ')[0];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${
            celebration.isMilestone
              ? 'from-purple-500 via-pink-500 to-red-500'
              : 'from-blue-400 via-purple-400 to-pink-400'
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
            <div className="mb-8 flex justify-center">
              <div className={`relative ${
                celebration.isMilestone ? 'animate-bounce' : ''
              }`}>
                <Cake className={`${
                  celebration.isMilestone ? 'h-32 w-32' : 'h-24 w-24'
                } text-pink-500`} />
                {celebration.isMilestone && (
                  <div className="absolute inset-0 animate-ping">
                    <Cake className="h-32 w-32 text-pink-300 opacity-50" />
                  </div>
                )}
              </div>
            </div>

            <h1 className={`${
              celebration.isMilestone ? 'text-6xl' : 'text-5xl'
            } font-bold mb-4 bg-gradient-to-r ${
              celebration.isMilestone
                ? 'from-purple-600 via-pink-600 to-red-600'
                : 'from-blue-600 via-purple-600 to-pink-600'
            } bg-clip-text text-transparent animate-pulse`}>
              {celebration.message.title}
            </h1>

            <h2 className="text-3xl font-semibold text-gray-800 mb-6">
              {firstName}! 🎉
            </h2>

            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 bg-opacity-50 rounded-2xl p-6 backdrop-blur-sm mb-8">
              <p className="text-xl text-gray-700 dark:text-gray-300 dark:text-gray-300 leading-relaxed">
                {celebration.message.body}
              </p>
            </div>

            {celebration.isMilestone && (
              <div className="flex items-center justify-center space-x-4 mb-8">
                <Gift className="h-8 w-8 text-purple-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300">
                  What a special milestone!
                </span>
                <Gift className="h-8 w-8 text-pink-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}

            <button
              onClick={onClose}
              disabled={!canClose}
              className={`${
                canClose ? 'opacity-100' : 'opacity-50 cursor-not-allowed'
              } bg-gradient-to-r ${
                celebration.isMilestone
                  ? 'from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600'
                  : 'from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600'
              } text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
            >
              {canClose ? 'Continue to Dashboard' : 'Please wait...'}
            </button>

            <p className="text-sm text-gray-500 mt-4">
              You can replay this celebration from your notifications
            </p>
          </div>
        </div>
      </div>

      <ConfettiAnimation show={showAnimations} />
      <BalloonAnimation show={showAnimations} count={celebration.isMilestone ? 30 : 20} />
      {celebration.isMilestone && <SparkleAnimation show={showAnimations} />}
    </>
  );
};

export default BirthdayCelebrationModal;
