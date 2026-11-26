import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { AppIcon } from './Icon';
import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/navMetrics';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  duration?: number;
}

interface GlobalToastProps {
  toast: ToastItem | null;
  onDismiss: () => void;
  theme?: 'light' | 'dark';
  isProfileActive?: boolean;
  isSearchOpen?: boolean;
  activeConversationId?: string | null;
}

/** Full-width, square-edged, monochrome bottom toast sliding up from bottom left-to-right. */
export function GlobalToast({
  toast,
  onDismiss,
  theme = 'light',
  isProfileActive = false,
  isSearchOpen = false,
  activeConversationId = null,
}: GlobalToastProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname() || '/';
  const isDark = theme === 'dark';

  const translateY = useRef(new Animated.Value(70)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPostViewerPage = pathname.startsWith('/post/');
  const isSettingsProfile = pathname === '/settings/profile';
  const isInsideActiveChat =
    (pathname === '/messages' || pathname.startsWith('/messages/')) &&
    Boolean(activeConversationId);

  const hasBottomNav =
    !isAuthPage &&
    !isPostViewerPage &&
    !isSettingsProfile &&
    !isProfileActive &&
    !isSearchOpen &&
    !isInsideActiveChat;

  const bottomInsetHeight =
    Platform.OS === 'android'
      ? insets.bottom > 0
        ? Math.max(8, insets.bottom - 17)
        : 8
      : insets.bottom > 0
        ? Math.max(0, insets.bottom - 8)
        : 0;

  const bottomOffset =
    bottomInsetHeight + (hasBottomNav ? BOTTOM_NAV_CLEARANCE : 0);

  useEffect(() => {
    if (toast) {
      translateY.setValue(70);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 210,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, toast.duration || 3200);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(70);
      opacity.setValue(0);
    }
  }, [toast?.id]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 70,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!toast) return null;

  const type = toast.type || 'info';
  const iconName =
    type === 'success'
      ? ('check_circle' as const)
      : type === 'error' || type === 'warning'
        ? ('error_outline' as const)
        : ('info' as const);

  const surfaceBg = isDark ? '#242526' : '#ffffff';
  const borderColor = isDark ? '#393a3b' : '#e4e6eb';
  const textColor = isDark ? '#e4e6eb' : '#050505';
  const subTextColor = isDark ? '#b0b3b8' : '#3a3b3c';

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <Pressable
        onPress={handleDismiss}
        style={{
          backgroundColor: surfaceBg,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor,
          borderRadius: 0,
          paddingLeft: Math.max(14, insets.left),
          paddingRight: Math.max(14, insets.right),
          paddingVertical: 12,
        }}
        className="w-full flex-row items-center gap-3 active:opacity-90"
      >
        <AppIcon android={iconName} size={20} color={textColor} />

        <View className="flex-1 min-w-0">
          {toast.title ? (
            <Text
              numberOfLines={1}
              style={{ color: textColor }}
              className="font-bold text-[13.5px] leading-[18px]"
            >
              {toast.title}
            </Text>
          ) : null}
          <Text
            numberOfLines={2}
            style={{ color: toast.title ? subTextColor : textColor }}
            className="text-[14px] font-medium leading-[20px]"
          >
            {toast.message}
          </Text>
        </View>

        <Pressable
          onPress={handleDismiss}
          hitSlop={10}
          className="h-7 w-7 items-center justify-center active:opacity-60"
        >
          <AppIcon android="close" size={16} color={subTextColor} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}
