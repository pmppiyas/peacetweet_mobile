import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { AuthPromptScreen } from '@/components/ui/AuthPromptCard';
import { ProfileView } from '@/features/profile/components/ProfileView';
import { ProfileSkeleton } from '@/features/profile/components/ProfileSkeleton';
import { ProfileTab } from '@/features/profile/types/profile.types';

export default function ProfileScreen() {
  const { user, isAuthenticated, refreshUser, isLoading } = useAuth();
  const params = useLocalSearchParams<{ tab?: string }>();

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthPromptScreen
        icon="person"
        iconBgColor="bg-primary-50 dark:bg-primary-950/60"
        iconColor="#1877f2"
        titleBn="প্রোফাইল দেখতে লগইন করুন"
        titleEn="Sign in to view your Profile"
        descriptionBn="আপনার পোস্ট, সংরক্ষিত দোয়া এবং প্রোফাইল তথ্য দেখতে অ্যাকাউন্টে প্রবেশ করুন।"
        descriptionEn="Log in to access your profile, personal posts, saved Duas, and account settings."
      />
    );
  }

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

  return (
    <View className="flex-1 bg-[#e6e9ef] dark:bg-[#18191a]">
      <ProfileView
        targetUser={user}
        initialTab={initialTab}
        onRefreshProfile={refreshUser}
        showBackButton={false}
      />
    </View>
  );
}
