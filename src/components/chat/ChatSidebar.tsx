import React, { useState, useEffect } from 'react';
import { Hash, Lock, Users, Bot, Star, ChevronDown, ChevronRight, Search, Plus, Settings, Archive, Bell, BellOff } from 'lucide-react';
import { Channel } from '../../utils/chatService';
import { ChannelFavorite, ChannelCategory } from '../../utils/enhancedChatFeatures';

interface ChatSidebarProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  favorites: ChannelFavorite[];
  onSelectChannel: (channel: Channel) => void;
  onNewChannel: () => void;
  onToggleFavorite: (channelId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  channels,
  selectedChannel,
  favorites,
  onSelectChannel,
  onNewChannel,
  onToggleFavorite,
  searchQuery,
  onSearchChange
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const isFavorite = (channelId: string) => {
    return favorites.some(fav => fav.channel_id === channelId);
  };

  const getChannelIcon = (channel: Channel) => {
    switch (channel.channel_type) {
      case 'ai_assistant':
        return <Bot className="w-4 h-4 text-purple-500" />;
      case 'direct':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'group':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'department':
        return <Hash className="w-4 h-4 text-gray-500" />;
      default:
        return <Hash className="w-4 h-4 text-gray-500" />;
    }
  };

  const getUnreadCount = (channel: Channel) => {
    return 0;
  };

  const filterChannels = (channelList: Channel[]) => {
    if (!searchQuery) return channelList;
    return channelList.filter(ch =>
      ch.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const favoriteChannels = filterChannels(channels.filter(ch => isFavorite(ch.id)));
  const aiChannels = filterChannels(channels.filter(ch => ch.channel_type === 'ai_assistant'));
  const directChannels = filterChannels(channels.filter(ch => ch.channel_type === 'direct'));
  const groupChannels = filterChannels(channels.filter(ch => ch.channel_type === 'group'));
  const departmentChannels = filterChannels(channels.filter(ch => ch.channel_type === 'department'));

  const ChannelItem: React.FC<{ channel: Channel }> = ({ channel }) => {
    const isSelected = selectedChannel?.id === channel.id;
    const unreadCount = getUnreadCount(channel);
    const hasUnread = unreadCount > 0;

    return (
      <div
        onClick={() => onSelectChannel(channel)}
        className={`
          group flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer
          transition-all duration-150
          ${isSelected
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
          }
          ${hasUnread ? 'font-semibold' : 'font-normal'}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getChannelIcon(channel)}
          <span className="truncate text-sm">{channel.name}</span>
          {hasUnread && (
            <span className="flex-shrink-0 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full min-w-[18px] text-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(channel.id);
            }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <Star
              className={`w-3.5 h-3.5 ${isFavorite(channel.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
            />
          </button>
        </div>
      </div>
    );
  };

  const SectionHeader: React.FC<{ title: string; count: number; sectionKey: string }> = ({ title, count, sectionKey }) => {
    const isCollapsed = collapsedSections.has(sectionKey);

    return (
      <div
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors group"
      >
        <div className="flex items-center gap-1.5">
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          )}
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </span>
          <span className="text-xs text-gray-400">({count})</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Channels</h2>
          <button
            onClick={onNewChannel}
            className="ml-auto p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="New channel"
          >
            <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {favoriteChannels.length > 0 && (
          <div className="mb-3">
            <SectionHeader title="Favorites" count={favoriteChannels.length} sectionKey="favorites" />
            {!collapsedSections.has('favorites') && (
              <div className="mt-1 space-y-0.5">
                {favoriteChannels.map(channel => (
                  <ChannelItem key={channel.id} channel={channel} />
                ))}
              </div>
            )}
          </div>
        )}

        {aiChannels.length > 0 && (
          <div className="mb-3">
            <SectionHeader title="AI Assistants" count={aiChannels.length} sectionKey="ai" />
            {!collapsedSections.has('ai') && (
              <div className="mt-1 space-y-0.5">
                {aiChannels.map(channel => (
                  <ChannelItem key={channel.id} channel={channel} />
                ))}
              </div>
            )}
          </div>
        )}

        {directChannels.length > 0 && (
          <div className="mb-3">
            <SectionHeader title="Direct Messages" count={directChannels.length} sectionKey="direct" />
            {!collapsedSections.has('direct') && (
              <div className="mt-1 space-y-0.5">
                {directChannels.map(channel => (
                  <ChannelItem key={channel.id} channel={channel} />
                ))}
              </div>
            )}
          </div>
        )}

        {groupChannels.length > 0 && (
          <div className="mb-3">
            <SectionHeader title="Group Chats" count={groupChannels.length} sectionKey="groups" />
            {!collapsedSections.has('groups') && (
              <div className="mt-1 space-y-0.5">
                {groupChannels.map(channel => (
                  <ChannelItem key={channel.id} channel={channel} />
                ))}
              </div>
            )}
          </div>
        )}

        {departmentChannels.length > 0 && (
          <div className="mb-3">
            <SectionHeader title="Departments" count={departmentChannels.length} sectionKey="departments" />
            {!collapsedSections.has('departments') && (
              <div className="mt-1 space-y-0.5">
                {departmentChannels.map(channel => (
                  <ChannelItem key={channel.id} channel={channel} />
                ))}
              </div>
            )}
          </div>
        )}

        {channels.length === 0 && (
          <div className="text-center py-8 px-4">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No channels yet</p>
            <button
              onClick={onNewChannel}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create your first channel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
