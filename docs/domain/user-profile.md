# User Profile

## Purpose

Store learner identity, goals, AI configuration, and study preferences. The profile feeds the study plan engine and AI tutor with contextual information.

## Canonical Model

Stored in `localStorage` under key `'ielts-settings'` (web app; extension uses `'extensionSettings'` under `chrome.storage.local`).

| Field | Type | Description |
|---|---|---|
| `examDate` | string (ISO date) | Target IELTS exam date |
| `targetBand` | number | Desired overall band score |
| `nativeLanguage` | string | Learner's native language (e.g. `'Vietnamese'`) |
| `aiApiKey` | string | API key for AI provider |
| `aiBaseUrl` | string | Custom API endpoint URL |
| `aiModel` | string | Model name (default `'gpt-4o-mini'`) |
| `aiProvider` | `'openai' \| 'custom'` | AI provider selection |
| `themeMode` | `'light' \| 'dark' \| 'system'` | UI theme preference |
| `studySchedule` | `{ days: DayOfWeek[], minutesPerDay: number }` | Weekly study schedule |
| `weakSkills` | `StudyTaskSkill[]` | Skills the learner wants to prioritise |

Legacy fields (`currentBand`, `dailyStudyMinutes`, `preferredSchedule`, `studyGoal`, `darkMode`, etc.) are still read during migration but are being superseded by the profile model in `@ielts/learning-engine`'s `UserProfileInput`.

## Lifecycle

- Created during onboarding (`onboardingService.ts`).
- Edited via settings forms (`BasicSettingsForm`, `AdvancedSettingsForm`).
- Loaded at app startup; dispatched as a `'ielts-settings-updated'` custom event.
- Synced to extension via `syncFromWebsite()` bridge.

## Ownership

Web app owns the canonical settings. The extension uses `chrome.storage.local` with a `syncFromWebsite` bridge to mirror overlapping fields (AI provider, model, URL, theme).

## Persistence

- Web app: `localStorage` key `'ielts-settings'` + `'aiApiKey'` for the extension bridge.
- Extension: `chrome.storage.local` keys `'extensionSettings'`, `'aiApiKey'`.
- Chrome Sync: a subset of fields (no API key) via `SyncSettings`.

## Events

- `'ielts-settings-updated'` custom DOM event for in-app reactivity.
- Shared event `'roadmap_generated'` / `'roadmap_updated'` after plan recomputation.

## Migration Considerations

- The web app reads legacy `'ielts-settings'` format; the configuration layer (`configuration/storage.ts`) normalises it.
- The extension stores a richer `ExtensionSettings` type that extends `SharedSettings` with toolbar, auto-save, and highlight preferences.
- Settings bridge (`SETTINGS_BRIDGE_ACTIONS`) keeps web and extension in sync.
