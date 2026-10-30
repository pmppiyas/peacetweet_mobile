import '../../global.css';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Slot, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { UiProvider, useUi } from '@/providers/UiProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { FeedProvider } from '@/providers/FeedProvider';
import { Navbar } from '@/components/navigation/Navbar';
import { MobileNav } from '@/components/navigation/MobileNav';
import { MenuDrawer } from '@/components/navigation/MenuDrawer';
import { MobileComposerModal } from '@/components/feed/MobileComposerModal';
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

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <UiProvider>
        <AuthProvider>
          <FeedProvider>
            <View className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a] relative">
              <AppSplashLoader />
              <SafeAreaView className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]">
                <Navbar />
                <MainContentSlot />
                <MobileNav />
                <MenuDrawer />
                <MobileComposerModal />
              </SafeAreaView>
            </View>
          </FeedProvider>
        </AuthProvider>
      </UiProvider>
    </SafeAreaProvider>
  );
}
