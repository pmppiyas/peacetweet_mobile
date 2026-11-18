import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { FeedItem } from '@/features/feed/types/feed.types';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';
import { PhotocardCanvas } from './PhotocardCanvas';

export interface DuaPhotocardModalProps {
  visible: boolean;
  onClose: () => void;
  post: FeedItem;
}

export function DuaPhotocardModal({
  visible,
  onClose,
  post,
}: DuaPhotocardModalProps) {
  const { locale, theme } = useUi();
  const isDark = theme === 'dark';
  const cardRef = useRef<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<'share' | 'save' | null>(null);

  const captureCardImage = async (): Promise<string | null> => {
    if (!cardRef.current) {
      throw new Error('Card reference is not ready.');
    }

    // Capture snapshot in high quality JPEG format
    const uri = await captureRef(cardRef, {
      format: 'jpg',
      quality: 0.95,
      result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
    });

    return uri;
  };

  const handleShare = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setActionType('share');

    try {
      const uri = await captureCardImage();
      if (!uri) throw new Error('Could not generate photocard image.');

      if (Platform.OS === 'web') {
        // Web native sharing or fallback download
        if (typeof navigator !== 'undefined' && (navigator as any).share) {
          try {
            const blob = await (await fetch(uri)).blob();
            const file = new File([blob], 'peacetweet-photocard.jpg', {
              type: 'image/jpeg',
            });
            if (
              (navigator as any).canShare &&
              (navigator as any).canShare({ files: [file] })
            ) {
              await (navigator as any).share({
                title: 'PeaceTweet Photocard',
                text: `more: peacetweet/${post.author?.username || 'user'}`,
                files: [file],
              });
              setIsProcessing(false);
              setActionType(null);
              return;
            }
          } catch {
            // fallback to download
          }
        }

        // Web download fallback
        const link = document.createElement('a');
        link.download = `peacetweet-photocard-${Date.now()}.jpg`;
        link.href = uri;
        link.click();
        Alert.alert(
          locale === 'bn' ? 'সফল হয়েছে' : 'Success',
          locale === 'bn'
            ? 'ফটোকার্ডটি ডাউনলোড করা হয়েছে। যেকোনো সোশ্যাল মিডিয়ায় পোস্ট করতে পারবেন।'
            : 'Photocard downloaded! You can now share it on any social platform.'
        );
      } else {
        // Mobile Native sharing via expo-sharing
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/jpeg',
            dialogTitle:
              locale === 'bn'
                ? 'সোশ্যাল মিডিয়ায় ফটোকার্ড শেয়ার করুন'
                : 'Share Photocard to Social Media',
            UTI: 'public.jpeg',
          });
        } else {
          Alert.alert(
            locale === 'bn' ? 'শেয়ারিং অনুপলব্ধ' : 'Sharing Unavailable',
            locale === 'bn'
              ? 'আপনার ডিভাইসে সরাসরি শেয়ারিং অপশন পাওয়া যায়নি।'
              : 'Direct sharing is not available on this device.'
          );
        }
      }
    } catch (err: any) {
      Alert.alert(
        locale === 'bn' ? 'ব্যর্থ হয়েছে' : 'Error',
        err?.message ||
          (locale === 'bn'
            ? 'ফটোকার্ড তৈরিতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।'
            : 'Failed to generate photocard. Please try again.')
      );
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  const handleSaveToDevice = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setActionType('save');

    try {
      const uri = await captureCardImage();
      if (!uri) throw new Error('Could not generate photocard image.');

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.download = `peacetweet-photocard-${Date.now()}.jpg`;
        link.href = uri;
        link.click();
        Alert.alert(
          locale === 'bn' ? 'সফল হয়েছে' : 'Success',
          locale === 'bn'
            ? 'ফটোকার্ডটি ডিভাইসে ডাউনলোড হয়েছে!'
            : 'Photocard downloaded to your device!'
        );
      } else {
        // 1. Request permission to save to Media Library (write-only to avoid asking for audio permission)
        try {
          const perm = await MediaLibrary.getPermissionsAsync(true);
          if (!perm.granted) {
            const req = await MediaLibrary.requestPermissionsAsync(true);
            if (!req.granted && req.status !== 'granted') {
              Alert.alert(
                locale === 'bn' ? 'অনুমতি প্রয়োজন' : 'Permission Required',
                locale === 'bn'
                  ? 'গ্যালারিতে ফটোকার্ড সংরক্ষণ করার জন্য স্টোরেজ অনুমতি দিন।'
                  : 'Please grant media library permission to save photocards.'
              );
              return;
            }
          }
        } catch (permError) {
          // In Expo Go on Android 13+, requesting permissions without custom manifest may throw.
          // MediaStore on Android 10+ safely allows write operations without runtime permissions.
          console.log('[Photocard] Permission prompt handled:', permError);
        }

        // 2. Create asset from local snapshot (safely saves directly into system gallery)
        const asset = await MediaLibrary.createAssetAsync(uri);

        // 3. Create or add to dedicated 'PeaceTweet' album
        try {
          const albumName = 'PeaceTweet';
          const existingAlbum = await MediaLibrary.getAlbumAsync(albumName);

          if (existingAlbum) {
            await MediaLibrary.addAssetsToAlbumAsync(
              [asset],
              existingAlbum,
              false
            );
          } else {
            await MediaLibrary.createAlbumAsync(albumName, asset, false);
          }
        } catch (albumErr) {
          // Album reading/creation may be restricted in Expo Go sandbox,
          console.log(
            '[Photocard] Album grouping skipped in this environment:',
            albumErr
          );
        }

        Alert.alert(
          locale === 'bn' ? 'সংরক্ষিত হয়েছে' : 'Saved!',
          locale === 'bn'
            ? 'ফটোকার্ডটি আপনার গ্যালারির "PeaceTweet" ফোল্ডারে সেভ হয়েছে!'
            : 'Photocard saved to the "PeaceTweet" album in your gallery!'
        );
      }
    } catch (err: any) {
      Alert.alert(
        locale === 'bn' ? 'ব্যর্থ হয়েছে' : 'Error',
        err?.message ||
          (locale === 'bn'
            ? 'ছবি সংরক্ষণে সমস্যা হয়েছে।'
            : 'Failed to save photocard image.')
      );
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        {/* Semi-transparent dark overlay */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Modal Window Container */}
        <View
          style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#1e2022' : '#ffffff' },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View
                style={[
                  styles.headerIconBadge,
                  { backgroundColor: isDark ? '#2d3034' : '#e6f0ff' },
                ]}
              >
                <AppIcon
                  android="photo_library"
                  ios="photo.on.rectangle"
                  size={19}
                  color="#0866FF"
                />
              </View>
              <View>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isDark ? '#e4e6eb' : '#050505' },
                  ]}
                >
                  {locale === 'bn' ? 'ফটোকার্ড প্রিভিউ' : 'Photocard Preview'}
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: isDark ? '#b0b3b8' : '#65676b' },
                  ]}
                >
                  {locale === 'bn'
                    ? 'অন্য সোশ্যাল মিডিয়ায় শেয়ারের জন্য প্রস্তুত'
                    : 'Ready to share on other social media'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? '#2d3034' : '#f0f2f5' },
              ]}
            >
              <AppIcon
                android="close"
                ios="xmark"
                size={18}
                color={isDark ? '#e4e6eb' : '#65676b'}
              />
            </Pressable>
          </View>

          {/* Scrollable Preview Area */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            <View style={styles.cardPreviewContainer}>
              <PhotocardCanvas ref={cardRef} post={post} locale={locale} />
            </View>
          </ScrollView>

          {/* Action Buttons Footer */}
          <View
            style={[
              styles.modalFooter,
              {
                borderTopColor: isDark ? '#2d3034' : '#f0f2f5',
                backgroundColor: isDark ? '#1e2022' : '#ffffff',
              },
            ]}
          >
            {/* 1. Share Button (Primary) */}
            <Pressable
              onPress={handleShare}
              disabled={isProcessing}
              style={[
                styles.primaryShareButton,
                isProcessing && styles.disabledButton,
              ]}
            >
              {isProcessing && actionType === 'share' ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <AppIcon
                    android="share"
                    ios="square.and.arrow.up"
                    size={18}
                    color="#ffffff"
                  />
                  <Text style={styles.primaryShareText}>
                    {locale === 'bn'
                      ? 'সোশ্যাল মিডিয়ায় শেয়ার'
                      : 'Share to Social Apps'}
                  </Text>
                </>
              )}
            </Pressable>

            {/* 2. Save Image Button (Secondary) */}
            <Pressable
              onPress={handleSaveToDevice}
              disabled={isProcessing}
              style={[
                styles.secondarySaveButton,
                {
                  borderColor: isDark ? '#3e4146' : '#d0d5dd',
                  backgroundColor: isDark ? '#26292d' : '#f8f9fa',
                },
                isProcessing && styles.disabledButton,
              ]}
            >
              {isProcessing && actionType === 'save' ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? '#e4e6eb' : '#0866FF'}
                />
              ) : (
                <>
                  <AppIcon
                    android="download"
                    ios="arrow.down.to.line"
                    size={18}
                    color={isDark ? '#e4e6eb' : '#1e2329'}
                  />
                  <Text
                    style={[
                      styles.secondarySaveText,
                      { color: isDark ? '#e4e6eb' : '#1e2329' },
                    ]}
                  >
                    {locale === 'bn' ? 'ছবি সেভ করুন' : 'Save Image'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPreviewContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#2b2118',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  primaryShareButton: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#0866FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0866FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryShareText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '700',
  },
  secondarySaveButton: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondarySaveText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
});
