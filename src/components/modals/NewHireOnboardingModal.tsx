import { useState, useEffect } from 'react';
import { X, User, Calendar, CheckCircle, Users, Briefcase, ChevronRight, Search, FileText, DollarSign, Upload } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import I9FormComponent from '../onboarding/I9FormComponent';
import I9EmployerVerificationComponent from '../onboarding/I9EmployerVerificationComponent';
import StateTaxFormComponent from '../onboarding/StateTaxFormComponent';
import DocumentUploadComponent from '../onboarding/DocumentUploadComponent';
import type { NewHire, OnboardingChecklist, OnboardingTask } from '@shared/schema';

interface NewHireOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'forms' | 'documents' | 'tasks';
type FormView = 'menu' | 'i9_section1' | 'i9_section2' | 'tax_forms' | 'documents';

export default function NewHireOnboardingModal({ isOpen, onClose }: NewHireOnboardingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedNewHire, setSelectedNewHire] = useState<NewHire | null>(null);
  const [formView, setFormView] = useState<FormView>('menu');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Reset formView when tab changes or new hire changes
  useEffect(() => {
    setFormView('menu');
  }, [activeTab, selectedNewHire?.id]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        if (formView !== 'menu') {
          setFormView('menu');
        } else if (selectedNewHire) {
          setSelectedNewHire(null);
          setActiveTab('overview');
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, selectedNewHire, formView, onClose]);

  // Fetch new hires
  const { data: newHires = [], isLoading: loadingHires } = useQuery<NewHire[]>({
    queryKey: ['/api/new-hires'],
    enabled: isOpen,
  });

  // Fetch checklist for selected new hire
  const { data: checklist } = useQuery<OnboardingChecklist>({
    queryKey: ['/api/onboarding/checklists/new-hire', selectedNewHire?.id],
    enabled: !!selectedNewHire?.id,
  });

  // Fetch tasks for selected new hire
  const { data: tasks = [], isLoading: loadingTasks } = useQuery<OnboardingTask[]>({
    queryKey: ['/api/onboarding/tasks/new-hire', selectedNewHire?.id],
    enabled: !!selectedNewHire?.id && activeTab === 'tasks',
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      return apiRequest('PATCH', `/api/onboarding/tasks/${taskId}`, {
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => {
      if (selectedNewHire) {
        queryClient.invalidateQueries({ queryKey: ['/api/onboarding/tasks/new-hire', selectedNewHire.id] });
        queryClient.invalidateQueries({ queryKey: ['/api/onboarding/checklists/new-hire', selectedNewHire.id] });
      }
      toast({
        title: 'Task Updated',
        description: 'Task status updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update task status.',
        variant: 'destructive',
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'in_progress': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'pending': return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
      case 'blocked': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const categories = ['all', ...Array.from(new Set(tasks.map(t => t.category)))];

  const handleFormComplete = () => {
    setFormView('menu');
    if (selectedNewHire) {
      // Invalidate all cache entries for this specific new hire
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/checklists/new-hire', selectedNewHire.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/tasks/new-hire', selectedNewHire.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/documents', selectedNewHire.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/i9-forms', selectedNewHire.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/state-tax-forms', selectedNewHire.id] });
    }
    toast({
      title: 'Form Completed',
      description: 'Your information has been saved successfully.',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-testid="modal-new-hire-onboarding">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-modal-title">New Hire Onboarding</h2>
              <p className="text-teal-100 text-sm">Manage onboarding process and compliance forms</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            data-testid="button-close-modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex space-x-1 p-2">
            <button
              onClick={() => {
                setActiveTab('overview');
                setFormView('menu');
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-gray-800 text-teal-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:bg-opacity-50'
              }`}
              data-testid="button-tab-overview"
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>New Hires</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('forms')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'forms'
                  ? 'bg-white dark:bg-gray-800 text-teal-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:bg-opacity-50'
              }`}
              disabled={!selectedNewHire}
              data-testid="button-tab-forms"
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Forms & Compliance</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'documents'
                  ? 'bg-white dark:bg-gray-800 text-teal-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:bg-opacity-50'
              }`}
              disabled={!selectedNewHire}
              data-testid="button-tab-documents"
            >
              <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Documents</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'bg-white dark:bg-gray-800 text-teal-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:bg-opacity-50'
              }`}
              disabled={!selectedNewHire}
              data-testid="button-tab-tasks"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Tasks</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {loadingHires ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading new hires...</p>
                </div>
              ) : newHires.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg">No new hires found</p>
                  <p className="text-gray-400 text-sm mt-2">New hires will appear here after accepting offers</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {newHires.map((hire) => {
                    const daysUntilStart = Math.ceil((new Date(hire.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <div
                        key={hire.id}
                        onClick={() => {
                          setSelectedNewHire(hire);
                          setActiveTab('forms');
                        }}
                        className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-teal-500 hover:shadow-lg transition-all cursor-pointer"
                        data-testid={`card-new-hire-${hire.id}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4">
                            <div className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-lg font-bold">
                              {hire.firstName[0]}{hire.lastName[0]}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {hire.firstName} {hire.lastName}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{hire.positionTitle}</p>
                              <p className="text-xs text-gray-500">{hire.department}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(hire.status)}`}>
                              {hire.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <p className="text-xs text-gray-500 mt-2">
                              {daysUntilStart > 0 ? `Starts in ${daysUntilStart} days` : 'Started'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Start: {new Date(hire.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>{hire.email}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Forms Tab */}
          {activeTab === 'forms' && selectedNewHire && (
            <div className="space-y-6">
              {formView === 'menu' && (
                <>
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-800">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-full h-14 w-14 flex items-center justify-center text-xl font-bold">
                          {selectedNewHire.firstName[0]}{selectedNewHire.lastName[0]}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {selectedNewHire.firstName} {selectedNewHire.lastName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{selectedNewHire.positionTitle} - {selectedNewHire.department}</p>
                          <p className="text-xs text-gray-500 mt-1">Start Date: {new Date(selectedNewHire.startDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedNewHire(null);
                          setActiveTab('overview');
                        }}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        data-testid="button-back-to-overview"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Onboarding Progress Summary */}
                  {checklist && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Onboarding Progress</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${checklist.i9Status?.toLowerCase() === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {checklist.i9Status?.toLowerCase() === 'completed' ? '✓' : '○'}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">I-9 Form</p>
                          <p className="text-xs font-medium text-gray-900 dark:text-white">{checklist.i9Status}</p>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${checklist.taxFormsStatus?.toLowerCase() === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {checklist.taxFormsStatus?.toLowerCase() === 'completed' ? '✓' : '○'}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tax Forms</p>
                          <p className="text-xs font-medium text-gray-900 dark:text-white">{checklist.taxFormsStatus}</p>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${checklist.workstationStatus?.toLowerCase() === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {checklist.workstationStatus?.toLowerCase() === 'completed' ? '✓' : '○'}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Workstation</p>
                          <p className="text-xs font-medium text-gray-900 dark:text-white">{checklist.workstationStatus}</p>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${checklist.benefitsStatus?.toLowerCase() === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {checklist.benefitsStatus?.toLowerCase() === 'completed' ? '✓' : '○'}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Benefits</p>
                          <p className="text-xs font-medium text-gray-900 dark:text-white">{checklist.benefitsStatus}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* I-9 Section 1 Card */}
                    <div
                      onClick={() => setFormView('i9_section1')}
                      className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer"
                      data-testid="card-form-i9-section1"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-3 rounded-lg">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">I-9 Section 1</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Employee Information & Attestation</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            checklist?.i9Status?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {checklist?.i9Status || 'Not Started'}
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    {/* I-9 Section 2 Card (HR Only) */}
                    {user?.role !== 'Employee' && (
                      <div
                        onClick={() => setFormView('i9_section2')}
                        className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer"
                        data-testid="card-form-i9-section2"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-3 rounded-lg">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">I-9 Section 2 (HR)</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Employer Verification</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              checklist?.i9Status?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              HR Only
                            </span>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    )}

                    {/* State Tax Form Card */}
                    <div
                      onClick={() => setFormView('tax_forms')}
                      className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-green-500 hover:shadow-lg transition-all cursor-pointer"
                      data-testid="card-form-tax"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg">
                          <DollarSign className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">State Tax Withholding</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Massachusetts M-4 Form</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            checklist?.taxFormsStatus?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {checklist?.taxFormsStatus || 'Not Started'}
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {formView === 'i9_section1' && (
                <div>
                  <button
                    onClick={() => setFormView('menu')}
                    className="mb-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center space-x-2"
                    data-testid="button-back-to-menu"
                  >
                    <ChevronRight className="h-4 w-4 transform rotate-180" />
                    <span>Back to Forms Menu</span>
                  </button>
                  <I9FormComponent
                    newHireId={selectedNewHire.id}
                    onComplete={handleFormComplete}
                  />
                </div>
              )}

              {formView === 'i9_section2' && (
                <div>
                  <button
                    onClick={() => setFormView('menu')}
                    className="mb-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center space-x-2"
                    data-testid="button-back-to-menu"
                  >
                    <ChevronRight className="h-4 w-4 transform rotate-180" />
                    <span>Back to Forms Menu</span>
                  </button>
                  <I9EmployerVerificationComponent
                    newHireId={selectedNewHire.id}
                    newHireName={`${selectedNewHire.firstName} ${selectedNewHire.lastName}`}
                    onComplete={handleFormComplete}
                  />
                </div>
              )}

              {formView === 'tax_forms' && (
                <div>
                  <button
                    onClick={() => setFormView('menu')}
                    className="mb-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center space-x-2"
                    data-testid="button-back-to-menu"
                  >
                    <ChevronRight className="h-4 w-4 transform rotate-180" />
                    <span>Back to Forms Menu</span>
                  </button>
                  <StateTaxFormComponent
                    newHireId={selectedNewHire.id}
                    state="MA"
                    onComplete={handleFormComplete}
                  />
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && selectedNewHire && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-full h-14 w-14 flex items-center justify-center text-xl font-bold">
                      {selectedNewHire.firstName[0]}{selectedNewHire.lastName[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedNewHire.firstName} {selectedNewHire.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Document Uploads</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedNewHire(null);
                      setActiveTab('overview');
                    }}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <DocumentUploadComponent
                newHireId={selectedNewHire.id}
                onComplete={handleFormComplete}
              />
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && selectedNewHire && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-full h-14 w-14 flex items-center justify-center text-xl font-bold">
                      {selectedNewHire.firstName[0]}{selectedNewHire.lastName[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedNewHire.firstName} {selectedNewHire.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedNewHire.positionTitle} - {selectedNewHire.department}</p>
                      <p className="text-xs text-gray-500 mt-1">Start Date: {new Date(selectedNewHire.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedNewHire(null);
                      setActiveTab('overview');
                    }}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      data-testid="input-search-tasks"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    data-testid="select-filter-status"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    data-testid="select-filter-category"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingTasks ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading tasks...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg">No tasks found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow"
                      data-testid={`card-task-${task.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{task.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{task.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Briefcase className="h-3 w-3" />
                              <span className="capitalize">{task.assigneeType.replace('_', ' ')}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">{task.category}</span>
                            </div>
                          </div>
                        </div>
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskMutation.mutate({ taskId: task.id, status: e.target.value })}
                          className="ml-4 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          data-testid={`select-task-status-${task.id}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>
                      {task.completedAt && (
                        <div className="text-xs text-green-600 dark:text-green-400 flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Completed on {new Date(task.completedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
