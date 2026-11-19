import React from 'react';
import { View, Text, TextInput, Platform } from 'react-native';

export interface MobileDuaComposerProps {
  duaTitle: string;
  onChangeDuaTitle: (val: string) => void;
  duaMeaning: string;
  onChangeDuaMeaning: (val: string) => void;
  duaTransliteration: string;
  onChangeDuaTransliteration: (val: string) => void;
  duaArabicText: string;
  onChangeDuaArabicText: (val: string) => void;
  duaFadilah: string;
  onChangeDuaFadilah: (val: string) => void;
  theme?: 'light' | 'dark';
  locale?: string;
}

export function MobileDuaComposer({
  duaTitle,
  onChangeDuaTitle,
  duaMeaning,
  onChangeDuaMeaning,
  duaTransliteration,
  onChangeDuaTransliteration,
  duaArabicText,
  onChangeDuaArabicText,
  duaFadilah,
  onChangeDuaFadilah,
  theme = 'light',
  locale = 'bn',
}: MobileDuaComposerProps) {
  const placeholderColor = theme === 'dark' ? '#6e6e73' : '#8e8e93';

  return (
    <View className="gap-3.5">
      {/* Title */}
      <View className="gap-1">
        <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
          {locale === 'bn' ? 'দু’আর নাম বা বিষয়' : 'Dua Title / Theme'}
        </Text>
        <TextInput
          value={duaTitle}
          onChangeText={onChangeDuaTitle}
          placeholder={
            locale === 'bn'
              ? 'যেমন: অন্তরের প্রশান্তির দু’আ'
              : 'e.g. Supplication for Inner Peace'
          }
          placeholderTextColor={placeholderColor}
          className="w-full rounded-2xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2.5 text-sm text-[#050505] dark:text-[#e4e6eb]"
        />
      </View>

      {/* Meaning (Required) */}
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
          onChangeText={onChangeDuaMeaning}
          multiline
          scrollEnabled={false}
          placeholder={
            locale === 'bn'
              ? 'দু’আটির অর্থ সুন্দরভাবে বাংলায় লিখুন...'
              : 'Write the translation / meaning...'
          }
          placeholderTextColor={placeholderColor}
          style={{
            minHeight: 90,
            outlineStyle: 'none',
            ...(Platform.OS === 'web'
              ? { resize: 'none', overflow: 'hidden' }
              : {}),
          } as any}
          className="w-full rounded-2xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] p-3 text-sm text-[#050505] dark:text-[#e4e6eb]"
          textAlignVertical="top"
        />
      </View>

      {/* Transliteration */}
      <View className="gap-1">
        <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
          {locale === 'bn'
            ? 'বাংলা উচ্চারণ (Transliteration)'
            : 'Pronunciation in Bengali'}
        </Text>
        <TextInput
          value={duaTransliteration}
          onChangeText={onChangeDuaTransliteration}
          placeholder={
            locale === 'bn'
              ? 'যেমন: আল্লাহুম্মা ইন্নি আসআলুকাল আফওয়া...'
              : 'Transliteration in Bengali'
          }
          placeholderTextColor={placeholderColor}
          className="w-full rounded-2xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2.5 text-sm text-[#050505] dark:text-[#e4e6eb]"
        />
      </View>

      {/* Arabic Text */}
      <View className="gap-1">
        <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
          {locale === 'bn'
            ? 'আরবি টেক্সট (Arabic Text)'
            : 'Arabic Text'}
        </Text>
        <TextInput
          value={duaArabicText}
          onChangeText={onChangeDuaArabicText}
          placeholder="اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ"
          placeholderTextColor={placeholderColor}
          className="w-full rounded-2xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2.5 text-right text-base text-[#050505] dark:text-[#e4e6eb]"
        />
      </View>

      {/* Fadilah */}
      <View className="gap-1">
        <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
          {locale === 'bn'
            ? 'ফজিলত ও হাদিস রেফারেন্স'
            : 'Virtue & Hadith Reference'}
        </Text>
        <TextInput
          value={duaFadilah}
          onChangeText={onChangeDuaFadilah}
          placeholder={
            locale === 'bn'
              ? 'যেমন: তিরমিযী, হাদিস নং ৩৪৫৬'
              : 'e.g. Tirmidhi Hadith #3456'
          }
          placeholderTextColor={placeholderColor}
          className="w-full rounded-2xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2.5 text-sm text-[#050505] dark:text-[#e4e6eb]"
        />
      </View>
    </View>
  );
}
