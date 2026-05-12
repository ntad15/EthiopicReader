/**
 * Combined Qidase reader — Serate Qidase followed by the chosen Fere Qidase (anaphora).
 *
 * Route: /qidase/[id]  where [id] is an anaphora id (e.g. "apostles")
 *
 * Combines the sections from serate-qidase.json with those of the selected
 * anaphora into a single ReaderLayout, with the readings picker enabled
 * (same as the standalone serate-qidase reader).
 */
import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import ReaderLayout from '@/components/ReaderLayout';
import { ReadingsProvider } from '@/context/ReadingsContext';
import { LiturgicalSection } from '@/data/types';
import { loadAnaphoraRuntime, loadServiceRuntime } from '@/data/runtimeIndex';

export default function CombinedQidaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // This screen stitches together the compiled common service and one compiled
  // anaphora, matching the existing reader contract without exposing source docs.
  const anaphoraData = loadAnaphoraRuntime(id);
  const serateData = loadServiceRuntime('serate-qidase');

  if (!anaphoraData || !serateData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Anaphora not found.</Text>
      </View>
    );
  }

  // Serate Qidase sections first, then the chosen Fere Qidase sections
  const sections: LiturgicalSection[] = [
    ...serateData.sections,
    ...anaphoraData.sections,
  ];

  return (
    <ReadingsProvider>
      <ReaderLayout
        title={{ english: 'Qidase', geez: 'ቅዳሴ' }}
        sections={sections}
        showReadingPicker
      />
    </ReadingsProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: Fonts.bodyRegular,
    color: Colors.textMuted,
    fontSize: 16,
  },
});
