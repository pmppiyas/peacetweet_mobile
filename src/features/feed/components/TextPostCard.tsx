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
  return (
    <View style={{ width: '100%' }} className="w-full gap-3">
      {/* Content text (Expandable if > 2 lines) */}
      <ExpandablePostCaption content={post.content} />

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
