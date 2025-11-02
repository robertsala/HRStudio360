import React from 'react';
import { X, Eye, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const ImpersonationBanner: React.FC = () => {
  const { t } = useTranslation();
  const { isImpersonating, impersonatedUser, actualUser, stopImpersonation } = useAuth();

  if (!isImpersonating || !impersonatedUser || !actualUser) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white z-[100] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <Eye className="h-5 w-5" />
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <div>
                <p className="font-semibold text-sm">
                  {t('impersonation.viewingAs')} <span className="font-bold">{impersonatedUser.name}</span> ({impersonatedUser.email})
                </p>
                <p className="text-xs text-purple-100">
                  {t('impersonation.youAreLoggedInAs', { name: actualUser.name })}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={stopImpersonation}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
          >
            <X className="h-4 w-4" />
            <span>{t('impersonation.exitViewAs')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
