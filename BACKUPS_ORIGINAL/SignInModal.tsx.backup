import React, { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabaseClient';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
}

const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose, onSignIn }) => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setError('');
    setIsSignUp(false);
  };

  const handleDemoSignIn = async () => {
    setIsLoading(true);
    setError('');

    const demoEmail = 'demohrstudio360@gmail.com';
    const demoPassword = 'DemoPassword123!';

    // Capture the current language preference BEFORE sign-in
    const selectedLanguage = i18n.language;
    console.log('User selected language before sign-in:', selectedLanguage);

    try {
      console.log('Attempting demo account sign in with:', demoEmail);

      // Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword
      });

      if (signInError) {
        console.log('Demo sign in failed:', signInError.message);

        // If it's an invalid credentials error, try to create the account
        if (signInError.message.includes('Invalid') || signInError.message.includes('credentials')) {
          console.log('Attempting to create demo account...');

          // Create demo account with language preference
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: demoEmail,
            password: demoPassword,
            options: {
              data: {
                first_name: 'Demo',
                last_name: 'User'
              }
            }
          });

          if (signUpError) {
            console.error('Demo account creation error:', signUpError);
            throw new Error(`Failed to create demo account: ${signUpError.message}`);
          }

          if (!signUpData.user) {
            throw new Error('No user data returned from signup');
          }

          console.log('Demo account created:', signUpData.user.id);

          // Manually confirm the email in the database
          try {
            const confirmResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://auuqmldhxjhnmqhgeeav.supabase.co'}/rest/v1/rpc/confirm_demo_user`, {
              method: 'POST',
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dXFtbGRoeGpobm1xaGdlZWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDY0ODUsImV4cCI6MjA3NDkyMjQ4NX0.bqK3up9bAW2Q1N8l29Xqnx6nqg5HDT5ZusyEYihNO1Q',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ user_id: signUpData.user.id })
            });
            console.log('Email confirmation attempted');
          } catch (e) {
            console.log('Could not auto-confirm email, user may need to confirm manually');
          }

          // Wait for session to establish
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Create profile with language preference
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: signUpData.user.id,
              email: demoEmail,
              first_name: 'Demo',
              last_name: 'User',
              role: 'admin',
              preferred_language: selectedLanguage
            }, {
              onConflict: 'id'
            });

          if (profileError) {
            console.error('Profile error:', profileError);
          }

          console.log('Demo account ready!');
          resetForm();
          onClose();
        } else {
          throw signInError;
        }
      } else if (signInData.user) {
        console.log('Demo sign in successful!');

        // Update the profile with the selected language preference
        console.log('Updating demo account language preference to:', selectedLanguage);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ preferred_language: selectedLanguage })
          .eq('id', signInData.user.id);

        if (updateError) {
          console.error('Error updating language preference:', updateError);
        } else {
          console.log('Language preference updated successfully');
        }

        resetForm();
        onClose();
      }
    } catch (error: any) {
      console.error('Demo account error:', error);
      setError(`Demo account unavailable: ${error.message}. Please create your own account.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Capture the current language preference BEFORE sign-in
    const selectedLanguage = i18n.language;
    console.log('User selected language before sign-in:', selectedLanguage);

    try {
      if (isSignUp) {
        // Sign up new user
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Create profile with language preference
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              first_name: firstName,
              last_name: lastName,
              preferred_language: selectedLanguage
            });

          if (profileError) throw profileError;

          // Now sign in
          await onSignIn(email, password);
          resetForm();
          onClose();
        }
      } else {
        // Sign in existing user
        await onSignIn(email, password);

        // After successful sign-in, update the language preference in the database
        console.log('Updating language preference for existing user to:', selectedLanguage);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ preferred_language: selectedLanguage })
            .eq('id', user.id);

          if (updateError) {
            console.error('Error updating language preference:', updateError);
          } else {
            console.log('Language preference updated successfully');
          }
        }

        resetForm();
        onClose();
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
      style={{ touchAction: 'none' }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 relative modal-content">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isSignUp ? t('auth.createAccount') : t('auth.signIn')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isSignUp ? t('auth.joinToday') : t('auth.welcomeBack')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.firstName')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('auth.firstNamePlaceholder')}
                    required={isSignUp}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.lastName')}
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('auth.lastNamePlaceholder')}
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.emailAddress')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('auth.emailPlaceholder')}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('auth.enterPassword')}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {isSignUp && (
              <p className="text-xs text-gray-500 mt-1">{t('auth.passwordMinLength')}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold min-h-[48px] touch-action-manipulation"
          >
            {isLoading ? (isSignUp ? t('auth.creatingAccount') : t('auth.signingIn')) : (isSignUp ? t('auth.createAccount') : t('auth.signIn'))}
          </button>
        </form>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">{t('auth.or')}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Demo button clicked!');
              handleDemoSignIn();
            }}
            disabled={isLoading}
            className="w-full mt-4 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold min-h-[48px] touch-action-manipulation"
          >
            {isLoading ? t('auth.signingIn') : t('auth.tryDemoAccount')}
          </button>

          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">{t('auth.demoCredentials')}</p>
            <p className="text-xs text-gray-700 dark:text-gray-300">Email: demohrstudio360@gmail.com</p>
            <p className="text-xs text-gray-700 dark:text-gray-300">Password: DemoPassword123!</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignInModal;
