import React from 'react';
import { Target, Cpu, Globe as Globe2, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const getAdvantages = (t: any) => [
  {
    icon: Target,
    title: t('advantages.endToEndCoverage'),
    description: t('advantages.endToEndDesc'),
    benefits: [
      t('advantages.unifiedRecruitment'),
      t('advantages.comprehensiveManagement'),
      t('advantages.streamlinedOffboarding')
    ]
  },
  {
    icon: Cpu,
    title: t('advantages.aiCoreEngine'),
    description: t('advantages.aiCoreDesc'),
    benefits: [
      t('advantages.intelligentAutomation'),
      t('advantages.predictiveAnalytics'),
      t('advantages.timeSavings')
    ]
  },
  {
    icon: Globe2,
    title: t('advantages.scalableGlobal'),
    description: t('advantages.scalableGlobalDesc'),
    benefits: [
      t('advantages.multiLocationSupport'),
      t('advantages.automatedCompliance'),
      t('advantages.remoteWorkforce')
    ]
  },
  {
    icon: Smartphone,
    title: t('advantages.userCentricDesign'),
    description: t('advantages.userCentricDesc'),
    benefits: [
      t('advantages.intuitiveExperience'),
      t('advantages.mobileFirst'),
      t('advantages.selfServiceTools')
    ]
  }
];

const Advantages: React.FC = () => {
  const { t } = useTranslation();
  const advantages = getAdvantages(t);

  return (
    <section id="advantages" className="py-20 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            {t('advantages.title')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t('advantages.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {advantages.map((advantage, index) => {
            const Icon = advantage.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-8 hover:shadow-lg dark:hover:bg-gray-750 transition-all">
                <div className="flex items-start mb-6">
                  <div className="bg-emerald-600 p-3 rounded-lg">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold mb-2">{advantage.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{advantage.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {advantage.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center text-emerald-700 dark:text-emerald-300">
                      <div className="h-2 w-2 rounded-full bg-emerald-600 mr-3"></div>
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Advantages;