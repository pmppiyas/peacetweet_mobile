import { appStorage } from '../storage/secureStorage';

interface CacheEntry<T = any> {
  data: T;
  updatedAt: number;
}

const memoryCache = new Map<string, CacheEntry>();
const STORAGE_PREFIX = 'pt_cache_';

export const CACHE_KEYS = {
  FEED_ITEMS: 'feed:items',
  SAVED_ITEMS: 'saved:items',
  CHAT_CONVERSATIONS: 'chat:conversations',
  CHAT_MESSAGES: (conversationId: string) => `chat:messages:${conversationId}`,
  NOTIFICATIONS_LIST: 'notifications:list',
} as const;

export const queryCache = {
  get<T>(key: string): T | undefined {
    const inMem = memoryCache.get(key);
    if (inMem !== undefined) {
      return inMem.data as T;
    }

    try {
      const raw = appStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (raw) {
        const parsed = JSON.parse(raw) as CacheEntry<T>;
        if (parsed && 'data' in parsed) {
          memoryCache.set(key, parsed);
          return parsed.data;
        }
      }
    } catch {}

    return undefined;
  },

  has(key: string): boolean {
    if (memoryCache.has(key)) return true;
    return this.get(key) !== undefined;
  },

  set<T>(key: string, data: T, persist = true): void {
    const entry: CacheEntry<T> = {
      data,
      updatedAt: Date.now(),
    };
    memoryCache.set(key, entry);

    if (persist) {
      try {
        appStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
      } catch {}
    }
  },

  invalidate(key: string): void {
    memoryCache.delete(key);
    try {
      appStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch {}
  },

  clearAll(): void {
    memoryCache.clear();
  },
};
