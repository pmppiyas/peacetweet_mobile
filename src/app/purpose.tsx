import React from 'react';
import { ScrollView, View, Text, Pressable, Linking } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';

export default function PurposeScreen() {
  const { locale } = useUi();

  const handleEmailPress = () => {
    Linking.openURL('mailto:connect.peacetweet@gmail.com').catch(() => {});
  };

  const principles = [
    {
      id: 'p-1',
      icon: 'verified_user' as const,
      color: '#10b981',
      titleBn: 'চোখের যিনামুক্ত ও নিরাপদ সোশ্যাল স্পেস',
      titleEn: 'Safe & Gaze-Protected Social Space',
      descBn:
        'PeaceTweet সম্পূর্ণভাবে অশ্লীলতা, কুরুচিপূর্ণ কনটেন্ট ও অ্যালগরিদমিক অপচয়মুক্ত একটি নিরাপদ স্থান, যা অন্তরের প্রশান্তি এনে দেয়।',
      descEn:
        'PeaceTweet is intentionally built without vulgarity, indecency, and toxic addiction algorithms to safeguard your eyes and heart.',
    },
    {
      id: 'p-2',
      icon: 'menu_book' as const,
      color: '#3b82f6',
      titleBn: 'প্রামাণিক ও সহীহ রেফারেন্সের নিশ্চয়তা',
      titleEn: 'Strict Authenticity & Source Verification',
      descBn:
        'প্রতিটি দোয়া, হাদীস ও ইসলামিক মাসআলার সাথে কুরআন ও সহীহ হাদিসের গ্রহণযোগ্য রেফারেন্স যুক্ত করা হয়।',
      descEn:
        'Every Dua and Islamic reminder is strictly verified against the Quran and authentic Sunnah references.',
    },
    {
      id: 'p-3',
      icon: 'auto_awesome' as const,
      color: '#8b5cf6',
      titleBn: 'সাদাকায়ে জারিয়া ও অলাভজনক লক্ষ্য',
      titleEn: 'Non-Profit & Continuous Sadaqah Jariyah',
      descBn:
        'ব্যক্তিগত বাণিজ্যিক মুনাফা নয়, বরং বিশ্বজুড়ে উম্মাহর খেদমত এবং আখিরাতের অনন্ত সফলতাই আমাদের মূল প্রেরণা।',
      descEn:
        'Built not for commercial greed, but purely as continuous charity (Sadaqah Jariyah) benefiting the global Ummah.',
    },
    {
      id: 'p-4',
      icon: 'lock' as const,
      color: '#f59e0b',
      titleBn: 'ইউজার প্রাইভেসি ও তথ্যের সর্বোচ্চ সুরক্ষা',
      titleEn: 'Zero Invasive Ads & Strict Privacy',
      descBn:
        'আমরা কোনো বিজ্ঞাপন সংস্থার কাছে আপনার ব্যক্তিগত ডেটা বিক্রি করি না। আপনার গোপনীয়তা আমাদের সর্বোচ্চ অগ্রাধিকার।',
      descEn:
        'We never sell your personal data or compromise your privacy with third-party tracking and invasive advertising.',
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20 }}>
      <View className="w-full max-w-[768px] mx-auto space-y-4">
        {/* Hero Card */}
        <View className="w-full rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-5 shadow-xs items-center text-center">
          <View className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 items-center justify-center mb-3">
            <AppIcon android="auto_awesome" size={28} color="#059669" />
          </View>

          <View className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 border border-emerald-200 dark:border-emerald-800/80 mb-2.5">
            <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              {locale === 'bn'
                ? 'আমাদের লক্ষ্য, প্রেরণা ও স্বচ্ছতার অঙ্গীকার'
                : 'Our Mission, Values & Commitment'}
            </Text>
          </View>

          <Text className="text-xl font-extrabold text-[#050505] dark:text-[#e4e6eb] text-center mb-2">
            {locale === 'bn' ? 'PeaceTweet কেন তৈরি করেছি?' : 'Why We Built PeaceTweet'}
          </Text>

          <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center max-w-lg leading-relaxed">
            {locale === 'bn'
              ? 'একটি পরিচ্ছন্ন, নিরাপদ, চোখের যিনামুক্ত ও বিরক্তিকর বিজ্ঞাপনবিহীন ডিজিটাল স্থান—যেখানে স্ক্রল করলেই চোখ ও মন শান্ত থাকে এবং জীবন পরিবর্তনের মতো খাঁটি জ্ঞান মেলে।'
              : 'A clean, safe, and advertisement-free sanctuary where scrolling purifies your heart and enriches your soul with authentic Islamic knowledge.'}
          </Text>
        </View>

        {/* Pillars */}
        <View className="space-y-3">
          {principles.map((item) => {
            const title = locale === 'bn' ? item.titleBn : item.titleEn;
            const desc = locale === 'bn' ? item.descBn : item.descEn;

            return (
              <View
                key={item.id}
                className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-4 shadow-xs flex-row items-start gap-3.5">
                <View
                  style={{ backgroundColor: `${item.color}15` }}
                  className="h-11 w-11 rounded-2xl items-center justify-center shrink-0 mt-0.5">
                  <AppIcon android={item.icon} size={22} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] mb-1">
                    {title}
                  </Text>
                  <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] leading-relaxed">
                    {desc}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Official Contact Footer */}
        <View className="w-full rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-5 shadow-xs items-center text-center">
          <AppIcon android="mail" size={24} color="#1877f2" />
          <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] mt-2 mb-1">
            {locale === 'bn' ? 'অফিসিয়াল যোগাযোগ' : 'Official Contact'}
          </Text>
          <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center mb-3">
            {locale === 'bn'
              ? 'যেকোনো পরামর্শ, সহযোগিতা বা সংশোধনের জন্য সরাসরি ইমেইল করুন:'
              : 'For suggestions, collaborations, or content verification, reach us at:'}
          </Text>
          <Pressable
            onPress={handleEmailPress}
            className="px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800">
            <Text className="text-xs font-bold font-mono text-primary-600 dark:text-primary-400">
              connect.peacetweet@gmail.com
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
