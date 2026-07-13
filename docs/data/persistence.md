# Persistence

## Storage Mechanisms

The system uses three client-side storage mechanisms:

| Mechanism | Used For | Capacity | Async |
|---|---|---|---|
| **IndexedDB** (via Dexie) | Structured entity storage (tasks, vocabulary, mistakes, sessions, etc.) | ~GBs (browser-dependent) | Yes |
| **localStorage** | User settings, tutor memory, chat messages, proactive message state, schema version cursor | ~5-10 MB | No (sync) |
| **chrome.storage.local** | Extension settings, API key, daily progress, sync state | Unlimited (with permission) | Yes |

## IndexedDB

- Database name: `'ielts-journey'`
- Managed by Dexie wrapper in `@ielts/storage`.
- Schema defined in `APP_SCHEMA` (current version: 8).
- 47 tables total across 8 schema versions.
- `BaseRepository<T>` provides CRUD, pagination (`findAllPaginated`), query by index (`queryByIndex`), date range query, and text search for all entities.

## localStorage

Used for data that does not need structured queries or large capacity:

| Key | Data |
|---|---|
| `'ielts-settings'` | User profile and AI settings |
| `'ai-tutor-chat-memory'` | Chat snapshot (messages + metadata) |
| `'tutor-memory-{learnerId}'` | Tutor memory (weak points, patterns, etc.) |
| `'ielts-db-version'` | Schema version cursor for migration tracking |
| `'ielts-cors-proxy'` | CORS proxy configuration |
| Proactive message keys | Message state, settings, cooldowns |

## chrome.storage (Extension)

- `chrome.storage.local` stores: `extensionSettings`, `aiApiKey`, `dailyProgress`, `lastSyncTime`, `savedItems`.
- `chrome.storage.sync` stores a subset of settings (no API key) for cross-device sync.

## Persistence Pattern

Domain packages (`@ielts/learning-engine`, `@ielts/ai-tutor-engine`) define repository **ports** (interfaces). Concrete implementations are provided by consumers (the web app or extension). This keeps domain logic storage-agnostic.

```
Domain → Port (interface) ← Adapter (localStorage / IndexedDB / chrome.storage)
```
