import React, { useState, useRef, useEffect } from 'react';

interface ResizableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

const ResizableModal: React.FC<ResizableModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  initialWidth = 800,
  initialHeight = 600,
  minWidth = 400,
  minHeight = 300,
  maxWidth = window.innerWidth - 40,
  maxHeight = window.innerHeight - 40,
  className = '',
  headerClassName = '',
  bodyClassName = ''
}) => {
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });

  useEffect(() => {
    if (isOpen) {
      const centerX = (window.innerWidth - initialWidth) / 2;
      const centerY = (window.innerHeight - initialHeight) / 2;
      setPosition({ x: centerX, y: centerY });
      setSize({ width: initialWidth, height: initialHeight });
    }
  }, [isOpen, initialWidth, initialHeight]);

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize', direction?: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (action === 'drag') {
      setIsDragging(true);
      dragStartPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    } else if (action === 'resize' && direction) {
      setIsResizing(true);
      setResizeDirection(direction);
      resizeStartPos.current = { x: e.clientX, y: e.clientY };
      resizeStartSize.current = { ...size };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStartPos.current.x;
        const newY = e.clientY - dragStartPos.current.y;

        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStartPos.current.x;
        const deltaY = e.clientY - resizeStartPos.current.y;

        let newWidth = resizeStartSize.current.width;
        let newHeight = resizeStartSize.current.height;
        let newX = position.x;
        let newY = position.y;

        if (resizeDirection.includes('e')) {
          newWidth = resizeStartSize.current.width + deltaX;
        }
        if (resizeDirection.includes('w')) {
          newWidth = resizeStartSize.current.width - deltaX;
          newX = position.x + deltaX;
        }
        if (resizeDirection.includes('s')) {
          newHeight = resizeStartSize.current.height + deltaY;
        }
        if (resizeDirection.includes('n')) {
          newHeight = resizeStartSize.current.height - deltaY;
          newY = position.y + deltaY;
        }

        newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

        if (resizeDirection.includes('w')) {
          newX = position.x + (resizeStartSize.current.width - newWidth);
        }
        if (resizeDirection.includes('n')) {
          newY = position.y + (resizeStartSize.current.height - newHeight);
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isDragging ? 'move' : getResizeCursor(resizeDirection);
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, isResizing, position, size, resizeDirection, minWidth, minHeight, maxWidth, maxHeight]);

  const getResizeCursor = (direction: string): string => {
    const cursors: { [key: string]: string } = {
      n: 'ns-resize',
      s: 'ns-resize',
      e: 'ew-resize',
      w: 'ew-resize',
      ne: 'nesw-resize',
      nw: 'nwse-resize',
      se: 'nwse-resize',
      sw: 'nesw-resize'
    };
    return cursors[direction] || 'default';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col ${className}`}
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          maxWidth: `${maxWidth}px`,
          maxHeight: `${maxHeight}px`
        }}
      >
        {/* Resize Handles */}
        <div
          className="absolute top-0 left-0 w-full h-2 cursor-ns-resize"
          onMouseDown={(e) => handleMouseDown(e, 'resize', 'n')}
        />
        <div
          className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize"
          onMouseDown={(e) => handleMouseDown(e, 'resize', 's')}
        />
        <div
          className="absolute top-0 left-0 w-2 h-full cursor-ew-resize"
          onMouseDown={(e) => handleMouseDown(e, 'resize', 'w')}
        />
        <div
          className="absolute top-0 right-0 w-2 h-full cursor-ew-resize"
          onMouseDown={(e) => handleMouseDown(e, 'resize', 'e')}
        />
        <div
          className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize"
          onMouseDown={(e) => handleMouseDown(e, 'resize', 'nw')}
        />
        <div
          className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize"
          onMouseDown={(e) => handleMouseDown(e, 'resize', 'ne')}
        />
        <div
          className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize"
          onMouseDown={(e) => handleMouseDown(e, 'resize', 'sw')}
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
          onMouseDown={(e) => handleMouseDown(e, 'resize', 'se')}
        />

        {/* Header - Draggable */}
        {title && (
          <div
            className={`flex-shrink-0 cursor-move select-none ${headerClassName}`}
            onMouseDown={(e) => handleMouseDown(e, 'drag')}
          >
            {title}
          </div>
        )}

        {/* Body - Scrollable */}
        <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ResizableModal;
