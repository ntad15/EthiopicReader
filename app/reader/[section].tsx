import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import ReaderLayout from '@/components/ReaderLayout';
import { LiturgicalText } from '@/data/types';
import { ReadingsProvider } from '@/context/ReadingsContext';

function loadSection(id: string): LiturgicalText | null {
  switch (id) {
    case 'qidan':
      return require('@/data/qidan.json');
    case 'serate-qidase':
      return require('@/data/serate-qidase.json');
    default:
      return null;
  }
}

export default function ReaderScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const data = loadSection(section);

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
