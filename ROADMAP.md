# Qidase Reader — Comprehensive Project Roadmap

## Context

Qidase Reader is a liturgical reading app for the Ethiopian Orthodox Tewahedo Church, built with Expo SDK 54. The core reader experience is solid — multi-language display (Ge'ez, Amharic, English, transliteration), full-text search, presentation mode for projectors, and a warm parchment theme. However, 12 of 14 anaphoras are placeholder stubs, bookmarks are unimplemented, and the app has no store presence. This roadmap charts a path from current MVP to a complete, community-driven liturgical platform.

---

## Phase 1: Content & Core Completion

**Goal:** Make the app content-complete and genuinely useful for daily liturgical use.

### 1. Fill Missing Anaphoras
- **12 of 14 anaphoras are stubs** (only Apostles + St. John Chrysostom have content)
- Source from published liturgical books, church PowerPoints/PDFs, and the existing `anaphora_pds/` directory
- Use the admin server (`node admin-server.js` → localhost:3001) for data entry
- **Priority by liturgical frequency:**
  - **Tier 1:** St. Basil, Our Lord, St. Mary, Three Hundred Eighteen
  - **Tier 2:** St. Athanasius, St. Gregory, St. Cyril, St. Dioscorus
  - **Tier 3:** St. Epiphanius, St. James of Sarugh, St. James of Nisibis, St. John Son of Thunder
- Target: all 14 with at least Ge'ez, Amharic, and English; transliteration can follow

### 2. Implement Bookmarks
- Create `BookmarkContext` (following `LanguageContext` pattern) with AsyncStorage persistence
- `BookmarkItem`: blockId, source (section/anaphora ID), sectionId, timestamp, optional note
- Add bookmark icon to `PrayerBlock` (long-press or tap icon)
- Populate `bookmarks.tsx` with grouped list, tap-to-navigate, swipe-to-delete
- Re-enable bookmarks tab in `_layout.tsx` (currently `href: null`)

### 3. Reading Position Memory
- Store last scroll position per section/anaphora in AsyncStorage
- Restore on mount, update on scroll (debounced)
- Show "Continue reading" on home screen for in-progress sections

---

## Phase 2: Quality & Distribution

**Goal:** Production-quality app ready for App Store and Play Store.

### 4. Error Handling
- Add React error boundary at root layout with user-friendly fallback
- Add `.catch()` to all AsyncStorage calls in context providers
- Graceful handling for malformed/missing JSON data

### 5. Dark Mode (Regular Reading)
- New `ThemeContext` (light / dark / system) with AsyncStorage persistence
- Dark color palette in `colors.ts` (separate from the high-contrast presentation palette)
- Theme toggle in Settings screen
- Update all components to read from theme context

### 6. Performance
- Replace `ScrollView` in `ReaderLayout` with `FlatList`/`FlashList` for virtualized rendering (serate-qidase.json is already 2,485 lines and growing)
- Memoize `PrayerBlock` components
- Debounce search input (currently triggers on every keystroke)

### 7. Accessibility
- `accessibilityLabel` and `accessibilityRole` on all interactive elements
- Minimum 44x44pt touch targets (some current buttons are 34x34)
- Screen reader support: announce speaker role before prayer text

### 8. App Store Submission
- Configure `eas.json` with development/preview/production build profiles
- Verify app icon assets meet Apple (1024x1024) and Google Play (512x512) requirements
- Prepare store metadata: screenshots, description, keywords
- Privacy policy (straightforward — app collects zero data)
- Set up `expo-updates` for OTA content updates without store review cycles

### 9. Web Deployment
- Deploy static web export to GitHub Pages or Vercel (baseUrl `/EthiopicReader` already configured)
- Useful for sharing links to specific sections

---

## Phase 3: Growth Features

**Goal:** Features that make the app indispensable for the target audience.

### 10. Liturgical Calendar
- Ethiopian calendar display (differs from Gregorian) with feast days and fasting periods
- **Auto-suggest today's anaphora** based on EOTC liturgical rules
- Show current Ethiopian date, saint commemorations, fasting status on home screen

### 11. Audio Integration
- Audio recordings of prayers being chanted (core to how liturgy is learned)
- Synchronized text highlighting — current block highlights as audio plays
- Playback controls: play/pause, speed, repeat section
- Decision needed: bundle audio (large app size, always offline) vs. stream (smaller app, needs connectivity)

### 12. Study Mode
- Tap any Ge'ez word for transliteration and meaning
- Personal study notes attached to specific blocks (extend bookmark system)
- Highlight and annotate functionality

### 13. Sharing & Church Features
- Share a prayer/section as formatted text or image
- QR code linking to a specific section (useful for newcomers in church)
- **Live follow mode** (stretch): church leader's presentation mode syncs to congregants' phones via local network

### 14. Push Notifications (Opt-in)
- Daily prayer reminders at user-configured times
- Feast day and fasting period notifications from the liturgical calendar

---

## Phase 4: Long-Term Vision

### 15. Community Contributions
- `CONTRIBUTING.md` guide explaining JSON structure and how to add content
- Public web-based content editor (extend admin server) for non-technical contributors
- Review/approval pipeline for submitted content (accuracy is critical for liturgical texts)

### 16. Additional Content
- **Mezmur (Hymns)** — same multi-language reader
- **Biblical lectionary** — daily assigned readings
- **Kidase Zemmare** — musical notation for deacons/cantors
- **Catechism** — teaching content for learners

### 17. Cloud Sync (Optional)
- Optional accounts (email or Google/Apple sign-in)
- Sync bookmarks, reading positions, notes, preferences across devices
- Must remain fully optional — app always works without an account

### 18. App UI Internationalization
- Translate app chrome (buttons, labels, headings) to Amharic and Ge'ez
- Independent UI language setting from content language preferences

---

## Ongoing: Technical Health

### Testing
- Jest unit tests for context providers and data utilities
- React Native Testing Library for key components (PrayerBlock, ReaderLayout)
- E2E tests (Maestro) for critical flows: open → read → bookmark → find bookmark

### CI/CD
- GitHub Actions: lint, typecheck (`tsc --noEmit`), test on every PR
- EAS Build for preview builds on PRs
- Automated web deployment on merge to main
- EAS Update for OTA releases

### Monitoring
- Anonymous crash reporting (Sentry) — no PII, just stack traces
- Opt-in anonymous usage stats to guide development priorities
- Never: user tracking, ad SDKs, third-party data sharing

### Code Hygiene
- Sync `anaphoras.json` metadata index (currently only lists 2 of 14 entries)
- Extract `ANAPHORA_MAP` from hardcoded requires into a dynamic loader
- Typed data validation at load time

---

## Priority Summary

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| **P0** | Tier 1 anaphoras (4) | Very High | High |
| **P0** | Bookmarks | High | Medium |
| **P1** | Remaining anaphoras (8) | High | High |
| **P1** | Reading position memory | Medium | Low |
| **P1** | Error boundaries | Medium | Low |
| **P1** | App store submission | High | Medium |
| **P2** | Dark mode | Medium | Medium |
| **P2** | Virtualized lists | Medium | Medium |
| **P2** | CI/CD + testing | Medium | Medium |
| **P3** | Liturgical calendar | Very High | High |
| **P3** | Audio integration | Very High | Very High |
| **P3** | Study mode | High | High |
| **P4** | Live follow mode | High | Very High |
| **P4** | Community platform | High | High |
| **P4** | Cloud sync | Medium | High |
