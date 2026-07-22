import type { Exercise, ExerciseQuestion, QuestionGroup } from '../types'
import type { ExerciseBlueprint } from '../blueprints'
import type { ExerciseAttempt, ExerciseAttemptStatus, LearnerResponse } from '../types'
import { InvalidAttemptStateTransitionError } from '../errors'
import { isValidTransition } from '../types'
import { countAllQuestions } from '../utils/count-questions'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateExerciseBlueprint(blueprint: ExerciseBlueprint): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!blueprint.id) errors.push('Blueprint must have an id')
  if (!blueprint.version) errors.push('Blueprint must have a version')
  if (!blueprint.module) errors.push('Blueprint must have a module')
  if (!blueprint.mode) errors.push('Blueprint must have a mode')
  if (!blueprint.family) errors.push('Blueprint must have a family')

  if (blueprint.timing.estimatedDurationSeconds <= 0) {
    errors.push('Estimated duration must be positive')
  }

  if (blueprint.scoring.maxScore <= 0) {
    errors.push('Max score must be positive')
  }

  if (blueprint.allowedQuestionTypes.length === 0) {
    warnings.push('No allowed question types specified')
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function validateExercise(exercise: Exercise): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!exercise.id) errors.push('Exercise must have an id')
  if (!exercise.title) errors.push('Exercise must have a title')
  if (exercise.schemaVersion < 1) errors.push('Schema version must be >= 1')
  if (!exercise.blueprintVersion) errors.push('Exercise must reference a blueprint version')
  if (exercise.estimatedDurationSeconds <= 0) errors.push('Estimated duration must be positive')

  const allIds = new Set<string>()

  switch (exercise.module) {
    case 'reading': {
      if (!exercise.passages || exercise.passages.length === 0) {
        errors.push('Reading exercise must have at least one passage')
      }
      for (const passage of exercise.passages ?? []) {
        if (allIds.has(passage.id)) {
          errors.push(`Duplicate passage id: ${passage.id}`)
        }
        allIds.add(passage.id)
        validateQuestionGroups(passage.questionGroups, errors, allIds)
      }
      break
    }
    case 'listening': {
      if (!exercise.parts || exercise.parts.length === 0) {
        errors.push('Listening exercise must have at least one part')
      }
      for (const part of exercise.parts ?? []) {
        if (allIds.has(part.id)) {
          errors.push(`Duplicate part id: ${part.id}`)
        }
        allIds.add(part.id)
        validateQuestionGroups(part.questionGroups, errors, allIds)
      }
      break
    }
    case 'writing': {
      if (!exercise.tasks || exercise.tasks.length === 0) {
        errors.push('Writing exercise must have at least one task')
      }
      for (const task of exercise.tasks ?? []) {
        if (allIds.has(task.id)) {
          errors.push(`Duplicate task id: ${task.id}`)
        }
        allIds.add(task.id)
        if (!task.prompt) errors.push(`Task ${task.taskNumber} must have a prompt`)
      }
      break
    }
    case 'speaking': {
      if (!exercise.parts || exercise.parts.length === 0) {
        errors.push('Speaking exercise must have at least one part')
      }
      for (const part of exercise.parts ?? []) {
        if (allIds.has(part.id)) {
          errors.push(`Duplicate speaking part id: ${part.id}`)
        }
        allIds.add(part.id)
      }
      break
    }
    case 'grammar': {
      if (!exercise.items || exercise.items.length === 0) {
        errors.push('Grammar exercise must have at least one item')
      }
      for (const item of exercise.items ?? []) {
        if (allIds.has(item.id)) {
          errors.push(`Duplicate grammar item id: ${item.id}`)
        }
        allIds.add(item.id)
      }
      break
    }
    case 'vocabulary': {
      if (!exercise.terms || exercise.terms.length === 0) {
        errors.push('Vocabulary exercise must have at least one term')
      }
      for (const term of exercise.terms ?? []) {
        if (allIds.has(term.id)) {
          errors.push(`Duplicate vocabulary term id: ${term.id}`)
        }
        allIds.add(term.id)
      }
      break
    }
    case 'saved_content': {
      if (!exercise.contentReference) {
        errors.push('Saved content exercise must reference source content')
      }
      if (!exercise.activities || exercise.activities.length === 0) {
        errors.push('Saved content exercise must have activities')
      }
      validateQuestionGroups(exercise.activities ?? [], errors, allIds)
      break
    }
    case 'mistake_review': {
      if (!exercise.mistakes || exercise.mistakes.length === 0) {
        errors.push('Mistake review exercise must have mistakes')
      }
      if (!exercise.reviewActivities || exercise.reviewActivities.length === 0) {
        errors.push('Mistake review exercise must have review activities')
      }
      validateQuestionGroups(exercise.reviewActivities ?? [], errors, allIds)
      break
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

function validateQuestionGroups(groups: QuestionGroup[], errors: string[], allIds: Set<string>): void {
  for (const group of groups) {
    if (allIds.has(group.id)) {
      errors.push(`Duplicate question group id: ${group.id}`)
    }
    allIds.add(group.id)

    for (const question of group.questions) {
      if (allIds.has(question.id)) {
        errors.push(`Duplicate question id: ${question.id}`)
      }
      allIds.add(question.id)
    }
  }
}

export function validateExerciseAgainstBlueprint(
  exercise: Exercise,
  blueprint: ExerciseBlueprint,
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (exercise.module !== blueprint.module) {
    errors.push(`Module mismatch: exercise=${exercise.module}, blueprint=${blueprint.module}`)
  }
  if (exercise.mode !== blueprint.mode) {
    errors.push(`Mode mismatch: exercise=${exercise.mode}, blueprint=${blueprint.mode}`)
  }
  if (exercise.family !== blueprint.family) {
    errors.push(`Family mismatch: exercise=${exercise.family}, blueprint=${blueprint.family}`)
  }

  const totalQuestions = countAllQuestions(exercise)

  if (blueprint.structure.exactItems !== undefined && totalQuestions !== blueprint.structure.exactItems) {
    errors.push(`Expected exactly ${blueprint.structure.exactItems} items but found ${totalQuestions}`)
  }
  if (blueprint.structure.minItems !== undefined && totalQuestions < blueprint.structure.minItems) {
    errors.push(`Expected at least ${blueprint.structure.minItems} items but found ${totalQuestions}`)
  }
  if (blueprint.structure.maxItems !== undefined && totalQuestions > blueprint.structure.maxItems) {
    errors.push(`Expected at most ${blueprint.structure.maxItems} items but found ${totalQuestions}`)
  }

  if (blueprint.structure.totalQuestions !== undefined) {
    if (totalQuestions !== blueprint.structure.totalQuestions) {
      errors.push(`Expected ${blueprint.structure.totalQuestions} total questions but found ${totalQuestions}`)
    }
  }

  validateIeltsInvariants(exercise, blueprint, errors)

  return { valid: errors.length === 0, errors, warnings }
}


function validateIeltsInvariants(exercise: Exercise, blueprint: ExerciseBlueprint, errors: string[]): void {
  if (blueprint.mode !== 'full_test') return

  switch (exercise.module) {
    case 'listening': {
      if (exercise.parts.length !== 4) {
        errors.push('Full listening test must have exactly 4 parts')
      }
      for (const part of exercise.parts) {
        const qCount = part.questionGroups.reduce((s, g) => s + g.questions.length, 0)
        if (qCount !== 10) {
          errors.push(`Listening part ${part.partNumber} must have exactly 10 questions, found ${qCount}`)
        }
      }
      break
    }
    case 'reading': {
      if (exercise.passages.length !== 3) {
        errors.push('Full reading test must have exactly 3 passages')
      }
      const totalQ = exercise.passages.reduce(
        (sum, p) => sum + p.questionGroups.reduce((s, g) => s + g.questions.length, 0),
        0,
      )
      if (totalQ !== 40) {
        errors.push(`Full reading test must have exactly 40 questions, found ${totalQ}`)
      }
      break
    }
    case 'writing': {
      if (exercise.tasks.length !== 2) {
        errors.push('Full writing test must have exactly 2 tasks')
      }
      const task1 = exercise.tasks.find(t => t.taskType === 'task_1')
      const task2 = exercise.tasks.find(t => t.taskType === 'task_2')
      if (!task1) errors.push('Full writing test must have Task 1')
      if (!task2) errors.push('Full writing test must have Task 2')
      if (task2 && task2.weight !== 2) errors.push('Task 2 must have weight 2')
      break
    }
    case 'speaking': {
      if (exercise.parts.length !== 3) {
        errors.push('Full speaking simulation must have exactly 3 parts')
      }
      const part2 = exercise.parts.find(p => p.partNumber === 2)
      if (part2 && part2.preparationSeconds !== 60) {
        errors.push('Speaking Part 2 must have 60 seconds preparation')
      }
      break
    }
  }
}

export function validateAttempt(attempt: ExerciseAttempt, exercise: Exercise): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!attempt.id) errors.push('Attempt must have an id')
  if (attempt.exerciseId !== exercise.id) {
    errors.push(`Attempt exerciseId ${attempt.exerciseId} does not match exercise ${exercise.id}`)
  }
  if (!attempt.exerciseSnapshotVersion) {
    errors.push('Attempt must reference an exercise snapshot version')
  }
  if (attempt.elapsedSeconds < 0) {
    errors.push('Elapsed seconds cannot be negative')
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function validateAttemptTransition(
  attempt: ExerciseAttempt,
  newStatus: ExerciseAttemptStatus,
): void {
  if (!isValidTransition(attempt.status, newStatus)) {
    throw new InvalidAttemptStateTransitionError(attempt.id, attempt.status, newStatus)
  }
}

export function validateResponse(
  question: ExerciseQuestion,
  response: LearnerResponse,
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  switch (question.type) {
    case 'multiple_choice':
      if (response.type !== 'choice') {
        errors.push('Multiple choice question requires a choice response')
      }
      break
    case 'multiple_select':
      if (response.type !== 'multi_choice') {
        errors.push('Multiple select question requires a multi-choice response')
      }
      break
    case 'matching':
      if (response.type !== 'matching') {
        errors.push('Matching question requires a matching response')
      }
      break
    case 'ordering':
      if (response.type !== 'ordering') {
        errors.push('Ordering question requires an ordering response')
      }
      break
    case 'completion':
    case 'short_answer':
    case 'true_false_not_given':
    case 'yes_no_not_given':
      if (response.type !== 'text') {
        errors.push(`${question.type} question requires a text response`)
      }
      break
    case 'classification':
      if (response.type !== 'classification') {
        errors.push('Classification question requires a classification response')
      }
      break
  }

  return { valid: errors.length === 0, errors, warnings }
}
