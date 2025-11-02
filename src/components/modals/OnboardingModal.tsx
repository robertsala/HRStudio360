import React, { useState } from 'react';
import { Users, CheckCircle, Calendar, User, Building, Briefcase, Clock, X, Send, Plus, Eye, Mail, Phone, MapPin, FileText, Target, Award, Shield, Globe, UserCheck } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useTranslation } from 'react-i18next';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface NewHire {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  startDate: string;
  manager: string;
  status: string;
  progress: number;
  workerClassification?: string;
  classificationRiskScore?: number;
}

interface OnboardingModalProps {
  onClose?: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  useEscapeKey(() => onClose?.(), !!onClose);

  const [activeTab, setActiveTab] = useState('active');
  const [selectedHire, setSelectedHire] = useState<NewHire | null>(null);
  const [showModal, setShowModal] = useState<'details' | 'update' | 'add' | null>(null);
  const [updateMessage, setUpdateMessage] = useState('');
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newHireForm, setNewHireForm] = useState({
    name: '',
    email: '',
    department: '',
    role: '',
    startDate: '',
    manager: ''
  });

  React.useEffect(() => {
    loadNewHires();
  }, []);

  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModal) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showModal]);

  const loadNewHires = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('new_hires')
        .select(`
          *,
          manager:employees!new_hires_manager_id_fkey(first_name, last_name)
        `)
        .order('start_date', { ascending: true });

      if (error) throw error;

      if (data) {
        const { data: tasksData } = await supabase
          .from('onboarding_tasks')
          .select('new_hire_id, status');

        const tasksByHire = tasksData?.reduce((acc: any, task: any) => {
          if (!acc[task.new_hire_id]) {
            acc[task.new_hire_id] = { total: 0, completed: 0 };
          }
          acc[task.new_hire_id].total++;
          if (task.status === 'completed') {
            acc[task.new_hire_id].completed++;
          }
          return acc;
        }, {}) || {};

        const formattedHires: NewHire[] = data.map((h: any) => {
          const tasks = tasksByHire[h.id] || { total: 0, completed: 0 };
          const progress = tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0;

          let status = 'Pre-boarding';
          const today = new Date();
          const startDate = new Date(h.start_date);
          const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

          if (h.status === 'completed') {
            status = 'Completed';
          } else if (daysSinceStart >= 30) {
            status = 'First Month';
          } else if (daysSinceStart >= 7) {
            status = 'First Week';
          } else if (daysSinceStart >= 0) {
            status = 'First Day';
          } else {
            status = 'Pre-boarding';
          }

          return {
            id: h.id,
            name: `${h.first_name} ${h.last_name}`,
            email: h.email,
            department: h.department,
            role: h.role,
            startDate: h.start_date,
            manager: h.manager ? `${h.manager.first_name} ${h.manager.last_name}` : 'Unassigned',
            status,
            progress,
            workerClassification: h.worker_classification_code || 'W2_EMPLOYEE',
            classificationRiskScore: h.classification_risk_score
          };
        });
        setNewHires(formattedHires);
      }
    } catch (error) {
      console.error('Error loading new hires:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pre-boarding': return 'bg-amber-100 text-amber-800';
      case 'First Day': return 'bg-blue-100 text-blue-800';
      case 'First Week': return 'bg-purple-100 text-purple-800';
      case 'First Month': return 'bg-emerald-100 text-emerald-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (hire: NewHire) => {
    setSelectedHire(hire);
    setShowModal('details');
  };

  const handleSendUpdate = (hire: NewHire) => {
    setSelectedHire(hire);
    setShowModal('update');
  };

  const handleAddNewHire = () => {
    setShowModal('add');
  };

  const closeModal = () => {
    setShowModal(null);
    setSelectedHire(null);
    setUpdateMessage('');
    setNewHireForm({
      name: '',
      email: '',
      department: '',
      role: '',
      startDate: '',
      manager: ''
    });
  };

  const getClassificationBadge = (classification: string) => {
    const badges: Record<string, { label: string; color: string; icon: any }> = {
      'W2_EMPLOYEE': { label: 'W-2 Employee', color: 'bg-blue-100 text-blue-800', icon: UserCheck },
      'CONTRACTOR_1099': { label: '1099 Contractor', color: 'bg-purple-100 text-purple-800', icon: Briefcase },
      'INTERNATIONAL_EMPLOYEE': { label: 'International', color: 'bg-orange-100 text-orange-800', icon: Globe },
      'UNION_MEMBER': { label: 'Union Member', color: 'bg-green-100 text-green-800', icon: Shield }
    };
    return badges[classification] || badges['W2_EMPLOYEE'];
  };

  return (
    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white p-6">
        <div className="flex items-center">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800/20 backdrop-blur-sm rounded-xl p-3 mr-4">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t('onboarding.title')}</h2>
            <p className="text-emerald-100">{t('onboarding.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 dark:border-gray-700 bg-white dark:bg-gray-800 dark:bg-gray-800">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === 'active'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('onboarding.activeOnboarding')} ({newHires.filter(h => h.status !== 'Completed').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === 'completed'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed (0)
          </button>
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">{t('onboarding.activeOnboarding')}</h3>
              <button 
                onClick={handleAddNewHire}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('onboarding.addNewHire')}
              </button>
            </div>

            <div className="grid gap-6">
              {newHires.map((hire) => (
                <div key={hire.id} className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                        {getInitials(hire.name)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3 flex-wrap">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">{hire.name}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(hire.status)}`}>
                            {hire.status}
                          </span>
                          {hire.workerClassification && (() => {
                            const badge = getClassificationBadge(hire.workerClassification);
                            const IconComponent = badge.icon;
                            return (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${badge.color}`}>
                                <IconComponent className="h-3 w-3 mr-1" />
                                {badge.label}
                              </span>
                            );
                          })()}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{hire.department}</span>
                          </div>
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{hire.role}</span>
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{hire.manager}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{new Date(hire.startDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">{t('onboarding.onboardingProgress')}</span>
                            <span className="text-lg font-bold text-emerald-600">{hire.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${hire.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => handleViewDetails(hire)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {t('onboarding.viewDetails')}
                      </button>
                      <button 
                        onClick={() => handleSendUpdate(hire)}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {t('onboarding.sendUpdate')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal === 'details' && selectedHire && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
              <h3 className="text-xl font-bold">Onboarding Details - {selectedHire.name}</h3>
              <button onClick={closeModal} className="text-emerald-100 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-3">Employee Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedHire.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedHire.email}</p>
                    <p><span className="font-medium">Department:</span> {selectedHire.department}</p>
                    <p><span className="font-medium">Role:</span> {selectedHire.role}</p>
                    <p><span className="font-medium">Start Date:</span> {new Date(selectedHire.startDate).toLocaleDateString()}</p>
                    <p><span className="font-medium">Manager:</span> {selectedHire.manager}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-3">Progress Overview</h4>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-lg font-bold text-emerald-600">{selectedHire.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full"
                        style={{ width: `${selectedHire.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Onboarding Checklist</h4>
              <div className="space-y-3">
                {[
                  { task: 'Complete I-9 verification', completed: true },
                  { task: 'Set up workstation and accounts', completed: true },
                  { task: 'Benefits enrollment', completed: false },
                  { task: 'Department orientation', completed: false },
                  { task: 'Meet team members', completed: false },
                  { task: 'Complete training modules', completed: false }
                ].map((item, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className={`rounded-full p-1 mr-3 ${item.completed ? 'bg-green-100' : 'bg-gray-200'}`}>
                      <CheckCircle className={`h-4 w-4 ${item.completed ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <span className={`flex-1 ${item.completed ? 'text-gray-900' : 'text-gray-600'}`}>
                      {item.task}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.completed ? 'Complete' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal === 'update' && selectedHire && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Send Update to {selectedHire.name}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:text-gray-400">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <textarea
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                rows={4}
                placeholder="Enter your message to the new hire..."
              />
              <div className="flex justify-end space-x-3">
                <button onClick={closeModal} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800">
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    console.log('Sending update to:', selectedHire.name, updateMessage);
                    closeModal();
                  }}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                >
                  Send Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal === 'add' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Add New Hire</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:text-gray-400">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newHireForm.name}
                  onChange={(e) => setNewHireForm({ ...newHireForm, name: e.target.value })}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newHireForm.email}
                  onChange={(e) => setNewHireForm({ ...newHireForm, email: e.target.value })}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Department"
                  value={newHireForm.department}
                  onChange={(e) => setNewHireForm({ ...newHireForm, department: e.target.value })}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Job Title"
                  value={newHireForm.role}
                  onChange={(e) => setNewHireForm({ ...newHireForm, role: e.target.value })}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={newHireForm.startDate}
                  onChange={(e) => setNewHireForm({ ...newHireForm, startDate: e.target.value })}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Manager"
                  value={newHireForm.manager}
                  onChange={(e) => setNewHireForm({ ...newHireForm, manager: e.target.value })}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button onClick={closeModal} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800">
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    console.log('Adding new hire:', newHireForm);
                    closeModal();
                  }}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                >
                  Add to Onboarding
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingModal;