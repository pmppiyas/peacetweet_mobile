import React from 'react';
import { View, Text, StyleSheet, Image, Platform, useWindowDimensions } from 'react-native';
import { FeedItem } from '@/features/feed/types/feed.types';

const VINTAGE_BG = require('@/assets/images/photocard-bg-vintage.jpg');

export interface PhotocardCanvasProps {
  post: FeedItem;
  locale?: 'bn' | 'en';
}

export const PhotocardCanvas = React.forwardRef<any, PhotocardCanvasProps>(
  ({ post, locale = 'bn' }, ref) => {
    const { width: windowWidth } = useWindowDimensions();
    const cardSize = Math.min(windowWidth - 48, 380);

    const dua = post.dua;
    const author = post.author;
    const authorUsername = author?.username || 'user';

    // Dua contents
    const hasDua = Boolean(dua && !(dua as any).isUnavailable);
    const title = hasDua ? dua?.title : null;
    const arabicText = hasDua ? dua?.arabicText : null;
    const transliteration = hasDua ? dua?.transliteration : null;
    const meaning = hasDua ? (dua?.meaning || dua?.meaningBangla) : null;
    const references = hasDua && dua?.references && dua.references.length > 0 ? dua.references : null;
    const rawPostContent = post.content && post.content !== title ? post.content : null;

    // Adaptive sizing for 4:4 (1:1) square card so text stays as large as possible without overflowing
    const totalChars =
      (arabicText?.length || 0) +
      (meaning?.length || 0) +
      (rawPostContent?.length || 0);

    const isVeryLong = totalChars > 220;
    const isMedium = totalChars > 120;

    const arabicFontSize = isVeryLong ? 24 : isMedium ? 28 : 33;
    const arabicLineHeight = isVeryLong ? 42 : isMedium ? 48 : 54;
    const meaningFontSize = isVeryLong ? 15.5 : isMedium ? 17.5 : 19.5;
    const meaningLineHeight = isVeryLong ? 23 : isMedium ? 26 : 29;
    const titleFontSize = isVeryLong ? 18 : 21;

    return (
      <View
        ref={ref}
        collapsable={false}
        style={[
          styles.cardContainer,
          { width: cardSize, height: cardSize },
        ]}
      >
        {/* 1. Square Vintage Notebook Paper Background */}
        <Image
          source={VINTAGE_BG}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* Vintage Paper Double Border Overlay */}
        <View style={styles.cardBorderOverlayOuter} />
        <View style={styles.cardBorderOverlayInner} />

        {/* 2. Main Content Body - Centered in 4:4 Square */}
        <View style={styles.contentBody}>
          {/* Subtle Bismillah Calligraphy */}
          {hasDua && arabicText ? (
            <Text style={styles.bismillahText}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Text>
          ) : null}

          {/* Dua Title */}
          {title ? (
            <Text
              style={[styles.titleText, { fontSize: titleFontSize }]}
              numberOfLines={2}
            >
              {title}
            </Text>
          ) : null}

          {/* Optional Caption / Post Content (for non-Dua or captioned posts) */}
          {rawPostContent ? (
            <Text
              style={[styles.captionText, { fontSize: meaningFontSize, lineHeight: meaningLineHeight }]}
              numberOfLines={isVeryLong ? 4 : 6}
            >
              {rawPostContent}
            </Text>
          ) : null}

          {/* Large Arabic Dua Sacred Text */}
          {arabicText ? (
            <View style={styles.arabicWrapper}>
              <Text
                style={[
                  styles.arabicText,
                  { fontSize: arabicFontSize, lineHeight: arabicLineHeight },
                ]}
              >
                {arabicText}
              </Text>
            </View>
          ) : null}

          {/* Ornate Star Divider */}
          {(arabicText || title) && (meaning || transliteration) ? (
            <View style={styles.ornateDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerStar}>✦</Text>
              <View style={styles.dividerLine} />
            </View>
          ) : null}

          {/* Transliteration / Pronunciation */}
          {transliteration ? (
            <View style={styles.transliterationBox}>
              <Text
                style={[styles.transliterationText, isVeryLong && { fontSize: 13, lineHeight: 19 }]}
                numberOfLines={3}
              >
                {transliteration}
              </Text>
            </View>
          ) : null}

          {/* Bengali / English Meaning / Translation */}
          {meaning ? (
            <View style={styles.meaningBox}>
              <Text
                style={[
                  styles.meaningText,
                  { fontSize: meaningFontSize, lineHeight: meaningLineHeight },
                ]}
                numberOfLines={isVeryLong ? 5 : 7}
              >
                "{meaning}"
              </Text>
            </View>
          ) : null}

          {/* Reference Source */}
          {references && references.length > 0 ? (
            <View style={styles.referenceBox}>
              <Text style={styles.referenceText} numberOfLines={1}>
                📖 {references.map((r) => r.source?.name ? `${r.source.name}: ${r.reference}` : r.reference).join(' • ')}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 3. Footer: ONLY "more: peacetweet/username" (No header, no user photo, no user name) */}
        <View style={styles.footerRow}>
          <Text style={styles.moreLabel}>more: </Text>
          <Text style={styles.moreHandle}>peacetweet/{authorUsername}</Text>
        </View>
      </View>
    );
  }
);

PhotocardCanvas.displayName = 'PhotocardCanvas';

const styles = StyleSheet.create({
  cardContainer: {
    // 4:4 (1:1) Perfect Square Aspect Ratio
    width: 380,
    height: 380,
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#faf6ef',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    // Realistic shadow for physical paper look
    shadowColor: '#3c2a1a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  cardBorderOverlayOuter: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(120, 80, 40, 0.22)',
  },
  cardBorderOverlayInner: {
    ...StyleSheet.absoluteFill,
    margin: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(120, 80, 40, 0.12)',
  },
  contentBody: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  bismillahText: {
    textAlign: 'center',
    fontSize: 17,
    color: '#854d0e',
    opacity: 0.9,
    fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : undefined,
  },
  titleText: {
    textAlign: 'center',
    fontWeight: '800',
    color: '#292524',
    letterSpacing: -0.3,
    paddingHorizontal: 8,
  },
  captionText: {
    textAlign: 'center',
    color: '#3f3f46',
    fontWeight: '500',
    paddingHorizontal: 6,
  },
  arabicWrapper: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(120, 80, 40, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabicText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#18181b',
    fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : undefined,
  },
  ornateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '75%',
    marginVertical: 4,
    gap: 8,
  },
  dividerLine: {
    height: 1,
    flex: 1,
    backgroundColor: 'rgba(120, 80, 40, 0.22)',
  },
  dividerStar: {
    fontSize: 11,
    color: '#a16207',
    opacity: 0.8,
  },
  transliterationBox: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  transliterationText: {
    fontSize: 14.5,
    fontStyle: 'italic',
    lineHeight: 21,
    color: '#52525b',
    textAlign: 'center',
  },
  meaningBox: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  meaningText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#18181b',
    letterSpacing: -0.1,
  },
  referenceBox: {
    marginTop: 2,
    paddingHorizontal: 10,
  },
  referenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716c',
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(120, 80, 40, 0.14)',
    width: '100%',
  },
  moreLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#78716c',
  },
  moreHandle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0866FF',
    letterSpacing: -0.2,
  },
});
