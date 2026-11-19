import { apiClient } from './client';
import type { Message, Conversation } from '../types';

export const messagesApi = {
  getConversations: async () => {
    const res = await apiClient.get<Conversation[]>('/messages/conversations');
    return res.data;
  },

  getMessages: async (userId: string, before?: string, limit = 30) => {
    const params: Record<string, string | number> = { limit };
    if (before) params.before = before;
    const res = await apiClient.get<Message[]>(`/messages/with/${userId}`, { params });
    return res.data;
  },

  markRead: async (userId: string) => {
    const res = await apiClient.patch<{ updated: number }>(`/messages/with/${userId}/read`);
    return res.data;
  },

  sendText: async (data: { receiverId: string; content: string }) => {
    const res = await apiClient.post<Message>('/messages/text', data);
    return res.data;
  },

  sendAudio: async (data: { audio: Blob; receiverId: string; durationSec: number }) => {
    const fd = new FormData();
    fd.append('audio', data.audio, 'recording.webm');
    fd.append('receiverId', data.receiverId);
    fd.append('durationSec', String(data.durationSec));
    const res = await apiClient.post<Message>('/messages/audio', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  fetchAudioBlob: async (audioUrl: string) => {
    // Backend returns audioUrl like "/api/messages/audio/5" but apiClient.baseURL
    // already ends with /api, so strip the prefix to avoid /api/api/...
    const path = audioUrl.replace(/^\/api/, '');
    const res = await apiClient.get<Blob>(path, { responseType: 'blob' });
    return res.data;
  },
};
