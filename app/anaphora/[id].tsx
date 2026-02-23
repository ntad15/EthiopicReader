import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import ReaderLayout from '@/components/ReaderLayout';
import { Anaphora } from '@/data/types';

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
  const loader = ANAPHORA_MAP[id];
  const data: Anaphora | null = loader ? loader() : null;

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Anaphora not found.</Text>
      </View>
    );
  }

  return (
    <ReaderLayout
      title={data.name}
      sections={data.sections}
      geezTitleSize={32}
    />
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
