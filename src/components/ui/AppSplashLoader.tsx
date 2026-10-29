import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet } from 'react-native';
import { FullPageLoader } from './FullPageLoader';

export function AppSplashLoader() {
  const [visible, setVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // On Web, public/index.html already displays the exact FullPageLoader from 0ms while the JS bundle downloads.
    // Once React mounts, we only need a brief smooth fade-out so there is zero white flash and no double delay.
    const holdDuration = Platform.OS === 'web' ? 80 : 550;
    const fadeDuration = 220;

    const fadeTimer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: fadeDuration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setVisible(false);
        }
      });
    }, holdDuration);

    const removeTimer = setTimeout(
      () => {
        setVisible(false);
      },
      holdDuration + fadeDuration + 50
    );

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [fadeAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: fadeAnim,
          zIndex: 9999,
          elevation: 9999,
        },
      ]}>
      <FullPageLoader />
    </Animated.View>
  );
}
