import React, { useState } from 'react';
import { X, BookOpen, Award, Users, Calendar, Clock, CheckCircle, AlertTriangle, Plus, Play, GraduationCap, ChevronRight } from 'lucide-react';
import KnowledgeBaseWidget from '../KnowledgeBaseWidget';
import TutorialViewer from './TutorialViewer';
import { useQuery } from '@tanstack/react-query';
import { Tutorial } from '@shared/schema';

interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  category: 'Technical' | 'Compliance' | 'Leadership' | 'Safety' | 'Soft Skills';
  duration: string;
  format: 'Online' | 'In-Person' | 'Hybrid';
  instructor: string;
  maxParticipants: number;
  currentEnrollment: number;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'In Progress' | 'Completed';
  prerequisites?: string[];
  certificationAwarded?: string;
}

interface SkillAssessment {
  id: string;
  employeeName: string;
  skill: string;
  currentLevel: number;
  targetLevel: number;
  assessmentDate: string;
  assessor: string;
  notes: string;
}

interface TrainingModalProps {
  onClose?: () => void;
  onOpenKnowledgeBase?: () => void;
}

const TrainingModal: React.FC<TrainingModalProps> = ({ onClose, onOpenKnowledgeBase }) => {
  const [activeTab, setActiveTab] = useState('programs');
  const [showCreateProgram, setShowCreateProgram] = useState(false);
  const [knowledgeBaseSection, setKnowledgeBaseSection] = useState<'articles' | 'tutorials'>('articles');
  const [selectedTutorialId, setSelectedTutorialId] = useState<string | null>(null);
  const [newProgram, setNewProgram] = useState({
    title: '',
    description: '',
    category: 'Technical',
    duration: '',
    format: 'Online',
    instructor: '',
    maxParticipants: '',
    startDate: '',
    endDate: ''
  });

  // Fetch tutorials
  const { data: tutorials = [] } = useQuery<Tutorial[]>({
    queryKey: ['/api/tutorials'],
    enabled: activeTab === 'knowledgebase' && knowledgeBaseSection === 'tutorials'
  });

  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showCreateProgram) {
          setShowCreateProgram(false);
        } else if (onClose) {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showCreateProgram, onClose]);

  const mockPrograms: TrainingProgram[] = [
    {
      id: '1',
      title: 'Advanced React Development',
      description: 'Deep dive into React hooks, context, and performance optimization',
      category: 'Technical',
      duration: '40 hours',
      format: 'Online',
      instructor: 'Sarah Johnson',
      maxParticipants: 20,
      currentEnrollment: 15,
      startDate: '2025-02-01',
      endDate: '2025-02-28',
      status: 'Upcoming',
      prerequisites: ['Basic React knowledge', 'JavaScript ES6+'],
      certificationAwarded: 'Advanced React Developer'
    },
    {
      id: '2',
      title: 'Leadership Fundamentals',
      description: 'Essential leadership skills for new managers',
      category: 'Leadership',
      duration: '24 hours',
      format: 'Hybrid',
      instructor: 'Mike Chen',
      maxParticipants: 15,
      currentEnrollment: 12,
      startDate: '2025-01-20',
      endDate: '2025-02-15',
      status: 'In Progress',
      certificationAwarded: 'Leadership Certificate'
    },
    {
      id: '3',
      title: 'Data Privacy & GDPR Compliance',
      description: 'Understanding data protection regulations and compliance requirements',
      category: 'Compliance',
      duration: '8 hours',
      format: 'Online',
      instructor: 'Lisa Rodriguez',
      maxParticipants: 50,
      currentEnrollment: 35,
      startDate: '2025-01-15',
      endDate: '2025-01-15',
      status: 'Completed',
      certificationAwarded: 'GDPR Compliance Certificate'
    }
  ];

  const mockAssessments: SkillAssessment[] = [
    {
      id: '1',
      employeeName: 'David Kim',
      skill: 'React Development',
      currentLevel: 3,
      targetLevel: 4,
      assessmentDate: '2025-01-10',
      assessor: 'Sarah Johnson',
      notes: 'Strong foundation, needs work on advanced patterns'
    },
    {
      id: '2',
      employeeName: 'Emma Wilson',
      skill: 'Project Management',
      currentLevel: 2,
      targetLevel: 4,
      assessmentDate: '2025-01-08',
      assessor: 'Mike Chen',
      notes: 'Good potential, recommend leadership training'
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Technical': return 'bg-blue-100 text-blue-800';
      case 'Compliance': return 'bg-red-100 text-red-800';
      case 'Leadership': return 'bg-purple-100 text-purple-800';
      case 'Safety': return 'bg-yellow-100 text-yellow-800';
      case 'Soft Skills': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateProgram = () => {
    console.log('Creating program:', newProgram);
    setShowCreateProgram(false);
    setNewProgram({
      title: '',
      description: '',
      category: 'Technical',
      duration: '',
      format: 'Online',
      instructor: '',
      maxParticipants: '',
      startDate: '',
      endDate: ''
    });
  };

  const tabs = [
    { id: 'programs', label: 'Training Programs' },
    { id: 'assessments', label: 'Skill Assessments' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'knowledgebase', label: 'Knowledge Base' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="flex items-center">
          <BookOpen className="h-8 w-8 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">Training & Development</h2>
            <p className="text-green-100">Manage training programs and skill development</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="overflow-y-auto max-h-96">
        <div className="p-6">
          {/* Training Programs Tab */}
          {activeTab === 'programs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Training Programs</h3>
                <button
                  onClick={() => setShowCreateProgram(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Program
                </button>
              </div>

              <div className="grid gap-6">
                {mockPrograms.map((program) => (
                  <div key={program.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">{program.title}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(program.category)}`}>
                            {program.category}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(program.status)}`}>
                            {program.status}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{program.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Duration:</span>
                            <p className="text-gray-600 dark:text-gray-400">{program.duration}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Format:</span>
                            <p className="text-gray-600 dark:text-gray-400">{program.format}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Instructor:</span>
                            <p className="text-gray-600 dark:text-gray-400">{program.instructor}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Enrollment:</span>
                            <p className="text-gray-600 dark:text-gray-400">{program.currentEnrollment}/{program.maxParticipants}</p>
                          </div>
                        </div>

                        {program.prerequisites && (
                          <div className="mt-4">
                            <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 text-sm">Prerequisites:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {program.prerequisites.map((prereq, index) => (
                                <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                  {prereq}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                          View Details
                        </button>
                        {program.status === 'Upcoming' && (
                          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                            Enroll
                          </button>
                        )}
                        {program.status === 'In Progress' && (
                          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center">
                            <Play className="h-3 w-3 mr-1" />
                            Continue
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Assessments Tab */}
          {activeTab === 'assessments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Skill Assessments</h3>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  New Assessment
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skill</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockAssessments.map((assessment) => (
                      <tr key={assessment.id} className="hover:bg-gray-50 dark:bg-gray-900">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900 dark:text-white dark:text-white">{assessment.employeeName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white dark:text-white">{assessment.skill}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                  key={level}
                                  className={`w-3 h-3 rounded-full ${
                                    level <= assessment.currentLevel ? 'bg-blue-500' : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{assessment.currentLevel}/5</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                  key={level}
                                  className={`w-3 h-3 rounded-full ${
                                    level <= assessment.targetLevel ? 'bg-green-500' : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{assessment.targetLevel}/5</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white dark:text-white">{assessment.assessor}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white dark:text-white">
                          {new Date(assessment.assessmentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Certifications Tab */}
          {activeTab === 'certifications' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Employee Certifications</h3>
              
              <div className="grid gap-4">
                {[
                  { employee: 'Sarah Johnson', certification: 'AWS Solutions Architect', issueDate: '2024-06-15', expiryDate: '2027-06-15', status: 'Active' },
                  { employee: 'Mike Chen', certification: 'PMP Certification', issueDate: '2023-09-20', expiryDate: '2026-09-20', status: 'Active' },
                  { employee: 'Lisa Rodriguez', certification: 'SHRM-CP', issueDate: '2024-01-10', expiryDate: '2027-01-10', status: 'Active' },
                  { employee: 'David Kim', certification: 'Google Cloud Professional', issueDate: '2023-11-05', expiryDate: '2025-11-05', status: 'Expiring Soon' }
                ].map((cert, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-yellow-100 rounded-full p-2">
                          <Award className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">{cert.certification}</h4>
                          <p className="text-gray-600 dark:text-gray-400">{cert.employee}</p>
                          <p className="text-sm text-gray-500">
                            Issued: {new Date(cert.issueDate).toLocaleDateString()} • 
                            Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        cert.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cert.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Training Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-2">Active Programs</h4>
                  <p className="text-3xl font-bold text-blue-600">12</p>
                  <p className="text-blue-700 text-sm">+3 from last month</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                  <h4 className="font-semibold text-green-900 mb-2">Completion Rate</h4>
                  <p className="text-3xl font-bold text-green-600">87%</p>
                  <p className="text-green-700 text-sm">Above target (80%)</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                  <h4 className="font-semibold text-purple-900 mb-2">Certifications Earned</h4>
                  <p className="text-3xl font-bold text-purple-600">45</p>
                  <p className="text-purple-700 text-sm">This quarter</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Training by Category</h4>
                <div className="space-y-4">
                  {[
                    { category: 'Technical', count: 8, percentage: 40 },
                    { category: 'Leadership', count: 4, percentage: 20 },
                    { category: 'Compliance', count: 6, percentage: 30 },
                    { category: 'Soft Skills', count: 2, percentage: 10 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">{item.category}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-12">{item.count} programs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Knowledge Base Tab */}
          {activeTab === 'knowledgebase' && (
            <div className="space-y-6">
              {/* Section Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg inline-flex">
                <button
                  onClick={() => setKnowledgeBaseSection('articles')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    knowledgeBaseSection === 'articles'
                      ? 'bg-white dark:bg-gray-800 text-blue-600 shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  data-testid="button-articles"
                >
                  <BookOpen className="h-4 w-4 inline mr-2" />
                  Articles
                </button>
                <button
                  onClick={() => setKnowledgeBaseSection('tutorials')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    knowledgeBaseSection === 'tutorials'
                      ? 'bg-white dark:bg-gray-800 text-blue-600 shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  data-testid="button-tutorials"
                >
                  <GraduationCap className="h-4 w-4 inline mr-2" />
                  Tutorials
                </button>
              </div>

              {/* Articles Section */}
              {knowledgeBaseSection === 'articles' && (
                <KnowledgeBaseWidget 
                  onOpenModal={onOpenKnowledgeBase || (() => {})} 
                />
              )}

              {/* Tutorials Section */}
              {knowledgeBaseSection === 'tutorials' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Interactive Tutorials</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Step-by-step guides to help you master HRStudio360
                      </p>
                    </div>
                  </div>

                  {/* Tutorials Grid */}
                  {tutorials.length === 0 ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 text-center">
                      <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">No Tutorials Available</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Tutorials will be loaded here. Contact your administrator to set up tutorials.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tutorials.map((tutorial) => {
                        const progressData = (tutorial as any).progress;
                        const completedSteps = progressData?.completedSteps?.length || 0;
                        const totalSteps = (tutorial as any).steps?.length || 0;
                        const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
                        const isCompleted = progressData?.isCompleted || false;

                        const getDifficultyColor = (difficulty: string) => {
                          switch (difficulty) {
                            case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
                            case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
                            case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
                            default: return 'bg-gray-100 text-gray-800';
                          }
                        };

                        const getCategoryIcon = (category: string) => {
                          switch (category) {
                            case 'payroll': return '💰';
                            case 'hiring': return '👥';
                            case 'ai-features': return '🤖';
                            case 'getting-started': return '🚀';
                            default: return '📚';
                          }
                        };

                        return (
                          <div
                            key={tutorial.id}
                            onClick={() => setSelectedTutorialId(tutorial.id)}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group"
                            data-testid={`tutorial-card-${tutorial.id}`}
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3 flex-1">
                                <span className="text-2xl">{getCategoryIcon(tutorial.category)}</span>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {tutorial.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                    {tutorial.description}
                                  </p>
                                </div>
                              </div>
                              {isCompleted && (
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                              )}
                            </div>

                            {/* Metadata */}
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{tutorial.estimatedMinutes} min</span>
                              </div>
                              <span className={`px-2 py-1 rounded-full font-medium ${getDifficultyColor(tutorial.difficulty)}`}>
                                {tutorial.difficulty}
                              </span>
                            </div>

                            {/* Progress */}
                            {progressPercentage > 0 && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  <span>Progress</span>
                                  <span>{Math.round(progressPercentage)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                  <div
                                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                                    style={{ width: `${progressPercentage}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Tags */}
                            {tutorial.tags && tutorial.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {tutorial.tags.slice(0, 3).map((tag, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* CTA */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {isCompleted ? 'Review tutorial' : progressPercentage > 0 ? 'Continue learning' : 'Start tutorial'}
                              </span>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Program Modal */}
      {showCreateProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Create Training Program</h3>
              <button
                onClick={() => setShowCreateProgram(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Program Title</label>
                <input
                  type="text"
                  value={newProgram.title}
                  onChange={(e) => setNewProgram({ ...newProgram, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Advanced JavaScript Development"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={newProgram.description}
                  onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the program objectives and content..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={newProgram.category}
                    onChange={(e) => setNewProgram({ ...newProgram, category: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Safety">Safety</option>
                    <option value="Soft Skills">Soft Skills</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Format</label>
                  <select
                    value={newProgram.format}
                    onChange={(e) => setNewProgram({ ...newProgram, format: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Online">Online</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Duration</label>
                  <input
                    type="text"
                    value={newProgram.duration}
                    onChange={(e) => setNewProgram({ ...newProgram, duration: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 40 hours"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Max Participants</label>
                  <input
                    type="number"
                    value={newProgram.maxParticipants}
                    onChange={(e) => setNewProgram({ ...newProgram, maxParticipants: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="20"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Instructor</label>
                <input
                  type="text"
                  value={newProgram.instructor}
                  onChange={(e) => setNewProgram({ ...newProgram, instructor: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Instructor name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newProgram.startDate}
                    onChange={(e) => setNewProgram({ ...newProgram, startDate: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newProgram.endDate}
                    onChange={(e) => setNewProgram({ ...newProgram, endDate: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateProgram(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProgram}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Program
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Viewer Modal */}
      {selectedTutorialId && (
        <TutorialViewer
          tutorialId={selectedTutorialId}
          onClose={() => setSelectedTutorialId(null)}
          onAction={(actionType, actionTarget) => {
            // Handle actions like opening modals
            console.log(`Tutorial action: ${actionType} - ${actionTarget}`);
            setSelectedTutorialId(null);
            
            // Close Training modal and trigger the action
            if (onClose) {
              onClose();
            }
            // Action handling can be extended here based on actionType and actionTarget
          }}
        />
      )}
    </div>
  );
};

export default TrainingModal;