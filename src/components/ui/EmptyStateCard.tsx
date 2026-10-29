import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AppIcon, AndroidSymbol } from './Icon';
import type { SFSymbol } from 'sf-symbols-typescript';

export interface EmptyStateCardProps {
  iconAndroid?: AndroidSymbol;
  iconIos?: SFSymbol;
  iconColor?: string;
  iconBgClassName?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyStateCard({
  iconAndroid = 'chat_bubble',
  iconIos = 'bubble.left.and.bubble.right.fill',
  iconColor = '#1877f2',
  iconBgClassName = 'bg-primary-100 dark:bg-primary-950/60',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateCardProps) {
  return (
    <View className={`items-center justify-center p-6 text-center ${className}`}>
      <View
        className={`h-14 w-14 rounded-full items-center justify-center mb-3 ${iconBgClassName}`}>
        <AppIcon
          android={iconAndroid}
          ios={iconIos}
          size={26}
          color={iconColor}
        />
      </View>
      <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] text-center">
        {title}
      </Text>
      {description ? (
        <Text className="mt-1 text-xs text-[#65676b] dark:text-[#b0b3b8] text-center max-w-[260px] leading-5">
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
