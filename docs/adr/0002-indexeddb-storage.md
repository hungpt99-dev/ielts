# ADR 0002: IndexedDB for Persistent Storage

**Date:** 2026-07-01
**Status:** Accepted
**Decision:** Use IndexedDB (via the `idb` wrapper library and Dexie) as the primary local database for structured user data.

---

## Context

We need a client-side database that can:
- Store structured, relational data (vocabulary, sessions, mistakes, etc.)
- Support indexing and queries
- Persist across browser sessions
- Handle large datasets (thousands of vocabulary words)
- Work offline without any network

### Options Considered

1. **localStorage** — Synchronous, simple, but limited to ~5MB, no indexing
2. **IndexedDB** — Async, large storage, indexed queries, widely supported
3. **SQLite via WebAssembly** — Full SQL, but large bundle size, complex
4. **OPFS (Origin Private File System)** — Newer API, less browser support

## Decision

Use **IndexedDB** with both `idb` (low-level wrapper) and Dexie (higher-level wrapper):

- **Dexie** for the main application — cleaner API, built-in versioning, index management
- **`idb`** for utility functions in shared packages

### Implementation

- Database name: `ielts-journey`
- Single database with multiple object stores (one per entity type)
- Versioned schema migrations in `migrations.ts`
- Repository pattern for all data access
- Zod validation at write boundaries

## Consequences

### Positive

- **Large storage capacity:** Typically 60%+ of available disk
- **Indexed queries:** Fast lookups by any indexed field
- **Async API:** Non-blocking operations
- **Wide browser support:** All modern browsers
- **Structured storage:** Object stores with key-value semantics
- **Transactional:** Atomic read/write operations

### Negative

- **Complex API:** Raw IndexedDB is verbose — mitigated by Dexie wrapper
- **Origin-bound:** Cannot share between extension and website directly
- **Async-only:** More complex code than synchronous localStorage
- **Browser eviction:** Under storage pressure, browser may delete data
- **No built-in encryption:** Data stored as-is in browser

## Storage Strategy

| Data Type | Storage | Reason |
|-----------|---------|--------|
| Structured learning data | IndexedDB | Large, indexed, relational |
| App settings | localStorage | Small, synchronous access needed |
| AI cache | IndexedDB / localStorage | Temporary, can be regenerated |

## Related

- [ADR 0001: Local-First, No Backend](0001-local-first-no-backend.md)
- [Storage Design](../storage-design.md)
