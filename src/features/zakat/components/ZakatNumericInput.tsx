import React, { useState } from 'react';
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
  rightAccessory?: React.ReactNode;
  isDark?: boolean;
  locale?: 'bn' | 'en';
  isFloat?: boolean;
  unitText?: string;
  placeholder?: string;
  isLast?: boolean;
}

export function ZakatNumericInput({
  labelBn,
  labelEn,
  value,
  onChangeValue,
  tipKey,
  onOpenTip,
  rightAccessory,
  isDark = false,
  locale = 'bn',
  isFloat = false,
  unitText,
  placeholder = '0',
  isLast = false,
}: ZakatNumericInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const displayVal = value === 0 ? '' : String(value);
  const label = locale === 'bn' ? labelBn : labelEn;

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
    <View className={isLast ? 'mb-0' : 'mb-3.5'}>
      {(label || rightAccessory || (!unitText && value > 0)) && (
        <View className="flex-row items-center justify-between mb-1.5 gap-2">
          <View className="flex-row items-center gap-1.5 flex-1">
            {label ? (
              <Text className="text-[14.5px] font-semibold text-[#1c1e21] dark:text-[#e4e6eb] flex-shrink">
                {label}
              </Text>
            ) : null}
            {tipKey && ZAKAT_TIPS[tipKey] && onOpenTip ? (
              <Pressable
                onPress={() => onOpenTip(ZAKAT_TIPS[tipKey])}
                hitSlop={8}
                className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 items-center justify-center">
                <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  ?
                </Text>
              </Pressable>
            ) : null}
          </View>

          {rightAccessory ? (
            rightAccessory
          ) : !unitText && value > 0 ? (
            <Text className="text-[14px] font-semibold text-emerald-600 dark:text-emerald-400">
              {formatBangladeshiCurrency(value, locale)}
            </Text>
          ) : null}
        </View>
      )}

      <View
        style={{
          backgroundColor: isDark ? '#3a3b3c' : '#f0f2f5',
          borderColor: isFocused
            ? '#059669'
            : isDark
              ? '#4e4f50'
              : '#e4e6eb',
        }}
        className="h-12 flex-row items-center rounded-2xl border px-3.5">
        {!unitText && (
          <Text className="text-base font-bold text-[#65676b] dark:text-[#b0b3b8] mr-2">
            ৳
          </Text>
        )}
        <TextInput
          keyboardType="numeric"
          value={displayVal}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#8e8e93' : '#8a8d91'}
          className="flex-1 text-base font-semibold text-[#050505] dark:text-[#e4e6eb] py-0"
        />
        {unitText ? (
          <Text className="text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8] ml-2">
            {unitText}
          </Text>
        ) : null}
        {displayVal.length > 0 && (
          <Pressable
            onPress={() => onChangeValue(0)}
            hitSlop={8}
            className="ml-1.5 p-1 rounded-full active:bg-black/5 dark:active:bg-white/10">
            <AppIcon android="close" size={16} color={isDark ? '#b0b3b8' : '#65676b'} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
