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
    unreadMessagesCount,
    setComposerModalOpen,
    postUploadType,
    theme,
  } = useUi();
  const { isAuthenticated } = useAuth();

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<any>(null);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPostViewerPage = pathname.startsWith('/post/');
  const isMessagesActive =
    pathname === '/messages' || pathname.startsWith('/messages/');
  const isBloodRoute = pathname === '/blood' || pathname.startsWith('/blood');
  const isInsideActiveChat = isMessagesActive && Boolean(activeConversationId);

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
      duration: 200,
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
      duration: 160,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setIsSearchExpanded(false);
      }
    });
  };

  // Sync collapse when isSearchOpen is set to false externally
  useEffect(() => {
    if (!isSearchOpen && isSearchExpanded) {
      setIsInputFocused(false);
      setChatSearchQuery('');
      inputRef.current?.blur();
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 160,
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

  if (isAuthPage || isPostViewerPage || isInsideActiveChat) {
    return null;
  }

  const iconColor = theme === 'dark' ? '#e4e6eb' : '#050505';
  const mutedIconColor = theme === 'dark' ? '#b0b3b8' : '#65676b';

  const isBloodContext =
    postUploadType === 'BLOOD' ||
    pathname === '/blood' ||
    pathname.startsWith('/blood') ||
    pathname.includes('blood');

  const handleCreatePress = () => {
    if (isBloodContext && (pathname === '/blood' || pathname.startsWith('/blood') || pathname.includes('blood'))) {
      router.replace({ pathname: '/blood', params: { tab: 'create' } } as any);
      return;
    }
    if (!isAuthenticated) {
      router.push('/create');
      return;
    }
    setComposerModalOpen(true);
  };

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
    <View className="w-full h-[60px] border-b border-[#e4e6eb] bg-white dark:border-[#393a3b] dark:bg-[#242526] px-3.5 flex-row items-center justify-between select-none">
      {isSearchExpanded ? (
        /* Full-Width Search Input View (Facebook mobile style) */
        <View className="flex-1 flex-row items-center gap-2">
          <Pressable
            onPress={closeSearchBar}
            hitSlop={8}
            accessibilityLabel="Close search"
            className="h-10 w-10 items-center justify-center rounded-full active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]"
          >
            <AppIcon android="arrow_back" ios="arrow.left" size={22} color={iconColor} />
          </Pressable>

          <View
            style={[
              {
                flex: 1,
                height: 40,
                borderRadius: 9999,
                backgroundColor: theme === 'dark' ? '#3a3b3c' : '#f0f2f5',
                flexDirection: 'row',
                alignItems: 'center',
                overflow: 'hidden',
                position: 'relative',
              },
              searchContainerOutlineStyle,
            ]}
          >
            <Pressable
              onPress={handleSearchSubmit}
              hitSlop={6}
              style={{
                position: 'absolute',
                left: 10,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              <AppIcon
                android="search"
                ios="magnifyingglass"
                size={18}
                color={mutedIconColor}
              />
            </Pressable>

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
                    ? 'PeaceTweet-এ খুঁজুন...'
                    : 'Search PeaceTweet...'
              }
              placeholderTextColor={mutedIconColor}
              style={[
                {
                  flex: 1,
                  width: '100%',
                  height: '100%',
                  paddingLeft: 36,
                  paddingRight: chatSearchQuery.length > 0 ? 36 : 14,
                  fontSize: 14,
                  fontWeight: '500',
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

            {chatSearchQuery.length > 0 && (
              <Pressable
                onPress={() => {
                  setChatSearchQuery('');
                  lastSavedQueryRef.current = '';
                  inputRef.current?.focus();
                }}
                hitSlop={8}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  zIndex: 2,
                }}
              >
                <AppIcon
                  android="close"
                  ios="xmark"
                  size={18}
                  color={mutedIconColor}
                />
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        /* Normal Facebook Mobile Top Bar */
        <>
          {/* Left: Hamburger Menu (☰) + Bold Brand Logo */}
          <View className="flex-row items-center gap-1.5 shrink-0">
            <Pressable
              onPress={() => setMenuDrawerOpen(true)}
              hitSlop={6}
              accessibilityLabel="Open menu drawer"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c] -ml-1"
            >
              <AppIcon
                android="menu"
                size={24}
                weight="bold"
                color={iconColor}
              />
            </Pressable>

            <Pressable
              onPress={() => {
                if (pathname !== '/') {
                  router.push('/');
                }
              }}
              className="flex-row items-center gap-1.5 select-none"
            >
              {isBloodRoute ? (
                <AppIcon android="water_drop" size={26} color="#e11d48" />
              ) : null}
              <Text
                selectable={false}
                className={`text-[28px] leading-none font-black tracking-[-0.7px] select-none ${
                  isBloodRoute
                    ? 'text-rose-600 dark:text-rose-500'
                    : 'text-[#1877f2] dark:text-[#2d88ff]'
                }`}
              >
                PeaceTweet
              </Text>
            </Pressable>
          </View>

          {/* Right: 3 Iconic Action Buttons (Create [+] + Search [🔍] + Messenger [💬]) */}
          <View className="flex-row items-center justify-end gap-2">
            {/* 1. Create / Add Post Button */}
            <Pressable
              onPress={handleCreatePress}
              hitSlop={4}
              accessibilityLabel="Create post"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] active:bg-[#e4e6eb] dark:active:bg-[#4e4f50]"
            >
              <AppIcon
                android="add_box"
                size={22}
                weight="bold"
                color={iconColor}
              />
            </Pressable>

            {/* 2. Search Button */}
            <Pressable
              onPress={openSearchBar}
              hitSlop={4}
              accessibilityLabel="Search"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] active:bg-[#e4e6eb] dark:active:bg-[#4e4f50]"
            >
              <AppIcon
                android="search"
                ios="magnifyingglass"
                size={21}
                weight="bold"
                color={iconColor}
              />
            </Pressable>

            {/* 3. Messenger / Messages Button with Red Badge */}
            <Pressable
              onPress={() => router.push('/messages')}
              hitSlop={4}
              accessibilityLabel="Messages"
              accessibilityRole="button"
              className="relative h-10 w-10 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] active:bg-[#e4e6eb] dark:active:bg-[#4e4f50]"
            >
              <AppIcon
                android="messenger"
                size={21}
                weight="bold"
                color={iconColor}
              />
              {unreadMessagesCount > 0 && (
                <View className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-[#e41e3f] items-center justify-center border-2 border-white dark:border-[#242526]">
                  <Text className="text-[10px] font-black text-white leading-none text-center">
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
