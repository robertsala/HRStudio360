import React from 'react';
import { Users, Menu, X, LogOut, ChevronDown, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import SignInModal from './SignInModal';
import EmployeeDirectoryModal from './modals/EmployeeDirectoryModal';
import ImpersonationBanner from './ImpersonationBanner';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import ChangeLogNotificationBadge from './ChangeLogNotificationBadge';

interface HeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onNavigate?: (view: 'landing' | 'dashboard' | 'profile') => void;
  onOpenSystemSettings?: (tab?: string) => void;
}

const Header: React.FC<HeaderProps> = ({ mobileMenuOpen, setMobileMenuOpen, onNavigate, onOpenSystemSettings }) => {
  const { t } = useTranslation();
  const { user, isAuthenticated, signIn, signOut } = useAuth();
  const [showSignInModal, setShowSignInModal] = React.useState(false);
  const [showEmployeeDirectory, setShowEmployeeDirectory] = React.useState(false);
  const [showProductsDropdown, setShowProductsDropdown] = React.useState(false);

  const handleSignIn = async (email: string, password: string) => {
    try {
      const mfaRequired = await signIn(email, password);
      setShowSignInModal(false);
      
      // Only navigate to dashboard if MFA is not required
      // If MFA is required, signIn() already redirected to /mfa-verify
      if (!mfaRequired) {
        setTimeout(() => {
          if (onNavigate) {
            onNavigate('dashboard');
          }
        }, 100);
      }
    } catch (error) {
      // Error will be displayed in SignInModal
      throw error;
    }
  };

  const handleSignOut = async () => {
    console.log('=== SIGN OUT BUTTON CLICKED ===');
    try {
      await signOut();
      console.log('=== SIGN OUT SUCCESSFUL ===');
      // Navigation to landing will happen automatically via App.tsx useEffect
    } catch (error) {
      console.error('=== SIGN OUT ERROR ===', error);
      // Even on error, the fallback in signOut will clear state
    }
  };

  return (
    <>
      <ImpersonationBanner />
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <button 
              onClick={() => onNavigate?.('landing')}
              className="flex items-center hover:opacity-80 transition-all duration-200 min-h-[44px] touch-action-manipulation group"
            >
              <div className="bg-gradient-to-br from-blue-600 to-emerald-600 p-2 rounded-xl group-hover:scale-105 transition-transform duration-200">
                <Users className="h-8 w-8 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                HRStudio360
              </span>
            </button>
            
            <nav className="hidden lg:flex items-center space-x-1">
              <div className="relative">
                <button
                  onClick={() => setShowProductsDropdown(!showProductsDropdown)}
                  className="flex items-center px-4 py-2 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium"
                >
                  {t('header.products')}
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${showProductsDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showProductsDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 py-2 z-50">
                    <a href="#features" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <div className="font-medium">{t('header.hrManagement')}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{t('header.hrManagementDesc')}</div>
                    </a>
                    <a href="#features" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <div className="font-medium">{t('header.payrollProcessing')}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t('header.payrollProcessingDesc')}</div>
                    </a>
                    <a href="#features" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <div className="font-medium">{t('header.benefitsAdmin')}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t('header.benefitsAdminDesc')}</div>
                    </a>
                    <a href="#features" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <div className="font-medium">{t('header.aiAnalytics')}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t('header.aiAnalyticsDesc')}</div>
                    </a>
                  </div>
                )}
              </div>
              
              <a href="#solutions" className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium">
                {t('header.solutions')}
              </a>
              <a href="#advantages" className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium">
                {t('header.whyUs')}
              </a>

              <button
                onClick={() => setShowEmployeeDirectory(true)}
                className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium"
              >
                {t('header.directory')}
              </button>

              <a href="#contact" className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium">
                {t('header.contact')}
              </a>

            </nav>

            <div className="hidden lg:flex items-center space-x-3">
              <ThemeToggle />
              <LanguageSelector />

              {isAuthenticated ? (
                <>
                  <ChangeLogNotificationBadge onClick={() => onOpenSystemSettings?.('changelog')} />
                  <button
                    className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Notifications"
                  >
                    <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => onNavigate?.('profile')}
                    className="px-3 py-2 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium"
                    type="button"
                  >
                    {t('common.profile')}
                  </button>
                  <button
                    onClick={() => onNavigate?.('dashboard')}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                    type="button"
                  >
                    {t('common.dashboard')}
                  </button>
                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{user?.name}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 font-medium border border-red-200 pointer-events-auto cursor-pointer z-50 relative"
                    title="Sign Out"
                    type="button"
                    data-testid="sign-out-button"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium"
                >
                  {t('common.signIn')}
                </button>
              )}
              <button 
                onClick={() => {
                  // Scroll to contact section
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 min-h-[44px] touch-action-manipulation"
              >
                {t('common.requestDemo')}
              </button>
            </div>
            
            <button 
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ minHeight: '44px', minWidth: '44px', touchAction: 'manipulation' }}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>
      
      {showProductsDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProductsDropdown(false)}
        />
      )}

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
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {isAuthenticated && (
                    <div className="pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg">
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
                    {t('header.products')}
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
                  <button
                    onClick={() => {
                      setShowEmployeeDirectory(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors font-medium"
                  >
                    {t('header.directory')}
                  </button>
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
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium border border-red-200"
                      type="button"
                      data-testid="mobile-sign-out-button"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
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

      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSignIn={handleSignIn}
      />

      <EmployeeDirectoryModal
        isOpen={showEmployeeDirectory}
        onClose={() => setShowEmployeeDirectory(false)}
      />
    </>
  );
};

export default Header;