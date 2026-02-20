import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/context/LanguageContext';
import { useFontSize, FONT_SIZE_MIN, FONT_SIZE_MAX } from '@/context/FontSizeContext';
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
  const [fontBarVisible, setFontBarVisible] = useState(false);
  const { activeLanguages, primaryLanguage } = useLanguage();
  const { scale, multiplier, setMultiplier } = useFontSize();

  // Scroll tracking for overflow pagination
  const scrollRef = useRef<ScrollView>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const isScrollable = contentHeight > viewportHeight + 2;
  const isAtBottom = scrollY >= contentHeight - viewportHeight - 2;
  const isAtTop = scrollY <= 2;

  // Skip empty blocks (no text in any active language)
  const visibleBlocks = blocks.filter((b) => {
    if (b.type === 'rubric' || b.type === 'heading') return true;
    return activeLanguages.some((lang) => !!b[lang]);
  });

  const current = visibleBlocks[index];
  const isFirst = index === 0;
  const isLast = index === visibleBlocks.length - 1;

  const goToBlock = useCallback((newIndex: number) => {
    setIndex(newIndex);
    setScrollY(0);
    setContentHeight(0);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const advance = useCallback(() => {
    if (isScrollable && !isAtBottom) {
      scrollRef.current?.scrollTo({ y: scrollY + viewportHeight * 0.85, animated: true });
    } else if (!isLast) {
      goToBlock(index + 1);
    }
  }, [isScrollable, isAtBottom, isLast, scrollY, viewportHeight, index, goToBlock]);

  const back = useCallback(() => {
    if (isScrollable && !isAtTop) {
      scrollRef.current?.scrollTo({ y: Math.max(0, scrollY - viewportHeight * 0.85), animated: true });
    } else if (!isFirst) {
      goToBlock(index - 1);
    }
  }, [isScrollable, isAtTop, isFirst, scrollY, viewportHeight, index, goToBlock]);

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
    const firstBlockId = sec.blocks[0].id;
    const blockIndex = visibleBlocks.findIndex((b) => b.id === firstBlockId);
    if (blockIndex >= 0) goToBlock(blockIndex);
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setScrollY(e.nativeEvent.contentOffset.y);
  }

  function onContentSizeChange(_w: number, h: number) {
    setContentHeight(h);
  }

  function onViewportLayout(e: LayoutChangeEvent) {
    setViewportHeight(e.nativeEvent.layout.height);
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

  const showMoreBelow = isScrollable && !isAtBottom;
  const showMoreAbove = isScrollable && !isAtTop;

  return (
    <View style={styles.container}>
      {/* Tap left half to go back, right half to advance */}
      <TouchableOpacity style={styles.tapBack} onPress={back} activeOpacity={1} />
      <TouchableOpacity style={styles.tapForward} onPress={advance} activeOpacity={1} />

      {/* Scroll overflow indicators */}
      {showMoreAbove && <View style={styles.fadeTop} pointerEvents="none" />}
      {showMoreBelow && <View style={styles.fadeBottom} pointerEvents="none" />}

      {/* Content */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        onScroll={onScroll}
        onContentSizeChange={onContentSizeChange}
        onLayout={onViewportLayout}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
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
            <View style={styles.columnsRow}>
              {langEntries.map(({ lang, text }) => (
                <View key={lang} style={[styles.langColumn, langEntries.length === 1 && styles.langColumnFull]}>
                  {showLabels && (
                    <Text style={[styles.langLabel, { fontSize: scale(11) }]}>
                      {LANGUAGE_LABELS[lang]}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.prayerText,
                      {
                        fontSize: scale(lang === 'geez' || lang === 'amharic' ? 26 : 22),
                        lineHeight: scale(lang === 'geez' || lang === 'amharic' ? 26 : 22) * 1.5,
                      },
                      { color: speakerColor },
                      lang === 'transliteration' && styles.transliteration,
                    ]}
                  >
                    {text}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Font size bar (drops down from top right) */}
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
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.accent}
          />
          <Text style={styles.fontBarLabelLarge}>A</Text>
        </View>
      )}

      {/* Top-right buttons */}
      <View style={styles.topRight}>
        <TouchableOpacity style={styles.topBtn} onPress={() => setFontBarVisible((v) => !v)}>
          <Text style={styles.topBtnText}>Aa</Text>
        </TouchableOpacity>
        {sections && sections.length > 0 && (
          <TouchableOpacity style={styles.topBtn} onPress={() => setDrawerVisible(true)}>
            <Text style={styles.topBtnText}>☰</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.topBtn} onPress={onExit}>
          <Text style={styles.topBtnText}>✕</Text>
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
  scrollContainer: {
    flex: 1,
    zIndex: 0,
  },
  content: {
    justifyContent: 'center',
    flexGrow: 1,
    paddingHorizontal: 48,
    paddingTop: 60,
    paddingBottom: 40,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 2,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 2,
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
  columnsRow: {
    flexDirection: 'row',
    gap: 24,
    width: '100%',
  },
  langColumn: {
    flex: 1,
  },
  langColumnFull: {
    flex: undefined,
    width: '100%',
  },
  langLabel: {
    color: Colors.textDim,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  prayerText: {
    fontWeight: '500',
  },
  transliteration: {
    fontStyle: 'italic',
    color: Colors.textMuted,
  },
  fontBar: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 220,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 6,
  },
  fontBarLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  fontBarLabelLarge: {
    color: Colors.textMuted,
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
    fontSize: 14,
  },
});
