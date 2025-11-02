import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface UserPresenceStatus {
  user_id: string;
  status: 'online' | 'away' | 'offline';
  last_seen_at: string;
}

export const useUserPresence = (userIds?: string[]) => {
  const [presenceMap, setPresenceMap] = useState<Map<string, UserPresenceStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPresence();
    const subscription = setupRealtimeSubscription();

    return () => {
      subscription?.unsubscribe();
    };
  }, [userIds?.join(',')]);

  const loadPresence = async () => {
    try {
      let query = supabase
        .from('user_presence')
        .select('*');

      if (userIds && userIds.length > 0) {
        query = query.in('user_id', userIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      const newMap = new Map<string, UserPresenceStatus>();
      (data || []).forEach((presence: UserPresenceStatus) => {
        newMap.set(presence.user_id, presence);
      });

      setPresenceMap(newMap);
    } catch (error) {
      console.error('Failed to load user presence:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('user-presence-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const presence = payload.new as UserPresenceStatus;
            if (!userIds || userIds.includes(presence.user_id)) {
              setPresenceMap(prev => {
                const newMap = new Map(prev);
                newMap.set(presence.user_id, presence);
                return newMap;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const presence = payload.old as UserPresenceStatus;
            setPresenceMap(prev => {
              const newMap = new Map(prev);
              newMap.delete(presence.user_id);
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return channel;
  };

  const getPresenceStatus = (userId: string): 'online' | 'away' | 'offline' => {
    const presence = presenceMap.get(userId);
    if (!presence) return 'offline';

    const lastSeen = new Date(presence.last_seen_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);

    if (presence.status === 'online' && diffMinutes < 5) {
      return 'online';
    } else if (presence.status === 'away' || (presence.status === 'online' && diffMinutes < 15)) {
      return 'away';
    }

    return 'offline';
  };

  const isOnline = (userId: string): boolean => {
    return getPresenceStatus(userId) === 'online';
  };

  return {
    presenceMap,
    getPresenceStatus,
    isOnline,
    isLoading,
    refresh: loadPresence
  };
};
