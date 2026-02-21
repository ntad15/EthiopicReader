import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { AnaphoraMetadata } from '@/data/types';

const ANAPHORAS: AnaphoraMetadata[] = require('@/data/anaphoras/anaphoras.json');

export default function AnaphoraListScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.titleGeez}>ፍሬ ቅዳሴ</Text>
          <Text style={styles.titleEnglish}>FERE KIDASE</Text>
          <Text style={styles.subtitle}>Select an anaphora to read</Text>
        </View>

        {ANAPHORAS.map((anaphora, index) => (
          <TouchableOpacity
            key={anaphora.id}
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => router.push(`/anaphora/${anaphora.id}`)}
          >
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <View style={styles.cardText}>
              {anaphora.name.geez && (
                <Text style={styles.cardGeez}>{anaphora.name.geez}</Text>
              )}
              <Text style={styles.cardTitle}>{anaphora.name.english}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingTop: 8 },
  header: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 20,
  },
  titleGeez: {
    color: Colors.accent,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 2,
  },
  titleEnglish: {
    color: Colors.textMuted,
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textDim,
    fontSize: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 12,
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  cardText: {
    flex: 1,
  },
  cardGeez: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardTitle: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  arrow: {
    color: Colors.textDim,
    fontSize: 24,
    fontWeight: '300',
  },
  bottomPadding: { height: 40 },
});
