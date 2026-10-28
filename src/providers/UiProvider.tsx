import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'nativewind';

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

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<'bn' | 'en'>('bn');
  const [isMenuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isComposerModalOpen, setComposerModalOpen] = useState(false);
  const { colorScheme, setColorScheme } = useColorScheme();

  const theme = colorScheme === 'dark' ? 'dark' : 'light';

  const toggleTheme = () => {
    setColorScheme(theme === 'dark' ? 'light' : 'dark');
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
