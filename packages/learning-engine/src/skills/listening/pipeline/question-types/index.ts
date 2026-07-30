// ═══════════════════════════════════════════════════════════════════════
// Question Types — Public API
// ═══════════════════════════════════════════════════════════════════════

export type { QuestionTypeStrategy, QuestionTypeBuildInput, QuestionTypeBuildOutput } from './question-type'
export { formCompletionGenerator } from './form-completion-generator'
export { noteCompletionGenerator } from './note-completion-generator'
export { tableCompletionGenerator } from './table-completion-generator'
export { summaryCompletionGenerator } from './summary-completion-generator'
export { sentenceCompletionGenerator } from './sentence-completion-generator'
export { multipleChoiceGenerator } from './multiple-choice-generator'
export { matchingGenerator } from './matching-generator'

import type { QuestionTypeStrategy } from './question-type'
import { formCompletionGenerator } from './form-completion-generator'
import { noteCompletionGenerator } from './note-completion-generator'
import { tableCompletionGenerator } from './table-completion-generator'
import { summaryCompletionGenerator } from './summary-completion-generator'
import { sentenceCompletionGenerator } from './sentence-completion-generator'
import { multipleChoiceGenerator } from './multiple-choice-generator'
import { matchingGenerator } from './matching-generator'

export const ALL_QUESTION_TYPES: QuestionTypeStrategy[] = [
  formCompletionGenerator,
  noteCompletionGenerator,
  tableCompletionGenerator,
  summaryCompletionGenerator,
  sentenceCompletionGenerator,
  multipleChoiceGenerator,
  matchingGenerator,
]

/** Pick an appropriate question type for the given part */
export function pickQuestionType(part: string): QuestionTypeStrategy {
  const candidates = ALL_QUESTION_TYPES.filter(g => g.supportsPart(part))
  if (candidates.length === 0) return noteCompletionGenerator
  return candidates[Math.floor(Math.random() * candidates.length)]
}
