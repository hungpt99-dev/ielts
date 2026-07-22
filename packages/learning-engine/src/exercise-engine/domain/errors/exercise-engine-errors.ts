export type ExerciseEngineErrorCode =
  | 'invalid_exercise_blueprint'
  | 'unsupported_exercise_type'
  | 'incomplete_exercise'
  | 'invalid_question_count'
  | 'duplicate_exercise_item_id'
  | 'invalid_answer_rule'
  | 'invalid_scoring_policy'
  | 'invalid_attempt_state_transition'
  | 'exercise_not_found'
  | 'attempt_not_found'
  | 'blueprint_not_found'
  | 'generation_failed'
  | 'validation_failed'
  | 'repair_failed'
  | 'repair_limit_exceeded'
  | 'migration_failed'
  | 'storage_failure'
  | 'ai_evaluation_failed'
  | 'content_not_grounded'
  | 'ielts_invariant_violated'

export class ExerciseEngineError extends Error {
  constructor(
    public readonly code: ExerciseEngineErrorCode,
    message: string,
    public readonly context?: Record<string, unknown>,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'ExerciseEngineError'
  }
}

export class InvalidExerciseBlueprintError extends ExerciseEngineError {
  constructor(
    public readonly blueprintId: string,
    public readonly violations: string[],
    cause?: unknown,
  ) {
    super(
      'invalid_exercise_blueprint',
      `Blueprint ${blueprintId} is invalid: ${violations.join('; ')}`,
      { blueprintId, violations },
      cause,
    )
    this.name = 'InvalidExerciseBlueprintError'
  }
}

export class UnsupportedExerciseTypeError extends ExerciseEngineError {
  constructor(
    public readonly module: string,
    public readonly mode: string,
    public readonly family: string,
  ) {
    super(
      'unsupported_exercise_type',
      `Unsupported exercise type: ${module}/${mode}/${family}`,
      { module, mode, family },
    )
    this.name = 'UnsupportedExerciseTypeError'
  }
}

export class IncompleteExerciseError extends ExerciseEngineError {
  constructor(
    public readonly exerciseId: string,
    public readonly missingFields: string[],
  ) {
    super(
      'incomplete_exercise',
      `Exercise ${exerciseId} is missing required fields: ${missingFields.join(', ')}`,
      { exerciseId, missingFields },
    )
    this.name = 'IncompleteExerciseError'
  }
}

export class InvalidQuestionCountError extends ExerciseEngineError {
  constructor(
    public readonly expected: number,
    public readonly actual: number,
    context?: string,
  ) {
    super(
      'invalid_question_count',
      `Expected ${expected} questions but found ${actual}${context ? ` (${context})` : ''}`,
      { expected, actual, context },
    )
    this.name = 'InvalidQuestionCountError'
  }
}

export class DuplicateExerciseItemIdError extends ExerciseEngineError {
  constructor(
    public readonly duplicateId: string,
  ) {
    super(
      'duplicate_exercise_item_id',
      `Duplicate item ID found: ${duplicateId}`,
      { duplicateId },
    )
    this.name = 'DuplicateExerciseItemIdError'
  }
}

export class InvalidAttemptStateTransitionError extends ExerciseEngineError {
  constructor(
    public readonly attemptId: string,
    public readonly fromStatus: string,
    public readonly toStatus: string,
  ) {
    super(
      'invalid_attempt_state_transition',
      `Invalid state transition for attempt ${attemptId}: ${fromStatus} → ${toStatus}`,
      { attemptId, fromStatus, toStatus },
    )
    this.name = 'InvalidAttemptStateTransitionError'
  }
}

export class IeltsInvariantViolatedError extends ExerciseEngineError {
  constructor(
    public readonly invariant: string,
    public readonly details: string,
  ) {
    super(
      'ielts_invariant_violated',
      `IELTS invariant violated: ${invariant} — ${details}`,
      { invariant, details },
    )
    this.name = 'IeltsInvariantViolatedError'
  }
}

export class GenerationRepairLimitExceededError extends ExerciseEngineError {
  constructor(
    public readonly blueprintId: string,
    public readonly attemptCount: number,
  ) {
    super(
      'repair_limit_exceeded',
      `Repair limit exceeded for blueprint ${blueprintId} after ${attemptCount} attempts`,
      { blueprintId, attemptCount },
    )
    this.name = 'GenerationRepairLimitExceededError'
  }
}
