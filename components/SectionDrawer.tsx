import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import HoverableOpacity from '@/components/HoverableOpacity';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { LiturgicalSection } from '@/data/types';
import { useLanguage } from '@/context/LanguageContext';
import { hapticMedium } from '@/utils/haptics';

interface Props {
  sections: LiturgicalSection[];
  visible: boolean;
  onClose: () => void;
  onSelect: (index: number) => void;
  onSettings?: () => void;
}

const DRAWER_WIDTH = 280;
const SPRING_CONFIG = { damping: 22, stiffness: 220, mass: 0.8 };

export default function SectionDrawer({ sections, visible, onClose, onSelect, onSettings }: Props) {
  const translateX = useSharedValue(DRAWER_WIDTH);
  const { primaryLanguage } = useLanguage();

  useEffect(() => {
    translateX.value = withSpring(visible ? 0 : DRAWER_WIDTH, SPRING_CONFIG);
    if (visible) hapticMedium();
  }, [visible]);

  /* ── Swipe-to-dismiss gesture ── */
  const pan = Gesture.Pan()
    .activeOffsetX(15)
    .onUpdate((e) => {
      // Only allow dragging to the right (closing direction)
      translateX.value = Math.max(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX > 80 || e.velocityX > 500) {
        translateX.value = withSpring(DRAWER_WIDTH, SPRING_CONFIG);
        runOnJS(hapticMedium)();
        runOnJS(onClose)();
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
      }
    });

  /* ── Animated styles ── */
  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, DRAWER_WIDTH],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    pointerEvents: translateX.value < DRAWER_WIDTH ? 'auto' : 'none',
  }));

  function getSnippet(section: LiturgicalSection): string {
    const firstPrayer = section.blocks.find(
      (b) => b.type === 'prayer' || b.type === 'response',
    );
    if (!firstPrayer) return '';
    const text =
      firstPrayer[primaryLanguage] ??
      firstPrayer.english ??
      firstPrayer.geez ??
      '';
    return text.length > 80 ? text.slice(0, 80) + '\u2026' : text;
  }

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[styles.drawer, drawerStyle]}
          pointerEvents={visible ? 'auto' : 'none'}
        >
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>SECTIONS</Text>
            <HoverableOpacity
              onPress={onClose}
              hitSlop={12}
              style={{ borderRadius: 6, padding: 4 }}
              hoverStyle={{ backgroundColor: Colors.accentDim }}
            >
              <Text style={styles.closeBtn}>{'\u2715'}</Text>
            </HoverableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            {sections.map((sec, index) => (
              <HoverableOpacity
                key={sec.id}
                style={styles.item}
                hoverStyle={styles.itemHover}
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
              </HoverableOpacity>
            ))}
          </ScrollView>
          {onSettings && (
            <View style={styles.drawerFooter}>
              <HoverableOpacity
                onPress={() => {
                  onClose();
                  onSettings();
                }}
                activeOpacity={0.8}
                style={styles.settingsBtn}
                hoverStyle={styles.settingsBtnHover}
              >
                <Text style={styles.settingsBtnText}>{'\u2699'} Settings</Text>
              </HoverableOpacity>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44, 24, 16, 0.3)',
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
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerTitle: {
    color: Colors.burgundy,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  closeBtn: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  item: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  itemHover: {
    backgroundColor: Colors.accentDim,
  },
  itemTitle: {
    fontFamily: Fonts.serifBold,
    color: Colors.burgundy,
    fontSize: 14,
    letterSpacing: 0.3,
    marginBottom: 5,
  },
  snippet: {
    fontFamily: Fonts.bodyRegular,
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  settingsBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  settingsBtnHover: {
    borderColor: Colors.accent,
  },
  settingsBtnText: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.textMuted,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
