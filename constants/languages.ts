import { Language } from '@/data/types';

export const LANGUAGE_LABELS: Record<Language, string> = {
  geez: "Ge'ez",
  amharic: 'Amharic',
  english: 'English',
  transliteration: 'Transliteration',
};

export const ALL_LANGUAGES: Language[] = ['geez', 'amharic', 'english', 'transliteration'];

export const DEFAULT_LANGUAGES: Language[] = ['english'];
