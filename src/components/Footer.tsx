import React from 'react';
import { Users, Linkedin, Twitter, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              <span className="ml-2 text-xl font-bold">HRStudio360</span>
            </div>
            <p className="text-gray-300 dark:text-gray-400">
              {t('footer.tagline')}
            </p>
            <div className="flex space-x-4">
              <Linkedin className="h-5 w-5 text-gray-300 dark:text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Twitter className="h-5 w-5 text-gray-300 dark:text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Mail className="h-5 w-5 text-gray-300 dark:text-gray-400 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.platform')}</h4>
            <ul className="space-y-2 text-gray-300 dark:text-gray-400">
              <li><a href="#features" className="hover:text-white transition-colors">{t('footer.hrManagement')}</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">{t('footer.payrollProcessing')}</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">{t('footer.benefitsAdmin')}</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">{t('footer.aiAnalytics')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.company')}</h4>
            <ul className="space-y-2 text-gray-300 dark:text-gray-400">
              <li><a href="#advantages" className="hover:text-white transition-colors">{t('footer.aboutUs')}</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">{t('footer.careers')}</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">{t('footer.blog')}</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">{t('footer.press')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.support')}</h4>
            <ul className="space-y-2 text-gray-300 dark:text-gray-400">
              <li><a href="#contact" className="hover:text-white transition-colors">{t('footer.documentation')}</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">{t('footer.helpCenter')}</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">{t('footer.contactSupport')}</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">{t('footer.systemStatus')}</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 dark:border-gray-800 mt-8 pt-8 text-center text-gray-300 dark:text-gray-400">
          <p>{t('footer.copyright')} | {t('footer.privacyPolicy')} | {t('footer.termsOfService')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
