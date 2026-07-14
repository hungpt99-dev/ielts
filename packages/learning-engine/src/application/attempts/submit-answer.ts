import type { SubmitLearningAnswerRequest, SubmitLearningAnswerResult } from '../../domain/entities/learning-attempt'
import type { AnswerEvaluation } from '../../domain/entities/evaluation'
import type { LearningSessionRepository, LearningAttemptRepository, ExerciseRepository } from '../../ports/session-repository'
import type { TutorIntelligencePort } from '../../ports/tutor-intelligence-port'
import type { MistakeRepository } from '../../ports/mistake-repository'
import type { LearningEventPublisher } from '../../ports/learning-event-publisher'
import { gradeAnswer } from '../../domain/policies/deterministic-grader'
import { selectEvaluationMethod } from '../../domain/policies/evaluation-policy'

export interface SubmitAnswerDependencies {
  sessionRepository: LearningSessionRepository
  attemptRepository: LearningAttemptRepository
  exerciseRepository: ExerciseRepository
  tutorPort: TutorIntelligencePort
  mistakeRepository: MistakeRepository
  eventPublisher: LearningEventPublisher
}

export async function submitAnswer(
  request: SubmitLearningAnswerRequest,
  deps: SubmitAnswerDependencies,
): Promise<SubmitLearningAnswerResult> {
  const attempt = await deps.attemptRepository.getById(request.attemptId)
  if (!attempt) throw new Error(`Attempt ${request.attemptId} not found`)
  if (attempt.status === 'submitted' || attempt.status === 'evaluated' || attempt.status === 'completed') {
    throw new Error(`Attempt ${request.attemptId} has already been submitted`)
  }

  const exercise = await deps.exerciseRepository.getById(attempt.exerciseId)
  if (!exercise) throw new Error(`Exercise ${attempt.exerciseId} not found`)

  attempt.answers = request.answers
  attempt.status = 'submitted'
  attempt.submittedAt = new Date().toISOString()
  await deps.attemptRepository.save(attempt)

  const evaluations: AnswerEvaluation[] = []
  let allComplete = true

  for (const answer of attempt.answers) {
    const question = exercise.questions.find(q => {
      const qId = 'question' in q ? (q as any).question : ''
      return answer.questionId === qId
    })

    if (!question) continue

    const evalMethod = selectEvaluationMethod(question.type, true)

    if (evalMethod === 'deterministic') {
      const evaluation = gradeAnswer(question, answer.answer)
      evaluations.push(evaluation)
    } else {
      evaluations.push({
        questionId: answer.questionId,
        status: 'not-evaluable',
        score: 0,
        maximumScore: 1,
        feedback: 'This question requires manual review.',
        mistakes: [],
        skillEvidence: [],
        evaluatedBy: 'deterministic',
        confidence: 0.5,
      })
      allComplete = false
    }
  }

  attempt.evaluations = evaluations
  attempt.status = allComplete ? 'evaluated' : 'submitted'
  attempt.evaluatedAt = new Date().toISOString()
  await deps.attemptRepository.save(attempt)

  const hasMistakes = evaluations.some(e => e.status === 'incorrect' || e.status === 'partially-correct')
  if (hasMistakes) {
    for (const eval_ of evaluations) {
      for (const m of eval_.mistakes) {
        if (m.originalResponse) {
          try {
            await deps.mistakeRepository.save(m)
            deps.eventPublisher.publish({
              id: crypto.randomUUID?.() ?? `${Date.now()}-mistake`,
              type: 'mistake_detected',
              occurredAt: new Date().toISOString(),
              source: 'learning-engine',
              sessionId: request.sessionId,
              mistakeId: m.id,
              skill: m.skill,
              category: m.category,
              recurrenceCount: m.recurrenceCount,
              schemaVersion: '1.0',
            })
          } catch (error) {
 console.error('packages/learning-engine/src/application/attempts/submit-answer.ts error:', error);
 /* continue */ }
        }
      }
    }
  }

  await deps.eventPublisher.publish({
    id: crypto.randomUUID?.() ?? `${Date.now()}-evt`,
    type: 'answer_evaluated',
    occurredAt: new Date().toISOString(),
    source: 'learning-engine',
    sessionId: request.sessionId,
    exerciseId: attempt.exerciseId,
    questionId: '',
    status: 'evaluated',
    score: evaluations.reduce((s, e) => s + e.score, 0),
    schemaVersion: '1.0',
  })

  const completed = allComplete || evaluations.every(e => e.status === 'correct' || e.status === 'incorrect')

  return { attempt, evaluation: evaluations, completed }
}
