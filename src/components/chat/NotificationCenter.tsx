import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, MessageSquare, AtSign, Heart, Mail, UserPlus } from 'lucide-react';
import { UserNotification, enhancedChatFeatures } from '../../utils/enhancedChatFeatures';

interface NotificationCenterProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick?: (notification: UserNotification) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  isOpen,
  onClose,
  onNotificationClick
}) => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();

      const subscription = enhancedChatFeatures.subscribeToNotifications(userId, (notification) => {
        setNotifications(prev => [notification, ...prev]);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isOpen, userId, filter]);

  const loadNotifications = async () => {
    setIsLoading(true);
    const notifs = await enhancedChatFeatures.getUserNotifications(userId, filter === 'unread');
    setNotifications(notifs);
    setIsLoading(false);
  };

  const handleMarkRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await enhancedChatFeatures.markNotificationRead(notificationId);
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, is_read: true } : n
    ));
  };

  const handleMarkAllRead = async () => {
    await enhancedChatFeatures.markAllNotificationsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleNotificationClick = (notification: UserNotification) => {
    if (!notification.is_read) {
      enhancedChatFeatures.markNotificationRead(notification.id);
      setNotifications(prev => prev.map(n =>
        n.id === notification.id ? { ...n, is_read: true } : n
      ));
    }

    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return <AtSign className="w-5 h-5 text-blue-500" />;
      case 'reply':
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'reaction':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'direct_message':
        return <Mail className="w-5 h-5 text-purple-500" />;
      case 'channel_invite':
        return <UserPlus className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationText = (notification: UserNotification) => {
    switch (notification.type) {
      case 'mention':
        return 'mentioned you in a message';
      case 'reply':
        return 'replied to your message';
      case 'reaction':
        return 'reacted to your message';
      case 'direct_message':
        return 'sent you a direct message';
      case 'channel_invite':
        return 'invited you to a channel';
      default:
        return 'sent you a notification';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-4">
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[600px]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Unread
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
                    ${notification.is_read
                      ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                      : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    }
                  `}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-semibold">Someone</span>
                      {' '}
                      {getNotificationText(notification)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <button
                      onClick={(e) => handleMarkRead(notification.id, e)}
                      className="flex-shrink-0 p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-md transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </button>
                  )}

                  {!notification.is_read && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full" />
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

export default NotificationCenter;
