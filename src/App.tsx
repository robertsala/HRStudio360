import { useState, useRef } from 'react';
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

        {/* Public Careers page - accessible without authentication */}
        <Route path="/careers">
          <CareersPage />
        </Route>

        {/* Dashboard route - protected */}
        <Route path="/dashboard">
          <Layout currentView="dashboard" onNavigate={handleNavigation} onOpenModal={handleOpenModal} onOpenMyProfile={handleOpenMyProfile}>
            <ProtectedRoute>
              <Dashboard ref={dashboardRef} />
            </ProtectedRoute>
          </Layout>
        </Route>

        {/* Profile route - protected */}
        <Route path="/profile">
          <Layout currentView="profile" onNavigate={handleNavigation} onOpenModal={handleOpenModal} onOpenMyProfile={handleOpenMyProfile}>
            <ProtectedRoute>
              <UserProfile onNavigate={handleNavigation} />
            </ProtectedRoute>
          </Layout>
        </Route>

        {/* Onboarding route - protected */}
        <Route path="/onboarding">
          <Layout currentView="dashboard" onNavigate={handleNavigation} onOpenModal={handleOpenModal} onOpenMyProfile={handleOpenMyProfile}>
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          </Layout>
        </Route>

        {/* Studio AI Chat route - protected */}
        <Route path="/ai-assistant">
          <Layout currentView="dashboard" onNavigate={handleNavigation} onOpenModal={handleOpenModal} onOpenMyProfile={handleOpenMyProfile}>
            <ProtectedRoute>
              <StudioAIPage context="recruitment" />
            </ProtectedRoute>
          </Layout>
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
