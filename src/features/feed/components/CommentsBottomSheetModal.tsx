import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Animated,
  PanResponder,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { PostComment } from '@/features/feed/types/feed.types';
import { AppIcon } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { normalizeMediaUrl } from '@/features/uploads/api/uploads.api';

export interface CommentsBottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  commentCount: number;
  comments: PostComment[];
  isLoadingComments: boolean;
  commentText: string;
  onChangeCommentText: (text: string) => void;
  onSubmitComment: (parentId?: string | null) => void;
}

export function insertOptimisticComment(
  list: PostComment[],
  newComment: PostComment
): PostComment[] {
  if (!newComment.parentId) {
    return [newComment, ...list];
  }
  const addReply = (items: PostComment[]): PostComment[] =>
    items.map((item) => {
      if (item.id === newComment.parentId) {
        const nextReplies = [newComment, ...(item.replies || [])];
        return {
          ...item,
          replies: nextReplies,
          replyCount: nextReplies.length,
        };
      }
      if (item.replies && item.replies.length > 0) {
        return {
          ...item,
          replies: addReply(item.replies),
        };
      }
      return item;
    });
  return addReply(list);
}

export function resolveOptimisticComment(
  list: PostComment[],
  tempId: string,
  resolved?: PostComment
): PostComment[] {
  return list.map((item) => {
    if (item.id === tempId) {
      return resolved
        ? {
            ...resolved,
            replies: item.replies || resolved.replies || [],
            isPosting: false,
          }
        : { ...item, isPosting: false };
    }
    if (item.replies && item.replies.length > 0) {
      return {
        ...item,
        replies: resolveOptimisticComment(item.replies, tempId, resolved),
      };
    }
    return item;
  });
}

export function removeOptimisticComment(
  list: PostComment[],
  tempId: string
): PostComment[] {
  return list
    .filter((item) => item.id !== tempId)
    .map((item) => {
      if (item.replies && item.replies.length > 0) {
        const nextReplies = removeOptimisticComment(item.replies, tempId);
        return {
          ...item,
          replies: nextReplies,
          replyCount: nextReplies.length,
        };
      }
      return item;
    });
}

function formatCommentTimeAgo(dateStr?: string, locale: 'bn' | 'en' = 'en'): string {
  if (!dateStr) return locale === 'bn' ? 'এখনই' : 'now';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMin < 1) return locale === 'bn' ? 'এখনই' : 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 52) return `${diffWeeks}w`;
  return `${Math.floor(diffDays / 365)}y`;
}

function CommentTreeItem({
  comment,
  locale,
  isDark,
  depth = 0,
  activeReplyId,
  onSelectReply,
}: {
  comment: PostComment;
  locale: 'bn' | 'en';
  isDark: boolean;
  depth?: number;
  activeReplyId?: string | null;
  onSelectReply: (target: PostComment) => void;
}) {
  const timeLabel = formatCommentTimeAgo(comment.createdAt, locale);
  const replies = comment.replies || [];
  const isReplyTarget = activeReplyId === comment.id;

  return (
    <View style={{ width: '100%' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          paddingVertical: 4,
          paddingHorizontal: 6,
          borderRadius: 10,
          backgroundColor: isReplyTarget
            ? isDark
              ? 'rgba(10, 102, 194, 0.16)'
              : 'rgba(10, 102, 194, 0.08)'
            : 'transparent',
        }}>
        <UserAvatar
          avatarUrl={normalizeMediaUrl(
            comment.author?.avatar || (comment.author as any)?.avatarUrl
          )}
          name={comment.author?.name || 'User'}
          size={depth > 0 ? 'sm' : 'md'}
        />
        <View style={{ flex: 1, paddingTop: 1 }}>
          <View className="flex-row items-center flex-wrap gap-1.5">
            <Text
              selectable={false}
              className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb] select-none">
              {comment.author?.name || 'User'}
            </Text>
            {!!timeLabel && (
              <Text
                selectable={false}
                className="text-[11px] font-normal text-[#65676b] dark:text-[#b0b3b8] select-none">
                {timeLabel}
              </Text>
            )}
            {comment.isPosting && (
              <View className="rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-primary-600 dark:text-primary-400">
                  {locale === 'bn' ? 'পোস্ট হচ্ছে...' : 'Posting...'}
                </Text>
              </View>
            )}
          </View>

          <Text
            selectable={true}
            className={`text-xs text-[#050505] dark:text-[#e4e6eb] mt-0.5 leading-4 select-text ${
              comment.isPosting ? 'opacity-70' : ''
            }`}>
            {comment.content}
          </Text>

          <View className="flex-row items-center gap-4 mt-1">
            <Pressable
              disabled={!!comment.isPosting}
              onPress={() => onSelectReply(comment)}
              className="py-0.5 active:opacity-70">
              <Text
                style={{
                  color: isReplyTarget
                    ? '#0A66C2'
                    : isDark
                      ? '#b0b3b8'
                      : '#65676b',
                }}
                className="text-[11px] font-semibold">
                {locale === 'bn' ? 'রিপ্লাই' : 'Reply'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {replies.length > 0 && (
        <View
          style={{
            marginLeft: depth === 0 ? 42 : 26,
            marginTop: 6,
            paddingLeft: 12,
            borderLeftWidth: 2,
            borderLeftColor: isDark ? '#393a3b' : '#dadde1',
            gap: 8,
          }}>
          {replies.map((reply) => (
            <CommentTreeItem
              key={reply.id}
              comment={reply}
              locale={locale}
              isDark={isDark}
              depth={depth + 1}
              activeReplyId={activeReplyId}
              onSelectReply={onSelectReply}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export function CommentsBottomSheetModal({
  visible,
  onClose,
  commentCount,
  comments,
  isLoadingComments,
  commentText,
  onChangeCommentText,
  onSubmitComment,
}: CommentsBottomSheetModalProps) {
  const { locale, theme } = useUi();
  const { height: windowHeight } = useWindowDimensions();
  const isDark = theme === 'dark';

  const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);
  const replyingToRef = useRef<PostComment | null>(null);
  const inputRef = useRef<any>(null);
  const scrollViewRef = useRef<any>(null);

  const fullHeight = windowHeight || 700;
  const translateY = useRef(new Animated.Value(fullHeight)).current;
  const scrollOffsetY = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const isDraggingSheet = useRef(false);
  const isClosingRef = useRef(false);

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, fullHeight],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      scrollOffsetY.current = 0;
      isDraggingSheet.current = false;
      touchStartY.current = null;
      translateY.setValue(fullHeight);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }).start();
    } else {
      replyingToRef.current = null;
      setReplyingTo(null);
    }
    // Only run when `visible` changes so keyboard resize (`fullHeight`) never resets the sheet
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSelectReply = (target: PostComment) => {
    replyingToRef.current = target;
    setReplyingTo(target);
    setTimeout(() => {
      inputRef.current?.focus?.();
    }, 50);
  };

  const handleCancelReply = () => {
    replyingToRef.current = null;
    setReplyingTo(null);
  };

  const handleSend = () => {
    if (!commentText.trim()) return;
    const activeTarget = replyingToRef.current || replyingTo;
    const parentId = activeTarget?.id || null;
    replyingToRef.current = null;
    setReplyingTo(null);
    onSubmitComment(parentId);
    if (!parentId) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo?.({ y: 0, animated: true });
      }, 50);
    }
  };

  const closeWithSlideDown = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    isDraggingSheet.current = false;
    touchStartY.current = null;

    Animated.timing(translateY, {
      toValue: fullHeight,
      duration: 180,
      useNativeDriver: false,
    }).start(() => {
      onClose();
    });
  };

  const snapBackToTop = () => {
    if (isClosingRef.current) return;
    Animated.spring(translateY, {
      toValue: 0,
      bounciness: 4,
      useNativeDriver: false,
    }).start();
  };

  // PanResponder for the top handle bar & header (always draggable downward)
  const headerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dy > 4 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        gs.dy > 4 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          translateY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 65 || gs.vy > 0.4) {
          closeWithSlideDown();
        } else {
          snapBackToTop();
        }
      },
      onPanResponderTerminate: () => {
        snapBackToTop();
      },
    })
  ).current;

  // PanResponder for the body/ScrollView: captures downward drag ONLY when scrolled to the very top (scrollOffsetY <= 2)
  const bodyPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gs) => {
        const isAtTop = scrollOffsetY.current <= 2;
        const isPullingDown =
          gs.dy > 8 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.2;
        return isAtTop && isPullingDown;
      },
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          translateY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 65 || gs.vy > 0.4) {
          closeWithSlideDown();
        } else {
          snapBackToTop();
        }
      },
      onPanResponderTerminate: () => {
        snapBackToTop();
      },
    })
  ).current;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    scrollOffsetY.current = y;
    // In iOS/mobile web overscroll bounce (y < -55), also trigger dismiss
    if (y < -65) {
      closeWithSlideDown();
    }
  };

  // Direct touch handlers on ScrollView so Web touch-drag at top also pulls down the modal smoothly
  const handleTouchStart = (e: any) => {
    const pageY = e?.nativeEvent?.pageY ?? e?.touches?.[0]?.pageY;
    if (typeof pageY === 'number' && scrollOffsetY.current <= 2) {
      touchStartY.current = pageY;
      isDraggingSheet.current = false;
    } else {
      touchStartY.current = null;
    }
  };

  const handleTouchMove = (e: any) => {
    if (touchStartY.current === null) return;
    if (scrollOffsetY.current > 2 && !isDraggingSheet.current) {
      touchStartY.current = null;
      return;
    }
    const pageY = e?.nativeEvent?.pageY ?? e?.touches?.[0]?.pageY;
    if (typeof pageY !== 'number') return;
    const dy = pageY - touchStartY.current;
    if (dy > 6) {
      isDraggingSheet.current = true;
      translateY.setValue(dy);
    } else if (isDraggingSheet.current && dy <= 0) {
      translateY.setValue(0);
    }
  };

  const handleTouchEnd = (e: any) => {
    if (!isDraggingSheet.current || touchStartY.current === null) {
      touchStartY.current = null;
      isDraggingSheet.current = false;
      return;
    }
    const pageY =
      e?.nativeEvent?.pageY ?? e?.changedTouches?.[0]?.pageY ?? touchStartY.current;
    const dy = pageY - touchStartY.current;
    touchStartY.current = null;
    isDraggingSheet.current = false;
    if (dy > 65) {
      closeWithSlideDown();
    } else {
      snapBackToTop();
    }
  };

  const sheetHeight = windowHeight || '100%';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeWithSlideDown}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'transparent',
          justifyContent: 'flex-end',
        }}>
        {/* Pinned light black backdrop overlay (fades in/out, does NOT slide from bottom) */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            opacity: backdropOpacity,
          }}>
          <Pressable
            style={{ flex: 1, width: '100%', height: '100%' }}
            onPress={closeWithSlideDown}
          />
        </Animated.View>

        {/* Animated wrapper using explicit inline styles so NativeWind never strips height/bg */}
        <Animated.View
          style={{
            flex: 1,
            width: '100%',
            maxWidth: 768,
            height: sheetHeight,
            alignSelf: 'center',
            transform: [{ translateY }],
          }}>
          <View
            style={{
              flex: 1,
              width: '100%',
              backgroundColor: isDark ? '#242526' : '#f5f6f8',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderTopWidth: 1,
              borderColor: isDark ? '#393a3b' : '#d9dde4',
              overflow: 'hidden',
            }}>
            {/* 1. Draggable Top Handle Bar + Header */}
            <View
              {...headerPanResponder.panHandlers}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: isDark ? '#393a3b' : '#d9dde4',
                backgroundColor: isDark ? '#242526' : '#f5f6f8',
              }}
              className="w-full select-none">
              {/* Center Drag Bar Pill */}
              <Pressable
                onPress={closeWithSlideDown}
                className="w-full items-center pt-3 pb-1.5">
                <View
                  style={{
                    width: 44,
                    height: 5,
                    borderRadius: 999,
                    backgroundColor: isDark ? '#5a5b5c' : '#bcc0c4',
                  }}
                />
              </Pressable>

              {/* Sheet Header Row */}
              <View className="flex-row items-center px-4 pt-1 pb-3">
                <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn'
                    ? `মন্তব্যসমূহ (${commentCount})`
                    : `Comments (${commentCount})`}
                </Text>
              </View>
            </View>

            {/* 2. Scrollable Comments List (pulls sheet down when at top & dragged down) */}
            <View
              {...bodyPanResponder.panHandlers}
              style={{ flex: 1, minHeight: 0 }}>
              <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingTop: 10,
                  paddingBottom: 4,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                scrollEventThrottle={16}
                onScroll={handleScroll}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}>
                {isLoadingComments ? (
                  <View className="gap-4 py-2">
                    {[1, 2, 3, 4].map((i) => (
                      <View key={i} className="flex-row items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                        <View className="flex-1 pt-0.5 gap-2">
                          <View className="flex-row items-center gap-2">
                            <Skeleton className="h-3 w-24 rounded-md" />
                            <Skeleton className="h-2.5 w-8 rounded-md" />
                          </View>
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
                  <View className="gap-3 pb-1">
                    {comments.map((c) => (
                      <CommentTreeItem
                        key={c.id}
                        comment={c}
                        locale={locale}
                        isDark={isDark}
                        depth={0}
                        activeReplyId={replyingTo?.id || null}
                        onSelectReply={handleSelectReply}
                      />
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>

            {/* 3. Fixed Bottom Add Comment / Reply Input Bar */}
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: isDark ? '#393a3b' : '#d9dde4',
                backgroundColor: isDark ? '#242526' : '#f5f6f8',
              }}>
              {replyingTo && (
                <View
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? '#393a3b' : '#e6e9ef',
                  }}
                  className="px-4 py-1.5 flex-row items-center justify-between bg-[#f7f8fa] dark:bg-[#1e1f20]">
                  <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn' ? 'রিপ্লাই দিচ্ছেন ' : 'Replying to '}
                    <Text className="font-bold text-[#050505] dark:text-[#e4e6eb]">
                      {replyingTo.author?.name || 'User'}
                    </Text>
                  </Text>
                  <Pressable
                    onPress={handleCancelReply}
                    className="p-1 active:opacity-70">
                    <AppIcon
                      android="close"
                      size={14}
                      color={isDark ? '#b0b3b8' : '#65676b'}
                    />
                  </Pressable>
                </View>
              )}

              <View className="px-4 py-3 flex-row items-center gap-2">
                <TextInput
                  ref={inputRef}
                  value={commentText}
                  onChangeText={onChangeCommentText}
                  onSubmitEditing={handleSend}
                  placeholder={
                    replyingTo
                      ? locale === 'bn'
                        ? `${replyingTo.author?.name || 'User'}-কে রিপ্লাই লিখুন...`
                        : `Reply to ${replyingTo.author?.name || 'User'}...`
                      : locale === 'bn'
                        ? 'মন্তব্য লিখুন...'
                        : 'Write a comment...'
                  }
                  placeholderTextColor="#8e8e93"
                  className="flex-1 h-10 rounded-full bg-[#e6e9ef] dark:bg-[#3a3b3c] px-4 text-xs text-[#050505] dark:text-[#e4e6eb]"
                />
                <Pressable
                  disabled={!commentText.trim()}
                  onPress={handleSend}
                  className={`h-10 w-10 rounded-full items-center justify-center ${
                    commentText.trim()
                      ? 'bg-[#0A66C2]'
                      : 'bg-gray-200 dark:bg-gray-800'
                  }`}>
                  <AppIcon
                    android="send"
                    ios="paperplane.fill"
                    size={16}
                    color={commentText.trim() ? '#ffffff' : '#9ca3af'}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
