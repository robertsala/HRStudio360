import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Save, X, CheckCircle, Lock, Eye, EyeOff, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    department: '',
    role: '',
    startDate: '',
    manager: ''
  });

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
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

      const profile = await apiClient.getProfile(user.id);

      if (profile) {
        // Combine firstName and lastName for the name field
        const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
        
        // Fetch employee data to get manager info
        let managerName = '';
        try {
          const response = await fetch(`/api/employees/user/${user.id}`);
          if (response.ok) {
            const employeeData = await response.json();
            if (employeeData && employeeData.managerId) {
              // Fetch manager profile
              const managerResponse = await fetch(`/api/profiles/${employeeData.managerId}`);
              if (managerResponse.ok) {
                const managerProfile = await managerResponse.json();
                managerName = `${managerProfile.firstName || ''} ${managerProfile.lastName || ''}`.trim();
              }
            }
          }
        } catch (err) {
          console.error('Error loading manager info:', err);
        }
        
        setFormData({
          name: fullName || user.name || '',
          email: profile.email || user.email || '',
          phone: profile.phone || '',
          location: `${profile.city || ''} ${profile.state || ''}`.trim(),
          department: profile.department || '',
          role: profile.role || '',
          startDate: profile.hireDate || '',
          manager: managerName
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

      // Split name into firstName and lastName
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Split location into city and state
      const locationParts = formData.location.trim().split(' ');
      const city = locationParts[0] || '';
      const state = locationParts.slice(1).join(' ') || '';

      await fetch(`/api/profiles/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: formData.phone,
          city,
          state,
          department: formData.department,
          role: formData.role,
          hireDate: formData.startDate,
        }),
      });

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);

      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Send base64 data to backend
      const uploadResponse = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          base64Data,
        }),
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const { imageUrl } = await uploadResponse.json();

      // Update profile with new picture URL (base64 data URL)
      updateProfilePicture(imageUrl);
      setShowImageUpload(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
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

  const handlePasswordChange = async () => {
    try {
      setChangingPassword(true);
      setPasswordChangeError(null);
      setPasswordChangeSuccess(false);

      const response = await fetch('/api/auth/password/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordChangeSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => {
        setPasswordChangeSuccess(false);
        setShowPasswordChange(false);
      }, 3000);
    } catch (err: any) {
      console.error('Password change error:', err);
      setPasswordChangeError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const validatePasswordRequirements = (password: string) => {
    const hasMinLength = password.length >= 12;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    const characterClassCount = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
    
    return {
      hasMinLength,
      hasCharacterClasses: characterClassCount >= 3,
      isValid: hasMinLength && characterClassCount >= 3
    };
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
                    onClick={() => {
                      setShowImageUpload(false);
                      setUploadError(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                    data-testid="button-close-profile-picture-modal"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Upload Error Message */}
                  {uploadError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center">
                      <X className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
                      <span className="text-red-800 dark:text-red-200 text-sm">{uploadError}</span>
                    </div>
                  )}

                  {/* Upload Your Own Picture */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Upload Your Own Picture</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Maximum file size: 5 MB • Accepted formats: JPG, PNG, GIF, WebP
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                      data-testid="input-profile-picture-file"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                      data-testid="button-upload-profile-picture"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Choose File to Upload
                        </>
                      )}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">or select from below</span>
                    </div>
                  </div>
                  
                  {/* Select from Options */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Select a Picture</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {mockProfilePictures.map((pictureUrl, index) => (
                        <button
                          key={index}
                          onClick={() => handleProfilePictureSelect(pictureUrl)}
                          disabled={uploading}
                          className="relative group disabled:opacity-50"
                          data-testid={`button-select-preset-picture-${index}`}
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
                  </div>
                  
                  {/* Remove Picture Option */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        updateProfilePicture('');
                        setShowImageUpload(false);
                        setUploadError(null);
                      }}
                      disabled={uploading}
                      className="w-full text-center py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                      data-testid="button-remove-profile-picture"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manager</label>
                    <p className="text-gray-900 dark:text-white">{formData.manager || 'Not assigned'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Section - Password Change */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-gray-400" />
                  Security
                </h3>
                {!showPasswordChange && (
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                    data-testid="button-change-password"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {showPasswordChange && (
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                  {/* Password Change Success */}
                  {passwordChangeSuccess && (
                    <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                      <span className="text-green-800 dark:text-green-200">Password changed successfully!</span>
                    </div>
                  )}

                  {/* Password Change Error */}
                  {passwordChangeError && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center">
                      <X className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
                      <span className="text-red-800 dark:text-red-200">{passwordChangeError}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full p-2 pr-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          data-testid="input-current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full p-2 pr-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          data-testid="input-new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      
                      {/* Password Requirements Checklist */}
                      {passwordData.newPassword && (
                        <div className="mt-2 text-xs space-y-1">
                          <div className={`flex items-center ${validatePasswordRequirements(passwordData.newPassword).hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            At least 12 characters
                          </div>
                          <div className={`flex items-center ${validatePasswordRequirements(passwordData.newPassword).hasCharacterClasses ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            At least 3 of: uppercase, lowercase, numbers, special characters
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full p-2 pr-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          data-testid="input-confirm-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      
                      {/* Password Match Indicator */}
                      {passwordData.newPassword && passwordData.confirmPassword && (
                        <div className={`mt-1 text-xs ${passwordData.newPassword === passwordData.confirmPassword ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {passwordData.newPassword === passwordData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={handlePasswordChange}
                        disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || passwordData.newPassword !== passwordData.confirmPassword || !validatePasswordRequirements(passwordData.newPassword).isValid}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="button-save-password"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {changingPassword ? 'Changing Password...' : 'Change Password'}
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setPasswordChangeError(null);
                        }}
                        disabled={changingPassword}
                        className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="button-cancel-password"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
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