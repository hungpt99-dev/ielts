# Import / Export

## Overview

Data can be exported from and imported to the IndexedDB database. This enables backup, restore, and migration between devices.

## Export

**`exportAllData()`** (`packages/storage/src/backup.ts`):

- Reads all 47 tables and returns an `AppBackupData` object.
- Each table's data is serialised in the export payload.
- Returns a typed structure ready for JSON serialisation.

Usage:
```typescript
import { exportAllData } from '@ielts/storage'

const backup = await exportAllData()
const json = JSON.stringify(backup)
// Save to file or transfer
```

## Import

**`importBackup(data, mode)`** (`packages/storage/src/backup.ts`):

| Parameter | Type | Description |
|---|---|---|
| `data` | `AppBackupData` | The exported data structure |
| `mode` | `ImportMode` | `'merge'` or `'replace'` |

**`ImportMode`**:
- `'merge'`: inserts data, skipping existing IDs (idempotent).
- `'replace'`: clears all tables before importing.

Returns `ImportSummary` with counts of inserted, skipped, and failed records.

## Clear Tables

**`clearAllTables()`**: wipes all data from every table. Destructive — no confirmation.

## Data Shape

`AppBackupData` contains all tables from the current schema version. Each table's records are included as an array. The shape evolves with schema versions — exports from older versions may have fewer tables (missing v5+ tables).

## Export Scope

- IndexedDB data only (47 tables).
- Does **not** include localStorage data (settings, tutor memory, chat messages).
- Does **not** include extension chrome.storage data.
- To fully back up, users must separately persist settings (stored in localStorage).

## Current Limitations

- No incremental export — always a full snapshot.
- No compression — large vocabularies produce sizeable JSON.
- No cloud backup — export is user-initiated and client-side only.
- Import does not migrate schema — the database must already be at the target version.
