import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

export interface NoorThemeAuraProps {
  isDark?: boolean;
}

/**
 * Animated ambient "Noor" aura overlay used by ProfileView and Redeem live preview
 * when NOOR_PROFILE_THEME is active. Uses native-driver opacity and transform loops.
 */
export function NoorThemeAura({ isDark = false }: NoorThemeAuraProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const driftAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 4600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 4600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnim.start();
    driftAnim.start();

    return () => {
      pulseAnim.stop();
      driftAnim.stop();
    };
  }, [pulse, drift]);

  const violetOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: isDark ? [0.18, 0.36] : [0.22, 0.42],
  });

  const emeraldOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: isDark ? [0.26, 0.12] : [0.28, 0.14],
  });

  const goldOpacity = drift.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: isDark ? [0.1, 0.24, 0.1] : [0.12, 0.3, 0.12],
  });

  const beamTranslateX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-110, 110],
  });

  const violetScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.12],
  });

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflow: 'hidden',
      }}
    >
      {/* Top-left violet glow */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -55,
          left: -45,
          width: 210,
          height: 210,
          borderRadius: 105,
          backgroundColor: isDark ? '#7c3aed' : '#c4b5fd',
          opacity: violetOpacity,
          transform: [{ scale: violetScale }],
        }}
      />

      {/* Right-side drifting emerald glow */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -35,
          right: -50,
          width: 190,
          height: 190,
          borderRadius: 95,
          backgroundColor: isDark ? '#10b981' : '#a7f3d0',
          opacity: emeraldOpacity,
          transform: [{ translateX: beamTranslateX }],
        }}
      />

      {/* Subtle warm gold shimmer band */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: -50,
          alignSelf: 'center',
          width: 240,
          height: 120,
          borderRadius: 120,
          backgroundColor: isDark ? '#f59e0b' : '#fde68a',
          opacity: goldOpacity,
          transform: [{ translateX: beamTranslateX }],
        }}
      />
    </View>
  );
}
