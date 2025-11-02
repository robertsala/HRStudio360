import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Smile, Paperclip } from 'lucide-react';
import { enhancedChatService, MessageThread } from '../../utils/enhancedChatService';
import { chatService, Message } from '../../utils/chatService';
import MessageReactions from './MessageReactions';
import { useAuth } from '../../contexts/AuthContext';

interface ThreadViewProps {
  parentMessage: Message;
  channelId: string;
  onClose: () => void;
}

const ThreadView: React.FC<ThreadViewProps> = ({ parentMessage, channelId, onClose }) => {
  const { user } = useAuth();
  const [thread, setThread] = useState<MessageThread | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyInput, setReplyInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadThread();
  }, [parentMessage.id]);

  useEffect(() => {
    scrollToBottom();
  }, [replies]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadThread = async () => {
    let existingThread = await enhancedChatService.getThread(parentMessage.id);

    if (!existingThread) {
      existingThread = await enhancedChatService.createThread(parentMessage.id, channelId);
    }

    if (existingThread) {
      setThread(existingThread);
      const threadReplies = await enhancedChatService.getThreadMessages(existingThread.id);
      setReplies(threadReplies);
    }
  };

  const handleSendReply = async () => {
    if (!replyInput.trim() || !thread || !user || isSending) return;

    setIsSending(true);

    try {
      await chatService.sendMessage(channelId, replyInput, {
        threadId: thread.id,
        replyToMessageId: parentMessage.id
      });

      setReplyInput('');
      await loadThread();
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-2xl z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Thread</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {thread?.reply_count || 0} {thread?.reply_count === 1 ? 'reply' : 'replies'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="group">
          <div className="flex items-start space-x-3">
            {parentMessage.sender?.profile_picture ? (
              <img
                src={parentMessage.sender.profile_picture}
                alt={parentMessage.sender.first_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {parentMessage.sender?.first_name?.[0] || '?'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline space-x-2">
                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                  {parentMessage.sender?.first_name} {parentMessage.sender?.last_name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(parentMessage.created_at)}
                </span>
              </div>

              <div className="mt-1 text-gray-700 dark:text-gray-300 text-sm break-words">
                {parentMessage.decrypted_content}
              </div>

              {user && (
                <MessageReactions messageId={parentMessage.id} currentUserId={user.id} />
              )}
            </div>
          </div>
        </div>

        {replies.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
            {replies.map((reply) => (
              <div key={reply.id} className="group flex items-start space-x-3">
                {reply.sender?.profile_picture ? (
                  <img
                    src={reply.sender.profile_picture}
                    alt={reply.sender.first_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold text-xs">
                    {reply.sender?.first_name?.[0] || '?'}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline space-x-2">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {reply.sender?.first_name} {reply.sender?.last_name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(reply.created_at)}
                    </span>
                  </div>

                  <div className="mt-1 text-gray-700 dark:text-gray-300 text-sm break-words">
                    {reply.decrypted_content}
                  </div>

                  {user && (
                    <MessageReactions messageId={reply.id} currentUserId={user.id} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <textarea
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Reply to thread..."
              className="w-full px-3 py-2 bg-transparent resize-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={3}
            />
          </div>

          <button
            onClick={handleSendReply}
            disabled={!replyInput.trim() || isSending}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreadView;
