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

    // Content length checks for adaptive scaling so text is as large as possible
    const totalChars =
      (arabicText?.length || 0) +
      (transliteration?.length || 0) +
      (meaning?.length || 0) +
      (rawPostContent?.length || 0);

    const isLong = totalChars > 160;

    // Hierarchy requested by user:
    // 1. Arabic: prominent & clear
    // 2. Pronunciation (উচ্চারণ): BORO (Large / Prominent, 21-24px)
    // 3. Meaning (অর্থ): CHOTO (Small / Subtle, 14-15px)
    const arabicFontSize = isLong ? 24 : 29;
    const arabicLineHeight = isLong ? 40 : 48;
    const transliterationFontSize = isLong ? 19 : 23;
    const transliterationLineHeight = isLong ? 28 : 34;
    const meaningFontSize = isLong ? 13.5 : 15;
    const meaningLineHeight = isLong ? 20 : 23;

    return (
      <View
        ref={ref}
        collapsable={false}
        style={[
          styles.cardContainer,
          { width: cardSize, height: cardSize },
        ]}
      >
        {/* 1. Pure, Simple Vintage Book Paper Background (from user sample) */}
        <Image
          source={VINTAGE_BG}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* 2. Main Sacred / Literary Content (Centered on the paper without boxes) */}
        <View style={styles.contentBody}>
          {/* Subtle Bismillah Calligraphy (if Dua) */}
          {hasDua && arabicText ? (
            <Text style={styles.bismillahText}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Text>
          ) : null}

          {/* Optional Dua Title */}
          {title ? (
            <Text style={styles.titleText} numberOfLines={2}>
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
              numberOfLines={isLong ? 5 : 7}
            >
              {rawPostContent}
            </Text>
          ) : null}

          {/* Arabic Dua Text (Pure text directly on book paper - no box wrapper) */}
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

          {/* Pronunciation / Transliteration: BORO (Large & Prominent as requested) */}
          {transliteration ? (
            <Text
              style={[
                styles.transliterationText,
                {
                  fontSize: transliterationFontSize,
                  lineHeight: transliterationLineHeight,
                },
              ]}
              numberOfLines={isLong ? 4 : 5}
            >
              {transliteration}
            </Text>
          ) : null}

          {/* Meaning / Translation: CHOTO (Small & Subtle as requested) */}
          {meaning ? (
            <Text
              style={[
                styles.meaningText,
                { fontSize: meaningFontSize, lineHeight: meaningLineHeight },
              ]}
              numberOfLines={isLong ? 4 : 5}
            >
              "{meaning}"
            </Text>
          ) : null}

          {/* Reference (small, subtle, like book reference) */}
          {references && references.length > 0 ? (
            <Text style={styles.referenceText} numberOfLines={1}>
              — {references.map((r) => r.source?.name ? `${r.source.name}: ${r.reference}` : r.reference).join(' • ')}
            </Text>
          ) : null}
        </View>

        {/* 3. Bottom Right Signature: more: peacetweet/username (just like reference image signature) */}
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
    // 4:4 (1:1) Perfect Square Aspect Ratio
    width: 380,
    height: 380,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#eee4cf',
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 20,
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
    gap: 10,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#2a1f18',
    letterSpacing: -0.2,
    marginBottom: 4,
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
  // Pronunciation is BORO (Large, bold, prominent)
  transliterationText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#1a1412',
    letterSpacing: -0.1,
  },
  // Meaning is CHOTO (Small, lighter, subtle)
  meaningText: {
    textAlign: 'center',
    fontWeight: '500',
    color: '#4e4239',
    marginTop: 2,
    paddingHorizontal: 6,
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
    paddingTop: 6,
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
