import React, { useState, useEffect } from 'react';
import { X, Users, FileText, DollarSign, Award, AlertCircle, Calendar, Building, Phone, Mail, MapPin, TrendingUp, Shield, Clock, Search, Filter, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface Union {
  id: string;
  union_name: string;
  union_abbreviation: string;
  international_affiliation: string;
  headquarters_location: string;
  industry: string;
  is_active: boolean;
  member_count?: number;
}

interface LocalChapter {
  id: string;
  union_id: string;
  chapter_number: string;
  chapter_name: string;
  city: string;
  state_province: string;
  local_president_name: string;
  local_president_email: string;
  local_president_phone: string;
}

interface CBA {
  id: string;
  cba_number: string;
  cba_name: string;
  union_id: string;
  effective_date: string;
  expiration_date: string;
  status: string;
  document_url: string;
}

interface WageSchedule {
  id: string;
  cba_id: string;
  job_classification: string;
  experience_level: string;
  base_hourly_rate: number;
  overtime_rate_multiplier: number;
  night_shift_differential: number;
}

interface UnionMember {
  id: string;
  employee_id: string;
  employee_name: string;
  union_id: string;
  membership_number: string;
  join_date: string;
  good_standing: boolean;
  status: string;
}

interface Seniority {
  id: string;
  employee_id: string;
  employee_name: string;
  hire_date: string;
  adjusted_seniority_date: string;
  seniority_rank: number;
  classification: string;
}

interface Grievance {
  id: string;
  grievance_number: string;
  employee_name: string;
  grievance_type: string;
  subject: string;
  filed_date: string;
  step_level: number;
  status: string;
}

interface UnionManagementModalProps {
  onClose: () => void;
}

const UnionManagementModal: React.FC<UnionManagementModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'cbas' | 'wages' | 'membership' | 'grievances'>('overview');
  const [unions, setUnions] = useState<Union[]>([]);
  const [localChapters, setLocalChapters] = useState<LocalChapter[]>([]);
  const [cbas, setCbas] = useState<CBA[]>([]);
  const [wageSchedules, setWageSchedules] = useState<WageSchedule[]>([]);
  const [members, setMembers] = useState<UnionMember[]>([]);
  const [seniority, setSeniority] = useState<Seniority[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);

  const [selectedUnion, setSelectedUnion] = useState<Union | null>(null);
  const [selectedCBA, setSelectedCBA] = useState<CBA | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadUnions(),
        loadLocalChapters(),
        loadCBAs(),
        loadWageSchedules(),
        loadMembers(),
        loadSeniority(),
        loadGrievances()
      ]);
    } catch (error) {
      console.error('Error loading union data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnions = async () => {
    const { data, error } = await supabase
      .from('unions_master')
      .select('*')
      .eq('is_active', true)
      .order('union_name');

    if (!error && data) {
      const unionsWithCounts = await Promise.all(
        data.map(async (union) => {
          const { count } = await supabase
            .from('union_membership')
            .select('*', { count: 'exact', head: true })
            .eq('union_id', union.id)
            .eq('status', 'active');

          return { ...union, member_count: count || 0 };
        })
      );
      setUnions(unionsWithCounts);
    }
  };

  const loadLocalChapters = async () => {
    const { data, error } = await supabase
      .from('union_local_chapters')
      .select('*')
      .eq('is_active', true)
      .order('chapter_name');

    if (!error && data) {
      setLocalChapters(data);
    }
  };

  const loadCBAs = async () => {
    const { data, error } = await supabase
      .from('collective_bargaining_agreements')
      .select('*')
      .in('status', ['active', 'tentative'])
      .order('expiration_date');

    if (!error && data) {
      setCbas(data);
    }
  };

  const loadWageSchedules = async () => {
    const { data, error } = await supabase
      .from('cba_wage_schedules')
      .select('*')
      .order('job_classification');

    if (!error && data) {
      setWageSchedules(data);
    }
  };

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from('union_membership')
      .select(`
        *,
        employee:employees(id, first_name, last_name)
      `)
      .eq('status', 'active')
      .order('join_date', { ascending: false });

    if (!error && data) {
      const formattedMembers = data.map((m: any) => ({
        id: m.id,
        employee_id: m.employee_id,
        employee_name: m.employee ? `${m.employee.first_name} ${m.employee.last_name}` : 'Unknown',
        union_id: m.union_id,
        membership_number: m.membership_number,
        join_date: m.join_date,
        good_standing: m.good_standing,
        status: m.status
      }));
      setMembers(formattedMembers);
    }
  };

  const loadSeniority = async () => {
    const { data, error } = await supabase
      .from('union_seniority')
      .select(`
        *,
        employee:employees(id, first_name, last_name)
      `)
      .order('seniority_rank');

    if (!error && data) {
      const formattedSeniority = data.map((s: any) => ({
        id: s.id,
        employee_id: s.employee_id,
        employee_name: s.employee ? `${s.employee.first_name} ${s.employee.last_name}` : 'Unknown',
        hire_date: s.hire_date,
        adjusted_seniority_date: s.adjusted_seniority_date,
        seniority_rank: s.seniority_rank,
        classification: s.classification
      }));
      setSeniority(formattedSeniority);
    }
  };

  const loadGrievances = async () => {
    const { data, error } = await supabase
      .from('union_grievances')
      .select(`
        *,
        employee:employees(id, first_name, last_name)
      `)
      .order('filed_date', { ascending: false });

    if (!error && data) {
      const formattedGrievances = data.map((g: any) => ({
        id: g.id,
        grievance_number: g.grievance_number,
        employee_name: g.employee ? `${g.employee.first_name} ${g.employee.last_name}` : 'Unknown',
        grievance_type: g.grievance_type,
        subject: g.subject,
        filed_date: g.filed_date,
        step_level: g.step_level,
        status: g.status
      }));
      setGrievances(formattedGrievances);
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
    } else if (daysUntilExpiration <= 90) {
      return { color: 'orange', text: `${daysUntilExpiration} days`, urgent: false };
    } else {
      return { color: 'green', text: `${daysUntilExpiration} days`, urgent: false };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-blue-600 bg-blue-100';
      case 'denied': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredGrievances = grievances.filter(g =>
    g.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.grievance_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Union Management</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Collective Bargaining, Wages, Membership & Grievances
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

          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Active Unions</p>
                  <p className="text-3xl font-bold">{unions.length}</p>
                </div>
                <Building className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Union Members</p>
                  <p className="text-3xl font-bold">{members.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Active CBAs</p>
                  <p className="text-3xl font-bold">{cbas.filter(c => c.status === 'active').length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Open Grievances</p>
                  <p className="text-3xl font-bold">
                    {grievances.filter(g => !['resolved', 'withdrawn', 'denied'].includes(g.status)).length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-200" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'overview'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Building className="h-5 w-5" />
              <span>Unions & Chapters</span>
            </button>
            <button
              onClick={() => setActiveTab('cbas')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'cbas'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>CBAs & Benefits</span>
            </button>
            <button
              onClick={() => setActiveTab('wages')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'wages'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <DollarSign className="h-5 w-5" />
              <span>Wage Schedules</span>
            </button>
            <button
              onClick={() => setActiveTab('membership')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'membership'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Award className="h-5 w-5" />
              <span>Membership & Seniority</span>
            </button>
            <button
              onClick={() => setActiveTab('grievances')}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'grievances'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <AlertCircle className="h-5 w-5" />
              <span>Grievances</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-300px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Unions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {unions.map((union) => (
                        <div
                          key={union.id}
                          className="bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 p-6 hover:border-blue-400 transition-colors cursor-pointer"
                          onClick={() => setSelectedUnion(union)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-xl font-bold text-gray-900 dark:text-white">{union.union_abbreviation}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{union.union_name}</p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                              {union.member_count} members
                            </span>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <Building className="h-4 w-4 mr-2" />
                              <span>{union.industry}</span>
                            </div>
                            {union.international_affiliation && (
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <Shield className="h-4 w-4 mr-2" />
                                <span>{union.international_affiliation}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Local Chapters: <span className="font-semibold text-gray-900 dark:text-white">
                                {localChapters.filter(c => c.union_id === union.id).length}
                              </span>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Active CBAs: <span className="font-semibold text-gray-900 dark:text-white">
                                {cbas.filter(c => c.union_id === union.id && c.status === 'active').length}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedUnion && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Local Chapters - {selectedUnion.union_abbreviation}
                      </h3>
                      <div className="space-y-3">
                        {localChapters
                          .filter(chapter => chapter.union_id === selectedUnion.id)
                          .map((chapter) => (
                            <div
                              key={chapter.id}
                              className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {chapter.chapter_name} (Chapter {chapter.chapter_number})
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {chapter.city}, {chapter.state_province}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                {chapter.local_president_name && (
                                  <div>
                                    <p className="text-gray-600 dark:text-gray-400 mb-1">President</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{chapter.local_president_name}</p>
                                    {chapter.local_president_email && (
                                      <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
                                        <Mail className="h-3 w-3 mr-1" />
                                        {chapter.local_president_email}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'cbas' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Collective Bargaining Agreements
                    </h3>
                    <div className="space-y-4">
                      {cbas.map((cba) => {
                        const expiration = getExpirationWarning(cba.expiration_date);
                        const union = unions.find(u => u.id === cba.union_id);

                        return (
                          <div
                            key={cba.id}
                            className="bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => setSelectedCBA(cba)}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{cba.cba_name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">CBA #{cba.cba_number}</p>
                                {union && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {union.union_name}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(cba.status)}`}>
                                  {cba.status}
                                </span>
                                {expiration.urgent && (
                                  <div className="mt-2 flex items-center text-red-600">
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    <span className="text-sm font-semibold">Expires in {expiration.text}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Effective Date</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {new Date(cba.effective_date).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Expiration Date</p>
                                <p className={`font-medium ${expiration.urgent ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                                  {new Date(cba.expiration_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {cba.document_url && (
                              <div className="mt-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(cba.document_url, '_blank');
                                  }}
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  View CBA Document
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'wages' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Union Wage Schedules</h3>
                    <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Job Classification
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Experience Level
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Base Rate
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              OT Multiplier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Night Differential
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                          {wageSchedules.map((schedule) => (
                            <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {schedule.job_classification}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 capitalize">
                                {schedule.experience_level.replace('_', ' ')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                ${schedule.base_hourly_rate.toFixed(2)}/hr
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                {schedule.overtime_rate_multiplier}x
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                ${schedule.night_shift_differential.toFixed(2)}/hr
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'membership' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Union Membership Roster</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {members.map((member) => {
                        const union = unions.find(u => u.id === member.union_id);
                        return (
                          <div
                            key={member.id}
                            className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">{member.employee_name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Member #{member.membership_number}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                member.good_standing
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {member.good_standing ? 'Good Standing' : 'Not in Good Standing'}
                              </span>
                            </div>

                            <div className="text-sm space-y-1">
                              {union && (
                                <p className="text-gray-600 dark:text-gray-400">
                                  Union: <span className="font-medium text-gray-900 dark:text-white">{union.union_abbreviation}</span>
                                </p>
                              )}
                              <p className="text-gray-600 dark:text-gray-400">
                                Join Date: <span className="font-medium text-gray-900 dark:text-white">
                                  {new Date(member.join_date).toLocaleDateString()}
                                </span>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Seniority Rankings</h3>
                    <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Rank
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Employee
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Classification
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Hire Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Adjusted Seniority Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                          {seniority.map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                                  #{s.seniority_rank}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {s.employee_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                {s.classification}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                {new Date(s.hire_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                {new Date(s.adjusted_seniority_date).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'grievances' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Union Grievances</h3>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search grievances..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredGrievances.map((grievance) => (
                      <div
                        key={grievance.id}
                        className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{grievance.subject}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Grievance #{grievance.grievance_number}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(grievance.status)}`}>
                            {grievance.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Employee</p>
                            <p className="font-medium text-gray-900 dark:text-white">{grievance.employee_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Type</p>
                            <p className="font-medium text-gray-900 dark:text-white capitalize">
                              {grievance.grievance_type.replace('_', ' ')}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Filed Date</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(grievance.filed_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Step Level</p>
                            <p className="font-medium text-gray-900 dark:text-white">Step {grievance.step_level}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredGrievances.length === 0 && (
                      <div className="text-center py-12">
                        <CheckCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No grievances found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
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

export default UnionManagementModal;
