import { Language } from '@/data/types';
import { SelectedReading } from '@/data/readingSlots';
import { SLOT_BOOKS } from '@/data/bibleBooks';

/** Find a BibleBook by its canonical id, searching all slot lists. */
function findBook(bookId: string) {
  for (const books of Object.values(SLOT_BOOKS)) {
    const found = books.find((b) => b.id === bookId);
    if (found) return found;
  }
  return null;
}

/** Return the book's display name in the given language. */
function bookName(bookId: string, lang: Language): string {
  const book = findBook(bookId);
  if (!book) return bookId;
  switch (lang) {
    case 'amharic': return book.amharic;
    case 'geez':    return book.geez;
    case 'transliteration': return book.transliteration;
    default:        return book.english;
  }
}

/** Returns the display name of a book in the given language. */
export function bookDisplayName(bookId: string, lang: Language): string {
  return bookName(bookId, lang);
}

/**
 * Formats the chapter/verse portion of a reading as "Ch. X : Y - Z".
 * Used to build combined dynamic headings.
 */
export function formatReadingChapterVerse(reading: SelectedReading): string {
  const { chapter, startVerse, endVerse } = reading;
  const range = startVerse === endVerse ? `${startVerse}` : `${startVerse}-${endVerse}`;
  return `Ch. ${chapter}:${range}`;
}

/**
 * Formats a SelectedReading into a display string appropriate for the given
 * language, e.g. "Romans 8:3-18" or "ዘሮሜ 8፡3-18".
 */
export function formatReading(reading: SelectedReading, lang: Language): string {
  const name = bookName(reading.bookId, lang);
  const sep = lang === 'geez' || lang === 'amharic' ? '፡' : ':';
  const { chapter, startVerse, endVerse } = reading;
  const range = startVerse === endVerse
    ? `${startVerse}`
    : `${startVerse}-${endVerse}`;
  return `${name} ${chapter}${sep}${range}`;
}


