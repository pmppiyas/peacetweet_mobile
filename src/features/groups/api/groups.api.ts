import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import { GroupItem, GroupsResponse } from '../types/groups.types';

export const groupsApi = {
  // Discover all groups
  discoverGroups: async (params?: {
    search?: string;
    cursor?: string;
    limit?: number;
    visibility?: string;
  }): Promise<GroupsResponse> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.GROUPS.LIST, { params });
    const payload = res?.data?.data || res?.data || {};
    const items = payload.items || (Array.isArray(payload) ? payload : []);
    return {
      items,
      nextCursor: payload.nextCursor,
    };
  },

  // Get current user's joined groups
  getMyGroups: async (params?: {
    search?: string;
    cursor?: string;
    limit?: number;
  }): Promise<GroupsResponse> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.GROUPS.MY, { params });
    const payload = res?.data?.data || res?.data || {};
    const items = payload.items || (Array.isArray(payload) ? payload : []);
    return {
      items,
      nextCursor: payload.nextCursor,
    };
  },

  // Join group
  joinGroup: async (groupId: string): Promise<any> => {
    const res = await apiClient.post<any>(API_ENDPOINTS.GROUPS.JOIN(groupId));
    return res?.data?.data || res?.data;
  },

  // Leave group
  leaveGroup: async (groupId: string): Promise<any> => {
    const res = await apiClient.delete<any>(API_ENDPOINTS.GROUPS.LEAVE(groupId));
    return res?.data?.data || res?.data;
  },

  // Cancel join request
  cancelJoinRequest: async (groupId: string): Promise<any> => {
    const res = await apiClient.delete<any>(API_ENDPOINTS.GROUPS.CANCEL_REQUEST(groupId));
    return res?.data?.data || res?.data;
  },
};
