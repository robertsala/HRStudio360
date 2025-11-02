import React, { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { changeLogService } from '../utils/changeLogService';
import { useAuth } from '../contexts/AuthContext';

interface ChangeLogNotificationBadgeProps {
  onClick?: () => void;
}

const ChangeLogNotificationBadge: React.FC<ChangeLogNotificationBadgeProps> = ({ onClick }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (user?.id) {
      const count = await changeLogService.getUnreadChangesCount(user.id);
      setUnreadCount(count);
    }
  };

  if (unreadCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={`${unreadCount} unread ${unreadCount === 1 ? 'change' : 'changes'}`}
    >
      <ScrollText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default ChangeLogNotificationBadge;
