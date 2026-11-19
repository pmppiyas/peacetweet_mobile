import React from 'react';
import { Image, StyleSheet, View, Platform } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { PostBackgroundOption } from '../constants/postBackgrounds';

export interface PostBackgroundViewProps {
  background: PostBackgroundOption;
}

export function PostBackgroundView({ background }: PostBackgroundViewProps) {
  if (background.type === 'image' && background.imageSource) {
    return (
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { zIndex: 0 },
          Platform.OS === 'web' ? ({ pointerEvents: 'none' } as any) : null,
        ]}
      >
        <Image
          source={background.imageSource}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (background.type === 'gradient' && background.gradientColors) {
    const [c1, c2] = background.gradientColors;
    const gradId = `grad-${background.id}`;
    return (
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { zIndex: 0 },
          Platform.OS === 'web' ? ({ pointerEvents: 'none' } as any) : null,
        ]}
      >
        <Svg
          width="100%"
          height="100%"
          style={StyleSheet.absoluteFill}
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={c1} stopOpacity="1" />
              <Stop offset="100%" stopColor={c2} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId})`} />
        </Svg>
      </View>
    );
  }

  return null;
}
