import type { Exercise, ExerciseQuestion, AnswerExplanation } from './models'
import type { ExerciseSource, ExerciseSkill, ExerciseDifficulty, QuestionType, ISOString } from './types'
import { generateId } from './utils/id'

export interface GenerationParams {
  skill: ExerciseSkill
  topic: string
  difficulty: ExerciseDifficulty
  count: number
  source: ExerciseSource
  sourceData?: unknown
  metadata?: Record<string, unknown>
}

export interface GenerationResult {
  exercises: Exercise[]
  errors: string[]
}

export interface GenerationStrategy {
  readonly source: ExerciseSource
  generate(params: GenerationParams): Promise<GenerationResult>
  canGenerate(params: GenerationParams): boolean
}

function now(): ISOString {
  return new Date().toISOString()
}

function makeExplanation(correctAnswer: string, explanation: string, tips?: string[]): AnswerExplanation {
  return { correctAnswer, explanation, tips }
}

export class BuiltInGenerationStrategy implements GenerationStrategy {
  readonly source: ExerciseSource = 'built-in'

  private exercises: Exercise[] = []

  constructor(exercises?: Exercise[]) {
    if (exercises) this.exercises = exercises
  }

  registerBuiltIn(exercises: Exercise[]): void {
    this.exercises.push(...exercises)
  }

  canGenerate(params: GenerationParams): boolean {
    return this.exercises.some(e => {
      if (params.skill && e.skill !== params.skill) return false
      if (params.topic && e.topic !== params.topic) return false
      if (params.difficulty && e.difficulty !== params.difficulty) return false
      return true
    })
  }

  async generate(params: GenerationParams): Promise<GenerationResult> {
    let filtered = this.exercises.filter(e => e.source === 'built-in')

    if (params.skill) filtered = filtered.filter(e => e.skill === params.skill)
    if (params.topic) filtered = filtered.filter(e => e.topic === params.topic)
    if (params.difficulty) filtered = filtered.filter(e => e.difficulty === params.difficulty)

    const selected = filtered.slice(0, params.count)
    return { exercises: selected, errors: [] }
  }
}

export type GenerateExerciseFn = (params: {
  skill: ExerciseSkill
  topic: string
  difficulty: ExerciseDifficulty
  count: number
}) => Promise<{ questions: Array<Omit<ExerciseQuestion, 'id' | 'explanation'> & { explanation: string }> }>

export class AiGenerationStrategy implements GenerationStrategy {
  readonly source: ExerciseSource = 'ai-generated'

  constructor(
    private generateFn: GenerateExerciseFn,
  ) {}

  canGenerate(_params: GenerationParams): boolean {
    return this.generateFn !== undefined
  }

  async generate(params: GenerationParams): Promise<GenerationResult> {
    try {
      const result = await this.generateFn({
        skill: params.skill,
        topic: params.topic,
        difficulty: params.difficulty,
        count: params.count,
      })

      const questions: ExerciseQuestion[] = result.questions.map(q => ({
        id: generateId(),
        type: q.type as QuestionType,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: makeExplanation(String(q.correctAnswer), q.explanation),
        blanks: q.blanks,
        matchingPairs: q.matchingPairs,
        points: q.points ?? 1,
        difficulty: params.difficulty,
      }))

      const totalPoints = questions.reduce((sum, q) => sum + (q.points ?? 1), 0)

      const exercise: Exercise = {
        id: generateId(),
        title: `${params.skill.charAt(0).toUpperCase() + params.skill.slice(1)} - ${params.topic}`,
        skill: params.skill,
        topic: params.topic,
        source: 'ai-generated',
        difficulty: params.difficulty,
        questions,
        totalPoints,
        estimatedMinutes: Math.ceil(questions.length * 2),
        status: 'published',
        tags: [params.skill, params.topic],
        metadata: params.metadata,
        createdAt: now(),
        updatedAt: now(),
      }

      return { exercises: [exercise], errors: [] }
    } catch (error) {
      return {
        exercises: [],
        errors: [error instanceof Error ? error.message : 'Failed to generate AI exercises'],
      }
    }
  }
}

export class WebContentGenerationStrategy implements GenerationStrategy {
  readonly source: ExerciseSource = 'web-content'

  constructor(
    private generateFn?: GenerateExerciseFn,
  ) {}

  canGenerate(params: GenerationParams): boolean {
    return params.source === 'web-content' && !!params.sourceData
  }

  async generate(params: GenerationParams): Promise<GenerationResult> {
    if (!params.sourceData) {
      return { exercises: [], errors: ['No source data provided for web content generation'] }
    }

    if (this.generateFn) {
      return new AiGenerationStrategy(this.generateFn).generate({
        ...params,
        source: 'ai-generated',
      })
    }

    const text = typeof params.sourceData === 'string'
      ? params.sourceData
      : String(params.sourceData)

    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? []
    if (sentences.length < 2) {
      return { exercises: [], errors: ['Not enough content to generate exercises from'] }
    }

    const questions: ExerciseQuestion[] = sentences.slice(0, Math.min(5, sentences.length)).map((s) => {
      const words = s.trim().split(/\s+/)
      const blankIndex = Math.min(3, words.length - 1)
      const blankWord = words[blankIndex].replace(/[^a-zA-Z]/g, '')
      words[blankIndex] = '________'

      return {
        id: generateId(),
        type: 'gap-fill',
        question: words.join(' '),
        correctAnswer: blankWord,
        explanation: makeExplanation(blankWord, `The correct word is "${blankWord}" in context.`),
        points: 1,
        difficulty: params.difficulty,
      }
    })

    const exercise: Exercise = {
      id: generateId(),
      title: `Web Content - ${params.topic}`,
      skill: params.skill,
      topic: params.topic,
      source: 'web-content',
      difficulty: params.difficulty,
      questions,
      totalPoints: questions.length,
      estimatedMinutes: Math.ceil(questions.length * 1.5),
      status: 'published',
      tags: [params.skill, params.topic, 'web-content'],
      sourceId: params.metadata?.sourceUrl as string | undefined,
      createdAt: now(),
      updatedAt: now(),
    }

    return { exercises: [exercise], errors: [] }
  }
}

export interface MistakeData {
  mistake: string
  correction: string
  explanation: string
  skill: ExerciseSkill
}

export class MistakeReviewGenerationStrategy implements GenerationStrategy {
  readonly source: ExerciseSource = 'mistake-review'

  canGenerate(params: GenerationParams): boolean {
    return params.source === 'mistake-review' && Array.isArray(params.sourceData)
  }

  async generate(params: GenerationParams): Promise<GenerationResult> {
    const mistakes = params.sourceData as MistakeData[]
    if (!mistakes || mistakes.length === 0) {
      return { exercises: [], errors: ['No mistakes provided for review'] }
    }

    const questions: ExerciseQuestion[] = mistakes.map(m => ({
      id: generateId(),
      type: 'error-correction',
      question: m.mistake,
      correctAnswer: m.correction,
      explanation: makeExplanation(m.correction, m.explanation),
      points: 1,
      difficulty: params.difficulty,
    }))

    const exercise: Exercise = {
      id: generateId(),
      title: `Mistake Review - ${params.topic || 'Recent Mistakes'}`,
      skill: params.skill,
      topic: params.topic || 'Mistake Review',
      source: 'mistake-review',
      difficulty: params.difficulty,
      questions,
      totalPoints: questions.length,
      estimatedMinutes: Math.ceil(questions.length * 2),
      status: 'published',
      tags: [params.skill, 'mistake-review'],
      createdAt: now(),
      updatedAt: now(),
    }

    return { exercises: [exercise], errors: [] }
  }
}

export interface VocabData {
  word: string
  meaning: string
  exampleSentence: string
}

export class VocabularyPracticeGenerationStrategy implements GenerationStrategy {
  readonly source: ExerciseSource = 'vocabulary-practice'

  canGenerate(params: GenerationParams): boolean {
    return params.source === 'vocabulary-practice' && Array.isArray(params.sourceData)
  }

  async generate(params: GenerationParams): Promise<GenerationResult> {
    const vocabList = params.sourceData as VocabData[]
    if (!vocabList || vocabList.length === 0) {
      return { exercises: [], errors: ['No vocabulary provided for practice'] }
    }

    const questions: ExerciseQuestion[] = vocabList.slice(0, 10).flatMap(v => {
      const qs: ExerciseQuestion[] = [
        {
          id: generateId(),
          type: 'gap-fill',
          question: v.exampleSentence.replace(v.word, '________'),
          correctAnswer: v.word,
          explanation: makeExplanation(v.word, `"${v.word}" means: ${v.meaning}`),
          points: 1,
          difficulty: params.difficulty,
        },
        {
          id: generateId(),
          type: 'multiple-choice',
          question: `What is the meaning of "${v.word}"?`,
          options: [
            v.meaning,
            'An unrelated meaning',
            'Another meaning',
            'Yet another meaning',
          ],
          correctAnswer: 0,
          explanation: makeExplanation(String(0), `"${v.word}" means: ${v.meaning}`),
          points: 1,
          difficulty: params.difficulty,
        },
      ]
      return qs
    })

    const exercise: Exercise = {
      id: generateId(),
      title: `Vocabulary Practice - ${params.topic || 'Word Review'}`,
      skill: 'vocabulary',
      topic: params.topic || 'Vocabulary Practice',
      source: 'vocabulary-practice',
      difficulty: params.difficulty,
      questions,
      totalPoints: questions.length,
      estimatedMinutes: Math.ceil(questions.length * 1),
      status: 'published',
      tags: [params.skill, 'vocabulary-practice'],
      createdAt: now(),
      updatedAt: now(),
    }

    return { exercises: [exercise], errors: [] }
  }
}

export class GenerationEngine {
  private strategies: Map<ExerciseSource, GenerationStrategy>

  constructor(strategies?: GenerationStrategy[]) {
    this.strategies = new Map()
    if (strategies) {
      for (const s of strategies) {
        this.strategies.set(s.source, s)
      }
    }
  }

  registerStrategy(strategy: GenerationStrategy): void {
    this.strategies.set(strategy.source, strategy)
  }

  async generate(params: GenerationParams): Promise<GenerationResult> {
    const strategy = this.strategies.get(params.source)
    if (!strategy) {
      return { exercises: [], errors: [`No generation strategy registered for source: ${params.source}`] }
    }
    return strategy.generate(params)
  }

  /**
   * Fallback chain:
   *   built-in (if enough exercises match) → AI generation → any other registered strategy
   * Returns an error if none can produce exercises for the given params.
   */
  async generateFromBestSource(params: GenerationParams): Promise<GenerationResult> {
    const preferBuiltIn = this.strategies.get('built-in')
    if (preferBuiltIn && preferBuiltIn.canGenerate(params)) {
      const result = await preferBuiltIn.generate(params)
      if (result.exercises.length > 0) return result
    }

    const aiStrategy = this.strategies.get('ai-generated')
    if (aiStrategy && aiStrategy.canGenerate(params)) {
      return aiStrategy.generate(params)
    }

    for (const [, strategy] of this.strategies) {
      if (strategy.canGenerate(params)) {
        return strategy.generate(params)
      }
    }

    return { exercises: [], errors: [`No strategy can generate exercises for the given params`] }
  }
}

export function createDefaultGenerationEngine(
  builtInExercises?: Exercise[],
  aiGenerateFn?: GenerateExerciseFn,
): GenerationEngine {
  const strategies: GenerationStrategy[] = [
    new BuiltInGenerationStrategy(builtInExercises),
    new MistakeReviewGenerationStrategy(),
    new VocabularyPracticeGenerationStrategy(),
    new WebContentGenerationStrategy(aiGenerateFn),
  ]

  if (aiGenerateFn) {
    strategies.push(new AiGenerationStrategy(aiGenerateFn))
  }

  return new GenerationEngine(strategies)
}
