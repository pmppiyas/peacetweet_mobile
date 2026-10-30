import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet } from 'react-native';
import { FullPageLoader } from './FullPageLoader';

export function AppSplashLoader() {
  const [visible, setVisible] = useState(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // If the HTML pre-hydration #pt-splash-loader is present, we fade IT out directly
      // without mounting a duplicate React loader.
      return !Boolean(document.getElementById('pt-splash-loader'));
    }
    return true;
  });
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const htmlLoader = document.getElementById('pt-splash-loader');
      if (htmlLoader) {
        const fadeTimer = setTimeout(() => {
          htmlLoader.style.opacity = '0';
          htmlLoader.style.pointerEvents = 'none';
        }, 120);

        const removeTimer = setTimeout(() => {
          htmlLoader.remove();
        }, 380);

        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(removeTimer);
        };
      }
    }

    const holdDuration = 550;
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
