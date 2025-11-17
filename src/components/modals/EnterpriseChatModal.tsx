import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Users, Search, Plus, Hash, Send, Paperclip, Smile, Phone, Video, Settings, Bot, CheckCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { chatService, Channel, Message, ChannelMember } from '../../utils/chatService';
import { useUserPresence } from '../../hooks/useUserPresence';
import NewChannelModal from './NewChannelModal';
import EmojiPicker from '../EmojiPicker';
import CallModal from './CallModal';
import { callingService, CallSession } from '../../utils/callingService';

interface EnterpriseChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialChannelId?: string;
}

const EnterpriseChatModal: React.FC<EnterpriseChatModalProps> = ({ isOpen, onClose, initialChannelId }) => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [channelCreationProgress, setChannelCreationProgress] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any | null>(null);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializationAttempted = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const allUserIds = channels.flatMap(c => c.members?.map(m => m.user_id) || []).filter((id, idx, arr) => arr.indexOf(id) === idx);
  const { getPresenceStatus } = useUserPresence(allUserIds);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoSelectedAI = useRef(false);

  useEffect(() => {
    if (isOpen && user) {
      initializeChat();

      const subscription = callingService.subscribeToIncomingCalls(user.id, (call) => {
        setIncomingCall(call);
      });

      return () => {
        subscription?.unsubscribe();
      };
    } else if (!isOpen) {
      initializationAttempted.current = false;
      setIsCreatingChannel(false);
      setChannelCreationProgress('');
    }

    return () => {
      if (user && !isOpen) {
        chatService.cleanup();
      }
    };
  }, [isOpen, user]);

  useEffect(() => {
    if (initialChannelId && channels.length > 0) {
      const channel = channels.find(c => c.id === initialChannelId);
      if (channel) {
        handleSelectChannel(channel);
      }
    }
  }, [initialChannelId, channels]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
      messageInputRef.current.style.height = `${Math.min(messageInputRef.current.scrollHeight, 120)}px`;
    }
  }, [messageInput]);

  useEffect(() => {
    const handleNewMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      const message: Message = customEvent.detail;

      if (selectedChannel && message.channel_id === selectedChannel.id) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === message.id);
          if (exists) {
            return prev;
          }
          
          const tempFromSender = prev.filter(m => 
            m.id.startsWith('temp-') && m.sender_id === message.sender_id
          );
          
          if (tempFromSender.length > 0) {
            const oldestTemp = tempFromSender.sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )[0];
            
            const updated = prev.map(m => m.id === oldestTemp.id ? message : m);
            return updated.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          }
          
          const updated = [...prev, message];
          return updated.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        });
      }

      loadChannels();
    };

    const handleTyping = (event: Event) => {
      const customEvent = event as CustomEvent;
      const indicator = customEvent.detail;

      if (selectedChannel && indicator.channel_id === selectedChannel.id) {
        updateTypingIndicators();
      }
    };

    const handlePresence = (event: Event) => {
      const customEvent = event as CustomEvent;
      const presence = customEvent.detail;

      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (presence.status === 'online') {
          newSet.add(presence.user_id);
        } else {
          newSet.delete(presence.user_id);
        }
        return newSet;
      });
    };

    const handleChannelCreated = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const newChannel: Channel = customEvent.detail;

      console.log('New channel created:', newChannel);

      if (newChannel.channel_type === 'ai_assistant') {
        setChannelCreationProgress('Your AI Assistant is ready!');
      }

      await loadChannels();

      if (newChannel.channel_type === 'ai_assistant') {
        setTimeout(async () => {
          await handleSelectChannel(newChannel);
          setIsCreatingChannel(false);
          setChannelCreationProgress('');
        }, 1000);
      } else {
        setIsCreatingChannel(false);
      }
    };

    const handleAIChannelProgress = (event: Event) => {
      const customEvent = event as CustomEvent;
      setChannelCreationProgress(customEvent.detail);
    };

    const handleCreatingAIChannel = () => {
      setIsCreatingChannel(true);
      setChannelCreationProgress('Setting up your AI Assistant...');
    };

    const handleChannelsReady = () => {
      setIsCreatingChannel(false);
      setChannelCreationProgress('');
    };

    const handleChannelError = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.error('Channel error:', customEvent.detail);
      setChannelCreationProgress('Unable to set up chat. Please refresh and try again.');
      setTimeout(() => {
        setIsCreatingChannel(false);
        setChannelCreationProgress('');
      }, 3000);
    };

    window.addEventListener('chat:new-message', handleNewMessage);
    window.addEventListener('chat:typing', handleTyping);
    window.addEventListener('chat:presence', handlePresence);
    window.addEventListener('chat:channel-created', handleChannelCreated);
    window.addEventListener('chat:ai-channel-progress', handleAIChannelProgress);
    window.addEventListener('chat:creating-ai-channel', handleCreatingAIChannel);
    window.addEventListener('chat:channels-ready', handleChannelsReady);
    window.addEventListener('chat:channel-creation-error', handleChannelError);
    window.addEventListener('chat:channel-check-error', handleChannelError);

    return () => {
      window.removeEventListener('chat:new-message', handleNewMessage);
      window.removeEventListener('chat:typing', handleTyping);
      window.removeEventListener('chat:presence', handlePresence);
      window.removeEventListener('chat:channel-created', handleChannelCreated);
      window.removeEventListener('chat:ai-channel-progress', handleAIChannelProgress);
      window.removeEventListener('chat:creating-ai-channel', handleCreatingAIChannel);
      window.removeEventListener('chat:channels-ready', handleChannelsReady);
      window.removeEventListener('chat:channel-creation-error', handleChannelError);
      window.removeEventListener('chat:channel-check-error', handleChannelError);
    };
  }, [selectedChannel]);

  const initializeChat = async () => {
    if (!user || initializationAttempted.current) return;

    initializationAttempted.current = true;

    try {
      setIsLoading(true);
      setIsCreatingChannel(true);
      setChannelCreationProgress('Connecting to chat system...');

      console.log('Starting chat initialization for user:', user.id);

      await chatService.initialize(user.id);

      setChannelCreationProgress('Loading your channels...');
      await loadChannels();

      const channels = await chatService.getChannels();
      console.log('Loaded channels:', channels.length);

      if (channels.length === 0) {
        setChannelCreationProgress('Waiting for AI Assistant setup...');
        // Wait for AI channel creation
        await new Promise(resolve => setTimeout(resolve, 2000));
        await loadChannels();

        // Check again after waiting
        const recheckChannels = await chatService.getChannels();
        if (recheckChannels.length === 0) {
          console.warn('No channels available after initialization');
          setChannelCreationProgress('Chat is ready! Click "New Channel" to start a conversation.');
        } else {
          console.log('Channels loaded successfully:', recheckChannels.length);
          setChannelCreationProgress('Welcome! Your chat is ready.');
        }
      } else {
        console.log('Channels loaded on first check:', channels.length);
        setChannelCreationProgress('Welcome! Your chat is ready.');
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('Profile') || errorMessage.includes('profile')) {
        setChannelCreationProgress('Your profile is being set up. Please refresh in a moment.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
        setChannelCreationProgress('Permission error. Please contact support if this persists.');
      } else {
        setChannelCreationProgress(`Chat initialization failed: ${errorMessage}. Please refresh and try again.`);
      }
    } finally {
      setIsLoading(false);
      // Don't auto-dismiss - let the first visit logic or user interaction handle it
      // This ensures users see the AI Assistant welcome screen properly
    }
  };

  const loadChannels = async () => {
    try {
      console.log('Loading channels...');
      const loadedChannels = await chatService.getChannels();
      console.log('Channels loaded:', loadedChannels.length);
      setChannels(loadedChannels);

      if (!initialChannelId && loadedChannels.length > 0 && !selectedChannel) {
        const hasVisitedChatKey = `chat_first_visit_${user?.id}`;
        const hasVisitedBefore = localStorage.getItem(hasVisitedChatKey);

        if (!hasVisitedBefore) {
          const aiChannel = loadedChannels.find(c => c.channel_type === 'ai_assistant');
          if (aiChannel) {
            localStorage.setItem(hasVisitedChatKey, 'true');
            // Clear the loading state and progress to show the welcome screen
            setIsCreatingChannel(false);
            setChannelCreationProgress('');
            // Auto-select AI channel after a brief moment to ensure UI is ready
            setTimeout(async () => {
              await handleSelectChannel(aiChannel);
            }, 500);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  const handleSelectChannel = async (channel: Channel) => {
    setSelectedChannel(channel);
    setMessages([]);

    try {
      const channelMessages = await chatService.getMessages(channel.id);
      setMessages(channelMessages);
      await chatService.markAsRead(channel.id);
      await loadChannels();
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChannel || isSending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    const nameParts = (user?.name || 'You').split(' ');
    const tempMessage = {
      id: 'temp-' + Date.now(),
      channel_id: selectedChannel.id,
      sender_id: user?.id || '',
      encrypted_content: content,
      decrypted_content: content,
      message_type: 'text' as const,
      file_url: null,
      file_name: null,
      file_size: null,
      reply_to_message_id: null,
      edited_at: null,
      deleted_at: null,
      created_at: new Date().toISOString(),
      sender: {
        id: user?.id || '',
        firstName: nameParts[0] || 'You',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user?.email || '',
        profilePicture: user?.profilePicture,
      }
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      await chatService.setTyping(selectedChannel.id, false);

      const newMessage = await chatService.sendMessage(
        selectedChannel.id,
        content,
        'text'
      );

      setMessages(prev => {
        const withoutDuplicates = prev.filter(msg => 
          msg.id !== tempMessage.id && msg.id !== newMessage.id
        );
        const updated = [...withoutDuplicates, newMessage];
        return updated.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      });
      
      await loadChannels();
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setMessageInput(content);

      setErrorNotification('Failed to send message. Please check your connection and try again.');
      setTimeout(() => setErrorNotification(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (value: string) => {
    setMessageInput(value);

    if (selectedChannel && value.trim()) {
      chatService.setTyping(selectedChannel.id, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        chatService.setTyping(selectedChannel.id, false);
      }, 3000);
    } else if (selectedChannel) {
      chatService.setTyping(selectedChannel.id, false);
    }
  };

  const handleStartCall = async (callType: 'voice' | 'video') => {
    if (!selectedChannel) return;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support audio/video calls. Please use a modern browser like Chrome, Firefox, or Edge.');
        return;
      }

      const constraints = callType === 'video'
        ? { audio: true, video: true }
        : { audio: true, video: false };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionError) {
        alert(`Permission denied: Please allow ${callType} access in your browser settings to make calls.`);
        return;
      }

      const session = await callingService.startCall(selectedChannel.id, callType);
      setActiveCall(session);
      setShowCallModal(true);
    } catch (error) {
      console.error('Error starting call:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start call';
      alert(`Unable to start call: ${errorMessage}. Please check your internet connection and try again.`);
    }
  };

  const handleAcceptIncomingCall = () => {
    if (!incomingCall) return;
    setActiveCall(incomingCall.call_session);
    setShowCallModal(true);
    setIncomingCall(null);
  };

  const handleDeclineIncomingCall = async () => {
    if (!incomingCall) return;
    try {
      await callingService.declineCall(incomingCall.call_session.id);
      setIncomingCall(null);
    } catch (error) {
      console.error('Error declining call:', error);
    }
  };

  const handleCloseCall = () => {
    setShowCallModal(false);
    setActiveCall(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChannel) return;

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 50MB');
      return;
    }

    try {
      setUploadingFile(true);
      setUploadProgress(0);

      const { url, path } = await chatService.uploadFile(selectedChannel.id, file);

      setUploadProgress(100);

      const fileMessage = file.type.startsWith('image/')
        ? `Shared an image: ${file.name}`
        : `Shared a file: ${file.name}`;

      const newMessage = await chatService.sendMessage(
        selectedChannel.id,
        fileMessage,
        'file',
        undefined,
        url,
        file.name,
        file.size
      );

      setMessages(prev => [...prev, newMessage]);
      await loadChannels();
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const updateTypingIndicators = async () => {
    if (!selectedChannel) return;

    try {
      const users = await chatService.getTypingUsers(selectedChannel.id);
      setTypingUsers(users);
    } catch (error) {
      console.error('Failed to update typing indicators:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getChannelDisplayName = (channel: Channel): string => {
    if (channel.channel_type === 'direct' && channel.members) {
      const otherMember = channel.members.find(m => m.user_id !== user?.id);
      if (otherMember?.user) {
        return `${otherMember.user.firstName} ${otherMember.user.lastName}`;
      }
    }

    return channel.name;
  };

  const getChannelIcon = (channel: Channel) => {
    switch (channel.channel_type) {
      case 'ai_assistant':
        return <Bot className="h-5 w-5 text-purple-500" />;
      case 'department':
        return <Hash className="h-5 w-5 text-blue-500" />;
      case 'direct':
        return null;
      case 'group':
        return <Users className="h-5 w-5 text-green-500" />;
      default:
        return <Hash className="h-5 w-5 text-gray-500" />;
    }
  };

  const getUserAvatar = (member?: ChannelMember) => {
    if (!member?.user) return null;

    const initials = `${member.user.firstName?.[0] || ''}${member.user.lastName?.[0] || ''}`.toUpperCase();
    const presenceStatus = getPresenceStatus(member.user_id);

    return (
      <div className="relative">
        {member.user.profilePicture ? (
          <img
            src={member.user.profilePicture}
            alt={`${member.user.firstName} ${member.user.lastName}`}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
            {initials}
          </div>
        )}
        {presenceStatus === 'online' && (
          <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 animate-pulse"></div>
        )}
        {presenceStatus === 'away' && (
          <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-yellow-500 border-2 border-white dark:border-gray-800"></div>
        )}
        {presenceStatus === 'offline' && (
          <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-gray-400 border-2 border-white dark:border-gray-800"></div>
        )}
      </div>
    );
  };

  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    if (diffDays === 0) {
      return timeStr;
    } else if (diffDays === 1) {
      return `Yesterday at ${timeStr}`;
    } else if (diffDays < 7) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      return `${dayName} at ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${dateStr} at ${timeStr}`;
    }
  };

  const filteredChannels = channels.filter(channel =>
    getChannelDisplayName(channel).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Enterprise Chat
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {errorNotification && (
          <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3">
            <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{errorNotification}</span>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Channel List */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800">
            {/* Search and New Channel */}
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowNewChannelModal(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Channel</span>
              </button>
            </div>

            {/* Channel List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading || isCreatingChannel ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 space-y-4">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600"></div>
                    <Bot className="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
                  </div>
                  {channelCreationProgress && (
                    <div className="text-center space-y-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {channelCreationProgress}
                      </p>
                      {!isLoading && (
                        <button
                          onClick={() => {
                            setIsCreatingChannel(false);
                            setChannelCreationProgress('');
                          }}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Got it, let's get started!
                        </button>
                      )}
                      <div className="flex space-x-1 justify-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : filteredChannels.length === 0 ? (
                <div className="text-center py-8 px-4 space-y-3">
                  <Bot className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-gray-600 dark:text-gray-400">No channels available</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Click "New Channel" to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-1 px-2">
                  {filteredChannels
                    .sort((a, b) => {
                      if (a.channel_type === 'ai_assistant' && b.channel_type !== 'ai_assistant') return -1;
                      if (a.channel_type !== 'ai_assistant' && b.channel_type === 'ai_assistant') return 1;
                      if (a.last_message && !b.last_message) return -1;
                      if (!a.last_message && b.last_message) return 1;
                      if (a.last_message && b.last_message) {
                        return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
                      }
                      return a.name.localeCompare(b.name);
                    })
                    .map((channel) => {
                    const isSelected = selectedChannel?.id === channel.id;
                    const hasUnread = (channel.unread_count || 0) > 0;

                    return (
                      <button
                        key={channel.id}
                        onClick={() => handleSelectChannel(channel)}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-blue-100 dark:bg-blue-900'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {channel.channel_type === 'direct' ? (
                          getUserAvatar(channel.members?.find(m => m.user_id !== user?.id))
                        ) : (
                          <div className="p-2 rounded-lg bg-white dark:bg-gray-900">
                            {getChannelIcon(channel)}
                          </div>
                        )}

                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <span className={`font-medium text-sm truncate ${
                              hasUnread ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {getChannelDisplayName(channel)}
                            </span>
                            {hasUnread && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-blue-600 rounded-full">
                                {channel.unread_count}
                              </span>
                            )}
                          </div>
                          {channel.last_message && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {channel.last_message.decrypted_content || 'New message'}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          {selectedChannel ? (
            <div className="flex-1 flex">
              <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedChannel.channel_type === 'direct' ? (
                    getUserAvatar(selectedChannel.members?.find(m => m.user_id !== user?.id))
                  ) : (
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      {getChannelIcon(selectedChannel)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {getChannelDisplayName(selectedChannel)}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedChannel.members?.length || 0} members
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleStartCall('voice')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Start voice call"
                  >
                    <Phone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleStartCall('video')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Start video call"
                  >
                    <Video className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => setShowChannelSettings(!showChannelSettings)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Channel settings"
                  >
                    <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1" style={{ position: 'relative', height: 'calc(100vh - 300px)' }}>
                {messages.length === 0 && selectedChannel.channel_type === 'ai_assistant' ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="max-w-2xl w-full space-y-6 p-6">
                      <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                          <Bot className="h-10 w-10 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Studio AI Assistant
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400">
                            Your 24/7 HR companion
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                          What I Can Help With
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            • PTO, leave & time tracking
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            • Benefits and enrollment
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            • Payroll and tax documents
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            • Performance reviews & feedback
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            • Expense reports & reimbursement
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            • Celebrations & service badges
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Quick questions:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setMessageInput('How do I use Enterprise Chat?')}
                            className="px-4 py-3 text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all"
                          >
                            How do I use Enterprise Chat?
                          </button>
                          <button
                            onClick={() => setMessageInput('How do I start a direct message?')}
                            className="px-4 py-3 text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all"
                          >
                            How do I start a direct message?
                          </button>
                          <button
                            onClick={() => setMessageInput('How do I add a manual time entry?')}
                            className="px-4 py-3 text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all"
                          >
                            How do I add a manual time entry?
                          </button>
                          <button
                            onClick={() => setMessageInput('What if I forgot to clock out?')}
                            className="px-4 py-3 text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all"
                          >
                            What if I forgot to clock out?
                          </button>
                          <button
                            onClick={() => setMessageInput('When is the next payday?')}
                            className="px-4 py-3 text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all"
                          >
                            When is the next payday?
                          </button>
                          <button
                            onClick={() => setMessageInput('How do I enroll in benefits?')}
                            className="px-4 py-3 text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all"
                          >
                            How do I enroll in benefits?
                          </button>
                          <button
                            onClick={() => setMessageInput('How do I submit expenses?')}
                            className="px-4 py-3 text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all"
                          >
                            How do I submit expenses?
                          </button>
                          <button
                            onClick={() => setMessageInput('What are upcoming celebrations?')}
                            className="px-4 py-3 text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all"
                          >
                            What are upcoming celebrations?
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                      {messages.map((message, index) => {
                        const isOwn = message.sender_id === user?.id;
                        const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                        const senderName = message.sender 
                          ? `${message.sender.firstName} ${message.sender.lastName}` 
                          : 'Unknown';
                        const isImage = message.message_type === 'file' && message.file_url && message.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

                        return (
                          <div 
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-2`}
                            data-testid={`message-${message.id}`}
                          >
                            {!isOwn && showAvatar && (
                              <div className="flex-shrink-0">
                                {message.sender?.profilePicture ? (
                                  <img
                                    src={message.sender.profilePicture}
                                    alt={senderName}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                                    {senderName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </div>
                                )}
                              </div>
                            )}
                            {!isOwn && !showAvatar && <div className="w-8" />}

                            <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                              {!isOwn && showAvatar && (
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 px-1">
                                  {senderName}
                                </span>
                              )}
                              
                              <div className={`rounded-2xl px-4 py-2 ${
                                isOwn 
                                  ? 'bg-blue-600 text-white rounded-br-sm' 
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                              }`}>
                                {message.message_type === 'file' && message.file_url ? (
                                  <div className="space-y-2">
                                    {isImage ? (
                                      <img
                                        src={message.file_url}
                                        alt={message.file_name || 'Image'}
                                        className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open(message.file_url!, '_blank')}
                                        data-testid={`image-${message.id}`}
                                      />
                                    ) : (
                                      <a
                                        href={message.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 hover:underline"
                                        data-testid={`file-link-${message.id}`}
                                      >
                                        <Paperclip className="h-4 w-4" />
                                        <span className="text-sm">{message.file_name}</span>
                                        {message.file_size && (
                                          <span className="text-xs opacity-75">
                                            ({(message.file_size / 1024 / 1024).toFixed(2)} MB)
                                          </span>
                                        )}
                                      </a>
                                    )}
                                    {message.decrypted_content && (
                                      <p className="text-sm whitespace-pre-wrap break-words">
                                        {message.decrypted_content}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap break-words" data-testid={`message-content-${message.id}`}>
                                    {message.decrypted_content || 'Unable to load message'}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 mt-1 px-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400" data-testid={`timestamp-${message.id}`}>
                                  {formatMessageTime(message.created_at)}
                                </span>
                                {isOwn && message.read_by && message.read_by.length > 0 && (
                                  <CheckCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                )}
                              </div>
                            </div>

                            {isOwn && <div className="w-8" />}
                          </div>
                        );
                      })}

                      {typingUsers.length > 0 && (
                        <div className="flex items-end gap-2" data-testid="typing-indicator">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-semibold">
                              <MessageCircle className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                {uploadingFile && (
                  <div className="mb-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        Uploading file...
                      </span>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-end space-x-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Attach file"
                  >
                    <Paperclip className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>

                  <div className="flex-1 relative">
                    <textarea
                      ref={messageInputRef}
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value);
                        handleInputChange(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      disabled={isSending}
                      rows={1}
                      className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        minHeight: '48px',
                        maxHeight: '120px',
                        height: 'auto'
                      }}
                      data-testid="input-message"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || isSending}
                      className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                      title="Send message"
                      data-testid="button-send"
                    >
                      <Send className="h-4 w-4 text-white" />
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      title="Add emoji"
                    >
                      <Smile className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <EmojiPicker
                      isOpen={showEmojiPicker}
                      onClose={() => setShowEmojiPicker(false)}
                      onEmojiSelect={(emoji) => {
                        setMessageInput(messageInput + emoji);
                        setShowEmojiPicker(false);
                      }}
                      isDarkMode={document.documentElement.classList.contains('dark')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Channel Settings Panel */}
            {showChannelSettings && (
              <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Channel Settings
                    </h3>
                  </div>

                  {/* Channel Info */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Channel Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Name:</span>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {getChannelDisplayName(selectedChannel)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Type:</span>
                        <p className="text-gray-900 dark:text-white capitalize">
                          {selectedChannel.channel_type.replace('_', ' ')}
                        </p>
                      </div>
                      {selectedChannel.description && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Description:</span>
                          <p className="text-gray-900 dark:text-white">
                            {selectedChannel.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Members */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Members ({selectedChannel.members?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {selectedChannel.members?.map((member) => (
                        <div key={member.id} className="flex items-center space-x-3">
                          {getUserAvatar(member)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {member.user?.firstName} {member.user?.lastName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {member.user?.email}
                            </p>
                          </div>
                          {member.role === 'admin' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                              Admin
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notifications */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notifications
                    </h4>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Enable notifications for this channel
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a channel to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Channel Modal */}
      <NewChannelModal
        isOpen={showNewChannelModal}
        onClose={() => setShowNewChannelModal(false)}
        onChannelCreated={() => {
          setShowNewChannelModal(false);
          loadChannels();
        }}
      />

      {/* Call Modal */}
      {activeCall && (
        <CallModal
          isOpen={showCallModal}
          onClose={handleCloseCall}
          callSession={activeCall}
          isIncoming={false}
        />
      )}

      {/* Incoming Call Notification */}
      {incomingCall && !showCallModal && (
        <div className="fixed bottom-4 right-4 z-[70] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-80 animate-bounce-subtle">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
              <Phone className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Incoming {incomingCall.call_session.call_type} call
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {incomingCall.call_session.caller?.first_name} {incomingCall.call_session.caller?.last_name}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleAcceptIncomingCall}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              Accept
            </button>
            <button
              onClick={handleDeclineIncomingCall}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseChatModal;
