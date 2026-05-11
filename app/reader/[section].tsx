import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import ReaderLayout from '@/components/ReaderLayout';
import { loadServiceRuntime } from '@/data/runtimeIndex';
import { ReadingsProvider } from '@/context/ReadingsContext';

export default function ReaderScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  // Reader routes now load committed compiled runtime by slug, which keeps the
  // canonical source schema and compiler details outside the Expo app.
  const data = loadServiceRuntime(section);

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Section not found.</Text>
      </View>
    );
  }

  return (
    <ReadingsProvider>
      <ReaderLayout
        title={data.title}
        sections={data.sections}
        showReadingPicker={section === 'serate-qidase'}
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
