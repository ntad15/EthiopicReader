import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Colors } from '@/constants/colors';
import { ALL_LANGUAGES, LANGUAGE_LABELS } from '@/constants/languages';
import { useLanguage } from '@/context/LanguageContext';
import { useFontSize, FontSizePreset } from '@/context/FontSizeContext';
import { Language } from '@/data/types';

const FONT_SIZE_PRESETS: { label: string; value: FontSizePreset; description: string }[] = [
  { label: 'Normal', value: 'normal', description: 'Default size' },
  { label: 'Large', value: 'large', description: 'Easier reading' },
  { label: 'TV', value: 'tv', description: 'Projected screen' },
];

export default function SettingsScreen() {
  const { toggleLanguage, isActive, primaryLanguage, setPrimaryLanguage } = useLanguage();
  const { preset, setPreset } = useFontSize();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Settings</Text>

        {/* Display Languages */}
        <Text style={styles.sectionTitle}>DISPLAY LANGUAGES</Text>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHint}>Select one or more languages to show during reading.</Text>
          <View style={styles.pillRow}>
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
        </View>

        {/* Primary Language */}
        <Text style={styles.sectionTitle}>PRIMARY LANGUAGE</Text>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHint}>Always shown first. Only active languages can be set as primary.</Text>
          <View style={styles.pillRow}>
            {ALL_LANGUAGES.filter(isActive).map((lang: Language) => (
              <TouchableOpacity
                key={lang}
                style={[styles.pill, primaryLanguage === lang && styles.pillActive]}
                onPress={() => setPrimaryLanguage(lang)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, primaryLanguage === lang && styles.pillTextActive]}>
                  {LANGUAGE_LABELS[lang]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Font Size */}
        <Text style={styles.sectionTitle}>TEXT SIZE</Text>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHint}>
            Use "TV" when projecting to a large screen or casting via AirPlay/Chromecast.
          </Text>
          <View style={styles.presetRow}>
            {FONT_SIZE_PRESETS.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[styles.presetBtn, preset === p.value && styles.presetBtnActive]}
                onPress={() => setPreset(p.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetLabel, preset === p.value && styles.presetLabelActive]}>
                  {p.label}
                </Text>
                <Text style={[styles.presetDesc, preset === p.value && styles.presetDescActive]}>
                  {p.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Info */}
        <Text style={styles.sectionTitle}>APP INFO</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} />
          <InfoRow label="Platform" value={Platform.OS} />
          <InfoRow label="Build" value={__DEV__ ? 'Development' : 'Production'} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingTop: 12 },
  heading: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 28,
    marginTop: 8,
  },
  sectionTitle: {
    color: Colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 24,
  },
  sectionHint: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceElevated,
  },
  pillActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  pillText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: Colors.accent,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  presetBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  presetLabel: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  presetLabelActive: {
    color: Colors.accent,
  },
  presetDesc: {
    color: Colors.textDim,
    fontSize: 11,
  },
  presetDescActive: {
    color: Colors.accent,
    opacity: 0.7,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  infoLabel: {
    color: Colors.text,
    fontSize: 15,
  },
  infoValue: {
    color: Colors.textMuted,
    fontSize: 14,
    textTransform: 'capitalize',
  },
});
