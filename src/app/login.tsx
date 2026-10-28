import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';

export default function LoginScreen() {
  const { locale, theme } = useUi();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      contentContainerClassName="flex-grow items-center justify-center px-4 py-8">
      {/* Header matching LoginView.tsx */}
      <View className="items-center mb-4">
        <Pressable onPress={() => router.push('/')}>
          <Text className="text-3xl font-black text-primary-600 dark:text-primary-400 mb-1">
            PeaceTweet
          </Text>
        </Pressable>
        <Text className="text-sm font-semibold text-[#65676b] dark:text-[#b0b3b8]">
          {locale === 'bn'
            ? 'আপনার অ্যাকাউন্টে লগইন করুন'
            : 'Sign in to your account'}
        </Text>
      </View>

      {/* Main Card */}
      <View className="w-full max-w-[380px] rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-5 gap-3">
        <View className="gap-1">
          <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
            {locale === 'bn' ? 'ইমেইল বা ইউজারনেম' : 'Email or Username'}
          </Text>
          <View className="flex-row items-center rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#3a3b3c] dark:border-[#393a3b] px-3 py-2.5 gap-2">
            <AppIcon android="mail" size={16} color="#65676b" />
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder={
                locale === 'bn'
                  ? 'আপনার ইমেইল বা ইউজারনেম'
                  : 'email@example.com or username'
              }
              placeholderTextColor={theme === 'dark' ? '#b0b3b8' : '#8e8e93'}
              className="flex-1 text-sm text-[#050505] dark:text-[#e4e6eb]"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View className="gap-1">
          <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
            {locale === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
          </Text>
          <View className="flex-row items-center rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#3a3b3c] dark:border-[#393a3b] px-3 py-2.5 gap-2">
            <AppIcon android="lock" size={16} color="#65676b" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={theme === 'dark' ? '#b0b3b8' : '#8e8e93'}
              className="flex-1 text-sm text-[#050505] dark:text-[#e4e6eb]"
            />
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/')}
          className="w-full rounded-xl bg-primary-500 py-2.5 items-center mt-1">
          <Text className="text-white font-bold text-sm">
            {locale === 'bn' ? 'লগইন করুন' : 'Log In'}
          </Text>
        </Pressable>

        <View className="pt-3 border-t border-[#e4e6eb] dark:border-[#393a3b] items-center gap-2">
          <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn' ? 'নতুন অ্যাকাউন্ট খুলতে চান?' : "Don't have an account?"}
          </Text>
          <Pressable
            onPress={() => router.push('/register')}
            className="px-4 py-2 rounded-xl bg-emerald-600">
            <Text className="text-xs font-bold text-white">
              {locale === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create New Account'}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
