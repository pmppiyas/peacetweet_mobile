import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';
import { ChatMessage, ChatUser } from '../types/chat.types';
import { ChatAvatar } from './ChatAvatar';

export interface MessageFeedItemProps {
  message: ChatMessage;
  isMe: boolean;
  showAvatar: boolean;
  showDateSeparator?: boolean;
  otherUser?: ChatUser | null;
  onStartEdit?: (message: ChatMessage) => void;
  onRequestDelete?: (message: ChatMessage) => void;
}

export function formatMessageDateHeader(
  dateStr: string,
  locale: 'bn' | 'en'
): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return locale === 'bn' ? 'আজ' : 'Today';
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return locale === 'bn' ? 'গতকাল' : 'Yesterday';
  }

  return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatMessageTime(
  dateStr: string,
  locale: 'bn' | 'en'
): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(locale === 'bn' ? 'bn-BD' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function MessageFeedItem({
  message,
  isMe,
  showAvatar,
  showDateSeparator = false,
  otherUser,
  onStartEdit,
  onRequestDelete,
}: MessageFeedItemProps) {
  const { locale, theme } = useUi();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const isDeleted = Boolean(message.isDeleted);
  const isTemp = message.id.startsWith('temp');
  const otherName = otherUser?.name || message.sender?.name || 'User';

  const handleCopy = () => {
    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      message.text
    ) {
      navigator.clipboard.writeText(message.text).catch(() => {});
    }
    setIsMenuOpen(false);
  };

  return (
    <View className="space-y-2 mb-2">
      {/* Date Header Separator */}
      {showDateSeparator ? (
        <View className="items-center justify-center my-3">
          <View className="px-3 py-1 rounded-full bg-[#e4e6eb]/80 dark:bg-[#393a3b]/80">
            <Text className="text-[11px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
              {formatMessageDateHeader(message.createdAt, locale)}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Message Row */}
      <View
        className={`flex-row items-end gap-2 relative ${
          isMe ? 'justify-end' : 'justify-start'
        }`}>
        {/* Other User Avatar */}
        {!isMe ? (
          <View className="w-8 h-8 shrink-0 items-center justify-center">
            {showAvatar ? (
              <ChatAvatar
                name={otherName}
                avatarUrl={otherUser?.avatarUrl || message.sender?.avatarUrl}
                size="xs"
              />
            ) : (
              <View className="w-8" />
            )}
          </View>
        ) : null}

        {/* Action Controls for Me */}
        {isMe && !isDeleted && !isTemp ? (
          <View
            ref={menuRef}
            className="relative shrink-0 self-center z-30">
            <Pressable
              onPress={() => setIsMenuOpen((prev) => !prev)}
              className="p-1.5 rounded-full active:bg-[#e4e6eb] dark:active:bg-[#3a3b3c]">
              <AppIcon
                android="more_vert"
                ios="ellipsis"
                size={16}
                color="#65676b"
              />
            </Pressable>

            {isMenuOpen ? (
              <View className="absolute right-0 bottom-full mb-1.5 w-36 rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526] shadow-xl py-1.5 z-50">
                <Pressable
                  onPress={handleCopy}
                  className="w-full flex-row items-center gap-2.5 px-3 py-2 active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                  <AppIcon
                    android="content_copy"
                    ios="doc.on.doc"
                    size={14}
                    color={theme === 'dark' ? '#e4e6eb' : '#050505'}
                  />
                  <Text className="text-xs text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'কপি করুন' : 'Copy'}
                  </Text>
                </Pressable>

                {onStartEdit ? (
                  <Pressable
                    onPress={() => {
                      setIsMenuOpen(false);
                      onStartEdit(message);
                    }}
                    className="w-full flex-row items-center gap-2.5 px-3 py-2 active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                    <AppIcon
                      android="edit"
                      ios="pencil"
                      size={14}
                      color={theme === 'dark' ? '#e4e6eb' : '#050505'}
                    />
                    <Text className="text-xs text-[#050505] dark:text-[#e4e6eb]">
                      {locale === 'bn' ? 'এডিট করুন' : 'Edit'}
                    </Text>
                  </Pressable>
                ) : null}

                {onRequestDelete ? (
                  <Pressable
                    onPress={() => {
                      setIsMenuOpen(false);
                      onRequestDelete(message);
                    }}
                    className="w-full flex-row items-center gap-2.5 px-3 py-2 active:bg-red-50 dark:active:bg-red-950/30">
                    <AppIcon
                      android="delete"
                      ios="trash"
                      size={14}
                      color="#dc2626"
                    />
                    <Text className="text-xs text-red-600 dark:text-red-400">
                      {locale === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Message Bubble */}
        <Pressable
          onLongPress={() => {
            if (isMe && !isDeleted && !isTemp) {
              setIsMenuOpen((prev) => !prev);
            }
          }}
          className={`max-w-[78%] sm:max-w-[70%] px-3.5 py-2 relative ${
            isDeleted
              ? 'opacity-60 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl'
              : isMe
                ? 'bg-primary-500 rounded-2xl rounded-br-xs'
                : 'bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-2xl rounded-bl-xs'
          } ${isTemp ? 'opacity-70' : ''}`}>
          {isDeleted ? (
            <View className="flex-row items-center gap-1.5">
              <AppIcon
                android="block"
                ios="nosign"
                size={14}
                color="#9ca3af"
              />
              <Text className="text-xs italic text-gray-500">
                {locale === 'bn'
                  ? 'মেসেজটি মুছে ফেলা হয়েছে'
                  : 'This message was deleted'}
              </Text>
            </View>
          ) : (
            <Text
              className={`text-sm leading-relaxed ${
                isMe ? 'text-white' : 'text-[#050505] dark:text-[#e4e6eb]'
              }`}>
              {message.text}
            </Text>
          )}

          {/* Timestamp & Meta Information inside Bubble */}
          <View className="flex-row items-center justify-end gap-1 mt-1">
            {message.isEdited && !isDeleted ? (
              <Text
                className={`text-[10px] italic ${
                  isMe
                    ? 'text-white/80'
                    : 'text-[#65676b] dark:text-[#b0b3b8]'
                }`}>
                {locale === 'bn' ? '(সম্পাদিত)' : '(edited)'}
              </Text>
            ) : null}

            <Text
              className={`text-[10px] ${
                isMe
                  ? 'text-white/80'
                  : 'text-[#65676b] dark:text-[#b0b3b8]'
              }`}>
              {formatMessageTime(message.createdAt, locale)}
            </Text>

            {isMe && !isDeleted ? (
              <AppIcon
                android={message.isRead ? 'done_all' : 'check'}
                ios="checkmark"
                size={13}
                color={message.isRead ? '#ffffff' : 'rgba(255,255,255,0.8)'}
              />
            ) : null}
          </View>
        </Pressable>
      </View>
    </View>
  );
}
