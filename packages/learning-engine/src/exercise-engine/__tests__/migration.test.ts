import { describe, it, expect } from 'vitest'
import { migrateLegacyExercise, isLegacyExercise, migrateExerciseBatch } from '../infrastructure/migration'
import type { LegacyExercise } from '../infrastructure/migration'

describe('Migration', () => {
  describe('isLegacyExercise', () => {
    it('identifies legacy exercises', () => {
      const legacy: LegacyExercise = { id: 'old-1', skill: 'reading', exerciseType: 'quiz' }
      expect(isLegacyExercise(legacy)).toBe(true)
    })

    it('rejects new format exercises', () => {
      const modern = { id: 'new-1', schemaVersion: 1, module: 'reading' }
      expect(isLegacyExercise(modern)).toBe(false)
    })

    it('rejects non-objects', () => {
      expect(isLegacyExercise(null)).toBe(false)
      expect(isLegacyExercise('string')).toBe(false)
      expect(isLegacyExercise(42)).toBe(false)
    })
  })

  describe('migrateLegacyExercise', () => {
    it('migrates a reading exercise', () => {
      const legacy: LegacyExercise = {
        id: 'old-reading-1',
        skill: 'reading',
        exerciseType: 'quiz',
        questions: [{ type: 'multiple-choice', question: 'Test' }],
        estimatedMinutes: 20,
      }

      const result = migrateLegacyExercise(legacy)
      expect(result.status).toBe('migrated')
      expect(result.migrated).not.toBeNull()
      expect(result.migrated!.module).toBe('reading')
      expect(result.migrated!.family).toBe('objective_questions')
      expect(result.migrated!.schemaVersion).toBe(1)
      expect(result.migrated!.estimatedDurationSeconds).toBe(1200)
    })

    it('migrates a writing exercise', () => {
      const legacy: LegacyExercise = {
        id: 'old-writing-1',
        skill: 'writing',
        exerciseType: 'essay',
      }

      const result = migrateLegacyExercise(legacy)
      expect(result.status).toBe('migrated')
      expect(result.migrated!.module).toBe('writing')
      expect(result.migrated!.family).toBe('writing_task')
    })

    it('migrates a speaking exercise', () => {
      const legacy: LegacyExercise = {
        id: 'old-speaking-1',
        skill: 'speaking',
        exerciseType: 'speaking',
      }

      const result = migrateLegacyExercise(legacy)
      expect(result.status).toBe('migrated')
      expect(result.migrated!.module).toBe('speaking')
      expect(result.migrated!.family).toBe('speaking_session')
    })

    it('marks unknown skills as legacy_practice', () => {
      const legacy: LegacyExercise = {
        id: 'old-math-1',
        skill: 'math',
        exerciseType: 'quiz',
      }

      const result = migrateLegacyExercise(legacy)
      expect(result.status).toBe('legacy_practice')
    })

    it('rejects exercises without id', () => {
      const legacy: LegacyExercise = { id: '' }
      const result = migrateLegacyExercise(legacy)
      expect(result.status).toBe('incompatible')
    })

    it('infers focused_practice mode by default', () => {
      const legacy: LegacyExercise = {
        id: 'old-1',
        skill: 'reading',
        exerciseType: 'quiz',
      }

      const result = migrateLegacyExercise(legacy)
      expect(result.migrated!.mode).toBe('focused_practice')
    })

    it('adds migrated tag', () => {
      const legacy: LegacyExercise = {
        id: 'old-1',
        skill: 'grammar',
        exerciseType: 'error-correction',
      }

      const result = migrateLegacyExercise(legacy)
      expect(result.migrated!.tags).toContain('migrated')
    })
  })

  describe('migrateExerciseBatch', () => {
    it('migrates a batch of exercises', () => {
      const exercises: LegacyExercise[] = [
        { id: 'old-1', skill: 'reading', exerciseType: 'quiz' },
        { id: 'old-2', skill: 'writing', exerciseType: 'essay' },
        { id: 'old-3', skill: 'math', exerciseType: 'quiz' },
      ]

      const result = migrateExerciseBatch(exercises)
      expect(result.migrated).toHaveLength(2)
      expect(result.legacyPractice).toHaveLength(1)
      expect(result.incompatible).toHaveLength(0)
    })

    it('handles empty batch', () => {
      const result = migrateExerciseBatch([])
      expect(result.migrated).toHaveLength(0)
      expect(result.legacyPractice).toHaveLength(0)
      expect(result.incompatible).toHaveLength(0)
    })
  })
})
