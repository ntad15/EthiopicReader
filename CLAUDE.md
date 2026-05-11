# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm ci                               # Install dependencies
npm run web                          # Start the web dev server
npx expo start                       # Start the Expo dev server for device/simulator/web
npm run build:web                    # Build a production web export into dist/
npm run content:validate             # Validate canonical source content
npm run content:build                # Compile canonical source into committed runtime data
npm run content:verify               # Ensure committed runtime matches source
python3 data/scripts/lint_block_length.py  # Enforce block-length limits
node admin-server.js                 # Start the legacy local admin UI at http://localhost:3001
```

There are no automated tests in this project. For content-system work, the main regression checks are `content:validate`, `content:build`, `content:verify`, the block-length lint, and `npm run build:web`.

## Architecture

**Qidase Reader** is an Expo Router app (SDK 54) for reading the Ethiopian Orthodox Tewahedo Church liturgy in Ge'ez, Amharic, English, and transliteration.

### Navigation (Expo Router)

- `app/(tabs)/` — Tab bar home, settings, bookmarks
- `app/reader/[section].tsx` — Reader for `qidan` and `serate-qidase`
- `app/qidase/[id].tsx` — Combined route for `serate-qidase` followed by one anaphora
- `app/anaphora/[id].tsx` — Reader for any of the 14 anaphoras
- `app/_layout.tsx` — Root layout: wraps everything in `GestureHandlerRootView`, `SafeAreaProvider`, and the three context providers

### Data Layer

Canonical liturgical content now lives under `content/source/**`, with the source contract defined in `content/schema/v1/**`.

Compiled runtime output lives in `data/**` and is committed to the repo. The Expo app loads that compiled runtime through `data/runtimeIndex.ts`.

The core runtime types in [data/types.ts](data/types.ts) are:

- `PrayerBlock` — A single block of text with `id`, `type` (`heading|rubric|prayer|response`), optional `speaker` (`priest|deacon|congregation|all`), and per-language text fields
- `LiturgicalSection` — Array of `PrayerBlock`s with a title
- `LiturgicalText` / `Anaphora` — Array of `LiturgicalSection`s

Canonical changes should be made in `content/source/**`, then compiled with the content pipeline. The admin server (`node admin-server.js` → `http://localhost:3001`) still exists, but it edits compiled runtime directly and should not be the default path for canonical liturgical updates.

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
