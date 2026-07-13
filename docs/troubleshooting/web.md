# Web App Troubleshooting

## PWA Not Installing

- **Check protocol**: PWA requires HTTPS (or localhost). If served over HTTP, the `beforeinstallprompt` event will not fire.
- **Check service worker**: Open DevTools > Application > Service Workers. Verify `registerSW()` from `vite-plugin-pwa` is active.
- **Check manifest**: DevTools > Application > Manifest. Verify icons, start_url, and display modes.
- **Auto-update**: The `registerType: 'autoUpdate'` config means the SW updates on every page load. No user prompt for update.

## Capacitor Build Failures

- **iOS**: Requires Xcode 16+ and iOS 16+ deployment target. Check `ios/App/` for native dependency versions.
- **Android**: Requires Android API 26+. Check `android/app/build.gradle` for `minSdkVersion`.
- **Plugins**: Verify `@capacitor/splash-screen`, `@capacitor/keyboard`, `@capacitor/status-bar` are installed.

## Blank Screen

- **Check console**: Open DevTools > Console. Look for:
  - `initError` state (DB initialization failed).
  - `VersionError` from Dexie (migration failure).
  - `null engine` warnings from `engineBootstrap.ts`.
- **Check IndexedDB**: DevTools > Application > IndexedDB > `ielts-journey`. If missing, `initDb` may have failed.
- **Retry**: Clear site data (Application > Clear storage) and reload.

## Settings Not Saving

- **Check localStorage quota**: Max 5 MB per origin. Run `JSON.stringify(localStorage).length` in console.
- **Check migration**: If legacy `ielts-settings` key conflicts with new `@ielts/settings` format, the migration in `ConfigProvider` may have failed.
- **Check `saveConfiguration`**: From `configSlice.tsx`, settings are saved on every config change via `useEffect`. If the effect throws, settings won't persist.
