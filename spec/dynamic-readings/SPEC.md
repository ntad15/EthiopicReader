# Dynamic Lectionary Readings — Feature Specification

**Version:** 1.1  
**Status:** Implemented — Phase 1 Complete  
**Scope:** Serate Qidase (`serate-qidase.json`) + Presentation Mode

---

## 1. Overview

### 1.1 Problem

`serate-qidase.json` contains hardcoded reading references inside five heading/rubric blocks:

| Reading | Block ID | Hardcoded text (example) |
|---|---|---|
| 1st — Pauline | `serate-readings-092` | `1st Reading: Ephesians Ch. 6 : 1 - 9` |
| 2nd — Catholic Epistle | `serate-readings-097` | `2nd Reading: Revelation Ch. 12 : 1 - 12` |
| 3rd — Acts | `serate-readings-102` | `3rd Reading: Acts of the Apostles Ch. 7 : 23 - 29` |
| Psalm (Misbak) | `serate-readings-177` (rubric) | `Psalm 102(103) : 14b-15` |
| Gospel announcement | `serate-readings-181` | `The Holy Gospel which Matthew proclaimed...` |
| Gospel heading | `serate-daily-gospel-185` | `Reading from The Gospel St. Luke Ch. 12 : 16 - 31` |

The Geez/Amharic heading blocks that show the chapter/verse are also hardcoded in the `amharic` field (e.g. `ቅዱስ ሉቃስ 12 ፡ 16 – 31`).

### 1.2 Goal

- Resolve the day's readings from `lectionary_clean.json` using today's date (Ethiopian calendar preferred, Gregorian fallback).
- Replace the five hardcoded references above with dynamically resolved text.
- Present readings via a new **collapsible ReadingCard component** — showing book + verse reference now, expandable later for full Amharic/English reading text.
- In **Presentation Mode**, give the user an upfront choice:
  - Use today's lectionary readings (default, pre-selected)
  - Pick a different date to load an alternative day's lectionary
  - Override individual reading slots with custom text
- Design for future extensibility: movable feast overrides, priest-selected alternatives, and full reading text in Amharic/English.

---

## 2. Codebase Context

### 2.1 Key Files

```
lectionary_clean.json          — 366 Gregorian-keyed entries, each with Ethiopian date + qidase readings
data/serate-qidase.json        — Liturgical text with hardcoded reading blocks (see table above)
data/qidan.json                — Kidan text (not affected by this feature)
data/types.ts                  — Core TypeScript types
components/ReaderLayout.tsx    — Main reader UI (all sections rendered here)
components/PresentationView.tsx — Slide-by-slide presentation mode
app/reader/[section].tsx       — Loads JSON and passes to ReaderLayout
```

### 2.2 Lectionary JSON Shape (per entry)

```jsonc
{
  "gregorian_month_num": 3,
  "gregorian_day": 18,
  "ethiopian_month": 7,
  "ethiopian_month_name": "Megabit",
  "ethiopian_day": 9,
  "qidase": {
    "pauline": "Romans8:3-18",
    "catholic": "1Peter2:12-21",
    "acts": "Acts20:28-31",
    "psalm": "Psalm78:10-11",
    "gospel": "Matthew2:1-13",
    "anaphora": "St. Mary"
  }
}
```

References use compact notation: `Book ChapterNum:VerseStart-VerseEnd` or `Book ChapterNum:VerseStart-f` (meaning "to the end").

---

## 3. Data Model

### 3.1 New Types  (`data/lectionary-types.ts`)

```typescript
/**
 * A single resolved reading reference (book + verse range).
 * In Phase 1, only `reference` is populated.
 * In Phase 2+, `contentAmharic` and `contentEnglish` will be added.
 */
export interface ReadingReference {
  /** Raw compact string from lectionary JSON, e.g. "Romans8:3-18" */
  raw: string;
  /** Human-readable formatted string, e.g. "Romans 8:3–18" */
  formatted: string;
  /** Full Amharic reading text — Phase 3 */
  contentAmharic?: string;
  /** Full English reading text — Phase 3 */
  contentEnglish?: string;
  /** Ge'ez text — Phase 3, Psalm/Misbak slot only */
  contentGeez?: string;
  /** Transliteration — Phase 3, Psalm/Misbak slot only */
  contentTransliteration?: string;
}

/**
 * The full set of resolved readings for a single Qidase.
 */
export interface DailyReadings {
  pauline: ReadingReference;
  catholic: ReadingReference;
  acts: ReadingReference;
  psalm: ReadingReference;
  gospel: ReadingReference;
  /** Suggested anaphora name, e.g. "St. Mary" */
  anaphora: string;
}

/**
 * The source of truth for what readings are currently active.
 * Wraps DailyReadings with override + source tracking.
 */
export interface ActiveReadings {
  /** The base readings resolved from the lectionary for `sourceDate` */
  base: DailyReadings;
  /**
   * Per-slot overrides set by the user (priest-selected or manually entered).
   * When a key is present, it takes precedence over `base` for that slot.
   * Phase 2+: will also hold priest-selected alternatives.
   */
  overrides: Partial<Record<ReadingSlotKey, ReadingReference>>;
  /** Gregorian date used to look up `base` (may differ from today) */
  sourceDate: { month: number; day: number; year: number };
  /** Ethiopian date corresponding to `sourceDate`, sourced directly from the lectionary entry */
  ethiopianDate: { month: number; day: number; year: number; monthName: string };
  /** Whether `sourceDate` represents the device's actual current date */
  isToday: boolean;
}

/**
 * A slot key for one of the five dynamic readings.
 */
export type ReadingSlotKey = 'pauline' | 'catholic' | 'acts' | 'psalm' | 'gospel';
```

---

## 4. Ethiopian Calendar Utility  (`utils/ethiopianCalendar.ts`)

### 4.1 Background

The Ethiopian calendar has:
- 12 months of 30 days each (months 1–12)
- 1 intercalary month (Pagume/Pagumen): 5 days in common years, 6 days in Ethiopian leap years
- Ethiopian leap year: year divisible by 4 (same rule as Julian calendar)
- Ethiopian New Year falls on Meskerem 1 (Sep 11 Gregorian in common years, Sep 12 in years preceding Ethiopian leap year)
- Ethiopian year = Gregorian year − 8 (before New Year) or − 7 (on/after New Year)

### 4.2 Exported Functions

```typescript
/** Structured Ethiopian date type returned by calendar functions */
export interface EthiopianDate {
  year: number;
  month: number;    // 1–13
  day: number;      // 1–30 (1–5/6 for Pagume)
  monthName: { english: string; amharic: string; geez: string };
}

/** Converts a JavaScript Date (Gregorian) to an Ethiopian calendar date */
export function toEthiopianDate(date: Date): EthiopianDate

/** Converts an Ethiopian year/month/day back to a JavaScript Date (Gregorian UTC midnight) */
export function fromEthiopianDate(year: number, month: number, day: number): Date

/** Returns whether a given Ethiopian year is a leap year (EY % 4 === 0) */
export function isEthiopianLeapYear(year: number): boolean

/** Returns the number of Pagume days for an Ethiopian year (5 or 6) */
export function pagumeDays(year: number): 5 | 6

/** Returns the number of valid days in an Ethiopian month (30 for months 1–12, 5/6 for Pagume) */
export function ethiopianMonthLength(year: number, month: number): number

/** Returns today as an EthiopianDate */
export function todayEthiopian(): EthiopianDate

/** Formats an EthiopianDate as a short string, e.g. "Megabit 9, 2018" */
export function formatEthiopianDate(date: EthiopianDate, lang?: 'english' | 'amharic' | 'geez'): string
```

Month name strings are sourced from `ETHIOPIAN_MONTH_NAMES` in `constants/readingLabels.ts` (indexed 0–12, month 1 = index 0).

> **Why this matters:** The Ethiopian liturgical calendar determines feast days. The lectionary JSON already stores `ethiopian_month` and `ethiopian_day` per entry, but lookup is done by Gregorian date (month_num + day) since these are in a 1:1 correspondence. The Ethiopian date is used for display and for future movable feast override resolution.

---

## 5. Lectionary Service  (`services/lectionaryService.ts`)

### 5.1 Responsibilities

- Load and cache `lectionary_clean.json` (imported statically; no network).
- Resolve readings for a given Gregorian date (month, day).
- Parse compact reading strings into `ReadingReference` objects.
- Expose a hook point for movable feast **overrides** (Phase 2 — returns null for now, falling through to default).
- Expose a hook point for multiple **alternative readings** per slot (Phase 2 — returns a single-item array for now).

### 5.2 Reference String Parser  (`utils/readingParser.ts`)

The parser lives in its own file, not inside `lectionaryService.ts`. It exposes two functions:

```typescript
/** Parse a compact reading string into a ReadingReference */
export function parseReadingReference(raw: string): ReadingReference

/** Extract the gospel book name from a raw reference string, e.g. "Luke2:1-21" → "Luke" */
export function extractBookName(raw: string): string | null
```

The raw strings use notation like:
- `Romans8:3-18` → `Romans 8:3–18`  
- `1Corinthians7:34-f` → `1 Corinthians 7:34ff`  
- `Psalm44:16-17` → `Psalm 44:16–17`  
- `Acts12:7-12` → `Acts 12:7–12`  

Rules:
- Insert a space between the book name and chapter number.
- Book names that start with a digit (`1Timothy`, `2Peter`, etc.) keep their numeral with a space: `1 Timothy`.
- Replace `-f` suffix with the `VERSE_END_SUFFIX` constant (`'ff'`).

### 5.3 Reading Labels  (`constants/readingLabels.ts`)

All display strings for reading labels are centralised here so they can be updated or translated without touching logic:

```typescript
export interface ReadingLabelConfig {
  /** Short ordinal badge text, e.g. "1ST" */
  ordinal: { english: string; amharic: string; geez: string };
  /** Reading type name shown below the ordinal, e.g. "Paul's Letter" */
  title: { english: string; amharic: string; geez: string };
  /** Prefix used in heading blocks, e.g. "1st Reading" */
  headingPrefix: { english: string; amharic: string; geez: string };
}

export const READING_LABELS: Record<ReadingSlotKey, ReadingLabelConfig> = {
  pauline: {
    ordinal: { english: '1ST', amharic: '1ኛ', geez: '1ኛ' },
    title: { english: "Paul's Letter", amharic: 'የጳውሎስ መልዕክት', geez: 'መልዕክተ ጳውሎስ' },
    headingPrefix: { english: '1st Reading', amharic: '1ኛ ምንባብ', geez: '1ኛ ምንባብ' },
  },
  // ... catholic, acts, psalm, gospel follow same shape
};

/** Appended when a raw reference ends with "-f" ("to chapter end") */
export const VERSE_END_SUFFIX = 'ff'; // plain string, e.g. "Romans 7:34ff"

/** Month names array indexed 0–12 (month 1 = index 0, Pagume = index 12) */
export const ETHIOPIAN_MONTH_NAMES: ReadingLabelText[]; // 13 entries
```

> **Why centralise?** Future multilingual display of "1st Reading", Amharic announcements, and full reading content all converge here. Adding a new language or adjusting wording is a single-file change.

### 5.4 Key Functions

```typescript
/** 
 * Resolve today's readings.
 * Uses Ethiopian calendar date → Gregorian date lookup.
 * Returns null if no matching entry is found.
 */
export function resolveReadingsForToday(): ActiveReadings | null

/**
 * Resolve readings for any Gregorian date.
 */
export function resolveReadingsForDate(
  gregorianMonth: number,
  gregorianDay: number,
  year?: number
): ActiveReadings | null

/**
 * Parse a raw compact reading string into a ReadingReference.
 */
export function parseReadingReference(raw: string): ReadingReference

/**
 *  PHASE 2 HOOK — return override readings for movable feasts / special days.
 * For Phase 1, always returns null (no overrides).
 */
export function resolveMovableFeastOverride(
  ethiopianMonth: number,
  ethiopianDay: number,
  ethiopianYear: number
): Partial<DailyReadings> | null

/**
 * PHASE 2 HOOK — return alternative reading options for a slot.
 * For Phase 1, always returns a single-item array (the default reading).
 */
export function getReadingAlternatives(
  readings: DailyReadings,
  slot: ReadingSlotKey
): ReadingReference[]
```

---

## 6. Readings Context  (`context/ReadingsContext.tsx`)

A React context that holds the **currently active readings** for the Qidase session, and exposes controls for the presentation-mode picker.

### 6.1 Context Value

```typescript
interface ReadingsContextValue {
  /** Resolved active readings (null until loaded) */
  activeReadings: ActiveReadings | null;
  /** Whether readings have been loaded */
  isLoaded: boolean;
  /** Load/reload for a specific date */
  loadForDate(gregorianMonth: number, gregorianDay: number, year: number): void;
  /** Override a specific reading slot */
  setOverride(slot: ReadingSlotKey, ref: ReadingReference): void;
  /** Clear a specific override (revert to base lectionary) */
  clearOverride(slot: ReadingSlotKey): void;
  /** Clear all overrides */
  clearAllOverrides(): void;
  /** Get the effective reading for a slot (override takes precedence over base) */
  getEffectiveReading(slot: ReadingSlotKey): ReadingReference | null;
}
```

### 6.2 Provider placement

The `ReadingsProvider` wraps only the Serate Qidase reader route (not the whole app), since readings are contextual to that liturgical text. It initialises by calling `resolveReadingsForToday()` on mount.

---

## 7. `ReadingCard` Component  (`components/ReadingCard.tsx`)

A new self-contained component that replaces the hardcoded heading/rubric blocks for each reading slot.

### 7.1 Phase 1 Behaviour

- Displays the reading slot label (e.g. **1st Reading — Paul's Letter**) and the formatted verse reference (e.g. **Romans 8:3–18**) in the active display language(s).
- Has a chevron/expand affordance — **visually present but non-functional in Phase 1** (renders as disabled/greyed). This signals future expandability without implementing it yet.
- Uses the same typography/color system as `PrayerBlock`.
- In the reader scroll view, it appears in-line where the previous heading/rubric was, preserving scroll position tracking (it registers its offset via the same `onLayout` callback pattern as PrayerBlock).

### 7.2 Phase 2+ Expandable Behaviour (design intent)

When `ReadingReference.contentAmharic` or `contentEnglish` is populated:
- Tapping the card expands it to show the full reading text inline.
- Supports the same multi-language column layout as `PrayerBlock`.
- Psalm/Misbak: includes Ge'ez + transliteration in addition to Amharic/English.
- Collapse animation via `react-native-reanimated` (already in the project).

### 7.3 Props

```typescript
interface ReadingCardProps {
  slot: ReadingSlotKey;
  reading: ReadingReference | null; // null = loading/unavailable state
  /** If true, show the expand chevron as disabled (Phase 1). Default: true */
  expandDisabled?: boolean;
  /** Called when user taps expand (Phase 2) */
  onExpand?: () => void;
}
```

---

## 8. Changes to `serate-qidase.json`

No content is removed. The following blocks are **marked** with a `dynamic` field so the rendering layer knows to inject a `ReadingCard` instead of a `PrayerBlock`:

```jsonc
// Heading block example — serate-readings-092:
{
  "id": "serate-readings-092",
  "type": "heading",            // ← type unchanged
  "geez": "1ኛ ምንባብ",
  "amharic": "ወደ ኤፌሶን ሰዎች",
  "english": "1st Reading: Ephesians Ch. 6 : 1 - 9",
  "transliteration": "",
  "dynamic": "pauline"         // ← NEW field
}
```

The `dynamic` field values map to `ReadingSlotKey`:

| Block ID | Block type | `dynamic` value |
|---|---|---|
| `serate-readings-092` | `heading` | `"pauline"` |
| `serate-readings-097` | `heading` | `"catholic"` |
| `serate-readings-102` | `heading` | `"acts"` |
| `serate-readings-177` | **`rubric`** | `"psalm"` |
| `serate-daily-gospel-185` | `heading` | `"gospel"` |

> Note: `serate-readings-177` (the Psalm/Misbak block) has `type: "rubric"`, not `"heading"`. The renderer handles `dynamic` on both heading and rubric types identically — it replaces the block with a `ReadingCard` regardless of the original type.

Block `serate-readings-181` ("The Holy Gospel which Matthew proclaimed...") is handled differently — see § 9.3.

### 8.1 Updated `PrayerBlock` type

```typescript
export interface PrayerBlock {
  id: string;
  type: 'heading' | 'rubric' | 'prayer' | 'response';
  speaker?: 'priest' | 'deacon' | 'congregation' | 'all';
  geez?: string;
  amharic?: string;
  english?: string;
  transliteration?: string;
  /**
   * When set, this block is a dynamic reading marker.
   * The renderer replaces it with a ReadingCard for the named slot.
   * Works on both heading and rubric block types.
   */
  dynamic?: ReadingSlotKey;
  /**
   * When true, the {{evangelist}} token in all text fields is substituted
   * at render time with the evangelist name derived from the active gospel reading.
   */
  evangelistSlot?: boolean;
}
```

---

## 9. Rendering Layer Changes

### 9.1 `PrayerBlock.tsx` — ReadingCard injection

When `block.dynamic` is set, render `<ReadingCard slot={block.dynamic} reading={getEffectiveReading(block.dynamic)} />` instead of the default heading/rubric layout. The `PrayerBlock` component imports `useReadings()` only when `block.dynamic` is defined (to avoid a heavy context lookup on every block).

### 9.2 `ReaderLayout.tsx` — ReadingsProvider injection

When the section being rendered is `serate-qidase`, wrap the layout in `<ReadingsProvider>`. This can be done in `app/reader/[section].tsx` by passing an optional prop or wrapping the route component conditionally.

### 9.3 Dynamic evangelist announcement (block `serate-readings-181`)

This block uses `geez`, `amharic`, and `english` fields that name the evangelist (e.g. "Matthew"). Rather than marking it `dynamic`, a separate `evangelistSlot` field is added:

```jsonc
{
  "id": "serate-readings-181",
  "type": "prayer",
  "speaker": "priest",
  "evangelistSlot": true,    // ← NEW field
  "geez": "...",
  ...
}
```

When `evangelistSlot` is true, `PrayerBlock` substitutes the token `{{evangelist}}` in all four text fields (`geez`, `amharic`, `english`, `transliteration`). The token is embedded literally in `serate-qidase.json` — the hardcoded name "ማቴዎስ" / "Matthew" / "Matewos" has been replaced with `{{evangelist}}`.

The substitution uses `extractBookName()` to derive the book from the gospel reading reference (e.g. `"Luke2:1-21"` → `"Luke"`), then looks up the per-language name in `GOSPEL_BOOK_TO_EVANGELIST`.

The evangelist name mapping is in `constants/readingLabels.ts`:

```typescript
export const GOSPEL_BOOK_TO_EVANGELIST: Record<string, { english: string; amharic: string; geez: string }> = {
  Matthew: { english: 'Matthew', amharic: 'ማቴዎስ', geez: 'ማቴዎስ' },
  Mark:    { english: 'Mark',    amharic: 'ማርቆስ', geez: 'ማርቆስ' },
  Luke:    { english: 'Luke',    amharic: 'ሉቃስ',   geez: 'ሉቃስ' },
  John:    { english: 'John',    amharic: 'ዮሐንስ',  geez: 'ዮሐንስ' },
};
```

---

## 10. Presentation Mode — Reading Picker

### 10.1 Flow

When the user taps **Present** on the Serate Qidase reader, before entering the slide-by-slide view, a **ReadingPickerSheet** modal is shown.

```
┌─────────────────────────────────────────────────┐
│  Today's Readings                                │
│  Megabit 9, 2018 (March 18, 2026)               │
│                                ┌──────────────┐  │
│                                │ Change Date  │  │
│                                └──────────────┘  │
│─────────────────────────────────────────────────│
│  1st Reading   Romans 8:3–18           ✎  [✓] │
│  2nd Reading   1 Peter 2:12–21         ✎  [✓] │
│  3rd Reading   Acts 20:28–31           ✎  [✓] │
│  Psalm         Psalm 78:10-11          ✎  [✓] │
│  Gospel        Matthew 2:1–13          ✎  [✓] │
│─────────────────────────────────────────────────│
│              [ Use These Readings → ]            │
└─────────────────────────────────────────────────┘
```

### 10.2 "Change Date" (Custom Stepper)

- The date picker is implemented as a custom **+/− stepper** within the sheet (no external date picker library — `@react-native-community/datetimepicker` is not in the project). Three `DateStepper` sub-components control Year, Month, and Day independently.
- Month and Day steppers wrap around correctly (e.g. Dec → Jan advances year; Pagume constrains to 5 or 6 days based on leap year).
- Changing any field immediately calls `loadForDate()` and refreshes all 5 reading slots.
- If no lectionary entry exists for the selected date, a message is shown and the previous date's data is kept.

### 10.3 Individual Slot Override (✎ edit icon)

- Tapping the edit icon on any slot opens an **inline text input** replacing the reference for that slot.
- Free-form text input (book + verse range, any format the user prefers).
- The `ReadingsContext.setOverride()` is called with a `ReadingReference` where `raw === formatted === userInput`.
- Overridden slots are visually marked (e.g. a small indicator dot) to distinguish from lectionary-sourced readings.
- Overrides persist for the duration of the session only (not persisted to AsyncStorage in Phase 1).

### 10.4 Reading Picker — Architecture

`ReadingPickerSheet` is owned by **`ReaderLayout`**, not by `PresentationView`. This keeps the sheet accessible both before and during a session without needing to pass it down through presentation mode:

- **Before presenting:** The FAB (easel icon) in `ReaderLayout` sets `pickerVisible = true` when `showReadingPicker` prop is true. Tapping **Use These Readings →** closes the sheet and enters presentation mode.
- **Mid-session:** `PresentationView` receives an `onShowReadingPicker?: () => void` callback prop. Tapping the ⊞ button in the top bar calls this callback, which exits presentation mode and re-displays the sheet in `ReaderLayout`. After confirming, presentation mode resumes.

`ReadingPickerSheet` is only rendered (and `ReadingsProvider` only wraps) when `section === 'serate-qidase'`, controlled by a `showReadingPicker` prop passed from `app/reader/[section].tsx`.

---

## 11. File Structure

New files to create:

```
constants/
  readingLabels.ts          — Centralised display labels, evangelist map, ref suffixes

utils/
  ethiopianCalendar.ts      — ET ↔ Gregorian conversion utilities
  readingParser.ts          — Parse compact reading strings into ReadingReference

services/
  lectionaryService.ts      — Date-based lectionary lookup, override hooks

context/
  ReadingsContext.tsx        — Active readings state + controls

components/
  ReadingCard.tsx            — Collapsible reading reference card (Phase 1: collapsed-only)
  ReadingPickerSheet.tsx     — Presentation mode reading picker modal
```

Modified files:

```
data/types.ts                — Add `dynamic`, `evangelistSlot` to PrayerBlock
data/lectionary-types.ts     — New file: ReadingReference, DailyReadings, ActiveReadings types
data/serate-qidase.json      — Add `dynamic` field to 5 reading marker blocks; add `evangelistSlot` to block serate-readings-181
components/PrayerBlock.tsx   — Handle `dynamic` and `evangelistSlot` fields
components/PresentationView.tsx — Add "Change Readings" button; show ReadingPickerSheet before starting
components/ReaderLayout.tsx  — Wrap with ReadingsProvider when section = serate-qidase
app/reader/[section].tsx     — Minor: conditionally wrap with ReadingsProvider or pass prop
```

---

## 12. Phase Roadmap

---

### Phase 1 — Dynamic References + Presentation Picker *(this spec)*

**Goal:** Replace all hardcoded reading references with live lectionary lookups and give the user control over readings in presentation mode.

#### Deliverables

| # | Deliverable | Files |
|---|---|---|
| 1.1 | **Ethiopian calendar utility** — convert today's Gregorian date to Ethiopian date for display; convert any Ethiopian date back to Gregorian for the date picker | `utils/ethiopianCalendar.ts` |
| 1.2 | **Reading reference parser** — parse compact strings like `Romans8:3-18` or `1Corinthians7:34-f` into human-readable formatted references | `utils/readingParser.ts` |
| 1.3 | **Centralised reading labels** — all display strings for reading names (English, Amharic, Ge'ez), evangelist name map, verse-end suffix format | `constants/readingLabels.ts` |
| 1.4 | **Lectionary types** — `ReadingReference`, `DailyReadings`, `ActiveReadings`, `ReadingSlotKey` | `data/lectionary-types.ts` |
| 1.5 | **Lectionary service** — look up readings by today's date or any Gregorian date; expose stub hooks for Phase 2 movable feast overrides and alternative readings | `services/lectionaryService.ts` |
| 1.6 | **Readings context** — session-scoped React context holding active readings, per-slot overrides, and controls | `context/ReadingsContext.tsx` |
| 1.7 | **`ReadingCard` component** — inline card showing slot label + formatted verse reference; expand chevron present but disabled (Phase 1) | `components/ReadingCard.tsx` |
| 1.8 | **`ReadingPickerSheet` component** — modal shown before presentation starts (and accessible mid-session), with date picker and per-slot override inputs | `components/ReadingPickerSheet.tsx` |
| 1.9 | **`serate-qidase.json` annotations** — add `dynamic` field to 5 reading marker blocks; add `evangelistSlot: true` to block `serate-readings-181` | `data/serate-qidase.json` |
| 1.10 | **`PrayerBlock.tsx` updates** — render `ReadingCard` when `block.dynamic` is set; substitute correct evangelist name when `block.evangelistSlot` is true | `components/PrayerBlock.tsx` |
| 1.11 | **`ReaderLayout.tsx` / `[section].tsx` updates** — wrap in `ReadingsProvider` when rendering `serate-qidase` | `components/ReaderLayout.tsx`, `app/reader/[section].tsx` |
| 1.12 | **`PresentationView.tsx` updates** — show `ReadingPickerSheet` before first slide; add "Change Readings" button in the top bar | `components/PresentationView.tsx` |
| 1.13 | **`data/types.ts` update** — add `dynamic?: ReadingSlotKey` and `evangelistSlot?: boolean` to `PrayerBlock` interface | `data/types.ts` |

#### What Phase 1 explicitly does NOT include

- Full reading text (Amharic / English / Ge'ez) inside `ReadingCard` — the card is non-expandable.
- Movable feast overrides (Timkat, Fasika, fasting seasons, etc.) — `resolveMovableFeastOverride()` returns `null`.
- Multiple alternative readings per slot — `getReadingAlternatives()` returns a single-item array.
- Persistence of overrides across app restarts — overrides live in React state only.
- Suggested anaphora surfaced in the Fere Qidase section.

#### Acceptance Criteria

- Opening Serate Qidase on any day shows the correct lectionary reading references for that day in all 5 reading slots.
- The correct evangelist name appears in the priest's gospel announcement block.
- Tapping **Present** on Serate Qidase shows the `ReadingPickerSheet` before entering slides.
- The date picker in the sheet displays both Gregorian and Ethiopian date; selecting a different date updates all 5 reading references.
- Each slot has an inline edit field; free-text overrides are visually distinguished from lectionary defaults.
- All reading references render correctly in all active display languages.

---

### Phase 2 — Movable Feasts, Alternatives & Expandable Cards

**Goal:** Handle the liturgical calendar's variable dates and give priests the ability to choose between multiple provided readings.

#### Deliverables

| # | Deliverable | Notes |
|---|---|---|
| 2.1 | **Movable feast override data file** — a new JSON/TypeScript file keyed by Ethiopian month + day (or relative offset from Fasika/Timkat anchor) containing override readings for all affected feast days | New file `data/movable-feast-overrides.json` |
| 2.2 | **Implement `resolveMovableFeastOverride()`** — wire it into `lectionaryService.ts` so feast-day lookups return the correct readings instead of the default calendar entry | `services/lectionaryService.ts` |
| 2.3 | **Multiple alternatives per slot** — populate `getReadingAlternatives()` to return all alternatives for a given slot; `ReadingPickerSheet` shows a segmented/tab selector per slot when alternatives exist | `services/lectionaryService.ts`, `components/ReadingPickerSheet.tsx` |
| 2.4 | **Persist override selections** — use `AsyncStorage` to save the priest's slot selections per calendar date so they survive an app restart on the same day | `context/ReadingsContext.tsx` |
| 2.5 | **`ReadingCard` expand — Phase 2 stub** — expand chevron becomes active when `ReadingReference.contentAmharic` or `contentEnglish` is present; add the expand/collapse animation shell using `react-native-reanimated` | `components/ReadingCard.tsx` |

---

### Phase 3 — Full Reading Text

**Goal:** Show the complete scripture passage inline within the Serate Qidase reader for all 5 reading slots.

#### Deliverables

| # | Deliverable | Notes |
|---|---|---|
| 3.1 | **Full reading text data** — Amharic + English text for all readings in `lectionary_clean.json` (or a companion data file) | New field on `ReadingReference`: `contentAmharic`, `contentEnglish` |
| 3.2 | **Psalm/Misbak: Ge'ez + transliteration** — Ge'ez text and transliteration added for psalm readings only (no Ge'ez for other readings per original requirements) | Extended `ReadingReference` for psalm type |
| 3.3 | **Expandable `ReadingCard`** — tapping the card expands inline to show the full reading text in the active display language(s), using the same multi-column layout as `PrayerBlock` | `components/ReadingCard.tsx` |
| 3.4 | **Presentation mode reading slides** — when a `ReadingCard` is in expanded state, its content is surfaced as one or more slides in `PresentationView` (the priest can present the reading text) | `components/PresentationView.tsx` |

---

### Future Phases (indicative)

- **Phase 4:** Remote lectionary updates via EAS or a sync endpoint (without requiring an app store update).
- **Phase 5:** Morning and evening prayer (`qidan`-cycle) readings from the lectionary, following the same pattern established here.

---

## 13. Ethiopian Calendar — Implementation Notes

### 13.1 The Lectionary JSON vs Ethiopian Date Lookup

`lectionary_clean.json` currently stores one entry per **Gregorian** date (366 entries for a full year including Feb 29). Each entry has `ethiopian_month` and `ethiopian_day` fields but is not indexed by them.

For Phase 1, the lookup strategy is:

1. Get the device's current date as a Gregorian `(month, day)`.
2. Find the matching entry in `lectionary_clean.json` where `gregorian_month_num === month && gregorian_day === day`.
3. Display the `ethiopian_month_name` + `ethiopian_day` from the matched entry as the "liturgical date" to the user.
4. The `toEthiopianDate()` utility is used only for display of arbitrary dates in the date picker, and for `resolveMovableFeastOverride()` in Phase 2.

### 13.2 Leap Year Handling

The lectionary JSON contains 366 entries (including Feb 29). On non-leap years, the Feb 29 entry will simply never be matched by a Gregorian lookup — this is acceptable behaviour.

### 13.3 Year Boundary

The Ethiopian New Year (Meskerem 1) falls on September 11/12 Gregorian. The lectionary JSON covers a full Gregorian calendar year, so Ethiopian year-boundaries are handled transparently by the date-based lookup without needing special handling in Phase 1.

---

## 14. Open Questions / Deferred Decisions

1. **Movable feast dates** — The full list of movable feasts (Timkat, Fasika, Fasting periods, etc.) and their override readings will be supplied in a future data file. The `resolveMovableFeastOverride()` hook in `lectionaryService.ts` is the integration point.

2. **Alternative readings** — The lectionary sometimes provides 2–3 alternatives for a slot (priest's discretion). In Phase 2, `getReadingAlternatives()` will return multiple options and `ReadingPickerSheet` will show a segmented selector per slot.

3. **Persistence of overrides** — Phase 1 keeps overrides in memory only (lasts the session). Phase 2 may persist them per-day to `AsyncStorage` so the priest's selection survives an app restart on the same day.

4. **Anaphora** — The lectionary suggests an anaphora per day (`qidase.anaphora` field). Whether to surface this as a suggestion in the Fere Qidase (anaphoras) section is out of scope for Phase 1.

5. **Network lectionary updates** — All data is currently bundled. Phase 3+ may introduce a remotely-updated lectionary via EAS or a sync endpoint, compatible with the `lectionaryService` abstraction.
