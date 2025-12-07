import { MessageCircle } from 'lucide-react';

interface PresenceIndicatorProps {
  status: 'online' | 'away' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  showChatIcon?: boolean;
  className?: string;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  status,
  size = 'md',
  showChatIcon = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400'
  };

  const statusTitles = {
    online: 'Online - Available to chat',
    away: 'Away - May be delayed',
    offline: 'Offline - Not available'
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} title={statusTitles[status]}>
      <span 
        className={`${sizeClasses[size]} ${statusColors[status]} rounded-full border-2 border-white dark:border-gray-800 shadow-sm ${status === 'online' ? 'animate-pulse' : ''}`}
        data-testid={`presence-indicator-${status}`}
      />
      {showChatIcon && status === 'online' && (
        <MessageCircle className="w-3 h-3 text-green-500" />
      )}
    </div>
  );
};

export default PresenceIndicator;
