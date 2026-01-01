/**
 * useHeartbeat - React hook for sending heartbeat signals to track active viewers
 * 
 * Usage:
 * 1. Import in your video player component:
 *    import { useHeartbeat } from '@/hooks/useHeartbeat';
 * 
 * 2. Call the hook when video is playing:
 *    useHeartbeat(movieId, userId, isPlaying);
 * 
 * The hook will:
 * - Send heartbeat every 5 seconds while isPlaying is true
 * - Stop sending when isPlaying is false or component unmounts
 * - Use navigator.sendBeacon for graceful cleanup on page unload
 */

import { useEffect, useRef, useCallback, useState } from 'react';

const HEARTBEAT_INTERVAL_MS = 5000;

export function useHeartbeat(
  movieId: string | undefined,
  userId: string | undefined,
  isActive: boolean = true
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMovieIdRef = useRef<string | null>(null);

  const sendHeartbeat = useCallback(async () => {
    if (!movieId || !userId) return;
    
    try {
      await fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ movieId })
      });
    } catch (error) {
      // Silent fail - heartbeat is non-critical
    }
  }, [movieId, userId]);

  const stopHeartbeat = useCallback(async () => {
    const currentMovieId = lastMovieIdRef.current;
    if (!currentMovieId) return;
    
    try {
      // Use sendBeacon for reliability on page unload
      if (navigator.sendBeacon) {
        const data = new Blob(
          [JSON.stringify({ movieId: currentMovieId })],
          { type: 'application/json' }
        );
        navigator.sendBeacon('/api/heartbeat/stop', data);
      } else {
        await fetch('/api/heartbeat/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ movieId: currentMovieId }),
          keepalive: true
        });
      }
    } catch (error) {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    if (!movieId || !userId || !isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (lastMovieIdRef.current) {
        stopHeartbeat();
        lastMovieIdRef.current = null;
      }
      return;
    }

    lastMovieIdRef.current = movieId;
    
    // Send initial heartbeat immediately
    sendHeartbeat();
    
    // Set up interval for subsequent heartbeats
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stopHeartbeat();
    };
  }, [movieId, userId, isActive, sendHeartbeat, stopHeartbeat]);

  // Handle page unload/visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && lastMovieIdRef.current) {
        stopHeartbeat();
      } else if (document.visibilityState === 'visible' && isActive && movieId && userId) {
        sendHeartbeat();
      }
    };

    const handleBeforeUnload = () => {
      if (lastMovieIdRef.current) {
        stopHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isActive, movieId, userId, sendHeartbeat, stopHeartbeat]);
}

/**
 * useActiveViewers - React hook for fetching active viewer counts (admin use)
 * 
 * Usage:
 * const { viewers, total, isLoading, refetch } = useActiveViewers();
 */
export function useActiveViewers(enabled: boolean = true, refetchInterval: number = 5000) {
  const [data, setData] = useState<{
    viewers: Record<string, number>;
    total: number;
    stats: { totalMovies: number; totalViewers: number; memoryEntries: number };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchViewers = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/active-viewers', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch active viewers');
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    
    fetchViewers();
    const interval = setInterval(fetchViewers, refetchInterval);
    
    return () => clearInterval(interval);
  }, [enabled, refetchInterval, fetchViewers]);

  return {
    viewers: data?.viewers || {},
    total: data?.total || 0,
    stats: data?.stats,
    isLoading,
    error,
    refetch: fetchViewers
  };
}

