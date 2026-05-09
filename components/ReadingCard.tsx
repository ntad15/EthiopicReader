import { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useLanguage } from '@/context/LanguageContext';
import { useFontSize } from '@/context/FontSizeContext';
import { SelectedReading, ReadingSlotKey } from '@/data/readingSlots';
import { getSlotConfig } from '@/data/readingSlots';
import { formatReading } from '@/utils/readingFormatter';
import { getVerses, formatVersesWithNumbers, BibleVerse } from '@/utils/bibleService';
import { Language } from '@/data/types';

interface Props {
  slot: ReadingSlotKey;
  reading: SelectedReading;
}

export default function ReadingCard({ slot, reading }: Props) {
  const { activeLanguages, primaryLanguage } = useLanguage();
  const { scale } = useFontSize();
  const [expanded, setExpanded] = useState(false);
  const [verses, setVerses] = useState<Record<Language, BibleVerse[] | null>>({
    geez: null,
    amharic: null,
    english: null,
    transliteration: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heightAnim = useSharedValue(0);
  const rotationAnim = useSharedValue(0);

  // For readings, only show English and Amharic (no Ge'ez or transliteration)
  const readingLanguages = useMemo(
    () => activeLanguages.filter(lang => lang === 'english' || lang === 'amharic'),
    [activeLanguages]
  );

  const config = getSlotConfig(slot);
  const label = config?.english ?? slot;
  const refText = formatReading(reading, primaryLanguage);

  // Fetch verses when expanded
  useEffect(() => {
    if (!expanded) return;

    setLoading(true);
    setError(null);

    const fetchAllLanguages = async () => {
      const results: Record<Language, BibleVerse[] | null> = {
        geez: null,
        amharic: null,
        english: null,
        transliteration: null,
      };

      for (const lang of readingLanguages) {
        try {
          const verseData = await getVerses(reading, lang);
          results[lang] = verseData;
        } catch (err) {
          console.warn(`Failed to load verses for ${lang}:`, err);
        }
      }

      setVerses(results);
      setLoading(false);

      // Check if all returned null
      const allNull = Object.values(results).every(v => v === null);
      if (allNull) {
        setError('Scripture text not available');
      }
    };

    fetchAllLanguages();
  }, [expanded, reading, readingLanguages]);

  // Animation for expand/collapse
  useEffect(() => {
    heightAnim.value = withTiming(expanded ? 1 : 0, { duration: 300 });
    rotationAnim.value = withTiming(expanded ? 180 : 0, { duration: 300 });
  }, [expanded]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: heightAnim.value,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationAnim.value}deg` }],
  }));

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Get verses for reading languages (English and Amharic only)
  const languageEntries: { lang: Language; verses: BibleVerse[] }[] = readingLanguages
    .map(lang => ({ lang, verses: verses[lang] || [] }))
    .filter(entry => entry.verses.length > 0);

  return (
    <View style={styles.container}>
      {/* Header - always visible */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.label, { fontSize: scale(11) }]}>
            {label.toUpperCase()}
          </Text>
          <Text style={[styles.reference, { fontSize: scale(15) }]}>
            {refText}
          </Text>
        </View>
        <Animated.View style={chevronStyle}>
          <Ionicons
            name="chevron-down"
            size={24}
            color={Colors.accent}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Expandable content */}
      {expanded && (
        <Animated.View style={[styles.content, contentStyle]}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.accent} />
              <Text style={[styles.loadingText, { fontSize: scale(13) }]}>
                Loading scripture...
              </Text>
            </View>
          )}

          {!loading && error && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { fontSize: scale(13) }]}>
                {error}
              </Text>
            </View>
          )}

          {!loading && !error && languageEntries.length > 0 && (
            <View style={styles.versesContainer}>
              <View style={styles.columnsRow}>
                {languageEntries.map(({ lang, verses: langVerses }) => (
                  <View
                    key={lang}
                    style={[
                      styles.langColumn,
                      languageEntries.length === 1 && styles.langColumnFull,
                    ]}
                  >
                    <Text
                      style={[
                        styles.verseText,
                        {
                          fontSize: scale(lang === 'geez' || lang === 'amharic' ? 16 : 16),
                          lineHeight: scale(lang === 'geez' || lang === 'amharic' ? 16 : 16) * 1.6,
                        },
                        (lang === 'geez' || lang === 'amharic') && styles.geezText,
                        lang === 'english' && styles.englishText,
                        lang === 'transliteration' && styles.transliterationText,
                      ]}
                    >
                      {formatVersesWithNumbers(langVerses)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerContent: {
    flex: 1,
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.burgundy,
    marginBottom: 6,
  },
  reference: {
    fontFamily: Fonts.bodyRegular,
    color: Colors.text,
    fontWeight: '600',
  },
  content: {
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: Fonts.bodyItalic,
    fontStyle: 'italic',
    color: Colors.textMuted,
    marginTop: 8,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: Fonts.bodyItalic,
    fontStyle: 'italic',
    color: Colors.rubric,
  },
  versesContainer: {
    padding: 16,
    backgroundColor: Colors.surfaceElevated,
  },
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
  verseText: {
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
