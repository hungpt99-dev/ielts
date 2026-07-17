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

interface ReadingTemplate {
  topic: string
  passage: string
  questions: ExerciseQuestion[]
  difficulty: string
  bandRange: [number, number]
}

const PASSAGES: ReadingTemplate[] = [
  {
    topic: 'Education Technology',
    difficulty: 'easy',
    bandRange: [4, 5.5],
    passage: 'Technology is changing the way students learn in classrooms around the world. Many schools now use tablets and computers to help students understand difficult subjects. Teachers say that educational apps make learning more fun and interactive. Students can watch videos, take online quizzes and work together on projects using digital tools. However, some experts believe that too much screen time can be bad for young children. They suggest that traditional books and face-to-face discussions are still very important for developing good reading skills and critical thinking.',
    questions: [
      { type: 'multiple-choice', question: 'What is the main benefit of educational apps according to the passage?', options: ['They replace teachers', 'They make learning more fun and interactive', 'They reduce homework', 'They are cheaper than books'], correctIndex: 1, explanation: 'The passage states that educational apps "make learning more fun and interactive."' },
      { type: 'multiple-choice', question: 'What concern do some experts raise about technology in education?', options: ['It is too expensive', 'Too much screen time can be harmful for young children', 'Students prefer books', 'Teachers do not like technology'], correctIndex: 1, explanation: 'The passage notes experts believe "too much screen time can be bad for young children."' },
      { type: 'true-false-not-given', question: 'All schools now use tablets and computers.', answer: 'false', explanation: 'The passage says "many schools" not "all schools."' },
      { type: 'true-false-not-given', question: 'Traditional books are still considered valuable for developing reading skills.', answer: 'true', explanation: 'The passage states traditional books "are still very important for developing good reading skills."' },
    ],
  },
  {
    topic: 'Climate Change',
    difficulty: 'medium',
    bandRange: [5.5, 7],
    passage: 'Climate change represents one of the most significant challenges facing the global community in the twenty-first century. Scientific evidence indicates that human activities, particularly the burning of fossil fuels, have substantially increased the concentration of greenhouse gases in the atmosphere. This has led to a steady rise in global average temperatures, commonly referred to as global warming. The consequences of this phenomenon are far-reaching and include more frequent extreme weather events, rising sea levels, and disruptions to agricultural systems. International efforts to address climate change have culminated in agreements such as the Paris Accord, which aims to limit global temperature increase to well below 2 degrees Celsius above pre-industrial levels. Nevertheless, achieving these targets requires unprecedented cooperation between governments, industries, and individuals.',
    questions: [
      { type: 'multiple-choice', question: 'What is identified as the primary cause of increased greenhouse gases?', options: ['Natural weather patterns', 'Burning of fossil fuels', 'Deforestation', 'Agricultural practices'], correctIndex: 1, explanation: 'The passage identifies "the burning of fossil fuels" as the primary cause.' },
      { type: 'multiple-choice', question: 'What is the main goal of the Paris Accord mentioned in the passage?', options: ['Eliminate all fossil fuel use by 2050', 'Limit global temperature increase to below 2°C', 'Reduce sea levels', 'Stop extreme weather events'], correctIndex: 1, explanation: 'The Accord aims to "limit global temperature increase to well below 2 degrees Celsius."' },
      { type: 'true-false-not-given', question: 'The Paris Accord has successfully stopped global warming.', answer: 'false', explanation: 'The passage says achieving the targets requires "unprecedented cooperation" — implying success is not yet achieved.' },
      { type: 'short-answer', question: 'Name TWO consequences of climate change mentioned in the passage.', answer: 'extreme weather events, rising sea levels', acceptableAlternatives: ['extreme weather, rising sea levels', 'extreme weather events and rising sea levels'], explanation: 'The passage lists "more frequent extreme weather events, rising sea levels, and disruptions to agricultural systems."' },
    ],
  },
  {
    topic: 'Urban Development',
    difficulty: 'hard',
    bandRange: [7, 9],
    passage: 'The phenomenon of urbanization has accelerated dramatically over the past century, with more than half of the world\'s population now residing in urban areas. This demographic shift presents both opportunities and challenges for city planners and policymakers. On one hand, cities serve as engines of economic growth, fostering innovation, cultural exchange, and employment opportunities. On the other hand, rapid and often unplanned urbanization has exacerbated problems such as housing shortages, traffic congestion, pollution, and social inequality. Contemporary approaches to urban development emphasize the concept of smart cities, which leverage technology and data-driven solutions to enhance the efficiency and sustainability of urban infrastructure. These initiatives encompass intelligent transportation systems, energy-efficient buildings, and integrated waste management solutions. However, critics argue that technological solutions alone cannot address the underlying social and economic disparities that characterize many urban environments.',
    questions: [
      { type: 'multiple-choice', question: 'According to the passage, what percentage of the global population lives in urban areas?', options: ['Less than 25%', 'Approximately half', 'More than 50%', 'Nearly 75%'], correctIndex: 2, explanation: 'The passage states "more than half of the world\'s population now residing in urban areas."' },
      { type: 'matching', instruction: 'Match the paragraph to its main idea:', leftItems: ['Challenges of rapid urbanization', 'Definition of smart cities', 'Urbanization trends and dual nature', 'Criticism of tech-focused solutions'], rightItems: ['Housing shortages and pollution', 'Data-driven infrastructure', 'Both opportunities and challenges', 'Tech alone cannot fix inequality'], correctMatches: { '0': 'Housing shortages and pollution', '1': 'Data-driven infrastructure', '2': 'Both opportunities and challenges', '3': 'Tech alone cannot fix inequality' }, explanation: 'The passage describes both opportunities and challenges of urbanization.' },
      { type: 'true-false-not-given', question: 'Smart cities focus exclusively on technological solutions.', answer: 'false', explanation: 'The passage says smart cities "leverage technology" but critics argue tech alone "cannot address underlying social and economic disparities."' },
      { type: 'short-answer', question: 'What THREE problems are mentioned as consequences of rapid urbanization?', answer: 'housing shortages, traffic congestion, pollution', acceptableAlternatives: ['housing shortages traffic congestion pollution', 'housing shortages, traffic congestion, pollution, social inequality'], explanation: 'The passage lists "housing shortages, traffic congestion, pollution, and social inequality."' },
      { type: 'gap-fill', text: 'Contemporary approaches to urban development emphasize the concept of ______ cities.', answers: ['smart'], explanation: 'The passage introduces "smart cities" as a contemporary approach.' },
    ],
  },
]

const QUESTION_POOL: ExerciseQuestion[] = [
  { type: 'multiple-choice', question: 'What is the main purpose of the passage?', options: ['To compare different viewpoints', 'To describe a phenomenon', 'To argue for a solution', 'To explain a process'], correctIndex: 1, explanation: 'The passage primarily describes and explains its topic.' },
  { type: 'multiple-choice', question: 'What can be inferred from the passage?', options: ['The author is skeptical', 'The evidence is conclusive', 'Further research is needed', 'The situation is complex'], correctIndex: 3, explanation: 'The passage presents multiple perspectives, suggesting complexity.' },
  { type: 'true-false-not-given', question: 'The passage provides a definitive solution to the problem discussed.', answer: 'false', explanation: 'The passage presents information but does not offer a definitive solution.' },
  { type: 'short-answer', question: 'What is the author\'s main argument?', answer: 'Further consideration is needed', acceptableAlternatives: ['the issue is complex', 'more research is required'], explanation: 'Review the passage\'s concluding remarks for the author\'s perspective.' },
  { type: 'gap-fill', text: 'The passage presents a ______ analysis of the topic.', answers: ['balanced', 'comprehensive', 'detailed'], explanation: 'The passage examines multiple aspects of the topic.' },
]

function selectPassage(request: SkillActivityGenerationRequest): ReadingTemplate {
  const filtered = PASSAGES.filter(p => {
    const band = request.currentBand ?? request.targetBand ?? 5.5
    return band >= p.bandRange[0] && band <= p.bandRange[1]
  })
  if (filtered.length === 0) return PASSAGES[1]

  const scored = filtered.map(p => {
    let score = 0
    if (request.focusAreas.some(f => p.topic.toLowerCase().includes(f.toLowerCase()))) score += 2
    return { passage: p, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0].passage
}

function generateQuestions(count: number): ExerciseQuestion[] {
  return Array.from({ length: Math.min(count, QUESTION_POOL.length) }, (_, i) => ({ ...QUESTION_POOL[i] }))
}

export class ReadingSkillModule implements LearningSkillModule {
  readonly skill: IELTSSection = 'reading'

  supports(request: GenerateExerciseRequest): boolean {
    return request.skill === 'reading'
  }

  async generateActivity(request: SkillActivityGenerationRequest): Promise<SkillActivityGenerationResult> {
    const template = selectPassage(request)
    const questions = template.questions.length > 0 ? template.questions.slice() : generateQuestions(Math.max(request.availableMinutes / 5, 2))

    const exercise: Exercise = {
      id: `reading-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'reading',
      exerciseType: 'comprehension',
      objectiveId: request.objectiveId,
      title: `Reading: ${template.topic}`,
      instructions: 'Read the passage carefully and answer the questions that follow. Pay attention to details, main ideas, and implicit information.',
      content: { passage: template.passage },
      questions,
      difficulty: (template.difficulty || request.difficulty || 'medium') as any,
      estimatedMinutes: request.availableMinutes,
      sourceType: 'built-in',
      sourceIds: [],
      explanationPolicy: 'after-attempt' as const,
      evaluationPolicy: 'deterministic' as const,
      metadata: {
        targetBand: request.targetBand,
        focusAreas: [...request.focusAreas, 'reading-comprehension', template.topic.toLowerCase().replace(/\s+/g, '-')],
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
          id: `reading-mistake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          skill: 'reading',
          category: question.type === 'true-false-not-given' ? 'true-false-not-given'
            : question.type === 'matching' ? 'matching'
            : question.type === 'gap-fill' ? 'gap-fill'
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
        skill: 'reading',
        type: correctCount / totalCount >= 0.8 ? 'strength' : correctCount / totalCount >= 0.5 ? 'improvement' : 'weakness',
        description: `Reading accuracy: ${correctCount}/${totalCount} correct`,
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
      const category = m.category
      if (category === 'true-false-not-given') {
        return { type: 'true-false-not-given', question: `Review: ${m.originalResponse || 'Re-read the passage carefully'}. Which answer is correct?`, answer: 'true', explanation: m.explanation || 'Review the passage for the correct information.' }
      }
      return { type: 'multiple-choice', question: `Review: ${m.originalResponse || 'Re-read the passage to find the correct answer'}.`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctIndex: 0, explanation: m.explanation || 'Review this question type.' }
    })

    const exercise: Exercise = {
      id: `reading-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'reading',
      exerciseType: 'comprehension',
      objectiveId: '',
      title: 'Reading Error Review',
      instructions: 'Review your previous reading mistakes. Focus on understanding why each answer was incorrect.',
      questions,
      difficulty: 'easy',
      estimatedMinutes: Math.min(request.count * 3, 15),
      sourceType: 'user-mistakes',
      sourceIds: request.mistakes.map(m => m.id),
      explanationPolicy: 'always' as const,
      evaluationPolicy: 'deterministic' as const,
      metadata: {
        focusAreas: ['error-review', ...new Set(request.mistakes.map(m => m.category))],
        contextSnapshotHash: '',
        schemaVersion: '1.0.0',
      },
    }

    return { exercise }
  }
}
