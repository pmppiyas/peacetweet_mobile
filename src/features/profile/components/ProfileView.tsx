import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Share,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useFeed } from '@/providers/FeedProvider';
import { feedApi } from '@/features/feed/api/feed.api';
import { AppIcon } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FeedPostCard } from '@/features/feed/components/FeedPostCard';
import { FeedItem } from '@/features/feed/types/feed.types';
import { FriendItem } from '@/features/friends/types/friends.types';
import { GroupItem } from '@/features/groups/types/groups.types';
import { SavedFeedItem } from '@/types/saved.types';
import { profileApi } from '../api/profile.api';
import { friendsApi } from '@/features/friends/api/friends.api';
import { bookmarkApi } from '@/features/bookmark/api/bookmark.api';
import {
  UserProfileResponse,
  ProfileTab,
  FriendshipStatus,
} from '../types/profile.types';
import { User, BloodGroup, UserBadge } from '@/types/user.types';
import { Skeleton } from '@/components/ui/Skeleton';
import { PostCardSkeleton } from './ProfileSkeleton';
import { PhotoEditorModal, PhotoEditorMode } from './PhotoEditorModal';
import {
  uploadsApi,
  normalizeMediaUrl,
} from '@/features/uploads/api/uploads.api';
import { queryCache } from '@/lib/cache/queryCache';

export function formatProfileDate(
  dateStr?: string | null,
  locale: 'bn' | 'en' = 'en'
): string {
  if (!dateStr) return locale === 'bn' ? 'আজ' : 'Today';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const monthsEn = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthsBn = [
      'জানুয়ারি',
      'ফেব্রুয়ারি',
      'মার্চ',
      'এপ্রিল',
      'মে',
      'জুন',
      'জুলাই',
      'আগস্ট',
      'সেপ্টেম্বর',
      'অক্টোবর',
      'নভেম্বর',
      'ডিসেম্বর',
    ];
    const m = locale === 'bn' ? monthsBn[d.getMonth()] : monthsEn[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    return `${m} ${day}, ${year}`;
  } catch {
    return dateStr;
  }
}

const formatBloodGroup = (bg?: BloodGroup | string | null): string | null => {
  if (!bg) return null;
  const map: Record<string, string> = {
    A_POSITIVE: 'A+',
    A_NEGATIVE: 'A-',
    B_POSITIVE: 'B+',
    B_NEGATIVE: 'B-',
    AB_POSITIVE: 'AB+',
    AB_NEGATIVE: 'AB-',
    O_POSITIVE: 'O+',
    O_NEGATIVE: 'O-',
  };
  return map[bg] || bg;
};

export interface ProfileViewProps {
  targetUser?: UserProfileResponse | User | null;
  initialTab?: ProfileTab;
  onRefreshProfile?: () => Promise<void>;
  showBackButton?: boolean;
}

export function ProfileView({
  targetUser,
  initialTab = 'overview',
  onRefreshProfile,
  showBackButton = false,
}: ProfileViewProps) {
  const { locale, theme } = useUi();
  const { user: authUser, isAuthenticated, setUser } = useAuth();
  const { items: feedItems, refreshFeed } = useFeed();

  const isOwner = Boolean(
    !targetUser ||
    (authUser &&
      targetUser &&
      (authUser.id === targetUser.id ||
        authUser.username?.toLowerCase() ===
          targetUser.username?.toLowerCase()))
  );

  const displayUser = isOwner ? authUser || targetUser : targetUser || authUser;

  // Tabs
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);

  // Bio state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(displayUser?.bio || '');
  const [isSavingBio, setIsSavingBio] = useState(false);

  // Friendship action state
  const initialFriendship = (displayUser as UserProfileResponse)?.friendship;
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>(
    initialFriendship?.status || 'NONE'
  );
  const [requestId, setRequestId] = useState<string | null>(
    initialFriendship?.requestId || null
  );
  const [isFriendActionLoading, setIsFriendActionLoading] = useState(false);
  const [unfriendConfirmVisible, setUnfriendConfirmVisible] = useState(false);

  // Data states
  const [posts, setPosts] = useState<FeedItem[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(false);

  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [totalFriends, setTotalFriends] = useState(0);
  const [isFriendsLoading, setIsFriendsLoading] = useState(false);

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [isGroupsLoading, setIsGroupsLoading] = useState(false);

  const [savedItems, setSavedItems] = useState<SavedFeedItem[]>([]);
  const [isSavedLoading, setIsSavedLoading] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Direct Cover & Avatar Photo Editor states
  const [photoEditorMode, setPhotoEditorMode] =
    useState<PhotoEditorMode>('cover');
  const [photoEditorSrc, setPhotoEditorSrc] = useState<string | null>(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [photoMenuType, setPhotoMenuType] = useState<PhotoEditorMode | null>(
    null
  );

  // Sync bio input if user changes
  useEffect(() => {
    setBioInput(displayUser?.bio || '');
  }, [displayUser?.bio]);

  // Sync friendship status if targetUser changes
  useEffect(() => {
    const fs = (displayUser as UserProfileResponse)?.friendship;
    if (fs) {
      setFriendshipStatus(fs.status || 'NONE');
      setRequestId(fs.requestId || null);
    }
  }, [displayUser]);

  // Fetch posts for user
  const fetchPosts = useCallback(async () => {
    if (!displayUser?.id) return;
    setIsPostsLoading(true);
    try {
      const items = await profileApi.getUserPosts(displayUser.id);
      items.forEach((p) => {
        if (p?.id) {
          queryCache.set(`post:detail:${p.id}`, p);
        }
      });
      setPosts(items);
    } catch {
      // ignore
    } finally {
      setIsPostsLoading(false);
    }
  }, [displayUser?.id]);

  // Fetch friends for user
  const fetchFriends = useCallback(async () => {
    if (!displayUser?.id) return;
    setIsFriendsLoading(true);
    try {
      const { items, total } = await profileApi.getUserFriends(
        isOwner ? undefined : displayUser.id
      );
      setFriends(items);
      setTotalFriends(total || items.length);
    } catch {
      // ignore
    } finally {
      setIsFriendsLoading(false);
    }
  }, [displayUser?.id, isOwner]);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    setIsGroupsLoading(true);
    try {
      const items = await profileApi.getUserGroups();
      setGroups(items);
    } catch {
      // ignore
    } finally {
      setIsGroupsLoading(false);
    }
  }, []);

  // Fetch saved items (only for owner)
  const fetchSaved = useCallback(async () => {
    if (!isOwner || !isAuthenticated) return;
    setIsSavedLoading(true);
    try {
      const res = await bookmarkApi.getSavedItems();
      const items = (res as any)?.data || (Array.isArray(res) ? res : []);
      setSavedItems(items);
    } catch {
      // ignore
    } finally {
      setIsSavedLoading(false);
    }
  }, [isOwner, isAuthenticated]);

  // Initial load
  useEffect(() => {
    fetchPosts();
    fetchFriends();
    fetchGroups();
    if (isOwner && isAuthenticated) {
      fetchSaved();
    }
  }, [
    fetchPosts,
    fetchFriends,
    fetchGroups,
    fetchSaved,
    isOwner,
    isAuthenticated,
  ]);

  // Pull to refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshProfile) {
        await onRefreshProfile();
      }
      await Promise.all([
        fetchPosts(),
        fetchFriends(),
        fetchGroups(),
        isOwner ? fetchSaved() : Promise.resolve(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Bio save
  const handleSaveBio = async () => {
    if (isSavingBio) return;
    setIsSavingBio(true);
    try {
      const updatedUser = await profileApi.updateProfile({
        bio: bioInput.trim() || null,
      });
      if (updatedUser) {
        setUser(updatedUser);
      }
      setIsEditingBio(false);
    } catch (err) {
      // ignore
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleCancelBio = () => {
    setBioInput(displayUser?.bio || '');
    setIsEditingBio(false);
  };

  // Friend actions
  const handleAddFriend = async () => {
    if (!displayUser?.id || isFriendActionLoading) return;
    setIsFriendActionLoading(true);
    try {
      const res = await friendsApi.sendFriendRequest(displayUser.id);
      setFriendshipStatus('PENDING_SENT');
      if (res?.data?.id) {
        setRequestId(res.data.id);
      }
    } catch {
      // ignore
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!requestId || isFriendActionLoading) return;
    setIsFriendActionLoading(true);
    try {
      await friendsApi.cancelFriendRequest(requestId);
      setFriendshipStatus('NONE');
      setRequestId(null);
    } catch {
      // ignore
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!requestId || isFriendActionLoading) return;
    setIsFriendActionLoading(true);
    try {
      await friendsApi.acceptFriendRequest(requestId);
      setFriendshipStatus('FRIENDS');
    } catch {
      // ignore
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!requestId || isFriendActionLoading) return;
    setIsFriendActionLoading(true);
    try {
      await friendsApi.rejectFriendRequest(requestId);
      setFriendshipStatus('NONE');
      setRequestId(null);
    } catch {
      // ignore
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const handleConfirmUnfriend = async () => {
    if (!displayUser?.id || isFriendActionLoading) return;
    setIsFriendActionLoading(true);
    setUnfriendConfirmVisible(false);
    try {
      await friendsApi.unfriend(displayUser.id);
      setFriendshipStatus('NONE');
      setRequestId(null);
    } catch {
      // ignore
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  // Direct Message click -> opens messenger chat
  const handleMessagePress = () => {
    if (!displayUser?.id) return;
    router.push({
      pathname: '/messages',
      params: { userId: displayUser.id },
    });
  };

  // Share profile
  const handleShareProfile = async () => {
    if (!displayUser?.username) return;
    const url = `https://peacetweet.com/${displayUser.username}`;
    try {
      if (
        typeof navigator !== 'undefined' &&
        (navigator as any).clipboard?.writeText
      ) {
        await (navigator as any).clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        await Share.share({
          message: `${displayUser.name} (@${displayUser.username}) on PeaceTweet: ${url}`,
          url,
        });
      }
    } catch {
      // ignore
    }
  };

  // Trigger file picker directly on the profile page -> opens PhotoEditorModal
  const triggerPhotoPicker = (mode: PhotoEditorMode) => {
    setPhotoMenuType(null);
    if (typeof document === 'undefined') return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';

    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const previewUrl = URL.createObjectURL(file);
      setPhotoEditorMode(mode);
      setPhotoEditorSrc(previewUrl);
      setIsPhotoEditorOpen(true);
    };

    document.body.appendChild(input);
    input.click();
    setTimeout(() => {
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    }, 1000);
  };

  // Open existing photo in PhotoEditorModal for reposition & resize
  const openRepositionEditor = (mode: PhotoEditorMode) => {
    setPhotoMenuType(null);
    const currentUrl =
      mode === 'avatar' ? displayUser?.avatarUrl : displayUser?.coverUrl;
    if (!currentUrl) {
      triggerPhotoPicker(mode);
      return;
    }
    setPhotoEditorMode(mode);
    setPhotoEditorSrc(normalizeMediaUrl(currentUrl));
    setIsPhotoEditorOpen(true);
  };

  // Handle click on Cover "Edit Cover" or Avatar camera button
  const handlePhotoActionPress = (mode: PhotoEditorMode) => {
    const currentUrl =
      mode === 'avatar' ? displayUser?.avatarUrl : displayUser?.coverUrl;
    if (currentUrl) {
      setPhotoMenuType((prev) => (prev === mode ? null : mode));
    } else {
      triggerPhotoPicker(mode);
    }
  };

  // Save cropped/repositioned photo to server, auto-create post, and update profile immediately
  const handleSaveEditedPhoto = async (
    croppedFile: File | Blob,
    filename: string
  ) => {
    if (isSavingPhoto) return;
    setIsSavingPhoto(true);
    try {
      const uploaded = await uploadsApi.uploadImage(croppedFile, filename);
      if (uploaded?.url) {
        const updatePayload =
          photoEditorMode === 'avatar'
            ? { avatarUrl: uploaded.url }
            : { coverUrl: uploaded.url };
        const updatedUser = await profileApi.updateProfile(updatePayload);
        const mergedUser = {
          ...(authUser || displayUser),
          ...(updatedUser || {}),
          ...updatePayload,
        } as User;
        setUser(mergedUser);
        await Promise.all([
          fetchPosts(),
          refreshFeed(),
          onRefreshProfile ? onRefreshProfile() : Promise.resolve(),
        ]);
      }
      setIsPhotoEditorOpen(false);
    } catch (err) {
      console.warn('Failed to save edited photo:', err);
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // Facebook-style: clicking Profile Picture or Cover Photo navigates INSTANTLY (0ms delay) to /post/[postId]
  const handleOpenPhotoPost = (mode: PhotoEditorMode) => {
    setPhotoMenuType(null);
    if (!displayUser) return;

    const rawUrl =
      mode === 'avatar' ? displayUser.avatarUrl : displayUser.coverUrl;
    const normalizedTarget = normalizeMediaUrl(rawUrl);
    if (!normalizedTarget || !rawUrl) return;

    const targetFilename = normalizedTarget.split('/').pop() || normalizedTarget;

    // 1. Check if a post with this photo already exists in user's posts or global feedItems
    const allKnownPosts = [...posts, ...feedItems];
    const existingPost = allKnownPosts.find(
      (p) =>
        Array.isArray(p.mediaUrls) &&
        p.mediaUrls.some((u) => {
          const norm = normalizeMediaUrl(u);
          return (
            norm === normalizedTarget ||
            (targetFilename.length > 6 && norm.endsWith(targetFilename))
          );
        })
    );

    if (existingPost) {
      // Pre-populate queryCache so /post/[id] renders in 0ms without any loading spinner
      queryCache.set(`post:detail:${existingPost.id}`, existingPost);
      router.push(`/post/${existingPost.id}` as any);
      return;
    }

    // 2. Construct instant post in memory and navigate IMMEDIATELY (0ms delay)
    const caption =
      mode === 'avatar' ? 'Updated profile picture' : 'Updated cover photo';
    const instantId = `photo-${mode}-${displayUser.id}`;

    const instantPost: FeedItem = {
      id: instantId,
      type: 'TEXT',
      content: caption,
      mediaUrls: [normalizedTarget],
      mediaLayout: 'COLLAGE',
      createdAt:
        displayUser.updatedAt ||
        displayUser.createdAt ||
        new Date().toISOString(),
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      author: {
        id: displayUser.id,
        name: displayUser.name,
        username: displayUser.username,
        avatar: normalizeMediaUrl(displayUser.avatarUrl) || null,
      },
      dua: null,
      stats: {
        reactionCount: 0,
        commentCount: 0,
        saveCount: 0,
        shareCount: 0,
      },
      viewer: {
        hasReacted: false,
        hasSaved: false,
      },
    };

    queryCache.set(`post:detail:${instantId}`, instantPost);
    router.push(`/post/${instantId}` as any);

    // Persist in background (non-blocking) if owner is logged in
    if (isOwner && isAuthenticated) {
      feedApi
        .createPost({
          type: 'TEXT',
          content: caption,
          mediaUrls: [rawUrl],
          mediaLayout: 'COLLAGE',
          visibility: 'PUBLIC',
        })
        .then((res) => {
          const created = ((res as any)?.data ?? res) as FeedItem;
          if (created && created.id) {
            queryCache.set(`post:detail:${instantId}`, created);
            queryCache.set(`post:detail:${created.id}`, created);
            setPosts((prev) => [created, ...prev]);
            refreshFeed();
          }
        })
        .catch(() => {});
    }
  };

  if (!displayUser) {
    return (
      <View className="flex-1 items-center justify-center p-8 bg-white dark:bg-[#18191a]">
        <AppIcon android="person" size={40} color="#65676b" />
        <Text className="text-sm font-bold text-[#65676b] dark:text-[#b0b3b8] mt-3">
          {locale === 'bn' ? 'ব্যবহারকারী পাওয়া যায়নি' : 'User not found'}
        </Text>
      </View>
    );
  }

  const bloodGroupLabel = formatBloodGroup(displayUser.bloodGroup);
  const resolvedCoverUrl = normalizeMediaUrl(displayUser.coverUrl);
  const resolvedAvatarUrl = normalizeMediaUrl(displayUser.avatarUrl);

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-[#18191a]"
      stickyHeaderIndices={[2]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#0866FF"
          colors={['#0866FF']}
        />
      }
    >
      {/* 1. Cover Photo Banner */}
      <View className="relative w-full h-44 sm:h-52 bg-gradient-to-r from-emerald-800 via-teal-700 to-primary-800 overflow-hidden">
        {resolvedCoverUrl ? (
          <Pressable
            onPress={() => handleOpenPhotoPost('cover')}
            className="w-full h-full active:opacity-95"
          >
            <Image
              source={{ uri: resolvedCoverUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </Pressable>
        ) : (
          <View className="absolute inset-0 bg-black/10" />
        )}

        {/* Back Button (if requested or viewing someone else) */}
        {showBackButton && (
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }}
            className="absolute top-3 left-3 z-30 h-9 w-9 rounded-full bg-black/50 items-center justify-center active:scale-95"
          >
            <AppIcon android="arrow_back" size={20} color="#ffffff" />
          </Pressable>
        )}

        {/* Share Button top right */}
        <Pressable
          onPress={handleShareProfile}
          className="absolute top-3 right-3 z-30 h-9 px-3 rounded-full bg-black/50 flex-row items-center gap-1.5 active:scale-95"
        >
          <AppIcon
            android={copiedLink ? 'check' : 'share'}
            size={16}
            color={copiedLink ? '#22c55e' : '#ffffff'}
          />
          <Text className="text-white text-xs font-bold">
            {copiedLink
              ? locale === 'bn'
                ? 'কপি হয়েছে'
                : 'Copied'
              : locale === 'bn'
                ? 'শেয়ার'
                : 'Share'}
          </Text>
        </Pressable>

        {/* Edit Cover Action Menu & Button for Owner */}
        {isOwner && (
          <>
            {photoMenuType === 'cover' && resolvedCoverUrl && (
              <View className="absolute bottom-12 right-3 z-40 rounded-xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] shadow-2xl overflow-hidden min-w-[190px]">
                <Pressable
                  onPress={() => triggerPhotoPicker('cover')}
                  className="flex-row items-center gap-2.5 px-3.5 py-2.5 border-b border-[#e6e9ef] dark:border-[#393a3b] active:bg-[#e6e9ef] dark:active:bg-[#3a3b3c]"
                >
                  <AppIcon android="photo_camera" size={16} color="#0866FF" />
                  <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'নতুন ছবি আপলোড' : 'Upload Photo'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => openRepositionEditor('cover')}
                  className="flex-row items-center gap-2.5 px-3.5 py-2.5 active:bg-[#e6e9ef] dark:active:bg-[#3a3b3c]"
                >
                  <AppIcon android="open_with" size={16} color="#059669" />
                  <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'পজিশন ও রিসাইজ' : 'Reposition & Resize'}
                  </Text>
                </Pressable>
              </View>
            )}

            <Pressable
              onPress={() => handlePhotoActionPress('cover')}
              className="absolute bottom-3 right-3 z-30 h-8 px-2.5 rounded-full bg-black/65 flex-row items-center gap-1 active:scale-95"
            >
              <AppIcon android="photo_camera" size={14} color="#ffffff" />
            </Pressable>
          </>
        )}
      </View>

      {/* 2. Profile Details & Bio & Action Buttons (Hero Card) */}
      <View className="w-full max-w-[768px] mx-auto bg-white dark:bg-[#242526] px-4 pb-4 border-b border-[#e4e6eb] dark:border-[#393a3b] items-center relative z-20">
        {/* Centered Avatar overlapping Cover Banner */}
        <View className="-mt-14 relative z-40 items-center">
          <View className="relative h-28 w-28">
            {/* Clicking the photo itself opens its Facebook-style Post View */}
            <Pressable
              onPress={() => {
                if (resolvedAvatarUrl) {
                  handleOpenPhotoPost('avatar');
                }
              }}
              className="h-28 w-28 rounded-full border-4 border-white dark:border-[#242526] bg-primary-600 shadow-md items-center justify-center overflow-hidden active:opacity-90"
            >
              {resolvedAvatarUrl ? (
                <Image
                  source={{ uri: resolvedAvatarUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-white text-4xl font-black">
                  {displayUser.name?.charAt(0)?.toUpperCase() || 'P'}
                </Text>
              )}
            </Pressable>

            {/* Clicking ONLY the camera icon opens the floating edit menu */}
            {isOwner && (
              <Pressable
                onPress={() => handlePhotoActionPress('avatar')}
                className="absolute bottom-0 right-0 z-20 h-8 w-8 rounded-full bg-primary-600 border-2 border-white dark:border-[#242526] items-center justify-center shadow-md active:scale-95"
              >
                <AppIcon android="photo_camera" size={15} color="#ffffff" />
              </Pressable>
            )}
          </View>

          {/* Floating Avatar Action Menu for Owner (absolute so it NEVER pushes content down) */}
          {isOwner && photoMenuType === 'avatar' && resolvedAvatarUrl && (
            <View
              style={{
                position: 'absolute',
                top: 118,
                zIndex: 100,
              }}
              className="rounded-xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] shadow-2xl overflow-hidden min-w-[195px]"
            >
              <Pressable
                onPress={() => triggerPhotoPicker('avatar')}
                className="flex-row items-center gap-2.5 px-3.5 py-2.5 border-b border-[#e6e9ef] dark:border-[#393a3b] active:bg-[#e6e9ef] dark:active:bg-[#3a3b3c]"
              >
                <AppIcon android="photo_camera" size={16} color="#0866FF" />
                <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'নতুন ছবি আপলোড' : 'Upload Photo'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => openRepositionEditor('avatar')}
                className="flex-row items-center gap-2.5 px-3.5 py-2.5 active:bg-[#e6e9ef] dark:active:bg-[#3a3b3c]"
              >
                <AppIcon android="open_with" size={16} color="#059669" />
                <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'পজিশন ও রিসাইজ' : 'Reposition & Resize'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Name & Verification Badge */}
        <View className="flex-row items-center justify-center gap-1.5 mt-2.5">
          <Text className="text-xl sm:text-2xl font-black text-[#050505] dark:text-[#e4e6eb] tracking-tight text-center">
            {displayUser.name}
          </Text>
          <AppIcon
            android="verified_user"
            size={18}
            color={
              displayUser.userStatus === 'VERIFIED'
                ? '#0866FF'
                : displayUser.userStatus === 'PREMIUM'
                  ? '#d97706'
                  : theme === 'dark'
                    ? '#b0b3b8'
                    : '#65676b'
            }
          />
        </View>

        {/* @username */}
        <Text className="text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 mt-0.5">
          @{displayUser.username || 'user'}
        </Text>

        {/* Badges Row (Special Badges & Blood Group only) */}
        {((displayUser.badges &&
          displayUser.badges.some(
            (b: UserBadge) =>
              b.name !== 'STANDARD MEMBER' &&
              b.name !== 'NON VERIFIED' &&
              b.name !== 'VERIFIED'
          )) ||
          Boolean(bloodGroupLabel)) && (
          <View className="flex-row flex-wrap items-center justify-center gap-1.5 mt-2.5">
            {/* Dynamic Badges */}
            {displayUser.badges
              ?.filter(
                (b: UserBadge) =>
                  b.name !== 'STANDARD MEMBER' &&
                  b.name !== 'NON VERIFIED' &&
                  b.name !== 'VERIFIED'
              )
              .map((b: UserBadge) => (
                <View
                  key={b.id || b.name}
                  className="flex-row items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 border border-emerald-200 dark:border-emerald-800">
                  <AppIcon android="how_to_reg" size={13} color="#059669" />
                  <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    {b.name}
                  </Text>
                </View>
              ))}

            {/* Blood Group */}
            {bloodGroupLabel && (
              <View className="flex-row items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 border border-rose-200 dark:border-rose-900">
                <AppIcon android="water_drop" size={13} color="#e11d48" />
                <Text className="text-[11px] font-bold text-rose-600 dark:text-rose-300">
                  Blood: {bloodGroupLabel}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Bio Section */}
        <View className="w-full max-w-md mt-3 items-center">
          {isEditingBio && isOwner ? (
            <View className="w-full rounded-2xl bg-[#e6e9ef] dark:bg-[#3a3b3c]/60 p-3 border border-[#e4e6eb] dark:border-[#393a3b]">
              <TextInput
                value={bioInput}
                onChangeText={setBioInput}
                maxLength={160}
                placeholder={
                  locale === 'bn'
                    ? 'নিজের সম্পর্কে কিছু লিখুন...'
                    : 'Describe yourself in a few words...'
                }
                placeholderTextColor="#65676b"
                multiline
                numberOfLines={3}
                className="w-full rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-[#242526] p-2.5 text-xs text-[#050505] dark:text-[#e4e6eb] text-center"
              />
              <View className="flex-row items-center justify-between mt-2 px-1">
                <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                  {bioInput.length}/160
                </Text>
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={handleCancelBio}
                    disabled={isSavingBio}
                    className="rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] px-3 py-1.5 bg-white dark:bg-[#242526]"
                  >
                    <Text className="text-xs font-bold text-[#65676b] dark:text-[#b0b3b8]">
                      {locale === 'bn' ? 'বাতিল' : 'Cancel'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveBio}
                    disabled={isSavingBio}
                    className="rounded-xl px-3.5 py-1.5 bg-primary-600 flex-row items-center gap-1 shadow-sm"
                  >
                    {isSavingBio ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <AppIcon android="check" size={14} color="#ffffff" />
                        <Text className="text-xs font-bold text-white">
                          {locale === 'bn' ? 'সংরক্ষণ' : 'Save'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          ) : displayUser.bio ? (
            <View className="items-center px-4">
              <Text className="text-xs sm:text-sm text-[#050505] dark:text-[#e4e6eb] text-center leading-relaxed font-normal">
                {displayUser.bio}
              </Text>
              {isOwner && (
                <Pressable
                  onPress={() => {
                    setBioInput(displayUser.bio || '');
                    setIsEditingBio(true);
                  }}
                  className="mt-1.5 flex-row items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-950/60 px-3 py-1 border border-primary-200 dark:border-primary-800"
                >
                  <AppIcon android="edit" size={12} color="#0866FF" />
                  <Text className="text-[11px] font-bold text-primary-600 dark:text-primary-400">
                    {locale === 'bn' ? 'বায়ো সম্পাদনা' : 'Edit Bio'}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : isOwner ? (
            <Pressable
              onPress={() => {
                setBioInput('');
                setIsEditingBio(true);
              }}
              className="flex-row items-center gap-1.5 rounded-full border border-dashed border-primary-400 dark:border-primary-600 bg-primary-50/60 dark:bg-primary-950/40 px-4 py-1.5"
            >
              <AppIcon android="add" size={14} color="#0866FF" />
              <Text className="text-xs font-bold text-primary-600 dark:text-primary-300">
                {locale === 'bn' ? 'বায়ো যুক্ত করুন' : 'Add Bio'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Visitor Profile: Friendship & Message Action Buttons */}
        {!isOwner && (
          <View className="flex-row items-center justify-center gap-2 mt-4 flex-wrap">
            <>
              {friendshipStatus === 'NONE' && (
                <Pressable
                  onPress={handleAddFriend}
                  disabled={isFriendActionLoading}
                  className="flex-row items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 shadow-sm active:scale-95"
                >
                  {isFriendActionLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <AppIcon android="person_add" size={16} color="#ffffff" />
                      <Text className="text-xs font-bold text-white">
                        {locale === 'bn' ? 'বন্ধু যুক্ত করুন' : 'Add Friend'}
                      </Text>
                    </>
                  )}
                </Pressable>
              )}

              {friendshipStatus === 'PENDING_SENT' && (
                <Pressable
                  key="btn-pending-sent"
                  onPress={handleCancelRequest}
                  disabled={isFriendActionLoading}
                  className="flex-row items-center gap-1.5 rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] bg-[#e6e9ef] dark:bg-[#3a3b3c] px-4 py-2 active:scale-95"
                >
                  {isFriendActionLoading ? (
                    <ActivityIndicator size="small" color="#65676b" />
                  ) : (
                    <>
                      <AppIcon android="cancel" size={15} color="#65676b" />
                      <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                        {locale === 'bn' ? 'অনুরোধ বাতিল' : 'Cancel Request'}
                      </Text>
                    </>
                  )}
                </Pressable>
              )}

              {friendshipStatus === 'PENDING_RECEIVED' && (
                <>
                  <Pressable
                    key="btn-accept-request"
                    onPress={handleAcceptRequest}
                    disabled={isFriendActionLoading}
                    className="flex-row items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 active:scale-95"
                  >
                    {isFriendActionLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <AppIcon android="check" size={15} color="#ffffff" />
                        <Text className="text-xs font-bold text-white">
                          {locale === 'bn' ? 'গ্রহণ করুন' : 'Accept'}
                        </Text>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    key="btn-reject-request"
                    onPress={handleRejectRequest}
                    disabled={isFriendActionLoading}
                    className="flex-row items-center gap-1.5 rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] bg-[#e6e9ef] dark:bg-[#3a3b3c] px-3.5 py-2 active:scale-95"
                  >
                    <AppIcon android="close" size={15} color="#65676b" />
                    <Text className="text-xs font-bold text-[#65676b] dark:text-[#b0b3b8]">
                      {locale === 'bn' ? 'মুছুন' : 'Delete'}
                    </Text>
                  </Pressable>
                </>
              )}

              {friendshipStatus === 'FRIENDS' && (
                <Pressable
                  key="btn-unfriend"
                  onPress={() => setUnfriendConfirmVisible(true)}
                  disabled={isFriendActionLoading}
                  className="flex-row items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-4 py-2 active:scale-95"
                >
                  <AppIcon android="how_to_reg" size={16} color="#059669" />
                  <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {locale === 'bn' ? 'বন্ধু ✓' : 'Friends ✓'}
                  </Text>
                </Pressable>
              )}

              {/* Message button */}
              {isAuthenticated && (
                <Pressable
                  key="btn-message"
                  onPress={handleMessagePress}
                  className="flex-row items-center gap-1.5 rounded-xl bg-[#e4e6eb] dark:bg-[#3a3b3c] px-4 py-2 active:scale-95"
                >
                  <AppIcon android="chat_bubble" size={15} color="#050505" />
                  <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'মেসেজ' : 'Message'}
                  </Text>
                </Pressable>
              )}
            </>
          </View>
        )}
      </View>

      {/* 3. Sticky Segmented Tab Switcher */}
      <View className="bg-white dark:bg-[#242526] border-b border-[#e4e6eb] dark:border-[#393a3b] px-2 py-1.5">
        <View className="w-full max-w-[768px] mx-auto flex-row items-center justify-between gap-1">
          {/* Overview Tab */}
          <Pressable
            key="profile-tab-overview"
            onPress={() => setActiveTab('overview')}
            className={`flex-1 py-2 rounded-lg items-center justify-center flex-row gap-1 ${
              activeTab === 'overview'
                ? 'bg-[#0866FF]'
                : 'bg-transparent'
            }`}
          >
            <AppIcon
              android="person"
              size={15}
              color={activeTab === 'overview' ? '#ffffff' : '#65676b'}
            />
            <Text
              className={`text-xs font-bold ${
                activeTab === 'overview'
                  ? 'text-white'
                  : 'text-[#65676b] dark:text-[#b0b3b8]'
              }`}
            >
              {locale === 'bn' ? 'পরিচিতি' : 'Overview'}
            </Text>
          </Pressable>

          {/* Posts Tab */}
          <Pressable
            key="profile-tab-posts"
            onPress={() => setActiveTab('posts')}
            className={`flex-1 py-2 rounded-lg items-center justify-center flex-row gap-1 ${
              activeTab === 'posts'
                ? 'bg-[#0866FF]'
                : 'bg-transparent'
            }`}
          >
            <AppIcon
              android="article"
              size={15}
              color={activeTab === 'posts' ? '#ffffff' : '#65676b'}
            />
            <Text
              className={`text-xs font-bold ${
                activeTab === 'posts'
                  ? 'text-white'
                  : 'text-[#65676b] dark:text-[#b0b3b8]'
              }`}
            >
              {locale === 'bn' ? 'পোস্ট' : 'Posts'}
            </Text>
          </Pressable>

          {/* Friends Tab */}
          <Pressable
            key="profile-tab-friends"
            onPress={() => setActiveTab('friends')}
            className={`flex-1 py-2 rounded-lg items-center justify-center flex-row gap-1 ${
              activeTab === 'friends'
                ? 'bg-[#0866FF]'
                : 'bg-transparent'
            }`}
          >
            <AppIcon
              android="group"
              size={15}
              color={activeTab === 'friends' ? '#ffffff' : '#65676b'}
            />
            <Text
              className={`text-xs font-bold ${
                activeTab === 'friends'
                  ? 'text-white'
                  : 'text-[#65676b] dark:text-[#b0b3b8]'
              }`}
            >
              {locale === 'bn' ? 'বন্ধু' : 'Friends'}
            </Text>
            {totalFriends > 0 && (
              <Text
                className={`text-[10px] font-bold ${
                  activeTab === 'friends'
                    ? 'text-white/80'
                    : 'text-[#65676b] dark:text-[#b0b3b8]'
                }`}
              >
                ({totalFriends})
              </Text>
            )}
          </Pressable>

          {/* Groups Tab */}
          <Pressable
            key="profile-tab-groups"
            onPress={() => setActiveTab('groups')}
            className={`flex-1 py-2 rounded-lg items-center justify-center flex-row gap-1 ${
              activeTab === 'groups'
                ? 'bg-[#0866FF]'
                : 'bg-transparent'
            }`}
          >
            <AppIcon
              android="groups"
              size={15}
              color={activeTab === 'groups' ? '#ffffff' : '#65676b'}
            />
            <Text
              className={`text-xs font-bold ${
                activeTab === 'groups'
                  ? 'text-white'
                  : 'text-[#65676b] dark:text-[#b0b3b8]'
              }`}
            >
              {locale === 'bn' ? 'গ্রুপ' : 'Groups'}
            </Text>
          </Pressable>

          {/* Saved Tab (Only visible to Owner) */}
          {isOwner && (
            <Pressable
              key="profile-tab-saved"
              onPress={() => setActiveTab('saved')}
              className={`flex-1 py-2 rounded-lg items-center justify-center flex-row gap-1 ${
                activeTab === 'saved'
                  ? 'bg-[#0866FF]'
                  : 'bg-transparent'
              }`}
            >
              <AppIcon
                android="bookmark"
                size={15}
                color={activeTab === 'saved' ? '#ffffff' : '#65676b'}
              />
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'saved'
                    ? 'text-white'
                    : 'text-[#65676b] dark:text-[#b0b3b8]'
                }`}
              >
                {locale === 'bn' ? 'সংরক্ষিত' : 'Saved'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* 4. Tab Contents */}
      <View className="w-full max-w-[768px] mx-auto px-0 pb-3 mt-2">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <View className="space-y-2 gap-2">
            {/* Intro Details Card */}
            <View className="bg-white dark:bg-[#242526] p-4 border-y border-[#e4e6eb] dark:border-[#393a3b]">
              <Text className="text-base font-bold text-[#050505] dark:text-white mb-3">
                {locale === 'bn' ? 'পরিচিতি' : 'Introduce'}
              </Text>

              <View className="space-y-2.5 gap-2.5">
                {/* Location */}
                {displayUser.location && (
                  <View className="flex-row items-center gap-2.5">
                    <AppIcon android="location_on" size={18} color="#e11d48" />
                    <Text className="text-xs text-[#050505] dark:text-[#e4e6eb]">
                      <Text className="font-bold">{displayUser.location}</Text>
                    </Text>
                  </View>
                )}

                {/* Blood Group */}
                {bloodGroupLabel && (
                  <View className="flex-row items-center gap-2.5">
                    <AppIcon android="water_drop" size={18} color="#e11d48" />
                    <Text className="text-xs text-[#050505] dark:text-[#e4e6eb]">
                      {locale === 'bn' ? 'রক্তের গ্রুপ: ' : 'Blood Group: '}
                      <Text className="font-bold text-rose-600 dark:text-rose-400">
                        {bloodGroupLabel}
                      </Text>
                    </Text>
                  </View>
                )}

                {/* Joined Date */}
                <View className="flex-row items-center gap-2.5">
                  <AppIcon android="schedule" size={18} color="#65676b" />
                  <Text className="text-xs text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'যুক্ত হয়েছেন: ' : 'Joined: '}
                    <Text className="font-bold">
                      {formatProfileDate(displayUser.createdAt, locale)}
                    </Text>
                  </Text>
                </View>
              </View>

              {isOwner && (
                <Pressable
                  onPress={() => router.push('/settings/profile')}
                  className="mt-3.5 pt-3 border-t border-[#e6e9ef] dark:border-[#393a3b] items-center justify-center active:scale-98"
                >
                  <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">
                    {locale === 'bn'
                      ? 'প্রোফাইল তথ্য সম্পাদনা করুন'
                      : 'Edit profile details'}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Friends Preview (Grid of 6) */}
            <View className="bg-white dark:bg-[#242526] p-4 border-y border-[#e4e6eb] dark:border-[#393a3b]">
              <View className="flex-row items-center justify-between pb-2 mb-2 border-b border-[#e6e9ef] dark:border-[#393a3b]">
                <View>
                  <Text className="text-base font-bold text-[#050505] dark:text-white">
                    {locale === 'bn' ? 'বন্ধুরা' : 'Friends'}
                  </Text>
                  <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                    {totalFriends}{' '}
                    {locale === 'bn'
                      ? 'জন বন্ধু'
                      : totalFriends === 1
                        ? 'friend'
                        : 'friends'}
                  </Text>
                </View>
                {friends.length > 0 && (
                  <Pressable
                    onPress={() => setActiveTab('friends')}
                    className="px-2 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/60"
                  >
                    <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">
                      {locale === 'bn' ? 'সব দেখুন' : 'See all'}
                    </Text>
                  </Pressable>
                )}
              </View>

              {isFriendsLoading ? (
                <View className="flex-row flex-wrap justify-between gap-2 pt-1">
                  <Skeleton className="w-[30%] aspect-square rounded-xl" />
                  <Skeleton className="w-[30%] aspect-square rounded-xl" />
                  <Skeleton className="w-[30%] aspect-square rounded-xl" />
                </View>
              ) : friends.length === 0 ? (
                <View className="py-6 items-center justify-center">
                  <AppIcon android="group" size={28} color="#65676b" />
                  <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2 font-medium">
                    {locale === 'bn'
                      ? 'এখনো কোনো বন্ধু যুক্ত নেই'
                      : 'No friends yet'}
                  </Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap justify-between gap-2 pt-1">
                  {friends.slice(0, 6).map((f) => (
                    <Pressable
                      key={f.id}
                      onPress={() => router.push(`/${f.user.username}` as any)}
                      className="w-[30%] items-center mb-2 active:opacity-80"
                    >
                      <View className="w-full aspect-square rounded-xl bg-primary-500 overflow-hidden items-center justify-center shadow-xs border border-[#e4e6eb] dark:border-[#393a3b]">
                        {f.user.avatar || (f.user as any).avatarUrl ? (
                          <Image
                            source={{
                              uri: normalizeMediaUrl(
                                f.user.avatar || (f.user as any).avatarUrl
                              ),
                            }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <Text className="text-white font-bold text-base">
                            {f.user.name?.charAt(0) || 'U'}
                          </Text>
                        )}
                      </View>
                      <Text
                        numberOfLines={1}
                        className="text-[11px] font-bold text-[#050505] dark:text-[#e4e6eb] mt-1 text-center w-full"
                      >
                        {f.user.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Groups Preview */}
            <View className="bg-white dark:bg-[#242526] p-4 border-y border-[#e4e6eb] dark:border-[#393a3b]">
              <View className="flex-row items-center justify-between pb-2 mb-2 border-b border-[#e6e9ef] dark:border-[#393a3b]">
                <View>
                  <Text className="text-base font-bold text-[#050505] dark:text-white">
                    {locale === 'bn' ? 'গ্রুপসমূহ' : 'Groups'}
                  </Text>
                  <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                    {groups.length}{' '}
                    {locale === 'bn'
                      ? 'টি গ্রুপ'
                      : groups.length === 1
                        ? 'group'
                        : 'groups'}
                  </Text>
                </View>
                {groups.length > 0 && (
                  <Pressable
                    onPress={() => setActiveTab('groups')}
                    className="px-2 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/60"
                  >
                    <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">
                      {locale === 'bn' ? 'সব দেখুন' : 'See all'}
                    </Text>
                  </Pressable>
                )}
              </View>

              {isGroupsLoading ? (
                <View className="space-y-2 gap-2 pt-1">
                  <View className="flex-row items-center gap-3 p-2 rounded-xl bg-[#e6e9ef] dark:bg-[#3a3b3c]/50">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <View className="flex-1 space-y-1.5 gap-1.5">
                      <Skeleton className="h-3.5 w-32 rounded-md" />
                      <Skeleton className="h-2.5 w-20 rounded-md" />
                    </View>
                  </View>
                  <View className="flex-row items-center gap-3 p-2 rounded-xl bg-[#e6e9ef] dark:bg-[#3a3b3c]/50">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <View className="flex-1 space-y-1.5 gap-1.5">
                      <Skeleton className="h-3.5 w-28 rounded-md" />
                      <Skeleton className="h-2.5 w-16 rounded-md" />
                    </View>
                  </View>
                </View>
              ) : groups.length === 0 ? (
                <View className="py-6 items-center justify-center">
                  <AppIcon android="groups" size={28} color="#65676b" />
                  <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2 font-medium">
                    {locale === 'bn'
                      ? 'কোনো গ্রুপে যুক্ত হননি'
                      : 'No groups joined yet'}
                  </Text>
                </View>
              ) : (
                <View className="space-y-2 gap-2 pt-1">
                  {groups.slice(0, 3).map((group) => (
                    <Pressable
                      key={group.id}
                      onPress={() => router.push('/groups')}
                      className="flex-row items-center gap-3 p-2 rounded-xl bg-[#e6e9ef] dark:bg-[#3a3b3c]/50 active:opacity-80"
                    >
                      <View className="h-10 w-10 rounded-xl bg-teal-500 items-center justify-center overflow-hidden">
                        {group.avatarUrl ? (
                          <Image
                            source={{ uri: group.avatarUrl }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <Text className="text-white font-bold text-sm">
                            {group.name?.charAt(0) || 'G'}
                          </Text>
                        )}
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text
                          numberOfLines={1}
                          className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]"
                        >
                          {group.name}
                        </Text>
                        <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                          {group.memberCount}{' '}
                          {locale === 'bn' ? 'জন সদস্য' : 'members'}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Recent Posts Section inside Overview */}
            <View className="mt-0">
              <View className="bg-white dark:bg-[#242526] px-4 py-3 border-y border-[#e4e6eb] dark:border-[#393a3b] mb-2">
                <Text className="text-base font-bold text-[#050505] dark:text-white">
                  {locale === 'bn' ? 'সাম্প্রতিক পোস্ট' : 'Recent Posts'}
                </Text>
              </View>

              {isPostsLoading ? (
                <View className="space-y-2 gap-2">
                  <PostCardSkeleton />
                  <PostCardSkeleton />
                </View>
              ) : posts.length === 0 ? (
                <View className="bg-white dark:bg-[#242526] p-6 border-y border-[#e4e6eb] dark:border-[#393a3b] items-center justify-center">
                  <AppIcon android="article" size={28} color="#65676b" />
                  <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2 font-medium">
                    {locale === 'bn'
                      ? 'এখনো কোনো পোস্ট নেই'
                      : 'No posts published yet'}
                  </Text>
                </View>
              ) : (
                <View className="space-y-2 gap-2">
                  {posts.slice(0, 5).map((post) => (
                    <View
                      key={post.id}
                      className="border-y border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526] overflow-hidden"
                    >
                      <FeedPostCard post={post} />
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* POSTS TAB */}
        {activeTab === 'posts' && (
          <View className="space-y-2 gap-2">
            {isPostsLoading ? (
              <>
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </>
            ) : posts.length === 0 ? (
              <View className="bg-white dark:bg-[#242526] p-8 border-y border-[#e4e6eb] dark:border-[#393a3b] items-center justify-center">
                <AppIcon android="article" size={32} color="#65676b" />
                <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] mt-3">
                  {locale === 'bn' ? 'কোনো পোস্ট নেই' : 'No Posts Found'}
                </Text>
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center mt-1">
                  {locale === 'bn'
                    ? 'এই ব্যবহারকারী এখনো কোনো পোস্ট শেয়ার করেননি।'
                    : 'This user has not published any posts yet.'}
                </Text>
              </View>
            ) : (
              posts.map((post) => (
                <View
                  key={post.id}
                  className="border-y border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526] overflow-hidden"
                >
                  <FeedPostCard post={post} />
                </View>
              ))
            )}
          </View>
        )}

        {/* FRIENDS TAB */}
        {activeTab === 'friends' && (
          <View className="bg-white dark:bg-[#242526] p-4 border-y border-[#e4e6eb] dark:border-[#393a3b]">
            <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-[#e6e9ef] dark:border-[#393a3b]">
              <Text className="text-base font-bold text-[#050505] dark:text-white">
                {locale === 'bn' ? 'সকল বন্ধু' : 'All Friends'} ({totalFriends})
              </Text>
            </View>

            {isFriendsLoading ? (
              <View className="space-y-2 gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    className="flex-row items-center justify-between p-2.5 rounded-xl bg-[#e6e9ef] dark:bg-[#3a3b3c]/50"
                  >
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <Skeleton className="h-11 w-11 rounded-full" />
                      <View className="flex-1 space-y-1.5 gap-1.5">
                        <Skeleton className="h-3.5 w-32 rounded-md" />
                        <Skeleton className="h-2.5 w-24 rounded-md" />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : friends.length === 0 ? (
              <View className="py-8 items-center justify-center">
                <AppIcon android="group" size={32} color="#65676b" />
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2 font-medium text-center">
                  {locale === 'bn'
                    ? 'কোনো বন্ধু পাওয়া যায়নি।'
                    : 'No connected friends found.'}
                </Text>
              </View>
            ) : (
              <View className="space-y-2 gap-2">
                {friends.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(`/${item.user.username}` as any)}
                    className="flex-row items-center justify-between p-2.5 rounded-xl bg-[#e6e9ef] dark:bg-[#3a3b3c]/50 active:opacity-80"
                  >
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <UserAvatar
                        avatarUrl={
                          item.user.avatar || (item.user as any).avatarUrl
                        }
                        name={item.user.name}
                        size="md"
                      />
                      <View className="flex-1 min-w-0">
                        <Text
                          numberOfLines={1}
                          className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]"
                        >
                          {item.user.name}
                        </Text>
                        <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] truncate">
                          @{item.user.username}
                          {item.user.location ? ` • ${item.user.location}` : ''}
                        </Text>
                      </View>
                    </View>
                    <AppIcon
                      android="chevron_right"
                      size={16}
                      color="#65676b"
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* GROUPS TAB */}
        {activeTab === 'groups' && (
          <View className="bg-white dark:bg-[#242526] p-4 border-y border-[#e4e6eb] dark:border-[#393a3b]">
            <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-[#e6e9ef] dark:border-[#393a3b]">
              <Text className="text-base font-bold text-[#050505] dark:text-white">
                {locale === 'bn' ? 'গ্রুপসমূহ' : 'Groups'} ({groups.length})
              </Text>
            </View>

            {isGroupsLoading ? (
              <View className="space-y-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    className="flex-row items-center justify-between p-2.5 rounded-xl bg-[#e6e9ef] dark:bg-[#3a3b3c]/50"
                  >
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <Skeleton className="h-11 w-11 rounded-xl" />
                      <View className="flex-1 space-y-1.5 gap-1.5">
                        <Skeleton className="h-3.5 w-36 rounded-md" />
                        <Skeleton className="h-2.5 w-24 rounded-md" />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : groups.length === 0 ? (
              <View className="py-8 items-center justify-center">
                <AppIcon android="groups" size={32} color="#65676b" />
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2 font-medium text-center">
                  {locale === 'bn'
                    ? 'কোনো গ্রুপ পাওয়া যায়নি।'
                    : 'No groups joined yet.'}
                </Text>
              </View>
            ) : (
              <View className="space-y-2 gap-2">
                {groups.map((g) => (
                  <Pressable
                    key={g.id}
                    onPress={() => router.push('/groups')}
                    className="flex-row items-center justify-between p-2.5 rounded-xl bg-[#e6e9ef] dark:bg-[#3a3b3c]/50 active:opacity-80"
                  >
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <View className="h-11 w-11 rounded-xl bg-teal-500 items-center justify-center overflow-hidden">
                        {g.avatarUrl ? (
                          <Image
                            source={{ uri: g.avatarUrl }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <Text className="text-white font-bold text-sm">
                            {g.name?.charAt(0) || 'G'}
                          </Text>
                        )}
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text
                          numberOfLines={1}
                          className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]"
                        >
                          {g.name}
                        </Text>
                        <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] truncate">
                          {g.memberCount}{' '}
                          {locale === 'bn' ? 'জন সদস্য' : 'members'} •{' '}
                          {g.visibility === 'PUBLIC'
                            ? locale === 'bn'
                              ? 'পাবলিক'
                              : 'Public'
                            : locale === 'bn'
                              ? 'প্রাইভেট'
                              : 'Private'}
                        </Text>
                      </View>
                    </View>
                    <AppIcon
                      android="chevron_right"
                      size={16}
                      color="#65676b"
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* SAVED TAB (Owner only) */}
        {activeTab === 'saved' && isOwner && (
          <View className="bg-white dark:bg-[#242526] p-4 border-y border-[#e4e6eb] dark:border-[#393a3b]">
            <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-[#e6e9ef] dark:border-[#393a3b]">
              <Text className="text-base font-bold text-[#050505] dark:text-white">
                {locale === 'bn' ? 'সংরক্ষিত আইটেম' : 'Saved Items'} (
                {savedItems.length})
              </Text>
              {savedItems.length > 0 && (
                <Pressable
                  onPress={() => router.push('/saved')}
                  className="px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/60"
                >
                  <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">
                    {locale === 'bn' ? 'সম্পূর্ণ পাতা' : 'Full Page'}
                  </Text>
                </Pressable>
              )}
            </View>

            {isSavedLoading ? (
              <View className="space-y-2.5 gap-2.5">
                {[1, 2, 3].map((i) => (
                  <View
                    key={i}
                    className="p-3 rounded-xl bg-[#e6e9ef] dark:bg-[#3a3b3c]/50 border border-[#e4e6eb] dark:border-[#393a3b] space-y-2 gap-2"
                  >
                    <View className="flex-row items-center justify-between">
                      <Skeleton className="h-3.5 w-16 rounded-md" />
                      <Skeleton className="h-3.5 w-12 rounded-full" />
                    </View>
                    <Skeleton className="h-3.5 w-4/5 rounded-md" />
                  </View>
                ))}
              </View>
            ) : savedItems.length === 0 ? (
              <View className="py-8 items-center justify-center">
                <AppIcon android="bookmark" size={32} color="#65676b" />
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2 font-medium text-center">
                  {locale === 'bn'
                    ? 'কোনো সংরক্ষিত আইটেম নেই।'
                    : 'No saved items found.'}
                </Text>
              </View>
            ) : (
              <View className="space-y-2.5 gap-2.5">
                {savedItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push('/saved')}
                    className="p-3 rounded-xl bg-[#e6e9ef] dark:bg-[#3a3b3c]/50 border border-[#e4e6eb] dark:border-[#393a3b]"
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <View className="flex-row items-center gap-1.5">
                        <AppIcon
                          android={
                            item.type === 'DUA' ? 'menu_book' : 'article'
                          }
                          size={14}
                          color="#0866FF"
                        />
                        <Text className="text-[11px] font-bold text-primary-600 dark:text-primary-400">
                          {item.type}
                        </Text>
                      </View>
                      {item.timeSlot && (
                        <View className="rounded-full bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5">
                          <Text className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
                            {item.timeSlot}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      numberOfLines={2}
                      className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] mt-0.5"
                    >
                      {item.dua?.title ||
                        item.content ||
                        item.dua?.meaning ||
                        'Saved item'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Unfriend Confirm Dialog */}
      <ConfirmDialog
        isOpen={unfriendConfirmVisible}
        onClose={() => setUnfriendConfirmVisible(false)}
        onConfirm={handleConfirmUnfriend}
        title={locale === 'bn' ? 'বন্ধু তালিকা থেকে বাদ দিন' : 'Remove Friend'}
        description={
          locale === 'bn'
            ? `আপনি কি নিশ্চিত যে আপনি ${displayUser.name}-কে আপনার বন্ধু তালিকা থেকে বাদ দিতে চান?`
            : `Are you sure you want to remove ${displayUser.name} from your friends?`
        }
        confirmText={locale === 'bn' ? 'বাদ দিন' : 'Unfriend'}
        cancelText={locale === 'bn' ? 'বাতিল' : 'Cancel'}
        variant="danger"
        isLoading={isFriendActionLoading}
      />

      {/* Interactive Cover & Profile Photo Editor Modal (Reposition & Resize) */}
      <PhotoEditorModal
        isOpen={isPhotoEditorOpen}
        mode={photoEditorMode}
        imageSrc={photoEditorSrc}
        isSaving={isSavingPhoto}
        onClose={() => {
          if (!isSavingPhoto) {
            setIsPhotoEditorOpen(false);
          }
        }}
        onPickAnother={() => triggerPhotoPicker(photoEditorMode)}
        onSave={handleSaveEditedPhoto}
      />
    </ScrollView>
  );
}
