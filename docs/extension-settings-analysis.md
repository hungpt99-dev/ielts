# Extension Settings: Loading & Saving Analysis

## File
`apps/extension/src/background/settingsStorage.ts`

## Schema (Zod-based)
Zod schema `extensionSettingsSchema` validates the extension's settings object:

| Key | Type | Default | Sync? |
|---|---|---|---|
| `aiProvider` | `'openai' \| 'custom'` | `'openai'` | sync |
| `aiBaseUrl` | `string` | `''` | sync |
| `aiApiKey` | `string` | `''` | **local only** (never sync'd) |
| `aiModel` | `string` | `'gpt-4o-mini'` | sync |
| `themeMode` | `'light' \| 'dark' \| 'system'` | `'system'` | sync |
| `floatingToolbar` | `boolean` | `true` | sync |
| `autoSaveSelected` | `boolean` | `false` | sync |
| `autoHighlightSavedVocabulary` | `boolean` | `true` | sync |
| `defaultCategory` | `'vocabulary' \| 'phrase' \| 'sentence' \| 'grammar' \| 'reading' \| 'writing' \| 'speaking' \| 'mistake'` | `'vocabulary'` | sync |
| `defaultTopic` | `string` | `'general'` | sync |

## Storage Keys

| Chrome Storage Area | Key | Purpose |
|---|---|---|
| `chrome.storage.sync` | `extensionSettings` | All settings **except** `aiApiKey` |
| `chrome.storage.local` | `aiApiKey` | API key (never synced to Chrome account) |
| `chrome.storage.local` | `ielts-settings-backup` | Backup copy of sync data (fallback) |

## Key Functions

### `loadSettings()`
1. Calls `getDefaults()` which reads `chrome.storage.sync` for `extensionSettings` key
2. If stored data exists, merges with `DEFAULT_SETTINGS` (stored values win) and validates via Zod's `safeParse` — fallback values fill in any missing keys
3. If nothing stored, returns `DEFAULT_SETTINGS`
4. Loads `aiApiKey` separately from `chrome.storage.local`
5. Returns merged `ExtensionSettings`

### `saveSettings(settings)`
1. Strips `aiApiKey` via `toSyncSettings()` (never syncs the key)
2. Writes stripped settings to `chrome.storage.sync` under `extensionSettings`
3. Also writes a backup copy to `chrome.storage.local` under `ielts-settings-backup`
4. Writes `aiApiKey` to `chrome.storage.local` separately via `setApiKey()`

### `patchSettings(patch)`
1. Loads current settings, merges the patch, saves, returns merged result.

### `clearAllSettings()`
Removes `extensionSettings` from sync, and `aiApiKey` + `ielts-settings-backup` from local.

### `getApiKey()` / `setApiKey()`
Thin wrappers around `chrome.storage.local` for the `aiApiKey` key.

### `exportSettingsData()` / `importSettingsData()`
Serializes/deserializes the full `ExtensionSettings` object (including the API key) — used for manual import/export.

## Key Design Decisions
- **API key isolation**: The `aiApiKey` is stored in `chrome.storage.local` only (not sync'd), preventing it from being copied across devices via Chrome account sync. The backup still goes to local, not to sync.
- **Zod validation on load**: `getDefaults()` uses `safeParse` with `DEFAULT_SETTINGS` spread underneath — this ensures missing keys get defaults while stored values are preserved, even if the schema evolves.
- **Backup on save**: Every save writes to both `chrome.storage.sync` and `chrome.storage.local` (`ielts-settings-backup`), providing recovery if sync data is lost.
- **`saveSettings` is fire-and-forget**: Returns a `Promise<void>`, no error handling on storage writes.

## Comparison with Web App Settings

| Aspect | Extension | Web App |
|---|---|---|
| Storage | `chrome.storage.sync` + `chrome.storage.local` | `localStorage` |
| API key isolation | Stored in `local` only (never sync'd) | Stored in `localStorage` (no sync) |
| Validation | Zod schema with defaults on load | TypeScript interface only (JSON.parse) |
| Sync across devices | Yes (via Chrome sync) | No |
| Theme mode | `'light' / 'dark' / 'system'` | Same values, separate `localStorage` key `ielts-theme-mode` |
| Backup | Local backup of sync data on every save | None |
| Overlapping keys | `aiProvider`, `aiBaseUrl`/`aiEndpoint`, `aiModel`, `themeMode`/`darkMode` | Similar concept, different key names/storage |
| Default model | `gpt-4o-mini` | `gpt-4o-mini` |

**Note**: The web app stores `darkMode: boolean` while the extension uses `themeMode` (tri-state). The web app also has many settings not present in the extension (`targetBand`, `examDate`, `dailyStudyMinutes`, `weakSkills`, `preferredTopics`, etc.) — these are IELTS-study-specific and don't apply to the extension's popup/side panel UI.
