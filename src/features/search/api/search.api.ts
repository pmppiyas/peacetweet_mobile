import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import { appStorage, tokenStorage } from '@/lib/storage/secureStorage';
import { CACHE_KEYS, queryCache } from '@/lib/cache/queryCache';
import { ApiResponse } from '@/types/api.types';
import {
  AddSearchHistoryInput,
  GlobalSearchResult,
  SearchHistoryItem,
  SearchScope,
} from '../types/search.types';

const LOCAL_STORAGE_KEY = 'peacetweet_guest_search_history';

type SearchHistoryListener = (items: SearchHistoryItem[]) => void;
const historyListeners = new Set<SearchHistoryListener>();

export function subscribeToSearchHistory(
  listener: SearchHistoryListener
): () => void {
  historyListeners.add(listener);
  return () => {
    historyListeners.delete(listener);
  };
}

export function notifySearchHistoryChanged(items: SearchHistoryItem[]): void {
  historyListeners.forEach((fn) => {
    try {
      fn(items);
    } catch {}
  });
}

export function getLocalSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = appStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalSearchHistory(items: SearchHistoryItem[]): void {
  try {
    const trimmed = items.slice(0, 20);
    appStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
    queryCache.set(CACHE_KEYS.SEARCH_HISTORY, trimmed);
    notifySearchHistoryChanged(trimmed);
  } catch {}
}

function isUserAuthenticated(passedAuth?: boolean): boolean {
  if (typeof passedAuth === 'boolean') {
    return passedAuth;
  }
  return Boolean(tokenStorage.getAccessToken());
}

export const searchApi = {
  searchGlobal: async (params: {
    q: string;
    type?: SearchScope;
    limit?: number;
  }): Promise<GlobalSearchResult> => {
    const { data } = await apiClient.get<ApiResponse<GlobalSearchResult>>(
      API_ENDPOINTS.SEARCH.GLOBAL,
      { params: { ...params, q: params.q.normalize('NFC') } }
    );
    const payload = (data as any)?.data || data;
    const rawDuas: any[] = Array.isArray(payload?.duas) ? payload.duas : [];
    const duas = rawDuas.map((d) => {
      const meaning: string = d.meaningBangla || d.meaning || '';
      const fallbackTitle =
        meaning.length > 70 ? `${meaning.slice(0, 70).trim()}…` : meaning;
      return {
        ...d,
        title: d.title || fallbackTitle || d.transliteration || 'Dua',
        meaningBangla: meaning,
      };
    });
    return {
      query: payload?.query || params.q,
      scope: payload?.scope || params.type || 'ALL',
      users: Array.isArray(payload?.users) ? payload.users : [],
      duas,
      groups: Array.isArray(payload?.groups) ? payload.groups : [],
      posts: Array.isArray(payload?.posts) ? payload.posts : [],
      total:
        typeof payload?.total === 'number'
          ? payload.total
          : (payload?.users?.length || 0) +
            duas.length +
            (payload?.groups?.length || 0) +
            (payload?.posts?.length || 0),
    };
  },

  getSearchHistory: async (
    limit: number = 15,
    isAuthenticated?: boolean
  ): Promise<SearchHistoryItem[]> => {
    const isAuthed = isUserAuthenticated(isAuthenticated);
    const local = getLocalSearchHistory();
    if (isAuthed) {
      try {
        const { data } = await apiClient.get<ApiResponse<SearchHistoryItem[]>>(
          API_ENDPOINTS.SEARCH.HISTORY,
          { params: { limit } }
        );
        const list = (data as any)?.data || data;
        if (Array.isArray(list)) {
          saveLocalSearchHistory(list);
          return list;
        }
      } catch {
        // Fallback to local
      }
    }
    return local;
  },

  addSearchHistory: async (
    input: AddSearchHistoryInput,
    isAuthenticated?: boolean
  ): Promise<SearchHistoryItem> => {
    const cleanQuery = input.query.trim();
    if (!cleanQuery) {
      throw new Error('Search query cannot be empty');
    }

    const isAuthed = isUserAuthenticated(isAuthenticated);

    // Create optimistic local record
    const localItem: SearchHistoryItem = {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: isAuthed ? 'me' : 'guest',
      query: cleanQuery,
      entityType: input.entityType || 'KEYWORD',
      entityId: input.entityId || null,
      entityName: input.entityName || null,
      entityAvatar: input.entityAvatar || null,
      entitySubtext: input.entitySubtext || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Deduplicate: move newest query to the top
    const prev = getLocalSearchHistory().filter((h) => {
      if (input.entityId && h.entityId) {
        return h.entityId !== input.entityId;
      }
      return h.query.toLowerCase() !== cleanQuery.toLowerCase();
    });

    const optimisticList = [localItem, ...prev].slice(0, 20);
    saveLocalSearchHistory(optimisticList);

    // If authenticated (or access token present in storage), post to backend API
    if (isAuthed) {
      try {
        const { data } = await apiClient.post<ApiResponse<SearchHistoryItem>>(
          API_ENDPOINTS.SEARCH.HISTORY,
          {
            query: cleanQuery,
            entityType: input.entityType || 'KEYWORD',
            entityId: input.entityId || null,
            entityName: input.entityName || null,
            entityAvatar: input.entityAvatar || null,
            entitySubtext: input.entitySubtext || null,
          }
        );
        const serverItem = (data as any)?.data || data;
        if (serverItem && serverItem.id) {
          const synced = [
            serverItem,
            ...prev.filter((h) => h.id !== serverItem.id),
          ].slice(0, 20);
          saveLocalSearchHistory(synced);
          return serverItem;
        }
      } catch (err) {
        return localItem;
      }
    }
    return localItem;
  },

  deleteSearchHistoryItem: async (
    id: string,
    isAuthenticated?: boolean
  ): Promise<boolean> => {
    const isAuthed = isUserAuthenticated(isAuthenticated);
    const updated = getLocalSearchHistory().filter((item) => item.id !== id);
    saveLocalSearchHistory(updated);

    if (
      isAuthed &&
      !id.startsWith('local_') &&
      !id.startsWith('guest_') &&
      !id.startsWith('temp_')
    ) {
      try {
        await apiClient.delete<ApiResponse<null>>(
          API_ENDPOINTS.SEARCH.DELETE_HISTORY(id)
        );
      } catch {}
    }
    return true;
  },

  clearSearchHistory: async (
    isAuthenticated?: boolean
  ): Promise<boolean> => {
    const isAuthed = isUserAuthenticated(isAuthenticated);
    saveLocalSearchHistory([]);
    if (isAuthed) {
      try {
        await apiClient.delete<ApiResponse<null>>(
          API_ENDPOINTS.SEARCH.CLEAR_HISTORY
        );
      } catch {}
    }
    return true;
  },
};
