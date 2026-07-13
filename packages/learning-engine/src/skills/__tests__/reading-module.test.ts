import { describe, it, expect } from 'vitest'
import { ReadingSkillModule } from '../reading/reading-module'

const baseRequest = {
  availableMinutes: 20,
  objectiveId: 'o-1',
  correlationId: 'c-1',
  focusAreas: [] as string[],
  recentMistakes: [],
}

describe('ReadingSkillModule', () => {
  const module = new ReadingSkillModule()

  it('has reading skill', () => {
    expect(module.skill).toBe('reading')
  })

  it('supports reading requests', () => {
    expect(module.supports({ skill: 'reading' } as any)).toBe(true)
    expect(module.supports({ skill: 'writing' } as any)).toBe(false)
  })

  it('generates activities with questions', async () => {
    const result = await module.generateActivity({
      ...baseRequest,
      skill: 'reading',
      difficulty: 'easy',
    })

    expect(result).toBeDefined()
    expect(result.exercise).toBeDefined()
    expect(result.exercise.questions.length).toBeGreaterThan(0)
  })

  it('generates hard difficulty with advanced passages', async () => {
    const result = await module.generateActivity({
      ...baseRequest,
      skill: 'reading',
      difficulty: 'hard',
    })

    expect(result.exercise.questions.length).toBeGreaterThan(0)
  })

  it('generates medium difficulty passages', async () => {
    const result = await module.generateActivity({
      ...baseRequest,
      skill: 'reading',
      difficulty: 'medium',
    })

    expect(result.exercise.questions.length).toBeGreaterThan(0)
  })

  it('evaluates answers deterministically', async () => {
    const result = await module.generateActivity({
      ...baseRequest,
      skill: 'reading',
      difficulty: 'easy',
    })

    const question = result.exercise.questions[0]
    const answer = question.type === 'multiple-choice' ? question.correctIndex : (question as any).answer

    const evaluation = await module.evaluate({
      exercise: result.exercise,
      answers: { 'q-0': answer },
      skill: 'reading',
    })

    expect(evaluation.evaluations).toHaveLength(1)
    expect(evaluation.evaluations[0].status).toBe('correct')
  })
})
