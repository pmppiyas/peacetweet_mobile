import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Animated,
  Easing,
  Platform,
  useWindowDimensions,
  Keyboard,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { searchApi } from '@/features/search/api/search.api';
import { AppIcon } from '@/components/ui/Icon';

function NineDotsIcon({ color }: { color: string }) {
  const dots = [0, 1, 2];
  return (
    <View className="w-[19px] h-[19px] justify-between">
      {dots.map((row) => (
        <View key={row} className="flex-row justify-between">
          {dots.map((col) => (
            <View
              key={col}
              style={{ backgroundColor: color }}
              className="w-[4.5px] h-[4.5px] rounded-full"
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const {
    locale,
    setMenuDrawerOpen,
    isSearchOpen,
    setSearchOpen,
    chatSearchQuery,
    setChatSearchQuery,
    activeConversationId,
    theme,
  } = useUi();
  const { isAuthenticated } = useAuth();

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<any>(null);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isMessagesActive =
    pathname === '/messages' || pathname.startsWith('/messages/');
  const isInsideActiveChat =
    isMessagesActive && Boolean(activeConversationId);

  const targetSearchWidth = width >= 640 ? 220 : 180;

  const lastSavedQueryRef = useRef<string>('');

  const saveCurrentQuery = (queryToSave?: string) => {
    const raw = queryToSave !== undefined ? queryToSave : chatSearchQuery;
    const trimmed = raw.trim();
    if (trimmed && !isMessagesActive) {
      if (lastSavedQueryRef.current.toLowerCase() !== trimmed.toLowerCase()) {
        lastSavedQueryRef.current = trimmed;
        searchApi
          .addSearchHistory({ query: trimmed, entityType: 'KEYWORD' })
          .catch(() => {});
      }
    }
  };

  const handleSearchSubmit = () => {
    saveCurrentQuery();
    Keyboard.dismiss();
  };

  const openSearchBar = () => {
    setIsSearchExpanded(true);
    setSearchOpen(true);
    Animated.timing(expandAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      inputRef.current?.focus();
    });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
  };

  const closeSearchBar = () => {
    saveCurrentQuery();
    setIsInputFocused(false);
    setChatSearchQuery('');
    lastSavedQueryRef.current = '';
    setSearchOpen(false);
    inputRef.current?.blur();
    Animated.timing(expandAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setIsSearchExpanded(false);
      }
    });
  };

  // Sync collapse when isSearchOpen is set to false externally (e.g. selecting a search result or tab)
  useEffect(() => {
    if (!isSearchOpen && isSearchExpanded) {
      setIsInputFocused(false);
      setChatSearchQuery('');
      inputRef.current?.blur();
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          setIsSearchExpanded(false);
        }
      });
    }
  }, [isSearchOpen]);

  // Collapse search bar on route change
  useEffect(() => {
    if (isSearchExpanded) {
      closeSearchBar();
    }
  }, [pathname]);

  if (isAuthPage || isInsideActiveChat) {
    return null;
  }

  const iconColor = theme === 'dark' ? '#e4e6eb' : '#050505';
  const mutedIconColor = theme === 'dark' ? '#b0b3b8' : '#65676b';

  const animatedWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, targetSearchWidth],
  });

  // Frontend outline matching: ring-1 ring-primary-500/20 focus:ring-2 focus:ring-primary-500/50
  const searchContainerOutlineStyle = isInputFocused
    ? Platform.OS === 'web'
      ? ({
          borderWidth: 0,
          boxShadow: '0 0 0 2px rgba(24, 119, 242, 0.5)',
        } as any)
      : {
          borderWidth: 2,
          borderColor: 'rgba(24, 119, 242, 0.5)',
        }
    : Platform.OS === 'web'
      ? ({
          borderWidth: 0,
          boxShadow: '0 0 0 1px rgba(24, 119, 242, 0.2)',
        } as any)
      : {
          borderWidth: 1,
          borderColor: 'rgba(24, 119, 242, 0.2)',
        };

  return (
    <View className="w-full h-14 border-b border-[#e4e6eb] bg-white dark:border-[#393a3b] dark:bg-[#242526] px-3 flex-row items-center justify-between">
      {/* Left: Brand Logo */}
      <Pressable
        onPress={() => {
          if (isSearchExpanded) {
            closeSearchBar();
            return;
          }
          if (pathname !== '/') {
            router.push('/');
          }
        }}
        className="flex-row items-center gap-2.5 shrink-0">
        <Text className="text-2xl sm:text-[27px] font-black tracking-tight text-primary-700 dark:text-white">
          PeaceTweet
        </Text>
      </Pressable>

      {/* Right: Animated Search (expands from right on click) + 9-Dots Menu */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 10,
        }}>
        {isSearchExpanded ? (
          <Animated.View
            style={[
              {
                position: 'relative',
                width: animatedWidth,
                height: 36,
                borderRadius: 9999,
                backgroundColor: theme === 'dark' ? '#3a3b3c' : '#f0f2f5',
                flexDirection: 'row',
                alignItems: 'center',
                overflow: 'hidden',
              },
              searchContainerOutlineStyle,
            ]}>
            {/* Left Search Icon (clickable button to trigger search submission) */}
            <Pressable
              onPress={handleSearchSubmit}
              hitSlop={6}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 34,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2,
              }}>
              <AppIcon
                android="search"
                ios="magnifyingglass"
                size={15}
                color={mutedIconColor}
              />
            </Pressable>

            {/* Input Field */}
            <TextInput
              ref={inputRef}
              value={chatSearchQuery}
              onChangeText={(text) => {
                setChatSearchQuery(text);
                if (!text.trim()) {
                  lastSavedQueryRef.current = '';
                }
              }}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => {
                setIsInputFocused(false);
                saveCurrentQuery();
              }}
              returnKeyType="search"
              onKeyPress={(e: any) => {
                if (e.nativeEvent?.key === 'Enter' || e.key === 'Enter') {
                  handleSearchSubmit();
                }
              }}
              onSubmitEditing={handleSearchSubmit}
              placeholder={
                isMessagesActive
                  ? locale === 'bn'
                    ? 'ফ্রেন্ড খুঁজুন...'
                    : 'Search friends...'
                  : locale === 'bn'
                    ? 'অনুসন্ধান করুন...'
                    : 'Search...'
              }
              placeholderTextColor={mutedIconColor}
              style={[
                {
                  flex: 1,
                  width: '100%',
                  height: '100%',
                  minWidth: 0,
                  paddingLeft: 34,
                  paddingRight: 30,
                  paddingVertical: 0,
                  fontSize: 13,
                  fontWeight: '600',
                  color: theme === 'dark' ? '#e4e6eb' : '#050505',
                },
                Platform.OS === 'web'
                  ? ({
                      outlineStyle: 'none',
                      outlineWidth: 0,
                    } as any)
                  : null,
              ]}
            />

            {/* Right Close (X) Button */}
            <Pressable
              onPress={() => {
                if (chatSearchQuery.length > 0) {
                  setChatSearchQuery('');
                  lastSavedQueryRef.current = '';
                  inputRef.current?.focus();
                } else {
                  closeSearchBar();
                }
              }}
              hitSlop={8}
              style={{
                position: 'absolute',
                right: 8,
                top: 0,
                bottom: 0,
                width: 22,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2,
              }}>
              <AppIcon
                android="close"
                ios="xmark"
                size={14}
                color={mutedIconColor}
              />
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable
            onPress={openSearchBar}
            className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] active:opacity-80">
            <AppIcon
              android="search"
              ios="magnifyingglass"
              size={22}
              weight="bold"
              color={iconColor}
            />
          </Pressable>
        )}

        <Pressable
          onPress={() => setMenuDrawerOpen(true)}
          className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] active:opacity-80">
          <NineDotsIcon color={iconColor} />
        </Pressable>
      </View>
    </View>
  );
}
