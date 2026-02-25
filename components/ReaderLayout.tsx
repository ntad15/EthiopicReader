import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HoverableOpacity from '@/components/HoverableOpacity';
import { useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import Animated from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { contentColumn } from '@/constants/layout';
import { useFontSize } from '@/context/FontSizeContext';
import { hapticMedium } from '@/utils/haptics';
import CrossIcon from '@/components/CrossIcon';
import PrayerBlock from '@/components/PrayerBlock';
import PresentationView from '@/components/PresentationView';
import SectionDrawer from '@/components/SectionDrawer';
import { LiturgicalSection, PrayerBlock as PrayerBlockType } from '@/data/types';

interface ReaderLayoutProps {
  title: { english: string; geez?: string };
  sections: LiturgicalSection[];
  /** Font size for the Ge'ez title (default 38). */
  geezTitleSize?: number;
}

export default function ReaderLayout({
  title,
  sections,
  geezTitleSize = 38,
}: ReaderLayoutProps) {
  const navigation = useNavigation();
  const { scale } = useFontSize();
  const [presentationMode, setPresentationMode] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentResultIdx, setCurrentResultIdx] = useState(0);
  const [presentationStartBlockId, setPresentationStartBlockId] = useState<string | undefined>(undefined);

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<number[]>([]);
  const blockOffsets = useRef<Record<string, number>>({});
  const scrollYRef = useRef(0);
  const exitScrollBlockIdRef = useRef<string | undefined>(undefined);

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

  const allBlocks: PrayerBlockType[] = sections.flatMap((sec) => sec.blocks);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: Array<{ block: PrayerBlockType }> = [];
    for (const sec of sections) {
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
  }, [searchQuery, sections]);

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
    const entries = Object.entries(blockOffsets.current);
    if (entries.length === 0) return undefined;
    // Find the last block whose top is at or above the current scroll position
    let best: string | undefined;
    for (const [id, offset] of entries) {
      if (offset <= y + 80) best = id;
    }
    return best;
  }

  function handlePresentPress() {
    hapticMedium();
    // If a search result is active, use that block; otherwise sync to scroll position
    if (!searchQuery.trim()) {
      const blockId = getBlockIdAtScrollY(scrollYRef.current);
      setPresentationStartBlockId(blockId);
    }
    setPresentationMode(true);
  }

  useEffect(() => {
    navigation.setOptions({
      title: title.english,
      headerBackVisible: false,
      headerLeft: () => null,
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 12, marginRight: 16, alignItems: 'center' }}>
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
          <HoverableOpacity
            onPress={() => setDrawerVisible(true)}
            style={{ borderRadius: 6, padding: 2 }}
            hoverStyle={{ backgroundColor: Colors.burgundyDim }}
            hitSlop={8}
          >
            <Text style={{ color: Colors.burgundy, fontSize: 22 }}>{'\u2630'}</Text>
          </HoverableOpacity>
        </View>
      ),
    });
  }, [title, navigation]);

  function scrollToSection(index: number) {
    const y = sectionOffsets.current[index] ?? 0;
    scrollViewRef.current?.scrollTo({ y, animated: true });
  }

  useEffect(() => {
    if (presentationMode) {
      navigation.setOptions({ headerShown: false });
      if (Platform.OS === 'web') {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      }
    } else {
      navigation.setOptions({ headerShown: true });
      if (Platform.OS === 'web') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
      } else {
        ScreenOrientation.unlockAsync();
      }
    }

    return () => {
      navigation.setOptions({ headerShown: true });
      if (Platform.OS !== 'web') {
        ScreenOrientation.unlockAsync();
      }
    };
  }, [presentationMode, navigation]);

  if (presentationMode) {
    return (
      <>
        <StatusBar style="light" hidden />
        <PresentationView
          blocks={allBlocks}
          sections={sections}
          onExit={(blockId) => {
            exitScrollBlockIdRef.current = blockId;
            setPresentationMode(false);
          }}
          startBlockId={presentationStartBlockId}
        />
      </>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Invisible right-edge swipe zone to open drawer */}
      {Platform.OS !== 'web' && (
        <GestureDetector gesture={edgeSwipe}>
          <Animated.View style={styles.edgeSwipeZone} />
        </GestureDetector>
      )}

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        <View style={contentColumn.wrapper}>
          {/* Title block */}
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

          {sections.map((sec, secIdx) => (
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

      {/* Floating search overlay */}
      {searchVisible && (
        <View style={styles.searchOverlay}>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
              placeholder="Search…"
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
              <Text style={styles.searchCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          {searchQuery.trim().length > 0 && (
            <View style={styles.searchNav}>
              <TouchableOpacity
                style={[styles.navBtn, currentResultIdx === 0 && styles.navBtnDisabled]}
                onPress={() => navigateToResult(currentResultIdx - 1)}
                disabled={currentResultIdx === 0}
              >
                <Text style={styles.navBtnText}>▲</Text>
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
                <Text style={styles.navBtnText}>▼</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.presentFab} onPress={handlePresentPress}>
        <Ionicons name="easel-outline" size={17} color={Colors.background} />
      </TouchableOpacity>

      <SectionDrawer
        sections={sections}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onSelect={scrollToSection}
        onPresent={handlePresentPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, overflow: 'hidden' },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },

  /* ── Title area ── */
  titleBlock: {
    marginBottom: 32,
    paddingBottom: 20,
    alignItems: 'center',
  },
  decorativeCross: {
    marginBottom: 10,
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

  /* ── Section headings (decorative badge) ── */
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

  presentFab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 5,
  },

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
});
