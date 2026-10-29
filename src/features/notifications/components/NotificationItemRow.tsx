import React, { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { AppIcon, AndroidSymbol } from '@/components/ui/Icon';
import type { SFSymbol } from 'sf-symbols-typescript';
import {
  NotificationItem,
  NotificationType,
} from '../types/notification.types';

export function formatNotificationTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 30) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
}

export function getNotificationBadgeConfig(type: NotificationType): {
  android: AndroidSymbol;
  ios: SFSymbol;
  bgColor: string;
} {
  switch (type) {
    case 'POST_LIKE':
      return {
        android: 'favorite',
        ios: 'heart.fill',
        bgColor: 'bg-rose-500',
      };
    case 'POST_COMMENT':
      return {
        android: 'chat_bubble',
        ios: 'bubble.right.fill',
        bgColor: 'bg-emerald-500',
      };
    case 'FRIEND_REQUEST':
      return {
        android: 'person_add',
        ios: 'person.badge.plus',
        bgColor: 'bg-blue-600',
      };
    case 'FRIEND_ACCEPT':
      return {
        android: 'how_to_reg',
        ios: 'person.fill.checkmark',
        bgColor: 'bg-teal-500',
      };
    case 'BLOOD_REQUEST':
      return {
        android: 'water_drop',
        ios: 'drop.fill',
        bgColor: 'bg-red-600',
      };
    case 'SYSTEM':
    default:
      return {
        android: 'notifications',
        ios: 'bell.fill',
        bgColor: 'bg-amber-500',
      };
  }
}

export interface NotificationItemRowProps {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
  onRequestDelete: (item: NotificationItem) => void;
}

export function NotificationItemRow({
  item,
  onPress,
  onRequestDelete,
}: NotificationItemRowProps) {
  const [imgError, setImgError] = useState(false);
  const badge = getNotificationBadgeConfig(item.type);
  const actorName = item.actor?.name || 'Someone';
  const initial = actorName.trim().charAt(0).toUpperCase() || 'S';
  const showImage = Boolean(item.actor?.avatarUrl && !imgError);

  return (
    <Pressable
      onPress={() => onPress(item)}
      className={`w-full relative flex-row items-center gap-2.5 px-2 py-2 rounded-xl ${
        !item.isRead
          ? 'bg-[#f0f2f5] dark:bg-[#3a3b3c]/80 active:bg-[#e4e6eb] dark:active:bg-[#3a3b3c]'
          : 'active:bg-[#e4e6eb]/70 dark:active:bg-[#3a3b3c]/60'
      }`}>
      {/* Avatar with badge */}
      <View className="relative shrink-0">
        {showImage ? (
          <Image
            source={{ uri: item.actor!.avatarUrl! }}
            onError={() => setImgError(true)}
            className="h-11 w-11 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c]"
            resizeMode="cover"
          />
        ) : (
          <View className="h-11 w-11 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c] items-center justify-center">
            <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
              {initial}
            </Text>
          </View>
        )}

        <View
          className={`absolute -bottom-0.5 -right-0.5 h-5 w-5 items-center justify-center rounded-full border-2 border-white dark:border-[#242526] ${badge.bgColor}`}>
          <AppIcon
            android={badge.android}
            ios={badge.ios}
            size={11}
            color="#ffffff"
          />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 min-w-0 pr-1">
        <Text
          numberOfLines={2}
          className="text-[15px] leading-tight text-[#050505] dark:text-[#e4e6eb]">
          <Text className="font-bold text-[#050505] dark:text-white">
            {actorName}
          </Text>{' '}
          <Text className="font-normal text-[#050505] dark:text-[#e4e6eb]">
            {item.message}
          </Text>
        </Text>

        <View className="flex-row items-center gap-1 mt-1">
          <Text
            numberOfLines={1}
            className="text-[13px] leading-normal text-[#65676b] dark:text-[#b0b3b8]">
            {formatNotificationTimeAgo(item.createdAt)}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row items-center gap-1.5 shrink-0">
        {!item.isRead ? (
          <View className="h-2 w-2 rounded-full bg-primary-600 dark:bg-primary-400" />
        ) : null}

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onRequestDelete(item);
          }}
          className="p-1.5 rounded-full active:bg-gray-200 dark:active:bg-[#4e4f50]">
          <AppIcon
            android="delete"
            ios="trash"
            size={16}
            color="#65676b"
          />
        </Pressable>
      </View>
    </Pressable>
  );
}
