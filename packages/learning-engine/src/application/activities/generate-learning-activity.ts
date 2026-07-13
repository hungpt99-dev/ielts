import type { GenerateLearningActivityRequest, GenerateLearningActivityResult } from '../../domain/entities/learning-activity'
import type { Exercise, ExerciseSourceType, EvaluationPolicy } from '../../domain/entities/exercise'
import type { LearningSessionRepository, ExerciseRepository } from '../../ports/session-repository'
import type { TutorIntelligencePort } from '../../ports/tutor-intelligence-port'
import { determineDifficulty } from '../../domain/policies/difficulty-policy'
import { selectQuestionTypes, estimateQuestionCount } from '../../domain/policies/question-count-policy'
import type { LearnerContextPort } from '../../ports/learner-context-port'

export interface GenerateActivityDependencies {
  sessionRepository: LearningSessionRepository
  exerciseRepository: ExerciseRepository
  tutorPort: TutorIntelligencePort
  contextPort: LearnerContextPort
}

export async function generateLearningActivity(
  request: GenerateLearningActivityRequest,
  deps: GenerateActivityDependencies,
): Promise<GenerateLearningActivityResult> {
  const session = await deps.sessionRepository.getById(request.sessionId)
  if (!session) {
    throw new Error(`Session ${request.sessionId} not found`)
  }

  const context = await deps.contextPort.buildLearningContext({
    scope: request.contextScope as any,
    skill: request.skill,
  })

  const difficultyDecision = determineDifficulty({
    currentBand: context.learner.currentOverallBand,
    targetBand: context.learner.targetOverallBand,
    recentAccuracy: context.progress.recentAccuracy[request.skill],
    consecutiveCorrect: 0,
    consecutiveMistakes: 0,
    totalAttempts: 0,
    timeSpentMs: 0,
    hintsUsed: 0,
  })

  const questionTypes = selectQuestionTypes(request.skill, request.activityType)
  const questionCount = estimateQuestionCount(
    request.availableMinutes,
    questionTypes,
    2,
  )

  const exerciseId = crypto.randomUUID?.() ?? `${Date.now()}-ex`
  const sourceType: ExerciseSourceType = context.constraints.aiAvailable ? 'ai-generated' : 'built-in'
  const evaluationPolicy: EvaluationPolicy = 'deterministic'

  const exercise: Exercise = {
    id: exerciseId,
    sessionId: request.sessionId,
    skill: request.skill,
    exerciseType: request.activityType === 'guided-exercise' ? 'quiz' : 'comprehension',
    objectiveId: request.objectiveId,
    title: `${request.skill.charAt(0).toUpperCase() + request.skill.slice(1)} Practice`,
    instructions: `Complete the following ${questionCount} question${questionCount > 1 ? 's' : ''} at ${difficultyDecision.level} difficulty.`,
    content: request.sourceContent ? {
      passage: request.sourceContent.text,
      referenceUrl: request.sourceContent.sourceUrl,
    } : undefined,
    questions: [],
    difficulty: difficultyDecision.level,
    estimatedMinutes: request.availableMinutes,
    sourceType,
    sourceIds: request.sourceContent ? [request.sourceContent.id] : [],
    explanationPolicy: 'after-attempt',
    evaluationPolicy,
    metadata: {
      focusAreas: [],
      templateId: 'built-in',
      contextSnapshotHash: context.generatedAt,
      schemaVersion: '1.0',
    },
  }

  if (context.constraints.aiAvailable) {
    try {
    const aiResult = await deps.tutorPort.generateEducationalContent<any>({
      systemPrompt: `You are an IELTS ${request.skill} tutor. Generate ${questionCount} ${request.activityType} questions at ${difficultyDecision.level} difficulty.`,
      userMessage: `Generate ${request.activityType} questions for ${request.skill} practice.\n${request.sourceContent ? `Content: ${request.sourceContent.text.slice(0, 1000)}` : ''}`,
      schema: { questions: [] },
    })
      if (aiResult.success && aiResult.data) {
        exercise.questions = (aiResult.data?.questions ?? []).map((q: any) => ({
          type: 'multiple-choice' as const,
          question: q.question,
          options: q.options ?? [],
          correctIndex: 0,
          explanation: q.explanation,
        }))
      }
    } catch {
      /* fall through to offline templates */
    }
  }

  if (exercise.questions.length === 0) {
    exercise.questions = generateOfflineQuestions(request.skill, questionCount, difficultyDecision.level)
  }

  await deps.exerciseRepository.save(exercise)

  const activity = {
    id: crypto.randomUUID?.() ?? `${Date.now()}-act`,
    sessionId: request.sessionId,
    type: request.activityType,
    skill: request.skill,
    title: exercise.title,
    instructions: exercise.instructions,
    estimatedMinutes: request.availableMinutes,
    order: 0,
    exercise,
    completed: false,
  }

  return {
    activity,
    aiUsed: exercise.sourceType === 'ai-generated',
    cacheHit: false,
  }
}

function generateOfflineQuestions(
  skill: string,
  count: number,
  _difficulty: string,
): Exercise['questions'] {
  const questions: Exercise['questions'] = []
  const topics: Record<string, string[]> = {
    writing: ['What is the main argument in the passage?', 'Identify the topic sentence.', 'Which evidence supports the conclusion?'],
    reading: ['What is the main idea of this text?', 'Which statement best summarizes the passage?', 'What can be inferred from the text?'],
    listening: ['What is the speaker mainly discussing?', 'What does the speaker imply?', 'Which detail is mentioned?'],
    speaking: ['Describe the main points.', 'What is your opinion on this topic?', 'How would you respond?'],
    vocabulary: ['What does this word mean?', 'Which synonym fits best?', 'Use this word in a sentence.'],
    grammar: ['Identify the grammatical error.', 'Which sentence is correct?', 'Rewrite this sentence correctly.'],
  }

  const pool = topics[skill] ?? topics.reading
  for (let i = 0; i < count && i < pool.length; i++) {
    questions.push({
      type: 'multiple-choice',
      question: pool[i],
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
      explanation: 'Review the material for more detail.',
    })
  }

  return questions
}
