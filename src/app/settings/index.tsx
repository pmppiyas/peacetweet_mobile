import React, { useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
  useWindowDimensions,
  Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { authApi } from '@/features/auth/api/auth.api';
import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/navMetrics';

export default function SettingsScreen() {
  const { locale, setLocale, theme, toggleTheme } = useUi();
  const { user, isAuthenticated, logout, setUser } = useAuth();
  const isDark = theme === 'dark';

  // Notification toggles
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [bloodAlertsEnabled, setBloodAlertsEnabled] = useState(true);

  // Change Password Modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Bottom Sheet Gesture & Animation (matches PostActionMenuModal & ReportPostModal)
  const { height: windowHeight } = useWindowDimensions();
  const fullHeight = windowHeight || 650;
  const translateY = useRef(new Animated.Value(fullHeight)).current;
  const isClosingRef = useRef(false);

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, fullHeight],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (isPasswordModalOpen) {
      isClosingRef.current = false;
      translateY.setValue(fullHeight);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }).start();
    }
  }, [isPasswordModalOpen, fullHeight]);

  const closeWithSlideDown = () => {
    if (isClosingRef.current) return;
    if (isPasswordLoading) return;
    isClosingRef.current = true;
    Keyboard.dismiss();

    Animated.timing(translateY, {
      toValue: fullHeight,
      duration: 180,
      useNativeDriver: false,
    }).start(() => {
      setIsPasswordModalOpen(false);
      setPasswordStatus(null);
      isClosingRef.current = false;
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

  // Header / Handle PanResponder for dragging downward to dismiss
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

  // Body PanResponder for pulling down on non-input areas
  const bodyPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        gs.dy > 12 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.5,
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

  const hasPassword = Boolean(
    user?.hasPassword !== false && !user?.needPasswordUpdate
  );

  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPass(false);
    setShowNewPass(false);
    setShowConfirmPass(false);
    setPasswordStatus(null);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordChange = async () => {
    setPasswordStatus(null);

    if (hasPassword && !currentPassword.trim()) {
      setPasswordStatus({
        type: 'error',
        message:
          locale === 'bn'
            ? 'অনুগ্রহ করে বর্তমান পাসওয়ার্ড দিন।'
            : 'Please enter your current password.',
      });
      return;
    }

    if (!newPassword.trim()) {
      setPasswordStatus({
        type: 'error',
        message:
          locale === 'bn'
            ? 'অনুগ্রহ করে নতুন পাসওয়ার্ড দিন।'
            : 'Please enter a new password.',
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({
        type: 'error',
        message:
          locale === 'bn'
            ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
            : 'New password must be at least 6 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: 'error',
        message:
          locale === 'bn'
            ? 'নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মেলেনি।'
            : 'New password and confirmation do not match.',
      });
      return;
    }

    setIsPasswordLoading(true);

    try {
      const res = await authApi.changePassword({
        currentPassword: hasPassword ? currentPassword : undefined,
        newPassword,
      });

      if (user) {
        setUser({
          ...user,
          hasPassword: true,
          needPasswordUpdate: false,
        });
      }

      setPasswordStatus({
        type: 'success',
        message:
          res?.data?.message ||
          (hasPassword
            ? locale === 'bn'
              ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!'
              : 'Password changed successfully!'
            : locale === 'bn'
              ? 'পাসওয়ার্ড সফলভাবে যুক্ত করা হয়েছে!'
              : 'Password added successfully!'),
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        closeWithSlideDown();
      }, 1400);
    } catch (err: any) {
      const backendMessage =
        err?.response?.data?.message || err?.message || '';

      let userFacingMessage =
        locale === 'bn'
          ? 'পাসওয়ার্ড পরিবর্তনে ব্যর্থ হয়েছে। অনুগ্রহ করে বর্তমান পাসওয়ার্ড যাচাই করুন।'
          : 'Failed to change password. Please check your current password.';

      if (
        backendMessage.toLowerCase().includes('current password') ||
        backendMessage.toLowerCase().includes('not match')
      ) {
        userFacingMessage =
          locale === 'bn'
            ? 'বর্তমান পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে যাচাই করুন।'
            : 'Current password does not match.';
      } else if (backendMessage) {
        userFacingMessage = backendMessage;
      }

      setPasswordStatus({
        type: 'error',
        message: userFacingMessage,
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(
      locale === 'bn' ? 'লগআউট নিশ্চিতকরণ' : 'Confirm Logout',
      locale === 'bn'
        ? 'আপনি কি নিশ্চিতভাবে আপনার অ্যাকাউন্ট থেকে লগআউট করতে চান?'
        : 'Are you sure you want to log out of your account?',
      [
        {
          text: locale === 'bn' ? 'বাতিল' : 'Cancel',
          style: 'cancel',
        },
        {
          text: locale === 'bn' ? 'লগআউট' : 'Log Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const cardSurfaceStyle = {
    backgroundColor: isDark ? '#242526' : '#ffffff',
  };
  const rowDividerStyle = {
    borderBottomColor: isDark ? '#333436' : '#f0f2f5',
  };

  const passwordFields = [
    ...(hasPassword
      ? [
          {
            key: 'current',
            label: locale === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password',
            value: currentPassword,
            onChange: setCurrentPassword,
            visible: showCurrentPass,
            onToggleVisible: () => setShowCurrentPass((v) => !v),
            placeholder:
              locale === 'bn'
                ? 'বর্তমান পাসওয়ার্ড লিখুন'
                : 'Enter current password',
          },
        ]
      : []),
    {
      key: 'new',
      label: locale === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password',
      value: newPassword,
      onChange: setNewPassword,
      visible: showNewPass,
      onToggleVisible: () => setShowNewPass((v) => !v),
      placeholder:
        locale === 'bn' ? 'কমপক্ষে ৬টি অক্ষর' : 'At least 6 characters',
    },
    {
      key: 'confirm',
      label:
        locale === 'bn'
          ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন'
          : 'Confirm New Password',
      value: confirmPassword,
      onChange: setConfirmPassword,
      visible: showConfirmPass,
      onToggleVisible: () => setShowConfirmPass((v) => !v),
      placeholder:
        locale === 'bn'
          ? 'নতুন পাসওয়ার্ড পুনরায় লিখুন'
          : 'Re-enter new password',
    },
  ];

  return (
    <View className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]">
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: BOTTOM_NAV_CLEARANCE,
      }}
    >
      <View
        style={{ gap: 12 }}
        className="w-full max-w-[768px] mx-auto"
      >
        {/* Account Profile Card */}
        {isAuthenticated && user ? (
          <Pressable
            onPress={() => router.push('/profile')}
            style={cardSurfaceStyle}
            className="w-full px-3.5 py-4 flex-row items-center justify-between active:opacity-85"
          >
            <View className="flex-row items-center gap-3.5 flex-1 pr-2">
              <UserAvatar
                avatarUrl={user.avatarUrl || (user as any).avatar}
                name={user.name}
                size="md"
              />
              <View className="flex-1 min-w-0">
                <Text
                  numberOfLines={1}
                  className="text-[17px] font-bold text-[#050505] dark:text-[#e4e6eb] leading-tight"
                >
                  {user.name}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-[14px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5"
                >
                  @{user.username || 'user'} • {user.email}
                </Text>
              </View>
            </View>

            <View className="h-9 w-9 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] items-center justify-center">
              <AppIcon
                android="chevron_right"
                size={20}
                color={isDark ? '#b0b3b8' : '#65676b'}
              />
            </View>
          </Pressable>
        ) : (
          <View
            style={cardSurfaceStyle}
            className="w-full px-3.5 py-4 flex-row items-center justify-between"
          >
            <View className="flex-1 pr-3">
              <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'লগইন করা নেই' : 'Not signed in'}
              </Text>
              <Text className="text-[14px] text-[#65676b] dark:text-[#b0b3b8] mt-1">
                {locale === 'bn'
                  ? 'সব সেটিংস ব্যবহার করতে লগইন করুন।'
                  : 'Sign in to access your account settings.'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/login')}
              className="px-4 py-2.5 rounded-xl bg-[#0866FF] active:opacity-85"
            >
              <Text className="text-[14.5px] font-bold text-white">
                {locale === 'bn' ? 'লগইন' : 'Sign In'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Security & Login Section */}
        {isAuthenticated && user && (
          <View style={{ gap: 6 }}>
            <Text className="text-[14px] font-bold text-[#65676b] dark:text-[#b0b3b8] px-3.5">
              {locale === 'bn' ? 'নিরাপত্তা ও অ্যাকাউন্ট' : 'Security & Account'}
            </Text>

            <View style={cardSurfaceStyle} className="w-full overflow-hidden">
              <Pressable
                onPress={openPasswordModal}
                className="flex-row items-center justify-between px-3.5 py-3.5 active:opacity-85"
              >
                <View className="flex-row items-center gap-3 flex-1 pr-3">
                  <View className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 items-center justify-center shrink-0">
                    <AppIcon android="lock" size={20} color="#0866FF" />
                  </View>
                  <Text className="text-base font-semibold text-[#050505] dark:text-[#e4e6eb] flex-1">
                    {hasPassword
                      ? locale === 'bn'
                        ? 'পাসওয়ার্ড পরিবর্তন করুন'
                        : 'Change Password'
                      : locale === 'bn'
                        ? 'পাসওয়ার্ড সেট করুন'
                        : 'Set Password'}
                  </Text>
                </View>

                <View className="flex-row items-center gap-1">
                  <Text className="text-[14px] font-semibold text-[#0866FF] dark:text-[#4599FF]">
                    {hasPassword
                      ? locale === 'bn'
                        ? 'পরিবর্তন'
                        : 'Change'
                      : locale === 'bn'
                        ? 'যুক্ত করুন'
                        : 'Add'}
                  </Text>
                  <AppIcon
                    android="chevron_right"
                    size={18}
                    color={isDark ? '#4599FF' : '#0866FF'}
                  />
                </View>
              </Pressable>
            </View>
          </View>
        )}

        {/* Display & Language Settings */}
        <View style={{ gap: 6 }}>
          <Text className="text-[14px] font-bold text-[#65676b] dark:text-[#b0b3b8] px-3.5">
            {locale === 'bn' ? 'পছন্দসমূহ' : 'Preferences'}
          </Text>

          <View style={cardSurfaceStyle} className="w-full overflow-hidden">
            {/* Theme switch */}
            <View
              style={rowDividerStyle}
              className="flex-row items-center justify-between px-3.5 py-3.5 border-b"
            >
              <View className="flex-row items-center gap-3 flex-1 pr-3">
                <View className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 items-center justify-center shrink-0">
                  <AppIcon
                    android={theme === 'dark' ? 'dark_mode' : 'light_mode'}
                    size={20}
                    color={theme === 'dark' ? '#38bdf8' : '#f59e0b'}
                  />
                </View>
                <Text className="text-base font-semibold text-[#050505] dark:text-[#e4e6eb] flex-1">
                  {locale === 'bn' ? 'ডার্ক মোড' : 'Dark Mode'}
                </Text>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: '#d1d5db', true: '#0866FF' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Language selector */}
            <View className="flex-row items-center justify-between px-3.5 py-3.5">
              <View className="flex-row items-center gap-3 flex-1 pr-3">
                <View className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 items-center justify-center shrink-0">
                  <AppIcon android="language" size={20} color="#2563eb" />
                </View>
                <Text className="text-base font-semibold text-[#050505] dark:text-[#e4e6eb] flex-1">
                  {locale === 'bn' ? 'অ্যাপের ভাষা' : 'App Language'}
                </Text>
              </View>

              <View
                style={{
                  borderColor: isDark ? '#4a4b4d' : '#e4e6eb',
                }}
                className="flex-row rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] p-1 border"
              >
                <Pressable
                  onPress={() => setLocale('bn')}
                  className={`px-3.5 py-1.5 rounded-lg active:opacity-80 ${
                    locale === 'bn' ? 'bg-[#0866FF]' : ''
                  }`}
                >
                  <Text
                    className={`text-[14px] font-bold ${
                      locale === 'bn'
                        ? 'text-white'
                        : 'text-[#65676b] dark:text-[#b0b3b8]'
                    }`}
                  >
                    বাংলা
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setLocale('en')}
                  className={`px-3.5 py-1.5 rounded-lg active:opacity-80 ${
                    locale === 'en' ? 'bg-[#0866FF]' : ''
                  }`}
                >
                  <Text
                    className={`text-[14px] font-bold ${
                      locale === 'en'
                        ? 'text-white'
                        : 'text-[#65676b] dark:text-[#b0b3b8]'
                    }`}
                  >
                    English
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Notifications Settings */}
        <View style={{ gap: 6 }}>
          <Text className="text-[14px] font-bold text-[#65676b] dark:text-[#b0b3b8] px-3.5">
            {locale === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
          </Text>

          <View style={cardSurfaceStyle} className="w-full overflow-hidden">
            <View
              style={rowDividerStyle}
              className="flex-row items-center justify-between px-3.5 py-3.5 border-b"
            >
              <View className="flex-row items-center gap-3 flex-1 pr-3">
                <View className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 items-center justify-center shrink-0">
                  <AppIcon android="notifications" size={20} color="#9333ea" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-base font-semibold text-[#050505] dark:text-[#e4e6eb] leading-tight">
                    {locale === 'bn' ? 'পুশ নোটিফিকেশন' : 'Push Notifications'}
                  </Text>
                  <Text className="text-[13.5px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                    {locale === 'bn'
                      ? 'মেসেজ ও জরুরি আপডেট পান'
                      : 'Receive message alerts and updates'}
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: '#0866FF' }}
                thumbColor="#ffffff"
              />
            </View>

            <View className="flex-row items-center justify-between px-3.5 py-3.5">
              <View className="flex-row items-center gap-3 flex-1 pr-3">
                <View className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 items-center justify-center shrink-0">
                  <AppIcon android="water_drop" size={20} color="#e11d48" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-base font-semibold text-[#050505] dark:text-[#e4e6eb] leading-tight">
                    {locale === 'bn'
                      ? 'জরুরি রক্তদানের অ্যালার্ট'
                      : 'Urgent Blood Alerts'}
                  </Text>
                  <Text className="text-[13.5px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                    {locale === 'bn'
                      ? 'আপনার এলাকার রক্তের অনুরোধ জানুন'
                      : 'Alerts for urgent blood requests'}
                  </Text>
                </View>
              </View>
              <Switch
                value={bloodAlertsEnabled}
                onValueChange={setBloodAlertsEnabled}
                trackColor={{ false: '#d1d5db', true: '#e11d48' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Logout button */}
        {isAuthenticated && (
          <Pressable
            onPress={handleLogoutPress}
            style={cardSurfaceStyle}
            className="w-full px-3.5 py-4 flex-row items-center justify-center gap-2.5 active:opacity-85"
          >
            <AppIcon android="logout" size={20} color="#e11d48" />
            <Text className="text-base font-bold text-rose-600 dark:text-rose-400">
              {locale === 'bn' ? 'লগআউট করুন' : 'Log Out'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Change Password Bottom Sheet Modal (Styled to match PostActionMenuModal & ReportPostModal) */}
      <Modal
        visible={isPasswordModalOpen}
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        animationType="none"
        onRequestClose={closeWithSlideDown}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            justifyContent: 'flex-end',
          }}
        >
          {/* Pinned light black backdrop overlay (fades in/out, does NOT slide from bottom) */}
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              opacity: backdropOpacity,
            }}
          >
            <Pressable
              style={{ flex: 1, width: '100%', height: '100%' }}
              onPress={closeWithSlideDown}
            />
          </Animated.View>

          {/* Bottom Sheet Container */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            pointerEvents="box-none"
          >
            <Animated.View
              style={{
                width: '100%',
                maxWidth: 640,
                alignSelf: 'center',
                transform: [{ translateY }],
              }}
            >
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
                  borderColor: isDark ? '#393a3b' : '#d9dde4',
                  paddingBottom: Platform.OS === 'ios' ? 32 : 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: isDark ? 0.35 : 0.1,
                  shadowRadius: 16,
                  elevation: 20,
                }}
              >
                {/* 1. Top Drag Handle & Header (Draggable downward) */}
                <View
                  {...headerPanResponder.panHandlers}
                  className="w-full select-none"
                  style={{ cursor: 'grab' as any }}
                >
                  <Pressable
                    onPress={closeWithSlideDown}
                    className="w-full items-center pt-3 pb-1.5 active:opacity-75"
                  >
                    <View
                      style={{
                        width: 44,
                        height: 5,
                        borderRadius: 999,
                        backgroundColor: isDark ? '#5a5b5c' : '#bcc0c4',
                      }}
                    />
                  </Pressable>

                  {/* Header Title + Close Button */}
                  <View
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? '#393a3b' : '#e6e9ef',
                    }}
                    className="px-5 py-3 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 items-center justify-center">
                        <AppIcon android="lock" size={18} color="#0866FF" />
                      </View>
                      <Text className="text-[17px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                        {hasPassword
                          ? locale === 'bn'
                            ? 'পাসওয়ার্ড পরিবর্তন করুন'
                            : 'Change Password'
                          : locale === 'bn'
                            ? 'পাসওয়ার্ড সেট করুন'
                            : 'Set Password'}
                      </Text>
                    </View>

                    <Pressable
                      onPress={closeWithSlideDown}
                      hitSlop={8}
                      className="h-8 w-8 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] items-center justify-center active:opacity-70"
                    >
                      <AppIcon
                        android="close"
                        ios="xmark"
                        size={16}
                        weight="bold"
                        color={isDark ? '#e4e6eb' : '#050505'}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* 2. Form Body (Pullable downward) */}
                <View {...bodyPanResponder.panHandlers} className="px-4 py-5">

            <View style={{ gap: 14 }}>
              {passwordFields.map((field) => (
                <View key={field.key} style={{ gap: 6 }}>
                  <Text className="text-[14.5px] font-semibold text-[#050505] dark:text-[#e4e6eb]">
                    {field.label}
                  </Text>
                  <View
                    style={{
                      backgroundColor: isDark ? '#3a3b3c' : '#f0f2f5',
                      borderColor: isDark ? '#4e5052' : '#d8dadf',
                    }}
                    className="flex-row items-center rounded-2xl border px-3.5 h-12"
                  >
                    <TextInput
                      value={field.value}
                      onChangeText={field.onChange}
                      secureTextEntry={!field.visible}
                      placeholder={field.placeholder}
                      placeholderTextColor={isDark ? '#8a8d91' : '#8c9099'}
                      className="flex-1 text-base text-[#050505] dark:text-[#e4e6eb] h-full"
                      autoCapitalize="none"
                    />
                    <Pressable
                      hitSlop={10}
                      onPress={field.onToggleVisible}
                      className="pl-2"
                    >
                      <AppIcon
                        android={field.visible ? 'visibility_off' : 'visibility'}
                        size={19}
                        color={isDark ? '#b0b3b8' : '#65676b'}
                      />
                    </Pressable>
                  </View>
                </View>
              ))}

              {/* Status Message */}
              {passwordStatus && (
                <View
                  style={{
                    backgroundColor:
                      passwordStatus.type === 'success'
                        ? isDark
                          ? 'rgba(5, 150, 105, 0.16)'
                          : '#ecfdf5'
                        : isDark
                          ? 'rgba(225, 29, 72, 0.16)'
                          : '#fff1f2',
                    borderColor:
                      passwordStatus.type === 'success'
                        ? isDark
                          ? 'rgba(16, 185, 129, 0.35)'
                          : '#a7f3d0'
                        : isDark
                          ? 'rgba(244, 63, 94, 0.35)'
                          : '#fecdd3',
                  }}
                  className="p-3.5 rounded-xl border flex-row items-center gap-2.5"
                >
                  <AppIcon
                    android={
                      passwordStatus.type === 'success'
                        ? 'check_circle'
                        : 'error_outline'
                    }
                    size={18}
                    color={
                      passwordStatus.type === 'success' ? '#059669' : '#e11d48'
                    }
                  />
                  <Text
                    className={`text-[14.5px] font-medium flex-1 ${
                      passwordStatus.type === 'success'
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {passwordStatus.message}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View className="flex-row items-center gap-3 pt-2">
                <Pressable
                  disabled={isPasswordLoading}
                  onPress={closeWithSlideDown}
                  className="flex-1 h-12 rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] items-center justify-center active:opacity-80"
                >
                  <Text className="text-[15px] font-semibold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'বাতিল' : 'Cancel'}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={isPasswordLoading}
                  onPress={handlePasswordChange}
                  className={`flex-1 h-12 rounded-xl items-center justify-center flex-row gap-2 active:opacity-85 ${
                    isPasswordLoading ? 'bg-primary-400' : 'bg-[#0866FF]'
                  }`}
                >
                  {isPasswordLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <AppIcon android="lock" size={17} color="#ffffff" />
                      <Text className="text-[15px] font-bold text-white">
                        {hasPassword
                          ? locale === 'bn'
                            ? 'সংরক্ষণ করুন'
                            : 'Save'
                          : locale === 'bn'
                            ? 'সেট করুন'
                            : 'Set'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  </View>
</Modal>
    </ScrollView>
    </View>
  );
}
