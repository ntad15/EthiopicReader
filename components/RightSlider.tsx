import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { Colors } from '@/constants/colors';

export interface SliderSection {
  id: string;
  title: string;
  geezTitle?: string;
}

interface RightSliderProps {
  sections: SliderSection[];
  onSelectSection: (index: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SLIDER_WIDTH = 280;

export default function RightSlider({
  sections,
  onSelectSection,
  isOpen,
  onClose,
}: RightSliderProps) {
  const translateX = useRef(new Animated.Value(SLIDER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isOpen ? 0 : SLIDER_WIDTH,
        duration: isOpen ? 280 : 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: isOpen ? 0.65 : 0,
        duration: isOpen ? 280 : 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, translateX, backdropOpacity]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sliding panel */}
      <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SECTIONS</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Section list */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          bounces={false}
        >
          {sections.map((sec, index) => (
            <TouchableOpacity
              key={sec.id}
              style={styles.item}
              activeOpacity={0.7}
              onPress={() => {
                onSelectSection(index);
                onClose();
              }}
            >
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{index + 1}</Text>
              </View>
              <View style={styles.itemText}>
                {sec.geezTitle ? (
                  <Text style={styles.geezTitle}>{sec.geezTitle}</Text>
                ) : null}
                <Text style={styles.englishTitle} numberOfLines={2}>
                  {sec.title}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: '#000000',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: SLIDER_WIDTH,
    backgroundColor: Colors.surface,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  closeBtn: {
    padding: 4,
  },
  closeIcon: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  list: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: 12,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  itemText: {
    flex: 1,
  },
  geezTitle: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  englishTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  chevron: {
    color: Colors.textDim,
    fontSize: 22,
    fontWeight: '300',
  },
});
