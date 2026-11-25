import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';
import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/navMetrics';

type FeedbackCategory = 'SUGGESTION' | 'BUG' | 'CONTENT' | 'OTHER';
type FocusedField = 'subject' | 'message' | 'email' | null;

export default function FeedbackScreen() {
  const { locale, theme, showToast } = useUi();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  const [category, setCategory] = useState<FeedbackCategory>('SUGGESTION');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [submitted, setSubmitted] = useState(false);

  const cardSurfaceStyle = {
    backgroundColor: isDark ? '#242526' : '#ffffff',
  };

  const getInputContainerStyle = (field: FocusedField) => ({
    backgroundColor: isDark ? '#3a3b3c' : '#f0f2f5',
    borderColor:
      focusedField === field
        ? '#0d9488'
        : isDark
          ? '#4e4f50'
          : '#e4e6eb',
  });

  const placeholderColor = isDark ? '#8e8e93' : '#8a8d91';

  const handleSubmit = () => {
    if (!message.trim()) return;
    setSubmitted(true);
    showToast?.({
      message:
        locale === 'bn'
          ? 'আপনার মতামত সফলভাবে জমা হয়েছে!'
          : 'Your feedback has been submitted!',
      type: 'success',
    });
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
      aBn: 'ফর্মের "কনটেন্ট রিপোর্ট" অপশন সিলেক্ট করে সংশ্লিষ্ট পোস্টের লিংক বা কারণ উল্লেখ করে পাঠান। আমাদের টিম তা যাচাই করে প্রয়োজনীয় ব্যবস্থা নেবে।',
      aEn: 'Select the "Content Report" category and submit details. Our verification team will review and rectify immediately.',
    },
  ];

  const categories: { key: FeedbackCategory; bn: string; en: string }[] = [
    { key: 'SUGGESTION', bn: '💡 পরামর্শ', en: '💡 Suggestion' },
    { key: 'BUG', bn: '🐞 ত্রুটি / বাগ', en: '🐞 Bug' },
    { key: 'CONTENT', bn: '⚠️ কনটেন্ট রিপোর্ট', en: '⚠️ Content Report' },
    { key: 'OTHER', bn: '✉️ অন্যান্য', en: '✉️ Other' },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]">
      <ScrollView
        className="flex-1"
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 60,
          paddingBottom: BOTTOM_NAV_CLEARANCE,
        }}>
        <View className="w-full max-w-[768px] mx-auto" style={{ gap: 8 }}>
          {/* Hero Card */}
          <View style={cardSurfaceStyle} className="w-full px-3.5 py-4">
            <View className="flex-row items-center gap-3 mb-2">
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(13, 148, 136, 0.16)' : '#f0fdfa',
                }}
                className="h-11 w-11 rounded-2xl items-center justify-center shrink-0">
                <AppIcon android="feedback" size={22} color="#0d9488" />
              </View>
              <Text className="text-[18px] font-bold text-[#050505] dark:text-[#e4e6eb] flex-1">
                {locale === 'bn' ? 'পরামর্শ ও অভিযোগ' : 'Feedback & Report'}
              </Text>
            </View>
            <Text className="text-[15px] leading-[22px] text-[#65676b] dark:text-[#b0b3b8]">
              {locale === 'bn'
                ? 'আপনার মতামত, পরামর্শ, ত্রুটি বা কনটেন্ট রিপোর্ট সরাসরি আমাদের জানান।'
                : 'Share suggestions, report bugs, or flag content concerns directly with our team.'}
            </Text>
          </View>

          {/* Form Card */}
          <View style={cardSurfaceStyle} className="w-full px-3.5 py-4">
            <View style={{ gap: 14 }}>
              <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'মতামত বা রিপোর্ট পাঠান' : 'Send Feedback or Report'}
              </Text>

              {/* Feedback Type Chips */}
              <View className="flex-row flex-wrap gap-2">
                {categories.map((tab) => {
                  const isSelected = category === tab.key;
                  return (
                    <Pressable
                      key={tab.key}
                      onPress={() => setCategory(tab.key)}
                      style={{
                        backgroundColor: isSelected
                          ? '#0d9488'
                          : isDark
                            ? '#3a3b3c'
                            : '#f0f2f5',
                        borderColor: isSelected
                          ? '#0d9488'
                          : isDark
                            ? '#4e4f50'
                            : '#e4e6eb',
                      }}
                      className="px-3.5 py-2 rounded-xl border active:opacity-80">
                      <Text
                        className={`text-[14px] font-bold ${
                          isSelected ? 'text-white' : 'text-[#050505] dark:text-[#e4e6eb]'
                        }`}>
                        {locale === 'bn' ? tab.bn : tab.en}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Subject */}
              <View style={{ gap: 6 }}>
                <Text className="text-[14.5px] font-semibold text-[#1c1e21] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'বিষয়' : 'Subject'}
                </Text>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  onFocus={() => setFocusedField('subject')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={locale === 'bn' ? 'বিষয় লিখুন...' : 'Brief subject...'}
                  placeholderTextColor={placeholderColor}
                  style={getInputContainerStyle('subject')}
                  className="h-12 rounded-2xl border px-4 text-base font-medium text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>

              {/* Message */}
              <View style={{ gap: 6 }}>
                <Text className="text-[14.5px] font-semibold text-[#1c1e21] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'বিস্তারিত বিবরণ *' : 'Detailed Message *'}
                </Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  onFocus={() => setFocusedField('message')}
                  onBlur={() => setFocusedField(null)}
                  multiline
                  numberOfLines={4}
                  placeholder={
                    locale === 'bn'
                      ? 'আপনার পরামর্শ বা সমস্যার বিস্তারিত বিবরণ লিখুন...'
                      : 'Describe your feedback or issue in detail...'
                  }
                  placeholderTextColor={placeholderColor}
                  textAlignVertical="top"
                  style={getInputContainerStyle('message')}
                  className="rounded-2xl border p-4 text-base font-normal text-[#050505] dark:text-[#e4e6eb] min-h-[116px]"
                />
              </View>

              {/* Email */}
              <View style={{ gap: 6 }}>
                <Text className="text-[14.5px] font-semibold text-[#1c1e21] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'আপনার ইমেইল (ঐচ্ছিক)' : 'Your Email (Optional)'}
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="name@example.com"
                  placeholderTextColor={placeholderColor}
                  style={getInputContainerStyle('email')}
                  className="h-12 rounded-2xl border px-4 text-base font-medium text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>

              {/* Submit Button */}
              {submitted ? (
                <View
                  style={{
                    backgroundColor: isDark ? 'rgba(5, 150, 105, 0.16)' : '#ecfdf5',
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#a7f3d0',
                  }}
                  className="rounded-xl border p-3.5 flex-row items-center justify-center gap-2">
                  <AppIcon android="check_circle" size={18} color="#059669" />
                  <Text className="text-[15px] font-bold text-emerald-700 dark:text-emerald-300">
                    {locale === 'bn'
                      ? 'আপনার মতামত সফলভাবে জমা হয়েছে। ধন্যবাদ!'
                      : 'Your feedback has been submitted. Thank you!'}
                  </Text>
                </View>
              ) : (
                <Pressable
                  onPress={handleSubmit}
                  disabled={!message.trim()}
                  style={{
                    backgroundColor: message.trim()
                      ? '#0d9488'
                      : isDark
                        ? '#3a3b3c'
                        : '#d8dadf',
                  }}
                  className="rounded-xl py-3.5 items-center justify-center active:opacity-85">
                  <Text
                    className={`text-[15px] font-bold ${
                      message.trim()
                        ? 'text-white'
                        : 'text-[#8a8d91] dark:text-[#6e6e73]'
                    }`}>
                    {locale === 'bn' ? 'জমা দিন' : 'Submit Feedback'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* FAQs */}
          <View style={{ gap: 8 }}>
            <Text className="text-[14px] font-bold text-[#65676b] dark:text-[#b0b3b8] px-3.5 pt-1">
              {locale === 'bn' ? 'সচরাচর জিজ্ঞাসিত প্রশ্ন' : 'Frequently Asked Questions'}
            </Text>
            {faqs.map((faq, i) => (
              <View
                key={i}
                style={cardSurfaceStyle}
                className="w-full px-3.5 py-4">
                <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] mb-1.5">
                  {locale === 'bn' ? faq.qBn : faq.qEn}
                </Text>
                <Text className="text-[15px] text-[#65676b] dark:text-[#b0b3b8] leading-[22px]">
                  {locale === 'bn' ? faq.aBn : faq.aEn}
                </Text>
              </View>
            ))}
          </View>

          {/* Direct Email Card */}
          <View style={cardSurfaceStyle} className="w-full px-3.5 py-4 items-center">
            <Text className="text-[15px] text-[#65676b] dark:text-[#b0b3b8] mb-3">
              {locale === 'bn' ? 'সরাসরি অফিসিয়াল ইমেইল:' : 'Direct official contact:'}
            </Text>
            <Pressable
              onPress={handleEmailPress}
              style={{
                backgroundColor: isDark ? 'rgba(13, 148, 136, 0.16)' : '#f0fdfa',
                borderColor: isDark ? 'rgba(20, 184, 166, 0.35)' : '#99f6e4',
              }}
              className="w-full py-3 px-4 rounded-xl border flex-row items-center justify-center gap-2 active:opacity-80">
              <AppIcon android="mail" size={18} color="#0d9488" />
              <Text className="text-[15px] font-bold text-[#0d9488] dark:text-[#2dd4bf]">
                connect.peacetweet@gmail.com
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
