import { ReadingSlotKey } from './bibleBooks';

export type { ReadingSlotKey };

export interface SelectedReading {
  /** Canonical English book id, e.g. "Romans" */
  bookId: string;
  chapter: number;
  startVerse: number;
  /** Inclusive end verse — must be >= startVerse */
  endVerse: number;
}

export interface SlotLabelConfig {
  key: ReadingSlotKey;
  english: string;
  amharic: string;
  geez: string;
  transliteration: string;
  /** If true, the book is fixed (no search field shown) */
  singleBook: boolean;
  /** Example shown as input placeholder, e.g. "Romans 8:3-18" */
  placeholder: string;
}

export const SLOT_CONFIGS: SlotLabelConfig[] = [
  {
    key: 'pauline',
    english: '1st Reading — Pauline Epistle',
    amharic: '1ኛ ምንባብ — የጳውሎስ መልእክት',
    geez: '1ኛ ምንባብ',
    transliteration: '1st Reading — Pauline',
    singleBook: false,
    placeholder: 'e.g. Romans 8:3-18',
  },
  {
    key: 'catholic',
    english: '2nd Reading — Catholic Epistle',
    amharic: '2ኛ ምንባብ — ካቶሊካዊት መልእክት',
    geez: '2ኛ ምንባብ',
    transliteration: '2nd Reading — Catholic',
    singleBook: false,
    placeholder: 'e.g. James 1:2-8',
  },
  {
    key: 'acts',
    english: '3rd Reading — Acts of the Apostles',
    amharic: '3ኛ ምንባብ — የሐዋርያት ሥራ',
    geez: '3ኛ ምንባብ',
    transliteration: '3rd Reading — Acts',
    singleBook: true,
    placeholder: 'e.g. 5:12-16',
  },
  {
    key: 'psalm',
    english: 'Psalm (Misbak)',
    amharic: 'ምስባክ',
    geez: 'ምስባክ',
    transliteration: 'Misbak',
    singleBook: true,
    placeholder: 'e.g. 119:1-8',
  },
  {
    key: 'gospel',
    english: 'Holy Gospel',
    amharic: 'ቅዱስ ወንጌል',
    geez: 'ቅዱስ ወንጌል',
    transliteration: 'Qidus Wengel',
    singleBook: false,
    placeholder: 'e.g. John 3:16-21',
  },
];

export function getSlotConfig(key: ReadingSlotKey): SlotLabelConfig | undefined {
  return SLOT_CONFIGS.find((c) => c.key === key);
}
