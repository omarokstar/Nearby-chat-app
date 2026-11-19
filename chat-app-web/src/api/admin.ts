import { apiClient } from './client';
import type { AdminUsersResponse, AdminUser, RadiusResponse } from '../types';

export const adminApi = {
  getUsers: async (params: {
    search?: string;
    isBlocked?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const query: Record<string, string | number | boolean> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    };
    if (params.search) query.search = params.search;
    if (params.isBlocked !== undefined) query.isBlocked = params.isBlocked;
    const res = await apiClient.get<AdminUsersResponse>('/admin/users', { params: query });
    return res.data;
  },

  blockUser: async (userId: string, reason?: string) => {
    const res = await apiClient.patch<AdminUser>(`/admin/users/${userId}/block`, { reason });
    return res.data;
  },

  unblockUser: async (userId: string) => {
    const res = await apiClient.patch<AdminUser>(`/admin/users/${userId}/unblock`);
    return res.data;
  },

  getRadius: async () => {
    const res = await apiClient.get<RadiusResponse>('/admin/settings/radius');
    return res.data;
  },

  setRadius: async (radiusKm: number) => {
    const res = await apiClient.put<RadiusResponse>('/admin/settings/radius', { radiusKm });
    return res.data;
  },
};
