import { apiClient } from './client';
import type { UserInfo, NearbyResponse, LocationResponse } from '../types';

export const usersApi = {
  getMe: async () => {
    const res = await apiClient.get<UserInfo>('/users/me');
    return res.data;
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
