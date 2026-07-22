import type { OfficialIeltsBand } from '../../../domain/value-objects'
import type { CefrLevel } from './common'

export interface ExerciseDifficultyProfile {
  targetBand?: OfficialIeltsBand
  cefrLevel?: CefrLevel

  linguisticComplexity: number
  lexicalComplexity: number
  grammaticalComplexity: number

  inferenceDepth: number
  distractorStrength: number
  informationDensity: number
  paraphraseDistance: number

  responseComplexity: number
  timePressure: number
}

export interface QuestionDifficultyProfile {
  difficulty: number
  discrimination?: number
  guessing?: number
}

export function createDefaultDifficultyProfile(): ExerciseDifficultyProfile {
  return {
    linguisticComplexity: 0.5,
    lexicalComplexity: 0.5,
    grammaticalComplexity: 0.5,
    inferenceDepth: 0.5,
    distractorStrength: 0.5,
    informationDensity: 0.5,
    paraphraseDistance: 0.5,
    responseComplexity: 0.5,
    timePressure: 0.5,
  }
}

export function validateDifficultyProfile(profile: ExerciseDifficultyProfile): boolean {
  const fields: (keyof ExerciseDifficultyProfile)[] = [
    'linguisticComplexity',
    'lexicalComplexity',
    'grammaticalComplexity',
    'inferenceDepth',
    'distractorStrength',
    'informationDensity',
    'paraphraseDistance',
    'responseComplexity',
    'timePressure',
  ]

  for (const field of fields) {
    const value = profile[field]
    if (typeof value !== 'number' || value < 0 || value > 1) {
      return false
    }
  }

  return true
}
