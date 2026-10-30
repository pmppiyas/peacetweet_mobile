import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';
import { AuthPromptCard } from '@/components/ui/AuthPromptCard';
import { LocationSelector, LocationValue } from '@/components/ui/LocationSelector';
import { matchUserLocationToGeo } from '@/constants/bangladeshGeo';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { SELECTABLE_GROUPS, toBackendBloodGroup } from '../utils/blood.utils';
import { BloodRequestItem } from '../types/blood.types';

const webNoOutline = Platform.OS === 'web' ? ({
  outlineStyle: 'none',
  outlineWidth: 0,
  outlineColor: 'transparent',
  outline: 'none',
  boxShadow: 'none',
} as any) : undefined;

export interface BloodCreateTabProps {
  onSubmitOptimistic: (optimisticItem: BloodRequestItem, payload: any) => void;
  onScrollTo?: (y: number) => void;
}

export function BloodCreateTab({ onSubmitOptimistic, onScrollTo }: BloodCreateTabProps) {
  const { locale, theme, setIsUploadingPost } = useUi();
  const { isAuthenticated, user } = useAuth();

  // Field element refs for focusing and scrolling
  const patientNameRef = useRef<any>(null);
  const unitsRef = useRef<any>(null);
  const hospitalRef = useRef<any>(null);
  const locationRef = useRef<any>(null);
  const contactRef = useRef<any>(null);

  // Field Y layout offsets for scrolling
  const fieldOffsets = useRef<Record<string, number>>({});

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    patientName?: boolean;
    units?: boolean;
    hospital?: boolean;
    location?: boolean;
    contact?: boolean;
  }>({});

  // Form State
  const [forMyself, setForMyself] = useState(false);
  const [formPatientName, setFormPatientName] = useState('');
  const [formPatientAge, setFormPatientAge] = useState('');
  const [formProblem, setFormProblem] = useState('');
  const [formBloodGroup, setFormBloodGroup] = useState('A+');
  const [formUnits, setFormUnits] = useState('1');
  const [formNeededDate, setFormNeededDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d.toISOString();
  });
  const [formHospital, setFormHospital] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formAlternateContact, setFormAlternateContact] = useState('');
  const [locationValue, setLocationValue] = useState<LocationValue>(() =>
    matchUserLocationToGeo(user)
  );

  // Sync location initially from user profile if user has a set location
  useEffect(() => {
    if (user) {
      const userGeo = matchUserLocationToGeo(user);
      if (userGeo.location) {
        setLocationValue((prev) => {
          if (!prev.location) {
            return userGeo;
          }
          return prev;
        });
      }
    }
  }, [user]);

  // Auto fill name & location if forMyself is checked
  useEffect(() => {
    if (forMyself && user) {
      if (user.name) {
        setFormPatientName(user.name);
        setFieldErrors((p) => ({ ...p, patientName: false }));
      }
      const userGeo = matchUserLocationToGeo(user);
      if (userGeo.location) {
        setLocationValue(userGeo);
        setFieldErrors((p) => ({ ...p, location: false }));
      }
    }
  }, [forMyself, user]);

  const handleCreateRequest = async () => {
    const nameToUse = forMyself ? user?.name || formPatientName : formPatientName;

    // Validate required fields
    const newErrors: {
      patientName?: boolean;
      units?: boolean;
      hospital?: boolean;
      location?: boolean;
      contact?: boolean;
    } = {};

    let firstErrorField: 'patientName' | 'units' | 'hospital' | 'location' | 'contact' | null = null;

    if (!nameToUse.trim()) {
      newErrors.patientName = true;
      if (!firstErrorField) firstErrorField = 'patientName';
    }

    if (!formUnits.trim() || parseInt(formUnits, 10) <= 0) {
      newErrors.units = true;
      if (!firstErrorField) firstErrorField = 'units';
    }

    if (!formHospital.trim()) {
      newErrors.hospital = true;
      if (!firstErrorField) firstErrorField = 'hospital';
    }

    if (!locationValue.location?.trim() || !locationValue.districtId) {
      newErrors.location = true;
      if (!firstErrorField) firstErrorField = 'location';
    }

    if (!formContact.trim()) {
      newErrors.contact = true;
      if (!firstErrorField) firstErrorField = 'contact';
    }

    if (firstErrorField) {
      setFieldErrors(newErrors);

      // Auto-scroll to first error field
      const targetY = fieldOffsets.current[firstErrorField];
      if (typeof targetY === 'number') {
        onScrollTo?.(targetY);
      }

      const refMap: Record<string, any> = {
        patientName: patientNameRef,
        units: unitsRef,
        hospital: hospitalRef,
        location: locationRef,
        contact: contactRef,
      };

      const targetRef = refMap[firstErrorField]?.current;
      if (targetRef) {
        if (Platform.OS === 'web' && typeof targetRef.scrollIntoView === 'function') {
          targetRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (typeof targetRef.focus === 'function') {
          targetRef.focus();
        }
      }
      return;
    }

    const backendGroup = toBackendBloodGroup(formBloodGroup);
    if (!backendGroup) {
      Alert.alert(
        locale === 'bn' ? 'সতর্কতা' : 'Warning',
        locale === 'bn'
          ? 'সঠিক রক্তের গ্রুপ নির্বাচন করুন'
          : 'Please select a valid blood group'
      );
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const neededDateIso = formNeededDate || new Date().toISOString();

    const optimisticItem: BloodRequestItem = {
      id: tempId,
      requesterId: user?.id || 'temp-user',
      forMyself,
      patientName: nameToUse.trim(),
      patientAge: formPatientAge ? parseInt(formPatientAge, 10) : undefined,
      problem: formProblem.trim() || undefined,
      bloodGroup: backendGroup,
      units: parseInt(formUnits, 10) || 1,
      unitsFulfilled: 0,
      hospitalName: formHospital.trim(),
      country: locationValue.country,
      state: locationValue.state,
      city: locationValue.city,
      location: locationValue.location.trim(),
      contactNumber: formContact.trim(),
      alternateContact: formAlternateContact.trim() || undefined,
      neededDate: neededDateIso,
      status: 'POSTING',
      createdAt: new Date().toISOString(),
      donations: [],
      requester: user ? {
        id: user.id,
        name: user.name || '',
        username: user.username || '',
        avatarUrl: user.avatarUrl,
      } : undefined,
    };

    const payload = {
      forMyself,
      patientName: nameToUse.trim(),
      patientAge: formPatientAge ? parseInt(formPatientAge, 10) : undefined,
      problem: formProblem.trim() || undefined,
      bloodGroup: backendGroup,
      units: parseInt(formUnits, 10) || 1,
      hospitalName: formHospital.trim(),
      country: locationValue.country,
      countryCode: locationValue.countryCode,
      state: locationValue.state,
      city: locationValue.city,
      location: locationValue.location.trim(),
      contactNumber: formContact.trim(),
      alternateContact: formAlternateContact.trim() || undefined,
      neededDate: neededDateIso,
    };

    // 1. Immediately trigger bottom nav "+ Post" red circle spinner
    setIsUploadingPost(true, 'BLOOD');

    // 2. Reset form state immediately
    setFieldErrors({});
    setForMyself(false);
    setFormPatientName('');
    setFormPatientAge('');
    setFormProblem('');
    setFormHospital('');
    setFormContact('');
    setFormAlternateContact('');
    setFormUnits('1');
    const resetD = new Date();
    resetD.setDate(resetD.getDate() + 1);
    resetD.setHours(12, 0, 0, 0);
    setFormNeededDate(resetD.toISOString());
    setLocationValue(matchUserLocationToGeo(user));

    // 3. Notify parent to instantly redirect to Activity tab & show optimistic post item at 1st position
    onSubmitOptimistic(optimisticItem, payload);
  };

  if (!isAuthenticated) {
    return (
      <View className="w-full pt-2">
        <View className="py-6">
          <AuthPromptCard
            icon="water_drop"
            iconBgColor="bg-rose-50 dark:bg-rose-950/60"
            iconColor="#e11d48"
            titleBn="জরুরি রক্তের আবেদন প্রকাশ করতে লগইন করুন"
            titleEn="Log in to request blood"
            descriptionBn="জরুরি ভিত্তিতে রক্তের আবেদন প্রকাশ করতে এবং রক্তদাতাদের তাৎক্ষণিক সহায়তা পেতে সাইন ইন করুন।"
            descriptionEn="Please log in or register an account to submit an emergency blood request and reach donors."
          />
        </View>
      </View>
    );
  }

  return (
    <View className="w-full pt-3 pb-2 space-y-3">
      {/* Patient Name with Compact "For Myself" Button */}
      <View
        onLayout={(e) => {
          fieldOffsets.current['patientName'] = e.nativeEvent.layout.y;
        }}>
        <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] mb-1">
          {locale === 'bn' ? 'রোগীর পুরো নাম *' : 'Patient Full Name *'}
        </Text>
        <View className="flex-row items-center gap-2">
          <TextInput
            ref={patientNameRef}
            value={forMyself ? user?.name || formPatientName : formPatientName}
            onChangeText={(text) => {
              setFormPatientName(text);
              if (fieldErrors.patientName) {
                setFieldErrors((prev) => ({ ...prev, patientName: false }));
              }
            }}
            editable={!forMyself}
            style={webNoOutline}
            placeholder={
              fieldErrors.patientName
                ? locale === 'bn'
                  ? '⚠️ রোগীর নাম অবশ্যই লিখুন *'
                  : '⚠️ Patient name is required *'
                : locale === 'bn'
                ? 'যেমন: মোহাম্মদ রহিম'
                : 'e.g. John Doe'
            }
            placeholderTextColor={
              fieldErrors.patientName
                ? '#e11d48'
                : theme === 'dark'
                ? '#65676b'
                : '#8a8d91'
            }
            className={`flex-1 bg-[#f0f2f5] dark:bg-[#242526] rounded-xl px-3 py-2.5 text-xs text-[#050505] dark:text-[#e4e6eb] border ${
              fieldErrors.patientName
                ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                : 'border-[#e4e6eb] dark:border-[#393a3b] focus:border-rose-400'
            } ${forMyself ? 'opacity-80' : ''}`}
          />
          <Pressable
            onPress={() => {
              setForMyself((prev) => !prev);
              if (fieldErrors.patientName) {
                setFieldErrors((prev) => ({ ...prev, patientName: false }));
              }
            }}
            style={[
              webNoOutline,
              {
                borderWidth: 1.5,
                borderColor: forMyself
                  ? '#e11d48'
                  : theme === 'dark' ? '#393a3b' : '#ced0d4',
                backgroundColor: forMyself
                  ? theme === 'dark' ? 'rgba(225, 29, 72, 0.15)' : '#fff1f2'
                  : theme === 'dark' ? '#242526' : '#f0f2f5',
              },
            ]}
            className="flex-row items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl shrink-0">
            <AppIcon
              android={forMyself ? 'check_box' : 'check_box_outline_blank'}
              size={17}
              color={forMyself ? '#e11d48' : '#65676b'}
            />
            <Text
              style={{
                color: forMyself
                  ? '#e11d48'
                  : theme === 'dark' ? '#e4e6eb' : '#050505',
              }}
              className="text-xs font-bold">
              {locale === 'bn' ? 'নিজের জন্য' : 'For myself'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Patient Age & Units Needed (Row) */}
      <View className="flex-row gap-2.5">
        <View className="flex-1">
          <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] mb-1">
            {locale === 'bn' ? 'রোগীর বয়স' : 'Patient Age'}
          </Text>
          <TextInput
            value={formPatientAge}
            onChangeText={setFormPatientAge}
            keyboardType="number-pad"
            style={webNoOutline}
            placeholder="e.g. 28"
            placeholderTextColor={theme === 'dark' ? '#65676b' : '#8a8d91'}
            className="bg-[#f0f2f5] dark:bg-[#242526] rounded-xl px-3 py-2 text-xs text-[#050505] dark:text-[#e4e6eb] border border-[#e4e6eb] dark:border-[#393a3b] focus:border-rose-400"
          />
        </View>

        <View
          className="flex-1"
          onLayout={(e) => {
            fieldOffsets.current['units'] = e.nativeEvent.layout.y;
          }}>
          <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] mb-1">
            {locale === 'bn' ? 'রক্তের ব্যাগ সংখ্যা *' : 'Units (Bags) *'}
          </Text>
          <TextInput
            ref={unitsRef}
            value={formUnits}
            onChangeText={(text) => {
              setFormUnits(text);
              if (fieldErrors.units) {
                setFieldErrors((prev) => ({ ...prev, units: false }));
              }
            }}
            keyboardType="number-pad"
            style={webNoOutline}
            placeholder={
              fieldErrors.units
                ? locale === 'bn'
                  ? '⚠️ সংখ্যা দিন *'
                  : '⚠️ Required *'
                : '1'
            }
            placeholderTextColor={
              fieldErrors.units
                ? '#e11d48'
                : theme === 'dark'
                ? '#65676b'
                : '#8a8d91'
            }
            className={`bg-[#f0f2f5] dark:bg-[#242526] rounded-xl px-3 py-2 text-xs text-[#050505] dark:text-[#e4e6eb] border ${
              fieldErrors.units
                ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                : 'border-[#e4e6eb] dark:border-[#393a3b] focus:border-rose-400'
            }`}
          />
        </View>
      </View>

      {/* Blood Group Selector */}
      <View>
        <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] mb-1">
          {locale === 'bn' ? 'প্রয়োজনীয় রক্তের গ্রুপ *' : 'Required Blood Group *'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 1 }}>
          {SELECTABLE_GROUPS.map((bg) => (
            <Pressable
              key={bg}
              onPress={() => setFormBloodGroup(bg)}
              style={webNoOutline}
              className={`px-3 py-1.5 rounded-xl border ${
                formBloodGroup === bg
                  ? 'bg-rose-600 border-rose-600 shadow-xs'
                  : 'bg-[#f0f2f5] dark:bg-[#242526] border-[#e4e6eb] dark:border-[#393a3b]'
              }`}>
              <Text
                className={`text-xs font-bold ${
                  formBloodGroup === bg ? 'text-white' : 'text-[#050505] dark:text-[#e4e6eb]'
                }`}>
                {bg}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Needed Date & Time */}
      <DateTimePicker
        label={
          locale === 'bn'
            ? 'কখন রক্তের প্রয়োজন? (তারিখ ও সময়)'
            : 'Needed Date & Time'
        }
        value={formNeededDate}
        onChange={setFormNeededDate}
        required={true}
      />

      {/* Problem / Reason */}
      <View>
        <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] mb-1">
          {locale === 'bn' ? 'রোগের কারণ বা সমস্যা (ঐচ্ছিক)' : 'Problem / Reason (Optional)'}
        </Text>
        <TextInput
          value={formProblem}
          onChangeText={setFormProblem}
          style={webNoOutline}
          placeholder={
            locale === 'bn'
              ? 'যেমন: থ্যালাসেমিয়া, জরুরি ডেলিভারি, দুর্ঘটনা'
              : 'e.g. Thalassemia, Surgery, Accident'
          }
          placeholderTextColor={theme === 'dark' ? '#65676b' : '#8a8d91'}
          className="bg-[#f0f2f5] dark:bg-[#242526] rounded-xl px-3 py-2 text-xs text-[#050505] dark:text-[#e4e6eb] border border-[#e4e6eb] dark:border-[#393a3b] focus:border-rose-400"
        />
      </View>

      {/* Hospital Name */}
      <View
        onLayout={(e) => {
          fieldOffsets.current['hospital'] = e.nativeEvent.layout.y;
        }}>
        <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] mb-1">
          {locale === 'bn' ? 'হাসপাতালের নাম *' : 'Hospital Name *'}
        </Text>
        <TextInput
          ref={hospitalRef}
          value={formHospital}
          onChangeText={(text) => {
            setFormHospital(text);
            if (fieldErrors.hospital) {
              setFieldErrors((prev) => ({ ...prev, hospital: false }));
            }
          }}
          style={webNoOutline}
          placeholder={
            fieldErrors.hospital
              ? locale === 'bn'
                ? '⚠️ হাসপাতালের নাম অবশ্যই লিখুন *'
                : '⚠️ Hospital name is required *'
              : locale === 'bn'
              ? 'উদা: ঢাকা মেডিকেল কলেজ হাসপাতাল'
              : 'e.g. Dhaka Medical College Hospital'
          }
          placeholderTextColor={
            fieldErrors.hospital
              ? '#e11d48'
              : theme === 'dark'
              ? '#65676b'
              : '#8a8d91'
          }
          className={`bg-[#f0f2f5] dark:bg-[#242526] rounded-xl px-3 py-2 text-xs text-[#050505] dark:text-[#e4e6eb] border ${
            fieldErrors.hospital
              ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
              : 'border-[#e4e6eb] dark:border-[#393a3b] focus:border-rose-400'
          }`}
        />
      </View>

      {/* Cascading Location Selector (Division, District, Upazila, Area) */}
      <View
        ref={locationRef}
        onLayout={(e) => {
          fieldOffsets.current['location'] = e.nativeEvent.layout.y;
        }}>
        <View className="flex-row items-center gap-1.5 mb-1.5">
          <AppIcon android="pin_drop" size={15} color="#e11d48" />
          <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb]">
            {locale === 'bn' ? 'রক্তের প্রয়োজনস্থল (লোকেশন) *' : 'Location of Blood Need *'}
          </Text>
        </View>
        <View
          className={
            fieldErrors.location
              ? 'p-2 rounded-2xl border border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
              : ''
          }>
          <LocationSelector
            value={locationValue}
            onChange={(loc) => {
              setLocationValue(loc);
              if (fieldErrors.location && loc.districtId) {
                setFieldErrors((prev) => ({ ...prev, location: false }));
              }
            }}
            required={true}
          />
          {fieldErrors.location && (
            <View className="flex-row items-center gap-1.5 mt-1.5">
              <AppIcon android="error_outline" size={14} color="#e11d48" />
              <Text className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                {locale === 'bn'
                  ? '⚠️ অনুগ্রহ করে বিভাগ ও জেলা নির্বাচন করুন *'
                  : '⚠️ Please select Division & District *'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Contact Numbers (Row) */}
      <View className="flex-row gap-2.5">
        <View
          className="flex-1"
          onLayout={(e) => {
            fieldOffsets.current['contact'] = e.nativeEvent.layout.y;
          }}>
          <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] mb-1">
            {locale === 'bn' ? 'মোবাইল নম্বর *' : 'Contact Phone *'}
          </Text>
          <TextInput
            ref={contactRef}
            value={formContact}
            onChangeText={(text) => {
              setFormContact(text);
              if (fieldErrors.contact) {
                setFieldErrors((prev) => ({ ...prev, contact: false }));
              }
            }}
            keyboardType="phone-pad"
            style={webNoOutline}
            placeholder={
              fieldErrors.contact
                ? locale === 'bn'
                  ? '⚠️ মোবাইল নম্বর দিন *'
                  : '⚠️ Phone is required *'
                : '017XXXXXXXX'
            }
            placeholderTextColor={
              fieldErrors.contact
                ? '#e11d48'
                : theme === 'dark'
                ? '#65676b'
                : '#8a8d91'
            }
            className={`bg-[#f0f2f5] dark:bg-[#242526] rounded-xl px-3 py-2 text-xs text-[#050505] dark:text-[#e4e6eb] border ${
              fieldErrors.contact
                ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                : 'border-[#e4e6eb] dark:border-[#393a3b] focus:border-rose-400'
            }`}
          />
        </View>

        <View className="flex-1">
          <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] mb-1">
            {locale === 'bn' ? 'বিকল্প নম্বর (ঐচ্ছিক)' : 'Alternate Phone'}
          </Text>
          <TextInput
            value={formAlternateContact}
            onChangeText={setFormAlternateContact}
            keyboardType="phone-pad"
            style={webNoOutline}
            placeholder="018XXXXXXXX"
            placeholderTextColor={theme === 'dark' ? '#65676b' : '#8a8d91'}
            className="bg-[#f0f2f5] dark:bg-[#242526] rounded-xl px-3 py-2 text-xs text-[#050505] dark:text-[#e4e6eb] border border-[#e4e6eb] dark:border-[#393a3b] focus:border-rose-400"
          />
        </View>
      </View>

      {/* Submit Button */}
      <Pressable
        onPress={handleCreateRequest}
        className="w-full py-3 rounded-xl bg-rose-600 active:bg-rose-700 items-center justify-center shadow-xs mt-2">
        <Text className="text-white text-xs font-bold">
          {locale === 'bn' ? 'রক্তের আবেদন প্রকাশ করুন' : 'Submit Blood Request'}
        </Text>
      </Pressable>
    </View>
  );
}
