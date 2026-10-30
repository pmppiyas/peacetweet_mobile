import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useFeed } from '@/providers/FeedProvider';
import { AppIcon } from '@/components/ui/Icon';

type PostMode = 'TEXT' | 'DUA' | 'BLOOD_REQUEST';

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

export function MobileComposerModal() {
  const {
    isComposerModalOpen,
    setComposerModalOpen,
    locale,
    theme,
    setIsUploadingPost,
    triggerPostSuccess,
  } = useUi();
  const { user } = useAuth();
  const { createPost } = useFeed();

  const [postType, setPostType] = useState<PostMode>('TEXT');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Dua state
  const [duaTitle, setDuaTitle] = useState('');
  const [duaMeaning, setDuaMeaning] = useState('');
  const [duaTransliteration, setDuaTransliteration] = useState('');
  const [duaFadilah, setDuaFadilah] = useState('');
  const [duaArabicText, setDuaArabicText] = useState('');

  // Blood request state
  const [bloodGroup, setBloodGroup] = useState('');
  const [patientName, setPatientName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  if (!isComposerModalOpen) return null;

  const isPostValid =
    postType === 'TEXT'
      ? content.trim().length > 0
      : postType === 'DUA'
        ? duaMeaning.trim().length > 0
        : Boolean(
            patientName.trim() &&
              bloodGroup &&
              hospitalName.trim() &&
              contactNumber.trim()
          );

  const handleClose = () => {
    setContent('');
    setDuaTitle('');
    setDuaMeaning('');
    setDuaTransliteration('');
    setDuaFadilah('');
    setDuaArabicText('');
    setBloodGroup('');
    setPatientName('');
    setHospitalName('');
    setContactNumber('');
    setSubmitError(null);
    setPostType('TEXT');
    setComposerModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!isPostValid || isSubmitting) return;
    setIsSubmitting(true);
    setIsUploadingPost(true, postType === 'BLOOD_REQUEST' ? 'BLOOD' : 'STANDARD');
    setSubmitError(null);

    try {
      if (postType === 'TEXT') {
        await createPost({
          type: 'TEXT',
          content: content.trim(),
          visibility: 'PUBLIC',
          status: 'PUBLISHED',
        });
      } else if (postType === 'DUA') {
        await createPost({
          type: 'DUA',
          content: duaTitle.trim() ? `🌙 ${duaTitle.trim()}` : undefined,
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
        await createPost({
          type: 'BLOOD_REQUEST',
          content: content.trim() || undefined,
          visibility: 'PUBLIC',
          status: 'PUBLISHED',
          bloodRequestData: {
            patientName: patientName.trim(),
            bloodGroup,
            hospitalName: hospitalName.trim(),
            location: hospitalName.trim(),
            contactNumber: contactNumber.trim(),
            neededDate: new Date().toISOString(),
            units: 1,
          },
        });
      }
      handleClose();
      triggerPostSuccess();
    } catch (err: any) {
      setIsUploadingPost(false);
      setSubmitError(
        err?.response?.data?.message ||
          err?.message ||
          (locale === 'bn'
            ? 'পোস্ট করতে সমস্যা হয়েছে।'
            : 'Failed to create post.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isComposerModalOpen}
      animationType="slide"
      onRequestClose={handleClose}>
      <View className="flex-1 bg-white dark:bg-[#18191a]">
        {/* 1. TOP HEADER matching peacetweet_frontend MobileComposerModal */}
        <View className="flex-row items-center justify-between px-3.5 h-14 border-b border-[#e4e6eb] dark:border-[#2d2e2f] bg-white dark:bg-[#18191a]">
          <Pressable
            onPress={handleClose}
            className="h-9 w-9 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#2d2e2f]">
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
            disabled={!isPostValid || isSubmitting}
            onPress={handleSubmit}
            className={`flex-row items-center justify-center gap-1.5 px-4 py-1.5 rounded-full ${
              isPostValid
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

        {/* 2. POST TYPE SEGMENTED ROW */}
        <View className="px-4 py-2.5 border-b border-[#e4e6eb]/60 dark:border-[#2d2e2f] bg-[#fbfbfb] dark:bg-[#1f2022]">
          <View className="flex-row gap-1.5 p-1 rounded-2xl bg-[#f0f2f5] dark:bg-[#2a2b2d]">
            <Pressable
              onPress={() => setPostType('TEXT')}
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
              onPress={() => setPostType('DUA')}
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
              onPress={() => setPostType('BLOOD_REQUEST')}
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

        {/* 3. SCROLLABLE WRITING CANVAS */}
        <ScrollView className="flex-1 px-4 py-3.5" contentContainerClassName="pb-16">
          {submitError && (
            <View className="mb-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900/50 px-3 py-2">
              <Text className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {submitError}
              </Text>
            </View>
          )}

          {/* User Identity Row */}
          <View className="flex-row items-center gap-2.5 mb-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-500">
              <Text className="text-white font-bold text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : '🕊️'}
              </Text>
            </View>
            <View>
              <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                {user?.name || 'PeaceTweet User'}
              </Text>
              <View className="flex-row items-center gap-1 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-full mt-0.5 self-start border border-primary-200/50 dark:border-primary-900/50">
                <AppIcon android="public" size={12} color="#1054be" />
                <Text className="text-[11px] font-semibold text-primary-700 dark:text-primary-300">
                  Public
                </Text>
              </View>
            </View>
          </View>

          {postType === 'TEXT' && (
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
              className="min-h-[160px] text-[17px] leading-6 text-[#050505] dark:text-[#e4e6eb]"
              textAlignVertical="top"
            />
          )}

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

          {postType === 'BLOOD_REQUEST' && (
            <View className="gap-4">
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
                      className={`w-[23%] py-2.5 rounded-2xl border items-center ${
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

              <View className="gap-1">
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

              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn' ? 'হাসপাতালের নাম *' : 'Hospital Name *'}
                </Text>
                <TextInput
                  value={hospitalName}
                  onChangeText={setHospitalName}
                  placeholder="Hospital Name & Area"
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2 text-xs text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>

              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn' ? 'যোগাযোগের নম্বর *' : 'Contact Number *'}
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
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
