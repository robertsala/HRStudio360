import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Message } from '../utils/chatService';

interface ChatNotification {
  id: string;
  message: Message;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
}

interface ChatNotificationBubbleProps {
  onOpenChat: (channelId: string) => void;
}

const ChatNotificationBubble: React.FC<ChatNotificationBubbleProps> = ({ onOpenChat }) => {
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    const handleNewMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      const message: Message = customEvent.detail;

      if (message.sender) {
        const notification: ChatNotification = {
          id: message.id,
          message,
          senderName: `${message.sender.first_name} ${message.sender.last_name}`,
          senderAvatar: message.sender.profile_picture,
          timestamp: new Date(message.created_at)
        };

        setNotifications(prev => [notification, ...prev].slice(0, 3));
        setTotalUnread(prev => prev + 1);

        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
      }
    };

    window.addEventListener('chat:new-message', handleNewMessage);

    return () => {
      window.removeEventListener('chat:new-message', handleNewMessage);
    };
  }, []);

  const handleDismiss = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleBubbleClick = (channelId: string, notificationId: string) => {
    onOpenChat(channelId);
    handleDismiss(notificationId);
    setTotalUnread(prev => Math.max(0, prev - 1));
  };

  return (
    <>
      {/* Notification Bubbles */}
      <div className="fixed bottom-24 right-6 z-50 space-y-3">
        {notifications.map((notification, index) => {
          const initials = notification.senderName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();

          return (
            <div
              key={notification.id}
              className="transform transition-all duration-300 ease-out animate-slide-up"
              style={{
                animation: `slideUp 0.3s ease-out ${index * 0.1}s both`
              }}
            >
              <div
                onClick={() => handleBubbleClick(notification.message.channel_id, notification.id)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 max-w-sm cursor-pointer hover:shadow-3xl transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {notification.senderAvatar ? (
                      <img
                        src={notification.senderAvatar}
                        alt={notification.senderName}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-500"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold ring-2 ring-blue-500 shadow-lg">
                        {initials}
                      </div>
                    )}
                    <div className="absolute h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 -mt-10 ml-9"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {notification.senderName}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(notification.id);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                      {notification.message.decrypted_content || 'New message'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Just now
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Chat Button with Badge */}
      {totalUnread > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => {
              onOpenChat('');
              setTotalUnread(0);
            }}
            className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300"
          >
            <MessageCircle className="h-6 w-6" />
            {totalUnread > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center ring-4 ring-white dark:ring-gray-900 animate-pulse">
                {totalUnread > 99 ? '99+' : totalUnread}
              </div>
            )}
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-out both;
        }
      `}</style>
    </>
  );
};

export default ChatNotificationBubble;
