import {
  ExerciseEngine,
  InMemoryExerciseBlueprintRepository,
  createFullReadingBlueprint,
  createReadingPassageBlueprint,
  createFullListeningBlueprint,
  createListeningPartBlueprint,
  createFullWritingBlueprint,
  createWritingTaskBlueprint,
  createFullSpeakingBlueprint,
  createFocusedGrammarBlueprint,
  createFocusedVocabularyBlueprint,
  createSavedContentBlueprint,
  createMistakeReviewBlueprint,
} from '@ielts/learning-engine'
import type {
  ExerciseEngineDependencies,
  ExerciseGeneratorPort,
  ExerciseBlueprint,
  Exercise,
  ExerciseGenerationContext,
  ExerciseEventPublisher,
  ExerciseEngineEvent,
} from '@ielts/learning-engine'
import { DexieExerciseRepository, DexieExerciseAttemptRepository } from '@ielts/storage'

let exerciseEngineInstance: ExerciseEngine | null = null

const stubGenerator: ExerciseGeneratorPort = {
  async generate(
    _blueprint: ExerciseBlueprint,
    _context: ExerciseGenerationContext,
  ): Promise<Exercise> {
    throw new Error('ExerciseGenerator not yet wired — production storage adapters coming later')
  },
}

const stubEventPublisher: ExerciseEventPublisher = {
  async publish(_event: ExerciseEngineEvent): Promise<void> {
    // Placeholder: events will be routed through the subscriber once wired
  },
}

let counter = 0
function generateId(): string {
  counter += 1
  return `ex-${Date.now()}-${counter}`
}

export function createExerciseEngineBridge(): ExerciseEngine {
  const exerciseRepo = new DexieExerciseRepository()
  const attemptRepo = new DexieExerciseAttemptRepository()
  const blueprintRepo = new InMemoryExerciseBlueprintRepository()

  const deps: ExerciseEngineDependencies = {
    exerciseRepository: exerciseRepo,
    attemptRepository: attemptRepo,
    blueprintRepository: blueprintRepo,
    generator: stubGenerator,
    eventPublisher: stubEventPublisher,
    generateId,
    getCurrentTime: () => new Date().toISOString(),
  }

  exerciseEngineInstance = new ExerciseEngine(deps)
  return exerciseEngineInstance
}

export function getExerciseEngine(): ExerciseEngine | null {
  return exerciseEngineInstance
}
