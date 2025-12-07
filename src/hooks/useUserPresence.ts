import { useState, useEffect, useCallback } from 'react';

export interface UserPresenceStatus {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeenAt: string;
}

export const useUserPresence = (userIds?: string[]) => {
  const [presenceMap, setPresenceMap] = useState<Map<string, UserPresenceStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const loadPresence = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/presence');
      if (!response.ok) throw new Error('Failed to fetch presence');
      
      const data = await response.json();
      
      const newMap = new Map<string, UserPresenceStatus>();
      (data || []).forEach((presence: any) => {
        newMap.set(presence.userId, {
          userId: presence.userId,
          status: presence.status || 'offline',
          lastSeenAt: presence.lastSeenAt
        });
      });

      setPresenceMap(newMap);
    } catch (error) {
      console.error('Failed to load user presence:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPresence();
    
    // Poll for presence updates every 30 seconds
    const interval = setInterval(loadPresence, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [loadPresence]);

  const getPresenceStatus = useCallback((userId: string): 'online' | 'away' | 'offline' => {
    const presence = presenceMap.get(userId);
    if (!presence) return 'offline';

    const lastSeen = new Date(presence.lastSeenAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);

    if (presence.status === 'online' && diffMinutes < 5) {
      return 'online';
    } else if (presence.status === 'away' || (presence.status === 'online' && diffMinutes < 15)) {
      return 'away';
    }

    return 'offline';
  }, [presenceMap]);

  const isOnline = useCallback((userId: string): boolean => {
    return getPresenceStatus(userId) === 'online';
  }, [getPresenceStatus]);

  const updateMyPresence = useCallback(async (userId: string, status: 'online' | 'away' | 'offline') => {
    try {
      const response = await fetch(`/api/chat/presence/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        await loadPresence();
      }
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }, [loadPresence]);

  return {
    presenceMap,
    getPresenceStatus,
    isOnline,
    isLoading,
    refresh: loadPresence,
    updateMyPresence
  };
};
