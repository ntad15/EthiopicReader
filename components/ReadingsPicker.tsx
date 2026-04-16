import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useReadings } from '@/context/ReadingsContext';
import { SelectedReading, ReadingSlotKey, SLOT_CONFIGS } from '@/data/readingSlots';
import ReadingSlotInput from '@/components/ReadingSlotInput';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** 'dialog' = centered popup (auto-open on load); 'dropdown' = top-right panel (icon tap). Default: 'dropdown' */
  mode?: 'dialog' | 'dropdown';
}

const EDITABLE_KEYS: ReadingSlotKey[] = ['pauline', 'catholic', 'acts', 'psalm', 'gospel'];

export default function ReadingsPicker({ visible, onClose, mode = 'dropdown' }: Props) {
  const { slots, setSlot } = useReadings();

  // Draft state — only committed on Apply
  const [draft, setDraft] = useState<Record<ReadingSlotKey, SelectedReading | null>>({ ...slots });

  // Keep draft in sync when sheet opens
  useEffect(() => {
    if (visible) {
      setDraft({ ...slots });
    }
  }, [visible]);

  function handleChange(key: ReadingSlotKey, reading: SelectedReading | null) {
    setDraft((prev) => ({ ...prev, [key]: reading }));
  }

  function handleApply() {
    for (const key of EDITABLE_KEYS) {
      setSlot(key, draft[key] ?? null);
    }
    onClose();
  }

  function handleClearAll() {
    const empty: Record<ReadingSlotKey, SelectedReading | null> = {
      pauline: null, catholic: null, acts: null, psalm: null, gospel: null,
    };
    setDraft(empty);
  }

  const hasAnyDraft = EDITABLE_KEYS.some((k) => draft[k] !== null);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Tap-away backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Panel — centered dialog or top-right dropdown */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={mode === 'dialog' ? styles.dialogAnchor : styles.panelAnchor}
        pointerEvents="box-none"
      >
        <View style={[styles.panel, mode === 'dialog' && styles.panelDialog]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                {mode === 'dialog' ? "Select Today's Readings" : 'Readings'}
              </Text>
              {mode === 'dialog' && (
                <Text style={styles.headerSubtitle}>Set the readings before you begin</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleClearAll}
              hitSlop={8}
              style={[styles.headerBtn, !hasAnyDraft && styles.headerBtnDisabled]}
              disabled={!hasAnyDraft}
            >
              <Text style={[styles.headerBtnText, !hasAnyDraft && { color: Colors.textDim }]}>↺</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Slot rows */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {SLOT_CONFIGS.map((config) => (
              <ReadingSlotInput
                key={config.key}
                slotKey={config.key}
                config={config}
                value={draft[config.key] ?? null}
                onChange={handleChange}
              />
            ))}
            <View style={{ height: 8 }} />
          </ScrollView>

          {/* Apply button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Text style={styles.applyText}>
                {mode === 'dialog' ? 'Confirm Readings' : 'Apply Readings'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  /* Centered dialog anchor */
  dialogAnchor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* Top-right dropdown anchor */
  panelAnchor: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 70,
    right: 12,
    width: 340,
    maxHeight: '80%',
    pointerEvents: 'box-none',
  },
  panel: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderTopRightRadius: 6,
    maxHeight: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 18,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  /* Extra overrides for centered dialog mode */
  panelDialog: {
    width: 340,
    alignSelf: 'center',
    borderRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 6,
  },
  headerBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  headerBtnDisabled: {
    opacity: 0.35,
  },
  headerBtnText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.bodyRegular,
  },
  headerTitle: {
    fontFamily: Fonts.bodyMedium,
    fontWeight: '700',
    fontSize: 14,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontFamily: Fonts.bodyRegular,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderSubtle,
  },
  applyBtn: {
    backgroundColor: Colors.burgundy,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyText: {
    color: Colors.textOnColor,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
