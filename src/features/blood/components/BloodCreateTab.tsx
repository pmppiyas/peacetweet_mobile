import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';
import { AuthPromptCard } from '@/components/ui/AuthPromptCard';
import {
  MobileBloodComposer,
  useBloodComposerForm,
} from '@/components/feed/composer/MobileBloodComposer';
import { BloodRequestItem } from '../types/blood.types';

export interface BloodCreateTabProps {
  onSubmitOptimistic: (optimisticItem: BloodRequestItem, payload: any) => void;
  onScrollTo?: (y: number) => void;
}

/** Blood page "+Post" tab reusing MobileBloodComposer and its shared state hook. */
export function BloodCreateTab({
  onSubmitOptimistic,
  onScrollTo,
}: BloodCreateTabProps) {
  const { locale, theme, setIsUploadingPost, showToast } = useUi();
  const { isAuthenticated, user } = useAuth();
  const isDark = theme === 'dark';

  const bloodForm = useBloodComposerForm(user);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCreateRequest = () => {
    const missingMsg = bloodForm.getMissingFieldMessage(locale);
    if (missingMsg) {
      setValidationError(missingMsg);
      onScrollTo?.(0);
      showToast?.({ message: missingMsg, type: 'warning' });
      return;
    }

    setValidationError(null);

    const parsedUnits = Math.max(1, parseInt(bloodForm.units, 10) || 1);
    const neededDateIso = bloodForm.neededDate
      ? new Date(bloodForm.neededDate).toISOString()
      : new Date().toISOString();
    const trimmedProblem = bloodForm.problem.trim();
    const trimmedNote = bloodForm.bloodNote.trim();
    const combinedProblem = [
      trimmedProblem,
      trimmedNote ? `Note: ${trimmedNote}` : '',
    ]
      .filter(Boolean)
      .join(' - ');

    const loc = bloodForm.locationValue;
    const trimmedHospital = bloodForm.hospitalName.trim();
    const trimmedLocation = loc.location?.trim() || trimmedHospital;
    const trimmedContact = bloodForm.contactNumber.trim();
    const trimmedAlternate = bloodForm.alternateContact.trim();

    const optimisticItem: BloodRequestItem = {
      id: `temp-${Date.now()}`,
      requesterId: user?.id || 'temp-user',
      forMyself: bloodForm.forMyself,
      patientName: bloodForm.effectivePatientName,
      problem: combinedProblem || undefined,
      bloodGroup: bloodForm.bloodGroup,
      units: parsedUnits,
      unitsFulfilled: 0,
      hospitalName: trimmedHospital,
      country: loc.country || 'Bangladesh',
      state: loc.state,
      city: loc.city,
      location: trimmedLocation,
      contactNumber: trimmedContact,
      alternateContact: trimmedAlternate || undefined,
      neededDate: neededDateIso,
      status: 'POSTING',
      createdAt: new Date().toISOString(),
      donations: [],
      requester: user
        ? {
            id: user.id,
            name: user.name || '',
            username: user.username || '',
            avatarUrl: user.avatarUrl,
          }
        : undefined,
    };

    const payload = {
      forMyself: bloodForm.forMyself,
      patientName: bloodForm.effectivePatientName,
      problem: combinedProblem || undefined,
      note: trimmedNote || undefined,
      bloodGroup: bloodForm.bloodGroup,
      units: parsedUnits,
      hospitalName: trimmedHospital,
      country: loc.country || 'Bangladesh',
      countryCode: loc.countryCode || 'BD',
      state: loc.state,
      city: loc.city,
      location: trimmedLocation,
      contactNumber: trimmedContact,
      alternateContact: trimmedAlternate || undefined,
      neededDate: neededDateIso,
    };

    // 1. Trigger bottom nav "+ Post" red spinner
    setIsUploadingPost(true, 'BLOOD');

    // 2. Reset form immediately
    bloodForm.reset();

    // 3. Hand off to parent for optimistic Activity update + background submit
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
    <View className="w-full pt-3 pb-3">
      {validationError ? (
        <View
          style={{
            backgroundColor: isDark ? 'rgba(225, 29, 72, 0.14)' : '#fff1f2',
            borderColor: isDark ? 'rgba(244, 63, 94, 0.35)' : '#fecdd3',
          }}
          className="mb-3.5 p-3.5 rounded-2xl border flex-row items-center gap-2.5">
          <AppIcon android="error_outline" size={18} color="#e11d48" />
          <Text className="text-[14px] font-semibold text-rose-600 dark:text-rose-400 flex-1">
            {validationError}
          </Text>
        </View>
      ) : null}

      <MobileBloodComposer
        {...bloodForm.composerProps}
        user={user}
        theme={theme}
        locale={locale}
        onInputFocus={() => {
          if (validationError) setValidationError(null);
        }}
      />

      <Pressable
        onPress={handleCreateRequest}
        className="w-full h-12 rounded-2xl bg-rose-600 active:bg-rose-700 flex-row items-center justify-center gap-2 mt-4">
        <AppIcon android="water_drop" size={18} color="#ffffff" />
        <Text className="text-white text-[15px] font-bold">
          {locale === 'bn' ? 'রক্তের আবেদন প্রকাশ করুন' : 'Submit Blood Request'}
        </Text>
      </Pressable>
    </View>
  );
}
