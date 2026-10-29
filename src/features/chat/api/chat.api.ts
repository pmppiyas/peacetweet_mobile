import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import {
  ChatMessage,
  ChatUser,
  ConversationItem,
  MessagesResponse,
  SearchedChatUser,
} from '../types/chat.types';

export const chatApi = {
  getConversations: async (): Promise<ConversationItem[]> => {
    const response = await apiClient.get(API_ENDPOINTS.CHAT.CONVERSATIONS);
    const payload = response.data?.data ?? response.data;
    if (Array.isArray(payload)) {
      return payload;
    }
    if (Array.isArray(payload?.items)) {
      return payload.items;
    }
    if (Array.isArray(payload?.conversations)) {
      return payload.conversations;
    }
    return [];
  },

  getOrCreateConversation: async (
    receiverId: string
  ): Promise<ConversationItem> => {
    const response = await apiClient.post(API_ENDPOINTS.CHAT.CONVERSATIONS, {
      receiverId,
    });
    return (response.data?.data ?? response.data) as ConversationItem;
  },

  getMessages: async (
    conversationId: string,
    cursor?: string,
    limit = 30
  ): Promise<MessagesResponse> => {
    const response = await apiClient.get(
      API_ENDPOINTS.CHAT.MESSAGES(conversationId),
      {
        params: { cursor, limit },
      }
    );
    const payload = response.data?.data ?? response.data;
    const rawList = Array.isArray(payload?.messages)
      ? payload.messages
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
          ? payload
          : [];

    return {
      messages: rawList,
      nextCursor: payload?.nextCursor ?? null,
    };
  },

  sendMessage: async (data: {
    receiverId: string;
    text: string;
    conversationId?: string;
  }): Promise<ChatMessage> => {
    const response = await apiClient.post(
      API_ENDPOINTS.CHAT.SEND_MESSAGE,
      data
    );
    return (response.data?.data ?? response.data) as ChatMessage;
  },

  editMessage: async (
    messageId: string,
    text: string
  ): Promise<ChatMessage> => {
    const response = await apiClient.patch(
      API_ENDPOINTS.CHAT.EDIT_MESSAGE(messageId),
      { text }
    );
    return (response.data?.data ?? response.data) as ChatMessage;
  },

  deleteMessage: async (messageId: string): Promise<ChatMessage> => {
    const response = await apiClient.delete(
      API_ENDPOINTS.CHAT.DELETE_MESSAGE(messageId)
    );
    return (response.data?.data ?? response.data) as ChatMessage;
  },

  markAsRead: async (conversationId: string): Promise<{ count: number }> => {
    const response = await apiClient.patch(
      API_ENDPOINTS.CHAT.MARK_READ(conversationId)
    );
    return (response.data?.data ?? response.data ?? { count: 0 }) as {
      count: number;
    };
  },

  searchUsersAndFriends: async (
    query: string,
    currentUserId?: string
  ): Promise<{ friends: SearchedChatUser[]; others: SearchedChatUser[] }> => {
    const trimmed = query.trim();
    if (!trimmed) {
      return { friends: [], others: [] };
    }

    const [friendsRes, usersRes] = await Promise.allSettled([
      apiClient.get(API_ENDPOINTS.FRIENDS.LIST, {
        params: { search: trimmed, limit: 20 },
      }),
      apiClient.get(API_ENDPOINTS.SEARCH.GLOBAL, {
        params: { q: trimmed, type: 'USERS', limit: 30 },
      }),
    ]);

    const friendsList: SearchedChatUser[] = [];
    const friendIds = new Set<string>();

    if (friendsRes.status === 'fulfilled') {
      const fPayload = friendsRes.value.data?.data ?? friendsRes.value.data;
      const items = Array.isArray(fPayload?.items)
        ? fPayload.items
        : Array.isArray(fPayload)
          ? fPayload
          : [];
      for (const item of items) {
        const u = item?.friend || item?.user || item;
        if (u?.id && u.id !== currentUserId) {
          friendIds.add(u.id);
          friendsList.push({
            id: u.id,
            name: u.name || u.username || 'User',
            username: u.username || 'user',
            avatarUrl: u.avatarUrl || null,
            isOnline: Boolean(u.isOnline),
            isFriend: true,
          });
        }
      }
    }

    const othersList: SearchedChatUser[] = [];
    if (usersRes.status === 'fulfilled') {
      const uPayload = usersRes.value.data?.data ?? usersRes.value.data;
      const users = Array.isArray(uPayload?.users)
        ? uPayload.users
        : Array.isArray(uPayload?.items)
          ? uPayload.items
          : Array.isArray(uPayload)
            ? uPayload
            : [];
      for (const u of users) {
        if (u?.id && u.id !== currentUserId && !friendIds.has(u.id)) {
          othersList.push({
            id: u.id,
            name: u.name || u.username || 'User',
            username: u.username || 'user',
            avatarUrl: u.avatarUrl || null,
            isOnline: Boolean(u.isOnline),
            isFriend: false,
          });
        }
      }
    }

    return { friends: friendsList, others: othersList };
  },

  getSuggestedContacts: async (
    currentUserId?: string
  ): Promise<ChatUser[]> => {
    const [friendsRes, searchRes] = await Promise.allSettled([
      apiClient.get(API_ENDPOINTS.FRIENDS.SUGGESTIONS, {
        params: { limit: 8 },
      }),
      apiClient.get(API_ENDPOINTS.SEARCH.GLOBAL, {
        params: { q: 'a', type: 'USERS', limit: 10 },
      }),
    ]);

    const map = new Map<string, ChatUser>();

    if (friendsRes.status === 'fulfilled') {
      const payload = friendsRes.value.data?.data ?? friendsRes.value.data;
      const list = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
          ? payload
          : [];
      for (const item of list) {
        const u = item?.user || item;
        if (u?.id && u.id !== currentUserId) {
          map.set(u.id, {
            id: u.id,
            name: u.name || u.username || 'User',
            username: u.username || 'user',
            avatarUrl: u.avatarUrl || null,
            isOnline: true,
          });
        }
      }
    }

    if (searchRes.status === 'fulfilled') {
      const payload = searchRes.value.data?.data ?? searchRes.value.data;
      const users = Array.isArray(payload?.users)
        ? payload.users
        : Array.isArray(payload?.items)
          ? payload.items
          : [];
      for (const u of users) {
        if (u?.id && u.id !== currentUserId && !map.has(u.id)) {
          map.set(u.id, {
            id: u.id,
            name: u.name || u.username || 'User',
            username: u.username || 'user',
            avatarUrl: u.avatarUrl || null,
            isOnline: true,
          });
        }
      }
    }

    return Array.from(map.values()).slice(0, 8);
  },
};
