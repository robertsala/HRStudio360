import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Users, Hash, User, Check, UserPlus, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPresence } from '../../hooks/useUserPresence';
import { chatService } from '../../utils/chatService';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  department?: string;
  jobTitle?: string;
  location?: string;
}

interface NewChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChannelCreated: () => void;
}

const NewChannelModal: React.FC<NewChannelModalProps> = ({ isOpen, onClose, onChannelCreated }) => {
  const { user } = useAuth();
  const [channelType, setChannelType] = useState<'direct' | 'group' | 'department'>('direct');
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    role: ''
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const { getPresenceStatus } = useUserPresence(allUsers.map(u => u.id));

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      filterUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, departmentFilter, allUsers, user]);

  useEffect(() => {
    const departments = Array.from(new Set(allUsers.map(u => u.department).filter(Boolean))) as string[];
    setAvailableDepartments(departments.sort());
  }, [allUsers]);

  const filterUsers = useCallback(() => {
    setIsSearching(true);
    let filtered = allUsers.filter(u => u.id !== user?.id);

    if (departmentFilter) {
      filtered = filtered.filter(u => u.department === departmentFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => {
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        const email = u.email.toLowerCase();
        const department = u.department?.toLowerCase() || '';
        const emailDomain = email.split('@')[1] || '';
        const emailUsername = email.split('@')[0] || '';

        return (
          fullName.includes(query) ||
          u.firstName.toLowerCase().includes(query) ||
          u.lastName.toLowerCase().includes(query) ||
          email.includes(query) ||
          emailDomain.includes(query) ||
          emailUsername.includes(query) ||
          department.includes(query)
        );
      });

      filtered.sort((a, b) => {
        const aFullName = `${a.firstName} ${a.lastName}`.toLowerCase();
        const bFullName = `${b.firstName} ${b.lastName}`.toLowerCase();
        const aEmail = a.email.toLowerCase();
        const bEmail = b.email.toLowerCase();

        const aExactMatch = aFullName === query || aEmail === query;
        const bExactMatch = bFullName === query || bEmail === query;

        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;

        const aStartsWith = aFullName.startsWith(query) || a.firstName.toLowerCase().startsWith(query);
        const bStartsWith = bFullName.startsWith(query) || b.firstName.toLowerCase().startsWith(query);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        return aFullName.localeCompare(bFullName);
      });
    }

    setFilteredUsers(filtered);
    setIsSearching(false);
  }, [searchQuery, departmentFilter, allUsers, user]);

  const loadUsers = async () => {
    try {
      console.log('Loading users for chat channel creation...');
      setIsSearching(true);
      setError(null);

      // Try with full query first
      let { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, profile_picture, department, role, job_title, status')
        .order('first_name');

      // If columns don't exist yet, fall back to basic query
      if (error && (error.message.includes('column') || error.message.includes('does not exist'))) {
        console.log('Some employee columns not yet in profiles table, using basic query');
        const basicResult = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, profile_picture')
          .order('first_name');
        data = basicResult.data;
        error = basicResult.error;
      }

      if (error) {
        console.error('Database error loading users:', error);
        throw new Error(`Failed to load users: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.warn('No user profiles found in database');
        setAllUsers([]);
        return;
      }

      // Filter to active users only (if status field exists)
      const activeUsers = data.filter((p: any) =>
        !p.status || p.status === 'active' || p.status === 'Active'
      );

      const formattedUsers: UserProfile[] = activeUsers.map((profile: any) => ({
        id: profile.id,
        firstName: profile.first_name || 'Unknown',
        lastName: profile.last_name || 'User',
        email: profile.email || '',
        profilePicture: profile.profile_picture,
        department: profile.department || 'General',
        jobTitle: profile.job_title || profile.role || 'Employee',
        location: undefined
      }));

      console.log(`Successfully loaded ${formattedUsers.length} users from profiles`);
      setAllUsers(formattedUsers);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      const errorMessage = error?.message || 'Failed to load users';
      setError(errorMessage);
      setAllUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  const resetForm = () => {
    setChannelType('direct');
    setChannelName('');
    setChannelDescription('');
    setDepartment('');
    setSearchQuery('');
    setSelectedUsers(new Set());
    setError(null);
    setDepartmentFilter('');
    setShowCreateUser(false);
    setNewUserData({ firstName: '', lastName: '', email: '', department: '', role: '' });
  };

  const handleCreateUser = async () => {
    if (!newUserData.firstName.trim() || !newUserData.lastName.trim() || !newUserData.email.trim()) {
      setError('Please fill in first name, last name, and email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    const existingUser = allUsers.find(u => u.email.toLowerCase() === newUserData.email.toLowerCase());
    if (existingUser) {
      setError('A user with this email already exists');
      return;
    }

    setIsCreatingUser(true);
    setError(null);

    try {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          first_name: newUserData.firstName.trim(),
          last_name: newUserData.lastName.trim(),
          email: newUserData.email.trim().toLowerCase(),
          department: newUserData.department.trim() || null,
          role: newUserData.role.trim() || null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await loadUsers();

      const newUser = allUsers.find(u => u.id === newProfile.id) || {
        id: newProfile.id,
        firstName: newProfile.first_name,
        lastName: newProfile.last_name,
        email: newProfile.email,
        department: newProfile.department,
        profilePicture: newProfile.profile_picture
      };

      const newSelected = new Set(selectedUsers);
      if (channelType === 'direct') {
        newSelected.clear();
      }
      newSelected.add(newProfile.id);
      setSelectedUsers(newSelected);

      setShowCreateUser(false);
      setNewUserData({ firstName: '', lastName: '', email: '', department: '', role: '' });
      setSearchQuery('');
    } catch (error: any) {
      console.error('Failed to create user:', error);
      setError(error.message || 'Failed to create user. Please try again.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleCreate = async () => {
    if (selectedUsers.size === 0) {
      setError('Please select at least one user to chat with');
      return;
    }

    if (channelType !== 'direct' && !channelName.trim()) {
      setError('Please enter a channel name');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      let finalChannelName = channelName;

      if (channelType === 'direct') {
        const selectedUser = allUsers.find(u => u.id === Array.from(selectedUsers)[0]);
        if (selectedUser) {
          finalChannelName = `${selectedUser.firstName} ${selectedUser.lastName}`;
        }
      }

      await chatService.createChannel(
        finalChannelName || 'New Channel',
        channelType,
        Array.from(selectedUsers),
        channelType === 'department' ? department : undefined,
        channelDescription || undefined
      );

      onChannelCreated();
      onClose();
    } catch (error) {
      console.error('Failed to create channel:', error);
      setError('Failed to create channel. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const getUserAvatar = (user: UserProfile) => {
    const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    const presenceStatus = getPresenceStatus(user.id);

    return (
      <div className="relative">
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={`${user.firstName} ${user.lastName}`}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
        )}
        {presenceStatus === 'online' && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
        )}
        {presenceStatus === 'away' && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white dark:border-gray-900"></div>
        )}
        {presenceStatus === 'offline' && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 rounded-full border-2 border-white dark:border-gray-900"></div>
        )}
      </div>
    );
  };

  const getSelectedUserNames = () => {
    const names = Array.from(selectedUsers)
      .map(id => {
        const user = allUsers.find(u => u.id === id);
        return user ? `${user.firstName} ${user.lastName}` : '';
      })
      .filter(Boolean);

    if (names.length === 0) return 'No users selected';
    if (names.length === 1) return names[0];
    if (names.length === 2) return names.join(' and ');
    return `${names[0]} and ${names.length - 1} others`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Channel
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Channel Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Channel Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => {
                  setChannelType('direct');
                  setSelectedUsers(new Set());
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  channelType === 'direct'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <User className={`h-6 w-6 mx-auto mb-2 ${
                  channelType === 'direct' ? 'text-blue-600' : 'text-gray-500'
                }`} />
                <div className="text-sm font-medium text-gray-900 dark:text-white">Direct Message</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">1-on-1 chat</div>
              </button>

              <button
                onClick={() => setChannelType('group')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  channelType === 'group'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Users className={`h-6 w-6 mx-auto mb-2 ${
                  channelType === 'group' ? 'text-blue-600' : 'text-gray-500'
                }`} />
                <div className="text-sm font-medium text-gray-900 dark:text-white">Group Chat</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Multiple people</div>
              </button>

              <button
                onClick={() => setChannelType('department')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  channelType === 'department'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Hash className={`h-6 w-6 mx-auto mb-2 ${
                  channelType === 'department' ? 'text-blue-600' : 'text-gray-500'
                }`} />
                <div className="text-sm font-medium text-gray-900 dark:text-white">Department</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Team channel</div>
              </button>
            </div>
          </div>

          {/* Channel Name (for group and department) */}
          {(channelType === 'group' || channelType === 'department') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Channel Name *
              </label>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="e.g., Project Team, Engineering"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Department (for department channels) */}
          {channelType === 'department' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Engineering, Marketing, HR"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Description (optional) */}
          {channelType !== 'direct' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={channelDescription}
                onChange={(e) => setChannelDescription(e.target.value)}
                placeholder="What is this channel about?"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Selected Users Summary */}
          {selectedUsers.size > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Selected: {getSelectedUserNames()}
              </div>
            </div>
          )}

          {/* User Search and Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {channelType === 'direct' ? 'Select User to Chat With' : 'Add Members'}
              {channelType === 'direct' && ' *'}
            </label>

            {/* Department Filter */}
            {availableDepartments.length > 0 && (
              <div className="mb-3">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All Departments</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}

            {/* AI Search */}
            <div className="relative mb-3">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-1 mr-2 animate-pulse">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs font-medium text-purple-600">AI</span>
              </div>
              <input
                type="text"
                placeholder="AI Search: Try 'Sarah', 'Engineering', 'Manager', etc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-10 py-3 border-2 border-purple-100 dark:border-purple-900 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 bg-purple-50 dark:bg-purple-900/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400 animate-spin" />
              )}
            </div>

            {/* User List */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-64 overflow-y-auto">
              {allUsers.length === 0 && !isSearching && !error ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p>Loading users...</p>
                </div>
              ) : isSearching && filteredUsers.length === 0 && (searchQuery || departmentFilter) ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p>Searching...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400 mb-4">
                    {searchQuery || departmentFilter ? `No users found matching "${searchQuery || departmentFilter}"` : 'No users available'}
                  </div>
                  {!showCreateUser && (
                    <button
                      onClick={() => setShowCreateUser(true)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Create New User</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((profile) => {
                    const isSelected = selectedUsers.has(profile.id);
                    const isDisabled = channelType === 'direct' && selectedUsers.size > 0 && !isSelected;

                    return (
                      <button
                        key={profile.id}
                        onClick={() => !isDisabled && toggleUserSelection(profile.id)}
                        disabled={isDisabled}
                        className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${
                          isDisabled
                            ? 'opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {getUserAvatar(profile)}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {profile.firstName} {profile.lastName}
                            </span>
                            {profile.department && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                {profile.department}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {profile.jobTitle && <span className="font-medium">{profile.jobTitle} • </span>}
                            {profile.email}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {channelType === 'direct' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Select one person for a direct message
              </p>
            )}

            {filteredUsers.length > 0 && !showCreateUser && (
              <button
                onClick={() => setShowCreateUser(true)}
                className="mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
              >
                <UserPlus className="h-4 w-4" />
                <span>Can't find who you're looking for? Create new user</span>
              </button>
            )}
          </div>

          {/* Create User Form */}
          {showCreateUser && (
            <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New User</h3>
                <button
                  onClick={() => {
                    setShowCreateUser(false);
                    setNewUserData({ firstName: '', lastName: '', email: '', department: '', role: '' });
                    setError(null);
                  }}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={newUserData.firstName}
                      onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={newUserData.lastName}
                      onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="john.doe@company.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Department (Optional)
                    </label>
                    <input
                      type="text"
                      value={newUserData.department}
                      onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Engineering"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role (Optional)
                    </label>
                    <input
                      type="text"
                      value={newUserData.role}
                      onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateUser}
                  disabled={isCreatingUser || !newUserData.firstName.trim() || !newUserData.lastName.trim() || !newUserData.email.trim()}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isCreatingUser ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating User...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Create User</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || selectedUsers.size === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              'Create Channel'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChannelModal;
