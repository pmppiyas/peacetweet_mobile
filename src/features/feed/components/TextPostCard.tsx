import React from 'react';
import { View } from 'react-native';
import { FeedItem } from '@/features/feed/types/feed.types';
import { PostMediaGallery } from './PostMediaGallery';
import { ExpandablePostCaption } from './ExpandablePostCaption';

export interface TextPostCardProps {
  post: FeedItem;
  onOpenPhoto?: (url: string) => void;
}

export function TextPostCard({ post, onOpenPhoto }: TextPostCardProps) {
  const hasMedia = Boolean(post.mediaUrls && post.mediaUrls.length > 0);

  return (
    <View style={{ width: '100%' }} className="w-full gap-3">
      {/* Content text (Expandable if > 10 lines for text-only, or > 3 lines for photo posts) */}
      <ExpandablePostCaption content={post.content} hasMedia={hasMedia} />

      {/* Media Gallery */}
      <PostMediaGallery
        post={post}
        urls={post.mediaUrls}
        layout={post.mediaLayout}
        onOpenPhoto={onOpenPhoto}
      />
    </View>
  );
}
