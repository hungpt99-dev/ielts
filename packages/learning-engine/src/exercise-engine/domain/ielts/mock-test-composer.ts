import type { IeltsTestVariant } from './ielts-types'

export interface MockTestConfig {
  module: 'reading' | 'listening' | 'writing' | 'speaking'
  variant: IeltsTestVariant
  totalQuestions: number
  passages?: number
  parts?: number
  tasks?: number
  durationSeconds: number
  mode: 'full-reading-mock'
}

export const IELTS_MOCK_TEST_CONFIGS: Record<string, MockTestConfig> = {
  'reading-academic': {
    module: 'reading', variant: 'academic', totalQuestions: 40, passages: 3, durationSeconds: 3600, mode: 'full-reading-mock',
  },
  'reading-general': {
    module: 'reading', variant: 'general-training', totalQuestions: 40, passages: 3, durationSeconds: 3600, mode: 'full-reading-mock',
  },
  'listening': {
    module: 'listening', variant: 'academic', totalQuestions: 40, parts: 4, durationSeconds: 2400, mode: 'full-reading-mock',
  },
  'writing-academic': {
    module: 'writing', variant: 'academic', tasks: 2, totalQuestions: 2, durationSeconds: 3600, mode: 'full-reading-mock',
  },
  'writing-general': {
    module: 'writing', variant: 'general-training', tasks: 2, totalQuestions: 2, durationSeconds: 3600, mode: 'full-reading-mock',
  },
  'speaking': {
    module: 'speaking', variant: 'academic', parts: 3, totalQuestions: 3, durationSeconds: 840, mode: 'full-reading-mock',
  },
}

export interface ReadingPassageAllocation {
  passageIndex: number
  totalQuestions: number
  recommendedWordCount: number
  recommendedTopics: string[]
}

export function allocateReadingQuestions(
  totalQuestions: number,
  passageCount: number,
  variant: IeltsTestVariant,
): ReadingPassageAllocation[] {
  const allocations: ReadingPassageAllocation[] = []
  const baseAllocation = Math.floor(totalQuestions / passageCount)
  let remainder = totalQuestions - baseAllocation * passageCount

  const academicTopics = [
    ['science', 'technology', 'environment', 'health'],
    ['history', 'culture', 'society', 'education'],
    ['economics', 'psychology', 'linguistics', 'philosophy'],
  ]
  const generalTopics = [
    ['everyday-life', 'travel', 'work', 'accommodation'],
    ['public-information', 'services', 'health-safety', 'community'],
    ['general-interest', 'technology', 'environment', 'culture'],
  ]

  for (let i = 0; i < passageCount; i++) {
    allocations.push({
      passageIndex: i,
      totalQuestions: baseAllocation + (remainder > 0 ? 1 : 0),
      recommendedWordCount: variant === 'academic' ? (700 + i * 150) : (400 + i * 200),
      recommendedTopics: variant === 'academic' ? (academicTopics[i] || academicTopics[2]) : (generalTopics[i] || generalTopics[2]),
    })
    if (remainder > 0) remainder--
  }

  return allocations
}

export interface ListeningPartAllocation {
  partNumber: number
  questions: number
  partType: 'social-conversation' | 'social-monologue' | 'educational-conversation' | 'academic-monologue'
  estimatedMinutes: number
}

export function allocateListeningParts(): ListeningPartAllocation[] {
  return [
    { partNumber: 1, questions: 10, partType: 'social-conversation', estimatedMinutes: 6 },
    { partNumber: 2, questions: 10, partType: 'social-monologue', estimatedMinutes: 6 },
    { partNumber: 3, questions: 10, partType: 'educational-conversation', estimatedMinutes: 7 },
    { partNumber: 4, questions: 10, partType: 'academic-monologue', estimatedMinutes: 7 },
  ]
}

export const MOCK_TEST_DISCLAIMER = 'IELTS-style mock practice. Not an official IELTS test. Band estimates are approximate.'
