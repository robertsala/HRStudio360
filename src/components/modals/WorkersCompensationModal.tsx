import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Save, FileText, Calendar, User, MapPin, Clock, Activity, Users, Building, Shield, ClipboardList, Send, Plus } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import BodyDiagram from '../BodyDiagram';
import { mockEmployees } from '../../data/mockEmployees';

interface WorkersCompensationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Employee {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
}

interface IncidentForm {
  incidentDate: string;
  incidentTime: string;
  employeeId: string;
  supervisorId: string;
  location: string;
  incidentDescription: string;
  witnessNames: string;
  injuryType: string;
  bodyPartsAffected: Array<{ name: string; description: string }>;
  severity: 'minor' | 'moderate' | 'severe' | 'critical' | '';
  treatmentRequired: 'first_aid' | 'medical_attention' | 'emergency_room' | 'hospitalization' | '';
  medicalFacility: string;
  lostTime: boolean;
  daysAwayFromWork: number;
  daysRestrictedDuty: number;
  recordable: boolean;
  rootCause: string;
  correctiveActions: string;
}

export default function WorkersCompensationModal({ isOpen, onClose }: WorkersCompensationModalProps) {
  const [activeTab, setActiveTab] = useState<'report' | 'incidents' | 'osha'>('report');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [oshaLogs, setOshaLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showSupervisorDropdown, setShowSupervisorDropdown] = useState(false);
  const [formData, setFormData] = useState<IncidentForm>({
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: new Date().toTimeString().slice(0, 5),
    employeeId: '',
    supervisorId: '',
    location: '',
    incidentDescription: '',
    witnessNames: '',
    injuryType: '',
    bodyPartsAffected: [],
    severity: '',
    treatmentRequired: '',
    medicalFacility: '',
    lostTime: false,
    daysAwayFromWork: 0,
    daysRestrictedDuty: 0,
    recordable: false,
    rootCause: '',
    correctiveActions: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      fetchIncidents();
      fetchOshaLogs();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const fetchEmployees = async () => {
    // Use mock employee data from Directory
    const formattedEmployees = mockEmployees.map((emp) => {
      const [firstName, ...lastNameParts] = emp.name.split(' ');
      return {
        id: emp.id,
        name: emp.name,
        first_name: firstName,
        last_name: lastNameParts.join(' '),
        email: emp.email,
        department: emp.department,
        position: emp.role
      };
    });
    setEmployees(formattedEmployees);
  };

  const fetchIncidents = async () => {
    const { data, error } = await supabase
      .from('workers_comp_incidents')
      .select(`
        *,
        employee:employees!workers_comp_incidents_employee_id_fkey(first_name, last_name, position),
        supervisor:employees!workers_comp_incidents_supervisor_id_fkey(first_name, last_name)
      `)
      .order('incident_date', { ascending: false });

    if (!error && data) {
      setIncidents(data);
    }
  };

  const fetchOshaLogs = async () => {
    const { data, error } = await supabase
      .from('osha_300_log')
      .select('*')
      .order('injury_date', { ascending: false });

    if (!error && data) {
      setOshaLogs(data);
    }
  };

  const generateIncidentNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `WC-${year}-${random}`;
  };

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const incidentDateTime = `${formData.incidentDate}T${formData.incidentTime}:00Z`;
      const witnessArray = formData.witnessNames.split(',').map(w => w.trim()).filter(w => w);

      // For now, store the employee info in the incident description since we're using mock data
      // In production, you'd need actual employee UUIDs from the database
      const employee = employees.find(e => e.id === formData.employeeId);
      const supervisor = employees.find(e => e.id === formData.supervisorId);

      const enhancedDescription = `
Employee: ${employee?.name || 'Unknown'}
Department: ${employee?.department || 'Unknown'}
Position: ${employee?.position || 'Unknown'}
${supervisor ? `Supervisor: ${supervisor.name}` : ''}

Incident Description:
${formData.incidentDescription}
      `.trim();

      const { data: incident, error } = await supabase
        .from('workers_comp_incidents')
        .insert({
          incident_number: generateIncidentNumber(),
          incident_date: incidentDateTime,
          employee_id: null, // Using null since we're working with mock employee data
          supervisor_id: null, // Using null since we're working with mock employee data
          reporter_id: user.id,
          location: formData.location,
          incident_description: enhancedDescription,
          witness_names: witnessArray,
          injury_type: formData.injuryType,
          body_parts_affected: formData.bodyPartsAffected,
          severity: formData.severity,
          treatment_required: formData.treatmentRequired,
          medical_facility: formData.medicalFacility || null,
          lost_time: formData.lostTime,
          days_away_from_work: formData.daysAwayFromWork,
          days_restricted_duty: formData.daysRestrictedDuty,
          recordable: formData.recordable,
          root_cause: formData.rootCause,
          corrective_actions: formData.correctiveActions,
          status: 'open',
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      if (formData.recordable && incident && employee) {
        const year = new Date(formData.incidentDate).getFullYear();
        const caseNumber = `${year}-${String(oshaLogs.filter(log => log.year === year).length + 1).padStart(4, '0')}`;

        let classification = 'other_recordable';
        if (formData.daysAwayFromWork > 0) classification = 'days_away_from_work';
        else if (formData.daysRestrictedDuty > 0) classification = 'job_transfer_restriction';

        await supabase
          .from('osha_300_log')
          .insert({
            incident_id: incident.id,
            case_number: caseNumber,
            employee_name: employee.name,
            job_title: employee.position,
            injury_date: formData.incidentDate,
            where_event_occurred: formData.location,
            injury_description: formData.incidentDescription,
            injury_classification: classification,
            days_away_from_work: formData.daysAwayFromWork,
            days_job_transfer_restriction: formData.daysRestrictedDuty,
            year: year
          });
      }

      alert('Incident reported successfully');
      resetForm();
      fetchIncidents();
      fetchOshaLogs();
      setActiveTab('incidents');
    } catch (error: any) {
      alert('Error submitting incident: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      incidentDate: new Date().toISOString().split('T')[0],
      incidentTime: new Date().toTimeString().slice(0, 5),
      employeeId: '',
      supervisorId: '',
      location: '',
      incidentDescription: '',
      witnessNames: '',
      injuryType: '',
      bodyPartsAffected: [],
      severity: '',
      treatmentRequired: '',
      medicalFacility: '',
      lostTime: false,
      daysAwayFromWork: 0,
      daysRestrictedDuty: 0,
      recordable: false,
      rootCause: '',
      correctiveActions: ''
    });
    setEmployeeSearch('');
    setSupervisorSearch('');
    setShowEmployeeDropdown(false);
    setShowSupervisorDropdown(false);
  };

  const performAIEmployeeSearch = (query: string) => {
    if (!query.trim()) return employees.slice(0, 10);

    const searchTerm = query.toLowerCase();
    const scored = employees.map(emp => {
      let score = 0;
      const fullName = emp.name.toLowerCase();

      // Exact matches get highest priority
      if (fullName === searchTerm) score += 100;
      if (emp.email.toLowerCase() === searchTerm) score += 90;
      if (emp.position.toLowerCase() === searchTerm) score += 80;
      if (emp.department.toLowerCase() === searchTerm) score += 70;

      // Starts with matches
      if (fullName.startsWith(searchTerm)) score += 50;
      if (emp.first_name.toLowerCase().startsWith(searchTerm)) score += 45;
      if (emp.last_name.toLowerCase().startsWith(searchTerm)) score += 45;
      if (emp.position.toLowerCase().startsWith(searchTerm)) score += 40;
      if (emp.department.toLowerCase().startsWith(searchTerm)) score += 35;

      // Contains matches
      if (fullName.includes(searchTerm)) score += 30;
      if (emp.first_name.toLowerCase().includes(searchTerm)) score += 25;
      if (emp.last_name.toLowerCase().includes(searchTerm)) score += 25;
      if (emp.position.toLowerCase().includes(searchTerm)) score += 20;
      if (emp.department.toLowerCase().includes(searchTerm)) score += 15;
      if (emp.email.toLowerCase().includes(searchTerm)) score += 10;

      // Word boundary matches (e.g., "eng" matches "Engineering")
      const words = searchTerm.split(' ');
      words.forEach(word => {
        if (word.length >= 2) {
          if (fullName.split(' ').some(n => n.startsWith(word))) score += 15;
          if (emp.department.toLowerCase().split(' ').some(d => d.startsWith(word))) score += 10;
          if (emp.position.toLowerCase().split(' ').some(p => p.startsWith(word))) score += 10;
        }
      });

      return { emp, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.emp);
  };

  const filteredEmployees = performAIEmployeeSearch(employeeSearch);

  const filteredSupervisors = performAIEmployeeSearch(supervisorSearch);

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.name} - ${emp.position}` : '';
  };

  const getSupervisorName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.name : '';
  };

  const handleGenerateOSHA300A = async () => {
    const currentYear = new Date().getFullYear();
    const yearLogs = oshaLogs.filter(log => log.year === currentYear);

    const totalCases = yearLogs.length;
    const totalDeaths = yearLogs.filter(log => log.injury_classification === 'death').length;
    const totalDaysAway = yearLogs.reduce((sum, log) => sum + (log.days_away_from_work || 0), 0);
    const totalJobTransfers = yearLogs.reduce((sum, log) => sum + (log.days_job_transfer_restriction || 0), 0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('osha_reports')
        .insert({
          report_type: 'osha_300a',
          report_period_start: `${currentYear}-01-01`,
          report_period_end: `${currentYear}-12-31`,
          total_cases: totalCases,
          total_deaths: totalDeaths,
          total_days_away: totalDaysAway,
          total_job_transfers: totalJobTransfers,
          total_other_recordable: yearLogs.filter(log => log.injury_classification === 'other_recordable').length,
          report_data: { logs: yearLogs },
          generated_by: user.id
        });

      alert('OSHA 300A Summary Report generated successfully');
    } catch (error: any) {
      alert('Error generating report: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <h2 className="text-xl font-bold">Workers Compensation & OSHA Management</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20 p-2 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'report'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Report Incident
            </button>
            <button
              onClick={() => setActiveTab('incidents')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'incidents'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              All Incidents ({incidents.length})
            </button>
            <button
              onClick={() => setActiveTab('osha')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'osha'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClipboardList className="w-4 h-4 inline mr-2" />
              OSHA 300 Log ({oshaLogs.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'report' && (
            <form onSubmit={handleSubmitIncident} className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-900">Important Notice</h3>
                    <p className="text-sm text-yellow-800 mt-1">
                      Report all workplace injuries immediately. This information will be used for workers compensation claims and OSHA compliance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Incident Date *
                  </label>
                  <input
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Incident Time *
                  </label>
                  <input
                    type="time"
                    value={formData.incidentTime}
                    onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Injured Employee *
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center pointer-events-none">
                      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-full px-1.5 py-0.5 mr-2">
                        <span className="text-xs font-bold text-white">AI</span>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.employeeId ? getEmployeeName(formData.employeeId) : employeeSearch}
                      onChange={(e) => {
                        setEmployeeSearch(e.target.value);
                        setFormData({ ...formData, employeeId: '' });
                        setShowEmployeeDropdown(true);
                      }}
                      onFocus={() => setShowEmployeeDropdown(true)}
                      placeholder="AI Search: name, position, department, email..."
                      className="w-full pl-12 pr-4 py-2 border-2 border-red-100 bg-red-50 dark:bg-red-900/20/30 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-300 transition-all"
                      required
                    />
                  </div>
                  {showEmployeeDropdown && (employeeSearch || !formData.employeeId) && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 dark:bg-gray-800 border-2 border-red-200 rounded-lg shadow-xl max-h-60 overflow-hidden">
                      {employees.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">No employees in directory</p>
                          <p className="text-xs text-gray-500 mt-1">Add employees to use this feature</p>
                        </div>
                      ) : filteredEmployees.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto">
                          {filteredEmployees.map((emp) => (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, employeeId: emp.id });
                                setEmployeeSearch('');
                                setShowEmployeeDropdown(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-red-50 dark:bg-red-900/20 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-white dark:text-white">{emp.name}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">{emp.position} • {emp.department}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">{emp.email}</div>
                                </div>
                              </div>
                            </button>
                          ))}\n                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">No matches for "{employeeSearch}"</p>
                          <p className="text-xs text-gray-500 mt-1">Try a different search term</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Immediate Supervisor *
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center pointer-events-none">
                      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-full px-1.5 py-0.5 mr-2">
                        <span className="text-xs font-bold text-white">AI</span>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.supervisorId ? getSupervisorName(formData.supervisorId) : supervisorSearch}
                      onChange={(e) => {
                        setSupervisorSearch(e.target.value);
                        setFormData({ ...formData, supervisorId: '' });
                        setShowSupervisorDropdown(true);
                      }}
                      onFocus={() => setShowSupervisorDropdown(true)}
                      placeholder="AI Search: name, position, email..."
                      className="w-full pl-12 pr-4 py-2 border-2 border-red-100 bg-red-50 dark:bg-red-900/20/30 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-300 transition-all"
                      required
                    />
                  </div>
                  {showSupervisorDropdown && (supervisorSearch || !formData.supervisorId) && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 dark:bg-gray-800 border-2 border-red-200 rounded-lg shadow-xl max-h-60 overflow-hidden">
                      {employees.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">No supervisors in directory</p>
                          <p className="text-xs text-gray-500 mt-1">Add employees to use this feature</p>
                        </div>
                      ) : filteredSupervisors.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto">
                          {filteredSupervisors.map((emp) => (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, supervisorId: emp.id });
                                setSupervisorSearch('');
                                setShowSupervisorDropdown(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-red-50 dark:bg-red-900/20 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-white dark:text-white">{emp.name}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">{emp.position} • {emp.department}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">{emp.email}</div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">No matches for "{supervisorSearch}"</p>
                          <p className="text-xs text-gray-500 mt-1">Try a different search term</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location Where Incident Occurred *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Production Floor, Warehouse Bay 3, Office Building 2nd Floor"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Incident Description *
                </label>
                <textarea
                  value={formData.incidentDescription}
                  onChange={(e) => setFormData({ ...formData, incidentDescription: e.target.value })}
                  placeholder="Provide a detailed description of what happened, how it happened, and what the employee was doing at the time..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  <Activity className="w-4 h-4 inline mr-1" />
                  Injury Type
                </label>
                <input
                  type="text"
                  value={formData.injuryType}
                  onChange={(e) => setFormData({ ...formData, injuryType: e.target.value })}
                  placeholder="e.g., Laceration, Fracture, Burn, Sprain, Contusion, etc."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3">
                  Body Parts Affected - Click on Diagram *
                </label>
                <BodyDiagram
                  selectedParts={formData.bodyPartsAffected}
                  onPartsChange={(parts) => setFormData({ ...formData, bodyPartsAffected: parts })}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Severity *
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Severity</option>
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Treatment Required *
                  </label>
                  <select
                    value={formData.treatmentRequired}
                    onChange={(e) => setFormData({ ...formData, treatmentRequired: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Treatment</option>
                    <option value="first_aid">First Aid Only</option>
                    <option value="medical_attention">Medical Attention</option>
                    <option value="emergency_room">Emergency Room</option>
                    <option value="hospitalization">Hospitalization</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  <Building className="w-4 h-4 inline mr-1" />
                  Medical Facility (if applicable)
                </label>
                <input
                  type="text"
                  value={formData.medicalFacility}
                  onChange={(e) => setFormData({ ...formData, medicalFacility: e.target.value })}
                  placeholder="Name of hospital, clinic, or medical facility"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Witness Names (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.witnessNames}
                  onChange={(e) => setFormData({ ...formData, witnessNames: e.target.value })}
                  placeholder="John Smith, Jane Doe, Mike Johnson"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white dark:text-white">Lost Time & Restrictions</h3>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.lostTime}
                    onChange={(e) => setFormData({ ...formData, lostTime: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <label className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">Resulted in lost work time</label>
                </div>

                {formData.lostTime && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                        Days Away from Work
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.daysAwayFromWork}
                        onChange={(e) => setFormData({ ...formData, daysAwayFromWork: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                        Days on Restricted Duty
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.daysRestrictedDuty}
                        onChange={(e) => setFormData({ ...formData, daysRestrictedDuty: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <input
                  type="checkbox"
                  checked={formData.recordable}
                  onChange={(e) => setFormData({ ...formData, recordable: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">
                  <strong>OSHA Recordable:</strong> Check if this incident meets OSHA recordability criteria
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Root Cause Analysis
                </label>
                <textarea
                  value={formData.rootCause}
                  onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                  placeholder="What was the root cause of this incident?"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Corrective Actions Taken
                </label>
                <textarea
                  value={formData.correctiveActions}
                  onChange={(e) => setFormData({ ...formData, correctiveActions: e.target.value })}
                  placeholder="What actions have been taken to prevent this from happening again?"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || formData.bodyPartsAffected.length === 0}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Submitting...' : 'Submit Incident Report'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'incidents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">All Reported Incidents</h3>
                <button
                  onClick={() => setActiveTab('report')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Incident
                </button>
              </div>

              {incidents.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No incidents reported yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-medium text-gray-900 dark:text-white dark:text-white">{incident.incident_number}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              incident.severity === 'severe' ? 'bg-orange-100 text-orange-800' :
                              incident.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {incident.severity}
                            </span>
                            {incident.recordable && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                OSHA Recordable
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {incident.employee?.first_name} {incident.employee?.last_name} - {incident.employee?.position}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          incident.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                          incident.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {incident.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3">{incident.incident_description}</p>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Date:</span> {new Date(incident.incident_date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {incident.location}
                        </div>
                        <div>
                          <span className="font-medium">Treatment:</span> {incident.treatment_required?.replace('_', ' ')}
                        </div>
                        <div>
                          <span className="font-medium">Supervisor:</span> {incident.supervisor?.first_name} {incident.supervisor?.last_name}
                        </div>
                      </div>

                      {incident.body_parts_affected && incident.body_parts_affected.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 dark:border-gray-700">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Injuries: </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {incident.body_parts_affected.map((part: any) => part.name).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'osha' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">OSHA 300 Log</h3>
                <button
                  onClick={handleGenerateOSHA300A}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Generate 300A Summary
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">About OSHA 300 Log</h4>
                <p className="text-sm text-blue-800">
                  The OSHA 300 Log is a mandatory record of work-related injuries and illnesses.
                  It must be maintained for establishments with 11 or more employees and kept on file for 5 years.
                </p>
              </div>

              {oshaLogs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No OSHA recordable incidents</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900">
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Case No.</th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Employee</th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Job Title</th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Date</th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Location</th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Description</th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Classification</th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Days Away</th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Days Restricted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oshaLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 dark:bg-gray-900">
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs">{log.case_number}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs">{log.employee_name}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs">{log.job_title}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs">{new Date(log.injury_date).toLocaleDateString()}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs">{log.where_event_occurred}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs">{log.injury_description}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs">
                            {log.injury_classification?.replace(/_/g, ' ')}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs text-center">{log.days_away_from_work || 0}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs text-center">{log.days_job_transfer_restriction || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white dark:text-white mb-3">Summary Statistics</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{oshaLogs.length}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
                      {oshaLogs.filter(log => log.injury_classification === 'days_away_from_work').length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Days Away Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
                      {oshaLogs.reduce((sum, log) => sum + (log.days_away_from_work || 0), 0)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Days Lost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
                      {oshaLogs.filter(log => log.injury_classification === 'job_transfer_restriction').length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Restricted Duty Cases</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
