import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  LayoutChangeEvent,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useFeed } from '@/providers/FeedProvider';
import { feedApi } from '@/features/feed/api/feed.api';
import { FeedItem, PostComment } from '@/features/feed/types/feed.types';
import { TimeSlotPicker } from '@/features/bookmark/components/TimeSlotPicker';
import { AppIcon } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
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

export function formatRelativeDate(
  dateStr: string,
  locale: 'bn' | 'en'
): string {
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

/* -------------------------------------------------------------------------- */
/* Media gallery (COLLAGE / SWIPE) – shows every photo attached to the post    */
/* -------------------------------------------------------------------------- */
function PostMedia({
  urls,
  layout,
}: {
  urls?: string[];
  layout?: 'COLLAGE' | 'SWIPE';
}) {
  const [width, setWidth] = useState(0);
  const list = (urls || []).filter(
    (u) => typeof u === 'string' && u.trim().length > 0
  );
  if (list.length === 0) return null;

  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(Math.round(e.nativeEvent.layout.width));

  if (layout === 'SWIPE' && list.length > 1) {
    return (
      <View onLayout={onLayout} className="w-full rounded-xl overflow-hidden">
        {width > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}>
            {list.map((uri, i) => (
              <Image
                key={`${uri}-${i}`}
                source={{ uri }}
                resizeMode="cover"
                style={{ width, aspectRatio: 4 / 3 }}
                className="bg-[#e4e6eb] dark:bg-[#3a3b3c]"
              />
            ))}
          </ScrollView>
        ) : null}
        <View className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5">
          <Text className="text-[10px] font-bold text-white">
            1 / {list.length}
          </Text>
        </View>
      </View>
    );
  }

  if (list.length === 1) {
    return (
      <View className="w-full rounded-xl overflow-hidden">
        <Image
          source={{ uri: list[0] }}
          resizeMode="cover"
          style={{ width: '100%', aspectRatio: 4 / 3 }}
          className="bg-[#e4e6eb] dark:bg-[#3a3b3c]"
        />
      </View>
    );
  }

  if (list.length === 2) {
    return (
      <View className="w-full flex-row gap-0.5 rounded-xl overflow-hidden">
        {list.map((uri, i) => (
          <Image
            key={`${uri}-${i}`}
            source={{ uri }}
            resizeMode="cover"
            style={{ flex: 1, aspectRatio: 1 }}
            className="bg-[#e4e6eb] dark:bg-[#3a3b3c]"
          />
        ))}
      </View>
    );
  }

  const rest = list.slice(1, 4);
  const extra = list.length - 4;
  return (
    <View className="w-full gap-0.5 rounded-xl overflow-hidden">
      <Image
        source={{ uri: list[0] }}
        resizeMode="cover"
        style={{ width: '100%', aspectRatio: 16 / 9 }}
        className="bg-[#e4e6eb] dark:bg-[#3a3b3c]"
      />
      <View className="flex-row gap-0.5">
        {rest.map((uri, i) => (
          <View key={`${uri}-${i}`} style={{ flex: 1 }} className="relative">
            <Image
              source={{ uri }}
              resizeMode="cover"
              style={{ width: '100%', aspectRatio: 1 }}
              className="bg-[#e4e6eb] dark:bg-[#3a3b3c]"
            />
            {i === rest.length - 1 && extra > 0 ? (
              <View className="absolute inset-0 items-center justify-center bg-black/50">
                <Text className="text-xl font-black text-white">+{extra}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Full post body – text, Dua (every field), blood request, media             */
/* -------------------------------------------------------------------------- */
export function PostBody({
  post,
  defaultShowArabic = false,
}: {
  post: FeedItem;
  defaultShowArabic?: boolean;
}) {
  const { locale, theme } = useUi();
  const [showArabic, setShowArabic] = useState(defaultShowArabic);
  const blood = post.bloodRequest;
  const dua = post.dua;

  const neededDate = blood?.neededDate
    ? new Date(blood.neededDate).toLocaleDateString(
        locale === 'bn' ? 'bn-BD' : 'en-US',
        { year: 'numeric', month: 'short', day: 'numeric' }
      )
    : null;

  return (
    <View className="gap-3">
      {/* Caption / editorial note */}
      {post.content ? (
        <Text className="text-[15px] text-[#050505] dark:text-[#e4e6eb] leading-6">
          {post.content}
        </Text>
      ) : null}

      {/* Dua details */}
      {post.type === 'DUA' && dua && !(dua as any).isUnavailable ? (
        <View className="gap-3">
          {dua.title && (!post.content || post.content !== dua.title) ? (
            <Text className="text-[16px] font-bold text-[#050505] dark:text-[#e4e6eb]">
              🌙 {dua.title}
            </Text>
          ) : null}
          {dua.fadilah ? (
            <View className="gap-1">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                {locale === 'bn' ? 'ফযীলত:' : 'Virtue:'}
              </Text>
              <Text className="text-[14.5px] text-[#050505] dark:text-[#e4e6eb] leading-6">
                {dua.fadilah}
              </Text>
            </View>
          ) : null}

          {dua.arabicText ? (
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

              {showArabic ? (
                <View className="py-2 px-3 rounded-xl bg-[#f8f9fa] dark:bg-[#18191a]">
                  <Text className="text-right text-2xl text-[#050505] dark:text-[#e4e6eb] leading-10">
                    {dua.arabicText}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {dua.transliteration ? (
            <View className="gap-1">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                {locale === 'bn' ? 'উচ্চারণ:' : 'Pronunciation:'}
              </Text>
              <Text className="text-[14.5px] text-[#050505] dark:text-[#e4e6eb] leading-6">
                {dua.transliteration}
              </Text>
            </View>
          ) : null}

          {dua.meaning || dua.meaningBangla ? (
            <View className="gap-1">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                {locale === 'bn' ? 'অর্থ:' : 'Meaning:'}
              </Text>
              <Text className="text-[14.5px] text-[#050505] dark:text-[#e4e6eb] leading-6">
                {dua.meaning || dua.meaningBangla}
              </Text>
            </View>
          ) : null}

          {dua.references && dua.references.length > 0 ? (
            <View className="pt-0.5">
              <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                📖{' '}
                {dua.references
                  .map((r) =>
                    r.source?.name
                      ? `${r.source.name}: ${r.reference}`
                      : r.reference
                  )
                  .join(' • ')}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Blood request details */}
      {post.type === 'BLOOD_REQUEST' && blood && !(blood as any).isUnavailable ? (
        <View className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 p-3 gap-2">
          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 rounded-lg bg-rose-600 items-center justify-center">
              <Text className="text-white font-black text-xs">
                {BLOOD_LABEL_MAP[blood.bloodGroup] || blood.bloodGroup}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                {blood.patientName}
                {blood.patientAge ? ` (${blood.patientAge})` : ''}
              </Text>
              <Text className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                {blood.urgency} • {blood.units}{' '}
                {locale === 'bn' ? 'ব্যাগ' : 'Bag(s)'}
                {typeof blood.unitsFulfilled === 'number'
                  ? ` • ${blood.unitsFulfilled}/${blood.units}`
                  : ''}
              </Text>
            </View>
          </View>

          {blood.problem ? (
            <Text className="text-xs text-[#050505] dark:text-[#e4e6eb]">
              🩺 {blood.problem}
            </Text>
          ) : null}
          <Text className="text-xs text-[#050505] dark:text-[#e4e6eb]">
            🏥 {blood.hospitalName}
            {blood.hospitalAddress ? `, ${blood.hospitalAddress}` : ''} (
            {blood.location})
          </Text>
          {neededDate ? (
            <Text className="text-xs text-[#050505] dark:text-[#e4e6eb]">
              📅 {neededDate}
            </Text>
          ) : null}
          <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">
            📞 {blood.contactNumber}
            {blood.alternateContact ? ` / ${blood.alternateContact}` : ''}
          </Text>
          {blood.note ? (
            <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
              📝 {blood.note}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Photos */}
      <PostMedia urls={post.mediaUrls} layout={post.mediaLayout} />
    </View>
  );
}

export interface FeedPostCardProps {
  post: FeedItem;
  /** Expand the Arabic text by default (used by search so every part is visible) */
  defaultShowArabic?: boolean;
}

export function FeedPostCard({
  post,
  defaultShowArabic = false,
}: FeedPostCardProps) {
  const { locale, theme } = useUi();
  const { user, isAuthenticated } = useAuth();
  const {
    toggleReaction,
    toggleSave,
    updatePostTimeSlot,
    deletePost,
    updateCommentCount,
  } = useFeed();

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

  const original = post.originalPost;

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
            <UserAvatar
              avatarUrl={
                post.author?.avatar || (post.author as any)?.avatarUrl
              }
              name={authorName}
              size="md"
            />

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

        {/* 2. Main Post Content Body – every part of the post */}
        <View className="mt-3 gap-3">
          <PostBody post={post} defaultShowArabic={defaultShowArabic} />

          {/* Shared / reposted original post */}
          {post.originalPostId ? (
            <View className="rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] p-3 gap-2">
              {original && !original.isUnavailable ? (
                <>
                  <View className="flex-row items-center gap-2">
                    <UserAvatar
                      avatarUrl={original.author?.avatar}
                      name={original.author?.name || 'User'}
                      size="sm"
                    />
                    <View className="flex-1">
                      <Text className="text-[13px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                        {original.author?.name}
                      </Text>
                      <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                        @{original.author?.username} •{' '}
                        {formatRelativeDate(original.createdAt, locale)}
                      </Text>
                    </View>
                  </View>
                  <PostBody
                    post={original}
                    defaultShowArabic={defaultShowArabic}
                  />
                </>
              ) : (
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center py-2">
                  {locale === 'bn'
                    ? 'এই পোস্টটি আর উপলব্ধ নেই'
                    : 'This post is no longer available'}
                </Text>
              )}
            </View>
          ) : null}
        </View>
      </View>

      {/* 3. 4-Column Action Bar matching FeedItem.tsx */}
      <View className="flex-row px-2 py-1 mt-2 border-t border-[#e4e6eb]/70 dark:border-[#393a3b]/70">
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
            ? 'আপনি কি নিশ্চিত যে এই পোস্টটি স্থায়ীভাবে মুছে ফেলতে চান?'
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
