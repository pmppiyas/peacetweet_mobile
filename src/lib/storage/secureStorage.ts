import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { User } from '@/types/user.types';

const ACCESS_TOKEN_KEY = 'peacetweet_access_token';
const REFRESH_TOKEN_KEY = 'peacetweet_refresh_token';
const USER_SESSION_KEY = 'peacetweet_user';
const NATIVE_STORE_FILENAME = 'peacetweet_storage.json';

const memoryStore = new Map<string, string>();
let nativeStoreHydrated = false;

function hydrateNativeStore(): void {
  if (nativeStoreHydrated || Platform.OS === 'web') return;
  nativeStoreHydrated = true;
  try {
    const file = new File(Paths.document, NATIVE_STORE_FILENAME);
    if (file.exists) {
      const parsed = JSON.parse(file.textSync()) as Record<string, string>;
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string') {
          memoryStore.set(k, v);
        }
      }
    }
  } catch {
    // Fallback to in-memory store if filesystem isn't ready
  }
}

function flushNativeStore(): void {
  if (Platform.OS === 'web') return;
  try {
    const file = new File(Paths.document, NATIVE_STORE_FILENAME);
    const serialized: Record<string, string> = {};
    memoryStore.forEach((value, key) => {
      serialized[key] = value;
    });
    file.writeSync(JSON.stringify(serialized));
  } catch {
    // Ignore disk write errors
  }
}

function getRawItem(key: string): string | null {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  }
  hydrateNativeStore();
  return memoryStore.get(key) ?? null;
}

function setRawItem(key: string, value: string): void {
  memoryStore.set(key, value);
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
    return;
  }
  hydrateNativeStore();
  memoryStore.set(key, value);
  flushNativeStore();
}

function removeRawItem(key: string): void {
  memoryStore.delete(key);
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
    } catch {}
    return;
  }
  hydrateNativeStore();
  memoryStore.delete(key);
  flushNativeStore();
}

export const appStorage = {
  getItem: getRawItem,
  setItem: setRawItem,
  removeItem: removeRawItem,
};

export const tokenStorage = {
  getAccessToken(): string | null {
    return getRawItem(ACCESS_TOKEN_KEY);
  },
  setAccessToken(token: string): void {
    setRawItem(ACCESS_TOKEN_KEY, token);
  },
  getRefreshToken(): string | null {
    return getRawItem(REFRESH_TOKEN_KEY);
  },
  setRefreshToken(token: string): void {
    setRawItem(REFRESH_TOKEN_KEY, token);
  },
  clearTokens(): void {
    removeRawItem(ACCESS_TOKEN_KEY);
    removeRawItem(REFRESH_TOKEN_KEY);
  },
};

export const sessionStorage = {
  getUser(): User | null {
    const raw = getRawItem(USER_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  setUser(user: User): void {
    setRawItem(USER_SESSION_KEY, JSON.stringify(user));
  },
  clearUser(): void {
    removeRawItem(USER_SESSION_KEY);
  },
};
