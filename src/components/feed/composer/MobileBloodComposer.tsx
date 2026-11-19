import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { LocationSelector, LocationValue } from '@/components/ui/LocationSelector';

export const BLOOD_GROUPS = [
  { label: 'A+', value: 'A_POSITIVE' },
  { label: 'A-', value: 'A_NEGATIVE' },
  { label: 'B+', value: 'B_POSITIVE' },
  { label: 'B-', value: 'B_NEGATIVE' },
  { label: 'AB+', value: 'AB_POSITIVE' },
  { label: 'AB-', value: 'AB_NEGATIVE' },
  { label: 'O+', value: 'O_POSITIVE' },
  { label: 'O-', value: 'O_NEGATIVE' },
];

export function mapToBloodGroupValue(bg?: string | null): string {
  if (!bg || bg === 'NONE') return '';
  const normalized = bg.trim().toUpperCase();
  const directMatch = BLOOD_GROUPS.find(
    (g) => g.value === normalized || g.label === normalized
  );
  if (directMatch) return directMatch.value;

  const converted = normalized
    .replace('+', '_POSITIVE')
    .replace('-', '_NEGATIVE');
  const convertedMatch = BLOOD_GROUPS.find((g) => g.value === converted);
  if (convertedMatch) return convertedMatch.value;

  return '';
}

export interface MobileBloodComposerProps {
  bloodGroup: string;
  onChangeBloodGroup: (val: string) => void;
  forMyself: boolean;
  onToggleForMyself: () => void;
  patientName: string;
  onChangePatientName: (val: string) => void;
  units: string;
  onChangeUnits: (val: string) => void;
  hospitalName: string;
  onChangeHospitalName: (val: string) => void;
  locationValue: LocationValue;
  onChangeLocationValue: (val: LocationValue) => void;
  contactNumber: string;
  onChangeContactNumber: (val: string) => void;
  alternateContact: string;
  onChangeAlternateContact: (val: string) => void;
  neededDate: string;
  onChangeNeededDate: (val: string) => void;
  problem: string;
  onChangeProblem: (val: string) => void;
  bloodNote: string;
  onChangeBloodNote: (val: string) => void;
  user: any;
  theme?: 'light' | 'dark';
  locale?: string;
}

export function MobileBloodComposer({
  bloodGroup,
  onChangeBloodGroup,
  forMyself,
  onToggleForMyself,
  patientName,
  onChangePatientName,
  units,
  onChangeUnits,
  hospitalName,
  onChangeHospitalName,
  locationValue,
  onChangeLocationValue,
  contactNumber,
  onChangeContactNumber,
  alternateContact,
  onChangeAlternateContact,
  neededDate,
  onChangeNeededDate,
  problem,
  onChangeProblem,
  bloodNote,
  onChangeBloodNote,
  user,
  theme = 'light',
  locale = 'bn',
}: MobileBloodComposerProps) {
  const placeholderColor = theme === 'dark' ? '#6e6e73' : '#8e8e93';

  return (
    <View className="gap-4 pb-4">
      {/* 1. BLOOD GROUP SELECTION */}
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <AppIcon android="water_drop" size={17} color="#e11d48" />
            <Text className="text-xs font-bold text-[#1c1e21] dark:text-[#e4e6eb]">
              {locale === 'bn'
                ? 'রক্তের গ্রুপ নির্বাচন করুন *'
                : 'Blood Group Needed *'}
            </Text>
          </View>
          <View className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60">
            <Text className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Emergency
            </Text>
          </View>
        </View>

        {/* 4x2 Clean Grid of Blood Groups */}
        <View className="flex-row flex-wrap gap-2">
          {BLOOD_GROUPS.map((group) => {
            const isSelected = bloodGroup === group.value;
            return (
              <Pressable
                key={group.value}
                onPress={() => onChangeBloodGroup(group.value)}
                className={`w-[22.8%] h-11 rounded-2xl items-center justify-center active:scale-95 ${
                  isSelected
                    ? 'bg-rose-600 border border-rose-600 shadow-md shadow-rose-500/25'
                    : 'bg-[#f0f2f5] dark:bg-[#242526] border border-transparent'
                }`}>
                <Text
                  className={`text-[13px] ${
                    isSelected
                      ? 'font-black text-white'
                      : 'font-bold text-[#1c1e21] dark:text-[#e4e6eb]'
                  }`}>
                  {group.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {forMyself && !user?.bloodGroup && (
          <View className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 mt-0.5">
            <AppIcon android="warning" size={14} color="#d97706" />
            <Text className="text-[11px] text-amber-700 dark:text-amber-400 font-medium flex-1">
              {locale === 'bn'
                ? 'প্রোফাইলে রক্তের গ্রুপ যুক্ত নেই, এখান থেকে বেছে নিন'
                : 'Blood group not set in profile, please select here'}
            </Text>
          </View>
        )}
      </View>

      {/* 2. PATIENT NAME WITH "FOR MYSELF" TOGGLE */}
      <View className="gap-1.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn' ? 'রোগীর নাম *' : 'Patient Name *'}
          </Text>

          {/* "For myself" Toggle */}
          <Pressable
            onPress={onToggleForMyself}
            className="flex-row items-center gap-1.5 py-1 px-1 rounded-lg active:opacity-75">
            <AppIcon
              android={forMyself ? 'check_box' : 'check_box_outline_blank'}
              size={18}
              color={forMyself ? '#e11d48' : theme === 'dark' ? '#8e8e93' : '#65676b'}
            />
            <Text
              className={`text-xs ${
                forMyself
                  ? 'font-bold text-rose-600 dark:text-rose-400'
                  : 'font-semibold text-[#65676b] dark:text-[#b0b3b8]'
              }`}>
              {locale === 'bn' ? 'নিজের জন্য' : 'For myself'}
            </Text>
          </Pressable>
        </View>

        <TextInput
          value={patientName}
          onChangeText={onChangePatientName}
          placeholder={
            locale === 'bn' ? 'রোগীর পূর্ণ নাম' : 'Patient Full Name'
          }
          placeholderTextColor={placeholderColor}
          className="w-full h-11 rounded-2xl bg-[#f0f2f5] dark:bg-[#242526] px-3.5 text-xs text-[#050505] dark:text-[#e4e6eb] border border-transparent focus:border-rose-400"
        />
      </View>

      {/* 3. UNITS (BAGS) NEEDED - STEPPER & QUICK CHIPS */}
      <View className="gap-1.5">
        <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
          {locale === 'bn' ? 'কত ব্যাগ রক্ত প্রয়োজন *' : 'Units (Bags) Needed *'}
        </Text>
        <View className="flex-row items-center gap-2">
          {/* Stepper Controls */}
          <View className="flex-row items-center h-11 rounded-2xl bg-[#f0f2f5] dark:bg-[#242526] p-1 border border-transparent">
            <Pressable
              onPress={() => {
                const cur = parseInt(units, 10) || 1;
                if (cur > 1) onChangeUnits((cur - 1).toString());
              }}
              className="h-9 w-9 rounded-xl items-center justify-center bg-white dark:bg-[#18191a] active:scale-95 shadow-xs">
              <AppIcon android="remove" size={16} color="#e11d48" />
            </Pressable>
            <View className="px-3 min-w-[56px] items-center justify-center">
              <Text className="text-xs font-black text-[#050505] dark:text-[#e4e6eb]">
                {units || '1'} {locale === 'bn' ? 'ব্যাগ' : 'Bag'}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                const cur = parseInt(units, 10) || 0;
                onChangeUnits((cur + 1).toString());
              }}
              className="h-9 w-9 rounded-xl items-center justify-center bg-white dark:bg-[#18191a] active:scale-95 shadow-xs">
              <AppIcon android="add" size={16} color="#e11d48" />
            </Pressable>
          </View>

          {/* Quick Select Chips */}
          {['1', '2', '3', '4'].map((num) => {
            const isSelected = units === num;
            return (
              <Pressable
                key={num}
                onPress={() => onChangeUnits(num)}
                className={`h-11 flex-1 rounded-2xl items-center justify-center active:scale-95 border ${
                  isSelected
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800'
                    : 'bg-[#f0f2f5] dark:bg-[#242526] border-transparent'
                }`}>
                <Text
                  className={`text-xs font-bold ${
                    isSelected
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-[#65676b] dark:text-[#b0b3b8]'
                  }`}>
                  {num} {locale === 'bn' ? 'ব্যাগ' : 'Bag'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 4. HOSPITAL NAME */}
      <View className="gap-1.5">
        <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
          {locale === 'bn' ? 'হাসপাতালের নাম *' : 'Hospital Name *'}
        </Text>
        <View className="relative justify-center">
          <TextInput
            value={hospitalName}
            onChangeText={onChangeHospitalName}
            placeholder={
              locale === 'bn'
                ? 'যেমন: ঢাকা মেডিকেল কলেজ হাসপাতাল'
                : 'e.g. Dhaka Medical College Hospital'
            }
            placeholderTextColor={placeholderColor}
            className="w-full h-11 rounded-2xl border border-transparent bg-[#f0f2f5] dark:bg-[#242526] px-3.5 pr-10 text-xs text-[#050505] dark:text-[#e4e6eb] focus:border-rose-400"
          />
          <View className="absolute right-3.5">
            <AppIcon android="local_hospital" size={18} color="#e11d48" />
          </View>
        </View>
      </View>

      {/* 5. LOCATION OF BLOOD NEED */}
      <View className="gap-1.5">
        <View className="flex-row items-center gap-1.5">
          <AppIcon android="pin_drop" size={17} color="#e11d48" />
          <Text className="text-xs font-bold text-[#1c1e21] dark:text-[#e4e6eb]">
            {locale === 'bn'
              ? 'রক্তের প্রয়োজনস্থল (লোকেশন) *'
              : 'Location of Blood Need *'}
          </Text>
        </View>
        <LocationSelector
          value={locationValue}
          onChange={onChangeLocationValue}
          required={true}
        />
      </View>

      {/* 6. CONTACT NUMBERS */}
      <View className="flex-row gap-2.5">
        <View className="flex-1 gap-1.5">
          <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn' ? 'মোবাইল নম্বর *' : 'Contact Phone *'}
          </Text>
          <View className="relative justify-center">
            <TextInput
              value={contactNumber}
              onChangeText={onChangeContactNumber}
              placeholder="017XXXXXXXX"
              keyboardType="phone-pad"
              placeholderTextColor={placeholderColor}
              className="w-full h-11 rounded-2xl border border-transparent bg-[#f0f2f5] dark:bg-[#242526] px-3.5 pr-9 text-xs text-[#050505] dark:text-[#e4e6eb] focus:border-rose-400"
            />
            <View className="absolute right-3">
              <AppIcon android="call" size={16} color="#e11d48" />
            </View>
          </View>
        </View>

        <View className="flex-1 gap-1.5">
          <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn' ? 'বিকল্প নম্বর (ঐচ্ছিক)' : 'Alternate Phone'}
          </Text>
          <View className="relative justify-center">
            <TextInput
              value={alternateContact}
              onChangeText={onChangeAlternateContact}
              placeholder="018XXXXXXXX"
              keyboardType="phone-pad"
              placeholderTextColor={placeholderColor}
              className="w-full h-11 rounded-2xl border border-transparent bg-[#f0f2f5] dark:bg-[#242526] px-3.5 pr-9 text-xs text-[#050505] dark:text-[#e4e6eb] focus:border-rose-400"
            />
            <View className="absolute right-3">
              <AppIcon
                android="phone_iphone"
                size={16}
                color={placeholderColor}
              />
            </View>
          </View>
        </View>
      </View>

      {/* 7. NEEDED DATE & TIME */}
      <View className="gap-1.5">
        <DateTimePicker
          label={
            locale === 'bn'
              ? 'কখন রক্তের প্রয়োজন? (তারিখ ও সময়)'
              : 'Needed Date & Time'
          }
          value={neededDate}
          onChange={onChangeNeededDate}
          required={true}
        />
      </View>

      {/* 8. MEDICAL REASON / PROBLEM (OPTIONAL) */}
      <View className="gap-1.5">
        <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
          {locale === 'bn' ? 'রোগের কারণ বা সমস্যা (ঐচ্ছিক)' : 'Medical Reason / Problem (Optional)'}
        </Text>
        <TextInput
          value={problem}
          onChangeText={onChangeProblem}
          placeholder={
            locale === 'bn'
              ? 'যেমন: ডেলিভারি রোগী, রক্তের হিমোগ্লোবিন কমে গেছে'
              : 'e.g. Delivery patient, low hemoglobin'
          }
          placeholderTextColor={placeholderColor}
          className="w-full h-11 rounded-2xl border border-transparent bg-[#f0f2f5] dark:bg-[#242526] px-3.5 text-xs text-[#050505] dark:text-[#e4e6eb] focus:border-rose-400"
        />
      </View>

      {/* 9. ADDITIONAL NOTE (OPTIONAL) */}
      <View className="gap-1.5">
        <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
          {locale === 'bn' ? 'জরুরি নির্দেশনা বা নোট (ঐচ্ছিক)' : 'Additional Note (Optional)'}
        </Text>
        <TextInput
          value={bloodNote}
          onChangeText={onChangeBloodNote}
          placeholder={
            locale === 'bn'
              ? 'যেমন: রোগীর অবস্থা আশঙ্কাজনক বা দ্রুত যোগাযোগ করুন'
              : 'e.g. Please call only if you can donate'
          }
          placeholderTextColor={placeholderColor}
          className="w-full h-11 rounded-2xl border border-transparent bg-[#f0f2f5] dark:bg-[#242526] px-3.5 text-xs text-[#050505] dark:text-[#e4e6eb] focus:border-rose-400"
        />
      </View>
    </View>
  );
}
