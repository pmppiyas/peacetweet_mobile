import React from 'react';
import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { AppIcon } from './Icon';

export interface SearchInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  onClear?: () => void;
  className?: string;
}

export function SearchInputBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  isLoading = false,
  onClear,
  className = '',
}: SearchInputBarProps) {
  return (
    <View
      className={`flex-row items-center rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] border border-transparent focus:border-primary-400 px-3.5 py-2 ${className}`}>
      <AppIcon
        android="search"
        ios="magnifyingglass"
        size={17}
        color="#65676b"
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8a8d91"
        className="flex-1 ml-2.5 text-sm text-[#050505] dark:text-[#e4e6eb] py-0"
      />
      {isLoading ? (
        <ActivityIndicator size="small" color="#1877f2" className="ml-1.5" />
      ) : value.length > 0 ? (
        <Pressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          className="h-5 w-5 rounded-full bg-gray-300/70 dark:bg-gray-600/70 items-center justify-center ml-1.5">
          <AppIcon android="close" ios="xmark" size={12} color="#65676b" />
        </Pressable>
      ) : null}
    </View>
  );
}
