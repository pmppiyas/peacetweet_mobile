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
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import { PeaceTweetLogo } from '@/components/ui/PeaceTweetLogo';
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
      let hasPermission = true;
      try {
        const permStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (!permStatus.granted && permStatus.canAskAgain) {
          const reqStatus =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          hasPermission = reqStatus.granted;
        } else if (permStatus.granted) {
          hasPermission = true;
        } else {
          hasPermission = Platform.OS === 'android';
        }
      } catch {
        hasPermission = Platform.OS === 'android';
      }

      if (!hasPermission && Platform.OS !== 'android') {
        setErrorMessage(
          locale === 'bn'
            ? 'গ্যালারি থেকে ছবি নির্বাচন করতে পারমিশন প্রয়োজন।'
            : 'Permission is required to select a photo from your gallery.'
        );
        return;
      }

      let result: ImagePicker.ImagePickerResult;
      try {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: Platform.OS === 'ios',
          aspect: [1, 1],
          quality: 0.85,
        });
      } catch (pickerErr) {
        console.warn(
          '[RegisterPhoto] Primary picker launch failed, falling back:',
          pickerErr
        );
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.85,
        });
      }

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

      // Parse safe extension and MIME type for ANY image format
      let mimeType = (asset.mimeType || '').toLowerCase().trim();
      let ext = 'jpg';

      if (mimeType.startsWith('image/')) {
        const subtype = mimeType.replace('image/', '').split(';')[0].trim();
        ext = subtype === 'jpeg' ? 'jpg' : subtype;
      } else if (asset.uri) {
        const cleanUri = asset.uri.split('?')[0];
        const uriExt = cleanUri.split('.').pop()?.toLowerCase();
        if (
          uriExt &&
          /^(jpg|jpeg|png|webp|gif|svg|heic|heif|avif|bmp|tiff|ico)$/.test(
            uriExt
          )
        ) {
          ext = uriExt === 'jpeg' ? 'jpg' : uriExt;
        }
      }

      if (!mimeType || !mimeType.startsWith('image/')) {
        if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'webp') mimeType = 'image/webp';
        else if (ext === 'gif') mimeType = 'image/gif';
        else if (ext === 'svg') mimeType = 'image/svg+xml';
        else if (ext === 'heic') mimeType = 'image/heic';
        else if (ext === 'heif') mimeType = 'image/heif';
        else if (ext === 'avif') mimeType = 'image/avif';
        else if (ext === 'bmp') mimeType = 'image/bmp';
        else mimeType = 'image/jpeg';
      }

      const filename =
        asset.fileName || `avatar_${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;

      setCustomAvatarFile({
        uri: asset.uri,
        name: filename,
        type: mimeType,
      });
      setCustomAvatarFilename(filename);
      setSelectedAvatarUrl(asset.uri);
    } catch (pickerErr) {
      console.error('[RegisterPhoto] Picker error:', pickerErr);
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white dark:bg-[#18191a]"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        className="flex-1"
      >
        <View className="w-full max-w-[420px] mx-auto px-6 py-8 justify-center">
          {/* Top Bar with Back Button & Step Badge */}
          <View className="flex-row items-center justify-between mb-6">
            <Pressable
              onPress={() => {
                if (step > 1) {
                  setErrorMessage('');
                  setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4 | 5) : 1));
                } else if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/login');
                }
              }}
              hitSlop={10}
              accessibilityLabel="Back"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#242526] active:bg-[#e4e6eb] dark:active:bg-[#3a3b3c]"
            >
              <AppIcon
                android="arrow_back"
                ios="arrow.left"
                size={20}
                color={isDark ? '#e4e6eb' : '#1e2329'}
              />
            </Pressable>

            {/* Step Counter Badge */}
            <View className="px-3.5 py-1.5 rounded-full bg-[#edf5ff] dark:bg-[#1a2744]">
              <Text className="text-[12px] font-bold text-[#0866FF] dark:text-[#36a4fa]">
                {locale === 'bn' ? `ধাপ ${step} / ৫` : `Step ${step} of 5`}
              </Text>
            </View>
          </View>

          {/* Welcoming Hero & Brand Section */}
          <View className="mb-6">
            <View className="flex-row items-center gap-3 mb-4">
              <PeaceTweetLogo size={52} />
              <Pressable onPress={() => router.push('/')}>
                <Text className="text-[34px] font-black tracking-tight text-[#0866FF] dark:text-[#36a4fa]">
                  PeaceTweet
                </Text>
              </Pressable>
            </View>

            <Text className="text-[26px] font-black tracking-tight text-[#1e2329] dark:text-[#e4e6eb]">
              {step === 1 &&
                (locale === 'bn' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create Account')}
              {step === 2 &&
                (locale === 'bn' ? 'পাসওয়ার্ড নির্ধারণ' : 'Set Password')}
              {step === 3 &&
                (locale === 'bn' ? 'প্রোফাইল ছবি' : 'Profile Photo')}
              {step === 4 &&
                (locale === 'bn' ? 'আপনার লোকেশন' : 'Your Location')}
              {step === 5 &&
                (locale === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group')}
            </Text>
            <Text className="text-[14px] text-[#65676b] dark:text-[#b0b3b8] mt-1.5 leading-relaxed">
              {step === 1 &&
                (locale === 'bn'
                  ? 'বিশুদ্ধ ও শান্তিময় কমিউনিটিতে যুক্ত হতে আপনার নাম ও ইমেইল লিখুন।'
                  : 'Enter your full name and email to get started.')}
              {step === 2 &&
                (locale === 'bn'
                  ? 'নিরাপত্তার স্বার্থে কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড ব্যবহার করুন।'
                  : 'Use at least 6 characters to secure your account.')}
              {step === 3 &&
                (locale === 'bn'
                  ? 'মোবাইল থেকে আপলোড করুন অথবা নিচের সুন্দর ছবি বেছে নিন।'
                  : 'Upload from device or choose a peaceful avatar below.')}
              {step === 4 &&
                (locale === 'bn'
                  ? 'আপনার এলাকা নির্বাচন করুন (ঐচ্ছিক, চাইলে স্কিপ করতে পারেন)।'
                  : 'Select your country and area (optional, can skip).')}
              {step === 5 &&
                (locale === 'bn'
                  ? 'জরুরি রক্তদানের সুবিধার্থে রক্তের গ্রুপ দিন (ঐচ্ছিক)।'
                  : 'Help in emergencies by sharing your blood group (optional).')}
            </Text>
          </View>

          {/* 5-Segment Progress Bar */}
          <View className="flex-row gap-1.5 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <View
                key={s}
                className={`flex-1 h-1.5 rounded-full ${
                  s <= step
                    ? 'bg-[#0866FF] dark:bg-[#36a4fa]'
                    : 'bg-[#e4e6eb] dark:bg-[#3a3b3c]'
                }`}
              />
            ))}
          </View>

          {/* Error Message Pill */}
          {errorMessage !== '' && (
            <View className="mb-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-3.5 flex-row items-center gap-2.5">
              <AppIcon android="error" size={18} color="#e11d48" />
              <Text className="flex-1 text-[12.5px] leading-snug text-rose-700 dark:text-rose-300 font-medium">
                {errorMessage}
              </Text>
            </View>
          )}

          {/* STEP 1: Name & Email */}
          {step === 1 && (
            <View className="space-y-4 gap-4">
              {/* Full Name */}
              <View>
                <Text className="text-[12.5px] font-bold text-[#65676b] dark:text-[#b0b3b8] mb-1.5 ml-1">
                  {locale === 'bn' ? 'আপনার পূর্ণ নাম' : 'Full Name'}
                </Text>
                <View
                  className={`h-12 rounded-2xl px-4 flex-row items-center gap-3 transition-all ${
                    focusedField === 'name'
                      ? 'bg-[#edf5ff] dark:bg-[#1a2744]'
                      : 'bg-[#f0f2f5] dark:bg-[#242526]'
                  }`}
                >
                  <AppIcon
                    android="person"
                    size={19}
                    color={focusedField === 'name' ? '#0866FF' : '#8a8d91'}
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
                    placeholderTextColor={isDark ? '#73767a' : '#8a8d91'}
                    className="flex-1 text-[14.5px] text-[#1e2329] dark:text-[#e4e6eb] py-0"
                  />
                </View>
              </View>

              {/* Email Address */}
              <View>
                <Text className="text-[12.5px] font-bold text-[#65676b] dark:text-[#b0b3b8] mb-1.5 ml-1">
                  {locale === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address'}
                </Text>
                <View
                  className={`h-12 rounded-2xl px-4 flex-row items-center gap-3 transition-all ${
                    focusedField === 'email'
                      ? 'bg-[#edf5ff] dark:bg-[#1a2744]'
                      : 'bg-[#f0f2f5] dark:bg-[#242526]'
                  }`}
                >
                  <AppIcon
                    android="mail"
                    size={19}
                    color={focusedField === 'email' ? '#0866FF' : '#8a8d91'}
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() =>
                      setFocusedField((prev) => (prev === 'email' ? null : prev))
                    }
                    placeholder="name@example.com"
                    placeholderTextColor={isDark ? '#73767a' : '#8a8d91'}
                    className="flex-1 text-[14.5px] text-[#1e2329] dark:text-[#e4e6eb] py-0"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Continue Button */}
              <Pressable
                onPress={handleProceedFromStep1}
                className="h-12 rounded-2xl bg-[#0866FF] active:bg-[#0756d6] items-center justify-center flex-row gap-2 mt-2 shadow-sm shadow-[#0866FF]/20"
              >
                <Text className="text-[15px] font-bold text-white">
                  {locale === 'bn' ? 'পরবর্তী ধাপে যান' : 'Continue'}
                </Text>
                <AppIcon
                  android="arrow_forward"
                  ios="arrow.right"
                  size={18}
                  color="#ffffff"
                />
              </Pressable>

              {/* Divider */}
              <View className="flex-row items-center gap-3 my-2">
                <View className="flex-1 h-[1px] bg-[#e4e6eb] dark:bg-[#2e2f30]" />
                <Text className="text-[12px] font-medium text-[#8a8d91] dark:text-[#73767a]">
                  {locale === 'bn' ? 'অথবা' : 'or'}
                </Text>
                <View className="flex-1 h-[1px] bg-[#e4e6eb] dark:bg-[#2e2f30]" />
              </View>

              {/* Continue with Google Button */}
              <Pressable
                onPress={handleGoogleSignIn}
                disabled={isRegistering || isGoogleLoading}
                className={`h-12 rounded-2xl bg-[#f0f2f5] dark:bg-[#242526] items-center justify-center flex-row gap-2.5 active:bg-[#e4e6eb] dark:active:bg-[#3a3b3c] ${
                  isRegistering || isGoogleLoading ? 'opacity-60' : ''
                }`}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color="#4285F4" />
                ) : (
                  <GoogleIcon size={18} />
                )}
                <Text className="text-[14px] font-bold text-[#1e2329] dark:text-[#e4e6eb]">
                  {isGoogleLoading
                    ? locale === 'bn'
                      ? 'সংযুক্ত হচ্ছে...'
                      : 'Connecting...'
                    : locale === 'bn'
                      ? 'গুগল দিয়ে সাইন আপ'
                      : 'Continue with Google'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* STEP 2: Password & Confirm Password */}
          {step === 2 && (
            <View className="space-y-4 gap-4">
              {/* Password */}
              <View>
                <Text className="text-[12.5px] font-bold text-[#65676b] dark:text-[#b0b3b8] mb-1.5 ml-1">
                  {locale === 'bn'
                    ? 'পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)'
                    : 'Password (min. 6 chars)'}
                </Text>
                <View
                  className={`h-12 rounded-2xl px-4 flex-row items-center gap-3 transition-all ${
                    focusedField === 'password'
                      ? 'bg-[#edf5ff] dark:bg-[#1a2744]'
                      : 'bg-[#f0f2f5] dark:bg-[#242526]'
                  }`}
                >
                  <AppIcon
                    android="lock"
                    size={19}
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
                    className="flex-1 text-[14.5px] text-[#1e2329] dark:text-[#e4e6eb] py-0"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}
                    className="p-1"
                  >
                    <AppIcon
                      android={showPassword ? 'visibility_off' : 'visibility'}
                      size={18}
                      color="#8a8d91"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password */}
              <View>
                <Text className="text-[12.5px] font-bold text-[#65676b] dark:text-[#b0b3b8] mb-1.5 ml-1">
                  {locale === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
                </Text>
                <View
                  className={`h-12 rounded-2xl px-4 flex-row items-center gap-3 transition-all ${
                    focusedField === 'confirmPassword'
                      ? 'bg-[#edf5ff] dark:bg-[#1a2744]'
                      : 'bg-[#f0f2f5] dark:bg-[#242526]'
                  }`}
                >
                  <AppIcon
                    android="lock"
                    size={19}
                    color={
                      focusedField === 'confirmPassword'
                        ? '#0866FF'
                        : '#8a8d91'
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
                    placeholderTextColor={isDark ? '#73767a' : '#8a8d91'}
                    className="flex-1 text-[14.5px] text-[#1e2329] dark:text-[#e4e6eb] py-0"
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    hitSlop={8}
                    className="p-1"
                  >
                    <AppIcon
                      android={
                        showConfirmPassword ? 'visibility_off' : 'visibility'
                      }
                      size={18}
                      color="#8a8d91"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Continue Button */}
              <Pressable
                onPress={handleProceedFromStep2}
                className="h-12 rounded-2xl bg-[#0866FF] active:bg-[#0756d6] items-center justify-center flex-row gap-2 mt-2 shadow-sm shadow-[#0866FF]/20"
              >
                <Text className="text-[15px] font-bold text-white">
                  {locale === 'bn' ? 'পরবর্তী ধাপে যান' : 'Continue'}
                </Text>
                <AppIcon
                  android="arrow_forward"
                  ios="arrow.right"
                  size={18}
                  color="#ffffff"
                />
              </Pressable>
            </View>
          )}

          {/* STEP 3: Profile Photo */}
          {step === 3 && (
            <View className="space-y-4 gap-4">
              {/* Tappable Device Photo Uploader & Live Preview Circle */}
              <View className="items-center justify-center py-2">
                <View className="relative">
                  <Pressable
                    onPress={handlePickFromDevice}
                    accessibilityRole="button"
                    accessibilityLabel={
                      locale === 'bn'
                        ? 'ডিভাইস থেকে প্রোফাইল ছবি নির্বাচন করুন'
                        : 'Select profile photo from device'
                    }
                    className={`h-[84px] w-[84px] items-center justify-center rounded-full overflow-hidden active:scale-95 ${
                      selectedAvatarUrl
                        ? 'border-2 border-[#0866FF] bg-[#edf5ff] dark:bg-[#1a2744]'
                        : 'border-2 border-dashed border-[#0866FF]/60 hover:border-[#0866FF] dark:border-[#36a4fa]/60 bg-[#f0f2f5] dark:bg-[#242526]'
                    }`}
                  >
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
                          size={26}
                          color="#0866FF"
                        />
                        <Text className="text-[11px] font-bold text-[#0866FF] dark:text-[#36a4fa] mt-1">
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
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-[#1c1e21] dark:bg-[#3a3b3c] border-2 border-white dark:border-[#18191a] items-center justify-center"
                      >
                        <AppIcon
                          android="close"
                          ios="xmark"
                          size={13}
                          color="#ffffff"
                        />
                      </Pressable>

                      <Pressable
                        onPress={handlePickFromDevice}
                        hitSlop={4}
                        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#0866FF] border-2 border-white dark:border-[#18191a] items-center justify-center"
                      >
                        <AppIcon
                          android="photo_camera"
                          ios="camera.fill"
                          size={12}
                          color="#ffffff"
                        />
                      </Pressable>
                    </>
                  )}
                </View>
              </View>

              {/* Preset Avatars in 2 Rows of 4 */}
              <View className="gap-2.5 px-1 py-1">
                {[PRESET_AVATARS.slice(0, 4), PRESET_AVATARS.slice(4, 8)].map(
                  (row, rowIdx) => (
                    <View
                      key={rowIdx}
                      className="flex-row items-center justify-between"
                    >
                      {row.map((item) => {
                        const isSelected =
                          !customAvatarFile && selectedAvatarUrl === item.url;
                        return (
                          <Pressable
                            key={item.id}
                            onPress={() => handleSelectPresetAvatar(item.url)}
                            className="items-center active:scale-95"
                          >
                            <View
                              className={`relative h-[62px] w-[62px] rounded-full p-[2px] ${
                                isSelected
                                  ? 'border-2 border-[#0866FF] bg-white dark:bg-[#242526]'
                                  : 'border border-transparent bg-[#f0f2f5] dark:bg-[#242526]'
                              }`}
                            >
                              <Image
                                source={{ uri: item.url }}
                                className="h-full w-full rounded-full"
                                resizeMode="cover"
                              />
                              {isSelected && (
                                <View className="absolute -bottom-0.5 -right-0.5 h-[20px] w-[20px] rounded-full bg-[#0866FF] border-2 border-white dark:border-[#18191a] items-center justify-center">
                                  <AppIcon
                                    android="check"
                                    ios="checkmark"
                                    size={12}
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

              <Text className="text-[12px] text-[#65676b] dark:text-[#b0b3b8] text-center">
                {locale === 'bn'
                  ? 'পরবর্তীতে প্রোফাইল থেকেও ছবি পরিবর্তন করা যাবে'
                  : 'You can also update your photo later in Profile'}
              </Text>

              {/* Step 3 Action Buttons */}
              <View className="flex-row gap-3 pt-2">
                <Pressable
                  onPress={() => {
                    handleClearAvatar();
                    setErrorMessage('');
                    setStep(4);
                  }}
                  className="flex-1 h-12 rounded-2xl bg-[#f0f2f5] dark:bg-[#242526] active:bg-[#e4e6eb] dark:active:bg-[#3a3b3c] items-center justify-center"
                >
                  <Text className="text-[14px] font-bold text-[#1e2329] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'স্কিপ করুন' : 'Skip'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setErrorMessage('');
                    setStep(4);
                  }}
                  className="flex-1 h-12 rounded-2xl bg-[#0866FF] active:bg-[#0756d6] items-center justify-center shadow-sm shadow-[#0866FF]/20"
                >
                  <Text className="text-[14px] font-bold text-white">
                    {locale === 'bn' ? 'পরবর্তী' : 'Next'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* STEP 4: Location */}
          {step === 4 && (
            <View className="space-y-4 gap-4">
              {/* Country */}
              <View>
                <Text className="text-[12.5px] font-bold text-[#65676b] dark:text-[#b0b3b8] mb-1.5 ml-1">
                  {locale === 'bn' ? 'দেশ (Country)' : 'Country'}
                </Text>
                <View
                  className={`h-12 rounded-2xl px-4 flex-row items-center gap-3 transition-all ${
                    focusedField === 'country'
                      ? 'bg-[#edf5ff] dark:bg-[#1a2744]'
                      : 'bg-[#f0f2f5] dark:bg-[#242526]'
                  }`}
                >
                  <AppIcon
                    android="public"
                    size={19}
                    color={focusedField === 'country' ? '#0866FF' : '#8a8d91'}
                  />
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
                    placeholderTextColor={isDark ? '#73767a' : '#8a8d91'}
                    className="flex-1 text-[14.5px] text-[#1e2329] dark:text-[#e4e6eb] py-0"
                  />
                </View>
              </View>

              {/* State / Division */}
              <View>
                <Text className="text-[12.5px] font-bold text-[#65676b] dark:text-[#b0b3b8] mb-1.5 ml-1">
                  {locale === 'bn'
                    ? 'বিভাগ / রাজ্য (Division/State)'
                    : 'State / Division'}
                </Text>
                <View
                  className={`h-12 rounded-2xl px-4 flex-row items-center gap-3 transition-all ${
                    focusedField === 'stateName'
                      ? 'bg-[#edf5ff] dark:bg-[#1a2744]'
                      : 'bg-[#f0f2f5] dark:bg-[#242526]'
                  }`}
                >
                  <AppIcon
                    android="location_city"
                    size={19}
                    color={
                      focusedField === 'stateName' ? '#0866FF' : '#8a8d91'
                    }
                  />
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
                    placeholderTextColor={isDark ? '#73767a' : '#8a8d91'}
                    className="flex-1 text-[14.5px] text-[#1e2329] dark:text-[#e4e6eb] py-0"
                  />
                </View>
              </View>

              {/* City / District */}
              <View>
                <Text className="text-[12.5px] font-bold text-[#65676b] dark:text-[#b0b3b8] mb-1.5 ml-1">
                  {locale === 'bn'
                    ? 'জেলা / শহর (District/City)'
                    : 'City / District'}
                </Text>
                <View
                  className={`h-12 rounded-2xl px-4 flex-row items-center gap-3 transition-all ${
                    focusedField === 'city'
                      ? 'bg-[#edf5ff] dark:bg-[#1a2744]'
                      : 'bg-[#f0f2f5] dark:bg-[#242526]'
                  }`}
                >
                  <AppIcon
                    android="pin_drop"
                    size={19}
                    color={focusedField === 'city' ? '#0866FF' : '#8a8d91'}
                  />
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    onFocus={() => setFocusedField('city')}
                    onBlur={() =>
                      setFocusedField((prev) =>
                        prev === 'city' ? null : prev
                      )
                    }
                    placeholder={
                      locale === 'bn'
                        ? 'যেমন: Mirpur, Dhaka'
                        : 'e.g. Mirpur, Dhaka'
                    }
                    placeholderTextColor={isDark ? '#73767a' : '#8a8d91'}
                    className="flex-1 text-[14.5px] text-[#1e2329] dark:text-[#e4e6eb] py-0"
                  />
                </View>
              </View>

              {/* Step 4 Action Buttons */}
              <View className="flex-row gap-3 pt-2">
                <Pressable
                  onPress={() => {
                    setErrorMessage('');
                    setCountry('');
                    setStateName('');
                    setCity('');
                    setStep(5);
                  }}
                  className="flex-1 h-12 rounded-2xl bg-[#f0f2f5] dark:bg-[#242526] active:bg-[#e4e6eb] dark:active:bg-[#3a3b3c] items-center justify-center"
                >
                  <Text className="text-[14px] font-bold text-[#1e2329] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'স্কিপ করুন' : 'Skip'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setErrorMessage('');
                    setStep(5);
                  }}
                  className="flex-1 h-12 rounded-2xl bg-[#0866FF] active:bg-[#0756d6] items-center justify-center shadow-sm shadow-[#0866FF]/20"
                >
                  <Text className="text-[14px] font-bold text-white">
                    {locale === 'bn' ? 'পরবর্তী' : 'Next'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* STEP 5: Blood Group */}
          {step === 5 && (
            <View className="space-y-4 gap-4">
              {/* 8 Blood Group Cards */}
              <View className="flex-row flex-wrap gap-2.5 py-1 justify-between">
                {BLOOD_GROUPS.map((bg) => {
                  const isSelected = bloodGroup === bg.value;
                  return (
                    <Pressable
                      key={bg.value}
                      onPress={() =>
                        setBloodGroup(isSelected ? undefined : bg.value)
                      }
                      className={`w-[22.5%] h-12 flex-row items-center justify-center gap-1.5 rounded-2xl active:scale-95 ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800'
                          : 'bg-[#f0f2f5] dark:bg-[#242526]'
                      }`}
                    >
                      <AppIcon
                        android="water_drop"
                        size={15}
                        color={isSelected ? '#e11d48' : '#8a8d91'}
                      />
                      <Text
                        className={`text-[14px] font-bold ${
                          isSelected
                            ? 'text-rose-600 dark:text-rose-300'
                            : 'text-[#1e2329] dark:text-[#e4e6eb]'
                        }`}
                      >
                        {bg.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Step 5 Action Buttons: Skip or Complete */}
              <View className="flex-row gap-3 pt-2">
                <Pressable
                  onPress={() => handleFinalSubmit(false)}
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-2xl bg-[#f0f2f5] dark:bg-[#242526] active:bg-[#e4e6eb] dark:active:bg-[#3a3b3c] items-center justify-center"
                >
                  <Text className="text-[14px] font-bold text-[#1e2329] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'স্কিপ করুন' : 'Skip & Finish'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleFinalSubmit(true)}
                  disabled={isSubmitting}
                  className={`flex-1 h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-[#0866FF] active:bg-[#0756d6] shadow-sm shadow-[#0866FF]/20 ${
                    isSubmitting ? 'opacity-70' : ''
                  }`}
                >
                  {isSubmitting && (
                    <ActivityIndicator size="small" color="#ffffff" />
                  )}
                  <Text className="text-[14px] font-bold text-white">
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

          {/* Bottom Switch: Log In Prompt */}
          <View className="flex-row items-center justify-center gap-1.5 mt-8 py-2">
            <Text className="text-[13.5px] text-[#65676b] dark:text-[#b0b3b8]">
              {locale === 'bn'
                ? 'আগে থেকেই অ্যাকাউন্ট আছে?'
                : 'Already have an account?'}
            </Text>
            <Pressable
              onPress={() => router.push('/login')}
              hitSlop={8}
              className="py-1"
            >
              <Text className="text-[14px] font-bold text-[#0866FF] dark:text-[#36a4fa]">
                {locale === 'bn' ? 'লগইন করুন' : 'Log In'}
              </Text>
            </Pressable>
          </View>

          {/* Peaceful Platform Tagline */}
          <Text className="text-[11.5px] text-[#8a8d91] dark:text-[#73767a] text-center mt-6">
            {locale === 'bn'
              ? 'PeaceTweet • বিশুদ্ধ দোয়া ও পবিত্র সোশ্যাল নেটওয়ার্ক'
              : 'PeaceTweet • Pure Duas & Peaceful Social Platform'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
