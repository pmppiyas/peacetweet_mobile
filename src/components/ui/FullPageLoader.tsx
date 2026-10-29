import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { PeaceTweetLogo } from './PeaceTweetLogo';

export interface FullPageLoaderProps {
  className?: string;
}

export function FullPageLoader({ className = '' }: FullPageLoaderProps) {
  const { width } = useWindowDimensions();
  const centerLogoSize = width >= 640 ? 96 : 80;
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [pulseAnim]);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading PeaceTweet"
      className={`absolute inset-0 z-[9999] w-full h-full flex-1 items-center justify-center bg-white dark:bg-[#18191a] select-none overflow-hidden ${className}`}>
      {/* 1. Exact Dead Center: Brand Logo with gentle breathing pulse (0.6 to 1.0 opacity) */}
      <View className="flex-col items-center justify-center">
        <Animated.View
          style={{
            opacity: pulseAnim,
            shadowColor: '#1877f2',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 4,
          }}
          className="rounded-3xl">
          <PeaceTweetLogo size={centerLogoSize} className="rounded-3xl" />
        </Animated.View>
      </View>

      {/* 2. Fixed at Bottom: "from PeaceTweet" branding + slogan */}
      <View className="absolute bottom-8 sm:bottom-10 left-0 right-0 flex-col items-center justify-center gap-1.5 text-center px-4">
        <Text className="text-[11px] font-semibold text-[#8a8d91] dark:text-[#b0b3b8] tracking-widest uppercase">
          from
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="h-5 w-5 shrink-0">
            <PeaceTweetLogo size={20} className="rounded-md" />
          </View>
          <Text
            style={
              Platform.OS === 'web'
                ? ({
                    backgroundImage:
                      'linear-gradient(to right, #1565d8, #1877f2, #0d9488)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  } as any)
                : undefined
            }
            className="text-base font-extrabold tracking-tight text-primary-600 dark:text-primary-400">
            PeaceTweet
          </Text>
        </View>
        <Text className="text-xs sm:text-[13px] font-medium text-[#65676b] dark:text-[#b0b3b8] tracking-wide pt-0.5 text-center">
          সুন্নাহ আঁকড়ে, উম্মাহর পাশে
        </Text>
      </View>
    </View>
  );
}
