import React, { useState } from 'react';
import { View, Text, Pressable, Platform, useWindowDimensions } from 'react-native';
import { useUi } from '@/providers/UiProvider';

let measureCanvas: any = null;

function measureTextWidth(text: string, font: string): number {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    try {
      if (!measureCanvas) {
        measureCanvas = document.createElement('canvas');
      }
      const ctx = measureCanvas.getContext('2d');
      if (ctx) {
        ctx.font = font;
        return ctx.measureText(text).width;
      }
    } catch {}
  }
  // Safe fallback for native / non-canvas environments: avg 10.4px per character
  return text.length * 10.4;
}

function fitWordsToWidth(
  text: string,
  maxWidth: number,
  seeMoreWidth: number,
  font: string
): string {
  const availableWidth = Math.max(60, maxWidth - seeMoreWidth - 16);
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return '';

  let fitted = '';
  for (let i = 0; i < words.length; i++) {
    const candidate = fitted ? `${fitted} ${words[i]}` : words[i];
    const candidateWidth = measureTextWidth(candidate, font);
    if (candidateWidth <= availableWidth) {
      fitted = candidate;
    } else {
      // If the word does not fit fully, do NOT show it partially!
      break;
    }
  }

  // Fallback if even the 1st word alone exceeds the available width (e.g. 1 giant unbroken word)
  if (!fitted && words[0]) {
    const firstWord = words[0];
    let candidate = '';
    for (let c = 0; c < firstWord.length; c++) {
      const test = candidate + firstWord[c];
      if (measureTextWidth(test, font) <= availableWidth) {
        candidate = test;
      } else {
        break;
      }
    }
    fitted = candidate || firstWord.slice(0, 10);
  }

  return fitted;
}

export interface ExpandablePostCaptionProps {
  content?: string | null;
  className?: string;
}

export function ExpandablePostCaption({
  content,
  className = '',
}: ExpandablePostCaptionProps) {
  const { locale } = useUi();
  const { width: winWidth } = useWindowDimensions();
  const [isExpanded, setIsExpanded] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hasLayoutOverflow, setHasLayoutOverflow] = useState(false);

  if (!content || !content.trim()) return null;

  const rawLines = content.trim().split(/\r?\n/);
  // Exceeds 2 lines if explicitly separated into > 2 lines or long continuous string
  const exceedsTwoLines =
    rawLines.length > 2 || content.length > 110 || hasLayoutOverflow;

  const onLayout = (e: any) => {
    const w = Math.round(e.nativeEvent?.layout?.width || 0);
    if (w > 0 && Math.abs(w - containerWidth) > 5) {
      setContainerWidth(w);
    }
  };

  if (!exceedsTwoLines || isExpanded) {
    return (
      <View onLayout={onLayout} className={`px-3 ${className}`}>
        <Text
          selectable={true}
          onTextLayout={(e) => {
            const lineCount = e.nativeEvent?.lines?.length || 0;
            if (lineCount > 2) {
              setHasLayoutOverflow(true);
            }
          }}
          className="text-[16.5px] text-[#1e2329] dark:text-[#e4e6eb] leading-[26px] select-text">
          {content}
        </Text>
        {exceedsTwoLines && isExpanded && (
          <Pressable
            onPress={() => setIsExpanded(false)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="mt-1 active:opacity-70 self-start"
            style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined}>
            <Text className="text-[14px] font-semibold text-primary-600 dark:text-primary-400">
              {locale === 'bn' ? 'কম দেখুন' : 'See less'}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  // Collapsed state: Show only whole words on 1 line + "... See more"
  const font =
    '16.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  const seeMoreLabel = locale === 'bn' ? '... আরও দেখুন' : '... See more';
  const seeMoreWidth = measureTextWidth(seeMoreLabel, `bold ${font}`);

  // Determine available row width: container width or screen width minus feed horizontal padding
  const effectiveWidth =
    containerWidth > 0 ? containerWidth : winWidth ? Math.min(winWidth, 680) - 24 : 360;

  const firstLine = (rawLines[0] || content).trim();
  const fittedWords = fitWordsToWidth(firstLine, effectiveWidth, seeMoreWidth, font);

  return (
    <Pressable
      onLayout={onLayout}
      onPress={() => setIsExpanded(true)}
      className={`px-3 active:opacity-85 ${className}`}
      style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined}>
      <Text
        selectable={false}
        numberOfLines={1}
        className="text-[16.5px] text-[#1e2329] dark:text-[#e4e6eb] leading-[26px]">
        {fittedWords}{' '}
        <Text className="text-[15px] font-bold text-primary-600 dark:text-primary-400">
          {seeMoreLabel}
        </Text>
      </Text>
    </Pressable>
  );
}
