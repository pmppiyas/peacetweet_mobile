import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, router, Redirect } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';
import { profileApi } from '@/features/profile/api/profile.api';
import { UserProfileResponse, ProfileTab } from '@/features/profile/types/profile.types';
import { ProfileView } from '@/features/profile/components/ProfileView';
import { ProfileSkeleton } from '@/features/profile/components/ProfileSkeleton';

const RESERVED_ROUTES = new Set([
  'categories',
  'duas',
  'friends',
  'groups',
  'search',
  'users',
  'profile',
  'saved',
  'settings',
  'notifications',
  'feedback',
  'purpose',
  'terms',
  'privacy',
  'blood',
  'messages',
  'message',
  'login',
  'register',
  'create',
  'explore',
  'admin',
  'auth',
  'api',
]);

export default function UserProfileScreen() {
  const { locale } = useUi();
  const { user: authUser } = useAuth();
  const params = useLocalSearchParams<{ username: string; tab?: string }>();
  const username = params.username?.toString() || '';

  // Reserved route redirection fallback
  const lowerUsername = username.toLowerCase();
  if (RESERVED_ROUTES.has(lowerUsername)) {
    if (lowerUsername === 'messages' || lowerUsername === 'message') {
      return <Redirect href="/messages" />;
    }
    if (lowerUsername === 'blood') {
      return <Redirect href="/blood" />;
    }
    if (lowerUsername === 'friends') {
      return <Redirect href="/friends" />;
    }
    if (lowerUsername === 'groups') {
      return <Redirect href="/groups" />;
    }
    if (lowerUsername === 'saved') {
      return <Redirect href="/saved" />;
    }
    if (lowerUsername === 'settings') {
      return <Redirect href="/settings" />;
    }
    if (lowerUsername === 'profile') {
      return <Redirect href="/profile" />;
    }
    if (lowerUsername === 'login') {
      return <Redirect href="/login" />;
    }
    if (lowerUsername === 'register') {
      return <Redirect href="/register" />;
    }
  }

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const isOwner = Boolean(
    authUser &&
      (authUser.username?.toLowerCase() === lowerUsername ||
        authUser.id === profile?.id)
  );

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await profileApi.getUserProfile(username);
      setProfile(data);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const tabParam = params.tab?.toLowerCase();
  const initialTab: ProfileTab =
    tabParam === 'posts' || tabParam === 'post'
      ? 'posts'
      : tabParam === 'friends' || tabParam === 'friend'
        ? 'friends'
        : tabParam === 'groups' || tabParam === 'group'
          ? 'groups'
          : tabParam === 'saved'
            ? 'saved'
            : 'overview';

  // Loading Skeleton State
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // Error / Not Found State
  if (isError || !profile) {
    return (
      <ScrollView className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]">
        <View className="p-4 pt-12 items-center">
          <View className="w-full max-w-[500px] bg-white dark:bg-[#242526] rounded-3xl p-8 border border-dashed border-[#e4e6eb] dark:border-[#393a3b] items-center text-center">
            <View className="h-16 w-16 rounded-full bg-rose-50 dark:bg-rose-950/60 items-center justify-center mb-4">
              <AppIcon android="person_off" size={32} color="#e11d48" />
            </View>

            <Text className="text-lg font-bold text-[#050505] dark:text-[#e4e6eb] text-center">
              {locale === 'bn' ? 'ব্যবহারকারী পাওয়া যায়নি' : 'User Not Found'}
            </Text>

            <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center mt-2 max-w-xs leading-relaxed">
              {locale === 'bn'
                ? `(@${username}) নামের কোনো অ্যাকাউন্ট খুঁজে পাওয়া যায়নি বা এটি মুছে ফেলা হয়েছে।`
                : `The account @${username} does not exist or has been deactivated.`}
            </Text>

            <View className="flex-row items-center gap-3 mt-6">
              <Pressable
                onPress={fetchProfile}
                className="px-4 py-2.5 rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] bg-[#f0f2f5] dark:bg-[#3a3b3c] active:scale-95">
                <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'আবার চেষ্টা করুন' : 'Try Again'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/')}
                className="px-5 py-2.5 rounded-xl bg-primary-600 shadow-sm active:scale-95">
                <Text className="text-xs font-bold text-white">
                  {locale === 'bn' ? 'হোম পেজে যান' : 'Go Home'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]">
      <ProfileView
        targetUser={isOwner ? authUser || profile : profile}
        initialTab={initialTab}
        onRefreshProfile={fetchProfile}
        showBackButton={true}
      />
    </View>
  );
}
