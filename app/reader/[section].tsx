import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Colors } from '@/constants/colors';
import { useFontSize } from '@/context/FontSizeContext';
import PrayerBlock from '@/components/PrayerBlock';
import PresentationView from '@/components/PresentationView';
import RightSlider from '@/components/RightSlider';
import { LiturgicalText, PrayerBlock as PrayerBlockType } from '@/data/types';

function loadSection(id: string): LiturgicalText | null {
  switch (id) {
    case 'kidan':
      return require('@/data/kidan').default;
    case 'serate-kidase':
      return require('@/data/serate-kidase').default;
    default:
      return null;
  }
}

export default function ReaderScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const navigation = useNavigation();
  const { scale } = useFontSize();
  const [presentationMode, setPresentationMode] = useState(false);
  const [sliderOpen, setSliderOpen] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<number[]>([]);

  const data = loadSection(section);

  // Flatten all blocks from all sections for presentation mode
  const allBlocks: PrayerBlockType[] = data
    ? data.sections.flatMap((sec) => sec.blocks)
    : [];

  useEffect(() => {
    if (data) {
      navigation.setOptions({ title: data.title.english });
    }
  }, [data, navigation]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

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

  const handleSectionLayout = (index: number) => (event: LayoutChangeEvent) => {
    sectionOffsets.current[index] = event.nativeEvent.layout.y;
  };

  const scrollToSection = (index: number) => {
    const offset = sectionOffsets.current[index];
    if (offset !== undefined) {
      scrollViewRef.current?.scrollTo({ y: Math.max(0, offset - 8), animated: true });
    }
  };

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Section not found.</Text>
      </View>
    );
  }

  if (presentationMode) {
    return (
      <>
        <StatusBar style="light" hidden />
        <PresentationView
          blocks={allBlocks}
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
          {data.title.geez && (
            <Text style={[styles.titleGeez, { fontSize: scale(28) }]}>{data.title.geez}</Text>
          )}
          <Text style={[styles.titleEnglish, { fontSize: scale(14) }]}>
            {data.title.english.toUpperCase()}
          </Text>
        </View>

        {data.sections.map((sec, index) => (
          <View key={sec.id} onLayout={handleSectionLayout(index)}>
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

      {/* Sections button */}
      <TouchableOpacity
        style={styles.sectionsBtn}
        onPress={() => setSliderOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.sectionsBtnText}>≡ Sections</Text>
      </TouchableOpacity>

      {/* Present button */}
      <TouchableOpacity
        style={styles.presentationBtn}
        onPress={() => setPresentationMode(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.presentationBtnText}>⛶ Present</Text>
      </TouchableOpacity>

      {/* Right-side sections slider */}
      <RightSlider
        sections={data.sections.map((sec) => ({
          id: sec.id,
          title: sec.title.english,
          geezTitle: sec.title.geez,
        }))}
        isOpen={sliderOpen}
        onClose={() => setSliderOpen(false)}
        onSelectSection={scrollToSection}
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
  sectionsBtn: {
    position: 'absolute',
    bottom: 28,
    left: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sectionsBtnText: {
    color: Colors.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
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
