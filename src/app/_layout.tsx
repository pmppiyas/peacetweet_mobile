import '../../global.css';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { UiProvider } from '@/providers/UiProvider';
import { Navbar } from '@/components/navigation/Navbar';
import { MobileNav } from '@/components/navigation/MobileNav';
import { MenuDrawer } from '@/components/navigation/MenuDrawer';
import { MobileComposerModal } from '@/components/feed/MobileComposerModal';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <UiProvider>
        <SafeAreaView className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]">
          <Navbar />
          <View className="flex-1 min-h-0">
            <Slot />
          </View>
          <MobileNav />
          <MenuDrawer />
          <MobileComposerModal />
        </SafeAreaView>
      </UiProvider>
    </SafeAreaProvider>
  );
}
