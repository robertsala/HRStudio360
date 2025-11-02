import React from 'react';
import { AlertTriangle, Database, Clock, Users, FileText, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const getProblems = (t: any) => [
  {
    icon: Database,
    title: t('problems.integrationGaps'),
    description: t('problems.integrationGapsDesc')
  },
  {
    icon: AlertTriangle,
    title: t('problems.complianceRisk'),
    description: t('problems.complianceRiskDesc')
  },
  {
    icon: FileText,
    title: t('problems.payrollErrors'),
    description: t('problems.payrollErrorsDesc')
  },
  {
    icon: Users,
    title: t('problems.poorEmployeeExperience'),
    description: t('problems.poorEmployeeExperienceDesc')
  },
  {
    icon: Clock,
    title: t('problems.administrativeOverload'),
    description: t('problems.administrativeOverloadDesc')
  },
  {
    icon: TrendingDown,
    title: t('problems.retentionIssues'),
    description: t('problems.retentionIssuesDesc')
  }
];

const Problems: React.FC = () => {
  const { t } = useTranslation();
  const problems = getProblems(t);

  return (
    <section id="solutions" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('problems.title')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t('problems.subtitle')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Icon className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white ml-4">{problem.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{problem.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Problems;