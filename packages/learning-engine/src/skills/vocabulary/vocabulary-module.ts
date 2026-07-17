import type { IELTSSection } from '../../domain/value-objects'
import type { Exercise, GenerateExerciseRequest } from '../../domain/entities/exercise'
import type { ExerciseQuestion } from '@ielts/shared'
import type { MistakeEvidence } from '../../domain/entities/mistake-evidence'
import type { SkillEvidence } from '../../domain/entities/skill-evidence'
import type { AnswerEvaluation } from '../../domain/entities/evaluation'
import { gradeAnswer } from '../../domain/policies'
import type {
  LearningSkillModule,
  SkillActivityGenerationRequest,
  SkillActivityGenerationResult,
  SkillEvaluationRequest,
  SkillEvaluationResult,
  SkillReviewRequest,
  SkillReviewResult,
} from '../skill-module'

const VOCAB_QUESTIONS: ExerciseQuestion[] = [
  { type: 'multiple-choice', question: 'Choose the closest synonym for "important":', options: ['Similar', 'Significant', 'Different', 'Ordinary'], correctIndex: 1, explanation: '"Significant" is a synonym for "important" in formal English.' },
  { type: 'multiple-choice', question: 'Which word commonly collocates with "research"?', options: ['Make', 'Do', 'Conduct', 'Take'], correctIndex: 2, explanation: '"Conduct research" is the correct collocation.' },
  { type: 'multiple-choice', question: 'What does "comprehensive" mean?', options: ['Limited', 'Incomplete', 'Thorough', 'Difficult'], correctIndex: 2, explanation: '"Comprehensive" means thorough and complete, covering all aspects.' },
  { type: 'multiple-choice', question: 'Choose the best antonym for "temporary":', options: ['Short', 'Permanent', 'Brief', 'Instant'], correctIndex: 1, explanation: '"Permanent" is the opposite of "temporary", meaning lasting.' },
  { type: 'multiple-choice', question: 'The word "nevertheless" is used to:', options: ['Add information', 'Show contrast', 'Give examples', 'Summarize'], correctIndex: 1, explanation: '"Nevertheless" introduces a contrasting idea.' },
  { type: 'gap-fill', text: 'The government needs to ______ effective measures to reduce pollution.', answers: ['implement', 'adopt', 'take'], acceptableAlternatives: [['implement', 'adopt', 'take']], explanation: '"Implement measures" is a common formal collocation.' },
  { type: 'gap-fill', text: 'There has been a significant ______ in the number of people using public transport.', answers: ['increase', 'rise', 'growth'], acceptableAlternatives: [['increase', 'rise', 'growth']], explanation: 'All three words collocate with "significant" to describe change.' },
  { type: 'multiple-choice', question: 'What does "ubiquitous" mean?', options: ['Rare', 'Everywhere', 'Expensive', 'Difficult'], correctIndex: 1, explanation: '"Ubiquitous" means found or appearing everywhere.' },
  { type: 'multiple-choice', question: 'Which prefix means "again"?', options: ['Un-', 'Re-', 'Pre-', 'Dis-'], correctIndex: 1, explanation: 'The prefix "re-" means again (e.g., rewrite, reconsider).' },
  { type: 'gap-fill', text: 'The company\'s ______ to customer satisfaction is well known.', answers: ['commitment', 'dedication'], acceptableAlternatives: [['commitment', 'dedication']], explanation: '"Commitment to" is the correct prepositional phrase.' },
  { type: 'multiple-choice', question: 'Which word is a formal synonym for "help"?', options: ['Aid', 'Fix', 'Join', 'Give'], correctIndex: 0, explanation: '"Aid" is the formal equivalent of "help."' },
  { type: 'multiple-choice', question: 'What part of speech is "rapidly"?', options: ['Noun', 'Verb', 'Adjective', 'Adverb'], correctIndex: 3, explanation: '"Rapidly" is an adverb describing how something happens.' },
  { type: 'gap-fill', text: 'The study ______ a strong correlation between exercise and mental health.', answers: ['found', 'revealed', 'demonstrated'], acceptableAlternatives: [['found', 'revealed', 'demonstrated']], explanation: 'Academic writing commonly uses these verbs to report findings.' },
  { type: 'multiple-choice', question: 'Choose the correct word: "The ______ of the research were published last week."', options: ['Findings', 'Finds', 'Found', 'Finding'], correctIndex: 0, explanation: '"Findings" is the noun form used in academic contexts.' },
  { type: 'gap-fill', text: 'The results were not statistically ______.', answers: ['significant'], explanation: '"Statistically significant" is a standard academic phrase.' },
]

const TOPIC_VOCAB: Record<string, ExerciseQuestion[]> = {
  environment: [
    { type: 'multiple-choice', question: 'What does "sustainable" mean?', options: ['Able to continue long-term', 'Very fast', 'Extremely large', 'Impossible to change'], correctIndex: 0, explanation: '"Sustainable" means able to be maintained at a certain rate or level over time.' },
    { type: 'gap-fill', text: 'The government introduced new ______ to reduce carbon emissions.', answers: ['regulations', 'policies', 'measures'], acceptableAlternatives: [['regulations', 'policies', 'measures']], explanation: 'All three words are used in environmental policy contexts.' },
  ],
  education: [
    { type: 'multiple-choice', question: 'What does "curriculum" refer to?', options: ['School building', 'Course of study', 'Teaching staff', 'Exam schedule'], correctIndex: 1, explanation: 'The curriculum is the subjects and course content taught at a school or university.' },
    { type: 'gap-fill', text: 'Students benefit from a ______ approach to learning that combines theory and practice.', answers: ['holistic', 'balanced', 'integrated'], acceptableAlternatives: [['holistic', 'balanced', 'integrated']], explanation: 'These adjectives describe comprehensive educational approaches.' },
  ],
  technology: [
    { type: 'multiple-choice', question: 'What does "innovation" mean?', options: ['Copying existing ideas', 'Introducing new ideas or methods', 'Fixing old systems', 'Removing technology'], correctIndex: 1, explanation: '"Innovation" refers to the introduction of new ideas, methods, or devices.' },
    { type: 'gap-fill', text: 'Digital ______ has transformed the way we access information.', answers: ['technology', 'innovation'], explanation: 'Digital technology/innovation is a common theme in IELTS.' },
  ],
}

function selectQuestions(_difficulty: string, count: number, focusAreas: string[]): ExerciseQuestion[] {
  const result: ExerciseQuestion[] = []

  for (const area of focusAreas) {
        const topicQs = TOPIC_VOCAB[area as keyof typeof TOPIC_VOCAB]
    if (topicQs) {
      result.push(...topicQs)
    }
  }

  const pool = [...VOCAB_QUESTIONS]

  while (result.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push({ ...pool[idx] })
    pool.splice(idx, 1)
  }

  return result.slice(0, count)
}

export class VocabularySkillModule implements LearningSkillModule {
  readonly skill: IELTSSection = 'vocabulary'

  supports(request: GenerateExerciseRequest): boolean {
    return request.contextScope === 'vocabulary' || request.skill === 'vocabulary'
  }

  async generateActivity(request: SkillActivityGenerationRequest): Promise<SkillActivityGenerationResult> {
    const count = Math.max(3, Math.floor(request.availableMinutes / 3))
    const questions = selectQuestions(request.difficulty, count, request.focusAreas)

    const exercise: Exercise = {
      id: `vocabulary-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'vocabulary',
      exerciseType: 'gap-fill',
      objectiveId: request.objectiveId,
      title: 'Vocabulary Practice',
      instructions: 'Test and expand your vocabulary knowledge. Pay attention to collocations, synonyms, and academic word usage.',
      questions,
      difficulty: request.difficulty as any || 'medium',
      estimatedMinutes: request.availableMinutes,
      sourceType: 'built-in',
      sourceIds: [],
      explanationPolicy: 'after-attempt' as const,
      evaluationPolicy: 'deterministic' as const,
      metadata: {
        targetBand: request.targetBand,
        focusAreas: [...request.focusAreas, 'vocabulary'],
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
      const question = request.exercise.questions[i]
      const answerEntry = entries.find(([key]) => key === `q-${i}`)
      if (!answerEntry) continue

      const userAnswer = answerEntry[1]
      const evaluation = gradeAnswer(question, userAnswer)
      evaluations.push({ ...evaluation, questionId: `q-${i}` })

      if (evaluation.status === 'incorrect') {
        mistakes.push({
          id: `vocab-mistake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          skill: 'vocabulary',
          category: 'vocabulary-choice',
          originalResponse: String(userAnswer),
          correctedResponse: '',
          explanation: evaluation.explanation ?? '',
          sourceExerciseId: request.exercise.id,
          sourceQuestionId: `q-${i}`,
          occurredAt: new Date().toISOString(),
          recurrenceCount: 0,
          severity: 'minor',
          confidence: evaluation.confidence,
          reviewStatus: 'unreviewed',
        })
      }
    }

    const correctCount = evaluations.filter(e => e.status === 'correct').length
    const totalCount = evaluations.length
    if (totalCount > 0) {
      skillEvidence.push({
        skill: 'vocabulary',
        type: correctCount / totalCount >= 0.8 ? 'strength' : correctCount / totalCount >= 0.5 ? 'improvement' : 'weakness',
        description: `Vocabulary accuracy: ${correctCount}/${totalCount} correct`,
        score: correctCount,
        maximumScore: totalCount,
        accuracy: totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0,
        sourceExerciseId: request.exercise.id,
        sourceSessionId: request.exercise.sessionId ?? '',
        occurredAt: new Date().toISOString(),
        confidence: 0.9,
      })
    }

    return { evaluations, mistakes, skillEvidence, confidence: 0.9 }
  }

  async createReview(request: SkillReviewRequest): Promise<SkillReviewResult> {
    const questions: ExerciseQuestion[] = request.mistakes.slice(0, request.count).map(() => ({
      type: 'multiple-choice',
      question: 'Review the correct vocabulary choice:',
      options: ['Option A - correct meaning', 'Option B - alternative', 'Option C - distractor', 'Option D - distractor'],
      correctIndex: 0,
      explanation: 'Review this vocabulary item and its correct usage in context.',
    }))

    const exercise: Exercise = {
      id: `vocab-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'vocabulary',
      exerciseType: 'gap-fill',
      objectiveId: '',
      title: 'Vocabulary Review',
      instructions: 'Review vocabulary items you previously answered incorrectly. Understanding the correct meaning and usage will improve your lexical resource score.',
      questions,
      difficulty: 'easy',
      estimatedMinutes: Math.min(request.count * 2, 15),
      sourceType: 'user-mistakes',
      sourceIds: request.mistakes.map(m => m.id),
      explanationPolicy: 'always' as const,
      evaluationPolicy: 'deterministic' as const,
      metadata: {
        focusAreas: ['vocabulary-review'],
        contextSnapshotHash: '',
        schemaVersion: '1.0.0',
      },
    }

    return { exercise }
  }
}
