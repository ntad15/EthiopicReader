import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import ReaderLayout from '@/components/ReaderLayout';
import { loadAnaphoraRuntime } from '@/data/runtimeIndex';

export default function AnaphoraReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Anaphoras come through the generated runtime index so new source docs only
  // need to be compiled once instead of hand-wired into route files.
  const data = loadAnaphoraRuntime(id);

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
