import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FeedItem } from '@/features/feed/types/feed.types';
import {
  getPostBackgroundById,
  PostBackgroundOption,
  getBackgroundPostTypography,
} from '../constants/postBackgrounds';
import { PostBackgroundView } from './PostBackgroundView';

export interface StyledBackgroundPostCardProps {
  post: FeedItem;
  background?: PostBackgroundOption;
}

export function StyledBackgroundPostCard({
  post,
  background: propBg,
}: StyledBackgroundPostCardProps) {
  const bg = propBg || getPostBackgroundById(post.mediaLayout);
  const content = post.content || '';

  if (!bg) {
    return null;
  }

  const { fontSize, lineHeight, fontWeight } = getBackgroundPostTypography(content);

  const textShadowStyle = bg.textShadow
    ? {
        textShadowColor: 'rgba(0, 0, 0, 0.45)',
        textShadowOffset: { width: 0, height: 1.5 },
        textShadowRadius: 4,
      }
    : undefined;

  return (
    <View style={styles.cardContainer}>
      {/* Background layer: Image or Gradient */}
      <PostBackgroundView background={bg} />

      {/* Centered Styled Text Body */}
      <View style={styles.contentWrapper}>
        <Text
          style={[
            styles.textBody,
            {
              fontSize,
              lineHeight,
              fontWeight,
              color: bg.textColor,
            },
            textShadowStyle,
          ]}
        >
          {content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    minHeight: 270,
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  textBody: {
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});
