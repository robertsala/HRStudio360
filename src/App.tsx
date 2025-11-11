import React, { useState, useEffect, useRef } from 'react';
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
import { useAuth } from './contexts/AuthContext';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'profile' | 'reset-password'>('landing');
  const { isAuthenticated, isLoading, celebration, dismissCelebration, user } = useAuth();
  const dashboardRef = useRef<any>(null);

  // Check if we're on the reset-password page
  useEffect(() => {
    const checkResetPasswordPath = () => {
      if (window.location.pathname === '/reset-password') {
        console.log('[App.tsx] Detected reset-password path, setting view');
        setCurrentView('reset-password');
      }
    };
    
    checkResetPasswordPath();
    
    // Also listen for URL changes
    window.addEventListener('popstate', checkResetPasswordPath);
    return () => window.removeEventListener('popstate', checkResetPasswordPath);
  }, []);

  // --- REFINED AUTHENTICATION REDIRECT LOGIC ---
  useEffect(() => {
    // Don't redirect if we're on the reset-password page
    if (window.location.pathname === '/reset-password') {
      return;
    }

    if (isAuthenticated) {
      // If the user is authenticated and on landing, redirect to dashboard
      if (currentView === 'landing') {
        setCurrentView('dashboard');
      }
    } else {
      // If the user is NOT authenticated, show landing (unless on reset-password)
      if (currentView !== 'landing' && currentView !== 'reset-password') {
        setCurrentView('landing');
      }
    }
  }, [isAuthenticated, currentView]); // Include currentView to properly handle all cases

  // Handle navigation (this part is good)
  const handleNavigation = (view: 'landing' | 'dashboard' | 'profile' | 'reset-password') => {
    if (!isAuthenticated && view !== 'landing' && view !== 'reset-password') {
      // Don't allow navigation to protected views when not authenticated
      return;
    }
    setCurrentView(view);
  };

  // Handle opening modals from sidebar (this part is good)
  const handleOpenModal = (modalName: string) => {
    console.log('[App.tsx] handleOpenModal called with:', modalName);
    console.log('[App.tsx] dashboardRef.current:', dashboardRef.current);
    if (dashboardRef.current && dashboardRef.current.openModal) {
      console.log('[App.tsx] Calling dashboardRef.current.openModal');
      dashboardRef.current.openModal(modalName);
    } else {
      console.error('[App.tsx] dashboardRef.current or openModal not available');
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

  // Handle reset-password page
  if (currentView === 'reset-password') {
    return <ResetPasswordPage />;
  }

  // Render logic based on currentView (this part is good)
  if (currentView === 'dashboard') {
    return (
      <Layout currentView={currentView} onNavigate={handleNavigation} onOpenModal={handleOpenModal}>
        <ProtectedRoute>
          <Dashboard ref={dashboardRef} />
        </ProtectedRoute>
      </Layout>
    );
  }

  if (currentView === 'profile') {
    return (
      <Layout currentView={currentView} onNavigate={handleNavigation} onOpenModal={handleOpenModal}>
        <ProtectedRoute>
          <UserProfile onNavigate={handleNavigation} />
        </ProtectedRoute>
      </Layout>
    );
  }

  return (
    <>
      <Layout currentView={currentView} onNavigate={handleNavigation} onOpenModal={handleOpenModal}>
        <Hero />
        <Problems />
        <Features />
        <Advantages />
        {/* Calendar component was imported but not used, uncomment if needed */}
        {/* <Calendar /> */}
        <Contact />
        <Footer />
      </Layout>

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