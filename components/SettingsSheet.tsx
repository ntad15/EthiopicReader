import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import HoverableOpacity from '@/components/HoverableOpacity';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { usePresentationMode } from '@/context/PresentationModeContext';
import { hapticLight } from '@/utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsSheet({ visible, onClose }: Props) {
  const { isPresentationMode, enterPresentation, exitPresentation } = usePresentationMode();

  function selectMode(mode: 'scroll' | 'present') {
    hapticLight();
    if (mode === 'present' && !isPresentationMode) {
      enterPresentation();
    } else if (mode === 'scroll' && isPresentationMode) {
      exitPresentation();
    }
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <Text style={styles.title}>READING MODE</Text>
          <Text style={styles.hint}>
            Scroll mode for reading. Present mode locks to landscape for projection.
          </Text>

          <View style={styles.options}>
            <HoverableOpacity
              style={[styles.option, !isPresentationMode && styles.optionActive]}
              hoverStyle={!isPresentationMode ? styles.optionActiveHover : styles.optionHover}
              onPress={() => selectMode('scroll')}
            >
              <Text style={[styles.optionLabel, !isPresentationMode && styles.optionLabelActive]}>
                Scroll
              </Text>
              <Text style={[styles.optionDesc, !isPresentationMode && styles.optionDescActive]}>
                Continuous reading
              </Text>
            </HoverableOpacity>

            <HoverableOpacity
              style={[styles.option, isPresentationMode && styles.optionActive]}
              hoverStyle={isPresentationMode ? styles.optionActiveHover : styles.optionHover}
              onPress={() => selectMode('present')}
            >
              <Text style={[styles.optionLabel, isPresentationMode && styles.optionLabelActive]}>
                Present
              </Text>
              <Text style={[styles.optionDesc, isPresentationMode && styles.optionDescActive]}>
                One block at a time
              </Text>
            </HoverableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 24, 16, 0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: Colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  hint: {
    fontFamily: Fonts.bodyRegular,
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  options: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceElevated,
  },
  optionHover: {
    borderColor: Colors.accent,
  },
  optionActive: {
    borderColor: Colors.burgundy,
    backgroundColor: Colors.burgundy,
  },
  optionActiveHover: {
    backgroundColor: Colors.burgundyLight,
  },
  optionLabel: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionLabelActive: {
    color: Colors.textOnColor,
  },
  optionDesc: {
    fontFamily: Fonts.bodyRegular,
    color: Colors.textMuted,
    fontSize: 12,
  },
  optionDescActive: {
    color: Colors.textOnColor,
    opacity: 0.8,
  },
});
