import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  Platform,
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

export const ConversationItemView = React.memo(
  function ConversationItemView({
    conversation,
    isSelected = false,
    isActiveChat = false,
    onSelect,
    onSelectRow,
    onDeselect,
    onDirectDelete,
  }: ConversationItemViewProps) {
    const { theme, locale, isUserOnline, setTabSwipeLocked } = useUi();
    const isDark = theme === 'dark';
    const participant = getOtherUserFromConversation(conversation);
    const unreadCount = conversation.unreadCount || 0;
    const hasUnread = unreadCount > 0;
    const displayName =
      participant?.name || (locale === 'bn' ? 'ইউজার' : 'User');
    const isOnline =
      isUserOnline(participant?.id) || Boolean(participant?.isOnline);

    const [localSelected, setLocalSelected] = useState(isSelected);
    useEffect(() => {
      setLocalSelected(isSelected);
    }, [isSelected]);

    const effectiveSelected = isSelected || localSelected;

    const isSelectedRef = useRef(effectiveSelected);
    isSelectedRef.current = effectiveSelected;

    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;

    const onSelectRowRef = useRef(onSelectRow);
    onSelectRowRef.current = onSelectRow;

    const onDeselectRef = useRef(onDeselect);
    onDeselectRef.current = onDeselect;

    const onDirectDeleteRef = useRef(onDirectDelete);
    onDirectDeleteRef.current = onDirectDelete;

    const setTabSwipeLockedRef = useRef(setTabSwipeLocked);
    setTabSwipeLockedRef.current = setTabSwipeLocked;

    const conversationRef = useRef(conversation);
    conversationRef.current = conversation;

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
    }, [conversation.id, translateX]);

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
              onSelectRowRef.current?.(conversationRef.current);
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
          clearLongPressTimer();

          if (!isSelectedRef.current) {
            if (
              hadPendingLongPress &&
              Math.abs(gestureState.dx) < 10 &&
              Math.abs(gestureState.dy) < 10
            ) {
              onSelectRef.current?.();
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
        onPanResponderTerminationRequest: () => !Boolean(isSelectedRef.current),
        onPanResponderTerminate: () => {
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
      : isActiveChat
        ? isDark
          ? '#3a3b3c'
          : '#e4e6eb'
        : hasUnread
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
          {...panResponder.panHandlers}
          {...(Platform.OS === 'web'
            ? {
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
                  style={{
                    fontWeight: effectiveSelected || hasUnread ? '700' : '600',
                    color: effectiveSelected
                      ? isDark
                        ? '#4a80f5'
                        : '#1054be'
                      : hasUnread
                        ? isDark
                          ? '#ffffff'
                          : '#050505'
                        : isDark
                          ? '#e4e6eb'
                          : '#050505',
                  }}
                  className="flex-1 text-[15px] leading-[20px]"
                >
                  {displayName}
                </Text>

                {conversation.lastMessageAt ? (
                  <Text
                    className={`text-[12px] shrink-0 font-medium ${
                      hasUnread
                        ? 'font-semibold text-primary-600 dark:text-primary-400'
                        : 'text-[#65676b] dark:text-[#b0b3b8]'
                    }`}
                  >
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
                  }`}
                >
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
          </View>
        </Animated.View>
      </View>
    );
  },
  (prevProps, nextProps) =>
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isActiveChat === nextProps.isActiveChat &&
    prevProps.conversation.id === nextProps.conversation.id &&
    prevProps.conversation.lastMessageText ===
      nextProps.conversation.lastMessageText &&
    prevProps.conversation.lastMessageAt ===
      nextProps.conversation.lastMessageAt &&
    prevProps.conversation.unreadCount === nextProps.conversation.unreadCount
);
