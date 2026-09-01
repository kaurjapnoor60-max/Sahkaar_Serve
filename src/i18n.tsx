import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Language } from '@/types';
import { TRANSLATIONS } from '@/data';

interface I18nState {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nState | null>(null);

export const LANG_LABELS: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी',
  pa: 'ਪੰਜਾਬੀ',
};

export const LANG_CODES: Language[] = ['en', 'hi', 'pa'];

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');
  const t = (key: string): string => {
    const dict = TRANSLATIONS[lang];
    if (!dict) return key;
    return dict[key] ?? key;
  };
  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
