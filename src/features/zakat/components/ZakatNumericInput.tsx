import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import { formatBangladeshiCurrency } from '../utils/zakatCalculator';
import { ZAKAT_TIPS, FiqhTip } from '../constants/zakatConstants';

interface ZakatNumericInputProps {
  labelBn: string;
  labelEn: string;
  value: number;
  onChangeValue: (val: number) => void;
  tipKey?: string;
  onOpenTip?: (tip: FiqhTip) => void;
  isDark?: boolean;
  locale?: 'bn' | 'en';
  isFloat?: boolean;
  unitText?: string;
  placeholder?: string;
}

export function ZakatNumericInput({
  labelBn,
  labelEn,
  value,
  onChangeValue,
  tipKey,
  onOpenTip,
  isDark = false,
  locale = 'bn',
  isFloat = false,
  unitText,
  placeholder = '0',
}: ZakatNumericInputProps) {
  const displayVal = value === 0 ? '' : String(value);

  const handleChangeText = (text: string) => {
    let sanitized = text.replace(/[^0-9.]/g, '');
    if (isFloat) {
      const parts = sanitized.split('.');
      if (parts.length > 2) {
        sanitized = `${parts[0]}.${parts.slice(1).join('')}`;
      }
    } else {
      sanitized = sanitized.replace(/\./g, '');
    }
    const num = isFloat ? parseFloat(sanitized) || 0 : parseInt(sanitized, 10) || 0;
    onChangeValue(num);
  };

  return (
    <View className="mb-3.5">
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center gap-1.5 flex-1 pr-2">
          <Text className="text-xs sm:text-sm font-semibold text-[#050505] dark:text-[#e4e6eb]">
            {locale === 'bn' ? labelBn : labelEn}
          </Text>
          {tipKey && ZAKAT_TIPS[tipKey] && onOpenTip ? (
            <Pressable
              onPress={() => onOpenTip(ZAKAT_TIPS[tipKey])}
              hitSlop={8}
              className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 items-center justify-center">
              <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                ?
              </Text>
            </Pressable>
          ) : null}
        </View>

        {!unitText && (
          <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {formatBangladeshiCurrency(value, locale)}
          </Text>
        )}
      </View>

      <View
        style={{
          backgroundColor: isDark ? '#3a3b3c' : '#f0f2f5',
          borderColor: isDark ? '#4e4f50' : '#e4e6eb',
        }}
        className="flex-row items-center rounded-xl border px-3 py-1.5">
        {!unitText && <Text className="text-sm font-bold text-gray-400 mr-2">৳</Text>}
        <TextInput
          keyboardType="numeric"
          value={displayVal}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#8e8e93' : '#a0a0a5'}
          className="flex-1 text-sm font-semibold text-[#050505] dark:text-[#e4e6eb] py-0.5"
        />
        {unitText ? (
          <Text className="text-xs font-semibold text-gray-500 ml-2">{unitText}</Text>
        ) : null}
        {displayVal.length > 0 && (
          <Pressable onPress={() => onChangeValue(0)} hitSlop={8} className="p-1">
            <AppIcon android="close" size={13} color={isDark ? '#8e8e93' : '#a0a0a5'} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
