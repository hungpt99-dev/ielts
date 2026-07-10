# ADR 003: Local-First Persistence via Dexie/IndexedDB

## Status
Accepted

## Context
The YouTube Learning feature must store user study data (vocabulary, notes, sessions, exercises, recordings). The existing IELTS Journey application already uses Dexie over IndexedDB with Zod validation.

## Decision
All YouTube Learning data is stored in the same Dexie database using the existing infrastructure:
- New tables are added via versioned migration (v8)
- Zod schemas validate all data at the repository boundary
- The existing `BaseRepository` pattern is used for all CRUD operations
- Extension-specific data (panel state, active session) uses chrome.storage.local
- Communication with the web app's Dexie DB is bridged through `window.__IELTS_BRIDGE__`

## Consequences
- Existing user data is preserved through migration (no data loss)
- The same backup/export/import system covers YouTube data
- Schema validation catches data corruption at write time
- Extension ↔ web app data sharing requires bridge protocol (intentional design choice to avoid direct Dexie access from content scripts)
- Audio recordings use a separate retention policy and storage mechanism
