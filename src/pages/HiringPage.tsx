import React, { useState } from 'react';
import { Filter, Plus, UserPlus, Heart, MessageCircle, DollarSign, MapPin, Award, Building, Brain, Sparkles } from 'lucide-react';
import OfferManagementModal from '../components/modals/OfferManagementModal';
import WorkerClassificationModal from '../components/modals/WorkerClassificationModal';
import ConfettiAnimation from '../components/ConfettiAnimation';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useDashboardEscape } from '../hooks/useDashboardEscape';
import { DashboardExitButton } from '../components/DashboardExitButton';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  experience: string;
  location: string;
  salaryExpectation: number;
  appliedDate: string;
  status: 'New Candidate' | 'Phone Screen' | 'Interview' | 'Offer Sent' | 'Offer Accepted' | 'Hired' | 'Rejected' | 'Disqualified';
  disqualifiedReason?: string;
  disqualifiedDate?: string;
  previousStatus?: string;
  resumeUrl?: string;
  skills: string[];
  education: string;
  previousCompany: string;
  profilePicture: string;
  likes: number;
  views: number;
  commentsCount: number;
  aiMatchScore: number;
  notes?: string;
  rating: number;
  isLikedByUser: boolean;
  comments: CandidateComment[];
}

interface CandidateComment {
  id: string;
  author: string;
  authorRole: string;
  message: string;
  timestamp: string;
  isPrivate: boolean;
}

interface HiringStage {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  textColor: string;
  count: number;
}

interface HiringPageProps {
  onOpenStudioAI?: () => void;
}

const HiringPage: React.FC<HiringPageProps> = ({ onOpenStudioAI }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterPosition, setFilterPosition] = useState('All');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showDisqualifyModal, setShowDisqualifyModal] = useState(false);
  const [showDisqualifiedList, setShowDisqualifiedList] = useState(false);
  const [showWorkerClassification, setShowWorkerClassification] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);

  // ESC key handling - close nested modals first before navigating away
  useDashboardEscape(() => {
    if (selectedCandidate) {
      setSelectedCandidate(null);
      return false;
    }
    if (showAddCandidate) {
      setShowAddCandidate(false);
      return false;
    }
    if (showComments) {
      setShowComments(false);
      return false;
    }
    if (showDisqualifyModal) {
      setShowDisqualifyModal(false);
      return false;
    }
    if (showDisqualifiedList) {
      setShowDisqualifiedList(false);
      return false;
    }
    if (showWorkerClassification) {
      setShowWorkerClassification(false);
      return false;
    }
    if (showCollaborationModal) {
      setShowCollaborationModal(false);
      return false;
    }
    if (showOfferManagement) {
      setShowOfferManagement(false);
      return false;
    }
    if (showConvertModal) {
      setShowConvertModal(false);
      return false;
    }
    return true;
  });

  React.useEffect(() => {
    loadCandidates();
  }, []);


  const loadCandidates = async () => {
    try {
      const data = await apiClient.getCandidates();

      if (data) {
        const formattedCandidates: Candidate[] = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone || '',
          position: c.position,
          department: c.department,
          experience: c.experience || '',
          location: c.location || '',
          salaryExpectation: Number(c.salaryExpectation) || 0,
          appliedDate: c.appliedDate,
          status: c.status,
          skills: c.skills || [],
          education: c.education || '',
          previousCompany: c.previousCompany || '',
          profilePicture: c.profilePicture || '',
          likes: c.likes || 0,
          views: c.views || 0,
          commentsCount: c.commentsCount || 0,
          aiMatchScore: c.aiMatchScore || 0,
          rating: c.rating || 0,
          notes: c.notes || '',
          disqualifiedReason: c.disqualifiedReason || '',
          disqualifiedDate: c.disqualifiedDate || '',
          previousStatus: c.previousStatus || '',
          isLikedByUser: false,
          comments: []
        }));
        setCandidates(formattedCandidates);
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
    }
  };

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [showOfferManagement, setShowOfferManagement] = useState(false);
  const [selectedCandidateForOffer, setSelectedCandidateForOffer] = useState<Candidate | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  const performAISearch = (query: string) => {
    if (!query.trim()) return candidates;

    const searchTerm = query.toLowerCase();
    
    return candidates.filter(candidate => {
      const basicMatch = 
        candidate.name.toLowerCase().includes(searchTerm) ||
        candidate.email.toLowerCase().includes(searchTerm) ||
        candidate.phone.includes(searchTerm) ||
        candidate.position.toLowerCase().includes(searchTerm) ||
        candidate.department.toLowerCase().includes(searchTerm) ||
        candidate.location.toLowerCase().includes(searchTerm) ||
        candidate.previousCompany.toLowerCase().includes(searchTerm) ||
        candidate.education.toLowerCase().includes(searchTerm);

      const skillsMatch = candidate.skills.some(skill => 
        skill.toLowerCase().includes(searchTerm)
      );

      const contextualMatch = 
        (searchTerm.includes('senior') && candidate.position.toLowerCase().includes('senior')) ||
        (searchTerm.includes('manager') && candidate.position.toLowerCase().includes('manager')) ||
        (searchTerm.includes('engineer') && candidate.position.toLowerCase().includes('engineer')) ||
        (searchTerm.includes('designer') && candidate.position.toLowerCase().includes('designer')) ||
        (searchTerm.includes('high salary') && candidate.salaryExpectation > 120000) ||
        (searchTerm.includes('experienced') && parseInt(candidate.experience) >= 5) ||
        (searchTerm.includes('top rated') && candidate.aiMatchScore >= 90) ||
        (searchTerm.includes('liked') && candidate.isLikedByUser) ||
        (searchTerm.includes('new') && candidate.status === 'New Candidate') ||
        (searchTerm.includes('interview') && candidate.status === 'Interview') ||
        (searchTerm.includes('offer') && (candidate.status === 'Offer Sent' || candidate.status === 'Offer Accepted'));

      return basicMatch || skillsMatch || contextualMatch;
    });
  };

  const filteredCandidates = performAISearch(searchTerm).filter(candidate => {
    const matchesDepartment = filterDepartment === 'All' || candidate.department === filterDepartment;
    const matchesPosition = filterPosition === 'All' || candidate.position === filterPosition;
    return matchesDepartment && matchesPosition && candidate.status !== 'Rejected' && candidate.status !== 'Disqualified';
  });

  const disqualifiedCandidates = candidates.filter(candidate => {
    const matchesDepartment = filterDepartment === 'All' || candidate.department === filterDepartment;
    const matchesPosition = filterPosition === 'All' || candidate.position === filterPosition;
    return matchesDepartment && matchesPosition && candidate.status === 'Disqualified';
  });

  const departments = ['All', ...Array.from(new Set(candidates.map(c => c.department)))];
  const positions = ['All', ...Array.from(new Set(candidates.map(c => c.position)))];


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg w-full min-h-screen overflow-auto">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {showConfetti && (
        <ConfettiAnimation show={showConfetti} onComplete={() => setShowConfetti(false)} />
      )}

      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="flex items-center">
          <UserPlus className="h-8 w-8 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">Hiring & Recruitment</h2>
            <p className="text-purple-100">Manage candidates and streamline your hiring process</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {onOpenStudioAI && (
            <button
              onClick={onOpenStudioAI}
              className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center"
              data-testid="button-studio-ai"
            >
              <Brain className="h-4 w-4 mr-2" />
              Studio AI
            </button>
          )}
          <DashboardExitButton className="text-purple-100 hover:text-white" />
        </div>
      </div>

      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-1 mr-2 animate-pulse">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">AI</span>
            </div>
            <input
              type="text"
              placeholder="AI Search: Try 'engineer', 'top rated', 'high salary', etc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-4 py-3 border-2 border-purple-100 dark:border-purple-900 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              data-testid="input-search"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-white"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-white"
            >
              {positions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowAddCandidate(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            data-testid="button-add-candidate"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Candidate
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredCandidates.length} candidates
        </div>
      </div>

      <div className="overflow-y-auto">
        <div className="p-6">
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No candidates found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate)}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  data-testid={`card-candidate-${candidate.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        {candidate.profilePicture ? (
                          <img
                            src={candidate.profilePicture}
                            alt={candidate.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xl">
                              {candidate.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{candidate.name}</h3>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 text-xs rounded-full">
                            {candidate.position}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            {candidate.department}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {candidate.location}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            ${candidate.salaryExpectation.toLocaleString()}
                          </div>
                          <div className="flex items-center">
                            <Award className="h-4 w-4 mr-1" />
                            AI Match: {candidate.aiMatchScore}%
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Heart className={`h-4 w-4 ${candidate.isLikedByUser ? 'fill-red-500 text-red-500' : ''}`} />
                        <span>{candidate.likes}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <MessageCircle className="h-4 w-4" />
                        <span>{candidate.commentsCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showWorkerClassification && (
        <WorkerClassificationModal
          onClose={() => setShowWorkerClassification(false)}
        />
      )}

      {showOfferManagement && selectedCandidateForOffer && (
        <OfferManagementModal
          onClose={() => {
            setShowOfferManagement(false);
            setSelectedCandidateForOffer(null);
          }}
          candidate={selectedCandidateForOffer}
        />
      )}
    </div>
  );
};

export default HiringPage;
