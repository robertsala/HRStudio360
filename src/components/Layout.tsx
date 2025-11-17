import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Users, Search, Bell, User, LogOut, Menu, X, Home, Calendar, BarChart3, Settings, FileText, UserPlus, DollarSign, Heart, Shield, Smartphone, GraduationCap, Clock, Inbox, UserX, Star, Sparkles, Timer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SignInModal from './SignInModal';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import ChangeLogNotificationBadge from './ChangeLogNotificationBadge';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
  currentView?: 'landing' | 'dashboard' | 'profile';
  onNavigate?: (view: 'landing' | 'dashboard' | 'profile') => void;
  onOpenModal?: (modalName: string) => void;
  onOpenMyProfile?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView = 'landing', onNavigate, onOpenModal, onOpenMyProfile }) => {
  const { t } = useTranslation();
  const { user, isAuthenticated, signIn, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('dashboard');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock data for AI search
  const searchableData = {
    employees: [
      { id: '1', name: 'Sarah Johnson', department: 'Engineering', role: 'Senior Software Engineer', location: 'San Francisco, CA' },
      { id: '2', name: 'Mike Chen', department: 'Engineering', role: 'Engineering Manager', location: 'Austin, TX' },
      { id: '3', name: 'Lisa Rodriguez', department: 'Sales', role: 'Sales Director', location: 'New York, NY' },
      { id: '4', name: 'David Kim', department: 'Engineering', role: 'Frontend Developer', location: 'Seattle, WA' },
      { id: '5', name: 'Emma Wilson', department: 'Human Resources', role: 'HR Specialist', location: 'Boston, MA' },
      { id: '6', name: 'Alex Thompson', department: 'Marketing', role: 'Marketing Manager', location: 'Denver, CO' },
      { id: '7', name: 'John Smith', department: 'Finance', role: 'Financial Analyst', location: 'Chicago, IL' },
      { id: '8', name: 'Maria Garcia', department: 'Operations', role: 'Operations Manager', location: 'Phoenix, AZ' }
    ],
    departments: [
      { name: 'Engineering', count: 89, manager: 'Mike Chen' },
      { name: 'Sales', count: 45, manager: 'Lisa Rodriguez' },
      { name: 'Marketing', count: 32, manager: 'Alex Thompson' },
      { name: 'Human Resources', count: 12, manager: 'Emma Wilson' },
      { name: 'Finance', count: 18, manager: 'John Smith' },
      { name: 'Operations', count: 51, manager: 'Maria Garcia' }
    ],
    features: [
      { name: 'Employee Directory', description: 'Browse and search all employees', action: 'employees' },
      { name: 'Payroll Management', description: 'Process payroll and view reports', action: 'payroll' },
      { name: 'Performance Reviews', description: 'Conduct and manage performance evaluations', action: 'performanceReview' },
      { name: 'Leave Management', description: 'Request and approve time off', action: 'leaveManagement' },
      { name: 'Benefits Administration', description: 'Manage employee benefits and enrollment', action: 'benefitsPay' },
      { name: 'Training Programs', description: 'Access learning and development resources', action: 'training' },
      { name: 'HR Analytics', description: 'View workforce insights and reports', action: 'analytics' },
      { name: 'Calendar Events', description: 'Company events and important dates', action: 'events' }
    ]
  };

  const performAISearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const results: any[] = [];
    const searchTerm = query.toLowerCase();

    // Search employees
    searchableData.employees.forEach(employee => {
      if (
        employee.name.toLowerCase().includes(searchTerm) ||
        employee.department.toLowerCase().includes(searchTerm) ||
        employee.role.toLowerCase().includes(searchTerm) ||
        employee.location.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          type: 'employee',
          title: employee.name,
          description: `${employee.role} in ${employee.department} • ${employee.location}`,
          category: employee.department,
          action: 'employees',
          data: employee
        });
      }
    });

    // Search departments
    searchableData.departments.forEach(dept => {
      if (dept.name.toLowerCase().includes(searchTerm) || dept.manager.toLowerCase().includes(searchTerm)) {
        results.push({
          type: 'department',
          title: dept.name,
          description: `${dept.count} employees • Manager: ${dept.manager}`,
          category: t('search.organization'),
          action: 'employees',
          data: dept
        });
      }
    });

    // Search features/modules
    searchableData.features.forEach(feature => {
      if (
        feature.name.toLowerCase().includes(searchTerm) ||
        feature.description.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          type: 'feature',
          title: feature.name,
          description: feature.description,
          category: t('search.hrModule'),
          action: feature.action,
          data: feature
        });
      }
    });

    // Smart suggestions based on common queries
    if (searchTerm.includes('pay') || searchTerm.includes('salary') || searchTerm.includes('money')) {
      results.unshift({
        type: 'feature',
        title: t('search.payrollCompensation'),
        description: t('search.payrollCompensationDesc'),
        category: t('search.quickAccess'),
        action: 'benefitsPay'
      });
    }

    if (searchTerm.includes('time off') || searchTerm.includes('vacation') || searchTerm.includes('pto')) {
      results.unshift({
        type: 'feature',
        title: t('search.timeOffManagement'),
        description: t('search.timeOffManagementDesc'),
        category: t('search.quickAccess'),
        action: 'leaveManagement'
      });
    }

    if (searchTerm.includes('review') || searchTerm.includes('performance')) {
      results.unshift({
        type: 'feature',
        title: t('search.performanceReviews'),
        description: t('search.performanceReviewsDesc'),
        category: t('search.quickAccess'),
        action: 'performanceReview'
      });
    }

    setSearchResults(results.slice(0, 8)); // Limit to 8 results
    setShowSearchResults(results.length > 0);
  };

  const handleGlobalSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleSearchResultClick(searchResults[0]);
    }
  };

  const handleSearchResultClick = (result: any) => {
    console.log('Search result clicked:', result);
    setShowSearchResults(false);
    setGlobalSearchTerm('');
    
    if (result.action && onOpenModal) {
      onOpenModal(result.action);
    }
  };

  const clearGlobalSearch = () => {
    setGlobalSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Perform search when term changes
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      performAISearch(globalSearchTerm);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [globalSearchTerm]);

  // Close search results when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowSearchResults(false);
    };

    if (showSearchResults) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showSearchResults]);

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      setShowSignInModal(false);
      
      // Navigate to dashboard after successful sign-in using direct routing
      console.log('[Layout] Navigating to dashboard after successful sign-in');
      setLocation('/dashboard');
    } catch (error) {
      // Error will be displayed in SignInModal
      throw error;
    }
  };

  const handleSignOut = async () => {
    await signOut();
    if (onNavigate) {
      onNavigate('landing');
    }
  };

  // Navigation items for authenticated users
  const navigationItems = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: Home, action: () => {
        setActiveSidebarItem('dashboard');
        if (onOpenModal) {
          onOpenModal('dashboard');
        }
      }
    },
    { id: 'profile', label: t('sidebar.myProfile'), icon: User, action: () => {
        setActiveSidebarItem('profile');
        // Try to open comprehensive modal if on dashboard, otherwise route to profile page
        if (onOpenMyProfile) {
          onOpenMyProfile();
        } else {
          setLocation('/profile');
        }
      }
    },
    { id: 'employees', label: t('sidebar.directory'), icon: Users, action: () => onOpenModal?.('employees') },
    { id: 'recruitment', label: t('sidebar.recruitment'), icon: UserPlus, action: () => onOpenModal?.('hiring') },
    { id: 'onboarding', label: t('sidebar.onboarding'), icon: GraduationCap, action: () => onOpenModal?.('onboarding') },
    { id: 'performance', label: t('sidebar.performance'), icon: BarChart3, action: () => onOpenModal?.('performanceReview') },
    { id: 'time', label: t('sidebar.timeLeave'), icon: Clock, action: () => onOpenModal?.('leaveManagement') },
    { id: 'timeTracking', label: t('sidebar.clockSchedule'), icon: Timer, action: () => onOpenModal?.('timeAttendance') },
    { id: 'payroll', label: t('sidebar.payroll'), icon: DollarSign, action: () => onOpenModal?.('payroll') },
    { id: 'benefits', label: t('sidebar.benefits'), icon: Heart, action: () => onOpenModal?.('benefitsPay') },
    { id: 'calendar', label: t('sidebar.calendar'), icon: Calendar, action: () => onOpenModal?.('events') },
    { id: 'reports', label: t('sidebar.reports'), icon: FileText, action: () => onOpenModal?.('reports') },
    { id: 'training', label: t('sidebar.training'), icon: GraduationCap, action: () => onOpenModal?.('training') },
    { id: 'offboarding', label: t('sidebar.offboarding'), icon: UserX, action: () => onOpenModal?.('offboarding') },
    { id: 'settings', label: t('sidebar.settings'), icon: Settings, action: () => onOpenModal?.('systemSettings') }
  ];

  // Show landing page layout for non-authenticated users or landing view
  if (!isAuthenticated || currentView === 'landing') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Landing Page Header */}
        <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <button 
                onClick={() => onNavigate?.('landing')}
                className="flex items-center hover:opacity-80 transition-all duration-200 min-h-[44px] touch-manipulation group"
              >
                <div className="bg-gradient-to-br from-blue-600 to-emerald-600 p-2 rounded-xl group-hover:scale-105 transition-transform duration-200">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  HRStudio360
                </span>
              </button>
              
              <nav className="hidden lg:flex items-center space-x-1">
                <a href="#features" className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium">
                  {t('header.features')}
                </a>
                <a href="#solutions" className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium">
                  {t('header.solutions')}
                </a>
                <a href="#advantages" className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium">
                  {t('header.whyUs')}
                </a>
                <a href="#contact" className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium">
                  {t('header.contact')}
                </a>
              </nav>
              
              <div className="hidden lg:flex items-center space-x-3">
                <ThemeToggle />
                <LanguageSelector />

                {isAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{t('header.welcomeUser', { name: user?.name })}</span>
                    </div>
                    <button
                      onClick={() => onNavigate?.('profile')}
                      className="px-3 py-3 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium min-h-[44px] touch-manipulation"
                    >
                      {t('common.profile')}
                    </button>
                    <button
                      onClick={() => onNavigate?.('dashboard')}
                      className="px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 min-h-[44px] touch-manipulation"
                    >
                      {t('common.dashboard')}
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center px-3 py-3 text-gray-800 dark:text-gray-200 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 font-medium min-h-[44px] touch-manipulation"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      {t('common.signOut')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSignInModal(true)}
                    className="px-4 py-3 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium min-h-[44px] touch-manipulation"
                  >
                    {t('common.signIn')}
                  </button>
                )}
                <button
                  onClick={() => {
                    // Scroll to contact section
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 min-h-[44px] touch-manipulation"
                >
                  {t('common.requestDemo')}
                </button>
              </div>

              <button
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div
              className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-br from-blue-600 to-emerald-600 p-2 rounded-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <span className="ml-2 text-lg font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                      HRStudio360
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {isAuthenticated && (
                      <div className="pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 rounded-lg">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {user?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <a
                      href="#features"
                      className="block px-4 py-3 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('header.features')}
                    </a>
                    <a
                      href="#solutions"
                      className="block px-4 py-3 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('header.solutions')}
                    </a>
                    <a
                      href="#advantages"
                      className="block px-4 py-3 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('header.whyUs')}
                    </a>
                    <a
                      href="#contact"
                      className="block px-4 py-3 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('header.contact')}
                    </a>

                    <div className="px-4 py-3">
                      <ThemeToggle />
                    </div>
                    <div className="px-4 py-3">
                      <LanguageSelector />
                    </div>
                  </div>
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => {
                          onNavigate?.('profile');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors font-medium text-center border border-gray-200 dark:border-gray-600"
                      >
                        {t('common.profile')}
                      </button>
                      <button
                        onClick={() => {
                          onNavigate?.('dashboard');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-md"
                      >
                        {t('common.dashboard')}
                      </button>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{t('common.signOut')}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setShowSignInModal(true);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-md"
                      >
                        {t('common.signIn')}
                      </button>
                      <button
                        onClick={() => {
                          document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md"
                      >
                        {t('common.requestDemo')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {children}

        <SignInModal 
          isOpen={showSignInModal}
          onClose={() => setShowSignInModal(false)}
          onSignIn={handleSignIn}
        />
      </div>
    );
  }

  // Dashboard layout for authenticated users
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar - Hidden on mobile, visible on lg screens and up */}
      <div className={`hidden lg:flex ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col transition-all duration-300 fixed h-full z-40`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-blue-600 to-emerald-600 p-2 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <span className="ml-2 text-lg font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  HRStudio360
                </span>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSidebarItem === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSidebarItem(item.id);
                  if (item.action) {
                    item.action();
                  }
                }}
                className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <Icon className={`h-5 w-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                } transition-all duration-300 group-hover:scale-125 group-hover:rotate-3`} />
                {!sidebarCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

      </div>

      {/* Main Content Area - No margin on mobile, margin on lg screens */}
      <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'} transition-all duration-300`}>
        {/* Top Header with AI Search */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Mobile Menu Button - Only visible on mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all touch-manipulation"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* AI-Powered Global Search */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-1 mr-2 animate-pulse">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">AI</span>
                </div>
                <input
                  type="text"
                  placeholder={t('search.aiSearchPlaceholder')}
                  value={globalSearchTerm}
                  onChange={(e) => setGlobalSearchTerm(e.target.value)}
                  onKeyPress={handleGlobalSearchKeyPress}
                  className="w-full pl-12 sm:pl-16 pr-10 sm:pr-12 py-2 sm:py-3 text-sm sm:text-base border-2 border-purple-100 dark:border-purple-800 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 dark:focus:border-purple-600 bg-purple-50/50 dark:bg-purple-900/20 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white transition-all duration-200 touch-manipulation"
                  onClick={(e) => e.stopPropagation()}
                />
                {globalSearchTerm && (
                  <button
                    onClick={clearGlobalSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                
                {/* AI Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full p-1 mr-2">
                          <Search className="h-3 w-3 text-white" />
                        </div>
                        <span className="font-medium">{t('search.aiSearchResults')}</span>
                        <span className="ml-2">({t('search.resultsFound', { count: searchResults.length })})</span>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearchResultClick(result)}
                          className="w-full text-left p-4 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              result.type === 'employee' ? 'bg-blue-100' :
                              result.type === 'department' ? 'bg-green-100' :
                              result.type === 'feature' ? 'bg-purple-100' :
                              'bg-gray-100'
                            }`}>
                              {result.type === 'employee' ? <User className="h-4 w-4 text-blue-600" /> :
                               result.type === 'department' ? <Users className="h-4 w-4 text-green-600" /> :
                               result.type === 'feature' ? <Settings className="h-4 w-4 text-purple-600" /> :
                               <FileText className="h-4 w-4 text-gray-600" />}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">{result.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{result.description}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  result.type === 'employee' ? 'bg-blue-100 text-blue-800' :
                                  result.type === 'department' ? 'bg-green-100 text-green-800' :
                                  result.type === 'feature' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {t(`search.${result.type}`)}
                                </span>
                                {result.category && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">• {result.category}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
              {/* Theme Toggle - Hidden on very small screens */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* Language Selector - Hidden on very small screens */}
              <div className="hidden sm:block">
                <LanguageSelector />
              </div>

              {/* Change Log Notifications - Hidden on very small screens */}
              <div className="hidden md:block">
                <ChangeLogNotificationBadge onClick={() => {
                  if (onOpenModal) {
                    onOpenModal('systemSettings:changelog');
                  }
                }} />
              </div>

              {/* Notifications */}
              <button
                onClick={() => onOpenModal?.('notifications')}
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 touch-manipulation"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  3
                </span>
              </button>

              {/* Inbox - Hidden on very small screens */}
              <button
                onClick={() => {
                  console.log('[Layout.tsx] Inbox button clicked');
                  console.log('[Layout.tsx] onOpenModal exists?', !!onOpenModal);
                  onOpenModal?.('inbox');
                }}
                className="hidden sm:flex relative p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 touch-manipulation"
                title="HR Inbox"
              >
                <Inbox className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  5
                </span>
              </button>

              {/* User Profile */}
              <button
                onClick={() => onNavigate?.('profile')}
                className="flex items-center space-x-2 sm:space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl p-1 sm:p-2 transition-all duration-200 touch-manipulation"
              >
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white text-sm font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Product Owner</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;