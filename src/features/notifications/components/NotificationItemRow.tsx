import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  Platform,
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

export const NotificationItemRow = React.memo(
  function NotificationItemRow({
    item,
    isSelected = false,
    onPress,
    onSelect,
    onDeselect,
    onDirectDelete,
    onRequestDelete,
  }: NotificationItemRowProps) {
    const { theme, locale, setTabSwipeLocked } = useUi();
    const isDark = theme === 'dark';
    const badge = getNotificationBadgeConfig(item.type);
    const actorName = item.actor?.name || 'Someone';

    const [localSelected, setLocalSelected] = useState(isSelected);
    useEffect(() => {
      setLocalSelected(isSelected);
    }, [isSelected]);

    const effectiveSelected = isSelected || localSelected;

    const isSelectedRef = useRef(effectiveSelected);
    isSelectedRef.current = effectiveSelected;

    const onPressRef = useRef(onPress);
    onPressRef.current = onPress;

    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;

    const onDeselectRef = useRef(onDeselect);
    onDeselectRef.current = onDeselect;

    const onDirectDeleteRef = useRef(onDirectDelete || onRequestDelete);
    onDirectDeleteRef.current = onDirectDelete || onRequestDelete;

    const setTabSwipeLockedRef = useRef(setTabSwipeLocked);
    setTabSwipeLockedRef.current = setTabSwipeLocked;

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

    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null
    );
    const selectedDuringThisTouchRef = useRef(false);
    const dragOffsetXRef = useRef(0);
    const lastDxRef = useRef(0);
    const isAvatarTouchRef = useRef(false);
    const wasSelectedRef = useRef(false);

    const clearLongPressTimer = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    useEffect(() => {
      return () => {
        clearLongPressTimer();
      };
    }, []);

    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (effectiveSelected) {
        wasSelectedRef.current = true;
      } else if (wasSelectedRef.current) {
        wasSelectedRef.current = false;
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }, [effectiveSelected, translateX]);

    useEffect(() => {
      translateX.setValue(0);
    }, [item.id, translateX]);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => Boolean(isSelectedRef.current),
        onMoveShouldSetPanResponderCapture: () =>
          Boolean(isSelectedRef.current),
        onShouldBlockNativeResponder: () => Boolean(isSelectedRef.current),
        onPanResponderGrant: () => {
          clearLongPressTimer();
          translateX.stopAnimation();
          lastDxRef.current = 0;
          dragOffsetXRef.current = 0;

          if (isSelectedRef.current) {
            selectedDuringThisTouchRef.current = false;
            return;
          }

          selectedDuringThisTouchRef.current = false;

          longPressTimerRef.current = setTimeout(() => {
            longPressTimerRef.current = null;
            if (!isSelectedRef.current) {
              isSelectedRef.current = true;
              selectedDuringThisTouchRef.current = true;
              dragOffsetXRef.current = lastDxRef.current;
              setTabSwipeLockedRef.current?.(true);
              setLocalSelected(true);
              onSelectRef.current?.(itemRef.current);
            }
          }, 220);
        },
        onPanResponderMove: (_, gestureState) => {
          lastDxRef.current = gestureState.dx;

          if (!isSelectedRef.current) {
            if (
              Math.abs(gestureState.dx) > 10 ||
              Math.abs(gestureState.dy) > 10
            ) {
              if (longPressTimerRef.current) {
                clearLongPressTimer();
              }
            }
            return;
          }

          const effectiveDx = gestureState.dx - dragOffsetXRef.current;
          if (effectiveDx <= 0) {
            translateX.setValue(effectiveDx);
          } else {
            translateX.setValue(effectiveDx * 0.12);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          const hadPendingLongPress = Boolean(longPressTimerRef.current);
          const touchedAvatar = isAvatarTouchRef.current;
          isAvatarTouchRef.current = false;
          clearLongPressTimer();

          if (!isSelectedRef.current) {
            if (
              hadPendingLongPress &&
              Math.abs(gestureState.dx) < 10 &&
              Math.abs(gestureState.dy) < 10
            ) {
              const currentItem = itemRef.current;
              if (touchedAvatar && currentItem.actor?.username) {
                router.push(`/${currentItem.actor.username}` as any);
              } else {
                onPressRef.current?.(currentItem);
              }
            }
            return;
          }

          const effectiveDx = gestureState.dx - dragOffsetXRef.current;

          // 1. Did the user tap/release without dragging? (< 10px move)
          if (Math.abs(effectiveDx) < 10 && Math.abs(gestureState.dy) < 10) {
            if (!selectedDuringThisTouchRef.current) {
              isSelectedRef.current = false;
              setLocalSelected(false);
              onDeselectRef.current?.();
            } else {
              Animated.spring(translateX, {
                toValue: 0,
                friction: 8,
                tension: 60,
                useNativeDriver: true,
              }).start();
            }
            selectedDuringThisTouchRef.current = false;
            return;
          }

          selectedDuringThisTouchRef.current = false;

          // 2. Minimum 40% swipe required to delete
          const threshold = -(rowWidthRef.current * 0.4);
          const isSwipeDelete = effectiveDx < threshold;

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
        onPanResponderTerminationRequest: () => !Boolean(isSelectedRef.current),
        onPanResponderTerminate: () => {
          isAvatarTouchRef.current = false;
          clearLongPressTimer();
          selectedDuringThisTouchRef.current = false;
          if (isSelectedRef.current) {
            Animated.spring(translateX, {
              toValue: 0,
              friction: 8,
              tension: 60,
              useNativeDriver: true,
            }).start();
          }
        },
      })
    ).current;

    const rowBgColor = effectiveSelected
      ? isDark
        ? '#202938'
        : '#edf4ff'
      : !item.isRead
        ? isDark
          ? '#2e3033'
          : '#edf2f7'
        : isDark
          ? '#18191a'
          : '#ffffff';

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
        {/* Revealed delete background behind row when sliding left (Always opacity 1 underneath opaque row so it reveals immediately with 0ms delay) */}
        <View
          pointerEvents="none"
          className="absolute inset-0 bg-[#e4e6eb] dark:bg-[#2e3033] flex-row items-center justify-end px-4 gap-2"
        >
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

        {/* Foreground sliding row */}
        <Animated.View
          onTouchStartCapture={() => {
            isAvatarTouchRef.current = false;
          }}
          {...panResponder.panHandlers}
          {...(Platform.OS === 'web'
            ? {
                onMouseDownCapture: () => {
                  isAvatarTouchRef.current = false;
                },
                onDragStart: (e: any) => e.preventDefault?.(),
                onContextMenu: (e: any) => e.preventDefault?.(),
              }
            : {})}
          style={{
            transform: [{ translateX }],
          }}
          className="w-full"
        >
          <View
            style={{ backgroundColor: rowBgColor }}
            className="w-full relative flex-row items-center gap-3 px-3 py-1.5 select-none"
          >
            {/* Avatar with badge */}
            <View
              onTouchStart={() => {
                isAvatarTouchRef.current = true;
              }}
              {...(Platform.OS === 'web'
                ? {
                    onMouseDown: () => {
                      isAvatarTouchRef.current = true;
                    },
                  }
                : {})}
              className="relative shrink-0"
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
            </View>

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
          </View>
        </Animated.View>
      </View>
    );
  },
  (prevProps, nextProps) =>
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.isRead === nextProps.item.isRead &&
    prevProps.item.message === nextProps.item.message &&
    prevProps.item.createdAt === nextProps.item.createdAt
);
