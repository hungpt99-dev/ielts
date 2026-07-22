import { describe, it, expect } from 'vitest'
import {
  isExerciseModule,
  isExerciseMode,
  isExerciseFamily,
  isIeltsVariant,
  createDefaultDifficultyProfile,
  validateDifficultyProfile,
  isValidTransition,
  normalizeAnswer,
  createDefaultNormalizationPolicy,
} from '../domain/types'

describe('Exercise Engine Domain Types', () => {
  describe('ExerciseModule', () => {
    it('validates valid modules', () => {
      expect(isExerciseModule('reading')).toBe(true)
      expect(isExerciseModule('listening')).toBe(true)
      expect(isExerciseModule('writing')).toBe(true)
      expect(isExerciseModule('speaking')).toBe(true)
      expect(isExerciseModule('grammar')).toBe(true)
      expect(isExerciseModule('vocabulary')).toBe(true)
      expect(isExerciseModule('saved_content')).toBe(true)
      expect(isExerciseModule('mistake_review')).toBe(true)
    })

    it('rejects invalid modules', () => {
      expect(isExerciseModule('invalid')).toBe(false)
      expect(isExerciseModule('')).toBe(false)
      expect(isExerciseModule('math')).toBe(false)
    })
  })

  describe('ExerciseMode', () => {
    it('validates valid modes', () => {
      expect(isExerciseMode('full_test')).toBe(true)
      expect(isExerciseMode('full_section')).toBe(true)
      expect(isExerciseMode('full_part')).toBe(true)
      expect(isExerciseMode('focused_practice')).toBe(true)
      expect(isExerciseMode('adaptive_practice')).toBe(true)
      expect(isExerciseMode('review')).toBe(true)
      expect(isExerciseMode('diagnostic')).toBe(true)
    })

    it('rejects invalid modes', () => {
      expect(isExerciseMode('invalid')).toBe(false)
      expect(isExerciseMode('practice')).toBe(false)
    })
  })

  describe('ExerciseFamily', () => {
    it('validates valid families', () => {
      expect(isExerciseFamily('objective_questions')).toBe(true)
      expect(isExerciseFamily('completion_questions')).toBe(true)
      expect(isExerciseFamily('matching_questions')).toBe(true)
      expect(isExerciseFamily('writing_task')).toBe(true)
      expect(isExerciseFamily('speaking_session')).toBe(true)
      expect(isExerciseFamily('vocabulary_activity')).toBe(true)
      expect(isExerciseFamily('grammar_activity')).toBe(true)
    })

    it('rejects invalid families', () => {
      expect(isExerciseFamily('invalid')).toBe(false)
      expect(isExerciseFamily('quiz')).toBe(false)
    })
  })

  describe('IeltsVariant', () => {
    it('validates valid variants', () => {
      expect(isIeltsVariant('academic')).toBe(true)
      expect(isIeltsVariant('general_training')).toBe(true)
    })

    it('rejects invalid variants', () => {
      expect(isIeltsVariant('invalid')).toBe(false)
    })
  })

  describe('DifficultyProfile', () => {
    it('creates default profile with all values at 0.5', () => {
      const profile = createDefaultDifficultyProfile()
      expect(profile.linguisticComplexity).toBe(0.5)
      expect(profile.lexicalComplexity).toBe(0.5)
      expect(profile.grammaticalComplexity).toBe(0.5)
      expect(profile.inferenceDepth).toBe(0.5)
      expect(profile.distractorStrength).toBe(0.5)
      expect(profile.informationDensity).toBe(0.5)
      expect(profile.paraphraseDistance).toBe(0.5)
      expect(profile.responseComplexity).toBe(0.5)
      expect(profile.timePressure).toBe(0.5)
    })

    it('validates valid difficulty profile', () => {
      const profile = createDefaultDifficultyProfile()
      expect(validateDifficultyProfile(profile)).toBe(true)
    })

    it('rejects profile with out-of-range values', () => {
      const profile = { ...createDefaultDifficultyProfile(), linguisticComplexity: 1.5 }
      expect(validateDifficultyProfile(profile)).toBe(false)
    })

    it('rejects profile with negative values', () => {
      const profile = { ...createDefaultDifficultyProfile(), lexicalComplexity: -0.1 }
      expect(validateDifficultyProfile(profile)).toBe(false)
    })
  })

  describe('Attempt State Transitions', () => {
    it('allows valid transitions from not_started', () => {
      expect(isValidTransition('not_started', 'in_progress')).toBe(true)
    })

    it('allows valid transitions from in_progress', () => {
      expect(isValidTransition('in_progress', 'paused')).toBe(true)
      expect(isValidTransition('in_progress', 'submitted')).toBe(true)
      expect(isValidTransition('in_progress', 'abandoned')).toBe(true)
    })

    it('allows valid transitions from paused', () => {
      expect(isValidTransition('paused', 'in_progress')).toBe(true)
      expect(isValidTransition('paused', 'abandoned')).toBe(true)
    })

    it('allows valid transitions from submitted', () => {
      expect(isValidTransition('submitted', 'evaluating')).toBe(true)
      expect(isValidTransition('submitted', 'completed')).toBe(true)
    })

    it('allows valid transitions from evaluating', () => {
      expect(isValidTransition('evaluating', 'completed')).toBe(true)
    })

    it('rejects invalid transitions', () => {
      expect(isValidTransition('completed', 'in_progress')).toBe(false)
      expect(isValidTransition('abandoned', 'in_progress')).toBe(false)
      expect(isValidTransition('not_started', 'completed')).toBe(false)
    })

    it('rejects transitions from terminal states', () => {
      expect(isValidTransition('completed', 'submitted')).toBe(false)
      expect(isValidTransition('abandoned', 'paused')).toBe(false)
      expect(isValidTransition('failed', 'in_progress')).toBe(false)
    })
  })

  describe('Answer Normalization', () => {
    it('normalizes with default policy', () => {
      const policy = createDefaultNormalizationPolicy()
      expect(normalizeAnswer('  Hello World  ', policy)).toBe('hello world')
    })

    it('trims whitespace', () => {
      const policy = { ...createDefaultNormalizationPolicy(), lowercase: false }
      expect(normalizeAnswer('  Hello  ', policy)).toBe('Hello')
    })

    it('lowercases when enabled', () => {
      const policy = createDefaultNormalizationPolicy()
      expect(normalizeAnswer('HELLO', policy)).toBe('hello')
    })

    it('normalizes punctuation when enabled', () => {
      const policy = { ...createDefaultNormalizationPolicy(), normalizePunctuation: true }
      expect(normalizeAnswer('Hello, World!', policy)).toBe('hello world')
    })

    it('collapses multiple spaces', () => {
      const policy = createDefaultNormalizationPolicy()
      expect(normalizeAnswer('hello    world', policy)).toBe('hello world')
    })
  })
})
