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

  // Step 4: Location
  const [country, setCountry] = useState('Bangladesh');
  const [stateName, setStateName] = useState('');
  const [city, setCity] = useState('');

  // Step 5: Blood Group
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | undefined>(
    undefined
  );

  const [errorMessage, setErrorMessage] = useState('');

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
    setErrorMessage('');

    const formattedLocation = [city.trim(), stateName.trim(), country.trim()]
      .filter(Boolean)
      .join(', ');

    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        country: formattedLocation ? country.trim() : undefined,
        countryCode: formattedLocation ? 'BD' : undefined,
        state: stateName.trim() || undefined,
        city: city.trim() || undefined,
        location: formattedLocation || undefined,
        bloodGroup: includeBloodGroup ? bloodGroup : undefined,
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (locale === 'bn'
          ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। ভিন্ন ইমেইল দিয়ে পুনরায় চেষ্টা করুন।'
          : 'Registration failed. Please try a different email.');
      setErrorMessage(
        Array.isArray(msg) ? msg.join(', ') : String(msg)
      );
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      contentContainerClassName="flex-grow items-center justify-center px-2 py-4">
      {/* Header matching RegisterView.tsx */}
      <View className="items-center mb-4">
        <Pressable onPress={() => router.push('/')}>
          <Text className="text-3xl font-black text-primary-600 dark:text-primary-400 mb-1">
            PeaceTweet
          </Text>
        </Pressable>
        <Text className="text-sm font-semibold text-[#65676b] dark:text-[#b0b3b8]">
          {locale === 'bn'
            ? 'নতুন অ্যাকাউন্ট তৈরি করুন'
            : 'Create an Account'}
        </Text>
      </View>

      {/* Main Card matching RegisterView.tsx */}
      <View className="w-full max-w-[390px] rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] shadow-xl p-5">
        {/* Step Progress Header */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1.5">
              {step > 1 && (
                <Pressable
                  onPress={() => {
                    setErrorMessage('');
                    setStep((s) =>
                      s > 1 ? ((s - 1) as 1 | 2 | 3 | 4 | 5) : 1
                    );
                  }}
                  className="p-1 -ml-1 rounded-lg bg-[#f0f2f5] dark:bg-[#3a3b3c]">
                  <AppIcon
                    android="arrow_back"
                    ios="arrow.left"
                    size={16}
                    color={theme === 'dark' ? '#e4e6eb' : '#050505'}
                  />
                </Pressable>
              )}
              <Text className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase">
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
          <View className="flex-row gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <View
                key={s}
                className={`flex-1 h-1 rounded-full ${
                  s <= step
                    ? 'bg-primary-500 dark:bg-primary-400'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </View>
        </View>

        {/* Error Message Banner */}
        {errorMessage !== '' && (
          <View className="mb-3 rounded-xl bg-red-50 p-2.5 border border-red-200 dark:bg-red-950/60 dark:border-red-900">
            <Text className="text-xs text-red-600 dark:text-red-300 font-semibold">
              {errorMessage}
            </Text>
          </View>
        )}

        {/* STEP 1: Name & Email */}
        {step === 1 && (
          <View className="gap-3">
            <View className="items-center pb-1">
              <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'আপনার তথ্য দিন' : 'Your Basic Info'}
              </Text>
              <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-0.5 text-center">
                {locale === 'bn'
                  ? 'শুরু করতে আপনার পূর্ণ নাম ও ইমেইল লিখুন'
                  : 'Enter your full name and email to get started'}
              </Text>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'আপনার পূর্ণ নাম' : 'Full Name'}
              </Text>
              <View className="flex-row items-center rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#3a3b3c] dark:border-[#393a3b] px-3 h-10 gap-2">
                <AppIcon android="person" size={16} color="#65676b" />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={
                    locale === 'bn'
                      ? 'যেমন: আবদুল্লাহ হাসান'
                      : 'e.g. Abdullah Hasan'
                  }
                  placeholderTextColor={
                    theme === 'dark' ? '#b0b3b8' : '#8e8e93'
                  }
                  className="flex-1 text-sm text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address'}
              </Text>
              <View className="flex-row items-center rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#3a3b3c] dark:border-[#393a3b] px-3 h-10 gap-2">
                <AppIcon android="mail" size={16} color="#65676b" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={
                    theme === 'dark' ? '#b0b3b8' : '#8e8e93'
                  }
                  className="flex-1 text-sm text-[#050505] dark:text-[#e4e6eb]"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <Pressable
              onPress={handleProceedFromStep1}
              className="w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary-500 py-2.5 mt-1">
              <Text className="text-white font-bold text-sm">
                {locale === 'bn' ? 'পরবর্তী ধাপে যান' : 'Continue'}
              </Text>
              <AppIcon
                android="arrow_forward"
                ios="arrow.right"
                size={16}
                color="#ffffff"
              />
            </Pressable>

            <View className="items-center pt-2.5 border-t border-[#e4e6eb] dark:border-[#393a3b]">
              <Pressable onPress={() => router.push('/login')}>
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                  {locale === 'bn'
                    ? 'আগে থেকেই অ্যাকাউন্ট আছে? '
                    : 'Already have an account? '}
                  <Text className="font-bold text-primary-600 dark:text-primary-400">
                    {locale === 'bn' ? 'লগইন করুন' : 'Log In'}
                  </Text>
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 2: Password & Confirm Password */}
        {step === 2 && (
          <View className="gap-3">
            <View className="items-center pb-1">
              <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn'
                  ? 'একটি শক্তিশালী পাসওয়ার্ড দিন'
                  : 'Create a Password'}
              </Text>
              <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-0.5 text-center">
                {locale === 'bn'
                  ? 'নিরাপত্তার স্বার্থে কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড ব্যবহার করুন'
                  : 'Use at least 6 characters to secure your account'}
              </Text>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn'
                  ? 'পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)'
                  : 'Password (min. 6 chars)'}
              </Text>
              <View className="flex-row items-center rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#3a3b3c] dark:border-[#393a3b] px-3 h-10 gap-2">
                <AppIcon android="lock" size={16} color="#65676b" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor={
                    theme === 'dark' ? '#b0b3b8' : '#8e8e93'
                  }
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

            <View className="gap-1">
              <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
              </Text>
              <View className="flex-row items-center rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#3a3b3c] dark:border-[#393a3b] px-3 h-10 gap-2">
                <AppIcon android="lock" size={16} color="#65676b" />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={
                    theme === 'dark' ? '#b0b3b8' : '#8e8e93'
                  }
                  className="flex-1 text-sm text-[#050505] dark:text-[#e4e6eb]"
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1">
                  <AppIcon
                    android={
                      showConfirmPassword ? 'visibility_off' : 'visibility'
                    }
                    size={16}
                    color="#9ca3af"
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleProceedFromStep2}
              className="w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary-500 py-2.5 mt-1">
              <Text className="text-white font-bold text-sm">
                {locale === 'bn' ? 'পরবর্তী ধাপে যান' : 'Continue'}
              </Text>
              <AppIcon
                android="arrow_forward"
                ios="arrow.right"
                size={16}
                color="#ffffff"
              />
            </Pressable>
          </View>
        )}

        {/* STEP 3: Profile Photo (Optional / Skip) */}
        {step === 3 && (
          <View className="gap-4">
            <View className="items-center">
              <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn'
                  ? 'প্রোফাইল ছবি যুক্ত করুন'
                  : 'Add a Profile Photo'}
              </Text>
              <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-0.5 text-center">
                {locale === 'bn'
                  ? 'বন্ধুদের আপনাকে চিনতে সুবিধা হবে (ঐচ্ছিক)'
                  : 'Help friends recognize you (optional)'}
              </Text>
            </View>

            <View className="items-center justify-center py-2">
              <View className="h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/80">
                <AppIcon
                  android="photo_camera"
                  ios="camera.fill"
                  size={28}
                  color="#1877f2"
                />
                <Text className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 mt-1">
                  {name ? name.charAt(0).toUpperCase() : 'Upload'}
                </Text>
              </View>
              <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] mt-2">
                {locale === 'bn'
                  ? 'পরবর্তীতে প্রোফাইল থেকেও ছবি পরিবর্তন করা যাবে'
                  : 'You can also update your photo later in Profile'}
              </Text>
            </View>

            <View className="flex-row gap-2.5 pt-1">
              <Pressable
                onPress={() => {
                  setErrorMessage('');
                  setStep(4);
                }}
                className="flex-1 rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] py-2.5 items-center">
                <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'স্কিপ করুন' : 'Skip'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setErrorMessage('');
                  setStep(4);
                }}
                className="flex-1 rounded-xl bg-primary-500 py-2.5 items-center">
                <Text className="text-xs font-bold text-white">
                  {locale === 'bn' ? 'পরবর্তী' : 'Next'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 4: Location (Optional / Skip) */}
        {step === 4 && (
          <View className="gap-3">
            <View className="items-center">
              <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'আপনার লোকেশন' : 'Your Location'}
              </Text>
              <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-0.5 text-center">
                {locale === 'bn'
                  ? 'আপনার দেশ ও বিভাগ/এলাকা নির্বাচন করুন (ঐচ্ছিক)'
                  : 'Select your country and area (optional)'}
              </Text>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'দেশ (Country)' : 'Country'}
              </Text>
              <TextInput
                value={country}
                onChangeText={setCountry}
                placeholder="Bangladesh"
                placeholderTextColor={theme === 'dark' ? '#b0b3b8' : '#8e8e93'}
                className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#3a3b3c] dark:border-[#393a3b] px-3 h-10 text-sm text-[#050505] dark:text-[#e4e6eb]"
              />
            </View>

            <View className="gap-1">
              <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'বিভাগ / রাজ্য (Division/State)' : 'State / Division'}
              </Text>
              <TextInput
                value={stateName}
                onChangeText={setStateName}
                placeholder={locale === 'bn' ? 'যেমন: Dhaka' : 'e.g. Dhaka'}
                placeholderTextColor={theme === 'dark' ? '#b0b3b8' : '#8e8e93'}
                className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#3a3b3c] dark:border-[#393a3b] px-3 h-10 text-sm text-[#050505] dark:text-[#e4e6eb]"
              />
            </View>

            <View className="gap-1">
              <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'জেলা / শহর (District/City)' : 'City / District'}
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder={
                  locale === 'bn' ? 'যেমন: Mirpur, Dhaka' : 'e.g. Mirpur, Dhaka'
                }
                placeholderTextColor={theme === 'dark' ? '#b0b3b8' : '#8e8e93'}
                className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#3a3b3c] dark:border-[#393a3b] px-3 h-10 text-sm text-[#050505] dark:text-[#e4e6eb]"
              />
            </View>

            <View className="flex-row gap-2.5 pt-1">
              <Pressable
                onPress={() => {
                  setErrorMessage('');
                  setCountry('');
                  setStateName('');
                  setCity('');
                  setStep(5);
                }}
                className="flex-1 rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] py-2.5 items-center">
                <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'স্কিপ করুন' : 'Skip'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setErrorMessage('');
                  setStep(5);
                }}
                className="flex-1 rounded-xl bg-primary-500 py-2.5 items-center">
                <Text className="text-xs font-bold text-white">
                  {locale === 'bn' ? 'পরবর্তী' : 'Next'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 5: Blood Group (Optional / Complete) */}
        {step === 5 && (
          <View className="gap-4">
            <View className="items-center">
              <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn'
                  ? 'রক্তের গ্রুপ নির্বাচন করুন'
                  : 'Select Blood Group'}
              </Text>
              <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-0.5 text-center">
                {locale === 'bn'
                  ? 'জরুরি রক্তদানের সুবিধার্থে আপনার রক্তের গ্রুপ দিন (ঐচ্ছিক)'
                  : 'Help in emergencies by sharing your blood group (optional)'}
              </Text>
            </View>

            {/* 8 Blood Group Chips */}
            <View className="flex-row flex-wrap gap-2 py-1">
              {BLOOD_GROUPS.map((bg) => {
                const isSelected = bloodGroup === bg.value;
                return (
                  <Pressable
                    key={bg.value}
                    onPress={() =>
                      setBloodGroup(isSelected ? undefined : bg.value)
                    }
                    className={`w-[23%] flex-row items-center justify-center gap-1 rounded-xl border py-2.5 ${
                      isSelected
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/60'
                        : 'border-[#e4e6eb] bg-[#f0f2f5] dark:border-[#393a3b] dark:bg-[#3a3b3c]'
                    }`}>
                    <AppIcon
                      android="water_drop"
                      size={14}
                      color="#ef4444"
                    />
                    <Text
                      className={`text-xs font-bold ${
                        isSelected
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-[#050505] dark:text-[#e4e6eb]'
                      }`}>
                      {bg.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Step 5 Actions: Skip or Complete */}
            <View className="flex-row gap-2.5 pt-1">
              <Pressable
                onPress={() => handleFinalSubmit(false)}
                disabled={isRegistering}
                className="flex-1 rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] py-2.5 items-center">
                <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'স্কিপ করুন' : 'Skip & Finish'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleFinalSubmit(true)}
                disabled={isRegistering}
                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-primary-500 py-2.5 ${
                  isRegistering ? 'opacity-70' : ''
                }`}>
                {isRegistering && (
                  <ActivityIndicator size="small" color="#ffffff" />
                )}
                <Text className="text-xs font-bold text-white">
                  {isRegistering
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

      <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] text-center mt-3">
        {locale === 'bn'
          ? 'PeaceTweet — বিশুদ্ধ দোয়া ও পবিত্র সোশ্যাল প্ল্যাটফর্ম'
          : 'PeaceTweet — A Peaceful Islamic Social Platform'}
      </Text>
    </ScrollView>
  );
}
