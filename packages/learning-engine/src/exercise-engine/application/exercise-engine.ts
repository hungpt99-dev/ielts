import type { Exercise } from '../domain/types'
import type { ExerciseAttempt, LearnerResponse } from '../domain/types'
import type {
  ExerciseRepository,
  ExerciseAttemptRepository,
  ExerciseBlueprintRepository,
  ExerciseGeneratorPort,
  ExerciseGenerationContext,
} from '../domain/ports'
import type { ExerciseEventPublisher } from '../domain/events'
import { validateAttemptTransition } from '../domain/validators'
import { getScoringStrategy } from '../scoring'
import { calculateTiming } from '../timing'
import { InvalidAttemptStateTransitionError, GenerationRepairLimitExceededError } from '../domain/errors'
import { freezeBlueprint } from '../domain/blueprints'
import { generateWithRepair } from './generation-repair'

export interface ExerciseEngineDependencies {
  exerciseRepository: ExerciseRepository
  attemptRepository: ExerciseAttemptRepository
  blueprintRepository: ExerciseBlueprintRepository
  generator: ExerciseGeneratorPort
  eventPublisher: ExerciseEventPublisher
  generateId: () => string
  getCurrentTime: () => string
}

export interface CreateExerciseRequest {
  blueprintId: string
  context: ExerciseGenerationContext
}

export interface StartAttemptRequest {
  exerciseId: string
}

export interface SaveResponseRequest {
  attemptId: string
  questionId: string
  response: LearnerResponse
}

export interface SubmitAttemptRequest {
  attemptId: string
}

export interface PauseAttemptRequest {
  attemptId: string
}

export interface ResumeAttemptRequest {
  attemptId: string
}

export interface EvaluateAttemptRequest {
  attemptId: string
}

export class ExerciseEngine {
  constructor(private readonly deps: ExerciseEngineDependencies) {}

  async generateExercise(request: CreateExerciseRequest): Promise<Exercise> {
    const blueprint = await this.deps.blueprintRepository.getById(request.blueprintId)
    if (!blueprint) {
      throw new Error(`Blueprint not found: ${request.blueprintId}`)
    }

    const frozenBlueprint = freezeBlueprint(blueprint)
    const repairResult = await generateWithRepair(
      this.deps.generator.generate.bind(this.deps.generator),
      frozenBlueprint,
      request.context,
    )

    if (!repairResult.exercise) {
      throw new GenerationRepairLimitExceededError(blueprint.id, repairResult.attemptCount)
    }

    await this.deps.exerciseRepository.save(repairResult.exercise)
    await this.deps.eventPublisher.publish({
      id: this.deps.generateId(),
      type: 'exercise_generated',
      occurredAt: this.deps.getCurrentTime(),
      exerciseId: repairResult.exercise.id,
      blueprintId: blueprint.id,
      module: repairResult.exercise.module,
      aiUsed: true,
    })

    return repairResult.exercise
  }

  async loadExercise(exerciseId: string): Promise<Exercise> {
    const exercise = await this.deps.exerciseRepository.getById(exerciseId)
    if (!exercise) {
      throw new Error(`Exercise not found: ${exerciseId}`)
    }
    return exercise
  }

  async startAttempt(request: StartAttemptRequest): Promise<ExerciseAttempt> {
    const exercise = await this.deps.exerciseRepository.getById(request.exerciseId)
    if (!exercise) {
      throw new Error(`Exercise not found: ${request.exerciseId}`)
    }

    const timing = calculateTiming(exercise)

    const attempt: ExerciseAttempt = {
      id: this.deps.generateId(),
      exerciseId: exercise.id,
      exerciseSnapshotVersion: `${exercise.schemaVersion}:${exercise.updatedAt}`,
      status: 'in_progress',
      responses: {},
      startedAt: this.deps.getCurrentTime(),
      elapsedSeconds: 0,
      remainingSeconds: timing.estimatedDurationSeconds,
    }

    await this.deps.attemptRepository.save(attempt)
    await this.deps.eventPublisher.publish({
      id: this.deps.generateId(),
      type: 'exercise_started',
      occurredAt: this.deps.getCurrentTime(),
      exerciseId: exercise.id,
      attemptId: attempt.id,
    })

    return attempt
  }

  async saveResponse(request: SaveResponseRequest): Promise<ExerciseAttempt> {
    const attempt = await this.deps.attemptRepository.getById(request.attemptId)
    if (!attempt) {
      throw new Error(`Attempt not found: ${request.attemptId}`)
    }

    if (attempt.status !== 'in_progress') {
      throw new InvalidAttemptStateTransitionError(attempt.id, attempt.status, 'save_response')
    }

    attempt.responses[request.questionId] = request.response
    await this.deps.attemptRepository.save(attempt)

    return attempt
  }

  async pauseAttempt(request: PauseAttemptRequest): Promise<ExerciseAttempt> {
    const attempt = await this.deps.attemptRepository.getById(request.attemptId)
    if (!attempt) {
      throw new Error(`Attempt not found: ${request.attemptId}`)
    }

    validateAttemptTransition(attempt, 'paused')
    attempt.status = 'paused'
    attempt.pausedAt = this.deps.getCurrentTime()
    await this.deps.attemptRepository.save(attempt)

    await this.deps.eventPublisher.publish({
      id: this.deps.generateId(),
      type: 'exercise_paused',
      occurredAt: this.deps.getCurrentTime(),
      exerciseId: attempt.exerciseId,
      attemptId: attempt.id,
      elapsedSeconds: attempt.elapsedSeconds,
    })

    return attempt
  }

  async resumeAttempt(request: ResumeAttemptRequest): Promise<ExerciseAttempt> {
    const attempt = await this.deps.attemptRepository.getById(request.attemptId)
    if (!attempt) {
      throw new Error(`Attempt not found: ${request.attemptId}`)
    }

    validateAttemptTransition(attempt, 'in_progress')
    attempt.status = 'in_progress'
    attempt.pausedAt = undefined
    await this.deps.attemptRepository.save(attempt)

    await this.deps.eventPublisher.publish({
      id: this.deps.generateId(),
      type: 'exercise_resumed',
      occurredAt: this.deps.getCurrentTime(),
      exerciseId: attempt.exerciseId,
      attemptId: attempt.id,
    })

    return attempt
  }

  async submitAttempt(request: SubmitAttemptRequest): Promise<ExerciseAttempt> {
    const attempt = await this.deps.attemptRepository.getById(request.attemptId)
    if (!attempt) {
      throw new Error(`Attempt not found: ${request.attemptId}`)
    }

    validateAttemptTransition(attempt, 'submitted')
    attempt.status = 'submitted'
    attempt.submittedAt = this.deps.getCurrentTime()
    await this.deps.attemptRepository.save(attempt)

    await this.deps.eventPublisher.publish({
      id: this.deps.generateId(),
      type: 'exercise_submitted',
      occurredAt: this.deps.getCurrentTime(),
      exerciseId: attempt.exerciseId,
      attemptId: attempt.id,
      responseCount: Object.keys(attempt.responses).length,
    })

    return attempt
  }

  async evaluateAttempt(request: EvaluateAttemptRequest): Promise<ExerciseAttempt> {
    const attempt = await this.deps.attemptRepository.getById(request.attemptId)
    if (!attempt) {
      throw new Error(`Attempt not found: ${request.attemptId}`)
    }

    const exercise = await this.deps.exerciseRepository.getById(attempt.exerciseId)
    if (!exercise) {
      throw new Error(`Exercise not found: ${attempt.exerciseId}`)
    }

    validateAttemptTransition(attempt, 'evaluating')
    attempt.status = 'evaluating'
    await this.deps.attemptRepository.save(attempt)

    const scoringStrategy = getScoringStrategy(exercise.module)
    const result = await scoringStrategy.score(exercise, attempt)

    attempt.result = result
    attempt.status = 'completed'
    attempt.completedAt = this.deps.getCurrentTime()
    await this.deps.attemptRepository.save(attempt)

    await this.deps.eventPublisher.publish({
      id: this.deps.generateId(),
      type: 'exercise_evaluated',
      occurredAt: this.deps.getCurrentTime(),
      exerciseId: attempt.exerciseId,
      attemptId: attempt.id,
      result,
    })

    await this.deps.eventPublisher.publish({
      id: this.deps.generateId(),
      type: 'exercise_completed',
      occurredAt: this.deps.getCurrentTime(),
      exerciseId: attempt.exerciseId,
      attemptId: attempt.id,
      result,
    })

    return attempt
  }

  async abandonAttempt(attemptId: string, reason?: string): Promise<ExerciseAttempt> {
    const attempt = await this.deps.attemptRepository.getById(attemptId)
    if (!attempt) {
      throw new Error(`Attempt not found: ${attemptId}`)
    }

    validateAttemptTransition(attempt, 'abandoned')
    attempt.status = 'abandoned'
    await this.deps.attemptRepository.save(attempt)

    await this.deps.eventPublisher.publish({
      id: this.deps.generateId(),
      type: 'exercise_abandoned',
      occurredAt: this.deps.getCurrentTime(),
      exerciseId: attempt.exerciseId,
      attemptId: attempt.id,
      reason,
    })

    return attempt
  }
}
