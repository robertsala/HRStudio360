import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Users, Search, Plus, Hash, Send, Paperclip, Smile, Phone, Video, Settings, Bot, CheckCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { chatService, Channel, Message, ChannelMember } from '../utils/chatService';
import { useUserPresence } from '../hooks/useUserPresence';
import NewChannelModal from '../components/modals/NewChannelModal';
import EmojiPicker from '../components/EmojiPicker';
import CallModal from '../components/modals/CallModal';
import { callingService, CallSession } from '../utils/callingService';
import { useDashboardEscape } from '../hooks/useDashboardEscape';
import { DashboardExitButton } from '../components/DashboardExitButton';

interface ChatPageProps {
  initialChannelId?: string;
}

const ChatPage: React.FC<ChatPageProps> = ({ initialChannelId }) => {
  const { user } = useAuth();
  
  // Parse URL query parameters for channelId
  const params = new URLSearchParams(window.location.search);
  const channelIdFromURL = params.get('channelId');
  const effectiveChannelId = initialChannelId || channelIdFromURL;
  
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
  const [_onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
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

  // ESC key handling - close nested modals first before navigating away
  useDashboardEscape(() => {
    if (showCallModal) {
      setShowCallModal(false);
      setActiveCall(null);
      return false;
    }
    if (showNewChannelModal) {
      setShowNewChannelModal(false);
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (user) {
      initializeChat();

      const subscription = callingService.subscribeToIncomingCalls((call) => {
        setIncomingCall(call);
      });

      return () => {
        subscription?.unsubscribe();
      };
    }

    return () => {
      if (user) {
        chatService.cleanup();
      }
    };
  }, [user]);

  useEffect(() => {
    if (effectiveChannelId && channels.length > 0) {
      const channel = channels.find(c => c.id === effectiveChannelId);
      if (channel) {
        handleSelectChannel(channel);
      }
    }
  }, [effectiveChannelId, channels]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when page loads with existing conversation
  useEffect(() => {
    if (messages.length > 0) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, []);

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

      if (!effectiveChannelId && loadedChannels.length > 0 && !selectedChannel) {
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
      // Scroll to bottom after messages load
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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

      const { url } = await chatService.uploadFile(selectedChannel.id, file);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="bg-white dark:bg-gray-900 shadow-sm w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white" data-testid="text-page-title">
              Enterprise Chat
            </h2>
          </div>
          <DashboardExitButton />
        </div>

        {/* Loading/Progress State */}
        {(isCreatingChannel || channelCreationProgress) && (
          <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <span className="text-sm text-blue-700 dark:text-blue-300" data-testid="text-loading-status">
                {channelCreationProgress || 'Loading chat...'}
              </span>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorNotification && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300" data-testid="text-error">
              {errorNotification}
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Channels Sidebar */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="input-search"
                />
              </div>
              <button
                onClick={() => setShowNewChannelModal(true)}
                disabled={isCreatingChannel}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                data-testid="button-new-channel"
              >
                <Plus className="h-4 w-4" />
                <span>New Channel</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredChannels.map((channel) => {
                const isActive = selectedChannel?.id === channel.id;
                const hasUnread = channel.unread_count && channel.unread_count > 0;

                return (
                  <button
                    key={channel.id}
                    onClick={() => handleSelectChannel(channel)}
                    className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600' : ''
                    }`}
                    data-testid={`button-channel-${channel.id}`}
                  >
                    {channel.channel_type === 'direct' && channel.members ? (
                      (() => {
                        const otherMember = channel.members.find(m => m.user_id !== user?.id);
                        return getUserAvatar(otherMember);
                      })()
                    ) : (
                      getChannelIcon(channel)
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium truncate ${
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          {getChannelDisplayName(channel)}
                        </p>
                        {hasUnread && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full">
                            {channel.unread_count}
                          </span>
                        )}
                      </div>
                      {channel.last_message && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {channel.last_message.decrypted_content || 'File attachment'}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          {selectedChannel ? (
          <div className="flex-1 flex flex-col">
            {/* Channel Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
              <div className="flex items-center space-x-3">
                {selectedChannel.channel_type === 'direct' && selectedChannel.members ? (
                  (() => {
                    const otherMember = selectedChannel.members.find(m => m.user_id !== user?.id);
                    return getUserAvatar(otherMember);
                  })()
                ) : (
                  getChannelIcon(selectedChannel)
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white" data-testid="text-channel-name">
                    {getChannelDisplayName(selectedChannel)}
                  </h3>
                  {selectedChannel.channel_type === 'ai_assistant' && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Sparkles className="h-3 w-3 text-purple-500" />
                      <p className="text-xs text-purple-600 dark:text-purple-400">AI Assistant</p>
                    </div>
                  )}
                  {selectedChannel.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedChannel.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {selectedChannel.channel_type !== 'ai_assistant' && (
                  <>
                    <button
                      onClick={() => handleStartCall('voice')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Start voice call"
                      data-testid="button-voice-call"
                    >
                      <Phone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleStartCall('video')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Start video call"
                      data-testid="button-video-call"
                    >
                      <Video className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowChannelSettings(!showChannelSettings)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Channel settings"
                  data-testid="button-channel-settings"
                >
                  <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.length === 0 && !isLoading ? (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm mt-1">Send a message to start the conversation</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.sender_id === user?.id;
                    const senderName = message.sender
                      ? `${message.sender.firstName} ${message.sender.lastName}`
                      : 'Unknown';

                    return (
                      <div
                        key={message.id}
                        className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                        data-testid={`message-${message.id}`}
                      >
                        {!isOwn && (
                          <div className="flex-shrink-0">
                            {message.sender?.profilePicture ? (
                              <img
                                src={message.sender.profilePicture}
                                alt={senderName}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                                {message.sender?.firstName?.[0] || 'U'}
                                {message.sender?.lastName?.[0] || ''}
                              </div>
                            )}
                          </div>
                        )}

                        <div className={`flex flex-col max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
                          {!isOwn && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1" data-testid={`sender-${message.id}`}>
                              {senderName}
                            </span>
                          )}
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isOwn
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm shadow-sm'
                            }`}
                          >
                            {message.file_url ? (
                              <div className="space-y-2">
                                {message.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
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
                        {selectedChannel && getChannelDisplayName(selectedChannel)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Type:</span>
                      <p className="text-gray-900 dark:text-white capitalize">
                        {selectedChannel?.channel_type.replace('_', ' ')}
                      </p>
                    </div>
                    {selectedChannel?.description && (
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
                    Members ({selectedChannel?.members?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {selectedChannel?.members?.map((member) => (
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
              Incoming {incomingCall.call_session?.call_type} call
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {incomingCall.call_session?.caller?.first_name} {incomingCall.call_session?.caller?.last_name}
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

export default ChatPage;
