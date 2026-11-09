import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  Animated,
  PanResponder,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FeedItem } from '../types/feed.types';
import { normalizeMediaUrl } from '@/features/uploads/api/uploads.api';
import { AppIcon } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useUi } from '@/providers/UiProvider';

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
      strokeLinejoin="round">
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
      strokeLinejoin="round">
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
      strokeLinejoin="round">
      <Path d="m15 17 5-5-5-5" />
      <Path d="M4 18v-2a4 4 0 0 1 4-4h12" />
    </Svg>
  );
}

export interface PhotoViewerModalProps {
  visible: boolean;
  onClose: () => void;
  post: FeedItem;
  initialImageUrl?: string;
  hasReacted?: boolean;
  reactionCount?: number;
  commentCount?: number;
  hasSaved?: boolean;
  onToggleReaction?: () => void;
  onToggleSave?: () => void;
  onOpenComments?: () => void;
  onOpenShare?: () => void;
  onOpenActionMenu?: () => void;
}

export function PhotoViewerModal({
  visible,
  onClose,
  post,
  initialImageUrl,
  hasReacted = false,
  reactionCount = 0,
  commentCount = 0,
  hasSaved = false,
  onToggleReaction,
  onToggleSave,
  onOpenComments,
  onOpenShare,
  onOpenActionMenu,
}: PhotoViewerModalProps) {
  const { height } = useWindowDimensions();
  const { locale, theme } = useUi();

  const isDark = theme === 'dark';
  const primaryIconColor = isDark ? '#ffffff' : '#050505';
  const mutedColor = isDark ? '#b0b3b8' : '#65676b';

  const mediaList = (post?.mediaUrls || [])
    .filter((u) => typeof u === 'string' && u.trim().length > 0)
    .map((u) => normalizeMediaUrl(u));

  const [activeUrl, setActiveUrl] = useState<string>(() => {
    return initialImageUrl ? normalizeMediaUrl(initialImageUrl) : mediaList[0] || '';
  });

  useEffect(() => {
    if (initialImageUrl) {
      setActiveUrl(normalizeMediaUrl(initialImageUrl));
    } else if (mediaList.length > 0) {
      setActiveUrl(mediaList[0]);
    }
  }, [initialImageUrl, post?.mediaUrls]);

  const [aspectRatio, setAspectRatio] = useState<number>(4 / 3);

  useEffect(() => {
    if (!activeUrl) return;
    Image.getSize(
      activeUrl,
      (w, h) => {
        if (w > 0 && h > 0) {
          setAspectRatio(w / h);
        }
      },
      () => {}
    );
  }, [activeUrl]);

  // Smooth slide-down & fade-out animation values
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const isClosingRef = useRef(false);

  // Smooth animated exit into feed
  const handleAnimatedClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height || 800,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      // Reset values for next open
      translateY.setValue(0);
      opacity.setValue(1);
      isClosingRef.current = false;
    });
  }, [height, onClose, opacity, translateY]);

  // Web: Mouse wheel scroll down or Escape key triggers smooth exit into feed
  useEffect(() => {
    if (!visible) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleWheel = (e: WheelEvent) => {
        // User scrolls downwards -> smoothly exit to feed and continue scrolling
        if (e.deltaY > 15) {
          handleAnimatedClose();
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleAnimatedClose();
        }
      };

      window.addEventListener('wheel', handleWheel, { passive: true });
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [visible, handleAnimatedClose]);

  // Touch: PanResponder downwards swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          gestureState.dy > 8 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          const newOpacity = Math.max(0.4, 1 - gestureState.dy / 400);
          opacity.setValue(newOpacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 45 || gestureState.vy > 0.4) {
          handleAnimatedClose();
        } else {
          // Snap back
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              bounciness: 4,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  const authorName = post?.author?.name || 'User';
  const authorAvatar = normalizeMediaUrl(
    post?.author?.avatar || (post?.author as any)?.avatarUrl
  );
  const contentText = post?.content || '';
  const createdAtStr = post?.createdAt || '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleAnimatedClose}>
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateY }],
          opacity,
        }}
        {...panResponder.panHandlers}
        className="flex-1 bg-white/98 dark:bg-black/98 justify-between select-none">
        {/* ────────────────── 1. TOP HEADER BAR ────────────────── */}
        <View className="w-full max-w-[768px] mx-auto px-4 pt-3 pb-2 flex-row items-center justify-between z-20">
          {/* Close X Button: Smoothly exits and reveals feed */}
          <Pressable
            onPress={handleAnimatedClose}
            className="h-10 w-10 rounded-full items-center justify-center active:bg-black/5 dark:active:bg-white/10"
            accessibilityLabel="Exit to feed">
            <AppIcon android="close" size={24} color={primaryIconColor} />
          </Pressable>

          {/* Right Action Icons */}
          <View className="flex-row items-center gap-2">
            <View className="opacity-95 p-2">
              <AppIcon android="location_on" size={22} color={primaryIconColor} />
            </View>
            {onOpenActionMenu && (
              <Pressable
                onPress={onOpenActionMenu}
                className="h-10 w-10 rounded-full items-center justify-center active:bg-black/5 dark:active:bg-white/10">
                <AppIcon android="more_vert" size={22} color={primaryIconColor} />
              </Pressable>
            )}
          </View>
        </View>

        {/* ────────────────── 2. CENTER PHOTO VIEWPORT ────────────────── */}
        <View className="flex-1 items-center justify-center w-full max-w-[768px] mx-auto overflow-hidden px-2">
          {activeUrl ? (
            <Image
              source={{ uri: activeUrl }}
              onLoad={(e: any) => {
                const src = e?.nativeEvent?.source || e?.target;
                const nw = src?.width || src?.naturalWidth;
                const nh = src?.height || src?.naturalHeight;
                if (nw > 0 && nh > 0) {
                  setAspectRatio(nw / nh);
                }
              }}
              style={{
                width: '100%',
                aspectRatio,
                maxHeight: '100%',
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

        {/* ────────────────── 3. BOTTOM OVERLAY: Author & Actions ────────────────── */}
        <View className="w-full max-w-[768px] mx-auto px-4 pt-3 pb-5 bg-white dark:bg-black z-20">
          {/* Author Row */}
          <View className="flex-row items-center gap-3">
            <UserAvatar avatarUrl={authorAvatar} name={authorName} size="md" />

            <View className="flex-1">
              <Text className="text-[16px] font-bold text-[#050505] dark:text-white leading-tight">
                {authorName}
              </Text>

              <View className="flex-row items-center gap-1.5 mt-0.5">
                <Text className="text-[11.5px] font-medium text-[#65676b] dark:text-[#b0b3b8]">
                  {formatFacebookPhotoDate(createdAtStr)}
                </Text>
                <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                  •
                </Text>
                <AppIcon android="public" size={13} color={mutedColor} />
              </View>
            </View>
          </View>

          {/* Caption */}
          {contentText ? (
            <Text className="text-[15px] text-[#050505] dark:text-white mt-2.5 leading-5">
              {contentText}
            </Text>
          ) : null}

          {/* Action Buttons */}
          <View className="flex-row items-center justify-between mt-4 pt-1">
            <View className="flex-row items-center gap-6">
              {/* Like */}
              <Pressable
                onPress={onToggleReaction}
                className="flex-row items-center gap-1.5 py-1 active:scale-95">
                <ThumbLikeIcon
                  size={22}
                  color={hasReacted ? '#0A66C2' : primaryIconColor}
                  filled={hasReacted}
                />
                <Text
                  className={`text-[14px] font-semibold ${
                    hasReacted
                      ? 'text-[#0A66C2]'
                      : 'text-[#050505] dark:text-white'
                  }`}>
                  {reactionCount}
                </Text>
              </Pressable>

              {/* Comment */}
              <Pressable
                onPress={onOpenComments}
                className="flex-row items-center gap-1.5 py-1 active:scale-95">
                <CommentOutlineIcon size={21} color={primaryIconColor} />
                <Text className="text-[14px] font-semibold text-[#050505] dark:text-white">
                  {commentCount}
                </Text>
              </Pressable>

              {/* Share */}
              {onOpenShare && (
                <Pressable
                  onPress={onOpenShare}
                  className="flex-row items-center gap-1.5 py-1 active:scale-95">
                  <ShareArrowIcon size={23} color={primaryIconColor} />
                </Pressable>
              )}

              {/* Save */}
              {onToggleSave && (
                <Pressable
                  onPress={onToggleSave}
                  className="flex-row items-center gap-1.5 py-1 active:scale-95">
                  <AppIcon
                    android="bookmark"
                    size={20}
                    color={hasSaved ? '#0A66C2' : primaryIconColor}
                    filled={hasSaved}
                  />
                </Pressable>
              )}
            </View>

            {/* Reaction Pill */}
            <Pressable
              onPress={onToggleReaction}
              className="flex-row items-center active:opacity-80">
              <View className="h-5 w-5 rounded-full bg-[#0A66C2] items-center justify-center border border-white dark:border-black z-30">
                <Text className="text-[10px]">👍</Text>
              </View>
              <View className="h-5 w-5 rounded-full bg-rose-500 items-center justify-center border border-white dark:border-black -ml-1.5 z-20">
                <Text className="text-[10px]">❤️</Text>
              </View>
              <View className="h-5 w-5 rounded-full bg-amber-400 items-center justify-center border border-white dark:border-black -ml-1.5 z-10">
                <Text className="text-[10px]">🤲</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}
