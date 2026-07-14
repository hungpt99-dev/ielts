import type { GenerateLearningActivityRequest, GenerateLearningActivityResult } from '../../domain/entities/learning-activity'
import type { Exercise, ExerciseSourceType, EvaluationPolicy, GenerateExerciseRequest } from '../../domain/entities/exercise'
import type { LearningSessionRepository, ExerciseRepository } from '../../ports/session-repository'
import type { TutorIntelligencePort } from '../../ports/tutor-intelligence-port'
import type { LearningEventPublisher } from '../../ports/learning-event-publisher'
import { determineDifficulty } from '../../domain/policies/difficulty-policy'
import { selectQuestionTypes, estimateQuestionCount } from '../../domain/policies/question-count-policy'
import type { LearnerContextPort } from '../../ports/learner-context-port'
import type { SkillRegistry } from '../../skills/skill-registry'
import { buildReadingPassagePrompt, buildPracticeQuestionsPrompt, buildPracticeQuestionsSystemPrompt } from '@ielts/ai'

export interface GenerateActivityDependencies {
  sessionRepository: LearningSessionRepository
  exerciseRepository: ExerciseRepository
  tutorPort: TutorIntelligencePort
  contextPort: LearnerContextPort
  eventPublisher?: LearningEventPublisher
  skillRegistry?: SkillRegistry
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

  const skillModule = deps.skillRegistry?.get(request.skill as any)

  if (skillModule) {
    const supportsRequest: GenerateExerciseRequest = {
      objective: session.objective,
      skill: request.skill,
      contextScope: request.contextScope,
      sourceContent: request.sourceContent ? { passage: request.sourceContent.text, referenceUrl: request.sourceContent.sourceUrl } : undefined,
      constraints: { availableMinutes: request.availableMinutes, offlineOnly: !context.constraints.aiAvailable },
      correlationId: request.correlationId,
    }
    if (skillModule.supports(supportsRequest)) {
      try {
        const skillResult = await skillModule.generateActivity({
          skill: request.skill as any,
          objectiveId: request.objectiveId,
          availableMinutes: request.availableMinutes,
          difficulty: difficultyDecision.level,
          targetBand: context.learner.targetOverallBand,
          currentBand: context.learner.currentOverallBand,
          recentMistakes: context.recentMistakes.map(m => ({
            id: `${m.skill}-${m.category}`,
            skill: m.skill,
            category: m.category,
            originalResponse: '',
            correctedResponse: '',
            explanation: '',
            sourceExerciseId: '',
            sourceQuestionId: '',
            occurredAt: m.lastOccurred,
            recurrenceCount: m.frequency,
            severity: 'moderate' as const,
            confidence: 0.5,
            reviewStatus: 'unreviewed' as const,
          })),
          focusAreas: [],
          correlationId: request.correlationId,
        })
        if (skillResult.exercise) {
          exercise.questions = skillResult.exercise.questions ?? []
          exercise.title = skillResult.exercise.title ?? exercise.title
          exercise.instructions = skillResult.exercise.instructions ?? exercise.instructions
          exercise.content = skillResult.exercise.content ?? exercise.content
        }
      } catch (error) {
        console.error('packages/learning-engine/src/application/activities/generate-learning-activity.ts error:', error);
        /* fall through to AI or offline templates */
      }
    }
  }

  if (exercise.questions.length === 0 && context.constraints.aiAvailable) {
    try {
    const isReading = request.skill === 'reading'
    const readingPrompt = isReading ? buildReadingPassagePrompt(difficultyDecision.level, questionCount, request.sourceContent?.text) : null
    const aiResult = await deps.tutorPort.generateEducationalContent<any>({
      systemPrompt: readingPrompt?.systemPrompt ?? buildPracticeQuestionsSystemPrompt(request.skill, request.activityType, questionCount, difficultyDecision.level),
      userMessage: readingPrompt?.userMessage ?? `${buildPracticeQuestionsPrompt(request.skill, request.activityType, questionCount, difficultyDecision.level)}\n${request.sourceContent ? `Content: ${request.sourceContent.text.slice(0, 1000)}` : ''}`,
      schema: {},
    })
      if (aiResult.success && aiResult.data) {
        const raw = aiResult.data
        if (isReading && raw.passage) {
          exercise.content = { ...exercise.content, passage: raw.passage }
          exercise.title = raw.title ?? exercise.title
        }
        const items = Array.isArray(raw) ? raw : (raw.questions ?? [raw])
        exercise.questions = items.map((q: any) => ({
          type: (q.type === 'true-false-not-given' || q.type === 'gap-fill' ? q.type : 'multiple-choice') as any,
          question: q.question ?? q.Question ?? '',
          options: q.options ?? q.Options ?? ['Option A', 'Option B', 'Option C', 'Option D'],
          correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : (typeof q.answer === 'number' ? q.answer : 0),
          explanation: q.explanation ?? q.Explanation ?? '',
        })).filter((q: any) => q.question)
      }
    } catch (error) {
      console.error('packages/learning-engine/src/application/activities/generate-learning-activity.ts error:', error);
      /* fall through to offline templates */
    }
  }

  if (exercise.questions.length === 0) {
    exercise.questions = generateOfflineQuestions(request.skill, questionCount, difficultyDecision.level)
  }

  await deps.exerciseRepository.save(exercise)

  if (deps.eventPublisher) {
    deps.eventPublisher.publish({
      id: crypto.randomUUID?.() ?? `${Date.now()}-evt`,
      type: 'exercise_generated',
      occurredAt: new Date().toISOString(),
      source: 'learning-engine',
      sessionId: request.sessionId,
      exerciseId: exercise.id,
      skill: request.skill,
      sourceType,
      schemaVersion: '1.0',
    })
  }

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
