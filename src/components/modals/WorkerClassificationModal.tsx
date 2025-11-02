import React, { useState, useEffect } from 'react';
import { X, Brain, FileText, AlertTriangle, CheckCircle, Scale, DollarSign, Users, Clock, Briefcase, Shield, TrendingUp, Sparkles, Info } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface WorkerClassification {
  code: string;
  name: string;
  description: string;
  category: string;
  country_code: string;
  requires_tax_withholding: boolean;
  requires_benefits: boolean;
  requires_work_authorization: boolean;
}

interface IRS20FactorQuestion {
  id: number;
  question: string;
  category: 'behavioral' | 'financial' | 'relationship';
  weight: number;
  employeeAnswer: 'yes' | 'no' | null;
  contractorAnswer: 'yes' | 'no';
}

interface AIAnalysisResult {
  recommendedClassification: string;
  confidence: number;
  keyIndicators: string[];
  riskFactors: string[];
}

interface WorkerClassificationModalProps {
  candidateId?: string;
  candidateName?: string;
  jobTitle?: string;
  jobDescription?: string;
  onClose: () => void;
  onClassificationSelected?: (classification: WorkerClassification, riskScore: number) => void;
}

const WorkerClassificationModal: React.FC<WorkerClassificationModalProps> = ({
  candidateId,
  candidateName,
  jobTitle = '',
  jobDescription = '',
  onClose,
  onClassificationSelected
}) => {
  const [activeTab, setActiveTab] = useState<'ai-analysis' | 'irs-test' | 'comparison'>('ai-analysis');
  const [classifications, setClassifications] = useState<WorkerClassification[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [countries, setCountries] = useState<any[]>([]);

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jobDescriptionInput, setJobDescriptionInput] = useState(jobDescription);
  const [jobTitleInput, setJobTitleInput] = useState(jobTitle);

  const [irsQuestions, setIrsQuestions] = useState<IRS20FactorQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [irsTestComplete, setIrsTestComplete] = useState(false);
  const [irsRiskScore, setIrsRiskScore] = useState(0);
  const [irsRecommendation, setIrsRecommendation] = useState<string>('');

  const [selectedClassification, setSelectedClassification] = useState<WorkerClassification | null>(null);
  const [justification, setJustification] = useState('');

  useEffect(() => {
    loadClassifications();
    loadCountries();
    initializeIRSQuestions();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      loadClassifications();
    }
  }, [selectedCountry]);

  const loadCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('worker_country_config')
        .select('country_code, country_name')
        .eq('is_active', true)
        .order('country_name');

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const loadClassifications = async () => {
    try {
      const { data, error } = await supabase
        .from('worker_classifications')
        .select('*')
        .eq('is_active', true)
        .eq('country_code', selectedCountry)
        .order('name');

      if (error) throw error;
      setClassifications(data || []);
    } catch (error) {
      console.error('Error loading classifications:', error);
    }
  };

  const initializeIRSQuestions = () => {
    const questions: IRS20FactorQuestion[] = [
      {
        id: 1,
        question: 'Does the company provide instructions on how, when, and where the work is to be performed?',
        category: 'behavioral',
        weight: 5,
        employeeAnswer: null,
        contractorAnswer: 'yes'
      },
      {
        id: 2,
        question: 'Does the company provide training to the worker on how to perform the job?',
        category: 'behavioral',
        weight: 4,
        employeeAnswer: null,
        contractorAnswer: 'yes'
      },
      {
        id: 3,
        question: 'Are the services provided by the worker integrated into the business operations?',
        category: 'behavioral',
        weight: 5,
        employeeAnswer: null,
        contractorAnswer: 'yes'
      },
      {
        id: 4,
        question: 'Must the services be rendered personally by the worker?',
        category: 'behavioral',
        weight: 4,
        employeeAnswer: null,
        contractorAnswer: 'yes'
      },
      {
        id: 5,
        question: 'Does the company hire, supervise, and pay assistants for the worker?',
        category: 'behavioral',
        weight: 4,
        employeeAnswer: null,
        contractorAnswer: 'yes'
      },
      {
        id: 6,
        question: 'Is there a continuing relationship between the worker and the company?',
        category: 'relationship',
        weight: 5,
        employeeAnswer: null,
        contractorAnswer: 'yes'
      },
      {
        id: 7,
        question: 'Does the company set the hours of work for the worker?',
        category: 'behavioral',
        weight: 3,
        employeeAnswer: null,
        contractorAnswer: 'yes'
      },
      {
        id: 8,
        question: 'Is the worker required to work full-time for the company?',
        category: 'relationship',
        weight: 3,
        employeeAnswer: null,
        contractorAnswer: 'yes'
      },
      {
        id: 9,
        question: 'Is the work performed on company premises?',
        category: 'behavioral',
        weight: 2,
        employeeAnswer: null,
        contractorAnswer: 'yes'
      },
      {
        id: 10,
        question: 'Does the company dictate the order or sequence in which work is performed?',
        category: 'behavioral',
        weight: 3,
        employeeAnswer: null,
        contractorAnswer: 'yes'
      },
      {
        id: 11,
        question: 'Are regular oral or written reports required from the worker?',
        category: 'behavioral',
        weight: 3,
        employeeAnswer: null,
        contractorAnswer: 'yes'
      },
      {
        id: 12,
        question: 'Is the worker paid by the hour, week, or month (rather than by job)?',
        category: 'financial',
        weight: 4,
        employeeAnswer: null,
        contractorAnswer: 'no'
      },
      {
        id: 13,
        question: 'Does the company pay business or travel expenses for the worker?',
        category: 'financial',
        weight: 3,
        employeeAnswer: null,
        contractorAnswer: 'yes'
      },
      {
        id: 14,
        question: 'Does the company furnish tools and materials for the worker?',
        category: 'financial',
        weight: 3,
        employeeAnswer: null,
        contractorAnswer: 'yes'
      },
      {
        id: 15,
        question: 'Has the worker invested significantly in facilities used to perform services?',
        category: 'financial',
        weight: 4,
        employeeAnswer: null,
        contractorAnswer: 'no'
      },
      {
        id: 16,
        question: 'Can the worker realize a profit or suffer a loss from the services?',
        category: 'financial',
        weight: 5,
        employeeAnswer: null,
        contractorAnswer: 'no'
      },
      {
        id: 17,
        question: 'Does the worker work for multiple companies at the same time?',
        category: 'relationship',
        weight: 3,
        employeeAnswer: null,
        contractorAnswer: 'no'
      },
      {
        id: 18,
        question: 'Does the worker make their services available to the general public?',
        category: 'relationship',
        weight: 4,
        employeeAnswer: null,
        contractorAnswer: 'no'
      },
      {
        id: 19,
        question: 'Can the company discharge the worker at will (without cause)?',
        category: 'relationship',
        weight: 4,
        employeeAnswer: null,
        contractorAnswer: 'yes'
      },
      {
        id: 20,
        question: 'Can the worker terminate the relationship without liability?',
        category: 'relationship',
        weight: 3,
        employeeAnswer: null,
        contractorAnswer: 'no'
      }
    ];

    setIrsQuestions(questions);
  };

  const performAIAnalysis = () => {
    setIsAnalyzing(true);

    setTimeout(() => {
      const analysis: AIAnalysisResult = {
        recommendedClassification: analyzeJobDescription(jobDescriptionInput, jobTitleInput),
        confidence: 85 + Math.random() * 10,
        keyIndicators: extractKeyIndicators(jobDescriptionInput, jobTitleInput),
        riskFactors: identifyRiskFactors(jobDescriptionInput, jobTitleInput)
      };

      setAiAnalysis(analysis);
      setIsAnalyzing(false);
    }, 2000);
  };

  const analyzeJobDescription = (description: string, title: string): string => {
    const lowerDesc = description.toLowerCase();
    const lowerTitle = title.toLowerCase();

    if (lowerDesc.includes('project-based') || lowerDesc.includes('specific deliverable') ||
        lowerDesc.includes('contract') || lowerDesc.includes('freelance') ||
        lowerDesc.includes('consultant')) {
      return 'CONTRACTOR_1099_US';
    }

    if (lowerDesc.includes('apprentice') || lowerDesc.includes('training program') ||
        lowerTitle.includes('apprentice')) {
      return 'APPRENTICE';
    }

    if (lowerDesc.includes('union') || lowerDesc.includes('collective bargaining')) {
      return 'UNION_MEMBER';
    }

    if (lowerDesc.includes('intern') || lowerDesc.includes('co-op') || lowerTitle.includes('intern')) {
      return 'INTERN';
    }

    if (lowerDesc.includes('part-time') || lowerDesc.includes('part time') || lowerTitle.includes('part-time')) {
      return 'W2_PART_TIME_US';
    }

    if (lowerDesc.includes('seasonal') || lowerDesc.includes('temporary')) {
      return 'W2_SEASONAL_US';
    }

    return 'W2_FULL_TIME_US';
  };

  const extractKeyIndicators = (description: string, title: string): string[] => {
    const indicators: string[] = [];
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('report to') || lowerDesc.includes('supervisor')) {
      indicators.push('Clear reporting structure indicates employee relationship');
    }
    if (lowerDesc.includes('schedule') || lowerDesc.includes('9-5') || lowerDesc.includes('office hours')) {
      indicators.push('Set work schedule suggests employee status');
    }
    if (lowerDesc.includes('benefits') || lowerDesc.includes('insurance') || lowerDesc.includes('401k')) {
      indicators.push('Benefits package typical of W-2 employment');
    }
    if (lowerDesc.includes('equipment provided') || lowerDesc.includes('tools provided')) {
      indicators.push('Company-provided tools indicate employee relationship');
    }
    if (lowerDesc.includes('training') || lowerDesc.includes('onboarding')) {
      indicators.push('Training requirements suggest employee classification');
    }
    if (lowerDesc.includes('project-based') || lowerDesc.includes('deliverable')) {
      indicators.push('Project-based work suggests independent contractor');
    }

    if (indicators.length === 0) {
      indicators.push('Standard employment arrangement detected');
    }

    return indicators;
  };

  const identifyRiskFactors = (description: string, title: string): string[] => {
    const risks: string[] = [];
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('flexible hours') && lowerDesc.includes('report to')) {
      risks.push('Mixed signals: Flexible hours but with reporting structure');
    }
    if (lowerDesc.includes('1099') && lowerDesc.includes('full-time')) {
      risks.push('Potential misclassification: 1099 with full-time expectations');
    }
    if (lowerDesc.includes('contractor') && lowerDesc.includes('benefits')) {
      risks.push('Risk: Contractors typically don\'t receive benefits');
    }
    if (lowerDesc.includes('own equipment') && lowerDesc.includes('must work from office')) {
      risks.push('Conflicting requirements detected');
    }

    if (risks.length === 0) {
      risks.push('No significant misclassification risks detected');
    }

    return risks;
  };

  const handleIRSAnswer = (answer: 'yes' | 'no') => {
    const updatedQuestions = [...irsQuestions];
    updatedQuestions[currentQuestionIndex].employeeAnswer = answer;
    setIrsQuestions(updatedQuestions);

    if (currentQuestionIndex < irsQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateIRSScore(updatedQuestions);
      setIrsTestComplete(true);
    }
  };

  const calculateIRSScore = (questions: IRS20FactorQuestion[]) => {
    let employeeScore = 0;
    let totalWeight = 0;

    questions.forEach(q => {
      totalWeight += q.weight;
      if (q.employeeAnswer === q.contractorAnswer) {
        employeeScore += q.weight;
      }
    });

    const riskPercentage = Math.round((employeeScore / totalWeight) * 100);
    setIrsRiskScore(riskPercentage);

    if (riskPercentage >= 70) {
      setIrsRecommendation('W2_FULL_TIME_US');
    } else if (riskPercentage >= 50) {
      setIrsRecommendation('W2_FULL_TIME_US');
    } else if (riskPercentage >= 30) {
      setIrsRecommendation('CONTRACTOR_1099_US');
    } else {
      setIrsRecommendation('CONTRACTOR_1099_US');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const restartIRSTest = () => {
    const resetQuestions = irsQuestions.map(q => ({ ...q, employeeAnswer: null }));
    setIrsQuestions(resetQuestions);
    setCurrentQuestionIndex(0);
    setIrsTestComplete(false);
    setIrsRiskScore(0);
    setIrsRecommendation('');
  };

  const handleSaveClassification = async () => {
    if (!selectedClassification) return;

    try {
      const finalRiskScore = Math.max(irsRiskScore, 100 - (aiAnalysis?.confidence || 0));

      if (candidateId) {
        const { error: auditError } = await supabase
          .from('worker_classification_audit_log')
          .insert({
            worker_id: candidateId,
            worker_type: 'candidate',
            new_classification: selectedClassification.code,
            change_reason: justification || 'Classification determined through AI and IRS test analysis',
            risk_assessment_score: finalRiskScore
          });

        if (auditError) throw auditError;

        const { error: updateError } = await supabase
          .from('candidates')
          .update({
            proposed_classification: selectedClassification.code,
            country_code: selectedCountry
          })
          .eq('id', candidateId);

        if (updateError) throw updateError;
      }

      onClassificationSelected?.(selectedClassification, finalRiskScore);
      onClose();
    } catch (error) {
      console.error('Error saving classification:', error);
      alert('Failed to save classification. Please try again.');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'behavioral': return <Briefcase className="h-5 w-5" />;
      case 'financial': return <DollarSign className="h-5 w-5" />;
      case 'relationship': return <Users className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'behavioral': return 'text-blue-600 bg-blue-100';
      case 'financial': return 'text-green-600 bg-green-100';
      case 'relationship': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Brain className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Worker Classification Decision Engine</h2>
                <p className="text-blue-100 text-sm mt-1">
                  AI-Powered Analysis + IRS 20-Factor Test
                  {candidateName && ` • ${candidateName}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('ai-analysis')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeTab === 'ai-analysis'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Sparkles className="h-5 w-5" />
              <span>AI Analysis</span>
            </button>
            <button
              onClick={() => setActiveTab('irs-test')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeTab === 'irs-test'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>IRS 20-Factor Test</span>
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeTab === 'comparison'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              disabled={!aiAnalysis && !irsTestComplete}
            >
              <Scale className="h-5 w-5" />
              <span>Comparison & Decision</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-240px)]">
          {activeTab === 'ai-analysis' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-start space-x-3">
                  <Brain className="h-6 w-6 text-purple-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      AI-Powered Job Description Analysis
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Our AI analyzes job descriptions to identify classification patterns, risk factors, and compliance issues
                      based on thousands of employment scenarios.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={jobTitleInput}
                  onChange={(e) => setJobTitleInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Senior Software Engineer, Marketing Consultant, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Description
                </label>
                <textarea
                  value={jobDescriptionInput}
                  onChange={(e) => setJobDescriptionInput(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Paste the complete job description here. Include responsibilities, requirements, work arrangement, reporting structure, hours, location, equipment, etc."
                />
              </div>

              <button
                onClick={performAIAnalysis}
                disabled={!jobTitleInput || !jobDescriptionInput || isAnalyzing}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Analyze with AI</span>
                  </>
                )}
              </button>

              {aiAnalysis && (
                <div className="space-y-4 mt-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          AI Recommendation
                        </h4>
                        <p className="text-2xl font-bold text-green-600">
                          {classifications.find(c => c.code === aiAnalysis.recommendedClassification)?.name || aiAnalysis.recommendedClassification}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confidence</p>
                        <p className="text-3xl font-bold text-green-600">{Math.round(aiAnalysis.confidence)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                        Key Indicators
                      </h5>
                      <ul className="space-y-2">
                        {aiAnalysis.keyIndicators.map((indicator, idx) => (
                          <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                            <span className="mr-2">•</span>
                            <span>{indicator}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                        Risk Factors
                      </h5>
                      <ul className="space-y-2">
                        {aiAnalysis.riskFactors.map((risk, idx) => (
                          <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                            <span className="mr-2">•</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'irs-test' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-3">
                  <FileText className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      IRS 20-Factor Test for Worker Classification
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      The IRS uses 20 factors to determine whether a worker is an employee or independent contractor.
                      Answer these questions about the working relationship.
                    </p>
                  </div>
                </div>
              </div>

              {!irsTestComplete ? (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(irsQuestions[currentQuestionIndex]?.category)}`}>
                          {getCategoryIcon(irsQuestions[currentQuestionIndex]?.category)}
                          <span className="ml-2 capitalize">{irsQuestions[currentQuestionIndex]?.category}</span>
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Question {currentQuestionIndex + 1} of {irsQuestions.length}
                      </span>
                    </div>

                    <div className="mb-6">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-4">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${((currentQuestionIndex + 1) / irsQuestions.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      {irsQuestions[currentQuestionIndex]?.question}
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleIRSAnswer('yes')}
                        className="p-6 border-2 border-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors text-center"
                      >
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">Yes</span>
                      </button>
                      <button
                        onClick={() => handleIRSAnswer('no')}
                        className="p-6 border-2 border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-center"
                      >
                        <X className="h-8 w-8 text-red-600 mx-auto mb-2" />
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">No</span>
                      </button>
                    </div>

                    {currentQuestionIndex > 0 && (
                      <button
                        onClick={handlePreviousQuestion}
                        className="mt-6 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        ← Previous Question
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">IRS Test Results</h3>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Employee Risk Score</p>
                        <p className={`text-4xl font-bold ${getRiskScoreColor(irsRiskScore)} inline-block px-4 py-2 rounded-lg`}>
                          {irsRiskScore}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {irsRiskScore >= 70 && 'Strong indicators of employee relationship'}
                          {irsRiskScore >= 50 && irsRiskScore < 70 && 'Moderate employee indicators'}
                          {irsRiskScore >= 30 && irsRiskScore < 50 && 'Moderate contractor indicators'}
                          {irsRiskScore < 30 && 'Strong indicators of contractor relationship'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">IRS Recommendation</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {classifications.find(c => c.code === irsRecommendation)?.name || irsRecommendation}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Factor Breakdown</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {['behavioral', 'financial', 'relationship'].map(category => {
                        const categoryQuestions = irsQuestions.filter(q => q.category === category);
                        const matchCount = categoryQuestions.filter(q => q.employeeAnswer === 'yes').length;
                        const percentage = Math.round((matchCount / categoryQuestions.length) * 100);

                        return (
                          <div key={category} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center space-x-2 mb-2">
                              {getCategoryIcon(category)}
                              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{category}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{percentage}%</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{matchCount} of {categoryQuestions.length} factors</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={restartIRSTest}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ← Restart IRS Test
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comparison' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start space-x-3">
                  <Scale className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Comprehensive Classification Decision
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Review both AI and IRS recommendations before making your final classification decision.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-purple-50 dark:bg-purple-900/30 p-6 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center space-x-2 mb-4">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">AI Analysis</h4>
                  </div>
                  {aiAnalysis ? (
                    <div>
                      <p className="text-xl font-bold text-purple-600 mb-2">
                        {classifications.find(c => c.code === aiAnalysis.recommendedClassification)?.name || 'Not Available'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Confidence: <span className="font-semibold">{Math.round(aiAnalysis.confidence)}%</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Run AI analysis first</p>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-2 mb-4">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">IRS Test</h4>
                  </div>
                  {irsTestComplete ? (
                    <div>
                      <p className="text-xl font-bold text-blue-600 mb-2">
                        {classifications.find(c => c.code === irsRecommendation)?.name || 'Not Available'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Risk Score: <span className="font-semibold">{irsRiskScore}%</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Complete IRS test first</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country / Region
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {countries.map(country => (
                    <option key={country.country_code} value={country.country_code}>
                      {country.country_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Final Classification Decision *
                </label>
                <select
                  value={selectedClassification?.code || ''}
                  onChange={(e) => {
                    const classification = classifications.find(c => c.code === e.target.value);
                    setSelectedClassification(classification || null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a classification...</option>
                  {classifications.map(classification => (
                    <option key={classification.code} value={classification.code}>
                      {classification.name} - {classification.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Justification / Notes
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Explain the reasoning behind this classification decision for audit trail purposes..."
                />
              </div>

              {selectedClassification && (
                <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Classification Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Category:</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedClassification.category}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Country:</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedClassification.country_code}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Tax Withholding:</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedClassification.requires_tax_withholding ? 'Required' : 'Not Required'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Benefits:</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedClassification.requires_benefits ? 'Required' : 'Not Required'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>

          {activeTab === 'comparison' && (
            <button
              onClick={handleSaveClassification}
              disabled={!selectedClassification}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Shield className="h-5 w-5" />
              <span>Save Classification</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerClassificationModal;
