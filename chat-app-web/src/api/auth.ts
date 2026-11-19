import { apiClient } from './client';
import type { LoginResponse, MessageOnlyResponse } from '../types';

export const authApi = {
  register: async (data: { username: string; email: string; password: string }) => {
    const res = await apiClient.post<MessageOnlyResponse>('/auth/register', data);
    return res.data;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await apiClient.post<LoginResponse>('/auth/login', data);
    return res.data;
  },

  verifyEmail: async (userId: string, emailToken: string) => {
    const res = await apiClient.get<MessageOnlyResponse>(
      `/auth/verify-email/${userId}/${emailToken}`,
    );
    return res.data;
  },
};
