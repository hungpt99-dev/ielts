import type { Exercise } from '../domain/types'
import { countAllQuestions } from '../domain/utils/count-questions'

export interface TimingEstimate {
  officialDurationSeconds?: number
  estimatedDurationSeconds: number
  perItemSeconds?: number
  breakdown?: TimingBreakdown[]
}

export interface TimingBreakdown {
  label: string
  seconds: number
}

export function calculateTiming(exercise: Exercise): TimingEstimate {
  switch (exercise.family) {
    case 'objective_questions':
    case 'completion_questions':
    case 'matching_questions':
    case 'classification_questions':
      return calculateObjectiveTiming(exercise)
    case 'writing_task':
      return calculateWritingTiming(exercise)
    case 'speaking_session':
      return calculateSpeakingTiming(exercise)
    case 'interactive_listening':
      return calculateListeningTiming(exercise)
    case 'vocabulary_activity':
      return calculateVocabularyTiming(exercise)
    case 'grammar_activity':
      return calculateGrammarTiming(exercise)
    case 'content_comprehension':
      return calculateContentTiming(exercise)
    case 'review_activity':
      return calculateReviewTiming(exercise)
    case 'ordering_questions':
      return calculateObjectiveTiming(exercise)
    default:
      return { estimatedDurationSeconds: exercise.estimatedDurationSeconds }
  }
}

function calculateObjectiveTiming(exercise: Exercise): TimingEstimate {
  const questionCount = countAllQuestions(exercise)
  const SECONDS_PER_QUESTION = 75

  if (exercise.mode === 'full_test') {
    return {
      officialDurationSeconds: exercise.estimatedDurationSeconds,
      estimatedDurationSeconds: exercise.estimatedDurationSeconds,
    }
  }

  return {
    estimatedDurationSeconds: questionCount * SECONDS_PER_QUESTION,
    perItemSeconds: SECONDS_PER_QUESTION,
  }
}

function calculateListeningTiming(exercise: Exercise): TimingEstimate {
  if (exercise.module !== 'listening') {
    return { estimatedDurationSeconds: exercise.estimatedDurationSeconds }
  }

  const totalAudioSeconds = exercise.audioSegments.reduce((sum, seg) => sum + seg.durationSeconds, 0)
  const INSTRUCTION_SECONDS = 30
  const REVIEW_SECONDS = exercise.mode === 'full_test' ? 600 : 120

  const breakdown: TimingBreakdown[] = [
    { label: 'Audio playback', seconds: totalAudioSeconds },
    { label: 'Instructions', seconds: exercise.parts.length * INSTRUCTION_SECONDS },
    { label: 'Answer review', seconds: REVIEW_SECONDS },
  ]

  const total = breakdown.reduce((sum, b) => sum + b.seconds, 0)

  return {
    officialDurationSeconds: exercise.mode === 'full_test' ? 1800 : undefined,
    estimatedDurationSeconds: total,
    breakdown,
  }
}

function calculateWritingTiming(exercise: Exercise): TimingEstimate {
  if (exercise.module !== 'writing') {
    return { estimatedDurationSeconds: exercise.estimatedDurationSeconds }
  }

  const breakdown: TimingBreakdown[] = exercise.tasks.map(task => ({
    label: `Task ${task.taskNumber}`,
    seconds: task.recommendedMinutes * 60,
  }))

  const total = breakdown.reduce((sum, b) => sum + b.seconds, 0)

  return {
    officialDurationSeconds: exercise.mode === 'full_test' ? 3600 : undefined,
    estimatedDurationSeconds: total,
    breakdown,
  }
}

function calculateSpeakingTiming(exercise: Exercise): TimingEstimate {
  if (exercise.module !== 'speaking') {
    return { estimatedDurationSeconds: exercise.estimatedDurationSeconds }
  }

  const breakdown: TimingBreakdown[] = exercise.parts.map(part => ({
    label: `Part ${part.partNumber}`,
    seconds: part.preparationSeconds + part.responseSeconds,
  }))

  const total = breakdown.reduce((sum, b) => sum + b.seconds, 0)

  return {
    officialDurationSeconds: exercise.mode === 'full_test' ? 840 : undefined,
    estimatedDurationSeconds: total,
    breakdown,
  }
}

function calculateVocabularyTiming(exercise: Exercise): TimingEstimate {
  if (exercise.module !== 'vocabulary') {
    return { estimatedDurationSeconds: exercise.estimatedDurationSeconds }
  }

  const SECONDS_PER_TERM = 30
  const termCount = exercise.terms.length

  return {
    estimatedDurationSeconds: termCount * SECONDS_PER_TERM,
    perItemSeconds: SECONDS_PER_TERM,
  }
}

function calculateGrammarTiming(exercise: Exercise): TimingEstimate {
  if (exercise.module !== 'grammar') {
    return { estimatedDurationSeconds: exercise.estimatedDurationSeconds }
  }

  const SECONDS_PER_ITEM = 45
  const itemCount = exercise.items.length

  return {
    estimatedDurationSeconds: itemCount * SECONDS_PER_ITEM,
    perItemSeconds: SECONDS_PER_ITEM,
  }
}

function calculateContentTiming(exercise: Exercise): TimingEstimate {
  return { estimatedDurationSeconds: exercise.estimatedDurationSeconds }
}

function calculateReviewTiming(exercise: Exercise): TimingEstimate {
  return { estimatedDurationSeconds: exercise.estimatedDurationSeconds }
}
