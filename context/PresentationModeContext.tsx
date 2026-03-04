import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

interface PresentationModeContextValue {
  isPresentationMode: boolean;
  /** True during the portrait-rotation transition when exiting (used to show blank overlay). */
  isExiting: boolean;
  enterPresentation: () => void;
  exitPresentation: () => void;
}

const PresentationModeContext = createContext<PresentationModeContextValue>({
  isPresentationMode: false,
  isExiting: false,
  enterPresentation: () => {},
  exitPresentation: () => {},
});

export function PresentationModeProvider({ children }: { children: React.ReactNode }) {
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Lock orientation when entering/exiting presentation mode
  useEffect(() => {
    if (isPresentationMode) {
      if (Platform.OS === 'web') {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      }
    } else {
      if (Platform.OS === 'web' && document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }

    return () => {
      if (Platform.OS !== 'web') {
        ScreenOrientation.unlockAsync();
      }
    };
  }, [isPresentationMode]);

  function enterPresentation() {
    setIsPresentationMode(true);
  }

  function exitPresentation() {
    if (Platform.OS !== 'web') {
      setIsExiting(true);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
        .then(() => new Promise((r) => setTimeout(r, 250)))
        .then(() => {
          setIsPresentationMode(false);
          setIsExiting(false);
          ScreenOrientation.unlockAsync();
        })
        .catch(() => {
          setIsPresentationMode(false);
          setIsExiting(false);
          ScreenOrientation.unlockAsync();
        });
    } else {
      setIsPresentationMode(false);
    }
  }

  return (
    <PresentationModeContext.Provider value={{ isPresentationMode, isExiting, enterPresentation, exitPresentation }}>
      {children}
    </PresentationModeContext.Provider>
  );
}

export function usePresentationMode() {
  return useContext(PresentationModeContext);
}
