import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, CheckCircle, Info, Clock, Trash2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionRequired: boolean;
  actionType?: 'benefits' | 'compliance' | 'security' | 'review';
}

interface NotificationsModalProps {
  onTakeAction?: (actionType: string) => void;
  onClose?: () => void;
}

const getMockNotifications = (t: any): Notification[] => [
  {
    id: '1',
    title: t('notifications.payrollProcessingComplete'),
    message: 'December payroll has been successfully processed for all 247 employees.',
    type: 'success',
    timestamp: '2025-01-10T09:30:00Z',
    read: false,
    actionRequired: false
  },
  {
    id: '2',
    title: t('notifications.benefitsEnrollmentDeadline'),
    message: 'Reminder: Open enrollment period ends in 5 days. 12 employees have not completed their enrollment.',
    type: 'warning',
    timestamp: '2025-01-09T14:15:00Z',
    read: false,
    actionRequired: true,
    actionType: 'benefits'
  },
  {
    id: '3',
    title: t('notifications.newComplianceUpdate'),
    message: 'New labor law changes effective February 1st. Review required for California operations.',
    type: 'info',
    timestamp: '2025-01-08T11:45:00Z',
    read: true,
    actionRequired: true,
    actionType: 'compliance'
  },
  {
    id: '4',
    title: t('notifications.systemMaintenanceScheduled'),
    message: 'Planned maintenance window: January 15th, 2:00 AM - 4:00 AM EST. Limited system access expected.',
    type: 'info',
    timestamp: '2025-01-07T16:20:00Z',
    read: true,
    actionRequired: false
  },
  {
    id: '5',
    title: t('notifications.failedLoginAttempts'),
    message: 'Multiple failed login attempts detected for user account: john.doe@company.com',
    type: 'error',
    timestamp: '2025-01-06T22:10:00Z',
    read: false,
    actionRequired: true,
    actionType: 'security'
  }
];

const NotificationsModal: React.FC<NotificationsModalProps> = ({ onTakeAction, onClose }) => {
  const { t } = useTranslation();
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const { user } = useAuth();
  const [notifications, setNotifications] = useState(getMockNotifications(t));
  const [collaborationNotifications, setCollaborationNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    loadCollaborationNotifications();
  }, []);

  const loadCollaborationNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('collaboration_notifications')
        .select(`
          *,
          collaborator:collaborator_id (
            candidate_id,
            role,
            status,
            candidate:candidate_id (
              name,
              position
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollaborationNotifications(data || []);
    } catch (error) {
      console.error('Error loading collaboration notifications:', error);
    }
  };

  const handleAcceptInvitation = async (collaboratorId: string, notificationId: string) => {
    try {
      const { error } = await supabase
        .from('candidate_collaborators')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', collaboratorId);

      if (error) throw error;

      await supabase
        .from('collaboration_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      await loadCollaborationNotifications();
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleDeclineInvitation = async (collaboratorId: string, notificationId: string) => {
    try {
      const { error } = await supabase
        .from('candidate_collaborators')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', collaboratorId);

      if (error) throw error;

      await supabase
        .from('collaboration_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      await loadCollaborationNotifications();
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'Unread') return !notification.read;
    if (filter === t('dashboard.actionRequired')) return notification.actionRequired;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />;
      default: return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const handleTakeAction = (notification: Notification) => {
    markAsRead(notification.id);

    if (onTakeAction && notification.actionType) {
      onTakeAction(notification.actionType);
    } else {
      alert('Action acknowledged. This notification has been marked as read.');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return t('notifications.justNow');
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">Notifications</h2>
          <p className="text-gray-600 dark:text-gray-400">{unreadCount} unread notifications</p>
        </div>
      </div>

      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Bell className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Notifications</option>
              <option value="Unread">Unread Only</option>
              <option value={t('dashboard.actionRequired')}>{t('dashboard.actionRequired')}</option>
            </select>
          </div>
          <button
            onClick={markAllAsRead}
            className="text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
          >
            Mark All as Read
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-96">
        <div className="p-6">
          {/* Collaboration Notifications */}
          {collaborationNotifications.filter(n => !n.read && n.notification_type === 'invitation').length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Collaboration Invitations
              </h3>
              <div className="space-y-4">
                {collaborationNotifications
                  .filter(n => !n.read && n.notification_type === 'invitation')
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className="border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 ring-2 ring-purple-100 dark:ring-purple-800"
                    >
                      <div className="flex items-start space-x-3">
                        <Users className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Collaboration Invitation</h3>
                            <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-xs rounded-full font-medium">
                              Action Required
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mt-1">{notification.message}</p>
                          {notification.collaborator?.candidate && (
                            <div className="mt-2 bg-white dark:bg-gray-800 rounded p-2 border border-purple-200 dark:border-purple-700">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Candidate:</span> {notification.collaborator.candidate.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Position:</span> {notification.collaborator.candidate.position}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Your Role:</span> {notification.collaborator.role.replace('_', ' ')}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center space-x-2 mt-3">
                            <button
                              onClick={() => handleAcceptInvitation(notification.collaborator_id, notification.id)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleDeclineInvitation(notification.collaborator_id, notification.id)}
                              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Regular Notifications */}
          {filteredNotifications.length === 0 && collaborationNotifications.filter(n => !n.read).length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No notifications to display</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-l-4 rounded-lg p-4 ${getNotificationColor(notification.type)} ${
                    !notification.read ? 'ring-2 ring-blue-100' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white">{notification.title}</h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                          {notification.actionRequired && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                              Action Required
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 mt-1">{notification.message}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatTimestamp(notification.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {notification.actionRequired && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 dark:border-gray-700">
                      <button
                        onClick={() => handleTakeAction(notification)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Take Action
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;