import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleTaskCompletion } from '../TaskCompletionHandler'
import { generateExercise } from '../../services/ExerciseGenerator'
import type { TaskEntry } from '../../models'

vi.mock('../../services/ExerciseGenerator', () => ({
  generateExercise: vi.fn(),
}))

vi.mock('../../services/storage/SettingsStorage', () => ({
  loadAppSettings: vi.fn(() => ({
    weakSkills: ['Speaking'],
    currentBand: 5.5,
    targetBand: 7.0,
    preferredTopics: [],
    dailyStudyMinutes: 60,
    examDate: '',
    studyReminder: '',
    studyGoal: 'academic' as const,
    preferredSchedule: [],
    aiApiKey: '',
    aiProvider: 'openai' as const,
    aiEndpoint: '',
    aiModel: '',
    darkMode: false,
    aiEnabled: false,
  })),
}))

function makeTask(overrides: Partial<TaskEntry> = {}): TaskEntry {
  const now = new Date().toISOString()
  return {
    id: 'task-1',
    title: 'Practice Speaking About Hobbies',
    description: 'Practice speaking fluently about your hobbies',
    category: 'Speaking Part 1',
    date: now,
    isDone: false,
    isRecurring: false,
    recurringDays: [],
    notes: '',
    timeMinutes: 20,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    ...overrides,
  }
}

function makeExercise() {
  return {
    id: 'ex-1',
    title: 'Speaking - Hobbies Practice',
    skill: 'speaking' as const,
    topic: 'Hobbies',
    source: 'user-created' as const,
    difficulty: 'intermediate' as const,
    questions: [],
    totalPoints: 20,
    estimatedMinutes: 20,
    status: 'published' as const,
    tags: ['speaking', 'hobbies'],
    sourceId: 'task-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

describe('handleTaskCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates exercise on task completion', async () => {
    const task = makeTask()
    const exercise = makeExercise()
    vi.mocked(generateExercise).mockResolvedValue(exercise)

    const result = await handleTaskCompletion(task)

    expect(generateExercise).toHaveBeenCalledWith(
      task,
      expect.objectContaining({
        weakSkills: ['Speaking'],
        currentBand: 5.5,
        targetBand: 7.0,
      }),
    )
    expect(result.exercise).toEqual(exercise)
    expect(result.error).toBeNull()
  })

  it('returns exercise with speaking skill for speaking tasks', async () => {
    const task = makeTask({ category: 'Speaking Part 2' })
    const exercise = makeExercise()
    vi.mocked(generateExercise).mockResolvedValue(exercise)

    const result = await handleTaskCompletion(task)

    expect(result.exercise?.skill).toBe('speaking')
    expect(result.error).toBeNull()
  })

  it('returns error on generation failure', async () => {
    const task = makeTask()
    vi.mocked(generateExercise).mockRejectedValue(new Error('Generation failed'))

    const result = await handleTaskCompletion(task)

    expect(result.exercise).toBeNull()
    expect(result.error).toBe('Generation failed')
  })

  it('handles unknown errors gracefully', async () => {
    const task = makeTask()
    vi.mocked(generateExercise).mockRejectedValue('some string error')

    const result = await handleTaskCompletion(task)

    expect(result.exercise).toBeNull()
    expect(result.error).toBe('Unknown error generating exercise')
  })
})
