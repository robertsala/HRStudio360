import { useState, useEffect } from 'react';
import { 
  X, Shield, Plus, Trash2, Check, AlertCircle, CheckCircle, XCircle, 
  FileText, Users, Clock, FileCheck, History, Sparkles, Download,
  ChevronDown, ChevronUp, AlertTriangle, Info, Ban
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../../lib/queryClient';

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

interface PermissionTemplate {
  id: string;
  name: string;
  description: string | null;
  targetRole: string | null;
  permissionIds: string[];
  isSystemTemplate: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TimeBasedGrant {
  id: string;
  userId: string;
  permissionId: string;
  grantedBy: string;
  reason: string;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  revokedBy: string | null;
  revokedAt: Date | null;
  createdAt: Date;
  user?: { firstName: string; lastName: string; email: string };
  permission?: { name: string; code: string };
  granter?: { firstName: string; lastName: string };
}

interface PermissionRequest {
  id: string;
  requestedById: string;
  permissionIds: string[];
  justification: string;
  requestType: 'temporary' | 'permanent';
  duration: number | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  requester?: { firstName: string; lastName: string; email: string };
  reviewer?: { firstName: string; lastName: string };
}

interface AuditEntry {
  id: string;
  targetType: 'role' | 'user';
  targetId: string;
  changeType: 'grant' | 'revoke' | 'template_apply';
  permissionIds: string[];
  changedBy: string;
  reason: string | null;
  metadata: any;
  changedAt: Date;
  changer?: { firstName: string; lastName: string; email: string };
}

interface AIPermissionSuggestion {
  permissionId: string;
  permissionCode: string;
  permissionName: string;
  category: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface RiskAnalysis {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendations: string[];
  conflictingPermissions: string[];
}

const roles = ['HR', 'Manager', 'Employee', 'Product Owner'];

const PermissionManagementModal: React.FC<PermissionManagementModalProps> = ({ isOpen = true, onClose }) => {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'access-control' | 'templates' | 'bulk' | 'temporal' | 'requests' | 'audit'>('access-control');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreatePermission, setShowCreatePermission] = useState(false);
  const [newPermission, setNewPermission] = useState({
    code: '',
    category: 'Timesheets',
    name: '',
    description: ''
  });

  // Templates Tab State
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [aiGenerateRole, setAIGenerateRole] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<PermissionTemplate | null>(null);
  const [applyingTemplate, setApplyingTemplate] = useState<PermissionTemplate | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    targetRole: '',
    permissionIds: [] as string[]
  });

  // Bulk Operations Tab State
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState('');
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<'assign' | 'revoke' | null>(null);
  const [bulkReason, setBulkReason] = useState('');

  // Time-Based Grants Tab State
  const [showCreateGrant, setShowCreateGrant] = useState(false);
  const [newGrant, setNewGrant] = useState({
    userId: '',
    permissionId: '',
    reason: '',
    duration: 24,
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });

  // Permission Requests Tab State
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState<PermissionRequest | null>(null);
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [newRequest, setNewRequest] = useState({
    permissionIds: [] as string[],
    justification: '',
    requestType: 'permanent' as 'temporary' | 'permanent',
    duration: 24
  });
  const [reviewNotes, setReviewNotes] = useState('');

  // Audit Trail Tab State
  const [auditTargetType, setAuditTargetType] = useState<'all' | 'role' | 'user'>('all');
  const [auditTargetId, setAuditTargetId] = useState('');
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);

  // AI Features State
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestionRole, setAISuggestionRole] = useState('');
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(false);
  const [riskPermissions, setRiskPermissions] = useState<string[]>([]);

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

  // Fetch permission templates
  const { data: templates = [], isLoading: loadingTemplates } = useQuery<PermissionTemplate[]>({
    queryKey: ['/api/permissions/templates'],
    enabled: isOpen && activeTab === 'templates'
  });

  // Fetch time-based grants
  const { data: grants = [], isLoading: loadingGrants } = useQuery<TimeBasedGrant[]>({
    queryKey: ['/api/permissions/grants'],
    enabled: isOpen && activeTab === 'temporal'
  });

  // Fetch permission requests
  const { data: requests = [], isLoading: loadingRequests } = useQuery<PermissionRequest[]>({
    queryKey: ['/api/permissions/requests'],
    enabled: isOpen && activeTab === 'requests'
  });

  // Fetch audit trail
  const { data: auditTrail = [], isLoading: loadingAudit } = useQuery<AuditEntry[]>({
    queryKey: ['/api/permissions/audit', { targetType: auditTargetType === 'all' ? undefined : auditTargetType, targetId: auditTargetId || undefined }],
    enabled: isOpen && activeTab === 'audit'
  });

  // Fetch all users for dropdowns
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: isOpen
  });

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
      setToast({ type: 'success', message: 'Permission created successfully' });
      setShowCreatePermission(false);
      setNewPermission({ code: '', category: 'Timesheets', name: '', description: '' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to create permission' });
      setTimeout(() => setToast(null), 3000);
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
      setToast({ type: 'success', message: 'Permission assigned to role' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to assign permission' });
      setTimeout(() => setToast(null), 3000);
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
      setToast({ type: 'success', message: 'Permission revoked from role' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to revoke permission' });
      setTimeout(() => setToast(null), 3000);
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof newTemplate) => {
      return await apiRequest('/api/permissions/templates', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/templates'] });
      setToast({ type: 'success', message: 'Template created successfully' });
      setShowCreateTemplate(false);
      setNewTemplate({ name: '', description: '', targetRole: '', permissionIds: [] });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to create template' });
      setTimeout(() => setToast(null), 3000);
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof newTemplate> }) => {
      return await apiRequest(`/api/permissions/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/templates'] });
      setToast({ type: 'success', message: 'Template updated successfully' });
      setEditingTemplate(null);
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to update template' });
      setTimeout(() => setToast(null), 3000);
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/permissions/templates/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/templates'] });
      setToast({ type: 'success', message: 'Template deleted successfully' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to delete template' });
      setTimeout(() => setToast(null), 3000);
    }
  });

  // Apply template mutation
  const applyTemplateMutation = useMutation({
    mutationFn: async ({ templateId, role }: { templateId: string; role: string }) => {
      return await apiRequest(`/api/permissions/templates/${templateId}/apply`, {
        method: 'POST',
        body: JSON.stringify({ role })
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/role', variables.role] });
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/audit'] });
      setToast({ type: 'success', message: 'Template applied to role' });
      setApplyingTemplate(null);
      setSelectedRole('');
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to apply template' });
      setTimeout(() => setToast(null), 3000);
    }
  });

  // AI Generate Template
  const aiGenerateTemplateMutation = useMutation({
    mutationFn: async (role: string) => {
      return await apiRequest('/api/permissions/ai/template', {
        method: 'POST',
        body: JSON.stringify({ role })
      });
    },
    onSuccess: (data) => {
      setNewTemplate({
        name: data.name || '',
        description: data.description || '',
        targetRole: aiGenerateRole,
        permissionIds: data.permissionIds || []
      });
      setShowAIGenerate(false);
      setShowCreateTemplate(true);
      setToast({ type: 'success', message: 'AI template generated successfully' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to generate template' });
      setTimeout(() => setToast(null), 3000);
    }
  });

  // Bulk assign mutation
  const bulkAssignMutation = useMutation({
    mutationFn: async ({ role, permissionIds, reason }: { role: string; permissionIds: string[]; reason?: string }) => {
      return await apiRequest('/api/permissions/bulk/assign', {
        method: 'POST',
        body: JSON.stringify({ role, permissionIds, assignedBy: 'current-user', reason })
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/role', variables.role] });
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/audit'] });
      setToast({ type: 'success', message: `${variables.permissionIds.length} permissions assigned successfully` });
      setShowBulkConfirm(false);
      setSelectedPermissions([]);
      setBulkReason('');
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to assign permissions' });
      setTimeout(() => setToast(null), 3000);
    }
  });

  // Bulk revoke mutation
  const bulkRevokeMutation = useMutation({
    mutationFn: async ({ role, permissionIds, reason }: { role: string; permissionIds: string[]; reason?: string }) => {
      return await apiRequest('/api/permissions/bulk/revoke', {
        method: 'POST',
        body: JSON.stringify({ role, permissionIds, revokedBy: 'current-user', reason })
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/role', variables.role] });
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/audit'] });
      setToast({ type: 'success', message: `${variables.permissionIds.length} permissions revoked successfully` });
      setShowBulkConfirm(false);
      setSelectedPermissions([]);
      setBulkReason('');
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to revoke permissions' });
      setTimeout(() => setToast(null), 3000);
    }
  });

  // Create grant mutation
  const createGrantMutation = useMutation({
    mutationFn: async (data: typeof newGrant) => {
      return await apiRequest('/api/permissions/grants', {
        method: 'POST',
        body: JSON.stringify({
          userId: data.userId,
          permissionId: data.permissionId,
          grantedBy: 'current-user',
          reason: data.reason,
          startTime: new Date(data.startTime).toISOString(),
          endTime: new Date(data.endTime).toISOString()
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/grants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/audit'] });
      setToast({ type: 'success', message: 'Time-based grant created successfully' });
      setShowCreateGrant(false);
      setNewGrant({
        userId: '',
        permissionId: '',
        reason: '',
        duration: 24,
        startTime: new Date().toISOString().slice(0, 16),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
      });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to create grant' });
      setTimeout(() => setToast(null), 3000);
    }
  });

  // Revoke grant mutation
  const revokeGrantMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/permissions/grants/${id}/revoke`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/grants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/audit'] });
      setToast({ type: 'success', message: 'Grant revoked successfully' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to revoke grant' });
      setTimeout(() => setToast(null), 3000);
    }
  });

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: typeof newRequest) => {
      return await apiRequest('/api/permissions/requests', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          requestedById: 'current-user'
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/requests'] });
      setToast({ type: 'success', message: 'Permission request submitted successfully' });
      setShowCreateRequest(false);
      setNewRequest({ permissionIds: [], justification: '', requestType: 'permanent', duration: 24 });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to submit request' });
      setTimeout(() => setToast(null), 3000);
    }
  });

  // Approve request mutation
  const approveRequestMutation = useMutation({
    mutationFn: async ({ id, reviewNotes }: { id: string; reviewNotes: string }) => {
      return await apiRequest(`/api/permissions/requests/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reviewNotes })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/audit'] });
      setToast({ type: 'success', message: 'Request approved successfully' });
      setShowRequestDetails(null);
      setReviewNotes('');
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to approve request' });
      setTimeout(() => setToast(null), 3000);
    }
  });

  // Reject request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async ({ id, reviewNotes }: { id: string; reviewNotes: string }) => {
      return await apiRequest(`/api/permissions/requests/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reviewNotes })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/requests'] });
      setToast({ type: 'success', message: 'Request rejected' });
      setShowRequestDetails(null);
      setReviewNotes('');
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      setToast({ type: 'error', message: error.message || 'Failed to reject request' });
      setTimeout(() => setToast(null), 3000);
    }
  });

  // AI Suggest Permissions
  const { data: aiSuggestions, isLoading: loadingAISuggestions } = useQuery<AIPermissionSuggestion[]>({
    queryKey: ['/api/permissions/ai/suggest', aiSuggestionRole],
    enabled: showAISuggestions && !!aiSuggestionRole,
    queryFn: async () => {
      const response = await apiRequest('/api/permissions/ai/suggest', {
        method: 'POST',
        body: JSON.stringify({ role: aiSuggestionRole })
      });
      return response;
    }
  });

  // Risk Analysis
  const { data: riskAnalysis, isLoading: loadingRiskAnalysis } = useQuery<RiskAnalysis>({
    queryKey: ['/api/permissions/ai/risk', riskPermissions],
    enabled: showRiskAnalysis && riskPermissions.length > 0,
    queryFn: async () => {
      const response = await apiRequest('/api/permissions/ai/risk', {
        method: 'POST',
        body: JSON.stringify({ permissionIds: riskPermissions })
      });
      return response;
    }
  });

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !showCreatePermission && !showCreateTemplate && !showBulkConfirm) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, showCreatePermission, showCreateTemplate, showBulkConfirm, onClose]);

  // Auto-update duration end time
  useEffect(() => {
    if (newGrant.duration && newGrant.startTime) {
      const start = new Date(newGrant.startTime);
      const end = new Date(start.getTime() + newGrant.duration * 60 * 60 * 1000);
      setNewGrant(prev => ({ ...prev, endTime: end.toISOString().slice(0, 16) }));
    }
  }, [newGrant.duration, newGrant.startTime]);

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
      setToast({ type: 'error', message: 'Permission code and name are required' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    createPermissionMutation.mutate(newPermission);
  };

  const handleTogglePermissionSelection = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAll = () => {
    setSelectedPermissions(filteredPermissions.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedPermissions([]);
  };

  const handleBulkOperation = (operation: 'assign' | 'revoke') => {
    if (selectedPermissions.length === 0 || !bulkRole) {
      setToast({ type: 'error', message: 'Please select permissions and a role' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setBulkOperation(operation);
    setShowBulkConfirm(true);
  };

  const confirmBulkOperation = () => {
    if (!bulkOperation || !bulkRole) return;
    
    if (bulkOperation === 'assign') {
      bulkAssignMutation.mutate({ role: bulkRole, permissionIds: selectedPermissions, reason: bulkReason });
    } else {
      bulkRevokeMutation.mutate({ role: bulkRole, permissionIds: selectedPermissions, reason: bulkReason });
    }
  };

  const handleCreateGrant = () => {
    if (!newGrant.userId || !newGrant.permissionId || !newGrant.reason) {
      setToast({ type: 'error', message: 'User, permission, and reason are required' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    const startDate = new Date(newGrant.startTime);
    const endDate = new Date(newGrant.endTime);
    
    if (endDate <= startDate) {
      setToast({ type: 'error', message: 'End time must be after start time' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    createGrantMutation.mutate(newGrant);
  };

  const handleCreateRequest = () => {
    if (newRequest.permissionIds.length === 0 || !newRequest.justification) {
      setToast({ type: 'error', message: 'Permissions and justification are required' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    createRequestMutation.mutate(newRequest);
  };

  const exportAuditTrail = () => {
    const csv = [
      ['Timestamp', 'Changed By', 'Target Type', 'Target ID', 'Change Type', 'Permissions', 'Reason'],
      ...auditTrail.map(entry => [
        new Date(entry.changedAt).toLocaleString(),
        entry.changer ? `${entry.changer.firstName} ${entry.changer.lastName}` : entry.changedBy,
        entry.targetType,
        entry.targetId,
        entry.changeType,
        entry.permissionIds.map(id => permissions.find(p => p.id === id)?.name || id).join('; '),
        entry.reason || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permission-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', message: 'Audit trail exported successfully' });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredRequests = requestStatusFilter === 'all' 
    ? requests 
    : requests.filter(r => r.status === requestStatusFilter);

  const activeGrants = grants.filter(g => g.isActive && new Date(g.endTime) > new Date());

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Permission Management</h2>
              <p className="text-blue-100 text-sm">Comprehensive role-based access control</p>
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
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 overflow-x-auto">
          <div className="flex space-x-1 min-w-max">
            <button
              onClick={() => setActiveTab('access-control')}
              className={`px-4 py-3 font-medium text-sm transition-all flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'access-control'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              data-testid="tab-access-control"
            >
              <Shield className="w-4 h-4" />
              <span>Access Control</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-3 font-medium text-sm transition-all flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'templates'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              data-testid="tab-templates"
            >
              <FileText className="w-4 h-4" />
              <span>Templates</span>
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-4 py-3 font-medium text-sm transition-all flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'bulk'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              data-testid="tab-bulk-operations"
            >
              <Users className="w-4 h-4" />
              <span>Bulk Operations</span>
            </button>
            <button
              onClick={() => setActiveTab('temporal')}
              className={`px-4 py-3 font-medium text-sm transition-all flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'temporal'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              data-testid="tab-temporary-access"
            >
              <Clock className="w-4 h-4" />
              <span>Temporary Access</span>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-3 font-medium text-sm transition-all flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'requests'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              data-testid="tab-permission-requests"
            >
              <FileCheck className="w-4 h-4" />
              <span>Permission Requests</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-3 font-medium text-sm transition-all flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              data-testid="tab-audit-trail"
            >
              <History className="w-4 h-4" />
              <span>Audit Trail</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingPermissions && activeTab === 'access-control' ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === 'access-control' ? (
            <div>
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                      <th className="text-left p-3 border-b-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white min-w-[250px]">
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
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-xs font-medium whitespace-nowrap">
                            {permission.category}
                          </span>
                        </td>
                        {roles.map(role => {
                          const hasAccess = hasPermission(role, permission.id);
                          return (
                            <td key={role} className="p-3 text-center">
                              <button
                                onClick={() => handleTogglePermission(role, permission.id)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all mx-auto ${
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
          ) : activeTab === 'templates' ? (
            <div>
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Permission Templates</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAIGenerate(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                    data-testid="button-ai-generate-template"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>AI Generate</span>
                  </button>
                  <button
                    onClick={() => setShowCreateTemplate(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    data-testid="button-create-template"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Template</span>
                  </button>
                </div>
              </div>

              {loadingTemplates ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 bg-white dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700"
                      data-testid={`template-${template.id}`}
                    >
                      <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">{template.name}</h4>
                            {template.isSystemTemplate && (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-xs font-medium flex-shrink-0">
                                System
                              </span>
                            )}
                            {template.targetRole && (
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-md text-xs font-medium flex-shrink-0">
                                {template.targetRole}
                              </span>
                            )}
                          </div>
                          {template.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{template.description}</p>
                          )}
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <FileText className="w-4 h-4" />
                            <span>{template.permissionIds.length} permissions</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setApplyingTemplate(template);
                            }}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            data-testid={`button-apply-template-${template.id}`}
                          >
                            Apply to Role
                          </button>
                          <button
                            onClick={() => setEditingTemplate(template)}
                            className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                            data-testid={`button-edit-template-${template.id}`}
                          >
                            Edit
                          </button>
                          {!template.isSystemTemplate && (
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this template?')) {
                                  deleteTemplateMutation.mutate(template.id);
                                }
                              }}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                              data-testid={`button-delete-template-${template.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {templates.length === 0 && !loadingTemplates && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No templates found. Create one to get started!</p>
                </div>
              )}
            </div>
          ) : activeTab === 'bulk' ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Bulk Permission Operations</h3>

              <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="select-bulk-category"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    data-testid="button-select-all"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    data-testid="button-deselect-all"
                  >
                    Deselect All
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedPermissions.length} selected
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={bulkRole}
                    onChange={(e) => setBulkRole(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="select-bulk-role"
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleBulkOperation('assign')}
                    disabled={selectedPermissions.length === 0 || !bulkRole}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    data-testid="button-bulk-assign"
                  >
                    Bulk Assign
                  </button>
                  <button
                    onClick={() => handleBulkOperation('revoke')}
                    disabled={selectedPermissions.length === 0 || !bulkRole}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    data-testid="button-bulk-revoke"
                  >
                    Bulk Revoke
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {filteredPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedPermissions.includes(permission.id)
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400'
                        : 'bg-white dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40'
                    }`}
                    onClick={() => handleTogglePermissionSelection(permission.id)}
                    data-testid={`permission-bulk-${permission.id}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => {}}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          data-testid={`checkbox-permission-${permission.id}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
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
          ) : activeTab === 'temporal' ? (
            <div>
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Time-Based Permission Grants</h3>
                <button
                  onClick={() => setShowCreateGrant(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  data-testid="button-create-grant"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Grant</span>
                </button>
              </div>

              {loadingGrants ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Active Grants</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900/50">
                          <th className="text-left p-3 border-b-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                            User
                          </th>
                          <th className="text-left p-3 border-b-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                            Permission
                          </th>
                          <th className="text-left p-3 border-b-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                            Reason
                          </th>
                          <th className="text-left p-3 border-b-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                            Start Time
                          </th>
                          <th className="text-left p-3 border-b-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                            End Time
                          </th>
                          <th className="text-left p-3 border-b-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                            Granted By
                          </th>
                          <th className="text-center p-3 border-b-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                            Status
                          </th>
                          <th className="text-center p-3 border-b-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeGrants.map((grant) => (
                          <tr key={grant.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                            <td className="p-3 text-gray-900 dark:text-white">
                              {grant.user ? `${grant.user.firstName} ${grant.user.lastName}` : grant.userId}
                            </td>
                            <td className="p-3 text-gray-900 dark:text-white">
                              {grant.permission?.name || grant.permissionId}
                            </td>
                            <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                              {grant.reason}
                            </td>
                            <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(grant.startTime).toLocaleString()}
                            </td>
                            <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(grant.endTime).toLocaleString()}
                            </td>
                            <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                              {grant.granter ? `${grant.granter.firstName} ${grant.granter.lastName}` : grant.grantedBy}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                new Date(grant.endTime) > new Date()
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                              }`}>
                                {new Date(grant.endTime) > new Date() ? 'Active' : 'Expired'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to revoke this grant?')) {
                                    revokeGrantMutation.mutate(grant.id);
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                data-testid={`button-revoke-grant-${grant.id}`}
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {activeGrants.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No active grants found</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : activeTab === 'requests' ? (
            <div>
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Permission Requests</h3>
                  <select
                    value={requestStatusFilter}
                    onChange={(e) => setRequestStatusFilter(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="select-request-status-filter"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowCreateRequest(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  data-testid="button-create-request"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Request</span>
                </button>
              </div>

              {loadingRequests ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 bg-white dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700"
                      data-testid={`request-${request.id}`}
                    >
                      <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {request.requester ? `${request.requester.firstName} ${request.requester.lastName}` : request.requestedById}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-xs font-medium">
                              {request.permissionIds.length} permissions
                            </span>
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                              request.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                              request.status === 'Approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                              'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}>
                              {request.status}
                            </span>
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-md text-xs font-medium">
                              {request.requestType}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{request.justification}</p>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Requested on {new Date(request.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => setShowRequestDetails(request)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            data-testid={`button-view-request-${request.id}`}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredRequests.length === 0 && !loadingRequests && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No permission requests found</p>
                </div>
              )}
            </div>
          ) : activeTab === 'audit' ? (
            <div>
              <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Permission Change Audit Trail</h3>
                <button
                  onClick={exportAuditTrail}
                  disabled={auditTrail.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-export-audit"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-3">
                <select
                  value={auditTargetType}
                  onChange={(e) => setAuditTargetType(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  data-testid="select-audit-target-type"
                >
                  <option value="all">All Targets</option>
                  <option value="role">Roles Only</option>
                  <option value="user">Users Only</option>
                </select>
                <input
                  type="text"
                  value={auditTargetId}
                  onChange={(e) => setAuditTargetId(e.target.value)}
                  placeholder="Filter by target ID..."
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  data-testid="input-audit-target-id"
                />
              </div>

              {loadingAudit ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditTrail.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 bg-white dark:bg-gray-900/30 rounded-lg border-l-4 border-gray-200 dark:border-gray-700"
                      style={{
                        borderLeftColor: entry.changeType === 'grant' ? '#10b981' : 
                                        entry.changeType === 'revoke' ? '#ef4444' : 
                                        '#3b82f6'
                      }}
                      data-testid={`audit-entry-${entry.id}`}
                    >
                      <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                              entry.changeType === 'grant' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                              entry.changeType === 'revoke' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                              'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                            }`}>
                              {entry.changeType.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 rounded-md text-xs font-medium">
                              {entry.targetType}: {entry.targetId}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(entry.changedAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white mb-2">
                            Changed by: <span className="font-semibold">
                              {entry.changer ? `${entry.changer.firstName} ${entry.changer.lastName}` : entry.changedBy}
                            </span>
                          </div>
                          {entry.reason && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Reason: {entry.reason}
                            </div>
                          )}
                          <button
                            onClick={() => setExpandedAudit(expandedAudit === entry.id ? null : entry.id)}
                            className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            data-testid={`button-expand-audit-${entry.id}`}
                          >
                            {expandedAudit === entry.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            <span>{entry.permissionIds.length} permissions affected</span>
                          </button>
                          {expandedAudit === entry.id && (
                            <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                {entry.permissionIds.map(id => {
                                  const perm = permissions.find(p => p.id === id);
                                  return (
                                    <li key={id}>• {perm?.name || id}</li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {auditTrail.length === 0 && !loadingAudit && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No audit trail entries found</p>
                </div>
              )}
            </div>
          ) : null}
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

        {/* Create Template Modal */}
        {showCreateTemplate && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 my-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Permission Template</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="e.g., Standard Manager Access"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="input-template-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Describe this template..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="input-template-description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Role
                  </label>
                  <select
                    value={newTemplate.targetRole}
                    onChange={(e) => setNewTemplate({ ...newTemplate, targetRole: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="select-template-target-role"
                  >
                    <option value="">Select role (optional)</option>
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Permissions *
                  </label>
                  <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700">
                    {permissions.map((permission) => (
                      <label key={permission.id} className="flex items-center space-x-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 rounded px-2">
                        <input
                          type="checkbox"
                          checked={newTemplate.permissionIds.includes(permission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewTemplate({ ...newTemplate, permissionIds: [...newTemplate.permissionIds, permission.id] });
                            } else {
                              setNewTemplate({ ...newTemplate, permissionIds: newTemplate.permissionIds.filter(id => id !== permission.id) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          data-testid={`checkbox-template-permission-${permission.id}`}
                        />
                        <span className="text-sm text-gray-900 dark:text-white">{permission.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {newTemplate.permissionIds.length} permissions selected
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateTemplate(false);
                    setNewTemplate({ name: '', description: '', targetRole: '', permissionIds: [] });
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  data-testid="button-cancel-create-template"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createTemplateMutation.mutate(newTemplate)}
                  disabled={createTemplateMutation.isPending || !newTemplate.name || newTemplate.permissionIds.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-save-template"
                >
                  {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Generate Template Modal */}
        {showAIGenerate && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <span>AI Generate Template</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    value={aiGenerateRole}
                    onChange={(e) => setAIGenerateRole(e.target.value)}
                    placeholder="e.g., Department Manager"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="input-ai-generate-role"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    AI will suggest appropriate permissions for this role
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAIGenerate(false);
                    setAIGenerateRole('');
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  data-testid="button-cancel-ai-generate"
                >
                  Cancel
                </button>
                <button
                  onClick={() => aiGenerateTemplateMutation.mutate(aiGenerateRole)}
                  disabled={aiGenerateTemplateMutation.isPending || !aiGenerateRole}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  data-testid="button-generate-template"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{aiGenerateTemplateMutation.isPending ? 'Generating...' : 'Generate Template'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Apply Template Modal */}
        {applyingTemplate && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Apply Template</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Template: <span className="font-semibold">{applyingTemplate.name}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  This will apply {applyingTemplate.permissionIds.length} permissions to the selected role.
                </p>
                
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Role *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  data-testid="select-apply-template-role"
                >
                  <option value="">Select role</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setApplyingTemplate(null);
                    setSelectedRole('');
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  data-testid="button-cancel-apply-template"
                >
                  Cancel
                </button>
                <button
                  onClick={() => applyTemplateMutation.mutate({ templateId: applyingTemplate.id, role: selectedRole })}
                  disabled={applyTemplateMutation.isPending || !selectedRole}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-confirm-apply-template"
                >
                  {applyTemplateMutation.isPending ? 'Applying...' : 'Apply Template'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Confirmation Modal */}
        {showBulkConfirm && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Confirm Bulk {bulkOperation === 'assign' ? 'Assignment' : 'Revocation'}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Role: <span className="font-semibold">{bulkRole}</span>
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  Operation: <span className="font-semibold">{bulkOperation === 'assign' ? 'Assign' : 'Revoke'} {selectedPermissions.length} permissions</span>
                </p>
                
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder="Explain why this change is being made..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  data-testid="input-bulk-reason"
                />

                <div className="mt-4 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Permissions:</p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {selectedPermissions.map(id => {
                      const perm = permissions.find(p => p.id === id);
                      return <li key={id}>• {perm?.name || id}</li>;
                    })}
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBulkConfirm(false);
                    setBulkOperation(null);
                    setBulkReason('');
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  data-testid="button-cancel-bulk-operation"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkOperation}
                  disabled={bulkAssignMutation.isPending || bulkRevokeMutation.isPending}
                  className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    bulkOperation === 'assign' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                  data-testid="button-confirm-bulk-operation"
                >
                  {(bulkAssignMutation.isPending || bulkRevokeMutation.isPending) ? 'Processing...' : `Confirm ${bulkOperation === 'assign' ? 'Assignment' : 'Revocation'}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Grant Modal */}
        {showCreateGrant && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Time-Based Grant</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    User *
                  </label>
                  <select
                    value={newGrant.userId}
                    onChange={(e) => setNewGrant({ ...newGrant, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="select-grant-user"
                  >
                    <option value="">Select user</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Permission *
                  </label>
                  <select
                    value={newGrant.permissionId}
                    onChange={(e) => setNewGrant({ ...newGrant, permissionId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="select-grant-permission"
                  >
                    <option value="">Select permission</option>
                    {permissions.map(permission => (
                      <option key={permission.id} value={permission.id}>
                        {permission.name} ({permission.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason *
                  </label>
                  <textarea
                    value={newGrant.reason}
                    onChange={(e) => setNewGrant({ ...newGrant, reason: e.target.value })}
                    placeholder="Explain why temporary access is needed..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="input-grant-reason"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={newGrant.duration}
                    onChange={(e) => setNewGrant({ ...newGrant, duration: parseInt(e.target.value) })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="input-grant-duration"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={newGrant.startTime}
                      onChange={(e) => setNewGrant({ ...newGrant, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      data-testid="input-grant-start-time"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={newGrant.endTime}
                      onChange={(e) => setNewGrant({ ...newGrant, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      data-testid="input-grant-end-time"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateGrant(false);
                    setNewGrant({
                      userId: '',
                      permissionId: '',
                      reason: '',
                      duration: 24,
                      startTime: new Date().toISOString().slice(0, 16),
                      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
                    });
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  data-testid="button-cancel-create-grant"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGrant}
                  disabled={createGrantMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-save-grant"
                >
                  {createGrantMutation.isPending ? 'Creating...' : 'Create Grant'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Request Modal */}
        {showCreateRequest && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 my-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Request Permissions</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Permissions *
                  </label>
                  <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700">
                    {permissions.map((permission) => (
                      <label key={permission.id} className="flex items-center space-x-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 rounded px-2">
                        <input
                          type="checkbox"
                          checked={newRequest.permissionIds.includes(permission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRequest({ ...newRequest, permissionIds: [...newRequest.permissionIds, permission.id] });
                            } else {
                              setNewRequest({ ...newRequest, permissionIds: newRequest.permissionIds.filter(id => id !== permission.id) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          data-testid={`checkbox-request-permission-${permission.id}`}
                        />
                        <span className="text-sm text-gray-900 dark:text-white">{permission.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {newRequest.permissionIds.length} permissions selected
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Request Type *
                  </label>
                  <select
                    value={newRequest.requestType}
                    onChange={(e) => setNewRequest({ ...newRequest, requestType: e.target.value as 'temporary' | 'permanent' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="select-request-type"
                  >
                    <option value="permanent">Permanent</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>

                {newRequest.requestType === 'temporary' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      value={newRequest.duration}
                      onChange={(e) => setNewRequest({ ...newRequest, duration: parseInt(e.target.value) })}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      data-testid="input-request-duration"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Justification *
                  </label>
                  <textarea
                    value={newRequest.justification}
                    onChange={(e) => setNewRequest({ ...newRequest, justification: e.target.value })}
                    placeholder="Explain why you need these permissions..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    data-testid="input-request-justification"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateRequest(false);
                    setNewRequest({ permissionIds: [], justification: '', requestType: 'permanent', duration: 24 });
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  data-testid="button-cancel-create-request"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRequest}
                  disabled={createRequestMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-save-request"
                >
                  {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Request Details Modal */}
        {showRequestDetails && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Permission Request Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requested By</label>
                  <p className="text-gray-900 dark:text-white">
                    {showRequestDetails.requester 
                      ? `${showRequestDetails.requester.firstName} ${showRequestDetails.requester.lastName} (${showRequestDetails.requester.email})`
                      : showRequestDetails.requestedById
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    showRequestDetails.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                    showRequestDetails.status === 'Approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    {showRequestDetails.status}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Request Type</label>
                  <p className="text-gray-900 dark:text-white">{showRequestDetails.requestType}</p>
                  {showRequestDetails.duration && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">Duration: {showRequestDetails.duration} hours</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Permissions ({showRequestDetails.permissionIds.length})
                  </label>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    {showRequestDetails.permissionIds.map(id => {
                      const perm = permissions.find(p => p.id === id);
                      return <li key={id}>• {perm?.name || id}</li>;
                    })}
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Justification</label>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{showRequestDetails.justification}</p>
                </div>

                {showRequestDetails.status === 'Pending' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Review Notes
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes for your decision..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      data-testid="input-review-notes"
                    />
                  </div>
                )}

                {showRequestDetails.reviewNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reviewer Notes</label>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{showRequestDetails.reviewNotes}</p>
                    {showRequestDetails.reviewer && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Reviewed by {showRequestDetails.reviewer.firstName} {showRequestDetails.reviewer.lastName} on {new Date(showRequestDetails.reviewedAt!).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRequestDetails(null);
                    setReviewNotes('');
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  data-testid="button-close-request-details"
                >
                  Close
                </button>
                {showRequestDetails.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to reject this request?')) {
                          rejectRequestMutation.mutate({ id: showRequestDetails.id, reviewNotes });
                        }
                      }}
                      disabled={rejectRequestMutation.isPending}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-reject-request"
                    >
                      {rejectRequestMutation.isPending ? 'Rejecting...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to approve this request?')) {
                          approveRequestMutation.mutate({ id: showRequestDetails.id, reviewNotes });
                        }
                      }}
                      disabled={approveRequestMutation.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-approve-request"
                    >
                      {approveRequestMutation.isPending ? 'Approving...' : 'Approve'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[100] flex items-center text-white ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 mr-2" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionManagementModal;
