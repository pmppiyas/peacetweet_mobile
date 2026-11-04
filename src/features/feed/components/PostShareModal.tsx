import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Share,
  Linking,
  Platform,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';
import { FeedItem } from '../types/feed.types';

export interface PostShareModalProps {
  visible: boolean;
  onClose: () => void;
  post: FeedItem;
}

export function PostShareModal({ visible, onClose, post }: PostShareModalProps) {
  const { locale, theme } = useUi();
  const isDark = theme === 'dark';
  const { height: windowHeight } = useWindowDimensions();
  const [copied, setCopied] = useState(false);

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

  // PanResponder for the top handle bar & header
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

  // PanResponder for the social buttons body
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

  const getCanonicalUrl = () => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/post/${post.id}`;
    }
    return `https://peacetweet.app/post/${post.id}`;
  };

  const handleCopyLink = async () => {
    const url = getCanonicalUrl();
    try {
      if (
        typeof navigator !== 'undefined' &&
        (navigator as any).clipboard?.writeText
      ) {
        await (navigator as any).clipboard.writeText(url);
      } else {
        await Share.share({ message: url, url });
      }
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // ignore
    }
  };

  const handleOpenUrl = async (url: string) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(url, '_blank');
      } else {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleWhatsApp = () => {
    const url = getCanonicalUrl();
    const text = post.content ? `${post.content}\n\n${url}` : url;
    handleOpenUrl(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
  };

  const handleFacebook = () => {
    const url = getCanonicalUrl();
    handleOpenUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
  };

  const handleMessenger = () => {
    const url = getCanonicalUrl();
    handleOpenUrl(
      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=1809358616902969&redirect_uri=${encodeURIComponent(url)}`
    );
  };

  const handleTwitter = () => {
    const url = getCanonicalUrl();
    const text = post.content ? `${post.content.slice(0, 100)}...` : '';
    handleOpenUrl(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    );
  };

  const handleNativeShare = async () => {
    const url = getCanonicalUrl();
    const message = post.content ? `${post.content}\n\n${url}` : url;
    try {
      await Share.share({
        title: 'PeaceTweet',
        message,
        url,
      });
    } catch {
      // ignore
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
              paddingBottom: Platform.OS === 'ios' ? 32 : 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: isDark ? 0.35 : 0.1,
              shadowRadius: 16,
              elevation: 20,
            }}>
            {/* Top Drag Bar Handle + Header */}
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
                  borderBottomColor: isDark ? '#393a3b' : '#f0f2f5',
                }}
                className="px-5 py-2.5 flex-row items-center justify-between">
                <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'পোস্ট শেয়ার করুন' : 'Share post'}
                </Text>
                <Pressable
                  onPress={closeWithSlideDown}
                  className="h-8 w-8 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] items-center justify-center active:opacity-70">
                  <AppIcon
                    android="close"
                    size={18}
                    color={isDark ? '#e4e6eb' : '#050505'}
                  />
                </Pressable>
              </View>
            </View>

            {/* Social Platforms Row */}
            <View {...bodyPanResponder.panHandlers} className="px-4 py-5">
              <View className="flex-row items-center justify-around flex-wrap gap-3">
                {/* 1. Copy Link */}
                <Pressable
                  onPress={handleCopyLink}
                  className="items-center gap-1.5 active:opacity-75">
                  <View
                    style={{
                      backgroundColor: copied
                        ? '#10b981'
                        : isDark
                          ? '#3a3b3c'
                          : '#f0f2f5',
                    }}
                    className="h-14 w-14 rounded-full items-center justify-center">
                    <AppIcon
                      android={copied ? 'check' : 'link'}
                      size={24}
                      color={copied ? '#ffffff' : isDark ? '#e4e6eb' : '#050505'}
                    />
                  </View>
                  <Text
                    className={`text-[11px] font-medium text-center ${
                      copied
                        ? 'text-emerald-600 font-bold'
                        : 'text-[#050505] dark:text-[#e4e6eb]'
                    }`}>
                    {copied
                      ? locale === 'bn'
                        ? 'কপি হয়েছে!'
                        : 'Copied!'
                      : locale === 'bn'
                        ? 'লিংক কপি'
                        : 'Copy link'}
                  </Text>
                </Pressable>

                {/* 2. WhatsApp */}
                <Pressable
                  onPress={handleWhatsApp}
                  className="items-center gap-1.5 active:opacity-75">
                  <View
                    style={{ backgroundColor: '#25D366' }}
                    className="h-14 w-14 rounded-full items-center justify-center shadow-sm">
                    <AppIcon android="chat" size={24} color="#ffffff" />
                  </View>
                  <Text className="text-[11px] font-medium text-center text-[#050505] dark:text-[#e4e6eb]">
                    WhatsApp
                  </Text>
                </Pressable>

                {/* 3. Facebook */}
                <Pressable
                  onPress={handleFacebook}
                  className="items-center gap-1.5 active:opacity-75">
                  <View
                    style={{ backgroundColor: '#1877F2' }}
                    className="h-14 w-14 rounded-full items-center justify-center shadow-sm">
                    <AppIcon android="public" size={24} color="#ffffff" />
                  </View>
                  <Text className="text-[11px] font-medium text-center text-[#050505] dark:text-[#e4e6eb]">
                    Facebook
                  </Text>
                </Pressable>

                {/* 4. Messenger */}
                <Pressable
                  onPress={handleMessenger}
                  className="items-center gap-1.5 active:opacity-75">
                  <View
                    style={{ backgroundColor: '#0084FF' }}
                    className="h-14 w-14 rounded-full items-center justify-center shadow-sm">
                    <AppIcon android="send" size={22} color="#ffffff" />
                  </View>
                  <Text className="text-[11px] font-medium text-center text-[#050505] dark:text-[#e4e6eb]">
                    Messenger
                  </Text>
                </Pressable>

                {/* 5. Twitter / X */}
                <Pressable
                  onPress={handleTwitter}
                  className="items-center gap-1.5 active:opacity-75">
                  <View
                    style={{ backgroundColor: isDark ? '#ffffff' : '#000000' }}
                    className="h-14 w-14 rounded-full items-center justify-center shadow-sm">
                    <Text
                      style={{ color: isDark ? '#000000' : '#ffffff' }}
                      className="font-black text-lg">
                      𝕏
                    </Text>
                  </View>
                  <Text className="text-[11px] font-medium text-center text-[#050505] dark:text-[#e4e6eb]">
                    Twitter / 𝕏
                  </Text>
                </Pressable>

                {/* 6. Device More Share */}
                <Pressable
                  onPress={handleNativeShare}
                  className="items-center gap-1.5 active:opacity-75">
                  <View
                    style={{ backgroundColor: isDark ? '#3a3b3c' : '#f0f2f5' }}
                    className="h-14 w-14 rounded-full items-center justify-center">
                    <AppIcon
                      android="share"
                      size={22}
                      color={isDark ? '#e4e6eb' : '#050505'}
                    />
                  </View>
                  <Text className="text-[11px] font-medium text-center text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'আরও' : 'More'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
