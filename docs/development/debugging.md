# Debugging

## Context Building

Context is built by `LearnerContextBuilder` in `@ielts/ai-tutor-engine`. Sources include localStorage, IndexedDB, and engine state.

| Check | What to look for |
|---|---|
| `localStorage['ielts-settings']` | Legacy settings object (partial migration to `@ielts/settings`) |
| `localStorage['tutor-memory-*']` | Tutor memory state, chat history |
| `IndexedDB > ielts-journey > aiContents` | Learning events table |
| `Engine bootstrap console` | `initializeAITutorEngine()` / `initializeLearningEngine()` — check for null engines |

Run `JSON.parse(localStorage.getItem('ielts-settings'))` in the browser console to inspect settings.

## AI Calls

All AI calls go through `@ielts/ai`'s `callAI()` or engine wrappers. Never direct `fetch()`.

| Check | What to look for |
|---|---|
| `apiKey` presence | Check Settings UI or `localStorage` for stored API key |
| `callAI` responses | Inspect network tab for calls to configured provider endpoint |
| `AICallResult` | `{ content, error }` — if `error` is non-null, the call failed |
| `AIConfigError` | API key not configured. Shows in Settings as "Add your AI API key" |
| `AIRateLimitError` | Too many requests. Wait and retry. |
| `AIAuthError` | Invalid API key. Check in Settings. |

## IndexedDB

Database name: `ielts-journey` (Dexie wrapper).

Open **Browser DevTools > Application > IndexedDB > ielts-journey** to inspect:
- Table names match `tableSchemas` keys in `packages/storage/src/schema.ts`
- Check specific tables: `vocabulary`, `mistakes`, `aiContents`, `readingSessions`, etc.
- Migration version is tracked in the database schema version.

## Extension

- **Service worker console**: `chrome://extensions` > Find IELTS Journey > "Inspect views: Service Worker"
- **Content script console**: Open a page where the extension runs > Right-click > Inspect > Console (filter by `[IELTS]`)
- **Context invalidation**: If extension context is invalidated, the `safe-chrome.ts` wrappers catch errors. Reload the extension from `chrome://extensions`.
- **Popup debugging**: Right-click the extension icon > "Inspect popup"

## Learning Events

Events are stored in the `aiContents` table in IndexedDB. Each event has a `type` field matching `SharedLearningEventType`. Query with:

```javascript
const db = await idb.openDB('ielts-journey', 1)
const events = await db.getAll('aiContents')
console.table(events.filter(e => e.type === 'exercise_completed'))
```

## Migration Failures

- `initDb` in `@ielts/storage` includes retry logic for failed migrations.
- Check browser console for Dexie `VersionError` or migration callback errors.
- If data loss is suspected, inspect the IndexedDB before migration and after. Export via the Import/Export feature if available.

## Common Issues

| Symptom | Likely cause |
|---|---|
| Blank screen in web app | DB init error → check `initError` state in console |
| Settings not saving | `localStorage` quota exceeded (5 MB). Clear old data. |
| AI not responding | API key missing or invalid. Check provider settings. |
| PWA not installing | Must serve over HTTPS or localhost. Check service worker registration. |
| Capacitor build failure | Check native dependencies match iOS 16+ / Android API 26+ requirements. |
