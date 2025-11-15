import { useState, useEffect } from 'react';
import { X, Shield, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PermissionManagementModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

interface Permission {
  id: string;
  code: string;
  category: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

interface RolePermission {
  id: string;
  role: string;
  permissionId: string;
  createdAt: Date;
}

const roles = ['HR', 'Manager', 'Employee', 'Product Owner'];

const PermissionManagementModal: React.FC<PermissionManagementModalProps> = ({ isOpen = true, onClose }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'permissions' | 'matrix'>('matrix');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreatePermission, setShowCreatePermission] = useState(false);
  const [newPermission, setNewPermission] = useState({
    code: '',
    category: 'Timesheets',
    name: '',
    description: ''
  });

  // Fetch all permissions
  const { data: permissions = [], isLoading: loadingPermissions } = useQuery<Permission[]>({
    queryKey: ['/api/permissions'],
    enabled: isOpen
  });

  // Fetch role permissions for each role
  const rolePermissionsQueries = roles.map(role => 
    useQuery<RolePermission[]>({
      queryKey: ['/api/permissions/role', role],
      enabled: isOpen
    })
  );

  // Create permission mutation
  const createPermissionMutation = useMutation({
    mutationFn: async (data: typeof newPermission) => {
      return await apiRequest('/api/permissions', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
      toast({
        title: 'Permission Created',
        description: 'New permission has been created successfully.'
      });
      setShowCreatePermission(false);
      setNewPermission({ code: '', category: 'Timesheets', name: '', description: '' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create permission',
        variant: 'destructive'
      });
    }
  });

  // Assign permission mutation
  const assignPermissionMutation = useMutation({
    mutationFn: async ({ role, permissionId }: { role: string; permissionId: string }) => {
      return await apiRequest('/api/permissions/assign', {
        method: 'POST',
        body: JSON.stringify({ role, permissionId })
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/role', variables.role] });
      toast({
        title: 'Permission Assigned',
        description: 'Permission has been assigned to the role.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign permission',
        variant: 'destructive'
      });
    }
  });

  // Revoke permission mutation
  const revokePermissionMutation = useMutation({
    mutationFn: async ({ role, permissionId }: { role: string; permissionId: string }) => {
      return await apiRequest('/api/permissions/revoke', {
        method: 'DELETE',
        body: JSON.stringify({ role, permissionId })
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/role', variables.role] });
      toast({
        title: 'Permission Revoked',
        description: 'Permission has been revoked from the role.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke permission',
        variant: 'destructive'
      });
    }
  });

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !showCreatePermission) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, showCreatePermission, onClose]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(permissions.map(p => p.category)));
  const filteredPermissions = selectedCategory === 'all' 
    ? permissions 
    : permissions.filter(p => p.category === selectedCategory);

  const hasPermission = (role: string, permissionId: string): boolean => {
    const roleIndex = roles.indexOf(role);
    const rolePerms = rolePermissionsQueries[roleIndex]?.data || [];
    return rolePerms.some(rp => rp.permissionId === permissionId);
  };

  const handleTogglePermission = (role: string, permissionId: string) => {
    if (hasPermission(role, permissionId)) {
      revokePermissionMutation.mutate({ role, permissionId });
    } else {
      assignPermissionMutation.mutate({ role, permissionId });
    }
  };

  const handleCreatePermission = () => {
    if (!newPermission.code || !newPermission.name) {
      toast({
        title: 'Validation Error',
        description: 'Permission code and name are required',
        variant: 'destructive'
      });
      return;
    }
    createPermissionMutation.mutate(newPermission);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Permission Management</h2>
              <p className="text-blue-100 text-sm">Manage role-based access control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            data-testid="button-close-permission-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-3 font-medium text-sm transition-all ${
                activeTab === 'matrix'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              data-testid="tab-permission-matrix"
            >
              Permission Matrix
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-4 py-3 font-medium text-sm transition-all ${
                activeTab === 'permissions'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              data-testid="tab-permissions-list"
            >
              All Permissions
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingPermissions ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === 'matrix' ? (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="select-permission-category"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {filteredPermissions.length} permissions
                  </span>
                </div>
                <button
                  onClick={() => setShowCreatePermission(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  data-testid="button-create-permission"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Permission</span>
                </button>
              </div>

              {/* Permission Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      <th className="text-left p-3 border-b-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                        Permission
                      </th>
                      <th className="text-left p-3 border-b-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                        Category
                      </th>
                      {roles.map(role => (
                        <th key={role} className="text-center p-3 border-b-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                          {role}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPermissions.map((permission) => (
                      <tr key={permission.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{permission.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{permission.code}</div>
                            {permission.description && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{permission.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-xs font-medium">
                            {permission.category}
                          </span>
                        </td>
                        {roles.map(role => {
                          const hasAccess = hasPermission(role, permission.id);
                          return (
                            <td key={role} className="p-3 text-center">
                              <button
                                onClick={() => handleTogglePermission(role, permission.id)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                  hasAccess
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                                data-testid={`toggle-permission-${permission.code}-${role}`}
                              >
                                {hasAccess && <Check className="w-5 h-5" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredPermissions.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No permissions found in this category</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Permissions</h3>
                <button
                  onClick={() => setShowCreatePermission(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  data-testid="button-create-permission-list"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Permission</span>
                </button>
              </div>

              <div className="space-y-2">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{permission.name}</h4>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-xs font-medium">
                            {permission.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-1">{permission.code}</p>
                        {permission.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{permission.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Create Permission Modal */}
        {showCreatePermission && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Permission</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Permission Code *
                  </label>
                  <input
                    type="text"
                    value={newPermission.code}
                    onChange={(e) => setNewPermission({ ...newPermission, code: e.target.value })}
                    placeholder="e.g., timesheets.view_own"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="input-permission-code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={newPermission.category}
                    onChange={(e) => setNewPermission({ ...newPermission, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="select-permission-category-create"
                  >
                    <option value="Timesheets">Timesheets</option>
                    <option value="Payroll">Payroll</option>
                    <option value="Leave">Leave</option>
                    <option value="Employees">Employees</option>
                    <option value="Reports">Reports</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={newPermission.name}
                    onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                    placeholder="e.g., View Own Timesheets"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="input-permission-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newPermission.description}
                    onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                    placeholder="Describe what this permission allows..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="input-permission-description"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreatePermission(false);
                    setNewPermission({ code: '', category: 'Timesheets', name: '', description: '' });
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  data-testid="button-cancel-create-permission"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePermission}
                  disabled={createPermissionMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-save-permission"
                >
                  {createPermissionMutation.isPending ? 'Creating...' : 'Create Permission'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionManagementModal;
