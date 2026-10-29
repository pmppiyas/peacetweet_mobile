import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Polyline,
  Rect,
  Polygon,
} from 'react-native-svg';
import type { SymbolViewProps } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

export type AndroidSymbol = NonNullable<
  Extract<SymbolViewProps['name'], { android?: string }>['android']
>;

export interface AppIconProps {
  android: AndroidSymbol;
  ios?: SFSymbol;
  size?: number;
  color?: string;
  weight?: 'regular' | 'semibold' | 'bold';
  style?: StyleProp<ViewStyle>;
}

const STROKE_WIDTH_MAP = {
  regular: 1.9,
  semibold: 2.2,
  bold: 2.4,
} as const;

export function AppIcon({
  android,
  size = 20,
  color = '#65676b',
  weight = 'bold',
  style,
}: AppIconProps) {
  const sw = STROKE_WIDTH_MAP[weight] || 2.3;

  const renderPaths = () => {
    switch (android) {
      case 'home':
        return (
          <>
            <Path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
            <Path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </>
        );

      case 'bookmark':
        return (
          <Path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        );

      case 'add':
        return (
          <>
            <Path d="M5 12h14" />
            <Path d="M12 5v14" />
          </>
        );

      case 'chat_bubble':
        return <Path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />;

      case 'feedback':
        return (
          <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        );

      case 'notifications':
        return (
          <>
            <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </>
        );

      case 'notifications_off':
        return (
          <>
            <Path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" />
            <Path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7" />
            <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            <Path d="m2 2 20 20" />
          </>
        );

      case 'search':
        return (
          <>
            <Circle cx="11" cy="11" r="8" />
            <Path d="m21 21-4.3-4.3" />
          </>
        );

      case 'close':
        return (
          <>
            <Path d="M18 6 6 18" />
            <Path d="m6 6 12 12" />
          </>
        );

      case 'arrow_back':
        return (
          <>
            <Path d="m12 19-7-7 7-7" />
            <Path d="M19 12H5" />
          </>
        );

      case 'arrow_forward':
        return (
          <>
            <Path d="M5 12h14" />
            <Path d="m12 5 7 7-7 7" />
          </>
        );

      case 'chevron_left':
        return <Path d="m15 18-6-6 6-6" />;

      case 'chevron_right':
        return <Path d="m9 18 6-6-6-6" />;

      case 'favorite':
        return (
          <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        );

      case 'share':
        return (
          <>
            <Circle cx="18" cy="5" r="3" />
            <Circle cx="6" cy="12" r="3" />
            <Circle cx="18" cy="19" r="3" />
            <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </>
        );

      case 'delete':
        return (
          <>
            <Path d="M3 6h18" />
            <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <Line x1="10" y1="11" x2="10" y2="17" />
            <Line x1="14" y1="11" x2="14" y2="17" />
          </>
        );

      case 'edit':
        return (
          <>
            <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <Path d="m15 5 4 4" />
          </>
        );

      case 'send':
        return (
          <>
            <Path d="m22 2-7 20-4-9-9-4Z" />
            <Path d="M22 2 11 13" />
          </>
        );

      case 'attach_file':
        return (
          <Path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        );

      case 'sentiment_satisfied':
        return (
          <>
            <Circle cx="12" cy="12" r="10" />
            <Path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <Line x1="9" y1="9" x2="9.01" y2="9" />
            <Line x1="15" y1="9" x2="15.01" y2="9" />
          </>
        );

      case 'image':
        return (
          <>
            <Rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <Circle cx="9" cy="9" r="2" />
            <Path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </>
        );

      case 'photo_camera':
        return (
          <>
            <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <Circle cx="12" cy="13" r="3" />
          </>
        );

      case 'menu_book':
        return (
          <>
            <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </>
        );

      case 'layers':
        return (
          <>
            <Polygon points="12 2 2 7 12 12 22 7 12 2" />
            <Polyline points="2 17 12 22 22 17" />
            <Polyline points="2 12 12 17 22 12" />
          </>
        );

      case 'person':
        return (
          <>
            <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <Circle cx="12" cy="7" r="4" />
          </>
        );

      case 'person_add':
        return (
          <>
            <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <Circle cx="9" cy="7" r="4" />
            <Line x1="19" y1="8" x2="19" y2="14" />
            <Line x1="22" y1="11" x2="16" y2="11" />
          </>
        );

      case 'how_to_reg':
        return (
          <>
            <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <Circle cx="9" cy="7" r="4" />
            <Polyline points="16 11 18 13 22 9" />
          </>
        );

      case 'person_off':
      case 'person_search':
        return (
          <>
            <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <Circle cx="9" cy="7" r="4" />
            <Line x1="17" y1="8" x2="22" y2="13" />
            <Line x1="22" y1="8" x2="17" y2="13" />
          </>
        );

      case 'group':
      case 'groups':
        return (
          <>
            <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <Circle cx="9" cy="7" r="4" />
            <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        );

      case 'water_drop':
        return (
          <Path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
        );

      case 'check':
        return <Polyline points="20 6 9 17 4 12" />;

      case 'done_all':
        return (
          <>
            <Path d="M18 6 7 17l-5-5" />
            <Path d="m22 10-7.5 7.5L13 16" />
          </>
        );

      case 'content_copy':
        return (
          <>
            <Rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <Path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </>
        );

      case 'info':
        return (
          <>
            <Circle cx="12" cy="12" r="10" />
            <Path d="M12 16v-4" />
            <Path d="M12 8h.01" />
          </>
        );

      case 'warning':
        return (
          <>
            <Path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <Path d="M12 9v4" />
            <Path d="M12 17h.01" />
          </>
        );

      case 'block':
        return (
          <>
            <Circle cx="12" cy="12" r="10" />
            <Path d="m4.9 4.9 14.2 14.2" />
          </>
        );

      case 'inbox':
        return (
          <>
            <Polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <Path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </>
        );

      case 'schedule':
        return (
          <>
            <Circle cx="12" cy="12" r="10" />
            <Polyline points="12 6 12 12 16 14" />
          </>
        );

      case 'refresh':
        return (
          <>
            <Path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <Path d="M21 3v5h-5" />
            <Path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <Path d="M8 16H3v5" />
          </>
        );

      case 'more_vert':
        return (
          <>
            <Circle cx="12" cy="12" r="1" />
            <Circle cx="12" cy="5" r="1" />
            <Circle cx="12" cy="19" r="1" />
          </>
        );

      case 'more_horiz':
        return (
          <>
            <Circle cx="12" cy="12" r="1" />
            <Circle cx="19" cy="12" r="1" />
            <Circle cx="5" cy="12" r="1" />
          </>
        );

      case 'auto_awesome':
        return (
          <>
            <Path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <Path d="M5 3v4" />
            <Path d="M19 17v4" />
            <Path d="M3 5h4" />
            <Path d="M17 19h4" />
          </>
        );

      case 'public':
      case 'language':
        return (
          <>
            <Circle cx="12" cy="12" r="10" />
            <Path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <Path d="M2 12h20" />
          </>
        );

      case 'translate':
        return (
          <>
            <Path d="m5 8 6 6" />
            <Path d="m4 14 6-6 2-3" />
            <Path d="M2 5h12" />
            <Path d="M7 2h1" />
            <Path d="m22 22-5-10-5 10" />
            <Path d="M14 18h6" />
          </>
        );

      case 'dark_mode':
        return <Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />;

      case 'light_mode':
        return (
          <>
            <Circle cx="12" cy="12" r="4" />
            <Path d="M12 2v2" />
            <Path d="M12 20v2" />
            <Path d="m4.93 4.93 1.41 1.41" />
            <Path d="m17.66 17.66 1.41 1.41" />
            <Path d="M2 12h2" />
            <Path d="M20 12h2" />
            <Path d="m6.34 17.66-1.41 1.41" />
            <Path d="m19.07 4.93-1.41 1.41" />
          </>
        );

      case 'settings':
        return (
          <>
            <Circle cx="12" cy="12" r="3" />
            <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </>
        );

      case 'logout':
        return (
          <>
            <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <Polyline points="16 17 21 12 16 7" />
            <Line x1="21" y1="12" x2="9" y2="12" />
          </>
        );

      case 'login':
        return (
          <>
            <Path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <Polyline points="10 17 15 12 10 7" />
            <Line x1="15" y1="12" x2="3" y2="12" />
          </>
        );

      case 'lock':
        return (
          <>
            <Rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </>
        );

      case 'mail':
        return (
          <>
            <Rect width="20" height="16" x="2" y="4" rx="2" />
            <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </>
        );

      case 'location_on':
        return (
          <>
            <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <Circle cx="12" cy="10" r="3" />
          </>
        );

      case 'visibility':
        return (
          <>
            <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <Circle cx="12" cy="12" r="3" />
          </>
        );

      case 'visibility_off':
        return (
          <>
            <Path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <Path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <Path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <Line x1="2" y1="2" x2="22" y2="22" />
          </>
        );

      case 'verified':
      case 'verified_user':
        return (
          <>
            <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <Path d="m9 12 2 2 4-4" />
          </>
        );

      default:
        return <Circle cx="12" cy="12" r="8" />;
    }
  };

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round">
        {renderPaths()}
      </Svg>
    </View>
  );
}
