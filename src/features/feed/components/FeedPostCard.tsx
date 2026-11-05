import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  LayoutChangeEvent,
  Modal,
  Share,
  Platform,
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
import { Skeleton } from '@/components/ui/Skeleton';
import {
  CommentsBottomSheetModal,
  insertOptimisticComment,
  resolveOptimisticComment,
  removeOptimisticComment,
} from './CommentsBottomSheetModal';
import { PostActionMenuModal } from './PostActionMenuModal';
import { PostShareModal } from './PostShareModal';
import { EditPostModal } from './EditPostModal';
import { ReportPostModal } from './ReportPostModal';
import { normalizeMediaUrl } from '@/features/uploads/api/uploads.api';
import { queryCache } from '@/lib/cache/queryCache';
import {
  imageRatioCache,
  resolveImageAspectRatio,
} from '@/lib/cache/imageRatioCache';

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
/* Single Post Image – adapts dynamically to natural aspect ratio (auto height */
/* with max-height cap), avoiding horizontal or vertical photo crops in feed. */
/* -------------------------------------------------------------------------- */
function SingleFeedImage({
  uri,
  onPress,
}: {
  uri: string;
  onPress: () => void;
}) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(
    () => imageRatioCache.get(uri) || null
  );

  useEffect(() => {
    if (!uri) return;
    resolveImageAspectRatio(uri, (r) => {
      setAspectRatio(r);
    });
  }, [uri]);

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: '100%',
        maxHeight: 560,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="w-full overflow-hidden active:opacity-95 bg-[#e4e6eb] dark:bg-[#3a3b3c]">
      <Image
        source={{ uri }}
        resizeMode="cover"
        onLoad={(e: any) => {
          const src = e?.nativeEvent?.source || e?.target;
          const nw = src?.width || src?.naturalWidth;
          const nh = src?.height || src?.naturalHeight;
          if (nw > 0 && nh > 0) {
            const r = nw / nh;
            imageRatioCache.set(uri, r);
            setAspectRatio(r);
          }
        }}
        style={
          {
            width: '100%',
            aspectRatio: aspectRatio || undefined,
            maxHeight: 560,
            ...(Platform.OS === 'web' && !aspectRatio
              ? { height: 'auto', display: 'block' }
              : {}),
          } as any
        }
        className="bg-[#e4e6eb] dark:bg-[#3a3b3c]"
      />
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Media gallery (COLLAGE / SWIPE) – shows every photo attached to the post    */
/* -------------------------------------------------------------------------- */
function PostMedia({
  post,
  urls,
  layout,
  onOpenPhoto,
}: {
  post?: FeedItem;
  urls?: string[];
  layout?: 'COLLAGE' | 'SWIPE';
  onOpenPhoto?: (url: string) => void;
}) {
  const [width, setWidth] = useState(0);
  const list = (urls || [])
    .filter((u) => typeof u === 'string' && u.trim().length > 0)
    .map((u) => normalizeMediaUrl(u));
  if (list.length === 0) return null;

  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(Math.round(e.nativeEvent.layout.width));

  const handlePressPhoto = (uri: string) => {
    if (onOpenPhoto) {
      onOpenPhoto(uri);
    } else if (post?.id) {
      queryCache.set(`post:detail:${post.id}`, post);
      router.push(`/post/${post.id}` as any);
    }
  };

  const renderMedia = () => {
    if (layout === 'SWIPE' && list.length > 1) {
      return (
        <View onLayout={onLayout} className="w-full overflow-hidden">
          {width > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}>
              {list.map((uri, i) => (
                <Pressable key={`${uri}-${i}`} onPress={() => handlePressPhoto(uri)}>
                  <Image
                    source={{ uri }}
                    resizeMode="cover"
                    style={{ width, aspectRatio: 4 / 3 }}
                    className="bg-[#e4e6eb] dark:bg-[#3a3b3c]"
                  />
                </Pressable>
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
        <SingleFeedImage
          uri={list[0]}
          onPress={() => handlePressPhoto(list[0])}
        />
      );
    }

    if (list.length === 2) {
      return (
        <View
          style={{ width: '100%' }}
          className="w-full flex-row gap-0.5 overflow-hidden">
          {list.map((uri, i) => (
            <Pressable
              key={`${uri}-${i}`}
              onPress={() => handlePressPhoto(uri)}
              style={{ flex: 1 }}
              className="active:opacity-95">
              <Image
                source={{ uri }}
                resizeMode="cover"
                style={{ width: '100%', aspectRatio: 1 }}
                className="bg-[#e4e6eb] dark:bg-[#3a3b3c]"
              />
            </Pressable>
          ))}
        </View>
      );
    }

    const rest = list.slice(1, 4);
    const extra = list.length - 4;
    return (
      <View
        style={{ width: '100%' }}
        className="w-full gap-0.5 overflow-hidden">
        <Pressable
          onPress={() => handlePressPhoto(list[0])}
          className="active:opacity-95">
          <Image
            source={{ uri: list[0] }}
            resizeMode="cover"
            style={{ width: '100%', aspectRatio: 16 / 9 }}
            className="bg-[#e4e6eb] dark:bg-[#3a3b3c]"
          />
        </Pressable>
        <View className="flex-row gap-0.5">
          {rest.map((uri, i) => (
            <Pressable
              key={`${uri}-${i}`}
              onPress={() => handlePressPhoto(uri)}
              style={{ flex: 1 }}
              className="relative active:opacity-95">
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
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  return renderMedia();
}

/* -------------------------------------------------------------------------- */
/* Full post body – text, Dua (every field), blood request, media             */
/* -------------------------------------------------------------------------- */
export function PostBody({
  post,
  defaultShowArabic = false,
  onOpenPhoto,
}: {
  post: FeedItem;
  defaultShowArabic?: boolean;
  onOpenPhoto?: (url: string) => void;
}) {
  const { locale, theme } = useUi();
  const [showArabic, setShowArabic] = useState(defaultShowArabic);
  const blood = post.bloodRequest;
  const dua = post.dua;

  const neededDate = blood?.neededDate
    ? new Date(blood.neededDate).toLocaleString(
        locale === 'bn' ? 'bn-BD' : 'en-US',
        {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }
      )
    : null;

  return (
    <View style={{ width: '100%' }} className="w-full gap-3">
      {/* Caption / editorial note */}
      {post.content ? (
        <Text
          selectable={true}
          className="px-3 text-[15px] text-[#050505] dark:text-[#e4e6eb] leading-6 select-text">
          {post.content}
        </Text>
      ) : null}

      {/* Dua details */}
      {post.type === 'DUA' && dua && !(dua as any).isUnavailable ? (
        <View className="px-3 gap-3">
          {dua.title && (!post.content || post.content !== dua.title) ? (
            <Text
              selectable={true}
              className="text-[16px] font-bold text-[#050505] dark:text-[#e4e6eb] select-text">
              🌙 {dua.title}
            </Text>
          ) : null}
          {dua.fadilah ? (
            <View className="gap-1">
              <Text
                selectable={false}
                className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 select-none">
                {locale === 'bn' ? 'ফযীলত:' : 'Virtue:'}
              </Text>
              <Text
                selectable={true}
                className="text-[14.5px] text-[#050505] dark:text-[#e4e6eb] leading-6 select-text">
                {dua.fadilah}
              </Text>
            </View>
          ) : null}

          {dua.arabicText ? (
            <View className="gap-2">
              <Pressable
                onPress={() => setShowArabic(!showArabic)}
                className="flex-row items-center gap-1.5 py-1 self-start select-none">
                <AppIcon
                  android="translate"
                  size={14}
                  color={theme === 'dark' ? '#4a80f5' : '#1565d8'}
                />
                <Text
                  selectable={false}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 select-none">
                  {showArabic
                    ? 'আরবি লুকান'
                    : 'আরবি টেক্সট দেখুন (Arabic Text)'}
                </Text>
              </Pressable>

              {showArabic ? (
                <View className="py-2 px-3 rounded-xl bg-[#f8f9fa] dark:bg-[#18191a]">
                  <Text
                    selectable={true}
                    className="text-right text-2xl text-[#050505] dark:text-[#e4e6eb] leading-10 select-text">
                    {dua.arabicText}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {dua.transliteration ? (
            <View className="gap-1">
              <Text
                selectable={false}
                className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 select-none">
                {locale === 'bn' ? 'উচ্চারণ:' : 'Pronunciation:'}
              </Text>
              <Text
                selectable={true}
                className="text-[14.5px] text-[#050505] dark:text-[#e4e6eb] leading-6 select-text">
                {dua.transliteration}
              </Text>
            </View>
          ) : null}

          {dua.meaning || dua.meaningBangla ? (
            <View className="gap-1">
              <Text
                selectable={false}
                className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 select-none">
                {locale === 'bn' ? 'অর্থ:' : 'Meaning:'}
              </Text>
              <Text
                selectable={true}
                className="text-[14.5px] text-[#050505] dark:text-[#e4e6eb] leading-6 select-text">
                {dua.meaning || dua.meaningBangla}
              </Text>
            </View>
          ) : null}

          {dua.references && dua.references.length > 0 ? (
            <View className="pt-0.5">
              <Text
                selectable={true}
                className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8] select-text">
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
        <View className="mx-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 p-3 gap-2">
          <View className="flex-row items-center gap-2 select-none">
            <View className="h-9 w-9 rounded-lg bg-rose-600 items-center justify-center select-none">
              <Text
                selectable={false}
                className="text-white font-black text-xs select-none">
                {BLOOD_LABEL_MAP[blood.bloodGroup] || blood.bloodGroup}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                selectable={true}
                className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] select-text">
                {blood.patientName}
                {blood.patientAge ? ` (${blood.patientAge})` : ''}
              </Text>
              <Text
                selectable={false}
                className="text-xs text-rose-600 dark:text-rose-400 font-semibold select-none">
                {blood.units}{' '}
                {locale === 'bn' ? 'ব্যাগ' : 'Bag(s)'}
                {typeof blood.unitsFulfilled === 'number'
                  ? ` • ${blood.unitsFulfilled}/${blood.units}`
                  : ''}
              </Text>
            </View>
          </View>

          {blood.problem ? (
            <Text
              selectable={true}
              className="text-xs text-[#050505] dark:text-[#e4e6eb] select-text">
              🩺 {blood.problem}
            </Text>
          ) : null}
          <Text
            selectable={true}
            className="text-xs text-[#050505] dark:text-[#e4e6eb] select-text">
            🏥 {blood.hospitalName} ({blood.location})
          </Text>
          {neededDate ? (
            <Text
              selectable={false}
              className="text-xs text-[#050505] dark:text-[#e4e6eb] select-none">
              📅 {neededDate}
            </Text>
          ) : null}
          <Text
            selectable={true}
            className="text-xs font-bold text-primary-600 dark:text-primary-400 select-text">
            📞 {blood.contactNumber}
            {blood.alternateContact ? ` / ${blood.alternateContact}` : ''}
          </Text>
        </View>
      ) : null}

      {/* Photos (px-0 edge-to-edge inside card) */}
      <PostMedia
        post={post}
        urls={post.mediaUrls}
        layout={post.mediaLayout}
        onOpenPhoto={onOpenPhoto}
      />
    </View>
  );
}

export interface FeedPostCardProps {
  post: FeedItem;
  /** Expand the Arabic text by default (used by search so every part is visible) */
  defaultShowArabic?: boolean;
  /** Expand the comments section by default (used when viewing a photo post in a modal) */
  defaultShowComments?: boolean;
}

export function FeedPostCard({
  post,
  defaultShowArabic = false,
  defaultShowComments = false,
}: FeedPostCardProps) {
  const { locale, theme, openPhotoViewer } = useUi();
  const { user, isAuthenticated } = useAuth();
  const {
    toggleReaction,
    toggleSave,
    updatePostTimeSlot,
    deletePost,
    updateCommentCount,
  } = useFeed();

  const [currentPost, setCurrentPost] = useState<FeedItem>(post);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleOpenPhoto = (url: string) => {
    openPhotoViewer(currentPost, url);
  };

  const [showComments, setShowComments] = useState(defaultShowComments);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false);
  const [showUnsaveConfirm, setShowUnsaveConfirm] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    setCurrentPost(post);
  }, [post]);

  const handleCopyLink = async () => {
    const shareUrl =
      typeof window !== 'undefined' && window.location?.origin
        ? `${window.location.origin}/post/${post.id}`
        : `https://peacetweet.app/post/${post.id}`;
    try {
      if (
        typeof navigator !== 'undefined' &&
        (navigator as any).clipboard?.writeText
      ) {
        await (navigator as any).clipboard.writeText(shareUrl);
      } else {
        await Share.share({ message: shareUrl, url: shareUrl });
      }
    } catch {}
  };

  const [hasReacted, setHasReacted] = useState(
    Boolean(post.viewer?.hasReacted)
  );
  const [hasSaved, setHasSaved] = useState(Boolean(post.viewer?.hasSaved));
  const currentTimeSlot = post.viewer?.timeSlot || null;
  const [reactionCount, setReactionCount] = useState(
    post.stats?.reactionCount || 0
  );
  const [commentCount, setCommentCount] = useState(
    post.stats?.commentCount || 0
  );
  const [saveCount, setSaveCount] = useState(post.stats?.saveCount || 0);
  const shareCount = post.stats?.shareCount || 0;

  useEffect(() => {
    setHasReacted(Boolean(post.viewer?.hasReacted));
    setHasSaved(Boolean(post.viewer?.hasSaved));
    setReactionCount(post.stats?.reactionCount || 0);
    setCommentCount(post.stats?.commentCount || 0);
    setSaveCount(post.stats?.saveCount || 0);
  }, [
    post.id,
    post.viewer?.hasReacted,
    post.viewer?.hasSaved,
    post.stats?.reactionCount,
    post.stats?.commentCount,
    post.stats?.saveCount,
  ]);

  useEffect(() => {
    if (defaultShowComments && post.id && !post.id.startsWith('temp-')) {
      setShowComments(true);
      setIsLoadingComments(true);
      feedApi
        .getComments(post.id, 30)
        .then((res) => {
          const list = ((res as any)?.data ?? res) as PostComment[];
          if (Array.isArray(list)) {
            setComments(list);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingComments(false));
    }
  }, [defaultShowComments, post.id]);

  const handleToggleReaction = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const nextReacted = !hasReacted;
    setHasReacted(nextReacted);
    setReactionCount((prev) =>
      nextReacted ? prev + 1 : Math.max(0, prev - 1)
    );
    if (!post.id.startsWith('temp-')) {
      toggleReaction(post.id, hasReacted);
    }
  };

  const handleToggleSave = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (hasSaved) {
      setShowUnsaveConfirm(true);
      return;
    }
    setHasSaved(true);
    setSaveCount((prev) => prev + 1);
    if (!post.id.startsWith('temp-')) {
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
    if (next) {
      if (comments.length === 0) {
        setIsLoadingComments(true);
      }
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

  const handleAddComment = async (parentId?: string | null) => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const tempId = `temp-comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimisticComment: PostComment = {
      id: tempId,
      postId: post.id,
      parentId: parentId || null,
      content: trimmed,
      createdAt: new Date().toISOString(),
      isPosting: true,
      replies: [],
      replyCount: 0,
      author: {
        id: user?.id || 'me',
        name: user?.name || 'User',
        username: user?.username || 'user',
        avatar: user?.avatarUrl || (user as any)?.avatar || null,
      },
    };

    // Instant optimistic update: clear input & append comment/reply with 'Posting...' badge
    setCommentText('');
    setComments((prev) => insertOptimisticComment(prev, optimisticComment));
    const optimisticCount = commentCount + 1;
    setCommentCount(optimisticCount);
    updateCommentCount(post.id, optimisticCount);

    try {
      const res = await feedApi.createComment(post.id, trimmed, parentId);
      const payload = (res as any)?.data ?? res;
      setComments((prev) =>
        resolveOptimisticComment(prev, tempId, payload?.comment)
      );
      if (typeof payload?.commentCount === 'number') {
        setCommentCount(payload.commentCount);
        updateCommentCount(post.id, payload.commentCount);
      }
    } catch {
      setComments((prev) => removeOptimisticComment(prev, tempId));
      setCommentCount((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <View className="w-full bg-white dark:bg-[#242526]">
      {/* 1. Author & Post Meta Header matching FeedItem.tsx */}
      <View className="px-3 pt-2.5 pb-1.5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-row items-center gap-2.5 flex-1">
            <Pressable
              onPress={() => {
                if (authorUsername) {
                  router.push(`/${authorUsername}` as any);
                }
              }}
              className="active:opacity-80">
              <UserAvatar
                avatarUrl={
                  post.author?.avatar || (post.author as any)?.avatarUrl
                }
                name={authorName}
                size="md"
              />
            </Pressable>

            <View className="flex-1 select-none">
              <View className="flex-row items-center gap-1.5 flex-wrap select-none">
                <Pressable
                  onPress={() => {
                    if (authorUsername) {
                      router.push(`/${authorUsername}` as any);
                    }
                  }}
                  className="active:opacity-80">
                  <Text
                    selectable={false}
                    className="font-bold text-[15px] text-[#050505] dark:text-[#e4e6eb] select-none">
                    {authorName}
                  </Text>
                </Pressable>
                <AppIcon
                  android="verified"
                  ios="checkmark.seal.fill"
                  size={14}
                  color="#1877f2"
                />
                {feelingItem && (
                  <Text
                    selectable={false}
                    className="text-xs text-[#65676b] dark:text-[#b0b3b8] select-none">
                    is feeling{' '}
                    <Text
                      selectable={false}
                      className="font-semibold text-[#050505] dark:text-[#e4e6eb] select-none">
                      {feelingItem.label}
                    </Text>{' '}
                    {feelingItem.emoji}
                  </Text>
                )}
              </View>

              <View className="flex-row items-center gap-1.5 mt-0.5 select-none">
                <Text
                  selectable={false}
                  className="text-xs text-[#65676b] dark:text-[#b0b3b8] select-none">
                  @{authorUsername}
                </Text>
                <Text
                  selectable={false}
                  className="text-xs text-[#65676b] dark:text-[#b0b3b8] select-none">
                  •
                </Text>
                <Text
                  selectable={false}
                  className="text-xs text-[#65676b] dark:text-[#b0b3b8] select-none">
                  {formatRelativeDate(post.createdAt, locale)}
                </Text>
                <Text
                  selectable={false}
                  className="text-xs text-[#65676b] dark:text-[#b0b3b8] select-none">
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

          {/* 3-Dot Kebab Menu Button for all posts */}
          <Pressable
            onPress={() => setShowActionMenu(true)}
            className="p-1.5 -mr-1 rounded-full active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
            <AppIcon
              android="more_vert"
              ios="ellipsis"
              size={20}
              color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
            />
          </Pressable>
        </View>
      </View>

      {/* 2. Main Post Content Body – px-0 on outer wrapper so photos go edge-to-edge */}
      <View style={{ width: '100%' }} className="w-full mt-1.5 pb-1.5 gap-3">
        <PostBody
          post={currentPost}
          defaultShowArabic={defaultShowArabic}
          onOpenPhoto={handleOpenPhoto}
        />

        {/* Shared / reposted original post */}
        {post.originalPostId ? (
          <View className="mx-3 rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] overflow-hidden pt-3 pb-2 gap-2">
            {original && !original.isUnavailable ? (
              <>
                <View className="flex-row items-center gap-2 px-3">
                  <UserAvatar
                    avatarUrl={
                      original.author?.avatar ||
                      (original.author as any)?.avatarUrl
                    }
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
              <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center py-2 px-3">
                {locale === 'bn'
                  ? 'এই পোস্টটি আর উপলব্ধ নেই'
                  : 'This post is no longer available'}
              </Text>
            )}
          </View>
        ) : null}
      </View>

      {/* 3. 4-Column Action Bar matching FeedItem.tsx */}
      <View className="flex-row px-2 py-1 mt-2 border-t border-[#e4e6eb]/70 dark:border-[#393a3b]/70 select-none">
        {/* Reaction (Ameen / Like) */}
        <Pressable
          onPress={handleToggleReaction}
          className={`flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg select-none ${
            hasReacted ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''
          }`}>
          <AppIcon
            android="favorite"
            ios={hasReacted ? 'heart.fill' : 'heart'}
            size={16}
            color={
              hasReacted
                ? '#e11d48'
                : theme === 'dark'
                  ? '#b0b3b8'
                  : '#65676b'
            }
            fill={hasReacted ? '#e11d48' : 'none'}
            filled={hasReacted}
          />
          <Text
            selectable={false}
            className={`text-xs font-semibold select-none ${
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
            selectable={false}
            className={`text-[11px] font-bold opacity-80 select-none ${
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
          className={`flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg select-none ${
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
            selectable={false}
            className={`text-xs font-semibold select-none ${
              showComments
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-[#65676b] dark:text-[#b0b3b8]'
            }`}>
            {locale === 'bn' ? 'মন্তব্য' : 'Comment'}
          </Text>
          <Text
            selectable={false}
            className="text-[11px] font-bold opacity-80 text-[#65676b] dark:text-[#b0b3b8] select-none">
            ({commentCount})
          </Text>
        </Pressable>

        {/* Save */}
        <Pressable
          onPress={handleToggleSave}
          className={`flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg select-none ${
            hasSaved ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
          }`}>
          <AppIcon
            android="bookmark"
            ios={hasSaved ? 'bookmark.fill' : 'bookmark'}
            size={16}
            color={
              hasSaved
                ? '#d97706'
                : theme === 'dark'
                  ? '#b0b3b8'
                  : '#65676b'
            }
            fill={hasSaved ? '#d97706' : 'none'}
            filled={hasSaved}
          />
          <Text
            selectable={false}
            className={`text-xs font-semibold select-none ${
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
            selectable={false}
            className={`text-[11px] font-bold opacity-80 select-none ${
              hasSaved
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-[#65676b] dark:text-[#b0b3b8]'
            }`}>
            ({saveCount})
          </Text>
        </Pressable>

        {/* Share */}
        <Pressable
          onPress={() => setShowShareModal(true)}
          className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg select-none active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
          <AppIcon
            android="share"
            ios="square.and.arrow.up"
            size={16}
            color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
          />
          <Text
            selectable={false}
            className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8] select-none">
            {locale === 'bn' ? 'শেয়ার' : 'Share'}
          </Text>
          <Text
            selectable={false}
            className="text-[11px] font-bold opacity-80 text-[#65676b] dark:text-[#b0b3b8] select-none">
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
        onConfirm={() => {
          setShowUnsaveConfirm(false);
          setHasSaved(false);
          setSaveCount((prev) => Math.max(0, prev - 1));
          if (!post.id.startsWith('temp-')) {
            toggleSave(post.id, true);
          }
        }}
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

      {/* 4. Comments Bottom Sheet Modal (with center drag bar + swipe-down to close) */}
      <CommentsBottomSheetModal
        visible={showComments}
        onClose={() => setShowComments(false)}
        commentCount={commentCount}
        comments={comments}
        isLoadingComments={isLoadingComments}
        commentText={commentText}
        onChangeCommentText={setCommentText}
        onSubmitComment={handleAddComment}
      />

      {/* 5. Reusable Post 3-Dot Action Menu Modal */}
      <PostActionMenuModal
        visible={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        post={currentPost}
        isAuthor={isAuthor}
        hasSaved={hasSaved}
        onEdit={() => setShowEditModal(true)}
        onDelete={() => setShowDeletePostConfirm(true)}
        onToggleSave={handleToggleSave}
        onCopyLink={handleCopyLink}
        onOpenShare={() => setShowShareModal(true)}
        onReport={() => setShowReportModal(true)}
      />

      {/* 6. Reusable Social Media Share Modal */}
      <PostShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={currentPost}
      />

      {/* 7. Reusable Edit Post Modal */}
      <EditPostModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={currentPost}
        onSuccess={(updated) => setCurrentPost(updated)}
      />

      {/* 8. Reusable Report Post Modal */}
      <ReportPostModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        post={currentPost}
      />
    </View>
  );
}
