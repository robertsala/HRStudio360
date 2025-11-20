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
import MFAVerificationPage from './pages/MFAVerificationPage';
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

  // Handle opening modals from sidebar
  const handleOpenModal = (modalName: string) => {
    console.log('[App.tsx] handleOpenModal called with:', modalName);
    if (dashboardRef.current && dashboardRef.current.openModal) {
      dashboardRef.current.openModal(modalName);
    }
  };

  // Handle opening My Profile comprehensive modal
  const handleOpenMyProfile = () => {
    console.log('[App.tsx] handleOpenMyProfile called');
    if (dashboardRef.current && dashboardRef.current.openMyProfile) {
      dashboardRef.current.openMyProfile();
    } else {
      // Fallback to profile route when Dashboard is not mounted
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
          {renderProtectedPage('profile', <UserProfile onNavigate={handleNavigation} />)}
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
