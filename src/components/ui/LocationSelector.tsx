import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import { useUi } from '@/providers/UiProvider';
import {
  getDivisions,
  getDistrictsByDivision,
  getUpazilasByDistrict,
  getDivisionById,
  getDistrictById,
  getUpazilaById,
  Division,
  District,
  Upazila,
} from '@/constants/bangladeshGeo';

export interface LocationValue {
  country?: string;
  countryCode?: string;
  state?: string;
  city?: string;
  location: string;
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  detailedAddress?: string;
}

interface LocationSelectorProps {
  value?: LocationValue;
  onChange: (val: LocationValue) => void;
  required?: boolean;
}

type PickerType = 'division' | 'district' | 'upazila' | null;
const webNoOutline = Platform.OS === 'web' ? ({
  outlineStyle: 'none',
  outlineWidth: 0,
  outlineColor: 'transparent',
  outline: 'none',
  boxShadow: 'none',
} as any) : undefined;

export function LocationSelector({
  value,
  onChange,
  required = false,
}: LocationSelectorProps) {
  const { locale, theme } = useUi();

  const [activePicker, setActivePicker] = useState<PickerType>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Geo Objects
  const selectedDivision = useMemo(() => {
    return value?.divisionId ? getDivisionById(value.divisionId) : undefined;
  }, [value?.divisionId]);

  const selectedDistrict = useMemo(() => {
    return value?.districtId ? getDistrictById(value.districtId) : undefined;
  }, [value?.districtId]);

  const selectedUpazila = useMemo(() => {
    return value?.upazilaId ? getUpazilaById(value.upazilaId) : undefined;
  }, [value?.upazilaId]);

  // Options based on current selections
  const divisions = useMemo(() => getDivisions(), []);
  const districts = useMemo(() => {
    return value?.divisionId ? getDistrictsByDivision(value.divisionId) : [];
  }, [value?.divisionId]);
  const upazilas = useMemo(() => {
    return value?.districtId ? getUpazilasByDistrict(value.districtId) : [];
  }, [value?.districtId]);

  // Filtered lists for picker modal
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (activePicker === 'division') {
      return divisions.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.bn_name.toLowerCase().includes(q)
      );
    }
    if (activePicker === 'district') {
      return districts.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.bn_name.toLowerCase().includes(q)
      );
    }
    if (activePicker === 'upazila') {
      return upazilas.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.bn_name.toLowerCase().includes(q)
      );
    }
    return [];
  }, [activePicker, searchQuery, divisions, districts, upazilas]);

  const updateLocation = (
    divisionId?: string,
    districtId?: string,
    upazilaId?: string,
    detailedAddress = value?.detailedAddress || ''
  ) => {
    const div = divisionId ? getDivisionById(divisionId) : undefined;
    const dist = districtId ? getDistrictById(districtId) : undefined;
    const upz = upazilaId ? getUpazilaById(upazilaId) : undefined;

    const parts: string[] = [];
    if (detailedAddress.trim()) parts.push(detailedAddress.trim());
    if (upz) parts.push(locale === 'bn' ? upz.bn_name : upz.name);
    if (dist) parts.push(locale === 'bn' ? dist.bn_name : dist.name);
    if (div) parts.push(locale === 'bn' ? div.bn_name : div.name);

    onChange({
      country: 'Bangladesh',
      countryCode: 'BD',
      state: div?.name || '',
      city: dist?.name || '',
      location: parts.join(', '),
      divisionId,
      districtId,
      upazilaId,
      detailedAddress,
    });
  };

  const handleSelectDivision = (div: Division) => {
    setActivePicker(null);
    setSearchQuery('');
    updateLocation(div.id, undefined, undefined, value?.detailedAddress);
  };

  const handleSelectDistrict = (dist: District) => {
    setActivePicker(null);
    setSearchQuery('');
    updateLocation(value?.divisionId, dist.id, undefined, value?.detailedAddress);
  };

  const handleSelectUpazila = (upz: Upazila) => {
    setActivePicker(null);
    setSearchQuery('');
    updateLocation(value?.divisionId, value?.districtId, upz.id, value?.detailedAddress);
  };

  const handleDetailAddressChange = (text: string) => {
    updateLocation(value?.divisionId, value?.districtId, value?.upazilaId, text);
  };

  const getPickerTitle = () => {
    if (activePicker === 'division')
      return locale === 'bn' ? 'বিভাগ নির্বাচন করুন' : 'Select Division';
    if (activePicker === 'district')
      return locale === 'bn' ? 'জেলা নির্বাচন করুন' : 'Select District';
    if (activePicker === 'upazila')
      return locale === 'bn' ? 'উপজেলা / থানা নির্বাচন করুন' : 'Select Upazila / Area';
    return '';
  };

  return (
    <View className="space-y-2.5">
      {/* Row 1: Division & District */}
      <View className="flex-row gap-2.5">
        {/* 1. Division Selector */}
        <View className="flex-1">
          <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] mb-1">
            {locale === 'bn' ? 'বিভাগ' : 'Division'} {required ? '*' : ''}
          </Text>
          <Pressable
            style={webNoOutline}
            onPress={() => {
              setSearchQuery('');
              setActivePicker('division');
            }}
            className="flex-row items-center justify-between bg-[#f0f2f5] dark:bg-[#242526] rounded-xl px-3 py-2 border border-[#e4e6eb] dark:border-[#393a3b]">
            <Text
              numberOfLines={1}
              className={`text-xs flex-1 ${
                selectedDivision
                  ? 'font-bold text-[#050505] dark:text-[#e4e6eb]'
                  : 'text-[#8a8d91] dark:text-[#65676b]'
              }`}>
              {selectedDivision
                ? locale === 'bn'
                  ? selectedDivision.bn_name
                  : selectedDivision.name
                : locale === 'bn'
                ? 'বিভাগ নির্বাচন'
                : 'Select Division'}
            </Text>
            <AppIcon android="arrow_drop_down" size={18} color={theme === 'dark' ? '#b0b3b8' : '#65676b'} />
          </Pressable>
        </View>

        {/* 2. District Selector (Enabled when Division is chosen) */}
        <View className="flex-1">
          <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] mb-1">
            {locale === 'bn' ? 'জেলা' : 'District'} {required ? '*' : ''}
          </Text>
          <Pressable
            disabled={!value?.divisionId}
            style={webNoOutline}
            onPress={() => {
              setSearchQuery('');
              setActivePicker('district');
            }}
            className={`flex-row items-center justify-between rounded-xl px-3 py-2 border ${
              !value?.divisionId
                ? 'bg-[#f0f2f5]/50 dark:bg-[#242526]/50 border-dashed border-[#e4e6eb] dark:border-[#393a3b] opacity-60'
                : 'bg-[#f0f2f5] dark:bg-[#242526] border-[#e4e6eb] dark:border-[#393a3b]'
            }`}>
            <Text
              numberOfLines={1}
              className={`text-xs flex-1 ${
                selectedDistrict
                  ? 'font-bold text-[#050505] dark:text-[#e4e6eb]'
                  : 'text-[#8a8d91] dark:text-[#65676b]'
              }`}>
              {selectedDistrict
                ? locale === 'bn'
                  ? selectedDistrict.bn_name
                  : selectedDistrict.name
                : locale === 'bn'
                ? value?.divisionId
                  ? 'জেলা নির্বাচন'
                  : 'বিভাগ আগে'
                : value?.divisionId
                ? 'Select District'
                : 'Select Division'}
            </Text>
            <AppIcon android="arrow_drop_down" size={18} color={theme === 'dark' ? '#b0b3b8' : '#65676b'} />
          </Pressable>
        </View>
      </View>

      {/* Row 2: Upazila & Detailed Address */}
      <View className="flex-row gap-2.5">
        {/* 3. Upazila / Area Selector (Enabled when District is chosen) */}
        <View className="flex-1">
          <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] mb-1">
            {locale === 'bn' ? 'উপজেলা / থানা' : 'Upazila / Area'}
          </Text>
          <Pressable
            disabled={!value?.districtId}
            style={webNoOutline}
            onPress={() => {
              setSearchQuery('');
              setActivePicker('upazila');
            }}
            className={`flex-row items-center justify-between rounded-xl px-3 py-2 border ${
              !value?.districtId
                ? 'bg-[#f0f2f5]/50 dark:bg-[#242526]/50 border-dashed border-[#e4e6eb] dark:border-[#393a3b] opacity-60'
                : 'bg-[#f0f2f5] dark:bg-[#242526] border-[#e4e6eb] dark:border-[#393a3b]'
            }`}>
            <Text
              numberOfLines={1}
              className={`text-xs flex-1 ${
                selectedUpazila
                  ? 'font-bold text-[#050505] dark:text-[#e4e6eb]'
                  : 'text-[#8a8d91] dark:text-[#65676b]'
              }`}>
              {selectedUpazila
                ? locale === 'bn'
                  ? selectedUpazila.bn_name
                  : selectedUpazila.name
                : locale === 'bn'
                ? value?.districtId
                  ? 'উপজেলা (ঐচ্ছিক)'
                  : 'জেলা আগে'
                : value?.districtId
                ? 'Upazila (Opt.)'
                : 'District First'}
            </Text>
            <AppIcon android="arrow_drop_down" size={18} color={theme === 'dark' ? '#b0b3b8' : '#65676b'} />
          </Pressable>
        </View>

        {/* 4. Detailed Address / Landmark / Area */}
        <View className="flex-1">
          <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] mb-1">
            {locale === 'bn' ? 'রোড / এলাকা (ঐচ্ছিক)' : 'Area / Road (Opt.)'}
          </Text>
          <TextInput
            value={value?.detailedAddress || ''}
            onChangeText={handleDetailAddressChange}
            style={webNoOutline}
            placeholder={
              locale === 'bn'
                ? 'মিরপুর ১০, রোড ৩'
                : 'Road 3, Mirpur'
            }
            placeholderTextColor={theme === 'dark' ? '#65676b' : '#8a8d91'}
            className="bg-[#f0f2f5] dark:bg-[#242526] rounded-xl px-3 py-2 text-xs text-[#050505] dark:text-[#e4e6eb] border border-[#e4e6eb] dark:border-[#393a3b] focus:border-rose-400"
          />
        </View>
      </View>

      {/* Formatted Location Preview */}
      {value?.location ? (
        <View className="flex-row items-center gap-2 p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
          <AppIcon android="location_on" size={16} color="#e11d48" />
          <Text className="text-xs font-medium text-rose-700 dark:text-rose-300 flex-1">
            {value.location}
          </Text>
        </View>
      ) : null}

      {/* Searchable Picker Modal */}
      <Modal
        visible={activePicker !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActivePicker(null)}>
        <SafeAreaView className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-[#18191a] rounded-t-3xl max-h-[75%] border-t border-[#f0f2f5] dark:border-[#242526]">
            {/* Modal Top Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#f0f2f5] dark:border-[#242526]">
              <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                {getPickerTitle()}
              </Text>
              <Pressable
                onPress={() => setActivePicker(null)}
                className="p-1 rounded-full active:bg-[#f0f2f5] dark:active:bg-[#242526]">
                <AppIcon android="close" size={20} color={theme === 'dark' ? '#b0b3b8' : '#65676b'} />
              </Pressable>
            </View>

            {/* Search Input Bar inside Modal */}
            <View className="px-4 py-2 border-b border-[#f0f2f5] dark:border-[#242526]">
              <View className="flex-row items-center bg-[#f0f2f5] dark:bg-[#242526] rounded-xl px-3 py-2">
                <AppIcon android="search" size={16} color={theme === 'dark' ? '#b0b3b8' : '#65676b'} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={webNoOutline}
                  placeholder={locale === 'bn' ? 'খুঁজুন...' : 'Search...'}
                  placeholderTextColor={theme === 'dark' ? '#65676b' : '#8a8d91'}
                  className="flex-1 ml-2 text-xs text-[#050505] dark:text-[#e4e6eb] py-0"
                  autoFocus={false}
                />
                {searchQuery ? (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <AppIcon android="cancel" size={16} color={theme === 'dark' ? '#b0b3b8' : '#65676b'} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Options List */}
            <ScrollView
              className="px-2 py-1"
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 24 }}>
              {filteredItems.length === 0 ? (
                <View className="p-8 items-center justify-center">
                  <Text className="text-xs text-[#8a8d91] dark:text-[#65676b]">
                    {locale === 'bn' ? 'কিছু পাওয়া যায়নি' : 'No matches found'}
                  </Text>
                </View>
              ) : (
                filteredItems.map((item: any) => {
                  const isSelected =
                    (activePicker === 'division' && value?.divisionId === item.id) ||
                    (activePicker === 'district' && value?.districtId === item.id) ||
                    (activePicker === 'upazila' && value?.upazilaId === item.id);

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        if (activePicker === 'division') handleSelectDivision(item);
                        else if (activePicker === 'district') handleSelectDistrict(item);
                        else if (activePicker === 'upazila') handleSelectUpazila(item);
                      }}
                      className={`flex-row items-center justify-between px-3 py-3 rounded-xl mx-1 my-0.5 ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/40'
                          : 'active:bg-[#f0f2f5] dark:active:bg-[#242526]'
                      }`}>
                      <View className="flex-row items-center gap-2">
                        <Text
                          className={`text-xs ${
                            isSelected
                              ? 'font-bold text-rose-600 dark:text-rose-400'
                              : 'font-medium text-[#050505] dark:text-[#e4e6eb]'
                          }`}>
                          {locale === 'bn' ? item.bn_name : item.name}
                        </Text>
                        <Text className="text-[11px] text-[#8a8d91] dark:text-[#65676b]">
                          ({item.name})
                        </Text>
                      </View>
                      {isSelected ? (
                        <AppIcon android="check" size={18} color="#e11d48" />
                      ) : null}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
