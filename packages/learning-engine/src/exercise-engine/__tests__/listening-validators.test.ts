import { describe, it, expect } from 'vitest'
import {
  validateChronologicalOrder,
  validateWordLimit,
  detectAmbiguousAnswer,
  validateDistractors,
  validateTranscriptAuthenticity,
  countListeningWords,
} from '../domain/ielts/listening-validators'

describe('Listening Validators', () => {
  describe('validateChronologicalOrder', () => {
    it('passes questions in increasing timestamp order', () => {
      const result = validateChronologicalOrder([
        { id: 'q1', number: 1, evidence: { startTimeMs: 1000 } },
        { id: 'q2', number: 2, evidence: { startTimeMs: 5000 } },
        { id: 'q3', number: 3, evidence: { startTimeMs: 10000 } },
      ])
      expect(result.valid).toBe(true)
    })

    it('fails when later question has earlier timestamp', () => {
      const result = validateChronologicalOrder([
        { id: 'q1', number: 9, evidence: { startTimeMs: 80000 } },
        { id: 'q2', number: 10, evidence: { startTimeMs: 50000 } },
        { id: 'q3', number: 11, evidence: { startTimeMs: 5000 } },
      ])
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('skips questions without timestamps', () => {
      const result = validateChronologicalOrder([
        { id: 'q1', number: 1, evidence: { startTimeMs: 1000 } },
        { id: 'q2', number: 2 },
        { id: 'q3', number: 3, evidence: { startTimeMs: 5000 } },
      ])
      expect(result.valid).toBe(true)
    })
  })

  describe('validateWordLimit', () => {
    it('fails when answer exceeds word limit', () => {
      const result = validateWordLimit('natural gas', { maxWords: 1, allowsNumber: false }, 'q1')
      expect(result.valid).toBe(false)
    })

    it('passes when answer within word limit', () => {
      const result = validateWordLimit('natural gas', { maxWords: 2, allowsNumber: false }, 'q1')
      expect(result.valid).toBe(true)
    })

    it('allows numbers when enabled', () => {
      const result = validateWordLimit('42', { maxWords: 3, allowsNumber: true }, 'q1')
      expect(result.valid).toBe(true)
    })

    it('handles hyphenated words', () => {
      const result = validateWordLimit('long-term', { maxWords: 1, allowsNumber: false }, 'q1')
      expect(result.valid).toBe(true)
    })
  })

  describe('detectAmbiguousAnswer', () => {
    it('flags when short answer contained in long answer', () => {
      const result = detectAmbiguousAnswer('q1', 'global warming', ['warming'], 'transcript text')
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('flags multiple accepted answers', () => {
      const result = detectAmbiguousAnswer('q1', 'warming', ['global warming'], 'transcript text')
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('validateDistractors', () => {
    it('flags distractors with no transcript overlap', () => {
      const result = validateDistractors(
        ['Hydrogen and helium gases', 'Rising global temperatures'],
        'The transcript discusses rising global temperatures and greenhouse gas emissions',
        'q1',
      )
      expect(result.warnings.some(w => w.includes('Hydrogen'))).toBe(true)
    })
  })

  describe('validateTranscriptAuthenticity', () => {
    it('warns on essay-like transcript', () => {
      const essayLike = 'Climate change is a complex global phenomenon that requires comprehensive international cooperation and sustainable development practices. Many nations have implemented various strategies to address this challenge.'
      const result = validateTranscriptAuthenticity(essayLike, 1)
      expect(result.warnings.some(w => w.includes('spoken discourse'))).toBe(true)
    })

    it('accepts realistic spoken transcript', () => {
      const spoken = 'Okay, so let me tell you about the new facility. Well, actually, before I start — has everyone got a map? Great. Right, so if you look at the entrance here...'
      const result = validateTranscriptAuthenticity(spoken, 2)
      expect(result.valid).toBe(true)
    })
  })

  describe('countListeningWords', () => {
    it('counts words in normal text', () => {
      expect(countListeningWords('natural gas emissions')).toBe(3)
    })
    it('counts hyphenated as one word', () => {
      expect(countListeningWords('long-term')).toBe(1)
    })
  })
})
