import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Platform } from 'react-native';
import { AppIcon } from './Icon';

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
}

export function GlobalToast({ toast, onDismiss }: GlobalToastProps) {
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: Platform.OS !== 'web',
          tension: 80,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, toast.duration || 3500);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-60);
      opacity.setValue(0);
    }
  }, [toast?.id]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -50,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!toast) return null;

  const type = toast.type || 'info';

  const badgeConfig = {
    error: {
      bg: 'bg-rose-50 dark:bg-rose-950/90',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-900 dark:text-rose-100',
      iconColor: '#e11d48',
      icon: 'error_outline' as const,
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/90',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-900 dark:text-emerald-100',
      iconColor: '#059669',
      icon: 'check_circle' as const,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/90',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-900 dark:text-amber-100',
      iconColor: '#d97706',
      icon: 'error_outline' as const,
    },
    info: {
      bg: 'bg-sky-50 dark:bg-sky-950/90',
      border: 'border-sky-200 dark:border-sky-800',
      text: 'text-sky-900 dark:text-sky-100',
      iconColor: '#0284c7',
      icon: 'error_outline' as const,
    },
  }[type];

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: Platform.OS === 'web' ? 16 : 56,
          left: 16,
          right: 16,
          zIndex: 9999,
          alignItems: 'center',
          transform: [{ translateY }],
          opacity,
          pointerEvents: 'box-none',
        },
      ]}>
      <Pressable
        onPress={handleDismiss}
        className={`flex-row items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border ${badgeConfig.bg} ${badgeConfig.border} max-w-lg w-full`}>
        <View className="flex-shrink-0">
          <AppIcon android={badgeConfig.icon} size={22} color={badgeConfig.iconColor} />
        </View>

        <View className="flex-1 min-w-0 pr-1">
          {toast.title ? (
            <Text className={`font-bold text-xs mb-0.5 ${badgeConfig.text}`}>
              {toast.title}
            </Text>
          ) : null}
          <Text
            numberOfLines={3}
            className={`text-sm font-medium leading-5 ${badgeConfig.text}`}>
            {toast.message}
          </Text>
        </View>

        <Pressable
          onPress={handleDismiss}
          hitSlop={8}
          className="h-6 w-6 rounded-full items-center justify-center bg-black/5 dark:bg-white/10 active:opacity-60 flex-shrink-0">
          <AppIcon android="close" size={14} color={badgeConfig.iconColor} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}
