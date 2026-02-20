import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '@/data/types';
import { DEFAULT_LANGUAGES } from '@/constants/languages';

const MAX_LANGUAGES = 3;

interface LanguageContextValue {
  activeLanguages: Language[];
  primaryLanguage: Language;
  toggleLanguage: (lang: Language) => void;
  setPrimaryLanguage: (lang: Language) => void;
  isActive: (lang: Language) => boolean;
  canAddMore: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  activeLanguages: DEFAULT_LANGUAGES,
  primaryLanguage: DEFAULT_LANGUAGES[0],
  toggleLanguage: () => {},
  setPrimaryLanguage: () => {},
  isActive: () => false,
  canAddMore: true,
});

const STORAGE_KEY = 'kidase_languages';
const PRIMARY_STORAGE_KEY = 'kidase_primary_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [activeLanguages, setActiveLanguages] = useState<Language[]>(DEFAULT_LANGUAGES);
  const [primaryLanguage, setPrimaryLanguageState] = useState<Language>(DEFAULT_LANGUAGES[0]);

  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_KEY, PRIMARY_STORAGE_KEY]).then(([[, storedLangs], [, storedPrimary]]) => {
      if (storedLangs) {
        const parsed: Language[] = JSON.parse(storedLangs);
        if (parsed.length > 0) setActiveLanguages(parsed);
      }
      if (storedPrimary) {
        setPrimaryLanguageState(storedPrimary as Language);
      }
    });
  }, []);

  function toggleLanguage(lang: Language) {
    setActiveLanguages((prev) => {
      // Don't allow deselecting the last active language
      if (prev.includes(lang) && prev.length === 1) return prev;
      // Don't allow more than MAX_LANGUAGES
      if (!prev.includes(lang) && prev.length >= MAX_LANGUAGES) return prev;
      const next = prev.includes(lang)
        ? prev.filter((l) => l !== lang)
        : [...prev, lang];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      // If the removed language was primary, reassign to the first remaining active language
      if (prev.includes(lang) && lang === primaryLanguage) {
        const fallback = next[0];
        setPrimaryLanguageState(fallback);
        AsyncStorage.setItem(PRIMARY_STORAGE_KEY, fallback);
      }
      return next;
    });
  }

  function setPrimaryLanguage(lang: Language) {
    setPrimaryLanguageState(lang);
    AsyncStorage.setItem(PRIMARY_STORAGE_KEY, lang);
  }

  function isActive(lang: Language) {
    return activeLanguages.includes(lang);
  }

  return (
    <LanguageContext.Provider value={{ activeLanguages, primaryLanguage, toggleLanguage, setPrimaryLanguage, isActive, canAddMore: activeLanguages.length < MAX_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
