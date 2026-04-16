/**
 * Curated Bible book catalog for the Readings Picker.
 * Only books that are liturgically eligible for at least one slot are listed.
 * versesPerChapter[0] = chapter 1's verse count.
 */

export interface BibleBook {
  id: string;              // canonical English key used throughout the app
  english: string;
  amharic: string;
  geez: string;
  transliteration: string;
  versesPerChapter: number[];
}

export type ReadingSlotKey = 'pauline' | 'catholic' | 'acts' | 'psalm' | 'gospel';

// ─── Pauline Epistles (14) ────────────────────────────────────────────────────

const ROMANS: BibleBook = {
  id: 'Romans',
  english: 'Romans',
  amharic: 'ሮሜ',
  geez: 'ዘሮሜ',
  transliteration: 'Rome',
  versesPerChapter: [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27],
};

const FIRST_CORINTHIANS: BibleBook = {
  id: '1 Corinthians',
  english: '1 Corinthians',
  amharic: '1 ቆሮንቶስ',
  geez: 'ቀዳሚት ቆሮንቶስ',
  transliteration: '1 Qorontos',
  versesPerChapter: [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24],
};

const SECOND_CORINTHIANS: BibleBook = {
  id: '2 Corinthians',
  english: '2 Corinthians',
  amharic: '2 ቆሮንቶስ',
  geez: 'ካልዕት ቆሮንቶስ',
  transliteration: '2 Qorontos',
  versesPerChapter: [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14],
};

const GALATIANS: BibleBook = {
  id: 'Galatians',
  english: 'Galatians',
  amharic: 'ገላትያ',
  geez: 'ገላትያ',
  transliteration: 'Galatya',
  versesPerChapter: [24, 21, 29, 31, 26, 18],
};

const EPHESIANS: BibleBook = {
  id: 'Ephesians',
  english: 'Ephesians',
  amharic: 'ኤፌሶን',
  geez: 'ኤፌሶን',
  transliteration: 'Efeson',
  versesPerChapter: [23, 22, 21, 32, 33, 24],
};

const PHILIPPIANS: BibleBook = {
  id: 'Philippians',
  english: 'Philippians',
  amharic: 'ፊልጵስዩስ',
  geez: 'ፊሊጲስ',
  transliteration: 'Filipis',
  versesPerChapter: [30, 30, 21, 23],
};

const COLOSSIANS: BibleBook = {
  id: 'Colossians',
  english: 'Colossians',
  amharic: 'ቆሎሲስ',
  geez: 'ቆላስ',
  transliteration: 'Qolas',
  versesPerChapter: [29, 23, 25, 18],
};

const FIRST_THESSALONIANS: BibleBook = {
  id: '1 Thessalonians',
  english: '1 Thessalonians',
  amharic: '1 ተሰሎንቄ',
  geez: 'ቀዳሚት ተሰሎንቄ',
  transliteration: '1 Tesaloneqe',
  versesPerChapter: [10, 20, 13, 18, 28],
};

const SECOND_THESSALONIANS: BibleBook = {
  id: '2 Thessalonians',
  english: '2 Thessalonians',
  amharic: '2 ተሰሎንቄ',
  geez: 'ካልዕት ተሰሎንቄ',
  transliteration: '2 Tesaloneqe',
  versesPerChapter: [12, 17, 18],
};

const FIRST_TIMOTHY: BibleBook = {
  id: '1 Timothy',
  english: '1 Timothy',
  amharic: '1 ጢሞቴዎስ',
  geez: 'ቀዳሚት ጢሞቴዎስ',
  transliteration: '1 Timotewos',
  versesPerChapter: [20, 15, 16, 16, 25, 21],
};

const SECOND_TIMOTHY: BibleBook = {
  id: '2 Timothy',
  english: '2 Timothy',
  amharic: '2 ጢሞቴዎስ',
  geez: 'ካልዕት ጢሞቴዎስ',
  transliteration: '2 Timotewos',
  versesPerChapter: [18, 26, 17, 22],
};

const TITUS: BibleBook = {
  id: 'Titus',
  english: 'Titus',
  amharic: 'ቲቶ',
  geez: 'ቲቶ',
  transliteration: 'Tito',
  versesPerChapter: [16, 15, 15],
};

const PHILEMON: BibleBook = {
  id: 'Philemon',
  english: 'Philemon',
  amharic: 'ፊልሞን',
  geez: 'ፊልሞን',
  transliteration: 'Filemon',
  versesPerChapter: [25],
};

const HEBREWS: BibleBook = {
  id: 'Hebrews',
  english: 'Hebrews',
  amharic: 'ዕብራውያን',
  geez: 'ዕብራውያን',
  transliteration: 'Ibrawiyan',
  versesPerChapter: [14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25],
};

// ─── Catholic Epistles (7) ────────────────────────────────────────────────────

const JAMES: BibleBook = {
  id: 'James',
  english: 'James',
  amharic: 'ያዕቆብ',
  geez: 'ያዕቆብ',
  transliteration: "Ya'qob",
  versesPerChapter: [27, 26, 18, 17, 20],
};

const FIRST_PETER: BibleBook = {
  id: '1 Peter',
  english: '1 Peter',
  amharic: '1 ጴጥሮስ',
  geez: 'ቀዳሚት ጴጥሮስ',
  transliteration: '1 Petros',
  versesPerChapter: [25, 25, 22, 19, 14],
};

const SECOND_PETER: BibleBook = {
  id: '2 Peter',
  english: '2 Peter',
  amharic: '2 ጴጥሮስ',
  geez: 'ካልዕት ጴጥሮስ',
  transliteration: '2 Petros',
  versesPerChapter: [21, 22, 18],
};

const FIRST_JOHN: BibleBook = {
  id: '1 John',
  english: '1 John',
  amharic: '1 ዮሐንስ',
  geez: 'ቀዳሚት ዮሐንስ',
  transliteration: '1 Yohannes',
  versesPerChapter: [10, 29, 24, 21, 21],
};

const SECOND_JOHN: BibleBook = {
  id: '2 John',
  english: '2 John',
  amharic: '2 ዮሐንስ',
  geez: 'ካልዕት ዮሐንስ',
  transliteration: '2 Yohannes',
  versesPerChapter: [13],
};

const THIRD_JOHN: BibleBook = {
  id: '3 John',
  english: '3 John',
  amharic: '3 ዮሐንስ',
  geez: 'ሣልስት ዮሐንስ',
  transliteration: '3 Yohannes',
  versesPerChapter: [14],
};

const JUDE: BibleBook = {
  id: 'Jude',
  english: 'Jude',
  amharic: 'ይሁዳ',
  geez: 'ይሁዳ',
  transliteration: 'Yihuda',
  versesPerChapter: [25],
};

// ─── Acts (1) ─────────────────────────────────────────────────────────────────

const ACTS: BibleBook = {
  id: 'Acts',
  english: 'Acts of the Apostles',
  amharic: 'የሐዋርያት ሥራ',
  geez: 'ስብሐ ሐዋርያት',
  transliteration: "Ser'ate Hawaryat",
  versesPerChapter: [
    26, 47, 26, 37, 42, 15, 60, 40, 43, 48,
    30, 25, 52, 28, 41, 40, 34, 28, 41, 38,
    40, 30, 35, 27, 27, 32, 44, 31,
  ],
};

// ─── Psalms (1) ───────────────────────────────────────────────────────────────

const PSALMS: BibleBook = {
  id: 'Psalms',
  english: 'Psalms',
  amharic: 'ዳዊት',
  geez: 'ዳዊት',
  transliteration: 'Dawit',
  // verse counts for Psalms 1–150
  versesPerChapter: [
     6, 12,  8,  8, 12, 10, 17,  9, 20, 18,
     7,  8,  6,  7,  5, 11, 15, 50, 14,  9,
    13, 31,  6, 10, 22, 12, 14,  9, 11, 12,
    24, 11, 22, 23, 28, 12, 40, 22, 13, 17,
    13, 11,  5, 26, 17, 11,  9, 14, 20, 23,
    19,  9,  6,  7, 23, 13, 11, 11, 17, 12,
     8, 12, 11, 10, 13, 20,  7, 35, 36,  5,
    24, 20, 28, 23, 10, 12, 20, 72, 13, 19,
    16,  8, 18, 12, 13, 17,  7, 18, 52, 17,
    16, 15,  5, 23, 11, 13, 12,  9,  9,  5,
     8, 28, 22, 35, 45, 48, 43, 13, 31,  7,
    10, 10,  9,  8, 18, 19,  2, 29,176,  7,
     8,  9,  4,  8,  5,  6,  5,  6,  8,  8,
     3, 18,  3,  3, 21, 26,  9,  8, 24, 13,
    10,  7, 12, 15, 21, 10, 20, 14,  9,  6,
  ],
};

// ─── Gospels (4) ──────────────────────────────────────────────────────────────

const MATTHEW: BibleBook = {
  id: 'Matthew',
  english: 'Matthew',
  amharic: 'ማቴዎስ',
  geez: 'ወንጌለ ማቴዎስ',
  transliteration: 'Matewos',
  versesPerChapter: [
    25, 23, 17, 25, 48, 34, 29, 34, 38, 42,
    30, 50, 58, 36, 39, 28, 27, 35, 30, 34,
    46, 46, 39, 51, 46, 75, 66, 20,
  ],
};

const MARK: BibleBook = {
  id: 'Mark',
  english: 'Mark',
  amharic: 'ማርቆስ',
  geez: 'ወንጌለ ማርቆስ',
  transliteration: 'Marqos',
  versesPerChapter: [45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20],
};

const LUKE: BibleBook = {
  id: 'Luke',
  english: 'Luke',
  amharic: 'ሉቃስ',
  geez: 'ወንጌለ ሉቃስ',
  transliteration: 'Luqas',
  versesPerChapter: [
    80, 52, 38, 44, 39, 49, 50, 56, 62, 42,
    54, 59, 35, 35, 32, 31, 37, 43, 48, 47,
    38, 71, 56, 53,
  ],
};

const JOHN: BibleBook = {
  id: 'John',
  english: 'John',
  amharic: 'ዮሐንስ',
  geez: 'ወንጌለ ዮሐንስ',
  transliteration: 'Yohannes',
  versesPerChapter: [
    51, 25, 36, 54, 47, 71, 53, 59, 41, 42,
    57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25,
  ],
};

// ─── Slot book lists ──────────────────────────────────────────────────────────

export const SLOT_BOOKS: Record<ReadingSlotKey, BibleBook[]> = {
  pauline: [
    ROMANS, FIRST_CORINTHIANS, SECOND_CORINTHIANS, GALATIANS,
    EPHESIANS, PHILIPPIANS, COLOSSIANS, FIRST_THESSALONIANS,
    SECOND_THESSALONIANS, FIRST_TIMOTHY, SECOND_TIMOTHY,
    TITUS, PHILEMON, HEBREWS,
  ],
  catholic: [JAMES, FIRST_PETER, SECOND_PETER, FIRST_JOHN, SECOND_JOHN, THIRD_JOHN, JUDE],
  acts: [ACTS],
  psalm: [PSALMS],
  gospel: [MATTHEW, MARK, LUKE, JOHN],
};


