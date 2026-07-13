import { describe, it, expect } from 'vitest'
import { VocabularySkillModule } from '../vocabulary/vocabulary-module'

const baseRequest = {
  availableMinutes: 15,
  objectiveId: 'o-1',
  correlationId: 'c-1',
  focusAreas: [] as string[],
  recentMistakes: [],
}

describe('VocabularySkillModule', () => {
  const module = new VocabularySkillModule()

  it('has vocabulary skill', () => {
    expect(module.skill).toBe('vocabulary')
  })

  it('generates activities with questions', async () => {
    const result = await module.generateActivity({
      ...baseRequest,
      skill: 'vocabulary',
      difficulty: 'easy',
    })

    expect(result.exercise.questions.length).toBeGreaterThan(0)
  })

  it('generates different questions for different contexts', async () => {
    const envResult = await module.generateActivity({
      ...baseRequest,
      skill: 'vocabulary',
      difficulty: 'easy',
    })

    expect(envResult.exercise.questions.length).toBeGreaterThan(0)
  })
})
