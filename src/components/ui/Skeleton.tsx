import React, { useEffect, useRef } from 'react';
import { View, ViewProps, Animated, Platform } from 'react-native';

export interface SkeletonProps extends ViewProps {
  className?: string;
}

/**
 * Reusable animated Skeleton component.
 * Uses standard View with NativeWind classes for layout & sizing,
 * combined with hardware-accelerated CSS animate-pulse on web and
 * an Animated opacity loop on native platforms.
 */
export function Skeleton({
  className = '',
  style,
  children,
  ...rest
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(Platform.OS === 'web' ? 1 : 0.45)).current;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-[#e4e6eb] dark:bg-[#3a3b3c] overflow-hidden ${
        Platform.OS === 'web' ? 'animate-pulse' : ''
      } ${className}`}
      style={[Platform.OS !== 'web' ? { opacity } : null, style]}
      {...rest}>
      {children}
    </Animated.View>
  );
}
