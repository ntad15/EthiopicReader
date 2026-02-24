import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import HoverableOpacity from '@/components/HoverableOpacity';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { contentColumn, CONTENT_MAX_WIDTH } from '@/constants/layout';
import CrossIcon from '@/components/CrossIcon';
import { hapticLight } from '@/utils/haptics';
import { AnaphoraMetadata } from '@/data/types';

const ANAPHORAS: AnaphoraMetadata[] = require('@/data/anaphoras/anaphoras.json');

const GAP = 10;

export default function AnaphoraListScreen() {
  const { width } = useWindowDimensions();
  const containerWidth = Math.min(width - 40, CONTENT_MAX_WIDTH);
  const columns = containerWidth >= 380 ? 3 : 2;
  const cardWidth = Math.min((containerWidth - GAP * (columns - 1)) / columns, 180);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={contentColumn.wrapper}>
          <View style={styles.header}>
            <CrossIcon size={18} color={Colors.accent} />
            <Text style={styles.titleGeez}>ፍሬ ቅዳሴ</Text>
            <Text style={styles.titleEnglish}>FERE QIDASE</Text>
            <Text style={styles.subtitle}>Select an anaphora to read</Text>
          </View>

          <View style={styles.grid}>
            {ANAPHORAS.map((anaphora) => (
              <HoverableOpacity
                key={anaphora.id}
                style={[styles.card, { width: cardWidth }]}
                hoverStyle={styles.cardHover}
                activeOpacity={0.7}
                onPress={() => {
                  hapticLight();
                  router.push(`/anaphora/${anaphora.id}`);
                }}
              >
                <View style={styles.iconBadge}>
                  <CrossIcon size={17} color="#FFF8F0" />
                </View>
                {anaphora.name.geez && (
                  <Text style={styles.cardGeez} numberOfLines={2}>{anaphora.name.geez}</Text>
                )}
                <Text style={styles.cardTitle} numberOfLines={2}>{anaphora.name.english}</Text>
              </HoverableOpacity>
            ))}
          </View>

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  /* ── Header ── */
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 24,
  },
  titleGeez: {
    fontFamily: Fonts.serifExtraBold,
    color: Colors.burgundy,
    fontSize: 44,
    letterSpacing: 3,
  },
  titleEnglish: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.textMuted,
    fontSize: 12,
    letterSpacing: 5,
    marginTop: 6,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: Fonts.bodyItalic,
    color: Colors.textDim,
    fontSize: 14,
    fontStyle: 'italic',
  },

  /* ── Grid ── */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: GAP,
  },

  /* ── Cards ── */
  card: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardHover: {
    backgroundColor: Colors.surface,
    borderColor: Colors.accent,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardGeez: {
    fontFamily: Fonts.serifBold,
    color: Colors.text,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 2,
  },
  cardTitle: {
    fontFamily: Fonts.bodyItalic,
    color: Colors.textDim,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  bottomPadding: { height: 40 },
});
