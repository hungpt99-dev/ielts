import type { IeltsTestVariant } from './ielts-types'

export interface VariantRules {
  variant: IeltsTestVariant
  passageStyle: string
  questionStyle: string
  contentDomains: string[]
  difficultyRange: { min: number; max: number }
  readingPassageTypes: string[]
  writingTask1Types: string[]
  academicVocabularyWeight: number
}

export const ACADEMIC_RULES: VariantRules = {
  variant: 'academic',
  passageStyle: 'authentic academic texts from journals, books, magazines (non-specialist audience)',
  questionStyle: 'academic-focus',
  contentDomains: ['science', 'technology', 'arts', 'social-sciences', 'humanities', 'environment', 'health', 'education'],
  difficultyRange: { min: 4.0, max: 9.0 },
  readingPassageTypes: ['descriptive', 'narrative', 'discursive', 'argumentative'],
  writingTask1Types: ['line-graph', 'bar-chart', 'pie-chart', 'table', 'mixed-charts', 'process', 'map'],
  academicVocabularyWeight: 0.7,
}

export const GENERAL_TRAINING_RULES: VariantRules = {
  variant: 'general-training',
  passageStyle: 'everyday texts: notices, advertisements, workplace documents, general-interest articles',
  questionStyle: 'practical-focus',
  contentDomains: ['everyday-life', 'work', 'public-information', 'services', 'community', 'travel', 'general-interest'],
  difficultyRange: { min: 3.0, max: 9.0 },
  readingPassageTypes: ['social-survival', 'workplace-survival', 'general-reading'],
  writingTask1Types: ['formal-letter', 'semi-formal-letter', 'informal-letter'],
  academicVocabularyWeight: 0.3,
}

export function getVariantRules(variant: IeltsTestVariant): VariantRules {
  return variant === 'academic' ? ACADEMIC_RULES : GENERAL_TRAINING_RULES
}

export function isAcademicVariant(variant: IeltsTestVariant): boolean {
  return variant === 'academic'
}
