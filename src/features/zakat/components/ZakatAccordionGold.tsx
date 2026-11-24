import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ZakatAccordionCard } from './ZakatAccordionCard';
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
  const renderUnitToggle = (
    currentUnit: GoldUnit,
    field: 'goldUnit' | 'silverUnit',
    activeBgClass: string
  ) => (
    <View className="flex-row rounded-lg overflow-hidden border border-[#e4e6eb] dark:border-[#4e4f50]">
      {(['VORI', 'GRAM'] as GoldUnit[]).map((unit) => {
        const active = currentUnit === unit;
        return (
          <Pressable
            key={unit}
            onPress={() => onChangeField(field, unit)}
            className={`px-2.5 py-1 ${
              active ? activeBgClass : 'bg-[#f0f2f5] dark:bg-white/10'
            }`}>
            <Text
              className={`text-[13px] font-bold ${
                active ? 'text-white' : 'text-[#65676b] dark:text-[#b0b3b8]'
              }`}>
              {unit === 'VORI'
                ? locale === 'bn'
                  ? 'ভরি'
                  : 'Vori'
                : locale === 'bn'
                  ? 'গ্রাম'
                  : 'Gram'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <ZakatAccordionCard
      title={locale === 'bn' ? '৩. স্বর্ণ ও রূপা অলংকার' : '3. Gold & Silver Jewelry'}
      icon="auto_awesome"
      iconColor="#d97706"
      iconBgClass="bg-amber-100 dark:bg-amber-950"
      badgeText={
        totalGoldSilver > 0 ? formatBangladeshiCurrency(totalGoldSilver, locale) : undefined
      }
      badgeClass="text-amber-600 dark:text-amber-400"
      isOpen={isOpen}
      onToggle={onToggle}
      onOpenTip={() => onOpenTip(ZAKAT_TIPS.gold)}
      isDark={isDark}>
      <ZakatNumericInput
        labelBn="স্বর্ণের মোট পরিমাণ"
        labelEn="Total Gold Quantity"
        value={state.goldQuantity}
        onChangeValue={(v) => onChangeField('goldQuantity', v)}
        rightAccessory={renderUnitToggle(state.goldUnit, 'goldUnit', 'bg-amber-600')}
        isFloat
        unitText={
          state.goldUnit === 'VORI'
            ? locale === 'bn'
              ? 'ভরি'
              : 'Vori'
            : locale === 'bn'
              ? 'গ্রাম'
              : 'Gram'
        }
        placeholder="0.0"
        isDark={isDark}
        locale={locale}
      />

      <ZakatNumericInput
        labelBn="রূপার মোট পরিমাণ"
        labelEn="Total Silver Quantity"
        value={state.silverQuantity}
        onChangeValue={(v) => onChangeField('silverQuantity', v)}
        rightAccessory={renderUnitToggle(state.silverUnit, 'silverUnit', 'bg-slate-600')}
        isFloat
        unitText={
          state.silverUnit === 'VORI'
            ? locale === 'bn'
              ? 'ভরি'
              : 'Vori'
            : locale === 'bn'
              ? 'গ্রাম'
              : 'Gram'
        }
        placeholder="0.0"
        isDark={isDark}
        locale={locale}
        isLast
      />
    </ZakatAccordionCard>
  );
}
