import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { ALL_LANGUAGES, LANGUAGE_LABELS } from '@/constants/languages';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/data/types';

const SECTIONS = [
  {
    id: 'kidan',
    title: { english: 'Kidan', geez: 'ኪዳን', amharic: 'ኪዳን' },
    subtitle: 'Prayer of the Covenant',
    route: '/reader/kidan' as const,
  },
  {
    id: 'serate-kidase',
    title: { english: 'Serate Kidase', geez: 'ሥርዓተ ቅዳሴ', amharic: 'ሥርዓተ ቅዳሴ' },
    subtitle: 'Preparatory Service',
    route: '/reader/serate-kidase' as const,
  },
  {
    id: 'fere-kidase',
    title: { english: 'Fere Kidase', geez: 'ፍሬ ቅዳሴ', amharic: 'ፍሬ ቅዳሴ' },
    subtitle: '14 Anaphoras',
    route: '/anaphora' as const,
  },
];

export default function HomeScreen() {
  const { activeLanguages, toggleLanguage, isActive } = useLanguage();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>ቅዳሴ</Text>
          <Text style={styles.appSubtitle}>Kidase Reader</Text>
        </View>

        {/* Language pills */}
        <View style={styles.langRow}>
          {ALL_LANGUAGES.map((lang: Language) => (
            <TouchableOpacity
              key={lang}
              style={[styles.pill, isActive(lang) && styles.pillActive]}
              onPress={() => toggleLanguage(lang)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, isActive(lang) && styles.pillTextActive]}>
                {LANGUAGE_LABELS[lang]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section cards */}
        <Text style={styles.sectionLabel}>SECTIONS</Text>
        {SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => router.push(section.route)}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardText}>
                <Text style={styles.cardGeez}>{section.title.geez}</Text>
                <Text style={styles.cardTitle}>{section.title.english}</Text>
                <Text style={styles.cardSubtitle}>{section.subtitle}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>
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
    padding: 20,
    paddingTop: 12,
  },
  header: {
    paddingTop: 12,
    marginBottom: 24,
  },
  appTitle: {
    color: Colors.accent,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: 2,
  },
  appSubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 28,
  },
  pill: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
  },
  pillActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  pillText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: Colors.accent,
  },
  sectionLabel: {
    color: Colors.textDim,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  cardText: {
    flex: 1,
  },
  cardGeez: {
    color: Colors.accent,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 1,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 3,
  },
  arrow: {
    color: Colors.textDim,
    fontSize: 28,
    fontWeight: '300',
    marginLeft: 12,
  },
});
