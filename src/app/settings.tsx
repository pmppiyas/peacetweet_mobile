import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, Switch } from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';

export default function SettingsScreen() {
  const { locale, setLocale, theme, toggleTheme } = useUi();
  const { user, isAuthenticated, logout } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [bloodAlertsEnabled, setBloodAlertsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20 }}>
      <View className="w-full max-w-[768px] mx-auto space-y-4">
        {/* Hero Card */}
        <View className="w-full rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-5 shadow-xs items-center text-center">
          <View className="h-14 w-14 rounded-2xl bg-gray-100 dark:bg-gray-800 items-center justify-center mb-3">
            <AppIcon android="settings" size={28} color="#4b5563" />
          </View>
          <Text className="text-xl font-extrabold text-[#050505] dark:text-[#e4e6eb] text-center mb-1">
            {locale === 'bn' ? 'সেটিংস ও পছন্দসমূহ' : 'Settings & Preferences'}
          </Text>
          <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center max-w-lg leading-relaxed">
            {locale === 'bn'
              ? 'থিম, ভাষা, নোটিফিকেশন অ্যালার্ট ও অ্যাকাউন্ট সম্পর্কিত সেটিংস নিয়ন্ত্রণ করুন।'
              : 'Customize your theme, language, notifications, and account settings.'}
          </Text>
        </View>

        {/* Account Summary Card */}
        {isAuthenticated && user ? (
          <View className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-4 shadow-xs">
            <Text className="text-xs font-bold text-[#65676b] dark:text-[#b0b3b8] uppercase tracking-wider mb-3">
              {locale === 'bn' ? 'অ্যাকাউন্ট প্রোফাইল' : 'Account Profile'}
            </Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 rounded-full bg-primary-500 items-center justify-center">
                  <Text className="text-white text-lg font-black">
                    {user.name?.charAt(0)?.toUpperCase() || 'P'}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {user.name}
                  </Text>
                  <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                    @{user.username || 'user'} • {user.email}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => router.push('/profile')}
                className="px-3 py-1.5 rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] border border-[#ced0d4] dark:border-[#4a4b4d]">
                <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'প্রোফাইল' : 'Profile'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-4 shadow-xs flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'লগইন করা নেই' : 'Not signed in'}
              </Text>
              <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn'
                  ? 'সব ফিচার ও ব্যক্তিগত সেটিংস ব্যবহার করতে লগইন করুন।'
                  : 'Sign in to sync your saved items and account settings.'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/login')}
              className="px-4 py-2 rounded-xl bg-primary-500">
              <Text className="text-xs font-bold text-white">
                {locale === 'bn' ? 'লগইন' : 'Sign In'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Display & Language Settings */}
        <View className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-4 shadow-xs space-y-3">
          <Text className="text-xs font-bold text-[#65676b] dark:text-[#b0b3b8] uppercase tracking-wider">
            {locale === 'bn' ? 'ডিসপ্লে ও ভাষা' : 'Display & Language'}
          </Text>

          {/* Theme switch */}
          <View className="flex-row items-center justify-between py-2 border-b border-[#f0f2f5] dark:border-[#393a3b]">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 items-center justify-center">
                <AppIcon
                  android={theme === 'dark' ? 'dark_mode' : 'light_mode'}
                  size={18}
                  color={theme === 'dark' ? '#38bdf8' : '#f59e0b'}
                />
              </View>
              <View>
                <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'ডার্ক মোড' : 'Dark Mode'}
                </Text>
                <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                  {theme === 'dark'
                    ? locale === 'bn'
                      ? 'ডার্ক থিম সক্রিয়'
                      : 'Dark theme enabled'
                    : locale === 'bn'
                      ? 'লাইট থিম সক্রিয়'
                      : 'Light theme enabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={theme === 'dark' ? '#ffffff' : '#ffffff'}
            />
          </View>

          {/* Language selector */}
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 items-center justify-center">
                <AppIcon android="language" size={18} color="#2563eb" />
              </View>
              <View>
                <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'অ্যাপের ভাষা' : 'App Language'}
                </Text>
                <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                  {locale === 'bn' ? 'বাংলা নির্বাচিত' : 'English selected'}
                </Text>
              </View>
            </View>

            <View className="flex-row rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] p-1">
              <Pressable
                onPress={() => setLocale('bn')}
                className={`px-3 py-1 rounded-lg ${
                  locale === 'bn' ? 'bg-primary-500' : ''
                }`}>
                <Text
                  className={`text-xs font-bold ${
                    locale === 'bn' ? 'text-white' : 'text-[#65676b] dark:text-[#b0b3b8]'
                  }`}>
                  বাংলা
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setLocale('en')}
                className={`px-3 py-1 rounded-lg ${
                  locale === 'en' ? 'bg-primary-500' : ''
                }`}>
                <Text
                  className={`text-xs font-bold ${
                    locale === 'en' ? 'text-white' : 'text-[#65676b] dark:text-[#b0b3b8]'
                  }`}>
                  English
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Notifications Settings */}
        <View className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-4 shadow-xs space-y-3">
          <Text className="text-xs font-bold text-[#65676b] dark:text-[#b0b3b8] uppercase tracking-wider">
            {locale === 'bn' ? 'নোটিফিকেশন ও অ্যালার্ট' : 'Notifications'}
          </Text>

          <View className="flex-row items-center justify-between py-2 border-b border-[#f0f2f5] dark:border-[#393a3b]">
            <View>
              <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'পুশ নোটিফিকেশন' : 'Push Notifications'}
              </Text>
              <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn'
                  ? 'নতুন মেসেজ এবং প্রয়োজনীয় আপডেট পান'
                  : 'Receive message alerts and activity updates'}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            />
          </View>

          <View className="flex-row items-center justify-between py-2">
            <View>
              <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'জরুরি রক্তদানের অ্যালার্ট' : 'Urgent Blood Alerts'}
              </Text>
              <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn'
                  ? 'আপনার এলাকার জরুরি রক্তের প্রয়োজন সম্পর্কে অবহিত হোন'
                  : 'Be notified of urgent blood requests in your region'}
              </Text>
            </View>
            <Switch
              value={bloodAlertsEnabled}
              onValueChange={setBloodAlertsEnabled}
              trackColor={{ false: '#d1d5db', true: '#e11d48' }}
            />
          </View>
        </View>

        {/* Logout button */}
        {isAuthenticated && (
          <Pressable
            onPress={logout}
            className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3.5 flex-row items-center justify-center gap-2">
            <AppIcon android="logout" size={18} color="#e11d48" />
            <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {locale === 'bn' ? 'লগআউট করুন' : 'Log Out'}
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
