import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  PanResponder,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { contentColumn } from '@/constants/layout';
import { useFontSize } from '@/context/FontSizeContext';
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

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<number[]>([]);

  /* Swipe left to open section drawer (mobile) */
  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, { dx, dy }) =>
        Platform.OS !== 'web' && dx < -20 && Math.abs(dx) > Math.abs(dy) * 2,
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -50) setDrawerVisible(true);
      },
    }),
  ).current;

  const allBlocks: PrayerBlockType[] = sections.flatMap((sec) => sec.blocks);

  useEffect(() => {
    navigation.setOptions({
      title: title.english,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setDrawerVisible(true)}
          style={{ marginRight: 16 }}
          hitSlop={8}
        >
          <Text style={{ color: Colors.burgundy, fontSize: 22 }}>{'\u2630'}</Text>
        </TouchableOpacity>
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
          onExit={() => setPresentationMode(false)}
        />
      </>
    );
  }

  return (
    <View style={styles.container} {...swipe.panHandlers}>
      <StatusBar style="dark" />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={contentColumn.wrapper}>
          {/* Title block */}
          <View style={styles.titleBlock}>
            <Text style={styles.decorativeCross}>{'\u2726'}</Text>
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

          {sections.map((sec, index) => (
            <View
              key={sec.id}
              onLayout={(e) => {
                sectionOffsets.current[index] = e.nativeEvent.layout.y;
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
                <PrayerBlock key={block.id} block={block} />
              ))}
            </View>
          ))}

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.presentationBtn}
        onPress={() => setPresentationMode(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.presentationBtnText}>Present</Text>
      </TouchableOpacity>

      <SectionDrawer
        sections={sections}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onSelect={scrollToSection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },

  /* ── Title area ── */
  titleBlock: {
    marginBottom: 32,
    paddingBottom: 20,
    alignItems: 'center',
  },
  decorativeCross: {
    fontSize: 20,
    color: Colors.accent,
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

  bottomPadding: { height: 100 },

  /* ── Floating present button ── */
  presentationBtn: {
    position: 'absolute',
    bottom: 28,
    right: 28,
    backgroundColor: Colors.burgundy,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  presentationBtnText: {
    color: Colors.textOnColor,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
