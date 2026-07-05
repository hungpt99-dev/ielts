# AI Generate Result Cache

## Overview

`AiGenerateResultCache<T>` is an in-memory, TTL-based cache for AI-generated results. It prevents redundant API calls, protects against cache stampedes, and provides observability via hit/miss/eviction stats.

Source: `packages/ai/src/utils/generateResultCache.ts`

## API Reference

### Constructor

```typescript
const cache = new AiGenerateResultCache<T>(options?: GenerateResultCacheOptions)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ttlMs` | `number` | `3600000` (1 hour) | Default entry lifetime in milliseconds |
| `maxSize` | `number` | `1000` | Max entries before eviction (FIFO) |

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `get` | `(key: string): T \| null` | Retrieve value or `null` if missing/expired |
| `set` | `(key: string, data: T, ttlOverride?: number): void` | Store value with optional per-entry TTL |
| `getOrSet` | `(key: string, factory: () => Promise<T>, ttlOverride?: number): Promise<T>` | Get cached or fetch + store (stampede‑protected) |
| `has` | `(key: string): boolean` | Check existence without extending lifetime |
| `delete` | `(key: string): boolean` | Remove a single entry |
| `clear` | `(): void` | Remove all entries and reset stats |
| `size` | `(): number` | Number of entries currently stored |
| `stats` | `(): GenerateResultCacheStats` | Snapshot of `hits`, `misses`, `evictions`, `size` |
| `keys` | `(): string[]` | All stored keys in insertion order |
| `generateKey` (static) | `(...parts: string[]): string` | Build a colon‑separated cache key |

## Stampede Protection (`getOrSet`)

When multiple async callers request the same uncached key simultaneously, `getOrSet` deduplicates them — the factory runs once and all callers share the same promise. Failed factories are cleaned up so the next caller retries fresh.

```typescript
// Three concurrent calls — factory runs ONCE
const [a, b, c] = await Promise.all([
  cache.getOrSet('key', fetchExpensiveData),
  cache.getOrSet('key', fetchExpensiveData),
  cache.getOrSet('key', fetchExpensiveData),
])
```

## Key Generation

Use the static `generateKey` method for consistent, namespaced keys:

```typescript
const key = AiGenerateResultCache.generateKey('video-vocab', videoTitle, transcript.slice(0, 80))
// → "video-vocab:My Video:some transcript text..."

const key = AiGenerateResultCache.generateKey('explain', type, text.slice(0, 100))
// → "explain:ielts-vocab:The word 'ubiquitous' means..."
```

**Best practice:** Truncate long inputs (transcripts, articles) to avoid unbounded key strings.

## Integration Pattern

Create a module-level instance with a type parameter and appropriate TTL:

```typescript
import { AiGenerateResultCache, parseAndValidate } from '../utils'

const myCache = new AiGenerateResultCache<MyResultType>({
  ttlMs: 30 * 60 * 1000,  // 30 minutes
  maxSize: 500,
})

export async function generateSomething(
  input: string,
  getConfig: () => ProviderConfig,
): Promise<{ data: MyResultType | null; error: string | null }> {
  const cacheKey = AiGenerateResultCache.generateKey('my-service', input.slice(0, 80))

  // 1. Check cache
  const cached = myCache.get(cacheKey)
  if (cached) return { data: cached, error: null }

  // 2. Validate config
  const config = getConfig()
  if (!config.apiKey) {
    return { data: null, error: 'API key not configured.' }
  }

  // 3. Build prompt and call AI
  const { systemPrompt, userPrompt } = buildMyPrompt(input)
  const { content, error } = await callAI(systemPrompt, userPrompt, getConfig, {
    maxTokens: 2000,
    temperature: 0.4,
  })
  if (error) return { data: null, error }

  // 4. Parse and cache
  const result = parseAndValidate(content!, mySchema)
  if (result.data) myCache.set(cacheKey, result.data)
  return result
}
```

For simpler cases, use `getOrSet` to combine all steps:

```typescript
export async function generateWithOrSet(input: string): Promise<MyResultType> {
  const cacheKey = AiGenerateResultCache.generateKey('my-service', input.slice(0, 80))

  return myCache.getOrSet(cacheKey, async () => {
    const { content } = await callAI(systemPrompt, userPrompt, getConfig, opts)
    const { data } = parseAndValidate(content!, mySchema)
    if (!data) throw new Error('Validation failed')
    return data
  })
}
```

## Configuration Recommendations

| Scenario | TTL | maxSize |
|----------|-----|---------|
| Vocabulary lookup (changing) | 30 min | 1000 |
| Transcript summary (static) | 60 min | 300 |
| Listening questions (static) | 60 min | 300 |
| Quiz generation (diversity‑sensitive) | 30 min | 200 |
| Explanation (per text) | 60 min | 500 |

## Observability

Inspect cache health at any point:

```typescript
const s = myCache.stats()
// { hits: 87, misses: 13, evictions: 2, size: 11 }

const hitRate = s.hits / (s.hits + s.misses)  // 0.87
```

A declining hit rate may indicate overly short TTL or that inputs are too varied to benefit from caching.

## Cache Busting

To force a fresh AI generation (e.g., "regenerate" button), include a uniqueness token in the key:

```typescript
const cacheKey = AiGenerateResultCache.generateKey(
  'explain',
  text.slice(0, 80),
  type,
  Date.now().toString(),  // ensures a new key every call
)
```

## Best Practices

1. **Truncate long inputs** in keys — use `.slice(0, 80)` for transcripts/articles
2. **Namespace keys** with a service prefix to avoid collisions
3. **Never cache errors** — only cache successful results (see integration pattern above)
4. **Export the cache instance** from the service module so it can be cleared in tests
5. **Call `cache.clear()`** between test cases in services that use module-level caches
6. **Monitor stats** in production — unexpected evictions may warrant a larger `maxSize`

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Cache miss on repeated input | Key includes variable content (e.g., full transcript) | Truncate or hash the variable part |
| Hits dropping over time | TTL too short or cache filling with unique keys | Increase `ttlMs` or `maxSize` |
| OOM / high memory | `maxSize` too large or long transcript keys | Reduce `maxSize`, truncate key inputs |
| Service returns stale data | TTL too long for changing content | Lower `ttlMs` or include version in key |
| Concurrent calls all hit API | Not using `getOrSet` | Switch from `get`+`set` to `getOrSet` |

## Testing

```typescript
import { AiGenerateResultCache } from '../utils/generateResultCache'

describe('my cache integration', () => {
  let cache: AiGenerateResultCache<string>

  beforeEach(() => {
    vi.useFakeTimers()
    cache = new AiGenerateResultCache({ ttlMs: 5000, maxSize: 10 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('caches and expires', () => {
    cache.set('k', 'v')
    expect(cache.get('k')).toBe('v')
    vi.advanceTimersByTime(5001)
    expect(cache.get('k')).toBeNull()
  })
})
```

Always use `vi.useFakeTimers()` with `AiGenerateResultCache` in tests to control TTL expiry deterministically.
