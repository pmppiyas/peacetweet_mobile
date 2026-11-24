import React from 'react';
import { View, Text, TextInput, Platform } from 'react-native';
import { AppIcon } from '@/components/ui/Icon';

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
  onInputFocus?: () => void;
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
  onInputFocus,
}: MobileDuaComposerProps) {
  const placeholderColor = theme === 'dark' ? '#6e6e73' : '#8e8e93';

  return (
    <View className="gap-4">
      {/* 1. DUA TITLE / THEME */}
      <View className="gap-1.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <AppIcon android="menu_book" size={18} color="#059669" />
            <Text className="text-[14px] font-bold text-[#1c1e21] dark:text-[#e4e6eb]">
              {locale === 'bn' ? 'দু’আর নাম বা বিষয়' : 'Dua Title / Theme'}
            </Text>
          </View>
          <View className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60">
            <Text className="text-[10.5px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {locale === 'bn' ? 'পবিত্র দু’আ' : 'Authentic'}
            </Text>
          </View>
        </View>

        <View className="relative justify-center">
          <TextInput
            value={duaTitle}
            onChangeText={onChangeDuaTitle}
            onFocus={() => onInputFocus?.()}
            placeholder={
              locale === 'bn'
                ? 'যেমন: অন্তরের প্রশান্তির দু’আ'
                : 'e.g. Supplication for Inner Peace'
            }
            placeholderTextColor={placeholderColor}
            className="w-full h-12 rounded-2xl border border-transparent bg-[#f0f2f5] dark:bg-[#242526] px-4 pr-11 text-[15.5px] text-[#050505] dark:text-[#e4e6eb] focus:border-emerald-500"
          />
          <View className="absolute right-3.5">
            <AppIcon android="auto_awesome" size={18} color="#059669" />
          </View>
        </View>
      </View>

      {/* 2. BANGLA MEANING / TRANSLATION (REQUIRED) */}
      <View className="gap-1.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn'
              ? 'বাংলা অর্থ / অনুবাদ *'
              : 'Bangla Meaning (Required) *'}
          </Text>
          <View className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50">
            <Text className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Required
            </Text>
          </View>
        </View>

        <TextInput
          value={duaMeaning}
          onChangeText={onChangeDuaMeaning}
          onFocus={() => onInputFocus?.()}
          multiline
          scrollEnabled={false}
          placeholder={
            locale === 'bn'
              ? 'দু’আটির অর্থ সুন্দরভাবে বাংলায় লিখুন...'
              : 'Write the translation / meaning...'
          }
          placeholderTextColor={placeholderColor}
          style={
            {
              minHeight: 100,
              outlineStyle: 'none',
              ...(Platform.OS === 'web'
                ? { resize: 'none', overflow: 'hidden' }
                : {}),
            } as any
          }
          className="w-full rounded-2xl border border-transparent bg-[#f0f2f5] dark:bg-[#242526] px-4 py-3 text-[15.5px] leading-[23px] text-[#050505] dark:text-[#e4e6eb] focus:border-emerald-500"
          textAlignVertical="top"
        />
      </View>

      {/* 3. PRONUNCIATION / TRANSLITERATION */}
      <View className="gap-1.5">
        <Text className="text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
          {locale === 'bn'
            ? 'বাংলা উচ্চারণ (ঐচ্ছিক)'
            : 'Pronunciation / Transliteration (Optional)'}
        </Text>
        <TextInput
          value={duaTransliteration}
          onChangeText={onChangeDuaTransliteration}
          onFocus={() => onInputFocus?.()}
          multiline
          scrollEnabled={false}
          placeholder={
            locale === 'bn'
              ? 'যেমন: আল্লাহুম্মা ইন্নি আসআলুকাল আফওয়া...'
              : 'Transliteration in Bengali or English'
          }
          placeholderTextColor={placeholderColor}
          style={
            {
              minHeight: 68,
              outlineStyle: 'none',
              ...(Platform.OS === 'web'
                ? { resize: 'none', overflow: 'hidden' }
                : {}),
            } as any
          }
          className="w-full rounded-2xl border border-transparent bg-[#f0f2f5] dark:bg-[#242526] px-4 py-3 text-[15.5px] leading-[23px] text-[#050505] dark:text-[#e4e6eb] focus:border-emerald-500"
          textAlignVertical="top"
        />
      </View>

      {/* 4. ARABIC TEXT */}
      <View className="gap-1.5">
        <Text className="text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
          {locale === 'bn'
            ? 'আরবি টেক্সট (ঐচ্ছিক)'
            : 'Arabic Text (Optional)'}
        </Text>
        <TextInput
          value={duaArabicText}
          onChangeText={onChangeDuaArabicText}
          onFocus={() => onInputFocus?.()}
          multiline
          scrollEnabled={false}
          placeholder="اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ"
          placeholderTextColor={placeholderColor}
          style={
            {
              minHeight: 74,
              outlineStyle: 'none',
              ...(Platform.OS === 'web'
                ? { resize: 'none', overflow: 'hidden' }
                : {}),
            } as any
          }
          className="w-full rounded-2xl border border-transparent bg-[#f0f2f5] dark:bg-[#242526] px-4 py-3 text-right text-[20px] leading-[32px] text-[#050505] dark:text-[#e4e6eb] focus:border-emerald-500"
          textAlignVertical="top"
        />
      </View>

      {/* 5. VIRTUE & HADITH REFERENCE (FADILAH) */}
      <View className="gap-1.5">
        <Text className="text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
          {locale === 'bn'
            ? 'ফজিলত ও হাদিস রেফারেন্স (ঐচ্ছিক)'
            : 'Virtue & Hadith Reference (Optional)'}
        </Text>
        <View className="relative justify-center">
          <TextInput
            value={duaFadilah}
            onChangeText={onChangeDuaFadilah}
            onFocus={() => onInputFocus?.()}
            placeholder={
              locale === 'bn'
                ? 'যেমন: তিরমিযী, হাদিস নং ৩৪৫৬'
                : 'e.g. Tirmidhi Hadith #3456'
            }
            placeholderTextColor={placeholderColor}
            className="w-full h-12 rounded-2xl border border-transparent bg-[#f0f2f5] dark:bg-[#242526] px-4 pr-11 text-[15.5px] text-[#050505] dark:text-[#e4e6eb] focus:border-emerald-500"
          />
          <View className="absolute right-3.5">
            <AppIcon android="verified_user" size={18} color="#059669" />
          </View>
        </View>
      </View>
    </View>
  );
}
