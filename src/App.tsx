import { useRef } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import Layout from './components/Layout';
import Hero from './components/Hero';
import Problems from './components/Problems';
import Features from './components/Features';
import Advantages from './components/Advantages';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import ProtectedRoute from './components/ProtectedRoute';
import BirthdayCelebrationModal from './components/modals/BirthdayCelebrationModal';
import AnniversaryCelebrationModal from './components/modals/AnniversaryCelebrationModal';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CareersPage from './pages/CareersPage';
import OnboardingPage from './pages/OnboardingPage';
import StudioAIPage from './pages/StudioAIPage';
import InboxPage from './pages/InboxPage';
import ChatPage from './pages/ChatPage';
import BenefitsPage from './pages/BenefitsPage';
import LeavePage from './pages/LeavePage';
import PerformancePage from './pages/PerformancePage';
import EmployeesPage from './pages/EmployeesPage';
import TimeTrackingPage from './pages/TimeTrackingPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import SettingsPage from './pages/SettingsPage';
import HiringPage from './pages/HiringPage';
import TrainingPage from './pages/TrainingPage';
import CompliancePage from './pages/CompliancePage';
import HRSupportPage from './pages/HRSupportPage';
import MFAVerificationPage from './pages/MFAVerificationPage';
import MFARecoveryRequestPage from './pages/MFARecoveryRequestPage';
import MFARecoveryVerifyPage from './pages/MFARecoveryVerifyPage';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { isAuthenticated, isLoading, celebration, dismissCelebration, user } = useAuth();
  const dashboardRef = useRef<any>(null);
  const [, setLocation] = useLocation();

  // Handle navigation
  const handleNavigation = (view: 'landing' | 'dashboard' | 'profile') => {
    if (!isAuthenticated && view !== 'landing') {
      return;
    }
    
    if (view === 'landing') setLocation('/');
    else if (view === 'dashboard') setLocation('/dashboard');
    else if (view === 'profile') setLocation('/profile');
  };

  // Route map for TIER 1 pages only (pages that have actual page components)
  // NOTE: Do NOT include modals here - they should use Dashboard's modal system
  const PAGE_ROUTES: Record<string, string> = {
    // Converted full-screen pages
    enterpriseChat: '/chat',
    benefitsPay: '/benefits',
    leaveManagement: '/leave',
    performanceReview: '/performance',
    employees: '/employees',
    employeeDirectory: '/employees',
    timeTracking: '/time-tracking',
    // timeAttendance is a MODAL, not a page - handled by Dashboard inline content
    announcements: '/announcements',
    systemSettings: '/settings',
    hiring: '/hiring',
    training: '/training',
    onboarding: '/onboarding',
    newHireOnboarding: '/onboarding',
    studioAIChat: '/ai-assistant',
    inbox: '/inbox',
    compliance: '/compliance',
    hrSupport: '/hr-support',
    // Special navigation
    dashboard: '/dashboard',
  };

  // Handle opening modals/pages from sidebar - now works from ANY page
  const handleOpenModal = (modalName: string) => {
    console.log('[App.tsx] handleOpenModal called with:', modalName);
    
    // Handle systemSettings with tab parameter (e.g., "systemSettings:changelog")
    if (modalName.startsWith('systemSettings:')) {
      const tab = modalName.split(':')[1];
      console.log(`[App.tsx] Navigating to Settings with tab: ${tab}`);
      setLocation(`/settings?tab=${tab}`);
      return;
    }
    
    // Direct route navigation for converted TIER 1 pages - works from any page
    if (modalName in PAGE_ROUTES) {
      const path = PAGE_ROUTES[modalName];
      console.log(`[App.tsx] Navigating to page: ${path}`);
      setLocation(path);
      return;
    }
    
    // For modals that still exist (payroll, reports, events, offboarding, etc.)
    // Try Dashboard ref first, otherwise navigate to dashboard with query param
    if (dashboardRef.current && dashboardRef.current.openModal) {
      console.log('[App.tsx] Opening Dashboard modal:', modalName);
      dashboardRef.current.openModal(modalName);
    } else {
      console.log('[App.tsx] Dashboard not mounted, navigating to dashboard with openModal query param');
      // Navigate to dashboard with query param - Dashboard will open the modal on mount
      setLocation(`/dashboard?openModal=${encodeURIComponent(modalName)}`);
    }
  };

  // Handle opening My Profile - prefers Dashboard modal when available, otherwise routes to /profile
  const handleOpenMyProfile = () => {
    console.log('[App.tsx] handleOpenMyProfile called');
    if (dashboardRef.current && dashboardRef.current.openMyProfile) {
      console.log('[App.tsx] Using Dashboard profile modal');
      dashboardRef.current.openMyProfile();
    } else {
      console.log('[App.tsx] Dashboard not mounted, routing to /profile');
      setLocation('/profile');
    }
  };

  // Helper function to render protected pages with ProtectedRoute wrapping Layout
  const renderProtectedPage = (view: 'dashboard' | 'profile', node: React.ReactNode) => (
    <ProtectedRoute>
      <Layout currentView={view} onNavigate={handleNavigation} onOpenModal={handleOpenModal} onOpenMyProfile={handleOpenMyProfile}>
        {node}
      </Layout>
    </ProtectedRoute>
  );

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 dark:border-blue-400 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading HR Studio 360...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Switch>
        {/* Password reset route - accessible without authentication */}
        <Route path="/reset-password">
          <ResetPasswordPage />
        </Route>

        {/* MFA verification route - accessible without full authentication */}
        <Route path="/mfa-verify">
          <MFAVerificationPage />
        </Route>

        {/* MFA recovery routes - accessible without authentication */}
        <Route path="/mfa-recovery-request">
          <MFARecoveryRequestPage />
        </Route>

        <Route path="/mfa-recover">
          <MFARecoveryVerifyPage />
        </Route>

        {/* Public Careers page - accessible without authentication */}
        <Route path="/careers">
          <CareersPage />
        </Route>

        {/* Dashboard route - protected */}
        <Route path="/dashboard">
          {renderProtectedPage('dashboard', <Dashboard ref={dashboardRef} />)}
        </Route>

        {/* Profile route - protected */}
        <Route path="/profile">
          {renderProtectedPage('dashboard', <UserProfile onNavigate={handleNavigation} />)}
        </Route>

        {/* Onboarding route - protected */}
        <Route path="/onboarding">
          {renderProtectedPage('dashboard', <OnboardingPage />)}
        </Route>

        {/* Studio AI Chat route - protected */}
        <Route path="/ai-assistant">
          {renderProtectedPage('dashboard', <StudioAIPage context="recruitment" />)}
        </Route>

        {/* Inbox route - protected */}
        <Route path="/inbox">
          {renderProtectedPage('dashboard', <InboxPage />)}
        </Route>

        {/* TIER 1 Full-Screen Pages - protected */}
        <Route path="/chat">
          {renderProtectedPage('dashboard', <ChatPage />)}
        </Route>

        <Route path="/benefits">
          {renderProtectedPage('dashboard', <BenefitsPage />)}
        </Route>

        <Route path="/leave">
          {renderProtectedPage('dashboard', <LeavePage />)}
        </Route>

        <Route path="/performance">
          {renderProtectedPage('dashboard', <PerformancePage />)}
        </Route>

        <Route path="/employees">
          {renderProtectedPage('dashboard', <EmployeesPage />)}
        </Route>

        <Route path="/time-tracking">
          {renderProtectedPage('dashboard', <TimeTrackingPage />)}
        </Route>

        <Route path="/announcements">
          {renderProtectedPage('dashboard', <AnnouncementsPage />)}
        </Route>

        <Route path="/settings">
          {renderProtectedPage('dashboard', <SettingsPage />)}
        </Route>

        <Route path="/hiring">
          {renderProtectedPage('dashboard', <HiringPage />)}
        </Route>

        <Route path="/training">
          {renderProtectedPage('dashboard', <TrainingPage />)}
        </Route>

        <Route path="/compliance">
          {renderProtectedPage('dashboard', <CompliancePage />)}
        </Route>

        <Route path="/hr-support">
          {renderProtectedPage('dashboard', <HRSupportPage />)}
        </Route>

        {/* Landing page - default route */}
        <Route path="/">
          <Layout currentView="landing" onNavigate={handleNavigation} onOpenModal={handleOpenModal} onOpenMyProfile={handleOpenMyProfile}>
            <Hero />
            <Problems />
            <Features />
            <Advantages />
            <Contact />
            <Footer />
          </Layout>
        </Route>
      </Switch>

      {celebration && user && celebration.type === 'birthday' && (
        <BirthdayCelebrationModal
          celebration={celebration}
          employeeName={user.name}
          onClose={dismissCelebration}
        />
      )}

      {celebration && user && celebration.type === 'anniversary' && (
        <AnniversaryCelebrationModal
          celebration={celebration}
          employeeName={user.name}
          onClose={dismissCelebration}
        />
      )}
    </>
  );
}

export default App;
