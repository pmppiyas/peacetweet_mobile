import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Animated } from 'react-native';
import { useColorScheme } from 'nativewind';
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
  unreadMessagesCount: number;
  setUnreadMessagesCount: (count: number) => void;
  unreadNotificationsCount: number;
  setUnreadNotificationsCount: (count: number) => void;
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

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<'bn' | 'en'>(getInitialLocale);
  const [isMenuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
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
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    const savedTheme = appStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setColorScheme(savedTheme);
    }
  }, [setColorScheme]);

  const setLocale = (nextLocale: 'bn' | 'en') => {
    setLocaleState(nextLocale);
    appStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  };

  const theme = colorScheme === 'dark' ? 'dark' : 'light';

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setColorScheme(nextTheme);
    appStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  const [isNavHidden, setIsNavHiddenState] = useState(false);
  const isNavHiddenRef = useRef(false);
  const lastScrollYRef = useRef(0);
  const scrollDeltaRef = useRef(0);
  const topNavTranslateY = useRef(new Animated.Value(0)).current;
  const bottomNavTranslateY = useRef(new Animated.Value(0)).current;

  const setNavHidden = useCallback((hidden: boolean) => {
    if (isNavHiddenRef.current === hidden) return;
    isNavHiddenRef.current = hidden;
    setIsNavHiddenState(hidden);
  }, []);

  const resetNavVisibility = useCallback(() => {
    lastScrollYRef.current = 0;
    scrollDeltaRef.current = 0;
    if (isNavHiddenRef.current) {
      isNavHiddenRef.current = false;
      setIsNavHiddenState(false);
    }
  }, []);

  useEffect(() => {
    if (isSearchOpen || isMenuDrawerOpen || isComposerModalOpen) {
      resetNavVisibility();
    }
  }, [isSearchOpen, isMenuDrawerOpen, isComposerModalOpen, resetNavVisibility]);

  const handleFeedScroll = useCallback((event: any) => {
    const ne = event?.nativeEvent;
    if (!ne) return;

    const rawY = ne.contentOffset?.y ?? 0;
    const layoutH = ne.layoutMeasurement?.height ?? 0;
    const contentH = ne.contentSize?.height ?? 0;

    // Always show bars near the very top of the page
    if (rawY <= 24) {
      lastScrollYRef.current = Math.max(0, rawY);
      scrollDeltaRef.current = 0;
      if (isNavHiddenRef.current) {
        isNavHiddenRef.current = false;
        setIsNavHiddenState(false);
      }
      return;
    }

    if (contentH > 0 && layoutH > 0) {
      // Do not hide bars if list content barely overflows the viewport
      if (contentH - layoutH < 120) {
        return;
      }
      // Ignore bottom rubber-band bounce
      if (rawY >= contentH - layoutH - 8) {
        lastScrollYRef.current = rawY;
        return;
      }
    }

    const dy = rawY - lastScrollYRef.current;
    lastScrollYRef.current = rawY;

    if (Math.abs(dy) < 1.5) return;

    if (
      (dy > 0 && scrollDeltaRef.current < 0) ||
      (dy < 0 && scrollDeltaRef.current > 0)
    ) {
      scrollDeltaRef.current = 0;
    }

    scrollDeltaRef.current += dy;

    // Swiping upward (scrolling down the feed): slide Navbar up & MobileNav down
    if (
      dy > 0 &&
      rawY > 44 &&
      scrollDeltaRef.current > 16 &&
      !isNavHiddenRef.current
    ) {
      isNavHiddenRef.current = true;
      scrollDeltaRef.current = 0;
      setIsNavHiddenState(true);
      return;
    }

    // Swiping downward (scrolling back toward top): slide Navbar & MobileNav back in
    if (dy < 0 && scrollDeltaRef.current < -14 && isNavHiddenRef.current) {
      isNavHiddenRef.current = false;
      scrollDeltaRef.current = 0;
      setIsNavHiddenState(false);
    }
  }, []);

  return (
    <UiContext.Provider
      value={{
        locale,
        setLocale,
        isMenuDrawerOpen,
        setMenuDrawerOpen,
        isSearchOpen,
        setSearchOpen,
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
        unreadMessagesCount,
        setUnreadMessagesCount,
        unreadNotificationsCount,
        setUnreadNotificationsCount,
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
