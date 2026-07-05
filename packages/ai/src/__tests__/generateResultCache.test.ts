import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AiGenerateResultCache } from '../utils/generateResultCache'

describe('AiGenerateResultCache', () => {
  let cache: AiGenerateResultCache<string>

  beforeEach(() => {
    vi.useFakeTimers()
    cache = new AiGenerateResultCache<string>({ ttlMs: 5000, maxSize: 3 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('constructor', () => {
    it('uses default options when none provided', () => {
      const c = new AiGenerateResultCache()
      expect(c.size()).toBe(0)
      const stats = c.stats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.evictions).toBe(0)
    })
  })

  describe('set / get', () => {
    it('stores and retrieves a value', () => {
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
    })

    it('returns null for a missing key', () => {
      expect(cache.get('nonexistent')).toBeNull()
    })

    it('returns null for an expired entry', () => {
      cache.set('key', 'value')
      vi.advanceTimersByTime(5001)
      expect(cache.get('key')).toBeNull()
    })

    it('returns value before TTL expires', () => {
      cache.set('key', 'value')
      vi.advanceTimersByTime(4999)
      expect(cache.get('key')).toBe('value')
    })

    it('accepts per-entry TTL override', () => {
      cache.set('key', 'value', 1000)
      vi.advanceTimersByTime(1001)
      expect(cache.get('key')).toBeNull()
    })

    it('per-entry TTL override shorter than default', () => {
      cache.set('key', 'value', 100)
      vi.advanceTimersByTime(5000)
      expect(cache.get('key')).toBeNull()
    })

    it('per-entry TTL override longer than default', () => {
      cache.set('key', 'value', 20000)
      vi.advanceTimersByTime(5001)
      expect(cache.get('key')).toBe('value')
    })

    it('handles complex object data', () => {
      const objCache = new AiGenerateResultCache<{ n: number; s: string }>({ ttlMs: 5000 })
      const data = { n: 42, s: 'hello' }
      objCache.set('obj', data)
      expect(objCache.get('obj')).toEqual(data)
    })

    it('stores and retrieves arrays', () => {
      const arrCache = new AiGenerateResultCache<number[]>({ ttlMs: 5000 })
      arrCache.set('arr', [1, 2, 3])
      expect(arrCache.get('arr')).toEqual([1, 2, 3])
    })
  })

  describe('eviction', () => {
    it('evicts oldest entry when maxSize is exceeded on set', () => {
      cache.set('a', '1')
      cache.set('b', '2')
      cache.set('c', '3')
      cache.set('d', '4')
      expect(cache.get('a')).toBeNull()
      expect(cache.get('d')).toBe('4')
      expect(cache.size()).toBe(3)
    })

    it('evicts entries in FIFO order', () => {
      cache.set('a', '1')
      cache.set('b', '2')
      cache.set('c', '3')
      cache.set('d', '4')
      cache.set('e', '5')
      expect(cache.get('b')).toBeNull()
      expect(cache.get('c')).toBe('3')
    })

    it('tracks evictions in stats', () => {
      cache.set('a', '1')
      cache.set('b', '2')
      cache.set('c', '3')
      cache.set('d', '4')
      const stats = cache.stats()
      expect(stats.evictions).toBe(1)
    })

    it('does not evict when under maxSize', () => {
      cache.set('a', '1')
      cache.set('b', '2')
      expect(cache.size()).toBe(2)
      const stats = cache.stats()
      expect(stats.evictions).toBe(0)
    })
  })

  describe('has', () => {
    it('returns true for existing key', () => {
      cache.set('key', 'value')
      expect(cache.has('key')).toBe(true)
    })

    it('returns false for missing key', () => {
      expect(cache.has('missing')).toBe(false)
    })

    it('returns false for expired key', () => {
      cache.set('key', 'value')
      vi.advanceTimersByTime(5001)
      expect(cache.has('key')).toBe(false)
    })
  })

  describe('delete', () => {
    it('removes an entry and returns true', () => {
      cache.set('key', 'value')
      expect(cache.delete('key')).toBe(true)
      expect(cache.get('key')).toBeNull()
    })

    it('returns false for non-existent key', () => {
      expect(cache.delete('missing')).toBe(false)
    })

    it('does not affect other entries', () => {
      cache.set('a', '1')
      cache.set('b', '2')
      cache.delete('a')
      expect(cache.get('b')).toBe('2')
    })
  })

  describe('clear', () => {
    it('removes all entries', () => {
      cache.set('a', '1')
      cache.set('b', '2')
      cache.clear()
      expect(cache.size()).toBe(0)
      expect(cache.get('a')).toBeNull()
    })

    it('resets stats', () => {
      cache.set('a', '1')
      cache.get('a')
      cache.clear()
      const stats = cache.stats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.size).toBe(0)
    })
  })

  describe('size', () => {
    it('starts at 0', () => {
      expect(cache.size()).toBe(0)
    })

    it('reports correct count after sets and deletes', () => {
      cache.set('a', '1')
      cache.set('b', '2')
      expect(cache.size()).toBe(2)
      cache.delete('a')
      expect(cache.size()).toBe(1)
      cache.clear()
      expect(cache.size()).toBe(0)
    })
  })

  describe('stats', () => {
    it('tracks hits', () => {
      cache.set('k', 'v')
      cache.get('k')
      cache.get('k')
      expect(cache.stats().hits).toBe(2)
    })

    it('tracks misses', () => {
      cache.get('missing')
      cache.get('also-missing')
      expect(cache.stats().misses).toBe(2)
    })

    it('counts expired get as miss and eviction', () => {
      cache.set('k', 'v')
      vi.advanceTimersByTime(5001)
      cache.get('k')
      const stats = cache.stats()
      expect(stats.misses).toBe(1)
      expect(stats.evictions).toBe(1)
    })

    it('reports current size', () => {
      cache.set('a', '1')
      cache.set('b', '2')
      expect(cache.stats().size).toBe(2)
    })
  })

  describe('keys', () => {
    it('returns all keys in insertion order', () => {
      cache.set('b', '2')
      cache.set('a', '1')
      cache.set('c', '3')
      expect(cache.keys()).toEqual(['b', 'a', 'c'])
    })

    it('returns empty array for empty cache', () => {
      expect(cache.keys()).toEqual([])
    })

    it('does not include evicted keys', () => {
      cache.set('a', '1')
      cache.set('b', '2')
      cache.set('c', '3')
      cache.set('d', '4')
      expect(cache.keys()).not.toContain('a')
    })
  })

  describe('getOrSet', () => {
    it('returns cached value when available', async () => {
      cache.set('key', 'cached')
      const result = await cache.getOrSet('key', async () => 'fresh')
      expect(result).toBe('cached')
    })

    it('calls factory and caches result on miss', async () => {
      const factory = vi.fn().mockResolvedValue('computed')
      const result = await cache.getOrSet('key', factory)
      expect(result).toBe('computed')
      expect(factory).toHaveBeenCalledTimes(1)
      expect(cache.get('key')).toBe('computed')
    })

    it('applies ttlOverride to the cached entry', async () => {
      const factory = vi.fn().mockResolvedValue('value')
      await cache.getOrSet('key', factory, 100)
      vi.advanceTimersByTime(101)
      expect(cache.get('key')).toBeNull()
    })

    it('propagates factory error and does not cache', async () => {
      const error = new Error('generation failed')
      const factory = vi.fn().mockRejectedValue(error)
      await expect(cache.getOrSet('key', factory)).rejects.toThrow('generation failed')
      expect(cache.get('key')).toBeNull()
    })

    it('deduplicates concurrent calls with the same key', async () => {
      const factory = vi.fn().mockResolvedValue('shared')
      const [r1, r2, r3] = await Promise.all([
        cache.getOrSet('key', factory),
        cache.getOrSet('key', factory),
        cache.getOrSet('key', factory),
      ])
      expect(r1).toBe('shared')
      expect(r2).toBe('shared')
      expect(r3).toBe('shared')
      expect(factory).toHaveBeenCalledTimes(1)
    })

    it('cleans up pending on factory failure', async () => {
      const factory = vi.fn().mockRejectedValue(new Error('fail'))
      await expect(cache.getOrSet('key', factory)).rejects.toThrow('fail')
      const factory2 = vi.fn().mockResolvedValue('retry')
      const result = await cache.getOrSet('key', factory2)
      expect(result).toBe('retry')
      expect(factory2).toHaveBeenCalledTimes(1)
    })

    it('allows concurrent calls with different keys', async () => {
      const factoryA = vi.fn().mockResolvedValue('A')
      const factoryB = vi.fn().mockResolvedValue('B')
      const [rA, rB] = await Promise.all([
        cache.getOrSet('key-a', factoryA),
        cache.getOrSet('key-b', factoryB),
      ])
      expect(rA).toBe('A')
      expect(rB).toBe('B')
      expect(factoryA).toHaveBeenCalledTimes(1)
      expect(factoryB).toHaveBeenCalledTimes(1)
    })

    it('returns cached value after previous getOrSet stored it', async () => {
      const factory1 = vi.fn().mockResolvedValue('first')
      await cache.getOrSet('key', factory1)
      const factory2 = vi.fn().mockResolvedValue('second')
      const result = await cache.getOrSet('key', factory2)
      expect(result).toBe('first')
      expect(factory2).not.toHaveBeenCalled()
    })

    it('calls factory again after entry expires', async () => {
      const factory1 = vi.fn().mockResolvedValue('first')
      await cache.getOrSet('key', factory1, 100)
      vi.advanceTimersByTime(101)
      const factory2 = vi.fn().mockResolvedValue('second')
      const result = await cache.getOrSet('key', factory2)
      expect(result).toBe('second')
      expect(factory2).toHaveBeenCalledTimes(1)
    })
  })

  describe('generateKey (static)', () => {
    it('joins parts with colon', () => {
      expect(AiGenerateResultCache.generateKey('skill', 'topic')).toBe('skill:topic')
    })

    it('handles single part', () => {
      expect(AiGenerateResultCache.generateKey('only')).toBe('only')
    })

    it('handles empty parts', () => {
      expect(AiGenerateResultCache.generateKey()).toBe('')
    })
  })

  describe('edge cases', () => {
    it('handles zero TTL (immediate expiry)', () => {
      const c = new AiGenerateResultCache<string>({ ttlMs: 0 })
      c.set('key', 'value')
      vi.advanceTimersByTime(1)
      expect(c.get('key')).toBeNull()
    })

    it('handles very large maxSize', () => {
      const c = new AiGenerateResultCache<string>({ ttlMs: 5000, maxSize: 10000 })
      for (let i = 0; i < 1000; i++) {
        c.set(`k${i}`, `v${i}`)
      }
      expect(c.size()).toBe(1000)
    })

    it('handles empty string key', () => {
      cache.set('', 'empty-key')
      expect(cache.get('')).toBe('empty-key')
    })

    it('overwrites existing key', () => {
      cache.set('key', 'old')
      cache.set('key', 'new')
      expect(cache.get('key')).toBe('new')
    })

    it('overwrite resets TTL', () => {
      cache.set('key', 'old')
      vi.advanceTimersByTime(3000)
      cache.set('key', 'new')
      vi.advanceTimersByTime(3000)
      expect(cache.get('key')).toBe('new')
    })
  })
})
