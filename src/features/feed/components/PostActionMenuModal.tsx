import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  PanResponder,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';
import { FeedItem } from '../types/feed.types';

export interface PostActionMenuModalProps {
  visible: boolean;
  onClose: () => void;
  post: FeedItem;
  isAuthor: boolean;
  hasSaved: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSave: () => void;
  onCopyLink: () => void;
  onOpenShare: () => void;
  onMakePhotocard?: () => void;
  onReport: () => void;
}

export function PostActionMenuModal({
  visible,
  onClose,
  post,
  isAuthor,
  hasSaved,
  onEdit,
  onDelete,
  onToggleSave,
  onCopyLink,
  onOpenShare,
  onMakePhotocard,
  onReport,
}: PostActionMenuModalProps) {
  const { locale, theme } = useUi();
  const isDark = theme === 'dark';
  const { height: windowHeight } = useWindowDimensions();

  const isBloodPost =
    post?.type === 'BLOOD_REQUEST' ||
    Boolean(post?.bloodRequest) ||
    Boolean(post?.bloodRequestId);

  const isDuaPost =
    post?.type === 'DUA' ||
    Boolean(post?.dua) ||
    Boolean(post?.duaId);

  const fullHeight = windowHeight || 500;
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

  const closeWithSlideDown = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.timing(translateY, {
      toValue: fullHeight,
      duration: 180,
      useNativeDriver: false,
    }).start(() => {
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
        } else {
          translateY.setValue(0);
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

  const bodyPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        gs.dy > 6 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.1,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          translateY.setValue(gs.dy);
        } else {
          translateY.setValue(0);
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

  // Unified Black & White / Monochrome style helpers
  const iconBoxBg = isDark ? '#3a3b3c' : '#e6e9ef';
  const iconColor = isDark ? '#e4e6eb' : '#050505';

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="none"
      onRequestClose={closeWithSlideDown}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'transparent',
          justifyContent: 'flex-end',
        }}>
        {/* Pinned light black backdrop overlay */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            opacity: backdropOpacity,
          }}>
          <Pressable
            style={{ flex: 1, width: '100%', height: '100%' }}
            onPress={closeWithSlideDown}
          />
        </Animated.View>

        {/* Bottom Sheet Container */}
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
              backgroundColor: isDark ? '#242526' : '#ffffff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
              borderTopWidth: 1,
              borderColor: isDark ? '#393a3b' : '#e4e6eb',
              paddingBottom: Platform.OS === 'ios' ? 34 : 18,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: isDark ? 0.35 : 0.1,
              shadowRadius: 16,
              elevation: 20,
            }}>
            {/* Top Drag Bar Handle */}
            <View
              {...headerPanResponder.panHandlers}
              className="w-full items-center pt-3 pb-2 select-none"
              style={{ cursor: 'grab' as any }}>
              <Pressable
                onPress={closeWithSlideDown}
                className="w-full items-center py-1 active:opacity-75">
                <View
                  style={{
                    width: 44,
                    height: 5,
                    borderRadius: 999,
                    backgroundColor: isDark ? '#5a5b5c' : '#bcc0c4',
                  }}
                />
              </Pressable>
            </View>

            {/* Action List - Monochrome Black & White with larger typography */}
            <View {...bodyPanResponder.panHandlers} className="py-1 px-3">
              {/* 1. Make Photocard (First option at the very top as requested) */}
              {onMakePhotocard && (
                <Pressable
                  onPress={() => {
                    onClose();
                    onMakePhotocard();
                  }}
                  className="flex-row items-center gap-3.5 px-3 py-3 rounded-xl active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                  <View
                    style={{ backgroundColor: iconBoxBg }}
                    className="h-11 w-11 rounded-full items-center justify-center">
                    <AppIcon
                      android="photo_library"
                      ios="photo.on.rectangle"
                      size={21}
                      color={iconColor}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] leading-[22px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                      {locale === 'bn' ? 'ফটোকার্ড তৈরি করুন' : 'Make Photocard'}
                    </Text>
                    <Text className="text-[13.5px] leading-[18px] text-[#65676b] dark:text-[#b0b3b8]">
                      {locale === 'bn'
                        ? 'সোশ্যাল মিডিয়ায় শেয়ারের জন্য সুন্দর ভিন্টেজ কার্ড বানান'
                        : 'Create beautiful vintage card for social media'}
                    </Text>
                  </View>
                </Pressable>
              )}

              {/* 2. Edit Post (Author only) */}
              {isAuthor && (
                <Pressable
                  onPress={() => {
                    onClose();
                    onEdit();
                  }}
                  className="flex-row items-center gap-3.5 px-3 py-3 rounded-xl active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                  <View
                    style={{ backgroundColor: iconBoxBg }}
                    className="h-11 w-11 rounded-full items-center justify-center">
                    <AppIcon
                      android="edit"
                      ios="pencil"
                      size={21}
                      color={iconColor}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] leading-[22px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                      {isBloodPost
                        ? locale === 'bn'
                          ? 'রক্তের অনুরোধ সম্পাদনা করুন'
                          : 'Edit Blood Request'
                        : isDuaPost
                        ? locale === 'bn'
                          ? 'পবিত্র দু’আ সম্পাদনা করুন'
                          : 'Edit Dua Post'
                        : locale === 'bn'
                          ? 'পোস্ট সম্পাদনা করুন'
                          : 'Edit Post'}
                    </Text>
                    <Text className="text-[13.5px] leading-[18px] text-[#65676b] dark:text-[#b0b3b8]">
                      {isBloodPost
                        ? locale === 'bn'
                          ? 'রোগীর নাম, রক্তের গ্রুপ, হাসপাতাল ও বিবরণ পরিবর্তন করুন'
                          : 'Modify patient, hospital, and blood request details'
                        : isDuaPost
                        ? locale === 'bn'
                          ? 'দু’আর নাম, অর্থ, আরবি ও বিবরণ পরিবর্তন করুন'
                          : 'Modify Dua content, meaning and text'
                        : locale === 'bn'
                          ? 'পোস্টের বিবরণ, ছবি ও অনুভূতি পরিবর্তন করুন'
                          : 'Modify post text, photos and feeling'}
                    </Text>
                  </View>
                </Pressable>
              )}

              {/* 3. Save / Bookmark (Both) */}
              <Pressable
                onPress={() => {
                  onClose();
                  onToggleSave();
                }}
                className="flex-row items-center gap-3.5 px-3 py-3 rounded-xl active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                <View
                  style={{ backgroundColor: iconBoxBg }}
                  className="h-11 w-11 rounded-full items-center justify-center">
                  <AppIcon
                    android="bookmark"
                    ios={hasSaved ? 'bookmark.fill' : 'bookmark'}
                    size={21}
                    color={iconColor}
                    fill={hasSaved ? iconColor : 'none'}
                    filled={hasSaved}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] leading-[22px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {hasSaved
                      ? locale === 'bn'
                        ? 'সংরক্ষণ থেকে সরান'
                        : 'Remove from Saved'
                      : locale === 'bn'
                        ? 'পোস্ট সংরক্ষণ করুন'
                        : 'Save Post'}
                  </Text>
                  <Text className="text-[13.5px] leading-[18px] text-[#65676b] dark:text-[#b0b3b8]">
                    {hasSaved
                      ? locale === 'bn'
                        ? 'সংরক্ষিত তালিকা থেকে পোস্টটি মুছুন'
                        : 'Remove item from saved bookmarks'
                      : locale === 'bn'
                        ? 'পরবর্তীতে পড়ার জন্য টাইম-স্লটে রাখুন'
                        : 'Add to saved bookmarks with time-slot'}
                  </Text>
                </View>
              </Pressable>

              {/* 4. Copy Link (Both) */}
              <Pressable
                onPress={() => {
                  onClose();
                  onCopyLink();
                }}
                className="flex-row items-center gap-3.5 px-3 py-3 rounded-xl active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                <View
                  style={{ backgroundColor: iconBoxBg }}
                  className="h-11 w-11 rounded-full items-center justify-center">
                  <AppIcon
                    android="link"
                    ios="link"
                    size={21}
                    color={iconColor}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] leading-[22px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'পোস্টের লিংক কপি করুন' : 'Copy Link'}
                  </Text>
                  <Text className="text-[13.5px] leading-[18px] text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn'
                      ? 'ক্লিপবোর্ডে সরাসরি পোস্টের লিংক কপি করুন'
                      : 'Copy direct post URL to clipboard'}
                  </Text>
                </View>
              </Pressable>

              {/* 5. Social Media Share (Both) */}
              <Pressable
                onPress={() => {
                  onClose();
                  onOpenShare();
                }}
                className="flex-row items-center gap-3.5 px-3 py-3 rounded-xl active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                <View
                  style={{ backgroundColor: iconBoxBg }}
                  className="h-11 w-11 rounded-full items-center justify-center">
                  <AppIcon
                    android="share"
                    ios="square.and.arrow.up"
                    size={21}
                    color={iconColor}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] leading-[22px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn'
                      ? 'সোশ্যাল মিডিয়ায় শেয়ার করুন'
                      : 'Share via Social Apps'}
                  </Text>
                  <Text className="text-[13.5px] leading-[18px] text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn'
                      ? 'হোয়াটসঅ্যাপ, ফেসবুক, মেসেঞ্জার বা এক্স (টুইটার)'
                      : 'WhatsApp, Facebook, Messenger or X'}
                  </Text>
                </View>
              </Pressable>

              {/* 6. Delete Post (Author only) - Monochrome B&W */}
              {isAuthor && (
                <Pressable
                  onPress={() => {
                    onClose();
                    onDelete();
                  }}
                  className="flex-row items-center gap-3.5 px-3 py-3 rounded-xl active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                  <View
                    style={{ backgroundColor: iconBoxBg }}
                    className="h-11 w-11 rounded-full items-center justify-center">
                    <AppIcon
                      android="delete"
                      ios="trash"
                      size={21}
                      color={iconColor}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] leading-[22px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                      {locale === 'bn' ? 'পোস্ট মুছে ফেলুন' : 'Delete Post'}
                    </Text>
                    <Text className="text-[13.5px] leading-[18px] text-[#65676b] dark:text-[#b0b3b8]">
                      {locale === 'bn'
                        ? 'পোস্টটি স্থায়ীভাবে মুছে ফেলুন'
                        : 'Permanently remove this post'}
                    </Text>
                  </View>
                </Pressable>
              )}

              {/* 7. Report Post (Other's Post only) - Monochrome B&W */}
              {!isAuthor && (
                <Pressable
                  onPress={() => {
                    onClose();
                    onReport();
                  }}
                  className="flex-row items-center gap-3.5 px-3 py-3 rounded-xl active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                  <View
                    style={{ backgroundColor: iconBoxBg }}
                    className="h-11 w-11 rounded-full items-center justify-center">
                    <AppIcon
                      android="flag"
                      ios="flag"
                      size={21}
                      color={iconColor}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] leading-[22px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                      {locale === 'bn' ? 'পোস্ট রিপোর্ট করুন' : 'Report Post'}
                    </Text>
                    <Text className="text-[13.5px] leading-[18px] text-[#65676b] dark:text-[#b0b3b8]">
                      {locale === 'bn'
                        ? 'স্প্যাম, ভুল বা আপত্তিকর কনটেন্ট জানান'
                        : 'Notify admins of spam or inappropriate content'}
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
