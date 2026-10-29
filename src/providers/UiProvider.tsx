import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'nativewind';
import { appStorage } from '@/lib/storage/secureStorage';

const LOCALE_STORAGE_KEY = 'peacetweet_locale';
const THEME_STORAGE_KEY = 'peacetweet_theme';

interface UiContextType {
  locale: 'bn' | 'en';
  setLocale: (locale: 'bn' | 'en') => void;
  isMenuDrawerOpen: boolean;
  setMenuDrawerOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  isComposerModalOpen: boolean;
  setComposerModalOpen: (open: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

function getInitialLocale(): 'bn' | 'en' {
  const saved = appStorage.getItem(LOCALE_STORAGE_KEY);
  return saved === 'en' || saved === 'bn' ? saved : 'bn';
}

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<'bn' | 'en'>(getInitialLocale);
  const [isMenuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isComposerModalOpen, setComposerModalOpen] = useState(false);
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    const savedTheme = appStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setColorScheme(savedTheme);
    }
  }, [setColorScheme]);

  const setLocale = (nextLocale: 'bn' | 'en') => {
    setLocaleState(nextLocale);
    appStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  };

  const theme = colorScheme === 'dark' ? 'dark' : 'light';

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setColorScheme(nextTheme);
    appStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  return (
    <UiContext.Provider
      value={{
        locale,
        setLocale,
        isMenuDrawerOpen,
        setMenuDrawerOpen,
        isSearchOpen,
        setSearchOpen,
        isComposerModalOpen,
        setComposerModalOpen,
        theme,
        toggleTheme,
      }}>
      {children}
    </UiContext.Provider>
  );
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) {
    throw new Error('useUi must be used within a UiProvider');
  }
  return ctx;
}
