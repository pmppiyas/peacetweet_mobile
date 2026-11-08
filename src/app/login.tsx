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
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import { useGoogleAuth } from '@/features/auth/hooks/useGoogleAuth';

export default function LoginScreen() {
  const { locale, theme } = useUi();
  const { login, isLoggingIn } = useAuth();
  const { promptGoogleSignIn, isLoading: isGoogleLoading } = useGoogleAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'identifier' | 'password' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const isDark = theme === 'dark';
  const isBusy = isLoggingIn || isGoogleLoading;

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
    <ScrollView
      className="flex-1 bg-[#e6e9ef] dark:bg-[#18191a]"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="flex-grow items-center justify-center px-3 py-3">
      {/* Compact Brand Header */}
      <View className="items-center mb-2.5">
        <Pressable onPress={() => router.push('/')}>
          <Text className="text-[26px] leading-8 font-black tracking-tight text-[#1877f2] dark:text-[#4a80f5]">
            PeaceTweet
          </Text>
        </Pressable>
        <Text className="text-xs font-medium text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
          {locale === 'bn'
            ? 'আপনার অ্যাকাউন্টে লগইন করুন'
            : 'Sign in to your account'}
        </Text>
      </View>

      {/* Compact Login Card */}
      <View
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.25 : 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
        className="w-full max-w-[356px] rounded-xl bg-white dark:bg-[#242526] border border-[#dddfe2] dark:border-[#393a3b] p-4 gap-2">
        {errorMessage !== '' && (
          <View className="rounded-lg bg-red-50 px-2.5 py-2 border border-red-200 dark:bg-red-950/60 dark:border-red-900">
            <Text className="text-[11px] leading-4 text-red-600 dark:text-red-300 font-semibold">
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Identifier Input */}
        <View className="gap-1">
          <Text className="text-xs font-semibold text-[#374151] dark:text-[#d1d5db]">
            {locale === 'bn' ? 'ইমেইল বা ইউজারনেম' : 'Email or Username'}
          </Text>
          <View
            className={`flex-row items-center rounded-lg border px-2.5 h-9 gap-2 ${
              focusedField === 'identifier'
                ? 'border-[#1877f2] bg-white dark:bg-[#1f2021]'
                : 'border-[#dddfe2] dark:border-[#393a3b] bg-[#e6e9ef] dark:bg-[#3a3b3c]'
            }`}>
            <AppIcon
              android="mail"
              size={15}
              color={focusedField === 'identifier' ? '#1877f2' : '#8a8d91'}
            />
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              onFocus={() => setFocusedField('identifier')}
              onBlur={() =>
                setFocusedField((prev) => (prev === 'identifier' ? null : prev))
              }
              placeholder={
                locale === 'bn'
                  ? 'আপনার ইমেইল বা ইউজারনেম'
                  : 'email@example.com or username'
              }
              placeholderTextColor={isDark ? '#b0b3b8' : '#65676b'}
              className="flex-1 text-[13px] text-[#050505] dark:text-[#e4e6eb] py-0"
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Password Input */}
        <View className="gap-1">
          <Text className="text-xs font-semibold text-[#374151] dark:text-[#d1d5db]">
            {locale === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
          </Text>
          <View
            className={`flex-row items-center rounded-lg border px-2.5 h-9 gap-2 ${
              focusedField === 'password'
                ? 'border-[#1877f2] bg-white dark:bg-[#1f2021]'
                : 'border-[#dddfe2] dark:border-[#393a3b] bg-[#e6e9ef] dark:bg-[#3a3b3c]'
            }`}>
            <AppIcon
              android="lock"
              size={15}
              color={focusedField === 'password' ? '#1877f2' : '#8a8d91'}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() =>
                setFocusedField((prev) => (prev === 'password' ? null : prev))
              }
              secureTextEntry={!showPassword}
              placeholder="••••••••"
              placeholderTextColor={isDark ? '#b0b3b8' : '#65676b'}
              className="flex-1 text-[13px] text-[#050505] dark:text-[#e4e6eb] py-0"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={6}
              className="p-0.5">
              <AppIcon
                android={showPassword ? 'visibility_off' : 'visibility'}
                size={15}
                color="#8a8d91"
              />
            </Pressable>
          </View>
        </View>

        {/* Primary Log In Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isBusy}
          className={`w-full h-9 rounded-lg bg-[#1877f2] items-center flex-row justify-center gap-2 mt-0.5 ${
            isBusy ? 'opacity-65' : 'hover:bg-[#166fe5] active:bg-[#1565d8]'
          }`}>
          {isLoggingIn && <ActivityIndicator size="small" color="#ffffff" />}
          <Text className="text-white font-bold text-[13px]">
            {isLoggingIn
              ? locale === 'bn'
                ? 'লগইন হচ্ছে...'
                : 'Logging in...'
              : locale === 'bn'
                ? 'লগইন করুন'
                : 'Log In'}
          </Text>
        </Pressable>

        {/* Continue with Google Button */}
        <Pressable
          onPress={handleGoogleSignIn}
          disabled={isBusy}
          className={`w-full h-9 rounded-lg border border-[#dadce0] dark:border-[#4b4c4f] bg-[#f8f9fa] dark:bg-[#3a3b3c] items-center flex-row justify-center gap-2 ${
            isBusy
              ? 'opacity-60'
              : 'hover:bg-[#eef0f2] active:bg-[#e4e6eb] dark:hover:bg-[#464749] dark:active:bg-[#4e4f50]'
          }`}>
          {isGoogleLoading ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <GoogleIcon size={16} />
          )}
          <Text className="text-[13px] font-semibold text-[#1c1e21] dark:text-[#e4e6eb]">
            {isGoogleLoading
              ? locale === 'bn'
                ? 'সংযুক্ত হচ্ছে...'
                : 'Connecting...'
              : locale === 'bn'
                ? 'Google দিয়ে লগইন'
                : 'Continue with Google'}
          </Text>
        </Pressable>

        {/* Single Compact Divider */}
        <View className="flex-row items-center gap-2.5 py-0.5">
          <View className="flex-1 h-px bg-[#e4e6eb] dark:bg-[#393a3b]" />
          <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] font-medium">
            {locale === 'bn' ? 'বা' : 'or'}
          </Text>
          <View className="flex-1 h-px bg-[#e4e6eb] dark:bg-[#393a3b]" />
        </View>

        {/* Create New Account Button (Facebook signature green #42b72a) */}
        <Pressable
          onPress={() => router.push('/register')}
          disabled={isBusy}
          className="w-full h-9 rounded-lg bg-[#42b72a] hover:bg-[#36a420] active:bg-[#36a420] items-center justify-center">
          <Text className="text-[13px] font-bold text-white">
            {locale === 'bn'
              ? 'নতুন অ্যাকাউন্ট তৈরি করুন'
              : 'Create New Account'}
          </Text>
        </Pressable>
      </View>

      <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] text-center mt-2">
        {locale === 'bn'
          ? 'PeaceTweet — বিশুদ্ধ দোয়া ও পবিত্র সোশ্যাল প্ল্যাটফর্ম'
          : 'PeaceTweet — A Peaceful Islamic Social Platform'}
      </Text>
    </ScrollView>
  );
}
