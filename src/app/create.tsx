import React from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useUi } from '@/providers/UiProvider';
import { AuthPromptScreen } from '@/components/ui/AuthPromptCard';

export default function CreatePostScreen() {
  const { isAuthenticated } = useAuth();
  const { locale } = useUi();

  if (!isAuthenticated) {
    return (
      <AuthPromptScreen
        icon="add_circle"
        iconBgColor="bg-primary-50 dark:bg-primary-950/60"
        iconColor="#1877f2"
        titleBn="নতুন পোস্ট তৈরি করতে লগইন করুন"
        titleEn="Sign in to create a Post"
        descriptionBn="কমিউনিটির সাথে দোয়া, হাদিস ও সুন্দর বার্তা শেয়ার করতে আপনার অ্যাকাউন্টে লগইন করুন।"
        descriptionEn="Log in to share Duas, reminders, reflections, and inspire the community."
      />
    );
  }

  return (
    <View className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a] px-1.5 pt-3">
      <View className="bg-white dark:bg-[#242526] rounded-2xl p-4 border border-[#e4e6eb] dark:border-[#393a3b]">
        <Text className="text-lg font-bold text-[#050505] dark:text-[#e4e6eb] mb-2">
          {locale === 'bn' ? 'নতুন দোয়া বা রিমাইন্ডার শেয়ার করুন' : 'Share a Dua or Reminder'}
        </Text>
        <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
          {locale === 'bn'
            ? 'এখানে ব্যাকএন্ড এপিআই কানেক্ট করে নতুন পোস্ট সাবমিট করা যাবে।'
            : 'Form to submit new posts and reminders directly to the community feed.'}
        </Text>
      </View>
    </View>
  );
}
