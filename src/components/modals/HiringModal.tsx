import React, { useState } from 'react';
import { X, Search, Filter, Plus, UserPlus, Eye, Heart, MessageCircle, Star, Calendar, DollarSign, MapPin, Mail, Phone, Award, TrendingUp, Users, CheckCircle, AlertTriangle, Send, FileText, Download, User, Building, Briefcase, Clock, Target, Brain, Sparkles, ChevronRight } from 'lucide-react';
import OfferManagementModal from './OfferManagementModal';
import WorkerClassificationModal from './WorkerClassificationModal';
import ConfettiAnimation from '../ConfettiAnimation';
import ResizableModal from '../ResizableModal';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useEscapeKey } from '../../hooks/useEscapeKey';

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
  rating: number; // 0-5 star rating
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

interface HiringModalProps {
  onNavigateToOnboarding?: () => void;
  onClose?: () => void;
}

const HiringModal: React.FC<HiringModalProps> = ({ onNavigateToOnboarding, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  useEscapeKey(() => onClose?.(), !!onClose);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterPosition, setFilterPosition] = useState('All');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDisqualifyModal, setShowDisqualifyModal] = useState(false);
  const [disqualifyReason, setDisqualifyReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showDisqualifiedList, setShowDisqualifiedList] = useState(false);
  const [showWorkerClassification, setShowWorkerClassification] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState('');
  const [selectedCollaboratorRole, setSelectedCollaboratorRole] = useState<'viewer' | 'commenter' | 'decision_maker'>('commenter');
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);

  React.useEffect(() => {
    loadCandidates();
    loadAvailableEmployees();
  }, []);

  const loadAvailableEmployees = async () => {
    try {
      const data = await apiClient.getProfiles();
      setAvailableEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadCollaborators = async (candidateId: string) => {
    try {
      // TODO: Add backend endpoint for collaborators
      setCollaborators([]);
    } catch (error) {
      console.error('Error loading collaborators:', error);
    }
  };

  const handleInviteCollaborator = async () => {
    if (!selectedCandidate || !selectedCollaboratorId || !user) return;

    setIsAddingCollaborator(true);
    try {
      // TODO: Add backend endpoint for inviting collaborators
      setNotification({
        type: 'info',
        message: 'Collaborator feature coming soon!'
      });
      setTimeout(() => setNotification(null), 3000);
      setShowCollaborationModal(false);
    } catch (error) {
      console.error('Error inviting collaborator:', error);
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!selectedCandidate) return;

    try {
      // TODO: Add backend endpoint for removing collaborators
      setNotification({
        type: 'info',
        message: 'Collaborator feature coming soon!'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error removing collaborator:', error);
    }
  };

  const loadCandidates = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedCandidate) {
          setSelectedCandidate(null);
        } else if (showAddCandidate) {
          setShowAddCandidate(false);
        } else if (showComments) {
          setShowComments(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedCandidate, showAddCandidate, showComments]);
  const [newComment, setNewComment] = useState('');
  const [isPrivateComment, setIsPrivateComment] = useState(false);
  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(null);
  const [hoverRating, setHoverRating] = useState<{[candidateId: string]: number}>({});
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [showOfferManagement, setShowOfferManagement] = useState(false);
  const [selectedCandidateForOffer, setSelectedCandidateForOffer] = useState<Candidate | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [newHireForm, setNewHireForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    manager_id: '',
    start_date: '',
    salary: '',
    employment_type: 'Full-time'
  });
  const [newCandidateForm, setNewCandidateForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    location: '',
    salary_expectation: '',
    skills: ''
  });
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);


  const hiringStages: HiringStage[] = [
    {
      id: 'new',
      title: t('hiring.newCandidate'),
      color: 'border-blue-300 dark:border-blue-600',
      bgColor: 'bg-white dark:bg-gray-800',
      textColor: 'text-blue-700 dark:text-blue-400',
      count: candidates.filter(c => c.status === 'New Candidate').length
    },
    {
      id: 'phone',
      title: t('hiring.phoneScreen'),
      color: 'border-purple-300 dark:border-purple-600',
      bgColor: 'bg-white dark:bg-gray-800',
      textColor: 'text-purple-700 dark:text-purple-400',
      count: candidates.filter(c => c.status === 'Phone Screen').length
    },
    {
      id: 'interview',
      title: t('hiring.interview'),
      color: 'border-orange-300 dark:border-orange-600',
      bgColor: 'bg-white dark:bg-gray-800',
      textColor: 'text-orange-700 dark:text-orange-400',
      count: candidates.filter(c => c.status === 'Interview').length
    },
    {
      id: 'offer-sent',
      title: t('hiring.offerSent'),
      color: 'border-emerald-300 dark:border-emerald-600',
      bgColor: 'bg-white dark:bg-gray-800',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      count: candidates.filter(c => c.status === 'Offer Sent').length
    },
    {
      id: 'offer-accepted',
      title: t('hiring.offerAccepted'),
      color: 'border-green-300 dark:border-green-600',
      bgColor: 'bg-white dark:bg-gray-800',
      textColor: 'text-green-700 dark:text-green-400',
      count: candidates.filter(c => c.status === 'Offer Accepted').length
    },
    {
      id: 'hired',
      title: t('hiring.hired'),
      color: 'border-emerald-300 dark:border-emerald-600',
      bgColor: 'bg-white dark:bg-gray-800',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      count: candidates.filter(c => c.status === 'Hired').length
    }
  ];

  // AI-powered smart search
  const performAISearch = (query: string) => {
    if (!query.trim()) return candidates;

    const searchTerm = query.toLowerCase();
    
    return candidates.filter(candidate => {
      // Basic text matching
      const basicMatch = 
        candidate.name.toLowerCase().includes(searchTerm) ||
        candidate.email.toLowerCase().includes(searchTerm) ||
        candidate.phone.includes(searchTerm) ||
        candidate.position.toLowerCase().includes(searchTerm) ||
        candidate.department.toLowerCase().includes(searchTerm) ||
        candidate.location.toLowerCase().includes(searchTerm) ||
        candidate.previousCompany.toLowerCase().includes(searchTerm) ||
        candidate.education.toLowerCase().includes(searchTerm);

      // Skills matching
      const skillsMatch = candidate.skills.some(skill => 
        skill.toLowerCase().includes(searchTerm)
      );

      // Smart contextual matching
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

  const disqualifiedCount = disqualifiedCandidates.length;

  const departments = ['All', ...Array.from(new Set(candidates.map(c => c.department)))];
  const positions = ['All', ...Array.from(new Set(candidates.map(c => c.position)))];

  const getStatusFromStageId = (stageId: string): Candidate['status'] => {
    switch (stageId) {
      case 'new': return 'New Candidate';
      case 'phone': return 'Phone Screen';
      case 'interview': return 'Interview';
      case 'offer-sent': return 'Offer Sent';
      case 'offer-accepted': return 'Offer Accepted';
      case 'hired': return 'Hired';
      default: return 'New Candidate';
    }
  };

  const getNextStage = (currentStatus: Candidate['status']): Candidate['status'] | null => {
    switch (currentStatus) {
      case 'New Candidate': return 'Phone Screen';
      case 'Phone Screen': return 'Interview';
      case 'Interview': return 'Offer Sent';
      case 'Offer Sent': return 'Offer Accepted';
      case 'Offer Accepted': return 'Hired';
      case 'Hired': return null;
      default: return null;
    }
  };

  const handleMoveToNextStage = async (candidate: Candidate) => {
    const nextStage = getNextStage(candidate.status);

    if (!nextStage) {
      setNotification({
        type: 'info',
        message: `${candidate.name} is already at the final stage`
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      await apiClient.updateCandidate(candidate.id, { status: nextStage });

      setCandidates(prev => prev.map(c =>
        c.id === candidate.id
          ? { ...c, status: nextStage }
          : c
      ));

      setNotification({
        type: 'success',
        message: `${candidate.name} moved to ${nextStage}`
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error updating candidate status:', error);
      setNotification({
        type: 'error',
        message: 'Failed to update candidate status'
      });
      setTimeout(() => setNotification(null), 3000);
    }

    setSelectedCandidate(null);
  };
  const handleDragStart = (e: React.DragEvent, candidate: Candidate) => {
    setDraggedCandidate(candidate);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();

    if (!draggedCandidate) return;

    const newStatus = getStatusFromStageId(stageId);

    try {
      await apiClient.updateCandidate(draggedCandidate.id, { status: newStatus });

      setCandidates(prev => prev.map(candidate =>
        candidate.id === draggedCandidate.id
          ? { ...candidate, status: newStatus }
          : candidate
      ));

      setNotification({
        type: 'success',
        message: `${draggedCandidate.name} moved to ${newStatus}`
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error updating candidate status:', error);
      setNotification({
        type: 'error',
        message: 'Failed to update candidate status'
      });
      setTimeout(() => setNotification(null), 3000);
    }

    setDraggedCandidate(null);
  };

  const handleLikeCandidate = (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setCandidates(prev => prev.map(candidate => 
      candidate.id === candidateId 
        ? { 
            ...candidate, 
            isLikedByUser: !candidate.isLikedByUser,
            likes: candidate.isLikedByUser ? candidate.likes - 1 : candidate.likes + 1
          }
        : candidate
    ));
  };

  const handleCommentClick = (candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCandidate(candidate);
    setShowComments(true);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedCandidate || !user) return;

    try {
      // TODO: Add backend endpoint for candidate comments
      const newCommentObj: CandidateComment = {
        id: crypto.randomUUID(),
        author: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Current User',
        authorRole: user.role || 'HR Manager',
        message: newComment.trim(),
        timestamp: new Date().toISOString(),
        isPrivate: isPrivateComment
      };

      setCandidates(prev => prev.map(candidate =>
        candidate.id === selectedCandidate.id
          ? {
              ...candidate,
              comments: [...candidate.comments, newCommentObj],
              commentsCount: candidate.commentsCount + 1
            }
          : candidate
      ));

      if (selectedCandidate) {
        setSelectedCandidate({
          ...selectedCandidate,
          comments: [...selectedCandidate.comments, newCommentObj],
          commentsCount: selectedCandidate.commentsCount + 1
        });
      }

      setNewComment('');
      setIsPrivateComment(false);

      setNotification({
        type: 'success',
        message: `Comment added for ${selectedCandidate.name}`
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error adding comment:', error);
      setNotification({
        type: 'error',
        message: 'Failed to add comment. Please try again.'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleRateCandidate = async (candidateId: string, rating: number) => {
    if (!user) return;

    try {
      // TODO: Add backend endpoint for candidate ratings
      // Update local state for now
      setCandidates(prev => prev.map(c =>
        c.id === candidateId ? { ...c, rating } : c
      ));

      const candidate = candidates.find(c => c.id === candidateId);
      setNotification({
        type: 'success',
        message: `Rated ${candidate?.name} ${rating} star${rating !== 1 ? 's' : ''}`
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error rating candidate:', error);
      setNotification({
        type: 'error',
        message: 'Failed to save rating. Please try again.'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleCandidateClick = async (candidate: Candidate) => {
    // Increment view count
    setCandidates(prev => prev.map(c =>
      c.id === candidate.id
        ? { ...c, views: c.views + 1 }
        : c
    ));

    // TODO: Add backend endpoint for candidate comments
    // For now, just show candidate without loading comments from backend
    setSelectedCandidate({
      ...candidate,
      comments: candidate.comments || []
    });

    await loadCollaborators(candidate.id);
  };

  const handleCreateOffer = (candidate: Candidate) => {
    setSelectedCandidateForOffer(candidate);
    setShowOfferManagement(true);
  };

  const handleOpenConvertModal = (candidate: Candidate) => {
    setNewHireForm({
      first_name: candidate.name.split(' ')[0] || '',
      last_name: candidate.name.split(' ').slice(1).join(' ') || '',
      email: candidate.email,
      phone: candidate.phone,
      role: candidate.position,
      department: candidate.department,
      manager_id: '',
      start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
      salary: candidate.salaryExpectation.toString(),
      employment_type: 'Full-time'
    });
    setShowConvertModal(true);
  };

  const handleConvertToNewHire = async () => {
    if (!selectedCandidate) return;

    setIsConverting(true);
    try {
      // TODO: Add backend endpoint for converting candidates to new hires
      // For now, just update status locally
      await apiClient.updateCandidate(selectedCandidate.id, { status: 'Hired' });

      setCandidates(candidates.map(c =>
        c.id === selectedCandidate.id
          ? { ...c, status: 'Hired' as Candidate['status'] }
          : c
      ));

      setShowConfetti(true);
      setNotification({
        type: 'success',
        message: `${newHireForm.first_name} ${newHireForm.last_name} successfully hired!`
      });

      setTimeout(() => {
        setNotification(null);
        setShowConvertModal(false);
        setSelectedCandidate(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error converting to new hire:', error);
      setNotification({
        type: 'error',
        message: 'Failed to convert candidate to new hire. Please try again.'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsConverting(false);
    }
  };

  const handleAddCandidate = async () => {
    if (!newCandidateForm.name.trim() || !newCandidateForm.email.trim() || !newCandidateForm.position.trim() || !newCandidateForm.department) {
      setNotification({
        type: 'error',
        message: 'Please fill in all required fields (Name, Email, Position, Department)'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsAddingCandidate(true);
    try {
      const skillsArray = newCandidateForm.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const profilePictures = [
        'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
        'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
        'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
        'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
        'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
      ];
      const randomProfilePic = profilePictures[Math.floor(Math.random() * profilePictures.length)];

      const aiScore = Math.floor(Math.random() * 30) + 70;

      await apiClient.createCandidate({
        name: newCandidateForm.name,
        email: newCandidateForm.email,
        phone: newCandidateForm.phone || '',
        position: newCandidateForm.position,
        department: newCandidateForm.department,
        location: newCandidateForm.location || '',
        salaryExpectation: newCandidateForm.salary_expectation,
        skills: skillsArray,
        status: 'New Candidate',
        profilePicture: randomProfilePic,
        aiMatchScore: aiScore,
        experience: '',
        education: '',
        previousCompany: ''
      });

      await loadCandidates();

      setNewCandidateForm({
        name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        location: '',
        salary_expectation: '',
        skills: ''
      });

      setShowAddCandidate(false);
      setNotification({
        type: 'success',
        message: `${newCandidateForm.name} added successfully!`
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error('Error adding candidate:', error);
      const errorMessage = error?.message?.includes('duplicate') || error?.message?.includes('unique')
        ? 'A candidate with this email already exists.'
        : 'Failed to add candidate. Please try again.';

      setNotification({
        type: 'error',
        message: errorMessage
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsAddingCandidate(false);
    }
  };

  const disqualificationReasons = [
    'Insufficient experience',
    'Skills mismatch',
    'Salary expectations too high',
    'Failed technical assessment',
    'Cultural fit concerns',
    'Poor communication skills',
    'Unreliable/No-show for interview',
    'Background check issues',
    'References did not check out',
    'Position filled by another candidate',
    'Withdrew application',
    'Other'
  ];

  const handleRestoreCandidate = async () => {
    if (!selectedCandidate) return;

    const restoreToStatus = selectedCandidate.previousStatus || 'New Candidate';

    try {
      await apiClient.updateCandidate(selectedCandidate.id, {
        status: restoreToStatus,
        disqualifiedReason: null,
        disqualifiedDate: null,
        previousStatus: null
      });

      setCandidates(candidates.map(c =>
        c.id === selectedCandidate.id
          ? {
              ...c,
              status: restoreToStatus as Candidate['status'],
              disqualifiedReason: '',
              disqualifiedDate: '',
              previousStatus: ''
            }
          : c
      ));

      setNotification({
        type: 'success',
        message: `${selectedCandidate.name} has been restored to ${restoreToStatus}.`
      });

      setTimeout(() => {
        setNotification(null);
        setSelectedCandidate(null);
      }, 2000);

      await loadCandidates();
    } catch (error) {
      console.error('Error restoring candidate:', error);
      setNotification({
        type: 'error',
        message: 'Failed to restore candidate. Please try again.'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDisqualifyCandidate = async () => {
    if (!selectedCandidate) return;

    const finalReason = disqualifyReason === 'Other' ? customReason : disqualifyReason;

    if (!finalReason.trim()) {
      setNotification({
        type: 'error',
        message: 'Please select or enter a disqualification reason.'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      await apiClient.updateCandidate(selectedCandidate.id, {
        status: 'Disqualified',
        disqualifiedReason: finalReason,
        disqualifiedDate: new Date().toISOString(),
        previousStatus: selectedCandidate.status
      });

      setCandidates(candidates.map(c =>
        c.id === selectedCandidate.id
          ? {
              ...c,
              status: 'Disqualified' as Candidate['status'],
              disqualifiedReason: finalReason,
              disqualifiedDate: new Date().toISOString(),
              previousStatus: selectedCandidate.status
            }
          : c
      ));

      setNotification({
        type: 'success',
        message: `${selectedCandidate.name} has been disqualified.`
      });

      setTimeout(() => {
        setNotification(null);
        setShowDisqualifyModal(false);
        setSelectedCandidate(null);
        setDisqualifyReason('');
        setCustomReason('');
      }, 2000);
    } catch (error) {
      console.error('Error disqualifying candidate:', error);
      setNotification({
        type: 'error',
        message: 'Failed to disqualify candidate. Please try again.'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const getAIMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'Test':
        return <span className="text-xs text-blue-600">{t('hiring.offerCreated')}</span>;
      case 'Offer Sent':
        return <span className="text-xs text-blue-600">{t('hiring.offerSentStatus')}</span>;
      case 'Offer Accepted':
        return <span className="text-xs text-green-600">{t('hiring.offerAcceptedStatus')}</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
          <div className="flex items-center">
            <UserPlus className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Recruitment Pipeline</h2>
              <p className="text-blue-100">Manage candidates through the hiring process</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-blue-100 text-sm">
              {candidates.filter(c => c.status !== 'Rejected').length} active candidates
            </span>
          </div>
        </div>

        {/* AI Search and Filters */}
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-1 mr-2 animate-pulse">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs font-medium text-purple-600">AI</span>
              </div>
              <input
                type="text"
                placeholder="AI Search: Try 'Sarah', 'Engineering', 'San Francisco', 'Manager', etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-4 py-2 border-2 border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 bg-purple-50 dark:bg-purple-900/20/50 placeholder-gray-500 text-sm transition-all duration-200"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Qualified</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                {filteredCandidates.length}
              </span>
              <button
                onClick={() => setShowDisqualifiedList(true)}
                className="flex items-center gap-2 hover:bg-gray-100 rounded px-2 py-1 transition-colors ml-4"
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">Disqualified</span>
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">{disqualifiedCount}</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500"
              >
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => setShowAddCandidate(true)}
              className="bg-orange-500 dark:bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-600 dark:hover:bg-orange-700 transition-colors flex items-center text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add candidate
            </button>
          </div>
        </div>

        {/* Kanban Board - Made narrower columns */}
        <div className="p-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {hiringStages.map((stage) => {
              const stageCandidates = filteredCandidates.filter(c => c.status === getStatusFromStageId(stage.id));
              
              return (
                <div
                  key={stage.id}
                  className={`w-48 ${stage.bgColor} rounded-lg border-2 ${stage.color} min-h-[600px]`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-gray-300 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium text-sm ${stage.textColor}`}>
                        {stage.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="bg-gray-900 dark:bg-gray-700 px-2 py-1 rounded text-xs font-medium text-white">
                          {stageCandidates.length}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">3d</span>
                      </div>
                    </div>
                  </div>

                  {/* Candidate Cards - Much smaller */}
                  <div className="p-2 space-y-2 max-h-[550px] overflow-y-auto">
                    {stageCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, candidate)}
                        onClick={() => handleCandidateClick(candidate)}
                        className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 border border-gray-300 dark:border-gray-600 hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer hover:border-blue-400 dark:hover:border-blue-400"
                      >
                        {/* Profile and Name */}
                        <div className="flex items-center space-x-2 mb-2">
                          <img
                            src={candidate.profilePicture}
                            alt={candidate.name}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{candidate.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{new Date(candidate.appliedDate).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Salary */}
                        <div className="mb-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {candidate.salaryExpectation >= 1000
                              ? `${Math.round(candidate.salaryExpectation / 1000)}k USD`
                              : `${candidate.salaryExpectation} USD`
                            }
                          </p>
                        </div>

                        {/* Status Indicator */}
                        <div className="mb-2">
                          {getStatusIndicator(candidate.status)}
                        </div>

                        {/* AI Match Score */}
                        <div className="mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getAIMatchColor(candidate.aiMatchScore)}`}>
                            {candidate.aiMatchScore}%
                          </span>
                        </div>

                        {/* Engagement Stats */}
                        <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                          <button
                            onClick={(e) => handleLikeCandidate(candidate.id, e)}
                            className={`flex items-center space-x-1 hover:text-red-500 transition-colors ${
                              candidate.isLikedByUser ? 'text-red-500' : ''
                            }`}
                          >
                            <Heart className={`h-3 w-3 ${candidate.isLikedByUser ? 'fill-current' : ''}`} />
                            <span>{candidate.likes}</span>
                          </button>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{candidate.views}</span>
                          </div>
                          <button
                            onClick={(e) => handleCommentClick(candidate, e)}
                            className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>{candidate.commentsCount}</span>
                          </button>
                        </div>

                        {/* Create Offer Button */}
                        {candidate.status === 'Interview' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateOffer(candidate);
                            }}
                            className="w-full bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                          >
                            Create Offer
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Candidate Details Modal */}
      <ResizableModal
        isOpen={selectedCandidate !== null && !showComments}
        onClose={() => setSelectedCandidate(null)}
        initialWidth={900}
        initialHeight={700}
        minWidth={600}
        minHeight={500}
        title={
          selectedCandidate ? (
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-t-xl">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedCandidate.profilePicture}
                  alt={selectedCandidate.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white"
                />
                <div>
                  <h3 className="text-xl font-bold">{selectedCandidate.name}</h3>
                  <p className="text-blue-100">{selectedCandidate.position}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRateCandidate(selectedCandidate.id, star)}
                      onMouseEnter={() => setHoverRating(prev => ({ ...prev, [selectedCandidate.id]: star }))}
                      onMouseLeave={() => setHoverRating(prev => ({ ...prev, [selectedCandidate.id]: 0 }))}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= (hoverRating[selectedCandidate.id] || selectedCandidate.rating)
                            ? 'text-yellow-300 fill-current'
                            : 'text-white/50'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-white/80 text-sm ml-2">
                    {selectedCandidate.rating > 0 ? `${selectedCandidate.rating}/5` : 'Not rated'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-blue-100 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          ) : null
        }
        bodyClassName="p-6"
      >
        {selectedCandidate && (
          <div className="space-y-6">
              {/* Disqualified Banner */}
              {selectedCandidate.status === 'Disqualified' && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 p-4 rounded">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-red-900 font-semibold mb-1">Candidate Disqualified</h4>
                      <p className="text-red-700 text-sm">
                        <span className="font-medium">Reason:</span> {selectedCandidate.disqualifiedReason}
                      </p>
                      {selectedCandidate.disqualifiedDate && (
                        <p className="text-red-600 text-xs mt-1">
                          Disqualified on {new Date(selectedCandidate.disqualifiedDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Candidate Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-gray-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 dark:text-blue-400 text-sm">AI Match</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{selectedCandidate.aiMatchScore}%</p>
                    </div>
                    <Brain className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-gray-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 dark:text-green-400 text-sm">Salary</p>
                      <p className="text-xl font-bold text-green-700 dark:text-green-300">${selectedCandidate.salaryExpectation.toLocaleString()}</p>
                    </div>
                    <DollarSign className="h-6 w-6 text-green-500 dark:text-green-400" />
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 border border-gray-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 dark:text-purple-400 text-sm">Experience</p>
                      <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{selectedCandidate.experience}</p>
                    </div>
                    <Award className="h-6 w-6 text-purple-500 dark:text-purple-400" />
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4 border border-gray-200 dark:border-yellow-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-600 dark:text-yellow-400 text-sm">Engagement</p>
                      <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{selectedCandidate.views + selectedCandidate.likes}</p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-gray-700 dark:text-gray-300">{selectedCandidate.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-gray-700 dark:text-gray-300">{selectedCandidate.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-gray-700 dark:text-gray-300">{selectedCandidate.location}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Professional Details</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Education:</span>
                      <p className="text-gray-900 dark:text-white">{selectedCandidate.education}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Previous Company:</span>
                      <p className="text-gray-900 dark:text-white">{selectedCandidate.previousCompany}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Applied Date:</span>
                      <p className="text-gray-900 dark:text-white">{new Date(selectedCandidate.appliedDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-sm rounded-full border border-blue-200 dark:border-blue-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Collaborators Section */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                    <Users className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                    Collaborators ({collaborators.filter(c => c.status !== 'revoked').length})
                  </h4>
                  <button
                    onClick={() => setShowCollaborationModal(true)}
                    className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Invite
                  </button>
                </div>
                <div className="space-y-2">
                  {collaborators.filter(c => c.status !== 'revoked').length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No collaborators yet. Invite team members to help evaluate this candidate.</p>
                  ) : (
                    collaborators.filter(c => c.status !== 'revoked').map((collab) => (
                      <div key={collab.id} className="bg-white dark:bg-gray-700 rounded p-3 border border-gray-200 dark:border-gray-600 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {collab.user?.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{collab.user?.full_name || 'Unknown User'}</p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{collab.user?.role || 'User'}</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                collab.role === 'decision_maker'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : collab.role === 'commenter'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                  : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                              }`}>
                                {collab.role.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                collab.status === 'accepted'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : collab.status === 'pending'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                  : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                              }`}>
                                {collab.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCollaborator(collab.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                          title="Remove collaborator"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Team Collaboration Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Team Collaboration</h4>
                  <button
                    onClick={() => setShowComments(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    View All Comments ({selectedCandidate.commentsCount})
                  </button>
                </div>
                <div className="space-y-3">
                  {selectedCandidate.comments.slice(0, 2).map((comment) => (
                    <div key={comment.id} className="bg-white dark:bg-gray-700 rounded p-3 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{comment.author}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(comment.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{comment.message}</p>
                      {comment.isPrivate && (
                        <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded mt-1 inline-block">
                          Private Note
                        </span>
                      )}
                    </div>
                  ))}
                  {selectedCandidate.comments.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No comments yet. Add the first comment to start collaborating!</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center space-x-3 pt-4 border-t">
                <div>
                  {selectedCandidate.status !== 'Hired' && selectedCandidate.status !== 'Disqualified' && (
                    <button
                      onClick={() => setShowDisqualifyModal(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t('hiring.disqualify')}
                    </button>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                  >
                    {t('common.close')}
                  </button>
                <button
                  onClick={() => setShowComments(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('hiring.addComment')}
                </button>
                {selectedCandidate.status !== 'Hired' && selectedCandidate.status !== 'Disqualified' && (
                  <button
                    onClick={() => setShowWorkerClassification(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Classify Worker
                  </button>
                )}
                {selectedCandidate.status === 'Hired' ? (
                  <button
                    onClick={() => {
                      setSelectedCandidate(null);
                      onNavigateToOnboarding?.();
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Onboarding
                  </button>
                ) : selectedCandidate.status === 'Disqualified' ? (
                  <button
                    onClick={handleRestoreCandidate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Restore Candidate
                  </button>
                ) : selectedCandidate.status !== 'Offer Accepted' && (
                  <button
                    onClick={() => handleMoveToNextStage(selectedCandidate)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {t('hiring.moveToNextStage')}
                  </button>
                )}
                {selectedCandidate.status === 'Interview' && (
                  <button
                    onClick={() => handleCreateOffer(selectedCandidate)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Create Offer
                  </button>
                )}
                {selectedCandidate.status === 'Offer Accepted' && (
                  <button
                    onClick={() => handleOpenConvertModal(selectedCandidate)}
                    className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-2 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-colors flex items-center shadow-lg"
                  >
                    <UserPlus className="h-5 w-5 mr-2" />
                    Convert to New Hire
                  </button>
                )}
                </div>
              </div>
          </div>
        )}
      </ResizableModal>

      {/* Comments Modal */}
      {showComments && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedCandidate.profilePicture}
                  alt={selectedCandidate.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white"
                />
                <div>
                  <h3 className="text-lg font-bold">Team Collaboration</h3>
                  <p className="text-purple-100">{selectedCandidate.name} • {selectedCandidate.position}</p>
                </div>
              </div>
              <button
                onClick={() => setShowComments(false)}
                className="text-purple-100 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Add Comment Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{t('hiring.addComment')}</h4>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Share your thoughts about this candidate with your team..."
                />
                <div className="flex items-center justify-between mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isPrivateComment}
                      onChange={(e) => setIsPrivateComment(e.target.checked)}
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Private note (only visible to HR team)</span>
                  </label>
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Add Comment
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Team Comments ({selectedCandidate.commentsCount})</h4>
                {selectedCandidate.comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No comments yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCandidate.comments.map((comment) => (
                      <div key={comment.id} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {comment.author.split(' ').map(n => n.charAt(0)).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{comment.author}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{comment.authorRole}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {comment.isPrivate && (
                              <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded">
                                Private
                              </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(comment.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{comment.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New Candidate</h3>
              <button
                onClick={() => setShowAddCandidate(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={newCandidateForm.name}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, name: e.target.value })}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={newCandidateForm.email}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, email: e.target.value })}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Position Applied For *"
                  value={newCandidateForm.position}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, position: e.target.value })}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={newCandidateForm.department}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, department: e.target.value })}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Department *</option>
                  {departments.filter(d => d !== 'All').map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Location"
                  value={newCandidateForm.location}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, location: e.target.value })}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Salary Expectation"
                  value={newCandidateForm.salary_expectation}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, salary_expectation: e.target.value })}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <input
                type="tel"
                placeholder="Phone Number"
                value={newCandidateForm.phone}
                onChange={(e) => setNewCandidateForm({ ...newCandidateForm, phone: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                placeholder="Skills (comma-separated)"
                value={newCandidateForm.skills}
                onChange={(e) => setNewCandidateForm({ ...newCandidateForm, skills: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddCandidate(false);
                  setNewCandidateForm({
                    name: '',
                    email: '',
                    phone: '',
                    position: '',
                    department: '',
                    location: '',
                    salary_expectation: '',
                    skills: ''
                  });
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                disabled={isAddingCandidate}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCandidate}
                disabled={isAddingCandidate}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isAddingCandidate ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  'Add Candidate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-80 flex items-center text-white ${
          notification.type === 'success' ? 'bg-green-600' :
          notification.type === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          <div className={`rounded-full p-1 mr-3 ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : notification.type === 'error' ? (
              <X className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
          </div>
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification(null)} 
            className="ml-3 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Offer Management Modal */}
      {showOfferManagement && selectedCandidateForOffer && (
        <OfferManagementModal
          candidateId={selectedCandidateForOffer.id}
          candidateName={selectedCandidateForOffer.name}
          candidateEmail={selectedCandidateForOffer.email}
          position={selectedCandidateForOffer.position}
          department={selectedCandidateForOffer.department}
          onClose={() => {
            setShowOfferManagement(false);
            setSelectedCandidateForOffer(null);
          }}
        />
      )}

      {/* Convert to New Hire Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserPlus className="h-8 w-8" />
                <div>
                  <h3 className="text-xl font-bold">Convert to New Hire</h3>
                  <p className="text-teal-100 text-sm">Create new hire record and start onboarding</p>
                </div>
              </div>
              <button
                onClick={() => setShowConvertModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-teal-900 dark:text-teal-100">Offer Accepted!</p>
                    <p className="text-sm text-teal-700 dark:text-teal-300 mt-1">
                      Converting this candidate to a new hire will automatically:
                    </p>
                    <ul className="text-sm text-teal-700 dark:text-teal-300 mt-2 space-y-1 ml-4 list-disc">
                      <li>Create a new hire record</li>
                      <li>Generate role-based onboarding tasks</li>
                      <li>Assign tasks to new hire, manager, IT, and other departments</li>
                      <li>Send notifications to relevant stakeholders</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newHireForm.first_name}
                    onChange={(e) => setNewHireForm({ ...newHireForm, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={newHireForm.last_name}
                    onChange={(e) => setNewHireForm({ ...newHireForm, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newHireForm.email}
                  onChange={(e) => setNewHireForm({ ...newHireForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newHireForm.phone}
                  onChange={(e) => setNewHireForm({ ...newHireForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role *
                  </label>
                  <input
                    type="text"
                    value={newHireForm.role}
                    onChange={(e) => setNewHireForm({ ...newHireForm, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department *
                  </label>
                  <input
                    type="text"
                    value={newHireForm.department}
                    onChange={(e) => setNewHireForm({ ...newHireForm, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newHireForm.start_date}
                    onChange={(e) => setNewHireForm({ ...newHireForm, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Salary *
                  </label>
                  <input
                    type="number"
                    value={newHireForm.salary}
                    onChange={(e) => setNewHireForm({ ...newHireForm, salary: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Employment Type *
                </label>
                <select
                  value={newHireForm.employment_type}
                  onChange={(e) => setNewHireForm({ ...newHireForm, employment_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setShowConvertModal(false)}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConvertToNewHire}
                disabled={isConverting || !newHireForm.first_name || !newHireForm.last_name || !newHireForm.email || !newHireForm.start_date || !newHireForm.salary}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-2 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isConverting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Converting...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Convert to New Hire
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disqualify Candidate Modal */}
      {showDisqualifyModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Disqualify Candidate</h3>
                <button
                  onClick={() => {
                    setShowDisqualifyModal(false);
                    setDisqualifyReason('');
                    setCustomReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You are about to disqualify <span className="font-semibold">{selectedCandidate.name}</span> for the position of <span className="font-semibold">{selectedCandidate.position}</span>.
                </p>
                <p className="text-sm text-red-600 mb-4">
                  This action will remove them from the active recruitment pipeline.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for Disqualification <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={disqualifyReason}
                    onChange={(e) => {
                      setDisqualifyReason(e.target.value);
                      if (e.target.value !== 'Other') {
                        setCustomReason('');
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select a reason...</option>
                    {disqualificationReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                {disqualifyReason === 'Other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Custom Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Please specify the reason..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDisqualifyModal(false);
                    setDisqualifyReason('');
                    setCustomReason('');
                  }}
                  className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisqualifyCandidate}
                  disabled={!disqualifyReason || (disqualifyReason === 'Other' && !customReason.trim())}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Confirm Disqualification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disqualified Candidates List Modal */}
      {showDisqualifiedList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-6 w-6 mr-3" />
                  <div>
                    <h2 className="text-2xl font-bold">Disqualified Candidates</h2>
                    <p className="text-red-100 text-sm mt-1">{disqualifiedCount} candidates disqualified</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDisqualifiedList(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {disqualifiedCandidates.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No disqualified candidates</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {disqualifiedCandidates.map(candidate => (
                    <div
                      key={candidate.id}
                      className="bg-white dark:bg-gray-700 border-2 border-red-100 dark:border-red-900/50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setShowDisqualifiedList(false);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{candidate.name}</h3>
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                                Disqualified
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                                {candidate.position}
                              </div>
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <Building className="h-4 w-4 mr-2 text-gray-400" />
                                {candidate.department}
                              </div>
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                {candidate.email}
                              </div>
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                {candidate.phone}
                              </div>
                            </div>
                            {candidate.disqualifiedReason && (
                              <div className="mt-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-3 rounded">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  <span className="font-medium text-red-900 dark:text-red-300">Reason:</span> {candidate.disqualifiedReason}
                                </p>
                                {candidate.disqualifiedDate && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Disqualified on {new Date(candidate.disqualifiedDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Worker Classification Modal */}
      {showWorkerClassification && selectedCandidate && (
        <WorkerClassificationModal
          candidateId={selectedCandidate.id}
          candidateName={selectedCandidate.name}
          jobTitle={selectedCandidate.position}
          jobDescription={selectedCandidate.notes || ''}
          onClose={() => setShowWorkerClassification(false)}
          onClassificationSelected={(classification, riskScore) => {
            setShowWorkerClassification(false);
            setNotification({
              type: 'success',
              message: `Worker classification saved: ${classification.name} (Risk Score: ${riskScore}%)`
            });
            setTimeout(() => setNotification(null), 3000);
          }}
        />
      )}

      {/* Collaboration Invite Modal */}
      {showCollaborationModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Users className="h-6 w-6 mr-2 text-purple-600" />
                  Invite Collaborator
                </h3>
                <button
                  onClick={() => {
                    setShowCollaborationModal(false);
                    setSelectedCollaboratorId('');
                    setSelectedCollaboratorRole('commenter');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Invite a team member to collaborate on evaluating <span className="font-semibold">{selectedCandidate.name}</span> for the <span className="font-semibold">{selectedCandidate.position}</span> position.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    The collaborator will receive an email notification and an in-app notification. They can view candidate details, add comments, and rate based on their assigned role.
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Team Member <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCollaboratorId}
                    onChange={(e) => setSelectedCollaboratorId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Choose a team member...</option>
                    {availableEmployees
                      .filter(emp => !collaborators.some(c => c.user?.id === emp.id && c.status !== 'revoked'))
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name} - {emp.role} ({emp.department})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Collaboration Role <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        value="viewer"
                        checked={selectedCollaboratorRole === 'viewer'}
                        onChange={(e) => setSelectedCollaboratorRole(e.target.value as any)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Viewer</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Can view candidate profile and documents only</p>
                      </div>
                    </label>
                    <label className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        value="commenter"
                        checked={selectedCollaboratorRole === 'commenter'}
                        onChange={(e) => setSelectedCollaboratorRole(e.target.value as any)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Commenter</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Can view and add comments to collaborate on evaluation</p>
                      </div>
                    </label>
                    <label className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        value="decision_maker"
                        checked={selectedCollaboratorRole === 'decision_maker'}
                        onChange={(e) => setSelectedCollaboratorRole(e.target.value as any)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Decision Maker</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Full access to view, comment, rate, and move candidate through stages</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCollaborationModal(false);
                    setSelectedCollaboratorId('');
                    setSelectedCollaboratorRole('commenter');
                  }}
                  className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteCollaborator}
                  disabled={isAddingCollaborator || !selectedCollaboratorId}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingCollaborator ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending Invitation...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confetti Animation */}
      <ConfettiAnimation
        show={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </>
  );
};

export default HiringModal;