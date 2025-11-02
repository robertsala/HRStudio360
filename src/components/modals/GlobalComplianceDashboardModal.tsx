import React, { useState, useEffect } from 'react';
import { X, Shield, AlertTriangle, CheckCircle, Clock, FileText, CreditCard, Globe, Calendar, Users, Building, Download, Mail, Bell, TrendingUp, Target, Filter, Search, ChevronRight } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface ComplianceItem {
  id: string;
  worker_id: string;
  worker_name: string;
  worker_type: string;
  item_type: string;
  item_name: string;
  document_type: string;
  expiration_date: string;
  status: string;
  days_until_expiration: number;
  verification_status: string;
  issuing_authority?: string;
}

interface GlobalComplianceDashboardModalProps {
  onClose: () => void;
}

const GlobalComplianceDashboardModal: React.FC<GlobalComplianceDashboardModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'insurance' | 'visas' | 'certifications' | 'agreements'>('overview');
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadComplianceData();
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

  const loadComplianceData = async () => {
    setIsLoading(true);
    try {
      const items: ComplianceItem[] = [];

      // Load compliance documents
      const { data: docsData } = await supabase
        .from('compliance_documents')
        .select(`
          *,
          employee:employees(first_name, last_name)
        `)
        .not('expiration_date', 'is', null)
        .order('expiration_date');

      if (docsData) {
        items.push(...docsData.map((doc: any) => ({
          id: doc.id,
          worker_id: doc.worker_id,
          worker_name: doc.employee ? `${doc.employee.first_name} ${doc.employee.last_name}` : 'Unknown',
          worker_type: doc.worker_type || 'employee',
          item_type: 'document',
          item_name: doc.document_name,
          document_type: doc.document_type,
          expiration_date: doc.expiration_date,
          status: doc.verification_status || 'pending',
          days_until_expiration: calculateDaysUntilExpiration(doc.expiration_date),
          verification_status: doc.verification_status,
          issuing_authority: doc.issuing_authority
        })));
      }

      // Load contractor insurance
      const { data: insuranceData } = await supabase
        .from('contractor_insurance')
        .select('*')
        .order('expiration_date');

      if (insuranceData) {
        items.push(...insuranceData.map((ins: any) => ({
          id: ins.id,
          worker_id: ins.contractor_id,
          worker_name: 'Contractor',
          worker_type: 'contractor',
          item_type: 'insurance',
          item_name: `${ins.insurance_type} - ${ins.insurance_carrier}`,
          document_type: ins.insurance_type,
          expiration_date: ins.expiration_date,
          status: ins.status,
          days_until_expiration: calculateDaysUntilExpiration(ins.expiration_date),
          verification_status: 'verified',
          issuing_authority: ins.insurance_carrier
        })));
      }

      // Load contractor agreements
      const { data: agreementsData } = await supabase
        .from('contractor_agreements')
        .select('*')
        .not('end_date', 'is', null)
        .order('end_date');

      if (agreementsData) {
        items.push(...agreementsData.map((agr: any) => ({
          id: agr.id,
          worker_id: agr.contractor_id,
          worker_name: 'Contractor',
          worker_type: 'contractor',
          item_type: 'agreement',
          item_name: agr.agreement_title,
          document_type: agr.agreement_type,
          expiration_date: agr.end_date,
          status: agr.status,
          days_until_expiration: calculateDaysUntilExpiration(agr.end_date),
          verification_status: agr.signed_by_contractor && agr.signed_by_company ? 'verified' : 'pending',
          issuing_authority: 'Internal'
        })));
      }

      // Load CBA expirations
      const { data: cbaData } = await supabase
        .from('collective_bargaining_agreements')
        .select('*')
        .order('expiration_date');

      if (cbaData) {
        items.push(...cbaData.map((cba: any) => ({
          id: cba.id,
          worker_id: cba.union_id,
          worker_name: 'Union CBA',
          worker_type: 'union',
          item_type: 'certification',
          item_name: cba.cba_name,
          document_type: 'collective_bargaining_agreement',
          expiration_date: cba.expiration_date,
          status: cba.status,
          days_until_expiration: calculateDaysUntilExpiration(cba.expiration_date),
          verification_status: 'verified',
          issuing_authority: 'Union'
        })));
      }

      setComplianceItems(items.sort((a, b) => a.days_until_expiration - b.days_until_expiration));
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDaysUntilExpiration = (expirationDate: string): number => {
    const today = new Date();
    const expiration = new Date(expirationDate);
    const diffTime = expiration.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (days: number) => {
    if (days < 0) return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', border: 'border-red-600' };
    if (days <= 30) return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', border: 'border-red-600' };
    if (days <= 60) return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-600' };
    if (days <= 90) return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-600' };
    return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', border: 'border-green-600' };
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      'active': { label: 'Active', color: 'bg-green-100 text-green-800' },
      'verified': { label: 'Verified', color: 'bg-blue-100 text-blue-800' },
      'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      'expired': { label: 'Expired', color: 'bg-red-100 text-red-800' },
      'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-800' }
    };
    return badges[status.toLowerCase()] || badges['pending'];
  };

  const filterItems = (items: ComplianceItem[]) => {
    let filtered = items;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.document_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by time period
    if (filterPeriod !== 'all') {
      const periodDays = parseInt(filterPeriod);
      filtered = filtered.filter(item => item.days_until_expiration <= periodDays);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status.toLowerCase() === filterStatus.toLowerCase());
    }

    // Filter by tab
    if (activeTab !== 'overview') {
      filtered = filtered.filter(item => {
        switch (activeTab) {
          case 'documents': return item.item_type === 'document';
          case 'insurance': return item.item_type === 'insurance';
          case 'visas': return item.document_type.includes('visa') || item.document_type.includes('work_authorization');
          case 'certifications': return item.item_type === 'certification' || item.document_type.includes('certification');
          case 'agreements': return item.item_type === 'agreement';
          default: return true;
        }
      });
    }

    return filtered;
  };

  const filteredItems = filterItems(complianceItems);

  // Calculate statistics
  const expiredCount = complianceItems.filter(item => item.days_until_expiration < 0).length;
  const expiring30Days = complianceItems.filter(item => item.days_until_expiration >= 0 && item.days_until_expiration <= 30).length;
  const expiring60Days = complianceItems.filter(item => item.days_until_expiration > 30 && item.days_until_expiration <= 60).length;
  const expiring90Days = complianceItems.filter(item => item.days_until_expiration > 60 && item.days_until_expiration <= 90).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Global Compliance Dashboard</h2>
                <p className="text-orange-100 text-sm mt-1">
                  Centralized tracking of all expiring documents, certifications, and agreements
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

          {/* Stats Grid */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Expired</p>
                  <p className="text-3xl font-bold text-red-300">{expiredCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-300" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Next 30 Days</p>
                  <p className="text-3xl font-bold text-red-200">{expiring30Days}</p>
                </div>
                <Clock className="h-8 w-8 text-red-200" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">31-60 Days</p>
                  <p className="text-3xl font-bold text-yellow-200">{expiring60Days}</p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-200" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">61-90 Days</p>
                  <p className="text-3xl font-bold text-green-200">{expiring90Days}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'overview'
                  ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Target className="h-5 w-5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'documents'
                  ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>Documents</span>
            </button>
            <button
              onClick={() => setActiveTab('insurance')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'insurance'
                  ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Shield className="h-5 w-5" />
              <span>Insurance</span>
            </button>
            <button
              onClick={() => setActiveTab('visas')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'visas'
                  ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Globe className="h-5 w-5" />
              <span>Work Authorization</span>
            </button>
            <button
              onClick={() => setActiveTab('certifications')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'certifications'
                  ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <CreditCard className="h-5 w-5" />
              <span>Certifications</span>
            </button>
            <button
              onClick={() => setActiveTab('agreements')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'agreements'
                  ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>Agreements</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by worker, document, or type..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Periods</option>
                <option value="0">Expired</option>
                <option value="30">Next 30 Days</option>
                <option value="60">Next 60 Days</option>
                <option value="90">Next 90 Days</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-450px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
                All Clear!
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm max-w-md mx-auto">
                No compliance items match your current filters or all items are in good standing
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const urgency = getUrgencyColor(item.days_until_expiration);
                const statusBadge = getStatusBadge(item.status);
                return (
                  <div
                    key={item.id}
                    className={`border-l-4 ${urgency.border} ${urgency.bg} rounded-lg p-4 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {item.item_name}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgency.text} ${urgency.bg}`}>
                            {item.days_until_expiration < 0
                              ? `Expired ${Math.abs(item.days_until_expiration)} days ago`
                              : `${item.days_until_expiration} days remaining`
                            }
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Worker</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {item.worker_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Type</p>
                            <p className="font-medium text-gray-900 dark:text-white capitalize">
                              {item.document_type.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Expiration Date</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(item.expiration_date).toLocaleDateString()}
                            </p>
                          </div>
                          {item.issuing_authority && (
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Issuing Authority</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {item.issuing_authority}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="text-orange-600 hover:text-orange-700 p-2 hover:bg-orange-50 rounded-lg transition-colors">
                          <Mail className="h-4 w-4" />
                        </button>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900 flex justify-between">
          <button className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Configure Alerts
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalComplianceDashboardModal;
