import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import HoverableOpacity from '@/components/HoverableOpacity';
import Slider from '@react-native-community/slider';
import { Colors, presentationSpeakerColors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useLanguage } from '@/context/LanguageContext';
import { useFontSize, FONT_SIZE_MIN, FONT_SIZE_MAX } from '@/context/FontSizeContext';
import { useReadings } from '@/context/ReadingsContext';
import { hapticSelection } from '@/utils/haptics';
import { PrayerBlock, LiturgicalSection } from '@/data/types';
import { getLanguageEntries } from '@/utils/language';
import { ReadingSlotKey } from '@/data/bibleBooks';
import { getSlotConfig } from '@/data/readingSlots';
import { formatReading, formatReadingChapterVerse, bookDisplayName } from '@/utils/readingFormatter';
import { getVerses, formatVersesWithNumbers } from '@/utils/bibleService';
import SectionDrawer from '@/components/SectionDrawer';

// Presentation mode stays dark for projector/screen use
const PRES = {
  bg: Colors.presentationBg,
  surface: Colors.presentationSurface,
  border: Colors.presentationBorder,
  text: Colors.presentationText,
  textMuted: Colors.presentationTextMuted,
  textDim: Colors.presentationTextDim,
};

interface Props {
  blocks: PrayerBlock[];
  sections?: LiturgicalSection[];
  onExit: (blockId?: string) => void;
  startBlockId?: string;
}

export default function PresentationView({ blocks, sections, onExit, startBlockId }: Props) {
  const { activeLanguages, primaryLanguage } = useLanguage();
  const { scale, multiplier, setMultiplier } = useFontSize();
  const { slots } = useReadings();

  // Skip empty blocks and headings (headings are section markers, not useful as slides)
  // Include reading blocks now
  const visibleBlocks = blocks.filter((b) => {
    if (b.type === 'heading') return false;
    if (b.type === 'rubric') {
      // Include rubrics with content OR dynamic reading references
      return !!(b.english || b.geez || b.amharic || b.transliteration || b.dynamic);
    }
    if (b.type === 'reading') return true; // Always include reading blocks
    return activeLanguages.some((lang) => !!b[lang]);
  });

  const initialIndex = startBlockId
    ? Math.max(0, visibleBlocks.findIndex((b) => b.id === startBlockId))
    : 0;
  const [index, setIndex] = useState(initialIndex);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [fontBarVisible, setFontBarVisible] = useState(false);
  const [expandedVerses, setExpandedVerses] = useState<Record<string, any>>({});
  const [readingExpanded, setReadingExpanded] = useState(false);

  const current = visibleBlocks[index];
  const isFirst = index === 0;
  const isLast = index === visibleBlocks.length - 1;

  const isRubric = current?.type === 'rubric';
  const isReading = current?.type === 'reading';

  // Load verses for reading blocks when expanded
  useEffect(() => {
    if (!isReading || !current?.readingSlot || !readingExpanded) return;
    const slotKey = current.readingSlot as ReadingSlotKey;
    const reading = slots[slotKey];
    if (!reading || expandedVerses[slotKey]) return;

    // Fetch verses for English and Amharic only (matching ReadingCard behavior)
    const readingLanguages = activeLanguages.filter(lang => lang === 'english' || lang === 'amharic');
    
    const fetchVerses = async () => {
      const results: Record<string, any> = {};
      for (const lang of readingLanguages) {
        try {
          const verses = await getVerses(reading, lang);
          if (verses) {
            results[lang] = verses;
          }
        } catch (err) {
          console.warn(`Failed to load verses for ${lang}:`, err);
        }
      }
      setExpandedVerses(prev => ({ ...prev, [slotKey]: results }));
    };

    fetchVerses();
  }, [index, isReading, current, slots, activeLanguages, readingExpanded]);

  const goToBlock = useCallback((newIndex: number) => {
    setIndex(newIndex);
    setReadingExpanded(false); // Collapse when switching blocks
  }, []);

  const advance = useCallback(() => {
    hapticSelection();
    if (!isLast) {
      goToBlock(index + 1);
    }
  }, [isLast, index, goToBlock]);

  const back = useCallback(() => {
    hapticSelection();
    if (!isFirst) {
      goToBlock(index - 1);
    }
  }, [isFirst, index, goToBlock]);

  // Keyboard arrow support for web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') { advance(); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { back(); e.preventDefault(); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [advance, back]);

  function jumpToSection(sectionIndex: number) {
    if (!sections) return;
    const sec = sections[sectionIndex];
    if (!sec || sec.blocks.length === 0) return;
    const blockIndex = visibleBlocks.findIndex((b) => b.id === sec.blocks[0].id);
    if (blockIndex >= 0) goToBlock(blockIndex);
  }

  if (!current) return null;

  const speakerColor =
    current.speaker ? (presentationSpeakerColors[current.speaker] ?? PRES.text) : PRES.text;

  // Get content for dynamic rubrics or headings
  let rubricText = '';
  if (isRubric && current.dynamic) {
    const slotKey = current.dynamic as ReadingSlotKey;
    const reading = slots[slotKey];
    if (reading) {
      rubricText = formatReading(reading, primaryLanguage);
    }
  } else if (isRubric) {
    rubricText = current.english ?? current.geez ?? '';
  }

  // Get content for reading blocks
  let readingRef = '';
  let readingVerses: Record<string, any> = {};
  if (isReading && current.readingSlot) {
    const slotKey = current.readingSlot as ReadingSlotKey;
    const reading = slots[slotKey];
    if (reading) {
      readingRef = formatReading(reading, primaryLanguage);
      readingVerses = expandedVerses[slotKey] || {};
    }
  }

  // For prayer blocks, get language entries
  const langEntries = (!isRubric && !isReading)
    ? getLanguageEntries(activeLanguages, primaryLanguage, current)
    : [];

  return (
    <View style={styles.container}>
      {/* Tap zones — only active for non-reading blocks */}
      {!isReading && (
        <>
          <TouchableOpacity style={styles.tapBack} onPress={back} activeOpacity={1} />
          <TouchableOpacity style={styles.tapForward} onPress={advance} activeOpacity={1} />
        </>
      )}

      {/* Content — scrollable for long readings */}
      <ScrollView 
        style={styles.contentScroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isRubric ? (
          <Text style={[styles.rubricText, { fontSize: scale(16) }]}>
            {rubricText}
          </Text>
        ) : isReading ? (
          <>
            <TouchableOpacity 
              style={styles.readingHeader}
              onPress={() => {
                hapticSelection();
                setReadingExpanded(!readingExpanded);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.expandIcon, { fontSize: scale(24) }]}>
                {readingExpanded ? '−' : '+'}
              </Text>
              <View style={styles.readingHeaderContent}>
                <Text style={[styles.readingLabel, { fontSize: scale(11) }]}>
                  {current.readingSlot?.toUpperCase()}
                </Text>
                <Text style={[styles.readingRef, { fontSize: scale(16), color: PRES.text }]}>
                  {readingRef}
                </Text>
              </View>
            </TouchableOpacity>
            {readingExpanded && Object.keys(readingVerses).length > 0 && (
              <View style={styles.versesRow}>
                {activeLanguages
                  .filter(lang => lang === 'english' || lang === 'amharic')
                  .map(lang => {
                    const verses = readingVerses[lang];
                    if (!verses || verses.length === 0) return null;
                    const formattedText = formatVersesWithNumbers(verses);
                    const fontSize = scale(lang === 'amharic' ? 19 : 19);
                    const lineHeight = fontSize * 1.6;
                    return (
                      <View key={lang} style={styles.versesColumn}>
                        <Text style={[styles.versesText, { fontSize, lineHeight, color: PRES.text }]}>
                          {formattedText}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            )}
          </>
        ) : (
          <>
            {current.speaker && (
              <Text style={[styles.speaker, { color: speakerColor, fontSize: scale(11) }]}>
                {(current.speaker === 'congregation' ? 'People' : current.speaker).toUpperCase()}
              </Text>
            )}
            <View style={styles.columnsRow}>
              {langEntries.map(({ lang, text }) => {
                const fontSize = scale(lang === 'geez' || lang === 'amharic' ? 22 : 22);
                const lineHeight = fontSize * 1.5;
                const textStyle = [
                  styles.prayerText,
                  { fontSize, lineHeight, color: speakerColor },
                  lang === 'transliteration' && styles.transliteration,
                ];

                return (
                  <View key={lang} style={[styles.langColumn, langEntries.length === 1 && styles.langColumnFull]}>
                    <Text style={textStyle}>{text}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Navigation arrows for reading blocks */}
      {isReading && (
        <View style={styles.readingNav}>
          <TouchableOpacity 
            style={[styles.navBtn, isFirst && styles.navBtnDisabled]} 
            onPress={back}
            disabled={isFirst}
            activeOpacity={0.7}
          >
            <Text style={[styles.navBtnText, isFirst && styles.navBtnTextDisabled]}>
              {'\u2190'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navBtn, isLast && styles.navBtnDisabled]} 
            onPress={advance}
            disabled={isLast}
            activeOpacity={0.7}
          >
            <Text style={[styles.navBtnText, isLast && styles.navBtnTextDisabled]}>
              {'\u2192'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Font size bar */}
      {fontBarVisible && (
        <View style={styles.fontBar}>
          <Text style={styles.fontBarLabel}>A</Text>
          <Slider
            style={styles.fontBarSlider}
            minimumValue={FONT_SIZE_MIN}
            maximumValue={FONT_SIZE_MAX}
            value={multiplier}
            onValueChange={setMultiplier}
            step={0.05}
            minimumTrackTintColor={Colors.accent}
            maximumTrackTintColor={PRES.border}
            thumbTintColor={Colors.accent}
          />
          <Text style={styles.fontBarLabelLarge}>A</Text>
        </View>
      )}

      {/* Top-right controls */}
      <View style={styles.topRight}>
        <HoverableOpacity style={styles.topBtn} hoverStyle={styles.topBtnHover} onPress={() => setFontBarVisible((v) => !v)}>
          <Text style={styles.topBtnText}>Aa</Text>
        </HoverableOpacity>
        {sections && sections.length > 0 && (
          <HoverableOpacity style={styles.topBtn} hoverStyle={styles.topBtnHover} onPress={() => setDrawerVisible(true)}>
            <Text style={styles.topBtnText}>{'\u2630'}</Text>
          </HoverableOpacity>
        )}
        <HoverableOpacity style={styles.topBtn} hoverStyle={styles.topBtnHover} onPress={() => onExit(visibleBlocks[index]?.id)}>
          <Text style={styles.topBtnText}>{'\u2715'}</Text>
        </HoverableOpacity>
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
    backgroundColor: PRES.bg,
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
  contentScroll: {
    flex: 1,
    zIndex: 0,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 48,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  rubricText: {
    color: PRES.textMuted,
    fontFamily: Fonts.bodyItalic,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
  },
  readingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  readingHeaderContent: {
    alignItems: 'center',
  },
  expandIcon: {
    color: Colors.accent,
    fontWeight: '700',
    lineHeight: 24,
  },
  readingLabel: {
    color: PRES.textMuted,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  readingRef: {
    fontFamily: Fonts.serifBold,
  },
  versesRow: {
    flexDirection: 'row',
    gap: 40,
    width: '100%',
  },
  versesColumn: {
    flex: 1,
  },
  versesText: {
    fontFamily: Fonts.bodyRegular,
  },
  speaker: {
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 16,
  },
  columnsRow: {
    flexDirection: 'row',
    gap: 40,
    width: '100%',
    alignItems: 'flex-start',
  },
  langColumn: {
    flex: 1,
  },
  langColumnFull: {
    flex: 1,
  },
  prayerText: {
    fontWeight: '500',
  },
  transliteration: {
    fontFamily: Fonts.bodyRegular,
    color: PRES.textMuted,
  },
  fontBar: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 220,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRES.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PRES.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 6,
  },
  fontBarLabel: {
    color: PRES.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  fontBarLabelLarge: {
    color: PRES.textMuted,
    fontSize: 22,
    fontWeight: '600',
  },
  fontBarSlider: {
    flex: 1,
    height: 32,
    marginHorizontal: 6,
  },
  topRight: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
    zIndex: 5,
  },
  topBtn: {
    backgroundColor: 'rgba(181, 148, 91, 0.15)',
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  topBtnHover: {
    backgroundColor: 'rgba(181, 148, 91, 0.35)',
  },
  topBtnText: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  readingNav: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 80,
    zIndex: 3,
  },
  navBtn: {
    backgroundColor: 'rgba(181, 148, 91, 0.2)',
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    backgroundColor: 'rgba(181, 148, 91, 0.05)',
    borderColor: PRES.border,
  },
  navBtnText: {
    color: Colors.accent,
    fontSize: 24,
    fontWeight: '600',
  },
  navBtnTextDisabled: {
    color: PRES.border,
  },
});
