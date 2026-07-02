import { describe, it, expect } from 'vitest'
import { extractJSON, parseAndValidate } from '../utils/response'
import { AiCache } from '../utils/cache'
import { z } from 'zod'
import { AIError } from '../errors/types'

describe('extractJSON', () => {
  it('extracts JSON from plain text', () => {
    expect(extractJSON('{"key": "value"}')).toBe('{"key": "value"}')
  })

  it('extracts JSON from text with surrounding content', () => {
    const text = 'Here is the result: {"result": "success"} End.'
    expect(extractJSON(text)).toBe('{"result": "success"}')
  })

  it('extracts JSON from text with markdown code blocks', () => {
    const text = '```json\n{"key": "value"}\n```'
    expect(extractJSON(text)).toBe('{"key": "value"}')
  })

  it('extracts JSON from multiline content', () => {
    const text = 'Some text\n{\n  "key": "value"\n}\nmore text'
    expect(extractJSON(text)).toBe('{\n  "key": "value"\n}')
  })

  it('throws AIError when no JSON found', () => {
    expect(() => extractJSON('No JSON here')).toThrow(AIError)
    expect(() => extractJSON('No JSON here')).toThrow('not valid JSON')
  })

  it('throws AIError for empty string', () => {
    expect(() => extractJSON('')).toThrow(AIError)
  })

  it('extracts only the first JSON object from multiple', () => {
    const text = '{"first": true} some text {"second": true}'
    expect(extractJSON(text)).toBe('{"first": true}')
  })
})

describe('parseAndValidate', () => {
  const testSchema = z.object({ name: z.string(), age: z.number() })

  it('parses and validates valid JSON', () => {
    const result = parseAndValidate('{"name": "Alice", "age": 30}', testSchema)
    expect(result.data).toEqual({ name: 'Alice', age: 30 })
    expect(result.error).toBeNull()
  })

  it('returns error for invalid JSON', () => {
    const result = parseAndValidate('not json', testSchema)
    expect(result.data).toBeNull()
    expect(result.error).toMatch(/not valid JSON/)
  })

  it('returns error for invalid schema', () => {
    const result = parseAndValidate('{"name": "Alice", "age": "old"}', testSchema)
    expect(result.data).toBeNull()
    expect(result.error).toMatch(/unexpected format/)
  })

  it('returns error for missing fields', () => {
    const result = parseAndValidate('{"name": "Alice"}', testSchema)
    expect(result.data).toBeNull()
    expect(result.error).toMatch(/unexpected format/)
  })

  it('extracts and validates JSON from text prefix', () => {
    const text = 'Here: {"name": "Bob", "age": 25}'
    const result = parseAndValidate(text, testSchema)
    expect(result.data).toEqual({ name: 'Bob', age: 25 })
    expect(result.error).toBeNull()
  })

  it('returns error for empty content', () => {
    const result = parseAndValidate('', testSchema)
    expect(result.data).toBeNull()
    expect(result.error).toBeTruthy()
  })
})

describe('AiCache', () => {
  it('stores and retrieves values', () => {
    const cache = new AiCache<string>(5000)
    cache.set('key1', 'value1')
    expect(cache.get('key1')).toBe('value1')
  })

  it('returns null for missing key', () => {
    const cache = new AiCache(5000)
    expect(cache.get('nonexistent')).toBeNull()
  })

  it('returns null for expired entries', () => {
    const cache = new AiCache<string>(0)
    cache.set('key', 'value')
    expect(cache.get('key')).toBeNull()
  })

  it('clears all entries', () => {
    const cache = new AiCache<string>(5000)
    cache.set('a', '1')
    cache.set('b', '2')
    expect(cache.size()).toBe(2)
    cache.clear()
    expect(cache.size()).toBe(0)
  })

  it('reports correct size', () => {
    const cache = new AiCache(5000)
    expect(cache.size()).toBe(0)
    cache.set('a', 1)
    expect(cache.size()).toBe(1)
    cache.set('b', 2)
    expect(cache.size()).toBe(2)
  })

  it('handles complex data types', () => {
    const cache = new AiCache<{ n: number; s: string }>(5000)
    const data = { n: 42, s: 'hello' }
    cache.set('complex', data)
    expect(cache.get('complex')).toEqual(data)
  })
})
