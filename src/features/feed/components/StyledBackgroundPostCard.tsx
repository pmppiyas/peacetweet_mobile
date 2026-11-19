import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FeedItem } from '@/features/feed/types/feed.types';
import {
  getPostBackgroundById,
  PostBackgroundOption,
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

  const charLength = content.length;
  let fontSize = 24;
  let lineHeight = 34;
  let fontWeight: '700' | '600' = '700';

  if (charLength > 160) {
    fontSize = 16.5;
    lineHeight = 24;
    fontWeight = '600';
  } else if (charLength > 85) {
    fontSize = 20;
    lineHeight = 28;
    fontWeight = '700';
  }

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
    borderRadius: 16,
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
