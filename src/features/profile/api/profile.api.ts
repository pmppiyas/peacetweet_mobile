import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import { User } from '@/types/user.types';
import { UserProfileResponse } from '../types/profile.types';
import { FeedItem } from '@/features/feed/types/feed.types';
import { FriendItem } from '@/features/friends/types/friends.types';
import { GroupItem } from '@/features/groups/types/groups.types';

export const profileApi = {
  // Get public user profile by username with friendship status
  getUserProfile: async (username: string): Promise<UserProfileResponse> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.USERS.PROFILE(username));
    return res?.data?.data || res?.data;
  },

  // Update authenticated user profile (bio, name, etc.)
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const res = await apiClient.patch<any>(API_ENDPOINTS.USERS.ME, data);
    return res?.data?.data || res?.data;
  },

  // Request 6-digit email verification OTP
  requestEmailVerification: async (email?: string): Promise<{
    alreadyVerified?: boolean;
    sent?: boolean;
    email: string;
    deliveryMode?: 'resend' | 'smtp' | 'dev';
    devCode?: string;
    expiresInSeconds?: number;
  }> => {
    const res = await apiClient.post<any>(
      API_ENDPOINTS.USERS.VERIFY_EMAIL_REQUEST,
      email ? { email } : {}
    );
    return res?.data?.data || res?.data;
  },

  // Confirm 6-digit OTP to verify email & earn +50 pts
  confirmEmailVerification: async (
    code: string,
    email?: string
  ): Promise<{
    user: User;
    emailVerified: boolean;
    pointsAwarded: number;
    alreadyAwarded?: boolean;
    userStatus?: string;
  }> => {
    const res = await apiClient.post<any>(
      API_ENDPOINTS.USERS.VERIFY_EMAIL_CONFIRM,
      email ? { code, email } : { code }
    );
    return res?.data?.data || res?.data;
  },

  // Verify Gmail via Google OAuth tokens
  verifyEmailWithGoogle: async (payload: {
    accessToken?: string;
    idToken?: string;
    code?: string;
    redirectUri?: string;
  }): Promise<{
    user: User;
    emailVerified: boolean;
    pointsAwarded: number;
    alreadyAwarded?: boolean;
    userStatus?: string;
  }> => {
    const res = await apiClient.post<any>(
      API_ENDPOINTS.USERS.VERIFY_EMAIL_GOOGLE,
      payload
    );
    return res?.data?.data || res?.data;
  },

  // Get user's feed posts
  getUserPosts: async (authorId: string): Promise<FeedItem[]> => {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.FEED.GET, {
        params: { authorId, limit: 30 },
      });
      const payload = res?.data?.data || res?.data || {};
      return payload.items || (Array.isArray(payload) ? payload : []);
    } catch {
      return [];
    }
  },

  // Get user's friends list
  getUserFriends: async (userId?: string): Promise<{ items: FriendItem[]; total?: number }> => {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.FRIENDS.LIST, {
        params: { userId, limit: 30 },
      });
      const payload = res?.data?.data || res?.data || {};
      const rawItems = payload.items || payload.friends || (Array.isArray(payload) ? payload : []);
      const items: FriendItem[] = rawItems.map((it: any) => ({
        id: it.id || it.user?.id || it.friendId,
        friendId: it.friendId || it.user?.id || it.id,
        friendSince: it.friendSince || it.createdAt,
        user: it.user || {
          id: it.friendId || it.id,
          name: it.name || 'User',
          username: it.username || 'user',
          avatar: it.avatar || it.avatarUrl,
          location: it.location,
          bio: it.bio,
        },
      }));
      return {
        items,
        total: payload.total ?? items.length,
      };
    } catch {
      return { items: [], total: 0 };
    }
  },

  // Get user's joined groups
  getUserGroups: async (): Promise<GroupItem[]> => {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.GROUPS.MY, {
        params: { limit: 20 },
      });
      const payload = res?.data?.data || res?.data || {};
      return payload.items || (Array.isArray(payload) ? payload : []);
    } catch {
      return [];
    }
  },
};
