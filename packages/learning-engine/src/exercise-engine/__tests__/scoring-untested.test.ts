import { describe, it, expect } from 'vitest'
import { scoreObjectiveQuestion } from '../scoring/scoring-strategies'
import { ObjectiveScoringStrategy, ListeningScoringStrategy } from '../scoring'
import type { ExerciseAttempt } from '../domain/types'
import { createSeedFullReadingTest, createSeedFullListeningTest } from '../infrastructure/seed-data'

describe('Scoring Engine - Untested Paths', () => {
  describe('multiple_select - scoreObjectiveQuestion', () => {
    const makeMultiSelectQuestion = (overrides: Partial<{
      id: string
      options: string[]
      correctIndices: number[]
      points: number
    }> = {}) => ({
      id: overrides.id ?? 'ms-1',
      type: 'multiple_select' as const,
      prompt: 'Select all that apply',
      options: overrides.options ?? ['A', 'B', 'C', 'D'],
      correctIndices: overrides.correctIndices ?? [0, 2],
      points: overrides.points ?? 3,
      difficulty: { difficulty: 0.5 },
      learningObjectiveIds: [],
    })

    it('all correct selections (score = full points)', () => {
      const q = makeMultiSelectQuestion({ correctIndices: [0, 2], points: 3 })
      const result = scoreObjectiveQuestion(q, { type: 'multi_choice', selectedIndices: [0, 2] })
      expect(result.correct).toBe(true)
      expect(result.partialCredit).toBe(1)
      expect(result.score).toBe(3)
      expect(result.maxScore).toBe(3)
    })

    it('partial correct with no wrong (partial credit)', () => {
      const q = makeMultiSelectQuestion({ correctIndices: [0, 1, 2], points: 3 })
      const result = scoreObjectiveQuestion(q, { type: 'multi_choice', selectedIndices: [0, 1] })
      expect(result.correct).toBe(false)
      expect(result.partialCredit).toBeCloseTo(2 / 3)
      expect(result.score).toBe(2)
    })

    it('correct with some wrong (penalized partial credit)', () => {
      const q = makeMultiSelectQuestion({ correctIndices: [0, 1, 2], points: 3 })
      const result = scoreObjectiveQuestion(q, { type: 'multi_choice', selectedIndices: [0, 1, 3] })
      expect(result.correct).toBe(false)
      expect(result.partialCredit).toBeCloseTo(1 / 3)
      expect(result.score).toBe(1)
    })

    it('empty selection (score = 0)', () => {
      const q = makeMultiSelectQuestion({ correctIndices: [0, 1], points: 2 })
      const result = scoreObjectiveQuestion(q, { type: 'multi_choice', selectedIndices: [] })
      expect(result.correct).toBe(false)
      expect(result.partialCredit).toBe(0)
      expect(result.score).toBe(0)
    })
  })

  describe('yes_no_not_given - scoreObjectiveQuestion', () => {
    const makeYNNGQuestion = (correctAnswer: 'yes' | 'no' | 'not_given' = 'yes') => ({
      id: 'ynng-1',
      type: 'yes_no_not_given' as const,
      prompt: 'Does the passage support this?',
      statement: 'The statement',
      correctAnswer,
      points: 1,
      difficulty: { difficulty: 0.5 },
      learningObjectiveIds: [],
    })

    it('correct answer', () => {
      const q = makeYNNGQuestion('yes')
      const result = scoreObjectiveQuestion(q, { type: 'text', value: 'yes' })
      expect(result.correct).toBe(true)
      expect(result.score).toBe(1)
    })

    it('incorrect answer', () => {
      const q = makeYNNGQuestion('no')
      const result = scoreObjectiveQuestion(q, { type: 'text', value: 'yes' })
      expect(result.correct).toBe(false)
      expect(result.score).toBe(0)
    })

    it('wrong response type', () => {
      const q = makeYNNGQuestion('not_given')
      const result = scoreObjectiveQuestion(q, { type: 'choice', selectedIndex: 0 })
      expect(result.correct).toBe(false)
      expect(result.score).toBe(0)
    })
  })

  describe('completion - scoreObjectiveQuestion', () => {
    const makeCompletionQuestion = (overrides: Partial<{
      id: string
      gaps: Array<{ id: string; position: number; correctAnswer: string; acceptableAlternatives: string[]; caseSensitive: boolean }>
      points: number
    }> = {}) => ({
      id: overrides.id ?? 'comp-1',
      type: 'completion' as const,
      subtype: 'sentence_completion' as const,
      prompt: 'Complete the sentence',
      text: 'The answer is _____.',
      gaps: overrides.gaps ?? [{ id: 'g1', position: 0, correctAnswer: 'carbon dioxide', acceptableAlternatives: [], caseSensitive: false }],
      wordLimit: 2,
      points: overrides.points ?? 1,
      difficulty: { difficulty: 0.5 },
      learningObjectiveIds: [],
    })

    it('correct answer', () => {
      const q = makeCompletionQuestion({ gaps: [{ id: 'g1', position: 0, correctAnswer: 'carbon dioxide', acceptableAlternatives: [], caseSensitive: false }] })
      const result = scoreObjectiveQuestion(q, { type: 'text', value: 'carbon dioxide' })
      expect(result.correct).toBe(true)
      expect(result.score).toBe(1)
    })

    it('correct alternative', () => {
      const q = makeCompletionQuestion({
        gaps: [{ id: 'g1', position: 0, correctAnswer: 'London', acceptableAlternatives: ['Greater London'], caseSensitive: false }],
      })
      const result = scoreObjectiveQuestion(q, { type: 'text', value: 'greater london' })
      expect(result.correct).toBe(true)
      expect(result.score).toBe(1)
    })

    it('incorrect answer', () => {
      const q = makeCompletionQuestion({ gaps: [{ id: 'g1', position: 0, correctAnswer: 'carbon dioxide', acceptableAlternatives: [], caseSensitive: false }] })
      const result = scoreObjectiveQuestion(q, { type: 'text', value: 'oxygen' })
      expect(result.correct).toBe(false)
      expect(result.score).toBe(0)
    })

    it('wrong response type', () => {
      const q = makeCompletionQuestion({ gaps: [{ id: 'g1', position: 0, correctAnswer: 'carbon dioxide', acceptableAlternatives: [], caseSensitive: false }] })
      const result = scoreObjectiveQuestion(q, { type: 'choice', selectedIndex: 0 })
      expect(result.correct).toBe(false)
      expect(result.score).toBe(0)
    })
  })

  describe('ordering - scoreObjectiveQuestion', () => {
    const items = [
      { id: 'a', content: 'First' },
      { id: 'b', content: 'Second' },
      { id: 'c', content: 'Third' },
    ]

    const makeOrderingQuestion = (correctOrder: string[] = ['a', 'b', 'c']) => ({
      id: 'ord-1',
      type: 'ordering' as const,
      prompt: 'Put the items in the correct order',
      items,
      correctOrder,
      points: 2,
      difficulty: { difficulty: 0.5 },
      learningObjectiveIds: [],
    })

    it('correct order', () => {
      const q = makeOrderingQuestion(['a', 'b', 'c'])
      const result = scoreObjectiveQuestion(q, { type: 'ordering', order: ['a', 'b', 'c'] })
      expect(result.correct).toBe(true)
      expect(result.score).toBe(2)
    })

    it('incorrect order', () => {
      const q = makeOrderingQuestion(['a', 'b', 'c'])
      const result = scoreObjectiveQuestion(q, { type: 'ordering', order: ['c', 'b', 'a'] })
      expect(result.correct).toBe(false)
      expect(result.score).toBe(0)
    })

    it('wrong response type', () => {
      const q = makeOrderingQuestion(['a', 'b', 'c'])
      const result = scoreObjectiveQuestion(q, { type: 'text', value: 'a,b,c' })
      expect(result.correct).toBe(false)
      expect(result.score).toBe(0)
    })
  })

  describe('classification - scoreObjectiveQuestion', () => {
    const qId = 'class-1'

    const makeClassificationQuestion = () => ({
      id: qId,
      type: 'classification' as const,
      prompt: 'Classify this item',
      categories: ['A', 'B', 'C'],
      correctCategory: 'B',
      items: ['item1', 'item2', 'item3'],
      points: 1,
      difficulty: { difficulty: 0.5 },
      learningObjectiveIds: [],
    })

    it('correct classification', () => {
      const q = makeClassificationQuestion()
      const result = scoreObjectiveQuestion(q, { type: 'classification', classifications: { [qId]: 'B' } })
      expect(result.correct).toBe(true)
      expect(result.score).toBe(1)
    })

    it('wrong classification', () => {
      const q = makeClassificationQuestion()
      const result = scoreObjectiveQuestion(q, { type: 'classification', classifications: { [qId]: 'C' } })
      expect(result.correct).toBe(false)
      expect(result.score).toBe(0)
    })

    it('wrong response type', () => {
      const q = makeClassificationQuestion()
      const result = scoreObjectiveQuestion(q, { type: 'choice', selectedIndex: 0 })
      expect(result.correct).toBe(false)
      expect(result.score).toBe(0)
    })
  })

  describe('ObjectiveScoringStrategy.score() with a reading exercise', () => {
    it('scores all 40 questions and calculates raw score, max score, and accuracy', async () => {
      const exercise = createSeedFullReadingTest()
      const attempt: ExerciseAttempt = {
        id: 'attempt-obj-full',
        exerciseId: exercise.id,
        exerciseSnapshotVersion: '1',
        status: 'submitted',
        responses: {
          'q-rt-p1-1': { type: 'text', value: 'true' },
          'q-rt-p1-2': { type: 'text', value: 'false' },
          'q-rt-p1-3': { type: 'text', value: 'not given' },
          'q-rt-p1-4': { type: 'text', value: 'false' },
          'q-rt-p1-5': { type: 'text', value: 'true' },
          'q-mh-p1-1': { type: 'matching', matches: { 'para-0': 'heading-0' } },
          'q-mh-p1-2': { type: 'matching', matches: { 'para-1': 'heading-1' } },
          'q-mh-p1-3': { type: 'matching', matches: { 'para-2': 'heading-2' } },
          'q-mc-p2-1': { type: 'choice', selectedIndex: 0 },
          'q-mc-p2-2': { type: 'choice', selectedIndex: 1 },
          'q-mc-p2-3': { type: 'choice', selectedIndex: 2 },
          'q-comp-p3-1': { type: 'text', value: 'answer 27' },
          'q-comp-p3-2': { type: 'text', value: 'answer 28' },
          'q-comp-p3-3': { type: 'text', value: 'answer 29' },
          'q-comp-p3-4': { type: 'text', value: 'wrong' },
        },
        submittedAt: new Date().toISOString(),
        elapsedSeconds: 1800,
      }

      const strategy = new ObjectiveScoringStrategy()
      const result = await strategy.score(exercise, attempt)

      expect(result.perQuestionResults).toBeDefined()
      expect(Object.keys(result.perQuestionResults!).length).toBe(40)
      expect(result.maximumScore).toBe(40)
      expect(result.requiresAiEvaluation).toBe(false)
      expect(result.requiresManualReview).toBe(false)

      const perQ = result.perQuestionResults!
      expect(perQ['q-rt-p1-1'].correct).toBe(true)
      expect(perQ['q-rt-p1-1'].score).toBe(1)
      expect(perQ['q-rt-p1-4'].correct).toBe(false)
      expect(perQ['q-rt-p1-4'].score).toBe(0)
      expect(perQ['q-mh-p1-1'].correct).toBe(true)
      expect(perQ['q-mh-p1-1'].score).toBe(1)
      expect(perQ['q-mc-p2-1'].correct).toBe(true)
      expect(perQ['q-mc-p2-1'].score).toBe(1)
      expect(perQ['q-comp-p3-1'].correct).toBe(true)
      expect(perQ['q-comp-p3-1'].score).toBe(1)
      expect(perQ['q-comp-p3-4'].correct).toBe(false)
      expect(perQ['q-comp-p3-4'].score).toBe(0)

      const unanswered = result.perQuestionResults!['q-mh-p1-4']
      expect(unanswered).toBeDefined()
      expect(unanswered.score).toBe(0)
      expect(unanswered.maxScore).toBe(1)
    })
  })

  describe('ListeningScoringStrategy.score() with an actual listening exercise', () => {
    function buildListeningResponses(count: number): Record<string, { type: 'text'; value: string }> {
      const responses: Record<string, { type: 'text'; value: string }> = {}
      for (let part = 1; part <= 4; part++) {
        for (let q = 1; q <= 10; q++) {
          const num = (part - 1) * 10 + q
          const id = `q-l-p${part}-${q}`
          if (num <= count) {
            responses[id] = { type: 'text', value: `answer ${num}` }
          }
        }
      }
      return responses
    }

    it('scores all 40 questions correctly and returns band 9', async () => {
      const exercise = createSeedFullListeningTest()
      const attempt: ExerciseAttempt = {
        id: 'attempt-ls-perfect',
        exerciseId: exercise.id,
        exerciseSnapshotVersion: '1',
        status: 'submitted',
        responses: buildListeningResponses(40),
        submittedAt: new Date().toISOString(),
        elapsedSeconds: 1200,
      }

      const strategy = new ListeningScoringStrategy()
      const result = await strategy.score(exercise, attempt)

      expect(result.rawScore).toBe(40)
      expect(result.maximumScore).toBe(40)
      expect(result.accuracy).toBe(1)
      expect(result.estimatedBand).toBe(9)
      expect(result.bandConfidence).toBeGreaterThanOrEqual(0.8)
      expect(result.requiresAiEvaluation).toBe(false)
      expect(result.perQuestionResults).toBeDefined()
      expect(Object.keys(result.perQuestionResults!).length).toBe(40)
    })

    it('scores 30 questions and returns band 7', async () => {
      const exercise = createSeedFullListeningTest()
      const attempt: ExerciseAttempt = {
        id: 'attempt-ls-30',
        exerciseId: exercise.id,
        exerciseSnapshotVersion: '1',
        status: 'submitted',
        responses: buildListeningResponses(30),
        submittedAt: new Date().toISOString(),
        elapsedSeconds: 1200,
      }

      const strategy = new ListeningScoringStrategy()
      const result = await strategy.score(exercise, attempt)

      expect(result.rawScore).toBe(30)
      expect(result.maximumScore).toBe(40)
      expect(result.accuracy).toBeCloseTo(30 / 40)
      expect(result.estimatedBand).toBe(7)
    })
  })

  describe('ListeningScoringStrategy band estimation', () => {
    function buildListeningResponses(count: number): Record<string, { type: 'text'; value: string }> {
      const responses: Record<string, { type: 'text'; value: string }> = {}
      for (let part = 1; part <= 4; part++) {
        for (let q = 1; q <= 10; q++) {
          const num = (part - 1) * 10 + q
          const id = `q-l-p${part}-${q}`
          if (num <= count) {
            responses[id] = { type: 'text', value: `answer ${num}` }
          }
        }
      }
      return responses
    }

    it('estimates band 9 (39/40)', async () => {
      const exercise = createSeedFullListeningTest()
      const attempt: ExerciseAttempt = {
        id: 'attempt-band-39',
        exerciseId: exercise.id,
        exerciseSnapshotVersion: '1',
        status: 'submitted',
        responses: buildListeningResponses(39),
        submittedAt: new Date().toISOString(),
        elapsedSeconds: 1200,
      }
      const result = await new ListeningScoringStrategy().score(exercise, attempt)
      expect(result.estimatedBand).toBe(9)
    })

    it('estimates band 8 (35/40)', async () => {
      const exercise = createSeedFullListeningTest()
      const attempt: ExerciseAttempt = {
        id: 'attempt-band-35',
        exerciseId: exercise.id,
        exerciseSnapshotVersion: '1',
        status: 'submitted',
        responses: buildListeningResponses(35),
        submittedAt: new Date().toISOString(),
        elapsedSeconds: 1200,
      }
      const result = await new ListeningScoringStrategy().score(exercise, attempt)
      expect(result.estimatedBand).toBe(8)
    })

    it('estimates band 7 (30/40)', async () => {
      const exercise = createSeedFullListeningTest()
      const attempt: ExerciseAttempt = {
        id: 'attempt-band-30',
        exerciseId: exercise.id,
        exerciseSnapshotVersion: '1',
        status: 'submitted',
        responses: buildListeningResponses(30),
        submittedAt: new Date().toISOString(),
        elapsedSeconds: 1200,
      }
      const result = await new ListeningScoringStrategy().score(exercise, attempt)
      expect(result.estimatedBand).toBe(7)
    })

    it('estimates band 6 (23/40)', async () => {
      const exercise = createSeedFullListeningTest()
      const attempt: ExerciseAttempt = {
        id: 'attempt-band-23',
        exerciseId: exercise.id,
        exerciseSnapshotVersion: '1',
        status: 'submitted',
        responses: buildListeningResponses(23),
        submittedAt: new Date().toISOString(),
        elapsedSeconds: 1200,
      }
      const result = await new ListeningScoringStrategy().score(exercise, attempt)
      expect(result.estimatedBand).toBe(6)
    })

    it('returns high confidence for a full 40-question test', async () => {
      const exercise = createSeedFullListeningTest()
      const attempt: ExerciseAttempt = {
        id: 'attempt-confidence',
        exerciseId: exercise.id,
        exerciseSnapshotVersion: '1',
        status: 'submitted',
        responses: buildListeningResponses(35),
        submittedAt: new Date().toISOString(),
        elapsedSeconds: 1200,
      }
      const result = await new ListeningScoringStrategy().score(exercise, attempt)
      expect(result.bandConfidence).toBeGreaterThanOrEqual(0.8)
    })
  })
})
