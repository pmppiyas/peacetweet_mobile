import React from 'react';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import boldWeight from 'expo-symbols/androidWeights/bold';
import semiboldWeight from 'expo-symbols/androidWeights/semibold';
import regularWeight from 'expo-symbols/androidWeights/regular';
import type { SFSymbol } from 'sf-symbols-typescript';
import { StyleProp, ViewStyle } from 'react-native';

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

export function AppIcon({
  android,
  ios = 'circle',
  size = 20,
  color = '#65676b',
  weight = 'bold',
  style,
}: AppIconProps) {
  const androidWeight =
    weight === 'bold'
      ? boldWeight
      : weight === 'semibold'
        ? semiboldWeight
        : regularWeight;

  return (
    <SymbolView
      key={`${android}-${weight}`}
      name={{ ios, android, web: android }}
      size={size}
      tintColor={color}
      weight={{ ios: weight, android: androidWeight }}
      style={style}
    />
  );
}
