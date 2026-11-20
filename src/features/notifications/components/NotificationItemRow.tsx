import React, { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { AppIcon, AndroidSymbol } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
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
  const badge = getNotificationBadgeConfig(item.type);
  const actorName = item.actor?.name || 'Someone';

  return (
    <Pressable
      onPress={() => onPress(item)}
      className={`w-full relative flex-row items-center gap-3 px-3 py-1.5 ${
        !item.isRead
          ? 'bg-[#edf2f7] dark:bg-[#2e3033] active:bg-[#e4e6eb] dark:active:bg-[#3a3b3c]'
          : 'active:bg-[#e4e6eb]/70 dark:active:bg-[#3a3b3c]/60'
      }`}>
      {/* Avatar with badge */}
      <Pressable
        onPress={(e) => {
          if (item.actor?.username) {
            e.stopPropagation();
            router.push(`/${item.actor.username}` as any);
          } else {
            onPress(item);
          }
        }}
        className="relative shrink-0 active:opacity-80">
        <UserAvatar
          avatarUrl={item.actor?.avatarUrl || (item.actor as any)?.avatar}
          name={actorName}
          size="lg"
        />

        <View
          className={`absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-white dark:border-[#242526] ${badge.bgColor}`}>
          <AppIcon
            android={badge.android}
            ios={badge.ios}
            size={12}
            color="#ffffff"
          />
        </View>
      </Pressable>

      {/* Content */}
      <View className="flex-1 min-w-0 pr-1">
        <Text
          numberOfLines={2}
          className="text-[15px] leading-[20px] text-[#050505] dark:text-[#e4e6eb]">
          <Text
            className={`${
              !item.isRead
                ? 'font-bold text-[#050505] dark:text-white'
                : 'font-semibold text-[#050505] dark:text-[#e4e6eb]'
            }`}>
            {actorName}
          </Text>{' '}
          <Text
            className={`${
              !item.isRead
                ? 'font-medium text-[#050505] dark:text-[#e4e6eb]'
                : 'font-normal text-[#4b4c4f] dark:text-[#b0b3b8]'
            }`}>
            {item.message}
          </Text>
        </Text>

        <View className="flex-row items-center gap-1 mt-1">
          <Text
            numberOfLines={1}
            className={`text-[12px] leading-[16px] font-medium ${
              !item.isRead
                ? 'font-semibold text-primary-600 dark:text-primary-400'
                : 'text-[#65676b] dark:text-[#b0b3b8]'
            }`}>
            {formatNotificationTimeAgo(item.createdAt)}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row items-center gap-1.5 shrink-0">
        {!item.isRead ? (
          <View className="h-2.5 w-2.5 rounded-full bg-primary-600 dark:bg-primary-400" />
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
