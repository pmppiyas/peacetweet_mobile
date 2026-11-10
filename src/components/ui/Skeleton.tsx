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
  const opacity = useRef(new Animated.Value(0.45)).current;

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
    <View
      className={`animate-pulse bg-[#e4e6eb] dark:bg-[#3a3b3c] overflow-hidden ${className}`}
      style={style}
      {...rest}>
      {Platform.OS !== 'web' ? (
        <Animated.View
          style={{
            width: '100%',
            height: '100%',
            opacity,
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
          }}>
          {children}
        </Animated.View>
      ) : (
        children
      )}
    </View>
  );
}
