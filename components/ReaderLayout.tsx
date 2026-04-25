import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { contentColumn } from '@/constants/layout';
import { useFontSize } from '@/context/FontSizeContext';
import { usePresentationMode } from '@/context/PresentationModeContext';
import CrossIcon from '@/components/CrossIcon';
import PrayerBlock from '@/components/PrayerBlock';
import PresentationView from '@/components/PresentationView';
import SectionDrawer from '@/components/SectionDrawer';
import SettingsSheet from '@/components/SettingsSheet';
import ReadingsPicker from '@/components/ReadingsPicker';
import { useReadings } from '@/context/ReadingsContext';
import { LiturgicalSection, PrayerBlock as PrayerBlockType, LiturgicalText } from '@/data/types';
import { processSections } from '@/utils/seasonalResolver';
import seasonalsData from '@/data/seasonals.json';

interface ReaderLayoutProps {
  title: { english: string; geez?: string };
  sections: LiturgicalSection[];
  /** Font size for the Ge'ez title (default 38). */
  geezTitleSize?: number;
  /** When true, shows a Readings button in the header. Use for serate-qidase. */
  showReadingPicker?: boolean;
}

export default function ReaderLayout({
  title,
  sections,
  geezTitleSize = 38,
  showReadingPicker = false,
}: ReaderLayoutProps) {
  const navigation = useNavigation();
  const { scale } = useFontSize();
  const { isPresentationMode, isExiting, exitPresentation } = usePresentationMode();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentResultIdx, setCurrentResultIdx] = useState(0);
  const [presentationStartBlockId, setPresentationStartBlockId] = useState<string | undefined>(undefined);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<'dialog' | 'dropdown'>('dialog');
  const { slots, loaded } = useReadings();
  const hasActiveReadings = showReadingPicker && Object.values(slots).some((s) => s !== null);

  // Auto-open picker on first load only if there are no saved readings
  useEffect(() => {
    if (showReadingPicker && loaded && !Object.values(slots).some((s) => s !== null)) {
      setPickerVisible(true);
    }
  }, [loaded]);

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<number[]>([]);
  const blockOffsets = useRef<Record<string, number>>({});
  const scrollYRef = useRef(0);

  /* Swipe left from right edge to open section drawer */
  const openDrawer = useCallback(() => setDrawerVisible(true), []);
  const edgeSwipe = Gesture.Pan()
    .activeOffsetX(-15)
    .failOffsetY([-30, 30])
    .onEnd((e) => {
      if (e.translationX < -40 || e.velocityX < -400) {
        openDrawer();
      }
    })
    .runOnJS(true);

  // Process sections with seasonal resolver to replace placeholders
  const processedSections = useMemo(() => {
    const context = {
      date: new Date(),
      // TODO: Add liturgical season from user settings or calendar calculation
      // TODO: Add feast days for current date
    };
    return processSections(sections, seasonalsData as LiturgicalText, context);
  }, [sections]);

  const allBlocks: PrayerBlockType[] = processedSections.flatMap((sec) => sec.blocks);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: Array<{ block: PrayerBlockType }> = [];
    for (const sec of processedSections) {
      for (const block of sec.blocks) {
        const haystack = [block.geez, block.amharic, block.english, block.transliteration]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (haystack.includes(q)) {
          results.push({ block });
        }
      }
    }
    return results;
  }, [searchQuery, processedSections]);

  const navigateToResult = useCallback((idx: number) => {
    if (searchResults.length === 0) return;
    const bounded = Math.max(0, Math.min(idx, searchResults.length - 1));
    setCurrentResultIdx(bounded);
    const { block } = searchResults[bounded];
    const y = blockOffsets.current[block.id] ?? 0;
    scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
    setPresentationStartBlockId(block.id);
  }, [searchResults]);

  useEffect(() => {
    if (searchResults.length > 0 && searchQuery.trim()) {
      setCurrentResultIdx(0);
      const { block } = searchResults[0];
      const y = blockOffsets.current[block.id] ?? 0;
      scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
      setPresentationStartBlockId(block.id);
    } else if (!searchQuery.trim()) {
      setPresentationStartBlockId(undefined);
    }
  }, [searchResults]);

  const currentResultBlockId = searchResults[currentResultIdx]?.block.id;

  function getBlockIdAtScrollY(y: number): string | undefined {
    const centerY = y + Dimensions.get('window').height * 0.4;
    const entries = Object.entries(blockOffsets.current);
    if (entries.length === 0) return undefined;
    let best: string | undefined;
    for (const [id, offset] of entries) {
      if (offset <= centerY) {
        const block = allBlocks.find((b) => b.id === id);
        if (!block || block.type !== 'heading') best = id;
      }
    }
    return best;
  }

  // Sync startBlockId from scroll position when entering presentation mode
  useEffect(() => {
    if (isPresentationMode && !searchQuery.trim()) {
      const blockId = getBlockIdAtScrollY(scrollYRef.current);
      setPresentationStartBlockId(blockId);
    }
  }, [isPresentationMode]);

  useEffect(() => {
    navigation.setOptions({
      title: title.english,
      headerBackVisible: false,
      headerLeft: () => null,
      headerRightContainerStyle: { backgroundColor: 'transparent' },
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 12, marginRight: 16, alignItems: 'center' }}>
          {showReadingPicker && (
            <TouchableOpacity
              onPress={() => { setPickerMode('dropdown'); setPickerVisible(true); }}
              hitSlop={8}
              style={{ position: 'relative' }}
            >
              <Ionicons name="book-outline" size={18} color={Colors.burgundy} />
              {hasActiveReadings && (
                <View style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 7, height: 7, borderRadius: 3.5,
                  backgroundColor: Colors.accent,
                  borderWidth: 1, borderColor: Colors.background,
                }} />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              setSearchVisible((v) => !v);
              setSearchQuery('');
              setCurrentResultIdx(0);
              setPresentationStartBlockId(undefined);
            }}
            hitSlop={8}
          >
            <Ionicons name="search-outline" size={18} color={Colors.burgundy} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDrawerVisible(true)} hitSlop={8}>
            <Text style={{ color: Colors.burgundy, fontSize: 22 }}>{'\u2630'}</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [title, navigation, showReadingPicker, hasActiveReadings]);

  function scrollToSection(index: number) {
    const y = sectionOffsets.current[index] ?? 0;
    scrollViewRef.current?.scrollTo({ y, animated: true });
  }

  // Hide header when in presentation mode
  useEffect(() => {
    navigation.setOptions({ headerShown: !isPresentationMode });
  }, [isPresentationMode, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style={isPresentationMode ? 'light' : 'dark'} hidden={isPresentationMode} />

      {/* Invisible right-edge swipe zone to open drawer */}
      {Platform.OS !== 'web' && !isPresentationMode && (
        <GestureDetector gesture={edgeSwipe}>
          <Animated.View style={styles.edgeSwipeZone} />
        </GestureDetector>
      )}

      {/* ScrollView stays mounted — scroll position preserved when presentation overlays */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        <View style={contentColumn.wrapper}>
          <View style={styles.titleBlock}>
            <CrossIcon size={18} color={Colors.accent} />
            {title.geez && (
              <Text style={[styles.titleGeez, { fontSize: scale(geezTitleSize) }]}>
                {title.geez}
              </Text>
            )}
            <Text style={[styles.titleEnglish, { fontSize: scale(13) }]}>
              {title.english.toUpperCase()}
            </Text>
            <View style={styles.titleDivider}>
              <View style={styles.titleDividerFade} />
              <View style={styles.titleDividerLine} />
              <View style={styles.titleDividerFade} />
            </View>
          </View>

          {processedSections.map((sec, secIdx) => (
            <View
              key={sec.id}
              onLayout={(e) => {
                sectionOffsets.current[secIdx] = e.nativeEvent.layout.y;
              }}
            >
              <View style={styles.sectionHeading}>
                <View style={styles.sectionHeadingInner}>
                  <Text style={[styles.sectionTitle, { fontSize: scale(11) }]}>
                    {sec.title.english.toUpperCase()}
                  </Text>
                </View>
              </View>
              {sec.blocks.map((block) => (
                <View
                  key={block.id}
                  style={currentResultBlockId === block.id && styles.highlightedBlock}
                  onLayout={(e) => {
                    blockOffsets.current[block.id] =
                      (sectionOffsets.current[secIdx] ?? 0) + e.nativeEvent.layout.y;
                  }}
                >
                  <PrayerBlock block={block} />
                </View>
              ))}
            </View>
          ))}

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Floating search overlay — reader mode only */}
      {!isPresentationMode && searchVisible && (
        <View style={styles.searchOverlay}>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
              placeholder="Search\u2026"
              placeholderTextColor={Colors.textDim}
              autoFocus
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.searchCloseBtn}
              onPress={() => {
                setSearchVisible(false);
                setSearchQuery('');
                setCurrentResultIdx(0);
                setPresentationStartBlockId(undefined);
              }}
            >
              <Text style={styles.searchCloseText}>{'\u2715'}</Text>
            </TouchableOpacity>
          </View>
          {searchQuery.trim().length > 0 && (
            <View style={styles.searchNav}>
              <TouchableOpacity
                style={[styles.navBtn, currentResultIdx === 0 && styles.navBtnDisabled]}
                onPress={() => navigateToResult(currentResultIdx - 1)}
                disabled={currentResultIdx === 0}
              >
                <Text style={styles.navBtnText}>{'\u25B2'}</Text>
              </TouchableOpacity>
              <Text style={styles.searchCountText}>
                {searchResults.length === 0
                  ? 'No results'
                  : `${currentResultIdx + 1} of ${searchResults.length}`}
              </Text>
              <TouchableOpacity
                style={[styles.navBtn, currentResultIdx === searchResults.length - 1 && styles.navBtnDisabled]}
                onPress={() => navigateToResult(currentResultIdx + 1)}
                disabled={currentResultIdx === searchResults.length - 1}
              >
                <Text style={styles.navBtnText}>{'\u25BC'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Section drawer — reader mode only */}
      {!isPresentationMode && (
        <SectionDrawer
          sections={processedSections}
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          onSelect={scrollToSection}
          onSettings={() => setSettingsVisible(true)}
        />
      )}

      {/* Settings bottom sheet */}
      <SettingsSheet visible={settingsVisible} onClose={() => setSettingsVisible(false)} />

      {/* Presentation overlay */}
      {isPresentationMode && (
        <View style={styles.presentationOverlay}>
          {isExiting ? (
            <View style={styles.presentationBlank} />
          ) : (
            <PresentationView
              blocks={allBlocks}
              sections={processedSections}
              onExit={() => exitPresentation()}
              startBlockId={presentationStartBlockId}
            />
          )}
        </View>
      )}
      <ReadingsPicker visible={pickerVisible} onClose={() => setPickerVisible(false)} mode={pickerMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, overflow: 'hidden' },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },

  titleBlock: {
    marginBottom: 32,
    paddingBottom: 20,
    alignItems: 'center',
  },
  titleGeez: {
    fontFamily: Fonts.serifExtraBold,
    color: Colors.burgundy,
    letterSpacing: 3,
    marginBottom: 8,
    textAlign: 'center',
  },
  titleEnglish: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.textMuted,
    letterSpacing: 6,
  },
  titleDivider: {
    flexDirection: 'row',
    marginTop: 18,
    width: '35%',
    maxWidth: 160,
    alignItems: 'center',
  },
  titleDividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.accent,
    borderRadius: 1,
  },
  titleDividerFade: {
    width: 16,
    height: 2,
    backgroundColor: Colors.accent,
    opacity: 0.25,
    borderRadius: 1,
  },

  sectionHeading: {
    marginTop: 32,
    marginBottom: 10,
    alignItems: 'center',
  },
  sectionHeadingInner: {
    backgroundColor: Colors.burgundy,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 5,
  },
  sectionTitle: {
    color: Colors.textOnColor,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '700',
    letterSpacing: 2,
  },

  edgeSwipeZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 5,
  },

  bottomPadding: { height: 100 },

  highlightedBlock: {
    backgroundColor: Colors.accentDim,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    color: Colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchCloseBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCloseText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  searchNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 4,
  },
  navBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  searchCountText: {
    color: Colors.textMuted,
    fontSize: 13,
  },

  presentationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  presentationBlank: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
