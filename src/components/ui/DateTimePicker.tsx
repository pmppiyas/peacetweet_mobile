import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import { useUi } from '@/providers/UiProvider';

const webNoOutline =
  Platform.OS === 'web'
    ? ({
        outlineStyle: 'none',
        outlineWidth: 0,
        outlineColor: 'transparent',
        outline: 'none',
        boxShadow: 'none',
      } as any)
    : undefined;

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const TIME_ITEM_HEIGHT = 30;
const TIME_ITEM_STEP = TIME_ITEM_HEIGHT + 2;
const TIME_LIST_HEIGHT = 192;

// 12-Hour format helper (e.g. 02:30 PM, 12:00 AM, 09:15 AM)
export const format12Hour = (h24: number, min: number) => {
  const period = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  const hh = String(h12).padStart(2, '0');
  const mm = String(min).padStart(2, '0');
  return `${hh}:${mm} ${period}`;
};

export interface DateTimePickerProps {
  value?: string; // ISO string or YYYY-MM-DD hh:mm AM/PM
  onChange: (isoString: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = 'YYYY-MM-DD hh:mm AM/PM',
  required = false,
  error,
}: DateTimePickerProps) {
  const { theme, locale } = useUi();
  const [isOpen, setIsOpen] = useState(false);

  const isDark = theme === 'dark';

  // Refs for auto-scrolling time columns
  const hourScrollRef = useRef<any>(null);
  const minuteScrollRef = useRef<any>(null);

  // Parse date safely
  const parseVal = (val?: string): Date => {
    if (!val) {
      const d = new Date();
      d.setSeconds(0, 0);
      return d;
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      const fallback = new Date();
      fallback.setSeconds(0, 0);
      return fallback;
    }
    return d;
  };

  const initialDate = useMemo(() => parseVal(value), [value]);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(initialDate.getDate());

  // Time state: Pure 24-hour format (00..23, 00..59)
  const [selectedHour, setSelectedHour] = useState(initialDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(
    initialDate.getMinutes()
  );

  const scrollTimeColumns = (hour: number, minute: number, animated: boolean) => {
    const centerOffset = TIME_LIST_HEIGHT / 2 - TIME_ITEM_STEP / 2;
    hourScrollRef.current?.scrollTo({
      y: Math.max(0, hour * TIME_ITEM_STEP - centerOffset),
      animated,
    });
    minuteScrollRef.current?.scrollTo({
      y: Math.max(0, minute * TIME_ITEM_STEP - centerOffset),
      animated,
    });
  };

  // Auto-scroll time columns to selected positions on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        scrollTimeColumns(selectedHour, selectedMinute, false);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Open modal & sync state
  const handleOpen = () => {
    const d = parseVal(value);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDate(d.getDate());
    setSelectedHour(d.getHours());
    setSelectedMinute(d.getMinutes());
    setIsOpen(true);
  };

  // Format string for input: 12-hour format preview (e.g. 2026-11-20 02:30 PM)
  const displayValue = useMemo(() => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const time12 = format12Hour(d.getHours(), d.getMinutes());
    return `${yyyy}-${mm}-${dd} ${time12}`;
  }, [value]);

  // Calendar 42 cells matrix (6 rows x 7 cols)
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: {
      day: number;
      isCurrentMonth: boolean;
      monthOffset: number;
    }[] = [];

    // Prev month padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        monthOffset: -1,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        day: i,
        isCurrentMonth: true,
        monthOffset: 0,
      });
    }

    // Next month padding to fill 42 cells
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        day: i,
        isCurrentMonth: false,
        monthOffset: 1,
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  // Navigation handlers
  const handlePrevYear = () => setViewYear((y) => y - 1);
  const handleNextYear = () => setViewYear((y) => y + 1);

  const handlePrevMonth = () => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const handleNextMonth = () => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  const handleSelectDay = (cell: {
    day: number;
    isCurrentMonth: boolean;
    monthOffset: number;
  }) => {
    if (cell.monthOffset === -1) {
      handlePrevMonth();
    } else if (cell.monthOffset === 1) {
      handleNextMonth();
    }
    setSelectedDate(cell.day);
  };

  // "Now" action
  const handleNow = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(now.getDate());
    setSelectedHour(now.getHours());
    setSelectedMinute(now.getMinutes());

    setTimeout(() => {
      scrollTimeColumns(now.getHours(), now.getMinutes(), true);
    }, 40);
  };

  // "OK" action
  const handleConfirm = () => {
    const finalDate = new Date(
      viewYear,
      viewMonth,
      selectedDate,
      selectedHour,
      selectedMinute,
      0
    );
    onChange(finalDate.toISOString());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
  };

  const renderTimeColumn = (
    count: number,
    selectedValue: number,
    onSelect: (val: number) => void,
    scrollRef: React.RefObject<any>
  ) => (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, height: TIME_LIST_HEIGHT, maxHeight: TIME_LIST_HEIGHT }}
      contentContainerStyle={{ paddingVertical: 4 }}
    >
      {Array.from({ length: count }, (_, i) => i).map((val) => {
        const isSelected = selectedValue === val;
        return (
          <Pressable
            key={val}
            onPress={() => onSelect(val)}
            style={{
              height: TIME_ITEM_HEIGHT,
              marginVertical: 1,
              marginHorizontal: 3,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 7,
              backgroundColor: isSelected
                ? isDark
                  ? 'rgba(8, 102, 255, 0.25)'
                  : '#e7f0ff'
                : 'transparent',
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontSize: 14,
                fontWeight: isSelected ? '700' : '500',
                color: isSelected
                  ? isDark
                    ? '#36a4fa'
                    : '#0866FF'
                  : isDark
                    ? '#e4e6eb'
                    : '#050505',
              }}
            >
              {String(val).padStart(2, '0')}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <>
      <View className="w-full">
        {label && (
        <Text className="text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8] mb-1.5">
          {label} {required && <Text className="text-rose-500">*</Text>}
        </Text>
      )}

      {/* Input box */}
      <Pressable
        onPress={handleOpen}
        style={webNoOutline}
        className={`h-12 bg-[#f0f2f5] dark:bg-[#242526] rounded-2xl px-4 flex-row items-center justify-between border ${
          isOpen
            ? 'border-rose-400 dark:border-rose-500'
            : 'border-transparent'
        }`}
      >
        <View className="flex-row items-center gap-2.5 flex-1">
          <AppIcon
            android="schedule"
            size={18}
            color="#e11d48"
          />
          <Text
            className={`text-[15px] ${
              displayValue
                ? 'text-[#050505] dark:text-[#e4e6eb] font-semibold'
                : 'text-[#8a8d91] dark:text-[#65676b]'
            }`}
          >
            {displayValue || placeholder}
          </Text>
        </View>

        {displayValue ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            hitSlop={8}
            className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
          >
            <AppIcon android="close" size={14} color="#8a8d91" />
          </Pressable>
        ) : null}
      </Pressable>

      {error ? (
        <Text className="text-xs text-rose-500 mt-1">{error}</Text>
      ) : null}
      </View>

      {/* Date & Time Picker Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        statusBarTranslucent
        navigationBarTranslucent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 16,
            paddingVertical: 16,
            ...(Platform.OS === 'web' ? ({ zIndex: 99999 } as any) : {}),
          }}
        >
          {/* Backdrop Dismiss Area */}
          <Pressable
            onPress={() => setIsOpen(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />

          {/* Dialog Card (Non-pressable container so child events are never intercepted!) */}
          <View
            style={{
              width: '100%',
              maxWidth: 380,
              backgroundColor: isDark ? '#242526' : '#ffffff',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isDark ? '#393a3b' : '#e4e6eb',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.35 : 0.12,
              shadowRadius: 20,
              elevation: 12,
              overflow: 'hidden',
            }}
          >
            {/* Top Container: Calendar (Left) + 24H Time Picker (Right) */}
            <View style={{ flexDirection: 'row', height: 254 }}>
              {/* Left Side: Calendar */}
              <View
                style={{
                  flex: 1.7,
                  paddingHorizontal: 8,
                  paddingVertical: 10,
                  justifyContent: 'space-between',
                }}
              >
                {/* Calendar Header: <<  <  Month Year  >  >> */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    paddingHorizontal: 2,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Pressable
                      onPress={handlePrevYear}
                      hitSlop={8}
                      style={{ paddingHorizontal: 4, paddingVertical: 3, borderRadius: 4 }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '700',
                          color: isDark ? '#b0b3b8' : '#65676b',
                        }}
                      >
                        «
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handlePrevMonth}
                      hitSlop={8}
                      style={{ paddingHorizontal: 4, paddingVertical: 3, borderRadius: 4 }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '700',
                          color: isDark ? '#b0b3b8' : '#65676b',
                        }}
                      >
                        ‹
                      </Text>
                    </Pressable>
                  </View>

                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: isDark ? '#e4e6eb' : '#050505',
                    }}
                  >
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Pressable
                      onPress={handleNextMonth}
                      hitSlop={8}
                      style={{ paddingHorizontal: 4, paddingVertical: 3, borderRadius: 4 }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '700',
                          color: isDark ? '#b0b3b8' : '#65676b',
                        }}
                      >
                        ›
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleNextYear}
                      hitSlop={8}
                      style={{ paddingHorizontal: 4, paddingVertical: 3, borderRadius: 4 }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '700',
                          color: isDark ? '#b0b3b8' : '#65676b',
                        }}
                      >
                        »
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Week Day Labels (Su Mo Tu We Th Fr Sa) */}
                <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                  {WEEK_DAYS.map((wd) => (
                    <View
                      key={wd}
                      style={{ width: '14.28%', alignItems: 'center' }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: isDark ? '#8a8d91' : '#65676b',
                        }}
                      >
                        {wd}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Calendar Days Matrix (6 rows x 7 cols = 42 cells) */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {calendarCells.map((cell, idx) => {
                    const isSelected =
                      cell.isCurrentMonth && cell.day === selectedDate;

                    return (
                      <View
                        key={idx}
                        style={{
                          width: '14.28%',
                          height: 30,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Pressable
                          onPress={() => handleSelectDay(cell)}
                          style={{
                            width: 27,
                            height: 27,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 7,
                            backgroundColor: isSelected
                              ? '#0866FF'
                              : 'transparent',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: isSelected ? '700' : '500',
                              color: isSelected
                                ? '#ffffff'
                                : cell.isCurrentMonth
                                  ? isDark
                                    ? '#e4e6eb'
                                    : '#050505'
                                  : isDark
                                    ? '#4e4f50'
                                    : '#bcc0c4',
                            }}
                          >
                            {cell.day}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Vertical Divider */}
              <View
                style={{
                  width: 1,
                  height: '100%',
                  backgroundColor: isDark ? '#393a3b' : '#f0f2f5',
                }}
              />

              {/* Right Side: 24H Time Picker (Hours 00..23 + Minutes 00..59) */}
              <View style={{ flex: 1, flexDirection: 'column', height: 254 }}>
                {/* Time Display Header (Right Top Preview in 12H format: e.g. 02:30 PM, 12:00 AM) */}
                <View
                  style={{
                    height: 38,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? '#393a3b' : '#f0f2f5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDark ? '#242526' : '#ffffff',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14.5,
                      fontWeight: '700',
                      color: isDark ? '#36a4fa' : '#0866FF',
                      letterSpacing: 0.3,
                    }}
                  >
                    {format12Hour(selectedHour, selectedMinute)}
                  </Text>
                </View>

                {/* Column Headers (Hour | Minute) */}
                <View
                  style={{
                    height: 24,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? '#393a3b' : '#f0f2f5',
                    backgroundColor: isDark ? '#1f2022' : '#fafbfc',
                  }}
                >
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: isDark ? '#8a8d91' : '#65676b',
                      }}
                    >
                      {locale === 'bn' ? 'ঘণ্টা' : 'HR'}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 1,
                      height: '100%',
                      backgroundColor: isDark ? '#393a3b' : '#f0f2f5',
                    }}
                  />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: isDark ? '#8a8d91' : '#65676b',
                      }}
                    >
                      {locale === 'bn' ? 'মিনিট' : 'MIN'}
                    </Text>
                  </View>
                </View>

                {/* 2 Balanced Columns: Hours (00..23) & Minutes (00..59) */}
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    height: TIME_LIST_HEIGHT,
                    maxHeight: TIME_LIST_HEIGHT,
                  }}
                >
                  {renderTimeColumn(24, selectedHour, setSelectedHour, hourScrollRef)}

                  {/* Vertical Column Divider */}
                  <View
                    style={{
                      width: 1,
                      height: '100%',
                      backgroundColor: isDark ? '#393a3b' : '#f0f2f5',
                    }}
                  />

                  {renderTimeColumn(60, selectedMinute, setSelectedMinute, minuteScrollRef)}
                </View>
              </View>
            </View>

            {/* Bottom Footer Bar: Now (Left) & OK (Right) */}
            <View
              style={{
                height: 46,
                borderTopWidth: 1,
                borderTopColor: isDark ? '#393a3b' : '#f0f2f5',
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: isDark ? '#1f2022' : '#f8f9fa',
              }}
            >
              <Pressable
                onPress={handleNow}
                hitSlop={8}
                style={{
                  paddingVertical: 5,
                  paddingHorizontal: 8,
                  borderRadius: 6,
                }}
                className="active:opacity-70"
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: isDark ? '#e4e6eb' : '#65676b',
                  }}
                >
                  {locale === 'bn' ? 'এখন (Now)' : 'Now'}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                className="active:scale-95"
                style={{
                  backgroundColor: '#0866FF',
                  paddingHorizontal: 18,
                  paddingVertical: 7,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#ffffff',
                  }}
                >
                  {locale === 'bn' ? 'ঠিক আছে (OK)' : 'OK'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
