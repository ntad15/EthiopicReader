import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/context/LanguageContext';
import { useFontSize } from '@/context/FontSizeContext';
import { PrayerBlock as PrayerBlockType, Language } from '@/data/types';
import { LANGUAGE_LABELS } from '@/constants/languages';

const SPEAKER_COLORS: Record<string, string> = {
  priest: Colors.priest,
  deacon: Colors.deacon,
  congregation: Colors.text,
  all: Colors.text,
};

interface Props {
  block: PrayerBlockType;
}

export default function PrayerBlock({ block }: Props) {
  const { activeLanguages } = useLanguage();
  const { scale } = useFontSize();

  if (block.type === 'heading') {
    return (
      <View style={styles.headingContainer}>
        <Text style={[styles.heading, { fontSize: scale(13) }]}>
          {block.english ?? block.geez ?? block.amharic ?? ''}
        </Text>
      </View>
    );
  }

  if (block.type === 'rubric') {
    return (
      <View style={styles.rubricContainer}>
        <Text style={[styles.rubric, { fontSize: scale(13) }]}>
          {block.english ?? block.geez ?? ''}
        </Text>
      </View>
    );
  }

  const speakerColor =
    block.speaker ? (SPEAKER_COLORS[block.speaker] ?? Colors.text) : Colors.text;

  // Collect languages that have content
  const langEntries: { lang: Language; text: string }[] = activeLanguages
    .map((lang) => ({ lang, text: block[lang] ?? '' }))
    .filter((e) => e.text.length > 0);

  if (langEntries.length === 0) return null;

  const showLabels = activeLanguages.length > 1;

  return (
    <View style={[styles.blockContainer, block.type === 'response' && styles.responseContainer]}>
      {block.speaker && (
        <Text style={[styles.speakerLabel, { color: speakerColor, fontSize: scale(10) }]}>
          {block.speaker.toUpperCase()}
        </Text>
      )}
      {langEntries.map(({ lang, text }) => (
        <View key={lang} style={styles.langEntry}>
          {showLabels && (
            <Text style={[styles.langLabel, { fontSize: scale(10) }]}>
              {LANGUAGE_LABELS[lang]}
            </Text>
          )}
          <Text
            style={[
              styles.prayerText,
              { fontSize: scale(lang === 'geez' || lang === 'amharic' ? 18 : 16) },
              { color: speakerColor },
              lang === 'transliteration' && styles.transliterationText,
            ]}
          >
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headingContainer: {
    marginTop: 28,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heading: {
    color: Colors.accent,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  rubricContainer: {
    marginVertical: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: Colors.border,
  },
  rubric: {
    color: Colors.rubric,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  blockContainer: {
    marginVertical: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  responseContainer: {
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: Colors.accent,
    borderBottomWidth: 0,
    marginLeft: 8,
    marginBottom: 4,
  },
  speakerLabel: {
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
    opacity: 0.7,
  },
  langEntry: {
    marginBottom: 8,
  },
  langLabel: {
    color: Colors.textDim,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  prayerText: {
    color: Colors.text,
    lineHeight: 28,
  },
  transliterationText: {
    fontStyle: 'italic',
    color: Colors.textMuted,
  },
});
