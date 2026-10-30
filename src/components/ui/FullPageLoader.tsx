import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { PeaceTweetLogo } from './PeaceTweetLogo';

export interface FullPageLoaderProps {
  className?: string;
}

export function FullPageLoader({ className = '' }: FullPageLoaderProps) {
  const { width } = useWindowDimensions();
  const { theme } = useUi();
  const isDark = theme === 'dark';
  const centerLogoSize = width >= 640 ? 96 : 80;
  const bottomOffset = width >= 640 ? 40 : 32;
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
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 9999,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? '#18191a' : '#ffffff',
          overflow: 'hidden',
        },
      ]}
      className={className}>
      {/* 1. Exact Dead Center: Brand Logo with gentle breathing pulse (0.6 to 1.0 opacity) */}
      <View
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Animated.View
          style={{
            opacity: pulseAnim,
            borderRadius: 24,
            overflow: 'hidden',
            shadowColor: '#1877f2',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 4,
          }}>
          <PeaceTweetLogo size={centerLogoSize} />
        </Animated.View>
      </View>

      {/* 2. Fixed at Bottom: "from PeaceTweet" branding + slogan */}
      <View
        style={{
          position: 'absolute',
          bottom: bottomOffset,
          left: 0,
          right: 0,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingHorizontal: 16,
        }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: isDark ? '#b0b3b8' : '#8a8d91',
            letterSpacing: 1.1,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}>
          from
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              overflow: 'hidden',
              flexShrink: 0,
            }}>
            <PeaceTweetLogo size={20} />
          </View>
          <Text
            style={[
              {
                fontSize: 16,
                fontWeight: '800',
                letterSpacing: -0.4,
                color: isDark ? '#4a80f5' : '#1565d8',
              },
              Platform.OS === 'web'
                ? ({
                    backgroundImage:
                      'linear-gradient(to right, #1565d8, #1877f2, #0d9488)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  } as any)
                : null,
            ]}>
            PeaceTweet
          </Text>
        </View>
        <Text
          style={{
            fontSize: width >= 640 ? 13 : 12,
            fontWeight: '500',
            color: isDark ? '#b0b3b8' : '#65676b',
            letterSpacing: 0.3,
            paddingTop: 2,
            textAlign: 'center',
          }}>
          সুন্নাহ আঁকড়ে, উম্মাহর পাশে
        </Text>
      </View>
    </View>
  );
}
