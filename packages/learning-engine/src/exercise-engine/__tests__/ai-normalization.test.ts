import { describe, it, expect } from 'vitest'

function removeGeneratedOptionPrefix(value: string): string {
  return value.replace(/^\s*[A-D][.)]\s+/i, '').trim()
}

const PLACEHOLDER_PATTERNS = [
  /^Option\s*[A-Z]$/i, /^Answer\s*[A-Z]$/i, /^Choice\s*[A-Z]$/i,
  /^TBD$/i, /^N\/?A$/i, /^Placeholder$/i, /^Lorem/i,
]

function isPlaceholderValue(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some(p => p.test(value.trim()))
}

describe('AI Question Normalization', () => {
  describe('removeGeneratedOptionPrefix', () => {
    it('removes A. prefix', () => {
      expect(removeGeneratedOptionPrefix('A. Rising sea levels')).toBe('Rising sea levels')
    })
    it('removes B) prefix', () => {
      expect(removeGeneratedOptionPrefix('B) Increase in global temperatures')).toBe('Increase in global temperatures')
    })
    it('removes C. prefix with leading spaces', () => {
      expect(removeGeneratedOptionPrefix('  C. More extreme weather events')).toBe('More extreme weather events')
    })
    it('does not modify text without prefix', () => {
      expect(removeGeneratedOptionPrefix('Rising sea levels')).toBe('Rising sea levels')
    })
    it('does not modify text starting with letter but not a prefix', () => {
      expect(removeGeneratedOptionPrefix('Evidence shows rising temperatures')).toBe('Evidence shows rising temperatures')
    })
  })

  describe('isPlaceholderValue', () => {
    it('detects Option A as placeholder', () => {
      expect(isPlaceholderValue('Option A')).toBe(true)
    })
    it('detects Option B as placeholder', () => {
      expect(isPlaceholderValue('Option B')).toBe(true)
    })
    it('detects Answer A as placeholder', () => {
      expect(isPlaceholderValue('Answer A')).toBe(true)
    })
    it('detects TBD as placeholder', () => {
      expect(isPlaceholderValue('TBD')).toBe(true)
    })
    it('detects N/A as placeholder', () => {
      expect(isPlaceholderValue('N/A')).toBe(true)
    })
    it('detects Lorem ipsum', () => {
      expect(isPlaceholderValue('Lorem ipsum dolor')).toBe(true)
    })
    it('rejects real option text', () => {
      expect(isPlaceholderValue('Rising sea levels')).toBe(false)
    })
  })
})
