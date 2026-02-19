import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
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

        {data.sections.map((sec) => (
          <View key={sec.id}>
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
