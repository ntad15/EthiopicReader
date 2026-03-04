# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm install          # Install dependencies
npx expo start       # Start dev server (scan QR with Expo Go, or press w for web)
expo run:ios         # Build and run on iOS simulator
expo run:android     # Build and run on Android emulator
expo lint            # Run ESLint
node admin-server.js # Start local admin UI at http://localhost:3001
```

There are no automated tests in this project.

## Architecture

**Qidase Reader** is an Expo Router app (SDK 54) for reading the Ethiopian Orthodox Tewahedo Church liturgy in Ge'ez, Amharic, English, and transliteration.

### Navigation (Expo Router)

- `app/(tabs)/` — Tab bar home, settings, bookmarks
- `app/reader/[section].tsx` — Reader for `kidan` and `serate-kidase` sections
- `app/anaphora/[id].tsx` — Reader for any of the 14 anaphoras
- `app/_layout.tsx` — Root layout: wraps everything in `GestureHandlerRootView`, `SafeAreaProvider`, and the three context providers

### Data Layer

All liturgical content lives in `data/` as JSON. The core types in [data/types.ts](data/types.ts) are:

- `PrayerBlock` — A single block of text with `id`, `type` (`heading|rubric|prayer|response`), optional `speaker` (`priest|deacon|congregation|all`), and per-language text fields
- `LiturgicalSection` — Array of `PrayerBlock`s with a title
- `LiturgicalText` / `Anaphora` — Array of `LiturgicalSection`s

Data files: `data/kidan.json`, `data/serate-kidase.json`, `data/anaphoras/` (14 files + metadata index). The admin server (`node admin-server.js` → `http://localhost:3001`) provides a browser UI for editing these JSON files without touching code.

### Shared Components

- **`ReaderLayout`** — Used by every reader screen. Handles scroll position tracking, section drawer, search overlay, settings sheet, presentation mode overlay, and edge-swipe gesture to open the drawer.
- **`PrayerBlock`** — Renders one prayer block with multi-language columns and speaker role colors.
- **`PresentationView`** — Full-screen dark overlay (designed for projectors) with tap/keyboard navigation through blocks; locks orientation to landscape on native.
- **`SectionDrawer`** — Animated slide-in panel for jumping to sections.
- **`SettingsSheet`** — Bottom sheet for language and font size preferences.

### Context Providers (all wrap at root in `_layout.tsx`)

- `LanguageContext` — Which languages are active and which is primary; persisted via AsyncStorage
- `FontSizeContext` — Font size scale multiplier; persisted via AsyncStorage
- `PresentationModeContext` — Presentation mode state + orientation lock/unlock logic

### Styling Conventions

- All colors from `constants/colors.ts` — warm parchment theme (light) + dark presentation palette
- Fonts from `constants/fonts.ts` — Playfair Display (serif headings) and EB Garamond (body)
- Max content width 720px, centered: use `contentColumn.wrapper` from `constants/layout.ts`
- Speaker role colors: `speakerColors` (light) / `presentationSpeakerColors` (dark) from `colors.ts`
- Styles are defined with `StyleSheet.create` inline in each file — no global stylesheet
