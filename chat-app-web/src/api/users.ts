import { apiClient } from './client';
import type { UserInfo, NearbyResponse, LocationResponse } from '../types';

export const usersApi = {
  getMe: async (): Promise<UserInfo> => {
    const res = await apiClient.get<Record<string, unknown>>('/users/me');
    const data = res.data;
    const rawRole = data.role as { name?: string } | string | undefined;
    const role =
      typeof rawRole === 'string'
        ? rawRole
        : rawRole?.name || (data.roleId === 1 ? 'admin' : 'user');

    return {
      id: String(data.id),
      username: String(data.username),
      email: String(data.email),
      role: role as 'user' | 'admin',
    };
  },

  updateLocation: async (data: { latitude: number; longitude: number }) => {
    const res = await apiClient.patch<LocationResponse>('/users/me/location', data);
    return res.data;
  },

  getNearby: async (page = 1, limit = 20) => {
    const res = await apiClient.get<NearbyResponse>('/users/nearby', {
      params: { page, limit },
    });
    return res.data;
  },
};
