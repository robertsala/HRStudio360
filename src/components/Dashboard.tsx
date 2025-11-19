import React from 'react';
import { User, Settings, BarChart3, Users, Calendar as CalendarIcon, Bell, LogOut, Brain, TrendingUp, TrendingDown, FileText, Inbox, Clock, Plus, DollarSign, Star, Shield, Smartphone, GraduationCap, Award, Heart, Bot, UserX, Search, ChevronRight, MapPin, Building, Mail, Phone, Briefcase, Target, AlertTriangle, CheckCircle, Zap, Globe, Sparkles, GitBranch, CreditCard, History, MessageCircle } from 'lucide-react';
import ChangeLogNotificationBadge from './ChangeLogNotificationBadge';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import type { DashboardStats } from '../../shared/schema';
import { useDashboardWidgets } from '../hooks/useDashboardWidgets';
import Calendar from './Calendar';
import EmployeeDirectoryModal from './modals/EmployeeDirectoryModal';
import ReviewsModal from './modals/ReviewsModal';
import EventsModal from './modals/EventsModal';
import NotificationsModal from './modals/NotificationsModal';
import AddEmployeeModal from './modals/AddEmployeeModal';
import PayrollModal from './modals/PayrollModal';
import ScheduleReviewModal from './modals/ScheduleReviewModal';
import SystemSettingsModal from './modals/SystemSettingsModal';
import TimeAttendanceModal from './modals/TimeAttendanceModal';
import EmployeeProfileModal from './modals/EmployeeProfileModal';
import TrainingModal from './modals/TrainingModal';
import SecurityModal from './modals/SecurityModal';
import MobileAppModal from './modals/MobileAppModal';
import AIInsightsModal from './modals/AIInsightsModal';
import AnalyticsModal from './modals/AnalyticsModal';
import ReportsModal from './modals/ReportsModal';
import LeaveManagementModal from './modals/LeaveManagementModal';
import PerformanceReviewModal from './modals/ComprehensivePerformanceReviewModal';
import InboxModal from './modals/InboxModal';
import HiringModal from './modals/HiringModal';
import HRDataReportingModal from './modals/HRDataReportingModal';
import ComprehensiveEmployeeProfileModal from './modals/ComprehensiveEmployeeProfileModal';
import BenefitsPayModal from './modals/BenefitsPayModal';
import AIAssistantModal from './modals/AIAssistantModal';
import OffboardingModal from './modals/OffboardingModal';
import TerminationRequestModal from './modals/TerminationRequestModal';
import AnnouncementsModal from './modals/AnnouncementsModal';
import OfferManagementModal from './modals/OfferManagementModal';
import HRKPIDashboardModal from './modals/HRKPIDashboardModal';
import AddressChangeApprovalModal from './modals/AddressChangeApprovalModal';
import WorkersCompensationModal from './modals/WorkersCompensationModal';
import UserManagementModal from './modals/UserManagementModalEnhanced';
import OrgChartModal from './modals/OrgChartModal';
import NewHireOnboardingModal from './modals/NewHireOnboardingModal';
import ComprehensiveExpenseModal from './modals/ComprehensiveExpenseModal';
import ExpenseEnrollmentModal from './modals/ExpenseEnrollmentModal';
import ReportingRelationshipsModal from './modals/ReportingRelationshipsModal';
import ImpersonationBanner from './ImpersonationBanner';
import DirectDepositModal from './modals/DirectDepositModal';
import WeatherWidget from './WeatherWidget';
import LocationOverrideModal from './modals/LocationOverrideModal';
import EnterpriseChatModal from './modals/EnterpriseChatModal';
import ChatNotificationBubble from './ChatNotificationBubble';
import DigitalClock from './DigitalClock';
import KnowledgeBaseModal from './modals/KnowledgeBaseModal';
import CollaboratorModal from './modals/CollaboratorModal';
import JobManagementModal from './modals/JobManagementModal';
import StudioAIChatModal from './modals/StudioAIChatModal';
import AgentActivityModal from './modals/AgentActivityModal';
import { mapEmployeeFromBackend } from '../lib/employeeDataMapper';

const Dashboard = React.forwardRef<{ openModal: (modalName: string) => void; openMyProfile: () => void }>((props, ref) => {
  const { t } = useTranslation();
  const { user, signOut, isImpersonating } = useAuth();
  
  // Active content state for inline views
  const [activeContent, setActiveContent] = React.useState<string | null>(null);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = React.useState<string | null>(null);
  const [systemSettingsTab, setSystemSettingsTab] = React.useState<string | undefined>(undefined);

  // Employee state management
  const [activeEmployee, setActiveEmployee] = React.useState<any | null>(null);

  // Announcements state (deprecated - for backwards compatibility only)
  const [announcements, setAnnouncements] = React.useState<any[]>([]);

  // User permissions and profile data (deprecated - moved to TanStack Query)
  const [canAccessOrgChart, setCanAccessOrgChart] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<any>(null);

  // Modal filter context
  const [modalFilter, setModalFilter] = React.useState<{
    type: 'my-team' | 'my-department' | 'my-location' | 'all';
    value?: string;
  }>({ type: 'all' });
  
  // Modal state management (only for true modals like AddEmployee)
  const [modals, setModals] = React.useState({
    addEmployee: false,
    scheduleReview: false,
    terminationRequest: false,
    directDeposit: false,
    locationOverride: false,
    enterpriseChat: false,
    knowledgeBase: false,
    collaborator: false,
    jobManagement: false,
    studioAIChat: false,
    agentActivity: false,
    addressChangeApproval: false
  });

  // Chat-specific state
  const [initialChatChannelId, setInitialChatChannelId] = React.useState<string | undefined>(undefined);
  
  // Studio AI context state
  const [studioAIContext, setStudioAIContext] = React.useState<'recruitment' | 'payroll'>('recruitment');

  // User role - use database role with fallback for special emails
  const getDatabaseRole = () => {
    if (!user) return 'Employee';

    // FIRST: Check for special email overrides (for demo/product owner accounts)
    if (user.email === 'robertsala@gmail.com') return 'Product Owner';
    if (user.email === 'demo@hrstudio360.com') return 'HR';
    if (user.email?.includes('productowner') || user.email?.includes('product-owner') ||
        user.email?.includes('product_owner')) return 'Product Owner';
    if (user.email?.includes('manager')) return 'Manager';
    if (user.email?.includes('hr')) return 'HR';

    // THEN: Use database role if available
    if (user.role) {
      // Map database roles (lowercase: employee, hr, admin) to display roles
      if (user.role === 'hr' || user.role === 'HR') return 'HR';
      if (user.role === 'admin' || user.role === 'Admin') return 'Product Owner';
      if (user.role === 'employee' || user.role === 'Employee') return 'Employee';
    }

    // Default: Employee
    return 'Employee';
  };

  const userRole = getDatabaseRole();

  // Fetch dashboard stats from API
  const { data: dashboardStats, isLoading: isStatsLoading, error: statsError} = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID is required');
      const response = await fetch(`/api/dashboard/stats?userId=${user.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false
  });

  // Fetch dashboard widgets configuration and helpers
  const { widgets, isLoading: isWidgetsLoading, isWidgetVisible, renderWidget } = useDashboardWidgets(user?.id, userRole);

  // Fetch announcements from API
  const { data: apiAnnouncements, isLoading: isAnnouncementsLoading } = useQuery<any[]>({
    queryKey: ['/api/announcements'],
    queryFn: async () => {
      const response = await fetch('/api/announcements?limit=3');
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }
      return response.json();
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5 // Cache for 5 minutes
  });

  // Fetch user permissions from API
  const { data: userPermissions } = useQuery<import('../../shared/schema').UserPermissions>({
    queryKey: ['/api/profiles', user?.id, 'permissions'],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID is required');
      const response = await fetch(`/api/profiles/${user.id}/permissions`);
      if (!response.ok) {
        throw new Error('Failed to fetch user permissions');
      }
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10 // Cache for 10 minutes
  });

  // Update legacy state when API data loads
  React.useEffect(() => {
    if (apiAnnouncements) {
      setAnnouncements(apiAnnouncements);
    }
  }, [apiAnnouncements]);

  React.useEffect(() => {
    if (userPermissions) {
      setUserProfile(userPermissions);
      const hasOrgChartAccess =
        userPermissions.department === 'HR' ||
        userPermissions.role === 'Product Owner' ||
        userPermissions.canAccessOrgChart === true;
      setCanAccessOrgChart(hasOrgChartAccess);
    }
  }, [userPermissions]);

  // Time-based greeting utility
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 12) return t('dashboard.goodMorning');
    if (hour >= 12 && hour < 17) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  // Get user's first name
  const getUserFirstName = () => {
    if (!user?.name) return '';
    return user.name.split(' ')[0];
  };

  // Get department-specific message
  const getDepartmentMessage = () => {
    if (!userProfile?.department) {
      return t('dashboard.welcomeMessage');
    }
    return t('dashboard.departmentMessage', { department: userProfile.department });
  };

  // Determine inbox label based on role
  const getInboxLabel = () => {
    if (userRole === 'HR' || userRole === 'Product Owner' || userProfile?.department === 'HR') {
      return 'HR Inbox';
    }
    return 'Inbox';
  };

  const openModal = (modalName: string) => {
    console.log(`Opening modal: ${modalName}`);
    console.log('Current activeContent:', activeContent);
    console.log('Is in modals object?', modalName in modals);

    // Special handling for systemSettings with tab parameter (e.g., "systemSettings:changelog")
    if (modalName.startsWith('systemSettings:')) {
      const tab = modalName.split(':')[1];
      console.log(`Opening systemSettings with tab: ${tab}`);
      setSystemSettingsTab(tab);
      setActiveContent('systemSettings');
      return;
    }

    // Special handling for dashboard navigation
    if (modalName === 'dashboard') {
      console.log('Navigating to dashboard - clearing active content');
      setActiveContent(null);
      return;
    }

    // Check if it's a true modal or inline content
    if (modalName in modals) {
      setModals(prev => ({ ...prev, [modalName as keyof typeof modals]: true }));
    } else {
      // Set as active inline content
      console.log(`Setting activeContent to: ${modalName}`);
      setActiveContent(modalName);
    }
  };

  const closeModal = (modalName: keyof typeof modals) => {
    console.log(`Closing modal: ${modalName}`);
    setModals(prev => ({ ...prev, [modalName]: false }));
  };

  const closeInlineContent = () => {
    setActiveContent(null);
  };

  const handleNotificationAction = (actionType: string) => {
    switch (actionType) {
      case 'benefits':
        openModal('benefitsPay');
        break;
      case 'compliance':
        openModal('reports');
        break;
      case 'security':
        openModal('security');
        break;
      case 'review':
        openModal('performanceReview');
        break;
      default:
        console.log('Unknown action type:', actionType);
    }
  };

  // Expose openModal function to parent via ref
  // Function to open My Profile with current user's employee data
  const openMyProfile = async () => {
    try {
      const response = await fetch(`/api/employees/user/${user?.id}`);
      if (response.ok) {
        const employeeData = await response.json();
        // Transform backend response using shared mapper for consistent data structure
        const mappedEmployee = mapEmployeeFromBackend(employeeData);
        setActiveEmployee(mappedEmployee);
        setActiveContent('comprehensiveProfile');
      } else {
        console.error('Failed to fetch employee data for My Profile');
        // Still open the modal, it will fetch the data internally
        setActiveContent('comprehensiveProfile');
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      // Still open the modal, it will fetch the data internally
      setActiveContent('comprehensiveProfile');
    }
  };

  React.useImperativeHandle(ref, () => ({
    openModal,
    openMyProfile
  }));
  
  // Handle successful employee addition
  const handleEmployeeAdded = (newEmployee: any) => {
    console.log('New employee added:', newEmployee);
    // Add the new employee to the list
    setEmployees(prev => [...prev, newEmployee]);
    closeModal('addEmployee');
  };

  // Mock data for personalized content
  const personalizedData = {
    ptoBalance: 15,
    sickLeaveBalance: 8,
    nextPayday: 'February 5, 2025',
    pendingTasks: [
      { id: '1', title: t('tasks.completeAnnualTraining'), dueDate: '2025-01-25', priority: t('dashboard.high') },
      { id: '2', title: t('tasks.updateEmergencyContact'), dueDate: '2025-01-30', priority: t('dashboard.medium') }
    ],
    teamStats: userRole === 'Manager' || userRole === 'HR' ? {
      teamSize: 12,
      onLeaveToday: 2,
      pendingApprovals: 5,
      teamPerformanceAvg: 4.2
    } : null,
    recentNotifications: [
      { id: '1', title: 'Your leave request was approved', time: '2 hours ago', type: 'success' },
      { id: '2', title: 'New pay stub available', time: '1 day ago', type: 'info' },
      { id: '3', title: 'Mandatory training assigned', time: '2 days ago', type: 'warning' }
    ],
    companyAnnouncements: announcements.map(ann => ({
      id: ann.id,
      title: ann.title,
      date: new Date(ann.created_at).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }),
      excerpt: ann.content.length > 100 ? ann.content.substring(0, 100) + '...' : ann.content
    })),
    upcomingEvents: [
      { id: '1', title: t('events.mlkDay'), date: '2025-01-20', type: t('events.holiday') },
      { id: '2', title: t('events.teamBuildingWorkshop'), date: '2025-02-10', type: t('events.training') },
      { id: '3', title: t('events.allHandsMeeting'), date: '2025-02-15', type: t('events.meeting') },
      { id: '4', title: t('events.presidentsDay'), date: '2025-02-17', type: t('events.holiday') }
    ]
  };

  const quickAccessModules = [
    {
      id: 'profile',
      title: t('dashboard.myProfile'),
      description: t('dashboard.myProfileDesc'),
      icon: User,
      color: 'bg-blue-500',
      action: () => openModal('employeeProfile')
    },
    {
      id: 'payBenefits',
      title: t('dashboard.payBenefits'),
      description: t('dashboard.payBenefitsDesc'),
      icon: DollarSign,
      color: 'bg-emerald-500',
      action: () => openModal('benefitsPay')
    },
    {
      id: 'directDeposit',
      title: t('dashboard.directDeposit'),
      description: t('dashboard.directDepositDesc'),
      icon: CreditCard,
      color: 'bg-teal-500',
      action: () => openModal('directDeposit')
    },
    {
      id: 'timeOff',
      title: t('dashboard.timeOff'),
      description: t('dashboard.timeOffDesc'),
      icon: CalendarIcon,
      color: 'bg-purple-500',
      action: () => openModal('leaveManagement')
    },
    {
      id: 'expenses',
      title: t('dashboard.expenses'),
      description: t('dashboard.expensesDesc'),
      icon: DollarSign,
      color: 'bg-green-500',
      action: () => openModal('expenseManagement')
    },
    {
      id: 'directory',
      title: t('dashboard.employeeDirectory'),
      description: t('dashboard.employeeDirectoryDesc'),
      icon: Users,
      color: 'bg-indigo-500',
      action: () => openModal('employees')
    },
    {
      id: 'performance',
      title: t('dashboard.performance'),
      description: t('dashboard.performanceDesc'),
      icon: TrendingUp,
      color: 'bg-pink-500',
      action: () => openModal('performanceReview')
    },
    {
      id: 'training',
      title: t('dashboard.training'),
      description: t('dashboard.trainingDesc'),
      icon: GraduationCap,
      color: 'bg-yellow-500',
      action: () => openModal('training')
    },
    {
      id: 'chat',
      title: 'Enterprise Chat',
      description: 'Secure messaging with your team',
      icon: MessageCircle,
      color: 'bg-gradient-to-r from-blue-600 to-purple-600',
      action: () => openModal('enterpriseChat')
    }
  ];

  // Add manager/HR/Product Owner specific modules
  if (userRole === 'Manager' || userRole === 'HR' || userRole === 'Product Owner') {
    quickAccessModules.push({
      id: 'hrInbox',
      title: getInboxLabel(),
      description: t('dashboard.hrInboxDesc'),
      icon: Inbox,
      color: 'bg-red-500',
      action: () => {
        console.log('[Dashboard] Inbox quick access clicked');
        openModal('inbox');
      }
    });
  }

  // Add HR and Product Owner KPI Dashboard
  if (userRole === 'HR' || userRole === 'Product Owner') {
    quickAccessModules.push({
      id: 'hrKPIDashboard',
      title: t('dashboard.kpiDashboard'),
      description: t('dashboard.kpiDashboardDesc'),
      icon: BarChart3,
      color: 'bg-gradient-to-r from-blue-600 to-emerald-600',
      action: () => openModal('hrKPIDashboard')
    });
    quickAccessModules.push({
      id: 'expenseEnrollment',
      title: t('dashboard.expenseEnrollment'),
      description: t('dashboard.expenseEnrollmentDesc'),
      icon: DollarSign,
      color: 'bg-teal-500',
      action: () => openModal('expenseEnrollment')
    });
    quickAccessModules.push({
      id: 'reportingRelationships',
      title: t('dashboard.reportingRelationships'),
      description: t('dashboard.reportingRelationshipsDesc'),
      icon: Users,
      color: 'bg-indigo-600',
      action: () => openModal('reportingRelationships')
    });
    quickAccessModules.push({
      id: 'userManagement',
      title: t('dashboard.userManagement'),
      description: t('dashboard.userManagementDesc'),
      icon: Shield,
      color: 'bg-orange-500',
      action: () => openModal('userManagement')
    });
  }

  // Add Workers Compensation for HR and Product Owner
  if (userRole === 'HR' || userRole === 'Product Owner') {
    quickAccessModules.push({
      id: 'workersComp',
      title: t('dashboard.workersCompensation'),
      description: t('dashboard.workersCompensationDesc'),
      icon: Shield,
      color: 'bg-red-600',
      action: () => openModal('workersCompensation')
    });
    quickAccessModules.push({
      id: 'jobManagement',
      title: 'Job Postings',
      description: 'Create and manage job postings for recruitment',
      icon: Briefcase,
      color: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      action: () => openModal('jobManagement')
    });
    quickAccessModules.push({
      id: 'addressChangeApproval',
      title: 'Address Change Approvals',
      description: 'Review and approve employee address change requests',
      icon: MapPin,
      color: 'bg-gradient-to-r from-purple-600 to-blue-600',
      action: () => openModal('addressChangeApproval')
    });
  }

  // Add Org Chart for users with access
  if (canAccessOrgChart) {
    quickAccessModules.push({
      id: 'orgChart',
      title: t('dashboard.orgChart'),
      description: t('dashboard.orgChartDesc'),
      icon: GitBranch,
      color: 'bg-gradient-to-r from-purple-600 to-pink-600',
      action: () => openModal('orgChart')
    });
  }

  const stats = [
    {
      label: t('dashboard.ptoBalance'),
      value: isStatsLoading 
        ? '...' 
        : dashboardStats?.ptoBalance 
          ? `${Math.round(dashboardStats.ptoBalance.total)} ${t('dashboard.days')}`
          : 'N/A',
      icon: CalendarIcon,
      color: 'bg-blue-500',
      action: () => openModal('leaveManagement')
    },
    {
      label: t('dashboard.nextPayday'),
      value: isStatsLoading
        ? '...'
        : dashboardStats?.nextPayday 
          ? dashboardStats.nextPayday.split(',')[0]
          : 'N/A',
      icon: DollarSign,
      color: 'bg-emerald-500',
      action: () => openModal('benefitsPay')
    },
    {
      label: t('dashboard.pendingTasks'),
      value: isStatsLoading
        ? '...'
        : (dashboardStats?.pendingTasks?.count || 0).toString(),
      icon: Clock,
      color: 'bg-purple-500',
      action: () => openModal('inbox')
    },
    {
      label: userRole === 'Manager' || userRole === 'HR' 
        ? t('dashboard.teamSize') 
        : t('dashboard.companyEvents'),
      value: isStatsLoading
        ? '...'
        : (userRole === 'Manager' || userRole === 'HR')
          ? (dashboardStats?.team?.size || 0).toString()
          : (dashboardStats?.events?.upcomingCount || 0).toString(),
      icon: (userRole === 'Manager' || userRole === 'HR') ? Users : CalendarIcon,
      color: 'bg-yellow-500',
      action: () => (userRole === 'Manager' || userRole === 'HR') 
        ? openModal('employees') 
        : openModal('events')
    }
  ];

  // Render inline content based on activeContent
  const renderInlineContent = () => {
    console.log('renderInlineContent called with activeContent:', activeContent);
    switch (activeContent) {
      case 'employees':
        return (
          <EmployeeDirectoryModal
            isOpen={true}
            onClose={closeInlineContent}
          />
        );
      case 'reviews':
        return (
          <ReviewsModal
            isOpen={true}
            onClose={closeInlineContent}
            onScheduleReview={() => openModal('scheduleReview')}
          />
        );
      case 'events':
        return <EventsModal onClose={closeInlineContent} />;
      case 'notifications':
        return <NotificationsModal onTakeAction={handleNotificationAction} onClose={closeInlineContent} />;
      case 'payroll':
        return <PayrollModal onClose={closeInlineContent} onOpenStudioAI={() => {
          setStudioAIContext('payroll');
          openModal('studioAIChat');
        }} />;
      case 'timeAttendance':
        return <TimeAttendanceModal onClose={closeInlineContent} />;
      case 'employeeProfile':
        return <EmployeeProfileModal isOpen={true} onClose={closeInlineContent} />;
      case 'training':
        return <TrainingModal onClose={closeInlineContent} onOpenKnowledgeBase={() => setModals({ ...modals, knowledgeBase: true })} />;
      case 'security':
        return <SecurityModal isOpen={true} onClose={closeInlineContent} />;
      case 'analytics':
        return <AnalyticsModal isOpen={true} onClose={closeInlineContent} />;
      case 'mobileApp':
        return <MobileAppModal isOpen={true} onClose={closeInlineContent} />;
      case 'reports':
        return <ReportsModal onClose={closeInlineContent} />;
      case 'leaveManagement':
        return <LeaveManagementModal
          onClose={closeInlineContent}
          initialFilter={
            modalFilter.type !== 'all'
              ? {
                  type: modalFilter.type,
                  managerId: user?.name,
                  department: userProfile?.department,
                  location: employees.find(e => e.email === user?.email)?.location,
                }
              : undefined
          }
        />;
      case 'performanceReview':
        return <PerformanceReviewModal
          onClose={closeInlineContent}
          initialFilter={
            modalFilter.type !== 'all'
              ? {
                  type: modalFilter.type,
                  managerId: user?.name,
                  department: userProfile?.department,
                  location: employees.find(e => e.email === user?.email)?.location,
                }
              : undefined
          }
        />;
      case 'inbox':
        console.log('Rendering InboxModal with filter:', modalFilter);
        return <InboxModal
          onClose={closeInlineContent}
          initialFilter={
            modalFilter.type !== 'all'
              ? {
                  type: modalFilter.type,
                  managerId: user?.name,
                  department: userProfile?.department,
                  location: employees.find(e => e.email === user?.email)?.location,
                }
              : undefined
          }
        />;
      case 'hiring':
        return <HiringModal onNavigateToOnboarding={() => setActiveContent('onboarding')} onClose={closeInlineContent} onOpenStudioAI={() => {
          setStudioAIContext('recruitment');
          openModal('studioAIChat');
        }} />;
      case 'hrDataReporting':
        return <HRDataReportingModal isOpen={true} onClose={closeInlineContent} />;
      case 'comprehensiveProfile':
        return <ComprehensiveEmployeeProfileModal isOpen={true} onClose={closeInlineContent} employee={activeEmployee || undefined} />;
      case 'benefitsPay':
        return <BenefitsPayModal isOpen={true} onClose={closeInlineContent} />;
      case 'aiInsights':
        return <AIInsightsModal isOpen={true} onClose={closeInlineContent} />;
      case 'aiAssistant':
        return <AIAssistantModal isOpen={true} onClose={closeInlineContent} />;
      case 'offboarding':
        return <OffboardingModal isOpen={true} onClose={closeInlineContent} />;
      case 'onboarding':
        return <NewHireOnboardingModal isOpen={true} onClose={closeInlineContent} />;
      case 'systemSettings':
        return <SystemSettingsModal onClose={closeInlineContent} initialTab={systemSettingsTab} />;
      case 'announcements':
        return <AnnouncementsModal selectedAnnouncementId={selectedAnnouncementId} onClose={closeInlineContent} />;
      case 'offerManagement':
        return <OfferManagementModal onClose={closeInlineContent} />;
      case 'hrKPIDashboard':
        return <HRKPIDashboardModal isOpen={true} onClose={closeInlineContent} />;
      case 'workersCompensation':
        return <WorkersCompensationModal isOpen={true} onClose={closeInlineContent} />;
      case 'userManagement':
        return <UserManagementModal onClose={closeInlineContent} />;
      case 'orgChart':
        return <OrgChartModal onClose={closeInlineContent} />;
      case 'newHireOnboarding':
        return <NewHireOnboardingModal isOpen={true} onClose={closeInlineContent} />;
      case 'expenseManagement':
        return <ComprehensiveExpenseModal isOpen={true} onClose={closeInlineContent} userRole={userRole.toLowerCase()} />;
      case 'expenseEnrollment':
        return <ExpenseEnrollmentModal isOpen={true} onClose={closeInlineContent} />;
      case 'reportingRelationships':
        return <ReportingRelationshipsModal isOpen={true} onClose={closeInlineContent} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:bg-gray-900">
      <ImpersonationBanner />
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isImpersonating ? 'mt-16' : ''}`}>
        {/* Render inline content or default dashboard */}
        {activeContent ? (
          <div className="min-h-screen">
            {renderInlineContent()}
          </div>
        ) : (
          <>
            {/* Personalized Welcome Section */}
            {renderWidget('welcome-header', () => (
              <div className="mb-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {getTimeBasedGreeting()}, {getUserFirstName()}! 👋
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      {getDepartmentMessage()}
                    </p>
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="hidden lg:block flex-1">
                      <WeatherWidget onLocationChange={() => setModals(prev => ({ ...prev, locationOverride: true }))} />
                    </div>
                    <div className="text-right hidden xl:block">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.todayIs')}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Date().toLocaleDateString(i18n.language, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="mt-2">
                        <DigitalClock format="12" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Mobile weather widget */}
                <div className="lg:hidden mt-4">
                  <WeatherWidget onLocationChange={() => setModals(prev => ({ ...prev, locationOverride: true }))} />
                </div>
              </div>
            ))}

            {/* Personalized Stats Grid */}
            {renderWidget('personal-stats', () => (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {isStatsLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`skeleton-stat-${index}`}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                      data-testid={`skeleton-stat-${index}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-3 rounded-xl bg-gray-200 dark:bg-gray-700 shadow-md animate-pulse">
                            <div className="h-6 w-6" />
                          </div>
                          <div className="ml-4 space-y-2">
                            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </div>
                        </div>
                        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    </div>
                  ))
                ) : (
                  stats.map((stat) => {
                    const Icon = stat.icon;
                    
                    return (
                      <button
                        key={stat.label}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all transform hover:scale-105 text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-100 dark:border-gray-700"
                        onClick={stat.action}
                        data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`p-3 rounded-xl ${stat.color} shadow-md`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-4">
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">{stat.label}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            ))}

            {/* Manager/HR Specific Stats */}
            {renderWidget('team-overview', () => 
              (userRole === 'Manager' || userRole === 'HR') && personalizedData.teamStats ? (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => {
                      setModalFilter({ type: 'all' });
                      openModal('employees');
                    }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">{t('dashboard.teamSize')}</p>
                        <p className="text-2xl font-bold">{personalizedData.teamStats.teamSize}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-200" />
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setModalFilter({ type: 'all' });
                      openModal('leaveManagement');
                    }}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-white hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-sm">{t('dashboard.onLeaveToday')}</p>
                        <p className="text-2xl font-bold">{personalizedData.teamStats.onLeaveToday}</p>
                      </div>
                      <CalendarIcon className="h-8 w-8 text-yellow-200" />
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setModalFilter({ type: 'all' });
                      openModal('inbox');
                    }}
                    className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-4 text-white hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-sm">{t('dashboard.pendingApprovals')}</p>
                        <p className="text-2xl font-bold">{personalizedData.teamStats.pendingApprovals}</p>
                      </div>
                      <Clock className="h-8 w-8 text-red-200" />
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setModalFilter({ type: 'all' });
                      openModal('performanceReview');
                    }}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">{t('dashboard.teamPerformance')}</p>
                        <p className="text-2xl font-bold">{personalizedData.teamStats.teamPerformanceAvg}/5</p>
                      </div>
                      <Star className="h-8 w-8 text-green-200" />
                    </div>
                  </button>
                </div>
              </div>
            ) : null
            )}

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Quick Access & Notifications */}
              <div className="lg:col-span-1 space-y-6">
                {/* Quick Access Modules */}
                {renderWidget('quick-actions', () => (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-blue-500" />
                      {t('dashboard.quickAccess')}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {quickAccessModules.map((module) => {
                        const Icon = module.icon;
                        return (
                          <button
                            key={module.id}
                            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={module.action}
                          >
                            <div className={`p-2 rounded-lg mb-2 inline-block ${module.color} shadow-md`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{module.title}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{module.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Pending Tasks */}
                {renderWidget('pending-tasks', () => (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-purple-500" />
                      {t('dashboard.yourPendingTasks')}
                    </h3>
                    <div className="space-y-3">
                      {personalizedData.pendingTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{task.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.due')}: {new Date(task.dueDate).toLocaleDateString(i18n.language)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.priority === 'High' ? 'bg-red-100 text-red-800' :
                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => openModal('inbox')}
                      className="w-full mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      {t('dashboard.viewAllTasks')} →
                    </button>
                  </div>
                ))}

                {/* Recent Notifications */}
                {renderWidget('recent-notifications', () => (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Bell className="h-5 w-5 mr-2 text-yellow-500" />
                      {t('dashboard.recentNotifications')}
                    </h3>
                  <div className="space-y-3">
                    {personalizedData.recentNotifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className={`p-1 rounded-full ${
                          notification.type === 'success' ? 'bg-green-100' :
                          notification.type === 'warning' ? 'bg-yellow-100' :
                          'bg-blue-100'
                        }`}>
                          {notification.type === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : notification.type === 'warning' ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <Bell className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{notification.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => openModal('notifications')}
                    className="w-full mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    {t('dashboard.viewAllNotifications')} →
                  </button>
                </div>
                ))}

                {/* Compliance Alerts - Manager/HR/Product Owner Only */}
                {renderWidget('compliance-alerts', () => (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-orange-500" />
                      Compliance Alerts
                    </h3>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Coming soon: Real-time compliance notifications and regulatory updates to keep your organization compliant.
                      </p>
                    </div>
                  </div>
                ))}

                {/* KPI Dashboard - HR/Product Owner Only */}
                {renderWidget('kpi-dashboard', () => (
                  <div className="bg-gradient-to-br from-blue-50 via-emerald-50 to-blue-50 dark:from-blue-900/30 dark:via-emerald-900/30 dark:to-blue-900/30 rounded-xl p-6 shadow-sm border border-blue-100 dark:border-blue-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                      {t('dashboard.hrKPIDashboard')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {t('dashboard.hrKPIDashboardIntro')}
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.headcount')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">247</p>
                          </div>
                          <Users className="h-8 w-8 text-blue-500 opacity-50" />
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.turnover')}</p>
                            <p className="text-xl font-bold text-green-600">12.3%</p>
                          </div>
                          <TrendingDown className="h-8 w-8 text-green-500 opacity-50" />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => openModal('hrKPIDashboard')}
                      className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all font-medium text-sm shadow-md hover:shadow-lg"
                    >
                      {t('dashboard.openFullKPIDashboard')} →
                    </button>
                  </div>
                ))}
              </div>

              {/* Right Column - Company News & Calendar */}
              <div className="lg:col-span-2 space-y-6">
                {/* Company Announcements & News Feed */}
                {renderWidget('company-announcements', () => (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                      <Globe className="h-5 w-5 mr-2 text-blue-500" />
                      {t('dashboard.companyAnnouncements')}
                    </h3>
                    <div className="space-y-4">
                      {isAnnouncementsLoading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2" data-testid={`skeleton-announcement-${index}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                              </div>
                              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-4" />
                            </div>
                          </div>
                        ))
                      ) : personalizedData.companyAnnouncements.length > 0 ? (
                        personalizedData.companyAnnouncements.map((announcement) => (
                          <div key={announcement.id} className="border-l-4 border-blue-500 pl-4 py-2" data-testid={`announcement-${announcement.id}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{announcement.title}</h4>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{announcement.excerpt}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{announcement.date}</p>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedAnnouncementId(announcement.id);
                                  openModal('announcements');
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium ml-4 hover:underline"
                                data-testid={`button-read-announcement-${announcement.id}`}
                              >
                                {t('dashboard.readMore')}
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <Globe className="h-12 w-12 mx-auto mb-2 opacity-30" />
                          <p>{t('dashboard.noAnnouncements') || 'No announcements at this time'}</p>
                        </div>
                      )}
                    </div>
                    {!isAnnouncementsLoading && (
                      <button
                        onClick={() => openModal('announcements')}
                        className="w-full mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium hover:underline"
                        data-testid="button-view-all-announcements"
                      >
                        {t('dashboard.viewAllAnnouncements')} →
                      </button>
                    )}
                  </div>
                ))}

                {/* Upcoming Events & Calendar Integration */}
                {renderWidget('upcoming-events', () => (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <CalendarIcon className="h-5 w-5 mr-2 text-purple-500" />
                        {t('dashboard.upcomingEvents')}
                      </h3>
                      <button
                        onClick={() => openModal('events')}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium"
                      >
                        {t('dashboard.viewFullCalendar')} →
                      </button>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      {personalizedData.upcomingEvents.slice(0, 4).map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              event.type === 'Holiday' ? 'bg-red-100' :
                              event.type === 'Training' ? 'bg-green-100' :
                              'bg-blue-100'
                            }`}>
                              {event.type === 'Holiday' ? (
                                <CalendarIcon className={`h-4 w-4 ${
                                  event.type === 'Holiday' ? 'text-red-600' :
                                  event.type === 'Training' ? 'text-green-600' :
                                  'text-blue-600'
                                }`} />
                              ) : event.type === 'Training' ? (
                                <GraduationCap className="h-4 w-4 text-green-600" />
                              ) : (
                                <Users className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">{event.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(event.date).toLocaleDateString(i18n.language)}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            event.type === 'Holiday' ? 'bg-red-100 text-red-800' :
                            event.type === 'Training' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {event.type}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Mini Calendar */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <Calendar
                        holidays={[
                          {
                            id: '1',
                            name: 'Columbus Day',
                            date: '2025-10-13',
                            type: 'Federal',
                            description: 'Federal holiday'
                          },
                          {
                            id: '2',
                            name: 'Company Retreat Day',
                            date: '2025-10-10',
                            type: 'Company',
                            description: 'Annual team building retreat'
                          },
                          {
                            id: '3',
                            name: 'Halloween Party',
                            date: '2025-10-31',
                            type: 'Company',
                            description: 'Office Halloween celebration'
                          },
                          {
                            id: '4',
                            name: 'Q4 Planning Day',
                            date: '2025-10-01',
                            type: 'Company',
                            description: 'Quarterly planning session'
                          },
                          {
                            id: '5',
                            name: 'Veterans Day',
                            date: '2025-11-11',
                            type: 'Federal',
                            description: 'Federal holiday honoring veterans'
                          }
                        ]}
                        onAddEvent={() => openModal('events')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights Section */}
            {renderWidget('ai-insights', () => (
              <div className="mt-8 mb-8">
                <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-all transform hover:scale-[1.02]"
                     onClick={() => openModal('aiInsights')}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-white/20 dark:bg-gray-800/20 rounded-full p-2 mr-3">
                        <Brain className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-semibold">{t('dashboard.aiInsights')}</h3>
                    </div>
                    <div className="flex items-center bg-white/20 dark:bg-gray-800/20 rounded-full px-3 py-1">
                      <Sparkles className="h-4 w-4 mr-1" />
                      <span className="text-sm">{t('dashboard.poweredByAI')}</span>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        {t('dashboard.workforceTrends')}
                      </h4>
                      <p className="text-blue-100 text-sm">
                        {t('dashboard.workforceTrendsText')}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        {t('dashboard.actionRequired')}
                      </h4>
                      <p className="text-blue-100 text-sm">
                        {t('dashboard.actionRequiredText')}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        {t('dashboard.predictiveAnalytics')}
                      </h4>
                      <p className="text-blue-100 text-sm">
                        {t('dashboard.predictiveAnalyticsText')}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('dashboard.performanceInsights')}
                      </h4>
                      <p className="text-blue-100 text-sm">
                        {t('dashboard.performanceInsightsText')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-blue-100 text-sm flex items-center justify-center">
                      <Brain className="h-4 w-4 mr-1" />
                      {t('dashboard.clickToExplore')} →
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Studio AI Chat - Autonomous Recruitment Assistant */}
            <div className="mt-8 mb-8">
              <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg border-2 border-purple-400/30 cursor-pointer hover:shadow-2xl transition-all transform hover:scale-[1.02]"
                   onClick={() => {
                     setStudioAIContext('recruitment');
                     openModal('studioAIChat');
                   }}
                   data-testid="card-studio-ai-chat">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-white/20 rounded-full p-3 mr-3 relative">
                      <Bot className="h-7 w-7" />
                      <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Studio AI Chat</h3>
                      <p className="text-purple-100 text-sm">Autonomous HR & Recruitment Assistant</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-yellow-400/20 rounded-full px-4 py-2 border border-yellow-300/30">
                    <Sparkles className="h-4 w-4 mr-2 text-yellow-300" />
                    <span className="text-sm font-semibold">GPT-4o Powered</span>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Autonomous Screening
                    </h4>
                    <p className="text-purple-100 text-sm">
                      AI automatically screens candidates based on job requirements
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      Smart Insights
                    </h4>
                    <p className="text-purple-100 text-sm">
                      Get instant hiring pipeline analysis and candidate recommendations
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Real Conversations
                    </h4>
                    <p className="text-purple-100 text-sm">
                      Chat naturally about candidates, jobs, and HR processes
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStudioAIContext('recruitment');
                      openModal('studioAIChat');
                    }}
                    className="flex items-center justify-center bg-white/10 rounded-lg py-3 hover:bg-white/20 transition-colors"
                    data-testid="button-open-studio-chat"
                  >
                    <Bot className="h-5 w-5 mr-2" />
                    <span className="font-medium">Start Chat</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal('agentActivity');
                    }}
                    className="flex items-center justify-center bg-white/10 rounded-lg py-3 hover:bg-white/20 transition-colors"
                    data-testid="button-open-agent-activity"
                  >
                    <History className="h-5 w-5 mr-2" />
                    <span className="font-medium">View Activity</span>
                  </button>
                </div>
              </div>
            </div>

            {/* System Updates Notice */}
            <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-emerald-900/20 rounded-xl p-6 shadow-sm border border-purple-200 dark:border-purple-800 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-3 rounded-xl">
                    <History className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">System Updates & Improvements</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      New AI-powered features available! Check out auto-fix system, snapshots, and comprehensive change tracking.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSystemSettingsTab('changelog');
                    openModal('systemSettings');
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 flex items-center whitespace-nowrap"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  View Change Log
                </button>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.needHelp')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{t('dashboard.needHelpDesc')}</p>
                </div>
                <button
                  onClick={() => openModal('aiAssistant')}
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105 flex items-center"
                >
                  <Bot className="h-5 w-5 mr-2" />
                  {t('dashboard.askAIAssistant')}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Modals for true modal views */}
        {modals.addEmployee && <AddEmployeeModal onClose={() => closeModal('addEmployee')} onEmployeeAdded={handleEmployeeAdded} />}
        {modals.scheduleReview && <ScheduleReviewModal onClose={() => closeModal('scheduleReview')} />}
        {modals.terminationRequest && <TerminationRequestModal onClose={() => closeModal('terminationRequest')} />}
        {modals.directDeposit && <DirectDepositModal isOpen={modals.directDeposit} onClose={() => closeModal('directDeposit')} />}
        {modals.locationOverride && (
          <LocationOverrideModal
            isOpen={modals.locationOverride}
            onClose={() => closeModal('locationOverride')}
            onLocationUpdated={() => {
              closeModal('locationOverride');
              window.location.reload();
            }}
          />
        )}
        {modals.enterpriseChat && (
          <EnterpriseChatModal
            isOpen={modals.enterpriseChat}
            onClose={() => closeModal('enterpriseChat')}
            initialChannelId={initialChatChannelId}
          />
        )}
        {modals.knowledgeBase && (
          <KnowledgeBaseModal
            isOpen={modals.knowledgeBase}
            onClose={() => closeModal('knowledgeBase')}
          />
        )}
        {modals.collaborator && (
          <CollaboratorModal
            isOpen={modals.collaborator}
            onClose={() => closeModal('collaborator')}
          />
        )}
        {modals.jobManagement && (
          <JobManagementModal
            onClose={() => closeModal('jobManagement')}
            onOpenStudioAI={() => {
              setStudioAIContext('recruitment');
              openModal('studioAIChat');
            }}
          />
        )}
        {modals.studioAIChat && (
          <StudioAIChatModal
            isOpen={modals.studioAIChat}
            onClose={() => closeModal('studioAIChat')}
            context={studioAIContext}
          />
        )}
        {modals.agentActivity && (
          <AgentActivityModal
            isOpen={modals.agentActivity}
            onClose={() => closeModal('agentActivity')}
          />
        )}
        {modals.addressChangeApproval && (
          <AddressChangeApprovalModal
            isOpen={modals.addressChangeApproval}
            onClose={() => closeModal('addressChangeApproval')}
          />
        )}

        {/* Chat Notification Bubbles */}
        <ChatNotificationBubble
          onOpenChat={(channelId) => {
            setInitialChatChannelId(channelId || undefined);
            setModals(prev => ({ ...prev, enterpriseChat: true }));
          }}
        />

      </div>
    </div>
  );
});

export default Dashboard;