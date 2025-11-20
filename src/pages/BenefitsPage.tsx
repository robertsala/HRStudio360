import React, { useState, useEffect } from 'react';
import { DollarSign, Heart, Download, Eye, TrendingUp, Award, Sparkles, RefreshCw, Clock, Info, X } from 'lucide-react';
import { generatePayStubPDF, generateW2PDF } from '../utils/pdfGenerator';
import { getRandomFunFact, getCategoryIcon, getManualFunFact, getDailyUsageInfo, type FunFactResult, type DailyUsageInfo } from '../utils/paycheckFunFacts';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardEscape } from '../hooks/useDashboardEscape';
import { DashboardExitButton } from '../components/DashboardExitButton';

const BenefitsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPayStub, setSelectedPayStub] = useState<any>(null);
  const [selectedW2, setSelectedW2] = useState<any>(null);
  const [selectedBenefit, setSelectedBenefit] = useState<any>(null);
  const [showModifyEnrollment, setShowModifyEnrollment] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [funFacts, setFunFacts] = useState<{ [key: string]: FunFactResult | null }>({});
  const [loadingFunFacts, setLoadingFunFacts] = useState<{ [key: string]: boolean }>({});
  const [dailyUsage, setDailyUsage] = useState<DailyUsageInfo | null>(null);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  // ESC key handling - close nested modals first before navigating away
  useDashboardEscape(() => {
    if (showModifyEnrollment) {
      setShowModifyEnrollment(false);
      return false;
    }
    if (selectedBenefit) {
      setSelectedBenefit(null);
      return false;
    }
    if (selectedW2) {
      setSelectedW2(null);
      return false;
    }
    if (selectedPayStub) {
      setSelectedPayStub(null);
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (user?.id) {
      setCurrentEmployeeId(user.id);
    }
  }, [user]);

  useEffect(() => {
    const loadDailyUsage = async () => {
      if (currentEmployeeId) {
        const usage = await getDailyUsageInfo(currentEmployeeId);
        setDailyUsage(usage);
      }
    };

    if (currentEmployeeId) {
      loadDailyUsage();
    }
  }, [currentEmployeeId]);

  useEffect(() => {
    const loadFunFacts = async () => {
      if (!currentEmployeeId) return;
      
      for (const payStub of mockPayStubs) {
        if (!funFacts[payStub.id]) {
          const funFact = await getRandomFunFact(payStub.netPay, currentEmployeeId);
          setFunFacts(prev => ({ ...prev, [payStub.id]: funFact }));
        }
      }
    };

    if (activeTab === 'paystubs' && currentEmployeeId) {
      loadFunFacts();
    }
  }, [activeTab, currentEmployeeId]);

  const refreshFunFact = async (payStubId: string, netPay: number) => {
    if (!currentEmployeeId) {
      setNotification({
        type: 'error',
        message: 'Unable to generate fun fact. Please try again.'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (dailyUsage?.hasReachedLimit) {
      setNotification({
        type: 'info',
        message: "You've reached your fun fact limit for today. Come back tomorrow for more!"
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setLoadingFunFacts(prev => ({ ...prev, [payStubId]: true }));

    const result = await getManualFunFact(netPay, currentEmployeeId);

    if (result.funFact) {
      setFunFacts(prev => ({ ...prev, [payStubId]: result.funFact }));
      setDailyUsage(result.usageInfo);

      if (result.usageInfo.hasReachedLimit) {
        setNotification({
          type: 'info',
          message: "That was your last fun fact for today! Come back tomorrow for more."
        });
        setTimeout(() => setNotification(null), 4000);
      }
    } else if (result.usageInfo.hasReachedLimit) {
      setNotification({
        type: 'info',
        message: "You've reached your fun fact limit for today. Come back tomorrow!"
      });
      setTimeout(() => setNotification(null), 4000);
    } else {
      setNotification({
        type: 'error',
        message: 'Unable to generate fun fact. Please try again.'
      });
      setTimeout(() => setNotification(null), 3000);
    }

    setLoadingFunFacts(prev => ({ ...prev, [payStubId]: false }));
  };

  const mockPayStubs = [
    {
      id: '1',
      payPeriod: 'January 1-15, 2025',
      payDate: '2025-01-20',
      grossPay: 4166.67,
      netPay: 3125.50,
      regularHours: 80,
      overtimeHours: 0,
      regularRate: 48.08,
      overtimeRate: 72.12,
      regularPay: 3846.40,
      overtimePay: 0,
      deductions: {
        federalTax: 625.00,
        stateTax: 208.33,
        socialSecurity: 258.33,
        medicare: 60.42,
        healthInsurance: 125.00,
        dentalInsurance: 25.00,
        visionInsurance: 15.00,
        retirement401k: 208.33,
        lifeInsurance: 12.50,
        disabilityInsurance: 8.33,
        parking: 50.00,
        other: 0
      }
    },
    {
      id: '2',
      payPeriod: 'December 16-31, 2024',
      payDate: '2025-01-05',
      grossPay: 4166.67,
      netPay: 3089.25,
      regularHours: 80,
      overtimeHours: 4,
      regularRate: 48.08,
      overtimeRate: 72.12,
      regularPay: 3846.40,
      overtimePay: 288.48,
      deductions: {
        federalTax: 650.00,
        stateTax: 215.00,
        socialSecurity: 265.00,
        medicare: 62.00,
        healthInsurance: 125.00,
        dentalInsurance: 25.00,
        visionInsurance: 15.00,
        retirement401k: 208.33,
        lifeInsurance: 12.50,
        disabilityInsurance: 8.33,
        parking: 50.00,
        other: 0
      }
    }
  ];

  const mockW2Forms = [
    {
      id: '1',
      taxYear: '2024',
      wages: 98000,
      federalTax: 14700,
      socialSecurityWages: 98000,
      socialSecurityTax: 6076,
      medicareWages: 98000,
      medicareTax: 1421,
      stateWages: 98000,
      stateTax: 4900,
      retirementPlan: 4900
    }
  ];

  const mockBenefits = [
    {
      id: '1',
      name: 'Health Insurance',
      plan: 'Blue Cross Blue Shield PPO',
      coverage: 'Employee + Family',
      employeeCost: 125,
      employerCost: 450,
      status: 'Active',
      effectiveDate: '2025-01-01',
      description: 'Comprehensive health coverage with nationwide network'
    },
    {
      id: '2',
      name: 'Dental Insurance',
      plan: 'Delta Dental PPO',
      coverage: 'Employee + Family',
      employeeCost: 25,
      employerCost: 75,
      status: 'Active',
      effectiveDate: '2025-01-01',
      description: 'Preventive and restorative dental care'
    },
    {
      id: '3',
      name: '401(k) Retirement Plan',
      plan: 'Fidelity 401(k)',
      coverage: 'Employee',
      employeeCost: 208.33,
      employerCost: 104.17,
      status: 'Active',
      effectiveDate: '2025-01-01',
      description: '5% employee contribution with 50% company match'
    }
  ];

  const handleDownloadPayStub = (payStub: any) => {
    const funFact = funFacts[payStub.id];
    const payStubData = {
      employeeName: 'Current User',
      employeeId: 'EMP001',
      employeeAddress: '123 Main St, Anytown, ST 12345',
      payPeriod: payStub.payPeriod,
      payDate: payStub.payDate,
      grossPay: payStub.grossPay,
      netPay: payStub.netPay,
      regularHours: payStub.regularHours,
      overtimeHours: payStub.overtimeHours,
      regularRate: payStub.regularRate,
      overtimeRate: payStub.overtimeRate,
      regularPay: payStub.regularPay,
      overtimePay: payStub.overtimePay,
      deductions: payStub.deductions,
      funFact: funFact?.text,
      ytdTotals: {
        grossPay: 98000,
        netPay: 73500,
        federalTax: 14700,
        stateTax: 4900,
        socialSecurity: 6076,
        medicare: 1421,
        totalDeductions: 24500
      },
      companyInfo: {
        name: 'HRStudio360',
        address: '123 Business Ave',
        city: 'Amherst',
        state: 'NH',
        zipCode: '03031',
        phone: '1-800-HR-STUDIO',
        ein: '12-3456789'
      }
    };

    generatePayStubPDF(payStubData);
    
    setNotification({
      type: 'success',
      message: 'Pay stub downloaded successfully!'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDownloadW2 = (w2: any) => {
    const w2Data = {
      taxYear: w2.taxYear,
      employer: {
        name: 'HRStudio360',
        address: '123 Business Ave',
        city: 'Amherst',
        state: 'NH',
        zipCode: '03031',
        ein: '12-3456789'
      },
      employee: {
        name: 'Current User',
        address: '123 Main St',
        city: 'Anytown',
        state: 'ST',
        zipCode: '12345',
        ssn: 'XXX-XX-1234'
      },
      wages: w2.wages,
      federalTax: w2.federalTax,
      socialSecurityWages: w2.socialSecurityWages,
      socialSecurityTax: w2.socialSecurityTax,
      medicareWages: w2.medicareWages,
      medicareTax: w2.medicareTax,
      stateWages: w2.stateWages,
      stateTax: w2.stateTax,
      retirementPlan: w2.retirementPlan
    };

    generateW2PDF(w2Data);
    
    setNotification({
      type: 'success',
      message: 'W-2 form downloaded successfully!'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'paystubs', label: 'Pay Statements', icon: DollarSign },
    { id: 'benefits', label: 'Benefits', icon: Heart },
    { id: 'compensation', label: 'Compensation', icon: Award }
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 mr-3" />
              <div>
                <h2 className="text-2xl font-bold" data-testid="text-page-title">Pay & Benefits</h2>
                <p className="text-emerald-100">Access your compensation and benefits information</p>
              </div>
            </div>
            <DashboardExitButton className="text-emerald-100 hover:text-white" />
          </div>

          {notification && (
            <div className={`p-4 border-b ${
              notification.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
              notification.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
              'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            }`}>
              <p className={`text-sm ${
                notification.type === 'success' ? 'text-green-700 dark:text-green-300' :
                notification.type === 'error' ? 'text-red-700 dark:text-red-300' :
                'text-blue-700 dark:text-blue-300'
              }`} data-testid="text-notification">
                {notification.message}
              </p>
            </div>
          )}

          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    data-testid={`button-tab-${tab.id}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="overflow-y-auto max-h-96">
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Compensation Overview</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Annual Salary</h4>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-annual-salary">$100,000</p>
                      <p className="text-green-700 dark:text-green-400 text-sm">Base compensation</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Total Benefits Value</h4>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-benefits-value">$18,500</p>
                      <p className="text-blue-700 dark:text-blue-400 text-sm">Annual value</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Total Package</h4>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-total-package">$118,500</p>
                      <p className="text-purple-700 dark:text-purple-400 text-sm">Salary + benefits</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Pay Activity</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <span className="text-gray-900 dark:text-white">Pay stub available - January 1-15, 2025</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Available now</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <span className="text-gray-900 dark:text-white">Benefits enrollment confirmed</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">January 1, 2025</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <span className="text-gray-900 dark:text-white">401(k) contribution increased</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">December 15, 2024</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'paystubs' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Pay Statements</h3>

                    {dailyUsage && (
                      <div className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
                        <Sparkles className="h-4 w-4 text-amber-600" />
                        <div className="text-sm">
                          <span className="font-medium text-amber-900 dark:text-amber-300">
                            Fun Facts Today: {dailyUsage.currentCount}/{dailyUsage.dailyLimit}
                          </span>
                          <span className="ml-2 text-amber-600 dark:text-amber-400">
                            ({dailyUsage.remainingGenerations} left)
                          </span>
                        </div>
                        <div className="relative group">
                          <Info className="h-4 w-4 text-amber-600 cursor-help" />
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 bg-gray-900 text-white text-xs rounded-lg p-3 z-10">
                            You can generate up to 3 fun facts per day to keep the surprise factor alive. The limit resets at midnight each day. Fun facts shown with paychecks don't count toward this limit!
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4">
                    {mockPayStubs.map((payStub) => {
                      const funFact = funFacts[payStub.id];

                      return (
                        <div key={payStub.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6" data-testid={`paystub-${payStub.id}`}>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">{payStub.payPeriod}</h4>
                              <p className="text-gray-600 dark:text-gray-400">Pay Date: {payStub.payDate}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Gross: <span className="font-medium">${payStub.grossPay.toLocaleString()}</span></span>
                                <span className="text-gray-600 dark:text-gray-400">Net: <span className="font-medium text-green-600 dark:text-green-400">${payStub.netPay.toLocaleString()}</span></span>
                                <span className="text-gray-600 dark:text-gray-400">Hours: <span className="font-medium">{payStub.regularHours + payStub.overtimeHours}</span></span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedPayStub(payStub)}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                data-testid={`button-view-paystub-${payStub.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadPayStub(payStub)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                                data-testid={`button-download-paystub-${payStub.id}`}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </button>
                            </div>
                          </div>

                          {funFact && (
                            <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-orange-900/20 border-l-4 border-amber-500 dark:border-amber-600 rounded-lg p-4 flex items-start space-x-3">
                              <Sparkles className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-amber-900 dark:text-amber-200 text-sm font-medium leading-relaxed" data-testid={`fun-fact-${payStub.id}`}>
                                  {funFact.text}
                                </p>
                              </div>
                              {dailyUsage?.hasReachedLimit ? (
                                <div className="flex flex-col items-center space-y-1">
                                  <button
                                    disabled
                                    className="text-gray-400 p-1 rounded cursor-not-allowed"
                                    title="Daily limit reached"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </button>
                                  <span className="text-xs text-amber-700 whitespace-nowrap">Limit reached</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => refreshFunFact(payStub.id, payStub.netPay)}
                                  disabled={loadingFunFacts[payStub.id]}
                                  className="text-amber-600 hover:text-amber-700 transition-colors p-1 rounded hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={`Get another fun fact (${dailyUsage?.remainingGenerations || 0} left today)`}
                                  data-testid={`button-refresh-funfact-${payStub.id}`}
                                >
                                  <RefreshCw className={`h-4 w-4 ${loadingFunFacts[payStub.id] ? 'animate-spin' : ''}`} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-4">Tax Documents</h4>
                    <div className="grid gap-4">
                      {mockW2Forms.map((w2) => (
                        <div key={w2.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border" data-testid={`w2-${w2.id}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-white">Form W-2 - {w2.taxYear}</h5>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">Wages: ${w2.wages.toLocaleString()}</p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedW2(w2)}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
                                data-testid={`button-view-w2-${w2.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadW2(w2)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                                data-testid={`button-download-w2-${w2.id}`}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download W-2
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'benefits' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Benefits Enrollment</h3>
                  
                  <div className="grid gap-6">
                    {mockBenefits.map((benefit) => (
                      <div key={benefit.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6" data-testid={`benefit-${benefit.id}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{benefit.name}</h4>
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                {benefit.status}
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-2">{benefit.plan}</p>
                            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{benefit.description}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">Coverage:</span>
                                <p className="text-gray-600 dark:text-gray-400">{benefit.coverage}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">Effective Date:</span>
                                <p className="text-gray-600 dark:text-gray-400">{benefit.effectiveDate}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">Your Cost:</span>
                                <p className="text-gray-600 dark:text-gray-400">${benefit.employeeCost}/month</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">Company Cost:</span>
                                <p className="text-gray-600 dark:text-gray-400">${benefit.employerCost}/month</p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedBenefit(benefit)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            data-testid={`button-view-benefit-${benefit.id}`}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'compensation' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Compensation History</h3>
                  
                  <div className="bg-white dark:bg-gray-800 border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salary</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Increase</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">January 1, 2025</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">$100,000</td>
                          <td className="px-6 py-4 whitespace-nowrap text-green-600">+5.3%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">Annual Performance Review</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">January 1, 2024</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">$95,000</td>
                          <td className="px-6 py-4 whitespace-nowrap text-green-600">+8.0%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">Promotion</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">June 15, 2023</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">$88,000</td>
                          <td className="px-6 py-4 whitespace-nowrap text-blue-600">Starting Salary</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">Initial Hire</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pay Stub Detail Modal */}
      {selectedPayStub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-paystub-detail-title">Pay Statement Details</h3>
              <button
                onClick={() => setSelectedPayStub(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                data-testid="button-close-paystub"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Pay Period Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Pay Period:</span>
                      <span className="font-medium">{selectedPayStub.payPeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Pay Date:</span>
                      <span className="font-medium">{selectedPayStub.payDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Regular Hours:</span>
                      <span className="font-medium">{selectedPayStub.regularHours}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Overtime Hours:</span>
                      <span className="font-medium">{selectedPayStub.overtimeHours}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Earnings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Regular Pay:</span>
                      <span className="font-medium">${selectedPayStub.regularPay.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Overtime Pay:</span>
                      <span className="font-medium">${selectedPayStub.overtimePay.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium text-gray-900 dark:text-white">Gross Pay:</span>
                      <span className="font-bold text-green-600">${selectedPayStub.grossPay.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Deductions</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Federal Tax:</span>
                      <span className="font-medium">${selectedPayStub.deductions.federalTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">State Tax:</span>
                      <span className="font-medium">${selectedPayStub.deductions.stateTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Social Security:</span>
                      <span className="font-medium">${selectedPayStub.deductions.socialSecurity.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Medicare:</span>
                      <span className="font-medium">${selectedPayStub.deductions.medicare.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Health Insurance:</span>
                      <span className="font-medium">${selectedPayStub.deductions.healthInsurance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">401(k):</span>
                      <span className="font-medium">${selectedPayStub.deductions.retirement401k.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Dental:</span>
                      <span className="font-medium">${selectedPayStub.deductions.dentalInsurance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Vision:</span>
                      <span className="font-medium">${selectedPayStub.deductions.visionInsurance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">Net Pay:</span>
                    <span className="font-bold text-green-600 text-lg" data-testid="text-net-pay">${selectedPayStub.netPay.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {funFacts[selectedPayStub.id] && (
                <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-amber-200 rounded-full p-3">
                      <Sparkles className="h-6 w-6 text-amber-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-amber-900 mb-2 flex items-center">
                        Fun Paycheck Fact
                        <span className="ml-2 text-2xl">{getCategoryIcon(funFacts[selectedPayStub.id]!.category)}</span>
                      </h4>
                      <p className="text-amber-800 text-base leading-relaxed font-medium">
                        {funFacts[selectedPayStub.id]!.text}
                      </p>
                      {dailyUsage && !dailyUsage.hasReachedLimit && (
                        <p className="text-amber-700 text-sm mt-2">
                          {dailyUsage.remainingGenerations} fun fact{dailyUsage.remainingGenerations !== 1 ? 's' : ''} remaining today
                        </p>
                      )}
                      {dailyUsage?.hasReachedLimit && (
                        <p className="text-amber-700 text-sm mt-2 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Daily limit reached - resets tomorrow
                        </p>
                      )}
                    </div>
                    {dailyUsage?.hasReachedLimit ? (
                      <div className="flex flex-col items-center">
                        <button
                          disabled
                          className="text-gray-400 p-2 rounded-lg cursor-not-allowed"
                          title="Daily limit reached"
                        >
                          <RefreshCw className="h-5 w-5" />
                        </button>
                        <span className="text-xs text-amber-700 mt-1">Limit reached</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => refreshFunFact(selectedPayStub.id, selectedPayStub.netPay)}
                        disabled={loadingFunFacts[selectedPayStub.id]}
                        className="text-amber-700 hover:text-amber-900 transition-colors p-2 rounded-lg hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Get another fun fact (${dailyUsage?.remainingGenerations || 0} left today)`}
                      >
                        <RefreshCw className={`h-5 w-5 ${loadingFunFacts[selectedPayStub.id] ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setSelectedPayStub(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                data-testid="button-close-paystub-footer"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadPayStub(selectedPayStub)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                data-testid="button-download-paystub-footer"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* W-2 Detail Modal */}
      {selectedW2 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-w2-detail-title">W-2 Form Details</h3>
              <button
                onClick={() => setSelectedW2(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                data-testid="button-close-w2"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax Year:</span>
                  <span className="font-medium">{selectedW2.taxYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Wages:</span>
                  <span className="font-medium">${selectedW2.wages.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Federal Tax:</span>
                  <span className="font-medium">${selectedW2.federalTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">State Tax:</span>
                  <span className="font-medium">${selectedW2.stateTax.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedW2(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                data-testid="button-close-w2-footer"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadW2(selectedW2)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                data-testid="button-download-w2-footer"
              >
                <Download className="h-4 w-4 mr-2" />
                Download W-2
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Benefit Detail Modal */}
      {selectedBenefit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-benefit-detail-title">Benefit Details</h3>
              <button
                onClick={() => setSelectedBenefit(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                data-testid="button-close-benefit"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{selectedBenefit.name}</h4>
                <p className="text-gray-600 dark:text-gray-400">{selectedBenefit.plan}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Coverage:</span>
                  <p className="text-gray-600 dark:text-gray-400">{selectedBenefit.coverage}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <p className="text-gray-600 dark:text-gray-400">{selectedBenefit.status}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Your Monthly Cost:</span>
                  <p className="text-gray-600 dark:text-gray-400">${selectedBenefit.employeeCost}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Company Contribution:</span>
                  <p className="text-gray-600 dark:text-gray-400">${selectedBenefit.employerCost}</p>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedBenefit.description}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedBenefit(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                data-testid="button-close-benefit-footer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowModifyEnrollment(true);
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                data-testid="button-modify-enrollment"
              >
                Modify Enrollment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modify Enrollment Modal */}
      {showModifyEnrollment && selectedBenefit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-modify-enrollment-title">Modify Enrollment - {selectedBenefit.name}</h3>
              <button
                onClick={() => setShowModifyEnrollment(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                data-testid="button-close-modify"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Coverage Level</label>
                <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" data-testid="select-coverage">
                  <option>Employee Only</option>
                  <option selected>Employee + Family</option>
                  <option>Employee + Spouse</option>
                  <option>Employee + Children</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Effective Date</label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="2025-01-01"
                  data-testid="input-effective-date"
                />
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> Changes to benefit enrollments typically take effect on the first day of the following month. Some changes may require qualifying life events.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModifyEnrollment(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                data-testid="button-cancel-modify"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowModifyEnrollment(false);
                  setSelectedBenefit(null);
                  setNotification({
                    type: 'success',
                    message: 'Enrollment modification submitted successfully!'
                  });
                  setTimeout(() => setNotification(null), 3000);
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                data-testid="button-submit-modify"
              >
                Submit Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BenefitsPage;
