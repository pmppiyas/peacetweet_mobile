import React from 'react';
import { View, Text, StyleSheet, Image, Platform, useWindowDimensions } from 'react-native';
import { FeedItem } from '@/features/feed/types/feed.types';

const VINTAGE_BG = require('@/assets/images/post-bg-warm-vintage.jpg');

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
    const rawPostContent = post.content && post.content !== title ? post.content : null;

    // Resolve Dua Reference (supports structured references array, dua.fadilah, or direct reference string)
    let referenceText: string | null = null;
    if (hasDua) {
      if (dua?.references && dua.references.length > 0) {
        referenceText = dua.references
          .map((r) => (r.source?.name ? `${r.source.name}: ${r.reference}` : r.reference))
          .filter(Boolean)
          .join(' • ');
      } else if (dua?.fadilah && dua.fadilah.trim()) {
        referenceText = dua.fadilah.trim();
      } else if ((dua as any)?.reference) {
        referenceText = String((dua as any).reference).trim();
      }
    } else if ((post as any)?.reference) {
      referenceText = String((post as any).reference).trim();
    }

    // Total text length for proportional scaling
    const totalChars =
      (arabicText?.length || 0) +
      (transliteration?.length || 0) +
      (meaning?.length || 0) +
      (rawPostContent?.length || 0) +
      (referenceText?.length || 0);

    // Smart auto-scaling so text fills the card harmoniously without giant gaps or overflow
    let arabicFontSize = 28;
    let arabicLineHeight = 44;
    let transliterationFontSize = 23;
    let transliterationLineHeight = 33;
    let meaningFontSize = 16;
    let meaningLineHeight = 23;
    let contentGap = 12;

    if (totalChars > 340) {
      arabicFontSize = 19;
      arabicLineHeight = 30;
      transliterationFontSize = 15.5;
      transliterationLineHeight = 22;
      meaningFontSize = 12.5;
      meaningLineHeight = 17.5;
      contentGap = 7;
    } else if (totalChars > 220) {
      arabicFontSize = 22;
      arabicLineHeight = 34;
      transliterationFontSize = 17.5;
      transliterationLineHeight = 25;
      meaningFontSize = 13.5;
      meaningLineHeight = 19.5;
      contentGap = 9;
    } else if (totalChars > 110) {
      arabicFontSize = 25;
      arabicLineHeight = 38;
      transliterationFontSize = 20;
      transliterationLineHeight = 29;
      meaningFontSize = 14.5;
      meaningLineHeight = 21;
      contentGap = 11;
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

          {/* Reference: subtle & elegant right below meaning */}
          {referenceText ? (
            <View style={styles.referenceContainer}>
              <Text style={styles.referenceText}>
                {referenceText.startsWith('—') || referenceText.startsWith('-')
                  ? referenceText
                  : `— ${referenceText}`}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 3. Bottom Right Signature: more: www.peacetweet.com/username */}
        <View style={styles.signatureRow}>
          <Text style={styles.signatureText}>
            more: www.peacetweet.com/{authorUsername}
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
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f5e8d3',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 14,
    justifyContent: 'space-between',
  },
  contentBody: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  bismillahText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#4a3b32',
    opacity: 0.9,
    fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : undefined,
    marginBottom: 2,
  },
  titleText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#261b14',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  mainQuoteText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#261b14',
    letterSpacing: -0.2,
  },
  arabicText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#1c130d',
    fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : undefined,
    marginBottom: 4,
  },
  // Pronunciation is BORO (Large, bold, prominent, full text)
  transliterationText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#1a110a',
    letterSpacing: -0.1,
  },
  // Meaning is CHOTO (Small, lighter, subtle, full text)
  meaningText: {
    textAlign: 'center',
    fontWeight: '500',
    color: '#362820',
    marginTop: 2,
    paddingHorizontal: 4,
  },
  referenceContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginTop: 8,
  },
  referenceText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    color: '#5a483e',
    textAlign: 'center',
    letterSpacing: -0.1,
    opacity: 0.85,
  },
  // Signature in bottom-right matching user's sample style
  signatureRow: {
    width: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingTop: 4,
  },
  signatureText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5a483e',
    fontStyle: 'italic',
    letterSpacing: -0.1,
    opacity: 0.85,
  },
});
