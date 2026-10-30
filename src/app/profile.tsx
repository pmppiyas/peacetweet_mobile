import React from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';

export default function ProfileScreen() {
  const { locale } = useUi();
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <ScrollView
        className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 16, paddingBottom: 20 }}>
        <View className="w-full max-w-[720px] mx-auto bg-white dark:bg-[#242526] rounded-2xl p-6 border border-[#e4e6eb] dark:border-[#393a3b] items-center">
          <View className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-950/60 items-center justify-center mb-3">
            <AppIcon android="person" size={28} color="#1877f2" />
          </View>
          <Text className="text-lg font-bold text-[#050505] dark:text-[#e4e6eb] mb-1">
            {locale === 'bn'
              ? 'প্রোফাইল দেখতে লগইন করুন'
              : 'Sign in to view your Profile'}
          </Text>
          <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center mb-4">
            {locale === 'bn'
              ? 'আপনার পোস্ট, সংরক্ষিত দোয়া এবং প্রোফাইল তথ্য দেখতে অ্যাকাউন্টে প্রবেশ করুন।'
              : 'Log in to access your posts, saved Duas, and profile settings.'}
          </Text>

          <View className="flex-row gap-2.5 w-full max-w-[280px]">
            <Pressable
              onPress={() => router.push('/login')}
              className="flex-1 rounded-xl bg-primary-500 py-2.5 items-center">
              <Text className="text-xs font-bold text-white">
                {locale === 'bn' ? 'লগইন করুন' : 'Log In'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/register')}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 items-center">
              <Text className="text-xs font-bold text-white">
                {locale === 'bn' ? 'রেজিস্টার' : 'Register'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20 }}>
      <View className="w-full max-w-[720px] mx-auto bg-white dark:bg-[#242526] rounded-2xl p-5 border border-[#e4e6eb] dark:border-[#393a3b] items-center">
        <View className="w-20 h-20 rounded-full bg-primary-500 items-center justify-center mb-3 shadow-sm">
          <Text className="text-white text-3xl font-black">
            {user.name?.charAt(0)?.toUpperCase() || 'P'}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5 mb-0.5">
          <Text className="text-xl font-bold text-[#050505] dark:text-[#e4e6eb]">
            {user.name}
          </Text>
          <AppIcon android="verified" size={16} color="#1877f2" />
        </View>

        <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mb-3">
          @{user.username || 'user'} • {user.email}
        </Text>

        {/* Info Chips */}
        <View className="flex-row flex-wrap justify-center gap-2 mb-4">
          {user.location && (
            <View className="flex-row items-center gap-1 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] px-3 py-1">
              <AppIcon android="location_on" size={14} color="#65676b" />
              <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb]">
                {user.location}
              </Text>
            </View>
          )}
          {user.bloodGroup && (
            <View className="flex-row items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/60 px-3 py-1">
              <AppIcon android="water_drop" size={14} color="#e11d48" />
              <Text className="text-xs font-bold text-rose-600 dark:text-rose-300">
                {user.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={logout}
          className="flex-row items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 dark:border-rose-900/60 dark:bg-rose-950/40">
          <AppIcon android="logout" size={16} color="#e11d48" />
          <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">
            {locale === 'bn' ? 'লগআউট করুন' : 'Log Out'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
