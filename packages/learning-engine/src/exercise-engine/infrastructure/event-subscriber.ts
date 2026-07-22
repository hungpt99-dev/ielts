import type { ExerciseEngineEvent } from '../domain/events/exercise-events'

export function createExerciseEventSubscriber() {
  return {
    async handleEvent(event: ExerciseEngineEvent): Promise<void> {
      switch (event.type) {
        case 'exercise_completed': {
          console.log(
            '[ExerciseEventSubscriber] exercise_completed — placeholder for:',
            'mistake recording, progress update, roadmap update, vocabulary update',
            { exerciseId: event.exerciseId, attemptId: event.attemptId },
          )
          break
        }
        default:
          break
      }
    },
  }
}

export type ExerciseEventSubscriber = ReturnType<typeof createExerciseEventSubscriber>
