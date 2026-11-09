import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Share,
  Platform,
  Animated,
  Easing,
  PanResponder,
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
import {
  CommentsBottomSheetModal,
  insertOptimisticComment,
  resolveOptimisticComment,
  removeOptimisticComment,
} from '@/features/feed/components/CommentsBottomSheetModal';
import { PostActionMenuModal } from '@/features/feed/components/PostActionMenuModal';
import { PostShareModal } from '@/features/feed/components/PostShareModal';
import { EditPostModal } from '@/features/feed/components/EditPostModal';
import { ReportPostModal } from '@/features/feed/components/ReportPostModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useScrollExitGesture } from '@/components/feed/useScrollExitGesture';
import {
  imageRatioCache,
  resolveImageAspectRatio,
} from '@/lib/cache/imageRatioCache';

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

  const { height } = useWindowDimensions();
  const { locale, theme, openComposer } = useUi();
  const { user, isAuthenticated } = useAuth();
  const {
    items: feedItems,
    toggleReaction,
    toggleSave,
    deletePost,
    updateCommentCount,
  } = useFeed();

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

  // Modals & Action states
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnsaveConfirm, setShowUnsaveConfirm] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Comments Bottom Sheet State
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Animation values for 3 independent layers
  const translateY = useRef(new Animated.Value(0)).current;
  const photoOpacity = useRef(new Animated.Value(1)).current;
  const backdropOpacity = useRef(new Animated.Value(1)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const isNavigatingRef = useRef(false);

  // Smoothly moves the photo upward while immediately vanishing the black layer and controls
  const applyProgress = useCallback(
    (progress: number) => {
      if (progress <= 0) {
        translateY.setValue(0);
        photoOpacity.setValue(1);
        backdropOpacity.setValue(1);
        controlsOpacity.setValue(1);
        return;
      }
      translateY.setValue(-progress);
      const fadeStart = 150;
      const pFade = Math.max(0, progress - fadeStart);
      photoOpacity.setValue(Math.max(0, 1 - pFade / 200));
      backdropOpacity.setValue(Math.max(0, 1 - progress / 15));
      controlsOpacity.setValue(Math.max(0, 1 - progress / 10));
    },
    [backdropOpacity, controlsOpacity, photoOpacity, translateY]
  );

  // Navigate to feed function (slides upwards into feed)
  const handleGoToFeed = useCallback((direction: 'up' | 'down' = 'up') => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    const targetY = direction === 'up' ? -(height || 800) : (height || 800);

    Animated.timing(translateY, {
      toValue: targetY,
      duration: 220,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    });
  }, [height, router, translateY]);

  const handleImmediateGoToFeed = useCallback(() => {
    isNavigatingRef.current = true;
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  // Web: mouse wheel / touch drag follows 1:1 (Facebook-style) and leaves to feed
  useScrollExitGesture({
    enabled: Platform.OS === 'web',
    distance: height || 800,
    isBlocked: () =>
      isCommentsOpen ||
      showActionMenu ||
      showShareModal ||
      showEditModal ||
      showReportModal ||
      showDeleteConfirm ||
      showUnsaveConfirm ||
      isNavigatingRef.current,
    onProgress: applyProgress,
    onComplete: handleImmediateGoToFeed,
    onDismissDown: handleImmediateGoToFeed,
  });

  // Escape closes the viewer
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (isCommentsOpen || showActionMenu || isNavigatingRef.current) return;
      if (e.key === 'Escape') handleImmediateGoToFeed();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleImmediateGoToFeed, isCommentsOpen, showActionMenu]);

  // Touch PanResponder: swiping exits upwards to feed on native React Native
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (Platform.OS === 'web' || isCommentsOpen || showActionMenu || showShareModal || isNavigatingRef.current) return false;
        return (
          Math.abs(gestureState.dy) > 16 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.5
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (isNavigatingRef.current) return;
        translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isNavigatingRef.current) return;
        if (Math.abs(gestureState.dy) > 40 || Math.abs(gestureState.vy) > 0.35) {
          handleGoToFeed('up');
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: Platform.OS !== 'web',
          }).start();
        }
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        if (isNavigatingRef.current) return;
        Animated.spring(translateY, {
          toValue: 0,
          bounciness: 4,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      },
    })
  ).current;

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

  // Fetch post details from API
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

  // Load comments when comment button is pressed
  const handleOpenComments = async () => {
    setIsCommentsOpen(true);
    const targetId = resolveRealPostId();
    if (!targetId) return;

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

  // Toggle Like / Reaction
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

  // Submit comment inside CommentsBottomSheetModal
  const handleAddComment = async (parentId?: string | null) => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const targetId = resolveRealPostId();
    if (!targetId) return;

    const tempId = `temp-comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimisticComment: PostComment = {
      id: tempId,
      postId: targetId,
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

    setCommentText('');
    setComments((prev) => insertOptimisticComment(prev, optimisticComment));
    const optimisticCount = commentCount + 1;
    setCommentCount(optimisticCount);
    updateCommentCount(targetId, optimisticCount);

    try {
      const res = await feedApi.createComment(targetId, trimmed, parentId);
      const payload = (res as any)?.data ?? res;
      setComments((prev) =>
        resolveOptimisticComment(prev, tempId, payload?.comment)
      );
      if (typeof payload?.commentCount === 'number') {
        setCommentCount(payload.commentCount);
        updateCommentCount(targetId, payload.commentCount);
      }
    } catch {
      setComments((prev) => removeOptimisticComment(prev, tempId));
      setCommentCount((prev) => Math.max(0, prev - 1));
    }
  };

  // Share post
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

  const isAuthor =
    Boolean(user?.id && post?.author?.id && user.id === post.author.id) ||
    user?.role === 'ADMIN';
  const hasSaved = Boolean(post?.viewer?.hasSaved);

  const handleToggleSave = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (hasSaved) {
      setShowUnsaveConfirm(true);
      return;
    }
    const realId = resolveRealPostId();
    if (realId) {
      toggleSave(realId, false);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              viewer: { ...prev.viewer, hasSaved: true },
            }
          : prev
      );
    }
  };

  const handleConfirmUnsave = () => {
    setShowUnsaveConfirm(false);
    const realId = resolveRealPostId();
    if (realId) {
      toggleSave(realId, true);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              viewer: { ...prev.viewer, hasSaved: false },
            }
          : prev
      );
    }
  };

  const handleDeletePost = async () => {
    const realId = resolveRealPostId();
    if (realId) {
      await deletePost(realId);
      handleGoToFeed();
    }
  };

  // Resolve display fields
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

  const [imgAspectRatio, setImgAspectRatio] = useState<number>(() => {
    const cached = imageRatioCache.get(primaryImageUrl);
    if (cached) return cached;
    return contentText?.toLowerCase().includes('cover') ? 16 / 9 : 1;
  });

  useEffect(() => {
    if (!primaryImageUrl) return;
    resolveImageAspectRatio(primaryImageUrl, (r) => {
      setImgAspectRatio(r);
    });
  }, [primaryImageUrl]);

  const isDark = theme === 'dark';
  // Blank background around photo: pure black in dark mode, darkish slate (#0b0e14) in light mode
  const viewerBg = isDark ? '#000000' : '#0b0e14';
  const primaryIconColor = '#ffffff';
  const mutedColor = '#b0b3b8';

  const headerBtnBg = 'rgba(0, 0, 0, 0.45)';
  const headerIconColor = '#ffffff';

  const textColor = '#ffffff';
  const mutedTextColor = 'rgba(255, 255, 255, 0.85)';
  const dotColor = 'rgba(255, 255, 255, 0.8)';
  const publicIconColor = '#ffffff';

  const textShadowStyle = {
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  };

  const actionBtnBg = 'rgba(0, 0, 0, 0.45)';
  const actionBtnBorder = 'rgba(255, 255, 255, 0.22)';
  const actionIconColor = '#ffffff';
  const actionTextColor = '#ffffff';

  const activeLikeBg = 'rgba(10, 102, 194, 0.35)';
  const activeLikeBorder = 'rgba(10, 102, 194, 0.7)';

  const activeSaveBg = 'rgba(10, 102, 194, 0.35)';
  const activeSaveBorder = 'rgba(10, 102, 194, 0.7)';

  const effectivePost: FeedItem = (post || {
    id: postId || 'temp-id',
    type: 'STANDARD',
    dua: null,
    content: contentText,
    mediaUrls: mediaUrls,
    createdAt: createdAtStr || new Date().toISOString(),
    author: {
      id: '',
      name: authorName,
      username: authorUsername,
      avatar: authorAvatar,
    },
    stats: {
      reactionCount,
      commentCount,
      saveCount: 0,
      shareCount: 0,
    },
    viewer: {
      hasReacted,
      hasSaved,
    },
  }) as FeedItem;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'transparent',
        touchAction: 'none',
        userSelect: 'none',
      } as any}
      {...panResponder.panHandlers}
      className="flex-1 select-none">
      {/* ────────────────── LAYER 1: BLACK / DARKISH BACKDROP ────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: viewerBg,
          opacity: backdropOpacity,
        }}
      />

      {/* ────────────────── LAYER 2: PHOTO VIEWPORT ────────────────── */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateY }],
          opacity: photoOpacity,
          pointerEvents: 'box-none',
        }}>
      {/* ────────────────── 1. FULLSCREEN PHOTO VIEWPORT (TAP TO TOGGLE CONTROLS) ────────────────── */}
      <Pressable
        onPress={() => setControlsVisible((prev) => !prev)}
        className="absolute inset-0 w-full h-full items-center justify-center overflow-hidden">
        {isLoading && !primaryImageUrl ? (
          <Skeleton className={`w-full aspect-square rounded-none ${isDark ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
        ) : primaryImageUrl ? (
          <Image
            source={{ uri: primaryImageUrl }}
            onLoad={(e: any) => {
              const src = e?.nativeEvent?.source || e?.target;
              const nw = src?.width || src?.naturalWidth;
              const nh = src?.height || src?.naturalHeight;
              if (nw > 0 && nh > 0) {
                const r = nw / nh;
                if (primaryImageUrl) imageRatioCache.set(primaryImageUrl, r);
                setImgAspectRatio(r);
              }
            }}
            style={{
              width: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              aspectRatio: imgAspectRatio || undefined,
              objectFit: 'contain',
              pointerEvents: 'none',
            } as any}
            resizeMode="contain"
          />
        ) : (
          <View className="items-center justify-center p-8">
            <AppIcon android="photo" size={48} color={mutedColor} />
            <Text className="text-xs mt-2" style={{ color: mutedColor }}>
              {locale === 'bn' ? 'ছবি পাওয়া যায়নি' : 'Photo not available'}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>

    {/* ────────────────── LAYER 3: CONTROLS (HEADER & BOTTOM BAR) ────────────────── */}
    {controlsVisible ? (
      <Animated.View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: controlsOpacity,
          zIndex: 40,
        }}>
        {/* Top Floating Header Bar */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            backgroundColor: 'transparent',
            pointerEvents: 'box-none',
          } as any}
          className="w-full max-w-[768px] mx-auto px-4 pt-3 pb-3 flex-row items-center justify-between">
          {/* Top Left: Close Button -> Go to Feed */}
          <Pressable
            onPress={(e) => {
              e?.stopPropagation?.();
              handleImmediateGoToFeed();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="h-10 w-10 rounded-full items-center justify-center active:scale-95"
            style={{ cursor: 'pointer', pointerEvents: 'auto', backgroundColor: headerBtnBg, backdropFilter: 'blur(6px)' } as any}
            accessibilityLabel="Back to feed">
            <AppIcon android="close" size={24} color={headerIconColor} />
          </Pressable>

          {/* Top Right: 3-Dot Post Action Menu */}
          <Pressable
            onPress={(e) => {
              e?.stopPropagation?.();
              setShowActionMenu(true);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="h-10 w-10 rounded-full items-center justify-center active:scale-95"
            style={{ cursor: 'pointer', pointerEvents: 'auto', backgroundColor: headerBtnBg, backdropFilter: 'blur(6px)' } as any}
            accessibilityLabel="Post options">
            <AppIcon android="more_vert" size={22} color={headerIconColor} />
          </Pressable>
        </View>

        {/* Bottom Floating Bar: Author, Caption & Action Row */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            backgroundColor: 'transparent',
            pointerEvents: 'box-none',
          } as any}
          className="w-full px-3.5 pb-4 select-none">
          <View className="w-full max-w-[768px] mx-auto" style={{ pointerEvents: 'box-none' } as any}>
            {/* Author Row & Caption Text */}
            <View className="w-full pb-1" style={{ pointerEvents: 'auto' } as any}>
              {/* Author Row */}
              <View className="flex-row items-center gap-2.5">
                <Pressable
                  onPress={() => {
                    if (authorUsername) {
                      router.push(`/${authorUsername}` as any);
                    }
                  }}
                  className="active:opacity-80">
                  <UserAvatar avatarUrl={authorAvatar} name={authorName} size="md" />
                </Pressable>

                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5 flex-wrap">
                    <Pressable
                      onPress={() => {
                        if (authorUsername) {
                          router.push(`/${authorUsername}` as any);
                        }
                      }}
                      className="self-start active:opacity-80">
                      <Text
                        style={[{ color: textColor }, textShadowStyle] as any}
                        className="text-[15.5px] font-bold leading-tight">
                        {authorName}
                      </Text>
                    </Pressable>
                    <AppIcon
                      android="verified"
                      ios="checkmark.seal.fill"
                      size={14}
                      color="#0A66C2"
                    />
                    <Text
                      style={[{ color: dotColor }, textShadowStyle] as any}
                      className="text-[11px]">
                      •
                    </Text>
                    <AppIcon android="public" size={12} color={publicIconColor} />
                  </View>

                  <Text
                    style={[{ color: mutedTextColor }, textShadowStyle] as any}
                    className="text-[11.5px] font-medium mt-0.5">
                    {formatFacebookPhotoDate(createdAtStr)}
                  </Text>
                </View>
              </View>

              {/* Caption Text */}
              {contentText ? (
                <Text
                  style={[{ color: textColor }, textShadowStyle] as any}
                  className="text-[14px] mt-2 leading-5 font-normal"
                  numberOfLines={3}>
                  {contentText}
                </Text>
              ) : null}
            </View>

            {/* Bottom Controls Row: Action Icons (Like, Comment, Share, Save) */}
            <View className="flex-row items-center gap-2.5 mt-2.5" style={{ pointerEvents: 'auto' } as any}>
              {/* 1. Like Button */}
              <Pressable
                onPress={handleToggleLike}
                style={{
                  backgroundColor: hasReacted ? activeLikeBg : actionBtnBg,
                  borderColor: hasReacted ? activeLikeBorder : actionBtnBorder,
                  borderWidth: 1,
                  backdropFilter: 'blur(6px)',
                } as any}
                className="h-10 px-3.5 rounded-full flex-row items-center justify-center gap-1.5 active:scale-95"
                accessibilityLabel="Like">
                <ThumbLikeIcon
                  size={20}
                  color={hasReacted ? '#0A66C2' : actionIconColor}
                  filled={hasReacted}
                />
                {reactionCount > 0 ? (
                  <Text
                    style={[{ color: hasReacted ? '#0A66C2' : actionTextColor }, textShadowStyle] as any}
                    className="text-[13px] font-bold">
                    {reactionCount}
                  </Text>
                ) : null}
              </Pressable>

              {/* 2. Comment Button */}
              <Pressable
                onPress={handleOpenComments}
                style={{
                  backgroundColor: actionBtnBg,
                  borderColor: actionBtnBorder,
                  borderWidth: 1,
                  backdropFilter: 'blur(6px)',
                } as any}
                className="h-10 px-3.5 rounded-full flex-row items-center justify-center gap-1.5 active:scale-95"
                accessibilityLabel="Comments">
                <CommentOutlineIcon size={20} color={actionIconColor} />
                {commentCount > 0 ? (
                  <Text
                    style={[{ color: actionTextColor }, textShadowStyle] as any}
                    className="text-[13px] font-bold">
                    {commentCount}
                  </Text>
                ) : null}
              </Pressable>

              {/* 3. Share Button */}
              <Pressable
                onPress={() => setShowShareModal(true)}
                style={{
                  backgroundColor: actionBtnBg,
                  borderColor: actionBtnBorder,
                  borderWidth: 1,
                  backdropFilter: 'blur(6px)',
                } as any}
                className="h-10 w-10 rounded-full items-center justify-center active:scale-95"
                accessibilityLabel="Share">
                <ShareArrowIcon size={19} color={actionIconColor} />
              </Pressable>

              {/* 4. Bookmark / Save Button */}
              <Pressable
                onPress={handleToggleSave}
                style={{
                  backgroundColor: hasSaved ? activeSaveBg : actionBtnBg,
                  borderColor: hasSaved ? activeSaveBorder : actionBtnBorder,
                  borderWidth: 1,
                  backdropFilter: 'blur(6px)',
                } as any}
                className="h-10 w-10 rounded-full items-center justify-center active:scale-95"
                accessibilityLabel="Save">
                <AppIcon
                  android="bookmark"
                  size={19}
                  color={hasSaved ? '#0A66C2' : actionIconColor}
                  filled={hasSaved}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </Animated.View>
    ) : null}

      {/* ────────────────── 4. COMMENTS BOTTOM SHEET MODAL ────────────────── */}
      <CommentsBottomSheetModal
        visible={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        commentCount={commentCount}
        comments={comments}
        isLoadingComments={isLoadingComments}
        commentText={commentText}
        onChangeCommentText={setCommentText}
        onSubmitComment={handleAddComment}
      />

      {/* ────────────────── 5. REUSABLE MODALS ────────────────── */}
      {effectivePost && (
        <>
          <PostActionMenuModal
            visible={showActionMenu}
            onClose={() => setShowActionMenu(false)}
            post={effectivePost}
            isAuthor={isAuthor}
            hasSaved={hasSaved}
            onEdit={() => {
              if (
                effectivePost.type === 'BLOOD_REQUEST' ||
                Boolean(effectivePost.bloodRequest) ||
                Boolean(effectivePost.bloodRequestId)
              ) {
                openComposer({
                  mode: 'BLOOD_REQUEST',
                  editingPost: effectivePost,
                });
              } else if (
                effectivePost.type === 'DUA' ||
                Boolean(effectivePost.dua) ||
                Boolean(effectivePost.duaId)
              ) {
                openComposer({
                  mode: 'DUA',
                  editingPost: effectivePost,
                });
              } else {
                openComposer({
                  mode: 'TEXT',
                  editingPost: effectivePost,
                });
              }
            }}
            onDelete={() => setShowDeleteConfirm(true)}
            onToggleSave={handleToggleSave}
            onCopyLink={handleShare}
            onOpenShare={() => setShowShareModal(true)}
            onReport={() => setShowReportModal(true)}
          />

          <PostShareModal
            visible={showShareModal}
            onClose={() => setShowShareModal(false)}
            post={effectivePost}
          />

          <EditPostModal
            visible={showEditModal}
            onClose={() => setShowEditModal(false)}
            post={effectivePost}
            onSuccess={(updated) => setPost(updated)}
          />

          <ReportPostModal
            visible={showReportModal}
            onClose={() => setShowReportModal(false)}
            post={effectivePost}
          />

          <ConfirmDialog
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDeletePost}
            title={locale === 'bn' ? 'পোস্টটি মুছে ফেলবেন?' : 'Delete Post?'}
            subtitle={
              locale === 'bn'
                ? 'এই পোস্টটি মুছে ফেললে তা আর পুনরুদ্ধার করা যাবে না।'
                : 'Are you sure you want to delete this post? This action cannot be undone.'
            }
            confirmText={locale === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
            variant="danger"
          />

          <ConfirmDialog
            isOpen={showUnsaveConfirm}
            onClose={() => setShowUnsaveConfirm(false)}
            onConfirm={handleConfirmUnsave}
            title={locale === 'bn' ? 'সেভ থেকে সরিয়ে ফেলবেন?' : 'Remove from Saved?'}
            subtitle={
              locale === 'bn'
                ? 'আপনি কি নিশ্চিত যে এই পোস্টটি আপনার সেভ করা তালিকা থেকে সরাতে চান?'
                : 'Are you sure you want to remove this post from your saved collection?'
            }
            confirmText={locale === 'bn' ? 'সরিয়ে ফেলুন' : 'Remove'}
            variant="danger"
          />
        </>
      )}
    </View>
  );
}
