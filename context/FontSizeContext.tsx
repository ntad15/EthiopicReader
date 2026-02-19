import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontSizePreset = 'normal' | 'large' | 'tv';

export const FONT_SIZE_MULTIPLIERS: Record<FontSizePreset, number> = {
  normal: 1,
  large: 1.35,
  tv: 1.8,
};

interface FontSizeContextValue {
  preset: FontSizePreset;
  setPreset: (p: FontSizePreset) => void;
  scale: (size: number) => number;
}

const FontSizeContext = createContext<FontSizeContextValue>({
  preset: 'normal',
  setPreset: () => {},
  scale: (s) => s,
});

const STORAGE_KEY = 'kidase_fontsize';

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPresetState] = useState<FontSizePreset>('normal');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored && stored in FONT_SIZE_MULTIPLIERS) {
        setPresetState(stored as FontSizePreset);
      }
    });
  }, []);

  function setPreset(p: FontSizePreset) {
    setPresetState(p);
    AsyncStorage.setItem(STORAGE_KEY, p);
  }

  function scale(size: number) {
    return Math.round(size * FONT_SIZE_MULTIPLIERS[preset]);
  }

  return (
    <FontSizeContext.Provider value={{ preset, setPreset, scale }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  return useContext(FontSizeContext);
}
