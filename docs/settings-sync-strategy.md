# Settings Synchronization Strategy: Extension ↔ Website

## Problem Statement

The extension and website each maintain their own settings with overlapping keys but different storage backends (`chrome.storage.sync` + `chrome.storage.local` vs. `localStorage`). Users expect settings changed in one surface (e.g. AI provider, theme) to be reflected in the other without manual re-entry.

## Overlapping Settings Mapping

| Shared Setting | Extension Key | Website Key | Extension Type | Website Type | Notes |
|---|---|---|---|---|---|
| AI provider | `aiProvider` | `aiProvider` | `'openai' \| 'custom'` | `'openai' \| 'custom'` | Same schema |
| AI model | `aiModel` | `aiModel` | `string` | `string` | Same default: `gpt-4o-mini` |
| AI base URL | `aiBaseUrl` | `aiEndpoint` | `string` | `string` | Different key name; same purpose |
| AI API key | `aiApiKey` | `aiApiKey` | `string` (local only) | `string` | Same key name; different sensitivity |
| Theme / dark mode | `themeMode` | `darkMode` | `'light' \| 'dark' \| 'system'` | `boolean` | Different representation — tri-state vs. binary |
| AI enabled | N/A | `aiEnabled` | N/A | `boolean` | Website-only; extension always enabled |

### Extension-Only Settings
`floatingToolbar`, `autoSaveSelected`, `autoHighlightSavedVocabulary`, `defaultCategory`, `defaultTopic` — no website equivalent; no sync needed.

### Website-Only Settings
`targetBand`, `currentBand`, `examDate`, `dailyStudyMinutes`, `weakSkills`, `preferredTopics`, `studyReminder`, `studyGoal`, `preferredSchedule`, `accentColor`, `notificationPrefs` — no extension equivalent; no sync needed.

## Synchronization Architecture

### Approach: Content-Script Bridge

The extension's **content script** (already injected into every page including the website) acts as the bidirectional bridge between `chrome.storage` (extension) and `localStorage` (website).

```
┌─────────────────────────────────────────────────┐
│ Website Page (origin: app.ielts.example)         │
│                                                   │
│  ┌──────────────┐   reads/writes   ┌──────────┐ │
│  │  React App   │ ───────────────> │localStorage│ │
│  │  (AppSettings)│ <────────────── │          │ │
│  └──────────────┘                  └──────────┘ │
│                                        ▲         │
│                                        │         │
│                               content script     │
│                             reads/writes via      │
│                            chrome.storage.* APIs  │
│                                        │         │
└────────────────────────────────────────────────┘  │
                   │  chrome.runtime.sendMessage     │
                   ▼                                 │
┌─────────────────────────────────────────────────┐
│ Extension Background (service worker)            │
│                                                   │
│  ┌──────────────┐   ┌─────────────────────┐      │
│  │ chrome.storage│   │ SettingsService     │      │
│  │  .sync        │   │ (load/save/patch)   │      │
│  │  .local       │   └─────────────────────┘      │
│  └──────────────┘                                 │
└─────────────────────────────────────────────────┘
```

### Flow: Website → Extension (user changes AI provider on the website)

1. User changes `aiProvider` in the website's Settings page
2. Website calls `patchAppSettings({ aiProvider: 'custom' })` which writes to `localStorage` (key `ielts-settings`)
3. Content script detects the change (via `Window` `storage` event — fired when same-origin tabs change localStorage)
4. Content script reads the updated `aiProvider` from `localStorage`
5. Content script sends `SYNC_SETTINGS_TO_EXTENSION` message to background via `chrome.runtime.sendMessage`
6. Background handler calls `patchSettings({ aiProvider: 'custom' })` which writes to `chrome.storage.sync`
7. Extension UI (popup/options) picks up the new settings on next render

### Flow: Extension → Website (user changes theme in the extension options page)

1. User changes `themeMode` to `'dark'` in the extension options page
2. Options page calls `saveSettings()` which writes to `chrome.storage.sync`
3. Content script listens to `chrome.storage.onChanged` for the `extensionSettings` key
4. Content script extracts `themeMode` and maps it to website's `darkMode`:
   - `'light'` → `darkMode = false`
   - `'dark'` → `darkMode = true`
   - `'system'` → `darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches`
5. Content script writes the mapped `darkMode` to `localStorage` (key `ielts-dark-mode`)
6. Also writes the full `themeMode` to `localStorage` (key `ielts-extension-theme-mode`) for the website to consume directly
7. Website picks up the change (either via React re-render from a `localStorage` event listener, or on next page load)

## Theme Mode Conversion

Since the extension uses a tri-state `themeMode` and the website uses a boolean `darkMode`, we need bidirectional mapping:

```
Extension themeMode  →  Website darkMode
─────────────────────────────────────────
'light'              →  false
'dark'               →  true
'system'             →  window.matchMedia('(prefers-color-scheme: dark)').matches

Website darkMode     →  Extension themeMode (on the website, map back)
────────────
false                →  'light'
true                 →  'dark'
```

Additionally, write the raw `themeMode` to `localStorage` under `ielts-extension-theme-mode` so the website can use it directly if it adopts a tri-state theme in the future.

## API Key Handling

The API key `aiApiKey` is the most sensitive setting.

### Current State
- **Extension**: Stored in `chrome.storage.local` only (never synced to Chrome account)
- **Website**: Stored in `localStorage` as part of the `ielts-settings` JSON blob

### Sync Rule
- When the content script detects the website changed the API key in `localStorage`, it sends it to the background which writes it to `chrome.storage.local` (never sync).
- When the content script detects the extension API key changed (`chrome.storage.local`), it writes it to the website's `localStorage`.
- API keys are **never** included in the `chrome.storage.sync` data — the existing `toSyncSettings()` filter already strips it.
- The API key is included in the bridge message payload but only over `chrome.runtime.sendMessage` (within the extension context, not over network).

## Conflict Resolution

Conflicts occur when settings are changed on both sides before sync propagates.

### Last-Write-Wins (LWW)

The bridge uses **last-write-wins** with per-key granularity:

1. When a change originates from the website, the content script sends the **entire set of overlapping keys** (reads from `localStorage`) to the background, which applies them via `patchSettings()`.
2. When a change originates from the extension (via `chrome.storage.onChanged`), the content script reads the **overlapping keys from sync** and writes them selectively to `localStorage`.
3. Each direction writes only the overlapping subset — not the full settings blob — to avoid overwriting non-overlapping fields.

### Race Condition Mitigation
- The bridge messages carry a `requestId` and timestamp so the background can ignore stale updates.
- The `chrome.storage.onChanged` listener in the content script debounces updates (300ms) to avoid reacting to its own writes.

## Storage Key Name Unification

To reduce confusion, unify the `aiEndpoint` / `aiBaseUrl` key name:

| Before | After | Reason |
|---|---|---|
| Extension `aiBaseUrl` | `aiBaseUrl` (unchanged) | No change needed |
| Website `aiEndpoint` | `aiBaseUrl` | Rename to match extension |

This is a website-only refactor — rename `aiEndpoint` → `aiBaseUrl` in `AppSettings` interface, `DEFAULT_SETTINGS`, and all references. For backwards compatibility, read from both keys on load with `aiBaseUrl` taking precedence.

## Implementation Plan

### Phase 1: Content Script Bridge Setup
1. Add a new message handler `SYNC_SETTINGS_TO_EXTENSION` in `apps/extension/src/background/messaging.ts`
2. Create `apps/extension/src/content-script/settingsBridge.ts` that:
   - Listens to `chrome.storage.onChanged` for `extensionSettings` key
   - Listens to `Window` `storage` event for `ielts-settings` key
   - Maps overlapping keys bidirectionally
   - Debounces updates

### Phase 2: Website Integration
3. Rename `aiEndpoint` → `aiBaseUrl` in `AppSettings` and `DEFAULT_SETTINGS` (`apps/web/src/models/index.ts`)
4. Add backward-compat read in `SettingsStorage.ts` (`loadAppSettings`)
5. Update `SaveSettings` and `SettingsForm` components to use `aiBaseUrl`
6. Add a `storage` event listener in `SettingsContext.tsx` (or the bridge) to react to extension-sourced changes

### Phase 3: Extension Integration
7. Register the theme-mapping handler in the content script bridge
8. Ensure the API key sync respects `chrome.storage.local` (never sync)

### Phase 4: Validation & Cleanup
9. Test flows: website → extension, extension → website, API key isolation
10. Remove legacy `aiEndpoint` reads after migration period

## Security Considerations

- **API key** is never sent over `chrome.storage.sync` — the existing `toSyncSettings()` filter is already correct
- **Bridge messages** stay within the extension context (`chrome.runtime.sendMessage`) — no network exposure
- **Content script** runs in the website's origin but has access only to `localStorage` (same as any JS on the page)
- **No cross-origin communication** — the bridge only activates when the website (same known origin) is loaded

## Fallback Behavior

If the content script bridge is not available (e.g., extension not installed):
- The website continues to work independently with its own `localStorage` settings
- The extension continues to work independently with `chrome.storage.sync`/`local`
- Users simply lose cross-surface sync — no data loss or breakage

If `chrome.storage.onChanged` or `Window` `storage` event fails:
- Settings are still in sync on the next page load (content script reads from `chrome.storage.sync` on `DOMContentLoaded`)
- The bridge uses a passive sync model — it never blocks the website or extension from operating
