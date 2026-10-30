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
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 750,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: Platform.OS !== 'web',
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
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          opacity,
        }}>
        {children}
      </Animated.View>
    </View>
  );
}
