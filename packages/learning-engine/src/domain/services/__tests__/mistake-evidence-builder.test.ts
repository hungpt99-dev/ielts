import { describe, it, expect } from 'vitest'
import { buildMistakeEvidence, detectRecurrencePattern } from '../mistake-evidence-builder'
import type { MistakeEvidence } from '../../entities/mistake-evidence'

describe('mistake-evidence-builder — buildMistakeEvidence', () => {
  it('creates evidence with minor severity for first occurrence', () => {
    const result = buildMistakeEvidence({
      skill: 'reading',
      category: 'vocabulary',
      originalResponse: 'incorrect word',
      correctedResponse: 'correct word',
      explanation: 'Word choice was wrong',
      sourceExerciseId: 'ex-1',
      sourceQuestionId: 'q-1',
      existingMistakes: [],
    })

    expect(result.skill).toBe('reading')
    expect(result.category).toBe('vocabulary')
    expect(result.originalResponse).toBe('incorrect word')
    expect(result.severity).toBe('minor')
    expect(result.recurrenceCount).toBe(0)
    expect(result.reviewStatus).toBe('unreviewed')
  })

  it('detects recurrence from existing similar mistakes', () => {
    const existing: MistakeEvidence[] = [
      {
        id: 'm-1', skill: 'reading', category: 'vocabulary',
        originalResponse: 'incorrect word', correctedResponse: 'correct',
        explanation: '', sourceExerciseId: 'ex-1', sourceQuestionId: 'q-1',
        occurredAt: '2024-01-01', recurrenceCount: 0,
        severity: 'minor', confidence: 0.9, reviewStatus: 'unreviewed',
      },
    ]

    const result = buildMistakeEvidence({
      skill: 'reading',
      category: 'vocabulary',
      originalResponse: 'incorrect word',
      correctedResponse: 'correct word',
      explanation: '',
      sourceExerciseId: 'ex-2',
      sourceQuestionId: 'q-2',
      existingMistakes: existing,
    })

    expect(result.recurrenceCount).toBe(1)
    expect(result.severity).toBe('moderate')
  })

  it('escalates severity with high recurrence', () => {
    const existing = Array.from({ length: 5 }, (_, i) => ({
      id: `m-${i}`, skill: 'reading' as const, category: 'grammar',
      originalResponse: 'bad grammar', correctedResponse: 'good grammar',
      explanation: '', sourceExerciseId: 'ex-1', sourceQuestionId: 'q-1',
      occurredAt: '2024-01-01', recurrenceCount: 4,
      severity: 'minor' as const, confidence: 0.9, reviewStatus: 'unreviewed' as const,
    }))

    const result = buildMistakeEvidence({
      skill: 'reading',
      category: 'grammar',
      originalResponse: 'bad grammar',
      correctedResponse: 'good grammar',
      explanation: '',
      sourceExerciseId: 'ex-2',
      sourceQuestionId: 'q-2',
      existingMistakes: existing,
    })

    expect(result.recurrenceCount).toBe(5)
    expect(result.severity).toBe('critical')
  })

  it('sets relatedGrammarItem and relatedVocabularyItem', () => {
    const result = buildMistakeEvidence({
      skill: 'grammar',
      category: 'tense',
      originalResponse: 'goed',
      correctedResponse: 'went',
      explanation: 'Irregular past tense',
      sourceExerciseId: 'ex-1',
      sourceQuestionId: 'q-1',
      existingMistakes: [],
      relatedGrammarItem: 'past-tense',
      relatedVocabularyItem: 'go→went',
    })

    expect(result.relatedGrammarItem).toBe('past-tense')
    expect(result.relatedVocabularyItem).toBe('go→went')
  })
})

describe('mistake-evidence-builder — detectRecurrencePattern', () => {
  it('groups mistakes by skill:category and filters > 1', () => {
    const mistakes: MistakeEvidence[] = [
      { id: 'm1', skill: 'reading', category: 'vocab', originalResponse: '', correctedResponse: '', explanation: '', sourceExerciseId: '', sourceQuestionId: '', occurredAt: '', recurrenceCount: 0, severity: 'minor', confidence: 0.9, reviewStatus: 'unreviewed' },
      { id: 'm2', skill: 'reading', category: 'vocab', originalResponse: '', correctedResponse: '', explanation: '', sourceExerciseId: '', sourceQuestionId: '', occurredAt: '', recurrenceCount: 0, severity: 'minor', confidence: 0.9, reviewStatus: 'unreviewed' },
      { id: 'm3', skill: 'writing', category: 'grammar', originalResponse: '', correctedResponse: '', explanation: '', sourceExerciseId: '', sourceQuestionId: '', occurredAt: '', recurrenceCount: 0, severity: 'minor', confidence: 0.9, reviewStatus: 'unreviewed' },
    ]

    const patterns = detectRecurrencePattern(mistakes)

    expect(patterns).toHaveLength(1)
    expect(patterns[0].count).toBe(2)
    expect(patterns[0].skills).toEqual(['reading'])
  })

  it('returns empty array when no patterns recur', () => {
    const mistakes: MistakeEvidence[] = [
      { id: 'm1', skill: 'reading', category: 'vocab', originalResponse: '', correctedResponse: '', explanation: '', sourceExerciseId: '', sourceQuestionId: '', occurredAt: '', recurrenceCount: 0, severity: 'minor', confidence: 0.9, reviewStatus: 'unreviewed' },
      { id: 'm2', skill: 'writing', category: 'grammar', originalResponse: '', correctedResponse: '', explanation: '', sourceExerciseId: '', sourceQuestionId: '', occurredAt: '', recurrenceCount: 0, severity: 'minor', confidence: 0.9, reviewStatus: 'unreviewed' },
    ]

    expect(detectRecurrencePattern(mistakes)).toHaveLength(0)
  })
})
