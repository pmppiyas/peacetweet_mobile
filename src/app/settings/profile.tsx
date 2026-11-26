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
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import { useGoogleAuth } from '@/features/auth/hooks/useGoogleAuth';
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
import * as ImagePicker from 'expo-image-picker';
import { UploadableImage } from '@/features/uploads/api/uploads.api';

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
  const { locale, theme, setIsProfileActive, showToast } = useUi();
  const {
    user,
    setUser,
    refreshUser,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuth();
  const { refreshFeed } = useFeed();
  const { promptGoogleTokens } = useGoogleAuth();

  useEffect(() => {
    setIsProfileActive(true);
    return () => {
      setIsProfileActive(false);
    };
  }, [setIsProfileActive]);

  // Form States
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isConfirmingOtp, setIsConfirmingOtp] = useState(false);
  const [isVerifyingGoogle, setIsVerifyingGoogle] = useState(false);
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

  // Submit States
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync initial user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setEmailInput(user.email || '');
      setBio(user.bio || '');
      if (user.avatarUrl) {
        setAvatarUrl(normalizeMediaUrl(user.avatarUrl));
      }
      if (user.coverUrl) {
        setCoverUrl(normalizeMediaUrl(user.coverUrl));
      }
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
        iconColor="#0866FF"
        titleBn="প্রোফাইল সম্পাদনা করতে লগইন করুন"
        titleEn="Sign in to edit your profile"
        descriptionBn="প্রোফাইলের ছবি, কভার, নাম ও তথ্য পরিবর্তন করতে অ্যাকাউন্টে প্রবেশ করুন।"
        descriptionEn="Log in to update your avatar, cover photo, bio, and personal details."
      />
    );
  }

  // Universal Photo Picker: Web file input & Native Expo ImagePicker
  const handlePickPhoto = async (type: 'avatar' | 'cover') => {
    setErrorMessage(null);

    // 1. Web Fallback
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';

      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
          setErrorMessage(
            locale === 'bn'
              ? 'ছবির সাইজ সর্বোচ্চ ১০ মেগাবাইট (10MB) হতে পারবে।'
              : 'Image size must be less than 10MB.'
          );
          return;
        }

        const previewUrl = URL.createObjectURL(file);
        if (type === 'avatar') {
          setAvatarUrl(previewUrl);
          setIsUploadingAvatar(true);
        } else {
          setCoverUrl(previewUrl);
          setIsUploadingCover(true);
        }

        try {
          const res = await uploadsApi.uploadImage(file, file.name);
          if (res?.url) {
            if (type === 'avatar') setAvatarUrl(res.url);
            else setCoverUrl(res.url);
          }
        } catch {
          setErrorMessage(
            locale === 'bn'
              ? 'ছবি আপলোড করতে ব্যর্থ হয়েছে।'
              : 'Failed to upload photo.'
          );
        } finally {
          if (type === 'avatar') setIsUploadingAvatar(false);
          else setIsUploadingCover(false);
        }
      };

      document.body.appendChild(input);
      input.click();
      setTimeout(() => {
        if (input.parentNode) input.parentNode.removeChild(input);
      }, 1000);
      return;
    }

    // 2. Native Mobile (Android & iOS)
    try {
      // Permission check with graceful Android 13+ Photo Picker handling
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
          // Android 13+ system photo picker runs without storage permissions
          hasPermission = Platform.OS === 'android';
        }
      } catch {
        hasPermission = Platform.OS === 'android';
      }

      if (!hasPermission && Platform.OS !== 'android') {
        setErrorMessage(
          locale === 'bn'
            ? 'গ্যালারি থেকে ছবি নির্বাচন করতে পারমিশন প্রয়োজন।'
            : 'Permission is required to select photos from gallery.'
        );
        return;
      }

      // Launch ImagePicker
      // Note: On Android, allowsEditing: true invokes Intent.ACTION_CROP which is not
      // available on modern Android devices and throws ActivityNotFoundException.
      // We safely enable allowsEditing only on iOS, with fallback retry.
      let result: ImagePicker.ImagePickerResult;
      try {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: Platform.OS === 'ios',
          aspect: type === 'avatar' ? [1, 1] : [16, 9],
          quality: 0.85,
        });
      } catch (pickerErr) {
        console.warn(
          '[ProfilePhoto] Primary picker launch failed, falling back to basic picker:',
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
        asset.fileName || `${type}_${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;

      const fileObj: UploadableImage = {
        uri: asset.uri,
        name: filename,
        type: mimeType,
      };

      // Set local preview immediately
      if (type === 'avatar') {
        setAvatarUrl(asset.uri);
        setIsUploadingAvatar(true);
      } else {
        setCoverUrl(asset.uri);
        setIsUploadingCover(true);
      }

      // Upload to server in separate try-catch block
      try {
        const res = await uploadsApi.uploadImage(fileObj, filename);
        if (res?.url) {
          const finalUrl = res.url;
          if (type === 'avatar') setAvatarUrl(finalUrl);
          else setCoverUrl(finalUrl);

          // Auto-save photo immediately so it persists on user profile without extra steps
          try {
            const updatePayload =
              type === 'avatar'
                ? { avatarUrl: finalUrl }
                : { coverUrl: finalUrl };
            const updatedUser = await profileApi.updateProfile(updatePayload);
            if (updatedUser) {
              setUser({
                ...(user || {}),
                ...updatedUser,
                avatarUrl:
                  type === 'avatar'
                    ? finalUrl
                    : user?.avatarUrl || avatarUrl,
                coverUrl:
                  type === 'cover' ? finalUrl : user?.coverUrl || coverUrl,
              } as User);
            }
            await Promise.all([refreshUser(), refreshFeed()]);
          } catch (autoErr) {
            console.warn(
              '[ProfilePhoto] Auto-save profile update error:',
              autoErr
            );
          }

          setSuccessMessage(
            locale === 'bn'
              ? type === 'avatar'
                ? 'প্রোফাইল ছবি সফলভাবে আপডেট ও সেভ হয়েছে!'
                : 'কভার ছবি সফলভাবে আপডেট ও সেভ হয়েছে!'
              : type === 'avatar'
                ? 'Profile picture saved successfully!'
                : 'Cover photo saved successfully!'
          );
        } else {
          throw new Error('No image URL returned from upload server');
        }
      } catch (uploadErr: any) {
        console.error('[ProfilePhoto] Upload failed:', uploadErr);
        const serverMsg =
          uploadErr?.response?.data?.message || uploadErr?.message;
        setErrorMessage(
          locale === 'bn'
            ? 'ছবি আপলোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে ইন্টারনেট কানেকশন বা ফাইলের সাইজ চেক করুন।'
            : serverMsg ||
                'Failed to upload photo. Please check your connection or file size.'
        );
      } finally {
        if (type === 'avatar') setIsUploadingAvatar(false);
        else setIsUploadingCover(false);
      }
    } catch (pickerErr) {
      console.error('[ProfilePhoto] Picker error:', pickerErr);
      setErrorMessage(
        locale === 'bn'
          ? 'গ্যালারি থেকে ছবি নির্বাচন করা যায়নি।'
          : 'Could not select photo from device.'
      );
    }
  };

  const handleSendEmailOtp = async () => {
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage(
        locale === 'bn'
          ? 'অনুগ্রহ করে একটি সঠিক জিমেইল বা ইমেইল লিখুন।'
          : 'Please enter a valid Gmail or email address.'
      );
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSendingOtp(true);
    try {
      const res = await profileApi.requestEmailVerification(cleanEmail);
      if (res.alreadyVerified) {
        await refreshUser?.();
        showToast({
          type: 'success',
          message:
            locale === 'bn'
              ? 'আপনার ইমেইল ইতিমধ্যেই ভেরিফাইড!'
              : 'Your email is already verified!',
        });
        return;
      }
      setOtpSent(true);
      setDevOtpHint(res.devCode || null);
      showToast({
        type: 'success',
        message:
          res.deliveryMode === 'dev' && res.devCode
            ? locale === 'bn'
              ? `ভেরিফিকেশন কোড তৈরি হয়েছে: ${res.devCode}`
              : `Verification code ready: ${res.devCode}`
            : locale === 'bn'
              ? `${res.email} এ ৬-সংখ্যার কোড পাঠানো হয়েছে।`
              : `A 6-digit verification code was sent to ${res.email}.`,
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (locale === 'bn'
          ? 'কোড পাঠাতে সমস্যা হয়েছে।'
          : 'Failed to send verification code.');
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleConfirmEmailOtp = async () => {
    const cleanCode = otpCode.trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      setErrorMessage(
        locale === 'bn'
          ? '৬-সংখ্যার সঠিক ভেরিফিকেশন কোড দিন।'
          : 'Please enter the 6-digit verification code.'
      );
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsConfirmingOtp(true);
    try {
      const res = await profileApi.confirmEmailVerification(
        cleanCode,
        emailInput.trim().toLowerCase()
      );
      if (res?.user) {
        setUser(res.user);
      } else {
        await refreshUser?.();
      }
      setOtpSent(false);
      setOtpCode('');
      setDevOtpHint(null);
      const ptsNote =
        res.pointsAwarded > 0
          ? locale === 'bn'
            ? ` (+${res.pointsAwarded} পয়েন্ট!)`
            : ` (+${res.pointsAwarded} pts!)`
          : '';
      const badgeNote =
        res.userStatus === 'VERIFIED'
          ? locale === 'bn'
            ? ' গ্রীন ভেরিফাইড আইকন আনলক হয়েছে!'
            : ' Green Verified Icon unlocked!'
          : '';
      const msg =
        (locale === 'bn'
          ? 'জিমেইল সফলভাবে ভেরিফাই হয়েছে'
          : 'Gmail verified successfully') +
        ptsNote +
        badgeNote;
      setSuccessMessage(msg);
      showToast({ type: 'success', message: msg });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (locale === 'bn'
          ? 'ভেরিফিকেশন কোড সঠিক নয়।'
          : 'Invalid verification code.');
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsConfirmingOtp(false);
    }
  };

  const handleVerifyEmailWithGoogle = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsVerifyingGoogle(true);
    try {
      const tokens = await promptGoogleTokens();
      if (!tokens) return;
      const res = await profileApi.verifyEmailWithGoogle(tokens);
      if (res?.user) {
        setUser(res.user);
        setEmailInput(res.user.email || '');
      } else {
        await refreshUser?.();
      }
      setOtpSent(false);
      setOtpCode('');
      setDevOtpHint(null);
      const ptsNote =
        res.pointsAwarded > 0
          ? locale === 'bn'
            ? ` (+${res.pointsAwarded} পয়েন্ট!)`
            : ` (+${res.pointsAwarded} pts!)`
          : '';
      const badgeNote =
        res.userStatus === 'VERIFIED'
          ? locale === 'bn'
            ? ' গ্রীন ভেরিফাইড আইকন আনলক হয়েছে!'
            : ' Green Verified Icon unlocked!'
          : '';
      const msg =
        (locale === 'bn'
          ? 'Google দিয়ে জিমেইল ভেরিফাই সম্পন্ন হয়েছে'
          : 'Gmail verified with Google') +
        ptsNote +
        badgeNote;
      setSuccessMessage(msg);
      showToast({ type: 'success', message: msg });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (locale === 'bn'
          ? 'Google দিয়ে ভেরিফাই করতে সমস্যা হয়েছে।'
          : 'Google verification failed.');
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsVerifyingGoogle(false);
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
      const payload: Partial<User> = {};

      if (trimmedName !== (user?.name || '').trim()) {
        payload.name = trimmedName;
      }

      if (trimmedUsername && trimmedUsername !== (user?.username || '')) {
        payload.username = trimmedUsername;
      }

      const trimmedEmail = emailInput.trim().toLowerCase();
      if (trimmedEmail && trimmedEmail !== (user?.email || '').trim().toLowerCase()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
          setErrorMessage(
            locale === 'bn'
              ? 'সঠিক ইমেইল অ্যাড্রেস লিখুন।'
              : 'Please enter a valid email address.'
          );
          setIsSaving(false);
          return;
        }
        payload.email = trimmedEmail;
      }

      const nextBio = bio.trim() || null;
      const prevBio = user?.bio?.trim() || null;
      if (nextBio !== prevBio) {
        payload.bio = nextBio;
      }

      const nextAvatar = avatarUrl.trim() || null;
      const prevAvatar = user?.avatarUrl ? normalizeMediaUrl(user.avatarUrl).trim() : null;
      if (nextAvatar !== prevAvatar && nextAvatar !== (user?.avatarUrl || null)) {
        payload.avatarUrl = nextAvatar;
      }

      const nextCover = coverUrl.trim() || null;
      const prevCover = user?.coverUrl ? normalizeMediaUrl(user.coverUrl).trim() : null;
      if (nextCover !== prevCover && nextCover !== (user?.coverUrl || null)) {
        payload.coverUrl = nextCover;
      }

      const nextCountry = locationValue.country || 'Bangladesh';
      const nextCountryCode = locationValue.countryCode || 'BD';
      const nextState = locationValue.state || null;
      const nextCity = locationValue.city || null;
      const nextLocation = locationValue.location ? locationValue.location.trim() : null;

      if (nextCountry !== (user?.country || null)) payload.country = nextCountry;
      if (nextCountryCode !== (user?.countryCode || null)) payload.countryCode = nextCountryCode;
      if (nextState !== (user?.state || null)) payload.state = nextState;
      if (nextCity !== (user?.city || null)) payload.city = nextCity;
      if (nextLocation !== (user?.location?.trim() || null)) payload.location = nextLocation;

      const nextBloodGroup = bloodGroup === 'NONE' ? null : bloodGroup;
      if (nextBloodGroup !== (user?.bloodGroup || null)) {
        payload.bloodGroup = nextBloodGroup;
      }

      if (isDonor !== Boolean(user?.isDonor)) {
        payload.isDonor = isDonor;
      }

      const nextDonationCount = Math.max(0, parseInt(donationCount, 10) || 0);
      if (nextDonationCount !== (user?.donationCount || 0)) {
        payload.donationCount = nextDonationCount;
      }

      if (Object.keys(payload).length === 0) {
        setSuccessMessage(
          locale === 'bn'
            ? 'কোনো পরিবর্তন করা হয়নি।'
            : 'No changes to save.'
        );
        setTimeout(() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/profile');
          }
        }, 400);
        return;
      }

      const updatedUser = await profileApi.updateProfile(payload);
      if (updatedUser) {
        setUser({
          ...(user || {}),
          ...updatedUser,
        } as User);
      }
      if (
        payload.name !== undefined ||
        payload.username !== undefined ||
        payload.avatarUrl !== undefined
      ) {
        refreshFeed().catch(() => {});
      }

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
      }, 600);
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
    <View className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]">
      {/* Top Facebook-Style Header Bar */}
      <View className="w-full bg-white dark:bg-[#242526] border-b border-[#e4e6eb] dark:border-[#393a3b] px-3.5 py-2.5 flex-row items-center justify-between z-30">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/profile');
              }
            }}
            className="h-9 w-9 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] items-center justify-center active:opacity-80">
            <AppIcon
              android="arrow_back"
              size={20}
              color={theme === 'dark' ? '#e4e6eb' : '#050505'}
            />
          </Pressable>
          <View>
            <Text className="text-[17px] font-bold text-[#050505] dark:text-[#e4e6eb] leading-5">
              {locale === 'bn' ? 'প্রোফাইল সম্পাদনা' : 'Edit Profile'}
            </Text>
            <Text className="text-[13.5px] text-[#65676b] dark:text-[#b0b3b8]">
              @{user?.username || 'profile'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={isSaving || isUploadingAvatar || isUploadingCover}
          className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-600 active:opacity-85 disabled:opacity-70"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <AppIcon android="check" size={17} color="#ffffff" />
              <Text className="text-[14px] font-bold text-white">
                {locale === 'bn' ? 'সংরক্ষণ' : 'Save'}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-[640px] mx-auto gap-2">
          {/* Feedback Messages */}
          {Boolean(errorMessage) ? (
            <View
              style={{
                borderColor: theme === 'dark' ? 'rgba(244, 63, 94, 0.35)' : '#fecdd3',
              }}
              className="mx-3.5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border flex-row items-center gap-2.5"
            >
              <AppIcon android="error" size={18} color="#e11d48" />
              <Text className="text-[14.5px] font-semibold text-rose-600 dark:text-rose-400 flex-1">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {Boolean(successMessage) ? (
            <View
              style={{
                borderColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.35)' : '#a7f3d0',
              }}
              className="mx-3.5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border flex-row items-center gap-2.5"
            >
              <AppIcon android="check_circle" size={18} color="#10b981" />
              <Text className="text-[14.5px] font-semibold text-emerald-600 dark:text-emerald-400 flex-1">
                {successMessage}
              </Text>
            </View>
          ) : null}

          {/* ======================================================== */}
          {/* 1. Facebook-Style Profile Picture Section                */}
          {/* ======================================================== */}
          <View className="w-full bg-white dark:bg-[#242526] px-3.5 py-4">
            <View className="flex-row items-center justify-between pb-3 border-b border-[#f0f2f5] dark:border-[#393a3b]">
              <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'প্রোফাইল ছবি' : 'Profile picture'}
              </Text>
              <Pressable
                onPress={() => handlePickPhoto('avatar')}
                disabled={isUploadingAvatar}
                className="rounded-full bg-primary-50 dark:bg-primary-950/40 px-3.5 py-1.5 active:opacity-70"
              >
                <Text className="text-[14px] font-bold text-primary-600 dark:text-primary-400">
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

            <View className="items-center pt-4 pb-1">
              <Pressable
                onPress={() => handlePickPhoto('avatar')}
                disabled={isUploadingAvatar}
                className="relative active:opacity-85"
              >
                <View className="h-28 w-28 rounded-full border-4 border-white dark:border-[#3a3b3c] bg-primary-600 shadow-md items-center justify-center overflow-hidden">
                  {Boolean(avatarUrl) ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-white text-4xl font-black">
                      {name?.charAt(0)?.toUpperCase() || 'P'}
                    </Text>
                  )}

                  {isUploadingAvatar ? (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                      <ActivityIndicator size="small" color="#ffffff" />
                    </View>
                  ) : null}
                </View>

                {/* Camera Overlay Badge */}
                <View className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary-600 border-2 border-white dark:border-[#242526] items-center justify-center shadow-md">
                  <AppIcon android="photo_camera" size={17} color="#ffffff" />
                </View>
              </Pressable>
            </View>
          </View>

          {/* ======================================================== */}
          {/* 2. Facebook-Style Cover Photo Section                    */}
          {/* ======================================================== */}
          <View className="w-full bg-white dark:bg-[#242526] px-3.5 py-4">
            <View className="flex-row items-center justify-between pb-3 border-b border-[#f0f2f5] dark:border-[#393a3b]">
              <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'কভার ছবি' : 'Cover photo'}
              </Text>
              <Pressable
                onPress={() => handlePickPhoto('cover')}
                disabled={isUploadingCover}
                className="rounded-full bg-primary-50 dark:bg-primary-950/40 px-3.5 py-1.5 active:opacity-70"
              >
                <Text className="text-[14px] font-bold text-primary-600 dark:text-primary-400">
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

            <View className="pt-3">
              <Pressable
                onPress={() => handlePickPhoto('cover')}
                disabled={isUploadingCover}
                style={{
                  borderColor: theme === 'dark' ? '#4a4b4d' : '#e4e6eb',
                }}
                className="relative w-full h-40 sm:h-48 rounded-2xl bg-[#f0f2f5] dark:bg-[#3a3b3c] overflow-hidden border active:opacity-90"
              >
                {Boolean(coverUrl) ? (
                  <Image
                    source={{ uri: coverUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center bg-linear-to-r from-emerald-800 via-teal-700 to-primary-800">
                    <View className="h-12 w-12 rounded-full bg-white/20 items-center justify-center mb-1.5">
                      <AppIcon android="add_a_photo" size={24} color="#ffffff" />
                    </View>
                    <Text className="text-white text-[14.5px] font-bold opacity-95">
                      {locale === 'bn'
                        ? 'কভার ছবি যুক্ত করুন'
                        : 'Add Cover Photo'}
                    </Text>
                  </View>
                )}

                {isUploadingCover ? (
                  <View className="absolute inset-0 bg-black/50 items-center justify-center">
                    <ActivityIndicator size="large" color="#ffffff" />
                    <Text className="text-white text-[14px] font-bold mt-2">
                      {locale === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...'}
                    </Text>
                  </View>
                ) : null}

                {/* Edit Cover Overlay Icon - only when image exists */}
                {Boolean(coverUrl) ? (
                  <View className="absolute bottom-3 right-3 p-1 items-center justify-center">
                    <AppIcon android="photo_camera" size={22} color="#ffffff" />
                  </View>
                ) : null}
              </Pressable>
            </View>
          </View>

          {/* ======================================================== */}
          {/* 3. Facebook-Style Bio Section                            */}
          {/* ======================================================== */}
          <View className="w-full bg-white dark:bg-[#242526] px-3.5 py-4">
            <View className="flex-row items-center justify-between pb-2.5 border-b border-[#f0f2f5] dark:border-[#393a3b]">
              <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'বায়ো / পরিচিতি' : 'Bio'}
              </Text>
              <Text className="text-[13.5px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
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
                    ? 'নিজের সম্পর্কে কিছু লিখুন...'
                    : 'Describe who you are...'
                }
                placeholderTextColor="#8a8d91"
                textAlignVertical="top"
                className="w-full min-h-[96px] rounded-2xl border border-transparent focus:border-primary-500 bg-[#f0f2f5] dark:bg-[#3a3b3c]/60 p-3.5 text-base text-[#050505] dark:text-[#e4e6eb]"
              />
            </View>
          </View>

          {/* ======================================================== */}
          {/* 4. Basic Information (Name & Username)                   */}
          {/* ======================================================== */}
          <View className="w-full bg-white dark:bg-[#242526] px-3.5 py-4 gap-3.5">
            <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] pb-2.5 border-b border-[#f0f2f5] dark:border-[#393a3b]">
              {locale === 'bn' ? 'মৌলিক তথ্য' : 'Basic info'}
            </Text>

            {/* Name */}
            <View className="gap-1.5">
              <Text className="text-[14.5px] font-semibold text-[#1c1e21] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'পুরো নাম *' : 'Full Name *'}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={
                  locale === 'bn' ? 'আপনার নাম লিখুন' : 'Enter your name'
                }
                placeholderTextColor="#8a8d91"
                className="w-full h-12 rounded-2xl border border-transparent focus:border-primary-500 bg-[#f0f2f5] dark:bg-[#3a3b3c]/60 px-3.5 text-base text-[#050505] dark:text-[#e4e6eb] font-medium"
              />
            </View>

            {/* Username */}
            <View className="gap-1.5">
              <Text className="text-[14.5px] font-semibold text-[#1c1e21] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'ইউজারনেম' : 'Username'}
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholder="username"
                placeholderTextColor="#8a8d91"
                className="w-full h-12 rounded-2xl border border-transparent focus:border-primary-500 bg-[#f0f2f5] dark:bg-[#3a3b3c]/60 px-3.5 text-base text-[#050505] dark:text-[#e4e6eb] font-medium"
              />
            </View>

            {/* Email & Gmail Verification (+50 pts, Mandatory for Green Verified Icon) */}
            <View className="gap-2.5 pt-1">
              <View className="flex-row items-center justify-between flex-wrap gap-1.5">
                <Text className="text-[14.5px] font-semibold text-[#1c1e21] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'জিমেইল / ইমেইল' : 'Gmail / Email'}
                </Text>
                {user?.emailVerified &&
                emailInput.trim().toLowerCase() ===
                  (user?.email || '').trim().toLowerCase() ? (
                  <View className="flex-row items-center gap-1 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-2.5 py-0.5">
                    <AppIcon android="verified_user" size={13} color="#16a34a" />
                    <Text className="text-[12px] font-bold text-green-700 dark:text-green-400">
                      {locale === 'bn' ? 'ভেরিফাইড' : 'Verified'}
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5">
                    <AppIcon android="auto_awesome" size={12} color="#d97706" />
                    <Text className="text-[11.5px] font-bold text-amber-700 dark:text-amber-300">
                      {locale === 'bn'
                        ? '+৫০ পয়েন্ট • গ্রীন ব্যাজে বাধ্যতামূলক'
                        : '+50 pts • Mandatory for Green Badge'}
                    </Text>
                  </View>
                )}
              </View>

              <TextInput
                value={emailInput}
                onChangeText={(val) => {
                  setEmailInput(val);
                  if (otpSent) {
                    setOtpSent(false);
                    setOtpCode('');
                    setDevOtpHint(null);
                  }
                }}
                editable={!user?.emailVerified}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="example@gmail.com"
                placeholderTextColor="#8a8d91"
                className={`w-full h-12 rounded-2xl border px-3.5 text-base font-medium ${
                  user?.emailVerified
                    ? 'border-green-200 dark:border-green-900/60 bg-green-50/40 dark:bg-green-950/20 text-[#050505] dark:text-[#e4e6eb]'
                    : 'border-transparent focus:border-primary-500 bg-[#f0f2f5] dark:bg-[#3a3b3c]/60 text-[#050505] dark:text-[#e4e6eb]'
                }`}
              />

              {!user?.emailVerified ||
              emailInput.trim().toLowerCase() !==
                (user?.email || '').trim().toLowerCase() ? (
                <View className="gap-2.5 rounded-2xl border border-[#e4e6eb] dark:border-[#393a3b] bg-[#f8fafc] dark:bg-[#1e1f21] p-3">
                  <Text className="text-[12.5px] text-[#65676b] dark:text-[#b0b3b8] leading-4">
                    {locale === 'bn'
                      ? 'প্রোফাইলে গ্রীন ভেরিফাইড আইকন পেতে ও +৫০ পয়েন্ট অর্জন করতে আপনার জিমেইল ভেরিফাই করা বাধ্যতামূলক।'
                      : 'Verifying your Gmail/email is mandatory to unlock the green verified icon and awards +50 points.'}
                  </Text>

                  <View className="flex-row flex-wrap gap-2">
                    <Pressable
                      onPress={handleVerifyEmailWithGoogle}
                      disabled={isVerifyingGoogle || isSendingOtp || isConfirmingOtp}
                      className="flex-1 min-w-[140px] h-10 flex-row items-center justify-center gap-2 rounded-xl border border-[#e4e6eb] dark:border-[#4a4b4d] bg-white dark:bg-[#2a2b2d] px-3 active:opacity-80 disabled:opacity-60"
                    >
                      {isVerifyingGoogle ? (
                        <ActivityIndicator size="small" color="#16a34a" />
                      ) : (
                        <>
                          <GoogleIcon size={16} />
                          <Text className="text-[13px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                            {locale === 'bn'
                              ? 'Google দিয়ে ভেরিফাই'
                              : 'Verify Gmail'}
                          </Text>
                        </>
                      )}
                    </Pressable>

                    <Pressable
                      onPress={handleSendEmailOtp}
                      disabled={isSendingOtp || isConfirmingOtp || isVerifyingGoogle}
                      className="flex-1 min-w-[140px] h-10 flex-row items-center justify-center gap-1.5 rounded-xl bg-green-600 px-3 active:opacity-85 disabled:opacity-60"
                    >
                      {isSendingOtp ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <AppIcon android="mail" size={15} color="#ffffff" />
                          <Text className="text-[13px] font-bold text-white">
                            {otpSent
                              ? locale === 'bn'
                                ? 'আবার কোড পাঠান'
                                : 'Resend Code'
                              : locale === 'bn'
                                ? 'কোড পাঠান (OTP)'
                                : 'Send Code (OTP)'}
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>

                  {otpSent ? (
                    <View className="gap-2 pt-1">
                      {devOtpHint ? (
                        <Text className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
                          {locale === 'bn'
                            ? `ডেভ ভেরিফিকেশন কোড: ${devOtpHint}`
                            : `Verification Code: ${devOtpHint}`}
                        </Text>
                      ) : null}
                      <View className="flex-row items-center gap-2">
                        <TextInput
                          value={otpCode}
                          onChangeText={(v) =>
                            setOtpCode(v.replace(/\D/g, '').slice(0, 6))
                          }
                          keyboardType="number-pad"
                          maxLength={6}
                          placeholder={
                            locale === 'bn'
                              ? '৬-সংখ্যার কোড লিখুন'
                              : 'Enter 6-digit code'
                          }
                          placeholderTextColor="#8a8d91"
                          className="flex-1 h-11 rounded-xl border border-[#d0d5dd] dark:border-[#4a4b4d] bg-white dark:bg-[#242526] px-3 text-base font-bold tracking-widest text-center text-[#050505] dark:text-[#e4e6eb]"
                        />
                        <Pressable
                          onPress={handleConfirmEmailOtp}
                          disabled={isConfirmingOtp || otpCode.trim().length !== 6}
                          className="h-11 px-4 rounded-xl bg-emerald-600 items-center justify-center active:opacity-85 disabled:opacity-60"
                        >
                          {isConfirmingOtp ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Text className="text-[13.5px] font-bold text-white">
                              {locale === 'bn' ? 'নিশ্চিত করুন' : 'Confirm'}
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View className="flex-row items-center gap-2 px-1">
                  <AppIcon
                    android="verified_user"
                    size={15}
                    color={
                      user?.userStatus === 'VERIFIED' ? '#16a34a' : '#059669'
                    }
                  />
                  <Text className="text-[12.5px] font-semibold text-green-700 dark:text-green-400 flex-1">
                    {user?.userStatus === 'VERIFIED'
                      ? locale === 'bn'
                        ? 'গ্রীন ভেরিফাইড আইকন সক্রিয় আছে!'
                        : 'Green Verified Icon is active on your profile!'
                      : locale === 'bn'
                        ? 'জিমেইল ভেরিফাইড ✓ গ্রীন আইকন পেতে প্রোফাইল ছবি, কভার, বায়ো ও ঠিকানা সম্পূর্ণ করুন।'
                        : 'Gmail verified ✓ Complete photo, cover, bio & location for the Green Verified Icon.'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ======================================================== */}
          {/* 5. Customize Details (Location & Blood Donation)         */}
          {/* ======================================================== */}
          <View className="w-full bg-white dark:bg-[#242526] px-3.5 py-4 gap-4">
            <View className="pb-2.5 border-b border-[#f0f2f5] dark:border-[#393a3b]">
              <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'বিস্তারিত তথ্য' : 'Details'}
              </Text>
            </View>

            {/* Location Selector */}
            <View className="gap-1.5">
              <View className="flex-row items-center gap-1.5">
                <AppIcon android="location_on" size={18} color="#e11d48" />
                <Text className="text-[15px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'বর্তমান অবস্থান' : 'Current Location'}
                </Text>
              </View>

              <View className="mt-1">
                <LocationSelector
                  value={locationValue}
                  onChange={(loc) => setLocationValue(loc)}
                />
              </View>
            </View>

            <View className="h-px bg-[#f0f2f5] dark:bg-[#393a3b]" />

            {/* Blood Donation Section */}
            <View className="gap-3">
              <View className="flex-row items-center gap-1.5">
                <AppIcon android="water_drop" size={18} color="#e11d48" />
                <Text className="text-[15px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn'
                    ? 'রক্তের গ্রুপ ও রক্তদান'
                    : 'Blood Group & Donor Status'}
                </Text>
              </View>

              {/* Symmetrical 3x3 Blood Group Grid */}
              <View className="flex-row flex-wrap gap-2 pt-1">
                {BLOOD_GROUPS.map((bg) => {
                  const isSelected = bloodGroup === bg.value;
                  return (
                    <Pressable
                      key={bg.value}
                      onPress={() => setBloodGroup(bg.value)}
                      className={`h-11 rounded-xl border flex-row items-center justify-center active:opacity-80 ${
                        isSelected
                          ? 'bg-rose-600 border-rose-600'
                          : 'bg-[#f0f2f5] dark:bg-[#3a3b3c] border-transparent'
                      }`}
                      style={{ minWidth: '29%', flexGrow: 1, maxWidth: '32%' }}
                    >
                      <Text
                        className={`text-[15px] font-bold ${
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
                  <Text className="text-base font-semibold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn'
                      ? 'রক্তদাতা হিসেবে প্রস্তুত'
                      : 'Available as Blood Donor'}
                  </Text>
                  <Text className="text-[13.5px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
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
              {isDonor ? (
                <View className="flex-row items-center justify-between pt-3 border-t border-[#f0f2f5] dark:border-[#393a3b]">
                  <View>
                    <Text className="text-[15px] font-semibold text-[#050505] dark:text-[#e4e6eb]">
                      {locale === 'bn'
                        ? 'মোট রক্তদানের সংখ্যা'
                        : 'Donations Count'}
                    </Text>
                  </View>
                  <TextInput
                    value={donationCount}
                    onChangeText={setDonationCount}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#8a8d91"
                    className="w-20 h-11 text-center rounded-xl border border-transparent focus:border-primary-500 bg-[#f0f2f5] dark:bg-[#3a3b3c] text-base font-bold text-[#050505] dark:text-[#e4e6eb]"
                  />
                </View>
              ) : null}
            </View>
          </View>

          {/* Bottom Save Button */}
          <View className="w-full px-3.5 pt-2">
            <Pressable
              onPress={handleSave}
              disabled={isSaving || isUploadingAvatar || isUploadingCover}
              className="w-full h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-primary-600 active:opacity-85 disabled:opacity-70"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <AppIcon android="check" size={19} color="#ffffff" />
                  <Text className="text-[15px] font-bold text-white">
                    {locale === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
