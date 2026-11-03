import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Share,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuth } from '@/providers/AuthProvider';
import { useFeed } from '@/providers/FeedProvider';
import { useUi } from '@/providers/UiProvider';
import { feedApi } from '@/features/feed/api/feed.api';
import { FeedItem, PostComment } from '@/features/feed/types/feed.types';
import { normalizeMediaUrl } from '@/features/uploads/api/uploads.api';
import { queryCache } from '@/lib/cache/queryCache';
import { AppIcon } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Skeleton } from '@/components/ui/Skeleton';

function formatFacebookPhotoDate(dateStr?: string | null): string {
  if (!dateStr) return 'JUST NOW';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.toUpperCase();
    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    const month = months[d.getMonth()];
    const day = d.getDate();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${month} ${day} AT ${hours}:${minutes} ${ampm}`;
  } catch {
    return 'TODAY';
  }
}

/* Top-bar Tag Icon (matching Facebook photo viewer screenshot) */
function TagOutlineIcon({ size = 22, color = '#ffffff' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <Circle cx="7.5" cy="7.5" r="1.5" fill={color} />
    </Svg>
  );
}

/* Facebook Thumbs-Up Like Icon */
function ThumbLikeIcon({
  size = 22,
  color = '#ffffff',
  filled = false,
}: {
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M7 10v12" />
      <Path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </Svg>
  );
}

/* Facebook Comment Bubble Icon */
function CommentOutlineIcon({ size = 21, color = '#ffffff' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </Svg>
  );
}

/* Facebook Curved Share Arrow Icon */
function ShareArrowIcon({ size = 22, color = '#ffffff' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="m15 17 5-5-5-5" />
      <Path d="M4 18v-2a4 4 0 0 1 4-4h12" />
    </Svg>
  );
}

export default function PostPhotoViewerScreen() {
  const params = useLocalSearchParams<{
    id: string;
    imageUrl?: string;
    authorName?: string;
    authorUsername?: string;
    authorAvatar?: string;
    content?: string;
    createdAt?: string;
  }>();
  const postId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { width, height } = useWindowDimensions();
  const { locale, theme } = useUi();
  const { isAuthenticated } = useAuth();
  const { items: feedItems, toggleReaction, updateCommentCount } = useFeed();

  const [post, setPost] = useState<FeedItem | null>(() => {
    if (!postId) return null;
    const cached = queryCache.get<FeedItem>(`post:detail:${postId}`);
    if (cached) return cached;
    return feedItems.find((item) => item.id === postId) || null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (!postId) return false;
    const hasCached =
      Boolean(queryCache.get<FeedItem>(`post:detail:${postId}`)) ||
      feedItems.some((item) => item.id === postId) ||
      Boolean(params.imageUrl);
    return !hasCached;
  });

  // Interactive states
  const [hasReacted, setHasReacted] = useState(
    Boolean(post?.viewer?.hasReacted)
  );
  const [reactionCount, setReactionCount] = useState(
    post?.stats?.reactionCount || 0
  );
  const [commentCount, setCommentCount] = useState(
    post?.stats?.commentCount || 0
  );
  const [copiedShare, setCopiedShare] = useState(false);

  // Comments Modal states
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Fetch post by ID from backend (silent background refresh if already cached)
  const loadPost = useCallback(async () => {
    if (!postId) {
      setIsLoading(false);
      return;
    }

    const cached = queryCache.get<FeedItem>(`post:detail:${postId}`);
    if (cached) {
      setPost(cached);
      setHasReacted(Boolean(cached.viewer?.hasReacted));
      setReactionCount(cached.stats?.reactionCount || 0);
      setCommentCount(cached.stats?.commentCount || 0);
      setIsLoading(false);
    }

    const targetRealId =
      cached?.id &&
      !cached.id.startsWith('photo-') &&
      !cached.id.startsWith('temp-')
        ? cached.id
        : postId;

    if (targetRealId.startsWith('temp-') || targetRealId.startsWith('photo-')) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await feedApi.getPost(targetRealId);
      const data = ((res as any)?.data ?? res) as FeedItem;
      if (data && data.id) {
        queryCache.set(`post:detail:${postId}`, data);
        queryCache.set(`post:detail:${data.id}`, data);
        setPost(data);
        setHasReacted(Boolean(data.viewer?.hasReacted));
        setReactionCount(data.stats?.reactionCount || 0);
        setCommentCount(data.stats?.commentCount || 0);
      }
    } catch {
      // fallback to cached post if any
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const resolveRealPostId = useCallback((): string | null => {
    if (
      post?.id &&
      !post.id.startsWith('temp-') &&
      !post.id.startsWith('photo-')
    ) {
      return post.id;
    }
    const cached = postId
      ? queryCache.get<FeedItem>(`post:detail:${postId}`)
      : null;
    if (
      cached?.id &&
      !cached.id.startsWith('temp-') &&
      !cached.id.startsWith('photo-')
    ) {
      return cached.id;
    }
    if (postId && !postId.startsWith('temp-') && !postId.startsWith('photo-')) {
      return postId;
    }
    return null;
  }, [post?.id, postId]);

  // Load comments when comment button is pressed
  const handleOpenComments = async () => {
    setIsCommentsOpen(true);
    const targetId = resolveRealPostId();
    if (!targetId) {
      return;
    }
    setIsLoadingComments(true);
    try {
      const res = await feedApi.getComments(targetId, 50);
      const list = ((res as any)?.data ?? res) as PostComment[];
      if (Array.isArray(list)) {
        setComments(list);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Toggle Like / Reaction (Workable)
  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const nextReacted = !hasReacted;
    setHasReacted(nextReacted);
    setReactionCount((prev) =>
      nextReacted ? prev + 1 : Math.max(0, prev - 1)
    );

    const targetId = resolveRealPostId();
    if (targetId) {
      try {
        await toggleReaction(targetId, hasReacted);
      } catch {
        // ignore
      }
    }
  };

  // Submit new comment (Workable)
  const handleAddComment = async () => {
    if (!commentText.trim() || isSubmittingComment) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const targetId = resolveRealPostId();
    if (!targetId) {
      return;
    }

    setIsSubmittingComment(true);
    try {
      const res = await feedApi.createComment(targetId, commentText.trim());
      const payload = (res as any)?.data ?? res;
      if (payload?.comment) {
        setComments((prev) => [...prev, payload.comment]);
      }
      const nextCount =
        typeof payload?.commentCount === 'number'
          ? payload.commentCount
          : commentCount + 1;
      setCommentCount(nextCount);
      updateCommentCount(targetId, nextCount);
      setCommentText('');
    } catch {
      // ignore
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Share post (Workable)
  const handleShare = async () => {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/post/${postId}`
        : `https://peacetweet.com/post/${postId}`;
    try {
      if (
        typeof navigator !== 'undefined' &&
        (navigator as any).clipboard?.writeText
      ) {
        await (navigator as any).clipboard.writeText(shareUrl);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      } else {
        await Share.share({
          message: shareUrl,
          url: shareUrl,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  };

  // Resolve display fields from post or fallback params
  const mediaUrls = (
    post?.mediaUrls?.length
      ? post.mediaUrls
      : params.imageUrl
        ? [params.imageUrl]
        : []
  ).map((u) => normalizeMediaUrl(u));

  const primaryImageUrl = mediaUrls[0] || '';
  const authorName =
    post?.author?.name || params.authorName || 'PeaceTweet User';
  const authorUsername =
    post?.author?.username || params.authorUsername || 'user';
  const authorAvatar = normalizeMediaUrl(
    post?.author?.avatar ||
      (post?.author as any)?.avatarUrl ||
      params.authorAvatar ||
      primaryImageUrl
  );
  const contentText =
    post?.content !== undefined ? post.content : params.content || '';
  const createdAtStr = post?.createdAt || params.createdAt || '';

  const [imgAspectRatio, setImgAspectRatio] = useState<number>(() =>
    contentText?.toLowerCase().includes('cover') ? 16 / 9 : 1
  );

  useEffect(() => {
    if (!primaryImageUrl) return;
    Image.getSize(
      primaryImageUrl,
      (w, h) => {
        if (w > 0 && h > 0) {
          setImgAspectRatio(w / h);
        }
      },
      () => {}
    );
  }, [primaryImageUrl]);

  const isDark = theme === 'dark';
  const primaryIconColor = isDark ? '#ffffff' : '#050505';
  const mutedColor = isDark ? '#b0b3b8' : '#65676b';

  return (
    <View className="flex-1 bg-white dark:bg-black justify-between select-none">
      {/* ============================================================== */}
      {/* 1. TOP BAR: X (left), 1... (center), Tag + Location + 3-dot    */}
      {/* ============================================================== */}
      <View className="w-full max-w-[768px] mx-auto px-4 pt-3 pb-2 flex-row items-center justify-between z-20">
        {/* Top Left: X icon */}
        <Pressable
          onPress={handleClose}
          className="h-10 w-10 rounded-full items-center justify-center active:bg-black/5 dark:active:bg-white/10"
        >
          <AppIcon android="close" size={24} color={primaryIconColor} />
        </Pressable>

        {/* Top Right: Tag, Location, 3-Dot (Visual-only / Not workable) */}
        <View className="flex-row items-center gap-5">
          <View className="opacity-95">
            <AppIcon android="location_on" size={22} color={primaryIconColor} />
          </View>
          <View className="opacity-95">
            <AppIcon android="more_vert" size={22} color={primaryIconColor} />
          </View>
        </View>
      </View>

      {/* ============================================================== */}
      {/* 2. CENTER PHOTO VIEWPORT                                       */}
      {/* ============================================================== */}
      <View className="flex-1 items-center justify-center pt-12 w-full max-w-[768px] mx-auto overflow-hidden">
        {isLoading && !primaryImageUrl ? (
          <Skeleton className="w-full aspect-square rounded-none" />
        ) : primaryImageUrl ? (
          <Image
            source={{ uri: primaryImageUrl }}
            onLoad={(e: any) => {
              const src = e?.nativeEvent?.source || e?.target;
              const nw = src?.width || src?.naturalWidth;
              const nh = src?.height || src?.naturalHeight;
              if (nw > 0 && nh > 0) {
                setImgAspectRatio(nw / nh);
              }
            }}
            style={{
              width: '100%',
              aspectRatio: imgAspectRatio,
            }}
            className="w-full"
            resizeMode="contain"
          />
        ) : (
          <View className="items-center justify-center p-8">
            <AppIcon android="photo" size={48} color="#65676b" />
            <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2">
              {locale === 'bn' ? 'ছবি পাওয়া যায়নি' : 'Photo not available'}
            </Text>
          </View>
        )}
      </View>

      {/* ============================================================== */}
      {/* 3. BOTTOM OVERLAY: Author, Date, Caption & Workable Actions    */}
      {/* ============================================================== */}
      <View className="w-full max-w-[768px] mx-auto px-4 pt-3 pb-5 bg-white dark:bg-black z-20">
        {/* Author Row */}
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => {
              if (authorUsername) {
                router.push(`/${authorUsername}` as any);
              }
            }}
            className="active:opacity-80"
          >
            <UserAvatar avatarUrl={authorAvatar} name={authorName} size="md" />
          </Pressable>

          <View className="flex-1">
            <Pressable
              onPress={() => {
                if (authorUsername) {
                  router.push(`/${authorUsername}` as any);
                }
              }}
              className="self-start active:opacity-80"
            >
              <Text className="text-[16px] font-bold text-[#050505] dark:text-white leading-tight">
                {authorName}
              </Text>
            </Pressable>

            <View className="flex-row items-center gap-1.5 mt-0.5">
              <Text className="text-[11.5px] font-medium text-[#65676b] dark:text-[#b0b3b8] tracking-wide">
                {formatFacebookPhotoDate(createdAtStr)}
              </Text>
              <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                •
              </Text>
              <AppIcon android="public" size={13} color={mutedColor} />
            </View>
          </View>
        </View>

        {/* Post Caption */}
        {contentText ? (
          <Text className="text-[15px] text-[#050505] dark:text-white mt-2.5 leading-5">
            {contentText}
          </Text>
        ) : null}

        {/* Bottom Workable Action Bar (Like, Comment, Share + Reaction Pills) */}
        <View className="flex-row items-center justify-between mt-4 pt-1">
          <View className="flex-row items-center gap-6">
            {/* Like Button (Workable) */}
            <Pressable
              onPress={handleToggleLike}
              className="flex-row items-center gap-1.5 py-1 active:scale-95"
            >
              <ThumbLikeIcon
                size={22}
                color={hasReacted ? '#1877f2' : primaryIconColor}
                filled={hasReacted}
              />
              <Text
                className={`text-[14px] font-semibold ${
                  hasReacted
                    ? 'text-[#1877f2]'
                    : 'text-[#050505] dark:text-white'
                }`}
              >
                {reactionCount}
              </Text>
            </Pressable>

            {/* Comment Button (Workable) */}
            <Pressable
              onPress={handleOpenComments}
              className="flex-row items-center gap-1.5 py-1 active:scale-95"
            >
              <CommentOutlineIcon size={21} color={primaryIconColor} />
              <Text className="text-[14px] font-semibold text-[#050505] dark:text-white">
                {commentCount}
              </Text>
            </Pressable>

            {/* Share Button (Workable) */}
            <Pressable
              onPress={handleShare}
              className="flex-row items-center gap-1.5 py-1 active:scale-95"
            >
              {copiedShare ? (
                <>
                  <AppIcon android="check" size={20} color="#22c55e" />
                  <Text className="text-xs font-bold text-emerald-500">
                    Copied
                  </Text>
                </>
              ) : (
                <ShareArrowIcon size={23} color={primaryIconColor} />
              )}
            </Pressable>
          </View>

          {/* Right: Facebook Reaction Badges Pill (❤️ 😆 👍) */}
          <Pressable
            onPress={handleToggleLike}
            className="flex-row items-center active:opacity-80"
          >
            <View className="h-5 w-5 rounded-full bg-rose-500 items-center justify-center border border-white dark:border-black z-30">
              <Text className="text-[10px]">❤️</Text>
            </View>
            <View className="h-5 w-5 rounded-full bg-amber-400 items-center justify-center border border-white dark:border-black -ml-1.5 z-20">
              <Text className="text-[10px]">😆</Text>
            </View>
            <View className="h-5 w-5 rounded-full bg-[#1877f2] items-center justify-center border border-white dark:border-black -ml-1.5 z-10">
              <Text className="text-[10px]">👍</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* ============================================================== */}
      {/* 4. WORKABLE COMMENTS BOTTOM SHEET MODAL                        */}
      {/* ============================================================== */}
      <Modal
        visible={isCommentsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCommentsOpen(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="w-full max-w-[768px] mx-auto h-[72%] rounded-t-3xl bg-white dark:bg-[#242526] border-t border-[#e4e6eb] dark:border-[#393a3b] overflow-hidden">
            {/* Sheet Header */}
            <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-[#e4e6eb] dark:border-[#393a3b]">
              <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn'
                  ? `মন্তব্যসমূহ (${commentCount})`
                  : `Comments (${commentCount})`}
              </Text>
              <Pressable
                onPress={() => setIsCommentsOpen(false)}
                className="h-8 w-8 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] items-center justify-center"
              >
                <AppIcon
                  android="close"
                  size={18}
                  color={theme === 'dark' ? '#e4e6eb' : '#050505'}
                />
              </Pressable>
            </View>

            {/* Comments List */}
            <ScrollView
              className="flex-1 px-4 py-3"
              keyboardShouldPersistTaps="handled"
            >
              {isLoadingComments ? (
                <View className="gap-3.5 py-2">
                  {[1, 2, 3, 4].map((i) => (
                    <View key={i} className="flex-row items-start gap-2.5">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <View className="flex-1 rounded-2xl bg-[#f0f2f5] dark:bg-[#3a3b3c] px-3.5 py-2.5 gap-2">
                        <Skeleton className="h-3 w-28 rounded-md" />
                        <Skeleton className="h-3 w-4/5 rounded-md" />
                      </View>
                    </View>
                  ))}
                </View>
              ) : comments.length === 0 ? (
                <View className="py-12 items-center">
                  <AppIcon android="chat_bubble" size={32} color="#65676b" />
                  <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2">
                    {locale === 'bn'
                      ? 'এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্য করুন!'
                      : 'No comments yet. Be the first to comment!'}
                  </Text>
                </View>
              ) : (
                <View className="gap-3 pb-4">
                  {comments.map((c) => (
                    <View key={c.id} className="flex-row items-start gap-2.5">
                      <UserAvatar
                        avatarUrl={normalizeMediaUrl(
                          c.author?.avatar || (c.author as any)?.avatarUrl
                        )}
                        name={c.author?.name || 'User'}
                        size="sm"
                      />
                      <View className="flex-1 rounded-2xl bg-[#f0f2f5] dark:bg-[#3a3b3c] px-3.5 py-2">
                        <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                          {c.author?.name || 'User'}
                        </Text>
                        <Text className="text-xs text-[#050505] dark:text-[#e4e6eb] mt-0.5 leading-4">
                          {c.content}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Add Comment Input Bar */}
            <View className="px-4 py-3 border-t border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526] flex-row items-center gap-2">
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder={
                  locale === 'bn' ? 'মন্তব্য লিখুন...' : 'Write a comment...'
                }
                placeholderTextColor="#8e8e93"
                className="flex-1 h-10 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] px-4 text-xs text-[#050505] dark:text-[#e4e6eb]"
              />
              <Pressable
                disabled={!commentText.trim() || isSubmittingComment}
                onPress={handleAddComment}
                className={`h-10 w-10 rounded-full items-center justify-center ${
                  commentText.trim()
                    ? 'bg-[#1877f2]'
                    : 'bg-gray-200 dark:bg-gray-800'
                }`}
              >
                {isSubmittingComment ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <AppIcon
                    android="send"
                    size={16}
                    color={commentText.trim() ? '#ffffff' : '#9ca3af'}
                  />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
