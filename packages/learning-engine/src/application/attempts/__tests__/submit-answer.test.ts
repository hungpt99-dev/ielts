import { describe, it, expect, vi } from 'vitest'
import { submitAnswer } from '../submit-answer'
import type { SubmitAnswerDependencies } from '../submit-answer'
import type { LearningAttempt, LearningAnswer } from '../../../domain/entities/learning-attempt'
import type { Exercise } from '../../../domain/entities/exercise'
import type { ExerciseQuestion } from '@ielts/shared'

function createMockDeps(
  overrides?: Partial<SubmitAnswerDependencies>,
): SubmitAnswerDependencies {
  return {
    sessionRepository: { getById: vi.fn(), save: vi.fn(), findActive: vi.fn() } as any,
    attemptRepository: {
      getById: vi.fn(),
      save: vi.fn(),
      findBySession: vi.fn(),
    } as any,
    exerciseRepository: {
      getById: vi.fn(),
      save: vi.fn(),
    } as any,
    tutorPort: {
      getLearnerContext: vi.fn(),
      selectTeachingStrategy: vi.fn(),
      generateEducationalContent: vi.fn(),
      evaluateOpenResponse: vi.fn(),
      explainFeedback: vi.fn(),
      recordLearningOutcome: vi.fn(),
    },
    mistakeRepository: {
      save: vi.fn(),
      findRecent: vi.fn(),
      findByPattern: vi.fn(),
      getRecurringPatterns: vi.fn(),
    } as any,
    eventPublisher: { publish: vi.fn(), publishMany: vi.fn() } as any,
    ...overrides,
  }
}

function createEssayExercise(overrides?: Partial<Exercise>): Exercise {
  return {
    id: 'exercise-1',
    sessionId: 'session-1',
    skill: 'writing',
    exerciseType: 'essay',
    objectiveId: 'obj-1',
    title: 'Writing Task 2',
    instructions: 'Write an essay',
    questions: [{
      type: 'essay',
      prompt: 'Some people believe that unpaid community service should be compulsory.',
      wordLimit: 250,
      rubric: ['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'],
    } as ExerciseQuestion],
    difficulty: 'medium',
    estimatedMinutes: 40,
    sourceType: 'built-in',
    sourceIds: [],
    explanationPolicy: 'after-attempt',
    evaluationPolicy: 'ai-assisted',
    metadata: {
      focusAreas: [],
      contextSnapshotHash: '',
      schemaVersion: '1.0.0',
    },
    ...overrides,
  }
}

function createSpeakingExercise(): Exercise {
  return {
    id: 'exercise-2',
    sessionId: 'session-1',
    skill: 'speaking',
    exerciseType: 'speaking',
    objectiveId: 'obj-1',
    title: 'Speaking Part 1',
    instructions: 'Answer the questions',
    questions: [{
      type: 'speaking-response',
      prompt: 'Describe your hometown',
      preparationSeconds: 30,
      responseSeconds: 60,
      tips: ['Give details'],
    } as ExerciseQuestion],
    difficulty: 'medium',
    estimatedMinutes: 10,
    sourceType: 'built-in',
    sourceIds: [],
    explanationPolicy: 'after-attempt',
    evaluationPolicy: 'ai-assisted',
    metadata: {
      focusAreas: [],
      contextSnapshotHash: '',
      schemaVersion: '1.0.0',
    },
  }
}

function createMultipleChoiceExercise(): Exercise {
  return {
    id: 'exercise-3',
    sessionId: 'session-1',
    skill: 'reading',
    exerciseType: 'quiz',
    objectiveId: 'obj-1',
    title: 'Reading Quiz',
    instructions: 'Choose the correct answer',
    questions: [{
      type: 'multiple-choice',
      question: 'What is the capital of France?',
      options: ['London', 'Paris', 'Berlin'],
      correctIndex: 1,
      explanation: 'Paris is the capital of France.',
    } as ExerciseQuestion],
    difficulty: 'easy',
    estimatedMinutes: 5,
    sourceType: 'built-in',
    sourceIds: [],
    explanationPolicy: 'after-attempt',
    evaluationPolicy: 'deterministic',
    metadata: {
      focusAreas: [],
      contextSnapshotHash: '',
      schemaVersion: '1.0.0',
    },
  }
}

function createAttempt(overrides?: Partial<LearningAttempt>): LearningAttempt {
  return {
    id: 'attempt-1',
    sessionId: 'session-1',
    exerciseId: 'exercise-1',
    status: 'in-progress',
    answers: [],
    startedAt: new Date().toISOString(),
    timeSpentMs: 0,
    hintsUsed: 0,
    version: 1,
    ...overrides,
  }
}

function createAnswer(questionId: string, answer: unknown): LearningAnswer {
  return {
    questionId,
    answer,
    answeredAt: new Date().toISOString(),
    timeSpentMs: 120000,
    isFinal: true,
  }
}

const mockWritingEvaluation = {
  overallBand: 6.5,
  taskAchievement: { score: 6, maximumScore: 9, feedback: 'Good', evidence: 'Task completed' },
  coherenceAndCohesion: { score: 6.5, maximumScore: 9, feedback: 'Good structure', evidence: 'Clear paragraphs' },
  lexicalResource: { score: 6, maximumScore: 9, feedback: 'Adequate', evidence: 'Some range' },
  grammaticalRange: { score: 6.5, maximumScore: 9, feedback: 'Good control', evidence: 'Mix of structures' },
  strengths: ['Clear structure', 'Good examples'],
  weaknesses: ['Limited vocabulary range', 'Some grammatical errors'],
  corrections: [
    { original: 'peoples', corrected: 'people', explanation: 'People is already plural' },
  ],
  improvementPriorities: ['Expand vocabulary', 'Use more complex structures'],
  practiceRecommendation: 'Practice writing about familiar topics',
  confidence: 0.8,
  limitations: [],
}

const mockSpeakingEvaluation = {
  overallBand: 6,
  fluencyAndCoherence: { score: 6, maximumScore: 9, feedback: 'Good fluency', evidence: 'Smooth delivery' },
  lexicalResource: { score: 5.5, maximumScore: 9, feedback: 'Limited range', evidence: 'Basic vocabulary' },
  grammaticalRange: { score: 6, maximumScore: 9, feedback: 'Good control', evidence: 'Some complex structures' },
  strengths: ['Good fluency', 'Clear pronunciation'],
  weaknesses: ['Limited vocabulary', 'Simple grammar'],
  corrections: [
    { original: 'I goes', corrected: 'I go', explanation: 'Use base form after I' },
  ],
  improvementPriorities: ['Expand vocabulary', 'Use more complex grammar'],
  practiceRecommendation: 'Practice speaking on various topics',
  confidence: 0.75,
  limitations: [],
}

describe('submitAnswer — AI evaluation path', () => {
  it('calls evaluateOpenResponse for essay questions and maps result', async () => {
    const exercise = createEssayExercise()
    const attempt = createAttempt({ exerciseId: exercise.id, status: 'in-progress' })
    const answer = createAnswer('Some people believe that unpaid community service should be compulsory.', 'I believe that community service is important because...')

    const evaluateOpenResponse = vi.fn().mockResolvedValue({
      success: true,
      data: mockWritingEvaluation,
    })

    const deps = createMockDeps({
      tutorPort: {
        ...createMockDeps().tutorPort,
        evaluateOpenResponse,
      },
    })

    deps.attemptRepository.getById = vi.fn().mockResolvedValue(attempt)
    deps.exerciseRepository.getById = vi.fn().mockResolvedValue(exercise)

    const result = await submitAnswer(
      { sessionId: 'session-1', attemptId: 'attempt-1', answers: [answer], correlationId: 'corr-1' },
      deps,
    )

    expect(evaluateOpenResponse).toHaveBeenCalledTimes(1)
    const callArg = evaluateOpenResponse.mock.calls[0][0]
    expect(callArg.response).toBe('I believe that community service is important because...')
    expect(callArg.rubric).toEqual(['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'])

    expect(result.evaluation).toHaveLength(1)
    expect(result.evaluation[0].score).toBe(6.5)
    expect(result.evaluation[0].maximumScore).toBe(9)
    expect(result.evaluation[0].evaluatedBy).toBe('ai-only')
    expect(result.evaluation[0].mistakes).toHaveLength(1)
    expect(result.evaluation[0].mistakes[0].originalResponse).toBe('peoples')
    expect(result.evaluation[0].skillEvidence.length).toBeGreaterThanOrEqual(1)
  })

  it('calls evaluateOpenResponse for speaking-response questions and maps result', async () => {
    const exercise = createSpeakingExercise()
    const attempt = createAttempt({ exerciseId: exercise.id, status: 'in-progress' })
    const answer = createAnswer('Describe your hometown', 'My hometown is a small city in the north...')

    const evaluateOpenResponse = vi.fn().mockResolvedValue({
      success: true,
      data: mockSpeakingEvaluation,
    })

    const deps = createMockDeps({
      tutorPort: {
        ...createMockDeps().tutorPort,
        evaluateOpenResponse,
      },
    })

    deps.attemptRepository.getById = vi.fn().mockResolvedValue(attempt)
    deps.exerciseRepository.getById = vi.fn().mockResolvedValue(exercise)

    const result = await submitAnswer(
      { sessionId: 'session-1', attemptId: 'attempt-1', answers: [answer], correlationId: 'corr-1' },
      deps,
    )

    expect(evaluateOpenResponse).toHaveBeenCalledTimes(1)
    const callArg = evaluateOpenResponse.mock.calls[0][0]
    expect(callArg.response).toBe('My hometown is a small city in the north...')
    expect(Array.isArray(callArg.rubric)).toBe(true)

    expect(result.evaluation).toHaveLength(1)
    expect(result.evaluation[0].score).toBe(6)
    expect(result.evaluation[0].maximumScore).toBe(9)
    expect(result.evaluation[0].evaluatedBy).toBe('ai-only')
    expect(result.evaluation[0].mistakes).toHaveLength(1)
  })

  it('falls back to not-evaluable when AI evaluation fails', async () => {
    const exercise = createEssayExercise()
    const attempt = createAttempt({ exerciseId: exercise.id, status: 'in-progress' })
    const answer = createAnswer('Some people believe that unpaid community service should be compulsory.', 'My essay content...')

    const evaluateOpenResponse = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'ai_unavailable', message: 'AI is not available', recoverable: true },
    })

    const deps = createMockDeps({
      tutorPort: {
        ...createMockDeps().tutorPort,
        evaluateOpenResponse,
      },
    })

    deps.attemptRepository.getById = vi.fn().mockResolvedValue(attempt)
    deps.exerciseRepository.getById = vi.fn().mockResolvedValue(exercise)

    const result = await submitAnswer(
      { sessionId: 'session-1', attemptId: 'attempt-1', answers: [answer], correlationId: 'corr-1' },
      deps,
    )

    expect(result.evaluation[0].status).toBe('not-evaluable')
    expect(typeof result.evaluation[0].feedback).toBe('string')
    expect(result.evaluation[0].feedback.length).toBeGreaterThan(0)
  })

  it('uses deterministic grading for multiple-choice questions', async () => {
    const exercise = createMultipleChoiceExercise()
    const attempt = createAttempt({ exerciseId: exercise.id, status: 'in-progress' })
    const answer = createAnswer('What is the capital of France?', 1)

    const evaluateOpenResponse = vi.fn()
    const deps = createMockDeps({
      tutorPort: {
        ...createMockDeps().tutorPort,
        evaluateOpenResponse,
      },
    })

    deps.attemptRepository.getById = vi.fn().mockResolvedValue(attempt)
    deps.exerciseRepository.getById = vi.fn().mockResolvedValue(exercise)

    const result = await submitAnswer(
      { sessionId: 'session-1', attemptId: 'attempt-1', answers: [answer], correlationId: 'corr-1' },
      deps,
    )

    expect(evaluateOpenResponse).not.toHaveBeenCalled()
    expect(result.evaluation[0].status).toBe('correct')
    expect(result.evaluation[0].score).toBe(1)
    expect(result.evaluation[0].evaluatedBy).toBe('deterministic')
  })

  it('marks attempt as completed when all evaluations are final', async () => {
    const exercise = createEssayExercise()
    const attempt = createAttempt({ exerciseId: exercise.id, status: 'in-progress' })
    const answer = createAnswer('Some people believe that unpaid community service should be compulsory.', 'My essay content...')

    const evaluateOpenResponse = vi.fn().mockResolvedValue({
      success: true,
      data: mockWritingEvaluation,
    })

    const deps = createMockDeps({
      tutorPort: {
        ...createMockDeps().tutorPort,
        evaluateOpenResponse,
      },
    })

    deps.attemptRepository.getById = vi.fn().mockResolvedValue(attempt)
    deps.exerciseRepository.getById = vi.fn().mockResolvedValue(exercise)

    const result = await submitAnswer(
      { sessionId: 'session-1', attemptId: 'attempt-1', answers: [answer], correlationId: 'corr-1' },
      deps,
    )

    expect(result.completed).toBe(true)
  })
})
