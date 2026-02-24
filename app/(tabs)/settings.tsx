import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import HoverableOpacity from '@/components/HoverableOpacity';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import Constants from 'expo-constants';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { contentColumn } from '@/constants/layout';
import { ALL_LANGUAGES, LANGUAGE_LABELS } from '@/constants/languages';
import { useLanguage } from '@/context/LanguageContext';
import { useFontSize, FONT_SIZE_MIN, FONT_SIZE_MAX } from '@/context/FontSizeContext';
import { hapticLight } from '@/utils/haptics';
import { Language } from '@/data/types';

export default function SettingsScreen() {
  const { toggleLanguage, isActive, canAddMore, primaryLanguage, setPrimaryLanguage } = useLanguage();
  const { multiplier, setMultiplier, scale } = useFontSize();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={contentColumn.wrapper}>
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
                  <HoverableOpacity
                    key={lang}
                    style={[styles.pill, active && styles.pillActive, disabled && styles.pillDisabled]}
                    hoverStyle={disabled ? undefined : active ? styles.pillActiveHover : styles.pillHover}
                    onPress={() => {
                      hapticLight();
                      toggleLanguage(lang);
                    }}
                    activeOpacity={disabled ? 1 : 0.7}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive, disabled && styles.pillTextDisabled]}>
                      {LANGUAGE_LABELS[lang]}
                    </Text>
                  </HoverableOpacity>
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
                <HoverableOpacity
                  key={lang}
                  style={[styles.pill, primaryLanguage === lang && styles.pillActive]}
                  hoverStyle={primaryLanguage === lang ? styles.pillActiveHover : styles.pillHover}
                  onPress={() => {
                    hapticLight();
                    setPrimaryLanguage(lang);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, primaryLanguage === lang && styles.pillTextActive]}>
                    {LANGUAGE_LABELS[lang]}
                  </Text>
                </HoverableOpacity>
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
              minimumTrackTintColor={Colors.burgundy}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.burgundy}
            />
            <Text style={[styles.previewText, { fontSize: scale(16) }]}>
              Preview text {'\u2014'} {'\u1245\u12F3\u1234'}
            </Text>
          </View>

          {/* App Info */}
          <Text style={styles.sectionTitle}>APP INFO</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} />
            <InfoRow label="Platform" value={Platform.OS} />
            <InfoRow label="Build" value={__DEV__ ? 'Development' : 'Production'} />
          </View>
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
  scroll: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },

  heading: {
    fontFamily: Fonts.serifBold,
    color: Colors.text,
    fontSize: 28,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 16,
    marginBottom: 24,
  },
  sectionHint: {
    fontFamily: Fonts.bodyRegular,
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
  pillHover: {
    borderColor: Colors.accent,
    backgroundColor: Colors.surface,
  },
  pillActive: {
    borderColor: Colors.burgundy,
    backgroundColor: Colors.burgundy,
  },
  pillActiveHover: {
    backgroundColor: Colors.burgundyLight,
  },
  pillText: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: Colors.textOnColor,
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
    color: Colors.burgundy,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 36,
  },
  previewText: {
    fontFamily: Fonts.bodyRegular,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 8,
  },

  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
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
    fontFamily: Fonts.bodyRegular,
    color: Colors.text,
    fontSize: 15,
  },
  infoValue: {
    fontFamily: Fonts.bodyRegular,
    color: Colors.textMuted,
    fontSize: 14,
    textTransform: 'capitalize',
  },
});
