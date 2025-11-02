import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Users, UserMinus, Calendar, DollarSign, Clock, Target, Award, AlertCircle, CheckCircle, Activity, BarChart3, PieChart, RefreshCw } from 'lucide-react';
import DonutChart from '../charts/DonutChart';
import BarChart from '../charts/BarChart';
import LineChart from '../charts/LineChart';

interface HRKPIDashboardModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

const HRKPIDashboardModal: React.FC<HRKPIDashboardModalProps> = ({ isOpen = true, onClose }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'recruitment' | 'turnover' | 'performance'>('overview');

  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Mock KPI Data
  const kpiData = {
    headcount: {
      current: 247,
      previous: 235,
      change: 5.1,
      fullTime: 215,
      partTime: 22,
      contractors: 10
    },
    turnover: {
      rate: 12.3,
      previous: 14.8,
      change: -2.5,
      voluntary: 8.5,
      involuntary: 3.8,
      regrettable: 4.2
    },
    recruitment: {
      timeToHire: 28,
      previous: 35,
      change: -7,
      costPerHire: 4250,
      offerAcceptance: 87,
      openPositions: 12
    },
    absenteeism: {
      rate: 2.8,
      previous: 3.2,
      change: -0.4,
      avgDaysPerEmployee: 3.2,
      topReasons: [
        { reason: 'Sick Leave', percentage: 45 },
        { reason: 'Personal', percentage: 25 },
        { reason: 'Family Emergency', percentage: 20 },
        { reason: 'Other', percentage: 10 }
      ]
    },
    engagement: {
      score: 7.8,
      previous: 7.3,
      change: 0.5,
      eNPS: 42,
      satisfaction: 82
    },
    diversity: {
      genderRatio: { male: 52, female: 46, other: 2 },
      avgAge: 34.5,
      departments: [
        { name: 'Engineering', headcount: 85 },
        { name: 'Sales', headcount: 45 },
        { name: 'Marketing', headcount: 32 },
        { name: 'HR', headcount: 18 },
        { name: 'Finance', headcount: 25 },
        { name: 'Operations', headcount: 42 }
      ]
    },
    compensation: {
      avgSalary: 75000,
      payEquityRatio: 0.98,
      totalPayroll: 18525000,
      benefitsCost: 3705000
    },
    training: {
      hoursPerEmployee: 24,
      completionRate: 89,
      costPerEmployee: 1250,
      totalInvestment: 308750
    },
    headcountTrend: [
      { label: 'Jan', value: 220 },
      { label: 'Feb', value: 225 },
      { label: 'Mar', value: 230 },
      { label: 'Apr', value: 235 },
      { label: 'May', value: 240 },
      { label: 'Jun', value: 247 }
    ],
    turnoverTrend: [
      { label: 'Jan', value: 16.2 },
      { label: 'Feb', value: 15.8 },
      { label: 'Mar', value: 14.5 },
      { label: 'Apr', value: 14.8 },
      { label: 'May', value: 13.1 },
      { label: 'Jun', value: 12.3 }
    ]
  };

  const renderKPICard = (title: string, value: string | number, previousValue: number, unit: string, icon: React.ElementType, color: string, change?: number) => {
    const isPositive = change ? change > 0 : false;
    const Icon = icon;

    return (
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-sm font-medium">{Math.abs(change)}{unit === '%' ? '%' : ''}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white">{value}{unit}</p>
          <p className="text-xs text-gray-500 mt-1">vs. previous period: {previousValue}{unit}</p>
        </div>
      </div>
    );
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderKPICard(
          'Total Headcount',
          kpiData.headcount.current,
          kpiData.headcount.previous,
          '',
          Users,
          'bg-blue-600',
          kpiData.headcount.change
        )}
        {renderKPICard(
          'Turnover Rate',
          kpiData.turnover.rate,
          kpiData.turnover.previous,
          '%',
          UserMinus,
          'bg-red-600',
          kpiData.turnover.change
        )}
        {renderKPICard(
          'Time to Hire',
          kpiData.recruitment.timeToHire,
          kpiData.recruitment.previous,
          ' days',
          Clock,
          'bg-emerald-600',
          kpiData.recruitment.change
        )}
        {renderKPICard(
          'Engagement Score',
          kpiData.engagement.score,
          kpiData.engagement.previous,
          '/10',
          Award,
          'bg-purple-600',
          kpiData.engagement.change
        )}
      </div>

      {/* Workforce Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-blue-600" />
            Workforce Composition
          </h3>
          <DonutChart
            data={[
              { label: 'Full-Time', value: kpiData.headcount.fullTime, color: '#3b82f6' },
              { label: 'Part-Time', value: kpiData.headcount.partTime, color: '#10b981' },
              { label: 'Contractors', value: kpiData.headcount.contractors, color: '#8b5cf6' }
            ]}
            centerText={kpiData.headcount.current.toString()}
            centerSubtext="Total"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-emerald-600" />
            Department Headcount
          </h3>
          <BarChart
            data={kpiData.diversity.departments.map(dept => ({
              label: dept.name,
              value: dept.headcount,
              color: '#10b981'
            }))}
            height={240}
          />
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Headcount Growth Trend
          </h3>
          <LineChart
            data={kpiData.headcountTrend}
            color="#3b82f6"
            height={180}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4 flex items-center">
            <TrendingDown className="h-5 w-5 mr-2 text-green-600" />
            Turnover Rate Trend
          </h3>
          <LineChart
            data={kpiData.turnoverTrend}
            color="#10b981"
            height={180}
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Absenteeism Breakdown</h3>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{kpiData.absenteeism.rate}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Rate</p>
            </div>
            <div className="pt-3">
              <BarChart
                data={kpiData.absenteeism.topReasons.map(reason => ({
                  label: reason.reason,
                  value: reason.percentage,
                  color: '#f59e0b'
                }))}
                height={160}
                showValues={true}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Compensation</h3>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">${(kpiData.compensation.avgSalary / 1000).toFixed(0)}K</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Salary</p>
            </div>
            <div className="pt-3 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Pay Equity Ratio</span>
                <span className="font-medium">{kpiData.compensation.payEquityRatio}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Payroll</span>
                <span className="font-medium">${(kpiData.compensation.totalPayroll / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Training & Development</h3>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{kpiData.training.hoursPerEmployee}h</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Hours/Employee</p>
            </div>
            <div className="pt-3 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
                <span className="font-medium">{kpiData.training.completionRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Investment</span>
                <span className="font-medium">${(kpiData.training.totalInvestment / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecruitmentTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderKPICard(
          'Time to Hire',
          kpiData.recruitment.timeToHire,
          kpiData.recruitment.previous,
          ' days',
          Clock,
          'bg-blue-600',
          kpiData.recruitment.change
        )}
        {renderKPICard(
          'Cost Per Hire',
          `$${kpiData.recruitment.costPerHire}`,
          4800,
          '',
          DollarSign,
          'bg-emerald-600'
        )}
        {renderKPICard(
          'Offer Acceptance',
          kpiData.recruitment.offerAcceptance,
          82,
          '%',
          CheckCircle,
          'bg-purple-600'
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Recruitment Funnel</h3>
        <div className="space-y-4">
          {[
            { stage: 'Applications Received', count: 450, percentage: 100 },
            { stage: 'Screening Passed', count: 180, percentage: 40 },
            { stage: 'Interviews Scheduled', count: 95, percentage: 21 },
            { stage: 'Offers Extended', count: 35, percentage: 8 },
            { stage: 'Offers Accepted', count: 28, percentage: 6 }
          ].map((item, index) => (
            <div key={index}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white dark:text-white">{item.stage}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.count} ({item.percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${item.percentage}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Open Positions by Department</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { dept: 'Engineering', count: 5 },
            { dept: 'Sales', count: 3 },
            { dept: 'Marketing', count: 2 },
            { dept: 'Operations', count: 1 },
            { dept: 'Finance', count: 1 }
          ].map((item, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{item.count}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.dept}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTurnoverTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderKPICard(
          'Overall Turnover',
          kpiData.turnover.rate,
          kpiData.turnover.previous,
          '%',
          UserMinus,
          'bg-red-600',
          kpiData.turnover.change
        )}
        {renderKPICard(
          'Voluntary Turnover',
          kpiData.turnover.voluntary,
          10.2,
          '%',
          TrendingDown,
          'bg-orange-600'
        )}
        {renderKPICard(
          'Regrettable Turnover',
          kpiData.turnover.regrettable,
          5.8,
          '%',
          AlertCircle,
          'bg-yellow-600'
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Turnover by Department</h3>
          <div className="space-y-4">
            {[
              { dept: 'Sales', rate: 18.5, trend: 'up' },
              { dept: 'Engineering', rate: 9.2, trend: 'down' },
              { dept: 'Marketing', rate: 12.8, trend: 'up' },
              { dept: 'Operations', rate: 11.3, trend: 'stable' },
              { dept: 'Finance', rate: 7.1, trend: 'down' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white dark:text-white">{item.dept}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.rate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.rate > 15 ? 'bg-red-600' : item.rate > 10 ? 'bg-yellow-600' : 'bg-green-600'}`}
                      style={{ width: `${(item.rate / 20) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-4">
                  {item.trend === 'up' && <TrendingUp className="h-4 w-4 text-red-600" />}
                  {item.trend === 'down' && <TrendingDown className="h-4 w-4 text-green-600" />}
                  {item.trend === 'stable' && <Activity className="h-4 w-4 text-gray-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Exit Reasons</h3>
          <div className="space-y-3">
            {[
              { reason: 'Better Opportunity', percentage: 35, count: 12 },
              { reason: 'Compensation', percentage: 25, count: 9 },
              { reason: 'Work-Life Balance', percentage: 18, count: 6 },
              { reason: 'Career Growth', percentage: 12, count: 4 },
              { reason: 'Management Issues', percentage: 10, count: 3 }
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-900 dark:text-white dark:text-white">{item.reason}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900 mb-1">Action Required</h4>
            <p className="text-sm text-yellow-800">
              Sales department turnover is 50% above company average. Consider conducting stay interviews and reviewing compensation packages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {renderKPICard(
          'Avg Performance Score',
          4.2,
          4.0,
          '/5',
          Target,
          'bg-blue-600',
          0.2
        )}
        {renderKPICard(
          'Review Completion',
          94,
          89,
          '%',
          CheckCircle,
          'bg-emerald-600',
          5
        )}
        {renderKPICard(
          'High Performers',
          67,
          62,
          '',
          Award,
          'bg-purple-600',
          5
        )}
        {renderKPICard(
          'Training Completion',
          kpiData.training.completionRate,
          85,
          '%',
          Activity,
          'bg-orange-600',
          4
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Performance Distribution</h3>
          <div className="space-y-4">
            {[
              { rating: 'Exceptional (5)', count: 28, percentage: 11, color: 'bg-green-600' },
              { rating: 'Exceeds (4)', count: 95, percentage: 38, color: 'bg-blue-600' },
              { rating: 'Meets (3)', count: 102, percentage: 41, color: 'bg-gray-400' },
              { rating: 'Needs Improvement (2)', count: 18, percentage: 7, color: 'bg-yellow-600' },
              { rating: 'Unsatisfactory (1)', count: 4, percentage: 2, color: 'bg-red-600' }
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-900 dark:text-white dark:text-white">{item.rating}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className={`${item.color} h-3 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Goal Achievement Rate</h3>
          <div className="space-y-4">
            {kpiData.diversity.departments.map((dept, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-900 dark:text-white dark:text-white">{dept.name}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{75 + Math.floor(Math.random() * 20)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${75 + Math.floor(Math.random() * 20)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Insight</h4>
            <p className="text-sm text-blue-800">
              67 employees have consistently exceeded expectations. Consider them for leadership development programs or promotions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-t-xl">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">HR KPI Dashboard</h2>
              <p className="text-blue-100">Executive HR Metrics & Analytics</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-4 py-2 bg-white dark:bg-gray-800 dark:bg-gray-800/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button className="p-2 hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20 rounded-lg transition-colors">
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'recruitment', label: 'Recruitment', icon: Users },
              { id: 'turnover', label: 'Turnover & Retention', icon: UserMinus },
              { id: 'performance', label: 'Performance', icon: Target }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                    selectedTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTab === 'overview' && renderOverviewTab()}
          {selectedTab === 'recruitment' && renderRecruitmentTab()}
          {selectedTab === 'turnover' && renderTurnoverTab()}
          {selectedTab === 'performance' && renderPerformanceTab()}
        </div>
      </div>
    </div>
  );
};

export default HRKPIDashboardModal;
