import type { Exercise, BaseExercise } from '../domain/types'

export interface LegacyExercise {
  id: string
  sessionId?: string
  skill?: string
  exerciseType?: string
  questions?: unknown[]
  difficulty?: string
  estimatedMinutes?: number
  sourceType?: string
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export interface MigrationResult {
  migrated: Exercise | null
  status: 'migrated' | 'legacy_practice' | 'incompatible' | 'error'
  warnings: string[]
  errors: string[]
}

export function migrateLegacyExercise(legacy: LegacyExercise): MigrationResult {
  const warnings: string[] = []
  const errors: string[] = []

  if (!legacy.id) {
    return { migrated: null, status: 'incompatible', warnings, errors: ['Missing id'] }
  }

  const moduleMap: Record<string, string> = {
    listening: 'listening',
    reading: 'reading',
    writing: 'writing',
    speaking: 'speaking',
    grammar: 'grammar',
    vocabulary: 'vocabulary',
  }

  const module = legacy.skill ? moduleMap[legacy.skill] : undefined
  if (!module) {
    warnings.push(`Unknown skill: ${legacy.skill}, marking as legacy_practice`)
    return { migrated: null, status: 'legacy_practice', warnings, errors }
  }

  const mode = inferMode(legacy)
  const family = inferFamily(legacy)

  if (!family) {
    warnings.push('Could not determine exercise family')
    return { migrated: null, status: 'incompatible', warnings, errors }
  }

  const now = new Date().toISOString()

  const base = {
    id: legacy.id,
    schemaVersion: 1,
    blueprintVersion: 'migrated',
    module: module as Exercise['module'],
    mode,
    family,
    title: (legacy.metadata?.title as string) ?? `${module} exercise`,
    instructions: [],
    source: 'built_in' as const,
    status: 'active' as const,
    estimatedDurationSeconds: (legacy.estimatedMinutes ?? 15) * 60,
    difficulty: {
      linguisticComplexity: 0.5,
      lexicalComplexity: 0.5,
      grammaticalComplexity: 0.5,
      inferenceDepth: 0.5,
      distractorStrength: 0.5,
      informationDensity: 0.5,
      paraphraseDistance: 0.5,
      responseComplexity: 0.5,
      timePressure: 0.5,
    },
    learningObjectives: [],
    tags: ['migrated'],
    createdAt: now,
    updatedAt: now,
  }

  if (mode === 'full_test') {
    warnings.push('Legacy exercise marked as full_test — verify structure before treating as official IELTS test')
  }

  return {
    migrated: base as unknown as BaseExercise as Exercise,
    status: 'migrated',
    warnings,
    errors,
  }
}

function inferMode(legacy: LegacyExercise): Exercise['mode'] {
  const metadata = legacy.metadata ?? {}
  if (metadata.mode && typeof metadata.mode === 'string') {
    return metadata.mode as Exercise['mode']
  }

  const questionCount = legacy.questions?.length ?? 0
  if (questionCount >= 40 && (legacy.skill === 'reading' || legacy.skill === 'listening')) {
    return 'focused_practice'
  }

  return 'focused_practice'
}

function inferFamily(legacy: LegacyExercise): Exercise['family'] | null {
  const typeMap: Record<string, Exercise['family']> = {
    quiz: 'objective_questions',
    lesson: 'content_comprehension',
    essay: 'writing_task',
    speaking: 'speaking_session',
    comprehension: 'content_comprehension',
    'error-correction': 'grammar_activity',
    'gap-fill': 'completion_questions',
    matching: 'matching_questions',
    shadowing: 'speaking_session',
  }

  if (legacy.exerciseType && typeMap[legacy.exerciseType]) {
    return typeMap[legacy.exerciseType]
  }

  if (legacy.skill === 'writing') return 'writing_task'
  if (legacy.skill === 'speaking') return 'speaking_session'
  if (legacy.skill === 'grammar') return 'grammar_activity'
  if (legacy.skill === 'vocabulary') return 'vocabulary_activity'
  if (legacy.skill === 'reading') return 'objective_questions'
  if (legacy.skill === 'listening') return 'interactive_listening'

  return 'objective_questions'
}

export function isLegacyExercise(data: unknown): data is LegacyExercise {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return typeof obj.id === 'string' && !('schemaVersion' in obj)
}

export function migrateExerciseBatch(exercises: LegacyExercise[]): {
  migrated: Exercise[]
  legacyPractice: LegacyExercise[]
  incompatible: LegacyExercise[]
  errors: Array<{ exercise: LegacyExercise; errors: string[] }>
} {
  const migrated: Exercise[] = []
  const legacyPractice: LegacyExercise[] = []
  const incompatible: LegacyExercise[] = []
  const errors: Array<{ exercise: LegacyExercise; errors: string[] }> = []

  for (const exercise of exercises) {
    const result = migrateLegacyExercise(exercise)
    switch (result.status) {
      case 'migrated':
        if (result.migrated) migrated.push(result.migrated)
        break
      case 'legacy_practice':
        legacyPractice.push(exercise)
        break
      case 'incompatible':
        incompatible.push(exercise)
        break
      case 'error':
        errors.push({ exercise, errors: result.errors })
        break
    }
  }

  return { migrated, legacyPractice, incompatible, errors }
}
