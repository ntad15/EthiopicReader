import { View, Text, StyleSheet } from 'react-native';
import { Colors, speakerColors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useLanguage } from '@/context/LanguageContext';
import { useFontSize } from '@/context/FontSizeContext';
import { PrayerBlock as PrayerBlockType } from '@/data/types';
import { getLanguageEntries } from '@/utils/language';
import { useReadings } from '@/context/ReadingsContext';
import { formatReading, formatReadingChapterVerse, bookDisplayName } from '@/utils/readingFormatter';
import { ReadingSlotKey } from '@/data/bibleBooks';
import { getSlotConfig } from '@/data/readingSlots';

interface Props {
  block: PrayerBlockType;
}

export default function PrayerBlock({ block }: Props) {
  const { activeLanguages, primaryLanguage } = useLanguage();
  const { scale } = useFontSize();
  const { slots } = useReadings();

  if (block.type === 'heading') {
    const slotKey = block.dynamic as ReadingSlotKey | undefined;
    const reading = slotKey ? (slots[slotKey] ?? null) : null;

    let headingText: string;
    if (slotKey) {
      if (reading) {
        const bk = bookDisplayName(reading.bookId, primaryLanguage);
        const cv = formatReadingChapterVerse(reading);
        switch (slotKey) {
          case 'pauline':  headingText = `${bk} ${cv}`; break;
          case 'catholic': headingText = `${bk} ${cv}`; break;
          case 'acts':     headingText = `${bk} ${cv}`; break;
          case 'gospel':   headingText = `Holy Gospel - St. ${bk} ${cv}`; break;
          case 'psalm':    headingText = `Psalm ${reading.chapter}:${reading.startVerse}-${reading.endVerse}`; break;
          default:         headingText = block.english ?? block.geez ?? block.amharic ?? '';
        }
      } else {
        const config = getSlotConfig(slotKey);
        headingText = config?.english ?? block.english ?? block.geez ?? block.amharic ?? '';
      }
    } else {
      headingText = block.english ?? block.geez ?? block.amharic ?? '';
    }

    return (
      <View style={styles.headingContainer}>
        <View style={styles.headingBadge}>
          <Text style={[styles.heading, { fontSize: scale(12) }]}>
            {headingText}
          </Text>
        </View>
      </View>
    );
  }

  if (block.type === 'rubric') {
    const reading = block.dynamic ? (slots[block.dynamic as ReadingSlotKey] ?? null) : null;
    return (
      <View style={styles.rubricContainer}>
        <Text style={[styles.rubric, { fontSize: scale(13) }]}>
          {block.dynamic && reading
            ? formatReading(reading, primaryLanguage)
            : (block.english ?? block.geez ?? '')}
        </Text>
      </View>
    );
  }

  const speakerColor =
    block.speaker ? (speakerColors[block.speaker] ?? Colors.text) : Colors.text;

  const langEntries = getLanguageEntries(activeLanguages, primaryLanguage, block);

  if (langEntries.length === 0) return null;

  const isResponse = block.type === 'response';
  const isCongregation = block.speaker === 'congregation' || block.speaker === 'all';

  return (
    <View style={[
      styles.blockContainer,
      isResponse && styles.responseContainer,
      isCongregation && styles.congregationContainer,
    ]}>
      {block.speaker && (
        <Text style={[styles.speakerLabel, { color: speakerColor, fontSize: scale(9) }]}>
          {(block.speaker === 'congregation' ? 'People' : block.speaker).toUpperCase()}
        </Text>
      )}
      <View style={styles.columnsRow}>
        {langEntries.map(({ lang, text }) => (
          <View key={lang} style={[styles.langColumn, langEntries.length === 1 && styles.langColumnFull]}>
            <Text
              style={[
                styles.prayerText,
                {
                  fontSize: scale(lang === 'geez' || lang === 'amharic' ? 17 : 16),
                  lineHeight: scale(lang === 'geez' || lang === 'amharic' ? 17 : 16) * 1.6,
                },
                (lang === 'geez' || lang === 'amharic') && styles.geezText,
                lang === 'english' && styles.englishText,
                lang === 'transliteration' && styles.transliterationText,
              ]}
            >
              {text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Heading (section title badge) ── */
  headingContainer: {
    marginTop: 36,
    marginBottom: 14,
    alignItems: 'center',
  },
  headingBadge: {
    backgroundColor: Colors.burgundy,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
    alignSelf: 'center',
  },
  heading: {
    color: Colors.textOnColor,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  /* ── Rubric (instructions) ── */
  rubricContainer: {
    marginVertical: 10,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: Colors.border,
  },
  rubric: {
    color: Colors.rubric,
    fontFamily: Fonts.bodyItalic,
    fontStyle: 'italic',
    lineHeight: 22,
  },

  /* ── Prayer / Response blocks ── */
  blockContainer: {
    marginTop: 6,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  responseContainer: {
    paddingLeft: 24,
    borderLeftWidth: 6,
    borderLeftColor: Colors.accent,
    borderBottomWidth: 0,
    marginLeft: 8,
    marginBottom: 18,
    backgroundColor: Colors.accentDim,
    borderRadius: 2,
  },
  congregationContainer: {
    paddingLeft: 24,
    borderLeftWidth: 6,
    borderLeftColor: Colors.accent,
    backgroundColor: Colors.accentDim,
    borderRadius: 2,
    marginBottom: 20,
  },

  /* ── Speaker label ── */
  speakerLabel: {
    fontWeight: '800',
    letterSpacing: 3.5,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontSize: 9,
  },

  /* ── Multi-column layout ── */
  columnsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  langColumn: {
    flex: 1,
  },
  langColumnFull: {
    flex: undefined,
    width: '100%',
  },

  /* ── Text styles by language ── */
  prayerText: {
    color: Colors.text,
    fontFamily: Fonts.bodyRegular,
  },
  geezText: {
    fontWeight: '700',
    color: Colors.text,
  },
  englishText: {
    fontFamily: Fonts.bodyRegular,
    color: Colors.text,
  },
  transliterationText: {
    fontFamily: Fonts.bodyRegular,
    color: Colors.textMuted,
  },

});
