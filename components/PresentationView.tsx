import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, LayoutChangeEvent, NativeSyntheticEvent, TextLayoutEventData } from 'react-native';
import HoverableOpacity from '@/components/HoverableOpacity';
import Slider from '@react-native-community/slider';
import { Colors, presentationSpeakerColors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useLanguage } from '@/context/LanguageContext';
import { useFontSize, FONT_SIZE_MIN, FONT_SIZE_MAX } from '@/context/FontSizeContext';
import { hapticSelection } from '@/utils/haptics';
import { PrayerBlock, LiturgicalSection } from '@/data/types';
import { getLanguageEntries } from '@/utils/language';
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

  // Skip empty blocks and headings (headings are section markers, not useful as slides)
  // Must be defined before useState so initialIndex uses the same array as rendering
  const visibleBlocks = blocks.filter((b) => {
    if (b.type === 'heading') return false;
    if (b.type === 'rubric') {
      return !!(b.english || b.geez || b.amharic || b.transliteration);
    }
    return activeLanguages.some((lang) => !!b[lang]);
  });

  const initialIndex = startBlockId
    ? Math.max(0, visibleBlocks.findIndex((b) => b.id === startBlockId))
    : 0;
  const [index, setIndex] = useState(initialIndex);
  const [pageIdx, setPageIdx] = useState(0);
  // measuredLines[lang] = array of rendered lines from onTextLayout for the full text
  const [measuredLines, setMeasuredLines] = useState<Record<string, Array<{ text: string }>>>({});
  const [viewportHeight, setViewportHeight] = useState(0);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [fontBarVisible, setFontBarVisible] = useState(false);

  const current = visibleBlocks[index];
  const isFirst = index === 0;
  const isLast = index === visibleBlocks.length - 1;

  const isRubricOrHeading = current?.type === 'rubric' || current?.type === 'heading';
  const langEntries = isRubricOrHeading
    ? []
    : getLanguageEntries(activeLanguages, primaryLanguage, current ?? ({} as PrayerBlock));

  // Reset measurement + page when block, font size, or active languages change
  const langKey = activeLanguages.join(',');
  useEffect(() => {
    setMeasuredLines({});
    setPageIdx(0);
  }, [index, multiplier, langKey]);

  // --- Pagination math ---
  // We use the tallest script's line height (Ge'ez) so every page fits without overflow.
  // Usable height = viewport minus fixed chrome (paddings + optional speaker label).
  const PADDING_V = 100; // paddingTop 60 + paddingBottom 40
  const SPEAKER_H = 40;  // speaker label + marginBottom
  const hasSpeaker = !isRubricOrHeading && !!current?.speaker;
  const usableHeight = Math.max(0, viewportHeight - PADDING_V - (hasSpeaker ? SPEAKER_H : 0));
  const geezLineH = scale(23) * 1.5; // tallest line height used in any column
  const linesPerPage = Math.max(1, Math.floor(usableHeight / geezLineH));

  const allMeasured = langEntries.length === 0
    || langEntries.every(({ lang }) => measuredLines[lang] !== undefined);

  const maxLines = langEntries.reduce(
    (m, { lang }) => Math.max(m, measuredLines[lang]?.length ?? 0), 0,
  );
  const totalPages = (allMeasured && maxLines > 0)
    ? Math.max(1, Math.ceil(maxLines / linesPerPage))
    : 1;

  /** Return slice of text visible in column `lang` on the current page. */
  function pageText(lang: string): string {
    const lines = measuredLines[lang];
    if (!lines || lines.length === 0) return '';
    const start = pageIdx * linesPerPage;
    if (start >= lines.length) return '';
    const end = Math.min(start + linesPerPage, lines.length);
    return lines.slice(start, end).map((l) => l.text).join('');
  }

  const goToBlock = useCallback((newIndex: number) => {
    setIndex(newIndex);
    setPageIdx(0);
    setMeasuredLines({});
  }, []);

  const advance = useCallback(() => {
    hapticSelection();
    if (allMeasured && pageIdx < totalPages - 1) {
      setPageIdx((p) => p + 1);
    } else if (!isLast) {
      goToBlock(index + 1);
    }
  }, [allMeasured, pageIdx, totalPages, isLast, index, goToBlock]);

  const back = useCallback(() => {
    hapticSelection();
    if (pageIdx > 0) {
      setPageIdx((p) => p - 1);
    } else if (!isFirst) {
      goToBlock(index - 1);
    }
  }, [pageIdx, isFirst, index, goToBlock]);

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

  const showPageDots = allMeasured && totalPages > 1;

  return (
    <View style={styles.container} onLayout={(e: LayoutChangeEvent) => setViewportHeight(e.nativeEvent.layout.height)}>
      {/* Tap zones — back on left 40%, forward on right 60% */}
      <TouchableOpacity style={styles.tapBack} onPress={back} activeOpacity={1} />
      <TouchableOpacity style={styles.tapForward} onPress={advance} activeOpacity={1} />

      {/* Content — plain View, no scroll; overflow clipped by container */}
      <View style={styles.content}>
        {isRubricOrHeading ? (
          <Text style={[styles.rubricText, { fontSize: scale(16) }]}>
            {current.english ?? current.geez ?? ''}
          </Text>
        ) : (
          <>
            {current.speaker && (
              <Text style={[styles.speaker, { color: speakerColor, fontSize: scale(11) }]}>
                {(current.speaker === 'congregation' ? 'People' : current.speaker).toUpperCase()}
              </Text>
            )}
            <View style={styles.columnsRow}>
              {langEntries.map(({ lang, text }) => {
                const fontSize = scale(lang === 'geez' || lang === 'amharic' ? 23 : 22);
                const lineHeight = fontSize * 1.5;
                const textStyle = [
                  styles.prayerText,
                  { fontSize, lineHeight, color: speakerColor },
                  lang === 'transliteration' && styles.transliteration,
                ];

                // What to show: sliced text for current page once measured;
                // full text on first render so the invisible pre-render fires.
                const visibleText = allMeasured ? pageText(lang) : text;

                return (
                  <View key={lang} style={[styles.langColumn, langEntries.length === 1 && styles.langColumnFull]}>
                    {/*
                     * Invisible full-text render — gives us actual rendered lines via
                     * onTextLayout so we can compute exact page boundaries.
                     * position: absolute so it doesn't affect column height.
                     */}
                    <Text
                      style={[...textStyle, styles.measureText]}
                      pointerEvents="none"
                      onTextLayout={(e: NativeSyntheticEvent<TextLayoutEventData>) => {
                        const lines = e.nativeEvent.lines as Array<{ text: string }>;
                        setMeasuredLines((prev) => {
                          // Skip update if line count hasn't changed (avoids loops)
                          if (prev[lang]?.length === lines.length) return prev;
                          return { ...prev, [lang]: lines };
                        });
                      }}
                    >
                      {text}
                    </Text>

                    {/* Visible sliced text for this page */}
                    <Text style={textStyle}>{visibleText}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>

      {/* Page progress dots — shown only when a block spans multiple pages */}
      {showPageDots && (
        <View style={styles.pageDots} pointerEvents="none">
          {Array.from({ length: totalPages }).map((_, i) => (
            <View key={i} style={[styles.dot, i === pageIdx && styles.dotActive]} />
          ))}
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
  content: {
    flex: 1,
    paddingHorizontal: 48,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 0,
  },
  measureText: {
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0,
  },
  pageDots: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PRES.border,
  },
  dotActive: {
    backgroundColor: Colors.accent,
  },
  rubricText: {
    color: PRES.textMuted,
    fontFamily: Fonts.bodyItalic,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
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
});
