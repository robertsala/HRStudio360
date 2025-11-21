import React, { useState } from 'react';
import { BookOpen, Award, Users, CheckCircle, Plus, Play, GraduationCap } from 'lucide-react';
import KnowledgeBaseWidget from '../components/KnowledgeBaseWidget';
import TutorialViewer from '../components/modals/TutorialViewer';
import { useQuery } from '@tanstack/react-query';
import { Tutorial } from '../../shared/schema';
import { useDashboardEscape } from '../hooks/useDashboardEscape';

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

const TrainingPage: React.FC = () => {
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

  // ESC key handling - close nested modals first before navigating away
  useDashboardEscape(() => {
    if (showCreateProgram) {
      setShowCreateProgram(false);
      return false;
    }
    if (selectedTutorialId) {
      setSelectedTutorialId(null);
      return false;
    }
    return true;
  });

  useQuery<Tutorial[]>({
    queryKey: ['/api/tutorials'],
    enabled: activeTab === 'knowledgebase' && knowledgeBaseSection === 'tutorials'
  });

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
      case 'Technical': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400';
      case 'Compliance': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400';
      case 'Leadership': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400';
      case 'Safety': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400';
      case 'Soft Skills': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400';
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400';
    }
  };


  const tabs = [
    { id: 'programs', label: 'Training Programs' },
    { id: 'assessments', label: 'Skill Assessments' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'knowledgebase', label: 'Knowledge Base' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg w-full min-h-screen overflow-auto">
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="flex items-center">
          <BookOpen className="h-8 w-8 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">Training & Development</h2>
            <p className="text-green-100">Manage training programs and skill development</p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="overflow-y-auto">
        <div className="p-6">
          {activeTab === 'programs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Training Programs</h3>
                <button
                  onClick={() => setShowCreateProgram(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  data-testid="button-create-program"
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
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{program.title}</h4>
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
                            <span className="font-medium text-gray-700 dark:text-gray-300">Duration:</span>
                            <p className="text-gray-600 dark:text-gray-400">{program.duration}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Format:</span>
                            <p className="text-gray-600 dark:text-gray-400">{program.format}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Instructor:</span>
                            <p className="text-gray-600 dark:text-gray-400">{program.instructor}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Enrollment:</span>
                            <p className="text-gray-600 dark:text-gray-400">{program.currentEnrollment}/{program.maxParticipants}</p>
                          </div>
                        </div>

                        {program.prerequisites && (
                          <div className="mt-4">
                            <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Prerequisites:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {program.prerequisites.map((prereq, index) => (
                                <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 text-xs rounded">
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

          {activeTab === 'assessments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Skill Assessments</h3>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  New Assessment
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Skill</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Current Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Target Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Assessor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {mockAssessments.map((assessment) => (
                      <tr key={assessment.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900 dark:text-white">{assessment.employeeName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{assessment.skill}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                  key={level}
                                  className={`w-3 h-3 rounded-full ${
                                    level <= assessment.currentLevel ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
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
                                    level <= assessment.targetLevel ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{assessment.targetLevel}/5</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{assessment.assessor}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                          {new Date(assessment.assessmentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'certifications' && (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Certifications coming soon</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Analytics coming soon</p>
            </div>
          )}

          {activeTab === 'knowledgebase' && (
            <div className="space-y-6">
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

              {knowledgeBaseSection === 'articles' && <KnowledgeBaseWidget onOpenModal={() => {}} />}

              {knowledgeBaseSection === 'tutorials' && (
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Tutorials coming soon</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedTutorialId && (
        <TutorialViewer
          onClose={() => setSelectedTutorialId(null)}
          tutorialId={selectedTutorialId}
        />
      )}
    </div>
  );
};

export default TrainingPage;
