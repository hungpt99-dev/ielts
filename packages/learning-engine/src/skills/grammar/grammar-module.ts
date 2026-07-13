import type { IELTSSection } from '../../domain/value-objects'
import type { Exercise, GenerateExerciseRequest } from '../../domain/entities/exercise'
import type { ExerciseQuestion } from '../../domain/entities/exercise-question'
import type { AnswerEvaluation } from '../../domain/entities/evaluation'
import type { MistakeEvidence } from '../../domain/entities/mistake-evidence'
import type { SkillEvidence } from '../../domain/entities/skill-evidence'
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

interface GrammarCategory {
  id: string
  questions: ExerciseQuestion[]
}

const GRAMMAR_CATEGORIES: GrammarCategory[] = [
  {
    id: 'tenses',
    questions: [
      { type: 'multiple-choice', question: 'Choose the correct form: She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], correctIndex: 1, explanation: 'Third person singular requires "goes" in present simple tense.' },
      { type: 'multiple-choice', question: 'I ___ that movie last night.', options: ['see', 'saw', 'seen', 'seeing'], correctIndex: 1, explanation: 'Past simple "saw" is used for completed past actions.' },
      { type: 'multiple-choice', question: 'They ___ in London since 2020.', options: ['live', 'lived', 'have lived', 'are living'], correctIndex: 2, explanation: '"Since" requires present perfect continuous or present perfect tense.' },
      { type: 'multiple-choice', question: 'By next year, she ___ her degree.', options: ['completes', 'completed', 'will have completed', 'is completing'], correctIndex: 2, explanation: 'Future perfect is used for actions that will be completed before a future time.' },
      { type: 'error-correction', sentence: 'When I was young, I go to the beach every summer.', error: 'go', correction: 'went', explanation: 'Past habit requires past simple tense: "went."' },
      { type: 'gap-fill', text: 'She ___ (study) for three hours when her friend called.', answers: ['had been studying'], explanation: 'Past perfect continuous describes an ongoing action before another past event.' },
    ],
  },
  {
    id: 'articles',
    questions: [
      { type: 'multiple-choice', question: 'Choose the correct article: ___ apple a day keeps the doctor away.', options: ['A', 'An', 'The', 'No article'], correctIndex: 1, explanation: '"An" is used before vowel sounds.' },
      { type: 'multiple-choice', question: 'I need ___ advice about my career.', options: ['a', 'an', 'some', 'the'], correctIndex: 2, explanation: '"Advice" is uncountable, so we cannot use "a" or "an." Use "some" instead.' },
      { type: 'error-correction', sentence: 'She is a honest person who always tells truth.', error: 'a honest', correction: 'an honest', explanation: '"Honest" begins with a silent "h" — use "an" before vowel sounds.' },
      { type: 'gap-fill', text: '______ government should provide ______ education for all citizens.', answers: ['The -', 'The free'], acceptableAlternatives: [['The', 'the -'], ['The', 'no article']], explanation: 'Use "the" for institutions in general; "education" as a general concept needs no article.' },
    ],
  },
  {
    id: 'prepositions',
    questions: [
      { type: 'multiple-choice', question: 'Choose the correct preposition: She is interested ___ learning new languages.', options: ['in', 'on', 'at', 'for'], correctIndex: 0, explanation: '"Interested in" is the correct prepositional phrase.' },
      { type: 'multiple-choice', question: 'The meeting is scheduled ___ Monday.', options: ['in', 'on', 'at', 'by'], correctIndex: 1, explanation: 'Use "on" with days of the week.' },
      { type: 'error-correction', sentence: 'He is expert on artificial intelligence.', error: 'on', correction: 'in', explanation: '"Expert in" is the correct preposition when referring to a field of knowledge.' },
      { type: 'gap-fill', text: 'The results depend ______ several factors.', answers: ['on', 'upon'], explanation: '"Depend on/upon" is the required verb-preposition combination.' },
    ],
  },
  {
    id: 'conditionals',
    questions: [
      { type: 'multiple-choice', question: 'If I ___ you, I would accept the offer.', options: ['am', 'was', 'were', 'be'], correctIndex: 2, explanation: 'Second conditional uses "were" for all subjects in the if-clause.' },
      { type: 'multiple-choice', question: 'If it rains tomorrow, we ___ the trip.', options: ['cancel', 'will cancel', 'would cancel', 'cancelled'], correctIndex: 1, explanation: 'First conditional: if + present simple, will + base verb.' },
      { type: 'error-correction', sentence: 'If I would have known, I would have come earlier.', error: 'would have known', correction: 'had known', explanation: 'Third conditional uses "if + had + past participle."' },
    ],
  },
  {
    id: 'modals',
    questions: [
      { type: 'multiple-choice', question: 'You ___ submit your assignment by Friday.', options: ['must', 'could', 'might', 'should'], correctIndex: 0, explanation: '"Must" expresses obligation or necessity.' },
      { type: 'multiple-choice', question: 'You ___ see a doctor if the pain continues.', options: ['must', 'should', 'can', 'would'], correctIndex: 1, explanation: '"Should" gives advice or recommendation.' },
      { type: 'error-correction', sentence: 'You must to finish the report before the deadline.', error: 'must to finish', correction: 'must finish', explanation: 'Modal verbs are followed by the base form without "to."' },
    ],
  },
  {
    id: 'passive-voice',
    questions: [
      { type: 'multiple-choice', question: 'The experiment ___ by the research team.', options: ['conducted', 'was conducted', 'has conducting', 'is conduct'], correctIndex: 1, explanation: 'Passive voice requires "be + past participle."' },
      { type: 'multiple-choice', question: 'The results ___ in the next journal issue.', options: ['publish', 'will be published', 'are publishing', 'published'], correctIndex: 1, explanation: 'Future passive: "will be + past participle."' },
      { type: 'error-correction', sentence: 'The decision was made by the committee yesterday.', error: 'No error', correction: 'No error needed', explanation: 'This sentence is correct passive voice.' },
    ],
  },
  {
    id: 'relative-clauses',
    questions: [
      { type: 'multiple-choice', question: 'The woman ___ lives next door is a doctor.', options: ['which', 'who', 'whom', 'whose'], correctIndex: 1, explanation: '"Who" refers to people as the subject of a relative clause.' },
      { type: 'multiple-choice', question: 'The book ___ I borrowed was fascinating.', options: ['which', 'who', 'whom', 'whose'], correctIndex: 0, explanation: '"Which" refers to things in relative clauses.' },
      { type: 'gap-fill', text: 'The company ______ I work has offices worldwide.', answers: ['where', 'for which'], explanation: '"Where" is used to refer to a place; "for which" is more formal.' },
    ],
  },
]

function selectCategories(focusAreas: string[]): GrammarCategory[] {
  if (focusAreas.length > 0) {
    const matched = GRAMMAR_CATEGORIES.filter(c => focusAreas.includes(c.id))
    if (matched.length > 0) return matched
  }
  return GRAMMAR_CATEGORIES
}

export class GrammarSkillModule implements LearningSkillModule {
  readonly skill: IELTSSection = 'grammar'

  supports(request: GenerateExerciseRequest): boolean {
    return request.skill === 'grammar'
  }

  async generateActivity(request: SkillActivityGenerationRequest): Promise<SkillActivityGenerationResult> {
    const categories = selectCategories(request.focusAreas)
    const perCategory = Math.max(1, Math.floor(Math.max(request.availableMinutes / 3, 3) / categories.length))
    const questions: ExerciseQuestion[] = []

    for (const category of categories) {
      const shuffled = [...category.questions].sort(() => Math.random() - 0.5)
      for (let i = 0; i < Math.min(perCategory, shuffled.length); i++) {
        questions.push({ ...shuffled[i] })
      }
    }

    const categoryNames = categories.map(c => c.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))

    const exercise: Exercise = {
      id: `grammar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'grammar',
      exerciseType: 'error-correction',
      objectiveId: request.objectiveId,
      title: `Grammar Practice: ${categoryNames.join(', ')}`,
      instructions: 'Choose the correct answer or identify the error in each sentence. Pay attention to common IELTS grammar patterns.',
      questions,
      difficulty: request.difficulty as any || 'medium',
      estimatedMinutes: request.availableMinutes,
      sourceType: 'built-in',
      sourceIds: [],
      explanationPolicy: 'after-attempt' as const,
      evaluationPolicy: 'deterministic' as const,
      metadata: {
        targetBand: request.targetBand,
        focusAreas: [...request.focusAreas, 'grammar', ...categories.map(c => c.id)],
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
          id: `grammar-mistake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          skill: 'grammar',
          category: question.type === 'error-correction' ? 'error-correction' : 'grammar-choice',
          originalResponse: String(userAnswer),
          correctedResponse: evaluation.explanation ?? '',
          explanation: evaluation.explanation ?? '',
          sourceExerciseId: request.exercise.id,
          sourceQuestionId: `q-${i}`,
          occurredAt: new Date().toISOString(),
          recurrenceCount: 0,
          severity: 'moderate',
          confidence: evaluation.confidence,
          reviewStatus: 'unreviewed',
        })
      }
    }

    const correctCount = evaluations.filter(e => e.status === 'correct').length
    const totalCount = evaluations.length
    if (totalCount > 0) {
      skillEvidence.push({
        skill: 'grammar',
        type: correctCount / totalCount >= 0.8 ? 'strength' : correctCount / totalCount >= 0.5 ? 'improvement' : 'weakness',
        description: `Grammar accuracy: ${correctCount}/${totalCount} correct`,
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
    const questions: ExerciseQuestion[] = request.mistakes.slice(0, request.count).map(m => ({
      type: 'error-correction',
      sentence: m.originalResponse || 'Correct the grammar error:',
      error: m.category === 'error-correction' ? 'incorrect form' : 'incorrect choice',
      correction: m.correctedResponse || 'Use the correct form.',
      explanation: m.explanation || 'Review this grammar rule and practice applying it in context.',
    }))

    const exercise: Exercise = {
      id: `grammar-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'grammar',
      exerciseType: 'error-correction',
      objectiveId: '',
      title: 'Grammar Error Review',
      instructions: 'Review and correct your grammar mistakes. Understanding the rule will help you avoid repeating these errors.',
      questions,
      difficulty: 'easy',
      estimatedMinutes: Math.min(request.count * 3, 15),
      sourceType: 'user-mistakes',
      sourceIds: request.mistakes.map(m => m.id),
      explanationPolicy: 'always' as const,
      evaluationPolicy: 'deterministic' as const,
      metadata: {
        focusAreas: ['grammar-review', 'error-correction'],
        contextSnapshotHash: '',
        schemaVersion: '1.0.0',
      },
    }

    return { exercise }
  }
}
