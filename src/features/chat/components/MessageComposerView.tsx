import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';
import { ChatMessage } from '../types/chat.types';

const QUICK_EMOJIS = ['🤲', '🕊️', '❤️', '👍', '😊', '🌸', '👏', '🎉', '🤍'];

export interface MessageComposerViewProps {
  text: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isSending: boolean;
  editingMessage?: ChatMessage | null;
  onCancelEdit?: () => void;
}

export function MessageComposerView({
  text,
  onChangeText,
  onSubmit,
  isSending,
  editingMessage,
  onCancelEdit,
}: MessageComposerViewProps) {
  const { locale, theme } = useUi();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachmentNotice, setAttachmentNotice] = useState(false);

  const canSend = text.trim().length > 0 && !isSending;

  const handleAddEmoji = (emoji: string) => {
    onChangeText(`${text}${emoji}`);
  };

  const handleAttachmentClick = () => {
    setAttachmentNotice(true);
    setTimeout(() => setAttachmentNotice(false), 2500);
  };

  const iconColor = theme === 'dark' ? '#b0b3b8' : '#65676b';

  return (
    <View className="border-t border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526] px-3 pt-2.5 pb-3 sm:px-4 sm:pt-3 shrink-0">
      {/* Quick Emoji Bar (Collapsible) */}
      {showEmojiPicker ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-2 bg-[#f0f2f5] dark:bg-[#18191a] rounded-xl px-2 py-2"
          contentContainerClassName="flex-row items-center gap-1.5">
          <Text className="text-[11px] font-bold text-[#65676b] dark:text-[#b0b3b8] px-1">
            {locale === 'bn' ? 'ইমোজি:' : 'Emojis:'}
          </Text>
          {QUICK_EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => handleAddEmoji(emoji)}
              className="p-1 active:scale-95">
              <Text className="text-lg">{emoji}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {/* Attachment Info Notice */}
      {attachmentNotice ? (
        <View className="mb-2 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800">
          <Text className="text-xs font-semibold text-primary-700 dark:text-primary-300">
            {locale === 'bn'
              ? 'ফাইল ও ইমেজ সংযুক্তি শীঘ্রই উপলব্ধ হবে।'
              : 'File and image attachments will be available in the next release.'}
          </Text>
        </View>
      ) : null}

      {/* Inline Editing Mode Banner */}
      {editingMessage ? (
        <View className="space-y-2">
          <View className="flex-row items-center justify-between px-2 mb-1.5">
            <Text className="text-xs font-semibold text-primary-600 dark:text-primary-400">
              {locale === 'bn' ? 'মেসেজ এডিট করা হচ্ছে' : 'Editing message'}
            </Text>
            {onCancelEdit ? (
              <Pressable
                onPress={onCancelEdit}
                className="p-1 rounded-full active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                <AppIcon
                  android="close"
                  ios="xmark"
                  size={14}
                  color="#65676b"
                />
              </Pressable>
            ) : null}
          </View>

          <View className="flex-row items-end gap-2">
            <TextInput
              value={text}
              onChangeText={onChangeText}
              multiline
              className="flex-1 max-h-32 min-h-[38px] rounded-2xl bg-[#f0f2f5] dark:bg-[#3a3b3c] px-3.5 py-2 text-sm text-[#050505] dark:text-[#e4e6eb]"
            />
            <Pressable
              disabled={!canSend}
              onPress={onSubmit}
              className={`p-2.5 rounded-full bg-primary-500 items-center justify-center shrink-0 ${
                !canSend ? 'opacity-40' : ''
              }`}>
              <AppIcon
                android="check"
                ios="checkmark"
                size={16}
                color="#ffffff"
              />
            </Pressable>
          </View>
        </View>
      ) : (
        /* Regular Message Composer */
        <View className="flex-row items-end gap-1.5 sm:gap-2">
          {/* Attachment Button */}
          <Pressable
            onPress={handleAttachmentClick}
            className="p-2 sm:p-2.5 rounded-full active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c] shrink-0">
            <AppIcon
              android="attach_file"
              ios="paperclip"
              size={20}
              color={iconColor}
            />
          </Pressable>

          {/* Emoji Tray Toggle */}
          <Pressable
            onPress={() => setShowEmojiPicker((prev) => !prev)}
            className={`p-2 sm:p-2.5 rounded-full shrink-0 ${
              showEmojiPicker
                ? 'bg-primary-50 dark:bg-primary-950/60'
                : 'active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]'
            }`}>
            <AppIcon
              android="sentiment_satisfied"
              ios="face.smiling"
              size={20}
              color={showEmojiPicker ? '#1877f2' : iconColor}
            />
          </Pressable>

          {/* Multiline Message Input */}
          <View className="flex-1">
            <TextInput
              value={text}
              onChangeText={onChangeText}
              placeholder={
                locale === 'bn'
                  ? 'শান্তিপূর্ণ মেসেজ লিখুন...'
                  : 'Write a peaceful message...'
              }
              placeholderTextColor={iconColor}
              multiline
              maxLength={2000}
              onSubmitEditing={() => {
                if (canSend) onSubmit();
              }}
              className="w-full max-h-32 min-h-[40px] rounded-2xl bg-[#f0f2f5] dark:bg-[#3a3b3c] px-4 py-2.5 text-sm text-[#050505] dark:text-[#e4e6eb]"
            />
          </View>

          {/* Send Action Button */}
          <Pressable
            disabled={!canSend}
            onPress={onSubmit}
            className={`p-2.5 sm:p-3 rounded-full items-center justify-center shrink-0 ${
              canSend
                ? 'bg-primary-500 active:scale-95'
                : 'bg-primary-200 dark:bg-primary-950/50 opacity-50'
            }`}>
            {isSending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <AppIcon
                android="send"
                ios="paperplane.fill"
                size={16}
                color={canSend ? '#ffffff' : '#60a5fa'}
              />
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
