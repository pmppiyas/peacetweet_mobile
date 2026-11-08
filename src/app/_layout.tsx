import '../../global.css';
import React, { useEffect, useRef } from 'react';
import { BackHandler, Platform, ToastAndroid, View } from 'react-native';
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

SplashScreen.preventAutoHideAsync();

function MainContentSlot() {
  const pathname = usePathname();
  const { isSearchOpen } = useUi();
  const isMessagesActive =
    pathname === '/messages' || pathname.startsWith('/messages/');
  const showSearchOverlay = isSearchOpen && !isMessagesActive;

  return (
    <View className="flex-1 min-h-0 relative">
      <Slot />
      {showSearchOverlay ? (
        <View className="absolute inset-0 z-40 bg-white dark:bg-[#242526]">
          <SearchPageView />
        </View>
      ) : null}
    </View>
  );
}

function AppShell() {
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
  } = useUi();

  const lastBackPressRef = useRef<number>(0);

  // Reset double-back timer whenever leaving Home
  useEffect(() => {
    if (pathname !== '/') {
      lastBackPressRef.current = 0;
    }
  }, [pathname]);

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

  // Soft eye-comfort off-white (#f5f6f8) in light mode, rich dark card (#242526) in dark mode
  const surfaceColor = isDark ? '#242526' : '#f5f6f8';
  const canvasColor = isDark ? '#18191a' : '#e6e9ef';
  const photoViewerColor = isDark ? '#000000' : '#0b0e14';

  const topSafeColor = isPhotoViewerActive
    ? photoViewerColor
    : isAuthPage
      ? canvasColor
      : surfaceColor;

  const bottomSafeColor = isPhotoViewerActive
    ? photoViewerColor
    : isAuthPage
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
        <View style={{ height: insets.top, backgroundColor: topSafeColor }} />
      ) : null}

      {/* Main App Viewport */}
      <View
        style={{
          flex: 1,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          backgroundColor: canvasColor,
        }}
        className="flex-1 relative">
        <Navbar />
        <MainContentSlot />
        <MobileNav />
        <MenuDrawer />
        <MobileComposerModal />
        <GlobalPhotoViewerModal />
      </View>

      {/* Bottom Safe Area Inset seamlessly matches MobileNav / active screen surface */}
      {insets.bottom > 0 ? (
        <View
          style={{ height: insets.bottom, backgroundColor: bottomSafeColor }}
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
