import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useFeed } from '@/providers/FeedProvider';
import { AppIcon } from '@/components/ui/Icon';
import { profileApi } from '@/features/profile/api/profile.api';
import {
  uploadsApi,
  normalizeMediaUrl,
} from '@/features/uploads/api/uploads.api';
import {
  LocationSelector,
  LocationValue,
} from '@/components/ui/LocationSelector';
import { matchUserLocationToGeo } from '@/constants/bangladeshGeo';
import { BloodGroup, User } from '@/types/user.types';
import { AuthPromptScreen } from '@/components/ui/AuthPromptCard';
import {
  PhotoEditorModal,
  PhotoEditorMode,
} from '@/features/profile/components/PhotoEditorModal';

const BLOOD_GROUPS: { value: BloodGroup | 'NONE'; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'A_POSITIVE', label: 'A+' },
  { value: 'A_NEGATIVE', label: 'A-' },
  { value: 'B_POSITIVE', label: 'B+' },
  { value: 'B_NEGATIVE', label: 'B-' },
  { value: 'AB_POSITIVE', label: 'AB+' },
  { value: 'AB_NEGATIVE', label: 'AB-' },
  { value: 'O_POSITIVE', label: 'O+' },
  { value: 'O_NEGATIVE', label: 'O-' },
];

export default function EditProfileScreen() {
  const { locale, theme } = useUi();
  const {
    user,
    setUser,
    refreshUser,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuth();
  const { refreshFeed } = useFeed();

  // Form States
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | 'NONE'>('NONE');
  const [isDonor, setIsDonor] = useState(false);
  const [donationCount, setDonationCount] = useState('0');

  // Location State (Cascading Division, District, Upazila / Area like Blood Donation)
  const [locationValue, setLocationValue] = useState<LocationValue>(() =>
    matchUserLocationToGeo(user)
  );

  // Upload States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Interactive Photo Editor Modal (Reposition & Resize)
  const [photoEditorMode, setPhotoEditorMode] =
    useState<PhotoEditorMode>('cover');
  const [photoEditorSrc, setPhotoEditorSrc] = useState<string | null>(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);

  // Submit States
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync initial user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatarUrl(normalizeMediaUrl(user.avatarUrl));
      setCoverUrl(normalizeMediaUrl(user.coverUrl));
      setBloodGroup(user.bloodGroup || 'NONE');
      setIsDonor(Boolean(user.isDonor));
      setDonationCount(String(user.donationCount || 0));
      setLocationValue(matchUserLocationToGeo(user));
    }
  }, [user]);

  if (!isAuthenticated && !isAuthLoading) {
    return (
      <AuthPromptScreen
        icon="person"
        iconBgColor="bg-primary-50 dark:bg-primary-950/60"
        iconColor="#1877f2"
        titleBn="প্রোফাইল সম্পাদনা করতে লগইন করুন"
        titleEn="Sign in to edit your profile"
        descriptionBn="প্রোফাইলের ছবি, কভার, নাম ও তথ্য পরিবর্তন করতে অ্যাকাউন্টে প্রবেশ করুন।"
        descriptionEn="Log in to update your avatar, cover photo, bio, and personal details."
      />
    );
  }

  // Direct Photo Picker -> opens PhotoEditorModal for reposition & resize
  const handlePickPhoto = (type: PhotoEditorMode) => {
    if (typeof document === 'undefined') return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';

    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      const previewUrl = URL.createObjectURL(file);
      setPhotoEditorMode(type);
      setPhotoEditorSrc(previewUrl);
      setIsPhotoEditorOpen(true);
    };

    document.body.appendChild(input);
    input.click();
    setTimeout(() => {
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    }, 1000);
  };

  // Open existing photo in PhotoEditorModal to reposition & resize
  const openRepositionEditor = (type: PhotoEditorMode) => {
    const existingUrl = type === 'avatar' ? avatarUrl : coverUrl;
    if (!existingUrl) {
      handlePickPhoto(type);
      return;
    }
    setPhotoEditorMode(type);
    setPhotoEditorSrc(normalizeMediaUrl(existingUrl));
    setIsPhotoEditorOpen(true);
  };

  // Upload cropped/resized photo from PhotoEditorModal
  const handleSaveEditedPhoto = async (
    croppedFile: File | Blob,
    filename: string
  ) => {
    const type = photoEditorMode;
    const previewUrl = URL.createObjectURL(croppedFile);

    if (type === 'avatar') {
      setAvatarUrl(previewUrl);
      setIsUploadingAvatar(true);
    } else {
      setCoverUrl(previewUrl);
      setIsUploadingCover(true);
    }
    setIsPhotoEditorOpen(false);
    setErrorMessage(null);

    try {
      const result = await uploadsApi.uploadImage(croppedFile, filename);
      if (result?.url) {
        if (type === 'avatar') {
          setAvatarUrl(result.url);
        } else {
          setCoverUrl(result.url);
        }
      }
    } catch (err: any) {
      console.warn('Image upload notice:', err?.message);
    } finally {
      if (type === 'avatar') {
        setIsUploadingAvatar(false);
      } else {
        setIsUploadingCover(false);
      }
    }
  };

  // Handle Save
  const handleSave = async () => {
    if (isSaving || isUploadingAvatar || isUploadingCover) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage(
        locale === 'bn' ? 'নাম খালি রাখা যাবে না।' : 'Name cannot be empty.'
      );
      return;
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername && trimmedUsername.length < 3) {
      setErrorMessage(
        locale === 'bn'
          ? 'ইউজারনেম অন্তত ৩ অক্ষরের হতে হবে।'
          : 'Username must be at least 3 characters.'
      );
      return;
    }

    if (trimmedUsername && trimmedUsername.length > 10) {
      setErrorMessage(
        locale === 'bn'
          ? 'ইউজারনেম সর্বোচ্চ ১০ অক্ষরের হতে হবে।'
          : 'Username must not exceed 10 characters.'
      );
      return;
    }

    if (trimmedUsername && !/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      setErrorMessage(
        locale === 'bn'
          ? 'ইউজারনেমে শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা, আন্ডারস্কোর (_) এবং হাইফেন (-) ব্যবহার করা যাবে।'
          : 'Username can only contain alphanumeric characters, hyphens and underscores.'
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<User> = {
        name: trimmedName,
        bio: bio.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        coverUrl: coverUrl.trim() || null,
        country: locationValue.country || 'Bangladesh',
        countryCode: locationValue.countryCode || 'BD',
        state: locationValue.state || null,
        city: locationValue.city || null,
        location: locationValue.location ? locationValue.location.trim() : null,
        bloodGroup: bloodGroup === 'NONE' ? null : bloodGroup,
        isDonor,
        donationCount: Math.max(0, parseInt(donationCount, 10) || 0),
      };

      if (trimmedUsername && trimmedUsername !== user?.username) {
        payload.username = trimmedUsername;
      }

      const updatedUser = await profileApi.updateProfile(payload);
      if (updatedUser) {
        const merged = { ...(user || {}), ...updatedUser };
        setUser(merged as User);
      }
      await Promise.all([refreshUser(), refreshFeed()]);

      setSuccessMessage(
        locale === 'bn'
          ? 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে!'
          : 'Profile updated successfully!'
      );

      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/profile');
        }
      }, 800);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (locale === 'bn'
          ? 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে।'
          : 'Failed to update profile.');
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-[#e6e9ef] dark:bg-[#18191a]">
      {/* Top Facebook-Style Header Bar */}
      <View className="w-full bg-white dark:bg-[#242526] border-b border-[#e4e6eb] dark:border-[#393a3b] px-4 py-3 flex-row items-center justify-between sticky top-0 z-30">
        <View className="flex-row items-center gap-2.5">
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/settings');
              }
            }}
            className="h-9 w-9 rounded-full bg-[#e6e9ef] dark:bg-[#3a3b3c] items-center justify-center active:scale-95">
            <AppIcon
              android="arrow_back"
              size={20}
              color={theme === 'dark' ? '#e4e6eb' : '#050505'}
            />
          </Pressable>
          <View>
            <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
              {locale === 'bn' ? 'প্রোফাইল সম্পাদনা' : 'Edit Profile'}
            </Text>
            <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
              @{user?.username || 'profile'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={isSaving || isUploadingAvatar || isUploadingCover}
          className="flex-row items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 shadow-sm active:scale-95 disabled:opacity-70"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <AppIcon android="check" size={16} color="#ffffff" />
              <Text className="text-xs font-bold text-white">
                {locale === 'bn' ? 'সংরক্ষণ' : 'Save'}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 8,
          paddingTop: 10,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-[768px] mx-auto space-y-3.5">
          {/* Feedback Messages */}
          {errorMessage && (
            <View className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex-row items-center gap-2.5">
              <AppIcon android="error" size={18} color="#e11d48" />
              <Text className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex-1">
                {errorMessage}
              </Text>
            </View>
          )}

          {successMessage && (
            <View className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex-row items-center gap-2.5">
              <AppIcon android="check_circle" size={18} color="#10b981" />
              <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex-1">
                {successMessage}
              </Text>
            </View>
          )}

          {/* ======================================================== */}
          {/* 1. Facebook-Style Profile Picture Section                */}
          {/* ======================================================== */}
          <View className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-4 shadow-xs">
            <View className="flex-row items-center justify-between pb-3 border-b border-[#e6e9ef] dark:border-[#393a3b]">
              <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'প্রোফাইল ছবি' : 'Profile picture'}
              </Text>
              <View className="flex-row items-center gap-3">
                {avatarUrl ? (
                  <Pressable
                    onPress={() => openRepositionEditor('avatar')}
                    disabled={isUploadingAvatar}
                    className="flex-row items-center gap-1 rounded-lg bg-[#e6e9ef] dark:bg-[#3a3b3c] px-2.5 py-1 active:opacity-70"
                  >
                    <AppIcon android="open_with" size={13} color="#059669" />
                    <Text className="text-[11px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                      {locale === 'bn' ? 'পজিশন ও রিসাইজ' : 'Reposition'}
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => handlePickPhoto('avatar')}
                  disabled={isUploadingAvatar}
                  className="active:opacity-70"
                >
                  <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">
                    {isUploadingAvatar
                      ? locale === 'bn'
                        ? 'আপলোড হচ্ছে...'
                        : 'Uploading...'
                      : locale === 'bn'
                        ? 'সম্পাদনা'
                        : 'Edit'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="items-center py-4">
              <Pressable
                onPress={() => handlePickPhoto('avatar')}
                disabled={isUploadingAvatar}
                className="relative active:scale-95"
              >
                <View className="h-32 w-32 rounded-full border-4 border-white dark:border-[#3a3b3c] bg-primary-600 shadow-lg items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-white text-5xl font-black">
                      {name?.charAt(0)?.toUpperCase() || 'P'}
                    </Text>
                  )}

                  {isUploadingAvatar && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                      <ActivityIndicator size="small" color="#ffffff" />
                    </View>
                  )}
                </View>

                {/* Camera Overlay Badge */}
                <View className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-primary-600 border-2 border-white dark:border-[#242526] items-center justify-center shadow-md">
                  <AppIcon android="photo_camera" size={17} color="#ffffff" />
                </View>
              </Pressable>
              <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] mt-2">
                {locale === 'bn'
                  ? 'গ্যালারি বা কম্পিউটার থেকে সরাসরি ছবি বেছে নিন'
                  : 'Tap to pick photo from gallery or device'}
              </Text>
            </View>
          </View>

          {/* ======================================================== */}
          {/* 2. Facebook-Style Cover Photo Section                    */}
          {/* ======================================================== */}
          <View className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-4 shadow-xs">
            <View className="flex-row items-center justify-between pb-3 border-b border-[#e6e9ef] dark:border-[#393a3b]">
              <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'কভার ছবি' : 'Cover photo'}
              </Text>
              <View className="flex-row items-center gap-3">
                {coverUrl ? (
                  <Pressable
                    onPress={() => openRepositionEditor('cover')}
                    disabled={isUploadingCover}
                    className="flex-row items-center gap-1 rounded-lg bg-[#e6e9ef] dark:bg-[#3a3b3c] px-2.5 py-1 active:opacity-70"
                  >
                    <AppIcon android="open_with" size={13} color="#059669" />
                    <Text className="text-[11px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                      {locale === 'bn' ? 'পজিশন ও রিসাইজ' : 'Reposition'}
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => handlePickPhoto('cover')}
                  disabled={isUploadingCover}
                  className="active:opacity-70"
                >
                  <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">
                    {isUploadingCover
                      ? locale === 'bn'
                        ? 'আপলোড হচ্ছে...'
                        : 'Uploading...'
                      : locale === 'bn'
                        ? 'সম্পাদনা'
                        : 'Edit'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="pt-3">
              <Pressable
                onPress={() => handlePickPhoto('cover')}
                disabled={isUploadingCover}
                className="relative w-full h-40 sm:h-48 rounded-2xl bg-[#e4e6eb] dark:bg-[#3a3b3c] overflow-hidden border border-[#ced0d4] dark:border-[#4a4b4d] active:opacity-90"
              >
                {coverUrl ? (
                  <Image
                    source={{ uri: coverUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center bg-linear-to-r from-emerald-800 via-teal-700 to-primary-800">
                    <AppIcon android="photo" size={36} color="#ffffff" />
                    <Text className="text-white text-xs font-bold mt-1.5 opacity-90">
                      {locale === 'bn'
                        ? 'কভার ছবি যুক্ত করুন'
                        : 'Add Cover Photo'}
                    </Text>
                  </View>
                )}

                {isUploadingCover && (
                  <View className="absolute inset-0 bg-black/50 items-center justify-center">
                    <ActivityIndicator size="large" color="#ffffff" />
                    <Text className="text-white text-xs font-bold mt-2">
                      {locale === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...'}
                    </Text>
                  </View>
                )}

                {/* Edit Cover Overlay Pill */}
                <View className="absolute bottom-2.5 right-2.5 bg-black/65 px-3 py-1.5 rounded-xl flex-row items-center gap-1.5">
                  <AppIcon android="photo_camera" size={15} color="#ffffff" />
                  <Text className="text-white text-xs font-bold">
                    {locale === 'bn' ? 'কভার পরিবর্তন' : 'Edit'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* ======================================================== */}
          {/* 3. Facebook-Style Bio Section                            */}
          {/* ======================================================== */}
          <View className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-4 shadow-xs">
            <View className="flex-row items-center justify-between pb-2 border-b border-[#e6e9ef] dark:border-[#393a3b]">
              <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'বায়ো / পরিচিতি' : 'Bio'}
              </Text>
              <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                {bio.length}/250
              </Text>
            </View>

            <View className="pt-3">
              <TextInput
                value={bio}
                onChangeText={(val) => setBio(val.slice(0, 250))}
                multiline
                numberOfLines={3}
                placeholder={
                  locale === 'bn'
                    ? 'নিজের সম্পর্কে কিছু লিখুন... (যেমন: শান্তিময় জীবন প্রত্যাশী)'
                    : 'Describe who you are...'
                }
                placeholderTextColor="#8a8d91"
                textAlignVertical="top"
                className="w-full min-h-[85px] rounded-xl border border-[#ced0d4] dark:border-[#4a4b4d] bg-[#e6e9ef] dark:bg-[#3a3b3c]/60 p-3.5 text-xs sm:text-sm text-[#050505] dark:text-[#e4e6eb]"
              />
            </View>
          </View>

          {/* ======================================================== */}
          {/* 4. Customize Details (Location & Blood Donation)         */}
          {/* ======================================================== */}
          <View className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-4 shadow-xs space-y-4">
            <View className="flex-row items-center justify-between pb-2 border-b border-[#e6e9ef] dark:border-[#393a3b]">
              <View>
                <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'বিস্তারিত বিবরণ' : 'Details'}
                </Text>
                <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                  {locale === 'bn'
                    ? 'অবস্থান এবং রক্তদানের তথ্য'
                    : 'Location and blood donation preferences'}
                </Text>
              </View>
            </View>

            {/* Location Selector (Matching Blood Donation Cascading Geo Selector) */}
            <View className="space-y-2">
              <View className="flex-row items-center gap-1.5">
                <AppIcon android="location_on" size={17} color="#e11d48" />
                <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn'
                    ? 'বর্তমান অবস্থান (রক্তদানের মতো ফিল্টার)'
                    : 'Location (District & Division)'}
                </Text>
              </View>

              <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn'
                  ? 'আপনার বিভাগ, জেলা এবং উপজেলা নির্বাচন করুন যাতে রক্তের প্রয়োজনে আপনাকে সহজে খুঁজে পাওয়া যায়।'
                  : 'Select your Division, District and Upazila like in Blood Donation.'}
              </Text>

              {/* The Reusable Cascading LocationSelector */}
              <View className="mt-1">
                <LocationSelector
                  value={locationValue}
                  onChange={(loc) => setLocationValue(loc)}
                />
              </View>
            </View>

            <View className="h-px bg-[#e6e9ef] dark:bg-[#393a3b]" />

            {/* Blood Donation Section */}
            <View className="space-y-3">
              <View className="flex-row items-center gap-1.5">
                <AppIcon android="water_drop" size={17} color="#e11d48" />
                <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn'
                    ? 'রক্তের গ্রুপ ও রক্তদান'
                    : 'Blood Group & Donor Status'}
                </Text>
              </View>

              {/* Blood Group Pills */}
              <View className="flex-row flex-wrap gap-2 pt-1">
                {BLOOD_GROUPS.map((bg) => {
                  const isSelected = bloodGroup === bg.value;
                  return (
                    <Pressable
                      key={bg.value}
                      onPress={() => setBloodGroup(bg.value)}
                      className={`px-3.5 py-2 rounded-xl border active:scale-95 ${
                        isSelected
                          ? 'bg-rose-600 border-rose-600 shadow-xs'
                          : 'bg-[#e6e9ef] dark:bg-[#3a3b3c] border-[#ced0d4] dark:border-[#4a4b4d]'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelected
                            ? 'text-white'
                            : 'text-[#050505] dark:text-[#e4e6eb]'
                        }`}
                      >
                        {bg.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Donor Switch */}
              <View className="flex-row items-center justify-between pt-2">
                <View className="flex-1 pr-3">
                  <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn'
                      ? 'রক্তদাতা হিসেবে প্রস্তুত'
                      : 'Available as Blood Donor'}
                  </Text>
                  <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn'
                      ? 'জরুরি রক্তের প্রয়োজনে অন্যরা আপনাকে খুঁজে পাবে'
                      : 'Show up in donors search for your location'}
                  </Text>
                </View>
                <Switch
                  value={isDonor}
                  onValueChange={setIsDonor}
                  trackColor={{ false: '#ced0d4', true: '#e11d48' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Donation Count */}
              {isDonor && (
                <View className="flex-row items-center justify-between pt-2 border-t border-[#e6e9ef] dark:border-[#393a3b]">
                  <View>
                    <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                      {locale === 'bn'
                        ? 'মোট রক্তদানের সংখ্যা'
                        : 'Donations Count'}
                    </Text>
                    <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                      {locale === 'bn'
                        ? 'কতবার রক্ত দিয়েছেন'
                        : 'Number of times you donated'}
                    </Text>
                  </View>
                  <TextInput
                    value={donationCount}
                    onChangeText={setDonationCount}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#8a8d91"
                    className="w-24 text-center rounded-xl border border-[#ced0d4] dark:border-[#4a4b4d] bg-[#e6e9ef] dark:bg-[#3a3b3c] py-2 text-xs font-bold text-[#050505] dark:text-[#e4e6eb]"
                  />
                </View>
              )}
            </View>
          </View>

          {/* ======================================================== */}
          {/* 5. Basic Information (Name & Username)                   */}
          {/* ======================================================== */}
          <View className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-4 shadow-xs space-y-3">
            <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] pb-2 border-b border-[#e6e9ef] dark:border-[#393a3b]">
              {locale === 'bn' ? 'মৌলিক পরিচিতি' : 'Basic info'}
            </Text>

            {/* Name */}
            <View className="space-y-1">
              <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'পুরো নাম *' : 'Full Name *'}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={
                  locale === 'bn' ? 'আপনার নাম লিখুন' : 'Enter your name'
                }
                placeholderTextColor="#8a8d91"
                className="w-full rounded-xl border border-[#ced0d4] dark:border-[#4a4b4d] bg-[#e6e9ef] dark:bg-[#3a3b3c]/60 px-3 py-2.5 text-xs text-[#050505] dark:text-[#e4e6eb] font-medium"
              />
            </View>

            {/* Username */}
            <View className="space-y-1">
              <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'ইউজারনেম' : 'Username'}
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholder="username"
                placeholderTextColor="#8a8d91"
                className="w-full rounded-xl border border-[#ced0d4] dark:border-[#4a4b4d] bg-[#e6e9ef] dark:bg-[#3a3b3c]/60 px-3 py-2.5 text-xs text-[#050505] dark:text-[#e4e6eb]"
              />
            </View>

            {/* Email (Readonly) */}
            <View className="space-y-1">
              <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn' ? 'ইমেইল (অপরিবর্তনীয়)' : 'Email (Read only)'}
              </Text>
              <TextInput
                value={user?.email || ''}
                editable={false}
                className="w-full rounded-xl border border-[#ced0d4] dark:border-[#4a4b4d] bg-gray-100 dark:bg-[#3a3b3c]/40 px-3 py-2.5 text-xs text-[#65676b] dark:text-[#b0b3b8]"
              />
            </View>
          </View>

          {/* Bottom Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={isSaving || isUploadingAvatar || isUploadingCover}
            className="w-full flex-row items-center justify-center gap-2 p-3.5 rounded-2xl bg-primary-600 shadow-md active:scale-98 disabled:opacity-70 mt-2"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <AppIcon android="check" size={18} color="#ffffff" />
                <Text className="text-sm font-bold text-white">
                  {locale === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Interactive Cover & Profile Photo Editor Modal (Reposition & Resize) */}
      <PhotoEditorModal
        isOpen={isPhotoEditorOpen}
        mode={photoEditorMode}
        imageSrc={photoEditorSrc}
        isSaving={isUploadingAvatar || isUploadingCover}
        onClose={() => setIsPhotoEditorOpen(false)}
        onPickAnother={() => handlePickPhoto(photoEditorMode)}
        onSave={handleSaveEditedPhoto}
      />
    </View>
  );
}
