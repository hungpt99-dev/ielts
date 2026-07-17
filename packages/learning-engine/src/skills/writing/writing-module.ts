import type { IELTSSection } from '../../domain/value-objects'
import type { Exercise, GenerateExerciseRequest } from '../../domain/entities/exercise'
import type { ExerciseQuestion } from '@ielts/shared'
import type { AnswerEvaluation } from '../../domain/entities/evaluation'
import type { MistakeEvidence } from '../../domain/entities/mistake-evidence'
import type { SkillEvidence } from '../../domain/entities/skill-evidence'
import type {
  LearningSkillModule,
  SkillActivityGenerationRequest,
  SkillActivityGenerationResult,
  SkillEvaluationRequest,
  SkillEvaluationResult,
  SkillReviewRequest,
  SkillReviewResult,
} from '../skill-module'

interface WritingPrompt {
  taskType: string
  prompt: string
  wordLimit: number
  timeMinutes: number
  rubric: string[]
  difficulty: string
  focusArea?: string
}

const PROMPTS: WritingPrompt[] = [
  {
    taskType: 'task2',
    prompt: 'Some people believe that unpaid community service should be a compulsory part of high school programs. To what extent do you agree or disagree?',
    wordLimit: 250,
    timeMinutes: 40,
    rubric: ['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'],
    difficulty: 'medium',
  },
  {
    taskType: 'task2',
    prompt: 'In many countries, the amount of crime is increasing. What do you think are the main causes of crime? How can we deal with those causes?',
    wordLimit: 250,
    timeMinutes: 40,
    rubric: ['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'],
    difficulty: 'medium',
  },
  {
    taskType: 'task2',
    prompt: 'Some people think that governments should spend more money on public services rather than on arts such as music and painting. To what extent do you agree or disagree?',
    wordLimit: 250,
    timeMinutes: 40,
    rubric: ['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'],
    difficulty: 'medium',
    focusArea: 'thesis',
  },
  {
    taskType: 'task2',
    prompt: 'Globalization has both advantages and disadvantages. Discuss both views and give your own opinion.',
    wordLimit: 250,
    timeMinutes: 40,
    rubric: ['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'],
    difficulty: 'hard',
  },
  {
    taskType: 'task1',
    prompt: 'The chart below shows the percentage of households in different income groups who owned various electronic devices in 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.',
    wordLimit: 150,
    timeMinutes: 20,
    rubric: ['Task Achievement', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'],
    difficulty: 'medium',
    focusArea: 'coherence',
  },
  {
    taskType: 'task1',
    prompt: 'The table below gives information about the average daily water consumption in four different countries. Summarize the information by selecting and reporting the main features.',
    wordLimit: 150,
    timeMinutes: 20,
    rubric: ['Task Achievement', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'],
    difficulty: 'easy',
  },
  {
    taskType: 'task2',
    prompt: 'Some people believe that studying online is more effective than studying in a traditional classroom. Discuss the advantages and disadvantages of both approaches.',
    wordLimit: 250,
    timeMinutes: 40,
    rubric: ['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'],
    difficulty: 'easy',
    focusArea: 'lexical',
  },
  {
    taskType: 'task2',
    prompt: 'Many people today are choosing to work from home rather than in a traditional office. Is this a positive or negative development?',
    wordLimit: 250,
    timeMinutes: 40,
    rubric: ['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'],
    difficulty: 'easy',
  },
  {
    taskType: 'task2',
    prompt: 'Climate change is one of the biggest challenges facing the world today. What measures can individuals and governments take to combat climate change?',
    wordLimit: 250,
    timeMinutes: 40,
    rubric: ['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'],
    difficulty: 'medium',
  },
]

const SHORT_EXERCISES: Array<{ prompt: string; focus: string; area: string }> = [
  { prompt: 'Write a thesis statement for an essay about the benefits of renewable energy.', focus: 'thesis', area: 'thesis' },
  { prompt: 'Write a topic sentence for a paragraph about the advantages of international travel.', focus: 'coherence', area: 'coherence' },
  { prompt: 'Rewrite this sentence using more formal academic vocabulary: "A lot of people think that the government should do something about pollution."', focus: 'lexical', area: 'lexical' },
  { prompt: 'Write a concluding paragraph for an essay about the impact of social media on society.', focus: 'coherence', area: 'coherence' },
  { prompt: 'Write an introduction paragraph for an essay about whether university education should be free.', focus: 'thesis', area: 'thesis' },
]

function selectPrompt(request: SkillActivityGenerationRequest): WritingPrompt {
  const matching = PROMPTS.filter(p => {
    if (request.focusAreas.includes(p.focusArea ?? '')) return true
    const band = request.currentBand ?? request.targetBand ?? 5.5
    if (p.difficulty === 'easy' && band >= 4 && band <= 5.5) return true
    if (p.difficulty === 'medium' && band >= 5 && band <= 7) return true
    if (p.difficulty === 'hard' && band >= 6.5) return true
    return false
  })

  if (matching.length === 0) return PROMPTS[0]
  const scored = matching.map(p => {
    let score = 0
    if (p.timeMinutes <= request.availableMinutes + 10) score += 2
    if (request.focusAreas.includes(p.focusArea ?? '')) score += 3
    return { prompt: p, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0].prompt
}

export class WritingSkillModule implements LearningSkillModule {
  readonly skill: IELTSSection = 'writing'

  supports(request: GenerateExerciseRequest): boolean {
    return request.skill === 'writing'
  }

  async generateActivity(request: SkillActivityGenerationRequest): Promise<SkillActivityGenerationResult> {
    const isShortExercise = request.availableMinutes <= 15 || request.focusAreas.some(f => ['thesis', 'coherence', 'lexical'].includes(f))
    let questions: ExerciseQuestion[]

    if (isShortExercise) {
      const matching = SHORT_EXERCISES.filter(e => request.focusAreas.includes(e.area))
      const selected = matching.length > 0 ? matching : [SHORT_EXERCISES[Math.floor(Math.random() * SHORT_EXERCISES.length)]]
      questions = selected.map(e => ({
        type: 'essay' as const,
        prompt: e.prompt,
        wordLimit: 100,
        rubric: ['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'],
      }))
    } else {
      const prompt = selectPrompt(request)
      questions = [{
        type: 'essay',
        prompt: prompt.prompt,
        wordLimit: prompt.wordLimit,
        rubric: prompt.rubric,
      }]
    }

    const exercise: Exercise = {
      id: `writing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'writing',
      exerciseType: isShortExercise ? 'essay' : 'essay',
      objectiveId: request.objectiveId,
      title: isShortExercise ? 'Focused Writing Practice' : `Writing Task 2 Practice`,
      instructions: isShortExercise
        ? 'Write a focused response addressing the specific skill area.'
        : 'Plan your response, write a clear structure with introduction, body paragraphs, and conclusion. Review for errors before submitting.',
      questions,
      difficulty: request.difficulty as any || 'medium',
      estimatedMinutes: request.availableMinutes,
      sourceType: 'built-in',
      sourceIds: [],
      explanationPolicy: 'after-attempt' as const,
      evaluationPolicy: 'ai-assisted' as const,
      metadata: {
        targetBand: request.targetBand,
        focusAreas: request.focusAreas,
        contextSnapshotHash: '',
        schemaVersion: '1.0.0',
      },
    }

    return { exercise, aiUsed: false, cacheHit: false }
  }

  async evaluate(request: SkillEvaluationRequest): Promise<SkillEvaluationResult> {
    const evaluations: AnswerEvaluation[] = []
    const mistakes: MistakeEvidence[] = []
    const skillEvidence: SkillEvidence[] = []

    const entries = Object.entries(request.answers)
    for (let i = 0; i < request.exercise.questions.length; i++) {
      const answerEntry = entries.find(([key]) => key === `q-${i}`)
      if (!answerEntry) continue

      const userAnswer = String(answerEntry[1])
      const wordCount = userAnswer.split(/\s+/).filter(Boolean).length
      const hasContent = wordCount > 10
      const isDetailed = wordCount > 50

      evaluations.push({
        questionId: `q-${i}`,
        status: isDetailed ? 'correct' : hasContent ? 'partially-correct' : 'incorrect',
        score: isDetailed ? Math.min(wordCount / 250, 1) * 9 : hasContent ? Math.min(wordCount / 100, 1) * 5 : 0,
        maximumScore: 9,
        feedback: isDetailed
          ? `Your response is ${wordCount} words. Good effort. For IELTS, aim for clear paragraph structure with a main idea and supporting examples.`
          : hasContent
          ? 'Your response needs more development. Add specific examples and explanations to support your points.'
          : 'Please provide a more detailed response. Write at least several sentences to demonstrate your writing ability.',
        evaluatedBy: 'deterministic',
        confidence: 0.5,
        mistakes: [],
        skillEvidence: [],
      })

      if (hasContent) {
        skillEvidence.push({
          skill: 'writing',
          type: isDetailed ? 'strength' : 'improvement',
          description: `Writing response: ${wordCount} words submitted`,
          score: Math.min(wordCount, 250),
          maximumScore: 250,
          accuracy: Math.min(Math.round((wordCount / 250) * 100), 100),
          sourceExerciseId: request.exercise.id,
          sourceSessionId: request.exercise.sessionId ?? '',
          occurredAt: new Date().toISOString(),
          confidence: 0.5,
        })
      } else {
        mistakes.push({
          id: `writing-mistake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          skill: 'writing',
          category: 'response-length',
          originalResponse: userAnswer,
          correctedResponse: 'Expand your response with a clear structure, main ideas, and supporting examples.',
          explanation: 'IELTS Writing tasks require a well-developed response. Short answers do not demonstrate sufficient range.',
          sourceExerciseId: request.exercise.id,
          sourceQuestionId: `q-${i}`,
          occurredAt: new Date().toISOString(),
          recurrenceCount: 0,
          severity: 'moderate',
          confidence: 0.5,
          reviewStatus: 'unreviewed',
        })
      }
    }

    return { evaluations, mistakes, skillEvidence, confidence: 0.5 }
  }

  async createReview(request: SkillReviewRequest): Promise<SkillReviewResult> {
    const questions: ExerciseQuestion[] = request.mistakes.slice(0, request.count).map(m => ({
      type: 'error-correction',
      sentence: m.originalResponse || 'Review the following writing error:',
      error: m.category === 'response-length' ? 'Response too short — need more development' : 'Writing error detected',
      correction: m.correctedResponse || 'Provide a more complete response with examples.',
      explanation: m.explanation || 'Review your writing errors and practice developing your ideas more fully.',
    }))

    const exercise: Exercise = {
      id: `writing-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'writing',
      exerciseType: 'error-correction',
      objectiveId: '',
      title: 'Writing Mistake Review',
      instructions: 'Review and correct the following writing issues. Focus on structure, development, and accuracy.',
      questions,
      difficulty: 'medium',
      estimatedMinutes: Math.min(request.count * 5, 30),
      sourceType: 'user-mistakes',
      sourceIds: request.mistakes.map(m => m.id),
      explanationPolicy: 'after-attempt' as const,
      evaluationPolicy: 'deterministic' as const,
      metadata: {
        focusAreas: ['mistake-review', 'error-correction'],
        contextSnapshotHash: '',
        schemaVersion: '1.0.0',
      },
    }

    return { exercise }
  }
}
