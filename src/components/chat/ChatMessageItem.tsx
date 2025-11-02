import React, { useState, useEffect } from 'react';
import { MoreVertical, Reply, Edit2, Trash2, Pin, Bookmark, Copy, Forward, MessageSquare, Smile } from 'lucide-react';
import { Message, chatService } from '../../utils/chatService';
import EmojiPicker from '../EmojiPicker';

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
}

interface ChatMessageItemProps {
  message: Message;
  currentUserId: string;
  senderName?: string;
  senderAvatar?: string;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onSave?: () => void;
  onOpenThread?: () => void;
  isPinned?: boolean;
  isSaved?: boolean;
  threadCount?: number;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  currentUserId,
  senderName = 'Unknown User',
  senderAvatar,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onSave,
  onOpenThread,
  isPinned = false,
  isSaved = false,
  threadCount = 0
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  const isOwnMessage = message.sender_id === currentUserId;

  useEffect(() => {
    loadReactions();
  }, [message.id]);

  const loadReactions = async () => {
    try {
      const reactionList = await chatService.getMessageReactions(message.id);
      setReactions(reactionList);
    } catch (error) {
      console.error('Failed to load reactions:', error);
    }
  };

  const handleAddReaction = async (emoji: string) => {
    try {
      await chatService.addReaction(message.id, emoji);
      setShowEmojiPicker(false);
      await loadReactions();
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleRemoveReaction = async (emoji: string) => {
    try {
      await chatService.removeReaction(message.id, emoji);
      await loadReactions();
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  };

  const handleToggleReaction = async (emoji: string) => {
    const userReaction = reactions.find(r => r.user_id === currentUserId && r.emoji === emoji);
    if (userReaction) {
      await handleRemoveReaction(emoji);
    } else {
      await handleAddReaction(emoji);
    }
  };

  const groupReactions = () => {
    const grouped = new Map<string, { count: number; users: string[]; hasCurrentUser: boolean }>();

    reactions.forEach(reaction => {
      const existing = grouped.get(reaction.emoji) || { count: 0, users: [], hasCurrentUser: false };
      grouped.set(reaction.emoji, {
        count: existing.count + 1,
        users: [...existing.users, reaction.user_id],
        hasCurrentUser: existing.hasCurrentUser || reaction.user_id === currentUserId
      });
    });

    return Array.from(grouped.entries()).map(([emoji, data]) => ({
      emoji,
      ...data
    }));
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

  const groupedReactions = groupReactions();

  return (
    <div
      className="group relative px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {senderAvatar ? (
            <img src={senderAvatar} alt={senderName} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {senderName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {senderName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(message.created_at)}
            </span>
            {message.edited_at && (
              <span className="text-xs text-gray-400 dark:text-gray-500">(edited)</span>
            )}
            {isPinned && (
              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                <Pin className="w-3 h-3" />
                <span>Pinned</span>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
            {message.encrypted_content}
          </div>

          {message.file_url && (
            <div className="mt-2">
              {message.message_type === 'file' && message.file_name && (
                <a
                  href={message.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {message.file_name}
                  </span>
                  {message.file_size && (
                    <span className="text-xs text-gray-500">
                      ({(message.file_size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </a>
              )}
            </div>
          )}

          {groupedReactions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {groupedReactions.map(({ emoji, count, hasCurrentUser }) => (
                <button
                  key={emoji}
                  onClick={() => handleToggleReaction(emoji)}
                  className={`
                    inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all
                    ${hasCurrentUser
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400'
                      : 'bg-gray-100 dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <span>{emoji}</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {count}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Smile className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}

          {threadCount > 0 && onOpenThread && (
            <button
              onClick={onOpenThread}
              className="mt-2 inline-flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{threadCount} {threadCount === 1 ? 'reply' : 'replies'}</span>
            </button>
          )}
        </div>

        {isHovered && (
          <div className="absolute top-0 right-4 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg px-1 py-1">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Add reaction"
            >
              <Smile className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>

            {onReply && (
              <button
                onClick={onReply}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Reply in thread"
              >
                <Reply className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}

            {onPin && (
              <button
                onClick={onPin}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title={isPinned ? 'Unpin message' : 'Pin message'}
              >
                <Pin className={`w-4 h-4 ${isPinned ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </button>
            )}

            {onSave && (
              <button
                onClick={onSave}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title={isSaved ? 'Remove from saved' : 'Save message'}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'text-yellow-600 dark:text-yellow-400 fill-current' : 'text-gray-600 dark:text-gray-400'}`} />
              </button>
            )}

            {isOwnMessage && onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Edit message"
              >
                <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}

            {isOwnMessage && onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Delete message"
              >
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
              </button>
            )}

            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {showEmojiPicker && (
        <div className="absolute z-50 mt-2" style={{ left: '60px' }}>
          <EmojiPicker
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onEmojiSelect={(emoji) => {
              handleAddReaction(emoji);
              setShowEmojiPicker(false);
            }}
            isDarkMode={document.documentElement.classList.contains('dark')}
          />
        </div>
      )}
    </div>
  );
};

export default ChatMessageItem;
