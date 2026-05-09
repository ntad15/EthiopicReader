import { Language } from '@/data/types';
import { SelectedReading } from '@/data/readingSlots';
import { BIBLE_REGISTRY } from '@/data/bibleRegistry';

/**
 * A single verse with its number and text.
 */
export interface BibleVerse {
  verseNum: number;
  text: string;
}

/**
 * Cache for loaded Bible books to avoid re-parsing.
 * Key format: "language-bookId" (e.g., "english-Romans", "amharic-ወደ ሮሜ ሰዎች")
 */
const bibleCache: Record<string, any> = {};

/**
 * Map English book IDs to Amharic file names.
 * This mapping is based on the canonical book IDs used in ReadingsPicker.
 */
const AMHARIC_BOOK_MAP: Record<string, string> = {
  // Old Testament
  'Genesis': 'ኦሪት ዘፍጥረት',
  'Exodus': 'ኦሪት ዘጸአት',
  'Leviticus': 'ኦሪት ዘሌዋውያን',
  'Numbers': 'ኦሪት ዘኍልቍ',
  'Deuteronomy': 'ኦሪት ዘዳግም',
  'Joshua': 'መጽሐፈ ኢያሱ ወልደ ነዌ',
  'Judges': 'መጽሐፈ መሣፍንት',
  'Ruth': 'መጽሐፈ ሩት',
  '1 Samuel': 'መጽሐፈ ሳሙኤል ቀዳማዊ',
  '2 Samuel': 'መጽሐፈ ሳሙኤል ካል',
  '1 Kings': 'መጽሐፈ ነገሥት ቀዳማዊ',
  '2 Kings': 'መጽሐፈ ነገሥት ካልዕ',
  '1 Chronicles': 'መጽሐፈ ዜና መዋዕል ቀዳማዊ',
  '2 Chronicles': 'መጽሐፈ ዜና መዋዕል ካልዕ',
  'Ezra': 'መጽሐፈ ዕዝራ',
  'Nehemiah': 'መጽሐፈ ነህምያ',
  'Esther': 'መጽሐፈ አስቴር',
  'Job': 'መጽሐፈ ኢዮብ',
  'Psalm': 'መዝሙረ ዳዊት',
  'Proverbs': 'መጽሐፈ ምሳሌ',
  'Ecclesiastes': 'መጽሐፈ መክብብ',
  'Song Of Solomon': 'መኃልየ መኃልይ ዘሰሎሞን',
  'Isaiah': 'ትንቢተ ኢሳይያስ',
  'Jeremiah': 'ትንቢተ ኤርምያስ',
  'Lamentations': 'ሰቆቃው ኤርምያስ',
  'Ezekiel': 'ትንቢተ ሕዝቅኤል',
  'Daniel': 'ትንቢተ ዳንኤል',
  'Hosea': 'ትንቢተ ሆሴዕ',
  'Joel': 'ትንቢተ ኢዮኤል',
  'Amos': 'ትንቢተ አሞጽ',
  'Obadiah': 'ትንቢተ አብድዩ',
  'Jonah': 'ትንቢተ ዮናስ',
  'Micah': 'ትንቢተ ሚክያስ',
  'Nahum': 'ትንቢተ ናሆም',
  'Habakkuk': 'ትንቢተ ዕንባቆም',
  'Zephaniah': 'ትንቢተ ሶፎንያስ',
  'Haggai': 'ትንቢተ ሐጌ',
  'Zechariah': 'ትንቢተ ዘካርያስ',
  'Malachi': 'ትንቢተ ሚልክያ',
  
  // New Testament
  'Matthew': 'የማቴዎስ ወንጌል',
  'Mark': 'የማርቆስ ወንጌል',
  'Luke': 'የሉቃስ ወንጌል',
  'John': 'የዮሐንስ ወንጌል',
  'Acts': 'የሐዋርያት ሥራ',
  'Romans': 'ወደ ሮሜ ሰዎች',
  '1 Corinthians': '1ኛ ወደ ቆሮንቶስ ሰዎች',
  '2 Corinthians': '2ኛ ወደ ቆሮንቶስ ሰዎች',
  'Galatians': 'ወደ ገላትያ ሰዎች',
  'Ephesians': 'ኤፌሶን ሰዎች',
  'Philippians': 'ወደ ፊልጵስዩስ ሰዎች',
  'Colossians': 'ወደ ቆላስይስ ሰዎች',
  '1 Thessalonians': '1ኛ ወደ ተሰሎንቄ ሰዎች',
  '2 Thessalonians': '2ኛ ወደ ተሰሎንቄ ሰዎች',
  '1 Timothy': '1ኛ ወደ ጢሞቴዎስ',
  '2 Timothy': '2ኛ ወደ ጢሞቴዎስ',
  'Titus': 'ወደ ቲቶ',
  'Philemon': 'ወደ ፊልሞና',
  'Hebrews': 'ወደ ዕብራውያን',
  'James': 'የያዕቆብ መልእክት',
  '1 Peter': '1ኛ የጴጥሮስ መልእክት',
  '2 Peter': '2ኛ የጴጥሮስ መልእክት',
  '1 John': '1ኛ የዮሐንስ መልእክት',
  '2 John': '2ኛ የዮሐንስ መልእክት',
  '3 John': '3ኛ የዮሐንስ መልእክት',
  'Jude': 'የይሁዳ መልእክት',
  'Revelation': 'የዮሐንስ ራእይ',
};

/**
 * Load a book's JSON from the Bible registry.
 * Uses static imports to work with Metro bundler.
 * Returns null if the book doesn't exist.
 */
async function loadBook(
  language: 'english' | 'amharic',
  bookId: string
): Promise<any | null> {
  const cacheKey = `${language}-${bookId}`;
  if (bibleCache[cacheKey]) {
    return bibleCache[cacheKey];
  }

  // Look up from static registry
  const book = BIBLE_REGISTRY[language]?.[bookId];
  if (!book) {
    console.warn(`Bible book not found: ${language}/${bookId}`);
    return null;
  }

  bibleCache[cacheKey] = book;
  return book;
}

/**
 * Extract verses from an English Bible book (NKJV format).
 * Structure: { "BookName": { "chapterNum": { "verseNum": "text" } } }
 */
function extractEnglishVerses(
  book: any,
  bookId: string,
  chapter: number,
  startVerse: number,
  endVerse: number
): BibleVerse[] | null {
  if (!book || !book[bookId]) return null;
  
  const chapterData = book[bookId][String(chapter)];
  if (!chapterData) return null;

  const verses: BibleVerse[] = [];
  for (let v = startVerse; v <= endVerse; v++) {
    const text = chapterData[String(v)];
    if (text) {
      verses.push({ verseNum: v, text });
    }
  }

  return verses.length > 0 ? verses : null;
}

/**
 * Extract verses from an Amharic Bible book.
 * Structure: { "chapters": [ { "chapter": "1", "verses": ["text1", "text2", ...] } ] }
 * Note: Amharic verses are 0-indexed arrays, so verse 1 is at index 0.
 */
function extractAmharicVerses(
  book: any,
  chapter: number,
  startVerse: number,
  endVerse: number
): BibleVerse[] | null {
  if (!book || !book.chapters) return null;

  const chapterData = book.chapters.find((ch: any) => ch.chapter === String(chapter));
  if (!chapterData || !chapterData.verses) return null;

  const verses: BibleVerse[] = [];
  // Amharic verses are 0-indexed: verse 1 is at index 0
  for (let v = startVerse; v <= endVerse; v++) {
    const text = chapterData.verses[v - 1]; // Convert 1-based to 0-based
    if (text && text !== '-') { // Skip empty verses marked with "-"
      verses.push({ verseNum: v, text });
    }
  }

  return verses.length > 0 ? verses : null;
}

/**
 * Get verses from a reading selection for a specific language.
 * Returns an array of verse objects or null if unavailable.
 * 
 * @param reading - The selected reading (book, chapter, verse range)
 * @param language - The language to fetch ('english', 'amharic', 'geez', 'transliteration')
 * @returns Array of verses or null if not found
 */
export async function getVerses(
  reading: SelectedReading,
  language: Language
): Promise<BibleVerse[] | null> {
  const { bookId, chapter, startVerse, endVerse } = reading;

  // Map Language to file structure
  // For now, 'transliteration' falls back to English
  // For 'geez', we'd need Ge'ez files (TODO: add for Psalms)
  let lang: 'english' | 'amharic';
  if (language === 'english' || language === 'transliteration') {
    lang = 'english';
  } else if (language === 'geez') {
    // TODO: Add Ge'ez support for Psalms
    // For now, return null
    return null;
  } else {
    lang = 'amharic';
  }

  const book = await loadBook(lang, bookId);
  if (!book) return null;

  if (lang === 'english') {
    return extractEnglishVerses(book, bookId, chapter, startVerse, endVerse);
  } else {
    return extractAmharicVerses(book, chapter, startVerse, endVerse);
  }
}

/**
 * Format verses as a single continuous paragraph (for display).
 * Joins all verse texts with spaces.
 */
export function formatVersesAsText(verses: BibleVerse[]): string {
  return verses.map(v => v.text).join(' ');
}

/**
 * Format verses with verse numbers for detailed display.
 * Example: "¹ First verse text. ² Second verse text."
 */
export function formatVersesWithNumbers(verses: BibleVerse[]): string {
  return verses.map(v => {
    // Use superscript numbers
    const superscript = String(v.verseNum)
      .split('')
      .map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[parseInt(d)])
      .join('');
    return `${superscript} ${v.text}`;
  }).join(' ');
}
