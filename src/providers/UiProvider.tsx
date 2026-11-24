import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Animated, Appearance, Easing, Platform } from 'react-native';
import { colorScheme as nativewindColorScheme, useColorScheme } from 'nativewind';
import * as SystemUI from 'expo-system-ui';
import { appStorage } from '@/lib/storage/secureStorage';
import { FeedItem } from '@/features/feed/types/feed.types';
import { GlobalToast, ToastItem } from '@/components/ui/GlobalToast';

const LOCALE_STORAGE_KEY = 'peacetweet_locale';
const THEME_STORAGE_KEY = 'peacetweet_theme';

export type PostUploadType = 'STANDARD' | 'BLOOD' | 'UPDATE';
export type ComposerMode = 'TEXT' | 'DUA' | 'BLOOD_REQUEST';
export type ComposerAction = 'photo' | 'feeling' | null;

export interface OpenComposerOptions {
  mode?: ComposerMode;
  action?: ComposerAction;
  editingPost?: FeedItem | null;
}

export interface PhotoViewerState {
  post: FeedItem;
  initialImageUrl?: string;
}

export interface ShowToastOptions {
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  duration?: number;
}

interface UiContextType {
  locale: 'bn' | 'en';
  setLocale: (locale: 'bn' | 'en') => void;
  isMenuDrawerOpen: boolean;
  setMenuDrawerOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  isTabSwipeLocked: boolean;
  isTabSwipeLockedRef: React.MutableRefObject<boolean>;
  setTabSwipeLocked: (locked: boolean) => void;
  registerTabPager: (node: any) => void;
  isComposerModalOpen: boolean;
  setComposerModalOpen: (open: boolean) => void;
  composerInitialMode: ComposerMode;
  composerInitialAction: ComposerAction;
  composerEditingPost: FeedItem | null;
  setComposerEditingPost: (post: FeedItem | null) => void;
  openComposer: (options?: OpenComposerOptions) => void;
  activePhotoViewer: PhotoViewerState | null;
  openPhotoViewer: (post: FeedItem, initialImageUrl?: string) => void;
  closePhotoViewer: () => void;
  chatSearchQuery: string;
  setChatSearchQuery: (query: string) => void;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  isProfileActive: boolean;
  setIsProfileActive: (active: boolean) => void;
  unreadMessagesCount: number;
  setUnreadMessagesCount: React.Dispatch<React.SetStateAction<number>>;
  unreadNotificationsCount: number;
  setUnreadNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
  onlineUserIds: Set<string>;
  setOnlineUserIds: (ids: string[]) => void;
  setUserOnlineStatus: (userId: string, isOnline: boolean) => void;
  isUserOnline: (userId?: string) => boolean;
  isUploadingPost: boolean;
  postUploadType: PostUploadType;
  setIsUploadingPost: (val: boolean, type?: PostUploadType) => void;
  isPostUploadSuccess: boolean;
  setIsPostUploadSuccess: (val: boolean) => void;
  triggerPostSuccess: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  toast: ToastItem | null;
  showToast: (options: ShowToastOptions) => void;
  hideToast: () => void;
  isNavHidden: boolean;
  setNavHidden: (hidden: boolean) => void;
  handleFeedScroll: (event: any) => void;
  resetNavVisibility: () => void;
  topNavTranslateY: Animated.Value;
  bottomNavTranslateY: Animated.Value;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

function getInitialLocale(): 'bn' | 'en' {
  const saved = appStorage.getItem(LOCALE_STORAGE_KEY);
  return saved === 'en' || saved === 'bn' ? saved : 'bn';
}

function getInitialTheme(): 'light' | 'dark' {
  const saved = appStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

// Synchronously apply persisted theme at module load BEFORE first React render
const INITIAL_APP_THEME = getInitialTheme();
try {
  nativewindColorScheme.set(INITIAL_APP_THEME);
  if (Platform.OS !== 'web') {
    Appearance.setColorScheme?.(INITIAL_APP_THEME);
    SystemUI.setBackgroundColorAsync(
      INITIAL_APP_THEME === 'dark' ? '#18191a' : '#ffffff'
    ).catch(() => {});
  } else if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle(
      'dark',
      INITIAL_APP_THEME === 'dark'
    );
  }
} catch {}

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<'bn' | 'en'>(getInitialLocale);
  const [isMenuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const isTabSwipeLockedRef = useRef(false);
  const tabPagerRef = useRef<any>(null);

  const registerTabPager = useCallback((node: any) => {
    tabPagerRef.current = node;
  }, []);

  const setTabSwipeLocked = useCallback((locked: boolean) => {
    isTabSwipeLockedRef.current = locked;
    const node = tabPagerRef.current;
    if (node) {
      if (locked && typeof node.getScrollResponder === 'function') {
        const responder = node.getScrollResponder();
        if (responder) {
          responder.isTouching = false;
        }
      }
      if (typeof node.setNativeProps === 'function') {
        node.setNativeProps({ scrollEnabled: !locked });
      }
      const domNode =
        typeof node.getScrollableNode === 'function'
          ? node.getScrollableNode()
          : node;
      if (domNode && domNode.style) {
        domNode.style.overflowX = locked ? 'hidden' : 'auto';
        domNode.style.touchAction = locked ? 'none' : 'auto';
      }
    }
  }, []);
  const [isComposerModalOpen, setComposerModalOpenState] = useState(false);
  const [composerInitialMode, setComposerInitialMode] = useState<ComposerMode>('TEXT');
  const [composerInitialAction, setComposerInitialAction] = useState<ComposerAction>(null);
  const [composerEditingPost, setComposerEditingPost] = useState<FeedItem | null>(null);

  const [isUploadingPost, setIsUploadingPostState] = useState(false);
  const [postUploadType, setPostUploadType] = useState<PostUploadType>('STANDARD');
  const [isPostUploadSuccess, setIsPostUploadSuccess] = useState(false);
  const [toast, setToast] = useState<ToastItem | null>(null);

  const showToast = useCallback((options: ShowToastOptions) => {
    setToast({
      id: Math.random().toString(36).substring(2, 9),
      message: options.message,
      type: options.type || 'info',
      title: options.title,
      duration: options.duration || 3500,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const setIsUploadingPost = (val: boolean, type: PostUploadType = 'STANDARD') => {
    setIsUploadingPostState(val);
    if (val) {
      setPostUploadType(type);
    }
  };

  const triggerPostSuccess = () => {
    setIsUploadingPostState(false);
    setIsPostUploadSuccess(true);
    setTimeout(() => {
      setIsPostUploadSuccess(false);
    }, 2500);
  };

  const openComposer = (options?: OpenComposerOptions) => {
    if (isUploadingPost) return;
    setComposerInitialMode(options?.mode || 'TEXT');
    setComposerInitialAction(options?.action || null);
    setComposerEditingPost(options?.editingPost || null);
    setComposerModalOpenState(true);
  };

  const setComposerModalOpen = (open: boolean) => {
    if (open && isUploadingPost) return;
    if (!open) {
      setComposerInitialAction(null);
      setComposerEditingPost(null);
    }
    setComposerModalOpenState(open);
  };

  const [activePhotoViewer, setActivePhotoViewer] = useState<PhotoViewerState | null>(null);

  const openPhotoViewer = (post: FeedItem, initialImageUrl?: string) => {
    setActivePhotoViewer({ post, initialImageUrl });
  };

  const closePhotoViewer = () => {
    setActivePhotoViewer(null);
  };
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isProfileActive, setIsProfileActive] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [onlineUserIds, setOnlineUserIdsState] = useState<Set<string>>(
    () => new Set()
  );

  const setOnlineUserIds = useCallback((ids: string[]) => {
    setOnlineUserIdsState(new Set(ids));
  }, []);

  const setUserOnlineStatus = useCallback(
    (userId: string, isOnline: boolean) => {
      setOnlineUserIdsState((prev) => {
        const next = new Set(prev);
        if (isOnline) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    },
    []
  );

  const isUserOnline = useCallback(
    (userId?: string) => {
      if (!userId) return false;
      return onlineUserIds.has(userId);
    },
    [onlineUserIds]
  );

  const { setColorScheme } = useColorScheme();
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const initial = getInitialTheme();
    try {
      nativewindColorScheme.set(initial);
    } catch {}
    return initial;
  });

  useEffect(() => {
    const savedTheme = appStorage.getItem(THEME_STORAGE_KEY);
    const targetTheme =
      savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : theme;
    setThemeState(targetTheme);
    setColorScheme(targetTheme);
  }, [setColorScheme]);

  const setLocale = (nextLocale: 'bn' | 'en') => {
    setLocaleState(nextLocale);
    appStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(nextTheme);
    try {
      nativewindColorScheme.set(nextTheme);
    } catch {}
    setColorScheme(nextTheme);
    appStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  const [isNavHidden, setIsNavHiddenState] = useState(false);
  const isNavHiddenRef = useRef(false);
  const isBottomNavHiddenRef = useRef(false);
  const topNavValueRef = useRef(0);
  const bottomNavValueRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const topNavTranslateY = useRef(new Animated.Value(0)).current;
  const bottomNavTranslateY = useRef(new Animated.Value(0)).current;

  const clearSnapTimer = useCallback(() => {
    if (snapTimerRef.current) {
      clearTimeout(snapTimerRef.current);
      snapTimerRef.current = null;
    }
  }, []);

  const applyNavOffsets = useCallback(
    (nextTop: number, nextBottom: number) => {
      const clampedTop = Math.max(-60, Math.min(0, nextTop));
      const clampedBottom = Math.max(0, Math.min(76, nextBottom));

      if (Math.abs(clampedTop - topNavValueRef.current) > 0.1) {
        topNavValueRef.current = clampedTop;
        topNavTranslateY.setValue(clampedTop);
      }
      if (Math.abs(clampedBottom - bottomNavValueRef.current) > 0.1) {
        bottomNavValueRef.current = clampedBottom;
        bottomNavTranslateY.setValue(clampedBottom);
      }

      isNavHiddenRef.current = clampedTop <= -30;
      isBottomNavHiddenRef.current = clampedBottom >= 38;
    },
    [topNavTranslateY, bottomNavTranslateY]
  );

  const animateNav = useCallback(
    (
      topHidden: boolean,
      bottomHidden: boolean = topHidden,
      customDuration: number = 110
    ) => {
      clearSnapTimer();
      const targetTop = topHidden ? -60 : 0;
      const targetBottom = bottomHidden ? 76 : 0;

      isNavHiddenRef.current = topHidden;
      isBottomNavHiddenRef.current = bottomHidden;
      topNavValueRef.current = targetTop;
      bottomNavValueRef.current = targetBottom;

      const useNative = Platform.OS !== 'web';
      topNavTranslateY.stopAnimation();
      bottomNavTranslateY.stopAnimation();

      if (customDuration <= 0) {
        topNavTranslateY.setValue(targetTop);
        bottomNavTranslateY.setValue(targetBottom);
        setIsNavHiddenState(topHidden);
        return;
      }

      Animated.parallel([
        Animated.timing(topNavTranslateY, {
          toValue: targetTop,
          duration: customDuration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: useNative,
        }),
        Animated.timing(bottomNavTranslateY, {
          toValue: targetBottom,
          duration: customDuration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: useNative,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setIsNavHiddenState(topHidden);
        }
      });
    },
    [topNavTranslateY, bottomNavTranslateY, clearSnapTimer]
  );

  const setNavHidden = useCallback(
    (hidden: boolean) => {
      animateNav(hidden, hidden, 110);
    },
    [animateNav]
  );

  const resetNavVisibility = useCallback(() => {
    clearSnapTimer();
    lastScrollYRef.current = 0;
    if (
      isNavHiddenRef.current ||
      isBottomNavHiddenRef.current ||
      topNavValueRef.current !== 0 ||
      bottomNavValueRef.current !== 0
    ) {
      animateNav(false, false, 0);
    }
  }, [animateNav, clearSnapTimer]);

  useEffect(() => {
    if (isSearchOpen || isMenuDrawerOpen || isComposerModalOpen) {
      resetNavVisibility();
    }
  }, [isSearchOpen, isMenuDrawerOpen, isComposerModalOpen, resetNavVisibility]);

  const handleFeedScroll = useCallback(
    (event: any) => {
      const ne = event?.nativeEvent;
      if (!ne) return;

      const rawY = Math.max(0, ne.contentOffset?.y ?? 0);
      const layoutH = ne.layoutMeasurement?.height ?? 0;
      const contentH = ne.contentSize?.height ?? 0;
      const maxScrollY =
        contentH > 0 && layoutH > 0 ? Math.max(0, contentH - layoutH) : 0;

      const dy = rawY - lastScrollYRef.current;
      lastScrollYRef.current = rawY;

      // Do not hide bars if list content barely overflows the viewport
      if (maxScrollY > 0 && maxScrollY < 100) {
        applyNavOffsets(0, 0);
        return;
      }

      clearSnapTimer();
      topNavTranslateY.stopAnimation();
      bottomNavTranslateY.stopAnimation();

  
      // Move top & bottom bars directly with scroll delta `dy` on the exact same frame (zero timer lag)
      let nextTop = Math.max(-60, Math.min(0, topNavValueRef.current - dy));
      let nextBottom = Math.max(
        0,
        Math.min(76, bottomNavValueRef.current + (dy * 76) / 60)
      );

      // 1. Top edge lock (rawY <= 60): never expose the 60px top padding as an empty gap
      if (rawY <= 60) {
        const minTopAllowed = -rawY;
        if (nextTop < minTopAllowed) {
          nextTop = minTopAllowed;
        }
        const maxBottomAllowed = (rawY * 76) / 60;
        if (nextBottom > maxBottomAllowed) {
          nextBottom = maxBottomAllowed;
        }
      }

      // 2. Bottom edge lock (last post / within 60px of bottom): never expose the 60px bottom padding as an empty gap
      if (maxScrollY >= 100 && rawY >= maxScrollY - 60) {
        const remainingToBottom = Math.max(0, maxScrollY - rawY);
        const maxBottomAllowed = (remainingToBottom * 76) / 60;
        if (nextBottom > maxBottomAllowed) {
          nextBottom = maxBottomAllowed;
        }
      }

      applyNavOffsets(nextTop, nextBottom);

      // If scroll stops with a bar partially mid-way, snap cleanly after 90ms of inactivity
      if (
        (nextTop > -60 && nextTop < 0) ||
        (nextBottom > 0 && nextBottom < 76)
      ) {
        snapTimerRef.current = setTimeout(() => {
          snapTimerRef.current = null;
          const isAtTop = lastScrollYRef.current <= 60;
          const isAtBottom =
            maxScrollY >= 100 && lastScrollYRef.current >= maxScrollY - 60;
          const shouldHideTop = !isAtTop && topNavValueRef.current < -30;
          const shouldHideBottom =
            !isAtTop && !isAtBottom && bottomNavValueRef.current > 38;
          animateNav(shouldHideTop, shouldHideBottom, 90);
        }, 90);
      }
    },
    [
      applyNavOffsets,
      animateNav,
      clearSnapTimer,
      topNavTranslateY,
      bottomNavTranslateY,
    ]
  );

  return (
    <UiContext.Provider
      value={{
        locale,
        setLocale,
        isMenuDrawerOpen,
        setMenuDrawerOpen,
        isSearchOpen,
        setSearchOpen,
        isTabSwipeLocked: isTabSwipeLockedRef.current,
        isTabSwipeLockedRef,
        setTabSwipeLocked,
        registerTabPager,
        isComposerModalOpen,
        setComposerModalOpen,
        composerInitialMode,
        composerInitialAction,
        composerEditingPost,
        setComposerEditingPost,
        openComposer,
        activePhotoViewer,
        openPhotoViewer,
        closePhotoViewer,
        chatSearchQuery,
        setChatSearchQuery,
        activeConversationId,
        setActiveConversationId,
        isProfileActive,
        setIsProfileActive,
        unreadMessagesCount,
        setUnreadMessagesCount,
        unreadNotificationsCount,
        setUnreadNotificationsCount,
        onlineUserIds,
        setOnlineUserIds,
        setUserOnlineStatus,
        isUserOnline,
        isUploadingPost,
        postUploadType,
        setIsUploadingPost,
        isPostUploadSuccess,
        setIsPostUploadSuccess,
        triggerPostSuccess,
        theme,
        toggleTheme,
        toast,
        showToast,
        hideToast,
        isNavHidden,
        setNavHidden,
        handleFeedScroll,
        resetNavVisibility,
        topNavTranslateY,
        bottomNavTranslateY,
      }}>
      {children}
      <GlobalToast toast={toast} onDismiss={hideToast} />
    </UiContext.Provider>
  );
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) {
    throw new Error('useUi must be used within a UiProvider');
  }
  return ctx;
}
