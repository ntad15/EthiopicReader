import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { LiturgicalSection } from '@/data/types';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  sections: LiturgicalSection[];
  visible: boolean;
  onClose: () => void;
  onSelect: (index: number) => void;
}

const DRAWER_WIDTH = 260;

export default function SectionDrawer({ sections, visible, onClose, onSelect }: Props) {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const { primaryLanguage } = useLanguage();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : DRAWER_WIDTH,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible]);

  function getSnippet(section: LiturgicalSection): string {
    const firstPrayer = section.blocks.find(
      (b) => b.type === 'prayer' || b.type === 'response'
    );
    if (!firstPrayer) return '';
    const text =
      firstPrayer[primaryLanguage] ??
      firstPrayer.english ??
      firstPrayer.geez ??
      '';
    return text.length > 80 ? text.slice(0, 80) + '…' : text;
  }

  return (
    <>
      {visible && <Pressable style={styles.backdrop} onPress={onClose} />}
      <Animated.View
        style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>SECTIONS</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {sections.map((sec, index) => (
            <TouchableOpacity
              key={sec.id}
              style={styles.item}
              onPress={() => {
                onSelect(index);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.itemTitle} numberOfLines={1}>
                {sec.title.english}
              </Text>
              <Text style={styles.snippet} numberOfLines={2}>
                {getSnippet(sec)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.surface,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    zIndex: 11,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerTitle: {
    color: Colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  closeBtn: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  itemTitle: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  snippet: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
