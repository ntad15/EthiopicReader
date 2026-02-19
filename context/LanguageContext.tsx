import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '@/data/types';
import { DEFAULT_LANGUAGES } from '@/constants/languages';

interface LanguageContextValue {
  activeLanguages: Language[];
  toggleLanguage: (lang: Language) => void;
  isActive: (lang: Language) => boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  activeLanguages: DEFAULT_LANGUAGES,
  toggleLanguage: () => {},
  isActive: () => false,
});

const STORAGE_KEY = 'kidase_languages';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [activeLanguages, setActiveLanguages] = useState<Language[]>(DEFAULT_LANGUAGES);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        const parsed: Language[] = JSON.parse(stored);
        if (parsed.length > 0) setActiveLanguages(parsed);
      }
    });
  }, []);

  function toggleLanguage(lang: Language) {
    setActiveLanguages((prev) => {
      // Don't allow deselecting the last active language
      if (prev.includes(lang) && prev.length === 1) return prev;
      const next = prev.includes(lang)
        ? prev.filter((l) => l !== lang)
        : [...prev, lang];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function isActive(lang: Language) {
    return activeLanguages.includes(lang);
  }

  return (
    <LanguageContext.Provider value={{ activeLanguages, toggleLanguage, isActive }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
