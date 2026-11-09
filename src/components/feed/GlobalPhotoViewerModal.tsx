import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Animated,
  Easing,
  PanResponder,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useUi } from '@/providers/UiProvider';
import { useFeed } from '@/providers/FeedProvider';
import { useAuth } from '@/providers/AuthProvider';
import { normalizeMediaUrl } from '@/features/uploads/api/uploads.api';
import { AppIcon } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
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
import { feedApi } from '@/features/feed/api/feed.api';
import { FeedItem, PostComment } from '@/features/feed/types/feed.types';
import { useScrollExitGesture } from './useScrollExitGesture';
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

/* Thumbs-Up Like Icon */
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

/* Comment Bubble Icon */
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

/* Curved Share Arrow Icon */
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

export function GlobalPhotoViewerModal() {
  const { activePhotoViewer, closePhotoViewer, locale, theme, openComposer } = useUi();
  const { toggleReaction, toggleSave, deletePost, updateCommentCount } =
    useFeed();
  const { user, isAuthenticated } = useAuth();
  const { width: windowWidth, height } = useWindowDimensions();
  const screenWidth = windowWidth || 420;

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

  // All state and refs declared at the top of the component to prevent TDZ errors
  const [currentPost, setCurrentPost] = useState<FeedItem | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const photoIndexRef = useRef(0);
  const panX = useRef(new Animated.Value(0)).current;
  const gestureModeRef = useRef<'none' | 'horizontal' | 'vertical'>('none');
  const [activeUrl, setActiveUrl] = useState('');
  const [aspectRatio, setAspectRatio] = useState(4 / 3);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // Modals state
  const [showComments, setShowComments] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnsaveConfirm, setShowUnsaveConfirm] = useState(false);

  // Comments state
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Interactive counts & reaction
  const [hasReacted, setHasReacted] = useState(false);
  const [reactionCount, setReactionCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [hasSaved, setHasSaved] = useState(false);

  // Distinct animation values for 3 independent layers:
  // 1. Photo translates upward
  const translateY = useRef(new Animated.Value(0)).current;
  const photoOpacity = useRef(new Animated.Value(1)).current;
  // 2. Black backdrop layer vanishes immediately (15px)
  const backdropOpacity = useRef(new Animated.Value(1)).current;
  // 3. Header & bottom action buttons vanish immediately (10px)
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  const isClosingRef = useRef(false);
  const progressRef = useRef(0);
  const tweenRef = useRef<number | null>(null);

  // Reference to the feed scrollable element and starting position
  const feedScrollerRef = useRef<HTMLElement | null>(null);
  const initialScrollTopRef = useRef<number>(0);

  const getFeedScroller = useCallback((): HTMLElement | null => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return null;
    const el = document.querySelector(
      '[data-testid="feed-scroll-view"]'
    ) as HTMLElement | null;
    if (!el) return null;
    if (el.scrollHeight > el.clientHeight) return el;
    const scrollChild = el.querySelector(
      '[style*="overflow"]'
    ) as HTMLElement | null;
    if (scrollChild && scrollChild.scrollHeight > scrollChild.clientHeight) {
      return scrollChild;
    }
    let curr: HTMLElement | null = el;
    while (curr && curr !== document.body) {
      if (curr.scrollHeight > curr.clientHeight) return curr;
      curr = curr.parentElement;
    }
    return el;
  }, []);

  const goToIndex = useCallback(
    (targetIdx: number) => {
      const list = (currentPost?.mediaUrls || [])
        .map((u) => normalizeMediaUrl(u))
        .filter(Boolean);
      if (list.length === 0) return;
      const clamped = Math.max(0, Math.min(list.length - 1, targetIdx));
      const targetOffset = -clamped * screenWidth;

      setPhotoIndex(clamped);
      photoIndexRef.current = clamped;
      const newUrl = list[clamped] || '';
      setActiveUrl(newUrl);
      const cached = imageRatioCache.get(newUrl);
      if (cached) {
        setAspectRatio(cached);
      }

      Animated.spring(panX, {
        toValue: targetOffset,
        bounciness: 0,
        speed: 18,
        useNativeDriver: true,
      }).start();
    },
    [currentPost, panX, screenWidth]
  );

  useEffect(() => {
    panX.setValue(-photoIndexRef.current * screenWidth);
  }, [panX, screenWidth]);

  useEffect(() => {
    if (activePhotoViewer?.post) {
      const p = activePhotoViewer.post;
      setCurrentPost(p);
      setHasReacted(Boolean(p.viewer?.hasReacted));
      setReactionCount(p.stats?.reactionCount || 0);
      setCommentCount(p.stats?.commentCount || 0);
      setHasSaved(Boolean(p.viewer?.hasSaved));

      const list = (p.mediaUrls || []).map((u) => normalizeMediaUrl(u)).filter(Boolean);
      const target = activePhotoViewer.initialImageUrl
        ? normalizeMediaUrl(activePhotoViewer.initialImageUrl)
        : list[0] || '';
      const initialIdx = target ? list.indexOf(target) : 0;
      const safeIdx = initialIdx >= 0 ? initialIdx : 0;

      setPhotoIndex(safeIdx);
      photoIndexRef.current = safeIdx;
      const selectedUrl = list[safeIdx] || target || '';
      setActiveUrl(selectedUrl);

      panX.setValue(-safeIdx * screenWidth);

      const cachedRatio = imageRatioCache.get(selectedUrl);
      if (cachedRatio) {
        setAspectRatio(cachedRatio);
      }

      // Reset animation / gesture state for the newly opened viewer
      translateY.setValue(0);
      photoOpacity.setValue(1);
      backdropOpacity.setValue(1);
      controlsOpacity.setValue(1);
      progressRef.current = 0;
      isClosingRef.current = false;
      setIsClosing(false);
      gestureModeRef.current = 'none';

      // Capture initial feed scroll position to synchronize feed scroll with photo drag
      const scroller = getFeedScroller();
      feedScrollerRef.current = scroller;
      initialScrollTopRef.current = scroller ? scroller.scrollTop : 0;
    }
  }, [activePhotoViewer, getFeedScroller, screenWidth, panX]);

  useEffect(() => {
    if (!activeUrl) return;
    resolveImageAspectRatio(activeUrl, (r) => {
      setAspectRatio(r);
    });
  }, [activeUrl]);

  // Smoothly moves the photo AND scrolls the feed post in 1:1 sync while vanishing black layer & controls
  const applyProgress = useCallback(
    (progress: number) => {
      progressRef.current = progress;
      if (progress <= 0) {
        translateY.setValue(0);
        photoOpacity.setValue(1);
        backdropOpacity.setValue(1);
        controlsOpacity.setValue(1);
        const scroller = feedScrollerRef.current || getFeedScroller();
        if (scroller) {
          scroller.scrollTop = initialScrollTopRef.current;
        }
        return;
      }

      // 1. Black layer vanishes immediately (transparent by 15px)
      backdropOpacity.setValue(Math.max(0, 1 - progress / 15));

      // 2. Header & bottom action buttons vanish immediately (transparent by 10px)
      controlsOpacity.setValue(Math.max(0, 1 - progress / 10));

      // 3. Scroll the feed post in 1:1 real-time sync with progress so the post scrolls along with the photo!
      const scroller = feedScrollerRef.current || getFeedScroller();
      if (scroller) {
        feedScrollerRef.current = scroller;
        scroller.scrollTop = initialScrollTopRef.current + progress;
      }

      // 4. Modal photo translates with progress and smoothly hands over to the feed post photo
      translateY.setValue(-progress);
      photoOpacity.setValue(Math.max(0, 1 - progress / 35));
    },
    [backdropOpacity, controlsOpacity, getFeedScroller, photoOpacity, translateY]
  );

  const animateProgressTo = useCallback(
    (to: number, onDone?: () => void) => {
      if (tweenRef.current !== null) cancelAnimationFrame(tweenRef.current);
      const from = progressRef.current;
      const startTime = performance.now();
      const viewport = height || 800;
      const duration = Math.max(
        160,
        Math.min(300, (Math.abs(to - from) / viewport) * 300)
      );
      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        applyProgress(from + (to - from) * eased);
        if (t < 1) {
          tweenRef.current = requestAnimationFrame(step);
        } else {
          tweenRef.current = null;
          onDone?.();
        }
      };
      tweenRef.current = requestAnimationFrame(step);
    },
    [applyProgress, height]
  );

  useEffect(() => {
    return () => {
      if (tweenRef.current !== null) cancelAnimationFrame(tweenRef.current);
    };
  }, []);

  // Smooth exit: slide the viewer away
  const handleAnimatedClose = useCallback(
    (direction: 'up' | 'down' = 'up') => {
      if (isClosingRef.current) return;
      isClosingRef.current = true;
      setIsClosing(true);

      if (direction === 'down') {
        closePhotoViewer();
        return;
      }
      animateProgressTo(height || 800, () => {
        closePhotoViewer();
      });
    },
    [animateProgressTo, closePhotoViewer, height]
  );

  // Immediate close without animation lock (for Close [X] button / Escape)
  const handleImmediateClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    if (tweenRef.current !== null) cancelAnimationFrame(tweenRef.current);
    const scroller = feedScrollerRef.current || getFeedScroller();
    if (scroller && progressRef.current < 60) {
      scroller.scrollTop = initialScrollTopRef.current;
    }
    closePhotoViewer();
  }, [closePhotoViewer, getFeedScroller]);

  // Web: mouse wheel / touch drag follows 1:1 and scrolls into the next post
  useScrollExitGesture({
    enabled: Boolean(activePhotoViewer) && Platform.OS === 'web',
    distance: height || 800,
    isBlocked: () =>
      showComments ||
      showActionMenu ||
      showShareModal ||
      showEditModal ||
      showReportModal ||
      showDeleteConfirm ||
      showUnsaveConfirm ||
      isClosingRef.current,
    onProgress: applyProgress,
    onComplete: handleImmediateClose,
    onDismissDown: handleImmediateClose,
  });

  // Keyboard Navigation: Escape to close, Left/Right arrows to change photo
  useEffect(() => {
    if (!activePhotoViewer || !currentPost) return;
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (
        showComments ||
        showActionMenu ||
        showShareModal ||
        showEditModal ||
        showReportModal ||
        showDeleteConfirm ||
        showUnsaveConfirm ||
        isClosingRef.current
      )
        return;
      if (e.key === 'Escape') {
        handleImmediateClose();
        return;
      }
      const list = (currentPost.mediaUrls || [])
        .map((u) => normalizeMediaUrl(u))
        .filter(Boolean);
      if (list.length > 1) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          if (photoIndexRef.current < list.length - 1) {
            goToIndex(photoIndexRef.current + 1);
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          if (photoIndexRef.current > 0) {
            goToIndex(photoIndexRef.current - 1);
          }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    activePhotoViewer,
    currentPost,
    goToIndex,
    handleImmediateClose,
    showActionMenu,
    showComments,
    showDeleteConfirm,
    showEditModal,
    showReportModal,
    showShareModal,
    showUnsaveConfirm,
  ]);

  // Gesture handling: PanResponder handles horizontal photo swipe (one index per swipe)
  // as well as vertical swipe-to-leave
  const latestRef = useRef({
    applyProgress,
    animateProgressTo,
    handleAnimatedClose,
    handleImmediateClose,
    goToIndex,
    getMediaList: () => [] as string[],
    blocked: false,
  });
  latestRef.current = {
    applyProgress,
    animateProgressTo,
    handleAnimatedClose,
    handleImmediateClose,
    goToIndex,
    getMediaList: () =>
      (currentPost?.mediaUrls || [])
        .map((u) => normalizeMediaUrl(u))
        .filter(Boolean),
    blocked:
      showComments ||
      showActionMenu ||
      showShareModal ||
      showEditModal ||
      showReportModal ||
      showDeleteConfirm ||
      showUnsaveConfirm,
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        if (latestRef.current.blocked || isClosingRef.current) return false;
        const absX = Math.abs(gs.dx);
        const absY = Math.abs(gs.dy);
        const list = latestRef.current.getMediaList();

        // Horizontal swipe when multiple photos exist:
        if (list.length > 1 && absX > 8 && absX > absY * 1.2) {
          gestureModeRef.current = 'horizontal';
          return true;
        }

        // Vertical swipe to dismiss / scroll exit on native:
        if (Platform.OS !== 'web' && absY > 16 && absY > absX * 1.5) {
          gestureModeRef.current = 'vertical';
          return true;
        }

        return false;
      },
      onPanResponderMove: (_, gs) => {
        if (isClosingRef.current) return;
        if (gestureModeRef.current === 'horizontal') {
          const list = latestRef.current.getMediaList();
          if (list.length <= 1) return;
          const currentK = photoIndexRef.current;
          let effectiveDx = gs.dx;
          if (
            (currentK === 0 && gs.dx > 0) ||
            (currentK === list.length - 1 && gs.dx < 0)
          ) {
            effectiveDx = gs.dx * 0.25;
          }
          panX.setValue(-currentK * screenWidth + effectiveDx);
        } else if (gestureModeRef.current === 'vertical') {
          latestRef.current.applyProgress(Math.max(0, -gs.dy));
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (isClosingRef.current) return;
        if (gestureModeRef.current === 'horizontal') {
          const list = latestRef.current.getMediaList();
          const currentK = photoIndexRef.current;
          const threshold = Math.min(45, screenWidth * 0.12);
          const isQuickFlick = Math.abs(gs.vx) > 0.25;

          if (
            (gs.dx < -threshold || (isQuickFlick && gs.vx < -0.2)) &&
            currentK < list.length - 1
          ) {
            latestRef.current.goToIndex(currentK + 1);
          } else if (
            (gs.dx > threshold || (isQuickFlick && gs.vx > 0.2)) &&
            currentK > 0
          ) {
            latestRef.current.goToIndex(currentK - 1);
          } else {
            latestRef.current.goToIndex(currentK);
          }
          gestureModeRef.current = 'none';
        } else if (gestureModeRef.current === 'vertical') {
          if (gs.dy < -35 || gs.vy < -0.3) {
            latestRef.current.handleAnimatedClose('up');
          } else if (gs.dy > 40 || gs.vy > 0.35) {
            latestRef.current.handleImmediateClose();
          } else {
            latestRef.current.animateProgressTo(0);
          }
          gestureModeRef.current = 'none';
        }
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        if (isClosingRef.current) return;
        if (gestureModeRef.current === 'horizontal') {
          latestRef.current.goToIndex(photoIndexRef.current);
        } else {
          latestRef.current.animateProgressTo(0);
        }
        gestureModeRef.current = 'none';
      },
    })
  ).current;

  // Toggle Reaction
  const handleToggleReaction = () => {
    if (!isAuthenticated || !currentPost) return;
    const nextReacted = !hasReacted;
    setHasReacted(nextReacted);
    setReactionCount((prev) =>
      nextReacted ? prev + 1 : Math.max(0, prev - 1)
    );
    toggleReaction(currentPost.id, hasReacted);
  };

  // Toggle Save
  const handleToggleSave = () => {
    if (!isAuthenticated || !currentPost) return;
    if (hasSaved) {
      setShowUnsaveConfirm(true);
      return;
    }
    setHasSaved(true);
    toggleSave(currentPost.id, false);
  };

  const handleConfirmUnsave = () => {
    setShowUnsaveConfirm(false);
    if (!currentPost) return;
    setHasSaved(false);
    toggleSave(currentPost.id, true);
  };

  const handleDeletePost = async () => {
    if (!currentPost) return;
    await deletePost(currentPost.id);
    handleAnimatedClose();
  };

  // Open comments
  const handleOpenComments = async () => {
    if (!currentPost) return;
    setShowComments(true);
    setIsLoadingComments(true);
    try {
      const res = await feedApi.getComments(currentPost.id, 50);
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

  // Add Comment
  const handleAddComment = async (parentId?: string | null) => {
    if (!currentPost || !commentText.trim() || !isAuthenticated) return;
    const trimmed = commentText.trim();
    const tempId = `temp-${Date.now()}`;
    const optimistic: PostComment = {
      id: tempId,
      postId: currentPost.id,
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
        avatar: user?.avatarUrl || null,
      },
    };

    setCommentText('');
    setComments((prev) => insertOptimisticComment(prev, optimistic));
    const nextCount = commentCount + 1;
    setCommentCount(nextCount);
    updateCommentCount(currentPost.id, nextCount);

    try {
      const res = await feedApi.createComment(
        currentPost.id,
        trimmed,
        parentId
      );
      const payload = (res as any)?.data ?? res;
      setComments((prev) =>
        resolveOptimisticComment(prev, tempId, payload?.comment)
      );
    } catch {
      setComments((prev) => removeOptimisticComment(prev, tempId));
      setCommentCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleCopyLink = async () => {
    if (!currentPost?.id) return;
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/post/${currentPost.id}`
        : `https://peacetweet.com/post/${currentPost.id}`;
    try {
      if (
        typeof navigator !== 'undefined' &&
        (navigator as any).clipboard?.writeText
      ) {
        await (navigator as any).clipboard.writeText(shareUrl);
      }
    } catch {}
    setShowActionMenu(false);
  };

  if (!activePhotoViewer || !currentPost) return null;

  const mediaList = (currentPost.mediaUrls || [])
    .map((u) => normalizeMediaUrl(u))
    .filter(Boolean);

  const authorName = currentPost.author?.name || 'User';
  const authorAvatar = normalizeMediaUrl(
    currentPost.author?.avatar || (currentPost.author as any)?.avatarUrl
  );
  const isAuthor =
    Boolean(
      user?.id && currentPost.author?.id && user.id === currentPost.author.id
    ) || user?.role === 'ADMIN';

  return (
    <View
      style={
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          backgroundColor: 'transparent',
          pointerEvents: isClosing ? 'none' : 'auto',
          touchAction: 'none',
          userSelect: 'none',
        } as any
      }
      {...panResponder.panHandlers}
    >
      {/* ────────────────── LAYER 1: BLACK / DARKISH BACKDROP ────────────────── */}
      {/* Vanishes immediately on scroll so no black box or layer remains over the feed */}
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
      {/* Lightly moves with finger/scroll, stays fully opaque to prevent ghosting */}
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
        }}
      >
        {mediaList.length > 1 ? (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: screenWidth * mediaList.length,
              flexDirection: 'row',
              transform: [{ translateX: panX }],
            }}
          >
            {mediaList.map((url, idx) => {
              const cachedRatio = imageRatioCache.get(url);
              return (
                <Pressable
                  key={`${url}-${idx}`}
                  onPress={() => setControlsVisible((prev) => !prev)}
                  style={{
                    width: screenWidth,
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={{ uri: url }}
                    onLoad={(e: any) => {
                      const src = e?.nativeEvent?.source || e?.target;
                      const nw = src?.width || src?.naturalWidth;
                      const nh = src?.height || src?.naturalHeight;
                      if (nw > 0 && nh > 0) {
                        const r = nw / nh;
                        imageRatioCache.set(url, r);
                        if (idx === photoIndex) {
                          setAspectRatio(r);
                        }
                      }
                    }}
                    style={
                      {
                        width: '100%',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        aspectRatio: cachedRatio || undefined,
                        objectFit: 'contain',
                        pointerEvents: 'none',
                      } as any
                    }
                    resizeMode="contain"
                  />
                </Pressable>
              );
            })}
          </Animated.View>
        ) : (
          <Pressable
            onPress={() => setControlsVisible((prev) => !prev)}
            className="absolute inset-0 w-full h-full items-center justify-center overflow-hidden"
          >
            {activeUrl ? (
              <Image
                source={{ uri: activeUrl }}
                onLoad={(e: any) => {
                  const src = e?.nativeEvent?.source || e?.target;
                  const nw = src?.width || src?.naturalWidth;
                  const nh = src?.height || src?.naturalHeight;
                  if (nw > 0 && nh > 0) {
                    const r = nw / nh;
                    if (activeUrl) imageRatioCache.set(activeUrl, r);
                    setAspectRatio(r);
                  }
                }}
                style={
                  {
                    width: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    aspectRatio: aspectRatio || undefined,
                    objectFit: 'contain',
                    pointerEvents: 'none',
                  } as any
                }
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
        )}
      </Animated.View>

      {/* ────────────────── LAYER 3: CONTROLS (HEADER & BOTTOM BAR) ────────────────── */}
      {/* Vanishes immediately on first touch/scroll (10px) */}
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
          }}
        >
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
            className="w-full max-w-[768px] mx-auto px-4 pt-3 pb-3 flex-row items-center justify-between"
          >
            {/* Close X Button: Immediately closes photo viewer and returns to feed */}
            <Pressable
              onPress={(e) => {
                e?.stopPropagation?.();
                handleImmediateClose();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="h-10 w-10 rounded-full items-center justify-center active:scale-95"
              style={{ cursor: 'pointer', pointerEvents: 'auto', backgroundColor: headerBtnBg, backdropFilter: 'blur(6px)' } as any}
              accessibilityLabel="Close and return to feed"
            >
              <AppIcon android="close" size={24} color={headerIconColor} />
            </Pressable>

            {/* Center: Photo Counter Badge when multiple photos */}
            {mediaList.length > 1 && (
              <View
                style={{
                  backgroundColor: headerBtnBg,
                  backdropFilter: 'blur(6px)',
                  pointerEvents: 'auto',
                } as any}
                className="px-3.5 py-1 rounded-full items-center justify-center">
                <Text className="text-xs font-bold text-white tracking-wider">
                  {photoIndex + 1} / {mediaList.length}
                </Text>
              </View>
            )}

            {/* Top Right: 3-Dot Post Action Menu Button */}
            <Pressable
              onPress={(e) => {
                e?.stopPropagation?.();
                setShowActionMenu(true);
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="h-10 w-10 rounded-full items-center justify-center active:scale-95"
              style={{ cursor: 'pointer', pointerEvents: 'auto', backgroundColor: headerBtnBg, backdropFilter: 'blur(6px)' } as any}
              accessibilityLabel="Post options"
            >
              <AppIcon android="more_vert" size={22} color={headerIconColor} />
            </Pressable>
          </View>

          {/* Bottom Floating Bar: Author, Caption & Action Row */}
          <View
            style={
              {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 40,
                backgroundColor: 'transparent',
                pointerEvents: 'box-none',
              } as any
            }
            className="w-full px-3.5 pb-4 select-none"
          >
            <View className="w-full max-w-[768px] mx-auto" style={{ pointerEvents: 'box-none' } as any}>
              {/* Author Row & Caption Text */}
              <View className="w-full pb-1" style={{ pointerEvents: 'auto' } as any}>
                {/* Author Row */}
                <View className="flex-row items-center gap-2.5">
                  <UserAvatar avatarUrl={authorAvatar} name={authorName} size="md" />

                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5 flex-wrap">
                      <Text
                        style={[{ color: textColor }, textShadowStyle] as any}
                        className="text-[15.5px] font-bold leading-tight"
                      >
                        {authorName}
                      </Text>
                      <AppIcon
                        android="verified"
                        ios="checkmark.seal.fill"
                        size={14}
                        color="#0A66C2"
                      />
                      <Text
                        style={[{ color: dotColor }, textShadowStyle] as any}
                        className="text-[11px]"
                      >
                        •
                      </Text>
                      <AppIcon android="public" size={12} color={publicIconColor} />
                    </View>

                    <Text
                      style={[{ color: mutedTextColor }, textShadowStyle] as any}
                      className="text-[11.5px] font-medium mt-0.5"
                    >
                      {formatFacebookPhotoDate(currentPost.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* Caption Text */}
                {currentPost.content ? (
                  <Text
                    style={[{ color: textColor }, textShadowStyle] as any}
                    className="text-[14px] mt-2 leading-5 font-normal"
                    numberOfLines={3}
                  >
                    {currentPost.content}
                  </Text>
                ) : null}
              </View>

              {/* Bottom Controls Row: Action Icons (Like, Comment, Share, Save) */}
              <View className="flex-row items-center gap-2.5 mt-2.5" style={{ pointerEvents: 'auto' } as any}>
                {/* 1. Like Button */}
                <Pressable
                  onPress={handleToggleReaction}
                  style={{
                    backgroundColor: hasReacted ? activeLikeBg : actionBtnBg,
                    borderColor: hasReacted ? activeLikeBorder : actionBtnBorder,
                    borderWidth: 1,
                    backdropFilter: 'blur(6px)',
                  } as any}
                  className="h-10 px-3.5 rounded-full flex-row items-center justify-center gap-1.5 active:scale-95"
                  accessibilityLabel="Like"
                >
                  <ThumbLikeIcon
                    size={20}
                    color={hasReacted ? '#0A66C2' : actionIconColor}
                    filled={hasReacted}
                  />
                  {reactionCount > 0 ? (
                    <Text
                      style={[{ color: hasReacted ? '#0A66C2' : actionTextColor }, textShadowStyle] as any}
                      className="text-[13px] font-bold"
                    >
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
                  accessibilityLabel="Comments"
                >
                  <CommentOutlineIcon size={20} color={actionIconColor} />
                  {commentCount > 0 ? (
                    <Text
                      style={[{ color: actionTextColor }, textShadowStyle] as any}
                      className="text-[13px] font-bold"
                    >
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
                  accessibilityLabel="Share"
                >
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
                  accessibilityLabel="Save"
                >
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

      {/* ────────────────── REUSABLE MODALS ────────────────── */}
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

      <PostActionMenuModal
        visible={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        post={currentPost}
        isAuthor={isAuthor}
        hasSaved={hasSaved}
        onEdit={() => {
          closePhotoViewer();
          if (
            currentPost.type === 'BLOOD_REQUEST' ||
            Boolean(currentPost.bloodRequest) ||
            Boolean(currentPost.bloodRequestId)
          ) {
            openComposer({
              mode: 'BLOOD_REQUEST',
              editingPost: currentPost,
            });
          } else if (
            currentPost.type === 'DUA' ||
            Boolean(currentPost.dua) ||
            Boolean(currentPost.duaId)
          ) {
            openComposer({
              mode: 'DUA',
              editingPost: currentPost,
            });
          } else {
            openComposer({
              mode: 'TEXT',
              editingPost: currentPost,
            });
          }
        }}
        onDelete={() => setShowDeleteConfirm(true)}
        onToggleSave={handleToggleSave}
        onCopyLink={handleCopyLink}
        onOpenShare={() => setShowShareModal(true)}
        onReport={() => setShowReportModal(true)}
      />

      <PostShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={currentPost}
      />

      <EditPostModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={currentPost}
        onSuccess={(updated) => setCurrentPost(updated)}
      />

      <ReportPostModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        post={currentPost}
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
        title={
          locale === 'bn' ? 'সেভ থেকে সরিয়ে ফেলবেন?' : 'Remove from Saved?'
        }
        subtitle={
          locale === 'bn'
            ? 'আপনি কি নিশ্চিত যে এই পোস্টটি আপনার সেভ করা তালিকা থেকে সরাতে চান?'
            : 'Are you sure you want to remove this post from your saved collection?'
        }
        confirmText={locale === 'bn' ? 'সরিয়ে ফেলুন' : 'Remove'}
        variant="danger"
      />
    </View>
  );
}
