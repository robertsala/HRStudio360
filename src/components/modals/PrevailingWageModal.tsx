import React, { useState, useEffect } from 'react';
import { X, DollarSign, FileText, Download, CheckCircle, AlertTriangle, Calculator, Building, Users, Calendar, TrendingUp, Shield, Target, Clock, ChevronRight, Search, Filter } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface PrevailingWageDetermination {
  id: string;
  determination_number: string;
  project_type: string;
  county: string;
  state_province: string;
  effective_date: string;
  expiration_date: string;
  issuing_agency: string;
}

interface WageClassification {
  id: string;
  classification_title: string;
  hourly_rate: number;
  fringe_rate: number;
  total_rate: number;
}

interface CertifiedPayrollReport {
  id: string;
  week_ending: string;
  project_name: string;
  total_employees: number;
  total_hours: number;
  total_wages: number;
  status: string;
}

interface PrevailingWageModalProps {
  onClose: () => void;
}

const PrevailingWageModal: React.FC<PrevailingWageModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'reports' | 'determinations' | 'projects'>('calculator');
  const [determinations, setDeterminations] = useState<PrevailingWageDetermination[]>([]);
  const [wageClassifications, setWageClassifications] = useState<WageClassification[]>([]);
  const [certifiedReports, setCertifiedReports] = useState<CertifiedPayrollReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculator state
  const [selectedDetermination, setSelectedDetermination] = useState<string>('');
  const [selectedClassification, setSelectedClassification] = useState<string>('');
  const [actualHourlyRate, setActualHourlyRate] = useState<number>(0);
  const [actualFringeRate, setActualFringeRate] = useState<number>(0);
  const [hoursWorked, setHoursWorked] = useState<number>(0);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadDeterminations(),
        loadCertifiedReports()
      ]);
    } catch (error) {
      console.error('Error loading prevailing wage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeterminations = async () => {
    const { data, error } = await supabase
      .from('prevailing_wage_determinations')
      .select('*')
      .order('effective_date', { ascending: false })
      .limit(50);

    if (!error && data) {
      setDeterminations(data);
    }
  };

  const loadWageClassifications = async (determinationId: string) => {
    const { data, error } = await supabase
      .from('prevailing_wage_classifications')
      .select('*')
      .eq('determination_id', determinationId)
      .order('classification_title');

    if (!error && data) {
      const formatted = data.map((c: any) => ({
        id: c.id,
        classification_title: c.classification_title,
        hourly_rate: Number(c.hourly_rate),
        fringe_rate: Number(c.fringe_rate),
        total_rate: Number(c.hourly_rate) + Number(c.fringe_rate)
      }));
      setWageClassifications(formatted);
    }
  };

  const loadCertifiedReports = async () => {
    const { data, error} = await supabase
      .from('certified_payroll_reports')
      .select('*')
      .order('week_ending', { ascending: false })
      .limit(20);

    if (!error && data) {
      const formatted = data.map((r: any) => ({
        id: r.id,
        week_ending: r.week_ending,
        project_name: r.project_id || 'N/A',
        total_employees: r.total_employees || 0,
        total_hours: Number(r.total_hours) || 0,
        total_wages: Number(r.total_wages) || 0,
        status: r.status
      }));
      setCertifiedReports(formatted);
    }
  };

  const handleDeterminationChange = (determinationId: string) => {
    setSelectedDetermination(determinationId);
    setSelectedClassification('');
    setWageClassifications([]);
    if (determinationId) {
      loadWageClassifications(determinationId);
    }
  };

  const calculateCompliance = () => {
    if (!selectedClassification) return null;

    const classification = wageClassifications.find(c => c.id === selectedClassification);
    if (!classification) return null;

    const totalActual = actualHourlyRate + actualFringeRate;
    const totalRequired = classification.total_rate;
    const isCompliant = totalActual >= totalRequired;
    const shortfall = isCompliant ? 0 : totalRequired - totalActual;
    const totalPay = actualHourlyRate * hoursWorked;
    const totalFringe = actualFringeRate * hoursWorked;
    const makeUpRequired = shortfall * hoursWorked;

    return {
      isCompliant,
      prevailingWage: totalRequired,
      actualWage: totalActual,
      shortfall,
      totalPay,
      totalFringe,
      makeUpRequired,
      classification
    };
  };

  const compliance = calculateCompliance();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'submitted': return 'text-blue-600 bg-blue-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredDeterminations = determinations.filter(d =>
    d.determination_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.county.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.state_province.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <DollarSign className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Prevailing Wage Management</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Davis-Bacon Act Compliance Calculator & Certified Payroll Generator
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

          {/* Stats */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Active Determinations</p>
                  <p className="text-3xl font-bold">{determinations.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">This Month Reports</p>
                  <p className="text-3xl font-bold">{certifiedReports.filter(r => r.status === 'submitted').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Pending Approval</p>
                  <p className="text-3xl font-bold">{certifiedReports.filter(r => r.status === 'draft').length}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Workers</p>
                  <p className="text-3xl font-bold">{certifiedReports.reduce((sum, r) => sum + r.total_employees, 0)}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'calculator'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Calculator className="h-5 w-5" />
              <span>Wage Calculator</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'reports'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>Certified Payroll</span>
            </button>
            <button
              onClick={() => setActiveTab('determinations')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'determinations'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Shield className="h-5 w-5" />
              <span>Wage Determinations</span>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'projects'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Building className="h-5 w-5" />
              <span>Projects</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-350px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'calculator' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4 rounded">
                    <div className="flex items-start">
                      <Calculator className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-blue-900 dark:text-blue-100 font-semibold mb-2">Prevailing Wage Compliance Calculator</h4>
                        <p className="text-blue-700 dark:text-blue-300 text-sm">
                          Calculate whether worker compensation meets prevailing wage requirements for government contracts.
                          This tool helps ensure Davis-Bacon Act compliance.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Selection Panel */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select Wage Determination
                        </label>
                        <select
                          value={selectedDetermination}
                          onChange={(e) => handleDeterminationChange(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Choose a determination...</option>
                          {determinations.slice(0, 10).map((det) => (
                            <option key={det.id} value={det.id}>
                              {det.determination_number} - {det.county}, {det.state_province}
                            </option>
                          ))}
                        </select>
                      </div>

                      {wageClassifications.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Worker Classification
                          </label>
                          <select
                            value={selectedClassification}
                            onChange={(e) => setSelectedClassification(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Choose a classification...</option>
                            {wageClassifications.map((wc) => (
                              <option key={wc.id} value={wc.id}>
                                {wc.classification_title} - ${wc.total_rate.toFixed(2)}/hr
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Actual Hourly Rate ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={actualHourlyRate}
                          onChange={(e) => setActualHourlyRate(Number(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Actual Fringe Benefits ($/hr)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={actualFringeRate}
                          onChange={(e) => setActualFringeRate(Number(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Hours Worked This Week
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={hoursWorked}
                          onChange={(e) => setHoursWorked(Number(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="0.0"
                        />
                      </div>
                    </div>

                    {/* Results Panel */}
                    <div>
                      {compliance ? (
                        <div className="space-y-4">
                          <div className={`border-l-4 p-4 rounded ${
                            compliance.isCompliant
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-600'
                              : 'bg-red-50 dark:bg-red-900/20 border-red-600'
                          }`}>
                            <div className="flex items-center mb-3">
                              {compliance.isCompliant ? (
                                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                              ) : (
                                <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                              )}
                              <h4 className={`font-semibold ${
                                compliance.isCompliant
                                  ? 'text-green-900 dark:text-green-100'
                                  : 'text-red-900 dark:text-red-100'
                              }`}>
                                {compliance.isCompliant ? 'Compliant' : 'Non-Compliant'}
                              </h4>
                            </div>
                            <p className={`text-sm ${
                              compliance.isCompliant
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-red-700 dark:text-red-300'
                            }`}>
                              {compliance.isCompliant
                                ? 'Worker compensation meets or exceeds prevailing wage requirements.'
                                : `Worker compensation is below prevailing wage. Make-up payment required.`
                              }
                            </p>
                          </div>

                          <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Classification:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {compliance.classification.classification_title}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Prevailing Wage:</span>
                              <span className="font-semibold text-blue-600">
                                ${compliance.prevailingWage.toFixed(2)}/hr
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Actual Wage:</span>
                              <span className={`font-semibold ${
                                compliance.isCompliant ? 'text-green-600' : 'text-red-600'
                              }`}>
                                ${compliance.actualWage.toFixed(2)}/hr
                              </span>
                            </div>
                            {!compliance.isCompliant && (
                              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                                <span className="text-sm font-medium text-red-600">Shortfall per Hour:</span>
                                <span className="font-bold text-red-600">
                                  ${compliance.shortfall.toFixed(2)}/hr
                                </span>
                              </div>
                            )}
                          </div>

                          {hoursWorked > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                              <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                                Weekly Calculation
                              </h5>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Total Base Pay:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  ${compliance.totalPay.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Total Fringe:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  ${compliance.totalFringe.toFixed(2)}
                                </span>
                              </div>
                              {!compliance.isCompliant && (
                                <div className="flex items-center justify-between pt-3 border-t border-red-200 dark:border-red-800">
                                  <span className="text-sm font-medium text-red-600">Make-Up Required:</span>
                                  <span className="font-bold text-red-600 text-lg">
                                    ${compliance.makeUpRequired.toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          <Calculator className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
                            Ready to Calculate
                          </p>
                          <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs">
                            Select a wage determination and classification to begin calculating compliance
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Certified Payroll Reports
                    </h3>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate WH-347 Report
                    </button>
                  </div>

                  {certifiedReports.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No certified payroll reports found</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Week Ending
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Project
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Employees
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Total Hours
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Total Wages
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                          {certifiedReports.map((report) => (
                            <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {new Date(report.week_ending).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                {report.project_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {report.total_employees}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                {report.total_hours.toFixed(1)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                ${report.total_wages.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                  {report.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button className="text-blue-600 hover:text-blue-700 mr-3">
                                  <Download className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'determinations' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Wage Determinations Database
                    </h3>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search determinations..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {filteredDeterminations.map((det) => (
                      <div
                        key={det.id}
                        className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {det.determination_number}
                            </h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Location</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {det.county}, {det.state_province}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Project Type</p>
                                <p className="font-medium text-gray-900 dark:text-white capitalize">
                                  {det.project_type.replace('_', ' ')}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Effective Date</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {new Date(det.effective_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="text-center py-12">
                  <Building className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
                    Project Management Coming Soon
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs mx-auto">
                    Track government contracts and assign prevailing wage determinations to projects
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrevailingWageModal;
