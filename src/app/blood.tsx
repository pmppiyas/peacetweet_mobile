import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  Linking,
  RefreshControl,
} from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';

interface BloodRequest {
  id: string;
  patientName: string;
  bloodGroup: string;
  bagsCount: number;
  hospital: string;
  location: string;
  reason: string;
  contactNumber: string;
  date: string;
  isUrgent: boolean;
}

interface BloodDonor {
  id: string;
  name: string;
  bloodGroup: string;
  location: string;
  lastDonation: string;
  contactNumber: string;
  isAvailable: boolean;
}

const BLOOD_GROUPS = ['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const SAMPLE_REQUESTS: BloodRequest[] = [
  {
    id: 'req-1',
    patientName: 'সালমা বেগম (৫০ বছর)',
    bloodGroup: 'B+',
    bagsCount: 2,
    hospital: 'ঢাকা মেডিকেল কলেজ হাসপাতাল (DMCH)',
    location: 'ঢাকা, বাংলাদেশ',
    reason: 'জরুরি বাইপাস সার্জারি',
    contactNumber: '+8801700112233',
    date: 'আজকের মধ্যে',
    isUrgent: true,
  },
  {
    id: 'req-2',
    patientName: 'তাহমিদ আহমেদ (২৮ বছর)',
    bloodGroup: 'O+',
    bagsCount: 1,
    hospital: 'চট্টগ্রাম মা ও শিশু হাসপাতাল',
    location: 'চট্টগ্রাম, বাংলাদেশ',
    reason: 'থ্যালাসেমিয়া নিয়মিত রক্ত সঞ্চালন',
    contactNumber: '+8801811223344',
    date: 'আগামীকাল সকাল ১০টা',
    isUrgent: true,
  },
  {
    id: 'req-3',
    patientName: 'ফাতেমা জান্নাত (৮ বছর)',
    bloodGroup: 'A+',
    bagsCount: 2,
    hospital: 'রাজশাহী মেডিকেল কলেজ',
    location: 'রাজশাহী, বাংলাদেশ',
    reason: 'ডেঙ্গু প্লাটিলেট ও রক্তের প্রয়োজন',
    contactNumber: '+8801922334455',
    date: 'জরুরি প্রয়োজন',
    isUrgent: true,
  },
  {
    id: 'req-4',
    patientName: 'আব্দুর রহমান (৬২ বছর)',
    bloodGroup: 'AB-',
    bagsCount: 1,
    hospital: 'সিলেট এম এ জি ওসমানী মেডিকেল কলেজ',
    location: 'সিলেট, বাংলাদেশ',
    reason: 'কিডনি ডায়ালাইসিস ও সার্জারি',
    contactNumber: '+8801633445566',
    date: '২ দিন পর',
    isUrgent: false,
  },
];

const SAMPLE_DONORS: BloodDonor[] = [
  {
    id: 'don-1',
    name: 'মুহাম্মদ হাসান',
    bloodGroup: 'B+',
    location: 'ধানমন্ডি, ঢাকা',
    lastDonation: '৫ মাস পূর্বে',
    contactNumber: '+8801711002200',
    isAvailable: true,
  },
  {
    id: 'don-2',
    name: 'আব্দুল্লাহ আল মামুন',
    bloodGroup: 'O+',
    location: 'মিরপুর, ঢাকা',
    lastDonation: '৪ মাস পূর্বে',
    contactNumber: '+8801822113311',
    isAvailable: true,
  },
  {
    id: 'don-3',
    name: 'মো. তানভীর ইসলাম',
    bloodGroup: 'A+',
    location: 'জিইসি মোড়, চট্টগ্রাম',
    lastDonation: '৬ মাস পূর্বে',
    contactNumber: '+8801933224422',
    isAvailable: true,
  },
  {
    id: 'don-4',
    name: 'শাকিল আহমেদ',
    bloodGroup: 'AB+',
    location: 'উপশহর, রাজশাহী',
    lastDonation: '৩ মাস পূর্বে',
    contactNumber: '+8801644335533',
    isAvailable: true,
  },
];

export default function BloodScreen() {
  const { locale, theme } = useUi();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'donors'>('requests');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {});
  };

  const filteredRequests = useMemo(() => {
    if (selectedGroup === 'ALL') return SAMPLE_REQUESTS;
    return SAMPLE_REQUESTS.filter((r) => r.bloodGroup === selectedGroup);
  }, [selectedGroup]);

  const filteredDonors = useMemo(() => {
    if (selectedGroup === 'ALL') return SAMPLE_DONORS;
    return SAMPLE_DONORS.filter((d) => d.bloodGroup === selectedGroup);
  }, [selectedGroup]);

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      contentContainerStyle={{ paddingHorizontal: 6, paddingTop: 10, paddingBottom: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme === 'dark' ? '#ffffff' : '#e11d48'}
        />
      }>
      <View className="w-full max-w-[768px] mx-auto space-y-3">
        {/* Hero Card */}
        <View className="w-full rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-3 sm:p-4 shadow-xs">
          <View className="flex-row items-center gap-3 mb-2.5">
            <View className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 items-center justify-center shrink-0">
              <AppIcon android="water_drop" size={20} color="#e11d48" />
            </View>
            <View className="flex-1 min-w-0">
              <Text numberOfLines={1} className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'জরুরি রক্তদান নেটওয়ার্ক' : 'Emergency Blood Network'}
              </Text>
              <Text numberOfLines={1} className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn'
                  ? 'মুমূর্ষু রোগীর প্রয়োজনে রক্তদাতা ও আবেদনসমূহ'
                  : 'Connect donors with patients in need'}
              </Text>
            </View>
          </View>

          {/* Blood Group Chips Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
            {BLOOD_GROUPS.map((grp) => {
              const isSelected = selectedGroup === grp;
              return (
                <Pressable
                  key={grp}
                  onPress={() => setSelectedGroup(grp)}
                  className={`px-2.5 py-1 rounded-full border ${
                    isSelected
                      ? 'bg-rose-600 border-rose-600'
                      : 'bg-[#f0f2f5] dark:bg-[#3a3b3c] border-[#ced0d4] dark:border-[#4a4b4d]'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-white' : 'text-[#050505] dark:text-[#e4e6eb]'
                    }`}>
                    {grp}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Tab Switcher */}
        <View className="flex-row rounded-xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-1">
          <Pressable
            onPress={() => setActiveTab('requests')}
            className={`flex-1 py-2 items-center rounded-lg ${
              activeTab === 'requests'
                ? 'bg-rose-600 shadow-xs'
                : 'active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]'
            }`}>
            <Text
              className={`text-xs font-bold ${
                activeTab === 'requests' ? 'text-white' : 'text-[#65676b] dark:text-[#b0b3b8]'
              }`}>
              {locale === 'bn' ? 'রক্তের প্রয়োজন (আবেদন)' : 'Blood Requests'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('donors')}
            className={`flex-1 py-2 items-center rounded-lg ${
              activeTab === 'donors'
                ? 'bg-rose-600 shadow-xs'
                : 'active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]'
            }`}>
            <Text
              className={`text-xs font-bold ${
                activeTab === 'donors' ? 'text-white' : 'text-[#65676b] dark:text-[#b0b3b8]'
              }`}>
              {locale === 'bn' ? 'রক্তদাতা তালিকা' : 'Find Donors'}
            </Text>
          </Pressable>
        </View>

        {/* Content List */}
        {activeTab === 'requests' ? (
          <View className="space-y-3">
            {filteredRequests.length === 0 ? (
              <View className="rounded-2xl border border-dashed border-[#e4e6eb] dark:border-[#393a3b] p-8 items-center justify-center bg-white dark:bg-[#242526]">
                <AppIcon android="info" size={24} color="#65676b" />
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2 font-medium">
                  {locale === 'bn'
                    ? 'এই গ্রুপের জন্য কোনো জরুরি রক্তের আবেদন নেই।'
                    : 'No active blood requests found for this group.'}
                </Text>
              </View>
            ) : (
              filteredRequests.map((req) => (
                <View
                  key={req.id}
                  className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-3 shadow-xs">
                  <View className="flex-row items-start justify-between gap-3 mb-2">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="h-12 w-12 rounded-2xl bg-rose-600 items-center justify-center shrink-0 shadow-xs">
                        <Text className="text-white text-base font-black">
                          {req.bloodGroup}
                        </Text>
                      </View>
                      <View className="flex-1 min-w-0">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                            {req.patientName}
                          </Text>
                          {req.isUrgent && (
                            <View className="rounded-md bg-rose-100 dark:bg-rose-950/70 px-1.5 py-0.5 border border-rose-300 dark:border-rose-800">
                              <Text className="text-[10px] font-bold text-rose-700 dark:text-rose-300">
                                {locale === 'bn' ? 'জরুরি' : 'Urgent'}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                          {req.bagsCount} {locale === 'bn' ? 'ব্যাগ রক্ত প্রয়োজন' : 'Bags needed'} • {req.date}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleCall(req.contactNumber)}
                      className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 active:bg-emerald-700">
                      <AppIcon android="chat_bubble" size={14} color="#ffffff" />
                      <Text className="text-xs font-bold text-white">
                        {locale === 'bn' ? 'কল করুন' : 'Call'}
                      </Text>
                    </Pressable>
                  </View>

                  <View className="space-y-1 my-2 bg-[#f0f2f5]/60 dark:bg-[#3a3b3c]/40 p-2.5 rounded-xl">
                    <View className="flex-row items-center gap-1.5">
                      <AppIcon android="location_on" size={14} color="#e11d48" />
                      <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb]">
                        {req.hospital}
                      </Text>
                    </View>
                    <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] pl-5">
                      {req.location} • {locale === 'bn' ? 'কারণ:' : 'Reason:'} {req.reason}
                    </Text>
                  </View>

                  <View className="pt-2 border-t border-[#f0f2f5] dark:border-[#393a3b] flex-row items-center justify-between">
                    <Text
                      selectable
                      className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400 select-text">
                      {req.contactNumber}
                    </Text>
                    <Text className="text-[11px] text-[#8a8d91]">
                      {locale === 'bn' ? 'ভেরিফাইড রিকোয়েস্ট' : 'Verified Request'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View className="space-y-3">
            {filteredDonors.length === 0 ? (
              <View className="rounded-2xl border border-dashed border-[#e4e6eb] dark:border-[#393a3b] p-8 items-center justify-center bg-white dark:bg-[#242526]">
                <AppIcon android="info" size={24} color="#65676b" />
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2 font-medium">
                  {locale === 'bn'
                    ? 'এই গ্রুপের জন্য কোনো রক্তদাতা পাওয়া যায়নি।'
                    : 'No donors registered for this group yet.'}
                </Text>
              </View>
            ) : (
              filteredDonors.map((don) => (
                <View
                  key={don.id}
                  className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-3 shadow-xs flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3 flex-1 pr-3">
                    <View className="h-11 w-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 items-center justify-center shrink-0">
                      <Text className="text-rose-600 dark:text-rose-400 text-sm font-black">
                        {don.bloodGroup}
                      </Text>
                    </View>
                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                          {don.name}
                        </Text>
                        <AppIcon android="verified" size={14} color="#1877f2" />
                      </View>
                      <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                        {don.location} • {locale === 'bn' ? 'শেষ রক্তদান:' : 'Last:'} {don.lastDonation}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleCall(don.contactNumber)}
                    className="px-3 py-2 rounded-xl bg-primary-500 active:bg-primary-600">
                    <Text className="text-xs font-bold text-white">
                      {locale === 'bn' ? 'যোগাযোগ' : 'Contact'}
                    </Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
