import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';

export default function RegisterScreen() {
  const { locale, theme } = useUi();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      contentContainerClassName="flex-grow items-center justify-center px-4 py-8">
      <View className="items-center mb-4">
        <Pressable onPress={() => router.push('/')}>
          <Text className="text-3xl font-black text-primary-600 dark:text-primary-400 mb-1">
            PeaceTweet
          </Text>
        </Pressable>
        <Text className="text-sm font-semibold text-[#65676b] dark:text-[#b0b3b8]">
          {locale === 'bn'
            ? 'নতুন অ্যাকাউন্ট তৈরি করুন'
            : 'Create your PeaceTweet account'}
        </Text>
      </View>

      <View className="w-full max-w-[380px] rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-5 gap-3">
        <View className="gap-1">
          <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
            {locale === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}
          </Text>
          <View className="flex-row items-center rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#3a3b3c] dark:border-[#393a3b] px-3 py-2.5 gap-2">
            <AppIcon android="person" size={16} color="#65676b" />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={locale === 'bn' ? 'আপনার নাম' : 'Your full name'}
              placeholderTextColor={theme === 'dark' ? '#b0b3b8' : '#8e8e93'}
              className="flex-1 text-sm text-[#050505] dark:text-[#e4e6eb]"
            />
          </View>
        </View>

        <View className="gap-1">
          <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
            {locale === 'bn' ? 'ইমেইল' : 'Email'}
          </Text>
          <View className="flex-row items-center rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#3a3b3c] dark:border-[#393a3b] px-3 py-2.5 gap-2">
            <AppIcon android="mail" size={16} color="#65676b" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
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
            {locale === 'bn' ? 'যোগ দিন (Sign Up)' : 'Sign Up'}
          </Text>
        </Pressable>

        <View className="pt-3 border-t border-[#e4e6eb] dark:border-[#393a3b] items-center">
          <Pressable onPress={() => router.push('/login')}>
            <Text className="text-xs font-semibold text-primary-600 dark:text-primary-400">
              {locale === 'bn'
                ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন'
                : 'Already have an account? Log In'}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
