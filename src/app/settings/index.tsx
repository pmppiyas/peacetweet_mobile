import React, { useState } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { authApi } from '@/features/auth/api/auth.api';

export default function SettingsScreen() {
  const { locale, setLocale, theme, toggleTheme } = useUi();
  const { user, isAuthenticated, logout, setUser } = useAuth();

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

  const hasPassword = Boolean(user?.hasPassword !== false && !user?.needPasswordUpdate);

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

  const closePasswordModal = () => {
    if (isPasswordLoading) return;
    setIsPasswordModalOpen(false);
    setPasswordStatus(null);
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
        setIsPasswordModalOpen(false);
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

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      contentContainerStyle={{
        paddingHorizontal: 14,
        paddingTop: 16,
        paddingBottom: 36,
      }}
    >
      <View className="w-full max-w-[600px] mx-auto space-y-4">
        {/* Account Profile Card */}
        {isAuthenticated && user ? (
          <Pressable
            onPress={() => router.push('/profile')}
            className="w-full rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-4 shadow-xs flex-row items-center justify-between active:bg-[#f2f3f5] dark:active:bg-[#2d2e30]"
          >
            <View className="flex-row items-center gap-3.5 flex-1 pr-3">
              <UserAvatar
                avatarUrl={user.avatarUrl || (user as any).avatar}
                name={user.name}
                size="md"
              />
              <View className="flex-1 min-w-0">
                <Text
                  numberOfLines={1}
                  className="text-[16px] font-bold text-[#050505] dark:text-[#e4e6eb]"
                >
                  {user.name}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-[12.5px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5"
                >
                  @{user.username || 'user'} • {user.email}
                </Text>
                <Text className="text-[11.5px] font-semibold text-[#0866FF] dark:text-[#4599FF] mt-1">
                  {locale === 'bn' ? 'প্রোফাইল দেখুন' : 'View Profile'}
                </Text>
              </View>
            </View>

            <View className="h-8 w-8 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] items-center justify-center">
              <AppIcon
                android="chevron_right"
                size={18}
                color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
              />
            </View>
          </Pressable>
        ) : (
          <View className="w-full rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-4 shadow-xs flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[15px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'লগইন করা নেই' : 'Not signed in'}
              </Text>
              <Text className="text-[12px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                {locale === 'bn'
                  ? 'সব ফিচার ও সেটিংস ব্যবহার করতে লগইন করুন।'
                  : 'Sign in to access your account settings.'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/login')}
              className="px-4 py-2 rounded-xl bg-[#0866FF] active:scale-95"
            >
              <Text className="text-xs font-bold text-white">
                {locale === 'bn' ? 'লগইন' : 'Sign In'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Security & Login Section */}
        {isAuthenticated && user && (
          <View className="space-y-1.5">
            <Text className="text-[12px] font-bold text-[#65676b] dark:text-[#b0b3b8] uppercase tracking-wider px-1">
              {locale === 'bn' ? 'নিরাপত্তা ও অ্যাকাউন্ট' : 'Security & Login'}
            </Text>

            <View className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] shadow-xs overflow-hidden">
              <Pressable
                onPress={openPasswordModal}
                className="flex-row items-center justify-between p-3.5 active:bg-[#f2f3f5] dark:active:bg-[#2d2e30]"
              >
                <View className="flex-row items-center gap-3 flex-1 pr-3">
                  <View className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 items-center justify-center shrink-0">
                    <AppIcon android="lock" size={20} color="#0866FF" />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-[14.5px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                      {hasPassword
                        ? locale === 'bn'
                          ? 'পাসওয়ার্ড পরিবর্তন করুন'
                          : 'Change Password'
                        : locale === 'bn'
                          ? 'পাসওয়ার্ড সেট করুন'
                          : 'Set Password'}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="text-[11.5px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5"
                    >
                      {hasPassword
                        ? locale === 'bn'
                          ? 'অ্যাকাউন্টের সুরক্ষার জন্য পাসওয়ার্ড পরিবর্তন'
                          : 'Update your account password'
                        : locale === 'bn'
                          ? 'সরাসরি লগইনের জন্য নতুন পাসওয়ার্ড যুক্ত করুন'
                          : 'Add a password for direct sign in'}
                    </Text>
                  </View>
                </View>

                <View className="px-3 py-1.5 rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] flex-row items-center gap-1">
                  <Text className="text-[12px] font-semibold text-[#0866FF] dark:text-[#4599FF]">
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
                    size={14}
                    color={theme === 'dark' ? '#4599FF' : '#0866FF'}
                  />
                </View>
              </Pressable>
            </View>
          </View>
        )}

        {/* Display & Language Settings */}
        <View className="space-y-1.5">
          <Text className="text-[12px] font-bold text-[#65676b] dark:text-[#b0b3b8] uppercase tracking-wider px-1">
            {locale === 'bn' ? 'পছন্দসমূহ' : 'Preferences'}
          </Text>

          <View className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] shadow-xs overflow-hidden">
            {/* Theme switch */}
            <View className="flex-row items-center justify-between p-3.5 border-b border-[#f0f2f5] dark:border-[#393a3b]">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 items-center justify-center shrink-0">
                  <AppIcon
                    android={theme === 'dark' ? 'dark_mode' : 'light_mode'}
                    size={20}
                    color={theme === 'dark' ? '#38bdf8' : '#f59e0b'}
                  />
                </View>
                <View>
                  <Text className="text-[14px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'ডার্ক মোড' : 'Dark Mode'}
                  </Text>
                  <Text className="text-[11.5px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                    {theme === 'dark'
                      ? locale === 'bn'
                        ? 'ডার্ক থিম চালু আছে'
                        : 'Dark theme enabled'
                      : locale === 'bn'
                        ? 'লাইট থিম চালু আছে'
                        : 'Light theme enabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: '#d1d5db', true: '#0866FF' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Language selector */}
            <View className="flex-row items-center justify-between p-3.5">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 items-center justify-center shrink-0">
                  <AppIcon android="language" size={20} color="#2563eb" />
                </View>
                <View>
                  <Text className="text-[14px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'অ্যাপের ভাষা' : 'App Language'}
                  </Text>
                  <Text className="text-[11.5px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                    {locale === 'bn' ? 'বাংলা নির্বাচিত' : 'English selected'}
                  </Text>
                </View>
              </View>

              <View className="flex-row rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] p-1 border border-[#e4e6eb] dark:border-[#4a4b4d]">
                <Pressable
                  onPress={() => setLocale('bn')}
                  className={`px-3 py-1.5 rounded-lg active:scale-95 ${
                    locale === 'bn' ? 'bg-[#0866FF]' : ''
                  }`}
                >
                  <Text
                    className={`text-[12px] font-bold ${
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
                  className={`px-3 py-1.5 rounded-lg active:scale-95 ${
                    locale === 'en' ? 'bg-[#0866FF]' : ''
                  }`}
                >
                  <Text
                    className={`text-[12px] font-bold ${
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
        <View className="space-y-1.5">
          <Text className="text-[12px] font-bold text-[#65676b] dark:text-[#b0b3b8] uppercase tracking-wider px-1">
            {locale === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
          </Text>

          <View className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] shadow-xs overflow-hidden">
            <View className="flex-row items-center justify-between p-3.5 border-b border-[#f0f2f5] dark:border-[#393a3b]">
              <View className="flex-row items-center gap-3 flex-1 pr-3">
                <View className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 items-center justify-center shrink-0">
                  <AppIcon android="notifications" size={20} color="#9333ea" />
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'পুশ নোটিফিকেশন' : 'Push Notifications'}
                  </Text>
                  <Text className="text-[11.5px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                    {locale === 'bn'
                      ? 'নতুন মেসেজ এবং প্রয়োজনীয় আপডেট পান'
                      : 'Receive message alerts and activity updates'}
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

            <View className="flex-row items-center justify-between p-3.5">
              <View className="flex-row items-center gap-3 flex-1 pr-3">
                <View className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 items-center justify-center shrink-0">
                  <AppIcon android="water_drop" size={20} color="#e11d48" />
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'জরুরি রক্তদানের অ্যালার্ট' : 'Urgent Blood Alerts'}
                  </Text>
                  <Text className="text-[11.5px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                    {locale === 'bn'
                      ? 'আপনার এলাকার জরুরি রক্তের প্রয়োজন সম্পর্কে জানুন'
                      : 'Be notified of urgent blood requests in your region'}
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
            className="w-full rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#242526] p-3.5 flex-row items-center justify-center gap-2 active:bg-rose-50 dark:active:bg-rose-950/40 shadow-xs"
          >
            <AppIcon android="logout" size={18} color="#e11d48" />
            <Text className="text-[14px] font-bold text-rose-600 dark:text-rose-400">
              {locale === 'bn' ? 'লগআউট করুন' : 'Log Out'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Change Password Bottom Sheet / Modal */}
      <Modal
        visible={isPasswordModalOpen}
        transparent
        animationType="slide"
        onRequestClose={closePasswordModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <Pressable className="flex-1" onPress={closePasswordModal} />

          <View className="w-full max-w-[600px] mx-auto bg-white dark:bg-[#242526] rounded-t-3xl border-t border-[#e4e6eb] dark:border-[#393a3b] p-5 shadow-2xl space-y-4">
            {/* Modal Drag Indicator */}
            <View className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mx-auto -mt-1 mb-1" />

            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-2 border-b border-[#f0f2f5] dark:border-[#393a3b]">
              <View className="flex-row items-center gap-2.5">
                <View className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 items-center justify-center">
                  <AppIcon android="lock" size={18} color="#0866FF" />
                </View>
                <View>
                  <Text className="text-[16px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {hasPassword
                      ? locale === 'bn'
                        ? 'পাসওয়ার্ড পরিবর্তন করুন'
                        : 'Change Password'
                      : locale === 'bn'
                        ? 'পাসওয়ার্ড সেট করুন'
                        : 'Set Password'}
                  </Text>
                  <Text className="text-[11.5px] text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn'
                      ? 'অ্যাকাউন্টের সুরক্ষার জন্য পাসওয়ার্ড লিখুন'
                      : 'Enter passwords to update your account'}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={closePasswordModal}
                hitSlop={8}
                className="h-8 w-8 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] items-center justify-center"
              >
                <AppIcon
                  android="close"
                  ios="xmark"
                  size={16}
                  weight="bold"
                  color={theme === 'dark' ? '#e4e6eb' : '#050505'}
                />
              </Pressable>
            </View>

            {/* Current Password Field */}
            {hasPassword && (
              <View className="space-y-1.5">
                <Text className="text-[12.5px] font-semibold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
                </Text>
                <View className="flex-row items-center rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] border border-[#ced0d4] dark:border-[#4a4b4d] px-3.5 h-11">
                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPass}
                    placeholder={
                      locale === 'bn'
                        ? 'বর্তমান পাসওয়ার্ড লিখুন'
                        : 'Enter current password'
                    }
                    placeholderTextColor={
                      theme === 'dark' ? '#8a8d91' : '#8c9099'
                    }
                    className="flex-1 text-[13.5px] text-[#050505] dark:text-[#e4e6eb] h-full"
                    autoCapitalize="none"
                  />
                  <Pressable
                    hitSlop={8}
                    onPress={() => setShowCurrentPass(!showCurrentPass)}
                    className="pl-2"
                  >
                    <AppIcon
                      android={
                        showCurrentPass ? 'visibility_off' : 'visibility'
                      }
                      size={18}
                      color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
                    />
                  </Pressable>
                </View>
              </View>
            )}

            {/* New Password Field */}
            <View className="space-y-1.5">
              <Text className="text-[12.5px] font-semibold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
              </Text>
              <View className="flex-row items-center rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] border border-[#ced0d4] dark:border-[#4a4b4d] px-3.5 h-11">
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPass}
                  placeholder={
                    locale === 'bn'
                      ? 'কমপক্ষে ৬টি অক্ষর'
                      : 'At least 6 characters'
                  }
                  placeholderTextColor={
                    theme === 'dark' ? '#8a8d91' : '#8c9099'
                  }
                  className="flex-1 text-[13.5px] text-[#050505] dark:text-[#e4e6eb] h-full"
                  autoCapitalize="none"
                />
                <Pressable
                  hitSlop={8}
                  onPress={() => setShowNewPass(!showNewPass)}
                  className="pl-2"
                >
                  <AppIcon
                    android={showNewPass ? 'visibility_off' : 'visibility'}
                    size={18}
                    color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
                  />
                </Pressable>
              </View>
            </View>

            {/* Confirm New Password Field */}
            <View className="space-y-1.5">
              <Text className="text-[12.5px] font-semibold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn'
                  ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন'
                  : 'Confirm New Password'}
              </Text>
              <View className="flex-row items-center rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] border border-[#ced0d4] dark:border-[#4a4b4d] px-3.5 h-11">
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPass}
                  placeholder={
                    locale === 'bn'
                      ? 'নতুন পাসওয়ার্ড পুনরায় লিখুন'
                      : 'Re-enter new password'
                  }
                  placeholderTextColor={
                    theme === 'dark' ? '#8a8d91' : '#8c9099'
                  }
                  className="flex-1 text-[13.5px] text-[#050505] dark:text-[#e4e6eb] h-full"
                  autoCapitalize="none"
                />
                <Pressable
                  hitSlop={8}
                  onPress={() => setShowConfirmPass(!showConfirmPass)}
                  className="pl-2"
                >
                  <AppIcon
                    android={showConfirmPass ? 'visibility_off' : 'visibility'}
                    size={18}
                    color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
                  />
                </Pressable>
              </View>
            </View>

            {/* Status Message */}
            {passwordStatus && (
              <View
                className={`p-3 rounded-xl flex-row items-center gap-2.5 ${
                  passwordStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800'
                }`}
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
                  className={`text-[12.5px] font-medium flex-1 ${
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
            <View className="flex-row items-center gap-2.5 pt-1">
              <Pressable
                disabled={isPasswordLoading}
                onPress={closePasswordModal}
                className="flex-1 h-11 rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] items-center justify-center active:bg-[#e4e6eb] dark:active:bg-[#4a4b4d]"
              >
                <Text className="text-[13.5px] font-semibold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'বাতিল' : 'Cancel'}
                </Text>
              </Pressable>

              <Pressable
                disabled={isPasswordLoading}
                onPress={handlePasswordChange}
                className={`flex-1 h-11 rounded-xl items-center justify-center flex-row gap-2 active:scale-98 shadow-xs ${
                  isPasswordLoading ? 'bg-primary-400' : 'bg-[#0866FF]'
                }`}
              >
                {isPasswordLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <AppIcon android="lock" size={16} color="#ffffff" />
                    <Text className="text-[13.5px] font-bold text-white">
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
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}
