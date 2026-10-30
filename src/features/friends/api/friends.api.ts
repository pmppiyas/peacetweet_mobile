import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import {
  FriendActionResponse,
  FriendItem,
  FriendRequestItem,
  FriendshipStatusResponse,
  PaginatedFriendRequestsResponse,
  PaginatedFriendsResponse,
  FriendUser,
} from '../types/friends.types';

export const friendsApi = {
  // Get logged-in user's friends
  getFriends: async (params?: {
    search?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{ items: FriendItem[]; nextCursor?: string | null; total?: number }> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.FRIENDS.LIST, { params });
    const payload = res?.data?.data || res?.data || {};
    const items = payload.items || payload.friends || (Array.isArray(payload) ? payload : []);
    return {
      items: items.map((it: any) => ({
        id: it.id || it.user?.id || it.friendId,
        friendId: it.friendId || it.user?.id || it.id,
        friendSince: it.friendSince || it.createdAt,
        user: it.user || {
          id: it.friendId || it.id,
          name: it.name || 'User',
          username: it.username || 'user',
          avatar: it.avatar,
          location: it.location,
        },
      })),
      nextCursor: payload.nextCursor,
      total: payload.total ?? items.length,
    };
  },

  // Get received friend requests
  getReceivedFriendRequests: async (params?: {
    cursor?: string;
    limit?: number;
  }): Promise<{ items: FriendRequestItem[]; nextCursor?: string | null }> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.FRIENDS.RECEIVED_REQUESTS, { params });
    const payload = res?.data?.data || res?.data || {};
    const items = payload.items || (Array.isArray(payload) ? payload : []);
    return {
      items: items.map((it: any) => ({
        id: it.id,
        status: it.status || 'PENDING',
        createdAt: it.createdAt,
        sender: it.sender || {
          id: it.senderId || it.userId,
          name: it.name || 'User',
          username: it.username || 'user',
          avatar: it.avatar,
          location: it.location,
        },
      })),
      nextCursor: payload.nextCursor,
    };
  },

  // Get sent friend requests
  getSentFriendRequests: async (params?: {
    cursor?: string;
    limit?: number;
  }): Promise<{ items: FriendRequestItem[]; nextCursor?: string | null }> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.FRIENDS.SENT_REQUESTS, { params });
    const payload = res?.data?.data || res?.data || {};
    const items = payload.items || (Array.isArray(payload) ? payload : []);
    return {
      items: items.map((it: any) => ({
        id: it.id,
        status: it.status || 'PENDING',
        createdAt: it.createdAt,
        receiver: it.receiver || {
          id: it.receiverId || it.userId,
          name: it.name || 'User',
          username: it.username || 'user',
          avatar: it.avatar,
          location: it.location,
        },
      })),
      nextCursor: payload.nextCursor,
    };
  },

  // Send a friend request
  sendFriendRequest: async (receiverId: string): Promise<any> => {
    const res = await apiClient.post<any>(API_ENDPOINTS.FRIENDS.SEND_REQUEST, { receiverId });
    return res.data;
  },

  // Cancel a pending sent friend request
  cancelFriendRequest: async (requestId: string): Promise<FriendActionResponse> => {
    const res = await apiClient.delete<any>(API_ENDPOINTS.FRIENDS.CANCEL_REQUEST(requestId));
    return res.data;
  },

  // Accept a received friend request
  acceptFriendRequest: async (requestId: string): Promise<FriendActionResponse> => {
    const res = await apiClient.post<any>(API_ENDPOINTS.FRIENDS.ACCEPT_REQUEST(requestId));
    return res.data;
  },

  // Reject a received friend request
  rejectFriendRequest: async (requestId: string): Promise<FriendActionResponse> => {
    const res = await apiClient.post<any>(API_ENDPOINTS.FRIENDS.REJECT_REQUEST(requestId));
    return res.data;
  },

  // Unfriend
  unfriend: async (userId: string): Promise<FriendActionResponse> => {
    const res = await apiClient.delete<any>(API_ENDPOINTS.FRIENDS.UNFRIEND(userId));
    return res.data;
  },

  // Discover other users via search
  discoverUsers: async (q?: string): Promise<FriendUser[]> => {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.SEARCH.GLOBAL, {
        params: { q: q || 'a', type: 'USERS', limit: 20 },
      });
      const data = res?.data?.data || res?.data || {};
      const users = data.users || [];
      return users.map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        avatar: u.avatar || u.avatarUrl,
        location: u.location,
        bio: u.bio,
      }));
    } catch {
      return [];
    }
  },
};
