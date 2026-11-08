import React, { useState, useMemo } from 'react';
import { ScrollView, Platform, KeyboardAvoidingView, View } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { appStorage } from '@/lib/storage/secureStorage';
import { ZakatState } from '@/features/zakat/types/zakat.types';
import {
  DEFAULT_ZAKAT_STATE,
  FiqhTip,
} from '@/features/zakat/constants/zakatConstants';
import { calculateZakat } from '@/features/zakat/utils/zakatCalculator';

// Modular Accordion & UI Components
import { ZakatOverviewChips } from '@/features/zakat/components/ZakatOverviewChips';
import { ZakatAccordionNisab } from '@/features/zakat/components/ZakatAccordionNisab';
import { ZakatAccordionCash } from '@/features/zakat/components/ZakatAccordionCash';
import { ZakatAccordionGold } from '@/features/zakat/components/ZakatAccordionGold';
import { ZakatAccordionBusiness } from '@/features/zakat/components/ZakatAccordionBusiness';
import { ZakatAccordionDebts } from '@/features/zakat/components/ZakatAccordionDebts';
import { ZakatFinalSummaryCard } from '@/features/zakat/components/ZakatFinalSummaryCard';
import { ZakatTipModal } from '@/features/zakat/components/ZakatTipModal';

const ZAKAT_STORAGE_KEY = 'peacetweet_zakat_saved_state';

type SectionKey = 'nisab' | 'cash' | 'gold' | 'business' | 'debts';

export default function ZakatScreen() {
  const { locale, theme, showToast, openComposer, handleFeedScroll } = useUi();
  const isDark = theme === 'dark';

  // Dedicated page language state (switching it ONLY changes this page's language)
  const [pageLocale, setPageLocale] = useState<'bn' | 'en'>(() =>
    locale === 'en' ? 'en' : 'bn'
  );

  const handleToggleLanguage = () => {
    setPageLocale((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  const [activeTip, setActiveTip] = useState<FiqhTip | null>(null);

  // Accordion open/close states
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>(
    {
      nisab: true,
      cash: true,
      gold: true,
      business: true,
      debts: true,
    }
  );

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllSections = (expand: boolean) => {
    setOpenSections({
      nisab: expand,
      cash: expand,
      gold: expand,
      business: expand,
      debts: expand,
    });
  };

  const isAllOpen = Object.values(openSections).every(Boolean);

  // Zakat Form State
  const [state, setState] = useState<ZakatState>(() => {
    try {
      const saved = appStorage.getItem(ZAKAT_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_ZAKAT_STATE, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_ZAKAT_STATE;
  });

  // Calculate live results whenever state changes
  const results = useMemo(() => calculateZakat(state), [state]);

  const handleChangeField = (field: keyof ZakatState, val: any) => {
    setState((prev) => ({ ...prev, [field]: val }));
  };

  const handleSaveState = () => {
    try {
      appStorage.setItem(ZAKAT_STORAGE_KEY, JSON.stringify(state));
      showToast({
        message:
          pageLocale === 'bn'
            ? 'যাকাতের হিসাব সফলভাবে সংরক্ষণ করা হয়েছে!'
            : 'Zakat calculation saved successfully!',
        type: 'success',
      });
    } catch {
      showToast({
        message:
          pageLocale === 'bn'
            ? 'হিসাব সংরক্ষণ করা সম্ভব হয়নি।'
            : 'Failed to save calculation.',
        type: 'error',
      });
    }
  };

  const handleReset = () => {
    setState(DEFAULT_ZAKAT_STATE);
    appStorage.setItem(ZAKAT_STORAGE_KEY, JSON.stringify(DEFAULT_ZAKAT_STATE));
    showToast({
      message:
        pageLocale === 'bn'
          ? 'যাকাতের হিসাব রিসেট করা হয়েছে।'
          : 'Zakat calculation has been reset.',
      type: 'info',
    });
  };

  const handleShareInspiration = () => {
    openComposer({
      mode: 'TEXT',
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#e6e9ef] dark:bg-[#18191a]"
    >
      {/* Main Scrollable Body with Accordions (No Header Bar) */}
      <ScrollView
        className="flex-1"
        onScroll={handleFeedScroll}
        scrollEventThrottle={8}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: 72,
          paddingBottom: 76,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[768px] mx-auto">
          {/* Quick Overview Chips with Reset, Save, Collapse & Language Toggle */}
          <ZakatOverviewChips
            results={results}
            isAllOpen={isAllOpen}
            onToggleAll={toggleAllSections}
            onReset={handleReset}
            onSave={handleSaveState}
            onToggleLanguage={handleToggleLanguage}
            isDark={isDark}
            locale={pageLocale}
          />

          {/* 1. Nisab & Rates Accordion */}
          <ZakatAccordionNisab
            state={state}
            onChangeField={handleChangeField}
            isOpen={openSections.nisab}
            onToggle={() => toggleSection('nisab')}
            nisabThreshold={results.nisabThreshold}
            onOpenTip={setActiveTip}
            isDark={isDark}
            locale={pageLocale}
          />

          {/* 2. Cash & Bank Accordion */}
          <ZakatAccordionCash
            state={state}
            onChangeField={handleChangeField}
            isOpen={openSections.cash}
            onToggle={() => toggleSection('cash')}
            totalCash={results.totalCashAssets}
            onOpenTip={setActiveTip}
            isDark={isDark}
            locale={pageLocale}
          />

          {/* 3. Gold & Silver Accordion */}
          <ZakatAccordionGold
            state={state}
            onChangeField={handleChangeField}
            isOpen={openSections.gold}
            onToggle={() => toggleSection('gold')}
            totalGoldSilver={results.totalGoldSilverAssets}
            onOpenTip={setActiveTip}
            isDark={isDark}
            locale={pageLocale}
          />

          {/* 4. Business & Investments Accordion */}
          <ZakatAccordionBusiness
            state={state}
            onChangeField={handleChangeField}
            isOpen={openSections.business}
            onToggle={() => toggleSection('business')}
            totalBusiness={results.totalBusinessAssets}
            onOpenTip={setActiveTip}
            isDark={isDark}
            locale={pageLocale}
          />

          {/* 5. Deductible Debts Accordion */}
          <ZakatAccordionDebts
            state={state}
            onChangeField={handleChangeField}
            isOpen={openSections.debts}
            onToggle={() => toggleSection('debts')}
            totalDebts={results.totalLiabilities}
            onOpenTip={setActiveTip}
            isDark={isDark}
            locale={pageLocale}
          />

          {/* 6. Final Calculation Summary Card (Category Box style at bottom) */}
          <ZakatFinalSummaryCard
            results={results}
            yearStandard={state.yearStandard}
            onShare={handleShareInspiration}
            onSave={handleSaveState}
            onReset={handleReset}
            isDark={isDark}
            locale={pageLocale}
          />
        </View>
      </ScrollView>

      {/* Fiqh Guidance Tip Modal */}
      <ZakatTipModal
        tip={activeTip}
        onClose={() => setActiveTip(null)}
        isDark={isDark}
        locale={pageLocale}
      />
    </KeyboardAvoidingView>
  );
}
