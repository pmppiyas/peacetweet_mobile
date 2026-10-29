import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { router } from 'expo-router';
import { feedApi } from '@/features/feed/api/feed.api';
import {
  CreatePostInput,
  FeedItem,
} from '@/features/feed/types/feed.types';
import { bookmarkApi } from '@/features/bookmark/api/bookmark.api';
import { chatApi } from '@/features/chat/api/chat.api';
import { notificationsApi } from '@/features/notifications/api/notifications.api';
import { CACHE_KEYS, queryCache } from '@/lib/cache/queryCache';
import { TimeSlot } from '@/types/saved.types';
import { useAuth } from './AuthProvider';

interface FeedContextType {
  items: FeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refreshFeed: () => Promise<void>;
  createPost: (input: CreatePostInput) => Promise<FeedItem>;
  toggleReaction: (postId: string, currentlyReacted: boolean) => Promise<void>;
  toggleSave: (postId: string, currentlySaved: boolean) => Promise<void>;
  updatePostTimeSlot: (postId: string, timeSlot: TimeSlot | null) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  updateCommentCount: (postId: string, count: number) => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<FeedItem[]>(
    () => queryCache.get<FeedItem[]>(CACHE_KEYS.FEED_ITEMS) || []
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !queryCache.has(CACHE_KEYS.FEED_ITEMS)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFeedState = useCallback(
    (updater: FeedItem[] | ((prev: FeedItem[]) => FeedItem[])) => {
      setItems((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        queryCache.set(CACHE_KEYS.FEED_ITEMS, next);
        return next;
      });
    },
    []
  );

  const fetchFeed = useCallback(
    async (silent = false) => {
      if (!silent && !queryCache.has(CACHE_KEYS.FEED_ITEMS)) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const response = await feedApi.getFeed({ limit: 30 });
        const feedData = (response as any)?.data ?? response;
        const list: FeedItem[] = Array.isArray(feedData?.items)
          ? feedData.items
          : Array.isArray(feedData)
            ? feedData
            : [];
        updateFeedState(list);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Failed to load feed from localhost:5000'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [updateFeedState]
  );

  useEffect(() => {
    fetchFeed(queryCache.has(CACHE_KEYS.FEED_ITEMS));

    // Pre-warm cache for Saved, Messages, and Notifications tabs when authenticated
    if (isAuthenticated) {
      if (!queryCache.has(CACHE_KEYS.SAVED_ITEMS)) {
        bookmarkApi
          .getSavedItems({ timeSlot: 'all', type: 'ALL', limit: 50 })
          .then((res) => {
            const list = ((res as any)?.data ?? res) as any[];
            if (Array.isArray(list)) {
              queryCache.set(CACHE_KEYS.SAVED_ITEMS, list);
            }
          })
          .catch(() => {});
      }
      if (!queryCache.has(CACHE_KEYS.CHAT_CONVERSATIONS)) {
        chatApi
          .getConversations()
          .then((list) => {
            queryCache.set(CACHE_KEYS.CHAT_CONVERSATIONS, list);
          })
          .catch(() => {});
      }
      if (!queryCache.has(CACHE_KEYS.NOTIFICATIONS_LIST)) {
        notificationsApi
          .getNotifications({ page: 1, limit: 40 })
          .then((res) => {
            queryCache.set(CACHE_KEYS.NOTIFICATIONS_LIST, res.data || []);
          })
          .catch(() => {});
      }
    }
  }, [fetchFeed, isAuthenticated]);

  const refreshFeed = useCallback(async () => {
    setIsRefreshing(true);
    await fetchFeed(true);
  }, [fetchFeed]);

  const createPost = useCallback(
    async (input: CreatePostInput): Promise<FeedItem> => {
      const res = await feedApi.createPost(input);
      const created = ((res as any)?.data ?? res) as FeedItem;
      if (created && created.id) {
        setItems((prev) => [created, ...prev]);
      } else {
        await fetchFeed(true);
      }
      return created;
    },
    [fetchFeed]
  );

  const toggleReaction = useCallback(
    async (postId: string, currentlyReacted: boolean) => {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // Optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.id === postId
            ? {
                ...item,
                viewer: {
                  ...item.viewer,
                  hasReacted: !currentlyReacted,
                },
                stats: {
                  ...item.stats,
                  reactionCount: Math.max(
                    0,
                    (item.stats?.reactionCount || 0) +
                      (currentlyReacted ? -1 : 1)
                  ),
                },
              }
            : item
        )
      );

      try {
        const res = currentlyReacted
          ? await feedApi.unreactToPost(postId)
          : await feedApi.reactToPost(postId);
        const payload = (res as any)?.data ?? res;
        if (payload && typeof payload.reactionCount === 'number') {
          setItems((prev) =>
            prev.map((item) =>
              item.id === postId
                ? {
                    ...item,
                    viewer: {
                      ...item.viewer,
                      hasReacted: Boolean(payload.hasReacted),
                    },
                    stats: {
                      ...item.stats,
                      reactionCount: payload.reactionCount,
                    },
                  }
                : item
            )
          );
        }
      } catch {
        // Revert on error
        await fetchFeed(true);
      }
    },
    [isAuthenticated, fetchFeed]
  );

  const toggleSave = useCallback(
    async (postId: string, currentlySaved: boolean) => {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // Optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.id === postId
            ? {
                ...item,
                viewer: {
                  ...item.viewer,
                  hasSaved: !currentlySaved,
                },
                stats: {
                  ...item.stats,
                  saveCount: Math.max(
                    0,
                    (item.stats?.saveCount || 0) + (currentlySaved ? -1 : 1)
                  ),
                },
              }
            : item
        )
      );

      try {
        if (currentlySaved) {
          await feedApi.unsavePost(postId);
        } else {
          await feedApi.savePost(postId);
        }
      } catch {
        await fetchFeed(true);
      }
    },
    [isAuthenticated, fetchFeed]
  );

  const updatePostTimeSlot = useCallback(
    async (postId: string, timeSlot: TimeSlot | null) => {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === postId
            ? {
                ...item,
                viewer: {
                  ...item.viewer,
                  hasSaved: true,
                  timeSlot,
                },
                stats: {
                  ...item.stats,
                  saveCount: item.viewer?.hasSaved
                    ? item.stats?.saveCount || 1
                    : (item.stats?.saveCount || 0) + 1,
                },
              }
            : item
        )
      );

      try {
        await bookmarkApi.updateTimeSlot({
          id: postId,
          type: 'POST',
          timeSlot,
        });
      } catch {
        await fetchFeed(true);
      }
    },
    [isAuthenticated, fetchFeed]
  );

  const deletePost = useCallback(async (postId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== postId));
    try {
      await feedApi.deletePost(postId);
    } catch {
      await fetchFeed(true);
    }
  }, [fetchFeed]);

  const updateCommentCount = useCallback((postId: string, count: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === postId
          ? {
              ...item,
              stats: {
                ...item.stats,
                commentCount: count,
              },
            }
          : item
      )
    );
  }, []);

  return (
    <FeedContext.Provider
      value={{
        items,
        isLoading,
        isRefreshing,
        error,
        refreshFeed,
        createPost,
        toggleReaction,
        toggleSave,
        updatePostTimeSlot,
        deletePost,
        updateCommentCount,
      }}>
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return ctx;
}
