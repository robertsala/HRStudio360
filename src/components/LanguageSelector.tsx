import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: t('language.english'), flag: '🇺🇸' },
    { code: 'es', name: t('language.spanish'), flag: '🇪🇸' }
  ];

  const changeLanguage = async (langCode: string) => {
    await i18n.changeLanguage(langCode);
    setIsOpen(false);

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ preferred_language: langCode })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium"
        aria-label={t('language.selectLanguage')}
      >
        <Globe className="h-5 w-5" />
        <span className="hidden sm:inline">{languages.find(l => l.code === i18n.language)?.flag}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">{t('language.selectLanguage')}</p>
            </div>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors ${
                  i18n.language === lang.code ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className={`font-medium ${
                    i18n.language === lang.code ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {lang.name}
                  </span>
                </div>
                {i18n.language === lang.code && (
                  <Check className="h-5 w-5 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
