# Qidase Reader

A digital reader for the Divine Liturgy (Qidase) of the Ethiopian Orthodox Tewahedo Church. Displays liturgical texts in Ge'ez, Amharic, English, and transliteration with speaker role indicators and section-based navigation. 

## Features

- Multilingual text display: Ge'ez, Amharic, English, and transliteration
- 3 main liturgical sections: Kidan (Prayer of the Covenant), Serate Kidase (Preparatory Service), and Fere Kidase (14 Anaphoras)
- 14 Anaphoras including St. Basil, St. Mary, St. Cyril, Apostles, Our Lord, and more
- Speaker role indicators (priest, deacon, congregation)
- Adjustable font size with persistent preferences
- Full-screen presentation mode with keyboard/tap navigation (designed for projectors)
- Warm parchment ("Modern Manuscript") theme
- Runs on iOS, Android, and web

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 recommended)
- [Expo Go](https://expo.dev/go) on your phone if you want to open the native dev server on a device

### Install dependencies

```bash
npm ci
```

### Run the web app

```bash
npm run web
```

### Run the Expo dev server

```bash
npx expo start
```

Use this when you want to scan the QR code with Expo Go or launch a simulator. Press `w` in the Expo terminal to open the web app from the same dev server.

### Build the web app

```bash
npm run build:web
```

## Content Workflow

Canonical liturgical content now lives under `content/source/`.

- `content/source/**` is the human-edited source of truth
- `data/**` is compiled runtime output that is generated locally and committed
- the Expo app reads committed runtime through `data/runtimeIndex.ts`

For a normal content update:

1. Edit the relevant files in `content/source/**`.
2. Run `npm run content:validate`.
3. Run `npm run content:build`.
4. Run `npm run content:verify`.
5. Run `python3 data/scripts/lint_block_length.py`.
6. Commit both the source changes and the regenerated runtime files in `data/**`.

`npm run content:import` is only a migration/bootstrap helper for lifting the legacy runtime corpus into `content/source/`. It is not the day-to-day editing path.

## Legacy Admin Tool

This repo still contains a browser-based admin tool, but it is no longer the canonical update path for liturgical content.

Use the content workflow above for routine content changes. The admin tool edits compiled files in `data/**` directly, so changes there can drift from or be overwritten by the canonical source pipeline unless they are mirrored back into `content/source/**`.

The tool still runs in two modes depending on how you open it.

### Mode 1 — Local (maintainer)

```bash
npm run admin          # starts the server at http://localhost:3001
```

No extra install needed — uses only Node.js built-ins. **Save to Disk** writes directly into the compiled runtime files under `data/`.

### Mode 2 — GitHub Pages (non-technical editors)

The admin tool is also deployed as a static site at `<pages-url>/admin/` alongside the Expo web app. Clergy and translators can open it in any browser without cloning the repo or running Node.

Because there is no server to write to, **Save to Disk** becomes **Download JSON**. Treat downloaded files as review input for a maintainer, not as canonical source content.

### What you can do in either mode

- **Edit** prayer block text in any language (Ge'ez, Amharic, English, Transliteration), block type, and speaker role
- **Add** new sections and blocks
- **Delete** sections and blocks
- **Reorder** by dragging blocks up/down within a section, or drag onto a different section to move
- **Search & Insert** — opens a modal with two tabs:
  - **Blocks**: empty state shows frequently-used blocks (3+ occurrences across all files); type to search every block in the entire corpus by any language field, type, or speaker
  - **Sections**: browse or search all sections from all files; click one to insert a full copy (with fresh IDs) after the currently selected section
- **Character-count indicators** on each text field (yellow > 250 chars, red > 400 chars — the hard limit for presentation mode)

All compiled runtime files are available: `qidan.json`, `serate-qidase.json`, `seasonals.json`, and all anaphoras under `anaphoras/`.

### Admin password (GitHub Pages)

The GitHub Pages admin is protected by [staticrypt](https://github.com/robinmoisson/staticrypt) — the entire page is AES-256 encrypted at deploy time. Without the correct password the page is unreadable, including in DevTools.

#### Initial setup

1. Choose a strong passphrase (e.g. three random words + a number: `violet-chapel-sunrise-41`)
2. Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**
3. Name: `ADMIN_PASSWORD`, value: your passphrase
4. Push to `main` — the next deploy will encrypt the admin page with that password

#### Rotating the password

1. Update the `ADMIN_PASSWORD` secret in GitHub repo settings (same steps as above — update the existing secret)
2. Push any change to `main` (or trigger the workflow manually via **Actions → Deploy to GitHub Pages → Run workflow**)
3. The next deploy re-encrypts with the new password — the old password stops working immediately after deploy

The local admin (`npm run admin` → `localhost:3001`) is unaffected by this — it binds only to `127.0.0.1` and needs no password.

### Manifest builder

The GitHub Pages deploy and the static-mode file list both rely on `data/manifest.json` and `data/common-blocks.json`, generated by:

```bash
npm run admin:manifest
```

This runs automatically in CI on every push to `main`. Run it locally after adding or removing a JSON file in `data/`.

## Project Structure

```
EthiopicReader/
├── app/
│   ├── _layout.tsx              # Root layout (providers, font loading, navigation)
│   ├── +not-found.tsx           # 404 screen
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab bar / sidebar layout (responsive)
│   │   ├── index.tsx            # Home screen — content library
│   │   ├── settings.tsx         # Settings (languages, font size, app info)
│   │   └── bookmarks.tsx        # Bookmarks (placeholder)
│   ├── reader/
│   │   └── [section].tsx        # Reader for qidan & serate-qidase
│   ├── qidase/
│   │   ├── index.tsx            # Combined qidase/anaphora entrypoint
│   │   └── [id].tsx             # Serate Qidase + selected anaphora
│   └── anaphora/
│       ├── index.tsx            # Anaphora list (14 items)
│       └── [id].tsx             # Individual anaphora reader
├── content/
│   ├── schema/
│   │   └── v1/                  # Canonical source schema contract
│   └── source/                  # Canonical liturgical source documents
├── components/
│   ├── ReaderLayout.tsx         # Shared reader layout (used by reader & anaphora screens)
│   ├── PrayerBlock.tsx          # Renders a single prayer block (multi-column, speaker colors)
│   ├── PresentationView.tsx     # Full-screen presentation mode (dark, tap/keyboard nav)
│   ├── SectionDrawer.tsx        # Animated section navigation drawer
│   └── CrossIcon.tsx            # Ethiopian cross SVG icon
├── context/
│   ├── LanguageContext.tsx       # Active languages & primary language state
│   └── FontSizeContext.tsx       # Font size multiplier state
├── constants/
│   ├── colors.ts                # Full color palette + speaker color records
│   ├── fonts.ts                 # Font family aliases (Playfair Display, EB Garamond)
│   ├── layout.ts                # Max content width (720px centered column)
│   └── languages.ts             # Language labels and defaults
├── utils/
│   └── language.ts              # Shared language sorting/filtering utility
├── data/
│   ├── types.ts                 # TypeScript runtime types
│   ├── runtimeIndex.ts          # Generated runtime import surface used by the app
│   ├── qidan.json               # Compiled qidan runtime content
│   ├── serate-qidase.json       # Compiled serate-qidase runtime content
│   ├── seasonals.json           # Compiled seasonal overrides
│   └── anaphoras/               # Compiled anaphora runtime files + metadata index
├── scripts/
│   └── content/                 # Import/validate/build/verify content pipeline
├── admin-server.js              # Local admin HTTP server (node admin-server.js)
├── admin-ui.html                # Admin UI served by the server
├── app.json                     # Expo config
├── tsconfig.json
└── package.json
```

## Tech Stack

- [Expo](https://expo.dev/) (SDK 54)
- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) (persisted preferences)
