import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useFeed } from '@/providers/FeedProvider';
import { feedApi } from '@/features/feed/api/feed.api';
import { FeedItem, PostComment } from '@/features/feed/types/feed.types';
import { TimeSlotPicker } from '@/features/bookmark/components/TimeSlotPicker';
import { AppIcon } from '@/components/ui/Icon';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const FEELING_MAP: Record<string, { label: string; emoji: string }> = {
  grateful: { label: 'grateful', emoji: '🤲' },
  blessed: { label: 'blessed', emoji: '✨' },
  peaceful: { label: 'peaceful', emoji: '🕊️' },
  hopeful: { label: 'hopeful', emoji: '🌙' },
  happy: { label: 'happy', emoji: '😊' },
  reflective: { label: 'reflective', emoji: '💭' },
};

const BLOOD_LABEL_MAP: Record<string, string> = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-',
};

function formatRelativeDate(dateStr: string, locale: 'bn' | 'en'): string {
  if (!dateStr) return locale === 'bn' ? 'আজ' : 'Today';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return locale === 'bn' ? 'এইমাত্র' : 'Just now';
  if (diffMin < 60)
    return locale === 'bn' ? `${diffMin} মিনিট আগে` : `${diffMin}m ago`;
  if (diffHours < 24)
    return locale === 'bn' ? `${diffHours} ঘণ্টা আগে` : `${diffHours}h ago`;
  if (diffDays < 7)
    return locale === 'bn' ? `${diffDays} দিন আগে` : `${diffDays}d ago`;

  return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function FeedPostCard({ post }: { post: FeedItem }) {
  const { locale, theme } = useUi();
  const { user, isAuthenticated } = useAuth();
  const {
    toggleReaction,
    toggleSave,
    updatePostTimeSlot,
    deletePost,
    updateCommentCount,
  } = useFeed();

  const [showArabic, setShowArabic] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false);
  const [showUnsaveConfirm, setShowUnsaveConfirm] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const hasReacted = Boolean(post.viewer?.hasReacted);
  const hasSaved = Boolean(post.viewer?.hasSaved);
  const currentTimeSlot = post.viewer?.timeSlot || null;
  const reactionCount = post.stats?.reactionCount || 0;
  const commentCount = post.stats?.commentCount || 0;
  const saveCount = post.stats?.saveCount || 0;
  const shareCount = post.stats?.shareCount || 0;

  const handleToggleSave = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!hasSaved) {
      toggleSave(post.id, false);
    }
    setIsTimePickerOpen(true);
  };

  const authorName = post.author?.name || 'PeaceTweet Scholar';
  const authorUsername = post.author?.username || 'peacetweet';
  const feelingItem = post.feeling
    ? FEELING_MAP[post.feeling.toLowerCase()] || {
        label: post.feeling,
        emoji: '✨',
      }
    : null;
  const isAuthor =
    Boolean(user?.id && post.author?.id && user.id === post.author.id) ||
    user?.role === 'ADMIN';

  const handleToggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      setIsLoadingComments(true);
      try {
        const res = await feedApi.getComments(post.id, 30);
        const list = ((res as any)?.data ?? res) as PostComment[];
        if (Array.isArray(list)) {
          setComments(list);
        }
      } catch {}
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || isSubmittingComment) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsSubmittingComment(true);
    try {
      const res = await feedApi.createComment(post.id, commentText.trim());
      const payload = (res as any)?.data ?? res;
      if (payload?.comment) {
        setComments((prev) => [...prev, payload.comment]);
      }
      if (typeof payload?.commentCount === 'number') {
        updateCommentCount(post.id, payload.commentCount);
      } else {
        updateCommentCount(post.id, commentCount + 1);
      }
      setCommentText('');
    } catch {}
    setIsSubmittingComment(false);
  };

  return (
    <View className="w-full bg-white dark:bg-[#242526]">
      {/* 1. Author & Post Meta Header matching FeedItem.tsx */}
      <View className="px-3 pt-2.5 pb-1.5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-row items-center gap-2.5 flex-1">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-500">
              <Text className="text-white font-bold text-sm">
                {authorName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View className="flex-1">
              <View className="flex-row items-center gap-1.5 flex-wrap">
                <Text className="font-bold text-[15px] text-[#050505] dark:text-[#e4e6eb]">
                  {authorName}
                </Text>
                <AppIcon
                  android="verified"
                  ios="checkmark.seal.fill"
                  size={14}
                  color="#1877f2"
                />
                {feelingItem && (
                  <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                    is feeling{' '}
                    <Text className="font-semibold text-[#050505] dark:text-[#e4e6eb]">
                      {feelingItem.label}
                    </Text>{' '}
                    {feelingItem.emoji}
                  </Text>
                )}
              </View>

              <View className="flex-row items-center gap-1.5 mt-0.5">
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                  @{authorUsername}
                </Text>
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                  •
                </Text>
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                  {formatRelativeDate(post.createdAt, locale)}
                </Text>
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                  •
                </Text>
                <AppIcon
                  android="public"
                  ios="globe"
                  size={12}
                  color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
                />
              </View>
            </View>
          </View>

          {isAuthor && (
            <Pressable
              onPress={() => setShowDeletePostConfirm(true)}
              className="p-1.5 rounded-full active:bg-rose-50 dark:active:bg-rose-950/30">
              <AppIcon
                android="delete"
                ios="trash"
                size={16}
                color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
              />
            </Pressable>
          )}
        </View>

        {/* 2. Main Post Content Body */}
        <View className="mt-3">
          {(post.type === 'TEXT' ||
            post.type === 'QUESTION' ||
            post.type === 'ANNOUNCEMENT') &&
            post.content && (
              <Text className="text-[15px] text-[#050505] dark:text-[#e4e6eb] leading-6">
                {post.content}
              </Text>
            )}

          {post.type === 'DUA' && (
            <View className="gap-3">
              {/* Optional Editorial Note / Dua Title */}
              {(post.content || post.dua?.title) && (
                <Text className="text-[16px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {post.content
                    ? post.content
                    : `🌙 ${post.dua?.title}`}
                </Text>
              )}

              {post.dua && (
                <>
                  {/* 1. Fadilah / Virtue */}
                  {post.dua.fadilah && (
                    <Text className="text-[14.5px] text-[#050505] dark:text-[#e4e6eb] leading-6">
                      {post.dua.fadilah}
                    </Text>
                  )}

                  {/* 2. Pronunciation */}
                  {post.dua.transliteration && (
                    <View className="gap-1">
                      <Text className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                        Pronunciation:
                      </Text>
                      <Text className="text-[14.5px] text-[#050505] dark:text-[#e4e6eb] leading-6">
                        {post.dua.transliteration}
                      </Text>
                    </View>
                  )}

                  {/* 3. Meaning */}
                  {(post.dua.meaning || post.dua.meaningBangla) && (
                    <View className="gap-1">
                      <Text className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                        Meaning:
                      </Text>
                      <Text className="text-[14.5px] text-[#050505] dark:text-[#e4e6eb] leading-6">
                        {post.dua.meaning || post.dua.meaningBangla}
                      </Text>
                    </View>
                  )}

                  {/* 4. Collapsible Arabic Text */}
                  {post.dua.arabicText && (
                    <View className="gap-2">
                      <Pressable
                        onPress={() => setShowArabic(!showArabic)}
                        className="flex-row items-center gap-1.5 py-1 self-start">
                        <AppIcon
                          android="translate"
                          size={14}
                          color={theme === 'dark' ? '#4a80f5' : '#1565d8'}
                        />
                        <Text className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                          {showArabic
                            ? 'আরবি লুকান'
                            : 'আরবি টেক্সট দেখুন (Arabic Text)'}
                        </Text>
                      </Pressable>

                      {showArabic && (
                        <View className="py-2 px-3 rounded-xl bg-[#f8f9fa] dark:bg-[#18191a]">
                          <Text className="text-right text-2xl text-[#050505] dark:text-[#e4e6eb] leading-10">
                            {post.dua.arabicText}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Reference Badge */}
                  {post.dua.references && post.dua.references.length > 0 && (
                    <View className="pt-0.5">
                      <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                        📖{' '}
                        {post.dua.references
                          .map((r) =>
                            r.source?.name
                              ? `${r.source.name}: ${r.reference}`
                              : r.reference
                          )
                          .join(' • ')}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {post.type === 'BLOOD_REQUEST' && post.bloodRequest && (
            <View className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 p-3 gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="h-9 w-9 rounded-lg bg-rose-600 items-center justify-center">
                    <Text className="text-white font-black text-xs">
                      {BLOOD_LABEL_MAP[post.bloodRequest.bloodGroup] ||
                        post.bloodRequest.bloodGroup}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                      {post.bloodRequest.patientName}
                    </Text>
                    <Text className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                      {post.bloodRequest.urgency} • {post.bloodRequest.units}{' '}
                      Bag(s)
                    </Text>
                  </View>
                </View>
              </View>
              <Text className="text-xs text-[#050505] dark:text-[#e4e6eb]">
                🏥 {post.bloodRequest.hospitalName} ({post.bloodRequest.location})
              </Text>
              <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">
                📞 {post.bloodRequest.contactNumber}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 3. 4-Column Action Bar matching FeedItem.tsx */}
      <View className="flex-row px-2 py-1 border-t border-[#e4e6eb]/70 dark:border-[#393a3b]/70">
        {/* Reaction (Ameen / Like) */}
        <Pressable
          onPress={() => toggleReaction(post.id, hasReacted)}
          className={`flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg ${
            hasReacted ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''
          }`}>
          <AppIcon
            android="favorite"
            ios="heart.fill"
            size={16}
            color={
              hasReacted
                ? '#e11d48'
                : theme === 'dark'
                  ? '#b0b3b8'
                  : '#65676b'
            }
          />
          <Text
            className={`text-xs font-semibold ${
              hasReacted
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-[#65676b] dark:text-[#b0b3b8]'
            }`}>
            {post.type === 'DUA'
              ? locale === 'bn'
                ? 'আমীন'
                : 'Ameen'
              : locale === 'bn'
                ? 'পছন্দ'
                : 'Like'}
          </Text>
          <Text
            className={`text-[11px] font-bold opacity-80 ${
              hasReacted
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-[#65676b] dark:text-[#b0b3b8]'
            }`}>
            ({reactionCount})
          </Text>
        </Pressable>

        {/* Comment */}
        <Pressable
          onPress={handleToggleComments}
          className={`flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg ${
            showComments ? 'bg-primary-50/50 dark:bg-primary-950/20' : ''
          }`}>
          <AppIcon
            android="chat_bubble"
            ios="bubble.left"
            size={16}
            color={
              showComments
                ? '#1877f2'
                : theme === 'dark'
                  ? '#b0b3b8'
                  : '#65676b'
            }
          />
          <Text
            className={`text-xs font-semibold ${
              showComments
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-[#65676b] dark:text-[#b0b3b8]'
            }`}>
            {locale === 'bn' ? 'মন্তব্য' : 'Comment'}
          </Text>
          <Text className="text-[11px] font-bold opacity-80 text-[#65676b] dark:text-[#b0b3b8]">
            ({commentCount})
          </Text>
        </Pressable>

        {/* Save */}
        <Pressable
          onPress={handleToggleSave}
          className={`flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg ${
            hasSaved ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
          }`}>
          <AppIcon
            android="bookmark"
            ios="bookmark.fill"
            size={16}
            color={
              hasSaved
                ? '#d97706'
                : theme === 'dark'
                  ? '#b0b3b8'
                  : '#65676b'
            }
          />
          <Text
            className={`text-xs font-semibold ${
              hasSaved
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-[#65676b] dark:text-[#b0b3b8]'
            }`}>
            {hasSaved
              ? locale === 'bn'
                ? 'সংরক্ষিত'
                : 'Saved'
              : locale === 'bn'
                ? 'সেভ'
                : 'Save'}
          </Text>
          <Text
            className={`text-[11px] font-bold opacity-80 ${
              hasSaved
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-[#65676b] dark:text-[#b0b3b8]'
            }`}>
            ({saveCount})
          </Text>
        </Pressable>

        {/* Share */}
        <Pressable className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg">
          <AppIcon
            android="share"
            ios="square.and.arrow.up"
            size={16}
            color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
          />
          <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn' ? 'শেয়ার' : 'Share'}
          </Text>
          <Text className="text-[11px] font-bold opacity-80 text-[#65676b] dark:text-[#b0b3b8]">
            ({shareCount})
          </Text>
        </Pressable>
      </View>

      <TimeSlotPicker
        isOpen={isTimePickerOpen}
        onClose={() => setIsTimePickerOpen(false)}
        selectedSlot={currentTimeSlot}
        onSelectSlot={(slot) => updatePostTimeSlot(post.id, slot)}
        onRemove={
          hasSaved
            ? () => {
                setIsTimePickerOpen(false);
                setShowUnsaveConfirm(true);
              }
            : undefined
        }
        itemTitle={
          post.dua?.title ||
          post.content?.slice(0, 45) ||
          post.dua?.meaning?.slice(0, 45)
        }
      />

      <ConfirmDialog
        isOpen={showDeletePostConfirm}
        onClose={() => setShowDeletePostConfirm(false)}
        onConfirm={() => deletePost(post.id)}
        title={locale === 'bn' ? 'পোস্টটি মুছবেন?' : 'Delete Post?'}
        subtitle={
          locale === 'bn'
            ? 'এই কাজটি বাতিল করা যাবে না।'
            : 'This action cannot be undone.'
        }
        description={
          locale === 'bn'
            ? 'আপনি কি নিশ্চিত যে এই পোস্টটি স্থায়ীভাবে মুছে ফেলতে চান?'
            : 'Are you sure you want to permanently remove this post?'
        }
        confirmText={locale === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Delete'}
      />

      <ConfirmDialog
        isOpen={showUnsaveConfirm}
        onClose={() => setShowUnsaveConfirm(false)}
        onConfirm={() => toggleSave(post.id, true)}
        title={
          locale === 'bn'
            ? 'সংরক্ষণ তালিকা থেকে মুছবেন?'
            : 'Remove from Saved?'
        }
        subtitle={
          locale === 'bn'
            ? 'এটি আপনার সংরক্ষিত তালিকা থেকে সরানো হবে।'
            : 'This item will be removed from your saved list.'
        }
        description={
          locale === 'bn'
            ? 'আপনি কি নিশ্চিত যে এই পোস্টটি সংরক্ষণ তালিকা থেকে বাদ দিতে চান?'
            : 'Are you sure you want to remove this item from your saved bookmarks?'
        }
        confirmText={locale === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Remove'}
      />

      {/* 4. Expandable Comments Section synced with localhost:5000 */}
      {showComments && (
        <View className="px-3 py-2.5 border-t border-[#e4e6eb]/70 dark:border-[#393a3b]/70 bg-[#f8f9fa] dark:bg-[#18191a]/60 gap-2.5">
          {isLoadingComments ? (
            <View className="py-2 items-center">
              <ActivityIndicator size="small" color="#1877f2" />
            </View>
          ) : comments.length === 0 ? (
            <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center py-1">
              {locale === 'bn'
                ? 'এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্য করুন!'
                : 'No comments yet. Be the first to comment!'}
            </Text>
          ) : (
            <View className="gap-2">
              {comments.map((c) => (
                <View key={c.id} className="flex-row items-start gap-2">
                  <View className="h-7 w-7 rounded-full bg-primary-500 items-center justify-center mt-0.5">
                    <Text className="text-white text-xs font-bold">
                      {c.author?.name
                        ? c.author.name.charAt(0).toUpperCase()
                        : 'U'}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-white dark:bg-[#242526] px-3 py-1.5 border border-[#e4e6eb]/60 dark:border-[#393a3b]/60">
                    <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                      {c.author?.name || 'User'}
                    </Text>
                    <Text className="text-xs text-[#050505] dark:text-[#e4e6eb] mt-0.5">
                      {c.content}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Add Comment Input */}
          <View className="flex-row items-center gap-2 pt-1">
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder={
                locale === 'bn' ? 'মন্তব্য লিখুন...' : 'Write a comment...'
              }
              placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
              className="flex-1 h-9 rounded-full bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] px-3.5 text-xs text-[#050505] dark:text-[#e4e6eb]"
            />
            <Pressable
              disabled={!commentText.trim() || isSubmittingComment}
              onPress={handleAddComment}
              className={`h-9 w-9 rounded-full items-center justify-center ${
                commentText.trim()
                  ? 'bg-primary-500'
                  : 'bg-gray-200 dark:bg-gray-800'
              }`}>
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <AppIcon
                  android="send"
                  ios="paperplane.fill"
                  size={14}
                  color={commentText.trim() ? '#ffffff' : '#9ca3af'}
                />
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const { locale, setComposerModalOpen } = useUi();
  const { user, isAuthenticated } = useAuth();
  const { items, isLoading, isRefreshing, error, refreshFeed } = useFeed();

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      contentContainerClassName="pb-6"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refreshFeed}
          tintColor="#1877f2"
        />
      }>
      <View className="w-full max-w-[720px] mx-auto">
        {/* 1. Post Composer Card matching peacetweet_frontend PostComposer.tsx */}
        <View className="mx-2 mt-2 bg-white dark:bg-[#242526] rounded-2xl border border-[#e4e6eb] dark:border-[#393a3b] pt-2.5 pb-1 px-3">
          {!isAuthenticated ? (
            <View className="flex-row items-center justify-between gap-3 pb-1.5">
              <View className="flex-row items-center gap-2.5 flex-1">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-500">
                  <Text className="text-white font-black text-base">P</Text>
                </View>
                <Text className="flex-1 text-xs text-[#65676b] dark:text-[#b0b3b8]">
                  Sign in to share reflections, Duas, or blood donation requests.
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/login')}
                className="rounded-lg bg-primary-500 px-3.5 py-2">
                <Text className="text-white text-xs font-semibold">Log In</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View className="flex-row items-center gap-2.5">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-500">
                  <Text className="text-white font-bold text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : '🕊️'}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setComposerModalOpen(true)}
                  className="h-9 flex-1 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] px-3.5 justify-center">
                  <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                    {user?.name
                      ? `${user.name.split(' ')[0]}, what's on your mind?`
                      : "What's on your mind?"}
                  </Text>
                </Pressable>
              </View>

              {/* Compact 3-Column Bottom Action Buttons */}
              <View className="flex-row gap-1 pt-1 mt-2 border-t border-[#e4e6eb] dark:border-[#393a3b]">
                <Pressable
                  onPress={() => setComposerModalOpen(true)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                  <AppIcon
                    android="image"
                    ios="photo"
                    size={18}
                    color="#10b981"
                  />
                  <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn' ? 'ছবি / মিডিয়া' : 'Photo/video'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setComposerModalOpen(true)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                  <AppIcon
                    android="menu_book"
                    ios="book"
                    size={18}
                    color="#6366f1"
                  />
                  <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn' ? 'দোয়া' : 'Dua'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setComposerModalOpen(true)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                  <AppIcon
                    android="sentiment_satisfied"
                    ios="face.smiling"
                    size={18}
                    color="#f59e0b"
                  />
                  <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn' ? 'অনুভূতি' : 'Feeling'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        {/* 2. Feed List Card synced with http://localhost:5000/api/v1/feed */}
        {isLoading && items.length === 0 ? (
          <View className="py-12 items-center justify-center gap-2">
            <ActivityIndicator size="large" color="#1877f2" />
            <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
              {locale === 'bn'
                ? 'ফিড লোড হচ্ছে...'
                : 'Loading feed from server...'}
            </Text>
          </View>
        ) : error && items.length === 0 ? (
          <View className="mx-2 mt-3 rounded-2xl bg-white dark:bg-[#242526] p-6 items-center gap-3 border border-[#e4e6eb] dark:border-[#393a3b]">
            <Text className="text-xs text-rose-600 dark:text-rose-400 text-center">
              {error}
            </Text>
            <Pressable
              onPress={refreshFeed}
              className="rounded-lg bg-primary-500 px-4 py-2">
              <Text className="text-xs font-bold text-white">
                {locale === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="w-full mt-2.5 bg-white dark:bg-[#242526] border-y border-[#e4e6eb] dark:border-[#393a3b] overflow-hidden">
            {items.map((post, index) => (
              <React.Fragment key={post.id}>
                {index > 0 && (
                  <View className="h-2 w-full bg-[#f0f2f5] dark:bg-[#18191a] border-y border-[#e4e6eb] dark:border-[#393a3b]" />
                )}
                <FeedPostCard post={post} />
              </React.Fragment>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
