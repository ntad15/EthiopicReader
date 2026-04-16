import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { ReadingSlotKey, SelectedReading, SlotLabelConfig } from '@/data/readingSlots';
import { SLOT_BOOKS, BibleBook } from '@/data/bibleBooks';

interface Props {
  slotKey: ReadingSlotKey;
  config: SlotLabelConfig;
  value: SelectedReading | null;
  onChange: (key: ReadingSlotKey, reading: SelectedReading | null) => void;
}

/** Find a book from eligible list by matching any language field (case-insensitive). */
function findBookByName(query: string, eligible: BibleBook[]): BibleBook | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const fields = (b: BibleBook) =>
    [b.english, b.amharic, b.geez, b.transliteration].map((s) => s.toLowerCase());
  for (const b of eligible) if (fields(b).some((f) => f === q)) return b;
  for (const b of eligible) if (fields(b).some((f) => f.startsWith(q))) return b;
  for (const b of eligible) if (fields(b).some((f) => f.includes(q))) return b;
  return null;
}

/** Serialize a SelectedReading back to the display string. */
function toText(value: SelectedReading | null, eligible: BibleBook[], singleBook: boolean): string {
  if (!value) return '';
  const { bookId, chapter, startVerse, endVerse } = value;
  const range = startVerse === endVerse ? `${startVerse}` : `${startVerse}-${endVerse}`;
  const cv = `${chapter}:${range}`;
  if (singleBook) return cv;
  const book = eligible.find((b) => b.id === bookId);
  return book ? `${book.english} ${cv}` : `${bookId} ${cv}`;
}

/** Parse free text into a SelectedReading, or return null if invalid. */
function parseText(
  raw: string,
  eligible: BibleBook[],
  defaultBook: BibleBook | null,
  singleBook: boolean,
): SelectedReading | null {
  const s = raw.trim();
  if (!s) return null;
  if (singleBook) {
    const m = s.match(/^(\d+):(\d+)(?:-(\d+))?$/);
    if (!m || !defaultBook) return null;
    const chapter = parseInt(m[1], 10);
    const startVerse = parseInt(m[2], 10);
    const endVerse = m[3] ? parseInt(m[3], 10) : startVerse;
    return { bookId: defaultBook.id, chapter, startVerse, endVerse: Math.max(startVerse, endVerse) };
  } else {
    const m = s.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
    if (!m) return null;
    const book = findBookByName(m[1], eligible);
    if (!book) return null;
    const chapter = parseInt(m[2], 10);
    const startVerse = parseInt(m[3], 10);
    const endVerse = m[4] ? parseInt(m[4], 10) : startVerse;
    return { bookId: book.id, chapter, startVerse, endVerse: Math.max(startVerse, endVerse) };
  }
}

export default function ReadingSlotInput({ slotKey, config, value, onChange }: Props) {
  const eligible = SLOT_BOOKS[slotKey] ?? [];
  const defaultBook = config.singleBook && eligible.length > 0 ? eligible[0] : null;

  const [text, setText] = useState(() => toText(value, eligible, config.singleBook));
  const [error, setError] = useState<string | null>(null);

  // Sync display text when external value changes (e.g. clear-all)
  const prevValueRef = useRef(value);
  if (prevValueRef.current !== value) {
    prevValueRef.current = value;
    setText(toText(value, eligible, config.singleBook));
    setError(null);
  }

  function handleBlur() {
    const raw = text.trim();
    if (!raw) {
      setError(null);
      onChange(slotKey, null);
      return;
    }
    const result = parseText(raw, eligible, defaultBook, config.singleBook);
    if (result) {
      setError(null);
      setText(toText(result, eligible, config.singleBook)); // normalize
      onChange(slotKey, result);
    } else {
      setError(`Format: ${config.singleBook ? 'ch:v-v' : 'Book ch:v-v'}  (${config.placeholder})`);
    }
  }

  function handleClear() {
    setText('');
    setError(null);
    onChange(slotKey, null);
  }

  const placeholder = config.placeholder;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{config.english}</Text>
        {value && (
          <TouchableOpacity onPress={handleClear} hitSlop={8} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={text}
        onChangeText={(t) => {
          setText(t);
          setError(null);
        }}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={Colors.textDim}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        returnKeyType="done"
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '700',
    fontSize: 13,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  clearText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.bodyRegular,
  },
  inputError: {
    borderColor: '#e04b4b',
  },
  errorText: {
    marginTop: 4,
    fontSize: 11,
    color: '#e04b4b',
    fontFamily: Fonts.bodyRegular,
  },
});
