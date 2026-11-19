import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectSocket, disconnectSocket, getSocket } from '../socket';
import { useAuthStore } from '../store/auth';
import { queryClient } from '../lib/queryClient';
import type { Message, SocketReadPayload } from '../types';

/**
 * Call once in the authenticated layout.
 * Manages the socket lifecycle: connect on login, disconnect on logout,
 * and handles global events (message:new, message:read, exception).
 */
export function useSocketSetup() {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const reconnectedRef = useRef(false);

  useEffect(() => {
    if (!token) return;

    const s = connectSocket(token);

    const onConnect = () => {
      if (reconnectedRef.current) {
        // Refetch conversations + open chat on reconnect
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      }
      reconnectedRef.current = true;
    };

    const onException = () => {
      logout();
      navigate('/login', { replace: true });
    };

    const onNewMessage = (_msg: Message) => {
      // Conversations list always needs refreshing
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      // Individual chat query is handled inside ChatWindow
    };

    const onRead = (_payload: SocketReadPayload) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      // Individual chat handled in ChatWindow
    };

    s.on('connect', onConnect);
    s.on('exception', onException);
    s.on('message:new', onNewMessage);
    s.on('message:read', onRead);

    return () => {
      s.off('connect', onConnect);
      s.off('exception', onException);
      s.off('message:new', onNewMessage);
      s.off('message:read', onRead);
      disconnectSocket();
    };
  }, [token, logout, navigate]);

  return getSocket;
}

/**
 * Subscribe to a specific socket event while a component is mounted.
 */
export function useSocketEvent<T>(event: string, handler: (data: T) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const cb = (data: T) => handlerRef.current(data);
    s.on(event, cb);
    return () => {
      s.off(event, cb);
    };
  }, [event]);
}

/**
 * Send a text message over the socket with ack.
 * Returns null on socket unavailable (caller should REST-fallback).
 */
export function useSocketSend() {
  return useCallback(
    (receiverId: string, content: string): Promise<{ ok: boolean; message?: Message; error?: string }> | null => {
      const s = getSocket();
      if (!s?.connected) return null;

      return new Promise((resolve) => {
        s.emit(
          'message:send',
          { receiverId, content },
          (ack: { ok: boolean; message?: Message; error?: string }) => {
            resolve(ack);
          },
        );
      });
    },
    [],
  );
}
