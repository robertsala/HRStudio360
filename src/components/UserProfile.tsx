import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Save, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { useTranslation } from 'react-i18next';

interface UserProfileProps {
  onNavigate?: (view: 'landing' | 'dashboard' | 'profile') => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user, signOut, updateProfilePicture } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    department: '',
    role: '',
    startDate: ''
  });

  // Load profile data from database
  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile) {
        setFormData({
          name: profile.full_name || user.name || '',
          email: profile.email || user.email || '',
          phone: profile.phone || '',
          location: profile.location || '',
          department: profile.department || '',
          role: profile.role || '',
          startDate: profile.start_date || ''
        });
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(t('errors.failedToLoadProfile'));
    } finally {
      setLoading(false);
    }
  };

  // Mock profile picture options (in real app, this would be file upload)
  const mockProfilePictures = [
    'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  ];

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.name,
          phone: formData.phone,
          location: formData.location,
          department: formData.department,
          role: formData.role,
          start_date: formData.startDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(t('errors.failedToSaveProfile'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    loadProfileData();
    setIsEditing(false);
    setError(null);
  };

  const handleProfilePictureSelect = (pictureUrl: string) => {
    updateProfilePicture(pictureUrl);
    setShowImageUpload(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation to landing will happen automatically via App.tsx useEffect
    } catch (error) {
      console.error('Sign out error:', error);
      // Even on error, the fallback in signOut will clear state
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => onNavigate?.('landing')}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <User className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">HRStudio360</span>
            </button>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate?.('dashboard')}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors"
              >
                Back to Dashboard
              </button>
              <button 
                onClick={handleSignOut}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-800">Profile updated successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <X className="h-5 w-5 text-red-600 mr-3" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={formData.name}
                      className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-blue-600 text-xl font-bold">
                        {getInitials(formData.name)}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setShowImageUpload(true)}
                    className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-2 hover:bg-blue-600 transition-colors shadow-lg"
                  >
                    <User className="h-4 w-4 text-white" />
                  </button>
                </div>
                <div className="ml-4 text-white">
                  <h1 className="text-2xl font-bold">{formData.name}</h1>
                  <p className="text-blue-100">{formData.role} • {formData.department}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-white dark:bg-gray-800 text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white dark:bg-gray-800/30 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-white dark:bg-gray-800 text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors flex items-center"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Picture Upload Modal */}
          {showImageUpload && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Choose Profile Picture</h3>
                  <button
                    onClick={() => setShowImageUpload(false)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Select a profile picture from the options below:</p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {mockProfilePictures.map((pictureUrl, index) => (
                      <button
                        key={index}
                        onClick={() => handleProfilePictureSelect(pictureUrl)}
                        className="relative group"
                      >
                        <img
                          src={pictureUrl}
                          alt={`Profile option ${index + 1}`}
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 group-hover:border-blue-500 transition-colors"
                        />
                        <div className="absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all"></div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <button
                      onClick={() => {
                        updateProfilePicture('');
                        setShowImageUpload(false);
                      }}
                      className="w-full text-center py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                    >
                      Remove current picture (use initials)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Content */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white">{formData.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white">{formData.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white">{formData.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white">{formData.location}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Work Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                    {isEditing ? (
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Human Resources">Human Resources</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="Finance">Finance</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 dark:text-white">{formData.department}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{formData.role}</p>
                    )}
                  </div>

                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white">{new Date(formData.startDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <span className="text-gray-900 dark:text-white">Profile updated</span>
                  <span className="text-sm text-gray-500">Today</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <span className="text-gray-900 dark:text-white">Completed performance review</span>
                  <span className="text-sm text-gray-500">2 days ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <span className="text-gray-900 dark:text-white">Updated benefits enrollment</span>
                  <span className="text-sm text-gray-500">1 week ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;