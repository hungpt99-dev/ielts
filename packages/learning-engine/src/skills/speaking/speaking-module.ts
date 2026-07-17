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

interface SpeakingQuestionSet {
  part: 1 | 2 | 3
  difficulty: string
  questions: Array<{ prompt: string; tips: string[]; prepSeconds: number; responseSeconds: number }>
}

const PART1_QUESTIONS: SpeakingQuestionSet[] = [
  {
    part: 1, difficulty: 'easy',
    questions: [
      { prompt: 'Tell me about your hometown.', tips: ['Describe the location', 'Mention what you like about it', 'Give specific examples'], prepSeconds: 15, responseSeconds: 45 },
      { prompt: 'What do you do for work or study?', tips: ['Describe your role', 'Explain your responsibilities', 'Mention what you enjoy'], prepSeconds: 15, responseSeconds: 45 },
      { prompt: 'What are your hobbies?', tips: ['Mention 2-3 activities', 'Explain why you enjoy them', 'How often you do them'], prepSeconds: 15, responseSeconds: 45 },
      { prompt: 'Do you like to travel? Why or why not?', tips: ['Describe places you have visited', 'What you liked about them', 'Where you want to go next'], prepSeconds: 15, responseSeconds: 45 },
      { prompt: 'What kind of music do you enjoy?', tips: ['Name your favorite genres', 'Why you like them', 'When you listen to music'], prepSeconds: 15, responseSeconds: 45 },
      { prompt: 'Tell me about your family.', tips: ['Describe your family members', 'Your relationship with them', 'Activities you do together'], prepSeconds: 15, responseSeconds: 45 },
    ],
  },
  {
    part: 1, difficulty: 'medium',
    questions: [
      { prompt: 'How has technology changed the way people communicate?', tips: ['Compare past and present', 'Give specific examples', 'Discuss advantages and disadvantages'], prepSeconds: 15, responseSeconds: 45 },
      { prompt: 'What role does social media play in your daily life?', tips: ['How often you use it', 'Which platforms you prefer', 'How it affects your relationships'], prepSeconds: 15, responseSeconds: 45 },
      { prompt: 'Do you prefer reading books or watching movies? Why?', tips: ['Compare both activities', 'Give reasons for your preference', 'Mention specific examples'], prepSeconds: 15, responseSeconds: 45 },
    ],
  },
]

const PART2_QUESTIONS: SpeakingQuestionSet[] = [
  {
    part: 2, difficulty: 'easy',
    questions: [
      { prompt: 'Describe a place you like to visit. You should say: where it is, how you know about it, what you can do there, and explain why you like it.', tips: ['Describe the location', 'Explain what makes it special', 'Use descriptive language'], prepSeconds: 60, responseSeconds: 120 },
      { prompt: 'Describe a memorable event from your childhood. You should say: what the event was, when it happened, who was there, and explain why it was memorable.', tips: ['Set the scene', 'Describe your feelings', 'Explain why it stayed with you'], prepSeconds: 60, responseSeconds: 120 },
      { prompt: 'Describe a person who has influenced you. You should say: who this person is, how you know them, what they did, and explain why they influenced you.', tips: ['Describe the person', 'Give specific examples', 'Explain the impact on your life'], prepSeconds: 60, responseSeconds: 120 },
    ],
  },
  {
    part: 2, difficulty: 'medium',
    questions: [
      { prompt: 'Describe a challenge you have overcome. You should say: what the challenge was, how you approached it, what the outcome was, and explain what you learned from it.', tips: ['Describe the situation', 'Explain your strategy', 'Reflect on the lessons learned'], prepSeconds: 60, responseSeconds: 120 },
      { prompt: 'Describe a skill you would like to learn. You should say: what the skill is, why you want to learn it, how you plan to learn it, and explain how it would benefit you.', tips: ['Be specific about the skill', 'Explain your motivation', 'Describe your learning plan'], prepSeconds: 60, responseSeconds: 120 },
      { prompt: 'Describe a time you worked in a team. You should say: what the task was, who was in the team, what your role was, and explain whether the teamwork was successful.', tips: ['Describe the project', 'Explain your contribution', 'Reflect on team dynamics'], prepSeconds: 60, responseSeconds: 120 },
    ],
  },
]

const PART3_QUESTIONS: SpeakingQuestionSet[] = [
  {
    part: 3, difficulty: 'medium',
    questions: [
      { prompt: 'How do you think education will change in the future?', tips: ['Consider technology', 'Think about teaching methods', 'Discuss global trends'], prepSeconds: 30, responseSeconds: 90 },
      { prompt: 'What are the main causes of environmental problems in your country?', tips: ['Identify specific issues', 'Discuss industrial factors', 'Mention individual responsibility'], prepSeconds: 30, responseSeconds: 90 },
      { prompt: 'Do you think cities are becoming too crowded? What can be done?', tips: ['Discuss urban migration', 'Propose solutions', 'Consider government policies'], prepSeconds: 30, responseSeconds: 90 },
    ],
  },
  {
    part: 3, difficulty: 'hard',
    questions: [
      { prompt: 'To what extent should governments regulate the use of artificial intelligence?', tips: ['Consider ethical implications', 'Discuss economic factors', 'Balance innovation and safety'], prepSeconds: 30, responseSeconds: 90 },
      { prompt: 'What are the long-term effects of social media on interpersonal relationships?', tips: ['Analyze communication patterns', 'Discuss psychological effects', 'Consider generational differences'], prepSeconds: 30, responseSeconds: 90 },
      { prompt: 'How can societies balance economic development with environmental protection?', tips: ['Discuss sustainability', 'Consider policy trade-offs', 'Think about global cooperation'], prepSeconds: 30, responseSeconds: 90 },
    ],
  },
]

const ALL_SETS = [...PART1_QUESTIONS, ...PART2_QUESTIONS, ...PART3_QUESTIONS]

function selectQuestions(request: SkillActivityGenerationRequest): SpeakingQuestionSet {
  const band = request.currentBand ?? request.targetBand ?? 5.5
  const filtered = ALL_SETS.filter(s => {
    if (band <= 5.5 && s.difficulty === 'easy') return true
    if (band > 5.5 && band <= 7 && (s.difficulty === 'easy' || s.difficulty === 'medium')) return true
    if (band > 7) return true
    return false
  })
  const candidates = filtered.length > 0 ? filtered : [ALL_SETS[0]]

  const scored = candidates.map(s => {
    let score = 0
    if (request.focusAreas.includes('fluency') && s.part <= 2) score += 2
    if (request.focusAreas.includes('vocabulary') && s.part >= 2) score += 2
    return { set: s, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0].set
}

export class SpeakingSkillModule implements LearningSkillModule {
  readonly skill: IELTSSection = 'speaking'

  supports(request: GenerateExerciseRequest): boolean {
    return request.skill === 'speaking'
  }

  async generateActivity(request: SkillActivityGenerationRequest): Promise<SkillActivityGenerationResult> {
    const selected = selectQuestions(request)
    const maxQuestions = Math.max(1, Math.floor(request.availableMinutes / 3))
    const qs = selected.questions.slice(0, maxQuestions)
    const partLabel = `Part ${selected.part}`
    const partTitle = selected.part === 1 ? 'Introduction & Interview'
      : selected.part === 2 ? 'Individual Long Turn'
      : 'Two-Way Discussion'

    const questions: ExerciseQuestion[] = qs.map(q => ({
      type: 'speaking-response',
      prompt: q.prompt,
      preparationSeconds: q.prepSeconds,
      responseSeconds: q.responseSeconds,
      tips: q.tips,
    }))

    const exercise: Exercise = {
      id: `speaking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'speaking',
      exerciseType: 'speaking',
      objectiveId: request.objectiveId,
      title: `Speaking ${partLabel}: ${partTitle}`,
      instructions: selected.part === 1
        ? 'Answer the questions naturally. Give more than one-word answers. Try to use a range of vocabulary.'
        : selected.part === 2
        ? 'You will have one minute to prepare. Make notes if you wish. Then speak for up to two minutes. Do not stop speaking until your time is up.'
        : 'Discuss the questions in detail. Express and justify your opinions. Respond to follow-up ideas.',
      questions,
      difficulty: request.difficulty as any || selected.difficulty,
      estimatedMinutes: request.availableMinutes,
      sourceType: 'built-in',
      sourceIds: [],
      explanationPolicy: 'after-attempt' as const,
      evaluationPolicy: 'ai-assisted' as const,
      metadata: {
        targetBand: request.targetBand,
        focusAreas: [...request.focusAreas, `speaking-part-${selected.part}`],
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
      const question = request.exercise.questions[i] as ExerciseQuestion & { preparationSeconds?: number; responseSeconds?: number }
      const answerEntry = entries.find(([key]) => key === `q-${i}`)
      if (!answerEntry) continue

      const userAnswer = String(answerEntry[1])
      const wordCount = userAnswer.split(/\s+/).filter(Boolean).length
      const expectedWords = ((question.responseSeconds ?? 60) / 60) * 100
      const hasContent = wordCount > 5
      const isSufficient = wordCount >= expectedWords * 0.5

      evaluations.push({
        questionId: `q-${i}`,
        status: isSufficient ? 'correct' : hasContent ? 'partially-correct' : 'incorrect',
        score: isSufficient ? Math.min(wordCount / expectedWords, 1) * 9 : hasContent ? Math.min(wordCount / (expectedWords * 0.5), 1) * 5 : 0,
        maximumScore: 9,
        feedback: isSufficient
          ? `Good response (${wordCount} words). For a higher score, develop your ideas with specific examples and use a wider range of vocabulary and grammatical structures.`
          : hasContent
          ? `Your response is brief (${wordCount} words). Try to expand your answer with more details and examples. Aim for longer responses in IELTS Speaking.`
          : 'Please provide a more substantial response. In IELTS Speaking, longer answers demonstrate fluency and range.',
        evaluatedBy: 'deterministic',
        confidence: 0.6,
        mistakes: [],
        skillEvidence: [],
      })

      if (isSufficient) {
        skillEvidence.push({
          skill: 'speaking',
          type: 'strength',
          description: `Speaking response: ${wordCount} words (target: ~${Math.round(expectedWords)})`,
          score: Math.min(wordCount, expectedWords),
          maximumScore: Math.round(expectedWords),
          accuracy: Math.min(Math.round((wordCount / expectedWords) * 100), 100),
          sourceExerciseId: request.exercise.id,
          sourceSessionId: request.exercise.sessionId ?? '',
          occurredAt: new Date().toISOString(),
          confidence: 0.6,
        })
      } else {
        mistakes.push({
          id: `speaking-mistake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          skill: 'speaking',
          category: hasContent ? 'response-length' : 'no-response',
          originalResponse: userAnswer,
          correctedResponse: 'Expand your response with specific examples, explanations, and details.',
          explanation: 'IELTS Speaking requires extended responses. Short answers do not demonstrate your full language ability.',
          sourceExerciseId: request.exercise.id,
          sourceQuestionId: `q-${i}`,
          occurredAt: new Date().toISOString(),
          recurrenceCount: 0,
          severity: hasContent ? 'moderate' : 'severe',
          confidence: 0.6,
          reviewStatus: 'unreviewed',
        })
      }
    }

    return { evaluations, mistakes, skillEvidence, confidence: 0.6 }
  }

  async createReview(request: SkillReviewRequest): Promise<SkillReviewResult> {
    const questions: ExerciseQuestion[] = request.mistakes.slice(0, request.count).map(m => ({
      type: 'speaking-response',
      prompt: m.category === 'no-response'
        ? 'Try answering this question with more detail: Describe your experience with learning English.'
        : 'Practice expanding your response: Tell me about something you have learned recently and why it was interesting.',
      preparationSeconds: 30,
      responseSeconds: 90,
      tips: ['Start with a clear main point', 'Add 2-3 supporting details', 'Finish with a concluding thought'],
    }))

    const exercise: Exercise = {
      id: `speaking-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'speaking',
      exerciseType: 'speaking',
      objectiveId: '',
      title: 'Speaking Fluency Review',
      instructions: 'Practice speaking on the following topics. Focus on giving extended responses with specific examples and clear organization.',
      questions,
      difficulty: 'medium',
      estimatedMinutes: Math.min(request.count * 5, 20),
      sourceType: 'user-mistakes',
      sourceIds: request.mistakes.map(m => m.id),
      explanationPolicy: 'after-attempt' as const,
      evaluationPolicy: 'ai-assisted' as const,
      metadata: {
        focusAreas: ['fluency', 'response-development'],
        contextSnapshotHash: '',
        schemaVersion: '1.0.0',
      },
    }

    return { exercise }
  }
}
