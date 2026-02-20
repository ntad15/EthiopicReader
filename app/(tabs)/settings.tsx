import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import Constants from 'expo-constants';
import { Colors } from '@/constants/colors';
import { ALL_LANGUAGES, LANGUAGE_LABELS } from '@/constants/languages';
import { useLanguage } from '@/context/LanguageContext';
import { useFontSize, FONT_SIZE_MIN, FONT_SIZE_MAX } from '@/context/FontSizeContext';
import { Language } from '@/data/types';

export default function SettingsScreen() {
  const { toggleLanguage, isActive, canAddMore, primaryLanguage, setPrimaryLanguage } = useLanguage();
  const { multiplier, setMultiplier, scale } = useFontSize();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Settings</Text>

        {/* Display Languages */}
        <Text style={styles.sectionTitle}>DISPLAY LANGUAGES</Text>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHint}>Select up to 3 languages to show side by side.</Text>
          <View style={styles.pillRow}>
            {ALL_LANGUAGES.map((lang: Language) => {
              const active = isActive(lang);
              const disabled = !active && !canAddMore;
              return (
                <TouchableOpacity
                  key={lang}
                  style={[styles.pill, active && styles.pillActive, disabled && styles.pillDisabled]}
                  onPress={() => toggleLanguage(lang)}
                  activeOpacity={disabled ? 1 : 0.7}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive, disabled && styles.pillTextDisabled]}>
                    {LANGUAGE_LABELS[lang]}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>A</Text>
            <Text style={styles.sliderValue}>{Math.round(multiplier * 100)}%</Text>
            <Text style={styles.sliderLabelLarge}>A</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={FONT_SIZE_MIN}
            maximumValue={FONT_SIZE_MAX}
            value={multiplier}
            onValueChange={setMultiplier}
            step={0.05}
            minimumTrackTintColor={Colors.accent}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.accent}
          />
          <Text style={[styles.previewText, { fontSize: scale(16) }]}>
            Preview text — ቅዳሴ
          </Text>
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
  pillDisabled: {
    opacity: 0.35,
  },
  pillTextDisabled: {
    color: Colors.textDim,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  sliderLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  sliderLabelLarge: {
    color: Colors.textMuted,
    fontSize: 22,
    fontWeight: '600',
  },
  sliderValue: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 36,
  },
  previewText: {
    color: Colors.text,
    textAlign: 'center',
    marginTop: 8,
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
