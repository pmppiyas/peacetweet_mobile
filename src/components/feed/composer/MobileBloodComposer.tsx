import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { LocationSelector, LocationValue } from '@/components/ui/LocationSelector';
import { matchUserLocationToGeo } from '@/constants/bangladeshGeo';

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

function getDefaultNeededDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

/** Shared blood request composer form state, auto-fill, reset & validation hook. */
export function useBloodComposerForm(user: any) {
  const [forMyself, setForMyself] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [units, setUnits] = useState('1');
  const [hospitalName, setHospitalName] = useState('');
  const [locationValue, setLocationValue] = useState<LocationValue>(() =>
    matchUserLocationToGeo(user)
  );
  const [contactNumber, setContactNumber] = useState('');
  const [alternateContact, setAlternateContact] = useState('');
  const [neededDate, setNeededDate] = useState(getDefaultNeededDate);
  const [problem, setProblem] = useState('');
  const [bloodNote, setBloodNote] = useState('');

  // Sync location initially when user loads without overwriting user edits
  useEffect(() => {
    if (user) {
      const userGeo = matchUserLocationToGeo(user);
      if (userGeo.location) {
        setLocationValue((prev) => (!prev.location ? userGeo : prev));
      }
    }
  }, [user]);

  // Auto-fill patient details from user profile when "For Myself" is checked
  useEffect(() => {
    if (forMyself && user) {
      if (user.name) setPatientName(user.name);
      if (user.bloodGroup) {
        const bgVal = mapToBloodGroupValue(user.bloodGroup);
        if (bgVal) setBloodGroup(bgVal);
      }
      const userGeo = matchUserLocationToGeo(user);
      if (userGeo.location) setLocationValue(userGeo);
    }
  }, [forMyself, user]);

  const effectivePatientName = (
    forMyself ? user?.name || patientName : patientName
  ).trim();

  const isValid = Boolean(
    bloodGroup &&
      effectivePatientName &&
      hospitalName.trim() &&
      (locationValue.location?.trim() || locationValue.districtId) &&
      contactNumber.trim()
  );

  const getMissingFieldMessage = useCallback(
    (locale: string): string | null => {
      if (!bloodGroup) {
        return locale === 'bn'
          ? 'অনুগ্রহ করে রক্তের গ্রুপ নির্বাচন করুন।'
          : 'Please select a blood group.';
      }
      if (!effectivePatientName) {
        return locale === 'bn'
          ? 'অনুগ্রহ করে রোগীর নাম লিখুন।'
          : 'Please enter the patient name.';
      }
      if (!hospitalName.trim()) {
        return locale === 'bn'
          ? 'অনুগ্রহ করে হাসপাতালের নাম লিখুন।'
          : 'Please enter the hospital name.';
      }
      if (!locationValue.location?.trim() && !locationValue.districtId) {
        return locale === 'bn'
          ? 'অনুগ্রহ করে বিভাগ ও জেলা নির্বাচন করুন।'
          : 'Please select Division and District.';
      }
      if (!contactNumber.trim()) {
        return locale === 'bn'
          ? 'অনুগ্রহ করে যোগাযোগের মোবাইল নম্বর দিন।'
          : 'Please enter a contact phone number.';
      }
      return null;
    },
    [bloodGroup, effectivePatientName, hospitalName, locationValue, contactNumber]
  );

  const reset = useCallback(() => {
    setForMyself(false);
    setPatientName('');
    setBloodGroup('');
    setUnits('1');
    setHospitalName('');
    setLocationValue(matchUserLocationToGeo(user));
    setContactNumber('');
    setAlternateContact('');
    setNeededDate(getDefaultNeededDate());
    setProblem('');
    setBloodNote('');
  }, [user]);

  const hydrate = useCallback((br: any) => {
    if (!br) return;
    setForMyself(Boolean(br.forMyself));
    setPatientName(br.patientName || '');
    if (br.bloodGroup) {
      setBloodGroup(mapToBloodGroupValue(br.bloodGroup));
    }
    setUnits(String(br.units || 1));
    setHospitalName(br.hospitalName || '');
    setLocationValue({
      country: br.country || 'Bangladesh',
      countryCode: br.countryCode || 'BD',
      state: br.state || '',
      city: br.city || '',
      location: br.location || '',
    });
    setContactNumber(br.contactNumber || '');
    setAlternateContact(br.alternateContact || '');
    if (br.neededDate) {
      setNeededDate(new Date(br.neededDate).toISOString());
    }
    setProblem(br.problem || '');
    setBloodNote(br.note || '');
  }, []);

  const composerProps = {
    bloodGroup,
    onChangeBloodGroup: setBloodGroup,
    forMyself,
    onToggleForMyself: () => setForMyself((prev) => !prev),
    patientName,
    onChangePatientName: setPatientName,
    units,
    onChangeUnits: setUnits,
    hospitalName,
    onChangeHospitalName: setHospitalName,
    locationValue,
    onChangeLocationValue: setLocationValue,
    contactNumber,
    onChangeContactNumber: setContactNumber,
    alternateContact,
    onChangeAlternateContact: setAlternateContact,
    neededDate,
    onChangeNeededDate: setNeededDate,
    problem,
    onChangeProblem: setProblem,
    bloodNote,
    onChangeBloodNote: setBloodNote,
  };

  return {
    forMyself,
    patientName,
    effectivePatientName,
    bloodGroup,
    units,
    hospitalName,
    locationValue,
    contactNumber,
    alternateContact,
    neededDate,
    problem,
    bloodNote,
    isValid,
    getMissingFieldMessage,
    reset,
    hydrate,
    composerProps,
  };
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
  onInputFocus?: () => void;
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
  onInputFocus,
}: MobileBloodComposerProps) {
  const placeholderColor = theme === 'dark' ? '#6e6e73' : '#8e8e93';
  const dividerColor = theme === 'dark' ? '#2a2b2d' : '#eceef2';
  const sectionDivider = (
    <View style={{ height: 1, width: '100%', backgroundColor: dividerColor }} />
  );

  return (
    <View style={{ gap: 16 }}>
      {/* ────────────────── SECTION 1: BLOOD & PATIENT INFO ────────────────── */}
      <View style={{ gap: 14 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="h-7 w-7 rounded-full bg-rose-100 dark:bg-rose-950/70 items-center justify-center">
              <AppIcon android="water_drop" size={16} color="#e11d48" />
            </View>
            <Text className="text-[15px] font-bold text-[#1c1e21] dark:text-[#e4e6eb]">
              {locale === 'bn'
                ? 'রোগী ও রক্তের তথ্য'
                : 'Blood & Patient Info'}
            </Text>
          </View>
          <View className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60">
            <Text className="text-[10.5px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              {locale === 'bn' ? 'জরুরি' : 'Emergency'}
            </Text>
          </View>
        </View>

        {/* 1. Blood Group Needed */}
        <View className="gap-2">
          <Text className="text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn'
              ? 'রক্তের গ্রুপ নির্বাচন করুন *'
              : 'Blood Group Needed *'}
          </Text>

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
                    className={`text-[14.5px] ${
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
              <AppIcon android="warning" size={15} color="#d97706" />
              <Text className="text-[12.5px] text-amber-700 dark:text-amber-400 font-medium flex-1">
                {locale === 'bn'
                  ? 'প্রোফাইলে রক্তের গ্রুপ যুক্ত নেই, এখান থেকে বেছে নিন'
                  : 'Blood group not set in profile, please select here'}
              </Text>
            </View>
          )}
        </View>

        {/* 2. Patient Name with "For myself" Toggle */}
        <View className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
              {locale === 'bn' ? 'রোগীর নাম *' : 'Patient Name *'}
            </Text>

            <Pressable
              onPress={onToggleForMyself}
              className="flex-row items-center gap-1.5 py-1 px-1 rounded-lg active:opacity-75">
              <AppIcon
                android={forMyself ? 'check_box' : 'check_box_outline_blank'}
                size={19}
                color={forMyself ? '#e11d48' : theme === 'dark' ? '#8e8e93' : '#65676b'}
              />
              <Text
                className={`text-[13.5px] ${
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
            onFocus={() => onInputFocus?.()}
            placeholder={
              locale === 'bn' ? 'রোগীর পূর্ণ নাম' : 'Patient Full Name'
            }
            placeholderTextColor={placeholderColor}
            className="w-full h-12 rounded-2xl bg-[#f0f2f5] dark:bg-[#242526] px-4 text-[15px] text-[#050505] dark:text-[#e4e6eb] border border-transparent focus:border-rose-400"
          />
        </View>

        {/* 3. Units (Bags) Needed - Stepper & Quick Chips */}
        <View className="gap-1.5">
          <Text className="text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
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
              <View className="px-2.5 min-w-[58px] items-center justify-center">
                <Text className="text-[13.5px] font-black text-[#050505] dark:text-[#e4e6eb]">
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
                    className={`text-[13px] font-bold ${
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
      </View>

      {sectionDivider}

      {/* ────────────────── SECTION 2: HOSPITAL, LOCATION & TIME ────────────────── */}
      <View style={{ gap: 14 }}>
        <View className="flex-row items-center gap-2">
          <View className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-950/70 items-center justify-center">
            <AppIcon android="local_hospital" size={16} color="#0866FF" />
          </View>
          <Text className="text-[15px] font-bold text-[#1c1e21] dark:text-[#e4e6eb]">
            {locale === 'bn'
              ? 'হাসপাতাল, লোকেশন ও সময়'
              : 'Hospital, Location & Time'}
          </Text>
        </View>

        {/* 4. Hospital Name */}
        <View className="gap-1.5">
          <Text className="text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn' ? 'হাসপাতালের নাম *' : 'Hospital Name *'}
          </Text>
          <View className="relative justify-center">
            <TextInput
              value={hospitalName}
              onChangeText={onChangeHospitalName}
              onFocus={() => onInputFocus?.()}
              placeholder={
                locale === 'bn'
                  ? 'যেমন: ঢাকা মেডিকেল কলেজ হাসপাতাল'
                  : 'e.g. Dhaka Medical College Hospital'
              }
              placeholderTextColor={placeholderColor}
              className="w-full h-12 rounded-2xl border border-transparent bg-[#f0f2f5] dark:bg-[#242526] px-4 pr-11 text-[15px] text-[#050505] dark:text-[#e4e6eb] focus:border-rose-400"
            />
            <View className="absolute right-3.5">
              <AppIcon android="local_hospital" size={18} color="#e11d48" />
            </View>
          </View>
        </View>

        {/* 5. Location of Blood Need */}
        <View className="gap-1.5">
          <View className="flex-row items-center gap-1.5">
            <AppIcon android="pin_drop" size={17} color="#e11d48" />
            <Text className="text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
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

        {/* 6. Needed Date & Time */}
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

      {sectionDivider}

      {/* ────────────────── SECTION 3: CONTACT DETAILS ────────────────── */}
      <View style={{ gap: 14 }}>
        <View className="flex-row items-center gap-2">
          <View className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-950/70 items-center justify-center">
            <AppIcon android="call" size={16} color="#059669" />
          </View>
          <Text className="text-[15px] font-bold text-[#1c1e21] dark:text-[#e4e6eb]">
            {locale === 'bn' ? 'যোগাযোগের তথ্য' : 'Contact Details'}
          </Text>
        </View>

        <View className="flex-row gap-2.5">
          <View className="flex-1 gap-1.5">
            <Text className="text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
              {locale === 'bn' ? 'মোবাইল নম্বর *' : 'Contact Phone *'}
            </Text>
            <View className="relative justify-center">
              <TextInput
                value={contactNumber}
                onChangeText={onChangeContactNumber}
                onFocus={() => onInputFocus?.()}
                placeholder="017XXXXXXXX"
                keyboardType="phone-pad"
                placeholderTextColor={placeholderColor}
                className="w-full h-12 rounded-2xl border border-transparent bg-[#f0f2f5] dark:bg-[#242526] px-4 pr-9 text-[15px] text-[#050505] dark:text-[#e4e6eb] focus:border-rose-400"
              />
              <View className="absolute right-3">
                <AppIcon android="call" size={17} color="#e11d48" />
              </View>
            </View>
          </View>

          <View className="flex-1 gap-1.5">
            <Text className="text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
              {locale === 'bn' ? 'বিকল্প নম্বর (ঐচ্ছিক)' : 'Alternate Phone'}
            </Text>
            <View className="relative justify-center">
              <TextInput
                value={alternateContact}
                onChangeText={onChangeAlternateContact}
                onFocus={() => onInputFocus?.()}
                placeholder="018XXXXXXXX"
                keyboardType="phone-pad"
                placeholderTextColor={placeholderColor}
                className="w-full h-12 rounded-2xl border border-transparent bg-[#f0f2f5] dark:bg-[#242526] px-4 pr-9 text-[15px] text-[#050505] dark:text-[#e4e6eb] focus:border-rose-400"
              />
              <View className="absolute right-3">
                <AppIcon
                  android="phone_iphone"
                  size={17}
                  color={placeholderColor}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      {sectionDivider}

      {/* ────────────────── SECTION 4: ADDITIONAL DETAILS (OPTIONAL) ────────────────── */}
      <View style={{ gap: 14 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-950/70 items-center justify-center">
              <AppIcon android="info" size={16} color="#d97706" />
            </View>
            <Text className="text-[15px] font-bold text-[#1c1e21] dark:text-[#e4e6eb]">
              {locale === 'bn'
                ? 'অতিরিক্ত তথ্য'
                : 'Additional Details'}
            </Text>
          </View>
          <View className="px-2.5 py-0.5 rounded-full bg-[#f0f2f5] dark:bg-[#242526]">
            <Text className="text-[10.5px] font-bold text-[#65676b] dark:text-[#b0b3b8] uppercase tracking-wider">
              {locale === 'bn' ? 'ঐচ্ছিক' : 'Optional'}
            </Text>
          </View>
        </View>

        {/* 8. Medical Reason / Problem (Optional) */}
        <View className="gap-1.5">
          <Text className="text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn' ? 'রোগের কারণ বা সমস্যা' : 'Medical Reason / Problem'}
          </Text>
          <TextInput
            value={problem}
            onChangeText={onChangeProblem}
            onFocus={() => onInputFocus?.()}
            placeholder={
              locale === 'bn'
                ? 'যেমন: ডেলিভারি রোগী, রক্তের হিমোগ্লোবিন কমে গেছে'
                : 'e.g. Delivery patient, low hemoglobin'
            }
            placeholderTextColor={placeholderColor}
            className="w-full h-12 rounded-2xl border border-transparent bg-[#f0f2f5] dark:bg-[#242526] px-4 text-[15px] text-[#050505] dark:text-[#e4e6eb] focus:border-rose-400"
          />
        </View>

        {/* 9. Additional Note (Optional) */}
        <View className="gap-1.5">
          <Text className="text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn' ? 'জরুরি নির্দেশনা বা নোট' : 'Additional Note'}
          </Text>
          <TextInput
            value={bloodNote}
            onChangeText={onChangeBloodNote}
            onFocus={() => onInputFocus?.()}
            placeholder={
              locale === 'bn'
                ? 'যেমন: রোগীর অবস্থা আশঙ্কাজনক বা দ্রুত যোগাযোগ করুন'
                : 'e.g. Please call only if you can donate'
            }
            placeholderTextColor={placeholderColor}
            className="w-full h-12 rounded-2xl border border-transparent bg-[#f0f2f5] dark:bg-[#242526] px-4 text-[15px] text-[#050505] dark:text-[#e4e6eb] focus:border-rose-400"
          />
        </View>
      </View>
    </View>
  );
}
