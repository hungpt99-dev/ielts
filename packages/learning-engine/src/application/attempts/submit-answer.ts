import type { SubmitLearningAnswerRequest, SubmitLearningAnswerResult } from '../../domain/entities/learning-attempt'
import type { AnswerEvaluation } from '../../domain/entities/evaluation'
import type { LearningSessionRepository, LearningAttemptRepository, ExerciseRepository } from '../../ports/session-repository'
import type { TutorIntelligencePort } from '../../ports/tutor-intelligence-port'
import type { MistakeRepository } from '../../ports/mistake-repository'
import type { LearningEventPublisher } from '../../ports/learning-event-publisher'
import { ATTEMPT_STATUS } from '../../domain/constants'
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
  if (attempt.status === ATTEMPT_STATUS.SUBMITTED || attempt.status === ATTEMPT_STATUS.EVALUATED || attempt.status === ATTEMPT_STATUS.COMPLETED) {
    throw new Error(`Attempt ${request.attemptId} has already been submitted`)
  }

  const exercise = await deps.exerciseRepository.getById(attempt.exerciseId)
  if (!exercise) throw new Error(`Exercise ${attempt.exerciseId} not found`)

  attempt.answers = request.answers
  attempt.status = ATTEMPT_STATUS.SUBMITTED
  attempt.submittedAt = new Date().toISOString()
  await deps.attemptRepository.save(attempt)

  const evaluations: AnswerEvaluation[] = []
  let allComplete = true

  for (let i = 0; i < attempt.answers.length; i++) {
    const answer = attempt.answers[i]
    const question = exercise.questions[i]
    if (!question) continue

    const evalMethod = selectEvaluationMethod(question.type, true)

    if (evalMethod === 'deterministic') {
      const evaluation = gradeAnswer(question, answer.answer)
      evaluations.push(evaluation)
    } else if (evalMethod === 'ai-only' || evalMethod === 'ai-assisted') {
      try {
        const rubric = ('rubric' in question && Array.isArray(question.rubric) ? question.rubric : ['Relevance', 'Accuracy', 'Clarity']) as string[]
        const aiResult = await deps.tutorPort.evaluateOpenResponse({
          response: String(answer.answer),
          rubric,
          schema: {} as any,
          maxTokens: 2000,
        })
        if (aiResult.success && aiResult.data) {
          const data = aiResult.data as any
          const score = typeof data.overallBand === 'number' ? data.overallBand : (typeof data.score === 'number' ? data.score : 0)
          const maxScore = typeof data.maximumScore === 'number' ? data.maximumScore : 9
          evaluations.push({
            questionId: answer.questionId,
            status: score >= maxScore / 2 ? 'correct' : (score > 0 ? 'partially-correct' : 'incorrect'),
            score,
            maximumScore: maxScore,
            feedback: data.overallFeedback ?? data.feedback ?? 'Evaluated by AI',
            mistakes: (data.corrections ?? data.mistakes ?? []).map((c: any, i: number) => ({
              id: `ai-mistake-${i}`,
              skill: exercise.skill as any,
              category: 'content',
              originalResponse: c.original ?? c.text ?? '',
              correctedResponse: c.corrected ?? c.correction ?? '',
              explanation: c.explanation ?? '',
            sourceExerciseId: exercise.id,
            sourceQuestionId: answer.questionId,
            occurredAt: new Date().toISOString(),
            recurrenceCount: 0,
            severity: 'moderate' as const,
            confidence: 0.7,
            reviewStatus: 'unreviewed' as const,
          })),
          skillEvidence: (data.strengths ?? []).map((s: string) => ({
              skill: exercise.skill as any,
              type: 'strength' as const,
              description: s,
              score: 0,
              maximumScore: 0,
              accuracy: 0,
              sourceExerciseId: exercise.id,
              sourceSessionId: attempt.sessionId,
              occurredAt: new Date().toISOString(),
              confidence: 0.5,
            })),
            evaluatedBy: evalMethod === 'ai-only' ? 'ai-only' : 'ai-assisted',
            confidence: data.confidence ?? 0.5,
          })
        } else {
          evaluations.push({
            questionId: answer.questionId,
            status: 'not-evaluable',
            score: 0,
            maximumScore: 1,
            feedback: aiResult.error?.message ?? 'AI evaluation failed',
            mistakes: [],
            skillEvidence: [],
            evaluatedBy: evalMethod === 'ai-only' ? 'ai-only' : 'ai-assisted',
            confidence: 0,
          })
        }
      } catch {
        evaluations.push({
          questionId: answer.questionId,
          status: 'not-evaluable',
          score: 0,
          maximumScore: 1,
          feedback: 'AI evaluation error',
          mistakes: [],
          skillEvidence: [],
          evaluatedBy: 'ai-assisted',
          confidence: 0,
        })
      }
    } else {
      evaluations.push({
        questionId: answer.questionId,
        status: 'not-evaluable',
        score: 0,
        maximumScore: 1,
        feedback: 'This question cannot be evaluated automatically.',
        mistakes: [],
        skillEvidence: [],
        evaluatedBy: 'deterministic',
        confidence: 0.5,
      })
      allComplete = false
    }
  }

  attempt.evaluations = evaluations
  attempt.status = allComplete ? ATTEMPT_STATUS.EVALUATED : ATTEMPT_STATUS.SUBMITTED
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
    status: ATTEMPT_STATUS.EVALUATED,
    score: evaluations.reduce((s, e) => s + e.score, 0),
    schemaVersion: '1.0',
  })

  const completed = allComplete || evaluations.every(e => e.status === 'correct' || e.status === 'incorrect')

  return { attempt, evaluation: evaluations, completed }
}
