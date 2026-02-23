import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { contentColumn } from '@/constants/layout';
import { AnaphoraMetadata } from '@/data/types';

const ANAPHORAS: AnaphoraMetadata[] = require('@/data/anaphoras/anaphoras.json');

export default function AnaphoraListScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={contentColumn.wrapper}>
          <View style={styles.header}>
            <Text style={styles.decorativeCross}>✦</Text>
            <Text style={styles.titleGeez}>ፍሬ ቅዳሴ</Text>
            <Text style={styles.titleEnglish}>FERE KIDASE</Text>
            <Text style={styles.subtitle}>Select an anaphora to read</Text>
          </View>

          {ANAPHORAS.map((anaphora, index) => (
            <TouchableOpacity
              key={anaphora.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => router.push(`/anaphora/${anaphora.id}`)}
            >
              <View style={styles.cardInnerBorder}>
                <View style={styles.cardContent}>
                  {/* Gold seal badge */}
                  <View style={styles.sealBadge}>
                    <Text style={styles.sealNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.cardText}>
                    {anaphora.name.geez && (
                      <Text style={styles.cardGeez}>{anaphora.name.geez}</Text>
                    )}
                    <Text style={styles.cardTitle}>{anaphora.name.english}</Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 24, paddingTop: 8 },

  /* ── Header ── */
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 24,
  },
  decorativeCross: {
    fontSize: 20,
    color: Colors.accent,
    marginBottom: 10,
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

  /* ── Manuscript cards ── */
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 4,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.frameOuter,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInnerBorder: {
    margin: 4,
    borderWidth: 1,
    borderColor: Colors.frameInner,
    borderRadius: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 14,
  },
  sealBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.goldSeal,
    borderWidth: 2,
    borderColor: Colors.goldSealBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealNumber: {
    fontFamily: Fonts.serifBold,
    color: Colors.textOnColor,
    fontSize: 15,
    fontWeight: '700',
  },
  cardText: {
    flex: 1,
  },
  cardGeez: {
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardTitle: {
    fontFamily: Fonts.bodyRegular,
    color: Colors.textMuted,
    fontSize: 13,
  },
  arrow: {
    color: Colors.accent,
    fontSize: 24,
    fontWeight: '300',
  },

  bottomPadding: { height: 40 },
});
