import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'nativewind';
import { appStorage } from '@/lib/storage/secureStorage';
import { FeedItem } from '@/features/feed/types/feed.types';

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
      }}>
      {children}
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
