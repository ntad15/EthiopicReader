import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FONT_SIZE_MIN = 0.6;
export const FONT_SIZE_MAX = 2.5;
export const FONT_SIZE_DEFAULT = 1;

interface FontSizeContextValue {
  multiplier: number;
  setMultiplier: (m: number) => void;
  scale: (size: number) => number;
}

const FontSizeContext = createContext<FontSizeContextValue>({
  multiplier: FONT_SIZE_DEFAULT,
  setMultiplier: () => {},
  scale: (s) => s,
});

const STORAGE_KEY = 'kidase_fontsize_multiplier';

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [multiplier, setMultiplierState] = useState(FONT_SIZE_DEFAULT);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val >= FONT_SIZE_MIN && val <= FONT_SIZE_MAX) {
          setMultiplierState(val);
        }
      }
    });
  }, []);

  function setMultiplier(m: number) {
    const clamped = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(m * 100) / 100));
    setMultiplierState(clamped);
    AsyncStorage.setItem(STORAGE_KEY, String(clamped));
  }

  function scale(size: number) {
    return Math.round(size * multiplier);
  }

  return (
    <FontSizeContext.Provider value={{ multiplier, setMultiplier, scale }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  return useContext(FontSizeContext);
}
