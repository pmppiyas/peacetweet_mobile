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

const webNoOutline = Platform.OS === 'web' ? ({
  outlineStyle: 'none',
  outlineWidth: 0,
  outlineColor: 'transparent',
  outline: 'none',
  boxShadow: 'none',
} as any) : undefined;

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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

  // Time state (12-hour format)
  const getInitialTime = (d: Date) => {
    const h24 = d.getHours();
    const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return {
      hour: h12,
      minute: d.getMinutes(),
      period,
    };
  };

  const initialTime = useMemo(() => getInitialTime(initialDate), [initialDate]);

  const [selectedHour, setSelectedHour] = useState(initialTime.hour);
  const [selectedMinute, setSelectedMinute] = useState(initialTime.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(initialTime.period);

  // Auto-scroll time columns to selected positions on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const itemH = 28;
        const hourIdx = Math.max(0, selectedHour - 1);
        hourScrollRef.current?.scrollTo({ y: Math.max(0, hourIdx * itemH - 40), animated: false });
        minuteScrollRef.current?.scrollTo({ y: Math.max(0, selectedMinute * itemH - 40), animated: false });
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
    const t = getInitialTime(d);
    setSelectedHour(t.hour);
    setSelectedMinute(t.minute);
    setSelectedPeriod(t.period);
    setIsOpen(true);
  };

  // Format string for input: 12-hour format (e.g. 2026-11-20 11:03 PM)
  const displayValue = useMemo(() => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const h24 = d.getHours();
    const period = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    const hh = String(h12).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min} ${period}`;
  }, [value]);

  // Calendar 42 cells matrix (6 rows x 7 cols)
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { day: number; isCurrentMonth: boolean; monthOffset: number }[] = [];

    // Preceding month overflow
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

    // Following month overflow
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

  const handleSelectDay = (cell: { day: number; isCurrentMonth: boolean; monthOffset: number }) => {
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
    const t = getInitialTime(now);
    setSelectedHour(t.hour);
    setSelectedMinute(t.minute);
    setSelectedPeriod(t.period);

    // Scroll to current time
    setTimeout(() => {
      const itemH = 28;
      const hourIdx = Math.max(0, t.hour - 1);
      hourScrollRef.current?.scrollTo({ y: Math.max(0, hourIdx * itemH - 40), animated: true });
      minuteScrollRef.current?.scrollTo({ y: Math.max(0, t.minute * itemH - 40), animated: true });
    }, 40);
  };

  // "OK" action
  const handleConfirm = () => {
    let h24 = selectedHour;
    if (selectedPeriod === 'AM') {
      if (h24 === 12) h24 = 0;
    } else {
      if (h24 !== 12) h24 += 12;
    }
    const finalDate = new Date(viewYear, viewMonth, selectedDate, h24, selectedMinute, 0);
    onChange(finalDate.toISOString());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
  };

  // Time header string (e.g. 10:24 PM)
  const timeHeader = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')} ${selectedPeriod}`;

  return (
    <View className="w-full">
      {label && (
        <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] mb-1">
          {label} {required && <Text className="text-rose-500">*</Text>}
        </Text>
      )}

      {/* Input box */}
      <Pressable
        onPress={handleOpen}
        style={webNoOutline}
        className={`bg-[#f0f2f5] dark:bg-[#242526] rounded-xl px-3 py-2.5 flex-row items-center justify-between border ${
          isOpen
            ? 'border-orange-500 dark:border-orange-500'
            : 'border-[#e4e6eb] dark:border-[#393a3b]'
        }`}>
        <View className="flex-row items-center gap-2 flex-1">
          <AppIcon android="schedule" size={16} color={isOpen ? '#ea580c' : '#65676b'} />
          <Text
            className={`text-xs ${
              displayValue
                ? 'text-[#050505] dark:text-[#e4e6eb] font-medium'
                : 'text-[#8a8d91] dark:text-[#65676b]'
            }`}>
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
            className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
            <AppIcon android="close" size={14} color="#8a8d91" />
          </Pressable>
        ) : null}
      </Pressable>

      {error ? (
        <Text className="text-xs text-rose-500 mt-1">{error}</Text>
      ) : null}

      {/* Date & Time Picker Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}>
        <Pressable
          onPress={() => setIsOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: 375,
              maxWidth: '96%',
              backgroundColor: isDark ? '#242526' : '#ffffff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? '#393a3b' : '#e4e6eb',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 10,
              overflow: 'hidden',
            }}>
            {/* Top Container: Calendar (Left) + Time Picker (Right) */}
            <View style={{ flexDirection: 'row', height: 236 }}>
              {/* Left Side: Calendar */}
              <View style={{ width: 235, padding: 10, justifyContent: 'space-between' }}>
                {/* Calendar Header: <<  <  Month Year  >  >> */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                    paddingHorizontal: 2,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Pressable
                      onPress={handlePrevYear}
                      hitSlop={8}
                      style={{ padding: 3, borderRadius: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#b0b3b8' : '#65676b' }}>
                        «
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handlePrevMonth}
                      hitSlop={8}
                      style={{ padding: 3, borderRadius: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#b0b3b8' : '#65676b' }}>
                        ‹
                      </Text>
                    </Pressable>
                  </View>

                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: isDark ? '#e4e6eb' : '#050505',
                    }}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Pressable
                      onPress={handleNextMonth}
                      hitSlop={8}
                      style={{ padding: 3, borderRadius: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#b0b3b8' : '#65676b' }}>
                        ›
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleNextYear}
                      hitSlop={8}
                      style={{ padding: 3, borderRadius: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#b0b3b8' : '#65676b' }}>
                        »
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Week Day Labels (Su Mo Tu We Th Fr Sa) */}
                <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                  {WEEK_DAYS.map((wd) => (
                    <View key={wd} style={{ width: '14.28%', alignItems: 'center' }}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: isDark ? '#65676b' : '#8a8d91',
                        }}>
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
                          height: 27,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Pressable
                          onPress={() => handleSelectDay(cell)}
                          style={{
                            width: 25,
                            height: 25,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 6,
                            backgroundColor: isSelected ? '#ea580c' : 'transparent',
                          }}>
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: isSelected ? '700' : '500',
                              color: isSelected
                                ? '#ffffff'
                                : cell.isCurrentMonth
                                ? isDark
                                  ? '#e4e6eb'
                                  : '#050505'
                                : isDark
                                ? '#4e4f50'
                                : '#c4c7cc',
                            }}>
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
                  backgroundColor: isDark ? '#393a3b' : '#e4e6eb',
                }}
              />

              {/* Right Side: Time Picker */}
              <View style={{ flex: 1, flexDirection: 'column', height: 236 }}>
                {/* Time Display Header (e.g. 10:24 PM) */}
                <View
                  style={{
                    height: 36,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? '#393a3b' : '#e4e6eb',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: isDark ? '#e4e6eb' : '#050505',
                    }}>
                    {timeHeader}
                  </Text>
                </View>

                {/* 3 Strict Columns: Hour, Minute, AM/PM with 196px fixed height */}
                <View style={{ flex: 1, flexDirection: 'row', height: 200, maxHeight: 200 }}>
                  {/* Hours Column (1..12) */}
                  <ScrollView
                    ref={hourScrollRef}
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1, height: 200, maxHeight: 200 }}
                    contentContainerStyle={{ paddingVertical: 4 }}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                      const isSelected = selectedHour === h;
                      return (
                        <Pressable
                          key={h}
                          onPress={() => setSelectedHour(h)}
                          style={{
                            height: 28,
                            marginVertical: 1,
                            marginHorizontal: 3,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 4,
                            backgroundColor: isSelected
                              ? isDark
                                ? 'rgba(234, 88, 12, 0.25)'
                                : '#fff7ed'
                              : 'transparent',
                          }}>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: isSelected ? '700' : '500',
                              color: isSelected
                                ? isDark
                                  ? '#fb923c'
                                  : '#ea580c'
                                : isDark
                                ? '#e4e6eb'
                                : '#050505',
                            }}>
                            {h}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {/* Vertical Column Divider */}
                  <View
                    style={{
                      width: 1,
                      height: '100%',
                      backgroundColor: isDark ? '#393a3b' : '#f0f2f5',
                    }}
                  />

                  {/* Minutes Column (00..59) */}
                  <ScrollView
                    ref={minuteScrollRef}
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1, height: 200, maxHeight: 200 }}
                    contentContainerStyle={{ paddingVertical: 4 }}>
                    {Array.from({ length: 60 }, (_, i) => i).map((m) => {
                      const isSelected = selectedMinute === m;
                      const formattedM = String(m).padStart(2, '0');
                      return (
                        <Pressable
                          key={m}
                          onPress={() => setSelectedMinute(m)}
                          style={{
                            height: 28,
                            marginVertical: 1,
                            marginHorizontal: 3,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 4,
                            backgroundColor: isSelected
                              ? isDark
                                ? 'rgba(234, 88, 12, 0.25)'
                                : '#fff7ed'
                              : 'transparent',
                          }}>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: isSelected ? '700' : '500',
                              color: isSelected
                                ? isDark
                                  ? '#fb923c'
                                  : '#ea580c'
                                : isDark
                                ? '#e4e6eb'
                                : '#050505',
                            }}>
                            {formattedM}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {/* Vertical Column Divider */}
                  <View
                    style={{
                      width: 1,
                      height: '100%',
                      backgroundColor: isDark ? '#393a3b' : '#f0f2f5',
                    }}
                  />

                  {/* AM/PM Column */}
                  <View style={{ width: 44, paddingVertical: 4 }}>
                    {(['AM', 'PM'] as const).map((p) => {
                      const isSelected = selectedPeriod === p;
                      return (
                        <Pressable
                          key={p}
                          onPress={() => setSelectedPeriod(p)}
                          style={{
                            height: 28,
                            marginVertical: 1,
                            marginHorizontal: 3,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 4,
                            backgroundColor: isSelected
                              ? isDark
                                ? 'rgba(234, 88, 12, 0.25)'
                                : '#fff7ed'
                              : 'transparent',
                          }}>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: isSelected ? '700' : '500',
                              color: isSelected
                                ? isDark
                                  ? '#fb923c'
                                  : '#ea580c'
                                : isDark
                                ? '#e4e6eb'
                                : '#050505',
                            }}>
                            {p}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>

            {/* Bottom Footer Bar: Now (Left) & OK (Right) */}
            <View
              style={{
                height: 42,
                borderTopWidth: 1,
                borderTopColor: isDark ? '#393a3b' : '#e4e6eb',
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: isDark ? '#1f2022' : '#fafbfc',
              }}>
              <Pressable
                onPress={handleNow}
                hitSlop={8}
                style={{ paddingVertical: 4, paddingHorizontal: 6, borderRadius: 4 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: isDark ? '#e4e6eb' : '#050505',
                  }}>
                  {locale === 'bn' ? 'এখন (Now)' : 'Now'}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                style={{
                  backgroundColor: '#0284c7',
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffff' }}>
                  {locale === 'bn' ? 'ঠিক আছে (OK)' : 'OK'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
