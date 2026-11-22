import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';
import {
  ConversationItem,
  getOtherUserFromConversation,
} from '../types/chat.types';
import { ChatAvatar } from './ChatAvatar';

export interface ConversationItemViewProps {
  conversation: ConversationItem;
  isSelected?: boolean;
  isActiveChat?: boolean;
  onSelect: () => void;
  onSelectRow?: (conversation: ConversationItem) => void;
  onDeselect?: () => void;
  onDirectDelete?: (conversation: ConversationItem) => void;
}

export function formatConversationLastMessage(
  text: string | null | undefined,
  locale: 'bn' | 'en'
): string {
  if (!text) {
    return locale === 'bn' ? 'মেসেজ পাঠান' : 'Send a message';
  }
  const isDeleted =
    text === 'মেসেজটি মুছে ফেলা হয়েছে' ||
    text === 'মেসেজ মুছে ফেলা হয়েছে' ||
    text === 'This message was deleted' ||
    text === 'Message was deleted';

  if (isDeleted) {
    return locale === 'bn'
      ? 'মেসেজটি মুছে ফেলা হয়েছে'
      : 'This message was deleted';
  }

  return text;
}

export function formatConversationTime(
  dateStr: string | null | undefined,
  locale: 'bn' | 'en'
): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (isToday) {
    return date.toLocaleTimeString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  if (diffDays === 1) {
    return locale === 'bn' ? 'গতকাল' : 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'short',
    });
  }
  return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function ConversationItemView({
  conversation,
  isSelected = false,
  isActiveChat = false,
  onSelect,
  onSelectRow,
  onDeselect,
  onDirectDelete,
}: ConversationItemViewProps) {
  const { theme, locale, isUserOnline } = useUi();
  const isDark = theme === 'dark';
  const participant = getOtherUserFromConversation(conversation);
  const unreadCount = conversation.unreadCount || 0;
  const hasUnread = unreadCount > 0;
  const displayName =
    participant?.name || (locale === 'bn' ? 'ইউজার' : 'User');
  const isOnline =
    isUserOnline(participant?.id) || Boolean(participant?.isOnline);

  const isSelectedRef = useRef(isSelected);
  isSelectedRef.current = isSelected;

  const onDeselectRef = useRef(onDeselect);
  onDeselectRef.current = onDeselect;

  const onDirectDeleteRef = useRef(onDirectDelete);
  onDirectDeleteRef.current = onDirectDelete;

  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;

  const { width: windowWidth } = useWindowDimensions();
  const [rowWidth, setRowWidth] = useState(windowWidth);
  const rowWidthRef = useRef(windowWidth);
  rowWidthRef.current = rowWidth;

  const selectedTimeRef = useRef<number>(0);
  useEffect(() => {
    if (isSelected) {
      selectedTimeRef.current = Date.now();
    }
  }, [isSelected]);

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
  }, [conversation.id, translateX]);

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

        // Ignore release if it happened immediately after selection (the finger-up of the long-press)
        if (Date.now() - selectedTimeRef.current < 350) {
          return;
        }

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
            onDirectDeleteRef.current?.(conversationRef.current);
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
      className="w-full relative overflow-hidden">
      {/* Revealed delete background behind row when sliding left (Neutral styling, matching NotificationItemRow) */}
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
        className="w-full">
        <Pressable
          onPress={() => {
            if (isSelected) {
              onDeselect?.();
              return;
            }
            onSelect();
          }}
          onLongPress={() => {
            if (!isSelected) {
              onSelectRow?.(conversation);
            }
          }}
          delayLongPress={300}
          android_ripple={{
            color: isDark
              ? 'rgba(8, 102, 255, 0.20)'
              : 'rgba(8, 102, 255, 0.12)',
          }}
          className={`w-full relative flex-row items-center gap-3 px-3 py-1.5 transition-colors ${
            isSelected
              ? 'bg-[#edf4ff] dark:bg-[#202938]'
              : isActiveChat
                ? 'bg-[#e4e6eb] dark:bg-[#3a3b3c]'
                : hasUnread
                  ? 'bg-[#edf2f7] dark:bg-[#2e3033] active:bg-[#0866FF]/10 dark:active:bg-[#0866FF]/20'
                  : 'bg-white dark:bg-[#18191a] active:bg-[#0866FF]/8 dark:active:bg-[#0866FF]/15'
          }`}>
          <ChatAvatar
            name={displayName}
            avatarUrl={participant?.avatarUrl}
            size="lg"
            isOnline={isOnline}
            showOnlineBadge
          />

          <View className="flex-1 min-w-0">
            <View className="flex-row items-center justify-between gap-1.5">
              <Text
                numberOfLines={1}
                className={`flex-1 text-[15px] leading-[20px] ${
                  isSelected
                    ? 'font-bold text-primary-700 dark:text-primary-400'
                    : hasUnread
                      ? 'font-bold text-[#050505] dark:text-white'
                      : 'font-semibold text-[#050505] dark:text-[#e4e6eb]'
                }`}>
                {displayName}
              </Text>

              {conversation.lastMessageAt ? (
                <Text
                  className={`text-[12px] shrink-0 font-medium ${
                    hasUnread
                      ? 'font-semibold text-primary-600 dark:text-primary-400'
                      : 'text-[#65676b] dark:text-[#b0b3b8]'
                  }`}>
                  {formatConversationTime(conversation.lastMessageAt, locale)}
                </Text>
              ) : null}
            </View>

            <View className="flex-row items-center justify-between gap-2 mt-1">
              <Text
                numberOfLines={1}
                className={`flex-1 text-[13.5px] leading-[18px] ${
                  hasUnread
                    ? 'font-semibold text-[#050505] dark:text-[#e6e9ef]'
                    : 'text-[#65676b] dark:text-[#b0b3b8]'
                }`}>
                {formatConversationLastMessage(
                  conversation.lastMessageText,
                  locale
                )}
              </Text>

              {hasUnread ? (
                <View className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary-600 items-center justify-center shrink-0">
                  <Text className="text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
