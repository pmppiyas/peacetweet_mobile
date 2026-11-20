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
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import {
  POST_BACKGROUNDS,
  PostBackgroundOption,
} from '@/features/feed/constants/postBackgrounds';
import { PostBackgroundView } from '@/features/feed/components/PostBackgroundView';

export interface ComposerBackgroundSheetModalProps {
  visible: boolean;
  onClose: () => void;
  selectedBackground: PostBackgroundOption | null;
  onSelectBackground: (bg: PostBackgroundOption | null) => void;
  theme?: 'light' | 'dark';
  locale?: string;
}

export function ComposerBackgroundSheetModal({
  visible,
  onClose,
  selectedBackground,
  onSelectBackground,
  theme = 'light',
  locale = 'bn',
}: ComposerBackgroundSheetModalProps) {
  const isDark = theme === 'dark';
  const { height: windowHeight } = useWindowDimensions();

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

  const closeWithSlideDown = (onComplete?: () => void) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.timing(translateY, {
      toValue: fullHeight,
      duration: 180,
      useNativeDriver: false,
    }).start(() => {
      onClose();
      onComplete?.();
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
        if (gs.dy > 50 || gs.vy > 0.35) {
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

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="none"
      onRequestClose={() => closeWithSlideDown()}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'transparent',
          justifyContent: 'flex-end',
        }}>
        {/* Backdrop overlay */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            opacity: backdropOpacity,
          }}>
          <Pressable
            style={{ flex: 1, width: '100%', height: '100%' }}
            onPress={() => closeWithSlideDown()}
          />
        </Animated.View>

        {/* Bottom Sheet Slice */}
        <Animated.View
          style={{
            width: '100%',
            maxWidth: 600,
            alignSelf: 'center',
            transform: [{ translateY }],
          }}>
          <View
            style={{
              width: '100%',
              backgroundColor: isDark ? '#242526' : '#ffffff',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              overflow: 'hidden',
              borderTopWidth: 1,
              borderColor: isDark ? '#393a3b' : '#e4e6eb',
              paddingBottom: Platform.OS === 'ios' ? 34 : 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: isDark ? 0.4 : 0.15,
              shadowRadius: 18,
              elevation: 24,
            }}>
            {/* Drag Bar Handle */}
            <View
              {...headerPanResponder.panHandlers}
              className="w-full items-center pt-3 pb-1 select-none"
              style={{ cursor: 'grab' as any }}>
              <Pressable
                onPress={() => closeWithSlideDown()}
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

            {/* Sheet Title & Close Row */}
            <View className="flex-row items-center justify-between px-4 pb-3 pt-1 border-b border-[#e4e6eb] dark:border-[#393a3b]">
              <View className="flex-row items-center gap-2">
                <View className="h-7 w-7 rounded-full items-center justify-center bg-purple-100 dark:bg-purple-950/60">
                  <View className="h-4 w-4 rounded-full items-center justify-center bg-[#8b5cf6]">
                    <Text className="text-[10px] font-black text-white leading-none">Aa</Text>
                  </View>
                </View>
                <View>
                  <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'পোস্ট ব্যাকগ্রাউন্ড স্টাইল' : 'Post Background Style'}
                  </Text>
                  <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn'
                      ? 'পছন্দের স্টাইলটি নির্বাচন করুন'
                      : 'Choose a background style for your post'}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => closeWithSlideDown()}
                className="h-8 w-8 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] active:scale-95"
                accessibilityLabel="Close">
                <AppIcon
                  android="close"
                  ios="xmark"
                  size={16}
                  color={isDark ? '#e4e6eb' : '#050505'}
                />
              </Pressable>
            </View>

            {/* Backgrounds 4-Column Grid */}
            <ScrollView
              style={{ maxHeight: 380 }}
              contentContainerStyle={{ padding: 14 }}
              showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap gap-2.5 justify-start">
                {POST_BACKGROUNDS.map((bg) => {
                  const isSelected =
                    (!selectedBackground && bg.id === 'none') ||
                    selectedBackground?.id === bg.id;

                  return (
                    <Pressable
                      key={bg.id}
                      onPress={() => {
                        if (bg.type === 'none') {
                          onSelectBackground(null);
                        } else {
                          onSelectBackground(bg);
                        }
                      }}
                      className="items-center"
                      style={{
                        width: '22.8%',
                        marginBottom: 6,
                        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
                      } as any}>
                      {/* Thumbnail Box */}
                      <View
                        style={{
                          width: '100%',
                          aspectRatio: 1,
                          borderRadius: 16,
                          overflow: 'hidden',
                          borderWidth: isSelected ? 3 : bg.type === 'none' ? 1.5 : 0,
                          borderColor: isSelected
                            ? '#0866FF'
                            : isDark
                            ? '#3e4146'
                            : '#d0d5dd',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: bg.thumbBg,
                          transform: [{ scale: isSelected ? 1.04 : 1 }],
                          position: 'relative',
                        }}>
                        {bg.type === 'none' ? (
                          <View className="items-center justify-center gap-1">
                            <AppIcon
                              android="block"
                              ios="nosign"
                              size={22}
                              color={isDark ? '#8e8e93' : '#65676b'}
                            />
                          </View>
                        ) : bg.type === 'image' && bg.thumbImage ? (
                          <Image
                            source={bg.thumbImage}
                            style={StyleSheet.absoluteFill}
                            resizeMode="cover"
                          />
                        ) : bg.type === 'gradient' && bg.gradientColors ? (
                          <PostBackgroundView background={bg} />
                        ) : null}

                        {/* Selected Checkmark Badge */}
                        {isSelected && (
                          <View className="absolute top-1 right-1 h-5 w-5 rounded-full bg-[#0866FF] items-center justify-center shadow-xs">
                            <AppIcon
                              android="check"
                              ios="checkmark"
                              size={12}
                              color="#ffffff"
                            />
                          </View>
                        )}
                      </View>

                      {/* Name Label */}
                      <Text
                        numberOfLines={1}
                        className={`text-[11px] mt-1.5 text-center truncate ${
                          isSelected
                            ? 'font-bold text-[#0866FF] dark:text-[#36a4fa]'
                            : 'font-semibold text-[#050505] dark:text-[#e4e6eb]'
                        }`}>
                        {locale === 'bn' ? bg.nameBn : bg.nameEn}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Bottom Done Action Button */}
            <View className="px-4 pt-2">
              <Pressable
                onPress={() => closeWithSlideDown()}
                className="w-full py-2.5 rounded-2xl bg-[#0866FF] items-center justify-center active:scale-95 shadow-md shadow-blue-500/20">
                <Text className="text-white text-sm font-bold">
                  {locale === 'bn' ? 'ঠিক আছে' : 'Done'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
