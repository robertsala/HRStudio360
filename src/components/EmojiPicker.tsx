import React, { useRef, useEffect } from 'react';
import EmojiPickerReact, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  isDarkMode?: boolean;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  isOpen,
  onClose,
  onEmojiSelect,
  isDarkMode = false
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full right-0 mb-2 z-50 shadow-2xl rounded-lg overflow-hidden"
      style={{
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <EmojiPickerReact
        onEmojiClick={handleEmojiClick}
        theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
        height={400}
        width={350}
        searchPlaceHolder="Search emoji..."
        previewConfig={{
          showPreview: false
        }}
      />
    </div>
  );
};

export default EmojiPicker;
