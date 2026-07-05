# AI Generate Result Cache — Interface & Integration Design

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Design Goals](#2-design-goals)
3. [Architecture Overview](#3-architecture-overview)
4. [Cache Interface](#4-cache-interface)
5. [In-Memory Implementation (CacheStore)](#5-in-memory-implementation-cachestore)
6. [Key Generation Strategy](#6-key-generation-strategy)
7. [Concurrency Safety](#7-concurrency-safety)
8. [Cache Invalidation](#8-cache-invalidation)
9. [Observability](#9-observability)
10. [Integration Patterns](#10-integration-patterns)
11. [Service Integration Plan](#11-service-integration-plan)
12. [Migration Strategy](#12-migration-strategy)
13. [Error Handling & Edge Cases](#13-error-handling--edge-cases)
14. [Usage Examples](#14-usage-examples)

---

## 1. Problem Statement

The current `AiCache<T>` (`packages/ai/src/utils/cache.ts`) is a simple in-memory `Map`-based cache with TTL expiry. It lacks:

- **Abstract interface** — consumers couple directly to `Map`-backed implementation
- **Max size / eviction** — unbounded growth risks OOM
- **Concurrency safety** — no stampede protection for concurrent same-key misses
- **Standardized key derivation** — each consumer invents its own key format
- **Observability** — no metrics (hits, misses, evictions)
- **Per-key TTL** — single TTL for all entries
- **Periodic cleanup** — expired entries linger until accessed
- **Boilerplate elimination** — every consumer repeats `get → if null → fetch → set`

---

## 2. Design Goals

| Goal | Priority | Rationale |
|------|----------|-----------|
| Abstract `Cache` interface (swap backends) | P0 | Decouple consumers from implementation |
| Max size + LRU eviction | P0 | Prevent OOM in long-running processes |
| Request coalescing (stampede protection) | P0 | Avoid redundant AI calls on concurrent misses |
| Standardized key derivation with hash normalization | P0 | Deterministic, bounded key sizes |
| `getOrFetch` helper | P0 | Eliminate repetitive check-then-fetch boilerplate |
| Per-key TTL override in `set` | P1 | Fine-grained control per service type |
| Background TTL sweeper | P1 | Release memory without requiring `get` calls |
| Hit/miss/eviction counters | P1 | Observability for tuning |
| Stale-while-revalidate | P2 | Serve stale data during background refresh |
| Persistence layer | P3 | Cold-start warmup from IndexedDB / file |

All P0 items must ship together — they form the minimal production-ready cache.

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     Cache Consumer (Service)                      │
│  generateVocabularyFromTranscript(sentence, getConfig)            │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Cache Integration Layer                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              createServiceCache<T>(options)                   │ │
│  │  ┌──────────┐  ┌──────────────────┐  ┌───────────────────┐  │ │
│  │  │ Key      │  │ getOrFetch()     │  │ RequestCoalescer  │  │ │
│  │  │ Deriver  │  │ (auto check →    │  │ (dedup concurrent │  │ │
│  │  │          │  │  fetch → set)    │  │  same-key calls)  │  │ │
│  │  └──────────┘  └──────────────────┘  └───────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Cache Interface (abstract)                     │
│  get<T>(key): T | null                                           │
│  set<T>(key, value, ttl?): void                                  │
│  has(key): boolean                                                │
│  delete(key): boolean                                             │
│  clear(): void                                                    │
│  size: number                                                     │
│  stats: CacheStats                                                │
└──────────────────────────┬───────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌──────────────────────┐   ┌──────────────────────────┐
│   InMemoryStore      │   │   Future: PersistentStore │
│  (Map + LRU + TTL    │   │  (IndexedDB / SQLite)    │
│   sweeper + stats)   │   │                          │
└──────────────────────┘   └──────────────────────────┘
```

---

## 4. Cache Interface

```typescript
// packages/ai/src/cache/types.ts

export interface CacheEntry<T> {
  data: T
  createdAt: number
  ttl: number | null  // null = no expiry
}

export interface CacheStats {
  hits: number
  misses: number
  evictions: number
  size: number
  maxSize: number
}

export interface Cache<T = unknown> {
  /** Retrieve a value. Returns null if missing or expired. */
  get(key: string): T | null

  /** Store a value. Default TTL from constructor, override per-key with ttlMs. */
  set(key: string, value: T, ttlMs?: number): void

  /** Check existence without extending lifetime. */
  has(key: string): boolean

  /** Remove a single entry. Returns true if existed. */
  delete(key: string): boolean

  /** Remove all entries. */
  clear(): void

  /** Current number of entries. */
  get size(): number

  /** Snapshot of cache telemetry. */
  get stats(): CacheStats
}
```

### Design Rationale

- **Generic `Cache<T>` interface** — one implementation can serve all types (we cast internally). Consumers type their local reference, e.g. `Cache<DictionaryEntry>`.
- **`ttlMs` on `set()`** — per-key override. `undefined` = use store default.
- **`has()`** — cheap existence check without promoting LRU order or returning data.
- **`stats`** — observable metrics without coupling to a specific monitoring library.
- **No `async` on get/set** — the sync path is the hot path. Async persistence is an opt-in wrapper.

---

## 5. In-Memory Implementation (CacheStore)

```typescript
// packages/ai/src/cache/store.ts

interface CacheStoreOptions {
  /** Maximum number of entries. 0 = unlimited. Default: 500 */
  maxSize?: number
  /** Default TTL in ms. Default: 60 * 60 * 1000 (1 hour) */
  defaultTtlMs?: number
  /** Background cleanup interval in ms. 0 = disabled. Default: 60_000 (1 min) */
  cleanupIntervalMs?: number
}

class CacheStore<T = unknown> implements Cache<T> {
  constructor(options?: CacheStoreOptions)

  // Cache<T> implementation
  get(key: string): T | null
  set(key: string, value: T, ttlMs?: number): void
  has(key: string): boolean
  delete(key: string): boolean
  clear(): void
  get size(): number
  get stats(): CacheStats
}
```

### Internal Data Structure

```typescript
// Linked-list node for LRU tracking
interface LruNode {
  key: string
  prev: LruNode | null
  next: LruNode | null
}

class CacheStore<T> implements Cache<T> {
  private store: Map<string, CacheEntry<T>>   // primary data
  private lruHead: LruNode | null = null       // most recently used
  private lruTail: LruNode | null = null       // least recently used
  private lruNodes: Map<string, LruNode>       // node lookup

  private _hits = 0
  private _misses = 0
  private _evictions = 0
  private _maxSize: number
  private _defaultTtlMs: number
  private _cleanupTimer: ReturnType<typeof setInterval> | null = null
}
```

### LRU Eviction

```
get(key):
  1. Look up store → if missing → miss++
  2. If expired → delete entry, miss++ → return null
  3. Promote key to head of LRU list
  4. hit++ → return data

set(key, value, ttlMs):
  1. If key exists → update in place, promote to LRU head
  2. If at maxSize → evict LRU tail → evictions++
  3. Prepend new node at LRU head
  4. Store entry with ttlMs (or default)
```

### Background Cleanup Sweeper

```typescript
private startCleanup(): void {
  this._cleanupTimer = setInterval(() => {
    for (const [key, entry] of this.store) {
      if (entry.ttl !== null && Date.now() - entry.createdAt > entry.ttl) {
        this.store.delete(key)
        this.removeLruNode(key)
      }
    }
  }, this._cleanupIntervalMs)
}
```

---

## 6. Key Generation Strategy

### Problem

Current keys in `explain.ts` use `"${type}:${text}"` — the full user text as part of the key. This is:
- **Unbounded** — AI service calls accept arbitrarily long passages
- **Non-deterministic** — whitespace/encoding differences create cache misses for semantically identical input
- **Slow** — long strings slow `Map` lookups

### Solution: `CacheKey` Deriver

```typescript
// packages/ai/src/cache/key.ts

export interface CacheKeyOptions {
  /** Prefix for namespacing (e.g. "explain", "dictionary") */
  prefix: string
  /** Components that form the cache key (will be joined, hashed) */
  parts: (string | number | undefined)[]
  /** Optional suffix for sub-type differentiation (e.g. explain type) */
  suffix?: string
}

/**
 * Generate a deterministic, bounded cache key.
 *
 * All parts are joined with '|', then hashed to a fixed-length hex string.
 * The prefix + suffix remain in plain text for debuggability.
 *
 * Format:  `{prefix}:{hash}:{suffix?}`
 * Example: `explain:a1b2c3d4e5f6:ielts-vocab`
 */
export function buildCacheKey(options: CacheKeyOptions): string {
  const { prefix, parts, suffix } = options

  // Filter out undefined parts, normalize whitespace, truncate individual parts to 200 chars
  const normalized = parts
    .filter((p): p is string | number => p !== undefined && p !== null)
    .map((p) => String(p).trim().slice(0, 200))
    .join('|')

  // Simple fast hash (djb2) — deterministic, no external deps
  const hash = fastHash(normalized).toString(36)

  return suffix ? `${prefix}:${hash}:${suffix}` : `${prefix}:${hash}`
}

/** djb2 hash — fast, deterministic, no collisions for cache-key scale (N < 1e6) */
function fastHash(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit int
  }
  return Math.abs(hash)
}
```

### Key Formats by Service

| Service | Prefix | Parts | Suffix | Example Key |
|---------|--------|-------|--------|-------------|
| `explain` | `explain` | `[text]` | `type` | `explain:a1b2c3:ielts-vocab` |
| `dictionary` | `dictionary` | `[word, context]` | — | `dictionary:f9e8d7` |
| `vocab-details` | `vocab` | `[word, context?]` | — | `vocab:b4c5d6` |
| `vocab-quiz` | `vocab-quiz` | `[word, context?]` | — | `vocab-quiz:e3f4g5` |
| `article-questions` | `article` | `[content]` | — | `article:h2i3j4` |
| `summary` | `summary` | `[transcript]` | — | `summary:k5l6m7` |
| `listening-questions` | `listening` | `[transcript]` | — | `listening:n7o8p9` |
| `shadowing` | `shadowing` | `[transcript]` | — | `shadowing:q1r2s3` |

### Collision Handling

djb2 is sufficient for cache-key scale (N < 1M entries). A collision would mean two different inputs produce the same cache key → stale data served. Mitigations:

1. **Prefix isolation** — collisions across services are impossible since prefixes differ
2. **Within a prefix**, collision probability for N=10,000 entries is ~10⁻⁶ (birthday problem on 32-bit space)
3. If collision risk becomes unacceptable, upgrade to `SHA-256` via Web Crypto API (loses determinism but eliminates collisions)

---

## 7. Concurrency Safety

### 7.1 Cache Stampede Problem

When multiple async operations request the same uncached key simultaneously, they all fetch from the AI provider concurrently — wasting quota and increasing latency.

```
Time ──────────────────────────────────────────────►
A: get(key) → miss → fetch AI API ─────────────────→ set(key) → return
B: get(key) → miss → fetch AI API ─────────────────→ set(key) → return  ❌ redundant
```

### 7.2 Solution: Request Coalescing

```typescript
// packages/ai/src/cache/coalescer.ts

class RequestCoalescer {
  private inflight: Map<string, Promise<unknown>> = new Map()

  /**
   * Execute `fetcher` exactly once for concurrent callers of the same key.
   * Subsequent callers receive the same promise.
   * On failure, the entry is removed so future callers retry.
   */
  async coalesce<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key)
    if (existing) return existing as Promise<T>

    const promise = fetcher().finally(() => {
      this.inflight.delete(key)
    })

    this.inflight.set(key, promise)
    return promise
  }
}
```

### 7.3 Integration in Service Cache Helper

```typescript
// Simplified flow inside getOrFetch:

async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T | null> {
  // 1. Check cache
  const cached = cache.get(key)
  if (cached !== null) return cached

  // 2. Coalesce concurrent same-key requests
  return coalescer.coalesce(key, async () => {
    // 3. Double-check cache (another caller may have populated it)
    const cached = cache.get(key)
    if (cached !== null) return cached

    // 4. Fetch
    const result = await fetcher()

    // 5. Store (only if fetch succeeded)
    if (result !== null) {
      cache.set(key, result)
    }

    return result
  })
}
```

The **double-check** inside the coalesced callback handles the edge case where the winning caller completes and another caller's promise has already resolved — though with `finally` removing the inflight entry, this is more of a defense-in-depth measure.

---

## 8. Cache Invalidation

### 8.1 Automatic Invalidation

| Mechanism | Trigger | Granularity |
|-----------|---------|-------------|
| TTL expiry | Time since `set()` exceeds entry TTL | Per-entry |
| LRU eviction | Store reaches `maxSize`, oldest entry removed | Per-entry (LRU tail) |
| Background sweeper | Periodic timer (default 60s) removes expired entries | Bulk over all entries |

### 8.2 Manual Invalidation

```typescript
// Single entry
cache.delete(key)

// Namespace-based (for service-level purge)
cache.clear()  // or future: cache.clearByPrefix(prefix)
```

### 8.3 Stale-While-Revalidate (P2)

```typescript
/**
 * Returns cached data immediately if available (even if expired),
 * then re-fetches in background and updates the cache.
 */
async function getOrFetchWithStale<T>(
  key: string,
  fetcher: () => Promise<T>,
  staleTtlMs: number,  // extra TTL beyond normal TTL during which stale is served
): Promise<T | null> {
  const entry = cache.getEntry(key)  // internal: returns raw CacheEntry, not null on expiry
  if (entry) {
    const age = Date.now() - entry.createdAt
    if (age <= entry.ttl!) return entry.data  // fresh

    if (age <= entry.ttl! + staleTtlMs) {
      // Stale but within stale window — serve stale + revalidate in background
      fetcher().then((fresh) => {
        if (fresh !== null) cache.set(key, fresh)
      }).catch(() => { /* stale data was already served; background failure is non-critical */ })
      return entry.data
    }
  }

  // Fully expired or missing — await fresh data
  const fresh = await fetcher()
  if (fresh !== null) cache.set(key, fresh)
  return fresh
}
```

### 8.4 Cache Busting

For cases where the user explicitly requests a fresh AI response (e.g., "regenerate"):

```typescript
function buildCacheKey(options: CacheKeyOptions): string {
  // ... existing logic ...

  // If a version/bust token is provided, it changes the hash
  if (options.version) {
    normalized = `${normalized}|v${options.version}`
  }

  return `${prefix}:${hash}:${suffix ?? ''}`
}
```

Usage: `buildCacheKey({ prefix: 'explain', parts: [text], suffix: type, version: '2' })`

---

## 9. Observability

```typescript
interface CacheStats {
  hits: number
  misses: number
  evictions: number
  size: number
  maxSize: number
  /** Hit rate = hits / (hits + misses) or 1 if no requests */
  hitRate: number
}
```

### Integration with Service Logging

The `getOrFetch` helper can accept an optional logger or metrics callback:

```typescript
async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttlMs?: number
    onHit?: (key: string) => void
    onMiss?: (key: string) => void
  },
): Promise<T | null>
```

But for simplicity, the **store-level** `stats` getter is sufficient — service code reads it at request boundaries.

---

## 10. Integration Patterns

### 10.1 Decorator Pattern: `createServiceCache`

Each service gets a scoped cache instance with the right defaults:

```typescript
// packages/ai/src/cache/service-cache.ts

import { CacheStore } from './store'
import { Cache } from './types'
import { RequestCoalescer } from './coalescer'
import { buildCacheKey, CacheKeyOptions } from './key'

export interface ServiceCacheOptions {
  maxSize?: number
  defaultTtlMs?: number
  cleanupIntervalMs?: number
}

export interface ServiceCache<T> {
  cache: Cache<T>
  getOrFetch(
    keyOptions: Omit<CacheKeyOptions, 'prefix'>,
    fetcher: () => Promise<{ data: T | null; error: string | null }>,
  ): Promise<{ data: T | null; error: string | null }>
  clear(): void
  stats: CacheStats
}

export function createServiceCache<T>(
  prefix: string,
  options?: ServiceCacheOptions,
): ServiceCache<T> {
  const cache = new CacheStore<T>({
    maxSize: options?.maxSize ?? 500,
    defaultTtlMs: options?.defaultTtlMs ?? 60 * 60 * 1000,
    cleanupIntervalMs: options?.cleanupIntervalMs ?? 60_000,
  })
  const coalescer = new RequestCoalescer()

  return {
    cache,

    async getOrFetch(
      keyOptions: Omit<CacheKeyOptions, 'prefix'>,
      fetcher: () => Promise<{ data: T | null; error: string | null }>,
    ): Promise<{ data: T | null; error: string | null }> {
      const key = buildCacheKey({ prefix, ...keyOptions })

      // 1. Check cache
      const cached = cache.get(key)
      if (cached !== null) return { data: cached, error: null }

      // 2. Coalesce concurrent same-key requests
      return coalescer.coalesce(key, async () => {
        // 3. Double-check cache
        const cached = cache.get(key)
        if (cached !== null) return { data: cached, error: null }

        // 4. Fetch
        const result = await fetcher()

        // 5. Store on success
        if (result.data !== null) {
          cache.set(key, result.data, keyOptions.suffix ? undefined : options?.defaultTtlMs)
        }

        return result
      })
    },

    clear: () => cache.clear(),

    get stats() {
      return cache.stats
    },
  }
}
```

### 10.2 Per-Service Configuration

| Service | Prefix | maxSize | defaultTtlMs | Notes |
|---------|--------|---------|--------------|-------|
| `explain` | `explain` | 500 | 60 min | Full text key, type suffix |
| `dictionary` | `dictionary` | 1000 | 30 min | Word + context key |
| `vocabulary-details` | `vocab` | 500 | 60 min | |
| `vocabulary-quiz` | `vocab-quiz` | 200 | 30 min | Quizzes change less frequently |
| `article-questions` | `article` | 300 | 60 min | |
| `summary` | `summary` | 300 | 60 min | |
| `listening-questions` | `listening` | 300 | 60 min | |
| `shadowing` | `shadowing` | 300 | 60 min | |

---

## 11. Service Integration Plan

### 11.1 Migration: `services/explain.ts`

```typescript
// BEFORE
const cacheKey = `${type}:${text}`
const cached = aiExplainCache.get(cacheKey)
if (cached) return { data: cached, error: null }
// ... fetch ...
aiExplainCache.set(cacheKey, result.data as AiExplainResult)

// AFTER
const result = await explainCache.getOrFetch(
  { parts: [text], suffix: type },
  async () => {
    const { systemPrompt, userPrompt } = buildExplainPrompt(type, text)
    const { content, error } = await callAI(systemPrompt, userPrompt, getConfig)
    if (error) return { data: null, error }
    return parseAndValidate<AiExplainResult>(content!, typeSchemas[type])
  },
)
```

### 11.2 Migration: `services/dictionary.ts`

```typescript
// BEFORE
const cached = dictionaryCache.get(selectedWord, contextSentence)
if (cached) return { data: cached, error: null }
// ... fetch ...
dictionaryCache.set(selectedWord, contextSentence, result.data)

// AFTER
const result = await dictionaryServiceCache.getOrFetch(
  { parts: [selectedWord, contextSentence] },
  async () => {
    const { systemPrompt, userPrompt } = buildDictionaryEntryPrompt(selectedWord, contextSentence)
    const { content, error } = await callAI(systemPrompt, userPrompt, getConfig, {
      maxTokens: 800,
      temperature: 0.3,
    })
    if (error) return { data: null, error }
    return parseAndValidate(content!, dictionaryEntrySchema)
  },
)
```

### 11.3 Migration for All Video Services

All four video services (`generateVocabularyFromTranscript`, `generateSummaryFromTranscript`, `generateListeningQuestions`, `generateShadowingScripts`) follow the same pattern:

```typescript
// BEFORE (example: generateVocabularyFromTranscript)
const { content, error } = await callAI(systemPrompt, userPrompt, getConfig, { ... })
if (error) return { data: null, error }
return parseAndValidate(content!, transcriptVocabularySchema)

// AFTER
return transcriptVocabCache.getOrFetch(
  { parts: [transcript] },
  async () => {
    const { content, error } = await callAI(systemPrompt, userPrompt, getConfig, { ... })
    if (error) return { data: null, error }
    return parseAndValidate(content!, transcriptVocabularySchema)
  },
)
```

### 11.4 Services That Should NOT Be Cached

- **`generateVocabularyDetails`** — uses direct `fetch()` (legacy). Cache only if migrated to `callAI()` first.
- **`generateArticleQuestions`** — article content is typically unique per request. Cache if repeat calls with same article are expected.
- **`generateVocabularyQuiz`** — quiz generation benefits from variety; caching may reduce diversity. Cache with shorter TTL (30min) and only for identical inputs.

---

## 12. Migration Strategy

### Phase 1: Create Cache Module (backward-compatible)

Add new files under `packages/ai/src/cache/`:
- `types.ts` — `Cache`, `CacheEntry`, `CacheStats` interfaces
- `store.ts` — `CacheStore` implementation (LRU + TTL + sweeper + stats)
- `key.ts` — `buildCacheKey`, `CacheKeyOptions`, `fastHash`
- `coalescer.ts` — `RequestCoalescer`
- `service-cache.ts` — `createServiceCache<T>()` factory
- `index.ts` — barrel export

Existing `AiCache` class remains untouched — all existing tests continue to pass.

### Phase 2: Migrate Services One by One

Each service:
1. Replace module-level `AiCache` instance with `createServiceCache<T>(prefix, options)`
2. Replace inline `get → fetch → set` with `getOrFetch`
3. Update key generation from manual strings to `buildCacheKey`
4. Verify existing tests pass

Order: `dictionary.ts` → `explain.ts` → video services → remaining.

### Phase 3: Deprecate AiCache

Add `@deprecated` JSDoc to `AiCache`. Remove after all consumers migrated.

---

## 13. Error Handling & Edge Cases

### 13.1 Fetcher Returns Error

```typescript
// getOrFetch handles this naturally:
const result = await fetcher()
// result = { data: null, error: 'API key not configured.' }
if (result.data !== null) {
  cache.set(key, result.data)  // skipped — error path, nothing to cache
}
return result  // error propagated to caller
```

**Decision:** Only cache successful results. Errors are never cached — same input can succeed on retry.

### 13.2 Fetcher Throws

The `RequestCoalescer` wraps the promise with `.finally()` that removes the inflight entry. If the fetcher throws, the error propagates to all concurrent callers, and the next request (outside the coalescer) will retry fresh.

### 13.3 Cache Store Internal Error

`CacheStore.get/set/has/delete` are pure Map operations — no I/O, no throws. If a malformed key is passed, `buildCacheKey` handles it by normalizing/truncating. `CacheStore` methods should not throw for normal usage.

### 13.4 TTL Overflow / Clock Skew

`Date.now()` is monotonic-enough for most environments. If system clock jumps backward, entries may live longer than intended but won't serve expired data (createdAt > now would produce a negative age, which is treated as expired). No special handling needed.

### 13.5 Stale-While-Revalidate Background Failure

The stale-while-revalidate pattern runs the fetcher in a `.then()` without `await`. If the background fetch fails:
- The stale data remains served (the cache is not updated)
- The error is silently caught — the stale data is still valid for the user
- A future request will trigger a fresh foreground fetch

---

## 14. Usage Examples

### 14.1 Creating a Service Cache

```typescript
import { createServiceCache } from '../cache'

const dictionaryCache = createServiceCache<DictionaryEntry>('dictionary', {
  maxSize: 1000,
  defaultTtlMs: 30 * 60 * 1000,  // 30 minutes
})
```

### 14.2 Using getOrFetch

```typescript
export async function generateDictionaryEntry(
  selectedWord: string,
  contextSentence: string,
  getConfig: () => ProviderConfig,
): Promise<{ data: DictionaryEntry | null; error: string | null }> {
  return dictionaryCache.getOrFetch(
    { parts: [selectedWord, contextSentence] },
    async () => {
      const config = getConfig()
      if (!config.apiKey) {
        return { data: null, error: 'API key not configured.' }
      }
      const { systemPrompt, userPrompt } = buildDictionaryEntryPrompt(selectedWord, contextSentence)
      const { content, error } = await callAI(systemPrompt, userPrompt, getConfig, {
        maxTokens: 800,
        temperature: 0.3,
      })
      if (error) return { data: null, error }
      return parseAndValidate(content!, dictionaryEntrySchema)
    },
  )
}
```

### 14.3 Cache Stats

```typescript
// After many requests:
console.log(dictionaryCache.stats)
// { hits: 42, misses: 8, evictions: 0, size: 8, maxSize: 1000, hitRate: 0.84 }
```

### 14.4 Manually Clearing Cache

```typescript
// Force clear for testing or user-facing "clear cache" action
dictionaryCache.clear()
```

### 14.5 Regenerate (Cache Bust)

```typescript
// When user requests fresh explanation:
const result = await explainCache.getOrFetch(
  { parts: [text], suffix: type, version: Date.now().toString() },
  async () => { /* ... */ },
)
```

---

## Appendix A: File Structure After Implementation

```
packages/ai/src/
├── cache/
│   ├── index.ts              # barrel export
│   ├── types.ts              # Cache, CacheEntry, CacheStats interfaces
│   ├── store.ts              # CacheStore implementation (LRU + TTL + sweeper)
│   ├── key.ts                # buildCacheKey, fastHash
│   ├── coalescer.ts          # RequestCoalescer
│   └── service-cache.ts      # createServiceCache factory
├── utils/
│   ├── index.ts
│   ├── cache.ts              # LEGACY AiCache (deprecated, kept for backward compat)
│   └── response.ts
├── services/
│   ├── explain.ts            # ← migrated to createServiceCache
│   ├── dictionary.ts         # ← migrated to createServiceCache
│   ├── video.ts              # ← migrated to createServiceCache
│   └── ...
└── __tests__/
    ├── cache.test.ts         # CacheStore, coalescer, key tests
    └── ...
```

## Appendix B: Comparison with Current Implementation

| Aspect | Current (`AiCache`) | New (`CacheStore` + `createServiceCache`) |
|--------|-------------------|-------------------------------------------|
| Interface | Concrete class | Abstract `Cache<T>` interface |
| Memory limit | Unbounded | Configurable `maxSize` + LRU eviction |
| TTL | Single, constructor-only | Default + per-key override |
| Key generation | Manual string per service | `buildCacheKey` with hash normalization |
| Concurrency | None | Request coalescer (stampede protection) |
| Boilerplate | Manual get → check → fetch → set | Single `getOrFetch()` call |
| Background cleanup | None | Periodic sweeper (configurable interval) |
| Observability | None | `CacheStats` with hit/miss/eviction counters |
| Stale data | Hard expiry | Stale-while-revalidate (P2) |
| Persistence | None | Pluggable interface (P3) |
| Module coupling | Direct `Map` usage | Interface-based, swapable backends |
