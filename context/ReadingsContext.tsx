import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReadingSlotKey, SelectedReading } from '@/data/readingSlots';

interface ReadingsContextValue {
  slots: Record<ReadingSlotKey, SelectedReading | null>;
  loaded: boolean;
  setSlot: (key: ReadingSlotKey, reading: SelectedReading | null) => void;
  clearAll: () => void;
}

const STORAGE_KEY = '@readings_slots_v1';

const EMPTY_SLOTS: Record<ReadingSlotKey, SelectedReading | null> = {
  pauline: null,
  catholic: null,
  acts: null,
  psalm: null,
  gospel: null,
};

const ReadingsContext = createContext<ReadingsContextValue>({
  slots: EMPTY_SLOTS,
  loaded: false,
  setSlot: () => {},
  clearAll: () => {},
});

export function ReadingsProvider({ children }: { children: React.ReactNode }) {
  const [slots, setSlots] = useState<Record<ReadingSlotKey, SelectedReading | null>>(EMPTY_SLOTS);
  const [loaded, setLoaded] = useState(false);

  // Load persisted slots on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) {
        try {
          const saved = JSON.parse(json) as Record<ReadingSlotKey, SelectedReading | null>;
          setSlots({ ...EMPTY_SLOTS, ...saved });
        } catch {
          // ignore corrupt data
        }
      }
      setLoaded(true);
    });
  }, []);

  function setSlot(key: ReadingSlotKey, reading: SelectedReading | null) {
    setSlots((prev) => {
      const next = { ...prev, [key]: reading };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function clearAll() {
    setSlots({ ...EMPTY_SLOTS });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(EMPTY_SLOTS));
  }

  return (
    <ReadingsContext.Provider value={{ slots, loaded, setSlot, clearAll }}>
      {children}
    </ReadingsContext.Provider>
  );
}

export function useReadings() {
  return useContext(ReadingsContext);
}
