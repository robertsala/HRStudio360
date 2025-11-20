import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, Bell, Filter, Search, Plus, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardEscape } from '../hooks/useDashboardEscape';
import { DashboardExitButton } from '../components/DashboardExitButton';
import { useLocation } from 'wouter';

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

const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Reactive URL query parameter parsing for announcementId
  const query = useMemo(() => new URLSearchParams(location.split('?')[1] ?? ''), [location]);
  const announcementIdFromURL = query.get('announcementId');
  
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');

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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userProfile, setUserProfile] = useState<{ department: string; role: string } | null>(null);

  // ESC key handling - close nested modals first before navigating away
  useDashboardEscape(() => {
    if (showCreateForm) {
      setShowCreateForm(false);
      return false;
    }
    if (showEditForm) {
      setShowEditForm(false);
      return false;
    }
    if (selectedAnnouncement) {
      setSelectedAnnouncement(null);
      return false;
    }
    if (showDeleteConfirm) {
      setShowDeleteConfirm(false);
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (user) {
      loadAnnouncements();
      loadUserProfile();
    }
  }, [user]);
  
  // Auto-select announcement from URL when announcements are loaded - react to URL changes
  useEffect(() => {
    if (announcementIdFromURL && announcements.length > 0) {
      // Update selection if URL announcement is different from currently selected one
      if (!selectedAnnouncement || selectedAnnouncement.id !== announcementIdFromURL) {
        const announcement = announcements.find(a => a.id === announcementIdFromURL);
        if (announcement) {
          setSelectedAnnouncement(announcement);
          markAsRead(announcement.id);
        }
      }
    }
  }, [announcementIdFromURL, announcements, selectedAnnouncement]);

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
        expirationDate: formData.expires_at || null
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

  const canEditOrDelete = () => {
    return userProfile?.department === 'HR' || userProfile?.role === 'Product Owner';
  };

  const markAsRead = async (announcementId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/announcements/${announcementId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok && response.status !== 409) {
        throw new Error('Failed to mark announcement as read');
      }
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg w-full min-h-screen overflow-auto">
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
          <Bell className="h-8 w-8 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">Company Announcements</h2>
            <p className="text-blue-100">Stay informed with company-wide updates</p>
          </div>
        </div>
        <DashboardExitButton className="text-blue-100 hover:text-white" />
      </div>

      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-300 bg-white dark:bg-gray-800 dark:text-white"
              data-testid="input-search"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
          {canEditOrDelete() && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              data-testid="button-new-announcement"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto">
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading announcements...</p>
              </div>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No announcements found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  onClick={() => {
                    setSelectedAnnouncement(announcement);
                    markAsRead(announcement.id);
                  }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{announcement.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                          {announcement.priority}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{announcement.content.substring(0, 200)}...</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {getAudienceDescription(announcement)}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {announcement.publicationDate ? new Date(announcement.publicationDate).toLocaleDateString() : 'Draft'}
                        </div>
                      </div>
                    </div>
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

export default AnnouncementsPage;
