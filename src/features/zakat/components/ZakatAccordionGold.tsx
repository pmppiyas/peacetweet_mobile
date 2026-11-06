import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import { ZakatNumericInput } from './ZakatNumericInput';
import { ZakatState, GoldUnit } from '../types/zakat.types';
import { ZAKAT_TIPS, FiqhTip } from '../constants/zakatConstants';
import { formatBangladeshiCurrency } from '../utils/zakatCalculator';

interface ZakatAccordionGoldProps {
  state: ZakatState;
  onChangeField: (field: keyof ZakatState, val: any) => void;
  isOpen: boolean;
  onToggle: () => void;
  totalGoldSilver: number;
  onOpenTip: (tip: FiqhTip) => void;
  isDark?: boolean;
  locale?: 'bn' | 'en';
}

export function ZakatAccordionGold({
  state,
  onChangeField,
  isOpen,
  onToggle,
  totalGoldSilver,
  onOpenTip,
  isDark = false,
  locale = 'bn',
}: ZakatAccordionGoldProps) {
  return (
    <View
      style={{ backgroundColor: isDark ? '#242526' : '#ffffff' }}
      className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs mb-3 overflow-hidden">
      <Pressable
        onPress={onToggle}
        className="p-4 flex-row items-center justify-between active:opacity-80">
        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
          <View className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 items-center justify-center">
            <AppIcon android="auto_awesome" size={17} color="#d97706" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
              {locale === 'bn' ? '৩. স্বর্ণ ও রূপা অলংকার' : '3. Gold & Silver Jewelry'}
            </Text>
            <Text className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              {formatBangladeshiCurrency(totalGoldSilver, locale)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => onOpenTip(ZAKAT_TIPS.gold)}
            hitSlop={8}
            className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 items-center justify-center">
            <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              ?
            </Text>
          </Pressable>
          <AppIcon
            android={isOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            size={20}
            color="#65676b"
          />
        </View>
      </Pressable>

      {isOpen && (
        <View className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800">
          {/* Gold Unit Toggle & Quantity */}
          <View className="mb-3.5">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-xs sm:text-sm font-semibold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'স্বর্ণের মোট পরিমাণ' : 'Total Gold Quantity'}
              </Text>
              <View className="flex-row rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <Pressable
                  onPress={() => onChangeField('goldUnit', 'VORI')}
                  className={`px-2 py-0.5 ${
                    state.goldUnit === 'VORI'
                      ? 'bg-amber-600'
                      : 'bg-gray-100 dark:bg-white/10'
                  }`}>
                  <Text
                    className={`text-[11px] font-bold ${
                      state.goldUnit === 'VORI' ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                    {locale === 'bn' ? 'ভরি' : 'Vori'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => onChangeField('goldUnit', 'GRAM')}
                  className={`px-2 py-0.5 ${
                    state.goldUnit === 'GRAM'
                      ? 'bg-amber-600'
                      : 'bg-gray-100 dark:bg-white/10'
                  }`}>
                  <Text
                    className={`text-[11px] font-bold ${
                      state.goldUnit === 'GRAM' ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                    {locale === 'bn' ? 'গ্রাম' : 'Gram'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <ZakatNumericInput
              labelBn=""
              labelEn=""
              value={state.goldQuantity}
              onChangeValue={(v) => onChangeField('goldQuantity', v)}
              isFloat
              unitText={state.goldUnit === 'VORI' ? (locale === 'bn' ? 'ভরি' : 'Vori') : (locale === 'bn' ? 'গ্রাম' : 'Gram')}
              placeholder="0.0"
              isDark={isDark}
              locale={locale}
            />
          </View>

          {/* Silver Unit Toggle & Quantity */}
          <View className="mb-2">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-xs sm:text-sm font-semibold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'রূপার মোট পরিমাণ' : 'Total Silver Quantity'}
              </Text>
              <View className="flex-row rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <Pressable
                  onPress={() => onChangeField('silverUnit', 'VORI')}
                  className={`px-2 py-0.5 ${
                    state.silverUnit === 'VORI'
                      ? 'bg-slate-600'
                      : 'bg-gray-100 dark:bg-white/10'
                  }`}>
                  <Text
                    className={`text-[11px] font-bold ${
                      state.silverUnit === 'VORI' ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                    {locale === 'bn' ? 'ভরি' : 'Vori'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => onChangeField('silverUnit', 'GRAM')}
                  className={`px-2 py-0.5 ${
                    state.silverUnit === 'GRAM'
                      ? 'bg-slate-600'
                      : 'bg-gray-100 dark:bg-white/10'
                  }`}>
                  <Text
                    className={`text-[11px] font-bold ${
                      state.silverUnit === 'GRAM' ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                    {locale === 'bn' ? 'গ্রাম' : 'Gram'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <ZakatNumericInput
              labelBn=""
              labelEn=""
              value={state.silverQuantity}
              onChangeValue={(v) => onChangeField('silverQuantity', v)}
              isFloat
              unitText={state.silverUnit === 'VORI' ? (locale === 'bn' ? 'ভরি' : 'Vori') : (locale === 'bn' ? 'গ্রাম' : 'Gram')}
              placeholder="0.0"
              isDark={isDark}
              locale={locale}
            />
          </View>
        </View>
      )}
    </View>
  );
}
