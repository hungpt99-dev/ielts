# AiCache Analysis & Improvement Plan

## Current Implementation

**File:** `packages/ai/src/utils/cache.ts`

A lightweight in-memory cache with TTL-based expiry:

| Feature | Status |
|---|---|
| Generic type support (`T = unknown`) | ✅ |
| TTL expiry (checked on `get`) | ✅ |
| `get`/`set`/`clear`/`size` API | ✅ |
| Test coverage | ✅ (7 tests in `utils.test.ts`) |

**Current consumers:**
- `aiExplainCache` — module-level `AiCache<AiExplainResult>` singleton in `explain.ts` (default 60min TTL)
- `DictionaryCache` — wrapper class in `dictionary.ts` that adds context-aware key derivation (`word|context[:80]`), 30min TTL

## Gaps for Production Readiness

### 1. Unbounded memory growth
No `maxSize` limit. Cache grows indefinitely — risks OOM under sustained usage.

### 2. No eviction policy
Only TTL-based removal. No LRU/LF U eviction for entries that outlive their TTL within a full cache.

### 3. No stale-while-revalidate
Entries are hard-expired on TTL breach. No pattern to serve stale data while fetching fresh in background.

### 4. No periodic background cleanup
Expired entries are only purged on `get()` access. Entries never accessed post-TTL remain in memory.

### 5. No observability
No hit/miss counters, eviction events, or metrics hooks. Cannot monitor cache effectiveness in production.

### 6. No async compute-on-miss helper
Consumers manually repeat the full check-then-fetch pattern:

```ts
const cached = cache.get(key)
if (cached) return { data: cached, error: null }
// ... fetch, validate, cache.set(...), return
```

### 7. No TTL per-key override
Single `ttlMs` applies to all entries. Some data (e.g., dictionary) could use shorter TTL than explanations.

### 8. No cache key validation
Keys are raw strings. Long or non-deterministic keys (e.g., full text as key in `explain.ts`) inflate memory.

### 9. No persistence
Cache is lost on process restart. Cold starts always miss.

### 10. No stale-hit atomicity
No locking for cache stampede protection on concurrent misses for the same key.

## Recommended Improvements

| Priority | Change | Rationale |
|---|---|---|
| **P0** | Add `maxSize` + LRU eviction | Prevent OOM; predictable memory footprint |
| **P0** | Background TTL sweeper (periodic `setInterval` cleanup) | Release memory without requiring `get` calls |
| **P1** | Stale-while-revalidate pattern | Serve degraded results instead of errors during re-fetch |
| **P1** | Hit/miss/eviction counters | Observability for tuning and monitoring |
| **P1** | Static `getOrFetch(key, ttl, fetcher)` helper | Eliminate repetitive check-then-fetch boilerplate |
| **P2** | Per-key TTL override in `set(key, data, ttl?)` | Fine-grained control per entry type |
| **P2** | Key hash normalization (e.g., SHA-256 for long keys) | Deterministic key sizing for text-heavy inputs |
| **P2** | Configurable eviction listeners / events | Pluggable telemetry or logging |
| **P3** | Optional persistence layer (IndexedDB/file) | Cold-start warmup |
| **P3** | Cache stampede protection (dedup concurrent same-key fetches) | Avoid redundant AI calls under load |

## Design Constraints

- Must remain **synchronous** for the `get`/`set` path (the Map store is sync; persistence is an opt-in layer on top).
- Must not introduce external dependencies beyond `packages/ai` (no Redis, no new npm packages).
- `DictionaryCache` wrapper (key derivation) should remain separate — its concern is key strategy, not cache mechanics.
- Existing `AiCache` tests must continue passing; new features should have dedicated test blocks.
