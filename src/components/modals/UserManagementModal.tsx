import React, { useState, useEffect } from 'react';
import { X, Users, Shield, Search, Save, Edit, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuthContext } from '../../contexts/AuthContext';

interface UserManagementModalProps {
  onClose?: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  department: string | null;
  role: string | null;
  can_access_org_chart: boolean | null;
}

const DEPARTMENTS = [
  'HR',
  'Engineering',
  'Sales',
  'Marketing',
  'Finance',
  'Operations',
  'Customer Support',
  'Product',
  'Legal'
];

const ROLES = [
  'Product Owner',
  'Manager',
  'Team Lead',
  'Employee',
  'Contractor',
  'Admin'
];

const UserManagementModal: React.FC<UserManagementModalProps> = ({ onClose }) => {
  const { user } = useAuthContext();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{ department: string; role: string; can_access_org_chart: boolean }>({
    department: '',
    role: '',
    can_access_org_chart: false
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, department, role, can_access_org_chart')
        .order('email');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setToast({ message: 'Failed to load users', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUserId(user.id);
    setEditFormData({
      department: user.department || '',
      role: user.role || '',
      can_access_org_chart: user.can_access_org_chart || false
    });
  };

  const handleSaveUser = async (userId: string) => {
    if (!editFormData.department || !editFormData.role) {
      setToast({ message: 'Please select both department and role', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          department: editFormData.department,
          role: editFormData.role,
          can_access_org_chart: editFormData.can_access_org_chart
        })
        .eq('id', userId);

      if (error) throw error;

      setToast({ message: 'User updated successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
      setEditingUserId(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setToast({ message: 'Failed to update user', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditFormData({ department: '', role: '', can_access_org_chart: false });
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 animate-slide-in ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <div className="flex items-center">
          <Shield className="h-8 w-8 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">User Management</h2>
            <p className="text-blue-100">Manage user roles and departments</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="p-6 border-b bg-gray-50 dark:bg-gray-900">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-y-auto max-h-96 p-6">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((userProfile) => (
              <div
                key={userProfile.id}
                className="border rounded-lg p-4 bg-white dark:bg-gray-800 dark:bg-gray-800 hover:shadow-md transition-shadow"
              >
                {editingUserId === userProfile.id ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white dark:text-white mb-2">
                        {userProfile.first_name} {userProfile.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{userProfile.email}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
                          Department *
                        </label>
                        <select
                          value={editFormData.department}
                          onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Select Department</option>
                          {DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
                          Role *
                        </label>
                        <select
                          value={editFormData.role}
                          onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Select Role</option>
                          {ROLES.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="org-chart-access"
                        checked={editFormData.can_access_org_chart}
                        onChange={(e) => setEditFormData({ ...editFormData, can_access_org_chart: e.target.checked })}
                        className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="org-chart-access" className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 cursor-pointer">
                        Grant Org Chart Access
                      </label>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-200 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveUser(userProfile.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-gray-900 dark:text-white dark:text-white">
                          {userProfile.first_name} {userProfile.last_name}
                        </p>
                        {userProfile.id === user?.id && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">You</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{userProfile.email}</p>
                      <div className="flex items-center space-x-2">
                        {userProfile.department ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                            {userProfile.department}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                            No Department
                          </span>
                        )}
                        {userProfile.role ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {userProfile.role}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                            No Role
                          </span>
                        )}
                        {userProfile.can_access_org_chart && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            Org Chart Access
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditUser(userProfile)}
                      className="ml-4 p-2 text-blue-600 hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit User"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementModal;
