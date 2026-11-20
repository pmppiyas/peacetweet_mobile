import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import {
  PostBackgroundOption,
  getBackgroundPostTypography,
} from '@/features/feed/constants/postBackgrounds';
import { PostBackgroundView } from '@/features/feed/components/PostBackgroundView';
import {
  imageRatioCache,
  resolveImageAspectRatio,
} from '@/lib/cache/imageRatioCache';

export function ComposerSingleImage({
  uri,
  onRemove,
}: {
  uri: string;
  onRemove: () => void;
}) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(
    () => imageRatioCache.get(uri) || null
  );

  useEffect(() => {
    if (!uri) return;
    resolveImageAspectRatio(uri, (r) => {
      setAspectRatio(r);
    });
  }, [uri]);

  return (
    <View
      style={{
        width: '100%',
        maxHeight: 520,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#e4e6eb',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="dark:bg-[#2d2e2f]">
      <Image
        source={{ uri }}
        resizeMode="cover"
        onLoad={(e: any) => {
          const src = e?.nativeEvent?.source || e?.target;
          const nw = src?.width || src?.naturalWidth;
          const nh = src?.height || src?.naturalHeight;
          if (nw > 0 && nh > 0) {
            const r = nw / nh;
            imageRatioCache.set(uri, r);
            setAspectRatio(r);
          }
        }}
        style={
          {
            width: '100%',
            aspectRatio: aspectRatio || undefined,
            maxHeight: 520,
            ...(Platform.OS === 'web' && !aspectRatio
              ? { height: 'auto', display: 'block', maxHeight: 520 }
              : {}),
          } as any
        }
      />
      <Pressable
        onPress={onRemove}
        className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-black/75 items-center justify-center active:scale-90 shadow-md z-10"
        accessibilityLabel="Remove photo">
        <AppIcon android="close" ios="xmark" size={14} color="#ffffff" />
      </Pressable>
    </View>
  );
}

export interface MobileTextComposerProps {
  content: string;
  onChangeContent: (val: string) => void;
  contentHeight: number;
  onContentSizeChangeHeight: (h: number) => void;
  contentInputRef: React.RefObject<any>;
  isShortText: boolean;
  theme?: 'light' | 'dark';
  locale?: string;
  selectedBackground: PostBackgroundOption | null;
  onClearBackground?: () => void;
  onOpenBackgroundSheet?: () => void;
  mediaUrls: string[];
  mediaLayout: 'COLLAGE' | 'SWIPE';
  onChangeMediaLayout: (layout: 'COLLAGE' | 'SWIPE') => void;
  onRemoveMediaUrl: (index: number) => void;
  mediaContainerWidth: number;
  setMediaContainerWidth: (w: number) => void;
  swipeActiveIdx: number;
  setSwipeActiveIdx: (idx: number) => void;
}

export function MobileTextComposer({
  content,
  onChangeContent,
  contentHeight,
  onContentSizeChangeHeight,
  contentInputRef,
  isShortText,
  theme = 'light',
  locale = 'bn',
  selectedBackground,
  onClearBackground,
  onOpenBackgroundSheet,
  mediaUrls,
  mediaLayout,
  onChangeMediaLayout,
  onRemoveMediaUrl,
  mediaContainerWidth,
  setMediaContainerWidth,
  swipeActiveIdx,
  setSwipeActiveIdx,
}: MobileTextComposerProps) {
  return (
    <View className="gap-2.5 flex-1">
      {selectedBackground && selectedBackground.type !== 'none' && mediaUrls.length === 0 ? (
        /* Styled Background Post Card Input (WYSIWYG) */
        <Pressable
          onPress={() => contentInputRef.current?.focus()}
          style={{
            width: '100%',
            minHeight: 280,
            borderRadius: 0,
            overflow: 'hidden',
            position: 'relative',
            justifyContent: 'center',
            alignItems: 'center',
            marginVertical: 4,
            paddingHorizontal: 20,
            paddingVertical: 24,
            ...(Platform.OS === 'web' ? { cursor: 'text' } : {}),
          } as any}
        >
          <PostBackgroundView background={selectedBackground} />

          {/* Top-Right Style Button on Styled Card */}
          {onOpenBackgroundSheet && (
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                onOpenBackgroundSheet();
              }}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 9,
                paddingVertical: 5,
                borderRadius: 14,
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
              } as any}
              hitSlop={6}
              accessibilityLabel="Change background style"
            >
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 9, fontWeight: '900', color: '#fff', lineHeight: 10 }}>Aa</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#ffffff' }}>
                {locale === 'bn' ? selectedBackground.nameBn : selectedBackground.nameEn}
              </Text>
              <AppIcon android="expand_more" ios="chevron.down" size={13} color="#ffffff" />
            </Pressable>
          )}

          {/* Centered Large Bold Input Wrapper */}
          <View
            style={{
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            <TextInput
              ref={contentInputRef}
              value={content}
              onChangeText={onChangeContent}
              multiline
              scrollEnabled={false}
              autoFocus
              placeholder={
                locale === 'bn'
                  ? 'আপনার ভাবনা বা সুন্দর কোনো কথা লিখুন...'
                  : "What's on your mind?..."
              }
              placeholderTextColor={selectedBackground.placeholderColor}
              style={[
                {
                  width: '100%',
                  minHeight: 44,
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  fontSize: getBackgroundPostTypography(content).fontSize,
                  lineHeight: getBackgroundPostTypography(content).lineHeight,
                  fontWeight: getBackgroundPostTypography(content).fontWeight,
                  color: selectedBackground.textColor,
                  textAlign: 'center',
                  textAlignVertical: 'center',
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  outlineStyle: 'none',
                  zIndex: 10,
                } as any,
                selectedBackground.textShadow
                  ? {
                      textShadowColor: 'rgba(0, 0, 0, 0.45)',
                      textShadowOffset: { width: 0, height: 1.5 },
                      textShadowRadius: 4,
                    }
                  : null,
              ]}
            />
          </View>
        </Pressable>
      ) : (
        /* Normal Text Input with Top-Right Style Button */
        <View className="w-full">
          {mediaUrls.length === 0 && onOpenBackgroundSheet && (
            <View className="flex-row justify-end mb-1">
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  onOpenBackgroundSheet();
                }}
                className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800 active:scale-95"
                hitSlop={6}
                accessibilityLabel="Choose background style"
              >
                <View className="h-3.5 w-3.5 rounded-full items-center justify-center bg-[#8b5cf6]">
                  <Text className="text-[9px] font-black text-white leading-none">Aa</Text>
                </View>
                <Text className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                  {locale === 'bn' ? 'স্টাইল' : 'Style'}
                </Text>
                <AppIcon android="expand_more" ios="chevron.down" size={13} color="#7c3aed" />
              </Pressable>
            </View>
          )}

          <TextInput
            ref={contentInputRef}
            value={content}
            onChangeText={onChangeContent}
            multiline
            scrollEnabled={false}
            onContentSizeChange={(e) => {
              const h = e.nativeEvent?.contentSize?.height;
              if (h && h > 0) {
                onContentSizeChangeHeight(h);
              }
            }}
            placeholder={
              locale === 'bn'
                ? 'আপনার ভাবনা, কুরআন-হাদিসের সুন্দর নসিহত বা দোয়া শেয়ার করুন...'
                : "What's on your mind? Share a reflection, reminder, or story..."
            }
            placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
            style={{
              minHeight: mediaUrls.length > 0 ? 36 : 52,
              height: Math.max(mediaUrls.length > 0 ? 36 : 52, contentHeight),
              fontSize: isShortText ? 22 : 16,
              lineHeight: isShortText ? 30 : 22,
              width: '100%',
              outlineStyle: 'none',
              borderWidth: 0,
              padding: 0,
              margin: 0,
              ...(Platform.OS === 'web'
                ? {
                    resize: 'none',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }
                : {}),
            } as any}
            className="w-full text-[#050505] dark:text-[#e4e6eb]"
            textAlignVertical="top"
          />
        </View>
      )}

      {/* Attached Photos Live Feed Preview */}
      {mediaUrls.length > 0 && (
        <View
          onLayout={(e) =>
            setMediaContainerWidth(Math.round(e.nativeEvent.layout.width))
          }
          className="w-full gap-2 mt-1">
          {/* Gallery Controls (Only when 2+ photos attached) */}
          {mediaUrls.length > 1 && (
            <View className="flex-row items-center justify-between px-0.5 pb-0.5">
              <View className="flex-row items-center gap-1 rounded-full bg-[#e6e9ef] dark:bg-[#2a2b2d] p-0.5">
                <Pressable
                  onPress={() => onChangeMediaLayout('COLLAGE')}
                  className={`flex-row items-center gap-1 rounded-full px-2.5 py-0.5 ${
                    mediaLayout === 'COLLAGE'
                      ? 'bg-white dark:bg-[#18191a]'
                      : ''
                  }`}>
                  <AppIcon
                    android="layers"
                    size={11}
                    color={mediaLayout === 'COLLAGE' ? '#0866FF' : '#65676b'}
                  />
                  <Text
                    className={`text-[11px] font-semibold ${
                      mediaLayout === 'COLLAGE'
                        ? 'text-primary-600 dark:text-primary-300'
                        : 'text-[#65676b] dark:text-[#b0b3b8]'
                    }`}>
                    {locale === 'bn' ? 'কোলাজ' : 'Collage'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => onChangeMediaLayout('SWIPE')}
                  className={`flex-row items-center gap-1 rounded-full px-2.5 py-0.5 ${
                    mediaLayout === 'SWIPE'
                      ? 'bg-white dark:bg-[#18191a]'
                      : ''
                  }`}>
                  <AppIcon
                    android="more_horiz"
                    size={11}
                    color={mediaLayout === 'SWIPE' ? '#0866FF' : '#65676b'}
                  />
                  <Text
                    className={`text-[11px] font-semibold ${
                      mediaLayout === 'SWIPE'
                        ? 'text-primary-600 dark:text-primary-300'
                        : 'text-[#65676b] dark:text-[#b0b3b8]'
                    }`}>
                    {locale === 'bn' ? 'স্লাইড' : 'Swipe'}
                  </Text>
                </Pressable>
              </View>

              <Text className="text-[11px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                {mediaUrls.length}/10
              </Text>
            </View>
          )}

          {/* ─── LIVE FEED MEDIA PREVIEW ─── */}
          {/* Case 1: SWIPE Carousel */}
          {mediaLayout === 'SWIPE' && mediaUrls.length > 1 ? (
            <View className="w-full rounded-2xl overflow-hidden relative bg-[#e4e6eb] dark:bg-[#2d2e2f]">
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const w = mediaContainerWidth > 0 ? mediaContainerWidth : 1;
                  const idx = Math.min(
                    mediaUrls.length - 1,
                    Math.max(0, Math.round(e.nativeEvent.contentOffset.x / w))
                  );
                  setSwipeActiveIdx(idx);
                }}>
                {mediaUrls.map((url, idx) => (
                  <View
                    key={`${url}-${idx}`}
                    style={{
                      width: mediaContainerWidth > 0 ? mediaContainerWidth : 320,
                      aspectRatio: 4 / 3,
                    }}
                    className="relative bg-[#e4e6eb] dark:bg-[#2d2e2f]">
                    <Image
                      source={{ uri: url }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    <Pressable
                      onPress={() => onRemoveMediaUrl(idx)}
                      className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-black/75 items-center justify-center active:scale-90 shadow-md z-10"
                      accessibilityLabel="Remove photo">
                      <AppIcon
                        android="close"
                        ios="xmark"
                        size={14}
                        color="#ffffff"
                      />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
              <View className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-0.5 z-10 pointer-events-none">
                <Text className="text-[11px] font-bold text-white">
                  {swipeActiveIdx + 1} / {mediaUrls.length}
                </Text>
              </View>
            </View>
          ) : mediaUrls.length === 1 ? (
            /* Case 2: Exactly 1 Image (Natural Aspect Ratio up to 520px) */
            <ComposerSingleImage
              uri={mediaUrls[0]}
              onRemove={() => onRemoveMediaUrl(0)}
            />
          ) : mediaUrls.length === 2 ? (
            /* Case 3: Exactly 2 Images (Side by Side 1:1) */
            <View className="w-full flex-row gap-1.5 rounded-2xl overflow-hidden">
              {mediaUrls.map((url, idx) => (
                <View
                  key={`${url}-${idx}`}
                  style={{ flex: 1, aspectRatio: 1 }}
                  className="relative rounded-xl overflow-hidden bg-[#e4e6eb] dark:bg-[#2d2e2f]">
                  <Image
                    source={{ uri: url }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => onRemoveMediaUrl(idx)}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/75 items-center justify-center active:scale-90 shadow-md z-10"
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
            </View>
          ) : (
            /* Case 4: 3+ Images Collage (Hero 16:9 + row of thumbnails) */
            <View className="w-full gap-1.5 rounded-2xl overflow-hidden">
              {/* Hero Image */}
              <View
                style={{ width: '100%', aspectRatio: 16 / 9 }}
                className="relative rounded-xl overflow-hidden bg-[#e4e6eb] dark:bg-[#2d2e2f]">
                <Image
                  source={{ uri: mediaUrls[0] }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => onRemoveMediaUrl(0)}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/75 items-center justify-center active:scale-90 shadow-md z-10"
                  accessibilityLabel="Remove photo">
                  <AppIcon
                    android="close"
                    ios="xmark"
                    size={12}
                    color="#ffffff"
                  />
                </Pressable>
              </View>

              {/* Row of 3 Thumbnails */}
              <View className="flex-row gap-1.5">
                {mediaUrls.slice(1, 4).map((url, sliceIdx) => {
                  const realIdx = sliceIdx + 1;
                  const isLast = sliceIdx === 2;
                  const extraCount = mediaUrls.length - 4;

                  return (
                    <View
                      key={`${url}-${realIdx}`}
                      style={{ flex: 1, aspectRatio: 1 }}
                      className="relative rounded-xl overflow-hidden bg-[#e4e6eb] dark:bg-[#2d2e2f]">
                      <Image
                        source={{ uri: url }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />

                      {/* Remove Button */}
                      <Pressable
                        onPress={() => onRemoveMediaUrl(realIdx)}
                        className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-black/75 items-center justify-center active:scale-90 shadow-md z-10"
                        accessibilityLabel="Remove photo">
                        <AppIcon
                          android="close"
                          ios="xmark"
                          size={11}
                          color="#ffffff"
                        />
                      </Pressable>

                      {/* Overlay for +N photos */}
                      {isLast && extraCount > 0 && (
                        <View className="absolute inset-0 bg-black/55 items-center justify-center pointer-events-none">
                          <Text className="text-lg font-black text-white">
                            +{extraCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Thumbnail management strip for when there are more than 4 photos */}
          {mediaUrls.length > 4 && (
            <View className="gap-1.5 pt-1">
              <Text className="text-[11px] font-medium text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn'
                  ? `সবগুলো ছবি (${mediaUrls.length}টি) — মুছে ফেলতে ✕ চাপুন:`
                  : `All attached photos (${mediaUrls.length}) — tap ✕ to remove:`}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}>
                {mediaUrls.map((url, idx) => (
                  <View
                    key={`strip-${url}-${idx}`}
                    className="h-14 w-14 rounded-lg overflow-hidden relative border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                    <Image
                      source={{ uri: url }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    <Pressable
                      onPress={() => onRemoveMediaUrl(idx)}
                      className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/75 items-center justify-center active:scale-90"
                      accessibilityLabel="Remove photo">
                      <AppIcon
                        android="close"
                        ios="xmark"
                        size={10}
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
    </View>
  );
}
