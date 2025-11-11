import React, { useState, useEffect, useRef } from 'react';
import { X, Globe, Calendar, User, Eye, ChevronRight, Bell, Pin, MessageSquare, ThumbsUp, Share2, Bookmark, Filter, Search, Plus, Send, Users, MapPin, Briefcase, ChevronDown, Maximize, Minimize, CheckCircle, AlertCircle, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mockEmployees } from '../../data/mockEmployees';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetAudienceType: 'all_employees' | 'specific_employees' | 'departments' | 'locations';
  specificEmployeeIds?: string[];
  departments?: string[];
  locations?: string[];
  published: boolean;
  publicationDate?: string;
  expirationDate?: string;
  creatorUserId: string;
  createdAt: string;
  authorName?: string;
  readCount?: number;
  isRead?: boolean;
}

interface AnnouncementsModalProps {
  selectedAnnouncementId?: string;
  onClose?: () => void;
}

const AnnouncementsModal: React.FC<AnnouncementsModalProps> = ({ selectedAnnouncementId, onClose }) => {
  const { user } = useAuth();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    target_audience_type: 'all' as 'all' | 'specific_employees' | 'departments' | 'locations',
    target_employee_ids: [] as string[],
    target_departments: [] as string[],
    target_locations: [] as string[],
    expires_at: '',
    publish_immediately: true
  });

  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [isTextareaExpanded, setIsTextareaExpanded] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [fieldsBelow, setFieldsBelow] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ department: string; role: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);

  // Get unique departments and locations from mock employees
  const departments = Array.from(new Set(mockEmployees.map(e => e.department)));
  const locations = Array.from(new Set(mockEmployees.map(e => e.location)));

  useEffect(() => {
    if (user) {
      loadAnnouncements();
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/profiles/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to load user profile');
      }
      const data = await response.json();
      setUserProfile({ department: data.department, role: data.role });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  useEffect(() => {
    if (selectedAnnouncementId && announcements.length > 0) {
      const announcement = announcements.find(a => a.id === selectedAnnouncementId);
      if (announcement) {
        setSelectedAnnouncement(announcement);
      }
    }
  }, [selectedAnnouncementId, announcements]);

  useEffect(() => {
    if (!showCreateForm || !bottomSentinelRef.current || !scrollContainerRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setShowScrollIndicator(!entry.isIntersecting);
      },
      {
        root: scrollContainerRef.current,
        threshold: 0,
        rootMargin: '0px'
      }
    );

    observer.observe(bottomSentinelRef.current);

    return () => observer.disconnect();
  }, [showCreateForm, formData.target_audience_type, isTextareaExpanded]);

  useEffect(() => {
    if (!showCreateForm || !scrollContainerRef.current) {
      return;
    }

    const calculateFieldsBelow = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerBottom = containerRect.bottom;
      const formFields = container.querySelectorAll('input, textarea, button[type="button"], select, .bg-gray-50');

      let belowCount = 0;
      formFields.forEach((field) => {
        const fieldRect = field.getBoundingClientRect();
        if (fieldRect.top > containerBottom) {
          belowCount++;
        }
      });

      const estimatedSections = Math.ceil(belowCount / 3);
      setFieldsBelow(estimatedSections);
    };

    calculateFieldsBelow();

    const handleScroll = () => {
      calculateFieldsBelow();
    };

    const container = scrollContainerRef.current;
    container.addEventListener('scroll', handleScroll);

    return () => container.removeEventListener('scroll', handleScroll);
  }, [showCreateForm, formData.target_audience_type, isTextareaExpanded]);

  const loadAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements');
      if (!response.ok) {
        throw new Error('Failed to load announcements');
      }
      const data = await response.json();
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!user || !formData.title.trim() || !formData.content.trim()) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      const announcementData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        priority: formData.priority,
        targetAudienceType: formData.target_audience_type === 'all' ? 'all_employees' : formData.target_audience_type,
        specificEmployeeIds: formData.target_audience_type === 'specific_employees' ? formData.target_employee_ids : [],
        departments: formData.target_audience_type === 'departments' ? formData.target_departments : [],
        locations: formData.target_audience_type === 'locations' ? formData.target_locations : [],
        published: formData.publish_immediately,
        publicationDate: formData.publish_immediately ? new Date().toISOString() : null,
        expirationDate: formData.expires_at || null,
        creatorUserId: user.id
      };

      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementData)
      });

      if (!response.ok) {
        throw new Error('Failed to create announcement');
      }

      setToast({ message: 'Announcement created successfully!', type: 'success' });
      setTimeout(() => {
        setToast(null);
        setShowCreateForm(false);
        resetForm();
        loadAnnouncements();
      }, 2000);
    } catch (error) {
      console.error('Error creating announcement:', error);
      setToast({ message: 'Failed to create announcement. Please try again.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      target_audience_type: 'all',
      target_employee_ids: [],
      target_departments: [],
      target_locations: [],
      expires_at: '',
      publish_immediately: true
    });
    setEmployeeSearch('');
    setEditingAnnouncementId(null);
    setShowEditForm(false);
  };

  const canEditOrDelete = () => {
    return userProfile?.department === 'HR' || userProfile?.role === 'Product Owner';
  };

  const markAsRead = async (announcementId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/announcements/${announcementId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok && response.status !== 409) {
        throw new Error('Failed to mark announcement as read');
      }
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    const audienceType = announcement.targetAudienceType === 'all_employees' ? 'all' : announcement.targetAudienceType;
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      target_audience_type: audienceType,
      target_employee_ids: announcement.specificEmployeeIds || [],
      target_departments: announcement.departments || [],
      target_locations: announcement.locations || [],
      expires_at: announcement.expirationDate ? new Date(announcement.expirationDate).toISOString().slice(0, 16) : '',
      publish_immediately: announcement.published
    });
    setEditingAnnouncementId(announcement.id);
    setShowEditForm(true);
    setSelectedAnnouncement(null);
  };

  const handleUpdateAnnouncement = async () => {
    if (!user || !editingAnnouncementId || !formData.title.trim() || !formData.content.trim()) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      const announcementData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        priority: formData.priority,
        targetAudienceType: formData.target_audience_type === 'all' ? 'all_employees' : formData.target_audience_type,
        specificEmployeeIds: formData.target_audience_type === 'specific_employees' ? formData.target_employee_ids : [],
        departments: formData.target_audience_type === 'departments' ? formData.target_departments : [],
        locations: formData.target_audience_type === 'locations' ? formData.target_locations : [],
        published: formData.publish_immediately,
        publicationDate: formData.publish_immediately ? new Date().toISOString() : null,
        expirationDate: formData.expires_at || null
      };

      const response = await fetch(`/api/announcements/${editingAnnouncementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementData)
      });

      if (!response.ok) {
        throw new Error('Failed to update announcement');
      }

      setToast({ message: 'Announcement updated successfully!', type: 'success' });
      setTimeout(() => {
        setToast(null);
        resetForm();
        loadAnnouncements();
      }, 2000);
    } catch (error) {
      console.error('Error updating announcement:', error);
      setToast({ message: 'Failed to update announcement. Please try again.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      setToast({ message: 'Announcement deleted successfully!', type: 'success' });
      setTimeout(() => {
        setToast(null);
        setShowDeleteConfirm(false);
        setDeleteAnnouncementId(null);
        setSelectedAnnouncement(null);
        loadAnnouncements();
      }, 2000);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setToast({ message: 'Failed to delete announcement. Please try again.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const toggleEmployee = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      target_employee_ids: prev.target_employee_ids.includes(employeeId)
        ? prev.target_employee_ids.filter(id => id !== employeeId)
        : [...prev.target_employee_ids, employeeId]
    }));
  };

  const toggleDepartment = (department: string) => {
    setFormData(prev => ({
      ...prev,
      target_departments: prev.target_departments.includes(department)
        ? prev.target_departments.filter(d => d !== department)
        : [...prev.target_departments, department]
    }));
  };

  const toggleLocation = (location: string) => {
    setFormData(prev => ({
      ...prev,
      target_locations: prev.target_locations.includes(location)
        ? prev.target_locations.filter(l => l !== location)
        : [...prev.target_locations, location]
    }));
  };

  const filteredEmployees = mockEmployees.filter(emp =>
    emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.department.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const getSelectedEmployeeNames = () => {
    return mockEmployees
      .filter(emp => formData.target_employee_ids.includes(emp.id))
      .map(emp => emp.name);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAudienceDescription = (announcement: Announcement) => {
    switch (announcement.targetAudienceType) {
      case 'all_employees':
        return 'All Employees';
      case 'specific_employees':
        return `${announcement.specificEmployeeIds?.length || 0} Specific Employees`;
      case 'departments':
        return announcement.departments?.join(', ') || 'Departments';
      case 'locations':
        return announcement.locations?.join(', ') || 'Locations';
      default:
        return 'Unknown';
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || announcement.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  // Create/Edit Announcement Form View
  if (showCreateForm || showEditForm) {
    return (
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto relative">
        {/* Toast Notification */}
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

        <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
          <div className="flex items-center">
            <button
              onClick={() => {
                setShowCreateForm(false);
                setShowEditForm(false);
                resetForm();
              }}
              className="text-blue-100 hover:text-white transition-colors mr-2.5 p-1 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20"
            >
              <ChevronRight className="h-5 w-5 transform rotate-180" />
            </button>
            <Globe className="h-5 w-5 mr-2" />
            <div>
              <h2 className="text-lg font-bold">{showEditForm ? 'Edit Announcement' : 'Create Announcement'}</h2>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors p-1 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div ref={scrollContainerRef} className="overflow-y-auto p-4 relative" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
                Announcement Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter a clear, concise title"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Content */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
                  Content *
                </label>
                <button
                  type="button"
                  onClick={() => setIsTextareaExpanded(!isTextareaExpanded)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:text-gray-300 transition-colors p-1"
                  title={isTextareaExpanded ? "Collapse" : "Expand"}
                >
                  {isTextareaExpanded ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </button>
              </div>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your announcement content..."
                rows={isTextareaExpanded ? 10 : 3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
                Priority Level
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['low', 'normal', 'high', 'urgent'] as const).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority })}
                    className={`px-3 py-2 rounded-lg border-2 font-medium capitalize transition-all text-sm ${
                      formData.priority === priority
                        ? getPriorityColor(priority) + ' border-current'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
                Target Audience *
              </label>
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, target_audience_type: 'all' })}
                  className={`flex items-center justify-center px-3 py-2 rounded-lg border-2 font-medium transition-all text-sm ${
                    formData.target_audience_type === 'all'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-4 w-4 mr-1.5" />
                  All Employees
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, target_audience_type: 'specific_employees' })}
                  className={`flex items-center justify-center px-3 py-2 rounded-lg border-2 font-medium transition-all text-sm ${
                    formData.target_audience_type === 'specific_employees'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-4 w-4 mr-1.5" />
                  Employees
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, target_audience_type: 'departments' })}
                  className={`flex items-center justify-center px-3 py-2 rounded-lg border-2 font-medium transition-all text-sm ${
                    formData.target_audience_type === 'departments'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Briefcase className="h-4 w-4 mr-1.5" />
                  Departments
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, target_audience_type: 'locations' })}
                  className={`flex items-center justify-center px-3 py-2 rounded-lg border-2 font-medium transition-all text-sm ${
                    formData.target_audience_type === 'locations'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="h-4 w-4 mr-1.5" />
                  Locations
                </button>
              </div>

              {/* Specific Employees Selection */}
              {formData.target_audience_type === 'specific_employees' && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
                    Select Employees
                  </label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      onFocus={() => setShowEmployeeDropdown(true)}
                      placeholder="Search employees..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {formData.target_employee_ids.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Selected: {formData.target_employee_ids.length} employees</p>
                      <div className="flex flex-wrap gap-2">
                        {getSelectedEmployeeNames().map((name) => (
                          <span key={name} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {showEmployeeDropdown && (
                    <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:bg-gray-800">
                      {filteredEmployees.map((employee) => (
                        <label
                          key={employee.id}
                          className="flex items-center px-3 py-2 hover:bg-gray-50 dark:bg-gray-900 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.target_employee_ids.includes(employee.id)}
                            onChange={() => toggleEmployee(employee.id)}
                            className="mr-3 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white dark:text-white">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.department} - {employee.role}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Departments Selection */}
              {formData.target_audience_type === 'departments' && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1.5">
                    Select Departments
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {departments.map((department) => (
                      <label
                        key={department}
                        className="flex items-center px-2.5 py-1.5 hover:bg-white dark:bg-gray-800 dark:bg-gray-800 cursor-pointer rounded border border-gray-200 dark:border-gray-700 dark:border-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={formData.target_departments.includes(department)}
                          onChange={() => toggleDepartment(department)}
                          className="mr-2.5 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-900 dark:text-white dark:text-white text-sm">{department}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Locations Selection */}
              {formData.target_audience_type === 'locations' && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1.5">
                    Select Locations
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {locations.map((location) => (
                      <label
                        key={location}
                        className="flex items-center px-2.5 py-1.5 hover:bg-white dark:bg-gray-800 dark:bg-gray-800 cursor-pointer rounded border border-gray-200 dark:border-gray-700 dark:border-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={formData.target_locations.includes(location)}
                          onChange={() => toggleLocation(location)}
                          className="mr-2.5 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-900 dark:text-white dark:text-white text-sm">{location}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Expiration Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
                Expiration Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Publish Options */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 border border-blue-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.publish_immediately}
                  onChange={(e) => setFormData({ ...formData, publish_immediately: e.target.checked })}
                  className="mr-2.5 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-900 dark:text-white dark:text-white text-sm">Publish immediately</span>
              </label>
            </div>

            {/* Bottom sentinel for intersection observer */}
            <div ref={bottomSentinelRef} className="h-1"></div>
          </div>

          {/* Scroll Indicator */}
          {showScrollIndicator && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce pointer-events-none z-10">
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1 bg-white dark:bg-gray-800 dark:bg-gray-800 px-2 py-1 rounded shadow-sm">
                {fieldsBelow} more field{fieldsBelow !== 1 ? 's' : ''} below
              </span>
              <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
          )}

          {/* Bottom Fade Gradient */}
          {showScrollIndicator && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white to-transparent pointer-events-none"></div>
          )}

          {/* Sticky Action Buttons */}
          <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-800 dark:bg-gray-800 border-t shadow-lg p-3 mt-3">
            <div className="max-w-4xl mx-auto flex gap-2">
              <button
                type="button"
                onClick={showEditForm ? handleUpdateAnnouncement : handleCreateAnnouncement}
                className="flex-1 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center text-sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {showEditForm ? 'Update' : (formData.publish_immediately ? 'Publish' : 'Save Draft')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setShowEditForm(false);
                  resetForm();
                }}
                className="px-5 py-2 bg-gray-200 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View specific announcement
  if (selectedAnnouncement) {
    markAsRead(selectedAnnouncement.id);

    return (
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto relative">
        {/* Toast Notification */}
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white mb-2">Delete Announcement</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete this announcement? This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteAnnouncementId(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteAnnouncementId && handleDeleteAnnouncement(deleteAnnouncementId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
          <div className="flex items-center">
            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="text-blue-100 hover:text-white transition-colors mr-4 p-2 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20"
            >
              <ChevronRight className="h-5 w-5 transform rotate-180" />
            </button>
            <Globe className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Announcement</h2>
              <p className="text-blue-100">{selectedAnnouncement.title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canEditOrDelete() && (
              <>
                <button
                  onClick={() => handleEditAnnouncement(selectedAnnouncement)}
                  className="text-blue-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20"
                  title="Edit"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setDeleteAnnouncementId(selectedAnnouncement.id);
                    setShowDeleteConfirm(true);
                  }}
                  className="text-blue-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20"
                  title="Delete"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </>
            )}
            {onClose && (
              <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20">
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto max-h-96 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedAnnouncement.priority)}`}>
                  {selectedAnnouncement.priority.toUpperCase()} Priority
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                  <Users className="h-4 w-4 inline mr-1" />
                  {getAudienceDescription(selectedAnnouncement)}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white mb-4">{selectedAnnouncement.title}</h1>

              <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{new Date(selectedAnnouncement.createdAt).toLocaleDateString()}</span>
                </div>
                {selectedAnnouncement.expirationDate && (
                  <div className="flex items-center text-orange-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Expires: {new Date(selectedAnnouncement.expirationDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              <div className="text-gray-700 dark:text-gray-300 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {selectedAnnouncement.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main announcements list view
  return (
    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <div className="flex items-center">
          <Globe className="h-8 w-8 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">Company Announcements</h2>
            <p className="text-blue-100">Stay updated with company news and updates</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 dark:bg-gray-800 text-blue-600 rounded-lg hover:bg-blue-50 dark:bg-blue-900/20 transition-colors font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Announcement
          </button>
          {onClose && (
            <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20">
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6 border-b bg-gray-50 dark:bg-gray-900">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="overflow-y-auto max-h-96">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading announcements...</p>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No announcements found</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Announcement
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  onClick={() => setSelectedAnnouncement(announcement)}
                  className="border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md hover:border-blue-300 bg-white dark:bg-gray-800 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(announcement.priority)}`}>
                          {announcement.priority.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-full text-xs">
                          {getAudienceDescription(announcement)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-2">{announcement.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{announcement.content}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsModal;
