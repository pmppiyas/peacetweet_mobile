import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import { PeaceTweetLogo } from '@/components/ui/PeaceTweetLogo';
import { useGoogleAuth } from '@/features/auth/hooks/useGoogleAuth';

export default function LoginScreen() {
  const { locale, theme } = useUi();
  const { login, isLoggingIn } = useAuth();
  const { promptGoogleSignIn, isLoading: isGoogleLoading } = useGoogleAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<
    'identifier' | 'password' | null
  >(null);
  const [errorMessage, setErrorMessage] = useState('');

  const isDark = theme === 'dark';
  const isBusy = isLoggingIn || isGoogleLoading;

  const handleSubmit = async () => {
    setErrorMessage('');

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage(
        locale === 'bn'
          ? 'অনুগ্রহ করে আপনার ইমেইল বা ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন।'
          : 'Please enter your email or username and password.'
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
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : String(msg));
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    try {
      await promptGoogleSignIn();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (locale === 'bn'
          ? 'Google লগইন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।'
          : 'Google sign-in failed. Please try again.');
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : String(msg));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white dark:bg-[#18191a]"
    >
      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        className="flex-1"
      >
        <View className="w-full max-w-[420px] mx-auto px-6 py-4 justify-center">
          {/* Top Bar with Back Button */}
          <View className="flex-row items-center justify-between mb-3">
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
              hitSlop={10}
              accessibilityLabel="Back"
              accessibilityRole="button"
              className="h-9 w-9 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#242526] active:bg-[#e4e6eb] dark:active:bg-[#3a3b3c]"
            >
              <AppIcon
                android="arrow_back"
                ios="arrow.left"
                size={18}
                color={isDark ? '#e4e6eb' : '#1e2329'}
              />
            </Pressable>
          </View>

          {/* Welcoming Hero & Brand Section */}
          <View className="mb-4">
            <View className="flex-row items-center gap-2.5 mb-1.5">
              <PeaceTweetLogo size={42} />
              <Pressable onPress={() => router.push('/')}>
                <Text className="text-[28px] font-black tracking-tight text-[#0866FF] dark:text-[#36a4fa]">
                  PeaceTweet
                </Text>
              </Pressable>
            </View>

            <Text className="text-[20px] font-bold text-[#1e2329] dark:text-[#e4e6eb]">
              {locale === 'bn' ? 'স্বাগতম!' : 'Welcome back'}
            </Text>
            <Text className="text-[12.5px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5 leading-snug">
              {locale === 'bn'
                ? 'আপনার অ্যাকাউন্টে সাইন ইন করুন এবং শান্তির বার্তা ছড়িয়ে দিন।'
                : 'Sign in to reconnect with authentic duas and reflections.'}
            </Text>
          </View>

          {/* Error Message Pill */}
          {errorMessage !== '' && (
            <View className="mb-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-2.5 flex-row items-center gap-2">
              <AppIcon android="error" size={16} color="#e11d48" />
              <Text className="flex-1 text-[12px] leading-snug text-rose-700 dark:text-rose-300 font-medium">
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Form Fields - Soft & Borderless (Zero Scroll Spacing) */}
          <View className="gap-2.5">
            {/* 1. Identifier Field */}
            <View>
              <Text className="text-[12px] font-semibold text-[#65676b] dark:text-[#b0b3b8] mb-1 ml-1">
                {locale === 'bn' ? 'ইমেইল বা ইউজারনেম' : 'Email or Username'}
              </Text>
              <View
                className={`h-11 rounded-2xl px-3.5 flex-row items-center gap-2.5 transition-all ${
                  focusedField === 'identifier'
                    ? 'bg-[#edf5ff] dark:bg-[#1a2744]'
                    : 'bg-[#f0f2f5] dark:bg-[#242526]'
                }`}
              >
                <AppIcon
                  android="mail"
                  size={18}
                  color={focusedField === 'identifier' ? '#0866FF' : '#8a8d91'}
                />
                <TextInput
                  value={identifier}
                  onChangeText={setIdentifier}
                  onFocus={() => setFocusedField('identifier')}
                  onBlur={() =>
                    setFocusedField((prev) =>
                      prev === 'identifier' ? null : prev
                    )
                  }
                  placeholder={
                    locale === 'bn'
                      ? 'নাম বা ইমেইল লিখুন'
                      : 'Enter username or email'
                  }
                  placeholderTextColor={isDark ? '#73767a' : '#8a8d91'}
                  className="flex-1 text-[14px] text-[#1e2329] dark:text-[#e4e6eb] py-0"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* 2. Password Field */}
            <View>
              <Text className="text-[12px] font-semibold text-[#65676b] dark:text-[#b0b3b8] mb-1 ml-1">
                {locale === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </Text>
              <View
                className={`h-11 rounded-2xl px-3.5 flex-row items-center gap-2.5 transition-all ${
                  focusedField === 'password'
                    ? 'bg-[#edf5ff] dark:bg-[#1a2744]'
                    : 'bg-[#f0f2f5] dark:bg-[#242526]'
                }`}
              >
                <AppIcon
                  android="lock"
                  size={18}
                  color={focusedField === 'password' ? '#0866FF' : '#8a8d91'}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() =>
                    setFocusedField((prev) =>
                      prev === 'password' ? null : prev
                    )
                  }
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor={isDark ? '#73767a' : '#8a8d91'}
                  className="flex-1 text-[14px] text-[#1e2329] dark:text-[#e4e6eb] py-0"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={8}
                  className="p-1"
                >
                  <AppIcon
                    android={showPassword ? 'visibility_off' : 'visibility'}
                    size={17}
                    color="#8a8d91"
                  />
                </Pressable>
              </View>
            </View>

            {/* 3. Primary Sign In Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={isBusy}
              className={`h-11 rounded-2xl bg-[#0866FF] items-center justify-center flex-row gap-2 mt-1 shadow-sm shadow-[#0866FF]/25 ${
                isBusy ? 'opacity-65' : 'active:opacity-90'
              }`}
            >
              {isLoggingIn && (
                <ActivityIndicator size="small" color="#ffffff" />
              )}
              <Text className="text-white font-bold text-[14.5px] select-none">
                {isLoggingIn
                  ? locale === 'bn'
                    ? 'লগইন হচ্ছে...'
                    : 'Signing in...'
                  : locale === 'bn'
                    ? 'লগইন করুন'
                    : 'Sign In'}
              </Text>
            </Pressable>

            {/* 4. Compact Divider */}
            <View className="flex-row items-center gap-3 my-0.5">
              <View className="flex-1 h-[1px] bg-[#e4e6eb] dark:bg-[#2e2f30]" />
              <Text className="text-[11.5px] font-medium text-[#8a8d91] dark:text-[#73767a]">
                {locale === 'bn' ? 'অথবা' : 'or'}
              </Text>
              <View className="flex-1 h-[1px] bg-[#e4e6eb] dark:bg-[#2e2f30]" />
            </View>

            {/* 5. Google Sign In Button */}
            <Pressable
              onPress={handleGoogleSignIn}
              disabled={isBusy}
              className={`h-11 rounded-2xl bg-[#f0f2f5] dark:bg-[#242526] items-center justify-center flex-row gap-2 active:bg-[#e4e6eb] dark:active:bg-[#3a3b3c] ${
                isBusy ? 'opacity-60' : ''
              }`}
            >
              {isGoogleLoading ? (
                <ActivityIndicator size="small" color="#4285F4" />
              ) : (
                <GoogleIcon size={17} />
              )}
              <Text className="text-[13.5px] font-bold text-[#1e2329] dark:text-[#e4e6eb]">
                {isGoogleLoading
                  ? locale === 'bn'
                    ? 'সংযুক্ত হচ্ছে...'
                    : 'Connecting...'
                  : locale === 'bn'
                    ? 'গুগল দিয়ে প্রবেশ করুন'
                    : 'Continue with Google'}
              </Text>
            </Pressable>
          </View>

          {/* Bottom Switch: Sign Up Prompt */}
          <View className="flex-row items-center justify-center gap-1.5 mt-4 py-1">
            <Text className="text-[13px] text-[#65676b] dark:text-[#b0b3b8]">
              {locale === 'bn' ? 'অ্যাকাউন্ট নেই?' : "Don't have an account?"}
            </Text>
            <Pressable
              onPress={() => router.push('/register')}
              hitSlop={8}
              className="py-1"
            >
              <Text className="text-[13.5px] font-bold text-[#0866FF] dark:text-[#36a4fa]">
                {locale === 'bn' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create account'}
              </Text>
            </Pressable>
          </View>

          {/* Peaceful Platform Tagline */}
          <Text className="text-[11px] text-[#8a8d91] dark:text-[#73767a] text-center mt-3">
            {locale === 'bn'
              ? 'PeaceTweet • বিশুদ্ধ দোয়া ও পবিত্র সোশ্যাল নেটওয়ার্ক'
              : 'PeaceTweet • Pure Duas & Peaceful Social Platform'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
