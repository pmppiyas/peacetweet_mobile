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
  hasMedia?: boolean;
}

export function ExpandablePostCaption({
  content,
  className = '',
  hasMedia = false,
}: ExpandablePostCaptionProps) {
  const { locale } = useUi();
  const { width: winWidth } = useWindowDimensions();
  const [isExpanded, setIsExpanded] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [measuredLineCount, setMeasuredLineCount] = useState(1);

  if (!content || !content.trim()) return null;

  const rawLines = content.trim().split(/\r?\n/);
  // Without photo: ONLY collapse if strictly more than 10 lines or very long (> 700 chars)
  // With photo: standard caption collapse (exceeds 3 lines or > 180 chars)
  const maxLineThreshold = hasMedia ? 3 : 10;
  const maxCharThreshold = hasMedia ? 180 : 700;

  const shouldCollapse =
    rawLines.length > maxLineThreshold ||
    measuredLineCount > maxLineThreshold ||
    content.length > maxCharThreshold;

  const onLayout = (e: any) => {
    const w = Math.round(e.nativeEvent?.layout?.width || 0);
    if (w > 0 && Math.abs(w - containerWidth) > 5) {
      setContainerWidth(w);
    }
  };

  if (!shouldCollapse || isExpanded) {
    return (
      <View onLayout={onLayout} className={`px-3 ${className}`}>
        <Text
          selectable={true}
          onTextLayout={(e) => {
            const lines = e.nativeEvent?.lines?.length || 1;
            if (lines !== measuredLineCount) {
              setMeasuredLineCount(lines);
            }
          }}
          className="text-[16.5px] text-[#1e2329] dark:text-[#e4e6eb] leading-[26px] select-text">
          {content}
        </Text>
        {shouldCollapse && isExpanded && (
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

  // Collapsed state:
  // If hasMedia: show first line + "... See more"
  // If !hasMedia and > 10 lines: show first 9 lines + "... See more"
  const font =
    '16.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  const seeMoreLabel = locale === 'bn' ? '... আরও দেখুন' : '... See more';
  const seeMoreWidth = measureTextWidth(seeMoreLabel, `bold ${font}`);

  const effectiveWidth =
    containerWidth > 0 ? containerWidth : winWidth ? Math.min(winWidth, 680) - 24 : 360;

  if (!hasMedia) {
    const displayedText =
      rawLines.length > 10
        ? rawLines.slice(0, 9).join('\n')
        : content.slice(0, 600).trim();
    return (
      <View onLayout={onLayout} className={`px-3 ${className}`}>
        <Text
          selectable={true}
          className="text-[16.5px] text-[#1e2329] dark:text-[#e4e6eb] leading-[26px] select-text">
          {displayedText}{' '}
          <Text
            onPress={() => setIsExpanded(true)}
            className="text-[15px] font-bold text-primary-600 dark:text-primary-400">
            {seeMoreLabel}
          </Text>
        </Text>
      </View>
    );
  }

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
