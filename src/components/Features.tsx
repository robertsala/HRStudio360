import React from 'react';
import { UserPlus, Calendar, DollarSign, Heart, TrendingUp, UserX, Bot, Shield, Zap, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const getFeatureCategories = (t: any) => [
  {
    title: t('features.recruitingOnboarding'),
    icon: UserPlus,
    color: 'bg-blue-100 text-blue-600',
    features: [
      t('features.aiCandidateScreening'),
      t('features.automatedOnboarding'),
      t('features.kanbanRecruitment')
    ]
  },
  {
    title: t('features.employmentOperations'),
    icon: Calendar,
    color: 'bg-emerald-100 text-emerald-600',
    features: [
      t('features.aiAssistantSupport'),
      t('features.smartScheduling'),
      t('features.advancedTimeTracking')
    ]
  },
  {
    title: t('features.payrollProcessing'),
    icon: DollarSign,
    color: 'bg-purple-100 text-purple-600',
    features: [
      t('features.automatedPayroll'),
      t('features.smartOvertime'),
      t('features.integratedTaxFiling')
    ]
  },
  {
    title: t('features.benefitsAdmin'),
    icon: Heart,
    color: 'bg-pink-100 text-pink-600',
    features: [
      t('features.selfServiceBenefits'),
      t('features.automatedDocuments'),
      t('features.cobraAdmin')
    ]
  },
  {
    title: t('features.performanceDevelopment'),
    icon: TrendingUp,
    color: 'bg-yellow-100 text-yellow-600',
    features: [
      t('features.comprehensiveReviews'),
      t('features.skillsTracking'),
      t('features.aiDrivenInsights')
    ]
  },
  {
    title: t('features.offboarding'),
    icon: UserX,
    color: 'bg-gray-100 text-gray-600',
    features: [
      t('features.structuredOffboarding'),
      t('features.taskManagement'),
      t('features.exitInterviews')
    ]
  }
];

const Features: React.FC = () => {
  const { t } = useTranslation();
  const featureCategories = getFeatureCategories(t);

  return (
    <section id="features" className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('features.title')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {featureCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 hover:shadow-lg transition-all transform hover:-translate-y-1">
                <div className="flex items-center mb-6">
                  <div className={`p-3 rounded-lg ${category.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white ml-4">{category.title}</h3>
                </div>
                <ul className="space-y-3">
                  {category.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-gray-600 dark:text-gray-400">
                      <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 mr-3 flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl p-8 lg:p-12 text-white text-center">
          <h3 className="text-2xl lg:text-3xl font-bold mb-6">{t('advantagesAI.title')}</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center">
              <Bot className="h-12 w-12 mb-3" />
              <h4 className="font-semibold mb-2">{t('advantagesAI.intelligentAutomation')}</h4>
              <p className="text-sm opacity-90">{t('advantagesAI.intelligentAutomationDesc')}</p>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="h-12 w-12 mb-3" />
              <h4 className="font-semibold mb-2">{t('advantagesAI.complianceAssurance')}</h4>
              <p className="text-sm opacity-90">{t('advantagesAI.complianceAssuranceDesc')}</p>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="h-12 w-12 mb-3" />
              <h4 className="font-semibold mb-2">{t('advantagesAI.predictiveInsights')}</h4>
              <p className="text-sm opacity-90">{t('advantagesAI.predictiveInsightsDesc')}</p>
            </div>
            <div className="flex flex-col items-center">
              <Globe className="h-12 w-12 mb-3" />
              <h4 className="font-semibold mb-2">{t('advantagesAI.globalScale')}</h4>
              <p className="text-sm opacity-90">{t('advantagesAI.globalScaleDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;