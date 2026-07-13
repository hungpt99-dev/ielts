# Storage Troubleshooting

## Migration Failure

- **Symptom**: `VersionError` in console, database not opening, blank screen.
- **Check**: Console for Dexie migration errors. Look for `initDb` retry logs.
- **Cause**: Schema version mismatch. The `initDb` function in `@ielts/storage` runs migration callbacks for each version increment.
- **Fix**: Clear IndexedDB for `ielts-journey` in DevTools > Application > IndexedDB > `ielts-journey` > "Delete database". Reload.
- **Prevention**: Every schema change in `tableSchemas` must have a corresponding migration version and callback.

## Duplicate Entries

- **Symptom**: Same exercise or vocabulary entry appearing multiple times.
- **Check**: Are migrations idempotent? Each migration callback should check for existing data before inserting.
- **Check**: `Dexie.put()` (upsert) vs `Dexie.add()` (insert). Use `put()` with stable IDs for idempotency.
- **Prevention**: Repositories should use `put()` with a deterministic ID.

## Data Not Persisting

- **Symptom**: Data disappears after page reload.
- **Check**: `Dexie.transaction` scope — did the transaction complete? If an error occurs within a transaction, all changes are rolled back.
- **Check**: Are you writing to IndexedDB or in-memory store? Some engine tests use in-memory repositories.
- **Check**: Service worker may be serving a stale page. Hard-reload (Cmd+Shift+R).
- **Check**: `localStorage` for settings — IndexedDB is for learning data, localStorage is for settings. Don't confuse the two.

## Export/Import Validation Errors

- **Symptom**: Imported data fails Zod validation.
- **Check**: The `importData` function validates entries against `tableSchemas`. If the schema has changed since export, entries may fail.
- **Fix**: Re-export data after migration. Or update import validation to accept old schema versions.
- **Prevention**: Include a schema version in the export format.
