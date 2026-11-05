import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { FeedItem } from '@/features/feed/types/feed.types';
import { normalizeMediaUrl } from '@/features/uploads/api/uploads.api';
import { queryCache } from '@/lib/cache/queryCache';
import {
  imageRatioCache,
  resolveImageAspectRatio,
} from '@/lib/cache/imageRatioCache';

/* Single Post Image – adapts dynamically to natural aspect ratio (auto height */
/* with max-height cap), avoiding horizontal or vertical photo crops in feed. */

export function SingleFeedImage({
  uri,
  onPress,
}: {
  uri: string;
  onPress: () => void;
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
    <Pressable
      onPress={onPress}
      style={{
        width: '100%',
        maxHeight: 560,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="w-full overflow-hidden active:opacity-95 bg-[#e4e6eb] dark:bg-[#3a3b3c]"
    >
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
            maxHeight: 560,
            ...(Platform.OS === 'web' && !aspectRatio
              ? { height: 'auto', display: 'block' }
              : {}),
          } as any
        }
        className="bg-[#e4e6eb] dark:bg-[#3a3b3c]"
      />
    </Pressable>
  );
}

/* Media gallery (COLLAGE / SWIPE) – shows every photo attached to the post    */

export interface PostMediaGalleryProps {
  post?: FeedItem;
  urls?: string[];
  layout?: 'COLLAGE' | 'SWIPE';
  onOpenPhoto?: (url: string) => void;
}

export function PostMediaGallery({
  post,
  urls,
  layout,
  onOpenPhoto,
}: PostMediaGalleryProps) {
  const [width, setWidth] = useState(0);
  const list = (urls || [])
    .filter((u) => typeof u === 'string' && u.trim().length > 0)
    .map((u) => normalizeMediaUrl(u));
  if (list.length === 0) return null;

  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(Math.round(e.nativeEvent.layout.width));

  const handlePressPhoto = (uri: string) => {
    if (onOpenPhoto) {
      onOpenPhoto(uri);
    } else if (post?.id) {
      queryCache.set(`post:detail:${post.id}`, post);
      router.push(`/post/${post.id}` as any);
    }
  };

  if (layout === 'SWIPE' && list.length > 1) {
    return (
      <View onLayout={onLayout} className="w-full overflow-hidden">
        {width > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {list.map((uri, i) => (
              <Pressable
                key={`${uri}-${i}`}
                onPress={() => handlePressPhoto(uri)}
              >
                <Image
                  source={{ uri }}
                  resizeMode="cover"
                  style={{ width, aspectRatio: 4 / 3 }}
                  className="bg-[#e4e6eb] dark:bg-[#3a3b3c]"
                />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        <View className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5">
          <Text className="text-[10px] font-bold text-white">
            1 / {list.length}
          </Text>
        </View>
      </View>
    );
  }

  if (list.length === 1) {
    return (
      <SingleFeedImage
        uri={list[0]}
        onPress={() => handlePressPhoto(list[0])}
      />
    );
  }

  if (list.length === 2) {
    return (
      <View
        style={{ width: '100%' }}
        className="w-full flex-row gap-0.5 overflow-hidden"
      >
        {list.map((uri, i) => (
          <Pressable
            key={`${uri}-${i}`}
            onPress={() => handlePressPhoto(uri)}
            style={{ flex: 1 }}
            className="active:opacity-95"
          >
            <Image
              source={{ uri }}
              resizeMode="cover"
              style={{ width: '100%', aspectRatio: 1 }}
              className="bg-[#e4e6eb] dark:bg-[#3a3b3c]"
            />
          </Pressable>
        ))}
      </View>
    );
  }

  const rest = list.slice(1, 4);
  const extra = list.length - 4;
  return (
    <View style={{ width: '100%' }} className="w-full gap-0.5 overflow-hidden">
      <Pressable
        onPress={() => handlePressPhoto(list[0])}
        className="active:opacity-95"
      >
        <Image
          source={{ uri: list[0] }}
          resizeMode="cover"
          style={{ width: '100%', aspectRatio: 16 / 9 }}
          className="bg-[#e4e6eb] dark:bg-[#3a3b3c]"
        />
      </Pressable>
      <View className="flex-row gap-0.5">
        {rest.map((uri, i) => (
          <Pressable
            key={`${uri}-${i}`}
            onPress={() => handlePressPhoto(uri)}
            style={{ flex: 1 }}
            className="relative active:opacity-95"
          >
            <Image
              source={{ uri }}
              resizeMode="cover"
              style={{ width: '100%', aspectRatio: 1 }}
              className="bg-[#e4e6eb] dark:bg-[#3a3b3c]"
            />
            {i === rest.length - 1 && extra > 0 ? (
              <View className="absolute inset-0 items-center justify-center bg-black/50">
                <Text className="text-xl font-black text-white">+{extra}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
