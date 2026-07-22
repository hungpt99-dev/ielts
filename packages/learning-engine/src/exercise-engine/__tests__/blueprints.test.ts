import { describe, it, expect } from 'vitest'
import {
  createFullListeningBlueprint,
  createListeningPartBlueprint,
  createFullReadingBlueprint,
  createReadingPassageBlueprint,
  createFullWritingBlueprint,
  createWritingTaskBlueprint,
  createFullSpeakingBlueprint,
  freezeBlueprint,
} from '../domain/blueprints'

describe('IELTS Blueprints', () => {
  describe('Full Listening Blueprint', () => {
    it('creates blueprint with correct structure', () => {
      const blueprint = createFullListeningBlueprint('test-listening')
      expect(blueprint.module).toBe('listening')
      expect(blueprint.mode).toBe('full_test')
      expect(blueprint.family).toBe('interactive_listening')
      expect(blueprint.structure.requiredParts).toBe(4)
      expect(blueprint.structure.questionsPerPart).toBe(10)
      expect(blueprint.structure.totalQuestions).toBe(40)
    })

    it('has correct timing', () => {
      const blueprint = createFullListeningBlueprint('test-listening')
      expect(blueprint.timing.officialDurationSeconds).toBe(1800)
      expect(blueprint.timing.strictMode).toBe(true)
    })

    it('has correct scoring', () => {
      const blueprint = createFullListeningBlueprint('test-listening')
      expect(blueprint.scoring.maxScore).toBe(40)
      expect(blueprint.scoring.scoringMethod).toBe('deterministic')
      expect(blueprint.scoring.partialCredit).toBe(false)
    })

    it('supports all listening question types', () => {
      const blueprint = createFullListeningBlueprint('test-listening')
      expect(blueprint.allowedQuestionTypes).toContain('multiple_choice')
      expect(blueprint.allowedQuestionTypes).toContain('matching')
      expect(blueprint.allowedQuestionTypes).toContain('map_labelling')
      expect(blueprint.allowedQuestionTypes).toContain('form_completion')
    })
  })

  describe('Listening Part Blueprint', () => {
    it('creates blueprint for single part', () => {
      const blueprint = createListeningPartBlueprint('test-part', 2)
      expect(blueprint.module).toBe('listening')
      expect(blueprint.mode).toBe('full_part')
      expect(blueprint.structure.requiredParts).toBe(1)
      expect(blueprint.structure.totalQuestions).toBe(10)
    })
  })

  describe('Full Reading Blueprint', () => {
    it('creates Academic reading blueprint', () => {
      const blueprint = createFullReadingBlueprint('test-reading', 'academic')
      expect(blueprint.module).toBe('reading')
      expect(blueprint.mode).toBe('full_test')
      expect(blueprint.ieltsVariant).toBe('academic')
      expect(blueprint.structure.passages).toBe(3)
      expect(blueprint.structure.totalQuestions).toBe(40)
    })

    it('creates General Training reading blueprint', () => {
      const blueprint = createFullReadingBlueprint('test-reading-gt', 'general_training')
      expect(blueprint.ieltsVariant).toBe('general_training')
    })

    it('has 60 minutes official duration', () => {
      const blueprint = createFullReadingBlueprint('test-reading')
      expect(blueprint.timing.officialDurationSeconds).toBe(3600)
    })
  })

  describe('Reading Passage Blueprint', () => {
    it('creates single passage blueprint', () => {
      const blueprint = createReadingPassageBlueprint('test-passage')
      expect(blueprint.mode).toBe('full_section')
      expect(blueprint.structure.passages).toBe(1)
    })
  })

  describe('Full Writing Blueprint', () => {
    it('creates Academic writing blueprint', () => {
      const blueprint = createFullWritingBlueprint('test-writing', 'academic')
      expect(blueprint.module).toBe('writing')
      expect(blueprint.mode).toBe('full_test')
      expect(blueprint.ieltsVariant).toBe('academic')
      expect(blueprint.structure.tasks).toBe(2)
      expect(blueprint.structure.task1Weight).toBe(1)
      expect(blueprint.structure.task2Weight).toBe(2)
    })

    it('has Task 2 weighted twice as much as Task 1', () => {
      const blueprint = createFullWritingBlueprint('test-writing')
      expect(blueprint.structure.task2Weight).toBe(blueprint.structure.task1Weight * 2)
    })

    it('has 60 minutes official duration', () => {
      const blueprint = createFullWritingBlueprint('test-writing')
      expect(blueprint.timing.officialDurationSeconds).toBe(3600)
    })

    it('uses rubric scoring', () => {
      const blueprint = createFullWritingBlueprint('test-writing')
      expect(blueprint.scoring.scoringMethod).toBe('rubric')
      expect(blueprint.scoring.partialCredit).toBe(true)
    })
  })

  describe('Writing Task Blueprint', () => {
    it('creates Task 1 blueprint', () => {
      const blueprint = createWritingTaskBlueprint('test-task1', 1)
      expect(blueprint.structure.tasks).toBe(1)
      expect(blueprint.timing.estimatedDurationSeconds).toBe(1200)
    })

    it('creates Task 2 blueprint', () => {
      const blueprint = createWritingTaskBlueprint('test-task2', 2)
      expect(blueprint.structure.tasks).toBe(1)
      expect(blueprint.timing.estimatedDurationSeconds).toBe(2400)
    })
  })

  describe('Full Speaking Blueprint', () => {
    it('creates speaking simulation blueprint', () => {
      const blueprint = createFullSpeakingBlueprint('test-speaking')
      expect(blueprint.module).toBe('speaking')
      expect(blueprint.mode).toBe('full_test')
      expect(blueprint.family).toBe('speaking_session')
      expect(blueprint.structure.requiredParts).toBe(3)
    })

    it('has correct Part 2 timing', () => {
      const blueprint = createFullSpeakingBlueprint('test-speaking')
      expect(blueprint.structure.part2PreparationSeconds).toBe(60)
      expect(blueprint.structure.part2ResponseSeconds).toBe(120)
    })

    it('validates part order', () => {
      const blueprint = createFullSpeakingBlueprint('test-speaking')
      const partOrderRule = blueprint.validationRules.find(r => r.field === 'part_order')
      expect(partOrderRule).toBeDefined()
    })
  })

  describe('Blueprint Immutability', () => {
    it('freezes blueprint to prevent mutation', () => {
      const blueprint = createFullListeningBlueprint('test-freeze')
      const frozen = freezeBlueprint(blueprint)

      expect(() => {
        (frozen as any).module = 'reading'
      }).toThrow()
    })

    it('preserves all properties after freezing', () => {
      const blueprint = createFullReadingBlueprint('test-freeze')
      const frozen = freezeBlueprint(blueprint)

      expect(frozen.module).toBe(blueprint.module)
      expect(frozen.mode).toBe(blueprint.mode)
      expect(frozen.structure).toEqual(blueprint.structure)
    })
  })
})
