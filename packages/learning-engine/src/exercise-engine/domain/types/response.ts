export interface ChoiceResponse {
  type: 'choice'
  selectedIndex: number
}

export interface MultiChoiceResponse {
  type: 'multi_choice'
  selectedIndices: number[]
}

export interface TextResponse {
  type: 'text'
  value: string
}

export interface MatchingResponse {
  type: 'matching'
  matches: Record<string, string>
}

export interface OrderingResponse {
  type: 'ordering'
  order: string[]
}

export interface WritingResponse {
  type: 'writing'
  content: string
  wordCount: number
}

export interface SpeakingResponse {
  type: 'speaking'
  transcript?: string
  audioUrl?: string
  durationSeconds: number
}

export interface ClassificationResponse {
  type: 'classification'
  classifications: Record<string, string>
}

export interface MapResponse {
  type: 'map'
  positions: Record<string, { x: number; y: number }>
}

export type LearnerResponse =
  | ChoiceResponse
  | MultiChoiceResponse
  | TextResponse
  | MatchingResponse
  | OrderingResponse
  | WritingResponse
  | SpeakingResponse
  | ClassificationResponse
  | MapResponse

export interface AnswerNormalizationPolicy {
  lowercase: boolean
  trimWhitespace: boolean
  normalizePunctuation: boolean
  acceptPluralForms: boolean
  acceptBritishAmericanVariants: boolean
}

export function createDefaultNormalizationPolicy(): AnswerNormalizationPolicy {
  return {
    lowercase: true,
    trimWhitespace: true,
    normalizePunctuation: false,
    acceptPluralForms: false,
    acceptBritishAmericanVariants: false,
  }
}

export function normalizeAnswer(
  answer: string,
  policy: AnswerNormalizationPolicy
): string {
  let normalized = answer

  if (policy.trimWhitespace) {
    normalized = normalized.trim().replace(/\s+/g, ' ')
  }

  if (policy.lowercase) {
    normalized = normalized.toLowerCase()
  }

  if (policy.normalizePunctuation) {
    normalized = normalized.replace(/[.,!?;:]/g, '')
  }

  return normalized
}
