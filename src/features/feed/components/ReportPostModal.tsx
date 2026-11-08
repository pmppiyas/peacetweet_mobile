import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';
import { FeedItem } from '../types/feed.types';
import { feedApi } from '../api/feed.api';

export interface ReportPostModalProps {
  visible: boolean;
  onClose: () => void;
  post: FeedItem;
}

const REPORT_REASONS = [
  { id: 'SPAM', labelEn: 'Spam or Scam', labelBn: 'স্প্যাম বা প্রতারণা' },
  {
    id: 'INAPPROPRIATE',
    labelEn: 'Inappropriate or Offensive',
    labelBn: 'অনুপযুক্ত বা আপত্তিকর কনটেন্ট',
  },
  {
    id: 'FALSE_INFO',
    labelEn: 'False Information',
    labelBn: 'ভুল বা বিভ্রান্তিকর তথ্য',
  },
  {
    id: 'HATE_SPEECH',
    labelEn: 'Harassment or Hate Speech',
    labelBn: 'হয়রানি বা বিদ্বেষমূলক বক্তব্য',
  },
  { id: 'OTHER', labelEn: 'Other', labelBn: 'অন্যান্য' },
];

export function ReportPostModal({ visible, onClose, post }: ReportPostModalProps) {
  const { locale, theme } = useUi();
  const isDark = theme === 'dark';
  const { height: windowHeight } = useWindowDimensions();

  const [selectedReason, setSelectedReason] = useState<string>('SPAM');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const fullHeight = windowHeight || 550;
  const translateY = useRef(new Animated.Value(fullHeight)).current;
  const isClosingRef = useRef(false);

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, fullHeight],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      translateY.setValue(fullHeight);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, fullHeight]);

  const handleReset = () => {
    setSelectedReason('SPAM');
    setDetails('');
    setIsSuccess(false);
  };

  const closeWithSlideDown = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.timing(translateY, {
      toValue: fullHeight,
      duration: 180,
      useNativeDriver: false,
    }).start(() => {
      handleReset();
      onClose();
    });
  };

  const snapBackToTop = () => {
    if (isClosingRef.current) return;
    Animated.spring(translateY, {
      toValue: 0,
      bounciness: 4,
      useNativeDriver: false,
    }).start();
  };

  // PanResponder for the top drag bar & header
  const headerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dy > 4 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        gs.dy > 4 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          translateY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 55 || gs.vy > 0.35) {
          closeWithSlideDown();
        } else {
          snapBackToTop();
        }
      },
      onPanResponderTerminate: () => {
        snapBackToTop();
      },
    })
  ).current;

  // PanResponder for the body
  const bodyPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        gs.dy > 8 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.2,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          translateY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 55 || gs.vy > 0.35) {
          closeWithSlideDown();
        } else {
          snapBackToTop();
        }
      },
      onPanResponderTerminate: () => {
        snapBackToTop();
      },
    })
  ).current;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await feedApi.reportPost(post.id, selectedReason, details.trim());
      setIsSuccess(true);
      setTimeout(() => {
        closeWithSlideDown();
      }, 1600);
    } catch {
      closeWithSlideDown();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeWithSlideDown}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'transparent',
          justifyContent: 'flex-end',
        }}>
        {/* Pinned light black backdrop overlay (fades in/out, does NOT slide from bottom) */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            opacity: backdropOpacity,
          }}>
          <Pressable
            style={{ flex: 1, width: '100%', height: '100%' }}
            onPress={closeWithSlideDown}
          />
        </Animated.View>

        <Animated.View
          style={{
            width: '100%',
            maxWidth: 640,
            alignSelf: 'center',
            transform: [{ translateY }],
          }}>
          <View
            style={{
              width: '100%',
              backgroundColor: isDark ? '#242526' : '#f5f6f8',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
              borderTopWidth: 1,
              borderColor: isDark ? '#393a3b' : '#d9dde4',
              paddingBottom: Platform.OS === 'ios' ? 32 : 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: isDark ? 0.35 : 0.1,
              shadowRadius: 16,
              elevation: 20,
            }}>
            {/* Top Drag Handle & Header */}
            <View
              {...headerPanResponder.panHandlers}
              className="w-full select-none"
              style={{ cursor: 'grab' as any }}>
              <Pressable
                onPress={closeWithSlideDown}
                className="w-full items-center pt-3 pb-1.5 active:opacity-75">
                <View
                  style={{
                    width: 44,
                    height: 5,
                    borderRadius: 999,
                    backgroundColor: isDark ? '#5a5b5c' : '#bcc0c4',
                  }}
                />
              </Pressable>

              {/* Header */}
              <View
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? '#393a3b' : '#e6e9ef',
                }}
                className="px-5 py-2.5 flex-row items-center justify-between">
                <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'পোস্ট রিপোর্ট করুন' : 'Report Post'}
                </Text>
                <Pressable
                  onPress={closeWithSlideDown}
                  className="h-8 w-8 rounded-full bg-[#e6e9ef] dark:bg-[#3a3b3c] items-center justify-center active:opacity-70">
                  <AppIcon
                    android="close"
                    size={18}
                    color={isDark ? '#e4e6eb' : '#050505'}
                  />
                </Pressable>
              </View>
            </View>

            {isSuccess ? (
              <View className="p-8 items-center justify-center">
                <View className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 items-center justify-center mb-3">
                  <AppIcon android="check" size={32} color="#10b981" />
                </View>
                <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] text-center">
                  {locale === 'bn'
                    ? 'আপনার রিপোর্টটি গৃহীত হয়েছে'
                    : 'Report Received'}
                </Text>
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center mt-1">
                  {locale === 'bn'
                    ? 'আমাদের টিম এটি পর্যালোচনা করবে। ধন্যবাদ।'
                    : 'Thank you for helping keep PeaceTweet safe.'}
                </Text>
              </View>
            ) : (
              <View className="p-5">
                {/* Reason list - pulls sheet down if swiped */}
                <View {...bodyPanResponder.panHandlers}>
                  <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8] mb-3 select-none">
                    {locale === 'bn'
                      ? 'রিপোর্ট করার কারণ নির্বাচন করুন:'
                      : 'Please select a reason for reporting:'}
                  </Text>

                  {/* Reason options */}
                  <View className="gap-2 mb-4">
                    {REPORT_REASONS.map((r) => {
                      const isSelected = selectedReason === r.id;
                      return (
                        <Pressable
                          key={r.id}
                          onPress={() => setSelectedReason(r.id)}
                          style={{
                            borderColor: isSelected
                              ? '#1877f2'
                              : isDark
                                ? '#393a3b'
                                : '#e4e6eb',
                            backgroundColor: isSelected
                              ? isDark
                                ? 'rgba(24, 119, 242, 0.15)'
                                : '#f0f7ff'
                              : 'transparent',
                          }}
                          className="flex-row items-center justify-between p-3 rounded-xl border active:opacity-75">
                          <Text
                            className={`text-xs font-medium ${
                              isSelected
                                ? 'font-bold text-[#1877f2]'
                                : 'text-[#050505] dark:text-[#e4e6eb]'
                            }`}>
                            {locale === 'bn' ? r.labelBn : r.labelEn}
                          </Text>
                          <View
                            style={{
                              borderColor: isSelected
                                ? '#1877f2'
                                : isDark
                                  ? '#5a5b5c'
                                  : '#bcc0c4',
                            }}
                            className="h-4 w-4 rounded-full border items-center justify-center">
                            {isSelected && (
                              <View className="h-2 w-2 rounded-full bg-[#1877f2]" />
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Optional details input */}
                <TextInput
                  multiline
                  numberOfLines={2}
                  value={details}
                  onChangeText={setDetails}
                  placeholder={
                    locale === 'bn'
                      ? 'অতিরিক্ত বিবরণ লিখুন (ঐচ্ছিক)...'
                      : 'Additional details (optional)...'
                  }
                  placeholderTextColor="#8e8e93"
                  style={{
                    minHeight: 60,
                    textAlignVertical: 'top',
                    color: isDark ? '#e4e6eb' : '#050505',
                    fontSize: 12,
                  }}
                  className="w-full bg-[#f8f9fa] dark:bg-[#18191a] p-3 rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] mb-4"
                />

                {/* Action buttons */}
                <View className="flex-row items-center justify-end gap-2.5">
                  <Pressable
                    onPress={closeWithSlideDown}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 active:opacity-75">
                    <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {locale === 'bn' ? 'বাতিল' : 'Cancel'}
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={isSubmitting}
                    onPress={handleSubmit}
                    className="px-5 py-2 rounded-xl bg-rose-600 active:opacity-85 flex-row items-center gap-2">
                    {isSubmitting && (
                      <ActivityIndicator size="small" color="#ffffff" />
                    )}
                    <Text className="text-xs font-bold text-white">
                      {locale === 'bn' ? 'রিপোর্ট জমা দিন' : 'Submit Report'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
