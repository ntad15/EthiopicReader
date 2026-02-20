import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Colors } from '@/constants/colors';
import { useFontSize } from '@/context/FontSizeContext';
import PrayerBlock from '@/components/PrayerBlock';
import PresentationView from '@/components/PresentationView';
import SectionDrawer from '@/components/SectionDrawer';
import { Anaphora, PrayerBlock as PrayerBlockType } from '@/data/types';

const ANAPHORA_MAP: Record<string, () => Anaphora> = {
  'saint-john-chrysostom': () => require('@/data/anaphoras/saint-john-chrysostom').default,
  'saint-mary': () => require('@/data/anaphoras/saint-mary').default,
  'apostles': () => require('@/data/anaphoras/apostles').default,
  'saint-basil': () => require('@/data/anaphoras/saint-basil').default,
  'saint-gregory': () => require('@/data/anaphoras/saint-gregory').default,
  'saint-epiphanius': () => require('@/data/anaphoras/saint-epiphanius').default,
  'saint-cyril': () => require('@/data/anaphoras/saint-cyril').default,
  'saint-james-sarugh': () => require('@/data/anaphoras/saint-james-sarugh').default,
  'saint-james-nisibis': () => require('@/data/anaphoras/saint-james-nisibis').default,
  'saint-dioscorus': () => require('@/data/anaphoras/saint-dioscorus').default,
  'our-lord': () => require('@/data/anaphoras/our-lord').default,
  'saint-john-thunder': () => require('@/data/anaphoras/saint-john-thunder').default,
  'three-hundred-eighteen': () => require('@/data/anaphoras/three-hundred-eighteen').default,
  'saint-athanasius': () => require('@/data/anaphoras/saint-athanasius').default,
};

export default function AnaphoraReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { scale } = useFontSize();
  const [presentationMode, setPresentationMode] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<number[]>([]);

  const loader = ANAPHORA_MAP[id];
  const data: Anaphora | null = loader ? loader() : null;

  // Flatten all blocks from all sections for presentation mode
  const allBlocks: PrayerBlockType[] = data
    ? data.sections.flatMap((sec) => sec.blocks)
    : [];

  useEffect(() => {
    if (data) {
      navigation.setOptions({
        title: data.name.english,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => setDrawerVisible(true)}
            style={{ marginRight: 16 }}
            hitSlop={8}
          >
            <Text style={{ color: Colors.accent, fontSize: 22 }}>☰</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [data, navigation]);

  function scrollToSection(index: number) {
    const y = sectionOffsets.current[index] ?? 0;
    scrollViewRef.current?.scrollTo({ y, animated: true });
  }

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (presentationMode) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
      return;
    }

    if (presentationMode) {
      navigation.setOptions({ headerShown: false });
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } else {
      navigation.setOptions({ headerShown: true });
      ScreenOrientation.unlockAsync();
    }

    return () => {
      navigation.setOptions({ headerShown: true });
      ScreenOrientation.unlockAsync();
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

        {data.sections.map((sec, index) => (
          <View
            key={sec.id}
            onLayout={(e) => {
              sectionOffsets.current[index] = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { fontSize: scale(11) }]}>
                {sec.title.english.toUpperCase()}
              </Text>
            </View>
            {sec.blocks.map((block) => (
              <PrayerBlock key={block.id} block={block} />
            ))}
          </View>
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>

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
  container: { flex: 1, backgroundColor: Colors.background },
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
});
