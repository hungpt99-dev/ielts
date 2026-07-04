import type { TaskEntry } from '../models'
import type { Exercise } from '@ielts/exercises'
import { generateExercise } from '../services/ExerciseGenerator'
import type { UserData } from '../services/ExerciseGenerator'
import { loadAppSettings } from '../services/storage/SettingsStorage'

export interface TaskCompletionResult {
  exercise: Exercise | null
  error: string | null
}

function buildUserData(): UserData {
  const settings = loadAppSettings()
  return {
    weakSkills: settings.weakSkills,
    currentBand: settings.currentBand,
    targetBand: settings.targetBand,
  }
}

export async function handleTaskCompletion(
  task: TaskEntry,
): Promise<TaskCompletionResult> {
  try {
    const userData = buildUserData()
    const exercise = await generateExercise(task, userData)
    console.log(
      `[TaskCompletion] Generated ${exercise.skill} exercise for task "${task.title}"`,
    )
    return { exercise, error: null }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error generating exercise'
    console.error(
      `[TaskCompletion] Failed to generate exercise for task "${task.title}":`,
      message,
    )
    return { exercise: null, error: message }
  }
}
