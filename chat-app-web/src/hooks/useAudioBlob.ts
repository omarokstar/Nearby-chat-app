import { useEffect, useRef, useState, useCallback } from 'react';
import { messagesApi } from '../api/messages';

const blobCache = new Map<string, string>();

/**
 * Fetches an audio file through the authenticated API, caches the object URL
 * per message id, and revokes it on unmount when no other consumer is alive.
 */
export function useAudioBlob(messageId: string, audioUrl: string | null) {
  const [objectUrl, setObjectUrl] = useState<string | null>(
    () => (messageId && blobCache.has(messageId) ? blobCache.get(messageId)! : null),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!audioUrl) return;
    if (blobCache.has(messageId)) {
      setObjectUrl(blobCache.get(messageId)!);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const blob = await messagesApi.fetchAudioBlob(audioUrl);
      const url = URL.createObjectURL(blob);
      blobCache.set(messageId, url);
      if (mountedRef.current) setObjectUrl(url);
    } catch {
      if (mountedRef.current) setError('Failed to load audio');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [messageId, audioUrl]);

  return { objectUrl, loading, error, load };
}

/** Call once on app unmount (optional cleanup) */
export function revokeAllAudioUrls() {
  blobCache.forEach((url) => URL.revokeObjectURL(url));
  blobCache.clear();
}
