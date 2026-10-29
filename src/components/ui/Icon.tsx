import React from 'react';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import {
  MaterialSymbols_400Regular,
  MaterialSymbols_600SemiBold,
  MaterialSymbols_700Bold,
} from '@expo-google-fonts/material-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { StyleProp, ViewStyle } from 'react-native';

export type AndroidSymbol = NonNullable<
  Extract<SymbolViewProps['name'], { android?: string }>['android']
>;

const WEIGHT_MAP = {
  regular: {
    name: 'MaterialSymbols_400Regular',
    font: MaterialSymbols_400Regular,
  },
  semibold: {
    name: 'MaterialSymbols_600SemiBold',
    font: MaterialSymbols_600SemiBold,
  },
  bold: {
    name: 'MaterialSymbols_700Bold',
    font: MaterialSymbols_700Bold,
  },
} as const;

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
  return (
    <SymbolView
      key={`${android}-${weight}`}
      name={{ ios, android, web: android }}
      size={size}
      tintColor={color}
      weight={{ ios: weight, android: WEIGHT_MAP[weight] }}
      style={style}
    />
  );
}
