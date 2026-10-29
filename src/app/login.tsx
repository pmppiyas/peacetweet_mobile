import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';

export default function LoginScreen() {
  const { locale, theme } = useUi();
  const { login, isLoggingIn } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    setErrorMessage('');

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage(
        locale === 'bn'
          ? 'অনুগ্রহ করে আপনার ইমেইল/ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন।'
          : 'Please provide your email/username and password.'
      );
      return;
    }

    try {
      await login({
        identifier: identifier.trim(),
        password,
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (locale === 'bn'
          ? 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করে পুনরায় চেষ্টা করুন।'
          : 'Login failed. Please verify your credentials.');
      setErrorMessage(
        Array.isArray(msg) ? msg.join(', ') : String(msg)
      );
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      contentContainerClassName="flex-grow items-center justify-center px-3 py-6">
      {/* Compact Header matching peacetweet_frontend LoginView.tsx */}
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

      {/* Main Card matching LoginView.tsx */}
      <View className="w-full max-w-[380px] rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] shadow-xl p-5 gap-3">
        {errorMessage !== '' && (
          <View className="rounded-xl bg-red-50 p-2.5 border border-red-200 dark:bg-red-950/60 dark:border-red-900">
            <Text className="text-xs text-red-600 dark:text-red-300 font-semibold">
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Identifier Input */}
        <View className="gap-1">
          <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
            {locale === 'bn' ? 'ইমেইল বা ইউজারনেম' : 'Email or Username'}
          </Text>
          <View className="flex-row items-center rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#3a3b3c] dark:border-[#393a3b] px-3 h-10 gap-2">
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
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Password Input with Show/Hide toggle */}
        <View className="gap-1">
          <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
            {locale === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
          </Text>
          <View className="flex-row items-center rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#3a3b3c] dark:border-[#393a3b] px-3 h-10 gap-2">
            <AppIcon android="lock" size={16} color="#65676b" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="••••••••"
              placeholderTextColor={theme === 'dark' ? '#b0b3b8' : '#8e8e93'}
              className="flex-1 text-sm text-[#050505] dark:text-[#e4e6eb]"
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              className="p-1">
              <AppIcon
                android={showPassword ? 'visibility_off' : 'visibility'}
                size={16}
                color="#9ca3af"
              />
            </Pressable>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isLoggingIn}
          className={`w-full rounded-xl bg-primary-500 py-2.5 items-center flex-row justify-center gap-2 mt-1 ${
            isLoggingIn ? 'opacity-70' : 'active:bg-primary-600'
          }`}>
          {isLoggingIn && <ActivityIndicator size="small" color="#ffffff" />}
          <Text className="text-white font-bold text-sm">
            {isLoggingIn
              ? locale === 'bn'
                ? 'লগইন হচ্ছে...'
                : 'Logging in...'
              : locale === 'bn'
                ? 'লগইন করুন'
                : 'Log In'}
          </Text>
        </Pressable>

        {/* Divider & Create New Account matching LoginView.tsx */}
        <View className="pt-3 mt-1 border-t border-[#e4e6eb] dark:border-[#393a3b] items-center gap-2.5">
          <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn'
              ? 'PeaceTweet-এ এখনো অ্যাকাউন্ট নেই?'
              : "Don't have a PeaceTweet account?"}
          </Text>
          <Pressable
            onPress={() => router.push('/register')}
            className="w-full rounded-xl bg-emerald-600 py-2.5 items-center active:bg-emerald-700">
            <Text className="text-xs font-bold text-white">
              {locale === 'bn'
                ? 'নতুন অ্যাকাউন্ট তৈরি করুন'
                : 'Create New Account'}
            </Text>
          </Pressable>
        </View>
      </View>

      <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] text-center mt-3">
        {locale === 'bn'
          ? 'PeaceTweet — বিশুদ্ধ দোয়া ও পবিত্র সোশ্যাল প্ল্যাটফর্ম'
          : 'PeaceTweet — A Peaceful Islamic Social Platform'}
      </Text>
    </ScrollView>
  );
}
