import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Colors } from '@/constants/colors';
import { useFontSize } from '@/context/FontSizeContext';
import PrayerBlock from '@/components/PrayerBlock';
import PresentationView from '@/components/PresentationView';
import SectionDrawer from '@/components/SectionDrawer';
import { Ionicons } from '@expo/vector-icons';
import { Anaphora, PrayerBlock as PrayerBlockType } from '@/data/types';

const ANAPHORA_MAP: Record<string, () => Anaphora> = {
  'saint-john-chrysostom': () => require('@/data/anaphoras/saint-john-chrysostom.json'),
  'saint-mary': () => require('@/data/anaphoras/saint-mary.json'),
  'apostles': () => require('@/data/anaphoras/apostles.json'),
  'saint-basil': () => require('@/data/anaphoras/saint-basil.json'),
  'saint-gregory': () => require('@/data/anaphoras/saint-gregory.json'),
  'saint-epiphanius': () => require('@/data/anaphoras/saint-epiphanius.json'),
  'saint-cyril': () => require('@/data/anaphoras/saint-cyril.json'),
  'saint-james-sarugh': () => require('@/data/anaphoras/saint-james-sarugh.json'),
  'saint-james-nisibis': () => require('@/data/anaphoras/saint-james-nisibis.json'),
  'saint-dioscorus': () => require('@/data/anaphoras/saint-dioscorus.json'),
  'our-lord': () => require('@/data/anaphoras/our-lord.json'),
  'saint-john-thunder': () => require('@/data/anaphoras/saint-john-thunder.json'),
  'three-hundred-eighteen': () => require('@/data/anaphoras/three-hundred-eighteen.json'),
  'saint-athanasius': () => require('@/data/anaphoras/saint-athanasius.json'),
};

export default function AnaphoraReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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

  const loader = ANAPHORA_MAP[id];
  const data: Anaphora | null = loader ? loader() : null;

  const allBlocks: PrayerBlockType[] = data
    ? data.sections.flatMap((sec) => sec.blocks)
    : [];

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !data) return [];
    const q = searchQuery.toLowerCase();
    const results: Array<{ sectionTitle: string; block: PrayerBlockType }> = [];
    for (const sec of data.sections) {
      for (const block of sec.blocks) {
        const haystack = [block.geez, block.amharic, block.english, block.transliteration]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (haystack.includes(q)) {
          results.push({ sectionTitle: sec.title.english, block });
        }
      }
    }
    return results;
  }, [searchQuery, data]);

  const navigateToResult = useCallback((idx: number) => {
    if (searchResults.length === 0) return;
    const bounded = Math.max(0, Math.min(idx, searchResults.length - 1));
    setCurrentResultIdx(bounded);
    const { block } = searchResults[bounded];
    const y = blockOffsets.current[block.id] ?? 0;
    scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
    setPresentationStartBlockId(block.id);
  }, [searchResults]);

  // Auto-navigate to first result when query changes
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

  useEffect(() => {
    if (data) {
      navigation.setOptions({
        title: data.name.english,
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 16, marginRight: 16 }}>
            <TouchableOpacity
              onPress={() => {
                setSearchVisible((v) => !v);
                setSearchQuery('');
                setCurrentResultIdx(0);
                setPresentationStartBlockId(undefined);
              }}
              hitSlop={8}
            >
              <Ionicons name="search-outline" size={22} color={Colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDrawerVisible(true)} hitSlop={8}>
              <Text style={{ color: Colors.accent, fontSize: 22 }}>☰</Text>
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [data, navigation]);

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

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Anaphora not found.</Text>
      </View>
    );
  }

  if (presentationMode) {
    return (
      <>
        <StatusBar style="light" hidden />
        <PresentationView
          blocks={allBlocks}
          sections={data.sections}
          onExit={() => setPresentationMode(false)}
          startBlockId={presentationStartBlockId}
        />
      </>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          {data.name.geez && (
            <Text style={[styles.titleGeez, { fontSize: scale(26) }]}>{data.name.geez}</Text>
          )}
          <Text style={[styles.titleEnglish, { fontSize: scale(13) }]}>
            {data.name.english.toUpperCase()}
          </Text>
        </View>

        {data.sections.map((sec, secIdx) => (
          <View
            key={sec.id}
            onLayout={(e) => {
              sectionOffsets.current[secIdx] = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { fontSize: scale(11) }]}>
                {sec.title.english.toUpperCase()}
              </Text>
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

      <TouchableOpacity
        style={styles.presentationBtn}
        onPress={() => setPresentationMode(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.presentationBtnText}>⛶ Present</Text>
      </TouchableOpacity>

      <SectionDrawer
        sections={data.sections}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onSelect={scrollToSection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, overflow: 'hidden' },
  scroll: { padding: 20, paddingTop: 16 },
  titleBlock: {
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  titleGeez: {
    color: Colors.accent,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  titleEnglish: {
    color: Colors.textMuted,
    letterSpacing: 3,
    fontWeight: '600',
  },
  sectionHeading: {
    marginTop: 24,
    marginBottom: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    color: Colors.accent,
    fontWeight: '700',
    letterSpacing: 2,
  },
  highlightedBlock: {
    backgroundColor: Colors.accentDim,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { color: Colors.textMuted, fontSize: 16 },
  bottomPadding: { height: 100 },
  presentationBtn: {
    position: 'absolute',
    bottom: 28,
    right: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  presentationBtnText: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: 13,
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
