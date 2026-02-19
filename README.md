# ExpoStarter 🚀

A clean, cross-platform Expo starter template with file-based routing, TypeScript, and a polished dark UI — ready for iOS, Android, and Web.

---

## ✨ What's Included

- **Expo SDK 52** — latest stable
- **Expo Router v4** — file-based routing (like Next.js, for native!)
- **TypeScript** — strict mode, path aliases configured
- **React Native Web** — run on web browsers with no extra config
- **Safe Area handling** — no notch/island overlap
- **3 tab screens** — Home, Explore, Settings (pre-built, ready to customize)
- **Dark theme** — polished default UI you can build on

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start the dev server

```bash
npx expo start
```

Then press:
- `i` → open iOS Simulator
- `a` → open Android Emulator
- `w` → open in web browser
- `s` → switch to Expo Go (scan QR with your phone)

---

## 📁 Project Structure

```
expo-starter/
├── app/
│   ├── _layout.tsx          # Root layout (fonts, splash, safe area)
│   ├── +not-found.tsx       # 404 screen
│   └── (tabs)/
│       ├── _layout.tsx      # Tab bar configuration
│       ├── index.tsx        # Home screen
│       ├── explore.tsx      # Explore screen
│       └── settings.tsx     # Settings screen
├── assets/
│   └── images/              # App icons, splash screen
├── components/              # Shared reusable components
├── constants/               # Colors, typography, spacing
├── hooks/                   # Custom React hooks
├── app.json                 # Expo config
├── babel.config.js
├── metro.config.js
└── tsconfig.json
```

---

## 🏗️ Adding Screens

Create a new file in `app/` to add a route:

```tsx
// app/profile.tsx  →  navigates to /profile
export default function ProfileScreen() {
  return <View>...</View>;
}
```

For nested routes, create folders:

```
app/
  settings/
    _layout.tsx      # Stack for settings
    index.tsx        # /settings
    notifications.tsx # /settings/notifications
```

---

## 🌐 Web Deployment

Build a static web export:

```bash
npx expo export --platform web
```

The output goes to `dist/` — deploy to Vercel, Netlify, or any static host.

---

## 📱 Building Native Apps

Use [EAS Build](https://docs.expo.dev/build/introduction/) for cloud builds:

```bash
npm install -g eas-cli
eas login
eas build --platform ios      # iOS .ipa
eas build --platform android  # Android .apk / .aab
eas build --platform all      # Both at once
```

---

## 🎨 Customizing the Theme

The color scheme is defined inline in each component. To centralize it, add a `constants/Colors.ts`:

```ts
export const Colors = {
  background: '#0a0a0a',
  surface: '#111111',
  border: '#1e1e1e',
  text: '#ffffff',
  muted: '#666666',
  accent: '#6EE7B7',
  danger: '#f87171',
};
```

---

## 📦 Recommended Packages

| Purpose | Package |
|---|---|
| Icons | `@expo/vector-icons` |
| Animations | `react-native-reanimated` |
| Gestures | `react-native-gesture-handler` |
| Storage | `@react-native-async-storage/async-storage` |
| State | `zustand` or `jotai` |
| Forms | `react-hook-form` |
| Networking | `axios` or native `fetch` |
| Image | `expo-image` |

---

## 📄 License

MIT — free to use for any project.
