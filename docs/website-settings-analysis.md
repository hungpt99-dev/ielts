# Website Settings: Loading & Saving Analysis

## File
`apps/web/src/services/storage/SettingsStorage.ts`

## Storage Mechanism
- **`localStorage`** (synchronous, no cross-device sync)
- JSON serialization for all values via `JSON.stringify` / `JSON.parse`
- No validation library — relies on spread-merge with defaults

## Storage Keys

| localStorage Key | Value Type | Default | Purpose |
|---|---|---|---|
| `ielts-settings` | `AppSettings` (JSON blob) | `DEFAULT_SETTINGS` | All main app settings |
| `ielts-theme-mode` | `string` | `'system'` | Theme mode (light/dark/system) |
| `ielts-accent-color` | `string` | `'#2563eb'` | Accent color hex |
| `ielts-notification-prefs` | `{ enabled: boolean, reminderTime: string }` | `{ enabled: false, reminderTime: '09:00' }` | Notification preferences |
| `ielts-dark-mode` | `boolean` | `false` | Dark mode toggle |

Additional keys tracked in `storageService.ts` `LOCAL_STORAGE_REGISTRY`:
| Key | Version |
|---|---|
| `ielts-settings` | 1 |
| `ielts-tutor-preferences` | 1 |
| `ielts-tutor-memory-legacy` | 1 |
| `ielts-theme-mode` | 1 |
| `ielts-accent-color` | 1 |
| `ielts-dark-mode` | 1 |
| `ielts-notification-prefs` | 1 |
| `ai-tutor-chat-memory` | 1 |

## `AppSettings` Interface & Defaults

Defined in `apps/web/src/models/index.ts`:

| Key | Type | Default |
|---|---|---|
| `targetBand` | `number` | `7.0` |
| `currentBand` | `number` | `5.5` |
| `examDate` | `string` | `''` |
| `dailyStudyMinutes` | `number` | `60` |
| `weakSkills` | `string[]` | `[]` |
| `preferredTopics` | `string[]` | `[]` |
| `studyReminder` | `string` | `'Time to study IELTS!'` |
| `studyGoal` | `'academic' \| 'general'` | `'academic'` |
| `preferredSchedule` | `('mon' \| 'tue' \| 'wed' \| 'thu' \| 'fri' \| 'sat' \| 'sun')[]` | All 7 days |
| `aiApiKey` | `string` | `''` |
| `aiProvider` | `'openai' \| 'custom'` | `'openai'` |
| `aiEndpoint` | `string` | `''` |
| `aiModel` | `string` | `'gpt-4o-mini'` |
| `darkMode` | `boolean` | `false` |
| `aiEnabled` | `boolean` | `false` |

## Key Functions

### `loadAppSettings()`
1. Reads `ielts-settings` from `localStorage`
2. If found, parses JSON and merges with `DEFAULT_SETTINGS` (stored values win via spread)
3. If missing or parse fails, returns `DEFAULT_SETTINGS`

### `saveAppSettings(settings)`
1. Serializes the full `AppSettings` object to JSON
2. Writes to `localStorage` under key `ielts-settings`
3. No backup copy (unlike extension)

### `patchAppSettings(patch)`
1. Calls `loadAppSettings()` to get current
2. Merges `patch` via spread
3. Calls `saveAppSettings()` with merged result
4. Returns merged settings

### Individual getters/setters
- `getThemeMode()` / `setThemeMode()` — key `ielts-theme-mode`
- `getAccentColor()` / `setAccentColor()` — key `ielts-accent-color`
- `loadNotificationPrefs()` / `saveNotificationPrefs()` — key `ielts-notification-prefs`
- `getDarkMode()` / `setDarkMode()` — key `ielts-dark-mode`

### Generic helpers
- `getSetting<T>(key, defaultValue)` — reads + JSON.parses any localStorage key
- `setSetting<T>(key, value)` — JSON.stringify + writes any localStorage key
- `removeSetting(key)` — removes a localStorage key

## `StorageService` wrapper

File: `apps/web/src/services/storage/storageService.ts`

Exposes `StorageService.getAppSettings()`, `saveAppSettings()`, `patchAppSettings()` which delegate directly to `SettingsStorage`. Also includes:
- Schema version tracking (`ielts-storage-schema-version` key)
- Migration system (`runLocalStorageMigrations`) that seeds defaults on first run
- Retry logic for IndexedDB operations
- Export/import of all data (settings + IndexedDB + local tutor storage)

## Key Design Decisions
- **No Zod/validation**: Unlike the extension (which uses Zod `safeParse`), the website accepts any JSON under `ielts-settings` and trusts the spread-merge with `DEFAULT_SETTINGS` for missing keys.
- **All in `localStorage`**: Settings are stored in the origin's `localStorage` — no cross-device sync, no backup copy.
- **Granular keys for quick access**: Theme, accent color, dark mode, and notification prefs each have their own `localStorage` key for fast individual reads without parsing the full `AppSettings` blob.
- **Error suppression**: Parse errors on load are silently swallowed (returns default). Write errors log to console but don't throw (except in `StorageService` wrapper which throws `StorageOperationError`).
- **`localStorage` quota**: Write errors check for `QuotaExceededError` in `storageService.ts` (not in `SettingsStorage.ts` itself).

## Comparison with Extension Settings

| Aspect | Website | Extension |
|---|---|---|
| Storage | `localStorage` | `chrome.storage.sync` + `chrome.storage.local` |
| Validation | TypeScript interface + spread merge | Zod schema `safeParse` |
| Cross-device sync | No | Yes (via Chrome sync, except API key) |
| API key isolation | In same JSON blob (`ielts-settings`) | Separate `chrome.storage.local` key |
| Backup | None | Local backup on every save |
| Individual keys | Theme, accent, notif prefs, dark mode | None (full blob only) |
| Overlapping keys | `aiProvider`, `aiModel`, `aiEndpoint`, `darkMode` | `aiProvider`, `aiModel`, `aiBaseUrl`, `themeMode` |
| Default model | `gpt-4o-mini` | `gpt-4o-mini` |
