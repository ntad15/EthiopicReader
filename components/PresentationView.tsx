import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/context/LanguageContext';
import { useFontSize } from '@/context/FontSizeContext';
import { PrayerBlock, Language, LiturgicalSection } from '@/data/types';
import { LANGUAGE_LABELS } from '@/constants/languages';
import SectionDrawer from '@/components/SectionDrawer';

const SPEAKER_COLORS: Record<string, string> = {
  priest: Colors.priest,
  deacon: Colors.deacon,
  congregation: Colors.text,
  all: Colors.text,
};

interface Props {
  blocks: PrayerBlock[];
  sections?: LiturgicalSection[];
  onExit: () => void;
}

export default function PresentationView({ blocks, sections, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { activeLanguages, primaryLanguage } = useLanguage();
  const { scale } = useFontSize();

  // Skip empty blocks (no text in any active language)
  const visibleBlocks = blocks.filter((b) => {
    if (b.type === 'rubric' || b.type === 'heading') return true;
    return activeLanguages.some((lang) => !!b[lang]);
  });

  const current = visibleBlocks[index];
  const isFirst = index === 0;
  const isLast = index === visibleBlocks.length - 1;

  function advance() {
    if (!isLast) setIndex((i) => i + 1);
  }

  function back() {
    if (!isFirst) setIndex((i) => i - 1);
  }

  function jumpToSection(sectionIndex: number) {
    if (!sections) return;
    const sec = sections[sectionIndex];
    if (!sec || sec.blocks.length === 0) return;
    const firstBlockId = sec.blocks[0].id;
    const blockIndex = visibleBlocks.findIndex((b) => b.id === firstBlockId);
    if (blockIndex >= 0) setIndex(blockIndex);
  }

  if (!current) return null;

  const speakerColor =
    current.speaker ? (SPEAKER_COLORS[current.speaker] ?? Colors.text) : Colors.text;

  const isRubricOrHeading = current.type === 'rubric' || current.type === 'heading';

  const langEntries: { lang: Language; text: string }[] = isRubricOrHeading
    ? []
    : activeLanguages
        .map((lang) => ({ lang, text: current[lang] ?? '' }))
        .filter((e) => e.text.length > 0)
        .sort((a, b) => {
          if (a.lang === primaryLanguage) return -1;
          if (b.lang === primaryLanguage) return 1;
          return 0;
        });

  const showLabels = activeLanguages.length > 1;

  return (
    <View style={styles.container}>
      {/* Tap left half to go back, right half to advance */}
      <TouchableOpacity style={styles.tapBack} onPress={back} activeOpacity={1} />
      <TouchableOpacity style={styles.tapForward} onPress={advance} activeOpacity={1} />

      {/* Content */}
      <View style={styles.content} pointerEvents="none">
        {isRubricOrHeading ? (
          <Text style={[styles.rubricText, { fontSize: scale(16) }]}>
            {current.english ?? current.geez ?? ''}
          </Text>
        ) : (
          <>
            {current.speaker && (
              <Text style={[styles.speaker, { color: speakerColor, fontSize: scale(11) }]}>
                {current.speaker.toUpperCase()}
              </Text>
            )}
            {langEntries.map(({ lang, text }) => (
              <View key={lang} style={styles.langEntry}>
                {showLabels && (
                  <Text style={[styles.langLabel, { fontSize: scale(11) }]}>
                    {LANGUAGE_LABELS[lang]}
                  </Text>
                )}
                <Text
                  style={[
                    styles.prayerText,
                    { fontSize: scale(lang === 'geez' || lang === 'amharic' ? 26 : 22) },
                    { color: speakerColor },
                    lang === 'transliteration' && styles.transliteration,
                  ]}
                >
                  {text}
                </Text>
              </View>
            ))}
          </>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.backBtn} onPress={back} disabled={isFirst}>
          <Text style={[styles.navBtnText, isFirst && styles.navBtnDisabled]}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.forwardBtn} onPress={advance} disabled={isLast}>
          <Text style={[styles.navBtnText, isLast && styles.navBtnDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Top-right buttons */}
      <View style={styles.topRight}>
        {sections && sections.length > 0 && (
          <TouchableOpacity style={styles.topBtn} onPress={() => setDrawerVisible(true)}>
            <Text style={styles.topBtnText}>☰</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.topBtn} onPress={onExit}>
          <Text style={styles.exitText}>✕</Text>
        </TouchableOpacity>
      </View>

      {sections && (
        <SectionDrawer
          sections={sections}
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          onSelect={jumpToSection}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '40%',
    bottom: 0,
    zIndex: 1,
  },
  tapForward: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '60%',
    bottom: 0,
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingVertical: 80,
    width: '100%',
    zIndex: 0,
  },
  rubricText: {
    color: Colors.rubric,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
  },
  speaker: {
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 16,
  },
  langEntry: {
    marginBottom: 20,
  },
  langLabel: {
    color: Colors.textDim,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  prayerText: {
    lineHeight: 40,
    fontWeight: '500',
  },
  transliteration: {
    fontStyle: 'italic',
    color: Colors.textMuted,
  },
  controls: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
    zIndex: 2,
  },
  backBtn: {
    padding: 8,
  },
  forwardBtn: {
    padding: 8,
  },
  navBtnText: {
    color: Colors.accent,
    fontSize: 36,
    fontWeight: '300',
  },
  navBtnDisabled: {
    color: Colors.border,
  },
  topRight: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    gap: 10,
    zIndex: 3,
  },
  topBtn: {
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  topBtnText: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  exitText: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
});
