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
    const cardSize = Math.min(windowWidth - 40, 380);

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

    // Total text length for proportional scaling
    const totalChars =
      (arabicText?.length || 0) +
      (transliteration?.length || 0) +
      (meaning?.length || 0) +
      (rawPostContent?.length || 0);

    // Smart auto-scaling so text is never cut off, while keeping pronunciation large & meaning small
    let arabicFontSize = 28;
    let arabicLineHeight = 46;
    let transliterationFontSize = 22;
    let transliterationLineHeight = 32;
    let meaningFontSize = 15;
    let meaningLineHeight = 22;
    let contentGap = 10;

    if (totalChars > 320) {
      arabicFontSize = 19;
      arabicLineHeight = 32;
      transliterationFontSize = 15;
      transliterationLineHeight = 22;
      meaningFontSize = 12;
      meaningLineHeight = 17;
      contentGap = 6;
    } else if (totalChars > 180) {
      arabicFontSize = 22;
      arabicLineHeight = 36;
      transliterationFontSize = 17.5;
      transliterationLineHeight = 25;
      meaningFontSize = 13;
      meaningLineHeight = 19;
      contentGap = 7;
    } else if (totalChars > 90) {
      arabicFontSize = 25;
      arabicLineHeight = 42;
      transliterationFontSize = 19.5;
      transliterationLineHeight = 28;
      meaningFontSize = 14;
      meaningLineHeight = 20.5;
      contentGap = 8;
    }

    return (
      <View
        ref={ref}
        collapsable={false}
        style={[
          styles.cardContainer,
          {
            width: cardSize,
            minHeight: cardSize,
          },
        ]}
      >
        {/* 1. Pure, Simple Vintage Book Paper Background (from user sample) */}
        <Image
          source={VINTAGE_BG}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* 2. Main Sacred / Literary Content (FULL text, no truncation) */}
        <View style={[styles.contentBody, { gap: contentGap }]}>
          {/* Subtle Bismillah Calligraphy (if Dua) */}
          {hasDua && arabicText ? (
            <Text style={styles.bismillahText}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Text>
          ) : null}

          {/* Optional Dua Title */}
          {title ? (
            <Text style={styles.titleText}>
              {title}
            </Text>
          ) : null}

          {/* Raw post content for quotes or thoughts */}
          {rawPostContent ? (
            <Text
              style={[
                styles.mainQuoteText,
                { fontSize: transliterationFontSize, lineHeight: transliterationLineHeight },
              ]}
            >
              {rawPostContent}
            </Text>
          ) : null}

          {/* Arabic Dua Text (Pure full text directly on book paper) */}
          {arabicText ? (
            <Text
              style={[
                styles.arabicText,
                { fontSize: arabicFontSize, lineHeight: arabicLineHeight },
              ]}
            >
              {arabicText}
            </Text>
          ) : null}

          {/* Pronunciation / Transliteration: BORO (Full text, large & prominent) */}
          {transliteration ? (
            <Text
              style={[
                styles.transliterationText,
                {
                  fontSize: transliterationFontSize,
                  lineHeight: transliterationLineHeight,
                },
              ]}
            >
              {transliteration}
            </Text>
          ) : null}

          {/* Meaning / Translation: CHOTO (Full text, small & subtle) */}
          {meaning ? (
            <Text
              style={[
                styles.meaningText,
                { fontSize: meaningFontSize, lineHeight: meaningLineHeight },
              ]}
            >
              "{meaning}"
            </Text>
          ) : null}

          {/* Reference (small, subtle book reference) */}
          {references && references.length > 0 ? (
            <Text style={styles.referenceText}>
              — {references.map((r) => r.source?.name ? `${r.source.name}: ${r.reference}` : r.reference).join(' • ')}
            </Text>
          ) : null}
        </View>

        {/* 3. Bottom Right Signature: more: peacetweet/username */}
        <View style={styles.signatureRow}>
          <Text style={styles.signatureText}>
            more: peacetweet/{authorUsername}
          </Text>
        </View>
      </View>
    );
  }
);

PhotocardCanvas.displayName = 'PhotocardCanvas';

const styles = StyleSheet.create({
  cardContainer: {
    width: 380,
    minHeight: 380,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#eee4cf',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 16,
    justifyContent: 'space-between',
    // Soft realistic shadow for the page
    shadowColor: '#2b2118',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  contentBody: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  bismillahText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#634832',
    opacity: 0.85,
    fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : undefined,
    marginBottom: 2,
  },
  titleText: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#2a1f18',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  mainQuoteText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#1a1412',
    letterSpacing: -0.2,
  },
  arabicText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#1c1512',
    fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : undefined,
    marginBottom: 4,
  },
  // Pronunciation is BORO (Large, bold, prominent, full text)
  transliterationText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#1a1412',
    letterSpacing: -0.1,
  },
  // Meaning is CHOTO (Small, lighter, subtle, full text)
  meaningText: {
    textAlign: 'center',
    fontWeight: '500',
    color: '#4e4239',
    marginTop: 2,
    paddingHorizontal: 4,
  },
  referenceText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#7a6b5e',
    textAlign: 'center',
    marginTop: 4,
  },
  // Signature in bottom-right matching user's sample style
  signatureRow: {
    width: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingTop: 8,
  },
  signatureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5c4d3e',
    fontStyle: 'italic',
    letterSpacing: -0.1,
    opacity: 0.9,
  },
});
