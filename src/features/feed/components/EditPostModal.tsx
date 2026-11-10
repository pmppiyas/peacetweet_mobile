import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { normalizeMediaUrl } from '@/features/uploads/api/uploads.api';
import { FeedItem } from '../types/feed.types';
import { feedApi } from '../api/feed.api';

export interface EditPostModalProps {
  visible: boolean;
  onClose: () => void;
  post: FeedItem;
  onSuccess: (updatedPost: FeedItem) => void;
}

export function EditPostModal({
  visible,
  onClose,
  post,
  onSuccess,
}: EditPostModalProps) {
  const { locale, theme, openComposer, setIsUploadingPost, triggerPostSuccess } = useUi();
  const isDark = theme === 'dark';
  const [content, setContent] = useState(post.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect any post edit attempt to the full Mobile Composer in edit mode
  useEffect(() => {
    if (visible && post) {
      onClose();
      const mode =
        post.type === 'BLOOD_REQUEST' ||
        Boolean(post.bloodRequest) ||
        Boolean(post.bloodRequestId)
          ? 'BLOOD_REQUEST'
          : post.type === 'DUA' ||
            Boolean(post.dua) ||
            Boolean(post.duaId)
          ? 'DUA'
          : 'TEXT';

      openComposer({
        mode,
        editingPost: post,
      });
    }
  }, [visible, post]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    setError(null);
    setIsUploadingPost(true, 'UPDATE');
    onClose();
    try {
      const res = await feedApi.updatePost(post.id, { content: content.trim() });
      const payload = (res as any)?.data ?? res;
      if (payload && payload.id) {
        const hasValidBlood =
          payload.bloodRequest &&
          !(payload.bloodRequest as any).isUnavailable;
        onSuccess({
          ...post,
          ...payload,
          bloodRequest: hasValidBlood
            ? payload.bloodRequest
            : post.bloodRequest,
        });
      } else {
        onSuccess({ ...post, content: content.trim() });
      }
      triggerPostSuccess();
    } catch (err: any) {
      setIsUploadingPost(false);
      setError(
        locale === 'bn'
          ? 'পোস্ট আপডেট করতে ব্যর্থ হয়েছে।'
          : 'Failed to update post. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 520,
            backgroundColor: isDark ? '#242526' : '#f5f6f8',
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: isDark ? '#393a3b' : '#d9dde4',
          }}>
          {/* Header */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: isDark ? '#393a3b' : '#e6e9ef',
            }}
            className="px-5 py-3.5 flex-row items-center justify-between">
            <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
              {locale === 'bn' ? 'পোস্ট সম্পাদনা করুন' : 'Edit Post'}
            </Text>
            <Pressable
              onPress={onClose}
              className="h-8 w-8 rounded-full bg-[#e6e9ef] dark:bg-[#3a3b3c] items-center justify-center active:opacity-70">
              <AppIcon
                android="close"
                size={18}
                color={isDark ? '#e4e6eb' : '#050505'}
              />
            </Pressable>
          </View>

          {/* Author info */}
          <View className="px-5 pt-4 flex-row items-center gap-2.5">
            <UserAvatar
              avatarUrl={normalizeMediaUrl(
                post.author?.avatar || (post.author as any)?.avatarUrl
              )}
              name={post.author?.name || 'User'}
              size="md"
            />
            <View>
              <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                {post.author?.name || 'User'}
              </Text>
              <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                @{post.author?.username || 'user'}
              </Text>
            </View>
          </View>

          {/* Input Area */}
          <View className="p-5">
            <TextInput
              multiline
              numberOfLines={4}
              value={content}
              onChangeText={setContent}
              placeholder={
                locale === 'bn' ? 'কী ভাবছেন লিখুন...' : "What's on your mind?"
              }
              placeholderTextColor="#8e8e93"
              style={{
                minHeight: 120,
                textAlignVertical: 'top',
                color: isDark ? '#e4e6eb' : '#050505',
                fontSize: 14,
              }}
              className="w-full bg-[#f8f9fa] dark:bg-[#18191a] p-3.5 rounded-xl border border-[#e4e6eb] dark:border-[#393a3b]"
            />

            {error && (
              <Text className="text-xs text-rose-500 mt-2 font-medium">
                {error}
              </Text>
            )}

            {/* Action buttons */}
            <View className="flex-row items-center justify-end gap-2.5 mt-4">
              <Pressable
                onPress={onClose}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 active:opacity-75">
                <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {locale === 'bn' ? 'বাতিল' : 'Cancel'}
                </Text>
              </Pressable>

              <Pressable
                disabled={isSaving || !content.trim()}
                onPress={handleSave}
                style={{
                  backgroundColor: content.trim() ? '#0866FF' : '#93c5fd',
                }}
                className="px-5 py-2 rounded-xl items-center justify-center flex-row gap-2 active:opacity-80">
                {isSaving && (
                  <ActivityIndicator size="small" color="#ffffff" />
                )}
                <Text className="text-xs font-bold text-white">
                  {locale === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
