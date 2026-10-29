import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  G,
} from 'react-native-svg';

export interface PeaceTweetLogoProps {
  size?: number;
  className?: string;
}

export function PeaceTweetLogo({
  size = 80,
  className = '',
}: PeaceTweetLogoProps) {
  const rawId = useId();
  const gradId = `pt-logo-grad-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <View
      style={{ width: size, height: size }}
      className={`overflow-hidden ${className}`}>
      <Svg width={size} height={size} viewBox="0 0 512 512">
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1877f2" />
            <Stop offset="1" stopColor="#1054be" />
          </LinearGradient>
        </Defs>
        <Rect width="512" height="512" rx="112" fill={`url(#${gradId})`} />
        <G transform="translate(-29, 0)">
          <Path
            fill="#e8f0fe"
            fillRule="evenodd"
            d="M170 110H285A115 115 0 0 1 285 340H250V512H170Z M250 190H285A35 35 0 0 1 285 260H250Z"
          />
        </G>
      </Svg>
    </View>
  );
}
