import { describe, it, expect } from 'vitest'
import { selectEvaluationMethod, isDeterministicallyGradable, normalizeScore } from '../evaluation-policy'

describe('evaluation-policy — selectEvaluationMethod', () => {
  it('returns deterministic for multiple-choice', () => {
    expect(selectEvaluationMethod('multiple-choice', true)).toBe('deterministic')
    expect(selectEvaluationMethod('multiple-choice', false)).toBe('deterministic')
  })

  it('returns deterministic for gap-fill', () => {
    expect(selectEvaluationMethod('gap-fill', true)).toBe('deterministic')
  })

  it('returns deterministic for true-false-not-given', () => {
    expect(selectEvaluationMethod('true-false-not-given', true)).toBe('deterministic')
  })

  it('returns deterministic for matching', () => {
    expect(selectEvaluationMethod('matching', true)).toBe('deterministic')
  })

  it('returns ai-only for essay when AI is available', () => {
    expect(selectEvaluationMethod('essay', true)).toBe('ai-only')
  })

  it('returns self-evaluated for essay when AI is unavailable', () => {
    expect(selectEvaluationMethod('essay', false)).toBe('self-evaluated')
  })

  it('returns ai-only for speaking-response when AI is available', () => {
    expect(selectEvaluationMethod('speaking-response', true)).toBe('ai-only')
  })

  it('returns self-evaluated for speaking-response when AI is unavailable', () => {
    expect(selectEvaluationMethod('speaking-response', false)).toBe('self-evaluated')
  })

  it('returns ai-assisted for short-answer when AI is available', () => {
    expect(selectEvaluationMethod('short-answer', true)).toBe('ai-assisted')
  })

  it('returns deterministic for short-answer when AI is unavailable', () => {
    expect(selectEvaluationMethod('short-answer', false)).toBe('deterministic')
  })

  it('returns deterministic for reflection type', () => {
    expect(selectEvaluationMethod('reflection', true)).toBe('deterministic')
  })
})

describe('evaluation-policy — isDeterministicallyGradable', () => {
  it('returns true for multiple-choice', () => {
    expect(isDeterministicallyGradable('multiple-choice')).toBe(true)
  })

  it('returns true for gap-fill', () => {
    expect(isDeterministicallyGradable('gap-fill')).toBe(true)
  })

  it('returns false for essay', () => {
    expect(isDeterministicallyGradable('essay')).toBe(false)
  })

  it('returns false for speaking-response', () => {
    expect(isDeterministicallyGradable('speaking-response')).toBe(false)
  })
})

describe('evaluation-policy — normalizeScore', () => {
  it('returns raw score within bounds', () => {
    expect(normalizeScore(5, 10)).toBe(5)
  })

  it('clamps score to maximum', () => {
    expect(normalizeScore(15, 10)).toBe(10)
  })

  it('clamps negative score to 0', () => {
    expect(normalizeScore(-3, 10)).toBe(0)
  })

  it('returns 0 for zero maximum', () => {
    expect(normalizeScore(5, 0)).toBe(0)
  })
})
