import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: AvatarSize;
  isOnline?: boolean;
  showOnlineBadge?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<
  AvatarSize,
  { container: string; text: string; badge: string }
> = {
  xs: {
    container: 'h-7 w-7',
    text: 'text-[11px]',
    badge: 'h-2 w-2 border',
  },
  sm: {
    container: 'h-9 w-9',
    text: 'text-xs',
    badge: 'h-2.5 w-2.5 border-[1.5px]',
  },
  md: {
    container: 'h-11 w-11',
    text: 'text-sm',
    badge: 'h-3 w-3 border-2',
  },
  lg: {
    container: 'h-14 w-14',
    text: 'text-base',
    badge: 'h-3.5 w-3.5 border-2',
  },
  xl: {
    container: 'h-20 w-20',
    text: 'text-2xl',
    badge: 'h-4 w-4 border-2',
  },
};

export function UserAvatar({
  name,
  avatarUrl,
  size = 'md',
  isOnline = false,
  showOnlineBadge = false,
  className = '',
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  const sizeConfig = SIZE_CLASSES[size];

  const showImage = Boolean(avatarUrl && !imageFailed);

  return (
    <View className={`relative shrink-0 ${sizeConfig.container} ${className}`}>
      {showImage ? (
        <Image
          source={{ uri: avatarUrl! }}
          onError={() => setImageFailed(true)}
          className="h-full w-full rounded-full bg-primary-100 dark:bg-primary-950/60"
          resizeMode="cover"
        />
      ) : (
        <View className="h-full w-full rounded-full bg-primary-100 dark:bg-primary-950/70 border border-primary-200/70 dark:border-primary-800/60 items-center justify-center">
          <Text
            className={`font-bold text-primary-700 dark:text-primary-300 ${sizeConfig.text}`}>
            {initial}
          </Text>
        </View>
      )}

      {showOnlineBadge && isOnline ? (
        <View
          className={`absolute bottom-0 right-0 rounded-full bg-emerald-500 border-white dark:border-[#242526] ${sizeConfig.badge}`}
        />
      ) : null}
    </View>
  );
}
