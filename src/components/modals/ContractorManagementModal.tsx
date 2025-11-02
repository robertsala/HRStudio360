import React, { useState, useEffect } from 'react';
import { X, Users, Building, FileText, DollarSign, Shield, Search, Filter, CheckCircle, AlertTriangle, Calendar, Mail, Phone, MapPin, CreditCard, TrendingUp, Clock, Award, ChevronRight } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface ContractorDetails {
  id: string;
  contractor_id: string;
  contractor_type: string;
  business_name: string;
  business_type: string;
  ein_number: string;
  tax_id_number: string;
  country_code: string;
  payment_method: string;
  currency_code: string;
  requires_1099: boolean;
  w9_form_url: string;
  w9_date_signed: string;
  insurance_required: boolean;
  background_check_completed: boolean;
}

interface ContractorCompany {
  id: string;
  company_name: string;
  company_type: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  payment_terms: string;
  is_active: boolean;
  rating: number;
}

interface ContractorAgreement {
  id: string;
  contractor_id: string;
  agreement_type: string;
  agreement_title: string;
  start_date: string;
  end_date: string;
  contract_value: number;
  currency_code: string;
  payment_structure: string;
  hourly_rate: number;
  status: string;
  signed_by_contractor: boolean;
  signed_by_company: boolean;
}

interface ContractorInvoice {
  id: string;
  invoice_number: string;
  contractor_id: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  currency_code: string;
  status: string;
  paid_date: string;
}

interface ContractorInsurance {
  id: string;
  contractor_id: string;
  insurance_type: string;
  insurance_carrier: string;
  policy_number: string;
  coverage_amount: number;
  effective_date: string;
  expiration_date: string;
  status: string;
}

interface ComplianceDocument {
  id: string;
  worker_id: string;
  document_type: string;
  document_name: string;
  expiration_date: string;
  verification_status: string;
}

interface ContractorManagementModalProps {
  onClose: () => void;
}

const ContractorManagementModal: React.FC<ContractorManagementModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'individual' | 'companies' | 'agreements' | 'invoices' | 'insurance'>('individual');
  const [contractors, setContractors] = useState<ContractorDetails[]>([]);
  const [companies, setCompanies] = useState<ContractorCompany[]>([]);
  const [agreements, setAgreements] = useState<ContractorAgreement[]>([]);
  const [invoices, setInvoices] = useState<ContractorInvoice[]>([]);
  const [insurance, setInsurance] = useState<ContractorInsurance[]>([]);
  const [complianceDocs, setComplianceDocs] = useState<ComplianceDocument[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState<ContractorDetails | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadContractors(),
        loadCompanies(),
        loadAgreements(),
        loadInvoices(),
        loadInsurance(),
        loadComplianceDocs()
      ]);
    } catch (error) {
      console.error('Error loading contractor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadContractors = async () => {
    const { data, error } = await supabase
      .from('contractor_details')
      .select('*')
      .order('business_name');

    if (!error && data) {
      setContractors(data);
    }
  };

  const loadCompanies = async () => {
    const { data, error } = await supabase
      .from('contractor_companies')
      .select('*')
      .order('company_name');

    if (!error && data) {
      setCompanies(data);
    }
  };

  const loadAgreements = async () => {
    const { data, error } = await supabase
      .from('contractor_agreements')
      .select('*')
      .order('start_date', { ascending: false });

    if (!error && data) {
      setAgreements(data);
    }
  };

  const loadInvoices = async () => {
    const { data, error } = await supabase
      .from('contractor_invoices')
      .select('*')
      .order('invoice_date', { ascending: false });

    if (!error && data) {
      setInvoices(data);
    }
  };

  const loadInsurance = async () => {
    const { data, error } = await supabase
      .from('contractor_insurance')
      .select('*')
      .order('expiration_date');

    if (!error && data) {
      setInsurance(data);
    }
  };

  const loadComplianceDocs = async () => {
    const { data, error } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('worker_type', 'contractor')
      .order('expiration_date');

    if (!error && data) {
      setComplianceDocs(data);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'submitted': return 'text-blue-600 bg-blue-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'paid': return 'text-green-600 bg-green-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getExpirationWarning = (expirationDate: string) => {
    const today = new Date();
    const expiration = new Date(expirationDate);
    const daysUntilExpiration = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      return { color: 'red', text: 'Expired', urgent: true };
    } else if (daysUntilExpiration <= 30) {
      return { color: 'red', text: `${daysUntilExpiration} days`, urgent: true };
    } else if (daysUntilExpiration <= 60) {
      return { color: 'orange', text: `${daysUntilExpiration} days`, urgent: false };
    } else {
      return { color: 'green', text: `${daysUntilExpiration} days`, urgent: false };
    }
  };

  const filteredContractors = contractors.filter(c =>
    (c.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     c.ein_number?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCompanies = companies.filter(c =>
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterStatus === 'all' || (filterStatus === 'active' && c.is_active) || (filterStatus === 'inactive' && !c.is_active))
  );

  const filteredAgreements = agreements.filter(a => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  const filteredInvoices = invoices.filter(i => {
    if (filterStatus === 'all') return true;
    return i.status === filterStatus;
  });

  const expiringInsurance = insurance.filter(ins => {
    const expiration = new Date(ins.expiration_date);
    const today = new Date();
    const daysUntil = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 60 && ins.status === 'active';
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Contractor Management</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Independent Contractors, Agreements, Invoices & Compliance
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

          <div className="mt-6 grid grid-cols-5 gap-4">
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Contractors</p>
                  <p className="text-3xl font-bold">{contractors.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Companies</p>
                  <p className="text-3xl font-bold">{companies.filter(c => c.is_active).length}</p>
                </div>
                <Building className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Active Agreements</p>
                  <p className="text-3xl font-bold">{agreements.filter(a => a.status === 'active').length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Pending Invoices</p>
                  <p className="text-3xl font-bold">{invoices.filter(i => ['submitted', 'approved'].includes(i.status)).length}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Expiring Insurance</p>
                  <p className="text-3xl font-bold text-yellow-300">{expiringInsurance.length}</p>
                </div>
                <Shield className="h-8 w-8 text-yellow-200" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('individual')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'individual'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Individual Contractors</span>
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'companies'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Building className="h-5 w-5" />
              <span>Contractor Companies</span>
            </button>
            <button
              onClick={() => setActiveTab('agreements')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'agreements'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>Agreements & Contracts</span>
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'invoices'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <DollarSign className="h-5 w-5" />
              <span>Invoices & Payments</span>
            </button>
            <button
              onClick={() => setActiveTab('insurance')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'insurance'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Shield className="h-5 w-5" />
              <span>Insurance & Compliance</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {(activeTab === 'companies' || activeTab === 'agreements' || activeTab === 'invoices') && (
              <div className="flex items-center space-x-2 ml-4">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  {activeTab === 'companies' && (
                    <>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </>
                  )}
                  {activeTab === 'agreements' && (
                    <>
                      <option value="active">Active</option>
                      <option value="pending_signature">Pending Signature</option>
                      <option value="completed">Completed</option>
                      <option value="terminated">Terminated</option>
                    </>
                  )}
                  {activeTab === 'invoices' && (
                    <>
                      <option value="submitted">Submitted</option>
                      <option value="approved">Approved</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </>
                  )}
                </select>
              </div>
            )}
          </div>

          <div className="overflow-y-auto max-h-[calc(95vh-450px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {activeTab === 'individual' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredContractors.map((contractor) => (
                      <div
                        key={contractor.id}
                        className="bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 p-6 hover:border-blue-400 transition-colors cursor-pointer"
                        onClick={() => setSelectedContractor(contractor)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                              {contractor.business_name || 'Individual Contractor'}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {contractor.contractor_type.replace('_', ' ')}
                            </p>
                          </div>
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                            {contractor.country_code}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm">
                          {contractor.ein_number && (
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <FileText className="h-4 w-4 mr-2" />
                              <span>EIN: {contractor.ein_number}</span>
                            </div>
                          )}
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <CreditCard className="h-4 w-4 mr-2" />
                            <span className="capitalize">{contractor.payment_method.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <DollarSign className="h-4 w-4 mr-2" />
                            <span>{contractor.currency_code}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {contractor.w9_form_url && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                W-9 Complete
                              </span>
                            )}
                            {contractor.background_check_completed && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                Background Check
                              </span>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    ))}

                    {filteredContractors.length === 0 && (
                      <div className="col-span-2 text-center py-12">
                        <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No contractors found</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'companies' && (
                  <div className="space-y-4">
                    {filteredCompanies.map((company) => (
                      <div
                        key={company.id}
                        className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white">{company.company_name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {company.company_type.replace('_', ' ')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              company.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {company.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-full">
                              <Award className="h-4 w-4 text-yellow-600 mr-1" />
                              <span className="text-sm font-medium text-yellow-600">{company.rating}/5</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-1">Primary Contact</p>
                            <p className="font-medium text-gray-900 dark:text-white">{company.primary_contact_name}</p>
                            {company.primary_contact_email && (
                              <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
                                <Mail className="h-3 w-3 mr-1" />
                                {company.primary_contact_email}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-1">Payment Terms</p>
                            <p className="font-medium text-gray-900 dark:text-white capitalize">
                              {company.payment_terms.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredCompanies.length === 0 && (
                      <div className="text-center py-12">
                        <Building className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No companies found</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'agreements' && (
                  <div className="space-y-4">
                    {filteredAgreements.map((agreement) => (
                      <div
                        key={agreement.id}
                        className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{agreement.agreement_title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {agreement.agreement_type.replace('_', ' ')}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(agreement.status)}`}>
                            {agreement.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Contract Value</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {agreement.currency_code} {agreement.contract_value.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Payment Structure</p>
                            <p className="font-medium text-gray-900 dark:text-white capitalize">
                              {agreement.payment_structure.replace('_', ' ')}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Start Date</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(agreement.start_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">End Date</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {agreement.end_date ? new Date(agreement.end_date).toLocaleDateString() : 'Ongoing'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center space-x-2">
                            {agreement.signed_by_contractor ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-orange-600" />
                            )}
                            <span className="text-sm text-gray-600 dark:text-gray-400">Contractor Signature</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {agreement.signed_by_company ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-orange-600" />
                            )}
                            <span className="text-sm text-gray-600 dark:text-gray-400">Company Signature</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredAgreements.length === 0 && (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No agreements found</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'invoices' && (
                  <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Invoice #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Invoice Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredInvoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {invoice.invoice_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {new Date(invoice.invoice_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {new Date(invoice.due_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                              {invoice.currency_code} {invoice.total_amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                {invoice.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredInvoices.length === 0 && (
                      <div className="text-center py-12">
                        <DollarSign className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No invoices found</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'insurance' && (
                  <div className="space-y-6">
                    {expiringInsurance.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 p-4 rounded">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
                          <div>
                            <h4 className="text-red-900 dark:text-red-100 font-semibold mb-2">Insurance Expiring Soon</h4>
                            <p className="text-red-700 dark:text-red-300 text-sm">
                              {expiringInsurance.length} insurance policies expire within 60 days
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {insurance.map((ins) => {
                        const expiration = getExpirationWarning(ins.expiration_date);
                        return (
                          <div
                            key={ins.id}
                            className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                                  {ins.insurance_type.replace('_', ' ')}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{ins.insurance_carrier}</p>
                              </div>
                              <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ins.status)}`}>
                                  {ins.status}
                                </span>
                                {expiration.urgent && (
                                  <div className="mt-2 flex items-center text-red-600">
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    <span className="text-sm font-semibold">Expires in {expiration.text}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Policy Number</p>
                                <p className="font-medium text-gray-900 dark:text-white">{ins.policy_number}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Coverage Amount</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  ${ins.coverage_amount.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Effective Date</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {new Date(ins.effective_date).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Expiration Date</p>
                                <p className={`font-medium ${expiration.urgent ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                                  {new Date(ins.expiration_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {insurance.length === 0 && (
                        <div className="text-center py-12">
                          <Shield className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">No insurance records found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

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

export default ContractorManagementModal;
