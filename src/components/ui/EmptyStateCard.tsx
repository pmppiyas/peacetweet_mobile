import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon, AndroidSymbol } from './Icon';
import type { SFSymbol } from 'sf-symbols-typescript';

export interface EmptyStateProps {
  iconAndroid?: AndroidSymbol;
  iconIos?: SFSymbol;
  iconSize?: number;
  iconColor?: string;
  iconBgClassName?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  iconAndroid = 'inbox',
  iconIos,
  iconSize = 32,
  iconColor,
  iconBgClassName = 'bg-[#f0f2f5] dark:bg-[#3a3b3c]',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  const { theme } = useUi();
  const defaultIconColor = theme === 'dark' ? '#b0b3b8' : '#65676b';
  const effectiveIconColor = iconColor || defaultIconColor;

  return (
    <View
      className={`flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <View
        className={`h-16 w-16 items-center justify-center rounded-full mb-3 ${iconBgClassName}`}>
        <AppIcon
          android={iconAndroid}
          ios={iconIos}
          size={iconSize}
          color={effectiveIconColor}
        />
      </View>
      <Text className="font-bold text-[#050505] dark:text-[#e4e6eb] text-base text-center">
        {title}
      </Text>
      {description ? (
        <Text className="text-xs mt-1 text-[#65676b] dark:text-[#b0b3b8] max-w-sm text-center leading-relaxed">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          className="mt-4 rounded-xl bg-primary-600 active:bg-primary-700 px-4 py-2.5">
          <Text className="text-xs font-bold text-white">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export const EmptyStateCard = EmptyState;
export const EmptyStateView = EmptyState;
