import { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import HoverableOpacity from '@/components/HoverableOpacity';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInUp,
  FadeOutUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { contentColumn } from '@/constants/layout';
import { hapticLight } from '@/utils/haptics';
import CrossIcon from '@/components/CrossIcon';

const QIDASE_SUBSECTIONS = [
  {
    id: 'qidan',
    title: 'Qidan',
    geez: 'ኪዳን',
    description: 'Prayer of the Covenant',
    route: '/reader/qidan' as const,
  },
  {
    id: 'serate-qidase',
    title: 'Serate Qidase',
    geez: 'ሥርዓተ ቅዳሴ',
    description: 'Preparatory Service',
    route: '/reader/serate-qidase' as const,
  },
  {
    id: 'fere-qidase',
    title: 'Fere Qidase',
    geez: 'ፍሬ ቅዳሴ',
    description: '14 Anaphoras',
    route: '/anaphora' as const,
  },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [qidaseOpen, setQidaseOpen] = useState(false);
  const chevronRotation = useSharedValue(0); // 90deg = open (pointing down via rotation)

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${chevronRotation.value}deg` }],
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, contentColumn.wrapper]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.headerBar}>
          <View style={styles.headerCenter}>
            <View style={{ marginTop: 6 }}>
              <CrossIcon size={isMobile ? 24 : 16} color={Colors.burgundy} />
            </View>
            <Text style={[styles.headerTitle, isMobile && styles.headerTitleMobile]}>Qidase Reader</Text>
          </View>
        </View>

        {/* ── Scripture banner ── */}
        <View style={styles.banner}>
          <View style={[styles.bannerImageWrap, isMobile && styles.bannerImageWrapMobile]}>
            <Image
              source={require('@/assets/images/cross_painting_cropped.jpg')}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.bannerContent}>
            <Text style={styles.quoteText}>
              Love the Lord your God with all your heart and with all your soul and with all your mind.
            </Text>
            <Text style={styles.quoteRef}>{'\u2014'} Gospel of Matthew 22:37</Text>
            <View style={styles.quoteDivider} />
            <Text style={styles.quoteText}>
              Love your neighbor as yourself.
            </Text>
            <Text style={styles.quoteRef}>{'\u2014'} Gospel of Matthew 22:39</Text>
          </View>
        </View>

        {/* ── Content Library ── */}
        <Text style={styles.sectionTitle}>Content Library</Text>

        {/* Qidase — parent section */}
        <HoverableOpacity
          style={styles.parentItem}
          hoverStyle={styles.parentItemHover}
          activeOpacity={0.7}
          onPress={() => {
            hapticLight();
            chevronRotation.value = withTiming(qidaseOpen ? 0 : 90, { duration: 200 });
            setQidaseOpen(!qidaseOpen);
          }}
        >
          <View style={styles.parentIcon}>
            <CrossIcon size={20} color="#E8DCC8" />
          </View>
          <View style={styles.parentText}>
            <Text style={styles.parentTitle}>Qidase</Text>
            <Text style={styles.parentGeez}>ቅዳሴ</Text>
            <Text style={styles.parentDesc}>Holy Liturgy</Text>
          </View>
          <Animated.View style={chevronStyle}>
            <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
          </Animated.View>
        </HoverableOpacity>

        {/* Subsections */}
        {qidaseOpen &&
          QIDASE_SUBSECTIONS.map((section, i) => (
            <Animated.View
              key={section.id}
              entering={FadeInUp.duration(200).delay(i * 50)}
              exiting={FadeOutUp.duration(150)}
            >
              <HoverableOpacity
                style={styles.subItem}
                hoverStyle={styles.subItemHover}
                activeOpacity={0.7}
                onPress={() => {
                  hapticLight();
                  router.push(section.route);
                }}
              >
                <View style={styles.subIcon}>
                  <CrossIcon size={14} color="#FFF8F0" />
                </View>
                <View style={styles.subText}>
                  <Text style={styles.subTitle}>{section.title}</Text>
                  <Text style={styles.subGeez}>{section.geez}</Text>
                  <Text style={styles.subDesc}>{section.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
              </HoverableOpacity>
            </Animated.View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  /* ── Header bar ── */
  headerBar: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 18,
    color: Colors.text,
  },
  headerTitleMobile: {
    fontSize: 24,
  },

  /* ── Scripture banner ── */
  banner: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  bannerImageWrap: {
    width: 100,
    overflow: 'hidden',
  },
  bannerImageWrapMobile: {
    width: 130,
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  bannerContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  quoteText: {
    fontFamily: Fonts.bodyRegular,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  quoteRef: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textDim,
    marginTop: 2,
  },
  quoteDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 8,
  },

  /* ── Content Library ── */
  sectionTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 20,
    color: Colors.text,
    marginBottom: 16,
  },

  /* Parent section (Qidase) */
  parentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  parentItemHover: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.accent,
  },
  parentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentText: {
    flex: 1,
  },
  parentTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 20,
    color: Colors.text,
    marginBottom: 1,
  },
  parentGeez: {
    fontFamily: Fonts.bodyRegular,
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  parentDesc: {
    fontFamily: Fonts.bodyItalic,
    fontSize: 13,
    color: Colors.textDim,
    fontStyle: 'italic',
  },

  /* Subsection items */
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    paddingLeft: 28,
    marginBottom: 6,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  subItemHover: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.accent,
  },
  subIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subText: {
    flex: 1,
  },
  subTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 1,
  },
  subGeez: {
    fontFamily: Fonts.bodyRegular,
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 1,
  },
  subDesc: {
    fontFamily: Fonts.bodyItalic,
    fontSize: 12,
    color: Colors.textDim,
    fontStyle: 'italic',
  },

});
