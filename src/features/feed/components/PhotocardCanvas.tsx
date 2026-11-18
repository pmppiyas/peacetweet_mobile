import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { FeedItem } from '@/features/feed/types/feed.types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { AppIcon } from '@/components/ui/Icon';

const VINTAGE_BG = require('@/assets/images/photocard-bg-vintage.jpg');

export interface PhotocardCanvasProps {
  post: FeedItem;
  locale?: 'bn' | 'en';
}

export const PhotocardCanvas = React.forwardRef<any, PhotocardCanvasProps>(
  ({ post, locale = 'bn' }, ref) => {
    const dua = post.dua;
    const author = post.author;
    const authorName = author?.name || (locale === 'bn' ? 'ইউজার' : 'User');
    const authorUsername = author?.username || 'user';
    const authorAvatar = author?.avatar || (author as any)?.avatarUrl;

    // Dua contents
    const hasDua = Boolean(dua && !(dua as any).isUnavailable);
    const title = hasDua ? dua?.title : null;
    const arabicText = hasDua ? dua?.arabicText : null;
    const transliteration = hasDua ? dua?.transliteration : null;
    const meaning = hasDua ? (dua?.meaning || dua?.meaningBangla) : null;
    const references = hasDua && dua?.references && dua.references.length > 0 ? dua.references : null;
    const rawPostContent = post.content && post.content !== title ? post.content : null;

    return (
      <View
        ref={ref}
        collapsable={false}
        style={styles.cardContainer}
      >
        {/* 1. Vintage Notebook Paper Background */}
        <Image
          source={VINTAGE_BG}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* Vintage Paper Inner Vignette & Border */}
        <View style={styles.cardBorderOverlay} />

        {/* 2. Top Header Branding */}
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <Text style={styles.brandPeace}>Peace</Text>
            <Text style={styles.brandTweet}>Tweet</Text>
          </View>

          {hasDua ? (
            <View style={styles.duaBadge}>
              <Text style={styles.duaBadgeText}>
                {locale === 'bn' ? '🌙 পবিত্র দু’আ' : '🌙 Authentic Dua'}
              </Text>
            </View>
          ) : (
            <View style={styles.quoteBadge}>
              <Text style={styles.quoteBadgeText}>
                {locale === 'bn' ? '✨ শান্তির বার্তা' : '✨ Peace Reflection'}
              </Text>
            </View>
          )}
        </View>

        {/* 3. Card Content Area */}
        <View style={styles.contentBody}>
          {/* Subtle Bismillah Calligraphy Header for Duas */}
          {hasDua && arabicText ? (
            <Text style={styles.bismillahText}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Text>
          ) : null}

          {/* Title */}
          {title ? (
            <Text style={styles.titleText}>
              {title}
            </Text>
          ) : null}

          {/* Optional Caption / Context Note */}
          {rawPostContent ? (
            <Text style={styles.captionText}>
              {rawPostContent}
            </Text>
          ) : null}

          {/* Arabic Dua Sacred Text */}
          {arabicText ? (
            <View style={styles.arabicWrapper}>
              <Text style={styles.arabicText}>
                {arabicText}
              </Text>
            </View>
          ) : null}

          {/* Decorative Divider */}
          <View style={styles.ornateDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerStar}>✦</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Transliteration / Pronunciation */}
          {transliteration ? (
            <View style={styles.transliterationBox}>
              <Text style={styles.subheadingLabel}>
                {locale === 'bn' ? 'উচ্চারণ:' : 'Pronunciation:'}
              </Text>
              <Text style={styles.transliterationText}>
                {transliteration}
              </Text>
            </View>
          ) : null}

          {/* Meaning / Translation */}
          {meaning ? (
            <View style={styles.meaningBox}>
              <Text style={styles.subheadingLabel}>
                {locale === 'bn' ? 'অর্থ:' : 'Meaning:'}
              </Text>
              <Text style={styles.meaningText}>
                "{meaning}"
              </Text>
            </View>
          ) : null}

          {/* Hadith / Quran Source Reference */}
          {references && references.length > 0 ? (
            <View style={styles.referenceBox}>
              <Text style={styles.referenceText}>
                📖 {references.map((r) => r.source?.name ? `${r.source.name}: ${r.reference}` : r.reference).join(' • ')}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 4. Bottom Author & Attribution Footer */}
        <View style={styles.footerContainer}>
          <View style={styles.authorRow}>
            <UserAvatar
              avatarUrl={authorAvatar}
              name={authorName}
              size="sm"
            />
            <View style={styles.authorMeta}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName} numberOfLines={1}>
                  {authorName}
                </Text>
                <AppIcon
                  android="verified"
                  ios="checkmark.seal.fill"
                  size={13}
                  color="#0866FF"
                />
              </View>
              <Text style={styles.authorHandle}>
                @{authorUsername}
              </Text>
            </View>
          </View>

          {/* The required promotional link: more: peacetweet/username */}
          <View style={styles.moreBadge}>
            <Text style={styles.moreLabel}>more: </Text>
            <Text style={styles.moreLink}>peacetweet/{authorUsername}</Text>
          </View>
        </View>
      </View>
    );
  }
);

PhotocardCanvas.displayName = 'PhotocardCanvas';

const styles = StyleSheet.create({
  cardContainer: {
    width: 360,
    minHeight: 520,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f5efe6',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    justifyContent: 'space-between',
    // Realistic shadow for physical notebook look
    shadowColor: '#3c2a1a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  cardBorderOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(120, 80, 40, 0.18)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120, 80, 40, 0.14)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandPeace: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0866FF',
    letterSpacing: -0.4,
  },
  brandTweet: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1c1917',
    letterSpacing: -0.4,
  },
  duaBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  duaBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#b45309',
  },
  quoteBadge: {
    backgroundColor: 'rgba(8, 102, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(8, 102, 255, 0.2)',
  },
  quoteBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0866FF',
  },
  contentBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    marginVertical: 4,
  },
  bismillahText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#78350f',
    opacity: 0.9,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : undefined,
  },
  titleText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#292524',
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  captionText: {
    textAlign: 'center',
    fontSize: 14.5,
    lineHeight: 22,
    color: '#44403c',
    marginBottom: 4,
  },
  arabicWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 80, 40, 0.12)',
  },
  arabicText: {
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 44,
    fontWeight: '600',
    color: '#1c1917',
    fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : undefined,
  },
  ornateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    gap: 8,
  },
  dividerLine: {
    height: 1,
    flex: 1,
    backgroundColor: 'rgba(120, 80, 40, 0.2)',
  },
  dividerStar: {
    fontSize: 12,
    color: '#b45309',
    opacity: 0.7,
  },
  transliterationBox: {
    gap: 2,
  },
  meaningBox: {
    gap: 2,
  },
  subheadingLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#92400e',
  },
  transliterationText: {
    fontSize: 13.5,
    fontStyle: 'italic',
    lineHeight: 20,
    color: '#44403c',
  },
  meaningText: {
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: '500',
    color: '#1c1917',
  },
  referenceBox: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(120, 80, 40, 0.12)',
  },
  referenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716c',
    textAlign: 'center',
  },
  footerContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(120, 80, 40, 0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  authorMeta: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1917',
  },
  authorHandle: {
    fontSize: 11,
    color: '#78716c',
  },
  moreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(120, 80, 40, 0.18)',
  },
  moreLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#78716c',
  },
  moreLink: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0866FF',
  },
});
