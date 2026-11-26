import '../../global.css';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Platform,
  ScrollView,
  ToastAndroid,
  useWindowDimensions,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router, Slot, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { NavigationBar } from 'expo-navigation-bar';
import * as WebBrowser from 'expo-web-browser';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();
import { UiProvider, useUi } from '@/providers/UiProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { FeedProvider } from '@/providers/FeedProvider';
import { Navbar } from '@/components/navigation/Navbar';
import { MobileNav } from '@/components/navigation/MobileNav';
import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/navMetrics';
import { MenuDrawer } from '@/components/navigation/MenuDrawer';
import { MobileComposerModal } from '@/components/feed/MobileComposerModal';
import { GlobalPhotoViewerModal } from '@/components/feed/GlobalPhotoViewerModal';
import { AppSplashLoader } from '@/components/ui/AppSplashLoader';
import { SearchPageView } from '@/features/search/components/SearchPageView';
import { useUnreadBadgeSync } from '@/hooks/useUnreadBadgeSync';
import HomeScreen from './index';
import SavedScreen from './saved';
import MessagesScreen from './messages';
import NotificationsScreen from './notifications';

SplashScreen.preventAutoHideAsync();

const COLLAPSIBLE_NAV_ROUTES = new Set([
  '/',
  '/saved',
  '/notifications',
  '/zakat',
  '/points',
  '/redeem',
  '/purpose',
  '/terms',
  '/privacy',
  '/feedback',
  '/messages',
]);

const NON_PROFILE_ROOT_SEGMENTS = new Set([
  '',
  'saved',
  'messages',
  'message',
  'notifications',
  'blood',
  'friends',
  'groups',
  'zakat',
  'points',
  'redeem',
  'purpose',
  'feedback',
  'settings',
  'login',
  'register',
  'create',
  'search',
  'explore',
  'post',
  'duas',
  'categories',
  'users',
  'terms',
  'privacy',
  'admin',
  'auth',
  'api',
]);

export function isProfilePathname(pathname: string): boolean {
  const clean = pathname.replace(/\/$/, '') || '/';
  if (clean === '/profile' || clean.startsWith('/profile/')) return true;
  const parts = clean.split('/').filter(Boolean);
  if (parts.length === 1 && !NON_PROFILE_ROOT_SEGMENTS.has(parts[0].toLowerCase())) {
    return true;
  }
  return false;
}

const TAB_ORDER = ['/', '/saved', '/messages', '/notifications'] as const;

function MainContentSlot({
  topOffset,
  bottomOffset,
}: {
  topOffset: number;
  bottomOffset: number;
}) {
  return (
    <View
      style={{ paddingTop: topOffset, paddingBottom: bottomOffset }}
      className="flex-1 min-h-0 relative">
      <Slot />
    </View>
  );
}

function AppShell() {
  useUnreadBadgeSync();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const pathname = usePathname();
  const {
    theme,
    locale,
    activePhotoViewer,
    closePhotoViewer,
    isSearchOpen,
    setSearchOpen,
    isMenuDrawerOpen,
    setMenuDrawerOpen,
    isComposerModalOpen,
    setComposerModalOpen,
    activeConversationId,
    setIsProfileActive,
    resetNavVisibility,
    topNavTranslateY,
    bottomNavTranslateY,
    isTabSwipeLocked,
    isTabSwipeLockedRef,
    registerTabPager,
  } = useUi();

  const lastBackPressRef = useRef<number>(0);

  const latestBackStateRef = useRef({
    pathname,
    locale,
    activePhotoViewer,
    closePhotoViewer,
    isSearchOpen,
    setSearchOpen,
    isMenuDrawerOpen,
    setMenuDrawerOpen,
    isComposerModalOpen,
    setComposerModalOpen,
    activeConversationId,
  });
  latestBackStateRef.current = {
    pathname,
    locale,
    activePhotoViewer,
    closePhotoViewer,
    isSearchOpen,
    setSearchOpen,
    isMenuDrawerOpen,
    setMenuDrawerOpen,
    isComposerModalOpen,
    setComposerModalOpen,
    activeConversationId,
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const state = latestBackStateRef.current;

      // 1. Close any open non-Modal or global overlays first
      if (state.activePhotoViewer) {
        state.closePhotoViewer();
        return true;
      }
      if (state.isSearchOpen) {
        state.setSearchOpen(false);
        return true;
      }
      if (state.isMenuDrawerOpen) {
        state.setMenuDrawerOpen(false);
        return true;
      }
      if (state.isComposerModalOpen) {
        state.setComposerModalOpen(false);
        return true;
      }

      // 2. If inside an active mobile chat in /messages, let MessagesScreen close the chat
      const isMessagesRoute =
        state.pathname === '/messages' ||
        state.pathname.startsWith('/messages/');
      if (isMessagesRoute && state.activeConversationId) {
        return false;
      }

      // 3. On Home page ('/'): require double back-swipe within 2 seconds to exit
      if (state.pathname === '/') {
        const now = Date.now();
        if (now - lastBackPressRef.current <= 2000) {
          lastBackPressRef.current = 0;
          BackHandler.exitApp();
          return true;
        }
        lastBackPressRef.current = now;
        ToastAndroid.show(
          state.locale === 'bn'
            ? 'বের হতে আবার ব্যাক করুন'
            : 'Swipe back again to exit',
          ToastAndroid.SHORT
        );
        return true;
      }

      // 4. On any other route: go back in history if available, otherwise return to Home ('/')
      if (router.canGoBack()) {
        return false;
      }
      router.replace('/');
      return true;
    });

    return () => sub.remove();
  }, []);

  const isDark = theme === 'dark';
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPostViewerPage = pathname.startsWith('/post/');
  const isPhotoViewerActive = isPostViewerPage || Boolean(activePhotoViewer);
  const isMessagesActive =
    pathname === '/messages' || pathname.startsWith('/messages/');
  const isInsideActiveChat =
    isMessagesActive && Boolean(activeConversationId);
  const isSettingsProfile = pathname === '/settings/profile';
  const isProfileRoute = isProfilePathname(pathname);

  useEffect(() => {
    setIsProfileActive(isProfileRoute || isSettingsProfile);
  }, [isProfileRoute, isSettingsProfile, setIsProfileActive]);

  const showTopNav =
    !isAuthPage &&
    !isPostViewerPage &&
    !isInsideActiveChat &&
    !isProfileRoute &&
    !isSettingsProfile;
  const showBottomNav = showTopNav && !isSearchOpen;
  const showSearchOverlay = isSearchOpen && !isMessagesActive;
  const isFullBleedRoute = COLLAPSIBLE_NAV_ROUTES.has(pathname);

  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  const currentTabIndex = (TAB_ORDER as readonly string[]).indexOf(normalizedPath);
  const isTabRoute = currentTabIndex !== -1;

  const canSwipeTabs =
    isTabRoute &&
    !isInsideActiveChat &&
    !isSearchOpen &&
    !isMenuDrawerOpen &&
    !isComposerModalOpen &&
    !isPhotoViewerActive &&
    !isProfileRoute &&
    !isSettingsProfile &&
    !isTabSwipeLocked;

  const [containerWidth, setContainerWidth] = React.useState<number>(0);
  const effectiveWidth =
    containerWidth > 0
      ? containerWidth
      : Math.max(0, screenWidth - insets.left - insets.right);

  const [activeTab, setActiveTab] = React.useState<string>(normalizedPath);
  const activeTabRef = useRef<string>(normalizedPath);
  const currentScrolledIndexRef = useRef<number>(currentTabIndex);
  const dragStartIndexRef = useRef<number>(currentTabIndex);

  const pagerRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const isManualScrollingRef = useRef(false);
  const hasInitialScrolledRef = useRef(false);

  useEffect(() => {
    if (activeTab !== '/' || pathname !== '/') {
      lastBackPressRef.current = 0;
    }
    resetNavVisibility();
  }, [activeTab, pathname, resetNavVisibility]);

  useEffect(() => {
    if (isTabRoute) {
      activeTabRef.current = normalizedPath;
      setActiveTab(normalizedPath);
      const idx = (TAB_ORDER as readonly string[]).indexOf(normalizedPath);
      if (idx !== -1) {
        currentScrolledIndexRef.current = idx;
        dragStartIndexRef.current = idx;
      }
    }
  }, [normalizedPath, isTabRoute]);

  // Sync horizontal pager when tab is switched via bottom bar or links
  useEffect(() => {
    if (currentScrolledIndexRef.current === currentTabIndex) {
      return;
    }
    if (isManualScrollingRef.current) return;
    currentScrolledIndexRef.current = currentTabIndex;
    dragStartIndexRef.current = currentTabIndex;
    if (isTabRoute && pagerRef.current && effectiveWidth > 0 && currentTabIndex >= 0) {
      const isInitial = !hasInitialScrolledRef.current;
      hasInitialScrolledRef.current = true;
      pagerRef.current.scrollTo({
        x: currentTabIndex * effectiveWidth,
        animated: !isInitial,
      });
    }
  }, [currentTabIndex, isTabRoute, effectiveWidth]);

  //Instant continuous active tab calculation during drag / momentum
  const handleScroll = (offsetX: number) => {
    if (effectiveWidth <= 0) return;
    const rawIndex = offsetX / effectiveWidth;
    const currentIndex = currentScrolledIndexRef.current;
    const diff = rawIndex - currentIndex;

    if (Math.abs(diff) > 0.02) {
      resetNavVisibility();
    }

    let pageIndex = currentIndex;
    if (diff >= 0.2) {
      const step = Math.max(1, Math.round(diff));
      pageIndex = Math.min(TAB_ORDER.length - 1, currentIndex + step);
    } else if (diff <= -0.2) {
      const step = Math.min(-1, Math.round(diff));
      pageIndex = Math.max(0, currentIndex + step);
    }

    const route = TAB_ORDER[pageIndex];
    if (route && route !== activeTabRef.current) {
      activeTabRef.current = route;
      setActiveTab(route);
      resetNavVisibility();
    }
  };

  const handleScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (effectiveWidth <= 0) return;
    const currentX = e.nativeEvent.contentOffset.x;
    const rawIndex = currentX / effectiveWidth;
    const currentIndex = currentScrolledIndexRef.current;
    const diff = rawIndex - currentIndex;

    let pageIndex = currentIndex;
    if (diff >= 0.2) {
      const step = Math.max(1, Math.round(diff));
      pageIndex = Math.min(TAB_ORDER.length - 1, currentIndex + step);
    } else if (diff <= -0.2) {
      const step = Math.min(-1, Math.round(diff));
      pageIndex = Math.max(0, currentIndex + step);
    }

    const route = TAB_ORDER[pageIndex];
    if (route) {
      if (route !== activeTabRef.current) {
        activeTabRef.current = route;
        setActiveTab(route);
      }
      if (route !== '/') {
        resetNavVisibility();
      }
    }
  };

  const handleMomentumEnd = (offsetX: number) => {
    isManualScrollingRef.current = false;
    if (effectiveWidth <= 0) return;
    const pageIndex = Math.min(
      TAB_ORDER.length - 1,
      Math.max(0, Math.round(offsetX / effectiveWidth))
    );
    currentScrolledIndexRef.current = pageIndex;
    dragStartIndexRef.current = pageIndex;
    const route = TAB_ORDER[pageIndex];
    if (route) {
      activeTabRef.current = route;
      setActiveTab(route);
      if (route !== '/') {
        resetNavVisibility();
      }
      if (route !== pathname) {
        router.replace(route as any);
      }
    }
  };

  useEffect(() => {
    if (
      !isFullBleedRoute ||
      isSearchOpen ||
      isMenuDrawerOpen ||
      isComposerModalOpen ||
      activePhotoViewer
    ) {
      resetNavVisibility();
    }
  }, [
    isFullBleedRoute,
    isSearchOpen,
    isMenuDrawerOpen,
    isComposerModalOpen,
    activePhotoViewer,
    resetNavVisibility,
  ]);

  // Pure white (#ffffff) in light mode, rich dark card (#242526) in dark mode
  const surfaceColor = isDark ? '#242526' : '#ffffff';
  const canvasColor = isDark ? '#18191a' : '#ffffff';
  const photoViewerColor = isDark ? '#000000' : '#0b0e14';

  const topSafeColor = isPhotoViewerActive
    ? photoViewerColor
    : isSettingsProfile
      ? surfaceColor
      : isAuthPage || isProfileRoute
        ? canvasColor
        : surfaceColor;

  const bottomSafeColor = isPhotoViewerActive
    ? photoViewerColor
    : surfaceColor;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      SystemUI.setBackgroundColorAsync(bottomSafeColor).catch(() => {});
    }
  }, [bottomSafeColor]);

  const maxTopInsetRef = useRef(insets.top);
  if (insets.top > maxTopInsetRef.current) {
    maxTopInsetRef.current = insets.top;
  }
  const effectiveTopInset =
    insets.top > 0 ? insets.top : maxTopInsetRef.current;

  const maxBottomInsetRef = useRef(insets.bottom);
  if (insets.bottom > maxBottomInsetRef.current) {
    maxBottomInsetRef.current = insets.bottom;
  }
  const effectiveBottomInset =
    insets.bottom > 0 ? insets.bottom : maxBottomInsetRef.current;

  // Compact top safe area inset so top navbar is raised closer to status/network bar
  const topInsetHeight =
    Platform.OS === 'android'
      ? Math.max(22, effectiveTopInset - 14)
      : effectiveTopInset > 0
        ? Math.max(0, effectiveTopInset - 8)
        : 0;

  // Compact bottom safe area inset persisted across all routes & modals
  const bottomInsetHeight =
    Platform.OS === 'android'
      ? Math.max(8, effectiveBottomInset - 17)
      : effectiveBottomInset > 0
        ? Math.max(0, effectiveBottomInset - 8)
        : 0;

  return (
    <View
      style={{ flex: 1, backgroundColor: canvasColor }}
      className="flex-1 relative">
      <StatusBar
        style={isPhotoViewerActive || isDark ? 'light' : 'dark'}
        animated
      />
      {Platform.OS === 'android' ? (
        <NavigationBar
          style={isPhotoViewerActive || isDark ? 'light' : 'dark'}
        />
      ) : null}
      <AppSplashLoader />

      {/* Top Safe Area Inset seamlessly matches Navbar / active screen surface */}
      {topInsetHeight > 0 ? (
        <View
          style={{
            height: topInsetHeight,
            backgroundColor: topSafeColor,
            zIndex: 60,
          }}
        />
      ) : null}

      {/* Main App Viewport */}
      <View
        style={{
          flex: 1,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          backgroundColor: canvasColor,
          overflow: 'hidden',
        }}
        className="flex-1 relative">
        {/* Real Native Horizontal Tab Pager */}
        <View
          onLayout={(e) => {
            const w = Math.round(e.nativeEvent.layout.width);
            if (w > 0 && w !== containerWidth) {
              setContainerWidth(w);
            }
          }}
          style={{
            flex: 1,
            display: isTabRoute ? 'flex' : 'none',
          }}>
          <ScrollView
            ref={(node) => {
              (pagerRef as any).current = node;
              registerTabPager(node);
            }}
            horizontal
            pagingEnabled
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
            scrollEnabled={canSwipeTabs}
            {...({
              onScrollShouldSetResponderCapture: (e: any) => {
                if (isTabSwipeLockedRef.current) {
                  e?.stopPropagation?.();
                }
                return false;
              },
            } as any)}
            bounces={false}
            overScrollMode="never"
            onScrollBeginDrag={() => {
              isManualScrollingRef.current = true;
              resetNavVisibility();
            }}
            onScroll={(e) => {
              handleScroll(e.nativeEvent.contentOffset.x);
            }}
            onScrollEndDrag={handleScrollEndDrag}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              handleMomentumEnd(e.nativeEvent.contentOffset.x);
            }}
            contentContainerStyle={{ flexGrow: 1 }}
            style={{ flex: 1 }}>
            <View style={{ width: effectiveWidth, flex: 1 }}>
              <HomeScreen />
            </View>
            <View style={{ width: effectiveWidth, flex: 1 }}>
              <SavedScreen />
            </View>
            <View style={{ width: effectiveWidth, flex: 1 }}>
              <MessagesScreen />
            </View>
            <View style={{ width: effectiveWidth, flex: 1 }}>
              <NotificationsScreen />
            </View>
          </ScrollView>
        </View>

        {/* Slot for Non-Tab Routes (e.g. /post/[id], /login, /blood, /settings) */}
        <View
          style={{
            flex: 1,
            display: isTabRoute ? 'none' : 'flex',
          }}>
          <MainContentSlot
            topOffset={isFullBleedRoute ? 0 : showTopNav ? 60 : 0}
            bottomOffset={
              isFullBleedRoute || normalizedPath === '/settings'
                ? 0
                : showBottomNav
                  ? BOTTOM_NAV_CLEARANCE
                  : 0
            }
          />
        </View>

        {showSearchOverlay ? (
          <View
            style={{
              position: 'absolute',
              top: showTopNav ? 60 : 0,
              left: insets.left,
              right: insets.right,
              bottom: 0,
              zIndex: 45,
            }}
            className="bg-white dark:bg-[#242526]">
            <SearchPageView />
          </View>
        ) : null}

        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: 0,
            left: insets.left,
            right: insets.right,
            zIndex: 50,
            transform: [{ translateY: topNavTranslateY }],
          }}>
          <Navbar />
        </Animated.View>

        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            bottom: Platform.OS === 'android' ? -2.5 : 0,
            left: insets.left,
            right: insets.right,
            zIndex: 50,
            transform: [{ translateY: bottomNavTranslateY }],
          }}>
          <MobileNav
            activeTab={activeTab}
            onTabPress={(href) => {
              isManualScrollingRef.current = false;
              resetNavVisibility();
              const idx = (TAB_ORDER as readonly string[]).indexOf(href);
              if (idx !== -1) {
                currentScrolledIndexRef.current = idx;
                dragStartIndexRef.current = idx;
                if (pagerRef.current && effectiveWidth > 0) {
                  pagerRef.current.scrollTo({
                    x: idx * effectiveWidth,
                    animated: true,
                  });
                }
              }
              activeTabRef.current = href;
              setActiveTab(href);
            }}
          />
        </Animated.View>

        <MenuDrawer />
        <MobileComposerModal />
        <GlobalPhotoViewerModal />
      </View>

      {/* Bottom Safe Area Inset seamlessly matches MobileNav / active screen surface */}
      {bottomInsetHeight > 0 ? (
        <View
          style={{
            height: bottomInsetHeight,
            backgroundColor: bottomSafeColor,
            zIndex: 60,
          }}
        />
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <UiProvider>
        <AuthProvider>
          <FeedProvider>
            <AppShell />
          </FeedProvider>
        </AuthProvider>
      </UiProvider>
    </SafeAreaProvider>
  );
}
