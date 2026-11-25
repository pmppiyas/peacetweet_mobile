import React from 'react';
import { ScrollView, View, Text, Pressable, Linking } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';
import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/navMetrics';

export default function PurposeScreen() {
  const { locale, theme } = useUi();
  const isDark = theme === 'dark';

  const cardSurfaceStyle = {
    backgroundColor: isDark ? '#242526' : '#ffffff',
  };

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
      scrollEventThrottle={16}
      contentContainerStyle={{
        paddingTop: 60,
        paddingBottom: BOTTOM_NAV_CLEARANCE,
      }}
      showsVerticalScrollIndicator={false}>
      <View className="w-full max-w-[768px] mx-auto" style={{ gap: 8 }}>
        {/* Hero Card */}
        <View style={cardSurfaceStyle} className="w-full px-3.5 py-4">
          <View className="flex-row items-center gap-3 mb-2.5">
            <View
              style={{
                backgroundColor: isDark ? 'rgba(5, 150, 105, 0.16)' : '#ecfdf5',
              }}
              className="h-11 w-11 rounded-2xl items-center justify-center shrink-0">
              <AppIcon android="auto_awesome" size={22} color="#059669" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-[18px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'আমাদের উদ্দেশ্য ও নীতিমালা' : 'Our Purpose & Mission'}
              </Text>
            </View>
          </View>
          <Text className="text-[15px] leading-[22px] text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn'
              ? 'চোখের যিনামুক্ত, বিজ্ঞাপনমুক্ত ও প্রামাণিক দ্বীনি জ্ঞানের একটি পরিচ্ছন্ন ডিজিটাল সোশ্যাল স্পেস।'
              : 'A gaze-protected, ad-free social space dedicated to authentic Islamic knowledge and peace of heart.'}
          </Text>
        </View>

        {/* Pillars */}
        <View style={{ gap: 8 }}>
          {principles.map((item) => {
            const title = locale === 'bn' ? item.titleBn : item.titleEn;
            const desc = locale === 'bn' ? item.descBn : item.descEn;

            return (
              <View
                key={item.id}
                style={cardSurfaceStyle}
                className="w-full px-3.5 py-4 flex-row items-start gap-3.5">
                <View
                  style={{ backgroundColor: `${item.color}18` }}
                  className="h-11 w-11 rounded-2xl items-center justify-center shrink-0 mt-0.5">
                  <AppIcon android={item.icon} size={22} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] mb-1.5">
                    {title}
                  </Text>
                  <Text className="text-[15px] text-[#65676b] dark:text-[#b0b3b8] leading-[22px]">
                    {desc}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Official Contact Footer */}
        <View style={cardSurfaceStyle} className="w-full px-3.5 py-4 items-center">
          <View
            style={{
              backgroundColor: isDark ? 'rgba(8, 102, 255, 0.16)' : '#eff6ff',
            }}
            className="h-11 w-11 rounded-2xl items-center justify-center mb-2.5">
            <AppIcon android="mail" size={22} color="#0866FF" />
          </View>
          <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] mb-1">
            {locale === 'bn' ? 'অফিসিয়াল যোগাযোগ' : 'Official Contact'}
          </Text>
          <Text className="text-[15px] leading-[22px] text-[#65676b] dark:text-[#b0b3b8] text-center mb-3.5">
            {locale === 'bn'
              ? 'পরামর্শ, সহযোগিতা বা সংশোধনের জন্য সরাসরি ইমেইল করুন:'
              : 'For suggestions, collaborations, or verification, reach us at:'}
          </Text>
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
    </ScrollView>
  );
}
