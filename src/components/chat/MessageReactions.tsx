import React, { useState, useEffect } from 'react';
import { Smile, Plus } from 'lucide-react';
import { enhancedChatService, MessageReaction } from '../../utils/enhancedChatService';
import EmojiPicker from '../EmojiPicker';

interface MessageReactionsProps {
  messageId: string;
  currentUserId: string;
}

const MessageReactions: React.FC<MessageReactionsProps> = ({ messageId, currentUserId }) => {
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    loadReactions();
  }, [messageId]);

  const loadReactions = async () => {
    const data = await enhancedChatService.getMessageReactions(messageId);
    setReactions(data);
  };

  const handleAddReaction = async (emoji: string) => {
    await enhancedChatService.addReaction(messageId, emoji);
    setShowEmojiPicker(false);
    loadReactions();
  };

  const handleToggleReaction = async (emoji: string) => {
    const userReaction = reactions.find(r => r.emoji === emoji && r.user_id === currentUserId);

    if (userReaction) {
      await enhancedChatService.removeReaction(messageId, emoji);
    } else {
      await enhancedChatService.addReaction(messageId, emoji);
    }

    loadReactions();
  };

  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {Object.entries(groupedReactions).map(([emoji, emojiReactions]) => {
        const hasUserReacted = emojiReactions.some(r => r.user_id === currentUserId);
        const userNames = emojiReactions.map(r =>
          r.user ? `${r.user.first_name} ${r.user.last_name}` : 'Someone'
        ).join(', ');

        return (
          <button
            key={emoji}
            onClick={() => handleToggleReaction(emoji)}
            className={`group flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all ${
              hasUserReacted
                ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                : 'bg-gray-100 dark:bg-gray-800 border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            title={userNames}
          >
            <span className="text-base">{emoji}</span>
            <span className={`text-xs font-medium ${
              hasUserReacted ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {emojiReactions.length}
            </span>
          </button>
        );
      })}

      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
          title="Add reaction"
        >
          <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 mb-2 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <EmojiPicker
                onEmojiSelect={handleAddReaction}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;
