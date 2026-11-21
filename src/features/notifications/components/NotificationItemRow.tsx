import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
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
  isSelected?: boolean;
  onPress: (item: NotificationItem) => void;
  onSelect?: (item: NotificationItem) => void;
  onDeselect?: () => void;
  onDirectDelete?: (item: NotificationItem) => void;
  onRequestDelete?: (item: NotificationItem) => void;
}

export function NotificationItemRow({
  item,
  isSelected = false,
  onPress,
  onSelect,
  onDeselect,
  onDirectDelete,
  onRequestDelete,
}: NotificationItemRowProps) {
  const { theme, locale } = useUi();
  const isDark = theme === 'dark';
  const badge = getNotificationBadgeConfig(item.type);
  const actorName = item.actor?.name || 'Someone';

  const isSelectedRef = useRef(isSelected);
  isSelectedRef.current = isSelected;

  const onDeselectRef = useRef(onDeselect);
  onDeselectRef.current = onDeselect;

  const onDirectDeleteRef = useRef(onDirectDelete || onRequestDelete);
  onDirectDeleteRef.current = onDirectDelete || onRequestDelete;

  const itemRef = useRef(item);
  itemRef.current = item;

  const displayMessage = (() => {
    if (item.type === 'POST_COMMENT') {
      if (item.message && item.message.toLowerCase().includes('replied')) {
        return 'replied to your comment';
      }
      return 'commented on your post.';
    }
    return item.message;
  })();

  const { width: windowWidth } = useWindowDimensions();
  const [rowWidth, setRowWidth] = useState(windowWidth);
  const rowWidthRef = useRef(windowWidth);
  rowWidthRef.current = rowWidth;

  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isSelected) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [isSelected, translateX]);

  useEffect(() => {
    translateX.setValue(0);
  }, [item.id, translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => Boolean(isSelectedRef.current),
      onStartShouldSetPanResponderCapture: () => Boolean(isSelectedRef.current),
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Boolean(isSelectedRef.current) &&
          (Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.vx) > 0.15)
        );
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return (
          Boolean(isSelectedRef.current) &&
          (Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.vx) > 0.15)
        );
      },
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        if (!isSelectedRef.current) return;
        if (gestureState.dx <= 0) {
          translateX.setValue(gestureState.dx);
        } else {
          translateX.setValue(gestureState.dx * 0.12);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!isSelectedRef.current) return;

        // 1. Did the user tap without dragging? (less than 10px move)
        if (Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10) {
          onDeselectRef.current?.();
          return;
        }

        // 2. Minimum 40% swipe required to delete
        const threshold = -(rowWidthRef.current * 0.4);
        const isSwipeDelete = gestureState.dx < threshold;

        if (isSwipeDelete) {
          Animated.timing(translateX, {
            toValue: -rowWidthRef.current - 50,
            duration: 160,
            useNativeDriver: true,
          }).start(() => {
            onDirectDeleteRef.current?.(itemRef.current);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            friction: 8,
            tension: 60,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - rowWidthRef.current) > 2) {
          rowWidthRef.current = w;
          setRowWidth(w);
        }
      }}
      className="w-full relative overflow-hidden"
    >
      {/* Revealed delete background behind row when sliding left (Neutral styling, no red) */}
      {isSelected ? (
        <View className="absolute inset-0 bg-[#e4e6eb] dark:bg-[#2e3033] flex-row items-center justify-end px-5 gap-2">
          <AppIcon
            android="delete"
            ios="trash"
            size={20}
            color={isDark ? '#e4e6eb' : '#4b4c4f'}
          />
          <Text className="text-xs font-semibold text-[#4b4c4f] dark:text-[#e4e6eb]">
            {locale === 'bn' ? 'মুছে ফেলতে টানুন' : 'Swipe to delete'}
          </Text>
        </View>
      ) : null}

      {/* Foreground sliding row */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX }],
        }}
        className="w-full"
      >
        <Pressable
          pointerEvents={isSelected ? 'none' : 'auto'}
          onPress={() => {
            if (isSelected) {
              onDeselect?.();
              return;
            }
            onPress(item);
          }}
          onLongPress={() => {
            if (!isSelected) {
              onSelect?.(item);
            }
          }}
          delayLongPress={350}
          android_ripple={{
            color: isDark
              ? 'rgba(8, 102, 255, 0.20)'
              : 'rgba(8, 102, 255, 0.12)',
          }}
          className={`w-full relative flex-row items-center gap-3 px-3 py-1.5 transition-colors ${
            isSelected
              ? 'bg-[#edf4ff] dark:bg-[#202938]'
              : !item.isRead
                ? 'bg-[#edf2f7] dark:bg-[#2e3033] active:bg-[#0866FF]/10 dark:active:bg-[#0866FF]/20'
                : 'bg-white dark:bg-[#18191a] active:bg-[#0866FF]/8 dark:active:bg-[#0866FF]/15'
          }`}
          style={({ pressed }) =>
            pressed && !isSelected
              ? {
                  backgroundColor: isDark
                    ? 'rgba(8, 102, 255, 0.18)'
                    : !item.isRead
                      ? 'rgba(8, 102, 255, 0.10)'
                      : 'rgba(8, 102, 255, 0.08)',
                }
              : undefined
          }
        >
          {/* Avatar with badge */}
          <Pressable
            onPress={(e) => {
              if (isSelected) {
                onDeselect?.();
                return;
              }
              if (item.actor?.username) {
                e.stopPropagation();
                router.push(`/${item.actor.username}` as any);
              } else {
                onPress(item);
              }
            }}
            className="relative shrink-0 active:opacity-80"
          >
            <UserAvatar
              avatarUrl={item.actor?.avatarUrl || (item.actor as any)?.avatar}
              name={actorName}
              size="lg"
            />

            <View
              className={`absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-white dark:border-[#242526] ${badge.bgColor}`}
            >
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
              className="text-[15px] leading-[20px] text-[#050505] dark:text-[#e4e6eb]"
            >
              <Text
                className={`${
                  !item.isRead
                    ? 'font-bold text-[#050505] dark:text-white'
                    : 'font-semibold text-[#050505] dark:text-[#e4e6eb]'
                }`}
              >
                {actorName}
              </Text>{' '}
              <Text
                className={`${
                  !item.isRead
                    ? 'font-medium text-[#050505] dark:text-[#e4e6eb]'
                    : 'font-normal text-[#4b4c4f] dark:text-[#b0b3b8]'
                }`}
              >
                {displayMessage}
              </Text>
            </Text>

            <View className="flex-row items-center gap-1 mt-1">
              <Text
                numberOfLines={1}
                className={`text-[12px] leading-[16px] font-medium ${
                  !item.isRead
                    ? 'font-semibold text-primary-600 dark:text-primary-400'
                    : 'text-[#65676b] dark:text-[#b0b3b8]'
                }`}
              >
                {formatNotificationTimeAgo(item.createdAt)}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row items-center gap-1.5 shrink-0">
            {!item.isRead ? (
              <View className="h-2.5 w-2.5 rounded-full bg-primary-600 dark:bg-primary-400" />
            ) : null}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
