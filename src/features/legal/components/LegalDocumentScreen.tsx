import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { AppIcon, type AndroidSymbol } from '@/components/ui/Icon';
import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/navMetrics';

export type LegalTab = 'terms' | 'privacy';

interface LegalBullet {
  labelBn?: string;
  labelEn?: string;
  textBn: string;
  textEn: string;
}

interface LegalSection {
  id: string;
  searchTokens: string;
  icon: AndroidSymbol;
  color: string;
  titleBn: string;
  titleEn: string;
  introBn?: string;
  introEn?: string;
  bullets: LegalBullet[];
}

const TERMS_SECTIONS: LegalSection[] = [
  {
    id: 'terms-1',
    searchTokens: 'শালীনতা অশ্লীলতা নগ্নতা ভাষা মাদক জুয়া nudity vulgarity profanity modesty',
    icon: 'verified_user',
    color: '#e11d48',
    titleBn: '১. কন্টেন্ট মানদণ্ড ও শালীনতা রক্ষা',
    titleEn: '1. Content Integrity & Modesty Standards',
    introBn:
      'পিসটুইট একটি ইসলামিক পরিবেশ বজায় রাখার উদ্দেশ্যে প্রতিষ্ঠিত। নিম্নলিখিত কন্টেন্ট শেয়ার করা সম্পূর্ণ নিষিদ্ধ:',
    introEn:
      'PeaceTweet was created to foster an upright Islamic online environment. The following contents are strictly forbidden:',
    bullets: [
      {
        labelBn: 'নগ্নতা ও অর্ধনগ্নতা:',
        labelEn: 'Nudity & Partial Nudity:',
        textBn:
          'পুরুষ বা মহিলার সতর উন্মুক্তকারী কোনো ছবি, রিল বা ভিডিও আপলোড করা যাবে না।',
        textEn:
          'No photos, reels, or videos revealing private parts or provocative attire.',
      },
      {
        labelBn: 'অশ্লীল ভাষা ও গালিগালাজ:',
        labelEn: 'Vulgar Language & Profanity:',
        textBn:
          'পোস্টের ক্যাপশনে বা কমেন্টে কুরুচিপূর্ণ শব্দ, দ্ব্যর্থবোধক ইঙ্গিত বা অশোভন অঙ্গভঙ্গি প্রদর্শন করা যাবে না।',
        textEn:
          'No obscene words, sexual innuendos, slurs, or abusive expressions.',
      },
      {
        labelBn: 'মদ্যপান, জুয়া ও অনৈতিক প্রমোশন:',
        labelEn: 'Intoxicants, Gambling & Vice:',
        textBn:
          'মাদক, জুয়া বা কোনো অনৈসলামিক কাজের প্রচারণা বা উৎসাহ প্রদানকারী কন্টেন্ট।',
        textEn:
          'Promotion or encouragement of alcohol, gambling, fraud, or unlawful activities.',
      },
    ],
  },
  {
    id: 'terms-2',
    searchTokens: 'ইসলাম হাদিস কুরআন দোয়া মডারেশন authentic quran hadith',
    icon: 'menu_book',
    color: '#0d9488',
    titleBn: '২. ইসলামিক তথ্যের নির্ভুলতা ও পবিত্রতা',
    titleEn: '2. Islamic Truthfulness & Scholarly Accuracy',
    introBn:
      'দ্বীনি তথ্যের মর্যাদা রক্ষায় যেকোনো হাদিস বা দোয়া পোস্ট করার ক্ষেত্রে নির্ভরযোগ্য রেফারেন্স থাকা আবশ্যক:',
    introEn:
      'To uphold the sanctity of religious knowledge, posting authentic references is required:',
    bullets: [
      {
        textBn: 'জাল ও ভিত্তিহীন হাদিস অথবা বানোয়াট আমল প্রচার করা যাবে না।',
        textEn:
          'Do not propagate fabricated, unverified Hadiths, or baseless rituals.',
      },
      {
        textBn:
          'কোনো মুসলিমকে অনর্থক কাফের ফতোয়া দেওয়া, দলীয় হিংসা বা সাম্প্রদায়িক বিদ্বেষমূলক আলোচনা করা যাবে না।',
        textEn:
          'No sectarian hatred, declaring others disbelievers (takfir), or spreading communal discord.',
      },
      {
        textBn:
          'পিসটুইট মডারেশন টিম বিভ্রান্তিকর তথ্য বা ভুল ইসলামিক ব্যাখ্যার পোস্ট সরিয়ে ফেলার অধিকার সংরক্ষণ করে।',
        textEn:
          'PeaceTweet moderation team reserves the right to remove any post containing misleading religious interpretations.',
      },
    ],
  },
  {
    id: 'terms-3',
    searchTokens: 'বুলিং হেনস্তা আচরণ হয়রানি মেসেঞ্জার harassment bullying respectful',
    icon: 'group',
    color: '#2563eb',
    titleBn: '৩. পারস্পরিক আচরণ ও হয়রানি প্রতিরোধ',
    titleEn: '3. Community Conduct & Anti-Harassment',
    introBn: 'সকল ব্যবহারকারীর সম্মান ও শালীনতা রক্ষা করা আমাদের দায়িত্ব:',
    introEn: 'Maintaining honor and mutual respect is our top commitment:',
    bullets: [
      {
        textBn:
          'মেসেঞ্জারে অথবা পোস্টের কমেন্টে কাউকে উত্ত্যক্ত, ব্ল্যাকমেইল বা অযাচিত ব্যক্তিগত বার্তা পাঠানো নিষিদ্ধ।',
        textEn:
          'Stalking, cyberbullying, unsolicited inappropriate DMs, or harassment in comments is strictly forbidden.',
      },
      {
        textBn:
          'ব্যবহারকারীর অভিযোগ প্রমাণিত হলে অবিলম্বে সংশ্লিষ্ট ব্যবহারকারীকে প্ল্যাটফর্ম থেকে বহিষ্কার করা হবে।',
        textEn:
          'Verified harassment complaints will result in swift account termination.',
      },
    ],
  },
  {
    id: 'terms-4',
    searchTokens: 'রক্তদান রক্ত জরুরি আবেদন blood donation emergency',
    icon: 'water_drop',
    color: '#e11d48',
    titleBn: '৪. জরুরি রক্তদান অনুরোধের বিশ্বস্ততা',
    titleEn: '4. Emergency Blood Donation Integrity',
    introBn: 'রক্তদান সেবাটি সম্পূর্ণ মানবিক ও সওয়াবের উদ্দেশ্যে পরিচালিত:',
    introEn:
      'Our blood donation network operates strictly on humanitarian and spiritual values:',
    bullets: [
      {
        textBn:
          'কোনো ভুয়া তথ্য বা বাণিজ্যিক স্বার্থে রক্ত চেয়ে পোস্ট করা যাবে না।',
        textEn:
          'No fraudulent medical calls or commercial exploitation of blood requests.',
      },
      {
        textBn:
          'যেকোনো প্রকার আর্থিক লেনদেন বা দালালি কার্যকলাপ সম্পূর্ণ নিষিদ্ধ।',
        textEn: 'Buying, selling, or financial brokering of blood is prohibited.',
      },
    ],
  },
];

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'privacy-1',
    searchTokens:
      'তথ্য সংগ্রহ প্রোফাইল ইমেইল পাসওয়ার্ড তাসবীহ information collection data profile tasbih',
    icon: 'settings',
    color: '#0866FF',
    titleBn: '১. আমরা যেসব তথ্য সংগ্রহ করি',
    titleEn: '1. Information We Collect',
    bullets: [
      {
        labelBn: 'অ্যাকাউন্ট প্রোফাইল:',
        labelEn: 'Account Profile:',
        textBn:
          'আপনার নাম, ইমেইল ঠিকানা, ইউজারনেম, প্রোফাইল ছবি এবং পাসওয়ার্ড (Bcrypt এনক্রিপ্টেড হ্যাশ)।',
        textEn:
          'Your name, email address, username, avatar photo, and password (salted Bcrypt hash).',
      },
      {
        labelBn: 'ইউজার কন্টেন্ট:',
        labelEn: 'User-Generated Content:',
        textBn:
          'আপনার পোস্ট, কমেন্ট, শেয়ারকৃত দোয়া, রক্তদানের অনুরোধ এবং সংরক্ষিত রুটিন সময়সূচি।',
        textEn:
          'Posts, comments, shared Duas, blood requests, and saved routine slots.',
      },
      {
        labelBn: 'লোকাল স্টোরেজ প্রেফারেন্স:',
        labelEn: 'Client Preferences:',
        textBn:
          'আপনার ডিভাইসে অফলাইন ডিজিটাল তাসবীহ কাউন্ট, সাউন্ড অন/অফ এবং ডার্ক/লাইট মোড সেটিংস।',
        textEn:
          'Your offline digital tasbih count, audio sound toggles, and dark/light mode preference.',
      },
    ],
  },
  {
    id: 'privacy-2',
    searchTokens:
      'তথ্য ব্যবহার ফিড মেসেজ নোটিফিকেশন স্প্যাম usage purpose feed chat notifications',
    icon: 'check_circle',
    color: '#059669',
    titleBn: '২. আমরা কীভাবে তথ্য ব্যবহার করি',
    titleEn: '2. How We Utilize Your Data',
    introBn: 'আপনার তথ্য শুধুমাত্র নিম্নলিখিত সেবার মানোন্নয়নের জন্য ব্যবহৃত হয়:',
    introEn: 'Your data is strictly used to deliver reliable platform features:',
    bullets: [
      {
        textBn:
          'ফিড কন্টেন্ট প্রদর্শন ও রিয়েল-টাইম মেসেঞ্জার মেসেজ/চ্যাট পরিচালনা করা।',
        textEn:
          'Delivering feed streams, search queries, and instant real-time chats.',
      },
      {
        textBn:
          'লাইক, কমেন্ট, ফ্রেন্ড রিকোয়েস্ট ও জরুরি রক্তের অনুরোধের লাইভ নোটিফিকেশন প্রদান করা।',
        textEn:
          'Dispatching notifications for friend interactions and urgent blood requests.',
      },
      {
        textBn:
          'অ্যাকাউন্টের অননুমোদিত প্রবেশ রোধ ও স্প্যাম প্রতিরোধ করা।',
        textEn:
          'Protecting accounts from unauthorized access and filtering abusive spam.',
      },
    ],
  },
  {
    id: 'privacy-3',
    searchTokens: 'oauth facebook google meta সোশ্যাল লগইন third party integration',
    icon: 'auto_awesome',
    color: '#6366f1',
    titleBn: '৩. ৩য় পক্ষের সেবা ও সোশ্যাল লগইন (Meta / Google)',
    titleEn: '3. Third-Party Integrations & Social Login',
    introBn: 'আপনি যখন ফেসবুক বা গুগল দিয়ে লগইন করেন:',
    introEn: 'When you authenticate using Meta (Facebook) or Google OAuth:',
    bullets: [
      {
        textBn:
          'আমরা শুধুমাত্র আপনার মৌলিক পাবলিক প্রোফাইল নাম ও ইমেইল গ্রহণ করি।',
        textEn:
          'We only access your basic public profile name and verified email address.',
      },
      {
        textBn:
          'আমরা কখনোই আপনার ফেসবুক ফ্রেন্ডলিস্ট, টাইমলাইন বা ব্যক্তিগত কোনো তথ্যে প্রবেশ করি না।',
        textEn:
          'We do NOT access your social friend lists, timeline posts, or private data.',
      },
    ],
  },
  {
    id: 'privacy-4',
    searchTokens: 'মুছে ফেলা delete account gdpr meta data deletion',
    icon: 'error_outline',
    color: '#e11d48',
    titleBn: '৪. আপনার তথ্য সম্পূর্ণ মুছে ফেলার অধিকার',
    titleEn: '4. Right to Permanent Data Deletion',
    introBn:
      'ব্যবহারকারী হিসেবে আপনি যেকোনো সময় আপনার অ্যাকাউন্ট ও সমস্ত ডাটা স্থায়ীভাবে মুছে ফেলার পূর্ণ অধিকার রাখেন (GDPR ও Meta ডেটা ডিলিশন নীতি অনুসারে):',
    introEn:
      'You retain full rights to delete your account and all associated personal data permanently at any time (compliant with GDPR & Meta User Data Deletion protocols):',
    bullets: [
      {
        textBn:
          'প্রোফাইল সেটিংস থেকে "Delete Account" অপশন ব্যবহার করে সাথে সাথে সমস্ত পোস্ট, কমেন্ট ও চ্যাট হিস্ট্রি মুছে ফেলা যায়।',
        textEn:
          'Use the "Delete Account" option in your Profile Settings to permanently purge your profile, posts, comments, and chat history.',
      },
      {
        textBn:
          'অথবা যেকোনো সহায়তার জন্য সরাসরি আমাদের সাপোর্ট ইমেইলে যোগাযোগ করতে পারেন।',
        textEn:
          'Alternatively, contact our support team directly for manual account purging.',
      },
    ],
  },
];

interface LegalDocumentScreenProps {
  defaultTab?: LegalTab;
}

/** Shared Terms of Service & Privacy Policy screen styled to match PurposeScreen. */
export function LegalDocumentScreen({
  defaultTab = 'terms',
}: LegalDocumentScreenProps) {
  const { locale, theme } = useUi();
  const isDark = theme === 'dark';
  const params = useLocalSearchParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState<LegalTab>(() =>
    params.tab === 'privacy' || params.tab === 'terms'
      ? params.tab
      : defaultTab
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (params.tab === 'privacy' || params.tab === 'terms') {
      setActiveTab(params.tab);
    } else {
      setActiveTab(defaultTab);
    }
  }, [params.tab, defaultTab]);

  const cardSurfaceStyle = {
    backgroundColor: isDark ? '#242526' : '#ffffff',
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:connect.peacetweet@gmail.com').catch(() => {});
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesSection = (section: LegalSection) => {
    if (!normalizedQuery) return true;
    const haystack = [
      section.searchTokens,
      section.titleBn,
      section.titleEn,
      section.introBn || '',
      section.introEn || '',
      ...section.bullets.flatMap((b) => [
        b.labelBn || '',
        b.labelEn || '',
        b.textBn,
        b.textEn,
      ]),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  };

  const filteredTermsSections = useMemo(
    () => TERMS_SECTIONS.filter(matchesSection),
    [normalizedQuery]
  );

  const filteredPrivacySections = useMemo(
    () => PRIVACY_SECTIONS.filter(matchesSection),
    [normalizedQuery]
  );

  const showModerationSection =
    !normalizedQuery ||
    '৫. মডারেশন ব্যবস্থা ও শাস্তিমূলক পদক্ষেপ সতর্কবার্তা সাময়িক স্থগিত স্থায়ী বহিষ্কার ban suspension warning moderation penalties account'.includes(
      normalizedQuery
    );

  const renderSectionCard = (section: LegalSection) => (
    <View
      key={section.id}
      style={cardSurfaceStyle}
      className="w-full px-3.5 py-4 flex-row items-start gap-3.5">
      <View
        style={{ backgroundColor: `${section.color}18` }}
        className="h-11 w-11 rounded-2xl items-center justify-center shrink-0 mt-0.5">
        <AppIcon android={section.icon} size={22} color={section.color} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] mb-1.5">
          {locale === 'bn' ? section.titleBn : section.titleEn}
        </Text>
        {section.introBn || section.introEn ? (
          <Text className="text-[15px] text-[#65676b] dark:text-[#b0b3b8] leading-[22px] mb-2">
            {locale === 'bn' ? section.introBn : section.introEn}
          </Text>
        ) : null}
        <View style={{ gap: 6 }}>
          {section.bullets.map((b, idx) => {
            const label = locale === 'bn' ? b.labelBn : b.labelEn;
            const text = locale === 'bn' ? b.textBn : b.textEn;
            return (
              <View key={idx} className="flex-row items-start gap-2">
                <Text className="text-[15px] leading-[22px] text-[#65676b] dark:text-[#b0b3b8]">
                  •
                </Text>
                <Text className="flex-1 text-[15px] leading-[22px] text-[#65676b] dark:text-[#b0b3b8]">
                  {label ? (
                    <Text className="font-bold text-[#050505] dark:text-[#e4e6eb]">
                      {label}{' '}
                    </Text>
                  ) : null}
                  {text}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  const activeSections =
    activeTab === 'terms' ? filteredTermsSections : filteredPrivacySections;
  const hasAnyResults =
    activeSections.length > 0 ||
    (activeTab === 'terms' && showModerationSection);

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingTop: 60,
        paddingBottom: BOTTOM_NAV_CLEARANCE,
      }}
      showsVerticalScrollIndicator={false}>
      <View className="w-full max-w-[768px] mx-auto" style={{ gap: 8 }}>
        {/* Hero Card (Matches PurposeScreen) */}
        <View style={cardSurfaceStyle} className="w-full px-3.5 py-4">
          <View className="flex-row items-center gap-3 mb-2.5">
            <View
              style={{
                backgroundColor: isDark ? 'rgba(8, 102, 255, 0.16)' : '#eff6ff',
              }}
              className="h-11 w-11 rounded-2xl items-center justify-center shrink-0">
              <AppIcon
                android={activeTab === 'privacy' ? 'lock' : 'verified_user'}
                size={22}
                color="#0866FF"
              />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-[18px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn'
                  ? 'ব্যবহারের শর্তাবলী ও নীতিমালা'
                  : 'Terms & Privacy Policy'}
              </Text>
            </View>
          </View>
          <Text className="text-[15px] leading-[22px] text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn'
              ? 'পিসটুইট (PeaceTweet) একটি শালীন, নিরাপদ এবং আত্মশুদ্ধিমূলক সামাজিক যোগাযোগ মাধ্যম। প্ল্যাটফর্মের পরিবেশ পবিত্র ও কলুষমুক্ত রাখতে আমাদের নীতিমালা মেনে চলা সকলের জন্য আবশ্যক।'
              : 'PeaceTweet is a modest, safe, and spiritually conscious social platform. Adherence to our community standards and privacy policy is essential for all members.'}
          </Text>
        </View>

        {/* Tab Switcher + Quick Policy Filter */}
        <View style={cardSurfaceStyle} className="w-full px-3.5 py-3">
          <View className="w-full flex-row rounded-xl bg-[#f0f2f5] dark:bg-[#18191a] p-1">
            {(
              [
                {
                  key: 'terms',
                  icon: 'description' as AndroidSymbol,
                  bn: 'ব্যবহারের শর্তাবলী',
                  en: 'Terms of Service',
                },
                {
                  key: 'privacy',
                  icon: 'lock' as AndroidSymbol,
                  bn: 'গোপনীয়তা নীতি',
                  en: 'Privacy Policy',
                },
              ] as const
            ).map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2.5 rounded-lg flex-row items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#0866FF]'
                      : 'active:bg-white/60 dark:active:bg-[#3a3b3c]'
                  }`}>
                  <AppIcon
                    android={tab.icon}
                    size={16}
                    color={isSelected ? '#ffffff' : isDark ? '#b0b3b8' : '#65676b'}
                  />
                  <Text
                    numberOfLines={1}
                    className={`text-[14px] font-bold ${
                      isSelected
                        ? 'text-white'
                        : 'text-[#65676b] dark:text-[#b0b3b8]'
                    }`}>
                    {locale === 'bn' ? tab.bn : tab.en}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View
            style={{
              backgroundColor: isDark ? '#3a3b3c' : '#f0f2f5',
            }}
            className="mt-2.5 h-11 rounded-2xl px-3.5 flex-row items-center gap-2">
            <AppIcon
              android="search"
              size={18}
              color={isDark ? '#b0b3b8' : '#65676b'}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                locale === 'bn' ? 'নীতিমালায় খুঁজুন...' : 'Search in policies...'
              }
              placeholderTextColor={isDark ? '#8e8e93' : '#8a8d91'}
              className="flex-1 text-base text-[#050505] dark:text-[#e4e6eb] py-0"
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <AppIcon
                  android="close"
                  size={17}
                  color={isDark ? '#b0b3b8' : '#65676b'}
                />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Highlight Banner for Active Tab */}
        {activeTab === 'terms' ? (
          <View style={cardSurfaceStyle} className="w-full px-3.5 py-3.5">
            <View
              style={{
                backgroundColor: isDark ? 'rgba(225, 29, 72, 0.14)' : '#fff1f2',
                borderColor: isDark ? 'rgba(244, 63, 94, 0.38)' : '#fda4af',
              }}
              className="rounded-2xl border p-3.5 flex-row items-start gap-3">
              <View className="h-9 w-9 rounded-full bg-rose-600 items-center justify-center shrink-0 mt-0.5">
                <AppIcon android="warning" size={18} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-rose-700 dark:text-rose-300 mb-1">
                  {locale === 'bn'
                    ? 'অশ্লীলতা ও কুরুচিপূর্ণ কন্টেন্টে জিরো-টলারেন্স নীতি'
                    : 'Zero-Tolerance Policy on Vulgar & Obscene Content'}
                </Text>
                <Text className="text-[15px] leading-[22px] text-rose-900 dark:text-rose-200">
                  {locale === 'bn'
                    ? 'পিসটুইটে কোনো প্রকার নগ্নতা, যৌন ইঙ্গিতপূর্ণ ছবি/ভিডিও বা কুরুচিপূর্ণ ভাষা পোস্ট করা সম্পূর্ণ নিষিদ্ধ। এই নিয়ম লঙ্ঘন করলে কন্টেন্ট অপসারণসহ অ্যাকাউন্ট স্থায়ীভাবে বন্ধ করা হবে।'
                    : 'PeaceTweet strictly prohibits nudity, sexually explicit or provocative media, and indecent language. Any violating post will be removed and the account permanently banned.'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={cardSurfaceStyle} className="w-full px-3.5 py-3.5">
            <View
              style={{
                backgroundColor: isDark ? 'rgba(13, 148, 136, 0.14)' : '#f0fdfa',
                borderColor: isDark ? 'rgba(20, 184, 166, 0.35)' : '#99f6e4',
              }}
              className="rounded-2xl border p-3.5 flex-row items-start gap-3">
              <View className="h-9 w-9 rounded-full bg-teal-600 items-center justify-center shrink-0 mt-0.5">
                <AppIcon android="lock" size={18} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-teal-800 dark:text-teal-300 mb-1">
                  {locale === 'bn'
                    ? 'আপনার ব্যক্তিগত তথ্যের পূর্ণ নিরাপত্তা'
                    : 'Complete Privacy & Data Security'}
                </Text>
                <Text className="text-[15px] leading-[22px] text-teal-900 dark:text-teal-200">
                  {locale === 'bn'
                    ? 'পিসটুইট আপনার ব্যক্তিগত তথ্য কখনোই কোনো ৩য় পক্ষের কাছে বিক্রি বা অপব্যবহার করে না। সমস্ত ডাটা আধুনিক এনক্রিপশনের মাধ্যমে সুরক্ষিত থাকে।'
                    : 'PeaceTweet never sells or misuses your personal data to third parties. Sensitive information is protected with modern cryptographic encryption.'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Policy Cards */}
        {!hasAnyResults ? (
          <View style={cardSurfaceStyle} className="w-full px-3.5 py-8 items-center">
            <AppIcon
              android="search"
              size={24}
              color={isDark ? '#b0b3b8' : '#65676b'}
            />
            <Text className="text-[15px] text-[#65676b] dark:text-[#b0b3b8] mt-2 text-center">
              {locale === 'bn'
                ? 'এই বিষয়ে কোনো নীতিমালা পাওয়া যায়নি।'
                : 'No matching policy sections found.'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {activeSections.map(renderSectionCard)}

            {activeTab === 'terms' && showModerationSection ? (
              <View
                style={cardSurfaceStyle}
                className="w-full px-3.5 py-4 flex-row items-start gap-3.5">
                <View
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.14)' }}
                  className="h-11 w-11 rounded-2xl items-center justify-center shrink-0 mt-0.5">
                  <AppIcon android="warning" size={22} color="#d97706" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] mb-1.5">
                    {locale === 'bn'
                      ? '৫. মডারেশন ব্যবস্থা ও শাস্তিমূলক পদক্ষেপ'
                      : '5. Moderation Protocols & Penalties'}
                  </Text>
                  <Text className="text-[15px] text-[#65676b] dark:text-[#b0b3b8] leading-[22px] mb-3">
                    {locale === 'bn'
                      ? 'নীতিমালা ভঙ্গের তীব্রতার ওপর ভিত্তি করে নিম্নলিখিত পদক্ষেপ গ্রহণ করা হবে:'
                      : 'Depending on the severity of the violation, actions taken include:'}
                  </Text>

                  <View style={{ gap: 8 }}>
                    {[
                      {
                        titleBn: 'সতর্কবার্তা',
                        titleEn: 'Warning',
                        descBn:
                          'সাধারণ ভুল বা ছোটখাটো অসাবধানতার ক্ষেত্রে কন্টেন্ট মুছে সতর্কতা জারি।',
                        descEn:
                          'Content removal with gentle guidance for minor infractions.',
                        bg: isDark ? 'rgba(245, 158, 11, 0.14)' : '#fffbeb',
                        border: isDark ? 'rgba(245, 158, 11, 0.32)' : '#fcd34d',
                        titleColor: 'text-amber-800 dark:text-amber-300',
                      },
                      {
                        titleBn: 'সাময়িক স্থগিত',
                        titleEn: 'Suspension',
                        descBn:
                          'উস্কানি বা অবাধ্যতার ক্ষেত্রে ৭ থেকে ৩০ দিনের জন্য পোস্ট ও মেসেজ বন্ধ।',
                        descEn:
                          'Temporary 7-30 day ban from posting and messaging for repeat issues.',
                        bg: isDark ? 'rgba(249, 115, 22, 0.14)' : '#fff7ed',
                        border: isDark ? 'rgba(249, 115, 22, 0.32)' : '#fdba74',
                        titleColor: 'text-orange-800 dark:text-orange-300',
                      },
                      {
                        titleBn: 'স্থায়ী বহিষ্কার',
                        titleEn: 'Permanent Ban',
                        descBn:
                          'অশ্লীলতা, নগ্নতা বা গুরুতর অপরাধে তাৎক্ষণিক স্থায়ীভাবে একাউন্ট বন্ধ।',
                        descEn:
                          'Immediate, irreversible account ban for vulgarity, pornography, or abuse.',
                        bg: isDark ? 'rgba(225, 29, 72, 0.14)' : '#fff1f2',
                        border: isDark ? 'rgba(244, 63, 94, 0.32)' : '#fda4af',
                        titleColor: 'text-rose-800 dark:text-rose-300',
                      },
                    ].map((tier) => (
                      <View
                        key={tier.titleEn}
                        style={{
                          backgroundColor: tier.bg,
                          borderColor: tier.border,
                        }}
                        className="rounded-xl border p-3">
                        <Text className={`text-[15px] font-bold mb-0.5 ${tier.titleColor}`}>
                          {locale === 'bn' ? tier.titleBn : tier.titleEn}
                        </Text>
                        <Text className="text-[14.5px] leading-[21px] text-[#65676b] dark:text-[#b0b3b8]">
                          {locale === 'bn' ? tier.descBn : tier.descEn}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* Support & Contact Footer (Matches PurposeScreen Footer) */}
        <View style={cardSurfaceStyle} className="w-full px-3.5 py-4 items-center">
          <View
            style={{
              backgroundColor: isDark ? 'rgba(8, 102, 255, 0.16)' : '#eff6ff',
            }}
            className="h-11 w-11 rounded-2xl items-center justify-center mb-2.5">
            <AppIcon android="mail" size={22} color="#0866FF" />
          </View>
          <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] mb-1 text-center">
            {locale === 'bn'
              ? 'নীতিমালা সংক্রান্ত প্রশ্ন আছে?'
              : 'Questions About Our Policies?'}
          </Text>
          <Text className="text-[15px] leading-[22px] text-[#65676b] dark:text-[#b0b3b8] text-center mb-3.5">
            {locale === 'bn'
              ? 'যেকোনো পরামর্শ, নীতিমালা সম্পর্কে জানতে বা রিপোর্ট করতে যোগাযোগ করুন:'
              : 'Reach out for any policy clarification, suggestion, or violation report:'}
          </Text>

          <View className="w-full" style={{ gap: 8 }}>
            <Pressable
              onPress={() => router.push('/feedback')}
              className="w-full py-3 px-4 rounded-xl bg-[#0866FF] flex-row items-center justify-center gap-2 active:opacity-85">
              <AppIcon android="feedback" size={18} color="#ffffff" />
              <Text className="text-[15px] font-bold text-white">
                {locale === 'bn'
                  ? 'ফিডব্যাক ও রিপোর্ট ফর্ম'
                  : 'Feedback & Report'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleEmailPress}
              style={{
                backgroundColor: isDark ? 'rgba(8, 102, 255, 0.16)' : '#eff6ff',
                borderColor: isDark ? 'rgba(59, 130, 246, 0.35)' : '#bfdbfe',
              }}
              className="w-full py-3 px-4 rounded-xl border flex-row items-center justify-center gap-2 active:opacity-80">
              <AppIcon android="mail" size={18} color="#0866FF" />
              <Text className="text-[15px] font-bold text-[#0866FF] dark:text-[#60a5fa]">
                connect.peacetweet@gmail.com
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
