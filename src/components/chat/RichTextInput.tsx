import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Code, List, ListOrdered, Link as LinkIcon, Smile, Paperclip, Send, AtSign, Hash } from 'lucide-react';
import EmojiPicker from '../EmojiPicker';

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFileAttach?: () => void;
  placeholder?: string;
  disabled?: boolean;
  onMentionSearch?: (query: string) => void;
  onChannelSearch?: (query: string) => void;
}

const RichTextInput: React.FC<RichTextInputProps> = ({
  value,
  onChange,
  onSubmit,
  onFileAttach,
  placeholder = 'Type a message...',
  disabled = false,
  onMentionSearch,
  onChannelSearch
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    adjustTextareaHeight();
  }, [value]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  const insertFormatting = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }

    if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      insertFormatting('**', '**');
    }

    if (e.key === 'i' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      insertFormatting('_', '_');
    }

    if (e.key === '@') {
      if (onMentionSearch) {
        onMentionSearch('');
      }
    }

    if (e.key === '#') {
      if (onChannelSearch) {
        onChannelSearch('');
      }
    }
  };

  const handleEmojiClick = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + emoji + value.substring(start);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + emoji.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);

    setShowEmojiPicker(false);
  };

  return (
    <div className="relative">
      <div className="flex flex-col border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500">
        {showToolbar && (
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**')}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('_', '_')}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('`', '`')}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Code"
            >
              <Code className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            <button
              type="button"
              onClick={() => insertFormatting('\n- ')}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Bullet list"
            >
              <List className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('\n1. ')}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Numbered list"
            >
              <ListOrdered className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('[', '](url)')}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Link"
            >
              <LinkIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowToolbar(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 resize-none focus:outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 min-h-[60px]"
          style={{ maxHeight: '200px' }}
        />

        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-1">
            {onFileAttach && (
              <button
                type="button"
                onClick={onFileAttach}
                disabled={disabled}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
              title="Add emoji"
            >
              <Smile className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('@')}
              disabled={disabled}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
              title="Mention user"
            >
              <AtSign className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('#')}
              disabled={disabled}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
              title="Reference channel"
            >
              <Hash className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Enter</kbd> to send,{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Shift+Enter</kbd> for new line
            </span>
            <button
              type="button"
              onClick={onSubmit}
              disabled={disabled || !value.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-md transition-colors disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 left-0 z-50">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}
    </div>
  );
};

export default RichTextInput;
