import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import { useGoogleAuth } from '@/features/auth/hooks/useGoogleAuth';
import {
  uploadsApi,
  UploadableImage,
} from '@/features/uploads/api/uploads.api';
import { PRESET_AVATARS } from '@/constants/presetAvatars';
import { BloodGroup } from '@/types/user.types';

const BLOOD_GROUPS: { value: BloodGroup; label: string }[] = [
  { value: 'A_POSITIVE', label: 'A+' },
  { value: 'A_NEGATIVE', label: 'A-' },
  { value: 'B_POSITIVE', label: 'B+' },
  { value: 'B_NEGATIVE', label: 'B-' },
  { value: 'AB_POSITIVE', label: 'AB+' },
  { value: 'AB_NEGATIVE', label: 'AB-' },
  { value: 'O_POSITIVE', label: 'O+' },
  { value: 'O_NEGATIVE', label: 'O-' },
];

export default function RegisterScreen() {
  const { locale, theme } = useUi();
  const { register, isRegistering } = useAuth();
  const { promptGoogleSignIn, isLoading: isGoogleLoading } = useGoogleAuth();

  // 5-Step Flow matching peacetweet_frontend RegisterView.tsx
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Name & Email
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Step 2: Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 3: Profile Photo (Device Upload OR Preset URL)
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>('');
  const [customAvatarFile, setCustomAvatarFile] =
    useState<UploadableImage | null>(null);
  const [customAvatarFilename, setCustomAvatarFilename] =
    useState<string>('avatar.jpg');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Step 4: Location
  const [country, setCountry] = useState('Bangladesh');
  const [stateName, setStateName] = useState('');
  const [city, setCity] = useState('');

  // Step 5: Blood Group
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | undefined>(
    undefined
  );

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const isDark = theme === 'dark';
  const isSubmitting = isRegistering || isUploadingPhoto;

  const revokeBlobPreviewIfNeeded = (url: string) => {
    if (
      Platform.OS === 'web' &&
      url.startsWith('blob:') &&
      typeof URL !== 'undefined' &&
      typeof URL.revokeObjectURL === 'function'
    ) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }
  };

  const handleClearAvatar = () => {
    revokeBlobPreviewIfNeeded(selectedAvatarUrl);
    setCustomAvatarFile(null);
    setSelectedAvatarUrl('');
  };

  const handleSelectPresetAvatar = (presetUrl: string) => {
    setErrorMessage('');
    if (selectedAvatarUrl === presetUrl && !customAvatarFile) {
      setSelectedAvatarUrl('');
      return;
    }
    revokeBlobPreviewIfNeeded(selectedAvatarUrl);
    setCustomAvatarFile(null);
    setSelectedAvatarUrl(presetUrl);
  };

  const handlePickFromDevice = async () => {
    setErrorMessage('');

    // Web & Mobile Browser file picker
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/webp,image/gif';
      input.style.display = 'none';

      const cleanup = () => {
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      };

      input.onchange = (e: any) => {
        const file: File | undefined = e?.target?.files?.[0];
        cleanup();
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
          setErrorMessage(
            locale === 'bn'
              ? 'ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট (5MB) হতে পারবে।'
              : 'Image file must be less than 5MB.'
          );
          return;
        }

        revokeBlobPreviewIfNeeded(selectedAvatarUrl);
        const previewUrl = URL.createObjectURL(file);
        setCustomAvatarFile(file);
        setCustomAvatarFilename(file.name || 'avatar.jpg');
        setSelectedAvatarUrl(previewUrl);
      };

      input.addEventListener?.('cancel', cleanup);
      document.body.appendChild(input);
      input.click();
      return;
    }

    // Native iOS / Android Gallery Picker
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage(
          locale === 'bn'
            ? 'গ্যালারি থেকে ছবি নির্বাচন করতে পারমিশন প্রয়োজন।'
            : 'Permission is required to select a photo from your gallery.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        setErrorMessage(
          locale === 'bn'
            ? 'ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট (5MB) হতে পারবে।'
            : 'Image file must be less than 5MB.'
        );
        return;
      }

      const filename = asset.fileName || `avatar_${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';

      setCustomAvatarFile({
        uri: asset.uri,
        name: filename,
        type: mimeType,
      });
      setCustomAvatarFilename(filename);
      setSelectedAvatarUrl(asset.uri);
    } catch {
      setErrorMessage(
        locale === 'bn'
          ? 'গ্যালারি থেকে ছবি নির্বাচন করা যায়নি।'
          : 'Could not select photo from device.'
      );
    }
  };

  const handleProceedFromStep1 = () => {
    setErrorMessage('');

    if (!name.trim() || !email.trim()) {
      setErrorMessage(
        locale === 'bn'
          ? 'অনুগ্রহ করে আপনার নাম এবং ইমেইল এড্রেস লিখুন।'
          : 'Please enter your name and email address.'
      );
      return;
    }

    if (name.trim().length < 2) {
      setErrorMessage(
        locale === 'bn'
          ? 'পূর্ণ নাম কমপক্ষে ২ অক্ষরের হতে হবে।'
          : 'Full name must be at least 2 characters.'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage(
        locale === 'bn'
          ? 'অনুগ্রহ করে একটি সঠিক ইমেইল এড্রেস লিখুন।'
          : 'Please enter a valid email address.'
      );
      return;
    }

    setStep(2);
  };

  const handleProceedFromStep2 = () => {
    setErrorMessage('');

    if (!password.trim() || !confirmPassword.trim()) {
      setErrorMessage(
        locale === 'bn'
          ? 'অনুগ্রহ করে পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড প্রদান করুন।'
          : 'Please enter and confirm your password.'
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        locale === 'bn'
          ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
          : 'Password must be at least 6 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        locale === 'bn'
          ? 'পাসওয়ার্ড দুটি মেলেনি। উভয় ফিল্ডে একই পাসওয়ার্ড দিন।'
          : 'Passwords do not match. Please enter the same password.'
      );
      return;
    }

    setStep(3);
  };

  const handleFinalSubmit = async (includeBloodGroup: boolean) => {
    if (isSubmitting) return;
    setErrorMessage('');

    const formattedLocation = [city.trim(), stateName.trim(), country.trim()]
      .filter(Boolean)
      .join(', ');

    try {
      let finalAvatarUrl: string | undefined = undefined;

      if (customAvatarFile) {
        setIsUploadingPhoto(true);
        const uploadRes = await uploadsApi.uploadImage(
          customAvatarFile,
          customAvatarFilename
        );
        finalAvatarUrl = uploadRes.url || undefined;
        setIsUploadingPhoto(false);
      } else if (selectedAvatarUrl.trim()) {
        finalAvatarUrl = selectedAvatarUrl.trim();
      }

      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        avatarUrl: finalAvatarUrl,
        country: formattedLocation ? country.trim() : undefined,
        countryCode: formattedLocation ? 'BD' : undefined,
        state: stateName.trim() || undefined,
        city: city.trim() || undefined,
        location: formattedLocation || undefined,
        bloodGroup: includeBloodGroup ? bloodGroup : undefined,
      });
    } catch (err: any) {
      setIsUploadingPhoto(false);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (locale === 'bn'
          ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। ভিন্ন ইমেইল দিয়ে পুনরায় চেষ্টা করুন।'
          : 'Registration failed. Please try a different email.');
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

  const getInputBoxClass = (field: string) =>
    `flex-row items-center rounded-lg border px-2.5 h-9 gap-2 ${
      focusedField === field
        ? 'border-[#1877f2] bg-white dark:bg-[#1f2021]'
        : 'border-[#dddfe2] dark:border-[#393a3b] bg-[#e6e9ef] dark:bg-[#3a3b3c]'
    }`;

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-[#18191a]"
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
            ? 'নতুন অ্যাকাউন্ট তৈরি করুন'
            : 'Create an Account'}
        </Text>
      </View>

      {/* Compact Card */}
      <View
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.25 : 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
        className="w-full max-w-[368px] rounded-xl bg-white dark:bg-[#242526] border border-[#dddfe2] dark:border-[#393a3b] p-4">
        {/* Step Progress Header */}
        <View className="mb-3">
          <View className="flex-row items-center justify-between mb-1.5">
            <View className="flex-row items-center gap-1.5">
              {step > 1 && (
                <Pressable
                  onPress={() => {
                    setErrorMessage('');
                    setStep((s) =>
                      s > 1 ? ((s - 1) as 1 | 2 | 3 | 4 | 5) : 1
                    );
                  }}
                  hitSlop={6}
                  className="p-1 -ml-1 rounded-md bg-[#e6e9ef] dark:bg-[#3a3b3c]">
                  <AppIcon
                    android="arrow_back"
                    ios="arrow.left"
                    size={14}
                    color={isDark ? '#e4e6eb' : '#1c1e21'}
                  />
                </Pressable>
              )}
              <Text className="text-[11px] font-bold text-[#1877f2] dark:text-[#4a80f5] uppercase">
                {locale === 'bn' ? `ধাপ ${step} / ৫` : `Step ${step} of 5`}
              </Text>
            </View>

            <Text className="text-[11px] font-medium text-[#65676b] dark:text-[#b0b3b8]">
              {step === 1 &&
                (locale === 'bn' ? 'নাম ও ইমেইল' : 'Name & Email')}
              {step === 2 &&
                (locale === 'bn' ? 'পাসওয়ার্ড নির্ধারণ' : 'Set Password')}
              {step === 3 &&
                (locale === 'bn' ? 'প্রোফাইল ছবি' : 'Profile Photo')}
              {step === 4 &&
                (locale === 'bn' ? 'লোকেশন' : 'Your Location')}
              {step === 5 &&
                (locale === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group')}
            </Text>
          </View>

          {/* 5-Segment Progress Bar */}
          <View className="flex-row gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <View
                key={s}
                className={`flex-1 h-1 rounded-full ${
                  s <= step
                    ? 'bg-[#1877f2] dark:bg-[#4a80f5]'
                    : 'bg-[#e4e6eb] dark:bg-[#3a3b3c]'
                }`}
              />
            ))}
          </View>
        </View>

        {/* Error Message Banner */}
        {errorMessage !== '' && (
          <View className="mb-2.5 rounded-lg bg-red-50 px-2.5 py-2 border border-red-200 dark:bg-red-950/60 dark:border-red-900">
            <Text className="text-[11px] leading-4 text-red-600 dark:text-red-300 font-semibold">
              {errorMessage}
            </Text>
          </View>
        )}

        {/* STEP 1: Name & Email */}
        {step === 1 && (
          <View className="gap-2">
            <View className="items-center pb-0.5">
              <Text className="text-sm font-bold text-[#1c1e21] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'আপনার তথ্য দিন' : 'Your Basic Info'}
              </Text>
              <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5 text-center">
                {locale === 'bn'
                  ? 'শুরু করতে আপনার পূর্ণ নাম ও ইমেইল লিখুন'
                  : 'Enter your full name and email to get started'}
              </Text>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-semibold text-[#374151] dark:text-[#d1d5db]">
                {locale === 'bn' ? 'আপনার পূর্ণ নাম' : 'Full Name'}
              </Text>
              <View className={getInputBoxClass('name')}>
                <AppIcon
                  android="person"
                  size={15}
                  color={focusedField === 'name' ? '#1877f2' : '#8a8d91'}
                />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() =>
                    setFocusedField((prev) => (prev === 'name' ? null : prev))
                  }
                  placeholder={
                    locale === 'bn'
                      ? 'যেমন: আবদুল্লাহ হাসান'
                      : 'e.g. Abdullah Hasan'
                  }
                  placeholderTextColor={isDark ? '#b0b3b8' : '#65676b'}
                  className="flex-1 text-[13px] text-[#050505] dark:text-[#e4e6eb] py-0"
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-semibold text-[#374151] dark:text-[#d1d5db]">
                {locale === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address'}
              </Text>
              <View className={getInputBoxClass('email')}>
                <AppIcon
                  android="mail"
                  size={15}
                  color={focusedField === 'email' ? '#1877f2' : '#8a8d91'}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() =>
                    setFocusedField((prev) => (prev === 'email' ? null : prev))
                  }
                  placeholder="name@example.com"
                  placeholderTextColor={isDark ? '#b0b3b8' : '#65676b'}
                  className="flex-1 text-[13px] text-[#050505] dark:text-[#e4e6eb] py-0"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <Pressable
              onPress={handleProceedFromStep1}
              className="w-full h-9 flex-row items-center justify-center gap-1.5 rounded-lg bg-[#1877f2] hover:bg-[#166fe5] active:bg-[#1565d8] mt-0.5">
              <Text className="text-white font-bold text-[13px]">
                {locale === 'bn' ? 'পরবর্তী ধাপে যান' : 'Continue'}
              </Text>
              <AppIcon
                android="arrow_forward"
                ios="arrow.right"
                size={15}
                color="#ffffff"
              />
            </Pressable>

            {/* Continue with Google Button */}
            <Pressable
              onPress={handleGoogleSignIn}
              disabled={isRegistering || isGoogleLoading}
              className={`w-full h-9 rounded-lg border border-[#dadce0] dark:border-[#4b4c4f] bg-[#f8f9fa] dark:bg-[#3a3b3c] items-center flex-row justify-center gap-2 ${
                isRegistering || isGoogleLoading
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
                    ? 'Google দিয়ে সাইন আপ'
                    : 'Continue with Google'}
              </Text>
            </Pressable>

            <View className="items-center pt-2 mt-0.5 border-t border-[#e4e6eb] dark:border-[#393a3b]">
              <Pressable onPress={() => router.push('/login')}>
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                  {locale === 'bn'
                    ? 'আগে থেকেই অ্যাকাউন্ট আছে? '
                    : 'Already have an account? '}
                  <Text className="font-bold text-[#1877f2] dark:text-[#4a80f5]">
                    {locale === 'bn' ? 'লগইন করুন' : 'Log In'}
                  </Text>
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 2: Password & Confirm Password */}
        {step === 2 && (
          <View className="gap-2">
            <View className="items-center pb-0.5">
              <Text className="text-sm font-bold text-[#1c1e21] dark:text-[#e4e6eb]">
                {locale === 'bn'
                  ? 'একটি শক্তিশালী পাসওয়ার্ড দিন'
                  : 'Create a Password'}
              </Text>
              <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5 text-center">
                {locale === 'bn'
                  ? 'নিরাপত্তার স্বার্থে কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড ব্যবহার করুন'
                  : 'Use at least 6 characters to secure your account'}
              </Text>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-semibold text-[#374151] dark:text-[#d1d5db]">
                {locale === 'bn'
                  ? 'পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)'
                  : 'Password (min. 6 chars)'}
              </Text>
              <View className={getInputBoxClass('password')}>
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
                    setFocusedField((prev) =>
                      prev === 'password' ? null : prev
                    )
                  }
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor={isDark ? '#b0b3b8' : '#65676b'}
                  className="flex-1 text-[13px] text-[#050505] dark:text-[#e4e6eb] py-0"
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

            <View className="gap-1">
              <Text className="text-xs font-semibold text-[#374151] dark:text-[#d1d5db]">
                {locale === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
              </Text>
              <View className={getInputBoxClass('confirmPassword')}>
                <AppIcon
                  android="lock"
                  size={15}
                  color={
                    focusedField === 'confirmPassword' ? '#1877f2' : '#8a8d91'
                  }
                />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() =>
                    setFocusedField((prev) =>
                      prev === 'confirmPassword' ? null : prev
                    )
                  }
                  secureTextEntry={!showConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={isDark ? '#b0b3b8' : '#65676b'}
                  className="flex-1 text-[13px] text-[#050505] dark:text-[#e4e6eb] py-0"
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={6}
                  className="p-0.5">
                  <AppIcon
                    android={
                      showConfirmPassword ? 'visibility_off' : 'visibility'
                    }
                    size={15}
                    color="#8a8d91"
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleProceedFromStep2}
              className="w-full h-9 flex-row items-center justify-center gap-1.5 rounded-lg bg-[#1877f2] hover:bg-[#166fe5] active:bg-[#1565d8] mt-0.5">
              <Text className="text-white font-bold text-[13px]">
                {locale === 'bn' ? 'পরবর্তী ধাপে যান' : 'Continue'}
              </Text>
              <AppIcon
                android="arrow_forward"
                ios="arrow.right"
                size={15}
                color="#ffffff"
              />
            </Pressable>
          </View>
        )}

        {/* STEP 3: Profile Photo (Device Picker + 8 Preset Non-Human Avatars) */}
        {step === 3 && (
          <View className="gap-2.5">
            <View className="items-center">
              <Text className="text-sm font-bold text-[#1c1e21] dark:text-[#e4e6eb]">
                {locale === 'bn'
                  ? 'প্রোফাইল ছবি নির্বাচন করুন'
                  : 'Add a Profile Photo'}
              </Text>
              <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5 text-center">
                {locale === 'bn'
                  ? 'মোবাইল থেকে আপলোড করুন অথবা নিচের ডেমো ছবি বেছে নিন'
                  : 'Upload from device or choose a peaceful avatar below'}
              </Text>
            </View>

            {/* Tappable Device Photo Uploader & Live Preview Circle */}
            <View className="items-center justify-center py-0.5">
              <View className="relative">
                <Pressable
                  onPress={handlePickFromDevice}
                  accessibilityRole="button"
                  accessibilityLabel={
                    locale === 'bn'
                      ? 'ডিভাইস থেকে প্রোফাইল ছবি নির্বাচন করুন'
                      : 'Select profile photo from device'
                  }
                  className={`h-[68px] w-[68px] items-center justify-center rounded-full overflow-hidden active:scale-95 ${
                    selectedAvatarUrl
                      ? 'border-2 border-[#1877f2] bg-[#e6e9ef] dark:bg-[#3a3b3c]'
                      : 'border-2 border-dashed border-[#1877f2]/60 hover:border-[#1877f2] dark:border-[#4a80f5]/60 bg-[#e6e9ef] dark:bg-[#3a3b3c]'
                  }`}>
                  {selectedAvatarUrl ? (
                    <Image
                      source={{ uri: selectedAvatarUrl }}
                      className="h-full w-full rounded-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <>
                      <AppIcon
                        android="photo_camera"
                        ios="camera.fill"
                        size={20}
                        color="#1877f2"
                      />
                      <Text className="text-[10px] font-bold text-[#1877f2] dark:text-[#4a80f5] mt-0.5">
                        {locale === 'bn' ? 'আপলোড' : 'Upload'}
                      </Text>
                    </>
                  )}
                </Pressable>

                {selectedAvatarUrl !== '' && (
                  <>
                    <Pressable
                      onPress={handleClearAvatar}
                      hitSlop={6}
                      className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-[#1c1e21] dark:bg-[#3a3b3c] border border-white dark:border-[#242526] items-center justify-center">
                      <AppIcon
                        android="close"
                        ios="xmark"
                        size={11}
                        color="#ffffff"
                      />
                    </Pressable>

                    <Pressable
                      onPress={handlePickFromDevice}
                      hitSlop={4}
                      className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-[#1877f2] border border-white dark:border-[#242526] items-center justify-center">
                      <AppIcon
                        android="photo_camera"
                        ios="camera.fill"
                        size={10}
                        color="#ffffff"
                      />
                    </Pressable>
                  </>
                )}
              </View>
            </View>

            {/* 8 Preset Avatars in Compact 2x4 Grid */}
            <View className="gap-2 px-1 py-0.5">
              {[PRESET_AVATARS.slice(0, 4), PRESET_AVATARS.slice(4, 8)].map(
                (row, rowIdx) => (
                  <View
                    key={rowIdx}
                    className="flex-row items-center justify-between">
                    {row.map((item) => {
                      const isSelected =
                        !customAvatarFile && selectedAvatarUrl === item.url;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => handleSelectPresetAvatar(item.url)}
                          className="items-center active:scale-95">
                          <View
                            className={`relative h-[58px] w-[58px] rounded-full p-[2px] ${
                              isSelected
                                ? 'border-2 border-[#1877f2] bg-white dark:bg-[#242526]'
                                : 'border border-[#dddfe2] dark:border-[#393a3b] bg-[#e6e9ef] dark:bg-[#3a3b3c]'
                            }`}>
                            <Image
                              source={{ uri: item.url }}
                              className="h-full w-full rounded-full"
                              resizeMode="cover"
                            />
                            {isSelected && (
                              <View className="absolute -bottom-0.5 -right-0.5 h-[18px] w-[18px] rounded-full bg-[#1877f2] border-[1.5px] border-white dark:border-[#242526] items-center justify-center">
                                <AppIcon
                                  android="check"
                                  ios="checkmark"
                                  size={10}
                                  color="#ffffff"
                                />
                              </View>
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )
              )}
            </View>

            <Text className="text-[10.5px] text-[#65676b] dark:text-[#b0b3b8] text-center">
              {locale === 'bn'
                ? 'পরবর্তীতে প্রোফাইল থেকেও ছবি পরিবর্তন করা যাবে'
                : 'You can also update your photo later in Profile'}
            </Text>

            <View className="flex-row gap-2 pt-0.5">
              <Pressable
                onPress={() => {
                  handleClearAvatar();
                  setErrorMessage('');
                  setStep(4);
                }}
                className="flex-1 h-9 rounded-lg border border-[#dddfe2] dark:border-[#4b4c4f] bg-[#f8f9fa] dark:bg-[#3a3b3c] items-center justify-center">
                <Text className="text-xs font-semibold text-[#1c1e21] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'স্কিপ করুন' : 'Skip'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setErrorMessage('');
                  setStep(4);
                }}
                className="flex-1 h-9 rounded-lg bg-[#1877f2] hover:bg-[#166fe5] active:bg-[#1565d8] items-center justify-center">
                <Text className="text-xs font-bold text-white">
                  {locale === 'bn' ? 'পরবর্তী' : 'Next'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 4: Location (Optional / Skip) */}
        {step === 4 && (
          <View className="gap-2">
            <View className="items-center pb-0.5">
              <Text className="text-sm font-bold text-[#1c1e21] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'আপনার লোকেশন' : 'Your Location'}
              </Text>
              <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5 text-center">
                {locale === 'bn'
                  ? 'আপনার দেশ ও বিভাগ/এলাকা নির্বাচন করুন (ঐচ্ছিক)'
                  : 'Select your country and area (optional)'}
              </Text>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-semibold text-[#374151] dark:text-[#d1d5db]">
                {locale === 'bn' ? 'দেশ (Country)' : 'Country'}
              </Text>
              <View className={getInputBoxClass('country')}>
                <TextInput
                  value={country}
                  onChangeText={setCountry}
                  onFocus={() => setFocusedField('country')}
                  onBlur={() =>
                    setFocusedField((prev) =>
                      prev === 'country' ? null : prev
                    )
                  }
                  placeholder="Bangladesh"
                  placeholderTextColor={isDark ? '#b0b3b8' : '#65676b'}
                  className="flex-1 text-[13px] text-[#050505] dark:text-[#e4e6eb] py-0"
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-semibold text-[#374151] dark:text-[#d1d5db]">
                {locale === 'bn' ? 'বিভাগ / রাজ্য (Division/State)' : 'State / Division'}
              </Text>
              <View className={getInputBoxClass('stateName')}>
                <TextInput
                  value={stateName}
                  onChangeText={setStateName}
                  onFocus={() => setFocusedField('stateName')}
                  onBlur={() =>
                    setFocusedField((prev) =>
                      prev === 'stateName' ? null : prev
                    )
                  }
                  placeholder={locale === 'bn' ? 'যেমন: Dhaka' : 'e.g. Dhaka'}
                  placeholderTextColor={isDark ? '#b0b3b8' : '#65676b'}
                  className="flex-1 text-[13px] text-[#050505] dark:text-[#e4e6eb] py-0"
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-semibold text-[#374151] dark:text-[#d1d5db]">
                {locale === 'bn' ? 'জেলা / শহর (District/City)' : 'City / District'}
              </Text>
              <View className={getInputBoxClass('city')}>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  onFocus={() => setFocusedField('city')}
                  onBlur={() =>
                    setFocusedField((prev) => (prev === 'city' ? null : prev))
                  }
                  placeholder={
                    locale === 'bn' ? 'যেমন: Mirpur, Dhaka' : 'e.g. Mirpur, Dhaka'
                  }
                  placeholderTextColor={isDark ? '#b0b3b8' : '#65676b'}
                  className="flex-1 text-[13px] text-[#050505] dark:text-[#e4e6eb] py-0"
                />
              </View>
            </View>

            <View className="flex-row gap-2 pt-1">
              <Pressable
                onPress={() => {
                  setErrorMessage('');
                  setCountry('');
                  setStateName('');
                  setCity('');
                  setStep(5);
                }}
                className="flex-1 h-9 rounded-lg border border-[#dddfe2] dark:border-[#4b4c4f] bg-[#f8f9fa] dark:bg-[#3a3b3c] items-center justify-center">
                <Text className="text-xs font-semibold text-[#1c1e21] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'স্কিপ করুন' : 'Skip'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setErrorMessage('');
                  setStep(5);
                }}
                className="flex-1 h-9 rounded-lg bg-[#1877f2] hover:bg-[#166fe5] active:bg-[#1565d8] items-center justify-center">
                <Text className="text-xs font-bold text-white">
                  {locale === 'bn' ? 'পরবর্তী' : 'Next'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 5: Blood Group (Optional / Complete) */}
        {step === 5 && (
          <View className="gap-2.5">
            <View className="items-center">
              <Text className="text-sm font-bold text-[#1c1e21] dark:text-[#e4e6eb]">
                {locale === 'bn'
                  ? 'রক্তের গ্রুপ নির্বাচন করুন'
                  : 'Select Blood Group'}
              </Text>
              <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5 text-center">
                {locale === 'bn'
                  ? 'জরুরি রক্তদানের সুবিধার্থে আপনার রক্তের গ্রুপ দিন (ঐচ্ছিক)'
                  : 'Help in emergencies by sharing your blood group (optional)'}
              </Text>
            </View>

            {/* 8 Blood Group Chips */}
            <View className="flex-row flex-wrap gap-1.5 py-0.5">
              {BLOOD_GROUPS.map((bg) => {
                const isSelected = bloodGroup === bg.value;
                return (
                  <Pressable
                    key={bg.value}
                    onPress={() =>
                      setBloodGroup(isSelected ? undefined : bg.value)
                    }
                    className={`w-[23.5%] flex-row items-center justify-center gap-1 rounded-lg border h-9 ${
                      isSelected
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/60'
                        : 'border-[#dddfe2] bg-[#e6e9ef] dark:border-[#393a3b] dark:bg-[#3a3b3c]'
                    }`}>
                    <AppIcon
                      android="water_drop"
                      size={13}
                      color="#ef4444"
                    />
                    <Text
                      className={`text-xs font-bold ${
                        isSelected
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-[#1c1e21] dark:text-[#e4e6eb]'
                      }`}>
                      {bg.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Step 5 Actions: Skip or Complete */}
            <View className="flex-row gap-2 pt-0.5">
              <Pressable
                onPress={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 h-9 rounded-lg border border-[#dddfe2] dark:border-[#4b4c4f] bg-[#f8f9fa] dark:bg-[#3a3b3c] items-center justify-center">
                <Text className="text-xs font-semibold text-[#1c1e21] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'স্কিপ করুন' : 'Skip & Finish'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleFinalSubmit(true)}
                disabled={isSubmitting}
                className={`flex-1 h-9 flex-row items-center justify-center gap-1.5 rounded-lg bg-[#42b72a] hover:bg-[#36a420] active:bg-[#36a420] ${
                  isSubmitting ? 'opacity-70' : ''
                }`}>
                {isSubmitting && (
                  <ActivityIndicator size="small" color="#ffffff" />
                )}
                <Text className="text-xs font-bold text-white">
                  {isSubmitting
                    ? locale === 'bn'
                      ? 'তৈরি হচ্ছে...'
                      : 'Creating...'
                    : locale === 'bn'
                      ? 'সম্পন্ন করুন'
                      : 'Complete'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] text-center mt-2">
        {locale === 'bn'
          ? 'PeaceTweet — বিশুদ্ধ দোয়া ও পবিত্র সোশ্যাল প্ল্যাটফর্ম'
          : 'PeaceTweet — A Peaceful Islamic Social Platform'}
      </Text>
    </ScrollView>
  );
}
