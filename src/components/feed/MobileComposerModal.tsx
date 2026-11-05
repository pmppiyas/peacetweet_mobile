import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useUi, ComposerMode, ComposerAction } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useFeed } from '@/providers/FeedProvider';
import { AppIcon } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { uploadsApi } from '@/features/uploads/api/uploads.api';
import { FEELINGS, getFeelingById } from '@/features/feed/constants/feelings';

const BLOOD_GROUPS = [
  { label: 'A+', value: 'A_POSITIVE' },
  { label: 'A-', value: 'A_NEGATIVE' },
  { label: 'B+', value: 'B_POSITIVE' },
  { label: 'B-', value: 'B_NEGATIVE' },
  { label: 'AB+', value: 'AB_POSITIVE' },
  { label: 'AB-', value: 'AB_NEGATIVE' },
  { label: 'O+', value: 'O_POSITIVE' },
  { label: 'O-', value: 'O_NEGATIVE' },
];

const URGENCIES = [
  { value: 'REGULAR', label: 'Regular', labelBn: 'সাধারণ' },
  { value: 'URGENT', label: 'Urgent', labelBn: 'জরুরি' },
  { value: 'EMERGENCY', label: 'Emergency 🚨', labelBn: 'অতি জরুরি 🚨' },
] as const;

export function MobileComposerModal() {
  const {
    isComposerModalOpen,
    setComposerModalOpen,
    composerInitialMode,
    composerInitialAction,
    locale,
    theme,
    setIsUploadingPost,
    triggerPostSuccess,
  } = useUi();
  const { user } = useAuth();
  const { createPost } = useFeed();

  // Mode & Content
  const [postType, setPostType] = useState<ComposerMode>('TEXT');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Photos & Media
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaLayout, setMediaLayout] = useState<'COLLAGE' | 'SWIPE'>('COLLAGE');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Feelings
  const [feeling, setFeeling] = useState<string | null>(null);
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);

  // Dua fields
  const [duaTitle, setDuaTitle] = useState('');
  const [duaArabicText, setDuaArabicText] = useState('');
  const [duaTransliteration, setDuaTransliteration] = useState('');
  const [duaMeaning, setDuaMeaning] = useState('');
  const [duaFadilah, setDuaFadilah] = useState('');

  // Blood request fields
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [units, setUnits] = useState(1);
  const [urgency, setUrgency] = useState<'REGULAR' | 'URGENT' | 'EMERGENCY'>('REGULAR');
  const [hospitalName, setHospitalName] = useState('');
  const [location, setLocation] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [neededDate, setNeededDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [problem, setProblem] = useState('');
  const [bloodNote, setBloodNote] = useState('');

  const selectedFeeling = getFeelingById(feeling);

  // Handle deep-link initial mode / action when modal opens
  useEffect(() => {
    if (isComposerModalOpen) {
      if (composerInitialMode) {
        setPostType(composerInitialMode);
      }
      if (composerInitialAction === 'photo') {
        setTimeout(() => {
          handlePickImages();
        }, 300);
      } else if (composerInitialAction === 'feeling') {
        setTimeout(() => {
          setShowFeelingPicker(true);
        }, 200);
      }
    }
  }, [isComposerModalOpen, composerInitialMode, composerInitialAction]);

  if (!isComposerModalOpen) return null;

  // Validation
  const isPostValid =
    postType === 'TEXT'
      ? content.trim().length > 0 || mediaUrls.length > 0
      : postType === 'DUA'
        ? duaMeaning.trim().length > 0
        : Boolean(
            patientName.trim() &&
              bloodGroup &&
              hospitalName.trim() &&
              contactNumber.trim()
          );

  const resetForm = () => {
    setContent('');
    setMediaUrls([]);
    setMediaLayout('COLLAGE');
    setFeeling(null);
    setShowFeelingPicker(false);
    setDuaTitle('');
    setDuaArabicText('');
    setDuaTransliteration('');
    setDuaMeaning('');
    setDuaFadilah('');
    setPatientName('');
    setBloodGroup('');
    setUnits(1);
    setUrgency('REGULAR');
    setHospitalName('');
    setLocation('');
    setContactNumber('');
    setNeededDate(new Date().toISOString().split('T')[0]);
    setProblem('');
    setBloodNote('');
    setErrorMessage(null);
    setPostType('TEXT');
  };

  const handleClose = () => {
    resetForm();
    setComposerModalOpen(false);
  };

  // Image Upload Handler
  const uploadFiles = async (files: (File | Blob)[]) => {
    if (mediaUrls.length + files.length > 10) {
      setErrorMessage(
        locale === 'bn'
          ? 'সর্বোচ্চ ১০টি ছবি যুক্ত করা যাবে।'
          : 'You can attach a maximum of 10 photos.'
      );
      return;
    }

    setIsUploadingMedia(true);
    setErrorMessage(null);

    try {
      const newUrls = await uploadsApi.uploadMultipleImages(files);
      if (newUrls.length > 0) {
        setMediaUrls((prev) => [...prev, ...newUrls]);
      } else {
        setErrorMessage(
          locale === 'bn'
            ? 'ছবি আপলোড করা সম্ভব হয়নি।'
            : 'Failed to upload images.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to upload photos');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handlePickImages = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/webp,image/gif';
      input.multiple = true;
      input.onchange = async (e: any) => {
        const files = e.target?.files;
        if (!files || files.length === 0) return;
        await uploadFiles(Array.from(files));
      };
      input.click();
    }
  };

  const removeMediaUrl = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!isPostValid || isSubmitting || isUploadingMedia) return;

    setIsSubmitting(true);
    setIsUploadingPost(
      true,
      postType === 'BLOOD_REQUEST' ? 'BLOOD' : 'STANDARD'
    );
    setErrorMessage(null);

    try {
      if (postType === 'TEXT') {
        await createPost({
          type: 'TEXT',
          content: content.trim() || undefined,
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
          mediaLayout: mediaUrls.length > 1 ? mediaLayout : 'COLLAGE',
          feeling: feeling || undefined,
          visibility: 'PUBLIC',
          status: 'PUBLISHED',
        });
      } else if (postType === 'DUA') {
        await createPost({
          type: 'DUA',
          content: duaTitle.trim() ? `🌙 ${duaTitle.trim()}` : undefined,
          feeling: feeling || undefined,
          visibility: 'PUBLIC',
          status: 'PUBLISHED',
          duaData: {
            title: duaTitle.trim() || undefined,
            meaning: duaMeaning.trim(),
            transliteration: duaTransliteration.trim() || undefined,
            fadilah: duaFadilah.trim() || undefined,
            arabicText: duaArabicText.trim() || undefined,
          },
        });
      } else if (postType === 'BLOOD_REQUEST') {
        const fullProblem = [
          `[${urgency}]`,
          problem.trim(),
          bloodNote.trim() ? `Note: ${bloodNote.trim()}` : '',
        ]
          .filter(Boolean)
          .join(' - ');

        await createPost({
          type: 'BLOOD_REQUEST',
          content: content.trim() || (fullProblem ? `🩸 ${fullProblem}` : undefined),
          feeling: feeling || undefined,
          visibility: 'PUBLIC',
          status: 'PUBLISHED',
          bloodRequestData: {
            patientName: patientName.trim(),
            bloodGroup,
            units: Number(units) || 1,
            hospitalName: hospitalName.trim(),
            location: location.trim() || hospitalName.trim(),
            contactNumber: contactNumber.trim(),
            neededDate: neededDate ? new Date(neededDate).toISOString() : new Date().toISOString(),
            problem: fullProblem || undefined,
          },
        });
      }

      handleClose();
      triggerPostSuccess();
    } catch (err: any) {
      setIsUploadingPost(false);
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          (locale === 'bn'
            ? 'পোস্ট করতে সমস্যা হয়েছে।'
            : 'Failed to create post. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Circular character progress ring
  const charLimit = 5000;
  const charLength = content.length;
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(charLength / charLimit, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <Modal
      visible={isComposerModalOpen}
      animationType="slide"
      onRequestClose={handleClose}>
      <View className="flex-1 bg-white dark:bg-[#18191a]">
        {/* ────────────────── 1. TOP HEADER ────────────────── */}
        <View className="flex-row items-center justify-between px-3.5 h-14 border-b border-[#e4e6eb] dark:border-[#2d2e2f] bg-white dark:bg-[#18191a]">
          <Pressable
            onPress={handleClose}
            className="h-9 w-9 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#2d2e2f] active:scale-95">
            <AppIcon
              android="close"
              ios="xmark"
              size={20}
              color={theme === 'dark' ? '#e4e6eb' : '#050505'}
            />
          </Pressable>

          <View className="flex-row items-center gap-1.5">
            <AppIcon
              android="auto_awesome"
              ios="sparkles"
              size={16}
              color="#1877f2"
            />
            <Text className="font-bold text-sm text-[#050505] dark:text-[#e4e6eb]">
              {locale === 'bn' ? 'নতুন পোস্ট' : 'Create Post'}
            </Text>
          </View>

          <Pressable
            disabled={!isPostValid || isSubmitting || isUploadingMedia}
            onPress={handleSubmit}
            className={`flex-row items-center justify-center gap-1.5 px-4 py-1.5 rounded-full active:scale-95 ${
              isPostValid && !isSubmitting && !isUploadingMedia
                ? postType === 'BLOOD_REQUEST'
                  ? 'bg-rose-600'
                  : postType === 'DUA'
                    ? 'bg-emerald-600'
                    : 'bg-primary-500'
                : 'bg-gray-100 dark:bg-gray-800 opacity-60'
            }`}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <AppIcon
                  android="send"
                  ios="paperplane.fill"
                  size={14}
                  color={isPostValid ? '#ffffff' : '#9ca3af'}
                />
                <Text
                  className={`text-xs font-bold ${
                    isPostValid
                      ? 'text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                  {locale === 'bn' ? 'পোস্ট' : 'Post'}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* ────────────────── 2. POST TYPE SEGMENTED ROW ────────────────── */}
        <View className="px-4 py-2.5 border-b border-[#e4e6eb]/60 dark:border-[#2d2e2f] bg-[#fbfbfb] dark:bg-[#1f2022]">
          <View className="flex-row gap-1.5 p-1 rounded-2xl bg-[#f0f2f5] dark:bg-[#2a2b2d]">
            <Pressable
              onPress={() => {
                setPostType('TEXT');
                setErrorMessage(null);
              }}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-1.5 rounded-xl ${
                postType === 'TEXT' ? 'bg-white dark:bg-[#18191a]' : ''
              }`}>
              <AppIcon
                android="edit"
                size={14}
                color={postType === 'TEXT' ? '#1565d8' : '#65676b'}
              />
              <Text
                className={`text-xs font-bold ${
                  postType === 'TEXT'
                    ? 'text-primary-600 dark:text-primary-300'
                    : 'text-[#65676b] dark:text-[#b0b3b8]'
                }`}>
                {locale === 'bn' ? 'ভাবনা / সাধারণ' : 'Reflection'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setPostType('DUA');
                setErrorMessage(null);
              }}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-1.5 rounded-xl ${
                postType === 'DUA' ? 'bg-white dark:bg-[#18191a]' : ''
              }`}>
              <AppIcon
                android="menu_book"
                size={14}
                color={postType === 'DUA' ? '#059669' : '#65676b'}
              />
              <Text
                className={`text-xs font-bold ${
                  postType === 'DUA'
                    ? 'text-emerald-600 dark:text-emerald-300'
                    : 'text-[#65676b] dark:text-[#b0b3b8]'
                }`}>
                {locale === 'bn' ? 'পবিত্র দু’আ' : 'Dua'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setPostType('BLOOD_REQUEST');
                setErrorMessage(null);
              }}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-1.5 rounded-xl ${
                postType === 'BLOOD_REQUEST' ? 'bg-white dark:bg-[#18191a]' : ''
              }`}>
              <AppIcon
                android="water_drop"
                size={14}
                color={postType === 'BLOOD_REQUEST' ? '#e11d48' : '#65676b'}
              />
              <Text
                className={`text-xs font-bold ${
                  postType === 'BLOOD_REQUEST'
                    ? 'text-rose-600 dark:text-rose-300'
                    : 'text-[#65676b] dark:text-[#b0b3b8]'
                }`}>
                {locale === 'bn' ? 'রক্তদান' : 'Blood'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ────────────────── 3. SCROLLABLE WRITING CANVAS ────────────────── */}
        <ScrollView
          className="flex-1 px-4 py-3.5"
          contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Error Message */}
          {errorMessage && (
            <View className="mb-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900/50 px-3.5 py-2.5 flex-row items-center gap-2">
              <AppIcon android="info" size={16} color="#e11d48" />
              <Text className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex-1">
                {errorMessage}
              </Text>
            </View>
          )}

          {/* User Identity & Feeling Badge Row */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2.5">
              <UserAvatar
                avatarUrl={user?.avatarUrl || (user as any)?.avatar}
                name={user?.name || 'PeaceTweet User'}
                size="md"
              />
              <View>
                <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {user?.name || 'PeaceTweet User'}
                </Text>
                <View className="flex-row items-center gap-1.5 mt-0.5 flex-wrap">
                  <View className="flex-row items-center gap-1 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-full border border-primary-200/50 dark:border-primary-900/50">
                    <AppIcon android="public" size={11} color="#1054be" />
                    <Text className="text-[11px] font-semibold text-primary-700 dark:text-primary-300">
                      Public
                    </Text>
                  </View>

                  {selectedFeeling && (
                    <View className="flex-row items-center gap-1 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-900/60">
                      <Text className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        {selectedFeeling.emoji}{' '}
                        {locale === 'bn'
                          ? selectedFeeling.labelBn
                          : selectedFeeling.label}
                      </Text>
                      <Pressable
                        onPress={() => setFeeling(null)}
                        className="ml-0.5 p-0.5 active:opacity-60">
                        <AppIcon
                          android="close"
                          ios="xmark"
                          size={10}
                          color="#b45309"
                        />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* ────────────── MODE 1: REFLECTION / TEXT ────────────── */}
          {postType === 'TEXT' && (
            <View className="gap-3">
              <TextInput
                value={content}
                onChangeText={setContent}
                multiline
                placeholder={
                  locale === 'bn'
                    ? 'আপনার ভাবনা, কুরআন-হাদিসের সুন্দর নসিহত বা দোয়া শেয়ার করুন...'
                    : "What's on your mind? Share a reflection, reminder, or story..."
                }
                placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                className="min-h-[140px] text-[17px] leading-6 text-[#050505] dark:text-[#e4e6eb]"
                textAlignVertical="top"
              />

              {/* Attached Photos Strip */}
              {mediaUrls.length > 0 && (
                <View className="p-3 rounded-2xl border border-[#e4e6eb] dark:border-[#2d2e2f] bg-[#f8f9fa] dark:bg-[#1f2022] gap-2.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                      {locale === 'bn'
                        ? `সংযুক্ত ছবি (${mediaUrls.length}/10)`
                        : `Attached Photos (${mediaUrls.length}/10)`}
                    </Text>
                    {mediaUrls.length > 1 && (
                      <View className="flex-row items-center gap-1 rounded-xl bg-[#e4e6eb] dark:bg-[#2d2e2f] p-0.5">
                        <Pressable
                          onPress={() => setMediaLayout('COLLAGE')}
                          className={`flex-row items-center gap-1 rounded-lg px-2.5 py-1 ${
                            mediaLayout === 'COLLAGE'
                              ? 'bg-white dark:bg-[#18191a] shadow-xs'
                              : ''
                          }`}>
                          <AppIcon
                            android="layers"
                            size={12}
                            color={mediaLayout === 'COLLAGE' ? '#1877f2' : '#65676b'}
                          />
                          <Text
                            className={`text-xs font-semibold ${
                              mediaLayout === 'COLLAGE'
                                ? 'text-primary-600 dark:text-primary-300'
                                : 'text-[#65676b] dark:text-[#b0b3b8]'
                            }`}>
                            Collage
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setMediaLayout('SWIPE')}
                          className={`flex-row items-center gap-1 rounded-lg px-2.5 py-1 ${
                            mediaLayout === 'SWIPE'
                              ? 'bg-white dark:bg-[#18191a] shadow-xs'
                              : ''
                          }`}>
                          <AppIcon
                            android="more_horiz"
                            size={12}
                            color={mediaLayout === 'SWIPE' ? '#1877f2' : '#65676b'}
                          />
                          <Text
                            className={`text-xs font-semibold ${
                              mediaLayout === 'SWIPE'
                                ? 'text-primary-600 dark:text-primary-300'
                                : 'text-[#65676b] dark:text-[#b0b3b8]'
                            }`}>
                            Swipe
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 10 }}>
                    {mediaUrls.map((url, idx) => (
                      <View
                        key={`${url}-${idx}`}
                        className="h-20 w-20 rounded-xl overflow-hidden relative border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                        <Image
                          source={{ uri: url }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                        <Pressable
                          onPress={() => removeMediaUrl(idx)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/75 items-center justify-center active:scale-90"
                          accessibilityLabel="Remove photo">
                          <AppIcon
                            android="close"
                            ios="xmark"
                            size={12}
                            color="#ffffff"
                          />
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* ────────────── MODE 2: DUA ────────────── */}
          {postType === 'DUA' && (
            <View className="gap-3.5">
              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn' ? 'দু’আর নাম বা বিষয়' : 'Dua Title / Theme'}
                </Text>
                <TextInput
                  value={duaTitle}
                  onChangeText={setDuaTitle}
                  placeholder={
                    locale === 'bn'
                      ? 'যেমন: অন্তরের প্রশান্তির দু’আ'
                      : 'e.g. Supplication for Inner Peace'
                  }
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full rounded-2xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2.5 text-sm text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>

              <View className="gap-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {locale === 'bn'
                      ? 'বাংলা অর্থ / অনুবাদ *'
                      : 'Bangla Meaning (Required) *'}
                  </Text>
                  <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    Required
                  </Text>
                </View>
                <TextInput
                  value={duaMeaning}
                  onChangeText={setDuaMeaning}
                  multiline
                  placeholder={
                    locale === 'bn'
                      ? 'দু’আটির অর্থ সুন্দরভাবে বাংলায় লিখুন...'
                      : 'Write the translation / meaning...'
                  }
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full min-h-[90px] rounded-2xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] p-3 text-sm text-[#050505] dark:text-[#e4e6eb]"
                  textAlignVertical="top"
                />
              </View>

              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn'
                    ? 'বাংলা উচ্চারণ (Transliteration)'
                    : 'Pronunciation in Bengali'}
                </Text>
                <TextInput
                  value={duaTransliteration}
                  onChangeText={setDuaTransliteration}
                  placeholder={
                    locale === 'bn'
                      ? 'যেমন: আল্লাহুম্মা ইন্নি আসআলুকাল আফওয়া...'
                      : 'Transliteration in Bengali'
                  }
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full rounded-2xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2.5 text-sm text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>

              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn'
                    ? 'আরবি টেক্সট (Arabic Text)'
                    : 'Arabic Text'}
                </Text>
                <TextInput
                  value={duaArabicText}
                  onChangeText={setDuaArabicText}
                  placeholder="اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ"
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full rounded-2xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2.5 text-right text-base text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>

              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn'
                    ? 'ফজিলত ও হাদিস রেফারেন্স'
                    : 'Virtue & Hadith Reference'}
                </Text>
                <TextInput
                  value={duaFadilah}
                  onChangeText={setDuaFadilah}
                  placeholder={
                    locale === 'bn'
                      ? 'যেমন: তিরমিযী, হাদিস নং ৩৪৫৬'
                      : 'e.g. Tirmidhi Hadith #3456'
                  }
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full rounded-2xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2.5 text-sm text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>
            </View>
          )}

          {/* ────────────── MODE 3: BLOOD REQUEST ────────────── */}
          {postType === 'BLOOD_REQUEST' && (
            <View className="gap-4">
              {/* Blood Group Chips */}
              <View className="gap-1.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {locale === 'bn'
                      ? 'রক্তের গ্রুপ নির্বাচন করুন *'
                      : 'Blood Group *'}
                  </Text>
                  <Text className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                    Emergency
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {BLOOD_GROUPS.map((group) => (
                    <Pressable
                      key={group.value}
                      onPress={() => setBloodGroup(group.value)}
                      className={`w-[23%] py-2.5 rounded-2xl border items-center active:scale-95 ${
                        bloodGroup === group.value
                          ? 'bg-rose-600 border-rose-600'
                          : 'bg-[#f8f9fa] dark:bg-[#242526] border-[#e4e6eb] dark:border-[#393a3b]'
                      }`}>
                      <Text
                        className={`text-xs font-black ${
                          bloodGroup === group.value
                            ? 'text-white'
                            : 'text-[#050505] dark:text-[#e4e6eb]'
                        }`}>
                        {group.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Urgency Selector */}
              <View className="gap-1.5">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn' ? 'জরুরিতার মাত্রা' : 'Urgency Level'}
                </Text>
                <View className="flex-row gap-2">
                  {URGENCIES.map((u) => (
                    <Pressable
                      key={u.value}
                      onPress={() => setUrgency(u.value)}
                      className={`flex-1 py-2 rounded-xl border items-center active:scale-95 ${
                        urgency === u.value
                          ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/60'
                          : 'border-[#e4e6eb] dark:border-[#393a3b]'
                      }`}>
                      <Text
                        className={`text-xs font-bold ${
                          urgency === u.value
                            ? 'text-rose-700 dark:text-rose-300'
                            : 'text-[#65676b] dark:text-[#b0b3b8]'
                        }`}>
                        {locale === 'bn' ? u.labelBn : u.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Patient Name & Units */}
              <View className="flex-row gap-2.5">
                <View className="flex-1 gap-1">
                  <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {locale === 'bn' ? 'রোগীর নাম *' : 'Patient Name *'}
                  </Text>
                  <TextInput
                    value={patientName}
                    onChangeText={setPatientName}
                    placeholder="Patient Name"
                    placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                    className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2 text-xs text-[#050505] dark:text-[#e4e6eb]"
                  />
                </View>

                <View className="w-28 gap-1">
                  <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {locale === 'bn' ? 'কত ব্যাগ' : 'Units (Bags)'}
                  </Text>
                  <TextInput
                    value={String(units)}
                    onChangeText={(val) =>
                      setUnits(Math.max(1, parseInt(val) || 1))
                    }
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                    className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2 text-xs text-[#050505] dark:text-[#e4e6eb] text-center font-bold"
                  />
                </View>
              </View>

              {/* Hospital Name & Area */}
              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn' ? 'হাসপাতালের নাম *' : 'Hospital Name *'}
                </Text>
                <TextInput
                  value={hospitalName}
                  onChangeText={setHospitalName}
                  placeholder="e.g. Dhaka Medical College Hospital"
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2 text-xs text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>

              {/* Location / Area */}
              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn' ? 'লোকেশন / জেলা' : 'Location / City'}
                </Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. Dhaka, Bangladesh"
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2 text-xs text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>

              {/* Contact Number & Date Needed */}
              <View className="flex-row gap-2.5">
                <View className="flex-1 gap-1">
                  <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {locale === 'bn' ? 'যোগাযোগ নম্বর *' : 'Contact Phone *'}
                  </Text>
                  <TextInput
                    value={contactNumber}
                    onChangeText={setContactNumber}
                    placeholder="01XXXXXXXXX"
                    keyboardType="phone-pad"
                    placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                    className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2 text-xs text-[#050505] dark:text-[#e4e6eb]"
                  />
                </View>

                <View className="flex-1 gap-1">
                  <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {locale === 'bn' ? 'প্রয়োজনের তারিখ' : 'Date Needed'}
                  </Text>
                  <TextInput
                    value={neededDate}
                    onChangeText={setNeededDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                    className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2 text-xs text-[#050505] dark:text-[#e4e6eb]"
                  />
                </View>
              </View>

              {/* Problem / Reason */}
              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn' ? 'রোগের বিবরণ / সমস্যা' : 'Medical Reason / Problem'}
                </Text>
                <TextInput
                  value={problem}
                  onChangeText={setProblem}
                  placeholder={
                    locale === 'bn'
                      ? 'যেমন: ডেলিভারি রোগী, রক্তের হিমোগ্লোবিন কমে গেছে'
                      : 'e.g. Delivery patient, low hemoglobin'
                  }
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2 text-xs text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* ────────────────── 4. FIXED BOTTOM ACCESSORY TOOLBAR ────────────────── */}
        <View className="h-14 border-t border-[#e4e6eb] dark:border-[#2d2e2f] bg-white dark:bg-[#18191a] px-4 flex-row items-center justify-between select-none">
          {/* Left: Quick Action Buttons */}
          <View className="flex-row items-center gap-2">
            {/* Photo Button (Active in TEXT mode) */}
            {postType === 'TEXT' && (
              <Pressable
                onPress={handlePickImages}
                disabled={isUploadingMedia || mediaUrls.length >= 10}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border active:scale-95 ${
                  mediaUrls.length > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800'
                    : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/50'
                }`}>
                {isUploadingMedia ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <AppIcon android="image" ios="photo" size={16} color="#059669" />
                )}
                <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {isUploadingMedia
                    ? locale === 'bn'
                      ? 'আপলোড হচ্ছে...'
                      : 'Uploading...'
                    : locale === 'bn'
                      ? 'ছবি যুক্ত'
                      : 'Photo'}
                </Text>
                {mediaUrls.length > 0 && (
                  <View className="h-4 w-4 items-center justify-center rounded-full bg-emerald-600">
                    <Text className="text-[10px] font-bold text-white">
                      {mediaUrls.length}
                    </Text>
                  </View>
                )}
              </Pressable>
            )}

            {/* Feeling Button */}
            <Pressable
              onPress={() => setShowFeelingPicker(true)}
              className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border active:scale-95 ${
                selectedFeeling
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800'
                  : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/50'
              }`}>
              <AppIcon
                android="sentiment_satisfied"
                ios="face.smiling"
                size={16}
                color="#d97706"
              />
              <Text className="text-xs font-bold text-amber-700 dark:text-amber-300">
                {selectedFeeling
                  ? locale === 'bn'
                    ? `${selectedFeeling.emoji} ${selectedFeeling.labelBn}`
                    : `${selectedFeeling.emoji} ${selectedFeeling.label}`
                  : locale === 'bn'
                    ? 'অনুভূতি'
                    : 'Feeling'}
              </Text>
            </Pressable>
          </View>

          {/* Right: Counter Ring / Mode Label */}
          <View className="flex-row items-center gap-2">
            {postType === 'TEXT' && (
              <View className="flex-row items-center gap-1.5">
                <Svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  style={{ transform: [{ rotate: '-90deg' }] }}>
                  <Circle
                    cx={12}
                    cy={12}
                    r={radius}
                    stroke={theme === 'dark' ? '#3a3b3c' : '#e4e6eb'}
                    strokeWidth={2.5}
                    fill="transparent"
                  />
                  <Circle
                    cx={12}
                    cy={12}
                    r={radius}
                    stroke={
                      progress > 0.9
                        ? '#ef4444'
                        : progress > 0.7
                          ? '#f59e0b'
                          : '#1877f2'
                    }
                    strokeWidth={2.5}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </Svg>
                <Text className="text-[11px] font-bold text-[#8e8e93] dark:text-[#a0a0a5]">
                  {charLength > 4500
                    ? charLimit - charLength
                    : `${charLength}/${charLimit}`}
                </Text>
              </View>
            )}

            {postType === 'DUA' && (
              <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {locale === 'bn' ? '🌙 পবিত্র দু’আ' : '🌙 Authentic Dua'}
              </Text>
            )}

            {postType === 'BLOOD_REQUEST' && (
              <Text className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                {locale === 'bn' ? '🩸 রক্তদানের আবেদন' : '🩸 Blood Request'}
              </Text>
            )}
          </View>
        </View>

        {/* ────────────── FEELINGS CENTERED MODAL DIALOGUE ────────────── */}
        <Modal
          visible={showFeelingPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFeelingPicker(false)}>
          <Pressable
            onPress={() => setShowFeelingPicker(false)}
            className="flex-1 bg-black/60 items-center justify-center p-4">
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-[#e4e6eb] bg-white p-4 shadow-2xl dark:border-[#393a3b] dark:bg-[#242526]">
              {/* Dialog Header */}
              <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-[#e4e6eb] dark:border-[#393a3b]">
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60">
                    <AppIcon
                      android="sentiment_satisfied"
                      ios="face.smiling"
                      size={18}
                      color="#d97706"
                    />
                  </View>
                  <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn'
                      ? 'কেমন অনুভব করছেন?'
                      : 'How are you feeling?'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowFeelingPicker(false)}
                  className="p-1 rounded-full active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                  <AppIcon
                    android="close"
                    ios="xmark"
                    size={18}
                    color={theme === 'dark' ? '#e4e6eb' : '#050505'}
                  />
                </Pressable>
              </View>

              {/* 12 Feelings Grid */}
              <ScrollView style={{ maxHeight: 300 }}>
                <View className="flex-row flex-wrap gap-2">
                  {FEELINGS.map((item) => {
                    const isSelected = feeling === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          setFeeling(item.id);
                          setShowFeelingPicker(false);
                        }}
                        className={`w-[48%] flex-row items-center gap-2 p-2.5 rounded-2xl border active:scale-95 ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/60 dark:border-amber-700'
                            : 'bg-[#f8f9fa] dark:bg-[#18191a] border-[#e4e6eb]/60 dark:border-[#393a3b]/60'
                        }`}>
                        <Text className="text-lg">{item.emoji}</Text>
                        <Text
                          className={`text-xs font-semibold capitalize ${
                            isSelected
                              ? 'text-amber-900 dark:text-amber-200'
                              : 'text-[#050505] dark:text-[#e4e6eb]'
                          }`}>
                          {locale === 'bn' ? item.labelBn : item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Clear Feeling Option */}
              {feeling && (
                <View className="mt-3 pt-3 border-t border-[#e4e6eb] dark:border-[#393a3b] items-end">
                  <Pressable
                    onPress={() => {
                      setFeeling(null);
                      setShowFeelingPicker(false);
                    }}>
                    <Text className="text-xs font-bold text-rose-600">
                      {locale === 'bn' ? 'অনুভূতি মুছুন' : 'Remove Feeling'}
                    </Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </Modal>
  );
}
