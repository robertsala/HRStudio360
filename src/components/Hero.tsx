import React, { useState } from 'react';
import { ArrowRight, Bot, Shield, Zap, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const Hero: React.FC = () => {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    try {
      setIsDemoLoading(true);
      await signIn('demo@hrstudio360.com', 'demo123');
      // Navigation will happen automatically via App.tsx useEffect
    } catch (error) {
      console.error('Demo login error:', error);
      alert('Demo login is currently unavailable. Please try again later.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 dark:from-blue-900 dark:via-blue-800 dark:to-emerald-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                {t('hero.title')}
              </h1>
              <p className="text-xl lg:text-2xl text-blue-50 dark:text-blue-100 font-medium">
                {t('hero.subtitle')}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center bg-white/30 dark:bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white font-medium border border-white/40 dark:border-white/30">
                <Bot className="h-4 w-4 mr-2" />
                {t('hero.aiPoweredAutomation')}
              </div>
              <div className="flex items-center bg-white/30 dark:bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white font-medium border border-white/40 dark:border-white/30">
                <Shield className="h-4 w-4 mr-2" />
                {t('hero.enterpriseSecurity')}
              </div>
              <div className="flex items-center bg-white/30 dark:bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white font-medium border border-white/40 dark:border-white/30">
                <Zap className="h-4 w-4 mr-2" />
                {t('hero.smartAnalytics')}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleDemoLogin}
                disabled={isDemoLoading}
                className="bg-emerald-500 text-white px-8 py-4 rounded-lg hover:bg-emerald-600 transition-all transform hover:scale-105 flex items-center justify-center font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-demo-login"
              >
                {isDemoLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Try Demo Account
                  </>
                )}
              </button>
              <button 
                onClick={() => {
                  // Scroll to contact section
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-900 transition-all transform hover:scale-105 flex items-center justify-center font-semibold border border-white/40"
              >
                {t('hero.requestDemo')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  // Scroll to features section
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-900 transition-all font-semibold"
              >
                {t('hero.learnMore')}
              </button>
            </div>
          </div>
          
          <div className="mt-12 lg:mt-0">
            <div className="bg-white/20 dark:bg-white/10 backdrop-blur-lg rounded-2xl p-8 space-y-6 border border-white/30 dark:border-white/20">
              <h3 className="text-2xl font-bold text-center text-white">{t('hero.whyCompaniesChooseUs')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/30 dark:border-white/20">
                  <div className="text-2xl font-bold text-emerald-100 dark:text-emerald-300">50%</div>
                  <div className="text-sm text-white">{t('hero.timeSavings')}</div>
                </div>
                <div className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/30 dark:border-white/20">
                  <div className="text-2xl font-bold text-blue-100 dark:text-blue-300">99.9%</div>
                  <div className="text-sm text-white">{t('hero.accuracyRate')}</div>
                </div>
                <div className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/30 dark:border-white/20">
                  <div className="text-2xl font-bold text-yellow-100 dark:text-yellow-300">24/7</div>
                  <div className="text-sm text-white">{t('hero.aiSupport')}</div>
                </div>
                <div className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/30 dark:border-white/20">
                  <div className="text-2xl font-bold text-emerald-100 dark:text-emerald-300">{t('hero.roi')}</div>
                  <div className="text-sm text-white">{t('hero.guaranteed')}</div>
                </div>
              </div>
              <div className="text-center pt-4 border-t border-white/30 dark:border-white/20">
                <p className="text-blue-50 dark:text-blue-100 text-sm">✨ {t('hero.trustedBy')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;