import type { IELTSSection } from '../../domain/value-objects'
import type { Exercise, GenerateExerciseRequest } from '../../domain/entities/exercise'
import type { ExerciseQuestion } from '@ielts/shared'
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

interface ListeningTemplate {
  topic: string
  transcript: string
  questions: ExerciseQuestion[]
  difficulty: string
  bandRange: [number, number]
}

const TRANSCRIPTS: ListeningTemplate[] = [
  {
    topic: 'Library Registration',
    difficulty: 'easy',
    bandRange: [4, 5.5],
    transcript: 'Welcome to the City Library. Today I would like to explain how to register for a library card. First, you need to fill in an application form with your full name and address. Then, you must show some identification, such as a passport or driver\'s license. The library is open from nine in the morning until eight in the evening on weekdays. On Saturdays, we close at five. We are closed on Sundays. As a member, you can borrow up to six books at a time. The loan period is three weeks for books and one week for DVDs. You can renew items online if nobody else has requested them.',
    questions: [
      { type: 'gap-fill', text: 'The library is open from ______ in the morning until eight in the evening on weekdays.', answers: ['nine', '9'], explanation: 'The announcement says "nine in the morning."' },
      { type: 'multiple-choice', question: 'How many books can a member borrow at one time?', options: ['Four', 'Five', 'Six', 'Eight'], correctIndex: 2, explanation: 'Members can "borrow up to six books at a time."' },
      { type: 'short-answer', question: 'What is the loan period for DVDs?', answer: 'one week', acceptableAlternatives: ['1 week', 'seven days', '7 days'], explanation: 'DVDs can be borrowed for "one week."' },
      { type: 'multiple-choice', question: 'How can items be renewed?', options: ['By phone', 'In person', 'Online', 'By mail'], correctIndex: 2, explanation: 'You "can renew items online."' },
    ],
  },
  {
    topic: 'University Orientation',
    difficulty: 'medium',
    bandRange: [5.5, 7],
    transcript: 'Good morning and welcome to the university orientation session. I am Doctor Wilson, the Dean of Students. I would like to begin by giving you an overview of the campus facilities. The main library is located in the central building and is open twenty-four hours a day during exam periods. The science laboratories are in the east wing, while the arts faculty is in the west wing. Regarding accommodation, first-year students are guaranteed a place in the halls of residence if they apply before the end of August. The cost of a standard room is approximately one hundred and twenty pounds per week, which includes utilities and internet access. For those of you who prefer to live off-campus, the accommodation office can provide a list of approved private landlords. Finally, I would like to mention that all students are automatically registered with the university health centre.',
    questions: [
      { type: 'gap-fill', text: 'The main library is open ______ hours a day during exam periods.', answers: ['24', 'twenty-four'], explanation: 'The library is "open twenty-four hours a day during exam periods."' },
      { type: 'matching', instruction: 'Match each facility to its location:', leftItems: ['Science laboratories', 'Arts faculty', 'Main library'], rightItems: ['East wing', 'West wing', 'Central building'], correctMatches: { '0': 'East wing', '1': 'West wing', '2': 'Central building' }, explanation: 'The labs are "in the east wing," arts "in the west wing," and the library "in the central building."' },
      { type: 'multiple-choice', question: 'What is the weekly cost of a standard hall room?', options: ['£100', '£120', '£140', '£150'], correctIndex: 1, explanation: 'The cost is "approximately one hundred and twenty pounds per week."' },
      { type: 'true-false-not-given', question: 'All students are automatically registered with the university health centre.', answer: 'true', explanation: 'The Dean states "all students are automatically registered with the university health centre."' },
    ],
  },
  {
    topic: 'Business Lecture',
    difficulty: 'hard',
    bandRange: [7, 9],
    transcript: 'Today we continue our examination of market entry strategies for multinational corporations. Specifically, I want to focus on the advantages and disadvantages of joint ventures compared to wholly owned subsidiaries. A joint venture involves two or more parent companies forming a separate legal entity, with each contributing resources and sharing both risks and rewards. The primary advantage of this approach is access to local market knowledge and established distribution networks. However, joint ventures frequently encounter difficulties arising from cultural differences and conflicting objectives between partners. In contrast, a wholly owned subsidiary gives the parent company complete control over operations and strategy. This structure eliminates the potential for conflicts with partners and allows for full integration of global operations. The significant drawback, nonetheless, is the substantial financial investment required and the slower pace of market entry. Research suggests that the choice between these structures depends heavily on factors such as the cultural distance between home and host countries, the level of intellectual property protection, and the strategic importance of the foreign market.',
    questions: [
      { type: 'multiple-choice', question: 'What is described as the primary advantage of a joint venture?', options: ['Complete operational control', 'Lower financial investment', 'Access to local market knowledge', 'Faster decision making'], correctIndex: 2, explanation: 'The lecture states the advantage is "access to local market knowledge and established distribution networks."' },
      { type: 'gap-fill', text: 'A joint venture involves two or more parent companies forming a separate legal ______.', answers: ['entity'], explanation: 'They form "a separate legal entity."' },
      { type: 'multiple-choice', question: 'What is a key disadvantage of wholly owned subsidiaries?', options: ['Cultural conflicts', 'Limited control', 'Substantial financial investment required', 'Lack of local knowledge'], correctIndex: 2, explanation: 'The drawback is "the substantial financial investment required."' },
      { type: 'short-answer', question: 'Name THREE factors that influence the choice between joint ventures and wholly owned subsidiaries.', answer: 'cultural distance, intellectual property protection, strategic importance', acceptableAlternatives: ['cultural distance IP protection strategic importance', 'cultural distance, IP protection, market importance'], explanation: 'The factors are "cultural distance, intellectual property protection, and strategic importance."' },
    ],
  },
]

export class ListeningSkillModule implements LearningSkillModule {
  readonly skill: IELTSSection = 'listening'

  supports(request: GenerateExerciseRequest): boolean {
    return request.skill === 'listening'
  }

  async generateActivity(request: SkillActivityGenerationRequest): Promise<SkillActivityGenerationResult> {
    const filtered = TRANSCRIPTS.filter(t => {
      const band = request.currentBand ?? request.targetBand ?? 5.5
      return band >= t.bandRange[0] && band <= t.bandRange[1]
    })
    const candidates = filtered.length > 0 ? filtered : TRANSCRIPTS
    const template = candidates[Math.floor(Math.random() * candidates.length)]

    const questions = template.questions.slice()

    const exercise: Exercise = {
      id: `listening-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'listening',
      exerciseType: 'comprehension',
      objectiveId: request.objectiveId,
      title: `Listening: ${template.topic}`,
      instructions: 'Listen to the recording and answer the questions. Pay attention to specific details, numbers, and key information.',
      content: { transcript: template.transcript },
      questions,
      difficulty: (template.difficulty || request.difficulty || 'medium') as any,
      estimatedMinutes: request.availableMinutes,
      sourceType: 'built-in',
      sourceIds: [],
      explanationPolicy: 'after-attempt' as const,
      evaluationPolicy: 'deterministic' as const,
      metadata: {
        targetBand: request.targetBand,
        focusAreas: [...request.focusAreas, 'listening-comprehension'],
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

      if (evaluation.status === 'incorrect' || evaluation.status === 'partially-correct') {
        mistakes.push({
          id: `listening-mistake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          skill: 'listening',
          category: question.type === 'gap-fill' ? 'gap-fill'
            : question.type === 'matching' ? 'matching'
            : question.type === 'short-answer' ? 'short-answer'
            : 'multiple-choice',
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
        skill: 'listening',
        type: correctCount / totalCount >= 0.8 ? 'strength' : correctCount / totalCount >= 0.5 ? 'improvement' : 'weakness',
        description: `Listening accuracy: ${correctCount}/${totalCount} correct`,
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
    const questions: ExerciseQuestion[] = request.mistakes.slice(0, request.count).map(m => {
      if (m.category === 'gap-fill') {
        return { type: 'gap-fill', text: 'Fill in the blank: The correct answer was ______.', answers: ['review'], acceptableAlternatives: undefined, explanation: m.explanation || 'Please review this listening exercise.' }
      }
      return { type: 'multiple-choice', question: `Review: ${m.originalResponse || 'What was the correct information from the recording?'}`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctIndex: 0, explanation: m.explanation || 'Listen again for the specific details mentioned.' }
    })

    const exercise: Exercise = {
      id: `listening-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'listening',
      exerciseType: 'comprehension',
      objectiveId: '',
      title: 'Listening Error Review',
      instructions: 'Review your listening mistakes. Focus on identifying specific words and numbers in the recording.',
      questions,
      difficulty: 'easy',
      estimatedMinutes: Math.min(request.count * 3, 15),
      sourceType: 'user-mistakes',
      sourceIds: request.mistakes.map(m => m.id),
      explanationPolicy: 'always' as const,
      evaluationPolicy: 'deterministic' as const,
      metadata: {
        focusAreas: ['error-review'],
        contextSnapshotHash: '',
        schemaVersion: '1.0.0',
      },
    }

    return { exercise }
  }
}
