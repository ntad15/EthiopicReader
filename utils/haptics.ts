import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

/** Soft tap — toggles, pills, minor interactions. */
export function hapticLight() {
  if (isNative) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  }
}

/** Light tap — button presses, drawer open/close. */
export function hapticMedium() {
  if (isNative) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/** Selection tick — presentation nav, confirmations. */
export function hapticSelection() {
  if (isNative) {
    Haptics.selectionAsync();
  }
}
