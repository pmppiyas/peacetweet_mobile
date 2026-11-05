import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { FeedItem } from '@/features/feed/types/feed.types';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';
import { PostMediaGallery } from './PostMediaGallery';
import { ExpandablePostCaption } from './ExpandablePostCaption';

export interface DuaPostCardProps {
  post: FeedItem;
  defaultShowArabic?: boolean;
  onOpenPhoto?: (url: string) => void;
}

export function DuaPostCard({
  post,
  defaultShowArabic = false,
  onOpenPhoto,
}: DuaPostCardProps) {
  const { locale, theme } = useUi();
  const [showArabic, setShowArabic] = useState(defaultShowArabic);
  const dua = post.dua;

  return (
    <View style={{ width: '100%' }} className="w-full gap-3">
      {/* Optional editorial / caption note (Expandable if > 2 lines) */}
      <ExpandablePostCaption content={post.content} />

      {/* Dua Card Details */}
      {dua && !(dua as any).isUnavailable ? (
        <View className="px-3 gap-3">
          {/* Dua Title */}
          {dua.title && (!post.content || post.content !== dua.title) ? (
            <Text
              selectable={true}
              className="text-[16px] font-bold text-[#050505] dark:text-[#e4e6eb] select-text">
              🌙 {dua.title}
            </Text>
          ) : null}

          {/* Fadilah / Virtue */}
          {dua.fadilah ? (
            <View className="gap-1">
              <Text
                selectable={false}
                className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 select-none">
                {locale === 'bn' ? 'ফযীলত:' : 'Virtue:'}
              </Text>
              <Text
                selectable={true}
                className="text-[14.5px] text-[#050505] dark:text-[#e4e6eb] leading-6 select-text">
                {dua.fadilah}
              </Text>
            </View>
          ) : null}

          {/* Arabic Text (Collapsible) */}
          {dua.arabicText ? (
            <View className="gap-2">
              <Pressable
                onPress={() => setShowArabic(!showArabic)}
                className="flex-row items-center gap-1.5 py-1 self-start select-none">
                <AppIcon
                  android="translate"
                  size={14}
                  color={theme === 'dark' ? '#4a80f5' : '#1565d8'}
                />
                <Text
                  selectable={false}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 select-none">
                  {showArabic
                    ? locale === 'bn'
                      ? 'আরবি লুকান'
                      : 'Hide Arabic'
                    : locale === 'bn'
                    ? 'আরবি টেক্সট দেখুন (Arabic Text)'
                    : 'Show Arabic Text'}
                </Text>
              </Pressable>

              {showArabic ? (
                <View className="py-2 px-3 rounded-xl bg-[#f8f9fa] dark:bg-[#18191a]">
                  <Text
                    selectable={true}
                    className="text-right text-2xl text-[#050505] dark:text-[#e4e6eb] leading-10 select-text">
                    {dua.arabicText}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Transliteration */}
          {dua.transliteration ? (
            <View className="gap-1">
              <Text
                selectable={false}
                className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 select-none">
                {locale === 'bn' ? 'উচ্চারণ:' : 'Pronunciation:'}
              </Text>
              <Text
                selectable={true}
                className="text-[14.5px] text-[#050505] dark:text-[#e4e6eb] leading-6 select-text">
                {dua.transliteration}
              </Text>
            </View>
          ) : null}

          {/* Meaning / Translation */}
          {dua.meaning || dua.meaningBangla ? (
            <View className="gap-1">
              <Text
                selectable={false}
                className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 select-none">
                {locale === 'bn' ? 'অর্থ:' : 'Meaning:'}
              </Text>
              <Text
                selectable={true}
                className="text-[14.5px] text-[#050505] dark:text-[#e4e6eb] leading-6 select-text">
                {dua.meaning || dua.meaningBangla}
              </Text>
            </View>
          ) : null}

          {/* References */}
          {dua.references && dua.references.length > 0 ? (
            <View className="pt-0.5">
              <Text
                selectable={true}
                className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8] select-text">
                📖{' '}
                {dua.references
                  .map((r) =>
                    r.source?.name
                      ? `${r.source.name}: ${r.reference}`
                      : r.reference
                  )
                  .join(' • ')}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Media Gallery (if any) */}
      <PostMediaGallery
        post={post}
        urls={post.mediaUrls}
        layout={post.mediaLayout}
        onOpenPhoto={onOpenPhoto}
      />
    </View>
  );
}
