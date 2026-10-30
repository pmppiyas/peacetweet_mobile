import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  Linking,
} from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';

export default function FeedbackScreen() {
  const { locale } = useUi();
  const { user } = useAuth();

  const [category, setCategory] = useState<'SUGGESTION' | 'BUG' | 'CONTENT' | 'OTHER'>('SUGGESTION');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!message.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setMessage('');
      setSubject('');
      setSubmitted(false);
    }, 3000);
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:connect.peacetweet@gmail.com').catch(() => {});
  };

  const faqs = [
    {
      qBn: 'আমার মতামত কি সত্যিই কোনো পরিবর্তন আনবে?',
      qEn: 'Will my feedback make a difference?',
      aBn: 'অবশ্যই! PeaceTweet সম্পূর্ণভাবে একটি কমিউনিটি-ভিত্তিক প্ল্যাটফর্ম। ব্যবহারকারীদের গঠনমূলক পরামর্শ অনুযায়ী আমরা নিয়মিত নতুন ফিচার ও প্রয়োজনীয় পরিবর্তন আনি।',
      aEn: 'Absolutely! PeaceTweet is built for and shaped by its community. Every feedback directly influences our feature roadmap.',
    },
    {
      qBn: 'ভুল দোয়া বা কনটেন্ট দেখতে পেলে করণীয় কী?',
      qEn: 'What should I do if I find an incorrect Dua or post?',
      aBn: 'ফর্মের "কনটেন্ট অভিযোগ" অপশন সিলেক্ট করে সংশ্লিষ্ট পোস্টের লিংক বা কারণ উল্লেখ করে পাঠান। আমাদের টিম তা যাচাই করে প্রয়োজনীয় ব্যবস্থা নেবে।',
      aEn: 'Select the "Content Violation" category and submit details. Our verification team will review and rectify immediately.',
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20 }}>
      <View className="w-full max-w-[768px] mx-auto space-y-4">
        {/* Hero Card */}
        <View className="w-full rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-5 shadow-xs items-center text-center">
          <View className="h-14 w-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 items-center justify-center mb-3">
            <AppIcon android="feedback" size={28} color="#0d9488" />
          </View>

          <Text className="text-xl font-extrabold text-[#050505] dark:text-[#e4e6eb] text-center mb-1">
            {locale === 'bn' ? 'পরামর্শ ও অভিযোগ' : 'Feedback & Report'}
          </Text>

          <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center max-w-lg leading-relaxed">
            {locale === 'bn'
              ? 'PeaceTweet-কে আরও সমৃদ্ধ ও ত্রুটিমুক্ত করতে আপনার মূল্যবান মতামত, বাগ রিপোর্ট বা পরামর্শ আমাদের জানান।'
              : 'Share your suggestions, bug reports, or content concerns directly with the PeaceTweet team.'}
          </Text>
        </View>

        {/* Form Card */}
        <View className="w-full rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-5 shadow-xs space-y-4">
          <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
            {locale === 'bn' ? 'মতামত বা রিপোর্ট পাঠান' : 'Send Feedback'}
          </Text>

          {/* Feedback Type Chips */}
          <View className="flex-row flex-wrap gap-2">
            {[
              { key: 'SUGGESTION', bn: '💡 পরামর্শ', en: '💡 Suggestion' },
              { key: 'BUG', bn: '🐞 ত্রুটি / বাগ', en: '🐞 Bug' },
              { key: 'CONTENT', bn: '⚠️ কনটেন্ট রিপোর্ট', en: '⚠️ Content Report' },
              { key: 'OTHER', bn: '✉️ অন্যান্য', en: '✉️ Other' },
            ].map((tab) => {
              const isSelected = category === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setCategory(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl border ${
                    isSelected
                      ? 'bg-teal-600 border-teal-600'
                      : 'bg-[#f0f2f5] dark:bg-[#3a3b3c] border-[#ced0d4] dark:border-[#4a4b4d]'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-white' : 'text-[#050505] dark:text-[#e4e6eb]'
                    }`}>
                    {locale === 'bn' ? tab.bn : tab.en}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Subject */}
          <View className="space-y-1">
            <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
              {locale === 'bn' ? 'বিষয়' : 'Subject'}
            </Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder={locale === 'bn' ? 'বিষয় লিখুন...' : 'Brief subject...'}
              placeholderTextColor="#8a8d91"
              className="rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] bg-[#f0f2f5]/60 dark:bg-[#3a3b3c]/40 px-3.5 py-2.5 text-xs font-semibold text-[#050505] dark:text-[#e4e6eb]"
            />
          </View>

          {/* Message */}
          <View className="space-y-1">
            <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
              {locale === 'bn' ? 'বিস্তারিত বিবরণ' : 'Detailed Message'} *
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              placeholder={
                locale === 'bn'
                  ? 'আপনার পরামর্শ বা সমস্যার বিস্তারিত বিবরণ লিখুন...'
                  : 'Describe your feedback or issue in detail...'
              }
              placeholderTextColor="#8a8d91"
              textAlignVertical="top"
              className="rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] bg-[#f0f2f5]/60 dark:bg-[#3a3b3c]/40 p-3 text-xs font-medium text-[#050505] dark:text-[#e4e6eb] min-h-[90px]"
            />
          </View>

          {/* Email */}
          <View className="space-y-1">
            <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
              {locale === 'bn' ? 'আপনার ইমেইল (ঐচ্ছিক)' : 'Your Email (Optional)'}
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="name@example.com"
              placeholderTextColor="#8a8d91"
              className="rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] bg-[#f0f2f5]/60 dark:bg-[#3a3b3c]/40 px-3.5 py-2 text-xs font-semibold text-[#050505] dark:text-[#e4e6eb]"
            />
          </View>

          {/* Submit Button */}
          {submitted ? (
            <View className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-3 items-center">
              <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {locale === 'bn'
                  ? '✓ আপনার মতামত সফলভাবে জমা হয়েছে। ধন্যবাদ!'
                  : '✓ Your feedback has been submitted. Thank you!'}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={handleSubmit}
              disabled={!message.trim()}
              className={`rounded-xl py-2.5 items-center justify-center ${
                message.trim()
                  ? 'bg-teal-600 active:bg-teal-700'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}>
              <Text className="text-xs font-bold text-white">
                {locale === 'bn' ? 'জমা দিন' : 'Submit Feedback'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* FAQs */}
        <View className="space-y-3">
          <Text className="text-xs font-bold text-[#65676b] dark:text-[#b0b3b8] uppercase tracking-wider px-1">
            {locale === 'bn' ? 'সচরাচর জিজ্ঞাসিত প্রশ্ন' : 'Frequently Asked Questions'}
          </Text>
          {faqs.map((faq, i) => (
            <View
              key={i}
              className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-4 shadow-xs">
              <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] mb-1">
                {locale === 'bn' ? faq.qBn : faq.qEn}
              </Text>
              <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] leading-relaxed">
                {locale === 'bn' ? faq.aBn : faq.aEn}
              </Text>
            </View>
          ))}
        </View>

        {/* Direct Email Card */}
        <View className="w-full rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-4 items-center text-center">
          <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mb-2">
            {locale === 'bn' ? 'সরাসরি অফিসিয়াল ইমেইল:' : 'Direct official contact:'}
          </Text>
          <Pressable onPress={handleEmailPress}>
            <Text className="text-xs font-bold font-mono text-teal-600 dark:text-teal-400">
              connect.peacetweet@gmail.com
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
