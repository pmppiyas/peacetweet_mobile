import '../../global.css';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Platform,
  ToastAndroid,
  View,
} from 'react-native';
import { router, Slot, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
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

SplashScreen.preventAutoHideAsync();

const COLLAPSIBLE_NAV_ROUTES = new Set([
  '/',
  '/saved',
  '/notifications',
  '/categories',
  '/explore',
  '/zakat',
  '/purpose',
  '/feedback',
  '/messages',
]);

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

  return (
    <View
      style={{ flex: 1, backgroundColor: canvasColor }}
      className="flex-1 relative">
      <StatusBar
        style={isPhotoViewerActive || isDark ? 'light' : 'dark'}
        animated
      />
      <AppSplashLoader />

      {/* Top Safe Area Inset seamlessly matches Navbar / active screen surface */}
      {insets.top > 0 ? (
        <View
          style={{
            height: insets.top,
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
        <MainContentSlot
          topOffset={isFullBleedRoute ? 0 : showTopNav ? 60 : 0}
          bottomOffset={isFullBleedRoute ? 0 : showBottomNav ? 56 : 0}
        />

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
            bottom: 0,
            left: insets.left,
            right: insets.right,
            zIndex: 50,
            transform: [{ translateY: bottomNavTranslateY }],
          }}>
          <MobileNav />
        </Animated.View>

        <MenuDrawer />
        <MobileComposerModal />
        <GlobalPhotoViewerModal />
      </View>

      {/* Bottom Safe Area Inset seamlessly matches MobileNav / active screen surface */}
      {insets.bottom > 0 ? (
        <View
          style={{
            height: insets.bottom,
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
