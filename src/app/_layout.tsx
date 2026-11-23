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
  '/purpose',
  '/feedback',
  '/messages',
]);

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
    isProfileActive,
    resetNavVisibility,
    topNavTranslateY,
    bottomNavTranslateY,
    isTabSwipeLocked,
    registerTabPager,
  } = useUi();

  const lastBackPressRef = useRef<number>(0);

  // Reset double-back timer and reveal nav bars whenever route changes
  useEffect(() => {
    if (pathname !== '/') {
      lastBackPressRef.current = 0;
    }
    resetNavVisibility();
  }, [pathname, resetNavVisibility]);

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

  const showTopNav =
    !isAuthPage &&
    !isPostViewerPage &&
    !isInsideActiveChat &&
    !isProfileActive &&
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
    !isProfileActive &&
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

  // Instant continuous active tab calculation during drag / momentum
  const handleScroll = (offsetX: number) => {
    if (effectiveWidth <= 0) return;
    const rawIndex = offsetX / effectiveWidth;
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
    if (route && route !== activeTabRef.current) {
      activeTabRef.current = route;
      setActiveTab(route);
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
    if (route && route !== activeTabRef.current) {
      activeTabRef.current = route;
      setActiveTab(route);
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
  const settingsCanvasColor = isDark ? '#18191a' : '#f0f2f5';
  const photoViewerColor = isDark ? '#000000' : '#0b0e14';

  const topSafeColor = isPhotoViewerActive
    ? photoViewerColor
    : isSettingsProfile
      ? surfaceColor
      : isAuthPage || isProfileActive
        ? canvasColor
        : surfaceColor;

  const bottomSafeColor = isPhotoViewerActive
    ? photoViewerColor
    : isSettingsProfile
      ? settingsCanvasColor
      : isAuthPage || isProfileActive
        ? canvasColor
        : surfaceColor;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      SystemUI.setBackgroundColorAsync(bottomSafeColor).catch(() => {});
    }
  }, [bottomSafeColor]);

  // Compact top safe area inset so top navbar is raised closer to status/network bar
  const topInsetHeight =
    insets.top > 0
      ? Platform.OS === 'android'
        ? Math.max(22, insets.top - 14)
        : Math.max(0, insets.top - 8)
      : 0;

  // Compact bottom safe area inset so bottom navigation bar is lowered closer to gesture bar/screen bottom
  const bottomInsetHeight =
    insets.bottom > 0
      ? Platform.OS === 'android'
        ? Math.max(0, insets.bottom - 17)
        : Math.max(0, insets.bottom - 8)
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
          style={isDark || isPhotoViewerActive ? 'dark' : 'light'}
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
            bounces={false}
            overScrollMode="never"
            onScrollBeginDrag={() => {
              isManualScrollingRef.current = true;
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
            bottomOffset={isFullBleedRoute ? 0 : showBottomNav ? 56 : 0}
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
