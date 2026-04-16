# Readings Picker — Feature Specification

**Version:** 1.0  
**Status:** Draft — Milestone 1  
**Scope:** Serate Qidase reader screen; session-scoped state; 6 lectionary slots

---

## 1. Overview

### 1.1 Problem

The five heading blocks and one rubric block in `serate-qidase.json` that display
scripture references (Pauline, Catholic, Acts, Psalm, Gospel) are currently
**hardcoded**. An Anaphora is already selectable via the existing anaphora picker,
but there is no mechanism for a priest or chantor to select which scripture
readings to use for a given service.

### 1.2 Goal — Milestone 1

Build a **bare-bones readings picker** accessible from the reader screen for
`serate-qidase`. The picker lets the user choose 6 readings (one per slot) from
a **curated list of liturgically eligible books per slot** (e.g. only Pauline
epistles appear under the Pauline slot, only the four Gospels under the Gospel
slot). The selections update the dynamic heading blocks in the liturgy in real
time. State is held in a React context and is session-scoped (survives hot
reloads; does not persist across full app restarts).

### 1.3 Non-Goals (Milestone 1)

- Lectionary auto-population from today's date / `lectionary_clean.json`
- AsyncStorage persistence across app restarts
- Picker inside Presentation Mode (architecture supports adding later — see §7)
- Full reading text display (Amharic / English / Ge'ez body text)
- Movable feast overrides
- Multiple alternative readings per slot

---

## 2. Reading Slots

Six slots are defined. Each is independently selectable.

| # | Key | Label (English) | Label (Amharic) | Heading block ID |
|---|-----|-----------------|-----------------|-------------------|
| 1 | `pauline` | Pauline Epistle | የጳውሎስ መልእክት | `serate-readings-092` |
| 2 | `catholic` | Catholic Epistle | ካቶሊካዊት መልእክት | `serate-readings-097` |
| 3 | `acts` | Acts of the Apostles | የሐዋርያት ሥራ | `serate-readings-102` |
| 4 | `psalm` | Psalm (Misbak) | ምስባክ | `serate-readings-177` |
| 5 | `gospel` | Holy Gospel | ቅዱስ ወንጌል | `serate-daily-gospel-185` |
| 6 | `anaphora` | Anaphora | ቅዳሴ | *(no inline block — drives evangelist substitution)* |

> **Anaphora slot** (key `anaphora`): The Anaphora is already chosen via the
> existing Anaphora selection screen. In the readings picker, this slot displays
> the currently selected Anaphora's name as a read-only indicator in Milestone 1.
> It may become editable in a later milestone if the priest wants to override it
> from the same panel.

---

## 3. Data Model

### 3.1 Types

```typescript
// data/readingSlots.ts — canonical slot definitions

export type ReadingSlotKey =
  | 'pauline'
  | 'catholic'
  | 'acts'
  | 'psalm'
  | 'gospel'
  | 'anaphora';

export interface SelectedReading {
  book: string;           // Canonical English book name, e.g. "Romans"
  chapter: number;        // 1-based
  startVerse: number;     // 1-based
  endVerse: number;       // 1-based, >= startVerse
  /** Formatted display string, derived — e.g. "Romans 8:3-18" */
  formatted: string;
}

export interface ReadingsState {
  slots: Record<ReadingSlotKey, SelectedReading | null>;
  setSlot: (key: ReadingSlotKey, reading: SelectedReading | null) => void;
  clearAll: () => void;
}
```

### 3.2 Per-Slot Book Catalog

A new data file `data/bibleBooks.ts` defines only the books eligible for each
reading slot. Each book entry:

```typescript
export interface BibleBook {
  /** Canonical English name used as key throughout the app */
  id: string;               // e.g. "Romans"
  english: string;          // Display name in English
  amharic: string;          // Display name in Amharic (Ethiopic script)
  geez: string;             // Display name in Ge'ez (Ethiopic script)
  transliteration: string;  // Romanized pronunciation
  /** Total chapters. Length of this array = chapterCount */
  versesPerChapter: number[];  // index 0 = chapter 1
}
```

Books are grouped by slot in `SLOT_BOOKS: Record<ReadingSlotKey, BibleBook[]>`.
Only books in a slot's list appear in that slot's suggestion dropdown.

**Eligible books per slot:**

| Slot | Eligible books | Notes |
|------|----------------|-------|
| `pauline` | Romans, 1 Corinthians, 2 Corinthians, Galatians, Ephesians, Philippians, Colossians, 1 Thessalonians, 2 Thessalonians, 1 Timothy, 2 Timothy, Titus, Philemon, Hebrews | 14 books |
| `catholic` | James, 1 Peter, 2 Peter, 1 John, 2 John, 3 John, Jude | 7 books |
| `acts` | Acts of the Apostles | Single book — book field pre-filled and locked; only chapter/verse inputs shown |
| `psalm` | Psalms | Single book — book field pre-filled and locked; only chapter/verse inputs shown |
| `gospel` | Matthew, Mark, Luke, John | 4 books |
| `anaphora` | *(read-only — driven by anaphora picker)* | — |

> **Single-book slots (Acts, Psalm):** Because there is only one eligible book,
> the book name is pre-filled and the book search field is hidden. The user sees
> only the chapter and verse number inputs.

---

## 4. UI Design

### 4.1 Entry Point — Reader Screen

A pill/icon button is rendered in the top-right area of the reader header for
`serate-qidase` only. It opens the `ReadingsPickerSheet`.

```
┌──────────────────────────────────────┐
│  Serate Qidase          [📖 Readings] │  ← new button
│──────────────────────────────────────│
│  ... liturgy scroll ...              │
```

- The button is **only shown** when `section === 'serate-qidase'`.
- When any slot has a selection, the button shows a small filled dot indicator
  (accent colour) to signal active overrides.

### 4.2 ReadingsPickerSheet

A bottom sheet modal (`Modal` with slide-up animation or react-native-reanimated
`BottomSheet`). Contains:

```
┌──────────────────────────────────────┐
│  ✕    Select Readings            ↺   │   ← close + clear-all
│──────────────────────────────────────│
│  Pauline Epistle                     │
│  [Romans                    ] [8] :  │
│  [3] – [18]                          │   ← inline autocomplete + num inputs
│                                      │
│  Catholic Epistle                    │
│  [ Search book...           ] [_] :  │
│  [_] – [_]                           │
│                                      │
│  Acts of the Apostles                │
│  ...                                 │
│                                      │
│  Psalm (Misbak)                      │
│  ...                                 │
│                                      │
│  Holy Gospel                         │
│  ...                                 │
│                                      │
│  Anaphora                 (read-only)│
│  Anaphora of St. Mary ✓              │
│                                      │
│         [ Apply Readings ]           │
└──────────────────────────────────────┘
```

### 4.3 Per-Slot Row — `ReadingSlotInput`

Each editable slot row has:

1. **Slot label** (bold heading) — language-aware (English / Amharic / Ge'ez)
2. **Book search field** — text input with:
   - Placeholder: `"Search book…"`
   - The dropdown is pre-filtered to only the **eligible books for that slot**
     (e.g. only 4 Gospel books appear under the Gospel slot).
   - As the user types, the list further narrows by substring match on English
     name, Amharic name, Ge'ez name, and transliteration simultaneously.
     Max 5 suggestions visible; scrollable.
   - Tapping a suggestion fills the field with the English canonical name and
     dismisses the list.
   - Tapping away clears an unconfirmed partial entry (resets to last valid or
     empty).
   - **Single-book slots (Acts, Psalm):** book field is hidden entirely;
     chapter/verse inputs are shown directly under the slot label.
3. **Chapter input** — small numeric `TextInput` labelled `Ch.`
   - Auto-advances focus to start verse on confirm.
   - Clamped to `[1, book.versesPerChapter.length]`.
4. **Start verse input** — numeric `TextInput` labelled `:`.
   - Clamped to `[1, versesPerChapter[chapter-1]]`.
5. **End verse input** — numeric `TextInput` labelled `–`.
   - Clamped to `[startVerse, versesPerChapter[chapter-1]]`.
   - Defaults to same as start verse when chapter is selected.
6. **Clear button** `✕` (small, right-aligned) — resets the slot to `null`.

**Validation rules:**
- Chapter must be a valid chapter number for the chosen book.
- Start verse must be ≤ end verse.
- End verse must not exceed the chapter's verse count.
- Invalid values are highlighted in red; the Apply button is disabled if any
  started-but-incomplete slot is invalid.

### 4.4 Suggestion List Behaviour

```
[Romans______________]          ← Pauline slot — only 14 Pauline books shown
 ├ Romans
 ├ 2 Corinthians               ← contains "or"
 └ (1 Chronicles never appears — not a Pauline epistle)
```

- **Slot-scoped:** the candidate list is always `SLOT_BOOKS[slotKey]`, never the
  full catalog. Empty query → show all eligible books for the slot.
- Matching: **substring match** on any of the 4 name fields (English, Amharic,
  Ge'ez, transliteration), case-insensitive.
- Sort order: exact prefix match first, then remaining substring matches.
- Single-book slots (Acts, Psalm) never render the suggestion list at all.

---

## 5. Inline Display in Liturgy

When a slot has a `SelectedReading`, the corresponding heading block in the
liturgy renders updated text. The existing `dynamic` field on `PrayerBlock`
(value = `ReadingSlotKey`) is the signal.

**Before selection (null state):**
```
1st Reading: —
```

**After selection:**
```
1st Reading
Romans 8:3-18
```

More precisely, the heading block shows:
- **Line 1:** Slot label (e.g. `1st Reading`, `ምስባክ`) using the existing heading
  text — **unchanged**.
- **Line 2:** Reference string derived from `SelectedReading.formatted`.
  - Language-aware: if the app language is Amharic, the book name appears in
    Amharic script; if Ge'ez, in Ge'ez; otherwise English.
  - Verse range format: `Book Ch:Sv-Ev` e.g. `Romans 8:3-18`, `ዘሮሜ 8፡3-18`.

If the slot is null, Line 2 shows a placeholder em-dash `—` in a muted colour.

**Gospel slot** additionally drives the evangelist substitution in the prayer
block `serate-readings-181` (the `{{evangelist}}` token) — same as in the
existing `full-dynamic-readings` implementation.

---

## 6. State Management

### 6.1 `ReadingsContext`

```
context/ReadingsContext.tsx
```

A React context and provider wrapping `serate-qidase` reader only (wrapped in
`app/reader/[section].tsx`).

```typescript
const ReadingsContext = createContext<ReadingsState>(/* ... */);

export function ReadingsProvider({ children }: { children: React.ReactNode }) {
  const [slots, setSlots] = useState<Record<ReadingSlotKey, SelectedReading | null>>({
    pauline: null,
    catholic: null,
    acts: null,
    psalm: null,
    gospel: null,
    anaphora: null,
  });

  const setSlot = (key: ReadingSlotKey, reading: SelectedReading | null) =>
    setSlots((prev) => ({ ...prev, [key]: reading }));

  const clearAll = () =>
    setSlots({ pauline: null, catholic: null, acts: null, psalm: null, gospel: null, anaphora: null });

  return (
    <ReadingsContext.Provider value={{ slots, setSlot, clearAll }}>
      {children}
    </ReadingsContext.Provider>
  );
}

export const useReadings = () => useContext(ReadingsContext);
```

- **Session scope:** State lives in the React tree. Survives Expo Go hot reload
  (Metro fast refresh). Does NOT survive full app process restart.
- **No AsyncStorage** in Milestone 1.
- **Live updates:** because `PrayerBlock` reads from context via `useReadings()`,
  any `setSlot` call immediately re-renders the affected heading block in the
  scroll view.

### 6.2 "Apply" vs "Live" Updates

The picker sheet has an **Apply Readings** button. Changes are applied to context
only when the user taps Apply. While the sheet is open, a local draft state `draftSlots` lives inside `ReadingsPickerSheet`. On Apply → `draftSlots` is
committed to context → sheet closes → heading blocks re-render.

This prevents partial/invalid reading references from appearing in the liturgy
mid-edit.

---

## 7. Architecture for Future Presentation Mode Integration

The picker is designed so that adding it to Presentation Mode requires only:

1. Rendering `<ReadingsPickerSheet>` within `PresentationView` (the context is
   already available from the parent wrapper).
2. Adding a toolbar button in `PresentationView` that sets `pickerVisible = true`.

The `ReadingsPickerSheet` component is **stateless with respect to source** — it
reads from and writes to `ReadingsContext` regardless of which screen opens it.
No props or callbacks need to change between the two surfaces.

---

## 8. File Plan

| File | Status | Action |
|------|--------|--------|
| `data/bibleBooks.ts` | New | Per-slot curated book lists with `versesPerChapter` arrays (~28 books total) |
| `data/readingSlots.ts` | New | `ReadingSlotKey`, `SelectedReading`, slot label config |
| `context/ReadingsContext.tsx` | New | Session state, `useReadings()` hook |
| `utils/readingFormatter.ts` | New | Build `formatted` string from `SelectedReading` |
| `components/ReadingsPicker.tsx` | New | The bottom-sheet modal |
| `components/ReadingSlotInput.tsx` | New | Per-slot row: search field + 3 number inputs |
| `components/BookSuggestionList.tsx` | New | Filtered suggestion dropdown |
| `data/types.ts` | Modify | Add `dynamic?: ReadingSlotKey` + `evangelistSlot?: boolean` to `PrayerBlock` |
| `components/PrayerBlock.tsx` | Modify | Render reading reference when `block.dynamic` is set |
| `components/ReaderLayout.tsx` | Modify | Add Readings button in header; manage `pickerVisible` state |
| `app/reader/[section].tsx` | Modify | Wrap `serate-qidase` in `ReadingsProvider` |
| `data/serate-qidase.json` | Modify | Annotate 6 blocks with `"dynamic"` field |

---

## 9. Implementation Plan

### Step 1 — Data Layer
1. Create `data/bibleBooks.ts` with per-slot curated book lists (~28 books total).
   - Only include books that are liturgically eligible for at least one slot.
   - Source `versesPerChapter` arrays from standard scripture metadata.
   - Include Ge'ez, Amharic, English, and transliteration names per book.
   - Export `SLOT_BOOKS: Record<ReadingSlotKey, BibleBook[]>` as the primary
     lookup used by `BookSuggestionList` and validation.
2. Create `data/readingSlots.ts` with `ReadingSlotKey`, `SelectedReading`, slot
   label config (English / Amharic / Ge'ez heading labels for all 6 slots).

### Step 2 — State
3. Create `context/ReadingsContext.tsx` with `ReadingsProvider` and `useReadings`.
4. Create `utils/readingFormatter.ts` — given a `SelectedReading` and a language,
   return the formatted reference string.

### Step 3 — UI Components
5. Create `components/BookSuggestionList.tsx` — memoised filtered list.
6. Create `components/ReadingSlotInput.tsx` — one editable slot row.
7. Create `components/ReadingsPicker.tsx` — full sheet with 5 editable slots + 1
   read-only Anaphora indicator + Apply/Close/Clear-all buttons.

### Step 4 — Integration
8. Modify `data/types.ts` — add `dynamic` and `evangelistSlot` to `PrayerBlock`.
9. Modify `data/serate-qidase.json` — annotate the 6 blocks with `"dynamic": "..."`.
10. Modify `components/PrayerBlock.tsx` — render reference from context when
    `block.dynamic` is set.
11. Modify `components/ReaderLayout.tsx` — add Readings button; render picker sheet.
12. Modify `app/reader/[section].tsx` — wrap serate-qidase in `ReadingsProvider`.

### Step 5 — Polish & Validation
13. Add input validation and clamping logic in `ReadingSlotInput`.
14. Disable Apply button when any started-but-invalid slot exists.
15. Add accent-dot indicator on the Readings button when any slot is active.

---

## 10. Open Questions (Milestone 2+)

| # | Question | Default assumption |
|---|----------|--------------------|
| 1 | Should the picker auto-populate today's lectionary readings as initial values? | No in M1; yes in M2 (integrate `lectionary_clean.json` lookup) |
| 2 | Persist selections to AsyncStorage? | No in M1; opt-in in M2 |
| 3 | Should the Gospel slot auto-fill the evangelist name in the priest prayer? | Yes — same `{{evangelist}}` substitution from `full-dynamic-readings` branch |
| 4 | Multiple anaphora readings possible? | Out of scope — handled by anaphora picker |
| 5 | Should the PSalm slot show the full psalm text inline? | Out of scope M1 |
| 6 | Chapter/verse display in Ethiopic numerals? | Out of scope M1; consider for M3 |

---

## 11. Design Decisions Log

| Decision | Rationale |
|----------|-----------|
| Type-ahead + numeric inputs (not cascading dropdowns) | Even within a single slot the book list is small enough to show as a flat suggestion list; numeric inputs are cleaner and faster than 3 nested pickers for chapter/start/end verse |
| Slot-scoped book lists (not full canon) | Each slot has a well-defined liturgical scope (e.g. only the 4 Gospels for the Gospel slot); showing irrelevant books would confuse priests and add noise; single-book slots (Acts, Psalm) need no book selector at all |
| Session-only persistence | User explicitly requested survival across hot reload but NOT full app restart; AsyncStorage is deferred to M2 |
| "Apply" button pattern (draft → commit) | Prevents partial/invalid editing state from bleeding into the liturgy scroll view mid-edit |
| 6 slots including anaphora read-only | Anaphora already has its own picker; the read-only indicator gives the priest a single glance at all 6 service elements in one panel |
| Picker in reader screen only (M1) | Architecture is picker-agnostic; adding to presentation mode is a one-step prop addition (see §7) |
| Substring search on all 4 name fields | Ethiopian Orthodox users may know a book by its Ge'ez, Amharic, or transliteration name — all must be searchable |
