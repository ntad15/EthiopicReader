import { Language } from '@/data/types';

/**
 * Collect active languages that have content in a block,
 * sorted so the primary language always appears first.
 */
export function getLanguageEntries(
  activeLanguages: Language[],
  primaryLanguage: Language,
  block: Partial<Record<Language, string>>,
): { lang: Language; text: string }[] {
  return activeLanguages
    .map((lang) => ({ lang, text: block[lang] ?? '' }))
    .filter((e) => e.text.length > 0)
    .sort((a, b) => {
      if (a.lang === primaryLanguage) return -1;
      if (b.lang === primaryLanguage) return 1;
      return 0;
    });
}
